import { describe, expect, it } from 'vitest';
import { collectDiscoverySnapshot } from '../discovery/discover-tools';
import { injectPrerenderedDocument } from './generate-prerender';
import { routeToDistHtmlPath, runRouteValidation } from '../validation/validate-routes';

describe('Phase 6 discovery and route validation', () => {
  it('discovers all 5 live tools and 7 static pages (12 routes total)', async () => {
    const snapshot = await collectDiscoverySnapshot();
    expect(snapshot.liveToolsCount).toBe(5);
    expect(snapshot.routesCount).toBeGreaterThanOrEqual(12);
    expect(snapshot.routes.map((r) => r.path)).toEqual(
      expect.arrayContaining([
        '/',
        '/about/',
        '/privacy-policy/',
        '/image-compressor/',
        '/image-resizer/',
        '/pdf-compressor/',
        '/merge-pdf/',
        '/split-pdf/',
      ]),
    );
  });

  it('passes pre-build route discovery validation without issues', async () => {
    const report = await runRouteValidation({ verifyDist: false });
    expect(report.status).toBe('PASS');
    expect(report.issues).toEqual([]);
  });

  it('maps root and subpath routes to trailing-slash folder index.html targets', () => {
    expect(routeToDistHtmlPath('/', '/tmp/dist')).toBe('/tmp/dist/index.html');
    expect(routeToDistHtmlPath('/pdf-compressor/', '/tmp/dist')).toBe(
      '/tmp/dist/pdf-compressor/index.html',
    );
  });
});

describe('Phase 6 static HTML injection', () => {
  it('injects SSR body HTML, flips data-prerender-ready="true", and replaces head metadata cleanly', () => {
    const template = `<!doctype html>
<html lang="en" data-prerender-ready="false">
  <head>
    <title>Default Title</title>
    <meta name="description" content="Default desc" />
    <meta property="og:title" content="Default OG" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

    const rendered = injectPrerenderedDocument(template, '<main><h1>Split PDF</h1></main>', {
      title: 'Split PDF & Extract Pages | AHADEX',
      description: 'Split PDFs locally in your browser.',
      canonicalUrl: 'https://ahadex.online/split-pdf/',
      robotsContent: 'index, follow',
      ogType: 'website',
      ogImage: 'https://ahadex.online/og/split-pdf.png',
      ogImageAlt: 'Split PDF preview',
    });

    expect(rendered).toContain('data-prerender-ready="true"');
    expect(rendered).not.toContain('data-prerender-ready="false"');
    expect(rendered).toContain('<title>Split PDF &amp; Extract Pages | AHADEX</title>');
    expect(rendered).toContain('<link rel="canonical" href="https://ahadex.online/split-pdf/" />');
    expect(rendered).toContain('<meta name="robots" content="index, follow" />');
    expect(rendered).toContain('<div id="root"><main><h1>Split PDF</h1></main></div>');
    expect(rendered).not.toContain('Default Title');
    expect(rendered).not.toContain('Default desc');
  });
});
