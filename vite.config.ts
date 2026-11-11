import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const ADSENSE_ID_PATTERN = /^ca-pub-\d{16}$/;
const GA_ID_PATTERN = /^G-[A-Z0-9]{6,}$/;

function isValidHttpsUrl(value: string): boolean {
  if (!value.startsWith('https://')) return false;
  if (value.endsWith('/')) return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.pathname !== '/' && parsed.pathname !== '') return false;
    if (parsed.search !== '' || parsed.hash !== '') return false;
    return true;
  } catch {
    return false;
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  if (mode === 'production') {
    if (!env.VITE_SITE_URL || env.VITE_SITE_URL.trim() === '') {
      throw new Error(
        'VITE_SITE_URL is required for production builds. ' +
          'Set it in .env or CI environment. See .env.example.',
      );
    }
    if (!isValidHttpsUrl(env.VITE_SITE_URL.trim())) {
      throw new Error(
        `VITE_SITE_URL must be an https URL without trailing slash. ` +
          `Received: "${env.VITE_SITE_URL}".`,
      );
    }
  }

  if (env.VITE_GA_MEASUREMENT_ID && !GA_ID_PATTERN.test(env.VITE_GA_MEASUREMENT_ID)) {
    throw new Error(
      `VITE_GA_MEASUREMENT_ID is malformed: "${env.VITE_GA_MEASUREMENT_ID}".`,
    );
  }

  if (
    env.VITE_ADSENSE_PUBLISHER_ID &&
    !ADSENSE_ID_PATTERN.test(env.VITE_ADSENSE_PUBLISHER_ID)
  ) {
    throw new Error(
      `VITE_ADSENSE_PUBLISHER_ID is malformed: "${env.VITE_ADSENSE_PUBLISHER_ID}".`,
    );
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
