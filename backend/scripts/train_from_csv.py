"""
Offline training helper: load CSV, clean, train models, print metrics.

Usage:
  py scripts/train_from_csv.py path/to/data.csv
"""

import sys
from pathlib import Path

# Run from backend/: py scripts/train_from_csv.py ../data/sample_listings_messy.csv
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pandas as pd

from app.ml.schema import clean_dataframe, infer_target_column
from app.ml.train import train_models


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: py scripts/train_from_csv.py <file.csv>")
        sys.exit(1)
    path = Path(sys.argv[1])
    raw = pd.read_csv(path)
    df, notes = clean_dataframe(raw)
    target = infer_target_column(df)
    if not target:
        print("Could not infer target column.")
        sys.exit(1)
    print("Cleaning notes:", notes)
    print("Target:", target)
    out = train_models(df, target)
    print("Best model:", out["best_model_name"])
    for r in out["results"]:
        print(
            f"  {r['name']}: R2={r['r2']:.4f} MAE={r['mae']:.2f} RMSE={r['rmse']:.2f}"
        )


if __name__ == "__main__":
    main()
