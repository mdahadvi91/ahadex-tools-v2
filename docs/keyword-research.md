# Keyword Research

Initial keyword map for AHADEX Tools. Update this file whenever a new
tool is added or content is revised.

## Primary tool keywords

Each tool targets a primary keyword cluster. The exact-match keyword is
the tool name; secondary keywords expand the privacy and offline angles.

### Image Compressor

| Type | Keyword |
|---|---|
| Primary | image compressor |
| Secondary | compress image online, free image compressor |
| Privacy | private image compressor, offline image compressor |
| Long-tail | compress png without uploading, compress jpeg without server |
| Long-tail | bulk image compressor no signup |

### Image Resizer

| Type | Keyword |
|---|---|
| Primary | image resizer |
| Secondary | resize image online, change image dimensions |
| Privacy | private image resizer, offline image resizer |
| Long-tail | resize image without uploading, resize photo without signup |
| Long-tail | resize image for instagram without uploading |

### Merge PDF

| Type | Keyword |
|---|---|
| Primary | merge pdf |
| Secondary | combine pdf files, join pdf online |
| Privacy | private pdf merger, offline pdf merge |
| Long-tail | merge pdf without uploading, merge pdf offline |
| Long-tail | combine pdf files without adobe |

### Split PDF

| Type | Keyword |
|---|---|
| Primary | split pdf |
| Secondary | split pdf online, separate pdf pages |
| Privacy | private pdf splitter, offline pdf split |
| Long-tail | split pdf into separate files, split pdf pages without uploading |

### PDF Compressor

| Type | Keyword |
|---|---|
| Primary | pdf compressor |
| Secondary | compress pdf online, reduce pdf size |
| Privacy | private pdf compressor, offline pdf compressor |
| Long-tail | compress pdf without uploading, compress pdf to specific size |
| Long-tail | compress scanned pdf without losing quality |

## Content keywords

These support the tool pages but are not tied to a specific tool.

| Topic | Keywords |
|---|---|
| Privacy-first tools | free private online tools, browser-based tools |
| Offline support | tools that work offline, offline file tools |
| No upload | process files without uploading, file tools no upload |

## Search intent

Each keyword targets one of these intents:

- **Transactional** - user wants to do the task now ("compress image").
- **Comparison** - user compares tools ("best image compressor").
- **Informational** - user learns ("how to compress an image").

Tool pages target transactional. Blog posts (future) target informational.

## Cannibalization rules

- A tool page owns its exact-match keyword.
- No two pages may target the same primary keyword.
- Related tools may share long-tail keywords only if their pages
  clearly differ in scope.

The planned validator `scripts/tasks/seo/validate-keyword-cannibalization.ts`
enforces this.

## Related documents

- `seo-strategy.md`
- `geo-aeo-strategy.md`
- `content-guidelines.md`
