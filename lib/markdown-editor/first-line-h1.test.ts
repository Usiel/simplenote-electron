import { Editor } from '@tiptap/core';

import { createNoteEditorExtensions } from './extensions';

const createEditor = (markdown: string) => {
  const editor = new Editor({
    extensions: createNoteEditorExtensions(),
  });
  editor.commands.setContent(markdown, { contentType: 'markdown' });
  return editor;
};

const firstBlockType = (editor: Editor) => {
  const first = editor.state.doc.firstChild;
  return first
    ? { type: first.type.name, level: first.attrs.level }
    : { type: null, level: null };
};

describe('FirstLineH1', () => {
  it('coerces a plain first line to heading level 1', () => {
    const editor = createEditor('Title\n\nBody');
    expect(firstBlockType(editor)).toEqual({ type: 'heading', level: 1 });
  });

  it('keeps an existing H1 as heading level 1', () => {
    const editor = createEditor('# Title\n\nBody');
    expect(firstBlockType(editor)).toEqual({ type: 'heading', level: 1 });
  });

  it('coerces H2 on the first line to H1', () => {
    const editor = createEditor('## Title\n\nBody');
    expect(firstBlockType(editor)).toEqual({ type: 'heading', level: 1 });
  });

  it('does not change the second block type', () => {
    const editor = createEditor('# Title\n\n> quote');
    const second = editor.state.doc.child(1);
    expect(second.type.name).toBe('blockquote');
  });
});
