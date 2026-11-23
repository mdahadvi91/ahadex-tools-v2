/**
 * Keyword map for the Split PDF tool.
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
    'separate pdf pages',
    'pdf page extractor',
    'split pdf in browser',
    'private pdf splitter',
  ],
  longTail: [
    'split pdf without uploading to server',
    'extract page range from pdf locally',
    'separate pdf into single pages in browser',
    'free pdf page extractor no signup',
    'split confidential pdf document offline',
  ],
  intents: ['transactional', 'informational'],
};

export default keywords;
