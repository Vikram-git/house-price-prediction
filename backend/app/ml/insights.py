"""
Business insights, trend analysis, outliers, feature importance summary.
"""

from __future__ import annotations

from typing import Any, Optional

import pandas as pd


def iqr_outliers(series: pd.Series) -> tuple[int, float, float]:
    s = series.dropna()
    if len(s) < 10:
        return 0, 0.0, 0.0
    q1, q3 = s.quantile(0.25), s.quantile(0.75)
    iqr = q3 - q1
    low, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    out = ((s < low) | (s > high)).sum()
    return int(out), float(low), float(high)


def build_insights(
    df: pd.DataFrame,
    target: str,
    date_col: Optional[str],
    best_model_name: str,
    metrics: list[dict[str, Any]],
    feature_importance: Optional[list[dict[str, float]]],
) -> list[dict[str, Any]]:
    insights: list[dict[str, Any]] = []
    t = df[target].dropna()
    if len(t) == 0:
        return insights

    insights.append(
        {
            "id": "kpi_overview",
            "title": "Price distribution snapshot",
            "summary": (
                f"Median price is {t.median():,.0f} with spread from "
                f"{t.min():,.0f} to {t.max():,.0f} across {len(t)} listings."
            ),
            "chart_ref": "histogram_price",
        }
    )

    if date_col and date_col in df.columns:
        d = df[[date_col, target]].dropna()
        d["_dt"] = pd.to_datetime(d[date_col], errors="coerce")
        d = d.dropna(subset=["_dt"])
        if len(d) > 5:
            monthly = d.groupby(d["_dt"].dt.to_period("M"))[target].mean()
            if len(monthly) > 1:
                direction = "up" if monthly.iloc[-1] > monthly.iloc[0] else "down"
                insights.append(
                    {
                        "id": "trend_time",
                        "title": "Temporal trend",
                        "summary": (
                            f"Average price trend over time is {direction} "
                            f"when aggregated by month ({date_col})."
                        ),
                        "chart_ref": "line_price_trend",
                    }
                )

    # Location / neighborhood column heuristic
    loc_candidates = [
        c
        for c in df.columns
        if c != target
        and any(
            x in c.lower()
            for x in ("location", "city", "area", "neigh", "zip", "region")
        )
    ]
    if loc_candidates:
        lc = loc_candidates[0]
        grp = df.groupby(lc)[target].mean().sort_values(ascending=False).head(5)
        if len(grp) > 0:
            top = grp.index[0]
            insights.append(
                {
                    "id": "location_insight",
                    "title": "Location concentration",
                    "summary": (
                        f"Highest mean price appears in '{top}' "
                        f"(column '{lc}'). Compare segments using the bar chart."
                    ),
                    "chart_ref": "bar_location",
                }
            )

    out_n, low, high = iqr_outliers(t)
    if out_n > 0:
        insights.append(
            {
                "id": "outliers",
                "title": "Outlier detection",
                "summary": (
                    f"About {out_n} listings ({100 * out_n / len(t):.1f}%) fall "
                    f"outside the IQR-based range [{low:,.0f}, {high:,.0f}]."
                ),
                "chart_ref": "histogram_price",
            }
        )

    if feature_importance:
        top_f = feature_importance[0]
        insights.append(
            {
                "id": "feature_importance",
                "title": "Drivers of price",
                "summary": (
                    f"The strongest signal in the {best_model_name} model is "
                    f"'{top_f['name']}' (relative score {top_f['value']:.3f})."
                ),
                "chart_ref": "bar_feature_importance",
            }
        )

    best_r2 = next(
        (m["r2"] for m in metrics if m["name"] == best_model_name),
        None,
    )
    if best_r2 is not None:
        insights.append(
            {
                "id": "model_quality",
                "title": "Model fit",
                "summary": (
                    f"Selected model '{best_model_name}' reached R² "
                    f"{best_r2:.3f} on held-out data — compare MAE and RMSE in "
                    f"the metrics table."
                ),
                "chart_ref": "metrics_table",
            }
        )

    return insights


def random_forest_importance(pipeline: Any) -> list[dict[str, float]]:
    """Feature importances with names from the fitted preprocessing transformer."""
    try:
        prep = pipeline.named_steps["prep"]
        model = pipeline.named_steps["model"]
        if not hasattr(model, "feature_importances_"):
            return []
        names = prep.get_feature_names_out()
        importances = model.feature_importances_
        pairs = sorted(
            zip(names, importances),
            key=lambda x: x[1],
            reverse=True,
        )[:15]
        return [{"name": str(a), "value": float(b)} for a, b in pairs]
    except Exception:
        return []
