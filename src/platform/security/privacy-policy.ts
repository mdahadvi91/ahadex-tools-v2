/**
 * Runtime privacy policy: data categories, retention, user rights.
 * Referenced by /privacy page and consent-manager.
 */

export interface DataCategory {
  readonly id: string;
  readonly label: string;
  readonly purpose: string;
  readonly retentionDays: number | null;
  readonly required: boolean;
}

export const PRIVACY_CATEGORIES: readonly DataCategory[] = Object.freeze([
  {
    id: 'file-content',
    label: 'File content',
    purpose: 'Never collected. Files stay in browser memory only.',
    retentionDays: null,
    required: false,
  },
  {
    id: 'consent-choice',
    label: 'Consent choice',
    purpose: 'Remembers whether you allowed analytics or ads.',
    retentionDays: 365,
    required: true,
  },
  {
    id: 'analytics-events',
    label: 'Analytics events',
    purpose: 'Aggregated usage counts. No file names or contents.',
    retentionDays: 90,
    required: false,
  },
  {
    id: 'error-reports',
    label: 'Error reports',
    purpose: 'Crash diagnostics. No file names or contents.',
    retentionDays: 30,
    required: false,
  },
]);

export interface UserRight {
  readonly id: string;
  readonly label: string;
  readonly action: string;
}

export const USER_RIGHTS: readonly UserRight[] = Object.freeze([
  {
    id: 'withdraw-consent',
    label: 'Withdraw consent',
    action: 'Open cookie settings to change or withdraw consent at any time.',
  },
  {
    id: 'delete-local-data',
    label: 'Delete local data',
    action: 'Clear site data from your browser to remove all cookies.',
  },
  {
    id: 'contact',
    label: 'Contact us',
    action: 'Email hello@ahadex.online for any privacy concern.',
  },
]);

export function getCategory(id: string): DataCategory | null {
  return PRIVACY_CATEGORIES.find((c) => c.id === id) ?? null;
}

export function getCategoriesRequiredByConsent(): DataCategory[] {
  return PRIVACY_CATEGORIES.filter((c) => c.required || c.retentionDays !== null);
}
