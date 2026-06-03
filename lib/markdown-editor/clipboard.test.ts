import { Editor } from '@tiptap/core';
import type { Slice } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';

import { createNoteEditorExtensions } from './extensions';
import { isBlockMarkdown } from './clipboard';
import { normalizeNoteMarkdown } from './note-first-line';

const sample = [
  '# Note',
  '',
  '- [ ] todo a',
  '- [ ] todo b',
  '  - [ ] todo c',
  '  - [ ] todo d',
].join('\n');

const copySelectionAsText = (editor: Editor) => {
  const serialize = editor.view.someProp('clipboardTextSerializer') as
    | ((slice: Slice, view: EditorView) => string)
    | undefined;

  return serialize?.(editor.state.selection.content(), editor.view) ?? '';
};

describe('isBlockMarkdown', () => {
  it('returns true for multi-line GFM task lists', () => {
    expect(isBlockMarkdown('- [ ] one\n- [ ] two')).toBe(true);
  });

  it('returns false for single-line plain text', () => {
    expect(isBlockMarkdown('hello world')).toBe(false);
  });

  it('returns false for single-line markdown inline', () => {
    expect(isBlockMarkdown('**bold**')).toBe(false);
  });
});

describe('MarkdownClipboard clipboardTextSerializer', () => {
  it('copies a selected checklist as tight gfm markdown', () => {
    const editor = new Editor({
      extensions: createNoteEditorExtensions(),
      content: normalizeNoteMarkdown(sample),
      contentType: 'markdown',
    });

    editor.commands.selectAll();
    const copied = copySelectionAsText(editor);

    expect(copied).toContain('- [ ] todo a');
    expect(copied).toContain('  - [ ] todo c');
    // Tight list: no blank lines between sibling task items.
    expect(copied).not.toMatch(/todo a\n\n- \[ \] todo b/);

    editor.destroy();
  });
});
