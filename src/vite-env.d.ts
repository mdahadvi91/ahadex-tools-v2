/// <reference types="vite/client" />
/// <reference types="node" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string;
  readonly VITE_GA_MEASUREMENT_ID: string;
  readonly VITE_ADSENSE_PUBLISHER_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly glob: <T = unknown>(
    pattern: string | readonly string[],
    options?: { eager?: boolean; import?: string },
  ) => Record<string, T>;
}

declare module '*?worker' {
  const workerConstructor: new () => Worker;
  export default workerConstructor;
}
