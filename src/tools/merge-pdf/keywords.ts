/**
 * Keyword map for the Merge PDF tool. Targets real organic PDF combining
 * and reordering search queries without overlapping PDF Compressor or Split PDF.
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
    'merge pdf online free',
    'join pdf files into one',
    'merge pdf in browser',
    'pdf combiner no watermark',
    'private pdf merger',
  ],
  longTail: [
    'merge pdf without uploading to server',
    'combine multiple pdfs into one document',
    'combine two pdf files locally',
    'reorder and merge pdf files free no signup',
    'join confidential pdf documents in browser',
    'merge invoices into one pdf locally',
  ],
  intents: ['transactional', 'informational'],
};

export default keywords;
