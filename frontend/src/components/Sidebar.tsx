import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { themeLabels, useTheme } from "@/context/ThemeContext";
import BrandMark from "@/components/BrandMark";

const linkBase =
  "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200";

export default function Sidebar() {
  const { email, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const meta = themeLabels();

  return (
    <aside className="glass-panel flex w-full flex-col border-stone-200/60 dark:border-white/10 md:sticky md:top-4 md:min-h-[calc(100vh-2rem)] md:w-72">
      <div className="p-4">
        <BrandMark className="mb-6" />
        <p className="mb-4 truncate rounded-lg bg-stone-100/80 px-2 py-1.5 text-xs text-ink-soft dark:bg-white/5">
          {email}
        </p>
        <nav className="flex flex-col gap-1" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? "bg-gradient-to-r from-teal-600/15 to-emerald-600/10 text-ink shadow-sm ring-1 ring-teal-600/20 dark:from-teal-500/20 dark:to-cyan-500/10 dark:text-white dark:ring-teal-400/25"
                  : "text-ink-soft hover:bg-stone-100/80 hover:text-ink dark:hover:bg-white/5 dark:hover:text-white"
              }`
            }
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-200/80 text-lg dark:bg-white/10">
              📊
            </span>
            <span>
              <span className="block font-semibold">Market view</span>
              <span className="text-xs font-normal text-ink-soft">Dashboard & charts</span>
            </span>
          </NavLink>
          <NavLink
            to="/predict"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? "bg-gradient-to-r from-teal-600/15 to-emerald-600/10 text-ink shadow-sm ring-1 ring-teal-600/20 dark:from-teal-500/20 dark:to-cyan-500/10 dark:text-white dark:ring-teal-400/25"
                  : "text-ink-soft hover:bg-stone-100/80 hover:text-ink dark:hover:bg-white/5 dark:hover:text-white"
              }`
            }
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-200/80 text-lg dark:bg-white/10">
              🏠
            </span>
            <span>
              <span className="block font-semibold">Listing estimate</span>
              <span className="text-xs font-normal text-ink-soft">Price prediction</span>
            </span>
          </NavLink>
        </nav>
      </div>

      <div className="mt-auto space-y-3 border-t border-stone-200/80 p-4 dark:border-white/10">
        <div>
          <p className="eyebrow mb-2 text-[9px]">Visual theme</p>
          <div className="grid grid-cols-2 gap-2">
            {(["midnight", "openhouse"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={`rounded-xl border px-2 py-2 text-left text-xs transition ${
                  theme === id
                    ? "border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600/30 dark:border-teal-500 dark:bg-teal-950/50 dark:text-teal-100"
                    : "border-stone-200 bg-white/60 text-ink-soft hover:border-stone-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                }`}
              >
                <span className="block font-semibold text-ink">{meta[id].label}</span>
                <span className="mt-0.5 line-clamp-2 text-[10px] leading-snug opacity-80">
                  {id === "midnight" ? "Night skyline" : "Daylight listing"}
                </span>
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 text-sm font-medium text-ink transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
