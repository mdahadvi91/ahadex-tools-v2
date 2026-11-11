#!/usr/bin/env tsx
/**
 * SEO group orchestrator. Runs all seo/* validators in order and
 * writes a group report.
 */

import { runGroup } from './_group-runner';

await runGroup('seo');
