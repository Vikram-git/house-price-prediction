# Deploy on Vercel (frontend)

The UI is a **Vite static build**. The **FastAPI backend** must run on another host (Render, Railway, Fly.io, a VPS, etc.); Vercel only serves the React app.

## 1. Deploy the API first

Example using [Render](https://render.com) (free tier):

1. New **Web Service** → connect this repo or deploy from `backend/`.
2. **Root directory:** `backend` (or run commands from repo root; see Render docs).
3. **Build command:** `pip install -r requirements.txt`
4. **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Environment variables** (minimum):
   - `CORS_ORIGINS` — include your future Vercel URL, e.g. `https://your-app.vercel.app`
   - `SECRET_KEY` — long random string
   - Optionally override `DEMO_EMAIL` / `DEMO_PASSWORD`

Copy the public API URL, e.g. `https://house-price-api.onrender.com`.

## 2. Deploy the frontend on Vercel

1. Import the repo at [vercel.com](https://vercel.com).
2. **Root Directory:** `frontend`
3. **Framework preset:** Vite (auto-detected).
4. **Environment variables:**
   - `VITE_API_BASE_URL` = your API origin **without** a trailing slash, e.g. `https://house-price-api.onrender.com`

5. Deploy.

`frontend/vercel.json` rewrites all routes to `index.html` so React Router works.

## 3. Finish CORS

After you know the Vercel URL (e.g. `https://house-price-platform.vercel.app`):

1. Add it to the API’s `CORS_ORIGINS` on your host (comma-separated if multiple).
2. Redeploy or restart the API.

## Local vs production

| Environment | API calls go to |
|-------------|-----------------|
| `npm run dev` | `/api` → proxied to local FastAPI |
| Vercel build | `VITE_API_BASE_URL` (absolute URL to your API) |

If `VITE_API_BASE_URL` is unset in production, the app still uses `/api`, which only works if you add a reverse proxy (not the default Vercel static setup). **Always set `VITE_API_BASE_URL` for Vercel.**

## Limitations

- Uploaded files and trained models on the API host use **disk** unless you add object storage; free tiers may **lose data** on restart.
- For a serious deployment, use managed storage and environment-specific `SECRET_KEY`.
