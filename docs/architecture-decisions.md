# Architecture Decision Records (ADRs)

Every structural change requires a numbered ADR in `docs/adr/` and
explicit approval. This file is the index.

## Decision log

| #   | Title                     | Status                          | Date       |
| --- | ------------------------- | ------------------------------- | ---------- |
| 001 | Toolchain version policy  | Accepted                        | 2026-11-11 |
| 002 | Baseline extensions       | Accepted                        | 2026-11-11 |
| 003 | Static rendering strategy | Accepted (SPA); SSG POC pending | 2026-11-15 |
| 004 | Web Worker processing     | Accepted                        | 2026-11-15 |
| 005 | Test boundaries           | Accepted                        | 2026-11-15 |
| 006 | Consent management        | Accepted (provider deferred)    | 2026-11-15 |
| 007 | Deployment platform       | Accepted                        | 2026-11-15 |
| 008 | Shared UI boundaries      | Accepted                        | 2026-11-15 |

## ADR format

Each ADR has:

- **Status** - proposed, accepted, deprecated or superseded
- **Date** - when it was accepted
- **Deciders** - who signed off
- **Context** - the problem being solved
- **Decision** - what was decided
- **Consequences** - tradeoffs accepted
- **Alternatives Considered** - other options evaluated
- **References** - links to code and docs

## Adding a new ADR

1. Copy the last ADR file as a template.
2. Increment the number.
3. Update this table.
4. Commit both files together.
5. Link the ADR in any file that references the decision.

## Purpose

ADRs record _why_ structural decisions were made so that future
readers do not have to reverse-engineer intent from code. They also
prevent ad-hoc restructuring: any change to a frozen decision needs
a new ADR.

## Related documents

- `architecture.md`
- `development-workflow.md`
- `docs/adr/`
