# GEO / AEO Strategy

Guidelines for Generative Engine Optimization (GEO) and Answer Engine
Optimization (AEO). The goal is to be cited correctly by AI systems and
to answer user questions directly.

## What GEO and AEO mean

- **GEO** - optimizing content so generative AI systems (ChatGPT,
  Claude, Perplexity, Gemini) cite it accurately.
- **AEO** - optimizing content so answer engines (Google SGE, Bing Chat,
  featured snippets) surface it as a direct answer.

The two overlap heavily. Both rely on clear, factual, well-structured
content.

## Principles

1. **Facts over opinions.** Every claim must be verifiable.
2. **Entities over topics.** Name specific entities (tools, formats,
   file sizes, browsers) so AI systems can link them.
3. **Direct answers first.** Lead with the answer, then explain.
4. **Consistent entity descriptions.** The same tool description must
   appear in `manifest.ts`, the page hero and any structured data.
5. **Structured data.** JSON-LD communicates entities and relationships
   to search and AI systems.

## Entity consistency

Every tool has a single canonical description:

- `src/tools/<slug>/manifest.ts` - the canonical source.
- `src/tools/<slug>/Hero.tsx` - the on-page hero.
- JSON-LD on the tool page - generated from the manifest.
- `public/sitemap.xml` - generated from the manifest.

Any drift between these four breaks GEO. The validator
`scripts/tasks/geo/validate-entity-consistency.ts` (planned) checks for
drift.

## Answer-first structure

Every tool page must include a "What is this tool?" section that
answers in one sentence:

> "[Tool name] is a free, browser-based tool that [does X] without
> uploading your files."

This sentence is what answer engines will quote.

## FAQ structure

Each FAQ must be:

- A real question a user would ask.
- Answered in 2-3 sentences.
- Written in the same language as the rest of the page.
- Marked up with `FAQPage` JSON-LD.

## AI readability

- Use short paragraphs (2-3 sentences).
- Use bullet lists for steps and options.
- Use headings that state the answer, not just the topic.
- Avoid ambiguity: name specific file formats, sizes and browsers.
- Avoid marketing fluff.

## Validation

- `scripts/tasks/geo/validate-answer-structure.ts` (planned) - checks
  the "What is this tool?" section exists.
- `scripts/tasks/geo/validate-entity-consistency.ts` (planned) - checks
  manifest vs hero vs JSON-LD.
- `scripts/tasks/geo/validate-ai-readability.ts` (planned) - checks
  paragraph length, list usage, heading structure.
- `scripts/tasks/geo/validate-factual-content.ts` (planned) - flags
  unverified claims ("best", "fastest").

## Related documents

- `seo-strategy.md`
- `content-guidelines.md`
- `keyword-research.md`
