"""
predict.py — Churn prediction (XGBoost Pipeline v2)
Called by Node.js via child_process.spawn
Input:  JSON via stdin | Output: JSON via stdout
"""
import sys, json, os

def predict(input_data):
    try:
        import joblib, pandas as pd

        BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
        NEW_MODEL_PATH = os.path.join(BASE_DIR, "xgboost_churn_pipeline_v2.pkl")
        OLD_MODEL_PATH = os.path.join(BASE_DIR, "logistic_regression.pkl")

        if os.path.exists(NEW_MODEL_PATH):
            model = joblib.load(NEW_MODEL_PATH)
            return predict_xgboost(model, input_data)
        elif os.path.exists(OLD_MODEL_PATH):
            model = joblib.load(OLD_MODEL_PATH)
            return predict_logistic(model, input_data)
        else:
            return fallback_heuristic(input_data, "No model file found")

    except Exception as e:
        return fallback_heuristic(input_data, str(e))


def predict_xgboost(model, d):
    import pandas as pd

    NUMERIC   = ['IsSeniorCitizen','AccountAgeMonths','MonthlySpend','TotalSpend',
                 'SpendRatio','EngagementScore','IsLongTermCustomer']
    BINARY    = ['HasPartner','HasDependents','HasMobileApp','HasTwoFactorAuth',
                 'UsesWishlist','HasPurchaseProtection','UsesCustomerSupport',
                 'WatchesProductVideos','WatchesLiveStreaming','UsesPaperlessBilling']
    MULTI_CAT = ['Gender','UsesMultipleDevices','PreferredDevice',
                 'MembershipType','PreferredPaymentMethod','SpendTier']

    row = {}

    # ── Numeric base features ──
    row['IsSeniorCitizen']  = float(d.get('IsSeniorCitizen', 0))
    row['AccountAgeMonths'] = float(d.get('AccountAgeMonths', 6))
    row['MonthlySpend']     = float(d.get('MonthlySpend', 0))
    row['TotalSpend']       = float(d.get('TotalSpend', 0))

    # ── Engineered features ──
    age, monthly, total = row['AccountAgeMonths'], row['MonthlySpend'], row['TotalSpend']
    row['SpendRatio']         = min(total / (monthly * age + 1e-6), 5.0)
    row['IsLongTermCustomer'] = 1 if age >= 12 else 0

    # Engagement score — count services used
    svc_keys = ['HasMobileApp','UsesWishlist','HasPurchaseProtection','UsesCustomerSupport',
                'WatchesProductVideos','WatchesLiveStreaming','HasTwoFactorAuth','UsesPaperlessBilling']
    engagement = sum(1 for k in svc_keys if str(d.get(k, 'No')).lower() in ['yes','1','true'])
    row['EngagementScore'] = engagement

    # SpendTier
    if monthly <= 35:   spend_tier = 'Low'
    elif monthly <= 60: spend_tier = 'Medium'
    elif monthly <= 90: spend_tier = 'High'
    else:               spend_tier = 'Premium'

    # ── Binary features (Yes/No strings) ──
    bin_defaults = {'HasPartner':'No','HasDependents':'No','HasMobileApp':'Yes',
                    'HasTwoFactorAuth':'No','UsesWishlist':'No','HasPurchaseProtection':'No',
                    'UsesCustomerSupport':'No','WatchesProductVideos':'No',
                    'WatchesLiveStreaming':'No','UsesPaperlessBilling':'Yes'}
    for col, default in bin_defaults.items():
        val = d.get(col, default)
        row[col] = 'Yes' if val in [1, '1', True, 'Yes', 'yes'] else 'No'

    # ── Multi-category features (raw strings) ──
    row['Gender']                 = d.get('Gender', 'Male')
    row['UsesMultipleDevices']    = d.get('UsesMultipleDevices', 'Yes')
    row['PreferredDevice']        = d.get('PreferredDevice', 'Mobile')
    row['MembershipType']         = d.get('MembershipType', 'Month-to-month')
    row['PreferredPaymentMethod'] = d.get('PreferredPaymentMethod', 'Credit card')
    row['SpendTier']              = spend_tier

    X = pd.DataFrame([row], columns=NUMERIC + BINARY + MULTI_CAT)
    churn_prob = float(model.predict_proba(X)[0][1])

    risk = 'high' if churn_prob >= 0.7 else 'medium' if churn_prob >= 0.4 else 'low'
    return {'success': True, 'churn_probability': round(churn_prob, 4),
            'risk_level': risk, 'prediction': 1 if churn_prob >= 0.35 else 0,
            'model': 'xgboost_v2', 'engagement_score': engagement, 'spend_tier': spend_tier}


def predict_logistic(model, d):
    import pandas as pd
    FEATURE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'features_list.json')
    with open(FEATURE_PATH) as f:
        FEATURES = json.load(f)['features']
    X = pd.DataFrame([{feat: float(d.get(feat, 0)) for feat in FEATURES}], columns=FEATURES)
    churn_prob = float(model.predict_proba(X)[0][1])
    risk = 'high' if churn_prob >= 0.7 else 'medium' if churn_prob >= 0.4 else 'low'
    return {'success': True, 'churn_probability': round(churn_prob, 4),
            'risk_level': risk, 'prediction': 1 if churn_prob >= 0.35 else 0,
            'model': 'logistic_regression_v1'}


def fallback_heuristic(d, error=''):
    age, total, monthly = float(d.get('AccountAgeMonths',6)), float(d.get('TotalSpend',0)), float(d.get('MonthlySpend',0))
    if age < 3 or total < 500:          prob, risk = 0.75, 'high'
    elif age < 6 or total < 2000:       prob, risk = 0.45, 'medium'
    elif age >= 12 and monthly > 60:    prob, risk = 0.10, 'low'
    else:                               prob, risk = 0.20, 'low'
    return {'success': True, 'churn_probability': prob, 'risk_level': risk,
            'prediction': 1 if prob >= 0.35 else 0, 'model': 'fallback', 'fallback': True, 'error': error}


if __name__ == '__main__':
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            print(json.dumps({'success': False, 'error': 'No input'}))
            sys.exit(1)
        print(json.dumps(predict(json.loads(raw))))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)