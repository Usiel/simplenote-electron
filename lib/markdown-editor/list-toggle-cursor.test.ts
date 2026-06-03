import { Editor } from '@tiptap/core';

import { createNoteEditorExtensions } from './extensions';
import { toggleListAtSelection } from './list-toggle';

declare module '@tiptap/core' {
  interface Editor {
    getMarkdown: () => string;
  }
}

const createEditor = (markdown: string) => {
  const editor = new Editor({
    extensions: createNoteEditorExtensions(),
  });
  editor.commands.setContent(markdown, { contentType: 'markdown' });
  return editor;
};

const selectInParagraph = (editor: Editor, text: string) => {
  let pos = 0;

  editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name === 'paragraph' && node.textContent === text) {
      pos = nodePos + 1;
      return false;
    }
  });

  editor.commands.setTextSelection(pos);
};

const getCursorContext = (editor: Editor) => {
  const from = editor.state.selection.from;
  const $pos = editor.state.doc.resolve(from);
  const path: string[] = [];

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    path.push($pos.node(depth).type.name);
  }

  return {
    from,
    path: path.reverse(),
    parentText: $pos.parent.textContent,
    empty: $pos.parent.textContent.trim() === '',
  };
};

describe('toggleListAtSelection cursor after nested ordered → task', () => {
  const markdown = `# Note

1. test
  1. tjekfgje
  2. fjeklfej
`;

  it('keeps the cursor on the converted item label, not an empty nested task', () => {
    const editor = createEditor(markdown);

    selectInParagraph(editor, 'tjekfgje');
    const before = getCursorContext(editor);

    toggleListAtSelection(editor, 'taskList');

    const after = getCursorContext(editor);
    const md = editor.getMarkdown();

    expect(md).toMatch(/- \[ \] tjekfgje/);
    expect(md).not.toMatch(/- \[ \]\s*\n\s*- \[ \]/);
    expect(after.empty).toBe(false);
    expect(after.parentText).toBe('tjekfgje');
    expect(after.path).toContain('taskItem');
    expect(after.path).toContain('paragraph');
    expect(before.parentText).toBe('tjekfgje');

    editor.destroy();
  });

  it('keeps the cursor on the second nested item when that item was selected', () => {
    const editor = createEditor(markdown);

    selectInParagraph(editor, 'fjeklfej');
    toggleListAtSelection(editor, 'taskList');

    const after = getCursorContext(editor);

    expect(editor.getMarkdown()).toMatch(/- \[ \] fjeklfej/);
    expect(after.parentText).toBe('fjeklfej');
    expect(after.empty).toBe(false);

    editor.destroy();
  });
});
