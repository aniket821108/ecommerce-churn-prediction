"""
predict.py — Standalone churn prediction script
Called by Node.js via child_process.spawn
Input:  JSON string via stdin
Output: JSON string via stdout
"""

import sys
import json
import os

def predict(input_data):
    try:
        import joblib
        import pandas as pd

        # Paths relative to this script's location
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        MODEL_PATH = os.path.join(BASE_DIR, "logistic_regression.pkl")
        FEATURE_PATH = os.path.join(BASE_DIR, "features_list.json")

        # Load model and features
        model = joblib.load(MODEL_PATH)
        with open(FEATURE_PATH) as f:
            feature_config = json.load(f)
        FEATURES = feature_config["features"]

        # Build clean input with all required features
        clean_data = {}
        for f in FEATURES:
            val = input_data.get(f)
            clean_data[f] = float(val) if val is not None else 0.0

        # Create DataFrame and predict
        X = pd.DataFrame([clean_data], columns=FEATURES)
        churn_prob = float(model.predict_proba(X)[0][1])

        # Risk level
        if churn_prob >= 0.7:
            risk_level = "high"
        elif churn_prob >= 0.4:
            risk_level = "medium"
        else:
            risk_level = "low"

        return {
            "success": True,
            "churn_probability": round(churn_prob, 4),
            "risk_level": risk_level,
            "prediction": 1 if churn_prob >= 0.35 else 0
        }

    except Exception as e:
        # Fallback heuristic if model fails
        account_age = input_data.get("AccountAgeMonths", 6)
        total_spend = input_data.get("TotalSpend", 0)

        if account_age < 3 or total_spend < 500:
            prob, risk = 0.75, "high"
        elif account_age < 6 or total_spend < 2000:
            prob, risk = 0.45, "medium"
        else:
            prob, risk = 0.15, "low"

        return {
            "success": True,
            "churn_probability": prob,
            "risk_level": risk,
            "prediction": 1 if prob >= 0.35 else 0,
            "fallback": True,
            "error": str(e)
        }


if __name__ == "__main__":
    try:
        # Read JSON from stdin
        raw = sys.stdin.read().strip()
        if not raw:
            print(json.dumps({"success": False, "error": "No input received"}))
            sys.exit(1)

        input_data = json.loads(raw)
        result = predict(input_data)
        print(json.dumps(result))
        sys.exit(0)

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)