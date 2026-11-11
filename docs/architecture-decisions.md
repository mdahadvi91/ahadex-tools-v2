# Architecture Decision Records (ADRs)

Every structural change to this project requires a numbered ADR in
`docs/adr/` and explicit approval. This file is the index.

## Decision log

| # | Title | Status | Date |
|---|---|---|---|
| 001 | Toolchain version policy | Accepted | 2026-11-11 |
| 002 | Baseline extensions (IconButton, Sidebar, icons, Tools, adapter) | Accepted | 2026-11-11 |

## ADR format

Each ADR has:

- **Status** - proposed, accepted, deprecated or superseded
- **Date** - when it was accepted
- **Deciders** - who signed off
- **Context** - the problem being solved
- **Decision** - what was decided
- **Consequences** - tradeoffs accepted
- **Alternatives Considered** - other options evaluated
- **References** - links to discussion or external sources

## Adding a new ADR

1. Copy the last ADR file as a template.
2. Increment the number.
3. Update this table.
4. Commit both files together.
5. Link the ADR in any file that references the decision.

## Purpose of this process

The purpose is to record *why* a structural decision was made, so that
a future reader does not have to reverse-engineer intent from code.
It also prevents ad-hoc restructuring: any future structural change
that contradicts a frozen baseline must come with a new ADR.

## Related documents

- `architecture.md` - current architecture overview
- `development-workflow.md` - scheduling and review rules
- `docs/adr/` - the ADR files themselves
