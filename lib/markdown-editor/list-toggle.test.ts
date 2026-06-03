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

/** Select inside a task item's own label paragraph (not ancestor items that include nested text). */
const selectInTaskItem = (
  editor: Editor,
  label: string,
  excludeAncestorText?: string
) => {
  let pos = 0;

  editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name !== 'taskItem') {
      return;
    }

    const labelParagraph = node.child(0);

    if (
      labelParagraph?.type.name === 'paragraph' &&
      labelParagraph.textContent === label &&
      (!excludeAncestorText || !node.textContent.includes(excludeAncestorText))
    ) {
      pos = nodePos + 2;
      return false;
    }
  });

  editor.commands.setTextSelection(pos);
};

describe('toggleListAtSelection', () => {
  it('converts all sibling nested task items when toggling ordered list', () => {
    const editor = createEditor(
      '# Note\n\n- [ ] parent\n  - [ ] child one\n  - [ ] child two\n'
    );

    selectInTaskItem(editor, 'child one');
    toggleListAtSelection(editor, 'orderedList');

    const md = editor.getMarkdown();
    expect(md).toMatch(/child one/);
    expect(md).toMatch(/child two/);
    expect(md).toMatch(/1\.\s+child one/);
    expect(md).toMatch(/2\.\s+child two/);

    editor.destroy();
  });

  it('keeps converted ordered list inside the parent task item', () => {
    const editor = createEditor(
      '# Note\n\n- [ ] todo\n  - [ ] one\n  - [ ] two\n'
    );

    selectInTaskItem(editor, 'one');
    toggleListAtSelection(editor, 'orderedList');

    const taskList = editor.state.doc.child(1);
    expect(taskList.type.name).toBe('taskList');

    const todoItem = taskList.child(0);
    expect(todoItem.child(0).textContent).toBe('todo');
    expect(todoItem.child(1).type.name).toBe('orderedList');
    expect(editor.state.doc.child(2).type.name).not.toBe('orderedList');

    editor.destroy();
  });

  it('converts nested tasks when the selection is on the parent task label', () => {
    const editor = createEditor(
      '# Note\n\n- [ ] looks\n  - [ ] ok\n  - [ ] with nested\n'
    );

    selectInTaskItem(editor, 'looks');
    toggleListAtSelection(editor, 'orderedList');

    const md = editor.getMarkdown();
    expect(md).toMatch(/- \[ \] looks/);
    expect(md).toMatch(/1\.\s+ok/);
    expect(md).toMatch(/2\.\s+with nested/);

    editor.destroy();
  });

  it('converts nested ordered list back to task list', () => {
    const editor = createEditor(
      '# Note\n\n- [ ] looks\n  - [ ] ok\n  - [ ] with nested\n'
    );

    selectInTaskItem(editor, 'ok');
    toggleListAtSelection(editor, 'orderedList');

    let pos = 0;
    editor.state.doc.descendants((node, nodePos) => {
      if (node.type.name === 'listItem' && node.textContent.includes('ok')) {
        pos = nodePos + 2;
        return false;
      }
    });
    editor.commands.setTextSelection(pos);

    toggleListAtSelection(editor, 'taskList');

    const md = editor.getMarkdown();
    expect(md).toMatch(/- \[ \] ok/);
    expect(md).toMatch(/- \[ \] with nested/);
    expect(md).not.toMatch(/1\.\s+ok/);

    editor.destroy();
  });

  it('converts nested ordered back to task when the cursor is on the parent label', () => {
    const editor = createEditor(
      '# Note\n\n- [ ] looks\n  - [ ] ok\n  - [ ] with nested\n'
    );

    selectInTaskItem(editor, 'ok');
    toggleListAtSelection(editor, 'orderedList');
    selectInTaskItem(editor, 'looks', 'same list');

    toggleListAtSelection(editor, 'taskList');

    const md = editor.getMarkdown();
    expect(md).toMatch(/- \[ \] ok/);
    expect(md).not.toMatch(/1\.\s+ok/);

    editor.destroy();
  });

  it('converts all sibling nested task items when toggling bullet list', () => {
    const editor = createEditor(
      '# Note\n\n- [ ] parent\n  - [ ] child one\n  - [ ] child two\n'
    );

    selectInTaskItem(editor, 'child one');
    toggleListAtSelection(editor, 'bulletList');

    const md = editor.getMarkdown();
    expect(md).toMatch(/- child one/);
    expect(md).toMatch(/- child two/);

    editor.destroy();
  });
});
