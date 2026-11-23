/**
 * Legacy entrypoint maintained for backward compatibility.
 * Delegates cleanly to the unified Phase 10 production SSG build orchestrator.
 */

import { runProductionBuild } from '../production/build-orchestrator';

await runProductionBuild();
