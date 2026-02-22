import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import List, Dict, Any

class AnomalyDetector:
    def __init__(self, contamination: float = 0.05):
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.encoders = {}
        
    def preprocess(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocesses dataframe:
        - Drops ID columns
        - Encodes categorical columns
        - Scales numerical columns
        - Handles missing values (ffill)
        """
        df_clean = df.copy()
        
        # Drop potential ID columns
        cols_to_drop = [c for c in df_clean.columns if 'id' in c.lower() or 'uuid' in c.lower()]
        if cols_to_drop:
            df_clean = df_clean.drop(columns=cols_to_drop)
            
        # Handle Missing Values
        df_clean = df_clean.ffill().bfill().fillna(0)
        
        # Encode Categorical
        for col in df_clean.select_dtypes(include=['object', 'category']).columns:
            if col not in self.encoders:
                self.encoders[col] = LabelEncoder()
                df_clean[col] = self.encoders[col].fit_transform(df_clean[col].astype(str))
            else:
                df_clean[col] = self.encoders[col].transform(df_clean[col].astype(str))
                
        # Scale Numerical
        numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
        if not numeric_cols.empty:
            df_clean[numeric_cols] = self.scaler.fit_transform(df_clean[numeric_cols])
            
        return df_clean

    def detect(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Detects anomalies using Isolation Forest.
        Returns indices of anomalies and their scores.
        """
        if df.empty:
            return {"anomalies": [], "scores": []}

        # Preprocess
        X = self.preprocess(df)
        
        # Fit & Predict
        self.model.fit(X)
        predictions = self.model.predict(X) 
        scores = self.model.decision_function(X) # Higher is better (normal), lower is anomaly
        
        # Extract Anomalies (-1 is anomaly)
        anomaly_indices = np.where(predictions == -1)[0].tolist()
        
        # Explanation logic (simplified feature importance for now)
        # For real explainability, we'd use SHAP here
        
        return {
            "anomaly_count": len(anomaly_indices),
            "anomaly_indices": anomaly_indices,
            "anomaly_scores": scores.tolist(),
            "contamination": self.model.contamination
        }

    def explain(self, df: pd.DataFrame, indices: List[int]) -> List[Dict[str, Any]]:
        """
        Generate simple explanations for specific anomaly indices.
        (Placeholder for full SHAP implementation)
        """
        explanations = []
        if not indices:
            return []
            
        # Simplified: Compare anomaly row against mean of normal data
        # In production, use SHAP KernelExplainer
        
        normal_mask = np.ones(len(df), dtype=bool)
        normal_mask[indices] = False
        normal_df = df[normal_mask]
        means = normal_df.select_dtypes(include=[np.number]).mean()
        
        for idx in indices:
            row = df.iloc[idx]
            reasons = []
            
            for col in means.index:
                val = row[col]
                mean_val = means[col]
                std_val = normal_df[col].std()
                if std_val == 0: continue
                
                z_score = (val - mean_val) / std_val
                if abs(z_score) > 2: # Significant deviation
                    direction = "High" if z_score > 0 else "Low"
                    reasons.append({
                        "feature": col,
                        "value": float(val),
                        "expected": float(mean_val),
                        "deviation": f"{direction} ({z_score:.1f}σ)"
                    })
            
            explanations.append({
                "index": idx,
                "reasons": reasons
            })
            
        return explanations
