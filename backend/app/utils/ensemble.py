import numpy as np
from collections import defaultdict
from app.utils.strategies import ALL_STRATEGIES

def get_all_predictions(df):
    """Run all strategies and return dict of {strategy_name: prediction}."""
    predictions = {}
    for strategy in ALL_STRATEGIES:
        name = strategy.__name__
        try:
            pred = strategy(df)
            if pred is not None and not np.isnan(pred):
                predictions[name] = pred
        except Exception as e:
            # silently skip failing strategies
            pass
    return predictions

def cluster_predictions(pred_dict, n_clusters=3):
    """
    Optional: cluster the predictions themselves to reduce outlier influence.
    Returns a dict with cluster assignments and the centroid of the largest cluster.
    """
    if len(pred_dict) < n_clusters:
        return pred_dict, None
    from sklearn.cluster import KMeans
    import numpy as np
    values = np.array(list(pred_dict.values())).reshape(-1,1)
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    labels = kmeans.fit_predict(values)
    # find largest cluster
    unique, counts = np.unique(labels, return_counts=True)
    largest_cluster = unique[np.argmax(counts)]
    # return only predictions from largest cluster
    clustered = {name: pred for name, pred, lbl in zip(pred_dict.keys(), pred_dict.values(), labels) if lbl == largest_cluster}
    return clustered, kmeans

def ensemble_prediction(predictions, method='mean'):
    """Combine predictions using mean, median, or trimmed mean."""
    if not predictions:
        return None
    vals = np.array(list(predictions.values()))
    if method == 'mean':
        return float(np.mean(vals))
    elif method == 'median':
        return float(np.median(vals))
    elif method == 'trimmed':
        return float(np.mean(vals[np.abs(vals - np.mean(vals)) < 2*np.std(vals)]))
    else:
        return float(np.mean(vals))
