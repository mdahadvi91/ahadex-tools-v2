/**
 * Safe DOM helpers: no innerHTML, no eval, escaped text only.
 */

/**
 * Escapes text for safe insertion into HTML. Use only when building
 * HTML strings; prefer textContent or setTextSafe().
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sets an element's text content without interpreting HTML.
 */
export function setTextSafe(el: Element | null, text: string): void {
  if (el) el.textContent = text;
}

/**
 * Creates an element with attributes and children.
 * - Text child entries become textContent nodes (never parsed as HTML).
 * - Element children are appended as-is.
 * - Attribute values are set via setAttribute; event handlers
 *   (on*) are rejected to avoid XSS surface.
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (/^on/i.test(name)) {
      throw new Error(`Refusing to set event handler attribute "${name}"`);
    }
    el.setAttribute(name, value);
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  }
  return el;
}

/**
 * Triggers a browser download of a Blob under the given filename.
 * Creates and revokes its own object URL.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
