import { useCallback, useEffect, useState } from "react";
import {
  fetchDashboard,
  fetchModelMetrics,
  trainModels,
  uploadDataset,
} from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ChartCard from "@/components/ChartCard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import CorrelationHeatmap from "@/components/CorrelationHeatmap";

/** Horizon palette: teal / brass / sage — readable in both themes */
const COLORS = ["#0d9488", "#d97706", "#059669", "#ea580c", "#6366f1", "#14b8a6"];

type DashboardPayload = {
  kpis: {
    average_price: number;
    max_price: number;
    min_price: number;
    total_listings: number;
  };
  filter_options: {
    locations: string[];
    property_types: string[];
    price_range: { min: number; max: number };
  };
  price_histogram: { bins: { start: number; end: number; count: number }[] };
  trend_by_decade: { x: number; y: number }[];
  pie_property_type: { name: string; value: number }[];
  bar_location_avg: { location: string; avg_price: number }[];
  correlation_with_price: { feature: string; correlation: number }[];
  insights: { title: string; summary: string; chart_ref: string }[];
  feature_importance: { feature: string; importance: number }[];
  best_model: string | null;
  correlation_matrix: Record<string, Record<string, number>>;
  bivariate_sqft_price: { sqft_living: number; price: number }[];
  metrics?: { name: string; r2: number; mae: number; rmse: number }[];
};

type TrainMeta = {
  best_model: string;
  metrics: { name: string; r2: number; mae: number; rmse: number }[];
};

