"""
Training and inference pipeline: preprocessing, multiple regressors, metrics, artifacts.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeRegressor

REQUIRED_COLUMNS = {
    "price",
    "location",
    "property_type",
    "bedrooms",
    "bathrooms",
    "sqft_living",
    "year_built",
    "lot_size",
}

CATEGORICAL = ["location", "property_type"]
NUMERIC = ["bedrooms", "bathrooms", "sqft_living", "year_built", "lot_size"]
TARGET = "price"


@dataclass
class ModelMetrics:
    name: str
    r2: float
    mae: float
    rmse: float


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out.columns = [str(c).strip().lower().replace(" ", "_") for c in out.columns]
    return out


def load_dataset(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        df = pd.read_csv(path)
    elif suffix in (".xlsx", ".xls"):
        df = pd.read_excel(path, engine="openpyxl" if suffix == ".xlsx" else None)
    else:
        raise ValueError("Unsupported file type. Use CSV or Excel.")
    df = _normalize_columns(df)
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    for col in REQUIRED_COLUMNS:
        if col in CATEGORICAL:
            df[col] = df[col].astype(str).str.strip()
        else:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=list(REQUIRED_COLUMNS))
    if len(df) < 20:
        raise ValueError("Need at least 20 complete rows after cleaning.")
    return df.reset_index(drop=True)


def _one_hot() -> OneHotEncoder:
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


def build_preprocessor() -> ColumnTransformer:
    cat_pipe = Pipeline(
        steps=[
            ("encoder", _one_hot()),
        ]
    )
    num_pipe = Pipeline(steps=[("scaler", StandardScaler())])
    return ColumnTransformer(
        transformers=[
            ("cat", cat_pipe, CATEGORICAL),
            ("num", num_pipe, NUMERIC),
        ]
    )


def train_all(df: pd.DataFrame) -> dict[str, Any]:
    X = df[CATEGORICAL + NUMERIC]
    y = df[TARGET].astype(float)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    models = {
        "linear_regression": LinearRegression(),
        "decision_tree": DecisionTreeRegressor(random_state=42, max_depth=12),
        "random_forest": RandomForestRegressor(
            n_estimators=200, random_state=42, max_depth=15, n_jobs=-1
        ),
    }

    results: list[ModelMetrics] = []
    fitted: dict[str, Pipeline] = {}

    for name, est in models.items():
        pipe = Pipeline(steps=[("prep", build_preprocessor()), ("model", est)])
        pipe.fit(X_train, y_train)
        pred = pipe.predict(X_test)
        results.append(
            ModelMetrics(
                name=name,
                r2=float(r2_score(y_test, pred)),
                mae=float(mean_absolute_error(y_test, pred)),
                rmse=float(np.sqrt(mean_squared_error(y_test, pred))),
            )
        )
        fitted[name] = pipe

    best = max(results, key=lambda m: m.r2)
    artifact_dir = Path(__file__).resolve().parent.parent.parent / "data"
    artifact_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(fitted[best.name], artifact_dir / "best_model.joblib")

    meta = {
        "best_model": best.name,
        "metrics": [asdict(m) for m in results],
        "feature_columns": CATEGORICAL + NUMERIC,
        "categorical": CATEGORICAL,
        "numeric": NUMERIC,
    }
    (artifact_dir / "training_meta.json").write_text(json.dumps(meta, indent=2))
    return meta


def load_trained_model() -> tuple[Any, dict]:
    artifact_dir = Path(__file__).resolve().parent.parent.parent / "data"
    model = joblib.load(artifact_dir / "best_model.joblib")
    meta = json.loads((artifact_dir / "training_meta.json").read_text())
    return model, meta


def predict_row(model: Any, row: dict[str, Any]) -> float:
    X = pd.DataFrame([row])
    return float(model.predict(X)[0])


def compute_analytics(df: pd.DataFrame) -> dict[str, Any]:
    """Univariate, bivariate, multivariate summaries for API and charts."""
    d = df.copy()
    numeric = d[NUMERIC + [TARGET]]

    univariate = {
        "price": {
            "mean": float(d[TARGET].mean()),
            "std": float(d[TARGET].std()),
            "min": float(d[TARGET].min()),
            "max": float(d[TARGET].max()),
            "median": float(d[TARGET].median()),
        }
    }
    for c in NUMERIC:
        univariate[c] = {
            "mean": float(d[c].mean()),
            "std": float(d[c].std()),
            "min": float(d[c].min()),
            "max": float(d[c].max()),
        }

    corr_matrix = numeric.corr()
    price_corr = corr_matrix[TARGET].drop(TARGET).sort_values(ascending=False)
    correlation_top = [
        {"feature": str(idx), "correlation": float(val)} for idx, val in price_corr.items()
    ]

    location_avg = (
        d.groupby("location", observed=False)[TARGET]
        .agg(["mean", "count"])
        .reset_index()
        .rename(columns={"mean": "avg_price", "count": "listings"})
        .sort_values("avg_price", ascending=False)
    )
    type_avg = (
        d.groupby("property_type", observed=False)[TARGET]
        .mean()
        .reset_index()
        .rename(columns={TARGET: "avg_price"})
    )

    q1 = d[TARGET].quantile(0.25)
    q3 = d[TARGET].quantile(0.75)
    iqr = q3 - q1
    low = q1 - 1.5 * iqr
    high = q3 + 1.5 * iqr
    outliers = d[(d[TARGET] < low) | (d[TARGET] > high)]

    return {
        "univariate": univariate,
        "correlation_matrix": corr_matrix.round(4).to_dict(),
        "correlation_with_price": correlation_top,
        "avg_by_location": location_avg.to_dict(orient="records"),
        "avg_by_property_type": type_avg.to_dict(orient="records"),
        "outliers": {
            "count": int(len(outliers)),
            "lower_bound": float(low),
            "upper_bound": float(high),
            "pct": float(100 * len(outliers) / len(d)),
        },
        "listings_total": int(len(d)),
    }


def feature_importance_if_available(model: Any) -> list[dict[str, Any]]:
    """RandomForest exposes feature_importances_; others return empty."""
    try:
        est = model.named_steps["model"]
        prep = model.named_steps["prep"]
        if hasattr(est, "feature_importances_"):
            names = prep.get_feature_names_out()
            imp = est.feature_importances_
            pairs = sorted(
                zip(names, imp), key=lambda x: x[1], reverse=True
            )[:12]
            return [{"feature": str(a), "importance": float(b)} for a, b in pairs]
    except Exception:
        pass
    return []
