import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const ADSENSE_ID_PATTERN = /^ca-pub-\d{16}$/;
const GA_ID_PATTERN = /^G-[A-Z0-9]{10}$/;

function isValidHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);

    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.length > 0 &&
      parsed.username === '' &&
      parsed.password === '' &&
      parsed.pathname === '/' &&
      parsed.search === '' &&
      parsed.hash === '' &&
      !value.endsWith('/')
    );
  } catch {
    return false;
  }
}

function validateOptionalId(
  value: string | undefined,
  pattern: RegExp,
  variableName: string,
): void {
  const normalized = value?.trim();

  if (normalized && !pattern.test(normalized)) {
    throw new Error(`${variableName} has an invalid format.`);
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  const siteUrl = env.VITE_SITE_URL?.trim();

  if (mode === 'production') {
    if (!siteUrl) {
      throw new Error(
        'VITE_SITE_URL is required for production builds. Set it in .env or CI environment.',
      );
    }

    if (!isValidHttpsUrl(siteUrl)) {
      throw new Error(
        'VITE_SITE_URL must be a valid HTTPS origin without credentials, path, query, hash, or trailing slash.',
      );
    }
  }

  validateOptionalId(env.VITE_GA_MEASUREMENT_ID, GA_ID_PATTERN, 'VITE_GA_MEASUREMENT_ID');

  validateOptionalId(
    env.VITE_ADSENSE_PUBLISHER_ID,
    ADSENSE_ID_PATTERN,
    'VITE_ADSENSE_PUBLISHER_ID',
  );

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    ssr: {
      target: 'node',
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      emptyOutDir: true,
    },

    worker: {
      format: 'es',
    },
  };
});
