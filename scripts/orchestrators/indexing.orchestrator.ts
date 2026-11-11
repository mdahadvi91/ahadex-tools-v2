#!/usr/bin/env tsx
/**
 * Indexing group orchestrator.
 */

import { runGroup } from './_group-runner';

await runGroup('indexing');
