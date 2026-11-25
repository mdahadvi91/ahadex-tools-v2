/**
 * Keyword map for the Image Resizer tool. Targets pixel dimension
 * and social-preset organic search intent without overlapping Image Compressor.
 */

export interface KeywordMap {
  primary: string;
  secondary: readonly string[];
  longTail: readonly string[];
  intents: readonly ('transactional' | 'informational' | 'comparison')[];
}

export const keywords: KeywordMap = {
  primary: 'image resizer',
  secondary: [
    'resize image online',
    'resize jpg',
    'resize png',
    'resize webp',
    'change image dimensions',
    'resize photo by pixels',
    'image dimension converter',
  ],
  longTail: [
    'resize image without uploading',
    'resize image to exact pixel dimensions',
    'resize image keeping aspect ratio',
    'resize image by percentage in browser',
    'resize photo for instagram 1080x1080',
    'youtube thumbnail resizer 1280x720',
    'client-side image resizer no signup',
    'resize multiple photos in browser',
  ],
  intents: ['transactional', 'informational'],
};

export default keywords;
