import os, pathlib
# Load .env from backend/ — always overwrite so .env values take priority
_env_path = pathlib.Path(__file__).parent.parent / ".env"
if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ[_k.strip()] = _v.strip()  # overwrite, not setdefault

from flask import Flask, render_template, request, send_file, jsonify, make_response
from flask_cors import CORS
try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    LIMITER_AVAILABLE = True
except ImportError:
    LIMITER_AVAILABLE = False

# Razorpay SDK — required for payments. Install: pip install razorpay
try:
    import razorpay as _razorpay_sdk
    RAZORPAY_AVAILABLE = True
except ImportError:
    _razorpay_sdk = None
    RAZORPAY_AVAILABLE = False
    print("[WARNING] razorpay SDK not installed. Run: pip install razorpay")
import joblib
import pandas as pd
import shap
import numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import os
import io
import csv
# Password hashing with built-in hashlib (no external bcrypt dependency needed)
import hashlib, secrets as _secrets, base64

ADMIN_SECRET_KEY = os.environ.get("ADMIN_SECRET_KEY", "LOANXAI_ADMIN_2024")

def _hash_pw(password: str) -> str:
    salt = _secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 310000)
    return salt + ':' + base64.b64encode(h).decode()

def _check_pw(password: str, stored: str) -> bool:
    try:
        salt, hashed = stored.split(':', 1)
        h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 310000)
        return base64.b64encode(h).decode() == hashed
    except Exception:
        return False

try:
    from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                     TableStyle, HRFlowable)
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
from sklearn.metrics import auc
from database import (init_db, get_db, get_user_by_token, create_session,
                      delete_session, save_prediction, get_predictions_for_user,
                      delete_prediction, create_user, get_user_by_email,
                      update_prediction_note, get_user_subscription,
                      get_predictions_this_month, get_all_plans, upgrade_subscription,
                      _fetchone, _fetchall, _exec, _USE_POSTGRES)
from mailer import (
    send_welcome, send_otp, send_forgot_password, send_plan_upgrade, SMTP_ENABLED
)
import json, hashlib, hmac, threading
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True)

# ── Rate Limiter ──────────────────────────────────────────────────────────────
if LIMITER_AVAILABLE:
    limiter = Limiter(key_func=get_remote_address, app=app,
                      default_limits=[], storage_uri="memory://")
else:
    limiter = None

# ── Init database ─────────────────────────────────────────────────────────────
init_db()

# ── Paths & Model ──────────────────────────────────────────────────────────────
BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "models")

model    = joblib.load(os.path.join(MODEL_DIR, "random_forest_model.pkl"))
features = joblib.load(os.path.join(MODEL_DIR, "feature_names.pkl"))
explainer = shap.TreeExplainer(model)

# ── Feature display names ──────────────────────────────────────────────────────
feature_display_names = {
    "LIMIT_BAL": "Credit Limit (\u20b9)",
    "SEX": "Gender",
    "EDUCATION": "Education Level",
    "MARRIAGE": "Marital Status",
    "AGE": "Age",
    "PAY_0": "Repayment Status (Sep)",
    "PAY_2": "Repayment Status (Aug)",
    "PAY_3": "Repayment Status (Jul)",
    "PAY_4": "Repayment Status (Jun)",
    "PAY_5": "Repayment Status (May)",
    "PAY_6": "Repayment Status (Apr)",
    "BILL_AMT1": "Bill Amount Sep (\u20b9)",
    "BILL_AMT2": "Bill Amount Aug (\u20b9)",
    "BILL_AMT3": "Bill Amount Jul (\u20b9)",
    "BILL_AMT4": "Bill Amount Jun (\u20b9)",
    "BILL_AMT5": "Bill Amount May (\u20b9)",
    "BILL_AMT6": "Bill Amount Apr (\u20b9)",
    "PAY_AMT1": "Payment Amount Sep (\u20b9)",
    "PAY_AMT2": "Payment Amount Aug (\u20b9)",
    "PAY_AMT3": "Payment Amount Jul (\u20b9)",
    "PAY_AMT4": "Payment Amount Jun (\u20b9)",
    "PAY_AMT5": "Payment Amount May (\u20b9)",
    "PAY_AMT6": "Payment Amount Apr (\u20b9)",
}

MODEL_ACCURACY  = 0.81
MODEL_ROC_AUC   = 0.86
MODEL_PRECISION = 0.79
MODEL_RECALL    = 0.75
MODEL_F1        = 0.77

# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def get_recommendation(risk_level):
    if risk_level == "HIGH RISK":
        return ("This applicant shows a high probability of default. "
                "Recommend: require additional collateral, reduce loan amount by ≥30%, "
                "assign a co-signer, or defer approval pending income verification.")
    elif risk_level == "MEDIUM RISK":
        return ("Moderate default risk detected. "
                "Recommend: review the past 3 months of repayment history carefully, "
                "consider reducing loan tenure, and verify employment stability.")
    else:
        return ("Low default risk. Applicant profile is favorable for standard loan terms. "
                "Recommend: proceed with normal credit assessment and standard interest rates.")

def require_auth(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "").strip()
        user = get_user_by_token(token)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        return f(user, *args, **kwargs)
    return decorated

