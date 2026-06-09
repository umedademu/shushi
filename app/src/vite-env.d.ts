/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHUSHI_CLOUD_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
