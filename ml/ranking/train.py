"""Learning-to-rank training script for IntelliMatch's job-match reranker.

IMPORTANT: No real labeled click/hire data exists for this project. This script
generates a clearly-documented SYNTHETIC bootstrap dataset using a heuristic
"ground truth" relevance function, then trains a LightGBM LambdaMART ranker on it.
This demonstrates the full training/eval pipeline; it is NOT a claim of real-world
model performance. Swap `synthetic_relevance()` for real labels when available.
"""
from __future__ import annotations

import json
import os

import numpy as np

try:
    import lightgbm as lgb
    HAS_LGB = True
except ImportError:
    HAS_LGB = False

FEATURE_NAMES = [
    "semantic_similarity", "skill_coverage", "required_skill_coverage",
    "experience_diff", "education_match", "project_similarity",
    "skill_gap_severity", "market_demand", "verification_score",
]

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.txt")
WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "fallback_weights.json")

# Documented heuristic weights used both as the synthetic-label generator AND
# as the closed-form fallback scorer when LightGBM isn't installed at inference time.
FALLBACK_WEIGHTS = {
    "semantic_similarity": 0.20,
    "skill_coverage": 0.22,
    "required_skill_coverage": 0.18,
    "experience_diff": 0.08,
    "education_match": 0.05,
    "project_similarity": 0.10,
    "skill_gap_severity": -0.15,
    "market_demand": 0.07,
    "verification_score": 0.10,
}


def synthetic_relevance(features: np.ndarray) -> np.ndarray:
    weights = np.array([FALLBACK_WEIGHTS[n] for n in FEATURE_NAMES])
    raw = features @ weights
    # bucket into 5 relevance grades for LambdaMART
    grades = np.clip(np.round((raw - raw.min()) / (raw.max() - raw.min() + 1e-9) * 4), 0, 4)
    return grades


def generate_synthetic_dataset(n_queries: int = 200, jobs_per_query: int = 15, seed: int = 42):
    rng = np.random.default_rng(seed)
    X, y, groups = [], [], []
    for _ in range(n_queries):
        n = jobs_per_query
        feats = rng.uniform(0, 1, size=(n, len(FEATURE_NAMES)))
        # experience_diff should range negative-positive
        exp_idx = FEATURE_NAMES.index("experience_diff")
        feats[:, exp_idx] = rng.uniform(-5, 5, size=n)
        labels = synthetic_relevance(feats)
        X.append(feats)
        y.append(labels)
        groups.append(n)
    return np.vstack(X), np.concatenate(y), groups


def ndcg_at_k(y_true, y_score, k=10):
    order = np.argsort(-y_score)[:k]
    gains = (2 ** y_true[order] - 1) / np.log2(np.arange(2, len(order) + 2))
    dcg = gains.sum()
    ideal_order = np.argsort(-y_true)[:k]
    ideal_gains = (2 ** y_true[ideal_order] - 1) / np.log2(np.arange(2, len(ideal_order) + 2))
    idcg = ideal_gains.sum()
    return float(dcg / idcg) if idcg > 0 else 0.0


def mrr(y_true, y_score):
    order = np.argsort(-y_score)
    ranked_true = y_true[order]
    for i, rel in enumerate(ranked_true):
        if rel >= 3:
            return 1.0 / (i + 1)
    return 0.0


def precision_recall_at_k(y_true, y_score, k=5, threshold=3):
    order = np.argsort(-y_score)[:k]
    relevant_retrieved = (y_true[order] >= threshold).sum()
    total_relevant = (y_true >= threshold).sum()
    precision = relevant_retrieved / k
    recall = relevant_retrieved / total_relevant if total_relevant > 0 else 0.0
    return float(precision), float(recall)


def train_and_evaluate():
    X, y, groups = generate_synthetic_dataset(n_queries=200, jobs_per_query=15)
    split = int(len(groups) * 0.8)
    train_rows = sum(groups[:split])
    X_train, y_train, groups_train = X[:train_rows], y[:train_rows], groups[:split]
    X_test, y_test, groups_test = X[train_rows:], y[train_rows:], groups[split:]

    metrics = {"ndcg@10": [], "mrr": [], "precision@5": [], "recall@5": []}

    if HAS_LGB:
        train_set = lgb.Dataset(X_train, label=y_train, group=groups_train)
        params = {
            "objective": "lambdarank", "metric": "ndcg", "ndcg_eval_at": [10],
            "learning_rate": 0.05, "num_leaves": 15, "verbose": -1,
        }
        model = lgb.train(params, train_set, num_boost_round=100)
        model.save_model(MODEL_PATH)
        preds = model.predict(X_test)
    else:
        weights = np.array([FALLBACK_WEIGHTS[n] for n in FEATURE_NAMES])
        preds = X_test @ weights
        with open(WEIGHTS_PATH, "w") as f:
            json.dump(FALLBACK_WEIGHTS, f, indent=2)

    idx = 0
    for g in groups_test:
        yt, ys = y_test[idx:idx + g], preds[idx:idx + g]
        metrics["ndcg@10"].append(ndcg_at_k(yt, ys, k=10))
        metrics["mrr"].append(mrr(yt, ys))
        p, r = precision_recall_at_k(yt, ys, k=5)
        metrics["precision@5"].append(p)
        metrics["recall@5"].append(r)
        idx += g

    summary = {k: float(np.mean(v)) for k, v in metrics.items()}
    summary["backend"] = "lightgbm" if HAS_LGB else "heuristic_fallback"
    summary["note"] = "Trained/evaluated on SYNTHETIC bootstrap data, not real hiring outcomes."
    print(json.dumps(summary, indent=2))
    return summary


if __name__ == "__main__":
    train_and_evaluate()
