"""
seed_supabase.py
================
Seeds all demo + admin accounts into Supabase (or any DATABASE_URL).

HOW TO USE:
1. Get your Supabase connection string from:
   Supabase Dashboard → Project → Settings → Database → Connection String (URI)
   Example: postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres

2. Run:
   set DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres
   python seed_supabase.py

   OR add it to your .env temporarily and run:
   python seed_supabase.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

# Optionally load .env
from pathlib import Path
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    for line in env_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())

from database import init_db, get_db, _exec, _fetchone, _hash_pw, upgrade_subscription

print(f"\n[DB] Connecting to: {'PostgreSQL' if os.environ.get('DATABASE_URL','').startswith('postgresql') else 'SQLite (set DATABASE_URL!)'}")
print("=" * 60)

# Initialize schema
init_db()

conn = get_db()

# ─── All accounts to create ──────────────────────────────────────
ACCOUNTS = [
    # (full_name, username, email, password, role, plan)
    # Admin accounts
    ("Akash Mhaske",       "akash_loanxai",      "akash.loanxai@gmail.com",         "shashi1234@", "admin",        "enterprise"),
    ("Shashikant Lanke",   "shashikant_loanxai", "shashikant.loanxai@gmail.com",    "shashi1234@", "admin",        "enterprise"),
    # Demo tier accounts
    ("Rajesh Kumar",       "rajesh_free",         "rajesh.free@loanxai.demo",        "Demo@1234",   "banker",       "free"),
    ("Priya Sharma",       "priya_starter",       "priya.starter@loanxai.demo",      "Demo@1234",   "banker",       "starter"),
    ("Anand Mehta",        "anand_pro",           "anand.pro@loanxai.demo",          "Demo@1234",   "loan_officer", "professional"),
    ("Sunita Patel",       "sunita_ent",          "sunita.ent@loanxai.demo",         "Demo@1234",   "admin",        "enterprise"),
]

print(f"\n{'Action':<10} {'Username':<22} {'Plan':<14} {'Email'}")
print("-" * 75)

for full_name, username, email, password, role, plan in ACCOUNTS:
    pw_hash = _hash_pw(password)

    # Try both SQLite (?) and PostgreSQL (%s) placeholders
    USE_PG = os.environ.get('DATABASE_URL', '').startswith('postgresql')
    ph = '%s' if USE_PG else '?'

    existing = _fetchone(conn, f"SELECT id FROM users WHERE email = {ph}", (email,))

    if existing:
        uid = existing['id']
        # Update password hash + role in case they differ
        if USE_PG:
            cur = conn.cursor()
            cur.execute("UPDATE users SET password_hash=%s, role=%s, is_verified=TRUE WHERE id=%s",
                        (pw_hash, role, uid))
        else:
            conn.execute("UPDATE users SET password_hash=?, role=?, is_verified=1 WHERE id=?",
                         (pw_hash, role, uid))
        conn.commit()
        action = "UPDATED"
    else:
        if USE_PG:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO users (username, full_name, email, password_hash, role, is_verified)
                VALUES (%s,%s,%s,%s,%s,TRUE)
            """, (username, full_name, email, pw_hash, role))
            conn.commit()
            uid = _fetchone(conn, "SELECT id FROM users WHERE email=%s", (email,))['id']
        else:
            conn.execute("""
                INSERT INTO users (username, full_name, email, password_hash, role, is_verified)
                VALUES (?,?,?,?,?,1)
            """, (username, full_name, email, pw_hash, role))
            conn.commit()
            uid = _fetchone(conn, "SELECT id FROM users WHERE email=?", (email,))['id']
        action = "CREATED"

    # Ensure subscription
    sub = _fetchone(conn, f"SELECT id, plan_name FROM user_subscriptions WHERE user_id={ph}", (uid,))
    if not sub:
        if USE_PG:
            cur = conn.cursor()
            cur.execute("INSERT INTO user_subscriptions (user_id, plan_name, status) VALUES (%s,%s,'active')",
                        (uid, plan))
        else:
            conn.execute("INSERT INTO user_subscriptions (user_id, plan_name, status) VALUES (?,?,'active')",
                         (uid, plan))
        conn.commit()
    elif sub['plan_name'] != plan:
        if USE_PG:
            cur = conn.cursor()
            cur.execute("UPDATE user_subscriptions SET plan_name=%s, status='active' WHERE user_id=%s",
                        (plan, uid))
        else:
            conn.execute("UPDATE user_subscriptions SET plan_name=?, status='active' WHERE user_id=?",
                         (plan, uid))
        conn.commit()

    print(f"{action:<10} {username:<22} {plan:<14} {email}")

conn.close()

print("\n" + "=" * 60)
print("✅ All accounts seeded successfully!")
print("\nLogin credentials:")
print("  Admin accounts:  shashi1234@")
print("  Demo accounts:   Demo@1234")
