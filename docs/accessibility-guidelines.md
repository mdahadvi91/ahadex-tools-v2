# Accessibility Guidelines

Rules to meet WCAG 2.1 AA. Every page and component must comply.

## Principles (POUR)

- **Perceivable** - content can be seen or heard.
- **Operable** - UI can be used with keyboard and assistive tech.
- **Understandable** - UI behaves predictably.
- **Robust** - works across browsers and assistive tech.

## Semantic HTML

- One `<h1>` per page.
- Headings in order (no skipped levels).
- Use `<button>` for actions, `<a>` for navigation.
- Use `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`.
- Use `<ul>`/`<ol>` for lists.
- Use `<label>` for every form control.

## Keyboard access

- Every interactive element reachable by Tab.
- Tab order follows visual order.
- No keyboard traps.
- `Escape` closes dialogs.
- Visible focus ring on every focusable element.
- Custom components implement `role` and `tabIndex` correctly.

## ARIA

- Prefer native elements over ARIA.
- If ARIA needed, use correct role, state and properties.
- Every `aria-label` is meaningful.
- `aria-live="polite"` for non-urgent updates.
- `aria-live="assertive"` for errors only.

## Color contrast

- Text: minimum 4.5:1 contrast ratio.
- Large text (18pt+ or 14pt bold): minimum 3:1.
- UI components: minimum 3:1.
- Never use color alone to convey meaning.

## Motion

- Respect `prefers-reduced-motion`.
- No flashing content (3 flashes per second max).
- Animations can be paused if longer than 5 seconds.

## Focus management

- On route change, focus moves to the `<h1>` or a skip link.
- On dialog open, focus moves to the first focusable element.
- On dialog close, focus returns to the trigger.
- Focus indicator visible at all times.

## Forms

- Every input has an associated `<label>`.
- Errors are described in text, not just color.
- Errors are announced via `aria-live`.
- Required fields marked with `required` and visually.

## Images

- Decorative images: `alt=""`.
- Informative images: descriptive `alt`.
- No text-in-image unless it is also in the page text.
- SVG icons that convey meaning: `<title>` inside SVG.

## Testing

- Automated: `scripts/tasks/accessibility/accessibility-audit.ts`
  (planned) - axe-core scan.
- Manual: keyboard-only navigation, screen reader test.
- E2E: `tests/accessibility/pages-accessibility.spec.ts` (planned).

## Related documents

- `content-guidelines.md`
- `performance-budgets.md`
