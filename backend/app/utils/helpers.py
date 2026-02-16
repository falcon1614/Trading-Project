import numpy as np
import pandas as pd

def sanitize_float(value):
    if pd.isna(value) or value is None or np.isinf(value):
        return None
    return float(value)
