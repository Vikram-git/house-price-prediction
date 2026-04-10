from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.dependencies import current_user
from app.ml.pipeline import CATEGORICAL, NUMERIC, load_trained_model, predict_row

router = APIRouter(prefix="/predict", tags=["predict"])


class PredictIn(BaseModel):
    location: str = Field(..., min_length=1)
    property_type: str = Field(..., min_length=1)
    bedrooms: float = Field(..., ge=0)
    bathrooms: float = Field(..., ge=0)
    sqft_living: float = Field(..., gt=0)
    year_built: float = Field(..., ge=1800, le=2030)
    lot_size: float = Field(..., ge=0)


@router.post("/")
def predict_price(body: PredictIn, _: dict = Depends(current_user)):
    meta_path = Path(__file__).resolve().parent.parent.parent / "data" / "training_meta.json"
    if not meta_path.exists():
        raise HTTPException(
            status_code=400,
            detail="Train models after uploading data before requesting a prediction.",
        )
    row = {k: getattr(body, k) for k in CATEGORICAL + NUMERIC}
    try:
        model, _ = load_trained_model()
        price = predict_row(model, row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    return {"predicted_price": round(price, 2), "currency": "USD"}
