import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import BrandMark from "@/components/BrandMark";

export default function LoginPage() {
  const { token, login } = useAuth();
  const { meta } = useTheme();
  const [email, setEmail] = useState("analyst@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden px-6 py-14 lg:px-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-40"
          aria-hidden
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-lg">
          <BrandMark className="mb-10" />
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink md:text-5xl">
            See the market
            <span className="block bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-amber-300">
              before you list.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">
            Horizon turns messy spreadsheets into clear KPIs, honest model metrics, and
            estimates you can explain — built for analysts who care about both the story and
            the spreadsheet.
          </p>
          <ul className="mt-10 space-y-4 text-sm text-ink-soft">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                ✓
              </span>
              <span>
                <strong className="text-ink">Foundation</strong> — rigorous preprocessing,
                multiple models, and held-out metrics you can cite.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                ✓
              </span>
              <span>
                <strong className="text-ink">Outlook</strong> — charts tuned for briefings:
                distribution, location, mix, and correlation at a glance.
              </span>
            </li>
          </ul>
          <p className="mt-10 text-xs text-ink-soft/80">
            Active theme: <span className="font-medium text-teal-700 dark:text-teal-400">{meta.label}</span> —{" "}
            {meta.tagline}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:border-l lg:border-stone-200/80 lg:px-10 dark:lg:border-white/10">
        <div className="glass-panel w-full max-w-md p-8 shadow-xl animate-fadeIn md:p-10">
          <div className="mb-8 text-center lg:text-left">
            <p className="eyebrow mb-2 text-teal-700 dark:text-teal-400">Secure access</p>
            <h2 className="font-display text-2xl font-semibold text-ink">Welcome back</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Sign in to open your workspace — same credentials as your local backend config.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-soft">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-themed"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-soft">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-themed"
                required
              />
            </div>
            {error && (
              <p
                className="rounded-xl border border-rose-400/40 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/50 dark:text-rose-100"
                role="alert"
              >
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              Enter workspace
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
