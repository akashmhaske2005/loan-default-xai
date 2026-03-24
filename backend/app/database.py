"""
database.py — Dual-mode database layer (SQLite dev / PostgreSQL production).

  SQLite (default): no setup needed, file at backend/data/loanxai.db
  PostgreSQL:       set DATABASE_URL=postgresql://user:password@host:5432/loanxai

Tables: users, sessions, predictions, subscription_plans, user_subscriptions
"""
import os
import pathlib

# ── Load .env early — runs before DATABASE_URL is read ───────────────────────
_env_path = pathlib.Path(__file__).parent.parent / ".env"
if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ[_k.strip()] = _v.strip()  # always overwrite stale OS vars

import secrets
import json
import hashlib
import base64
from datetime import datetime, timedelta, timezone

DATABASE_URL = (os.environ.get("DATABASE_URL") or "").strip()

# ── Detect backend ────────────────────────────────────────────────────────────
# Only use Postgres if DATABASE_URL is a real postgres:// URL (not blank)
_pg_url = DATABASE_URL if (
    DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")
) else ""

_USE_POSTGRES = False
if _pg_url:
    try:
        import psycopg2
        import psycopg2.extras
        _pg_dsn = _pg_url
        _USE_POSTGRES = True
        print(f"[DB] Using PostgreSQL: {_pg_dsn.split('@')[-1]}")
    except ImportError:
        print("[DB] WARNING: psycopg2 not installed — falling back to SQLite.")
        print("[DB]   To use PostgreSQL: pip install psycopg2-binary")

if not _USE_POSTGRES:
    import sqlite3
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR  = os.path.join(BASE_DIR, "..", "data")
    DB_PATH   = os.path.join(DATA_DIR, "loanxai.db")
    os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
    print(f"[DB] Using SQLite: {os.path.abspath(DB_PATH)}")


# ── Connection factory ────────────────────────────────────────────────────────