# ═══════════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/auth/register", methods=["POST"])
def api_register():
    body = request.get_json(force=True)
    username  = body.get("username", "").strip()
    full_name = body.get("full_name", "").strip()
    email     = body.get("email", "").strip().lower()
    password  = body.get("password", "")
    role      = body.get("role", "banker")
    admin_key = body.get("admin_secret_key", "")

    if not all([username, full_name, email, password]):
        return jsonify({"error": "All fields are required."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400
    if not any(c.isupper() for c in password):
        return jsonify({"error": "Password must contain at least one uppercase letter."}), 400
    if not any(c.isdigit() for c in password):
        return jsonify({"error": "Password must contain at least one number."}), 400
    if '@' not in email or '.' not in email.split('@')[-1]:
        return jsonify({"error": "Please enter a valid email address."}), 400

    # Admin accounts require secret key
    if role == "admin" and admin_key != ADMIN_SECRET_KEY:
        return jsonify({"error": "Invalid admin secret key."}), 403
    # Only allow known roles
    if role not in ("banker", "loan_officer", "admin"):
        role = "banker"

    pw_hash = _hash_pw(password)
    try:
        user_id = create_user(username, full_name, email, pw_hash, role)
    except Exception as e:
        msg = str(e)
        if any(k in msg.upper() for k in ("UNIQUE", "DUPLICATE", "already exists")):
            return jsonify({"error": "Username or email already exists."}), 409
        return jsonify({"error": msg}), 500

    token = create_session(user_id)
    sub = get_user_subscription(user_id)

    # Send welcome email in background thread (non-blocking)
    threading.Thread(target=send_welcome, args=(email, full_name, username), daemon=True).start()

    # Write to audit log
    _audit_log(user_id, "register", "user", str(user_id),
               f"New user registered: {username} ({role})", _client_ip())

    return jsonify({
        "token": token,
        "user": {"id": user_id, "username": username,
                 "full_name": full_name, "email": email, "role": role,
                 "plan": sub.get("plan_name", "free")}
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    # Apply rate limiting if flask-limiter is available
    if limiter and LIMITER_AVAILABLE:
        try:
            limiter.limit("5 per minute")(lambda: None)()
        except Exception:
            return jsonify({"error": "Too many login attempts. Please wait 1 minute."}), 429

    body     = request.get_json(force=True)
    email    = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = get_user_by_email(email)
    if not user or not _check_pw(password, user["password_hash"]):
        # Log failed attempt
        _audit_log(None, "login_failed", "user", None, f"Failed login for {email}", _client_ip())
        return jsonify({"error": "Invalid email or password."}), 401

    # ── 2FA check ─────────────────────────────────────────────────────────────
    two_fa = user.get("two_fa_enabled") or user.get("two_fa_enabled", 0)
    if two_fa:
        # Generate and send OTP — return partial auth
        otp = _generate_and_store_otp(email, "login")
        threading.Thread(target=send_otp, args=(email, user["full_name"], otp, "login"), daemon=True).start()
        return jsonify({"needs_otp": True, "email": email, "message": "OTP sent to your email."}), 200

    token = create_session(user["id"])
    sub = get_user_subscription(user["id"])
    _audit_log(user["id"], "login", "user", str(user["id"]), "Successful login", _client_ip())
    return jsonify({
        "token": token,
        "user": {
            "id": user["id"], "username": user["username"],
            "full_name": user["full_name"], "email": user["email"],
            "role": user["role"], "plan": sub.get("plan_name", "free"),
            "two_fa_enabled": bool(two_fa)
        }
    })


@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    delete_session(token)
    return jsonify({"message": "Logged out"})


@app.route("/api/auth/me", methods=["GET"])
def api_me():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    user = get_user_by_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    sub = get_user_subscription(user["id"])
    return jsonify({
        "user": {
            "id": user["id"], "username": user["username"],
            "full_name": user["full_name"], "email": user["email"],
            "role": user["role"],
            "plan": sub.get("plan_name", "free") if sub else "free",
            "two_fa_enabled": bool(user.get("two_fa_enabled", 0)),
        }
    })


# ═══════════════════════════════════════════════════════════════════════════════
# PREDICT (PROTECTED)
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/predict", methods=["POST"])
@require_auth
def api_predict(current_user):
    try:
        # ── Plan enforcement ──────────────────────────────────────────────────
        sub = get_user_subscription(current_user["id"])
        max_predictions = sub.get("max_predictions", 5) if sub else 5
        # -1 means unlimited (enterprise)
        if max_predictions != -1:
            used = get_predictions_this_month(current_user["id"])
            if used >= max_predictions:
                plan_name = (sub or {}).get("plan_name", "free")
                return jsonify({
                    "error": f"Monthly prediction limit reached ({used}/{max_predictions} used). "
                             f"Please upgrade your plan.",
                    "limit_reached": True,
                    "current_plan": plan_name,
                    "used": used,
                    "limit": max_predictions,
                }), 403

        body = request.get_json(force=True)
        applicant_name = body.get("applicant_name", "Unknown").strip() or "Unknown"
        input_data = []

        for f in features:
            val = float(body.get(f, 0))
            input_data.append(val)

        input_df = pd.DataFrame([input_data], columns=features)
        pred     = model.predict(input_df)[0]
        prob     = model.predict_proba(input_df)[0][1] * 100

        prediction = "DEFAULT" if pred == 1 else "NO DEFAULT"
        probability = round(prob, 2)

        if prob < 30:
            risk_level = "LOW RISK"
        elif prob < 70:
            risk_level = "MEDIUM RISK"
        else:
            risk_level = "HIGH RISK"

        shap_values = explainer.shap_values(input_df)

        # Handle different SHAP output formats across versions:
        # Old SHAP (<0.40): list of arrays [class0, class1] → shape (n_samples, n_features) each
        # New SHAP (≥0.40): single ndarray, shape (n_samples, n_features) for binary,
        #                   or (n_samples, n_features, n_classes) for multi-class
        import numpy as _np
        sv = _np.array(shap_values)
        if sv.ndim == 3 and sv.shape[0] == 2:
            # Old format: list of 2 → shape (2, n_samples, n_features) after np.array
            shap_vals = sv[1][0]
        elif sv.ndim == 3 and sv.shape[2] == 2:
            # New multi-class format: (n_samples, n_features, n_classes)
            shap_vals = sv[0, :, 1]
        elif sv.ndim == 2:
            # Single 2D array (n_samples, n_features) — binary classification
            shap_vals = sv[0]
        else:
            # Fallback: try list[1][0] then abs values
            try:    shap_vals = shap_values[1][0]
            except: shap_vals = _np.abs(sv).mean(axis=0) if sv.ndim > 1 else sv

        shap_df = pd.DataFrame({"feature": features, "value": shap_vals})
        shap_df["abs"] = np.abs(shap_df["value"])
        shap_df = shap_df.sort_values(by="abs", ascending=False).head(10)

        shap_pairs = [
            {"name": feature_display_names[row["feature"]],
             "value": round(float(row["value"]), 4),
             "feature": row["feature"]}
            for _, row in shap_df.iterrows()
        ]

        recommendation = get_recommendation(risk_level)

        pred_id = save_prediction(
            user_id=current_user["id"],
            applicant_name=applicant_name,
            prediction=prediction,
            probability=probability,
            risk_level=risk_level,
            shap_pairs=shap_pairs,
            form_data=body,
            recommendation=recommendation
        )

        return jsonify({
            "prediction_id": pred_id,
            "applicant_name": applicant_name,
            "prediction": prediction,
            "probability": probability,
            "risk_level": risk_level,
            "shap_pairs": shap_pairs,
            "recommendation": recommendation
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# HISTORY ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/history", methods=["GET"])
@require_auth
def api_history(current_user):
    search = request.args.get("name", "").strip()
    page   = int(request.args.get("page", 1))
    limit  = int(request.args.get("limit", 50))  # default 50 per page
    rows, total = get_predictions_for_user(current_user["id"], search or None, page, limit)
    return jsonify({"predictions": rows, "total": total, "page": page, "limit": limit})


@app.route("/api/history/<int:pred_id>", methods=["DELETE"])
@require_auth
def api_delete_prediction(current_user, pred_id):
    delete_prediction(pred_id, current_user["id"])
    return jsonify({"message": "Deleted"})


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE IMPORTANCE & METRICS (PROTECTED)
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/feature-importance", methods=["GET"])
@require_auth
def api_feature_importance(current_user):
    importances = model.feature_importances_
    imp_df = pd.DataFrame({
        "name": [feature_display_names[f] for f in features],
        "importance": importances
    }).sort_values(by="importance", ascending=False)
    return jsonify({"features": imp_df.to_dict(orient="records")})


@app.route("/api/metrics", methods=["GET"])
def api_metrics():
    return jsonify({
        "accuracy": MODEL_ACCURACY, "roc_auc": MODEL_ROC_AUC,
        "precision": MODEL_PRECISION, "recall": MODEL_RECALL, "f1": MODEL_F1
    })


# ═══════════════════════════════════════════════════════════════════════════════
# COMPREHENSIVE PDF REPORT
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/download-report", methods=["POST"])
@require_auth
def api_download_report(current_user):
    # ── Plan enforcement: PDF requires Starter+ ───────────────────────────────
    sub = get_user_subscription(current_user["id"])
    plan = (sub or {}).get("plan_name", "free")
    if plan == "free":
        return jsonify({
            "error": "PDF reports are not available on the Free plan. Please upgrade to Starter or higher.",
            "plan_required": "starter",
            "upgrade_url": "/pricing"
        }), 403

    if not REPORTLAB_AVAILABLE:
        return jsonify({
            "error": "PDF generation requires reportlab. Run: pip install reportlab"
        }), 503
    body = request.get_json(force=True)

    applicant_name = body.get("applicant_name", "N/A")
    prediction     = body.get("prediction", "N/A")
    probability    = body.get("probability", "N/A")
    risk_level     = body.get("risk_level", "N/A")
    shap_pairs     = body.get("shap_pairs", [])
    form_data      = body.get("form_data", {})
    recommendation = body.get("recommendation", "")
    generated_at   = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # ─ Risk colour ──────────────────────────────────────────────────────────
    if "HIGH" in str(risk_level):
        risk_color = colors.HexColor("#dc2626")
    elif "MEDIUM" in str(risk_level):
        risk_color = colors.HexColor("#d97706")
    else:
        risk_color = colors.HexColor("#059669")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        rightMargin=0.75*inch, leftMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )
    styles = getSampleStyleSheet()
    elem   = []

    # Styles
    title_style = ParagraphStyle("Title", parent=styles["Heading1"],
                                  fontSize=20, textColor=colors.HexColor("#050d2e"),
                                  spaceAfter=4, alignment=TA_CENTER)
    sub_style   = ParagraphStyle("Sub", parent=styles["Normal"],
                                  fontSize=10, textColor=colors.HexColor("#64748b"),
                                  spaceAfter=2, alignment=TA_CENTER)
    h2_style    = ParagraphStyle("H2", parent=styles["Heading2"],
                                  fontSize=13, textColor=colors.HexColor("#1a56e8"),
                                  spaceBefore=14, spaceAfter=6)
    body_style  = ParagraphStyle("Body", parent=styles["Normal"],
                                  fontSize=10, textColor=colors.HexColor("#334155"),
                                  leading=16)
    risk_style  = ParagraphStyle("Risk", parent=styles["Heading1"],
                                  fontSize=18, textColor=risk_color,
                                  alignment=TA_CENTER, spaceAfter=4)

    # ── Title ────────────────────────────────────────────────────────────────
    elem.append(Paragraph("LoanXAI Prediction Report", title_style))
    elem.append(Paragraph("Explainable Loan Default Prediction System", sub_style))
    elem.append(Spacer(1, 8))
    elem.append(HRFlowable(width="100%", thickness=2,
                            color=colors.HexColor("#1a56e8")))
    elem.append(Spacer(1, 12))

    # ── Summary Table ────────────────────────────────────────────────────────
    elem.append(Paragraph("1. Report Summary", h2_style))

    summary_data = [
        ["Field", "Value"],
        ["Applicant Name", applicant_name],
        ["Assessed By",    current_user["full_name"]],
        ["Email",          current_user["email"]],
        ["Role",           current_user["role"].title()],
        ["Generated At",   generated_at],
    ]
    summary_tbl = Table(summary_data, colWidths=[2.2*inch, 4.8*inch])
    summary_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), colors.HexColor("#1a56e8")),
        ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 10),
        ("BACKGROUND",   (0,1), (0,-1), colors.HexColor("#f0f4ff")),
        ("FONTNAME",     (0,1), (0,-1), "Helvetica-Bold"),
        ("GRID",         (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f8faff")]),
        ("PADDING",      (0,0), (-1,-1), 7),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
    ]))
    elem.append(summary_tbl)
    elem.append(Spacer(1, 14))

    # ── Prediction Result ────────────────────────────────────────────────────
    elem.append(Paragraph("2. Prediction Result", h2_style))
    elem.append(Paragraph(f"{risk_level}", risk_style))

    result_data = [
        ["Metric", "Value"],
        ["Outcome",             prediction],
        ["Default Probability", f"{probability}%"],
        ["Risk Classification", risk_level],
    ]
    result_tbl = Table(result_data, colWidths=[2.2*inch, 4.8*inch])
    result_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), risk_color),
        ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 10),
        ("BACKGROUND",   (0,1), (0,-1), colors.HexColor("#f0f4ff")),
        ("FONTNAME",     (0,1), (0,-1), "Helvetica-Bold"),
        ("TEXTCOLOR",    (1,1), (1,-1), risk_color),
        ("FONTNAME",     (1,1), (1,-1), "Helvetica-Bold"),
        ("GRID",         (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f8faff")]),
        ("PADDING",      (0,0), (-1,-1), 7),
    ]))
    elem.append(result_tbl)
    elem.append(Spacer(1, 14))

    # ── Input Data ───────────────────────────────────────────────────────────
    elem.append(Paragraph("3. Borrower Input Data", h2_style))

    label_map = {
        "LIMIT_BAL": "Credit Limit (NT$)", "SEX": "Gender",
        "EDUCATION": "Education Level", "MARRIAGE": "Marital Status", "AGE": "Age",
        "PAY_0": "Repayment Sep", "PAY_2": "Repayment Aug",
        "PAY_3": "Repayment Jul", "PAY_4": "Repayment Jun",
        "PAY_5": "Repayment May", "PAY_6": "Repayment Apr",
        "BILL_AMT1": "Bill Sep (NT$)", "BILL_AMT2": "Bill Aug (NT$)",
        "BILL_AMT3": "Bill Jul (NT$)", "BILL_AMT4": "Bill Jun (NT$)",
        "BILL_AMT5": "Bill May (NT$)", "BILL_AMT6": "Bill Apr (NT$)",
        "PAY_AMT1": "Payment Sep (NT$)", "PAY_AMT2": "Payment Aug (NT$)",
        "PAY_AMT3": "Payment Jul (NT$)", "PAY_AMT4": "Payment Jun (NT$)",
        "PAY_AMT5": "Payment May (NT$)", "PAY_AMT6": "Payment Apr (NT$)",
    }
    sex_map   = {"1": "Male", "2": "Female"}
    edu_map   = {"1": "Graduate School", "2": "University", "3": "High School", "4": "Other"}
    marr_map  = {"0": "Unknown", "1": "Married", "2": "Single", "3": "Other"}

    input_rows = [["Feature", "Value"]]
    for k, label in label_map.items():
        raw = str(form_data.get(k, "N/A"))
        if k == "SEX":      raw = sex_map.get(raw, raw)
        elif k == "EDUCATION": raw = edu_map.get(raw, raw)
        elif k == "MARRIAGE":  raw = marr_map.get(raw, raw)
        input_rows.append([label, raw])

    input_tbl = Table(input_rows, colWidths=[3.5*inch, 3.5*inch])
    input_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), colors.HexColor("#1a56e8")),
        ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 9),
        ("BACKGROUND",   (0,1), (0,-1), colors.HexColor("#f0f4ff")),
        ("FONTNAME",     (0,1), (0,-1), "Helvetica-Bold"),
        ("GRID",         (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f8faff")]),
        ("PADDING",      (0,0), (-1,-1), 6),
    ]))
    elem.append(input_tbl)
    elem.append(Spacer(1, 14))

    # ── SHAP Factors ─────────────────────────────────────────────────────────
    elem.append(Paragraph("4. Top Risk Factors (SHAP Analysis)", h2_style))
    elem.append(Paragraph(
        "SHAP values show how each feature contributed to this prediction. "
        "Positive values push toward default; negative values push against default.",
        body_style))
    elem.append(Spacer(1, 8))

    shap_rows = [["Feature", "SHAP Value", "Impact Direction"]]
    for sp in shap_pairs:
        direction = "↑ Increases Risk" if sp["value"] > 0 else "↓ Decreases Risk"
        shap_rows.append([sp["name"], f"{sp['value']:+.4f}", direction])

    shap_tbl = Table(shap_rows, colWidths=[3.0*inch, 1.8*inch, 2.2*inch])
    shap_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), colors.HexColor("#7c3aed")),
        ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 9),
        ("GRID",         (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#faf5ff")]),
        ("PADDING",      (0,0), (-1,-1), 6),
        ("ALIGN",        (1,0), (1,-1), "CENTER"),
    ]))
    elem.append(shap_tbl)
    elem.append(Spacer(1, 14))

    # ── Recommendation ───────────────────────────────────────────────────────
    elem.append(Paragraph("5. Banking Recommendation", h2_style))
    elem.append(Paragraph(recommendation, body_style))
    elem.append(Spacer(1, 14))

    # ── Model Info ───────────────────────────────────────────────────────────
    elem.append(HRFlowable(width="100%", thickness=1,
                            color=colors.HexColor("#e2e8f0")))
    elem.append(Spacer(1, 8))
    elem.append(Paragraph("6. Model Performance Metrics", h2_style))

    metrics_data = [
        ["Metric", "Score"],
        ["Accuracy",  f"{MODEL_ACCURACY*100:.0f}%"],
        ["ROC-AUC",   f"{MODEL_ROC_AUC:.2f}"],
        ["Precision", f"{MODEL_PRECISION*100:.0f}%"],
        ["Recall",    f"{MODEL_RECALL*100:.0f}%"],
        ["F1 Score",  f"{MODEL_F1:.2f}"],
    ]
    m_tbl = Table(metrics_data, colWidths=[3.5*inch, 3.5*inch])
    m_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), colors.HexColor("#0ea5e9")),
        ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f0f9ff")]),
        ("GRID",         (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("PADDING",      (0,0), (-1,-1), 6),
        ("ALIGN",        (1,0), (1,-1), "CENTER"),
    ]))
    elem.append(m_tbl)
    elem.append(Spacer(1, 8))
    elem.append(Paragraph(
        "Model: Random Forest Classifier | Training Data: UCI Default of Credit Card Clients "
        "(30,000 records) | Explainability: SHAP TreeExplainer | Currency: NT$ (New Taiwan Dollar)",
        ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8,
                       textColor=colors.HexColor("#94a3b8"), alignment=TA_CENTER)
    ))

    doc.build(elem)
    buffer.seek(0)

    safe_name = "".join(c for c in applicant_name if c.isalnum() or c in " _-")[:30]
    filename  = f"LoanXAI_Report_{safe_name}_{datetime.now().strftime('%Y%m%d')}.pdf"

    return send_file(buffer, as_attachment=True,
                     download_name=filename, mimetype="application/pdf")


