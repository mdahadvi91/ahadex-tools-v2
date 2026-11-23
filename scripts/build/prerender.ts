/**
 * Backwards-compatible CLI delegate pointing to scripts/prerender/generate-prerender.ts.
 */

import { generatePrerenderedSite } from '../prerender/generate-prerender';

const summary = await generatePrerenderedSite();
console.log(
  `[PASS] prerender — generated ${summary.outputFiles.length} HTML files for ${summary.routeCount} published routes.`,
);