export default function DashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [meta, setMeta] = useState<TrainMeta | null>(null);
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [loc, setLoc] = useState("");
  const [ptype, setPtype] = useState("");
  const [minP, setMinP] = useState<number | "">("");
  const [maxP, setMaxP] = useState<number | "">("");

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    const filters: {
      locations?: string[];
      property_types?: string[];
      price_min?: number;
      price_max?: number;
    } = {};
    if (loc) filters.locations = [loc];
    if (ptype) filters.property_types = [ptype];
    if (minP !== "") filters.price_min = minP;
    if (maxP !== "") filters.price_max = maxP;

    try {
      const res = await fetchDashboard(token, filters);
      setData(res as DashboardPayload);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, loc, minP, maxP, ptype]);

  const loadMetrics = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetchModelMetrics(token);
      setMeta(res as TrainMeta);
    } catch {
      setMeta(null);
    }
  }, [token]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  async function onFile(f: File) {
    if (!token) return;
    setUploading(true);
    setErr(null);
    try {
      await uploadDataset(token, f);
      await loadDashboard();
      await loadMetrics();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function train() {
    if (!token) return;
    setTraining(true);
    setErr(null);
    try {
      await trainModels(token);
      await loadDashboard();
      await loadMetrics();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Training failed");
    } finally {
      setTraining(false);
    }
  }

  const histBars =
    data?.price_histogram.bins.map((b) => ({
      label: `${Math.round(b.start / 1000)}k`,
      count: b.count,
    })) ?? [];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2 text-teal-700 dark:text-teal-400">Market view</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              Dashboard
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Your file should include:{" "}
              <span className="font-medium text-ink">
                price, location, property_type, bedrooms, bathrooms, sqft_living, year_built,
                lot_size
              </span>
              . Upload, train, then refine with filters — each view updates the story.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="btn-primary cursor-pointer">
              {uploading ? "Uploading…" : "Upload CSV / Excel"}
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onFile(file);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => void train()}
              disabled={training}
              className="btn-secondary disabled:opacity-50"
            >
              {training ? "Training…" : "Train models"}
            </button>
          </div>
        </header>

        {err && (
          <div className="mb-6 rounded-xl border border-rose-400/40 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100">
            {err}
          </div>
        )}

        {loading && !data && (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-600 border-t-transparent dark:border-teal-400" />
          </div>
        )}
        {loading && data && (
          <p className="mb-4 text-center text-xs text-ink-soft animate-pulse">Updating charts…</p>
        )}

        {!loading && data && (
          <>
            <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {(
                [
                  ["Avg price", data.kpis.average_price, true, "⌀"],
                  ["Max price", data.kpis.max_price, true, "↑"],
                  ["Min price", data.kpis.min_price, true, "↓"],
                  ["Listings", data.kpis.total_listings, false, "#"],
                ] as const
              ).map(([label, val, isMoney, mark]) => (
                <div key={String(label)} className="kpi-card">
                  <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-soft">
                    <span className="text-base opacity-70">{mark}</span>
                    {label}
                  </p>
                  <p className="mt-3 font-display text-2xl font-bold tabular-nums text-ink">
                    {typeof val === "number" && isMoney
                      ? `$${Number(val).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}`
                      : typeof val === "number"
                        ? String(val)
                        : String(val)}
                  </p>
                </div>
              ))}
            </section>

            <section className="glass-panel mb-8 p-6">
              <h3 className="section-title mb-1">Segment the market</h3>
              <p className="mb-4 text-xs text-ink-soft">
                Filters slice the same dataset — like narrowing an open house tour to what matters.
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-xs font-medium text-ink-soft">Location</label>
                  <select
                    className="input-themed mt-1"
                    value={loc}
                    onChange={(e) => setLoc(e.target.value)}
                  >
                    <option value="">All</option>
                    {data.filter_options.locations.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft">Property type</label>
                  <select
                    className="input-themed mt-1"
                    value={ptype}
                    onChange={(e) => setPtype(e.target.value)}
                  >
                    <option value="">All</option>
                    {data.filter_options.property_types.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft">Min price</label>
                  <input
                    type="number"
                    className="input-themed mt-1"
                    value={minP}
                    onChange={(e) =>
                      setMinP(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder={String(data.filter_options.price_range.min)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft">Max price</label>
                  <input
                    type="number"
                    className="input-themed mt-1"
                    value={maxP}
                    onChange={(e) =>
                      setMaxP(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder={String(data.filter_options.price_range.max)}
                  />
                </div>
              </div>
            </section>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <ChartCard
                title="Price distribution"
                subtitle="Histogram"
                chartId="histogram_price"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={histBars}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Mean price by location"
                subtitle="Top locations"
                chartId="bar_location"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={data.bar_location_avg.map((b) => ({
                      name: b.location,
                      value: b.avg_price,
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="#d97706" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Price by build decade"
                subtitle="Average price trend"
                chartId="line_decade"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data.trend_by_decade}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="x" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="y"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Property mix"
                subtitle="Listing counts"
                chartId="pie_property"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.pie_property_type}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {data.pie_property_type.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard
              title="Correlation with price"
              subtitle="Numeric features"
              chartId="corr_price"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.correlation_with_price.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="feature" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                    <Bar dataKey="correlation" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <ChartCard
                title="Living area vs price"
                subtitle="Bivariate scatter"
                chartId="scatter_sqft_price"
              >
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      type="number"
                      dataKey="sqft_living"
                      name="Sqft"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="price"
                      name="Price"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(v: number, n: string) =>
                        n === "price" ? `$${v.toLocaleString()}` : v
                      }
                    />
                    <Scatter
                      name="Listings"
                      data={data.bivariate_sqft_price ?? []}
                      fill="#ea580c"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Correlation matrix"
                subtitle="Multivariate heatmap"
                chartId="heatmap_corr"
              >
                <div className="overflow-x-auto">
                  <CorrelationHeatmap matrix={data.correlation_matrix ?? {}} />
                </div>
              </ChartCard>
            </div>

            {(meta?.metrics?.length || data.metrics?.length) ? (
              <section className="glass-panel mt-8 p-6">
                <h3 className="section-title mb-4">
                  Model metrics
                  {(meta?.best_model || data.best_model) && (
                    <span className="ml-2 text-sm font-normal text-teal-700 dark:text-teal-400">
                      Best: {meta?.best_model ?? data.best_model}
                    </span>
                  )}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-ink">
                    <thead>
                      <tr className="border-b border-stone-200 text-left text-ink-soft dark:border-white/10">
                        <th className="pb-2">Model</th>
                        <th className="pb-2">R²</th>
                        <th className="pb-2">MAE</th>
                        <th className="pb-2">RMSE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(meta?.metrics ?? data.metrics ?? []).map((m) => (
                        <tr
                          key={m.name}
                          className="border-b border-stone-100 dark:border-white/5"
                        >
                          <td className="py-2 font-medium">{m.name}</td>
                          <td>{m.r2.toFixed(4)}</td>
                          <td>{m.mae.toFixed(2)}</td>
                          <td>{m.rmse.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {(data.feature_importance?.length ?? 0) > 0 && (
              <section className="glass-panel mt-8 p-6">
                <h3 className="section-title mb-4">Feature importance (tree model)</h3>
                <ul className="space-y-2 text-sm">
                  {data.feature_importance.map((f) => (
                    <li key={f.feature} className="flex justify-between gap-4">
                      <span className="truncate text-ink-soft">{f.feature}</span>
                      <span className="tabular-nums text-ink">{f.importance.toFixed(4)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="glass-panel mt-8 p-6">
              <h3 className="section-title mb-4">Insights</h3>
              <ul className="space-y-4">
                {data.insights.map((i, idx) => (
                  <li
                    key={idx}
                    className="border-l-4 border-teal-600 pl-4 dark:border-teal-500"
                  >
                    <p className="font-medium text-ink">{i.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">{i.summary}</p>
                    <p className="mt-1 text-xs text-ink-soft/80">{i.chart_ref}</p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
