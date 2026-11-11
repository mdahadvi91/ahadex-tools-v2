#!/usr/bin/env tsx
/**
 * Production group orchestrator.
 */

import { runGroup } from './_group-runner';

await runGroup('production');
