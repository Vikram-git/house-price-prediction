from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.dependencies import current_user
from app.ml.pipeline import REQUIRED_COLUMNS, load_dataset, train_all
from app.state import get_frame, set_dataset

router = APIRouter(prefix="/dataset", tags=["dataset"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "uploads"


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    _: dict = Depends(current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")
    suffix = Path(file.filename).suffix.lower()
    if suffix not in (".csv", ".xlsx", ".xls"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Upload a .csv or Excel file.",
        )
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    dest = UPLOAD_DIR / f"dataset{suffix}"
    try:
        raw = await file.read()
        if len(raw) < 10:
            raise HTTPException(status_code=400, detail="File is empty or too small")
        dest.write_bytes(raw)
        df = load_dataset(dest)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse file: {e!s}",
        ) from e

    set_dataset(dest, df)
    return {
        "rows": len(df),
        "columns": list(df.columns),
        "message": "Dataset loaded. Run training to refresh models.",
    }


@router.post("/train")
def train_models(_: dict = Depends(current_user)):
    df, path = get_frame()
    if df is None:
        raise HTTPException(
            status_code=400,
            detail="Upload a dataset first.",
        )
    try:
        meta = train_all(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    return meta


@router.get("/schema")
def schema(_: dict = Depends(current_user)):
    return {"required_columns": sorted(REQUIRED_COLUMNS)}
