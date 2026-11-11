/**
 * Dependency policy: allowed/blocked packages, license rules,
 * minimum versions. Used by scripts/tasks/security/dependency-audit.ts.
 */

export type Severity = 'critical' | 'high' | 'moderate' | 'low';

export interface DependencyRule {
  /** Package name (exact match). */
  name: string;
  /** Reason the package is blocked. Empty when allowed. */
  reason?: string;
  /** Allowed even if version matches blocked pattern. */
  allowedVersions?: readonly string[];
}

export interface DependencyPolicyConfig {
  /** Package names that must not be present. */
  blocked: readonly DependencyRule[];
  /** Allowed licenses for any dependency. */
  allowedLicenses: readonly string[];
  /** Severities that block releases. */
  blockingSeverities: readonly Severity[];
  /** Maximum allowed install depth (defense in depth). */
  maxDepth: number;
}

const BLOCKING_SEVERITIES: readonly Severity[] = ['critical', 'high'];

export const DEPENDENCY_POLICY: DependencyPolicyConfig = Object.freeze({
  blocked: Object.freeze([
    {
      name: 'event-stream',
      reason: 'Historical supply-chain compromise (2018).',
    },
    {
      name: 'left-pad',
      reason: 'Deprecated; trivially reimplementable.',
    },
  ]),
  allowedLicenses: Object.freeze([
    'MIT',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    '0BSD',
    'CC0-1.0',
    'Unlicense',
  ]),
  blockingSeverities: BLOCKING_SEVERITIES,
  maxDepth: 20,
});

export interface PolicyCheckInput {
  name: string;
  version: string;
  license?: string;
  severity?: Severity;
}

export interface PolicyCheckResult {
  ok: boolean;
  violations: string[];
}

export function checkDependency(input: PolicyCheckInput): PolicyCheckResult {
  const violations: string[] = [];

  for (const blocked of DEPENDENCY_POLICY.blocked) {
    if (blocked.name === input.name) {
      const allowed = blocked.allowedVersions?.includes(input.version);
      if (!allowed) {
        violations.push(`Blocked package "${input.name}": ${blocked.reason ?? 'no reason'}`);
      }
    }
  }

  if (input.license && !DEPENDENCY_POLICY.allowedLicenses.includes(input.license)) {
    violations.push(`License "${input.license}" of "${input.name}" is not in allowed list.`);
  }

  if (input.severity && DEPENDENCY_POLICY.blockingSeverities.includes(input.severity)) {
    violations.push(`"${input.name}" has ${input.severity} severity advisory.`);
  }

  return { ok: violations.length === 0, violations };
}
