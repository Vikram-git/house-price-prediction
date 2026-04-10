"""
Standalone training script. Loads CSV/Excel, trains all models, saves the best.
Usage:
  cd backend
  py -3 train_models.py --data ..\\sample_data\\houses.csv
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from app.ml.pipeline import load_dataset, train_all


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument(
        "--data",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "sample_data" / "houses.csv",
        help="Path to CSV or Excel file",
    )
    args = p.parse_args()
    if not args.data.exists():
        raise SystemExit(f"File not found: {args.data}")
    df = load_dataset(args.data)
    meta = train_all(df)
    print("Best model:", meta["best_model"])
    for m in meta["metrics"]:
        print(
            f"  {m['name']}: R²={m['r2']:.4f} MAE={m['mae']:.2f} RMSE={m['rmse']:.2f}"
        )


if __name__ == "__main__":
    main()
