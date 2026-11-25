/**
 * Keyword map for the Image Compressor tool. Used for SEO validators
 * and content review. Targets genuine high-intent organic search queries
 * distinct from Image Resizer and PDF tools.
 */

export interface KeywordMap {
  primary: string;
  secondary: readonly string[];
  longTail: readonly string[];
  intents: readonly ('transactional' | 'informational' | 'comparison')[];
}

export const keywords: KeywordMap = {
  primary: 'image compressor',
  secondary: [
    'compress image online',
    'compress jpg',
    'compress png',
    'compress webp',
    'reduce image size',
    'photo compressor',
    'image compression tool',
  ],
  longTail: [
    'compress image without uploading',
    'compress image to kb',
    'compress jpg without losing quality',
    'compress png without uploading',
    'reduce photo file size in browser',
    'shrink jpeg file size online',
    'bulk image compressor no signup',
    'reduce image file size for website',
  ],
  intents: ['transactional', 'informational'],
};

export default keywords;
