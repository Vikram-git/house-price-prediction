import { FormEvent, useState } from "react";
import { predictPrice } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

const initial = {
  location: "West End",
  property_type: "Single Family",
  bedrooms: 3,
  bathrooms: 2,
  sqft_living: 2000,
  year_built: 2000,
  lot_size: 5000,
};

export default function PredictPage() {
  const { token } = useAuth();
  const [values, setValues] = useState(initial);
  const [price, setPrice] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr(null);
    setPrice(null);
    try {
      const data = await predictPrice(token, {
        location: values.location,
        property_type: values.property_type,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        sqft_living: values.sqft_living,
        year_built: values.year_built,
        lot_size: values.lot_size,
      });
      setPrice(data.predicted_price);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Prediction failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 md:p-10">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow mb-2 text-teal-700 dark:text-teal-400">Listing estimate</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Price prediction
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            Describe a hypothetical listing using the same fields as your training data. The
            model answers with a single number — your job is to sanity-check it against the
            market story.
          </p>

          {err && (
            <div className="mt-6 rounded-xl border border-amber-400/50 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
              {err}
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="glass-panel mt-10 space-y-5 p-8 md:p-10"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {(
                [
                  ["location", "text", "Location", "Neighborhood or market area"],
                  ["property_type", "text", "Property type", "e.g. Single Family, Condo"],
                  ["bedrooms", "number", "Bedrooms", ""],
                  ["bathrooms", "number", "Bathrooms", ""],
                  ["sqft_living", "number", "Living area (sqft)", ""],
                  ["year_built", "number", "Year built", ""],
                  ["lot_size", "number", "Lot size (sqft)", ""],
                ] as const
              ).map(([key, kind, label, hint]) => (
                <div key={key} className={key === "lot_size" ? "sm:col-span-2" : ""}>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">{label}</label>
                  {hint ? (
                    <p className="mb-1.5 text-[10px] text-ink-soft/70">{hint}</p>
                  ) : null}
                  {kind === "number" ? (
                    <input
                      type="number"
                      step="any"
                      required
                      className="input-themed"
                      value={values[key as keyof typeof values] as number}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          [key]: Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    <input
                      type="text"
                      required
                      className="input-themed"
                      value={values[key as keyof typeof values] as string}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [key]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full py-3.5">
              {busy ? "Estimating…" : "Run estimate"}
            </button>
          </form>

          {price !== null && (
            <div className="relative mt-10 overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-teal-700 via-teal-800 to-stone-900 p-10 text-center text-white shadow-xl dark:from-teal-900 dark:via-slate-900 dark:to-black">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
              <p className="relative text-[10px] font-semibold uppercase tracking-[0.35em] text-teal-100/90">
                Model output
              </p>
              <p className="relative mt-2 font-display text-4xl font-semibold tabular-nums md:text-5xl">
                {price.toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="relative mt-3 text-xs text-teal-100/80">
                Treat as a signal, not a listing price — validate against comps and context.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
