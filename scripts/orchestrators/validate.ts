/**
 * Validation Orchestrator entry point supporting `--phase=pre|post|all`.
 * Delegates cleanly to filesystem-based Node validators without Vite-only imports.
 */

import { runFinalValidation } from '../production/final-validation';
import { runPrebuildValidation } from '../production/prebuild-validation';

const phaseArg = process.argv.find((a) => a.startsWith('--phase='))?.split('=')[1] ?? 'all';

if (phaseArg === 'pre' || phaseArg === 'all') {
  const pre = await runPrebuildValidation();
  if (!pre.passed) {
    process.exitCode = 1;
    throw new Error('Pre-build validation phase failed.');
  }
}

if (phaseArg === 'post' || phaseArg === 'all') {
  const post = await runFinalValidation();
  if (!post.passed) {
    process.exitCode = 1;
    throw new Error('Post-build validation phase failed.');
  }
}

console.log(`[PASS] validate --phase=${phaseArg}`);