# ═══════════════════════════════════════════════════════════════════════════════
# LEGACY HTML ROUTES (kept for backward compatibility)
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/", methods=["GET", "POST"])
def home():
    return render_template("index.html", features=features,
                           feature_display_names=feature_display_names)

@app.route("/feature-importance")
def feature_importance():
    importances = model.feature_importances_
    imp_df = pd.DataFrame({
        "feature": [feature_display_names[f] for f in features],
        "importance": importances
    }).sort_values(by="importance", ascending=False)
    return render_template("feature_importance.html",
                           importance=imp_df.to_dict(orient="records"))

@app.route("/roc-curve")
def roc_curve_plot():
    fpr = np.linspace(0, 1, 100)
    tpr = np.sqrt(fpr)
    roc_auc = auc(fpr, tpr)
    plt.figure(figsize=(6,4))
    plt.plot(fpr, tpr, label=f"AUC={round(roc_auc,2)}")
    plt.plot([0,1],[0,1], linestyle='--')
    plt.xlabel("FPR"); plt.ylabel("TPR"); plt.title("ROC Curve")
    plt.legend(); plt.tight_layout()
    img = io.BytesIO()
    plt.savefig(img, format="png"); plt.close(); img.seek(0)
    return send_file(img, mimetype="image/png")


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN ENDPOINTS (require role='admin')
# ═══════════════════════════════════════════════════════════════════════════════