def get_db():
    if _USE_POSTGRES:
        conn = psycopg2.connect(_pg_dsn, cursor_factory=psycopg2.extras.RealDictCursor)
        conn.autocommit = False
        return conn
    else:
        os.makedirs(DATA_DIR, exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn


# ── SQL helpers ───────────────────────────────────────────────────────────────

def _ph(n=1):
    p = "%s" if _USE_POSTGRES else "?"
    return ", ".join([p] * n)


def _exec(conn, sql, params=()):
    if _USE_POSTGRES:
        sql = sql.replace("?", "%s")
    cur = conn.cursor()
    cur.execute(sql, params)
    return cur


def _fetchall(conn, sql, params=()):
    cur = _exec(conn, sql, params)
    rows = cur.fetchall()
    return [dict(r) for r in rows]


def _fetchone(conn, sql, params=()):
    cur = _exec(conn, sql, params)
    row = cur.fetchone()
    return dict(row) if row else None


# ── Schema init ───────────────────────────────────────────────────────────────

def _serial():
    return "SERIAL" if _USE_POSTGRES else "INTEGER"

def _ts():
    return "TIMESTAMPTZ" if _USE_POSTGRES else "DATETIME"

def _ts_default():
    """Timestamp default — SQLite only allows CURRENT_TIMESTAMP, not datetime('now') in defaults."""
    return "DEFAULT NOW()" if _USE_POSTGRES else "DEFAULT CURRENT_TIMESTAMP"

def _bool_default_false():
    return "DEFAULT FALSE" if _USE_POSTGRES else "DEFAULT 0"

def _bool_default_true():
    return "DEFAULT TRUE" if _USE_POSTGRES else "DEFAULT 1"


def init_db():
    conn = get_db()
    try:
        if _USE_POSTGRES:
            conn.autocommit = True

        def exe(sql):
            if _USE_POSTGRES:
                conn.cursor().execute(sql)
            else:
                conn.execute(sql)

        BDF = _bool_default_false()
        BDT = _bool_default_true()
        BOOL = "BOOLEAN" if _USE_POSTGRES else "INTEGER"
        S  = _serial()
        TS = _ts()

        # ── users ─────────────────────────────────────────────────────
        exe(f"""CREATE TABLE IF NOT EXISTS users (
            id            {S} PRIMARY KEY,
            username      TEXT UNIQUE NOT NULL,
            full_name     TEXT NOT NULL,
            email         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role          TEXT NOT NULL DEFAULT 'banker',
            is_verified   {BOOL} {BDF},
            created_at    {TS} {_ts_default()}
        )""")

        # ── sessions ─────────────────────────────────────────────────
        exe(f"""CREATE TABLE IF NOT EXISTS sessions (
            id         {S} PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token      TEXT UNIQUE NOT NULL,
            expires_at {TS},
            created_at {TS} {_ts_default()}
        )""")

        # ── subscription_plans ───────────────────────────────────────
        exe(f"""CREATE TABLE IF NOT EXISTS subscription_plans (
            id                 {S} PRIMARY KEY,
            name               TEXT UNIQUE NOT NULL,
            display_name       TEXT NOT NULL,
            price_monthly      INTEGER NOT NULL DEFAULT 0,
            max_users          INTEGER NOT NULL DEFAULT 1,
            max_predictions    INTEGER NOT NULL DEFAULT 5,
            features           TEXT NOT NULL DEFAULT '{{}}',
            is_active          {BOOL} {BDT}
        )""")

        # ── user_subscriptions ────────────────────────────────────────
        exe(f"""CREATE TABLE IF NOT EXISTS user_subscriptions (
            id             {S} PRIMARY KEY,
            user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plan_name      TEXT NOT NULL DEFAULT 'free',
            status         TEXT NOT NULL DEFAULT 'active',
            started_at     {TS} {_ts_default()},
            expires_at     {TS},
            razorpay_order TEXT,
            razorpay_payment TEXT
        )""")

        # ── predictions ───────────────────────────────────────────────
        exe(f"""CREATE TABLE IF NOT EXISTS predictions (
            id             {S} PRIMARY KEY,
            user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            applicant_name TEXT NOT NULL DEFAULT 'Unknown',
            applicant_id   TEXT,
            bank_branch    TEXT,
            prediction     TEXT NOT NULL,
            probability    REAL NOT NULL,
            risk_level     TEXT NOT NULL,
            shap_pairs     TEXT,
            form_data      TEXT,
            recommendation TEXT,
            notes          TEXT,
            model_version  TEXT DEFAULT '1.0',
            created_at     {TS} {_ts_default()}
        )""")

        # ── login_attempts (rate limiting) ────────────────────────────
        exe(f"""CREATE TABLE IF NOT EXISTS login_attempts (
            id         {S} PRIMARY KEY,
            ip_address TEXT NOT NULL,
            email      TEXT,
            attempted_at {TS} {_ts_default()},
            success    {BOOL} {BDF}
        )""")

        # ── otp_codes (email OTP for 2FA and verification) ────────────
        exe(f"""CREATE TABLE IF NOT EXISTS otp_codes (
            id         {S} PRIMARY KEY,
            email      TEXT NOT NULL,
            otp_hash   TEXT NOT NULL,
            purpose    TEXT NOT NULL DEFAULT '2fa',
            expires_at {TS} NOT NULL,
            used       {BOOL} {BDF},
            created_at {TS} {_ts_default()}
        )""")

        # ── password_resets ────────────────────────────────────────────
        exe(f"""CREATE TABLE IF NOT EXISTS password_resets (
            id         {S} PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token      TEXT UNIQUE NOT NULL,
            expires_at {TS} NOT NULL,
            used       {BOOL} {BDF},
            created_at {TS} {_ts_default()}
        )""")

        # ── audit_log ──────────────────────────────────────────────────
        exe(f"""CREATE TABLE IF NOT EXISTS audit_log (
            id         {S} PRIMARY KEY,
            user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
            action     TEXT NOT NULL,
            entity     TEXT,
            entity_id  TEXT,
            details    TEXT,
            ip_address TEXT,
            created_at {TS} {_ts_default()}
        )""")

        # ── api_keys ───────────────────────────────────────────────────
        exe(f"""CREATE TABLE IF NOT EXISTS api_keys (
            id         {S} PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            key_hash   TEXT UNIQUE NOT NULL,
            key_prefix TEXT NOT NULL,
            name       TEXT NOT NULL DEFAULT 'My API Key',
            is_active  {BOOL} {BDT},
            last_used  {TS},
            created_at {TS} {_ts_default()}
        )""")

        # ── applicant_profiles ─────────────────────────────────────────
        exe(f"""CREATE TABLE IF NOT EXISTS applicant_profiles (
            id             {S} PRIMARY KEY,
            user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            applicant_name TEXT NOT NULL,
            applicant_id   TEXT,
            bank_branch    TEXT,
            profile_data   TEXT,
            created_at     {TS} {_ts_default()}
        )""")

        # ── risk_thresholds ────────────────────────────────────────────
        exe(f"""CREATE TABLE IF NOT EXISTS risk_thresholds (
            id           {S} PRIMARY KEY,
            user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            high_risk    REAL NOT NULL DEFAULT 0.7,
            medium_risk  REAL NOT NULL DEFAULT 0.4,
            updated_at   {TS} {_ts_default()}
        )""")

        # Migrate existing tables: add missing columns gracefully (BEFORE indexes)
        _migrate_columns(conn)

        # ── Indexes ───────────────────────────────────────────────────
        for idx_sql in [
            "CREATE INDEX IF NOT EXISTS idx_sessions_token       ON sessions(token)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_expires     ON sessions(expires_at)",
            "CREATE INDEX IF NOT EXISTS idx_predictions_user     ON predictions(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_predictions_name     ON predictions(applicant_name)",
            "CREATE INDEX IF NOT EXISTS idx_usub_user            ON user_subscriptions(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_attempts_ip          ON login_attempts(ip_address, attempted_at)",
        ]:
            try:
                exe(idx_sql)
            except Exception:
                if _USE_POSTGRES:
                    conn.rollback()

        if not _USE_POSTGRES:
            conn.commit()

        # Seed subscription plans
        _seed_plans(conn)

        # Create special enterprise accounts
        _seed_special_accounts(conn)

    finally:
        conn.close()


def _migrate_columns(conn):
    """Safely add new columns to existing tables (won't fail if column exists)."""
    new_cols = [
        ("sessions",            "expires_at",        "TIMESTAMPTZ" if _USE_POSTGRES else "DATETIME"),
        ("users",               "is_verified",       "BOOLEAN DEFAULT FALSE" if _USE_POSTGRES else "INTEGER DEFAULT 0"),
        ("predictions",         "applicant_id",      "TEXT"),
        ("predictions",         "bank_branch",       "TEXT"),
        ("predictions",         "notes",             "TEXT"),
        ("predictions",         "model_version",     "TEXT DEFAULT '1.0'"),
        ("predictions",         "is_deleted",        "INTEGER DEFAULT 0"),
        ("user_subscriptions",  "extra_predictions", "INTEGER DEFAULT 0"),
        # 2FA: require OTP on login
        ("users",               "two_fa_enabled",    "BOOLEAN DEFAULT FALSE" if _USE_POSTGRES else "INTEGER DEFAULT 0"),
        # Branch field on predictions
        ("predictions",         "branch_code",       "TEXT"),
    ]
    for table, col, type_ in new_cols:
        try:
            _exec(conn, f"ALTER TABLE {table} ADD COLUMN {col} {type_}")
            if _USE_POSTGRES:
                conn.commit()
            else:
                conn.commit()
        except Exception:
            if _USE_POSTGRES:
                conn.rollback()


SUBSCRIPTION_PLANS = [
    {
        "name": "free",
        "display_name": "Free",
        "price_monthly": 0,
        "max_users": 1,
        "max_predictions": 5,
        "features": json.dumps({
            "predictions_per_month": 5,
            "history": True,
            "pdf_report": False,
            "csv_export": False,
            "admin_dashboard": False,
            "api_access": False,
            "notes": False,
            "priority_support": False,
            "multi_branch": False,
            "white_label": False,
            "audit_logs": False,
        }),
    },
    {
        "name": "starter",
        "display_name": "Starter",
        "price_monthly": 2999,
        "max_users": 2,
        "max_predictions": 200,
        "features": json.dumps({
            "predictions_per_month": 200,
            "history": True,
            "pdf_report": True,
            "csv_export": False,
            "admin_dashboard": False,
            "api_access": False,
            "notes": True,
            "priority_support": False,
            "multi_branch": False,
            "white_label": False,
            "audit_logs": False,
        }),
    },
    {
        "name": "professional",
        "display_name": "Professional",
        "price_monthly": 7999,
        "max_users": 10,
        "max_predictions": 2000,
        "features": json.dumps({
            "predictions_per_month": 2000,
            "history": True,
            "pdf_report": True,
            "csv_export": True,
            "admin_dashboard": True,
            "api_access": True,
            "notes": True,
            "priority_support": True,
            "multi_branch": False,
            "white_label": False,
            "audit_logs": False,
        }),
    },
    {
        "name": "enterprise",
        "display_name": "Enterprise",
        "price_monthly": 24999,
        "max_users": -1,  # unlimited
        "max_predictions": -1,  # unlimited
        "features": json.dumps({
            "predictions_per_month": -1,
            "history": True,
            "pdf_report": True,
            "csv_export": True,
            "admin_dashboard": True,
            "api_access": True,
            "notes": True,
            "priority_support": True,
            "multi_branch": True,
            "white_label": True,
            "audit_logs": True,
        }),
    },
]


def _seed_plans(conn):
    """Insert subscription plans if they don't exist."""
    for plan in SUBSCRIPTION_PLANS:
        existing = _fetchone(conn, "SELECT id FROM subscription_plans WHERE name = ?", (plan["name"],))
        if not existing:
            _exec(conn, """
                INSERT INTO subscription_plans
                    (name, display_name, price_monthly, max_users, max_predictions, features)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (plan["name"], plan["display_name"], plan["price_monthly"],
                  plan["max_users"], plan["max_predictions"], plan["features"]))
            if not _USE_POSTGRES:
                conn.commit()
            elif _USE_POSTGRES:
                conn.commit()


def _hash_pw(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 310000)
    return salt + ":" + base64.b64encode(h).decode()


SPECIAL_ACCOUNTS = [
    {
        "username": "akash_loanxai",
        "full_name": "Akash LoanXAI",
        "email": "akash.loanxai@gmail.com",
        "role": "admin",
        "plan": "enterprise",
    },
    {
        "username": "shashikant_loanxai",
        "full_name": "Shashikant LoanXAI",
        "email": "shashikant.loanxai@gmail.com",
        "role": "admin",
        "plan": "enterprise",
    },
]
SPECIAL_PASSWORD = "shashi1234@"


def _seed_special_accounts(conn):
    """Create the two special enterprise admin accounts if they don't exist."""
    pw_hash = _hash_pw(SPECIAL_PASSWORD)
    for acc in SPECIAL_ACCOUNTS:
        existing = _fetchone(conn, "SELECT id FROM users WHERE email = ?", (acc["email"],))
        if not existing:
            _exec(conn, """
                INSERT INTO users (username, full_name, email, password_hash, role)
                VALUES (?, ?, ?, ?, ?)
            """, (acc["username"], acc["full_name"], acc["email"], pw_hash, acc["role"]))
            # Set is_verified to TRUE/1 separately (safe across both DBs)
            if _USE_POSTGRES:
                row = _fetchone(conn, "SELECT id FROM users WHERE email = %s", (acc["email"],))
                if row:
                    conn.cursor().execute("UPDATE users SET is_verified=TRUE WHERE id=%s", (row["id"],))
            else:
                conn.commit()
                row = _fetchone(conn, "SELECT id FROM users WHERE email = ?", (acc["email"],))
                if row:
                    conn.execute("UPDATE users SET is_verified=1 WHERE id=?", (row["id"],))
            if row:
                uid = row["id"]
                # Check if subscription exists
                sub_exists = _fetchone(conn, "SELECT id FROM user_subscriptions WHERE user_id = ?", (uid,))
                if not sub_exists:
                    _exec(conn, """
                        INSERT INTO user_subscriptions (user_id, plan_name, status)
                        VALUES (?, ?, 'active')
                    """, (uid, acc["plan"]))
                    if not _USE_POSTGRES:
                        conn.commit()
            if _USE_POSTGRES:
                conn.commit()
            print(f"  [DB] Created special account: {acc['username']}")
        else:
            # Ensure subscription is enterprise
            uid = existing["id"]
            sub = _fetchone(conn, "SELECT id, plan_name FROM user_subscriptions WHERE user_id = ?", (uid,))
            if not sub:
                _exec(conn, """
                    INSERT INTO user_subscriptions (user_id, plan_name, status)
                    VALUES (?, 'enterprise', 'active')
                """, (uid,))
                if not _USE_POSTGRES:
                    conn.commit()
                elif _USE_POSTGRES:
                    conn.commit()


# ── Session helpers ───────────────────────────────────────────────────────────

SESSION_TTL_HOURS = 8


def create_session(user_id):
    token = secrets.token_hex(32)
    if _USE_POSTGRES:
        expires = f"NOW() + INTERVAL '{SESSION_TTL_HOURS} hours'"
        expires_sql = f"NOW() + INTERVAL '{SESSION_TTL_HOURS} hours'"
    else:
        expires_sql = f"datetime('now', '+{SESSION_TTL_HOURS} hours')"

    conn = get_db()
    try:
        if _USE_POSTGRES:
            conn.cursor().execute(
                f"INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, {expires_sql})",
                (user_id, token)
            )
        else:
            conn.execute(
                f"INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, {expires_sql})",
                (user_id, token)
            )
        conn.commit()
    finally:
        conn.close()
    return token


def get_user_by_token(token):
    if not token:
        return None
    conn = get_db()
    try:
        if _USE_POSTGRES:
            row = _fetchone(conn, """
                SELECT u.* FROM users u
                JOIN sessions s ON s.user_id = u.id
                WHERE s.token = ? AND (s.expires_at IS NULL OR s.expires_at > NOW())
            """, (token,))
        else:
            row = _fetchone(conn, """
                SELECT u.* FROM users u
                JOIN sessions s ON s.user_id = u.id
                WHERE s.token = ?
                  AND (s.expires_at IS NULL OR s.expires_at > datetime('now'))
            """, (token,))
    finally:
        conn.close()
    return row


def delete_session(token):
    conn = get_db()
    try:
        _exec(conn, "DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
    finally:
        conn.close()


# ── User helpers ──────────────────────────────────────────────────────────────

def create_user(username, full_name, email, password_hash, role):
    conn = get_db()
    try:
        if _USE_POSTGRES:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO users (username, full_name, email, password_hash, role) "
                "VALUES (%s,%s,%s,%s,%s) RETURNING id",
                (username, full_name, email, password_hash, role)
            )
            row = cur.fetchone()
            user_id = row["id"] if isinstance(row, dict) else row[0]
            conn.commit()
        else:
            cur = conn.execute(
                "INSERT INTO users (username, full_name, email, password_hash, role) "
                "VALUES (?, ?, ?, ?, ?)",
                (username, full_name, email, password_hash, role)
            )
            user_id = cur.lastrowid
            conn.commit()
        # Auto-assign free plan
        _assign_free_plan(conn, user_id)
        if _USE_POSTGRES:
            conn.commit()
        else:
            conn.commit()
    finally:
        conn.close()
    return user_id


def _assign_free_plan(conn, user_id):
    existing = _fetchone(conn, "SELECT id FROM user_subscriptions WHERE user_id = ?", (user_id,))
    if not existing:
        _exec(conn, """
            INSERT INTO user_subscriptions (user_id, plan_name, status)
            VALUES (?, 'free', 'active')
        """, (user_id,))


def get_user_by_email(email):
    conn = get_db()
    try:
        row = _fetchone(conn, "SELECT * FROM users WHERE email = ?", (email,))
    finally:
        conn.close()
    return row


def get_user_by_username(username):
    conn = get_db()
    try:
        row = _fetchone(conn, "SELECT * FROM users WHERE username = ?", (username,))
    finally:
        conn.close()
    return row


# ── Subscription helpers ──────────────────────────────────────────────────────

def get_user_subscription(user_id):
    """Returns the user's current active subscription with plan details.
    extra_predictions (from add-on purchases) is added to max_predictions."""
    conn = get_db()
    try:
        sub = _fetchone(conn, """
            SELECT us.plan_name, us.extra_predictions,
                   sp.display_name, sp.price_monthly,
                   sp.max_users, sp.max_predictions, sp.features
            FROM user_subscriptions us
            JOIN subscription_plans sp ON sp.name = us.plan_name
            WHERE us.user_id = ? AND us.status = 'active'
            ORDER BY us.id DESC
            LIMIT 1
        """, (user_id,))
        if sub:
            sub = dict(sub)
            if sub.get("features"):
                try:
                    sub["features"] = json.loads(sub["features"])
                except Exception:
                    pass
            # Add purchased extra quota to base plan limit
            extra = sub.pop("extra_predictions", 0) or 0
            if sub.get("max_predictions") != -1:
                sub["max_predictions"] = (sub.get("max_predictions") or 5) + extra
        if not sub:
            # Default free plan if somehow missing
            sub = {
                "plan_name": "free",
                "display_name": "Free",
                "max_predictions": 5,
                "features": {"predictions_per_month": 5, "pdf_report": False},
            }
    finally:
        conn.close()
    return sub


def get_predictions_this_month(user_id):
    """Count ALL predictions made by user this month — including soft-deleted ones.
    This prevents quota bypass by deleting predictions."""
    conn = get_db()
    try:
        if _USE_POSTGRES:
            row = _fetchone(conn, """
                SELECT COUNT(*) AS n FROM predictions
                WHERE user_id = ?
                  AND created_at >= date_trunc('month', NOW())
            """, (user_id,))
        else:
            row = _fetchone(conn, """
                SELECT COUNT(*) AS n FROM predictions
                WHERE user_id = ?
                  AND created_at >= datetime('now','start of month')
            """, (user_id,))
        return (row or {}).get("n", 0)
    finally:
        conn.close()


def get_all_plans():
    conn = get_db()
    try:
        rows = _fetchall(conn, "SELECT * FROM subscription_plans WHERE is_active=1 ORDER BY price_monthly")
    finally:
        conn.close()
    for r in rows:
        if r.get("features"):
            try:
                r["features"] = json.loads(r["features"])
            except Exception:
                pass
    return rows


def upgrade_subscription(user_id, plan_name, razorpay_order=None, razorpay_payment=None):
    conn = get_db()
    try:
        # Deactivate existing
        _exec(conn, "UPDATE user_subscriptions SET status='cancelled' WHERE user_id=? AND status='active'", (user_id,))
        # Insert new
        _exec(conn, """
            INSERT INTO user_subscriptions (user_id, plan_name, status, razorpay_order, razorpay_payment)
            VALUES (?, ?, 'active', ?, ?)
        """, (user_id, plan_name, razorpay_order, razorpay_payment))
        conn.commit()
    finally:
        conn.close()


# ── Prediction helpers ────────────────────────────────────────────────────────

def save_prediction(user_id, applicant_name, prediction, probability,
                    risk_level, shap_pairs, form_data, recommendation,
                    applicant_id=None, bank_branch=None, model_version="1.0"):
    conn = get_db()
    try:
        sp = json.dumps(shap_pairs)
        fd = json.dumps(form_data)
        if _USE_POSTGRES:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO predictions (user_id, applicant_name, applicant_id, bank_branch, "
                "prediction, probability, risk_level, shap_pairs, form_data, recommendation, model_version) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (user_id, applicant_name, applicant_id, bank_branch, prediction, probability,
                 risk_level, sp, fd, recommendation, model_version)
            )
            row = cur.fetchone()
            pred_id = row["id"] if isinstance(row, dict) else row[0]
            conn.commit()
        else:
            cur = conn.execute(
                "INSERT INTO predictions (user_id,applicant_name,applicant_id,bank_branch,"
                "prediction,probability,risk_level,shap_pairs,form_data,recommendation,model_version) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (user_id, applicant_name, applicant_id, bank_branch, prediction, probability,
                 risk_level, sp, fd, recommendation, model_version)
            )
            pred_id = cur.lastrowid
            conn.commit()
    finally:
        conn.close()
    return pred_id


