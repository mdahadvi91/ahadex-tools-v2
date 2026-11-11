/**
 * Runtime diagnostics: collect environment info for bug reports.
 * Never includes file names, file contents or user identifiers.
 */

export interface DiagnosticsSnapshot {
  userAgent: string;
  language: string;
  timezone: string;
  screenSize: { width: number; height: number };
  viewportSize: { width: number; height: number };
  devicePixelRatio: number;
  hardwareConcurrency: number | null;
  deviceMemoryGb: number | null;
  online: boolean;
  url: string;
  isProduction: boolean;
  timestamp: string;
}

export function collectDiagnostics(isProduction: boolean): DiagnosticsSnapshot {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const win = typeof window !== 'undefined' ? window : null;
  const scr = typeof screen !== 'undefined' ? screen : null;

  const deviceMemory = (nav as unknown as { deviceMemory?: number } | null)?.deviceMemory;

  return {
    userAgent: nav?.userAgent ?? 'unknown',
    language: nav?.language ?? 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenSize: scr ? { width: scr.width, height: scr.height } : { width: 0, height: 0 },
    viewportSize: win
      ? { width: win.innerWidth, height: win.innerHeight }
      : { width: 0, height: 0 },
    devicePixelRatio: win?.devicePixelRatio ?? 1,
    hardwareConcurrency: nav?.hardwareConcurrency ?? null,
    deviceMemoryGb: typeof deviceMemory === 'number' ? deviceMemory : null,
    online: nav?.onLine ?? true,
    url: win?.location.href ?? 'unknown',
    isProduction,
    timestamp: new Date().toISOString(),
  };
}

export function formatDiagnostics(snapshot: DiagnosticsSnapshot): string {
  return [
    `Timestamp: ${snapshot.timestamp}`,
    `Production: ${snapshot.isProduction}`,
    `URL: ${snapshot.url}`,
    `User Agent: ${snapshot.userAgent}`,
    `Language: ${snapshot.language}`,
    `Timezone: ${snapshot.timezone}`,
    `Screen: ${snapshot.screenSize.width}x${snapshot.screenSize.height}`,
    `Viewport: ${snapshot.viewportSize.width}x${snapshot.viewportSize.height}`,
    `Device Pixel Ratio: ${snapshot.devicePixelRatio}`,
    `CPU Cores: ${snapshot.hardwareConcurrency ?? 'unknown'}`,
    `Device Memory (GB): ${snapshot.deviceMemoryGb ?? 'unknown'}`,
    `Online: ${snapshot.online}`,
  ].join('\n');
}
