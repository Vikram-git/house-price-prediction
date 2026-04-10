from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.dependencies import current_user
from app.insights import build_insights
from app.ml.pipeline import (
    CATEGORICAL,
    NUMERIC,
    TARGET,
    compute_analytics,
    feature_importance_if_available,
    load_trained_model,
)
from app.state import get_frame

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardFilters(BaseModel):
    locations: list[str] | None = None
    price_min: float | None = None
    price_max: float | None = None
    property_types: list[str] | None = None


def _apply_filters(df: pd.DataFrame, f: DashboardFilters) -> pd.DataFrame:
    out = df.copy()
    if f.locations:
        out = out[out["location"].isin(f.locations)]
    if f.property_types:
        out = out[out["property_type"].isin(f.property_types)]
    if f.price_min is not None:
        out = out[out[TARGET] >= f.price_min]
    if f.price_max is not None:
        out = out[out[TARGET] <= f.price_max]
    return out


@router.post("/data")
def dashboard_data(
    filters: DashboardFilters | None = None,
    _: dict = Depends(current_user),
):
    df, _ = get_frame()
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    f = filters or DashboardFilters()
    filtered = _apply_filters(df, f)
    if len(filtered) == 0:
        raise HTTPException(status_code=400, detail="No rows match the selected filters.")

    analytics = compute_analytics(filtered)

    # Histogram — price
    hist, edges = np.histogram(filtered[TARGET].values, bins=20)
    price_histogram = {
        "bins": [{"start": float(edges[i]), "end": float(edges[i + 1]), "count": int(hist[i])} for i in range(len(hist))],
    }

    # Line — trend by year_built (binned decade)
    yb = filtered.copy()
    yb["decade"] = (yb["year_built"] // 10) * 10
    trend = (
        yb.groupby("decade", observed=False)[TARGET]
        .mean()
        .reset_index()
        .sort_values("decade")
    )
    trend_line = [{"x": int(r["decade"]), "y": float(r[TARGET])} for _, r in trend.iterrows()]

    # Pie — property type counts
    pt_counts = filtered["property_type"].value_counts()
    pie_property = [{"name": str(k), "value": int(v)} for k, v in pt_counts.items()]

    # Bar — location average price (top 12)
    loc = (
        filtered.groupby("location", observed=False)[TARGET]
        .mean()
        .sort_values(ascending=False)
        .head(12)
    )
    bar_location = [{"location": str(k), "avg_price": float(v)} for k, v in loc.items()]

    # Bivariate sample (size vs price) for scatter plot
    sample = filtered[["sqft_living", TARGET]].dropna()
    if len(sample) > 400:
        sample = sample.sample(400, random_state=1)
    bivariate_sqft_price = [
        {"sqft_living": float(r["sqft_living"]), "price": float(r[TARGET])}
        for _, r in sample.iterrows()
    ]

    kpis = {
        "average_price": float(filtered[TARGET].mean()),
        "max_price": float(filtered[TARGET].max()),
        "min_price": float(filtered[TARGET].min()),
        "total_listings": int(len(filtered)),
    }

    filter_options = {
        "locations": sorted(df["location"].unique().tolist()),
        "property_types": sorted(df["property_type"].unique().tolist()),
        "price_range": {"min": float(df[TARGET].min()), "max": float(df[TARGET].max())},
    }

    meta_path = Path(__file__).resolve().parent.parent.parent / "data" / "training_meta.json"
    best_model = None
    metrics_rows: list[dict] = []
    importance: list[dict] = []
    if meta_path.exists():
        meta = json.loads(meta_path.read_text())
        best_model = meta.get("best_model")
        metrics_rows = meta.get("metrics", [])
        try:
            model, _ = load_trained_model()
            importance = feature_importance_if_available(model)
        except Exception:
            pass

    insights = build_insights(analytics, best_model)

    return {
        "kpis": kpis,
        "filter_options": filter_options,
        "price_histogram": price_histogram,
        "trend_by_decade": trend_line,
        "pie_property_type": pie_property,
        "bar_location_avg": bar_location,
        "bivariate_sqft_price": bivariate_sqft_price,
        "multivariate_note": "Joint relationships among numeric fields are summarized in the correlation matrix.",
        "correlation_matrix": analytics["correlation_matrix"],
        "correlation_with_price": analytics["correlation_with_price"],
        "avg_by_location": analytics["avg_by_location"],
        "univariate": analytics["univariate"],
        "outliers": analytics["outliers"],
        "insights": insights,
        "feature_importance": importance,
        "best_model": best_model,
        "metrics": metrics_rows,
    }
