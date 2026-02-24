from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import json
import pandas as pd
import os

app = FastAPI(title="Churn Prediction API")

# ---------------------------------------
# Load Model & Config
# ---------------------------------------
# Get the absolute path to ensure files are found
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "logistic_regression.pkl")
FEATURE_PATH = os.path.join(BASE_DIR, "features_list.json")

print(f"Loading model from: {MODEL_PATH}")

try:
    model = joblib.load(MODEL_PATH)
    with open(FEATURE_PATH) as f:
        feature_config = json.load(f)
    FEATURES = feature_config["features"]
    print("✅ Model and features loaded successfully.")
except Exception as e:
    print(f"❌ Error loading model files: {e}")
    # We don't exit, so the server can still start and show health status

# ---------------------------------------
# Request Schema
# ---------------------------------------
class ChurnRequest(BaseModel):
    data: dict

# ---------------------------------------
# Health Check
# ---------------------------------------
@app.get("/health")
def health():
    return {"status": "active", "model_loaded": 'model' in globals()}

# ---------------------------------------
# Predict Endpoint (Robust)
# ---------------------------------------
@app.post("/predict")
def predict_churn(request: ChurnRequest):
    try:
        input_data = request.data
        
        # 1. Validate that all required features exist
        missing_features = [f for f in FEATURES if f not in input_data]
        if missing_features:
            error_msg = f"Missing features in input: {missing_features}"
            print(f"⚠️ {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)

        # 2. Create DataFrame with explicit column order
        # Ensure values are float/int and handle None/Null
        clean_data = {}
        for f in FEATURES:
            val = input_data.get(f)
            if val is None:
                val = 0 # Default to 0 if null
            clean_data[f] = val

        X = pd.DataFrame([clean_data], columns=FEATURES)

        # 3. Predict
        churn_prob = model.predict_proba(X)[0][1]
        churn_pred = int(churn_prob >= 0.35)

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

    except Exception as e:
        import traceback
        traceback.print_exc() # Print full error to terminal
        raise HTTPException(status_code=500, detail=str(e))