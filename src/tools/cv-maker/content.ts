/**
 * Authoritative content source for CV Maker.
 * Written cleanly for AdSense, helpfulness, and GEO/AEO clarity with zero exaggerated claims.
 */

import { DIRECT_ANSWER } from './geo';

export { DIRECT_ANSWER };

export const HERO = {
  h1: 'CV Maker',
  tagline:
    'Build a tailored resume from 30 unique templates and export a clean PDF in your browser.',
  subtitle: 'Zero account signups, zero watermarks, and zero personal data uploaded to any server.',
  trustSignals: [
    '30 unique CV templates',
    'Profession-tailored starters',
    'Instant local PDF download',
  ],
} as const;

export const SECTIONS = [
  {
    heading: 'What this CV Maker does',
    paragraphs: [
      'AHADEX CV Maker guides you through creating a structured curriculum vitae from start to finish inside your browser tab. Instead of starting from an intimidating blank document or paying for gated PDF exports, you begin by choosing from 30 distinct visual templates ranging from ATS-compliant single-column formats to sidebar, timeline, Swiss grid, editorial serif, and modular bento layouts.',
      'Once you select a template, picking your profession automatically pre-fills realistic starter copy for your professional summary, work experience bullets, degree history, and core skills. Every field remains completely editable: rewrite text, add multiple schools or employers, upload an optional portrait photo, reorder skills, and generate a crisp vector A4 PDF locally.',
    ],
    list: [
      '30 visually distinct templates across ATS, sidebar, timeline, creative, and minimal categories',
      '12 curated profession presets that pre-populate role-appropriate wording and metrics',
      'Optional portrait photo embedding supporting JPG, PNG, and WebP images',
      'Unlimited additions or deletions across work experience, degrees, skills, and certifications',
      'True client-side A4 vector PDF generation via pdf-lib with selectable text',
      'Zero watermarks, zero email gates, and zero server-side storage of personal career details',
    ],
  },
  {
    heading: 'How to choose the right CV template',
    paragraphs: [
      'Recruiters and automated Applicant Tracking Systems (ATS) scan resumes differently depending on industry conventions. Traditional corporate, finance, legal, and high-volume enterprise portals often favor clean single-column or structured serif sheets such as Manhattan ATS, Geneva Classic, or Oxford Scholar because linear reading order minimizes parsing ambiguity.',
      'Creative studios, product design teams, marketing departments, and modern technology startups frequently appreciate stronger visual hierarchy. Two-column sidebar designs like Obsidian Rail or Fjord Slate place contact details and skill matrices neatly along one edge while keeping career accomplishments readable in the main column, and timeline layouts such as Zurich Timeline highlight steady career progression.',
    ],
  },
  {
    heading: 'Tailoring content by profession and measurable impact',
    paragraphs: [
      'Generic resume summaries rarely stand out during a six-second recruiter scan. Selecting a matching profession in Step 2 provides realistic role structure—such as latency reductions and system scale for Software Engineers, conversion lift and usability studies for Product Designers, or month-end close velocity and IFRS compliance for Finance Managers.',
      'Treat the pre-filled demo text as a scaffold rather than final copy. Replace sample company names, swap in your real numbers (revenue saved, team size mentored, uptime achieved, or patient volume cared for), and remove skills you cannot comfortably discuss during a technical interview. Focused specificity signals credibility far better than padded buzzwords.',
    ],
  },
  {
    heading: 'Including profile photos, degrees, and certifications thoughtfully',
    paragraphs: [
      'Resume photo expectations vary widely by country and hiring culture. Across Europe, the Middle East, and parts of Asia, a well-lit headshot is frequently welcomed on CVs. Conversely, employers in the United States, United Kingdom, and Canada generally prefer photo-free resumes to support fair screening practices. CV Maker makes portrait photos strictly optional so you can include or remove one in a single click.',
      'In the education step, add one or multiple schools, universities, or vocational diplomas in reverse-chronological order. Recent graduates can highlight relevant coursework, thesis topics, or academic honors, while experienced professionals can keep education concise and spotlight recent certifications, licenses, or language fluencies in the skills step.',
    ],
  },
  {
    heading: 'Client-side PDF rendering and data privacy',
    paragraphs: [
      'Your resume contains sensitive personal identifiers—full name, phone number, residential city, email address, and complete employment timeline. Uploading that profile to third-party cloud builders exposes your records to remote databases and marketing lists.',
      'AHADEX CV Maker performs all layout styling, image encoding, and vector PDF assembly strictly in local browser memory using pdf-lib. Your uploaded portrait photo and career history never cross the network to an API server. Refreshing or closing the browser tab immediately clears the working state from memory.',
    ],
  },
  {
    heading: 'Technical behavior and practical limits',
    paragraphs: [
      'To preserve fast browser execution and reliable ATS text extraction across PDF viewers, the PDF engine embeds standard vector PDF fonts (Helvetica, Times Roman, and Courier accents) with clean WinAnsi character normalization. Automatic page breaking flows long career histories onto a second A4 sheet whenever vertical space fills.',
      'Because processing is entirely browser-local with zero cloud accounts, drafts are not stored on remote servers across devices. Standard PDF output renders crisp selectable text, and if you later need to attach supporting certificates or shrink file size below strict job-portal caps, you can combine or optimize the exported file using our Merge PDF and PDF Compressor tools.',
    ],
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Choose one of 30 templates',
    body: 'Filter by ATS, sidebar, creative, technical, or minimal styles and pick the visual layout that fits your industry.',
  },
  {
    step: 2,
    title: 'Pick your profession preset',
    body: 'Select your target role to auto-populate a realistic starter summary, work history bullets, education entry, and skill chips.',
  },
  {
    step: 3,
    title: 'Edit each section step by step',
    body: 'Update personal contact info, upload an optional photo, customize summary bullets, and add or remove jobs and school degrees.',
  },
  {
    step: 4,
    title: 'Preview & download PDF',
    body: 'Review the live A4 document preview, set your preferred filename, and download a watermark-free PDF locally.',
  },
] as const;

