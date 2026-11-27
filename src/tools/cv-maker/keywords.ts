/**
 * Keyword map for the CV Maker tool. Targets real organic resume/CV creation
 * queries without overlapping existing image or PDF utility keyword maps.
 */

export interface KeywordMap {
  primary: string;
  secondary: readonly string[];
  longTail: readonly string[];
  intents: readonly ('transactional' | 'informational' | 'comparison')[];
}

export const keywords: KeywordMap = {
  primary: 'cv maker',
  secondary: [
    'free cv maker online',
    'resume builder pdf free',
    'cv builder with templates',
    'ats friendly cv maker',
    'browser resume generator',
    'private cv creator no signup',
  ],
  longTail: [
    'create cv online free and download pdf',
    'step by step resume builder by profession',
    'cv maker without account or watermark',
    'make professional resume locally in browser',
    'multi template curriculum vitae maker pdf',
    'editable cv templates for job applications',
  ],
  intents: ['transactional', 'informational'],
};

export default keywords;
