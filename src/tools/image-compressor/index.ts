/**
 * Image Compressor tool entry point. Exports the manifest (for
 * route discovery and sitemap generation) and the Page component
 * (for the router). Nothing else is imported by the route layer.
 */

import { manifest } from './manifest';
import Page from './Page';

export { manifest };
export default Page;
