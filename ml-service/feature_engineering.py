import pandas as pd
import numpy as np
from sklearn.feature_selection import SelectKBest, f_classif, RFE
from sklearn.ensemble import RandomForestClassifier
import warnings
warnings.filterwarnings('ignore')

def create_features(df):
    """
    Create new features from existing ones
    """
    print("Creating new features...")
    
    # Make a copy to avoid modifying original
    df_featured = df.copy()
    
    # 1. Interaction Features
    if all(col in df_featured.columns for col in ['MonthlySpend', 'AccountAgeMonths']):
        df_featured['SpendPerMonth'] = df_featured['MonthlySpend'] / (df_featured['AccountAgeMonths'] + 1)
        print(f"Created: SpendPerMonth")
    
    if all(col in df_featured.columns for col in ['TotalSpend', 'AccountAgeMonths']):
        df_featured['AvgMonthlySpend'] = df_featured['TotalSpend'] / (df_featured['AccountAgeMonths'] + 1)
        print(f"Created: AvgMonthlySpend")
    
    # 2. Behavioral Score Features
    engagement_features = []
    for col in df_featured.columns:
        if any(keyword in col for keyword in ['Uses', 'Has', 'Watches']):
            if df_featured[col].dtype in [np.int64, np.float64]:
                engagement_features.append(col)
    
    if engagement_features:
        df_featured['EngagementScore'] = df_featured[engagement_features].sum(axis=1)
        print(f"Created: EngagementScore (from {len(engagement_features)} features)")
    
    # 3. Risk Features
    if all(col in df_featured.columns for col in ['MonthlySpend', 'TotalSpend']):
        df_featured['SpendingVolatility'] = abs(df_featured['MonthlySpend'] - df_featured['TotalSpend'].mean())
        print(f"Created: SpendingVolatility")
    
    # 4. Customer Value Features
    if all(col in df_featured.columns for col in ['TotalSpend', 'AccountAgeMonths']):
        df_featured['CustomerLifetimeValue'] = df_featured['TotalSpend'] * (1 + df_featured['AccountAgeMonths']/12)
        print(f"Created: CustomerLifetimeValue")
    
    # 5. Support Interaction Features
    if all(col in df_featured.columns for col in ['UsesCustomerSupport', 'AccountAgeMonths']):
        df_featured['SupportFrequency'] = df_featured['UsesCustomerSupport'] / (df_featured['AccountAgeMonths'] + 1)
        print(f"Created: SupportFrequency")
    
    print(f"Total features after engineering: {len(df_featured.columns)}")
    
    return df_featured

def select_features(X, y, method='kbest', k=20):
    """
    Select the most important features
    """
    print(f"\nSelecting features using {method} method...")
    
    if method == 'kbest':
        # Use ANOVA F-value for feature selection
        selector = SelectKBest(score_func=f_classif, k=min(k, X.shape[1]))
        X_selected = selector.fit_transform(X, y)
        selected_indices = selector.get_support(indices=True)
        selected_features = X.columns[selected_indices].tolist()
        
        # Print feature scores
        feature_scores = pd.DataFrame({
            'Feature': X.columns,
            'Score': selector.scores_,
            'P-Value': selector.pvalues_
        }).sort_values('Score', ascending=False)
        
        print(f"Top {k} features selected:")
        print(feature_scores.head(k))
        
    elif method == 'rfe':
        # Use Recursive Feature Elimination
        estimator = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        selector = RFE(estimator, n_features_to_select=k)
        X_selected = selector.fit_transform(X, y)
        selected_features = X.columns[selector.support_].tolist()
        
        print(f"Selected {len(selected_features)} features using RFE")
        
    elif method == 'correlation':
        # Select features based on correlation with target
        correlations = []
        for col in X.columns:
            if pd.api.types.is_numeric_dtype(X[col]):
                corr = np.corrcoef(X[col], y)[0, 1]
                correlations.append((col, abs(corr)))
        
        correlations.sort(key=lambda x: x[1], reverse=True)
        selected_features = [col for col, _ in correlations[:k]]
        
        print(f"Top {k} correlated features:")
        for col, corr in correlations[:k]:
            print(f"  {col}: {corr:.4f}")
    
    else:
        print(f"Method {method} not recognized. Using all features.")
        selected_features = X.columns.tolist()
        X_selected = X
    
    return X_selected, selected_features

