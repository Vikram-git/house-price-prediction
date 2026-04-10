# Full backend image: FastAPI + bundled sample data for cold-start.
# Build from repository root: docker build -t house-price-api .
FROM python:3.12-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend/ /app/backend/
COPY sample_data/ /app/sample_data/

ENV PYTHONPATH=/app/backend
WORKDIR /app/backend

EXPOSE 8000

# Cloud platforms set PORT; default 8000 for local Docker
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
