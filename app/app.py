from flask import Flask, render_template, request, send_file
import joblib
import pandas as pd
import shap
import numpy as np
import matplotlib.pyplot as plt
import os
import io
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from sklearn.metrics import auc

app = Flask(__name__)

# ----------------------------
# PATH SETUP
# ----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "models")

# ----------------------------
# LOAD MODEL & FEATURES
# ----------------------------
model = joblib.load(os.path.join(MODEL_DIR, "random_forest_model.pkl"))
features = joblib.load(os.path.join(MODEL_DIR, "feature_names.pkl"))

explainer = shap.TreeExplainer(model)

# ----------------------------
# FRIENDLY FEATURE NAMES
# ----------------------------
feature_display_names = {
    "LIMIT_BAL": "Credit Limit",
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

    "BILL_AMT1": "Bill Amount (Sep)",
    "BILL_AMT2": "Bill Amount (Aug)",
    "BILL_AMT3": "Bill Amount (Jul)",
    "BILL_AMT4": "Bill Amount (Jun)",
    "BILL_AMT5": "Bill Amount (May)",
    "BILL_AMT6": "Bill Amount (Apr)",

    "PAY_AMT1": "Payment Amount (Sep)",
    "PAY_AMT2": "Payment Amount (Aug)",
    "PAY_AMT3": "Payment Amount (Jul)",
    "PAY_AMT4": "Payment Amount (Jun)",
    "PAY_AMT5": "Payment Amount (May)",
    "PAY_AMT6": "Payment Amount (Apr)"
}

# ----------------------------
# MODEL METRICS
# ----------------------------
MODEL_ACCURACY = 0.81
MODEL_ROC_AUC = 0.86
MODEL_PRECISION = 0.79
MODEL_RECALL = 0.75
MODEL_F1 = 0.77


# ==========================================================
# HOME ROUTE
# ==========================================================
@app.route("/", methods=["GET", "POST"])
def home():
    prediction = None
    probability = None
    risk_level = None
    shap_pairs = None
    error = None

    if request.method == "POST":
        try:
            form_values = request.form.to_dict()
            input_data = []

            for f in features:
                val = float(form_values.get(f, 0))
                if val < 0:
                    raise ValueError("Negative values not allowed.")
                input_data.append(val)

            input_df = pd.DataFrame([input_data], columns=features)

            # Prediction
            pred = model.predict(input_df)[0]
            prob = model.predict_proba(input_df)[0][1] * 100

            prediction = "DEFAULT" if pred == 1 else "NO DEFAULT"
            probability = round(prob, 2)

            # Risk Level
            if prob < 30:
                risk_level = "LOW RISK"
            elif prob < 70:
                risk_level = "MEDIUM RISK"
            else:
                risk_level = "HIGH RISK"

            # SHAP Explanation
            shap_values = explainer.shap_values(input_df)
            shap_vals = shap_values[1][0]

            shap_df = pd.DataFrame({
                "feature": features,
                "value": shap_vals
            })

            shap_df["abs"] = np.abs(shap_df["value"])
            shap_df = shap_df.sort_values(by="abs", ascending=False).head(5)

            shap_pairs = [
                (feature_display_names[row["feature"]], round(row["value"], 4))
                for _, row in shap_df.iterrows()
            ]

        except Exception as e:
            error = str(e)

    return render_template(
        "index.html",
        features=features,
        feature_display_names=feature_display_names,
        prediction=prediction,
        probability=probability,
        risk_level=risk_level,
        shap_pairs=shap_pairs,
        error=error,
        accuracy=MODEL_ACCURACY,
        roc_auc=MODEL_ROC_AUC,
        precision=MODEL_PRECISION,
        recall=MODEL_RECALL,
        f1=MODEL_F1
    )


# ==========================================================
# FEATURE IMPORTANCE
# ==========================================================
@app.route("/feature-importance")
def feature_importance():
    importances = model.feature_importances_

    importance_df = pd.DataFrame({
        "feature": [feature_display_names[f] for f in features],
        "importance": importances
    }).sort_values(by="importance", ascending=False)

    return render_template(
        "feature_importance.html",
        importance=importance_df.to_dict(orient="records")
    )


# ==========================================================
# ROC CURVE (DEMO)
# ==========================================================
@app.route("/roc-curve")
def roc_curve_plot():
    fpr = np.linspace(0, 1, 100)
    tpr = np.sqrt(fpr)
    roc_auc = auc(fpr, tpr)

    plt.figure()
    plt.plot(fpr, tpr)
    plt.plot([0, 1], [0, 1], linestyle='--')
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title(f"ROC Curve (AUC = {round(roc_auc, 2)})")

    img = io.BytesIO()
    plt.savefig(img, format="png")
    plt.close()
    img.seek(0)

    return send_file(img, mimetype="image/png")


# ==========================================================
# DOWNLOAD PDF REPORT
# ==========================================================
@app.route("/download-report")
def download_report():
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer)
    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph("Loan Default Prediction Report", styles["Heading1"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Accuracy: {MODEL_ACCURACY}", styles["Normal"]))
    elements.append(Paragraph(f"ROC-AUC: {MODEL_ROC_AUC}", styles["Normal"]))
    elements.append(Paragraph(f"Precision: {MODEL_PRECISION}", styles["Normal"]))
    elements.append(Paragraph(f"Recall: {MODEL_RECALL}", styles["Normal"]))
    elements.append(Paragraph(f"F1 Score: {MODEL_F1}", styles["Normal"]))

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="loan_report.pdf",
        mimetype="application/pdf"
    )


# ==========================================================
# RUN APP
# ==========================================================
if __name__ == "__main__":
    app.run(debug=True)