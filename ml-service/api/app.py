from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import json
import pandas as pd

# ---------------------------------------
# Load model and feature config
# ---------------------------------------
MODEL_PATH = "logistic_regression.pkl"
FEATURE_PATH = "features_list.json"

model = joblib.load(MODEL_PATH)

with open(FEATURE_PATH) as f:
    feature_config = json.load(f)

FEATURES = feature_config["features"]

app = FastAPI(title="Churn Prediction API")

# ---------------------------------------
# Request Schema
# ---------------------------------------
class ChurnRequest(BaseModel):
    data: dict   # 22 features as key-value

# ---------------------------------------
# Health Check
# ---------------------------------------
@app.get("/health")
def health():
    return {"status": "ML service running"}

# ---------------------------------------
# Predict Endpoint
# ---------------------------------------
@app.post("/predict")
def predict_churn(request: ChurnRequest):
    input_data = request.data

    # Ensure correct feature order
    X = pd.DataFrame([[input_data[f] for f in FEATURES]], columns=FEATURES)

    churn_prob = model.predict_proba(X)[0][1]
    churn_pred = int(churn_prob >= 0.35)  # tuned threshold

    risk_level = (
        "High" if churn_prob >= 0.7 else
        "Medium" if churn_prob >= 0.4 else
        "Low"
    )

    return {
        "churn_probability": round(float(churn_prob), 4),
        "prediction": churn_pred,
        "risk_level": risk_level
    }