export const USE_CASES = [
  {
    title: 'Targeted job applications',
    body: 'Start from a tailored profession preset, adjust metrics for a specific job description, and export a clean PDF in minutes.',
  },
  {
    title: 'Recent graduate & academic CVs',
    body: 'Add multiple schools, degrees, honors, and project skills using clean editorial serif or ATS single-column templates.',
  },
  {
    title: 'Career switchers & freelancers',
    body: 'Try multiple templates on the same edited career data—from Zurich Timeline to Bento Slate—without retyping your experience.',
  },
  {
    title: 'Privacy-sensitive executive roles',
    body: 'Draft confidential employment history and compensation-adjacent achievements entirely in local memory with zero cloud account.',
  },
] as const;

export const SUPPORTED_FORMATS = [
  {
    name: 'Output Document',
    spec: 'A4 Vector PDF (595 x 842 pt)',
    behavior: 'Selectable text, crisp vector lines, multi-page overflow support',
  },
  {
    name: 'Portrait Photo (Optional)',
    spec: 'JPG, PNG, WebP (up to 10 MB)',
    behavior: 'Resampled locally in canvas and embedded cleanly into PDF',
  },
  {
    name: 'Templates & Presets',
    spec: '30 templates · 12 profession starters',
    behavior: 'Switch layouts or reload role starter copy at any step',
  },
] as const;

export const PRIVACY = {
  heading: 'Privacy and local browser handling',
  paragraphs: [
    'All form inputs, uploaded profile photos, live HTML previews, and generated PDF bytes remain strictly inside your browser tab memory. Zero personal career records are transmitted to external servers.',
    'Because no user accounts or remote databases exist on AHADEX Tools, nothing is retained once you close the page unless you save the downloaded PDF to your device.',
  ],
} as const;

