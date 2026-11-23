/**
 * Content constants for the Split PDF tool.
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
  h1: 'Split PDF',
  tagline:
    'Extract custom page ranges or split every page of a PDF into individual PDF files right in your browser.',
  subtitle:
    'No account required. Documents stay in browser memory on your device and are never uploaded to a server.',
  trustSignals: ['Runs in your browser', 'No account required', 'No file upload'],
} as const;

export const DIRECT_ANSWER =
  'Split PDF is a free browser-based utility that extracts specific page ranges into a standalone PDF or separates every page into individual single-page PDF documents locally on your device without server uploads.';

export const SECTIONS: readonly ContentSection[] = [
  {
    heading: 'What this tool does',
    paragraphs: [
      'Split PDF loads your selected PDF into browser memory, reads the exact page count immediately, and gives you two focused ways to split the document: extract a custom selection of pages into a new PDF, or split every page into separate one-page PDF files.',
      'All page extraction runs client-side with pdf-lib inside your browser tab. Your document is never transmitted to a server, making it safe for private reports, invoices, contracts, and identity records.',
    ],
    list: [
      'Mode 1 — Extract custom pages: Enter ranges like "1-3, 5, 8-10" to create one clean PDF',
      'Mode 2 — Split every page: Generate an individual PDF file for each page in the source',
      'Instant page-count inspection when you select a PDF',
      'Preserves text selection, vector shapes, fonts, and page dimensions losslessly',
      'Download individual pages one at a time or download all generated chunks',
      'Supports PDFs up to 50 MB without watermarks or signups',
    ],
  },
  {
    heading: 'How page range extraction works',
    paragraphs: [
      'When extracting a custom range, enter 1-based page numbers separated by commas, hyphens, or both. For instance, entering "1-4" extracts pages 1 through 4 in order. Entering "2, 5-7, 10" builds a 5-page PDF containing pages 2, 5, 6, 7, and 10.',
      'Before running pdf-lib, the parser validates every number and hyphenated range against the total page count of your uploaded PDF. Out-of-bounds numbers, reversed ranges like "8-3", or invalid characters show a helpful validation error rather than producing corrupted output.',
      'During splitting, only the selected page trees and their referenced fonts or images are copied into the destination PDF, keeping resulting files lean and accurate.',
    ],
  },
  {
    heading: 'When to extract a range vs split every page',
    paragraphs: [
      'Choose custom range extraction when a 40-page contract, annual report, or scanned statement pack contains a few pages you actually need to forward to a teammate or upload to a form portal.',
      'Choose every-page splitting when a scanner combined ten separate receipts, shipping labels, or single-page worksheets into a single batch PDF and you want each sheet saved as its own file.',
    ],
  },
  {
    heading: 'Combining Split PDF with Merge PDF and PDF Compressor',
    paragraphs: [
      'Many document workflows require removing extra pages from two PDFs and then combining the remaining parts. Use Split PDF to extract only the pages you need from each file, then open Merge PDF to assemble the final packet in your preferred order.',
      'If the extracted file still includes leftover metadata headers, run the result through PDF Compressor afterward.',
    ],
  },
  {
    heading: 'Privacy and local browser processing',
    paragraphs: [
      'Bank statements, tax forms, signed HR documents, and student transcripts frequently contain confidential fields alongside pages you do not wish to share. Uploading the entire source PDF to a remote server just to isolate two pages exposes the rest of the file unnecessarily.',
      'AHADEX Tools reads the file directly from disk into browser memory and isolates the requested pages locally. Zero file bytes ever leave your computer or phone, and closing the tab clears the memory buffer.',
    ],
  },
  {
    heading: 'Technical limits and encrypted PDFs',
    paragraphs: [
      'Split PDF supports standard unencrypted PDF files up to 50 MB in size. Password-protected PDFs cannot have their page trees copied until the password protection is removed.',
      'When splitting every page of a very large document (for example, 100+ pages), browsers may prompt for permission to download multiple files automatically; using the individual download buttons next to any page always works reliably.',
    ],
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Select a PDF document',
    body: 'Drop a PDF file into the drop zone or choose one from your device. The workspace detects the total page count automatically.',
  },
  {
    step: 2,
    title: 'Pick your split mode',
    body: 'Choose Custom Page Range (for example, 1-3, 5) or Split Every Page into individual single-page PDFs.',
  },
  {
    step: 3,
    title: 'Extract and download',
    body: 'Click Split PDF to generate the extracted document(s) in local memory and download them immediately.',
  },
] as const;

export const USE_CASES: readonly UseCase[] = [
  {
    title: 'Extract signature pages',
    body: 'Pull just the final signed page or notary acknowledgment out of a multi-page agreement without sending the full contract.',
  },
  {
    title: 'Separate batch-scanned receipts',
    body: 'Split a multi-page scanner dump into one standalone PDF per receipt or invoice for expense reporting.',
  },
  {
    title: 'Trim large reports for portals',
    body: 'Keep only relevant financial schedules or executive summary pages so your upload stays under strict portal limits.',
  },
  {
    title: 'Isolate printable worksheets',
    body: 'Extract selected homework chapters or answer sheets from a longer textbook PDF.',
  },
];

export const SUPPORTED_INPUT_FORMATS = [
  {
    name: 'PDF',
    mime: 'application/pdf',
    lossy: false,
    transparency: true,
    note: 'Standard unencrypted PDF documents up to 50 MB.',
  },
] as const;

export const PRIVACY = {
  heading: 'Privacy summary',
  paragraphs: [
    'Split PDF processes your PDF strictly inside local browser memory. No pages, filenames, or document buffers leave your device.',
    'Clearing the file or closing the browser tab releases memory references immediately.',
  ],
} as const;

export const LIMITATIONS = {
  heading: 'Technical limits',
  list: [
    'Maximum file size: 50 MB per PDF document.',
    'Password-protected or encrypted PDFs must be unlocked before splitting.',
    'Single-page burst outputs generate one file per page (best suited for documents up to ~50 pages at once).',
    'Cryptographic PDF signatures apply to the original whole file and are not preserved on extracted subsets.',
  ],
} as const;

export const FAQ: readonly FAQItem[] = [
  {
    question: 'Are my PDF files sent to a server when splitting?',
    answer:
      'No. Reading the PDF, parsing page trees, and creating the split output files happen entirely inside your browser tab.',
  },
  {
    question: 'How do I format custom page ranges?',
    answer:
      'Use commas and hyphens with 1-based page numbers, such as "1-3, 5, 8-10". Duplicates are removed cleanly and every range is checked against the total page count.',
  },
  {
    question: 'Can I split a PDF into individual one-page PDFs?',
    answer:
      'Yes. Select the "Split every page" option to turn each page into its own standalone PDF download.',
  },
  {
    question: 'Does splitting affect text clarity or image quality?',
    answer:
      'No. Pages and their resources are copied structurally at full original quality, preserving selectable text, fonts, and vectors.',
  },
  {
    question: 'What is the maximum file size I can split?',
    answer: 'Up to 50 MB per PDF document, matching our standard PDF memory-safety policy.',
  },
  {
    question: 'Can I extract pages from a password-protected PDF?',
    answer:
      'No. Encrypted PDFs require unlocking first because their page objects cannot be copied without decryption.',
  },
  {
    question: 'Is there any watermark or limit on how many pages I can extract?',
    answer:
      'No watermarks and no page quotas. Extract as many ranges as your browser memory comfortably handles.',
  },
  {
    question: 'Does Split PDF work offline?',
    answer:
      'Because this site does not register a service worker, you need an internet connection to load the page initially. Once loaded, splitting runs locally without network requests, though offline reloads are not guaranteed.',
  },
];

export const REFERENCES: readonly Reference[] = [
  {
    label: 'ISO 32000-1 PDF Page Tree Specification',
    url: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf',
    note: 'Covers how PDF page dictionaries and inherited page attributes operate.',
  },
  {
    label: 'MDN: Blob & Object URLs',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static',
    note: 'Used to offer extracted PDF files for instant browser download.',
  },
];

export const INTERNAL_LINKS: readonly InternalLink[] = [
  { label: 'Merge PDF', path: '/merge-pdf/' },
  { label: 'PDF Compressor', path: '/pdf-compressor/' },
  { label: 'Image Resizer', path: '/image-resizer/' },
  { label: 'Privacy Policy', path: '/privacy-policy/' },
];
