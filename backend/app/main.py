from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pandas as pd
import numpy as np

from app.utils.data_fetcher import fetch_stock_data, clear_yfinance_cache
from app.utils.indicators import add_technical_indicators
from app.utils.ensemble import get_all_predictions, ensemble_prediction, cluster_predictions
from app.utils.clustering import detect_regimes
from app.utils.helpers import sanitize_float

app = FastAPI(title="Advanced Stock Predictor AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    clear_yfinance_cache()
    # Optional: preload models here

@app.get("/")
def root():
    return {"status": "ok", "message": "Advanced Stock AI is running"}

@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.now().isoformat()}

@app.get("/api/stock/{symbol}")
def get_stock_data(
    symbol: str,
    interval: str = Query("1d", description="5m,15m,1h,4h,1d,1wk,1mo")
):
    try:
        df = fetch_stock_data(symbol, interval)
        df = add_technical_indicators(df)
        df_clean = df.replace([np.inf, -np.inf], np.nan)
        df_clean = df_clean.where(pd.notnull(df_clean), None)
        payload = {"symbol": symbol.upper(), "interval": interval, "data": []}
        for index, row in df_clean.tail(500).iterrows():
            payload["data"].append({
                "date": index.isoformat(),
                "open": sanitize_float(row['Open']),
                "high": sanitize_float(row['High']),
                "low": sanitize_float(row['Low']),
                "close": sanitize_float(row['Close']),
                "volume": sanitize_float(row['Volume']),
                "rsi": sanitize_float(row.get('RSI')),
                "macd": sanitize_float(row.get('MACD')),
                "ma_50": sanitize_float(row.get('MA_50'))
            })
        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predict/{symbol}")
def predict_stock_price(
    symbol: str,
    interval: str = Query("1d", description="5m,15m,1h,1d")
):
    try:
        df = fetch_stock_data(symbol, interval)
        df = add_technical_indicators(df)

        # 1. Get predictions from all strategies
        raw_preds = get_all_predictions(df)
        if not raw_preds:
            raise HTTPException(status_code=500, detail="No strategy could produce a prediction")

        # 2. Optional: cluster predictions to remove outliers
        clustered_preds, cluster_model = cluster_predictions(raw_preds, n_clusters=3)

        # 3. Ensemble final prediction
        final_pred = ensemble_prediction(clustered_preds, method='trimmed')

        # 4. Regime detection (for information)
        regimes, kmeans, scaler = detect_regimes(df, n_clusters=3)
        current_regime = int(regimes.iloc[-1]) if regimes is not None and not pd.isna(regimes.iloc[-1]) else None

        current_price = df['Close'].iloc[-1]
        direction = "UP" if final_pred > current_price else "DOWN"
        pct_change = ((final_pred - current_price) / current_price) * 100

        return {
            "symbol": symbol.upper(),
            "interval": interval,
            "current_price": sanitize_float(current_price),
            "predicted_next_close": sanitize_float(final_pred),
            "direction": direction,
            "expected_change_pct": f"{pct_change:.2f}%",
            "details": {
                "num_strategies": len(raw_preds),
                "strategies_used": list(raw_preds.keys()),
                "cluster_regime": current_regime,
                "ensemble_method": "trimmed mean after clustering",
                "raw_predictions": {k: sanitize_float(v) for k, v in raw_preds.items()}
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
