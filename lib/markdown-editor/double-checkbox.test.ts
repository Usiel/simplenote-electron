import { Editor } from '@tiptap/core';

import { isBlockMarkdown } from './clipboard';
import { createNoteEditorExtensions } from './extensions';
import { toggleListAtSelection } from './list-toggle';
import { normalizeNoteMarkdown } from './note-first-line';
import { normalizeDuplicateTaskMarkers } from './task-list-markdown';

const LINE =
  '- [ ] - [ ] change this to ordered or unordered list and see what happens';

const createEditor = (markdown: string) => {
  const editor = new Editor({
    extensions: createNoteEditorExtensions(),
  });
  editor.commands.setContent(normalizeNoteMarkdown(markdown), {
    contentType: 'markdown',
  });
  return editor;
};

const copySelection = (editor: Editor) => {
  const serialize = editor.view.someProp('clipboardTextSerializer') as
    | ((slice: import('@tiptap/pm/model').Slice) => string)
    | undefined;
  return serialize?.(editor.state.selection.content(), editor.view) ?? '';
};

describe('duplicate task marker on one line', () => {
  it('normalizes markdown before load', () => {
    const editor = createEditor(`# Note\n\n${LINE}\n`);

    expect(editor.getMarkdown()).toMatch(
      /^# Note\n\n- \[ \] change this to ordered/m
    );
    expect(editor.getMarkdown()).not.toMatch(/- \[ \] - \[ \]/);

    editor.destroy();
  });

  it('normalizes duplicate markers when saving markdown from the editor', () => {
    const editor = new Editor({
      extensions: createNoteEditorExtensions(),
    });
    // Simulate legacy stored markdown (parser leaves stray marker in label text).
    editor.commands.setContent(`# Note\n\n${LINE}\n`, {
      contentType: 'markdown',
    });

    const saved = normalizeNoteMarkdown(editor.getMarkdown());
    expect(saved).toBe(
      '# Note\n\n- [ ] change this to ordered or unordered list and see what happens\n\n'
    );

    editor.destroy();
  });

  it('normalizes on paste', () => {
    expect(normalizeDuplicateTaskMarkers(`# Note\n\n${LINE}`)).toContain(
      '- [ ] change this'
    );
    expect(isBlockMarkdown(`${LINE}\n${LINE}`)).toBe(true);
  });

  it('copies a single task marker', () => {
    const editor = createEditor(`# Note\n\n${LINE}\n`);

    editor.commands.selectAll();
    const copied = copySelection(editor);

    expect(copied).toMatch(/- \[ \] change this/);
    expect(copied).not.toMatch(/- \[ \] - \[ \]/);

    editor.destroy();
  });

  it('converts to ordered list without embedded checkbox text', () => {
    const editor = createEditor(`# Note\n\n${LINE}\n`);

    let taskPos = 0;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'taskItem') {
        taskPos = pos + 2;
        return false;
      }
    });
    editor.commands.setTextSelection(taskPos);

    toggleListAtSelection(editor, 'orderedList');

    const md = editor.getMarkdown();
    expect(md).toMatch(/1\.\s+change this/);
    expect(md).not.toMatch(/\[ \].*\[ \]/);
    expect(md).not.toMatch(/1\.\s+- \[ \]/);

    editor.destroy();
  });
});
