import os
import joblib
import pickle
from app.config import MODEL_DIR

def load_model(model_name: str):
    """Load a scikit‑learn / xgboost model from .pkl file."""
    path = os.path.join(MODEL_DIR, model_name)
    if not os.path.exists(path):
        return None
    try:
        return joblib.load(path)
    except:
        try:
            with open(path, 'rb') as f:
                return pickle.load(f)
        except:
            return None

def save_model(model, model_name: str):
    path = os.path.join(MODEL_DIR, model_name)
    joblib.dump(model, path)
