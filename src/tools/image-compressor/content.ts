/**
 * Content constants for the Image Compressor tool. All factual
 * claims must be verifiable from the engine code, file-policy, or
 * network behavior observable in browser DevTools.
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
  h1: 'Image Compressor',
  tagline:
    'Reduce the file size of JPG, PNG, WebP, GIF and AVIF images by re-encoding them in your browser.',
  subtitle:
    'No account required. Files are processed in browser memory and never transmitted to a server.',
  trustSignals: ['Runs in your browser', 'No account required', 'No file upload'],
} as const;

export const DIRECT_ANSWER =
  'Image Compressor is a free browser-based tool that reduces the file size of JPG, PNG, WebP, GIF and AVIF images by re-encoding them locally using the browser Canvas API. Files are not transmitted to a server during processing, and no account is required.';

export const SECTIONS: readonly ContentSection[] = [
  {
    heading: 'What this tool does',
    paragraphs: [
      'This tool reduces the size of image files by re-encoding them at a lower quality or a smaller resolution. Processing happens inside your browser using the Canvas API and a Web Worker. The original file is read from your device and is not sent to a server for processing.',
      'You can select an output format (JPEG, WebP or PNG), adjust the compression quality, and optionally cap the maximum dimension. The compressed file is offered as a download with a suggested name.',
    ],
    list: [
      'Input formats: JPG, PNG, WebP, GIF, AVIF',
      'Output formats: JPEG, WebP, PNG',
      'Adjustable quality from 10% to 100%',
      'Optional resize to a maximum width or height',
      'Batch: compress multiple images in one session',
      'No watermark, no account required',
    ],
  },
  {
    heading: 'How compression works',
    paragraphs: [
      'When you add a file, your browser reads it into memory as a Blob and passes it to a Web Worker. The worker decodes the image into pixels, draws it onto an offscreen canvas at the requested output size, and re-encodes it at the chosen quality. The result is passed back to the page as a downloadable Blob.',
      'Speed depends on your device and the image size. A typical 3 MB photo compresses in under a second on a modern laptop. Files over 10 MB may take a few seconds on mobile devices.',
      'The quality slider controls how aggressively pixels are sampled. Lower values produce smaller files but visible artifacts. Higher values preserve more detail. The setting applies to every file in the current session.',
    ],
  },
  {
    heading: 'Which format should I choose?',
    paragraphs: ['The best format depends on the content and whether transparency matters.'],
    list: [
      'JPEG: small files for photographs and gradients. No transparency. Best when file size matters more than perfect edges.',
      'WebP: good balance of quality and size for modern browsers. Supports transparency. Typically smaller than JPEG at similar visual quality.',
      'PNG: lossless, supports transparency. Files are larger but visual quality is preserved. Use for screenshots, text, line art and sharp edges.',
      'GIF: supported as input. Output is single-frame. Not recommended for photographs.',
      'AVIF: supported as input. Output is not currently supported because browser encoder support varies.',
    ],
  },
  {
    heading: 'When to use this tool',
    paragraphs: [
      'Use this tool when you need to reduce image size before uploading to a website, attaching to an email, or sharing on a platform with a file size limit. It is also useful when you want to convert a screenshot PNG to a smaller JPEG or WebP without opening a desktop application.',
      'If you need to change pixel dimensions rather than file size, use the Image Resizer tool instead.',
    ],
  },
  {
    heading: 'Privacy and data handling',
    paragraphs: [
      'Your image is read from your device into browser memory and processed by code running locally in the tab. The file is not sent to a server for processing. When you close the tab or reload the page, the reference to the file in memory is released.',
      'The site itself loads over the network like any web page. Your browser requests the HTML, JavaScript and CSS needed to run the tool, plus fonts and images used by the interface. These requests do not contain your file.',
      'The site collects analytics only if you grant consent. If you grant analytics consent, aggregate usage events such as "a tool was opened" or "an image was compressed" are recorded with an approximate file size bucket. File names, contents and exact sizes are not sent.',
    ],
  },
  {
    heading: 'Limitations',
    paragraphs: [
      'Compression cannot recover quality that was lost when the original image was created or previously compressed. Re-compressing an already-compressed JPEG may produce visible artifacts or, in rare cases, a larger file.',
      'PNG is lossless. Re-encoding a PNG does not reduce visual quality, but the file may grow if the original was already well-compressed. For smaller PNG output, switch to WebP when transparency is required, or JPEG when it is not.',
      'The maximum input size is 25 MB per image, and the maximum decoded pixel count is 80 megapixels. These limits protect browser memory. Files above these limits fail before processing begins.',
    ],
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Add images',
    body: 'Drag one or more images into the drop zone, or click to open your file browser. Each file is checked for supported format and size before processing.',
  },
  {
    step: 2,
    title: 'Pick your settings',
    body: 'Choose the output format and quality. Optionally cap the maximum dimension to resize large photos. Presets set sensible defaults.',
  },
  {
    step: 3,
    title: 'Compress and download',
    body: 'The browser decodes, resizes and re-encodes each file locally. Download the result when complete.',
  },
] as const;

export const USE_CASES: readonly UseCase[] = [
  {
    title: 'Website images',
    body: 'Reduce hero images, thumbnails and blog images before uploading to a CMS. Smaller images improve page load speed and reduce bandwidth cost.',
  },
  {
    title: 'Email attachments',
    body: 'Many providers cap attachments at 10 MB or 25 MB. Compressing photos to 1-2 MB each keeps the email deliverable without a cloud link.',
  },
  {
    title: 'Marketplace listings',
    body: 'Photo uploads on marketplaces are often capped in size and dimension. Compress and resize in one step.',
  },
  {
    title: 'Documentation and reports',
    body: 'Screenshots saved as PNG can be converted to JPEG or WebP when the file must fit a specific size limit.',
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
    'Files are loaded into browser memory and processed by a Web Worker running on your device. The file is not sent to a server for compression.',
    'The site collects aggregate analytics only if you grant consent. Analytics events do not include file names, file contents or exact file sizes.',
    'Consent is stored in a single first-party cookie and can be changed at any time from the settings panel.',
  ],
} as const;

export const LIMITATIONS = {
  heading: 'Limits to be aware of',
  list: [
    'Maximum input size: 25 MB per image.',
    'Maximum decoded pixels: 80 million.',
    'GIF output is not supported; only the first frame is used.',
    'AVIF output is not supported yet; use WebP or JPEG.',
    'JPEG and WebP compression are lossy. Visual quality decreases at lower quality settings.',
    'PNG output is lossless and may not reduce file size for already-optimized PNGs.',
  ],
} as const;

export const FAQ: readonly FAQItem[] = [
  {
    question: 'Is my image sent to a server?',
    answer:
      'No. The file is read into browser memory and compressed by code running locally in your browser. The file is not transmitted to a server for processing.',
  },
  {
    question: 'What file size can I compress?',
    answer:
      'Up to 25 MB per image. This limit is enforced before processing to protect browser memory.',
  },
  {
    question: 'Which image formats are supported?',
    answer:
      'Input: JPG, JPEG, PNG, WebP, GIF and AVIF. Output: JPEG, WebP and PNG. GIF animations are not preserved; only a single frame is output.',
  },
  {
    question: 'Does compression reduce image quality?',
    answer:
      'JPEG and WebP use lossy compression, so some quality is lost at lower settings. PNG output is lossless. Adjust the quality slider to balance size against visual quality.',
  },
  {
    question: 'Does this tool work without internet?',
    answer:
      'After the first load, some parts of the tool may continue to work because the browser has cached the page. However, this site does not currently include a service worker, so it is not guaranteed to work offline.',
  },
  {
    question: 'Can I compress multiple images at once?',
    answer:
      'Yes. Add multiple files; each is processed independently and can be downloaded individually or together.',
  },
  {
    question: 'Is there a watermark or signup?',
    answer: 'No watermark and no signup. The tool is free to use and does not require an account.',
  },
  {
    question: 'Why is my PNG larger after compression?',
    answer:
      'PNG is lossless. Re-encoding may occasionally increase file size. Choose WebP or JPEG output for a smaller file when transparency is not required.',
  },
  {
    question: 'What is the difference between JPEG and WebP?',
    answer:
      'WebP typically produces smaller files at similar visual quality and supports transparency. JPEG is more widely supported by older software and does not support transparency.',
  },
  {
    question: 'Does compressing the same image twice reduce quality?',
    answer:
      'Yes, for lossy formats. Each re-encode of a JPEG or WebP image loses some quality. Start from the original file whenever possible.',
  },
];

export const REFERENCES: readonly Reference[] = [
  {
    label: 'MDN: Using the Canvas API',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API',
    note: 'The browser API used for image re-encoding.',
  },
  {
    label: 'MDN: Web Workers',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API',
    note: 'The mechanism that keeps processing off the main thread.',
  },
  {
    label: 'WebP compression study',
    url: 'https://developers.google.com/speed/webp/docs/webp_study',
    note: 'Google study comparing WebP vs JPEG sizes.',
  },
];

export const INTERNAL_LINKS: readonly InternalLink[] = [
  { label: 'Image Resizer', path: '/tools/image-resizer' },
  { label: 'About AHADEX Tools', path: '/about' },
  { label: 'Privacy Policy', path: '/privacy' },
];

/** Output format options for the UI select. */
export const OUTPUT_FORMATS = [
  { value: 'jpeg' as const, label: 'JPEG', note: 'Smallest, no transparency' },
  { value: 'webp' as const, label: 'WebP', note: 'Best size for modern browsers' },
  { value: 'png' as const, label: 'PNG', note: 'Lossless, larger files' },
] as const;
