/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_LIVE_API?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __PROCURA_API_URL__?: string;
}
