/**
 * Ensures the first line of note content is a markdown H1 (# Title).
 * Used when saving markdown notes and when enabling the markdown system tag.
 */

const H1_PREFIX = '# ';

const firstLine = (content: string): string => {
  const newline = content.indexOf('\n');
  if (newline === -1) {
    return content;
  }
  return content.slice(0, newline);
};

export const ensureMarkdownH1 = (content: string): string => {
  if (content.length === 0) {
    return H1_PREFIX;
  }

  const line = firstLine(content);
  const rest = content.length > line.length ? content.slice(line.length) : '';

  if (line.startsWith(H1_PREFIX)) {
    return content;
  }

  if (line.startsWith('#') && !line.startsWith('##')) {
    // Single # without space — normalize to "# "
    const afterHash = line.replace(/^#\s*/, '');
    return `${H1_PREFIX}${afterHash}${rest}`;
  }

  return `${H1_PREFIX}${line}${rest}`;
};

export const stripMarkdownH1 = (content: string): string => {
  if (content.length === 0) {
    return content;
  }

  const line = firstLine(content);
  const rest = content.length > line.length ? content.slice(line.length) : '';

  if (!line.startsWith(H1_PREFIX)) {
    return content;
  }

  const stripped = line.slice(H1_PREFIX.length);
  return `${stripped}${rest}`;
};

export const normalizeNoteMarkdown = (content: string): string =>
  ensureMarkdownH1(content);
