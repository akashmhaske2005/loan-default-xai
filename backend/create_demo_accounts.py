"""
create_demo_accounts.py
Creates demo accounts for all subscription tiers using the correct password hash.
Run: python create_demo_accounts.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

# Import the module — this loads .env and connects to the right DB
from database import (
    init_db, get_db, _exec, _fetchone, _fetchall,
    upgrade_subscription, get_user_subscription, _hash_pw
)

init_db()
conn = get_db()

ACCOUNTS = [
    # (full_name, username, email, password, role, plan)
    ("Rajesh Kumar",  "rajesh_free",   "rajesh.free@loanxai.demo",   "Demo@1234", "banker",       "free"),
    ("Priya Sharma",  "priya_starter", "priya.starter@loanxai.demo", "Demo@1234", "banker",       "starter"),
    ("Anand Mehta",   "anand_pro",     "anand.pro@loanxai.demo",     "Demo@1234", "loan_officer", "professional"),
    ("Sunita Patel",  "sunita_ent",    "sunita.ent@loanxai.demo",    "Demo@1234", "admin",        "enterprise"),
]

print("\n=== Creating / Fixing Demo Accounts ===\n")
for full_name, username, email, password, role, plan in ACCOUNTS:
    pw_hash = _hash_pw(password)   # Use the SAME hash as app.py uses

    existing = _fetchone(conn, "SELECT id, username FROM users WHERE email = ?", (email,))
    if existing:
        uid = existing["id"]
        # Update password to match correct hash format
        _exec(conn, "UPDATE users SET password_hash = ?, role = ? WHERE id = ?",
              (pw_hash, role, uid))
        conn.commit()
        print(f"  [UPDATED] {username} ({email}) — password reset, plan={plan}")
    else:
        _exec(conn, """
            INSERT INTO users (username, full_name, email, password_hash, role, is_verified)
            VALUES (?, ?, ?, ?, ?, 1)
        """, (username, full_name, email, pw_hash, role))
        conn.commit()
        row = _fetchone(conn, "SELECT id FROM users WHERE email = ?", (email,))
        uid = row["id"]
        print(f"  [CREATED] {username} ({email}), id={uid}")

    # Ensure correct plan
    sub = _fetchone(conn, "SELECT id, plan_name FROM user_subscriptions WHERE user_id = ?", (uid,))
    if not sub:
        _exec(conn, "INSERT INTO user_subscriptions (user_id, plan_name, status) VALUES (?, ?, 'active')",
              (uid, plan))
        conn.commit()
        print(f"            -> Subscription set to: {plan}")
    elif sub["plan_name"] != plan:
        _exec(conn, "UPDATE user_subscriptions SET plan_name = ?, status = 'active' WHERE user_id = ?",
              (plan, uid))
        conn.commit()
        print(f"            -> Subscription updated to: {plan}")
    else:
        print(f"            -> Plan already: {plan}")

conn.close()

print("\n=== Login Credentials ===")
print("-" * 72)
print(f"{'Username':<18} {'Email':<36} {'Password':<12} {'Plan'}")
print("-" * 72)
for full_name, username, email, password, role, plan in ACCOUNTS:
    print(f"{username:<18} {email:<36} {password:<12} {plan}")
print("-" * 72)
print("\nSpecial Admin Accounts (seeded automatically at startup):")
print("  akash_loanxai       | akash.loanxai@gmail.com        | shashi1234@  | enterprise")
print("  shashikant_loanxai  | shashikant.loanxai@gmail.com   | shashi1234@  | enterprise")
