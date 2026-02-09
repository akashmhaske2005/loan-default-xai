from flask import Flask, render_template, request
import joblib
import numpy as np

app = Flask(__name__)

model = joblib.load("../models/random_forest_model.pkl")
features = joblib.load("../models/feature_names.pkl")

@app.route("/", methods=["GET", "POST"])
def home():
    prediction = None

    if request.method == "POST":
        input_data = [float(request.form[f]) for f in features]
        input_array = np.array(input_data).reshape(1, -1)
        pred = model.predict(input_array)[0]

        prediction = "DEFAULT" if pred == 1 else "NO DEFAULT"

    return render_template("index.html", features=features, prediction=prediction)

if __name__ == "__main__":
    app.run(debug=True)
