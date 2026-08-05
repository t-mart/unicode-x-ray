interface ImportMetaEnv {
  /** Set in `.env.development` and `.env.production`. See `src/lib/meta.ts`. */
  readonly VITE_SITE_ORIGIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
