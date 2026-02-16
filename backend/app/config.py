import os
from dotenv import load_dotenv

load_dotenv()

ALPHAVANTAGE_KEY = os.getenv("ALPHAVANTAGE_API_KEY", "")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
USE_PRETRAINED = True          # set False to force retraining
CACHE_TTL_HOURS = 24            # retrain models every 24h