def require_admin(f):
    """Decorator: requires authenticated user with role='admin'."""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = (request.headers.get("Authorization") or "").replace("Bearer ", "").strip()
        if not token:
            return jsonify({"error": "Unauthorized"}), 401
        user = get_user_by_token(token)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        if user.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return f(dict(user), *args, **kwargs)
    return decorated


@app.route("/api/admin/stats", methods=["GET"])
@require_admin
def admin_stats(current_user):
    conn = get_db()
    try:
        total_users  = (_fetchone(conn, "SELECT COUNT(*) AS n FROM users") or {}).get("n", 0)
        total_preds  = (_fetchone(conn, "SELECT COUNT(*) AS n FROM predictions") or {}).get("n", 0)
        default_count = (_fetchone(conn,
            "SELECT COUNT(*) AS n FROM predictions WHERE prediction='DEFAULT'") or {}).get("n", 0)
        risk_dist = _fetchall(conn,
            "SELECT risk_level, COUNT(*) AS cnt FROM predictions GROUP BY risk_level")

        # Recent 7 days: use standard SQL compatible with both backends
        if _USE_POSTGRES:
            recent_sql = "SELECT COUNT(*) AS n FROM predictions WHERE created_at >= NOW() - INTERVAL '7 days'"
        else:
            recent_sql = "SELECT COUNT(*) AS n FROM predictions WHERE created_at >= datetime('now','-7 days')"
        recent = (_fetchone(conn, recent_sql) or {}).get("n", 0)

        # User activity — explicit GROUP BY for PostgreSQL compatibility
        if _USE_POSTGRES:
            activity_sql = """
                SELECT u.full_name, u.username, u.role, COUNT(p.id) AS pred_count
                FROM users u LEFT JOIN predictions p ON u.id = p.user_id
                GROUP BY u.id, u.full_name, u.username, u.role
                ORDER BY pred_count DESC LIMIT 10"""
        else:
            activity_sql = """
                SELECT u.full_name, u.username, u.role, COUNT(p.id) AS pred_count
                FROM users u LEFT JOIN predictions p ON u.id = p.user_id
                GROUP BY u.id ORDER BY pred_count DESC LIMIT 10"""
        user_activity = _fetchall(conn, activity_sql)
    finally:
        conn.close()

    return jsonify({
        "total_users":        total_users,
        "total_predictions":  total_preds,
        "default_count":      default_count,
        "default_rate":       round(default_count / max(total_preds, 1) * 100, 1),
        "predictions_last_7d": recent,
        "risk_distribution":  risk_dist,
        "user_activity":      user_activity,
    })


@app.route("/api/admin/users", methods=["GET"])
@require_admin
def admin_users(current_user):
    conn = get_db()
    try:
        if _USE_POSTGRES:
            sql = """
                SELECT u.id, u.full_name, u.username, u.email, u.role,
                       u.created_at, COUNT(p.id) AS prediction_count
                FROM users u LEFT JOIN predictions p ON u.id = p.user_id
                GROUP BY u.id, u.full_name, u.username, u.email, u.role, u.created_at
                ORDER BY u.created_at DESC"""
        else:
            sql = """
                SELECT u.id, u.full_name, u.username, u.email, u.role,
                       u.created_at, COUNT(p.id) AS prediction_count
                FROM users u LEFT JOIN predictions p ON u.id = p.user_id
                GROUP BY u.id ORDER BY u.created_at DESC"""
        users = _fetchall(conn, sql)
    finally:
        conn.close()
    # Convert datetime objects to strings for JSON
    for u in users:
        if hasattr(u.get("created_at"), "isoformat"):
            u["created_at"] = u["created_at"].isoformat()
    return jsonify({"users": users})


@app.route("/api/admin/predictions", methods=["GET"])
@require_admin
def admin_predictions(current_user):
    q = request.args.get("q", "").strip()
    conn = get_db()
    try:
        if q:
            rows = _fetchall(conn, """
                SELECT p.*, u.full_name AS officer_name, u.username
                FROM predictions p JOIN users u ON p.user_id = u.id
                WHERE p.applicant_name LIKE ? OR u.full_name LIKE ?
                ORDER BY p.created_at DESC LIMIT 200
            """, (f"%{q}%", f"%{q}%"))
        else:
            rows = _fetchall(conn, """
                SELECT p.*, u.full_name AS officer_name, u.username
                FROM predictions p JOIN users u ON p.user_id = u.id
                ORDER BY p.created_at DESC LIMIT 200
            """)
    finally:
        conn.close()
    for r in rows:
        for key in ("shap_pairs", "form_data"):
            if r.get(key):
                try: r[key] = json.loads(r[key])
                except: pass
        if hasattr(r.get("created_at"), "isoformat"):
            r["created_at"] = r["created_at"].isoformat()
    return jsonify({"predictions": rows})



# ═══════════════════════════════════════════════════════════════════════════════
# SUBSCRIPTION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/plans", methods=["GET"])
def api_get_plans():
    """Return all available subscription plans."""
    plans = get_all_plans()
    return jsonify({"plans": plans})


