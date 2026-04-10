/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public API origin for production (no path suffix). Example: https://api.example.com */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
