/**
 * Keyword map for the Split PDF tool. Targets real organic PDF page extraction
 * and splitting queries without overlapping Merge PDF or PDF Compressor.
 */

export interface KeywordMap {
  primary: string;
  secondary: readonly string[];
  longTail: readonly string[];
  intents: readonly ('transactional' | 'informational' | 'comparison')[];
}

export const keywords: KeywordMap = {
  primary: 'split pdf',
  secondary: [
    'extract pdf pages',
    'split pdf online free',
    'separate pdf pages',
    'pdf page extractor',
    'split pdf in browser',
    'private pdf splitter',
  ],
  longTail: [
    'split pdf without uploading to server',
    'extract specific page range from pdf locally',
    'split pdf into individual single pages',
    'extract pages from pdf without signup',
    'remove extra pages from pdf in browser',
    'split confidential pdf document locally',
  ],
  intents: ['transactional', 'informational'],
};

export default keywords;
