"""In-memory dataset handle (single-user local deployment)."""
from __future__ import annotations

import threading
from pathlib import Path
from typing import Any

import pandas as pd

_lock = threading.Lock()
_dataset_path: Path | None = None
_df: pd.DataFrame | None = None


def set_dataset(path: Path, df: pd.DataFrame) -> None:
    global _dataset_path, _df
    with _lock:
        _dataset_path = path
        _df = df


def clear_dataset() -> None:
    global _dataset_path, _df
    with _lock:
        _dataset_path = None
        _df = None


def get_frame() -> tuple[pd.DataFrame | None, Path | None]:
    with _lock:
        if _df is None:
            return None, _dataset_path
        return _df.copy(), _dataset_path
