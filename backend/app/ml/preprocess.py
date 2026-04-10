"""
Preprocessing: missing values, encoding, scaling — sklearn pipelines.
"""

from __future__ import annotations

from typing import Any, Optional

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.ml.schema import infer_date_column


def _one_hot_encoder() -> OneHotEncoder:
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


def build_feature_matrix(
    df: pd.DataFrame,
    target: str,
    max_categories: int = 25,
) -> tuple[pd.DataFrame, list[str], list[str], Optional[str], np.ndarray]:
    """
    Returns X dataframe (without target), numeric_cols, categorical_cols, date_col.
    Drops rows where target is missing. Caps high-cardinality categoricals.
    """
    if target not in df.columns:
        raise ValueError(f"Target column '{target}' not in data.")
    work = df.dropna(subset=[target]).copy()
    date_col = infer_date_column(work)
    feature_cols = [c for c in work.columns if c != target]

    numeric: list[str] = []
    categorical: list[str] = []
    for c in feature_cols:
        if c == date_col:
            continue
        if pd.api.types.is_numeric_dtype(work[c]):
            numeric.append(c)
        else:
            nunique = work[c].nunique(dropna=True)
            if nunique <= max_categories:
                categorical.append(c)
            else:
                # High cardinality string: try label frequency or drop from model
                # For robustness, skip from tree/linear or hash — skip for clarity
                pass

    X = work[[c for c in numeric + categorical]]
    y = work[target].values
    return X, numeric, categorical, date_col, y


def make_preprocessor(
    numeric_cols: list[str],
    categorical_cols: list[str],
) -> ColumnTransformer:
    num_pipe = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    cat_pipe = Pipeline(
        [
            (
                "imputer",
                SimpleImputer(strategy="most_frequent"),
            ),
            ("onehot", _one_hot_encoder()),
        ]
    )
    transformers: list[tuple[str, Any, list[str]]] = []
    if numeric_cols:
        transformers.append(("num", num_pipe, numeric_cols))
    if categorical_cols:
        transformers.append(("cat", cat_pipe, categorical_cols))
    if not transformers:
        raise ValueError("No usable feature columns after preprocessing.")
    return ColumnTransformer(transformers, remainder="drop")
