"""
Retrain model with the CORRECT 23 credit-card features.
Saves in-place, compatible with current sklearn version.
"""
import os, sys
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier

MODELS_DIR    = os.path.join(os.path.dirname(__file__), 'models')
MODEL_PATH    = os.path.join(MODELS_DIR, 'random_forest_model.pkl')
FEATURES_PATH = os.path.join(MODELS_DIR, 'feature_names.pkl')

# Load the feature list from disk (the authoritative list)
import warnings
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    features = joblib.load(FEATURES_PATH)

print(f"Features ({len(features)}): {features}")

np.random.seed(42)
N = 8000

# Synthetic data that matches the 23 credit-card features exactly
data = {
    'LIMIT_BAL': np.random.randint(10000, 1000000, N).astype(float),
    'SEX':       np.random.choice([1, 2], N).astype(float),
    'EDUCATION': np.random.choice([1, 2, 3, 4], N).astype(float),
    'MARRIAGE':  np.random.choice([0, 1, 2, 3], N).astype(float),
    'AGE':       np.random.randint(20, 75, N).astype(float),
    'PAY_0':     np.random.choice([-2,-1,0,1,2,3,4,5,6,7,8], N).astype(float),
    'PAY_2':     np.random.choice([-2,-1,0,1,2,3,4,5,6,7,8], N).astype(float),
    'PAY_3':     np.random.choice([-2,-1,0,1,2,3,4,5,6,7,8], N).astype(float),
    'PAY_4':     np.random.choice([-2,-1,0,1,2,3,4,5,6,7,8], N).astype(float),
    'PAY_5':     np.random.choice([-2,-1,0,1,2,3,4,5,6,7,8], N).astype(float),
    'PAY_6':     np.random.choice([-2,-1,0,1,2,3,4,5,6,7,8], N).astype(float),
    'BILL_AMT1': np.random.randint(-50000, 500000, N).astype(float),
    'BILL_AMT2': np.random.randint(-50000, 500000, N).astype(float),
    'BILL_AMT3': np.random.randint(-50000, 500000, N).astype(float),
    'BILL_AMT4': np.random.randint(-50000, 500000, N).astype(float),
    'BILL_AMT5': np.random.randint(-50000, 500000, N).astype(float),
    'BILL_AMT6': np.random.randint(-50000, 500000, N).astype(float),
    'PAY_AMT1':  np.random.randint(0, 100000, N).astype(float),
    'PAY_AMT2':  np.random.randint(0, 100000, N).astype(float),
    'PAY_AMT3':  np.random.randint(0, 100000, N).astype(float),
    'PAY_AMT4':  np.random.randint(0, 100000, N).astype(float),
    'PAY_AMT5':  np.random.randint(0, 100000, N).astype(float),
    'PAY_AMT6':  np.random.randint(0, 100000, N).astype(float),
}

import pandas as pd
X = pd.DataFrame(data)[features]   # ensure column order matches

# Realistic default target
pay_total = (X['PAY_0'] + X['PAY_2'] + X['PAY_3']).values
default_prob = (
    0.35 * (pay_total > 3) +
    0.20 * (X['LIMIT_BAL'].values < 50000) +
    0.15 * (X['AGE'].values < 25) +
    0.15 * (X['EDUCATION'].values >= 3) +
    0.15 * np.random.random(N)
)
y = (np.random.random(N) < default_prob).astype(int)
print(f"Default rate: {y.mean():.2%}")

print("Training RandomForestClassifier(n_estimators=200)...")
model = RandomForestClassifier(n_estimators=200, max_depth=None,
                               random_state=42, n_jobs=-1)
model.fit(X, y)

joblib.dump(model, MODEL_PATH)
print(f"Model saved -> {MODEL_PATH}")

# Sanity check
prob = model.predict_proba(X.iloc[[0]])[0][1]
print(f"Test prediction on row 0: {prob:.4f} -> {'Default' if prob>=0.5 else 'No Default'}")
print("Done! Restart the Flask server.")
