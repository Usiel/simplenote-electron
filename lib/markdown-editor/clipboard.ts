import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/** Block markdown: lists, headings, fences, ordered lists. */
const BLOCK_MARKDOWN_PATTERN =
  /(^|\n)(\s{0,3}(?:[-+*]\s+(?:\[[ xX]\]\s+)?|#{1,6}\s+|```|\d+\.\s+))/;

export const isBlockMarkdown = (text: string) =>
  text.includes('\n') && BLOCK_MARKDOWN_PATTERN.test(text);

/**
 * Markdown clipboard integration on top of the official Markdown extension:
 * - paste: parse pasted block markdown via the Markdown extension
 * - copy/cut: serialize the selection back to markdown (preserves checkboxes
 *   and avoids ProseMirror's default blank-line plain-text output)
 */
export const MarkdownClipboard = Extension.create({
  name: 'markdownClipboard',
  priority: 1000,

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin({
        key: new PluginKey('markdownClipboard'),
        props: {
          handlePaste: (_view, event) => {
            const text = event.clipboardData?.getData('text/plain');

            if (!text || !isBlockMarkdown(text)) {
              return false;
            }

            return editor.commands.insertContent(text, {
              contentType: 'markdown',
            });
          },
          clipboardTextSerializer: (slice) => {
            const fallback = slice.content.textBetween(
              0,
              slice.content.size,
              '\n\n'
            );
            const manager = editor.markdown;

            if (!manager) {
              return fallback;
            }

            const node = editor.schema.topNodeType.createAndFill(
              undefined,
              slice.content
            );

            return node ? manager.serialize(node.toJSON()) : fallback;
          },
        },
      }),
    ];
  },
});
