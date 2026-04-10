"""
Train and compare regression models; persist best model bundle.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor

from app.ml.preprocess import build_feature_matrix, make_preprocessor


@dataclass
class ModelResult:
    name: str
    r2: float
    mae: float
    rmse: float


def train_models(
    df: pd.DataFrame,
    target: str,
    random_state: int = 42,
) -> dict[str, Any]:
    X_df, numeric_cols, categorical_cols, date_col, y = build_feature_matrix(
        df, target
    )
    if len(y) < 30:
        raise ValueError(
            "Not enough rows with a valid target after cleaning. "
            "Need at least 30 rows."
        )

    preprocessor = make_preprocessor(numeric_cols, categorical_cols)
    X_train, X_test, y_train, y_test = train_test_split(
        X_df,
        y,
        test_size=0.2,
        random_state=random_state,
    )

    estimators = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(
            random_state=random_state, max_depth=12
        ),
        "Random Forest": RandomForestRegressor(
            n_estimators=120,
            random_state=random_state,
            max_depth=16,
            n_jobs=-1,
        ),
    }

    results: list[ModelResult] = []
    fitted: dict[str, Pipeline] = {}

    for name, est in estimators.items():
        pipe = Pipeline(
            [
                ("prep", preprocessor),
                ("model", est),
            ]
        )
        pipe.fit(X_train, y_train)
        pred = pipe.predict(X_test)
        r2 = float(r2_score(y_test, pred))
        mae = float(mean_absolute_error(y_test, pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, pred)))
        results.append(ModelResult(name=name, r2=r2, mae=mae, rmse=rmse))
        fitted[name] = pipe

    best = max(results, key=lambda r: r.r2)
    best_pipe = fitted[best.name]
    rf_pipe = fitted.get("Random Forest")

    return {
        "target": target,
        "numeric_features": numeric_cols,
        "categorical_features": categorical_cols,
        "date_column": date_col,
        "n_rows": int(len(y)),
        "results": [r.__dict__ for r in results],
        "best_model_name": best.name,
        "pipeline": best_pipe,
        "rf_pipeline": rf_pipe,
        "test_y": y_test,
        "test_pred": best_pipe.predict(X_test),
    }


def predict_price(
    pipeline: Pipeline,
    row: dict[str, Any],
    feature_columns: list[str],
) -> float:
    """Single-row prediction from raw feature dict."""
    X = pd.DataFrame([row])
    for c in feature_columns:
        if c not in X.columns:
            X[c] = np.nan
    X = X[feature_columns]
    return float(pipeline.predict(X)[0])


def save_bundle(path: str, bundle: dict[str, Any]) -> None:
    joblib.dump(bundle, path)


def load_bundle(path: str) -> dict[str, Any]:
    return joblib.load(path)
