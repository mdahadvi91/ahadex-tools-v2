/**
 * Keyword map for the PDF Compressor tool. Targets real organic PDF size
 * reduction and metadata cleanup queries distinct from Merge/Split PDF.
 */

export interface KeywordMap {
  primary: string;
  secondary: readonly string[];
  longTail: readonly string[];
  intents: readonly ('transactional' | 'informational' | 'comparison')[];
}

export const keywords: KeywordMap = {
  primary: 'pdf compressor',
  secondary: [
    'compress pdf online',
    'reduce pdf file size',
    'compress pdf free',
    'make pdf smaller',
    'optimize pdf in browser',
    'shrink pdf without uploading',
    'private pdf optimizer',
  ],
  longTail: [
    'compress pdf without uploading to server',
    'compress pdf without losing text quality',
    'reduce pdf size for email attachment',
    'optimize pdf object streams in browser',
    'strip pdf metadata and shrink file size',
    'compress confidential pdf locally',
    'free pdf compressor no signup',
  ],
  intents: ['transactional', 'informational'],
};

export default keywords;
