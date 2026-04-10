const API_BASE = "/api";

function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Sign-in failed");
  }
  return res.json() as Promise<{ access_token: string; token_type: string }>;
}

export async function fetchDashboard(
  token: string,
  filters: {
    locations?: string[];
    price_min?: number | null;
    price_max?: number | null;
    property_types?: string[];
  }
) {
  const res = await fetch(`${API_BASE}/dashboard/data`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(filters),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Could not load dashboard");
  }
  return res.json();
}

export async function uploadDataset(token: string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/dataset/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Upload failed");
  }
  return res.json();
}

export async function trainModels(token: string) {
  const res = await fetch(`${API_BASE}/dataset/train`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Training failed");
  }
  return res.json();
}

export async function fetchModelMetrics(token: string) {
  const res = await fetch(`${API_BASE}/models/metrics`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "No metrics yet");
  }
  return res.json();
}

export async function predictPrice(
  token: string,
  body: Record<string, string | number>
) {
  const res = await fetch(`${API_BASE}/predict/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Prediction failed");
  }
  return res.json() as Promise<{ predicted_price: number; currency: string }>;
}