export const LIMITATIONS = {
  heading: 'Limitations and compatibility notes',
  list: [
    'Drafts stay inside browser memory during your active session and are not synced across devices.',
    'Maximum portrait photo upload size is 10 MB (JPG, PNG, or WebP) to keep PDF exports lightweight.',
    'Standard PDF font subsets normalize specialized emojis or non-Latin symbols so every PDF opens reliably.',
    'Long resumes automatically expand across multiple A4 pages when content exceeds one page height.',
  ],
} as const;

export const FAQ = [
  {
    question: 'Is this CV Maker completely free without hidden paywalls?',
    answer:
      'Yes. All 30 templates, all profession presets, optional photo embedding, and full A4 PDF downloads are free with zero watermarks and no credit card or signup prompts.',
  },
  {
    question: 'Are my resume details or profile photo uploaded to a server?',
    answer:
      'No. Every template preview and PDF file is assembled locally in your browser using JavaScript and pdf-lib. Your personal contact info and career history never leave your device.',
  },
  {
    question: 'What happens when I select a profession in Step 2?',
    answer:
      'Choosing a profession automatically populates a tailored professional summary, sample work experience entries, an education degree block, and relevant skills so you can edit or customize faster.',
  },
  {
    question: 'Can I add multiple schools, degrees, and job experiences?',
    answer:
      'Yes. Both the Work Experience and Education steps let you add as many jobs, degrees, or schools as needed, edit dates and locations, and delete individual bullets or entries anytime.',
  },
  {
    question: 'Can I switch CV templates after writing my information?',
    answer:
      'Yes. All 30 templates share the exact same structured resume data, so you can return to the template step or switch layouts in the final preview without losing any edits.',
  },
  {
    question: 'Is the downloaded PDF ATS-friendly and text-selectable?',
    answer:
      'Yes. Unlike image-screenshot resume builders, our PDF engine writes real vector text objects using pdf-lib, keeping headlines, experience bullets, and links selectable and searchable.',
  },
  {
    question: 'Should I include a photo on my CV?',
    answer:
      'It depends on your target country and role. Regions like continental Europe and parts of Asia often accept portrait photos, whereas North America and UK employers typically prefer photo-free CVs. Photos are strictly optional.',
  },
  {
    question: 'How do I compress my CV PDF or merge certificates afterward?',
    answer:
      'Once your CV downloads as a PDF, you can combine it with cover letters or certificates using Merge PDF, or reduce its file size for strict upload portals with PDF Compressor.',
  },
  {
    question: 'Does CV Maker continue working without internet after loading?',
    answer:
      'Once the page assets have loaded in your browser, editing steps and PDF generation happen locally on your device, though reliable offline reloading is not guaranteed without a network connection.',
  },
  {
    question: 'What happens if my CV is longer than one page?',
    answer:
      'The PDF engine tracks vertical cursor position and automatically continues remaining experience, education, or skill sections cleanly onto a second A4 page rather than clipping text.',
  },
] as const;

export const REFERENCES = [
  {
    label: 'ISO 32000-1 PDF Document Specification',
    url: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf',
    note: 'Standard governing portable A4 PDF geometry, vector text streams, and embedded images.',
  },
  {
    label: 'W3C Web Accessibility Initiative (WCAG 2.2)',
    url: 'https://www.w3.org/TR/WCAG22/',
    note: 'Guidelines for semantic headings, reading hierarchy, and accessible form controls.',
  },
  {
    label: 'MDN: HTMLCanvasElement & Blob File APIs',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Blob',
    note: 'Browser-native APIs used for local portrait normalization and zero-upload PDF downloads.',
  },
] as const;

export const INTERNAL_LINKS = [
  { label: 'Merge PDF', path: '/merge-pdf/' },
  { label: 'PDF Compressor', path: '/pdf-compressor/' },
  { label: 'Image Resizer', path: '/image-resizer/' },
  { label: 'All AHADEX Tools', path: '/' },
] as const;
