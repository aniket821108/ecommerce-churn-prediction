import pandas as pd
import numpy as np
import os
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

def load_and_preprocess_data(filepath=None):
    """
    Load and preprocess the e-commerce churn dataset from CSV
    """
    # If no filepath provided, look for the file in common locations
    if filepath is None:
        possible_paths = [
            'ecommerce_churn_test.csv',
            
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                filepath = path
                break
        
        if filepath is None:
            # Try to find any CSV file with similar name
            csv_files = []
            for root, dirs, files in os.walk('.'):
                for file in files:
                    if file.endswith('.csv') and 'churn' in file.lower():
                        csv_files.append(os.path.join(root, file))
            
            if csv_files:
                print(f"Found CSV files: {csv_files}")
                filepath = csv_files[0]
            else:
                raise FileNotFoundError("Could not find ecommerce_churn.csv. Please provide the correct path.")
    
    print(f"Loading data from: {filepath}")
    
    # Load the dataset
    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        print(f"Error loading CSV file: {e}")
        # Try reading with different encodings if UTF-8 fails
        try:
            df = pd.read_csv(filepath, encoding='latin-1')
            print("Successfully loaded with latin-1 encoding")
        except:
            try:
                df = pd.read_csv(filepath, encoding='ISO-8859-1')
                print("Successfully loaded with ISO-8859-1 encoding")
            except:
                raise ValueError(f"Cannot read file {filepath}. Check file format and encoding.")
    
    print(f"Original dataset shape: {df.shape}")
    print(f"Original columns: {list(df.columns)}")
    print(f"\nFirst few rows:")
    print(df.head())
    
    # ============================================
    # 1. Handle Missing Values
    # ============================================
    
    print("\n" + "="*50)
    print("1. HANDLING MISSING VALUES")
    print("="*50)
    
    # Check for missing values
    print(f"Missing values before processing:")
    missing_counts = df.isnull().sum()
    missing_cols = missing_counts[missing_counts > 0]
    
    if len(missing_cols) == 0:
        print("No missing values found!")
    else:
        print(missing_cols)
        
        # For categorical columns, replace any NaN with 'Unknown'
        categorical_cols = df.select_dtypes(include=['object']).columns
        df[categorical_cols] = df[categorical_cols].fillna('Unknown')
        
        # For numerical columns, replace NaN with median
        numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
        for col in numerical_cols:
            if df[col].isnull().any():
                median_val = df[col].median()
                df[col].fillna(median_val, inplace=True)
                print(f"Filled missing values in {col} with median: {median_val}")
    
    print(f"\nMissing values after processing: {df.isnull().sum().sum()}")
    
    # ============================================
    # 2. Handle Special Values (No service, empty strings)
    # ============================================
    
    print("\n" + "="*50)
    print("2. HANDLING SPECIAL VALUES")
    print("="*50)
    
    # Replace 'No service' values
    for col in df.columns:
        if df[col].dtype == 'object':
            # Check for 'No service' or similar
            if df[col].isin(['No service', 'No service', 'N/A', 'na', 'NA', '']).any():
                count = df[col].isin(['No service', 'No service', 'N/A', 'na', 'NA', '']).sum()
                if count > 0:
                    print(f"Found {count} special/empty values in {col}")
                    df[col] = df[col].replace(['No service', 'No service', 'N/A', 'na', 'NA', ''], 'Not Applicable')
    
    # Handle empty strings in numerical columns
    for col in df.columns:
        if df[col].dtype == 'object':
            # Try to convert to numeric, coercing errors
            try:
                df[col] = pd.to_numeric(df[col], errors='ignore')
            except:
                pass
    
    # ============================================
    # 3. Convert Binary Columns
    # ============================================
    
    print("\n" + "="*50)
    print("3. CONVERTING BINARY COLUMNS")
    print("="*50)
    
    # Convert IsSeniorCitizen to integer if it exists
    if 'IsSeniorCitizen' in df.columns:
        # Handle if it's already numeric or string
        if df['IsSeniorCitizen'].dtype == 'object':
            df['IsSeniorCitizen'] = df['IsSeniorCitizen'].map({'Yes': 1, 'No': 0, '1': 1, '0': 0, 1: 1, 0: 0})
        df['IsSeniorCitizen'] = pd.to_numeric(df['IsSeniorCitizen'], errors='coerce').fillna(0).astype(int)
        print(f"Converted IsSeniorCitizen to integer")
    
    # Convert yes/no columns to binary (1/0)
    yes_no_cols = ['HasPartner', 'HasDependents', 'HasMobileApp', 
                   'UsesMultipleDevices', 'HasTwoFactorAuth', 'UsesWishlist',
                   'HasPurchaseProtection', 'UsesCustomerSupport', 
                   'WatchesProductVideos', 'WatchesLiveStreaming',
                   'UsesPaperlessBilling', 'Churned']
    
    available_yes_no_cols = [col for col in yes_no_cols if col in df.columns]
    
    for col in available_yes_no_cols:
        if col in df.columns:
            # Map various yes/no formats to 1/0
            mapping = {
                'Yes': 1, 'No': 0, 'yes': 1, 'no': 0, 
                'YES': 1, 'NO': 0, 'Y': 1, 'N': 0,
                '1': 1, '0': 0, 1: 1, 0: 0,
                'True': 1, 'False': 0, True: 1, False: 0
            }
            
            df[col] = df[col].map(mapping)
            
            # Convert to numeric, coercing errors
            df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # Fill any remaining NaN with 0
            df[col] = df[col].fillna(0).astype(int)
            
            print(f"Converted {col} to binary (0/1)")
    
    # ============================================
    # 4. Encode Categorical Columns
    # ============================================
    
    print("\n" + "="*50)
    print("4. ENCODING CATEGORICAL COLUMNS")
    print("="*50)
    
    # Handle CustomerID separately
    customer_ids = df['CustomerID'].copy() if 'CustomerID' in df.columns else None
    
    # Identify remaining categorical columns
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    
    # Remove CustomerID and target from categorical columns
    if 'CustomerID' in categorical_cols:
        categorical_cols.remove('CustomerID')
    if 'Churned' in categorical_cols:
        categorical_cols.remove('Churned')
    
    print(f"Categorical columns to encode: {categorical_cols}")
    
    # One-hot encode categorical columns
    if categorical_cols:
        df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
        print(f"One-hot encoded {len(categorical_cols)} categorical columns")
    else:
        print("No categorical columns to encode")
    
    # ============================================
    # 5. Scale Numerical Data
    # ============================================
    
    print("\n" + "="*50)
    print("5. SCALING NUMERICAL DATA")
    print("="*50)
    
    # Identify numerical columns (excluding CustomerID and Churned)
    numerical_cols = []
    for col in df.columns:
        if col in ['CustomerID', 'Churned']:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            numerical_cols.append(col)
    
    print(f"Numerical columns to scale: {numerical_cols[:10]}...")  # Show first 10
    
    if numerical_cols:
        # Separate features and target
        X = df.drop(['Churned'], axis=1, errors='ignore')
        if 'CustomerID' in X.columns:
            X = X.drop('CustomerID', axis=1)
        y = df['Churned'] if 'Churned' in df.columns else None
        
        print(f"Features shape before scaling: {X.shape}")
        
        # Scale numerical features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X[numerical_cols])
        
        # Replace original numerical columns with scaled ones
        X[numerical_cols] = X_scaled
        
        print(f"Features shape after scaling: {X.shape}")
        print("Numerical columns scaled successfully")
        
        # Reconstruct DataFrame
        if customer_ids is not None:
            X['CustomerID'] = customer_ids
        if y is not None:
            X['Churned'] = y
        
        df = X
    else:
        print("No numerical columns to scale")
    
    # ============================================
    # 6. Create Final Clean Dataset
    # ============================================
    
    print("\n" + "="*50)
    print("6. CREATING FINAL DATASET")
    print("="*50)
    
    # Ensure CustomerID is first column if it exists
    if 'CustomerID' in df.columns:
        cols = ['CustomerID'] + [col for col in df.columns if col != 'CustomerID']
        df = df[cols]
    
    print(f"Final dataset shape: {df.shape}")
    print(f"Columns in final dataset: {len(df.columns)}")
    
    # Show sample of data
    print(f"\nSample of clean dataset:")
    print(df.head())
    
    # Check data types
    print(f"\nData types in final dataset:")
    print(df.dtypes.value_counts())
    
    # ============================================
    # 7. Save Clean Dataset
    # ============================================
    
    # Create output directory if it doesn't exist
    output_dir = 'ml-service'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Save to CSV
    output_csv = os.path.join(output_dir, 'ecommerce_churn_test_clean.csv')
    df.to_csv(output_csv, index=False)
    
    print("\n" + "="*50)
    print("PREPROCESSING COMPLETE")
    print("="*50)
    print(f"Clean dataset saved to: {output_csv}")
    
    return df

def analyze_dataset(df, dataset_name="Dataset"):
    """
    Analyze the dataset
    """
    print("\n" + "="*50)
    print(f"{dataset_name} ANALYSIS")
    print("="*50)
    
    # Basic info
    print(f"Shape: {df.shape}")
    print(f"Columns: {len(df.columns)}")
    
    # Check for missing values
    print(f"\nMissing values:")
    missing = df.isnull().sum()
    missing_total = missing.sum()
    if missing_total == 0:
        print("  No missing values!")
    else:
        print(f"Total missing: {missing_total}")
        print(missing[missing > 0])
    
    # Data types
    print(f"\nData types:")
    print(df.dtypes.value_counts())
    
    # Target distribution if exists
    if 'Churned' in df.columns:
        print(f"\nTarget variable 'Churned' distribution:")
        churn_counts = df['Churned'].value_counts()
        print(churn_counts)
        
        # Calculate churn rate
        if churn_counts.sum() > 0:
            churn_rate = churn_counts.get(1, 0) / churn_counts.sum()
            print(f"Churn rate: {churn_rate:.2%}")
    
    # Summary statistics for numerical columns
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    if len(numerical_cols) > 0:
        print(f"\nSummary statistics for {len(numerical_cols)} numerical columns:")
        print(df[numerical_cols].describe().round(2))

def check_file_exists():
    """
    Check if the CSV file exists in common locations
    """
    print("Checking for CSV file...")
    
    possible_locations = [
        '.',  # Current directory
        './data',
        '../data',
        '../../data',
        './src',
        './src/data',
        '../src/data'
    ]
    
    found_files = []
    for location in possible_locations:
        if os.path.exists(location):
            files = os.listdir(location)
            csv_files = [f for f in files if f.endswith('.csv') and 'churn' in f.lower()]
            for csv_file in csv_files:
                full_path = os.path.join(location, csv_file)
                found_files.append(full_path)
                print(f"Found: {full_path}")
    
    return found_files

if __name__ == "__main__":
    print("="*50)
    print("E-COMMERCE CHURN DATA PREPROCESSING")
    print("="*50)
    
    # Check for CSV files
    found_files = check_file_exists()
    
    if not found_files:
        print("\nNo CSV files found with 'churn' in the name.")
        print("Please ensure your CSV file is named 'ecommerce_churn.csv' or similar.")
        print("\nYou can:")
        print("1. Place the CSV file in the current directory")
        print("2. Specify the full path when calling the function")
        print("3. Convert your Excel file to CSV")
        
        # Ask for file path
        file_path = input("\nEnter the full path to your CSV file (or press Enter to exit): ").strip()
        
        if not file_path:
            print("Exiting...")
            exit()
    else:
        # Use the first found file
        file_path = found_files[0]
        print(f"\nUsing file: {file_path}")
    
    try:
        # Run preprocessing
        clean_df = load_and_preprocess_data(file_path)
        
        # Analyze the clean dataset
        analyze_dataset(clean_df, "CLEAN DATASET")
        
        print("\n" + "="*50)
        print("DATA PREPROCESSING COMPLETE!")
        print("="*50)
        print("\nNext steps:")
        print("1. Clean data saved to: processed_data/ecommerce_churn_clean.csv")
        print("2. You can now use this data for model training")
        print("3. Consider splitting the data into train/test sets")
        
    except Exception as e:
        print(f"\nError occurred during preprocessing: {e}")
        print("\nTroubleshooting tips:")
        print("1. Ensure the CSV file is not corrupted")
        print("2. Check that the file has the correct column headers")
        print("3. Make sure the file is accessible (not open in another program)")
        print("4. Try converting the file to UTF-8 encoding")
        
        import traceback
        traceback.print_exc()