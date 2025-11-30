import os
import shutil
import ssl
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import requests
import yfinance as yf
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# --- ML Imports ---
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from xgboost import XGBRegressor

# Attempt to import TensorFlow, handle gracefully if missing
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Dense, LSTM, Dropout
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("⚠️ TensorFlow not found. LSTM features will be disabled.")

# ------------------ Configuration ------------------
ssl._create_default_https_context = ssl._create_unverified_context
ALPHAVANTAGE_KEY = os.getenv("ALPHAVANTAGE_API_KEY")

# ------------------ FastAPI App ------------------
app = FastAPI(title="Advanced Stock Predictor AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ Helper Functions ------------------

def clear_yfinance_cache():
    """Forcefully removes the yfinance cache directory."""
    cache_locations = [
        os.path.join(os.path.expanduser("~"), ".cache", "py-yfinance"),
        os.path.join(os.path.expanduser("~"), "AppData", "Local", "py-yfinance"),
    ]
    for path in cache_locations:
        if os.path.exists(path):
            try:
                shutil.rmtree(path)
            except Exception:
                pass

def sanitize_float(value):
    """Safely convert numpy floats/NaNs to standard Python floats or None."""
    if pd.isna(value) or value is None or np.isinf(value):
        return None
    return float(value)

# ------------------ Technical Indicators ------------------

def add_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Adds RSI, MACD, and Moving Averages for better ML Accuracy."""
    df = df.copy()

    # Simple Moving Averages
    df['MA_50'] = df['Close'].rolling(window=50).mean()
    df['MA_200'] = df['Close'].rolling(window=200).mean()

    # RSI (Relative Strength Index) - 14 periods
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))

    # MACD
    exp1 = df['Close'].ewm(span=12, adjust=False).mean()
    exp2 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = exp1 - exp2

    # Fill NaN values created by indicators to avoid ML crashes
    df = df.bfill().ffill()
    return df

# ------------------ Data Fetching ------------------

def fetch_stock_data(symbol: str, interval: str = "1d") -> pd.DataFrame:
    """
    Fetches stock data based on the requested interval.
    Supported intervals: 5m, 15m, 1h, 1d, 1wk, 1mo
    """
    symbol = symbol.upper()

    # Mapping custom intervals to yfinance format
    # Note: 4h is not standard in yf, we use 1h and can resample if needed,
    # but for simplicity, we map 4h -> 1h (or you can request '60m')
    interval_map = {
        "5m": "5m", "15m": "15m", "30m": "30m",
        "1h": "60m", "4h": "60m", # Fallback 4h to 1h data
        "1d": "1d", "1wk": "1wk", "1mo": "1mo"
    }

    yf_interval = interval_map.get(interval, "1d")

    # Determine lookback period based on interval
    # YFinance limits: 1m (7 days), 5m-30m (60 days), 1h (730 days)
    if yf_interval in ["5m", "15m", "30m"]:
        period = "59d" # Max for short intraday
    elif yf_interval == "60m":
        period = "720d" # Max for hourly
    else:
        period = "5y" # Daily/Weekly/Monthly

    print(f"🔍 Fetching {symbol} | Interval: {yf_interval} | Period: {period}")

    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=yf_interval)

        if df.empty:
            raise ValueError(f"No data found for {symbol} at {interval}")

        # Remove timezone
        if df.index.tz is not None:
            df.index = df.index.tz_localize(None)

        # Basic cleaning
        df = df[['Open', 'High', 'Low', 'Close', 'Volume']]

        # If user wanted 4h, we resample the 1h data
        if interval == "4h":
            df = df.resample("4h").agg({
                'Open': 'first', 'High': 'max', 'Low': 'min', 'Close': 'last', 'Volume': 'sum'
            }).dropna()

        return df

    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        raise HTTPException(status_code=404, detail=f"Could not fetch data: {str(e)}")

# ------------------ ML Prediction Engines ------------------

def run_prediction_models(df: pd.DataFrame):
    """
    Runs Linear Regression, XGBoost, and LSTM to predict the NEXT candle's close.
    """
    # 1. Prepare Data
    df_ml = add_technical_indicators(df).dropna()

    # Feature columns
    features = ['Open', 'High', 'Low', 'Volume', 'MA_50', 'MA_200', 'RSI', 'MACD']
    # Target: The Close price of the NEXT time step
    df_ml['Target'] = df_ml['Close'].shift(-1)

    # Drop the last row because it has no target (NaN)
    data_for_training = df_ml.dropna()

    if len(data_for_training) < 50:
        return {"error": "Not enough data points for high-accuracy training"}

    X = data_for_training[features].values
    y = data_for_training['Target'].values

    # The most recent data point (to predict the future)
    last_row = df_ml.iloc[[-1]][features].values

    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    predictions = {}

    # --- Model 1: Linear Regression (Baseline) ---
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    lr_pred = lr.predict(last_row)[0]
    predictions['LinearRegression'] = lr_pred

    # --- Model 2: XGBoost (High Accuracy Tree) ---
    xgb = XGBRegressor(n_estimators=100, learning_rate=0.05, objective='reg:squarederror')
    xgb.fit(X_train, y_train)
    xgb_pred = xgb.predict(last_row)[0]
    predictions['XGBoost'] = float(xgb_pred)

    # --- Model 3: LSTM (Deep Learning) ---
    lstm_pred = None
    if TF_AVAILABLE:
        try:
            # Scale data for LSTM
            scaler = MinMaxScaler(feature_range=(0, 1))
            scaled_data = scaler.fit_transform(X)

            # Reshape for LSTM [samples, time steps, features]
            # using 1 time step for simple next-step prediction
            X_lstm = scaled_data.reshape((scaled_data.shape[0], 1, scaled_data.shape[1]))
            y_lstm = y # Target doesn't need scaling strictly if we inverse transform, but let's keep it simple

            # Build tiny LSTM
            model = Sequential()
            model.add(LSTM(50, return_sequences=False, input_shape=(1, len(features))))
            model.add(Dense(25))
            model.add(Dense(1))

            model.compile(optimizer='adam', loss='mean_squared_error')
            # Low epochs to prevent API timeout
            model.fit(X_lstm, y_lstm, batch_size=1, epochs=3, verbose=0)

            # Predict
            last_scaled = scaler.transform(last_row)
            last_reshaped = last_scaled.reshape((1, 1, len(features)))
            lstm_result = model.predict(last_reshaped, verbose=0)
            lstm_pred = float(lstm_result[0][0])
            predictions['LSTM'] = lstm_pred

        except Exception as e:
            print(f"LSTM Error: {e}")
            predictions['LSTM'] = "Failed"

    # --- Ensemble (Average) ---
    valid_preds = [p for p in [lr_pred, xgb_pred, lstm_pred] if isinstance(p, (int, float))]
    avg_price = sum(valid_preds) / len(valid_preds) if valid_preds else 0

    return {
        "models": predictions,
        "ensemble_prediction": avg_price,
        "accuracy_note": "Predictions are for the CLOSE price of the NEXT time interval."
    }

# ------------------ API Endpoints ------------------

# ------------------ API Endpoints ------------------

@app.on_event("startup")
async def startup_event():
    clear_yfinance_cache()

@app.get("/")
def root():
    return {"status": "ok", "message": "Advanced Stock AI is running"}

# --- PASTE HERE ---
@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.now().isoformat()}
# ------------------

@app.get("/api/stock/{symbol}")
# ... rest of the code ...
def get_stock_data(
    symbol: str,
    interval: str = Query("1d", description="5m, 15m, 1h, 4h, 1d, 1wk, 1mo")
):
    """
    Fetch historical data with technical indicators.
    """
    try:
        df = fetch_stock_data(symbol, interval)
        df = add_technical_indicators(df)

        # Format for JSON
        df_clean = df.replace([np.inf, -np.inf], np.nan)
        df_clean = df_clean.where(pd.notnull(df_clean), None)

        payload = {
            "symbol": symbol.upper(),
            "interval": interval,
            "data": []
        }

        # Limit response size for performance (last 500 records)
        tail_df = df_clean.tail(500)

        for index, row in tail_df.iterrows():
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
    interval: str = Query("1d", description="Timeframe for prediction: 5m, 15m, 1h, 1d")
):
    """
    Trains Linear Regression, XGBoost, and LSTM on the fly to predict the NEXT candle.
    """
    try:
        df = fetch_stock_data(symbol, interval)
        prediction_result = run_prediction_models(df)

        current_price = df['Close'].iloc[-1]
        predicted_price = prediction_result['ensemble_prediction']

        direction = "UP" if predicted_price > current_price else "DOWN"
        pct_change = ((predicted_price - current_price) / current_price) * 100

        return {
            "symbol": symbol.upper(),
            "interval": interval,
            "current_price": sanitize_float(current_price),
            "predicted_next_close": sanitize_float(predicted_price),
            "direction": direction,
            "expected_change_pct": f"{pct_change:.2f}%",
            "details": prediction_result
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
