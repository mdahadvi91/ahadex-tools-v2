/**
 * Content constants for the Image Resizer tool. All claims must be
 * verifiable from the engine code or network behavior.
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ContentSection {
  heading: string;
  paragraphs: readonly string[];
  list?: readonly string[];
}

export interface FormatInfo {
  name: string;
  mime: string;
  lossy: boolean;
  transparency: boolean;
  note: string;
}

export interface UseCase {
  title: string;
  body: string;
}

export interface Reference {
  label: string;
  url: string;
  note: string;
}

export interface InternalLink {
  label: string;
  path: string;
}

export const HERO = {
  h1: 'Image Resizer',
  tagline: 'Resize JPG, PNG, WebP, GIF and AVIF images to exact pixel dimensions in your browser.',
  subtitle:
    'No account required. Files are processed in browser memory and never transmitted to a server.',
  trustSignals: ['Runs in your browser', 'No account required', 'No file upload'],
} as const;

export const DIRECT_ANSWER =
  'Image Resizer is a free browser-based tool that changes the pixel dimensions of JPG, PNG, WebP, GIF and AVIF images. Resizing happens locally in the browser using the Canvas API. Files are not transmitted to a server during processing, and no account is required.';

export const SECTIONS: readonly ContentSection[] = [
  {
    heading: 'What this tool does',
    paragraphs: [
      'This tool changes the width and height of an image in pixels. You can set exact dimensions, scale by a percentage, or pick from common presets like 1080x1080 for Instagram. Processing happens inside your browser using the Canvas API and a Web Worker.',
      'You can choose the output format (JPEG, WebP or PNG) and adjust the compression quality. If only one dimension is provided and "maintain aspect ratio" is on, the other dimension is calculated automatically.',
    ],
    list: [
      'Input formats: JPG, PNG, WebP, GIF, AVIF',
      'Output formats: JPEG, WebP, PNG',
      'Exact pixel dimensions',
      'Percentage scaling',
      'Preset social media sizes',
      'Aspect ratio lock',
      'No watermark, no account required',
    ],
  },
  {
    heading: 'How resizing works',
    paragraphs: [
      'When you add a file, the browser reads it into memory as a Blob and passes it to a Web Worker. The worker decodes the image, draws it onto an offscreen canvas at the target dimensions, and re-encodes it at the chosen quality. The result is passed back to the page as a downloadable Blob.',
      'The Canvas API uses high-quality interpolation (browser-dependent) to resample pixels. Downscaling by large factors can lose fine detail because information is discarded. Upscaling by large factors can produce blur because no new information is created.',
      'If you resize the same image several times in a row, each resize works from the previous output. Start from the original file when possible to avoid cumulative quality loss.',
    ],
  },
  {
    heading: 'When to use which size',
    paragraphs: ['The right size depends on where the image will be displayed.'],
    list: [
      'Website hero image: 1920 to 2560 px wide. Keep under 500 KB.',
      'Blog inline image: 800 to 1200 px wide. 60 to 150 KB.',
      'Thumbnail: 150 to 300 px wide. Under 30 KB.',
      'Instagram square: 1080 x 1080 px. Under 1 MB.',
      'Instagram portrait: 1080 x 1350 px.',
      'Instagram story / Reel: 1080 x 1920 px.',
      'Twitter post: 1200 x 675 px.',
      'YouTube thumbnail: 1280 x 720 px.',
      'Facebook cover: 820 x 312 px.',
    ],
  },
  {
    heading: 'File size vs image dimensions',
    paragraphs: [
      'File size and pixel dimensions are different. Dimensions control how many pixels the image contains; file size is how many bytes those pixels take up. Reducing dimensions usually reduces file size, but not always proportionally.',
      'For example, a 4000x3000 JPEG at quality 85 might be 2 MB. Resizing it to 2000x1500 (half the width and height) gives roughly one quarter the pixel count and a correspondingly smaller file, often 400 to 700 KB. Re-encoding at a different quality can change this further.',
      'If file size is your primary concern, use the Image Compressor tool instead. If dimensions are your primary concern, this is the right tool. If both matter, resize first, then compress the result.',
    ],
  },
  {
    heading: 'Privacy and data handling',
    paragraphs: [
      'Your image is decoded and resampled inside browser memory on your own device without uploading the file to any server. Closing or reloading the tab immediately clears the temporary image buffers.',
      'The site itself loads over the network like any web page. Your browser requests the HTML, JavaScript and CSS needed to run the tool. These requests do not contain your file.',
      'The site collects analytics only if you grant consent. If you grant analytics consent, aggregate usage events are recorded with an approximate file size bucket. File names, contents and exact sizes are not sent.',
    ],
  },
  {
    heading: 'Limitations',
    paragraphs: [
      'Downscaling discards information permanently. If you might need the original later, keep a copy.',
      'Upscaling cannot create detail that was not in the original. A blurry upscaled image is still blurry.',
      'The maximum input size is 25 MB per image, and the maximum decoded pixel count is 25 megapixels. Files above these limits fail before processing begins.',
      'The output format defaults to the input format. GIF animation is not preserved; only the first frame is used.',
    ],
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Add images',
    body: 'Drag one or more images into the drop zone, or click to open your file browser.',
  },
  {
    step: 2,
    title: 'Choose dimensions',
    body: 'Enter exact pixel dimensions, pick a preset, or scale by percentage. Lock the aspect ratio to keep proportions.',
  },
  {
    step: 3,
    title: 'Download',
    body: 'The browser resizes each file locally. Download the result when complete.',
  },
] as const;

export const USE_CASES: readonly UseCase[] = [
  {
    title: 'Preparing social media posts',
    body: 'Use presets for Instagram, Twitter and YouTube thumbnail sizes. No need to remember the pixel dimensions.',
  },
  {
    title: 'Website image optimization',
    body: 'Downscale large photos to the size they will appear on the page. Smaller files load faster.',
  },
  {
    title: 'Fitting email attachments',
    body: 'Some email providers block very large attachments. Resizing to 800 px wide keeps the file small.',
  },
  {
    title: 'Thumbnail generation',
    body: 'Generate thumbnails at 150 or 300 px for galleries and cards.',
  },
];

export const SUPPORTED_INPUT_FORMATS: readonly FormatInfo[] = [
  {
    name: 'JPEG',
    mime: 'image/jpeg',
    lossy: true,
    transparency: false,
    note: 'Standard for photos.',
  },
  {
    name: 'PNG',
    mime: 'image/png',
    lossy: false,
    transparency: true,
    note: 'Lossless, supports alpha.',
  },
  {
    name: 'WebP',
    mime: 'image/webp',
    lossy: true,
    transparency: true,
    note: 'Modern format, small files.',
  },
  {
    name: 'GIF',
    mime: 'image/gif',
    lossy: false,
    transparency: true,
    note: 'Single-frame output only.',
  },
  {
    name: 'AVIF',
    mime: 'image/avif',
    lossy: true,
    transparency: true,
    note: 'Input only; output pending.',
  },
];

export const PRIVACY = {
  heading: 'Privacy summary',
  paragraphs: [
    'Files are loaded into browser memory and processed by a Web Worker running on your device. The file is not sent to a server for resizing.',
    'Optional usage analytics are recorded only with your explicit consent and contain aggregate tool-level counts rather than filenames or image dimensions.',
    'Your preference is saved locally so you can update or withdraw consent anytime.',
  ],
} as const;

export const LIMITATIONS = {
  heading: 'Limits to be aware of',
  list: [
    'Maximum input size: 25 MB per image.',
    'Maximum decoded pixels: 25 million.',
    'GIF output is not supported; only the first frame is used.',
    'AVIF output is not supported yet; use WebP or JPEG.',
    'Upscaling cannot add detail that was not in the original.',
    'Downscaling discards information permanently.',
    'PNG output is lossless and may produce larger files than JPEG or WebP.',
  ],
} as const;

export const FAQ: readonly FAQItem[] = [
  {
    question: 'Is my image sent to a server?',
    answer:
      'No. The file is read into browser memory and resized by code running locally in your browser. The file is not transmitted to a server for processing.',
  },
  {
    question: 'What file size can I resize?',
    answer:
      'Each input image may be up to 25 MB (and up to 25 megapixels decoded), preventing browser memory exhaustion during canvas resampling.',
  },
  {
    question: 'Which image formats are supported?',
    answer:
      'The resizer reads JPG, JPEG, PNG, WebP, GIF, and AVIF files and exports resized images as JPEG, WebP, or PNG (GIF exports use the first frame).',
  },
  {
    question: 'Will resizing reduce image quality?',
    answer:
      'Downscaling discards information, so the result will have fewer pixels. Upscaling cannot add detail. Choose the exact size you need and keep the original file.',
  },
  {
    question: 'Can I maintain the aspect ratio?',
    answer:
      'Yes. When only one dimension is set, the other is calculated from the original aspect ratio. You can also enter both dimensions to stretch the image.',
  },
  {
    question: 'Can I resize multiple images at once?',
    answer:
      'Yes. Add multiple files; each is resized independently and can be downloaded individually or together.',
  },
  {
    question: 'Is there a watermark or signup?',
    answer:
      'Every resized download is completely watermark-free and requires no account or registration.',
  },
  {
    question: 'What are common social media sizes?',
    answer:
      'Instagram square: 1080x1080. Instagram portrait: 1080x1350. Instagram story: 1080x1920. Twitter post: 1200x675. YouTube thumbnail: 1280x720. Facebook cover: 820x312.',
  },
  {
    question: 'Does this tool work without internet?',
    answer:
      'Once loaded, resizing runs locally in your browser without server round-trips, though offline execution is not guaranteed because no service worker is registered.',
  },
  {
    question: 'Does resizing the same image twice reduce quality?',
    answer:
      'Yes, especially if the format is JPEG or WebP. Each re-encode loses some quality. Start from the original file whenever possible.',
  },
];

export const REFERENCES: readonly Reference[] = [
  {
    label: 'MDN: Using the Canvas API',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API',
    note: 'The browser API used for resizing.',
  },
  {
    label: 'MDN: Web Workers',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API',
    note: 'The mechanism that keeps processing off the main thread.',
  },
  {
    label: 'MDN: ImageBitmap',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap',
    note: 'The decoded image format used by the resizer.',
  },
];

export const INTERNAL_LINKS: readonly InternalLink[] = [
  { label: 'Image Compressor', path: '/image-compressor/' },
  { label: 'About AHADEX Tools', path: '/about/' },
  { label: 'Privacy Policy', path: '/privacy-policy/' },
];

/** Output format options for the UI select. */
export const OUTPUT_FORMATS = [
  { value: 'jpeg' as const, label: 'JPEG', note: 'Smaller, no transparency' },
  { value: 'webp' as const, label: 'WebP', note: 'Modern, smaller files' },
  { value: 'png' as const, label: 'PNG', note: 'Lossless, larger files' },
] as const;
