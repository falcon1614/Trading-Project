import os
import shutil
import ssl
import pandas as pd
import yfinance as yf
from fastapi import HTTPException

ssl._create_default_https_context = ssl._create_unverified_context

def clear_yfinance_cache():
    cache_dirs = [
        os.path.join(os.path.expanduser("~"), ".cache", "py-yfinance"),
        os.path.join(os.path.expanduser("~"), "AppData", "Local", "py-yfinance")
    ]
    for path in cache_dirs:
        if os.path.exists(path):
            try:
                shutil.rmtree(path)
            except Exception:
                pass

def fetch_stock_data(symbol: str, interval: str = "1d") -> pd.DataFrame:
    symbol = symbol.upper()
    interval_map = {
        "5m": "5m", "15m": "15m", "30m": "30m",
        "1h": "60m", "4h": "60m",  # we'll resample later
        "1d": "1d", "1wk": "1wk", "1mo": "1mo"
    }
    yf_interval = interval_map.get(interval, "1d")
    if yf_interval in ["5m","15m","30m"]:
        period = "59d"
    elif yf_interval == "60m":
        period = "720d"
    else:
        period = "5y"

    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=yf_interval)
        if df.empty:
            raise ValueError(f"No data for {symbol} at {interval}")
        if df.index.tz is not None:
            df.index = df.index.tz_localize(None)
        df = df[['Open','High','Low','Close','Volume']]

        # Resample for 4h
        if interval == "4h":
            df = df.resample("4h").agg({
                'Open':'first','High':'max','Low':'min','Close':'last','Volume':'sum'
            }).dropna()
        return df
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
