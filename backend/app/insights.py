"""Business-facing insight strings with chart references."""
from __future__ import annotations

from typing import Any


def build_insights(analytics: dict[str, Any], best_model: str | None) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    uni = analytics.get("univariate", {})
    price_u = uni.get("price", {})
    loc_rows = analytics.get("avg_by_location", [])
    corr = analytics.get("correlation_with_price", [])
    outliers = analytics.get("outliers", {})

    if price_u:
        out.append(
            {
                "title": "Price level and spread",
                "summary": (
                    f"Listing prices average ${price_u.get('mean', 0):,.0f} with a median of "
                    f"${price_u.get('median', 0):,.0f}. The range spans "
                    f"${price_u.get('min', 0):,.0f} to ${price_u.get('max', 0):,.0f}, indicating "
                    "segment diversity across the portfolio."
                ),
                "chart_ref": "Histogram — Price distribution",
            }
        )

    if loc_rows:
        top = loc_rows[0]
        bottom = loc_rows[-1]
        out.append(
            {
                "title": "Location-based pricing",
                "summary": (
                    f"Highest average price appears in {top.get('location')} "
                    f"(${top.get('avg_price', 0):,.0f} across {int(top.get('listings', 0))} listings). "
                    f"The most affordable average is {bottom.get('location')} "
                    f"(${bottom.get('avg_price', 0):,.0f})."
                ),
                "chart_ref": "Bar chart — Average price by location",
            }
        )

    if corr:
        top_f = corr[0]["feature"] if corr else ""
        out.append(
            {
                "title": "Drivers correlated with price",
                "summary": (
                    f"The strongest linear relationships with price are led by {top_f} "
                    f"(r={corr[0]['correlation']:.3f}). "
                    "Use the correlation heatmap to compare all numeric attributes jointly."
                ),
                "chart_ref": "Heatmap — Correlation matrix",
            }
        )

    pct = outliers.get("pct", 0)
    out.append(
        {
            "title": "Outlier profile (IQR rule)",
            "summary": (
                f"Approximately {pct:.1f}% of listings fall outside the interquartile fence "
                f"(${outliers.get('lower_bound', 0):,.0f} – ${outliers.get('upper_bound', 0):,.0f}). "
                "These may represent luxury units, data errors, or distressed sales."
            ),
            "chart_ref": "Box context — Price distribution & KPI cards",
        }
    )

    if best_model:
        out.append(
            {
                "title": "Model selection",
                "summary": (
                    f"The model with the strongest hold-out R² ({best_model.replace('_', ' ')}) is used for live estimates. "
                    "Compare Linear Regression, Decision Tree, and Random Forest metrics in the leaderboard."
                ),
                "chart_ref": "Model comparison table",
            }
        )

    return out
