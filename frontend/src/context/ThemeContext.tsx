import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeId = "midnight" | "openhouse";

const STORAGE_KEY = "hpa_theme";

const THEME_META: Record<
  ThemeId,
  { label: string; tagline: string; mood: string }
> = {
  midnight: {
    label: "Midnight Horizon",
    tagline: "Data after dark — clarity for night-owl analysts.",
    mood: "Deep slate sky, teal signal, brass value accents.",
  },
  openhouse: {
    label: "Open House",
    tagline: "Daylight clarity — like walking a bright listing.",
    mood: "Warm paper, ink text, sage growth and terracotta trust.",
  },
};

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  toggle: () => void;
  meta: (typeof THEME_META)[ThemeId];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitial(): ThemeId {
  if (typeof localStorage === "undefined") return "midnight";
  const s = localStorage.getItem(STORAGE_KEY);
  return s === "openhouse" || s === "midnight" ? s : "midnight";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readInitial);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (theme === "midnight") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t: ThemeId) => setThemeState(t), []);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === "midnight" ? "openhouse" : "midnight"));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggle,
      meta: THEME_META[theme],
    }),
    [theme, setTheme, toggle]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function themeLabels() {
  return THEME_META;
}
