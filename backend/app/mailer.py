"""
mailer.py — Email sending module for LoanXAI.
Uses Gmail SMTP with App Password.
Handles: Welcome, Forgot Password, OTP 2FA, Plan Upgrade confirmations.
"""
import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

logger = logging.getLogger(__name__)

SMTP_HOST      = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT      = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER      = os.environ.get("SMTP_USER", "loanxai.support@gmail.com")
SMTP_PASS      = os.environ.get("SMTP_PASS", "")
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "LoanXAI")
APP_URL        = os.environ.get("APP_URL", "http://localhost:5173")

SMTP_ENABLED = bool(SMTP_PASS)

# ── Brand colours ─────────────────────────────────────────────────────────────
PRIMARY   = "#1a56e8"
DARK      = "#050d2e"
SUCCESS   = "#10b981"
WARNING   = "#f59e0b"
DANGER    = "#ef4444"
BG_LIGHT  = "#f8faff"

# ── Base HTML wrapper ─────────────────────────────────────────────────────────
def _base(title: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width"/>
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:{BG_LIGHT};font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:{BG_LIGHT};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(26,86,232,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,{PRIMARY},{DARK});padding:32px 40px;text-align:center;">
          <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
            Loan<span style="color:#93c5fd;">XAI</span>
          </div>
          <div style="font-size:12px;color:#93c5fd;margin-top:4px;letter-spacing:2px;text-transform:uppercase;">
            Explainable Loan Default Prediction
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px 40px 32px;">{body_html}</td></tr>

        <!-- Footer -->
        <tr><td style="background:{BG_LIGHT};padding:24px 40px;text-align:center;
                       border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            © {datetime.now().year} LoanXAI. This is an automated email — please do not reply.<br/>
            <a href="{APP_URL}" style="color:{PRIMARY};text-decoration:none;">Visit LoanXAI</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


# ── Send helper ───────────────────────────────────────────────────────────────
def _send(to_email: str, subject: str, html: str) -> bool:
    if not SMTP_ENABLED:
        logger.warning(f"[Mailer] SMTP_PASS not set — skipping email to {to_email}: {subject}")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
        msg["To"]      = to_email
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
            s.ehlo(); s.starttls(); s.ehlo()
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(SMTP_USER, to_email, msg.as_string())
        logger.info(f"[Mailer] ✓ Sent '{subject}' to {to_email}")
        return True
    except Exception as e:
        logger.error(f"[Mailer] ✗ Failed to send to {to_email}: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# EMAIL TEMPLATES
# ─────────────────────────────────────────────────────────────────────────────

def send_welcome(to_email: str, full_name: str, username: str) -> bool:
    """Welcome email sent immediately after successful registration."""
    body = f"""
    <h2 style="margin:0 0 8px;font-size:22px;color:{DARK};font-weight:800;">
      Welcome to LoanXAI, {full_name}! 🎉
    </h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Your account has been created successfully. You're now part of a smarter way
      to assess loan default risk using AI and SHAP explainability.
    </p>

    <table width="100%" style="background:{BG_LIGHT};border-radius:12px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:13px;color:#64748b;margin-bottom:12px;text-transform:uppercase;
                    letter-spacing:1px;font-weight:600;">Your Account Details</div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <span style="color:#94a3b8;width:80px;font-size:14px;">Username</span>
          <strong style="color:{DARK};font-size:14px;">{username}</strong>
        </div>
        <div style="display:flex;gap:8px;">
          <span style="color:#94a3b8;width:80px;font-size:14px;">Email</span>
          <strong style="color:{DARK};font-size:14px;">{to_email}</strong>
        </div>
      </td></tr>
    </table>

    <div style="margin-bottom:28px;">
      <div style="font-size:13px;color:#64748b;margin-bottom:14px;text-transform:uppercase;
                  letter-spacing:1px;font-weight:600;">What you can do on Free Plan</div>
      {"".join(f'<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:20px;height:20px;background:{SUCCESS}20;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;color:{SUCCESS};flex-shrink:0;">✓</div><span style="color:#475569;font-size:14px;">{f}</span></div>' for f in ["5 predictions / month","Basic prediction history","SHAP explanation for every prediction","Secure bank-grade authentication"])}
    </div>

    <a href="{APP_URL}/predict"
       style="display:inline-block;background:linear-gradient(135deg,{PRIMARY},{DARK});
              color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:99px;
              font-weight:700;font-size:15px;">
      Start Your First Prediction →
    </a>

    <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;">
      Want more predictions? <a href="{APP_URL}/pricing" style="color:{PRIMARY};">View upgrade plans</a>
    </p>
    """
    return _send(to_email, "Welcome to LoanXAI — Your AI Loan Risk Platform 🎉", _base("Welcome to LoanXAI", body))


def send_otp(to_email: str, full_name: str, otp: str, purpose: str = "login") -> bool:
    """OTP email for 2FA login or sensitive actions."""
    purpose_text = {
        "login": "verify your identity",
        "2fa":   "complete two-factor authentication",
        "action": "confirm a sensitive action",
    }.get(purpose, "verify your identity")

    expiry_min = 10

    body = f"""
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:64px;font-weight:900;letter-spacing:16px;
                  color:{PRIMARY};background:{BG_LIGHT};display:inline-block;
                  padding:24px 40px;border-radius:16px;border:2px dashed {PRIMARY}40;">
        {otp}
      </div>
    </div>

    <h2 style="margin:0 0 8px;font-size:20px;color:{DARK};font-weight:800;text-align:center;">
      Your One-Time Password
    </h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;text-align:center;">
      Hi <strong>{full_name}</strong>, use the code above to {purpose_text}.<br/>
      This OTP is valid for <strong>{expiry_min} minutes</strong>.
    </p>

    <table width="100%" style="background:#fef3c7;border:1px solid #f59e0b40;
                                border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">⚠️</span>
        <span style="color:#92400e;font-size:13px;">
          Never share this OTP with anyone, including LoanXAI staff.
          We will never ask for your OTP.
        </span>
      </td></tr>
    </table>

    <p style="color:#94a3b8;font-size:13px;text-align:center;">
      If you didn't request this, your account may be at risk.
      <a href="{APP_URL}/login" style="color:{DANGER};">Secure your account →</a>
    </p>
    """
    return _send(to_email, f"LoanXAI — Your OTP: {otp} (expires in {expiry_min} minutes)",
                 _base("LoanXAI OTP Verification", body))


def send_forgot_password(to_email: str, full_name: str, reset_token: str) -> bool:
    """Password reset link email."""
    reset_url  = f"{APP_URL}/reset-password?token={reset_token}"
    expiry_min = 30

    body = f"""
    <h2 style="margin:0 0 8px;font-size:22px;color:{DARK};font-weight:800;">
      Reset Your Password 🔐
    </h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 28px;">
      Hi <strong>{full_name}</strong>, we received a request to reset the password for your
      LoanXAI account (<strong>{to_email}</strong>).
      Click the button below to create a new password.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="{reset_url}"
         style="display:inline-block;background:linear-gradient(135deg,{PRIMARY},{DARK});
                color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:99px;
                font-weight:700;font-size:15px;">
        Reset My Password →
      </a>
    </div>

    <table width="100%" style="background:{BG_LIGHT};border-radius:10px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <div style="font-size:12px;color:#94a3b8;word-break:break-all;">
          Or paste this link: <a href="{reset_url}" style="color:{PRIMARY};">{reset_url}</a>
        </div>
      </td></tr>
    </table>

    <table width="100%" style="background:#fee2e2;border:1px solid #ef444440;
                                border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <span style="font-size:18px;">🔒</span>
        <span style="color:#991b1b;font-size:13px;">
          This link expires in <strong>{expiry_min} minutes</strong>.
          If you didn't request a password reset, you can safely ignore this email.
        </span>
      </td></tr>
    </table>
    """
    return _send(to_email, "LoanXAI — Reset Your Password", _base("Password Reset", body))


def send_plan_upgrade(to_email: str, full_name: str, plan_name: str,
                      plan_display: str, price: str) -> bool:
    """Sent when a user successfully upgrades their plan."""
    plan_colors = {
        "starter":      PRIMARY,
        "professional": "#7c3aed",
        "enterprise":   "#d97706",
    }
    color = plan_colors.get(plan_name, PRIMARY)

    plan_features = {
        "starter":      ["200 predictions/month", "PDF reports", "Prediction notes", "Full history"],
        "professional": ["2,000 predictions/month", "PDF + branded reports", "CSV export", "Admin dashboard"],
        "enterprise":   ["Unlimited predictions", "White-label PDF", "CSV + audit exports", "Dedicated support + SLA"],
    }
    features = plan_features.get(plan_name, [])

    body = f"""
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;">🎊</div>
      <h2 style="margin:8px 0;font-size:22px;color:{DARK};font-weight:800;">
        You're on {plan_display}!
      </h2>
      <p style="color:#475569;margin:0;">Hi {full_name}, your plan upgrade is confirmed.</p>
    </div>

    <table width="100%" style="background:linear-gradient(135deg,{color}15,{color}05);
                                border:2px solid {color}40;border-radius:16px;margin-bottom:28px;">
      <tr><td style="padding:28px;">
        <div style="font-size:13px;color:{color};font-weight:700;text-transform:uppercase;
                    letter-spacing:1px;margin-bottom:12px;">{plan_display} Plan</div>
        <div style="font-size:28px;font-weight:900;color:{DARK};margin-bottom:20px;">{price}</div>
        {"".join(f'<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="color:{color};font-weight:700;font-size:16px;">✓</div><span style="color:#475569;font-size:14px;">{f}</span></div>' for f in features)}
      </td></tr>
    </table>

    <div style="text-align:center;">
      <a href="{APP_URL}/predict"
         style="display:inline-block;background:linear-gradient(135deg,{color},{color}cc);
                color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:99px;
                font-weight:700;font-size:15px;">
        Start Predicting Now →
      </a>
    </div>
    """
    return _send(to_email, f"LoanXAI — You're on the {plan_display} Plan! 🎊",
                 _base(f"{plan_display} Plan Activated", body))
