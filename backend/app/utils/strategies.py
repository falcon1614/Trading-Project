import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVR
from sklearn.neighbors import KNeighborsRegressor
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings
warnings.filterwarnings("ignore")

# ---------------------- Statistical ----------------------
def strategy_arima(df):
    """ARIMA(5,1,0) on closing prices."""
    series = df['Close'].values
    try:
        model = ARIMA(series, order=(5,1,0))
        model_fit = model.fit()
        pred = model_fit.forecast(steps=1)[0]
        return float(pred)
    except:
        return np.nan

def strategy_ets(df):
    """Exponential smoothing (Holt‑Winters)."""
    series = df['Close'].values
    try:
        model = ExponentialSmoothing(series, trend='add', seasonal=None)
        model_fit = model.fit()
        pred = model_fit.forecast(1)[0]
        return float(pred)
    except:
        return np.nan

# ---------------------- Machine Learning ----------------------
def _prepare_ml_data(df):
    """Shared feature/target preparation for ML models."""
    df_ml = df.copy()
    features = ['Open','High','Low','Volume','MA_10','MA_50','MA_200','RSI','MACD','Volatility']
    df_ml['Target'] = df_ml['Close'].shift(-1)
    train_data = df_ml.dropna()
    if len(train_data) < 30:
        return None, None, None
    X = train_data[features].values
    y = train_data['Target'].values
    last_row = df_ml.iloc[[-1]][features].values
    return X, y, last_row

def strategy_linear(df):
    X, y, last = _prepare_ml_data(df)
    if X is None: return np.nan
    model = LinearRegression()
    model.fit(X, y)
    return float(model.predict(last)[0])

def strategy_ridge(df):
    X, y, last = _prepare_ml_data(df)
    if X is None: return np.nan
    model = Ridge(alpha=1.0)
    model.fit(X, y)
    return float(model.predict(last)[0])

def strategy_lasso(df):
    X, y, last = _prepare_ml_data(df)
    if X is None: return np.nan
    model = Lasso(alpha=0.01)
    model.fit(X, y)
    return float(model.predict(last)[0])

def strategy_rf(df):
    X, y, last = _prepare_ml_data(df)
    if X is None: return np.nan
    model = RandomForestRegressor(n_estimators=50, max_depth=5)
    model.fit(X, y)
    return float(model.predict(last)[0])

def strategy_xgb(df):
    X, y, last = _prepare_ml_data(df)
    if X is None: return np.nan
    model = XGBRegressor(n_estimators=50, learning_rate=0.1)
    model.fit(X, y)
    return float(model.predict(last)[0])

def strategy_lgbm(df):
    X, y, last = _prepare_ml_data(df)
    if X is None: return np.nan
    model = LGBMRegressor(n_estimators=50, learning_rate=0.1, verbose=-1)
    model.fit(X, y)
    return float(model.predict(last)[0])

def strategy_svr(df):
    X, y, last = _prepare_ml_data(df)
    if X is None: return np.nan
    model = SVR(kernel='rbf', C=100)
    model.fit(X, y)
    return float(model.predict(last)[0])

def strategy_knn(df):
    X, y, last = _prepare_ml_data(df)
    if X is None: return np.nan
    model = KNeighborsRegressor(n_neighbors=5)
    model.fit(X, y)
    return float(model.predict(last)[0])

# ---------------------- Technical ----------------------
def strategy_ma_crossover(df):
    """If MA_10 > MA_50 → up, else down. Use last change as magnitude."""
    last_close = df['Close'].iloc[-1]
    last_ma10 = df['MA_10'].iloc[-1]
    last_ma50 = df['MA_50'].iloc[-1]
    if pd.isna(last_ma10) or pd.isna(last_ma50):
        return np.nan
    direction = 1 if last_ma10 > last_ma50 else -1
    avg_change = df['Close'].pct_change().rolling(5).mean().iloc[-1]
    return last_close * (1 + direction * abs(avg_change))

def strategy_rsi_reversal(df):
    """If RSI < 30 → oversold, predict up; if RSI > 70 → overbought, predict down."""
    last_rsi = df['RSI'].iloc[-1]
    last_close = df['Close'].iloc[-1]
    if pd.isna(last_rsi):
        return np.nan
    avg_volatility = df['Volatility'].iloc[-1] if not pd.isna(df['Volatility'].iloc[-1]) else 0.01
    if last_rsi < 30:
        return last_close * (1 + avg_volatility)
    elif last_rsi > 70:
        return last_close * (1 - avg_volatility)
    else:
        return last_close * (1 + np.random.randn() * avg_volatility * 0.1)  # fallback

def strategy_bollinger(df):
    """If close < lower band → bounce up; if close > upper band → pull down."""
    last_close = df['Close'].iloc[-1]
    last_lower = df['BB_lower'].iloc[-1]
    last_upper = df['BB_upper'].iloc[-1]
    if pd.isna(last_lower) or pd.isna(last_upper):
        return np.nan
    avg_vol = df['Volatility'].iloc[-1] if not pd.isna(df['Volatility'].iloc[-1]) else 0.01
    if last_close < last_lower:
        return last_close * (1 + avg_vol)
    elif last_close > last_upper:
        return last_close * (1 - avg_vol)
    else:
        return last_close * (1 + np.random.randn() * avg_vol * 0.1)

# ---------------------- Deep Learning (if TF available) ----------------------
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    TF_AVAILABLE = True
except:
    TF_AVAILABLE = False

def strategy_lstm(df):
    if not TF_AVAILABLE:
        return np.nan
    X, y, last = _prepare_ml_data(df)
    if X is None or len(X) < 30:
        return np.nan
    from sklearn.preprocessing import MinMaxScaler
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    last_scaled = scaler.transform(last)
    X_lstm = X_scaled.reshape((X_scaled.shape[0], 1, X_scaled.shape[1]))
    last_lstm = last_scaled.reshape((1, 1, X_scaled.shape[1]))

    model = Sequential()
    model.add(LSTM(32, return_sequences=False, input_shape=(1, X_scaled.shape[1])))
    model.add(Dense(16))
    model.add(Dense(1))
    model.compile(optimizer='adam', loss='mse')
    model.fit(X_lstm, y, epochs=5, batch_size=8, verbose=0)
    pred = model.predict(last_lstm, verbose=0)[0,0]
    return float(pred)

# ---------------------- Ensemble Helpers ----------------------
def strategy_mean_of_all(df):
    """Average of all other strategies (excluding itself)."""
    # This will be called by the ensemble manager later
    pass

# List of all strategy functions (excluding the ensemble itself)
ALL_STRATEGIES = [
    strategy_arima,
    strategy_ets,
    strategy_linear,
    strategy_ridge,
    strategy_lasso,
    strategy_rf,
    strategy_xgb,
    strategy_lgbm,
    strategy_svr,
    strategy_knn,
    strategy_ma_crossover,
    strategy_rsi_reversal,
    strategy_bollinger,
]
if TF_AVAILABLE:
    ALL_STRATEGIES.append(strategy_lstm)

# We have 14+ strategies, easily expandable to 20+ by adding more (Prophet, GARCH, etc.)
