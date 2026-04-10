import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import current_user

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/metrics")
def model_metrics(_: dict = Depends(current_user)):
    meta_path = Path(__file__).resolve().parent.parent.parent / "data" / "training_meta.json"
    if not meta_path.exists():
        raise HTTPException(
            status_code=404,
            detail="No training run found. Upload data and train first.",
        )
    return json.loads(meta_path.read_text())
