# Analytics Events

Reference for every analytics event tracked by AHADEX Tools. Events
are defined in `src/platform/analytics/events.ts` and validated in
`event-schema.ts`.

## Consent

Analytics events fire only when:

1. `analytics` consent is granted.
2. GA4 measurement ID is set (`VITE_GA_MEASUREMENT_ID`).

Until consent is granted, no event is tracked. The initial page load
sends nothing to Google Analytics.

## Event list

Every event has a fixed schema. Adding a field or event requires an ADR.

### `page_view`

Fires when the user navigates to a route.

| Field | Type   | Example                   |
| ----- | ------ | ------------------------- |
| path  | string | "/tools/image-compressor" |
| title | string | "Image Compressor"        |

### `tool_open`

Fires when a tool page mounts.

| Field  | Type   | Example            |
| ------ | ------ | ------------------ |
| toolId | string | "image-compressor" |

### `file_selected`

Fires when a user adds a file to a tool.

| Field          | Type   | Example                    |
| -------------- | ------ | -------------------------- |
| toolId         | string | "image-compressor"         |
| fileType       | string | "png"                      |
| fileSizeBucket | string | "small", "medium", "large" |

**Never** include filename, file content, or exact size (a fingerprinting risk). Size is bucketed:

- small: < 1 MB
- medium: 1-10 MB
- large: > 10 MB

### `processing_start`

Fires when the tool begins processing.

| Field     | Type   | Example            |
| --------- | ------ | ------------------ |
| toolId    | string | "image-compressor" |
| fileCount | number | 3                  |

### `processing_success`

Fires when processing completes successfully.

| Field      | Type   | Example            |
| ---------- | ------ | ------------------ |
| toolId     | string | "image-compressor" |
| durationMs | number | 1200               |

### `processing_error`

Fires when processing fails.

| Field  | Type   | Example              |
| ------ | ------ | -------------------- |
| toolId | string | "image-compressor"   |
| reason | string | "unsupported-format" |

**Never** include file content or filename in the error reason.

### `download_click`

Fires when the user clicks the download button.

| Field  | Type   | Example            |
| ------ | ------ | ------------------ |
| toolId | string | "image-compressor" |

### `consent_update`

Fires when the user updates consent.

| Field     | Type   | Example   |
| --------- | ------ | --------- |
| analytics | string | "granted" |
| ads       | string | "denied"  |

### `ad_impression`

Fires when an ad slot becomes visible.

| Field | Type   | Example                   |
| ----- | ------ | ------------------------- |
| slot  | string | "top", "middle", "bottom" |

## Forbidden fields

The validator `src/platform/analytics/privacy-filter.ts` strips these
keys from any payload:

- `email`, `phone`, `name`, `ip`, `userId`, `token`, `password`

Additional rule: no field in any event may contain a filename or file
content. The planned validator
`scripts/tasks/analytics/validate-event-privacy.ts` checks tool code
for violations.

## Testing

- Unit: `src/platform/analytics/event-schema.test.ts` (planned).
- Integration: `tests/integration/analytics.test.ts` (planned).
- E2E: `tests/e2e/consent-management.spec.ts` (planned) - ensures no
  events fire before consent.

## Related documents

- `privacy-policy-guidelines.md`
- `security-policy.md`
