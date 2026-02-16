import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
import os
from app.config import MODEL_DIR

def detect_regimes(df, n_clusters=3, retrain=False):
    """
    Cluster historical data into regimes using technical indicators.
    Returns: cluster_labels (for each row), cluster_model, scaler.
    """
    cluster_path = os.path.join(MODEL_DIR, "kmeans.pkl")
    scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")

    # Features used for clustering
    cluster_features = ['RSI', 'MACD', 'Volatility', 'MA_50', 'Volume']
    df_cluster = df[cluster_features].dropna()

    if len(df_cluster) < 50:
        return None, None, None

    if retrain or not os.path.exists(cluster_path):
        scaler = StandardScaler()
        scaled = scaler.fit_transform(df_cluster)
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        labels = kmeans.fit_predict(scaled)
        joblib.dump(kmeans, cluster_path)
        joblib.dump(scaler, scaler_path)
    else:
        kmeans = joblib.load(cluster_path)
        scaler = joblib.load(scaler_path)
        scaled = scaler.transform(df_cluster)
        labels = kmeans.predict(scaled)

    # Pad labels to match original df length (NaN where features missing)
    full_labels = pd.Series(index=df.index, dtype=float)
    full_labels.loc[df_cluster.index] = labels
    return full_labels, kmeans, scaler
