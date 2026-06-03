/** Leading GFM task marker duplicated inside a task item label. */
const EMBEDDED_TASK_MARKER = /^- \[[ xX]\]\s+/;

/** Line with two task markers; the first opens the item, the second is stray text. */
const DUPLICATE_TASK_LINE = /^(\s*)(- \[[ xX]\]\s*)- \[[ xX]\]\s+/gm;

/** Remove duplicate `- [ ]` prefixes produced by bad paste or round-trip. */
export const normalizeDuplicateTaskMarkers = (markdown: string): string =>
  markdown.replace(DUPLICATE_TASK_LINE, '$1$2');

export const stripEmbeddedTaskMarker = (text: string): string =>
  text.replace(EMBEDDED_TASK_MARKER, '');
