/**
 * Keyword map for the Merge PDF tool.
 */

export interface KeywordMap {
  primary: string;
  secondary: readonly string[];
  longTail: readonly string[];
  intents: readonly ('transactional' | 'informational' | 'comparison')[];
}

export const keywords: KeywordMap = {
  primary: 'merge pdf',
  secondary: [
    'combine pdf files',
    'join pdf online',
    'merge pdf in browser',
    'combine multiple pdfs into one',
    'private pdf merger',
  ],
  longTail: [
    'merge pdf without uploading to server',
    'combine confidential pdf documents locally',
    'reorder and merge pdf files free no signup',
    'join pdf reports in web browser',
    'merge invoices into one pdf locally',
  ],
  intents: ['transactional', 'informational'],
};

export default keywords;
