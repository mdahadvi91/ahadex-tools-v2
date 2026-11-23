/**
 * Keyword map for the PDF Compressor tool.
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
    'optimize pdf in browser',
    'shrink pdf without uploading',
    'private pdf compressor',
    'browser pdf optimizer',
  ],
  longTail: [
    'compress pdf without uploading to server',
    'optimize pdf object streams in browser',
    'remove pdf metadata and shrink file size',
    'compress confidential pdf locally',
    'free pdf compressor no signup',
    'reduce pdf size for email attachment',
  ],
  intents: ['transactional', 'informational'],
};

export default keywords;
