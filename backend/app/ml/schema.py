"""
Dataset profiling and messy-data repair for dynamic schema adaptation.
"""

from __future__ import annotations

import re
from typing import Any, Optional, Tuple

import numpy as np
import pandas as pd

PRICE_HINTS = (
    "price",
    "sale",
    "cost",
    "amount",
    "value",
    "asking",
    "list",
    "rent",
    "valuation",
)

DATE_HINTS = ("date", "year", "month", "time", "listed", "sold")


def _normalize_col_name(c: str) -> str:
    s = str(c).strip()
    s = re.sub(r"\s+", "_", s)
    return s


def _coerce_numeric_series(s: pd.Series) -> pd.Series:
    if pd.api.types.is_numeric_dtype(s):
        return pd.to_numeric(s, errors="coerce")
    as_str = s.astype(str).str.strip()
    as_str = as_str.str.replace(r"[$€£¥]", "", regex=True)
    as_str = as_str.str.replace(",", "", regex=False)
    as_str = as_str.replace({"nan": np.nan, "NaN": np.nan, "": np.nan, "-": np.nan})
    return pd.to_numeric(as_str, errors="coerce")


def clean_dataframe(raw: pd.DataFrame) -> Tuple[pd.DataFrame, list[str]]:
    """
    Standardize column names, drop empty columns, coerce obvious numeric columns,
    strip string whitespace. Returns (df, list of repair notes).
    """
    notes: list[str] = []
    df = raw.copy()
    df.columns = [_normalize_col_name(c) for c in df.columns]
    # Drop fully empty columns
    empty_cols = [c for c in df.columns if df[c].isna().all()]
    if empty_cols:
        df = df.drop(columns=empty_cols)
        notes.append(f"Removed {len(empty_cols)} empty column(s): {empty_cols[:8]}{'...' if len(empty_cols) > 8 else ''}")
    # Drop duplicate column names (keep first)
    if df.columns.duplicated().any():
        dup = df.columns[df.columns.duplicated()].tolist()
        df = df.loc[:, ~df.columns.duplicated()]
        notes.append(f"Removed duplicate column name(s): {dup[:5]}")
    # Coerce numeric-like object columns
    for col in df.columns:
        if df[col].dtype == object:
            sample = df[col].dropna().head(50)
            if len(sample) == 0:
                continue
            coerced = _coerce_numeric_series(df[col])
            valid_ratio = coerced.notna().sum() / max(len(df[col].dropna()), 1)
            if valid_ratio >= 0.6:
                df[col] = coerced
                notes.append(f"Column '{col}' converted to numeric (parsed currency/commas).")
    # Strip strings
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
    return df, notes


def _score_target_column(name: str) -> float:
    n = name.lower()
    score = 0.0
    for h in PRICE_HINTS:
        if h in n:
            score += 3.0
    if re.search(r"\bprice\b", n):
        score += 2.0
    if "per" in n or "sqft" in n or "m2" in n:
        score -= 1.5
    return score


def infer_target_column(df: pd.DataFrame) -> Optional[str]:
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    if not numeric_cols:
        return None
    best: Optional[str] = None
    best_score = -1.0
    for c in numeric_cols:
        non_null = df[c].dropna()
        if len(non_null) < max(10, int(0.05 * len(df))):
            continue
        sc = _score_target_column(c)
        # Prefer columns with reasonable positive spread (prices are usually > 0)
        if non_null.min() >= 0 and non_null.median() > 100:
            sc += 0.5
        if sc > best_score:
            best_score = sc
            best = c
    if best is None:
        # Fallback: numeric column with highest variance / range
        variances = []
        for c in numeric_cols:
            v = df[c].dropna()
            if len(v) < 5:
                continue
            variances.append((c, float(v.std() or 0)))
        if variances:
            best = max(variances, key=lambda x: x[1])[0]
    return best


def infer_date_column(df: pd.DataFrame) -> Optional[str]:
    for c in df.columns:
        lc = c.lower()
        if any(h in lc for h in DATE_HINTS):
            try:
                pd.to_datetime(df[c], errors="raise")
                return c
            except Exception:
                t = pd.to_datetime(df[c], errors="coerce")
                if t.notna().mean() > 0.7:
                    return c
    return None


def _is_temporal_column(series: pd.Series, name: str) -> bool:
    if "date" in name.lower() or "year" in name.lower() or "month" in name.lower():
        t = pd.to_datetime(series, errors="coerce")
        return bool(t.notna().mean() > 0.5)
    return False


def column_role_summary(df: pd.DataFrame, target: str) -> dict[str, Any]:
    roles: dict[str, Any] = {}
    for c in df.columns:
        if c == target:
            roles[c] = "target"
        elif _is_temporal_column(df[c], c):
            roles[c] = "temporal"
        elif pd.api.types.is_numeric_dtype(df[c]):
            roles[c] = "numeric_feature"
        else:
            roles[c] = "categorical_feature"
    return roles