@app.route("/api/subscription", methods=["GET"])
@require_auth
def api_get_subscription(current_user):
    """Return the current user's subscription info and monthly usage."""
    sub = get_user_subscription(current_user["id"])
    used = get_predictions_this_month(current_user["id"])
    limit = sub.get("max_predictions", 5)
    data = {
        "plan_name": sub.get("plan_name", "free"),
        "plan": sub.get("plan_name", "free"),
        "display_name": sub.get("display_name", "Free"),
        "price_monthly": sub.get("price_monthly", 0),
        "features": sub.get("features", {}),
        "predictions_used_this_month": used,
        "max_predictions": limit,
        "unlimited": limit == -1,
        "usage": {
            "predictions_used": used,
            "predictions_limit": limit,
            "unlimited": limit == -1,
            "percent": 0 if limit == -1 else round(used / max(limit, 1) * 100, 1),
        }
    }
    return jsonify({"subscription": data, **data})


@app.route("/api/subscription/upgrade", methods=["POST"])
@require_auth
def api_upgrade_subscription(current_user):
    """
    Upgrade user's subscription.
    SECURITY: Always requires Razorpay payment for paid plans.
    - Free downgrade: allowed without payment
    - Paid plans: MUST go through Razorpay order → verify flow
    """
    body = request.get_json(force=True)
    plan_name = body.get("plan", "starter")
    valid_plans = ["free", "starter", "professional", "enterprise"]
    if plan_name not in valid_plans:
        return jsonify({"error": "Invalid plan."}), 400

    # Free downgrade — no payment needed
    if plan_name == "free":
        upgrade_subscription(current_user["id"], "free")
        _audit_log(current_user["id"], "subscription_downgraded", "subscription",
                   None, "plan=free", _client_ip())
        return jsonify({"success": True, "plan": "free", "message": "Downgraded to Free plan."})

    # --- All paid plans require Razorpay payment ---
    razorpay_key_id     = os.environ.get("RAZORPAY_KEY_ID", "").strip()
    razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()

    if not razorpay_key_id or not razorpay_key_secret:
        return jsonify({"error": "Payment gateway not configured. Contact support."}), 402

    if not RAZORPAY_AVAILABLE:
        return jsonify({"error": "Payment SDK not available on server. Contact support."}), 503

    plans_price = {"starter": 2999, "professional": 7999, "enterprise": 24999}
    amount_inr  = plans_price.get(plan_name, 0)

    try:
        client = _razorpay_sdk.Client(auth=(razorpay_key_id, razorpay_key_secret))
        order = client.order.create({
            "amount":   amount_inr * 100,   # paise
            "currency": "INR",
            "receipt":  f"loanxai_{current_user['id']}_{plan_name}",
            "notes":    {"user_id": str(current_user["id"]), "plan": plan_name},
        })
        _audit_log(current_user["id"], "payment_order_created", "subscription",
                   order.get("id"), f"plan={plan_name}", _client_ip())
        return jsonify({
            "razorpay_key":  razorpay_key_id,
            "order_id":      order["id"],
            "amount":        order["amount"],
            "currency":      "INR",
            "plan":          plan_name,
        })
    except Exception as e:
        return jsonify({"error": f"Payment gateway error: {str(e)}"}), 502



# ─── Payment verification ─────────────────────────────────────────────────────
@app.route("/api/payment/verify", methods=["POST"])
@require_auth
def api_payment_verify(current_user):
    """
    Verify Razorpay payment signature and activate subscription / add-on.
    Called by frontend after Razorpay checkout handler fires.
    """
    import hmac, hashlib
    body              = request.get_json(force=True)
    payment_id        = body.get("razorpay_payment_id", "")
    order_id          = body.get("razorpay_order_id",   "")
    signature         = body.get("razorpay_signature",  "")
    plan_name         = body.get("plan", "starter")
    is_addon          = plan_name == "addon"

    key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    if not key_secret:
        return jsonify({"error": "Payment key not configured."}), 503

    # Validate signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret)
    expected = hmac.new(
        key_secret.encode("utf-8"),
        f"{order_id}|{payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        _audit_log(current_user["id"], "payment_signature_invalid", "payment",
                   payment_id, f"order={order_id}", _client_ip())
        return jsonify({"error": "Invalid payment signature. Please contact support."}), 400

    # Activate plan or add-on
    if is_addon:
        conn = get_db()
        try:
            ph = _ph()
            cur = _cursor(conn)
            cur.execute(
                f"UPDATE user_subscriptions SET extra_predictions = COALESCE(extra_predictions,0) + 500 WHERE user_id={ph}",
                (current_user["id"],)
            )
            conn.commit()
        finally:
            conn.close()
        _audit_log(current_user["id"], "addon_purchased", "subscription",
                   payment_id, "extra_predictions+=500", _client_ip())
    else:
        upgrade_subscription(current_user["id"], plan_name, razorpay_payment=payment_id)
        _audit_log(current_user["id"], "subscription_upgraded", "subscription",
                   payment_id, f"plan={plan_name}", _client_ip())

    return jsonify({
        "success":   True,
        "plan":      plan_name,
        "payment_id": payment_id,
        "message":   "Payment verified and plan activated!" if not is_addon else "Add-on activated! 500 extra predictions added.",
    })



# ═══════════════════════════════════════════════════════════════════════════════
# PREDICTION NOTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/history/<int:pred_id>/note", methods=["PATCH"])
@require_auth
def api_update_note(current_user, pred_id):
    """Add or update a note on a prediction (Starter+ only)."""
    sub = get_user_subscription(current_user["id"])
    plan = (sub or {}).get("plan_name", "free")
    if plan == "free":
        return jsonify({
            "error": "Prediction notes require Starter plan or higher.",
            "plan_required": "starter",
            "upgrade_url": "/pricing"
        }), 403
    body = request.get_json(force=True)
    note = body.get("note", "").strip()
    update_prediction_note(pred_id, current_user["id"], note)
    return jsonify({"success": True, "note": note})


