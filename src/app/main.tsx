import { StrictMode, useEffect } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './app.css';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in document.');
}

document.documentElement.setAttribute('data-prerender-ready', 'false');

function ApplicationRoot() {
  useEffect(() => {
    document.documentElement.setAttribute('data-prerender-ready', 'true');
  }, []);

  return (
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
}

function handleRecoverableError(error: unknown): void {
  console.error('[AHADEX] React recovered from a rendering error:', error);
}

const appTree = <ApplicationRoot />;

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, appTree, {
    onRecoverableError: handleRecoverableError,
  });
} else {
  createRoot(rootElement, {
    onRecoverableError: handleRecoverableError,
  }).render(appTree);
}
