# Content Guidelines

Rules for writing every user-facing page and every tool description.

## Voice and tone

- Direct, factual, no marketing superlatives.
- Use second person ("your file", "you can").
- Short sentences (under 20 words when possible).
- No emoji in body text. Emoji allowed only in decorative UI, not content.

## Structure

Every public page follows this structure:

1. `<h1>` - the tool or page name, once.
2. Lead paragraph - one sentence answering "what is this?".
3. `<h2>` section - "How it works" or "How to use".
4. `<h2>` section - "Privacy" (for tools) or "Details".
5. `<h2>` section - "FAQ" (3-5 real questions).
6. Internal links to related pages.

## Headings

- One `<h1>` per page.
- `<h2>` sections in logical order.
- `<h3>` subsections only when needed.
- Never skip levels (no `<h2>` to `<h4>`).
- Headings must state the topic, not just label it.
  - Good: "Compress PNG files without losing transparency"
  - Bad: "Compression"

## Paragraphs

- 2-3 sentences max.
- One idea per paragraph.
- No wall of text.

## Lists

- Use `<ul>` for options, `<ol>` for steps.
- Keep items parallel in structure.
- No more than 7 items per list.

## Links

- Internal links use relative paths starting with `/`.
- External links open in the same tab (privacy, no `target="_blank"`
  without `rel="noopener"`).
- Every link must have descriptive text, not "click here".

## File descriptions

Tool descriptions appear in three places that must match:

- `src/tools/<slug>/manifest.ts` - `description` field.
- `src/tools/<slug>/Hero.tsx` - hero paragraph.
- JSON-LD `WebApplication` `description` field.

The validator `scripts/tasks/geo/validate-entity-consistency.ts`
(planned) checks for drift.

## FAQ writing

- Real questions users would ask.
- Answered in 2-3 sentences.
- No rhetorical questions.
- Marked up with `FAQPage` JSON-LD.

## What to avoid

- False claims (e.g. "the best compressor").
- Unverifiable claims (e.g. "100x faster").
- Claims about competitor tools.
- Promises about file quality without a specific definition.
- Any claim that cannot be proven from source or measurement.

## Related documents

- `seo-strategy.md`
- `geo-aeo-strategy.md`
- `keyword-research.md`