def reduce_dimensionality(X, method='pca', n_components=0.95):
    """
    Reduce dimensionality of features
    """
    from sklearn.decomposition import PCA
    from sklearn.manifold import TSNE
    
    print(f"\nReducing dimensionality using {method}...")
    
    if method == 'pca':
        pca = PCA(n_components=n_components if n_components > 1 else n_components)
        X_reduced = pca.fit_transform(X)
        
        print(f"Original dimensions: {X.shape[1]}")
        print(f"Reduced dimensions: {X_reduced.shape[1]}")
        print(f"Variance explained: {pca.explained_variance_ratio_.sum():.2%}")
        
        return X_reduced, pca
        
    elif method == 'tsne':
        tsne = TSNE(n_components=2 if n_components > 1 else 3, 
                   random_state=42, 
                   perplexity=min(30, X.shape[0] - 1))
        X_reduced = tsne.fit_transform(X)
        
        print(f"Reduced to {X_reduced.shape[1]} dimensions using t-SNE")
        return X_reduced, tsne
    
    else:
        print("No dimensionality reduction applied")
        return X, None

def analyze_feature_importance(model, feature_names, top_n=20):
    """
    Analyze and visualize feature importance
    """
    try:
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            indices = np.argsort(importances)[::-1]
            
            print(f"\nTop {top_n} most important features:")
            for i in range(min(top_n, len(feature_names))):
                print(f"{i+1:2d}. {feature_names[indices[i]]:30s} {importances[indices[i]]:.4f}")
            
            return importances
            
        elif hasattr(model, 'coef_'):
            if len(model.coef_.shape) == 2:  # For multi-class
                importances = np.mean(np.abs(model.coef_), axis=0)
            else:  # For binary classification
                importances = np.abs(model.coef_[0])
            
            indices = np.argsort(importances)[::-1]
            
            print(f"\nTop {top_n} most important features (coefficient magnitude):")
            for i in range(min(top_n, len(feature_names))):
                print(f"{i+1:2d}. {feature_names[indices[i]]:30s} {importances[indices[i]]:.4f}")
            
            return importances
            
    except Exception as e:
        print(f"Could not extract feature importance: {e}")
        return None

def prepare_features(df, target_col='Churned', customer_id_col='CustomerID'):
    """
    Main function to prepare features for modeling
    """
    print("="*50)
    print("FEATURE ENGINEERING PIPELINE")
    print("="*50)
    
    # Separate features and target
    if target_col in df.columns:
        y = df[target_col]
        X = df.drop([target_col], axis=1)
    else:
        y = None
        X = df
    
    # Remove CustomerID if exists
    if customer_id_col in X.columns:
        X = X.drop(customer_id_col, axis=1)
    
    print(f"Initial shape: {X.shape}")
    print(f"Target distribution: {y.value_counts().to_dict() if y is not None else 'No target'}")
    
    # Create new features
    X_engineered = create_features(X)
    
    # Handle missing values in new features
    X_engineered = X_engineered.fillna(0)
    
    print(f"\nFinal feature set shape: {X_engineered.shape}")
    print(f"Features: {list(X_engineered.columns)}")
    
    return X_engineered, y

if __name__ == "__main__":
    # Test the feature engineering
    print("Testing feature engineering...")
    
    # Create sample data
    sample_data = pd.DataFrame({
        'CustomerID': ['C001', 'C002', 'C003'],
        'MonthlySpend': [100, 200, 150],
        'TotalSpend': [1000, 2000, 1500],
        'AccountAgeMonths': [12, 24, 18],
        'UsesCustomerSupport': [1, 0, 1],
        'HasMobileApp': [1, 1, 0],
        'Churned': [0, 1, 0]
    })
    
    X, y = prepare_features(sample_data)
    print(f"\nEngineered features: {X.columns.tolist()}")