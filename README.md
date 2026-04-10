# House Price Analytics Platform

End-to-end local web application for uploading residential listing data, training regression models, exploring interactive dashboards, and producing price estimates.

## Features

- Secure sign-in (JWT) with a modern glass-style login screen
- CSV/Excel ingestion with validation against a fixed schema
- Preprocessing: missing-value removal, one-hot encoding, numeric scaling
- Models: Linear Regression, Decision Tree, Random Forest — compared on R², MAE, RMSE; best model saved for inference
- Dashboard: KPI cards, filters (location, price band, property type), Recharts visualizations (bar, line, pie, histogram, scatter, correlation heatmap)
- Insights: narrative summaries with chart references
- Prediction page for single-row estimates

## Folder structure

```
house-price-platform/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── auth_utils.py
│   │   ├── dependencies.py
│   │   ├── state.py
│   │   ├── insights.py
│   │   ├── ml/
│   │   │   └── pipeline.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── dataset.py
│   │       ├── dashboard.py
│   │       ├── models.py
│   │       └── predict.py
│   ├── data/                 # created at runtime (uploads, model artifacts)
│   ├── train_models.py       # CLI training script
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts
│   │   ├── components/
│   │   ├── context/AuthContext.tsx
│   │   └── pages/
│   ├── package.json
│   └── vite.config.ts
└── sample_data/
    ├── houses.csv
    └── generate_sample.py
```

## Prerequisites

- **Python 3.11 or 3.12** recommended (3.14 may require pre-built wheels for scientific packages; use `pip install numpy pandas scikit-learn --only-binary=:all:` if builds fail)
- **Node.js 18+** and npm

## Step-by-step setup

### 1. Backend

```powershell
cd house-price-platform\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

(Optional) Regenerate sample data:

```powershell
python ..\sample_data\generate_sample.py
```

Train models from the sample file (also runs automatically from the UI after upload):

```powershell
python train_models.py --data ..\sample_data\houses.csv
```

Start the API:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check: `http://127.0.0.1:8000/health`

### 2. Frontend

```powershell
cd house-price-platform\frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api` to the backend.

### 3. Sign in

Default demo account (change in `backend/app/config.py` or via environment variables):

| Field    | Value               |
|----------|---------------------|
| Email    | `analyst@example.com` |
| Password | `SecurePass2024`    |

### 4. Using your own file

Required columns (headers are normalized to lowercase snake_case):

| Column          | Description        |
|-----------------|--------------------|
| `price`         | Target (numeric)   |
| `location`      | Text               |
| `property_type` | Text               |
| `bedrooms`      | Number             |
| `bathrooms`     | Number             |
| `sqft_living`   | Living area        |
| `year_built`    | Year               |
| `lot_size`      | Lot size           |

Upload from the dashboard, then click **Train models** before using **Price estimator**.

## Production build (frontend)

```powershell
cd frontend
npm run build
```

### Deploy full stack (recommended)

Deploy the **API** first, then the **Vite UI** on Vercel, then wire CORS and `VITE_API_BASE_URL`.

| Guide | Contents |
|-------|----------|
| [docs/DEPLOY_FULLSTACK.md](docs/DEPLOY_FULLSTACK.md) | Render Blueprint, Docker, Vercel, env vars, troubleshooting |
| [docs/VERCEL.md](docs/VERCEL.md) | Frontend-only Vercel details |

Quick reference:

1. **API:** [Render Blueprint](https://dashboard.render.com) using [`render.yaml`](render.yaml) *or* deploy the root [`Dockerfile`](Dockerfile) (Railway, Fly.io, etc.).
2. **UI:** [Vercel](https://vercel.com) — root directory `frontend`, env **`VITE_API_BASE_URL`** = your API URL (no trailing slash).
3. **CORS:** Set **`CORS_ORIGINS`** on the API to your `https://*.vercel.app` URL.

Local API with Docker: `docker compose up --build` from the repo root.

## Configuration

Environment variables (optional) can override defaults when using `pydantic-settings`:

- `SECRET_KEY` — JWT signing secret
- `DEMO_EMAIL` / `DEMO_PASSWORD` — demo credentials
- `CORS_ORIGINS` — comma-separated browser origins allowed to call the API (add your Vercel URL for production)

Create `backend/.env` if needed.

**Frontend (Vite):** `VITE_API_BASE_URL` — set in Vercel for production; omit locally so `/api` proxy is used.

## License

Provided as sample application code for local evaluation and extension.