def get_predictions_for_user(user_id, search_name=None, page=1, limit=20):
    """Get visible (non-deleted) predictions for user."""
    conn = get_db()
    offset = (page - 1) * limit
    try:
        if search_name:
            rows = _fetchall(conn,
                "SELECT * FROM predictions WHERE user_id=? AND (is_deleted IS NULL OR is_deleted=0) AND applicant_name LIKE ? "
                "ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (user_id, f"%{search_name}%", limit, offset))
            total_row = _fetchone(conn,
                "SELECT COUNT(*) AS n FROM predictions WHERE user_id=? AND (is_deleted IS NULL OR is_deleted=0) AND applicant_name LIKE ?",
                (user_id, f"%{search_name}%"))
        else:
            rows = _fetchall(conn,
                "SELECT * FROM predictions WHERE user_id=? AND (is_deleted IS NULL OR is_deleted=0) ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (user_id, limit, offset))
            total_row = _fetchone(conn,
                "SELECT COUNT(*) AS n FROM predictions WHERE user_id=? AND (is_deleted IS NULL OR is_deleted=0)", (user_id,))
    finally:
        conn.close()
    total = (total_row or {}).get("n", 0)
    for r in rows:
        for key in ("shap_pairs", "form_data"):
            try: r[key] = json.loads(r[key]) if r.get(key) else ([] if key == "shap_pairs" else {})
            except: r[key] = [] if key == "shap_pairs" else {}
        if hasattr(r.get("created_at"), "isoformat"):
            r["created_at"] = r["created_at"].isoformat()
    return rows, total


def update_prediction_note(pred_id, user_id, note):
    conn = get_db()
    try:
        _exec(conn, "UPDATE predictions SET notes=? WHERE id=? AND user_id=? AND (is_deleted IS NULL OR is_deleted=0)", (note, pred_id, user_id))
        conn.commit()
    finally:
        conn.close()


def delete_prediction(pred_id, user_id):
    """Soft-delete: mark is_deleted=1 so it's hidden from history
    but STILL COUNTED toward monthly quota to prevent bypass attacks."""
    conn = get_db()
    try:
        _exec(conn, "UPDATE predictions SET is_deleted=1 WHERE id=? AND user_id=?", (pred_id, user_id))
        conn.commit()
    finally:
        conn.close()
