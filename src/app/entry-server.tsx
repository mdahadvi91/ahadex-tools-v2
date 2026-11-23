import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';

import App from './App';

/**
 * Renders the application for a single server-side request.
 *
 * The caller must provide a pathname, optionally including
 * the query string. The application must remain deterministic
 * between server rendering and client hydration.
 */
export function render(url: string): string {
  if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//')) {
    throw new TypeError('SSR render requires a valid application-relative URL.');
  }

  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
}
