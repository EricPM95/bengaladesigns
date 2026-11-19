/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** (V20) El commit de la app, puesto al compilar (vite.config.ts). */
declare const __COMMIT_APP__: string