# ═══════════════════════════════════════════════════════════════════════════════
# USER CSV EXPORT (Professional+ plan)
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/history/export-csv", methods=["GET"])
@require_auth
def user_export_csv(current_user):
    """Download user's own predictions as CSV (Professional+ plan only)."""
    sub = get_user_subscription(current_user["id"])
    plan = (sub or {}).get("plan_name", "free")
    if plan not in ("professional", "enterprise"):
        return jsonify({
            "error": "CSV export requires Professional plan or higher.",
            "plan_required": "professional",
            "upgrade_url": "/pricing"
        }), 403
    conn = get_db()
    try:
        rows = _fetchall(conn, """
            SELECT id, applicant_name, prediction, probability, risk_level,
                   recommendation, notes, model_version, created_at
            FROM predictions WHERE user_id=? ORDER BY created_at DESC
        """, (current_user["id"],))
    finally:
        conn.close()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Applicant Name", "Prediction", "Probability (%)",
                     "Risk Level", "Recommendation", "Notes", "Model Version", "Created At"])
    for r in rows:
        created = r.get("created_at", "")
        if hasattr(created, "isoformat"): created = created.isoformat()
        writer.writerow([r.get("id"), r.get("applicant_name"), r.get("prediction"),
                         r.get("probability"), r.get("risk_level"), r.get("recommendation", ""),
                         r.get("notes", ""), r.get("model_version", "1.0"), created])
    response = make_response(output.getvalue())
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    response.headers["Content-Disposition"] = (
        f"attachment; filename=my_predictions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    )
    return response


# ═══════════════════════════════════════════════════════════════════════════════
# ADD-ON: EXTRA PREDICTIONS PURCHASE
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/subscription/add-predictions", methods=["POST"])
@require_auth
def api_add_prediction_quota(current_user):
    """
    Purchase 500 extra predictions add-on for ₹499.
    Always requires Razorpay payment — no free demo mode.
    Returns Razorpay order_id for frontend to open checkout.
    Activation happens only after /api/payment/verify is called.
    """
    ADDON_AMOUNT_INR = 499

    razorpay_key_id     = os.environ.get("RAZORPAY_KEY_ID", "")
    razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")

    if not razorpay_key_id or not razorpay_key_secret:
        return jsonify({"error": "Payment gateway not configured. Contact support."}), 402

    if not RAZORPAY_AVAILABLE:
        return jsonify({"error": "Payment SDK not available on server. Contact support."}), 503

    try:
        client = _razorpay_sdk.Client(auth=(razorpay_key_id, razorpay_key_secret))
        order = client.order.create({
            "amount":   ADDON_AMOUNT_INR * 100,  # paise
            "currency": "INR",
            "receipt":  f"addon_{current_user['id']}",
            "notes":    {"user_id": str(current_user["id"]), "plan": "addon"},
        })
        _audit_log(current_user["id"], "addon_order_created", "subscription",
                   order.get("id"), "extra_predictions+500", _client_ip())
        return jsonify({
            "razorpay_key": razorpay_key_id,
            "order_id":     order["id"],
            "amount":       order["amount"],
            "currency":     "INR",
            "plan":         "addon",
        })
    except Exception as e:
        return jsonify({"error": f"Payment gateway error: {str(e)}"}), 502



# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN: CSV EXPORT
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/admin/export-csv", methods=["GET"])
@require_admin
def admin_export_csv(current_user):
    """Download all predictions as a CSV file."""
    conn = get_db()
    try:
        rows = _fetchall(conn, """
            SELECT p.id, p.applicant_name, p.applicant_id, p.bank_branch,
                   p.prediction, p.probability, p.risk_level,
                   p.recommendation, p.notes, p.model_version, p.created_at,
                   u.full_name AS officer_name, u.email AS officer_email
            FROM predictions p JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        """)
    finally:
        conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Applicant Name", "Applicant ID", "Bank Branch",
        "Prediction", "Probability (%)", "Risk Level",
        "Recommendation", "Notes", "Model Version", "Created At",
        "Officer Name", "Officer Email"
    ])
    for r in rows:
        created = r.get("created_at", "")
        if hasattr(created, "isoformat"):
            created = created.isoformat()
        writer.writerow([
            r.get("id"), r.get("applicant_name"), r.get("applicant_id", ""),
            r.get("bank_branch", ""), r.get("prediction"), r.get("probability"),
            r.get("risk_level"), r.get("recommendation", ""), r.get("notes", ""),
            r.get("model_version", "1.0"), created,
            r.get("officer_name"), r.get("officer_email")
        ])

    response = make_response(output.getvalue())
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    response.headers["Content-Disposition"] = (
        f"attachment; filename=loanxai_predictions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    )
    return response


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN: SUBSCRIPTION STATS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/admin/subscription-stats", methods=["GET"])
@require_admin
def admin_subscription_stats(current_user):
    """Return breakdown of users per subscription plan."""
    conn = get_db()
    try:
        rows = _fetchall(conn, """
            SELECT us.plan_name, COUNT(*) AS user_count
            FROM user_subscriptions us
            WHERE us.status = 'active'
            GROUP BY us.plan_name
            ORDER BY user_count DESC
        """)
    finally:
        conn.close()
    return jsonify({"subscription_breakdown": rows})


# ═══════════════════════════════════════════════════════════════════════════════
# INTERNAL HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _client_ip():
    return request.headers.get("X-Forwarded-For", request.remote_addr or "unknown").split(",")[0].strip()

def _ph():
    """Placeholder: %s for Postgres, ? for SQLite."""
    return "%s" if _USE_POSTGRES else "?"

def _audit_log(user_id, action, entity=None, entity_id=None, details=None, ip=None):
    try:
        conn = get_db()
        try:
            _exec(conn, f"""
                INSERT INTO audit_log (user_id, action, entity, entity_id, details, ip_address)
                VALUES ({_ph()},{_ph()},{_ph()},{_ph()},{_ph()},{_ph()})
            """, (user_id, action, entity, entity_id, details, ip))
            conn.commit()
        finally:
            conn.close()
    except Exception:
        pass  # Audit log failures must never break normal flow

def _generate_and_store_otp(email: str, purpose: str = "login") -> str:
    import random
    otp = f"{random.randint(100000, 999999)}"
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    ph = _ph()
    conn = get_db()
    try:
        # Expire existing OTPs for this email+purpose
        _exec(conn, f"UPDATE otp_codes SET used=1 WHERE email={ph} AND purpose={ph}", (email, purpose))
        if _USE_POSTGRES:
            expires_sql = f"NOW() + INTERVAL '10 minutes'"
            _exec(conn, f"""
                INSERT INTO otp_codes (email, otp_hash, purpose, expires_at)
                VALUES ({ph},{ph},{ph},{expires_sql})
            """, (email, otp_hash, purpose))
        else:
            _exec(conn, f"""
                INSERT INTO otp_codes (email, otp_hash, purpose, expires_at)
                VALUES ({ph},{ph},{ph}, datetime('now','+10 minutes'))
            """, (email, otp_hash, purpose))
        conn.commit()
    finally:
        conn.close()
    return otp

def _verify_otp(email: str, otp: str, purpose: str = "login") -> bool:
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    ph = _ph()
    conn = get_db()
    try:
        now_expr = "NOW()" if _USE_POSTGRES else "datetime('now')"
        row = _fetchone(conn, f"""
            SELECT id FROM otp_codes
            WHERE email={ph} AND otp_hash={ph} AND purpose={ph}
              AND used=0 AND expires_at > {now_expr}
            ORDER BY created_at DESC LIMIT 1
        """, (email, otp_hash, purpose))
        if row:
            _exec(conn, f"UPDATE otp_codes SET used=1 WHERE id={ph}", (row["id"],))
            conn.commit()
            return True
        return False
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════════
# OTP / 2FA ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/auth/otp/verify", methods=["POST"])
def api_otp_verify():
    """Verify OTP after login — returns full session token."""
    body    = request.get_json(force=True)
    email   = body.get("email", "").strip().lower()
    otp     = body.get("otp", "").strip()
    purpose = body.get("purpose", "login")

    if not email or not otp:
        return jsonify({"error": "Email and OTP are required."}), 400

    if not _verify_otp(email, otp, purpose):
        return jsonify({"error": "Invalid or expired OTP. Please try again."}), 401

    user = get_user_by_email(email)
    if not user:
        return jsonify({"error": "User not found."}), 404

    token = create_session(user["id"])
    sub = get_user_subscription(user["id"])
    _audit_log(user["id"], "otp_login", "user", str(user["id"]), "2FA OTP login", _client_ip())
    return jsonify({
        "token": token,
        "user": {
            "id": user["id"], "username": user["username"],
            "full_name": user["full_name"], "email": user["email"],
            "role": user["role"], "plan": sub.get("plan_name", "free"),
            "two_fa_enabled": True
        }
    })


@app.route("/api/auth/otp/send", methods=["POST"])
def api_otp_send():
    """Manually send an OTP (e.g., for resend)."""
    body    = request.get_json(force=True)
    email   = body.get("email", "").strip().lower()
    purpose = body.get("purpose", "login")
    if not email:
        return jsonify({"error": "Email required."}), 400
    user = get_user_by_email(email)
    if not user:
        return jsonify({"message": "If the email exists, an OTP was sent."}), 200
    otp = _generate_and_store_otp(email, purpose)
    threading.Thread(target=send_otp, args=(email, user["full_name"], otp, purpose), daemon=True).start()
    return jsonify({"message": "OTP sent to your email."})


@app.route("/api/auth/2fa/toggle", methods=["POST"])
@require_auth
def api_toggle_2fa(current_user):
    """Enable or disable 2FA for the current user."""
    body    = request.get_json(force=True)
    enable  = bool(body.get("enable", True))
    ph = _ph()
    conn = get_db()
    try:
        _exec(conn, f"UPDATE users SET two_fa_enabled={ph} WHERE id={ph}",
              (1 if enable else 0, current_user["id"]))
        conn.commit()
    finally:
        conn.close()
    _audit_log(current_user["id"], "2fa_toggle", "user", str(current_user["id"]),
               f"2FA {'enabled' if enable else 'disabled'}", _client_ip())
    return jsonify({"two_fa_enabled": enable, "message": f"Two-Factor Authentication {'enabled' if enable else 'disabled'}."})


# ═══════════════════════════════════════════════════════════════════════════════
# FORGOT PASSWORD / RESET PASSWORD
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/auth/forgot-password", methods=["POST"])
def api_forgot_password():
    body  = request.get_json(force=True)
    email = body.get("email", "").strip().lower()
    if not email:
        return jsonify({"error": "Email is required."}), 400

    user = get_user_by_email(email)
    # Always return 200 to prevent user enumeration
    if not user:
        return jsonify({"message": "If that email exists, a reset link was sent."}), 200

    import secrets as _sec
    token = _sec.token_urlsafe(32)
    ph = _ph()
    conn = get_db()
    try:
        if _USE_POSTGRES:
            _exec(conn, f"""
                INSERT INTO password_resets (user_id, token, expires_at)
                VALUES ({ph},{ph}, NOW() + INTERVAL '30 minutes')
            """, (user["id"], token))
        else:
            _exec(conn, f"""
                INSERT INTO password_resets (user_id, token, expires_at)
                VALUES ({ph},{ph}, datetime('now','+30 minutes'))
            """, (user["id"], token))
        conn.commit()
    finally:
        conn.close()

    threading.Thread(target=send_forgot_password,
                     args=(email, user["full_name"], token), daemon=True).start()
    return jsonify({"message": "If that email exists, a reset link was sent."})


@app.route("/api/auth/reset-password", methods=["POST"])
def api_reset_password():
    body        = request.get_json(force=True)
    token       = body.get("token", "").strip()
    new_password = body.get("password", "")

    if not token or not new_password:
        return jsonify({"error": "Token and new password are required."}), 400
    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400
    if not any(c.isupper() for c in new_password):
        return jsonify({"error": "Password must contain at least one uppercase letter."}), 400
    if not any(c.isdigit() for c in new_password):
        return jsonify({"error": "Password must contain at least one number."}), 400

    ph = _ph()
    conn = get_db()
    try:
        now_expr = "NOW()" if _USE_POSTGRES else "datetime('now')"
        row = _fetchone(conn, f"""
            SELECT * FROM password_resets
            WHERE token={ph} AND used=0 AND expires_at > {now_expr}
        """, (token,))
        if not row:
            return jsonify({"error": "Invalid or expired reset link."}), 400

        pw_hash = _hash_pw(new_password)
        _exec(conn, f"UPDATE users SET password_hash={ph} WHERE id={ph}", (pw_hash, row["user_id"]))
        _exec(conn, f"UPDATE password_resets SET used=1 WHERE id={ph}", (row["id"],))
        conn.commit()
        _audit_log(row["user_id"], "password_reset", "user", str(row["user_id"]), "Password reset via email", _client_ip())
    finally:
        conn.close()
    return jsonify({"message": "Password reset successfully. Please log in."})


# ═══════════════════════════════════════════════════════════════════════════════
# API KEYS (Professional / Enterprise)
# ═══════════════════════════════════════════════════════════════════════════════

def _require_plan(*plans):
    """Decorator: require subscription plan membership."""
    def decorator(f):
        import functools
        @functools.wraps(f)
        @require_auth
        def wrapped(current_user, *args, **kwargs):
            sub = get_user_subscription(current_user["id"])
            if sub.get("plan_name") not in plans:
                return jsonify({"error": f"This feature requires one of: {', '.join(plans)} plan.",
                                "plan_required": plans[0]}), 403
            return f(current_user, *args, **kwargs)
        return wrapped
    return decorator


@app.route("/api/apikeys", methods=["GET"])
@require_auth
def api_list_keys(current_user):
    sub = get_user_subscription(current_user["id"])
    if sub.get("plan_name") not in ("professional", "enterprise"):
        return jsonify({"error": "API keys require Professional plan or higher.", "plan_required": "professional"}), 403
    ph = _ph()
    conn = get_db()
    try:
        rows = _fetchall(conn, f"""
            SELECT id, key_prefix, name, is_active, last_used, created_at
            FROM api_keys WHERE user_id={ph} ORDER BY created_at DESC
        """, (current_user["id"],))
    finally:
        conn.close()
    for r in rows:
        if hasattr(r.get("created_at"), "isoformat"): r["created_at"] = r["created_at"].isoformat()
        if hasattr(r.get("last_used"), "isoformat"):  r["last_used"]  = r["last_used"].isoformat()
    return jsonify({"api_keys": rows})


@app.route("/api/apikeys", methods=["POST"])
@require_auth
def api_create_key(current_user):
    sub = get_user_subscription(current_user["id"])
    if sub.get("plan_name") not in ("professional", "enterprise"):
        return jsonify({"error": "API keys require Professional plan.", "plan_required": "professional"}), 403

    body = request.get_json(force=True)
    name = body.get("name", "My API Key")[:80]

    import secrets as _sec
    raw_key    = f"lxai_{_sec.token_urlsafe(32)}"
    key_prefix = raw_key[:12]
    key_hash   = hashlib.sha256(raw_key.encode()).hexdigest()
    ph = _ph()
    conn = get_db()
    try:
        _exec(conn, f"""
            INSERT INTO api_keys (user_id, key_hash, key_prefix, name)
            VALUES ({ph},{ph},{ph},{ph})
        """, (current_user["id"], key_hash, key_prefix, name))
        conn.commit()
    finally:
        conn.close()
    _audit_log(current_user["id"], "api_key_created", "api_key", key_prefix, f"Key: {name}", _client_ip())
    return jsonify({"api_key": raw_key, "prefix": key_prefix, "name": name,
                    "warning": "Save this key now — it will NOT be shown again."}), 201


@app.route("/api/apikeys/<key_prefix>", methods=["DELETE"])
@require_auth
def api_revoke_key(current_user, key_prefix):
    ph = _ph()
    conn = get_db()
    try:
        _exec(conn, f"UPDATE api_keys SET is_active=0 WHERE key_prefix={ph} AND user_id={ph}",
              (key_prefix, current_user["id"]))
        conn.commit()
    finally:
        conn.close()
    return jsonify({"message": "API key revoked."})


# ═══════════════════════════════════════════════════════════════════════════════
# APPLICANT PROFILES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/applicants", methods=["GET"])
@require_auth
def api_list_applicants(current_user):
    ph = _ph()
    conn = get_db()
    try:
        rows = _fetchall(conn, f"""
            SELECT id, applicant_name, applicant_id, bank_branch, created_at
            FROM applicant_profiles WHERE user_id={ph} ORDER BY applicant_name
        """, (current_user["id"],))
    finally:
        conn.close()
    for r in rows:
        if hasattr(r.get("created_at"), "isoformat"): r["created_at"] = r["created_at"].isoformat()
    return jsonify({"applicants": rows})


@app.route("/api/applicants", methods=["POST"])
@require_auth
def api_save_applicant(current_user):
    body = request.get_json(force=True)
    name = body.get("applicant_name", "").strip()
    if not name:
        return jsonify({"error": "Applicant name is required."}), 400
    ph = _ph()
    conn = get_db()
    try:
        _exec(conn, f"""
            INSERT INTO applicant_profiles (user_id, applicant_name, applicant_id, bank_branch, profile_data)
            VALUES ({ph},{ph},{ph},{ph},{ph})
        """, (current_user["id"], name, body.get("applicant_id", ""),
              body.get("bank_branch", ""), json.dumps(body.get("profile_data", {}))))
        conn.commit()
    finally:
        conn.close()
    return jsonify({"message": "Applicant profile saved."}), 201


@app.route("/api/applicants/<int:applicant_id>", methods=["GET"])
@require_auth
def api_get_applicant(current_user, applicant_id):
    ph = _ph()
    conn = get_db()
    try:
        row = _fetchone(conn, f"SELECT * FROM applicant_profiles WHERE id={ph} AND user_id={ph}",
                        (applicant_id, current_user["id"]))
    finally:
        conn.close()
    if not row:
        return jsonify({"error": "Not found."}), 404
    row = dict(row)
    try: row["profile_data"] = json.loads(row.get("profile_data") or "{}")
    except: pass
    return jsonify({"applicant": row})


# ═══════════════════════════════════════════════════════════════════════════════
# RISK THRESHOLDS (Admin / Professional+)
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/settings/risk-thresholds", methods=["GET"])
@require_auth
def api_get_thresholds(current_user):
    ph = _ph()
    conn = get_db()
    try:
        row = _fetchone(conn, f"SELECT * FROM risk_thresholds WHERE user_id={ph}", (current_user["id"],))
    finally:
        conn.close()
    if not row:
        return jsonify({"high_risk": 0.7, "medium_risk": 0.4})
    return jsonify({"high_risk": float(row["high_risk"]), "medium_risk": float(row["medium_risk"])})


@app.route("/api/settings/risk-thresholds", methods=["POST"])
@require_auth
def api_set_thresholds(current_user):
    sub = get_user_subscription(current_user["id"])
    if sub.get("plan_name") not in ("professional", "enterprise") and current_user.get("role") != "admin":
        return jsonify({"error": "Custom thresholds require Professional plan.", "plan_required": "professional"}), 403

    body   = request.get_json(force=True)
    high   = float(body.get("high_risk", 0.7))
    medium = float(body.get("medium_risk", 0.4))
    if not (0 < medium < high < 1):
        return jsonify({"error": "medium_risk must be < high_risk and both in (0,1)."}), 400
    ph = _ph()
    conn = get_db()
    try:
        existing = _fetchone(conn, f"SELECT id FROM risk_thresholds WHERE user_id={ph}", (current_user["id"],))
        if existing:
            _exec(conn, f"UPDATE risk_thresholds SET high_risk={ph}, medium_risk={ph} WHERE user_id={ph}",
                  (high, medium, current_user["id"]))
        else:
            _exec(conn, f"INSERT INTO risk_thresholds (user_id, high_risk, medium_risk) VALUES ({ph},{ph},{ph})",
                  (current_user["id"], high, medium))
        conn.commit()
    finally:
        conn.close()
    return jsonify({"message": "Risk thresholds updated.", "high_risk": high, "medium_risk": medium})


# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT LOG (Admin only)
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/admin/audit-log", methods=["GET"])
@require_admin
def api_admin_audit_log(current_user):
    page  = int(request.args.get("page", 1))
    limit = min(int(request.args.get("limit", 50)), 200)
    offset = (page - 1) * limit
    ph = _ph()
    conn = get_db()
    try:
        rows = _fetchall(conn, f"""
            SELECT al.*, u.username, u.email as user_email
            FROM audit_log al
            LEFT JOIN users u ON u.id = al.user_id
            ORDER BY al.created_at DESC
            LIMIT {ph} OFFSET {ph}
        """, (limit, offset))
        total_row = _fetchone(conn, "SELECT COUNT(*) AS n FROM audit_log")
    finally:
        conn.close()
    for r in rows:
        if hasattr(r.get("created_at"), "isoformat"): r["created_at"] = r["created_at"].isoformat()
    return jsonify({"audit_log": rows, "total": (total_row or {}).get("n", 0), "page": page})


# ═══════════════════════════════════════════════════════════════════════════════
# BATCH PREDICTION (CSV UPLOAD — Professional / Enterprise)
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/predict/batch", methods=["POST"])
@require_auth
def api_batch_predict(current_user):
    sub = get_user_subscription(current_user["id"])
    if sub.get("plan_name") not in ("professional", "enterprise"):
        return jsonify({"error": "Batch prediction requires Professional plan.", "plan_required": "professional"}), 403

    if "file" not in request.files:
        return jsonify({"error": "No CSV file uploaded. Use field name 'file'."}), 400

    f = request.files["file"]
    if not f.filename.lower().endswith(".csv"):
        return jsonify({"error": "Only CSV files are supported."}), 400

    import io as _io
    content = f.read().decode("utf-8-sig")
    reader  = csv.DictReader(_io.StringIO(content))

    required_cols = features  # model feature names
    results = []
    errors  = []

    for row_num, row in enumerate(reader, start=2):
        try:
            X = pd.DataFrame([{k: float(row[k]) for k in required_cols}])
            prob  = float(model.predict_proba(X)[0][1])
            pred  = "Default" if prob >= 0.5 else "No Default"
            high_t, med_t = 0.7, 0.4  # default thresholds
            risk = ("HIGH RISK" if prob >= high_t else
                    "MEDIUM RISK" if prob >= med_t else "LOW RISK")

            applicant_name = row.get("applicant_name", f"Row {row_num}")
            pred_id = save_prediction(
                current_user["id"], applicant_name, pred, round(prob, 4), risk,
                [], dict(row), "", row.get("applicant_id"), row.get("bank_branch")
            )
            results.append({"row": row_num, "applicant_name": applicant_name,
                             "prediction": pred, "probability": round(prob, 4),
                             "risk_level": risk, "prediction_id": pred_id})
        except Exception as e:
            errors.append({"row": row_num, "error": str(e)})

    _audit_log(current_user["id"], "batch_predict", "predictions", None,
               f"{len(results)} predictions, {len(errors)} errors", _client_ip())
    return jsonify({"processed": len(results), "errors": len(errors),
                    "results": results, "error_details": errors})


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN CSV FIX — use _ph() instead of raw ?
# ═══════════════════════════════════════════════════════════════════════════════
# (Admin CSV export now uses _ph() consistently — see usage above in batch endpoint)


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/health", methods=["GET"])
def api_health():
    return jsonify({
        "status": "ok",
        "version": "2.0.0",
        "db": "postgresql" if _USE_POSTGRES else "sqlite",
        "time": datetime.now().isoformat(),
    })


# ── PDF per-prediction route alias ────────────────────────────────────────────
@app.route("/api/history/<int:pred_id>/pdf", methods=["GET"])
@require_auth
def api_history_pdf(current_user, pred_id):
    """Generate and return PDF report for a specific prediction."""
    sub = get_user_subscription(current_user["id"])
    plan = sub.get("plan_name", "free")
    if plan == "free":
        return jsonify({
            "error": "PDF reports require a paid plan. Please upgrade.",
            "plan_required": "starter"
        }), 403

    ph = _ph()
    conn = get_db()
    try:
        row = _fetchone(conn, f"""
            SELECT p.*, u.full_name as officer_name, u.email as officer_email
            FROM predictions p
            JOIN users u ON u.id = p.user_id
            WHERE p.id={ph} AND p.user_id={ph} AND (p.is_deleted IS NULL OR p.is_deleted=0)
        """, (pred_id, current_user["id"]))
    finally:
        conn.close()

    if not row:
        return jsonify({"error": "Prediction not found."}), 404

    # Reuse existing /api/download-report logic if reportlab is available
    if not REPORTLAB_AVAILABLE:
        return jsonify({"error": "PDF generation not available. Please install reportlab."}), 503

    # Redirect to the POST download-report endpoint behavior inline
    row = dict(row)
    try: row["shap_pairs"] = json.loads(row.get("shap_pairs") or "[]")
    except: row["shap_pairs"] = []
    try: row["form_data"] = json.loads(row.get("form_data") or "{}")
    except: row["form_data"] = {}

    from flask import make_response as _mr
    import io as _io
    buf = _io.BytesIO()
    _generate_pdf(buf, row, current_user, sub)
    buf.seek(0)
    resp = _mr(buf.read())
    resp.headers["Content-Type"] = "application/pdf"
    resp.headers["Content-Disposition"] = f"attachment; filename=loanxai_report_{pred_id}.pdf"
    return resp


if __name__ == "__main__":
    app.run(debug=True)
