"""
predict.py — Churn prediction (XGBoost Pipeline v2)
Called by Node.js via child_process.spawn
Supports both Single Object and Vectorized Batch Input:
  - Input:  JSON object OR JSON array of objects via stdin
  - Output: JSON object OR JSON array of predictions via stdout
"""
import sys, json, os, warnings
warnings.filterwarnings('ignore')

def process_single_row(d):
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
    svc_keys = ['HasMobileApp', 'UsesWishlist', 'HasPurchaseProtection', 'UsesCustomerSupport',
                'WatchesProductVideos', 'WatchesLiveStreaming', 'HasTwoFactorAuth', 'UsesPaperlessBilling']
    engagement = sum(1 for k in svc_keys if str(d.get(k, 'No')).lower() in ['yes', '1', 'true'])
    row['EngagementScore'] = engagement

    # SpendTier
    if monthly <= 35:   spend_tier = 'Low'
    elif monthly <= 60: spend_tier = 'Medium'
    elif monthly <= 90: spend_tier = 'High'
    else:               spend_tier = 'Premium'

    # ── Binary features (Yes/No strings) ──
    bin_defaults = {
        'HasPartner': 'No', 'HasDependents': 'No', 'HasMobileApp': 'Yes',
        'HasTwoFactorAuth': 'No', 'UsesWishlist': 'No', 'HasPurchaseProtection': 'No',
        'UsesCustomerSupport': 'No', 'WatchesProductVideos': 'No',
        'WatchesLiveStreaming': 'No', 'UsesPaperlessBilling': 'Yes'
    }
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

    return row


def load_model_with_compatibility(model_path):
    import joblib
    model = joblib.load(model_path)
    # Ensure cross-scikit-learn version compatibility for ColumnTransformer SimpleImputers
    if hasattr(model, 'named_steps') and 'prep' in model.named_steps:
        prep = model.named_steps['prep']
        if hasattr(prep, 'transformers_'):
            for name, trans, cols in prep.transformers_:
                if hasattr(trans, 'steps'):
                    for sname, step in trans.steps:
                        if hasattr(step, 'statistics_') and not hasattr(step, '_fill_dtype'):
                            step._fill_dtype = getattr(step.statistics_, 'dtype', None)
    return model


def predict(input_data):
    is_batch = isinstance(input_data, list)
    records  = input_data if is_batch else [input_data]

    if not records:
        return [] if is_batch else {'success': False, 'error': 'Empty input list'}

    try:
        BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
        NEW_MODEL_PATH = os.path.join(BASE_DIR, "xgboost_churn_pipeline_v2.pkl")
        OLD_MODEL_PATH = os.path.join(BASE_DIR, "logistic_regression.pkl")

        if os.path.exists(NEW_MODEL_PATH):
            model = load_model_with_compatibility(NEW_MODEL_PATH)
            return predict_xgboost(model, records, is_batch)
        elif os.path.exists(OLD_MODEL_PATH):
            import joblib
            model = joblib.load(OLD_MODEL_PATH)
            return predict_logistic(model, records, is_batch)
        else:
            return fallback_heuristic_batch(records, is_batch, "No model file found")

    except Exception as e:
        return fallback_heuristic_batch(records, is_batch, str(e))


def predict_xgboost(model, records, is_batch):
    import pandas as pd

    NUMERIC   = ['IsSeniorCitizen', 'AccountAgeMonths', 'MonthlySpend', 'TotalSpend',
                 'SpendRatio', 'EngagementScore', 'IsLongTermCustomer']
    BINARY    = ['HasPartner', 'HasDependents', 'HasMobileApp', 'HasTwoFactorAuth',
                 'UsesWishlist', 'HasPurchaseProtection', 'UsesCustomerSupport',
                 'WatchesProductVideos', 'WatchesLiveStreaming', 'UsesPaperlessBilling']
    MULTI_CAT = ['Gender', 'UsesMultipleDevices', 'PreferredDevice',
                 'MembershipType', 'PreferredPaymentMethod', 'SpendTier']

    rows = [process_single_row(d) for d in records]
    X = pd.DataFrame(rows, columns=NUMERIC + BINARY + MULTI_CAT)

    # Vectorized batch prediction across all records
    probs = model.predict_proba(X)[:, 1]

    results = []
    for i, p_val in enumerate(probs):
        churn_prob = float(p_val)
        risk = 'high' if churn_prob >= 0.7 else 'medium' if churn_prob >= 0.4 else 'low'
        results.append({
            'success': True,
            'churn_probability': round(churn_prob, 4),
            'risk_level': risk,
            'prediction': 1 if churn_prob >= 0.35 else 0,
            'model': 'xgboost_v2',
            'engagement_score': rows[i]['EngagementScore'],
            'spend_tier': rows[i]['SpendTier']
        })

    return results if is_batch else results[0]


def predict_logistic(model, records, is_batch):
    import pandas as pd
    FEATURE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'features_list.json')
    with open(FEATURE_PATH) as f:
        FEATURES = json.load(f)['features']

    rows = [{feat: float(d.get(feat, 0)) for feat in FEATURES} for d in records]
    X = pd.DataFrame(rows, columns=FEATURES)
    probs = model.predict_proba(X)[:, 1]

    results = []
    for p_val in probs:
        churn_prob = float(p_val)
        risk = 'high' if churn_prob >= 0.7 else 'medium' if churn_prob >= 0.4 else 'low'
        results.append({
            'success': True,
            'churn_probability': round(churn_prob, 4),
            'risk_level': risk,
            'prediction': 1 if churn_prob >= 0.35 else 0,
            'model': 'logistic_regression_v1'
        })

    return results if is_batch else results[0]


def fallback_heuristic_single(d, error=''):
    age, total, monthly = float(d.get('AccountAgeMonths', 6)), float(d.get('TotalSpend', 0)), float(d.get('MonthlySpend', 0))
    if age < 3 or total < 500:          prob, risk = 0.75, 'high'
    elif age < 6 or total < 2000:       prob, risk = 0.45, 'medium'
    elif age >= 12 and monthly > 60:    prob, risk = 0.10, 'low'
    else:                               prob, risk = 0.20, 'low'
    return {
        'success': True,
        'churn_probability': prob,
        'risk_level': risk,
        'prediction': 1 if prob >= 0.35 else 0,
        'model': 'fallback',
        'fallback': True,
        'error': error
    }


def fallback_heuristic_batch(records, is_batch, error=''):
    results = [fallback_heuristic_single(d, error) for d in records]
    return results if is_batch else results[0]


if __name__ == '__main__':
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            print(json.dumps({'success': False, 'error': 'No input provided'}))
            sys.exit(1)
        data = json.loads(raw)
        result = predict(data)
        print(json.dumps(result))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)