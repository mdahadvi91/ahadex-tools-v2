/**
 * Dependency audit. Runs npm audit --json and translates findings
 * into violations. Blocking severities are mirrored from
 * src/platform/security/dependency-policy.ts.
 */

import { spawn } from 'node:child_process';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

type AuditSeverity = 'critical' | 'high' | 'moderate' | 'low';

const BLOCKING_AUDIT_SEVERITIES: readonly AuditSeverity[] = ['critical', 'high'];

interface NpmAuditAdvisory {
  severity: AuditSeverity;
  title: string;
  module_name: string;
  patched_versions: string;
  url: string;
}

interface NpmAuditVuln {
  name: string;
  severity: AuditSeverity;
  via: Array<string | NpmAuditAdvisory>;
  fixAvailable: boolean | { name: string; version: string; isSemVerMajor: boolean };
}

interface NpmAuditJson {
  vulnerabilities?: Record<string, NpmAuditVuln>;
}

function parseAuditOutput(output: string): NpmAuditJson | null {
  try {
    const start = output.indexOf('{');
    const end = output.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(output.slice(start, end + 1)) as NpmAuditJson;
  } catch {
    return null;
  }
}

export async function run(): Promise<Violation[]> {
  return new Promise((resolve) => {
    const child = spawn('npm', ['audit', '--json'], {
      cwd: PATHS.root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      const json = parseAuditOutput(stdout);
      if (!json || !json.vulnerabilities) {
        if (code === 0) return resolve([]);
        return resolve([
          error('audit-parse-failed', `Could not parse npm audit output (exit ${code}).`, {
            hint: stderr.trim().slice(0, 500),
          }),
        ]);
      }

      const violations: Violation[] = [];
      const entries = Object.values(json.vulnerabilities);
      const blocking = new Set<string>(BLOCKING_AUDIT_SEVERITIES);

      for (const vuln of entries) {
        const label = `${vuln.name} (${vuln.severity})`;
        const advisoryTitles = vuln.via
          .filter((v): v is NpmAuditAdvisory => typeof v === 'object')
          .map((v) => v.title)
          .join('; ');
        const fixHint =
          vuln.fixAvailable === false
            ? 'No fix available'
            : typeof vuln.fixAvailable === 'object'
              ? `Fix available: ${vuln.fixAvailable.name}@${vuln.fixAvailable.version}`
              : 'Fix available (run npm audit fix)';

        const message = `${label}: ${advisoryTitles || 'transitive vulnerability'}`;

        if (blocking.has(vuln.severity)) {
          violations.push(
            error('vulnerable-dependency', message, {
              file: 'package-lock.json',
              hint: fixHint,
            }),
          );
        } else if (vuln.severity === 'moderate') {
          violations.push(
            warning('moderate-vulnerability', message, {
              file: 'package-lock.json',
              hint: fixHint,
            }),
          );
        } else {
          violations.push(
            info('low-vulnerability', message, { file: 'package-lock.json' }),
          );
        }
      }

      return resolve(violations);
    });
  });
}
