import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as apiLogin } from "@/api/client";

type AuthState = {
  token: string | null;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "hpa_token";
const EMAIL_KEY = "hpa_email";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
  );
  const [email, setEmail] = useState<string | null>(() =>
    typeof localStorage !== "undefined" ? localStorage.getItem(EMAIL_KEY) : null
  );

  const login = useCallback(async (e: string, password: string) => {
    const data = await apiLogin(e, password);
    setToken(data.access_token);
    setEmail(e);
    localStorage.setItem(STORAGE_KEY, data.access_token);
    localStorage.setItem(EMAIL_KEY, e);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setEmail(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EMAIL_KEY);
  }, []);

  const value = useMemo(
    () => ({ token, email, login, logout }),
    [token, email, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
