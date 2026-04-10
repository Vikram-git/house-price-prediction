from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ml.pipeline import load_dataset
from app.routers import auth, dashboard, dataset, models, predict
from app.state import set_dataset

app = FastAPI(title="House Price Analytics", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dataset.router)
app.include_router(dashboard.router)
app.include_router(predict.router)
app.include_router(models.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def startup_load_sample():
    root = Path(__file__).resolve().parent.parent.parent
    sample = root / "sample_data" / "houses.csv"
    if sample.exists():
        try:
            df = load_dataset(sample)
            set_dataset(sample, df)
        except Exception:
            pass
