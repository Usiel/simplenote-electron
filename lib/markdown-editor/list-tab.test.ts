import { Editor } from '@tiptap/core';

import { createNoteEditorExtensions } from './extensions';

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

const selectInTaskItem = (editor: Editor, label: string) => {
  let pos = 0;

  editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name !== 'taskItem') {
      return;
    }

    const labelParagraph = node.child(0);

    if (
      labelParagraph?.type.name === 'paragraph' &&
      labelParagraph.textContent === label
    ) {
      pos = nodePos + 2;
      return false;
    }
  });

  editor.commands.setTextSelection(pos);
};

const selectInHeading = (editor: Editor) => {
  let pos = 0;

  editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name === 'heading') {
      pos = nodePos + 1;
      return false;
    }
  });

  editor.commands.setTextSelection(pos);
};

const selectOffsetInParagraph = (
  editor: Editor,
  text: string,
  offsetInText: number
) => {
  let pos = 0;

  editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name === 'paragraph' && node.textContent === text) {
      pos = nodePos + 1 + offsetInText;
      return false;
    }
  });

  editor.commands.setTextSelection(pos);
};

const pressTab = (editor: Editor, shift = false) => {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    code: 'Tab',
    keyCode: 9,
    shiftKey: shift,
    bubbles: true,
    cancelable: true,
  });

  editor.view.someProp('handleKeyDown', (handler) =>
    handler(editor.view, event)
  );
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
    text: $pos.parent.textContent,
  };
};

type TabCase = {
  name: string;
  markdown: string;
  select: (editor: Editor) => void;
  shift: boolean;
  expectMarkdown: RegExp[];
  mustNotMarkdown?: RegExp[];
  expectPath?: string[];
  expectCursorText?: string;
};

const cases: TabCase[] = [
  {
    name: 'Tab indents the second bullet under the first',
    markdown: '# Note\n\n- one\n- two\n',
    select: (editor) => selectInParagraph(editor, 'two'),
    shift: false,
    expectMarkdown: [/\n  - two/],
    expectPath: [
      'bulletList',
      'listItem',
      'bulletList',
      'listItem',
      'paragraph',
    ],
    expectCursorText: 'two',
  },
  {
    name: 'Shift+Tab outdents a nested bullet',
    markdown: '# Note\n\n- one\n  - two\n',
    select: (editor) => selectInParagraph(editor, 'two'),
    shift: true,
    expectMarkdown: [/- one\n- two/],
    expectPath: ['bulletList', 'listItem', 'paragraph'],
    expectCursorText: 'two',
  },
  {
    name: 'Tab does not indent the first bullet item',
    markdown: '# Note\n\n- one\n- two\n',
    select: (editor) => selectInParagraph(editor, 'one'),
    shift: false,
    expectMarkdown: [/- one\n- two/],
    expectPath: ['bulletList', 'listItem', 'paragraph'],
    expectCursorText: 'one',
  },
  {
    name: 'Tab indents the second task under the first',
    markdown: '# Note\n\n- [ ] one\n- [ ] two\n',
    select: (editor) => selectInTaskItem(editor, 'two'),
    shift: false,
    expectMarkdown: [/\n  - \[ \] two/],
    expectPath: ['taskList', 'taskItem', 'taskList', 'taskItem', 'paragraph'],
    expectCursorText: 'two',
  },
  {
    name: 'Shift+Tab outdents a nested task',
    markdown: '# Note\n\n- [ ] one\n  - [ ] two\n',
    select: (editor) => selectInTaskItem(editor, 'two'),
    shift: true,
    expectMarkdown: [/- \[ \] one\n- \[ \] two/],
    expectPath: ['taskList', 'taskItem', 'paragraph'],
    expectCursorText: 'two',
  },
  {
    name: 'Tab indents the second ordered item (nested restart at 1)',
    markdown: '# Note\n\n1. one\n2. two\n',
    select: (editor) => selectInParagraph(editor, 'two'),
    shift: false,
    expectMarkdown: [/\n  1\. two/],
    expectPath: [
      'orderedList',
      'listItem',
      'orderedList',
      'listItem',
      'paragraph',
    ],
    expectCursorText: 'two',
  },
  {
    name: 'Tab leaves a plain paragraph unchanged',
    markdown: '# Note\n\nHello world\n',
    select: (editor) => selectInParagraph(editor, 'Hello world'),
    shift: false,
    expectMarkdown: [/Hello world/],
    expectPath: ['paragraph'],
    expectCursorText: 'Hello world',
  },
  {
    name: 'Tab leaves the locked H1 title',
    markdown: '# Note\n\nBody\n',
    select: (editor) => selectInHeading(editor),
    shift: false,
    expectMarkdown: [/^# Note/],
    expectPath: ['heading'],
    expectCursorText: 'Note',
  },
  {
    name: 'Tab keeps the cursor in the list item label after indent',
    markdown: '# Note\n\n- one\n- two\n',
    select: (editor) => selectOffsetInParagraph(editor, 'two', 1),
    shift: false,
    expectMarkdown: [/\n  - two/],
    expectPath: [
      'bulletList',
      'listItem',
      'bulletList',
      'listItem',
      'paragraph',
    ],
    expectCursorText: 'two',
  },
  {
    name: 'Tab indents a bullet sibling under a task item',
    markdown: '# Note\n\n- [ ] parent\n  - child\n  - sibling\n',
    select: (editor) => selectInParagraph(editor, 'sibling'),
    shift: false,
    expectMarkdown: [/\n    - sibling/],
    expectPath: [
      'taskList',
      'taskItem',
      'bulletList',
      'listItem',
      'bulletList',
      'listItem',
      'paragraph',
    ],
    expectCursorText: 'sibling',
  },
  {
    name: 'Tab indents a nested ordered item inside a task',
    markdown: '# Note\n\n- [ ] p\n  1. child\n  2. more\n',
    select: (editor) => selectInParagraph(editor, 'more'),
    shift: false,
    expectMarkdown: [/\n    1\. more/],
    expectPath: [
      'taskList',
      'taskItem',
      'orderedList',
      'listItem',
      'orderedList',
      'listItem',
      'paragraph',
    ],
    expectCursorText: 'more',
  },
  {
    name: 'Tab indents a bullet inside a blockquote',
    markdown: '# Note\n\n> - one\n> - two\n',
    select: (editor) => selectInParagraph(editor, 'two'),
    shift: false,
    expectMarkdown: [/>\s+- one\n>\s+  - two/],
    expectPath: [
      'blockquote',
      'bulletList',
      'listItem',
      'bulletList',
      'listItem',
      'paragraph',
    ],
    expectCursorText: 'two',
  },
];

describe.each(cases)('list Tab / Shift+Tab', (testCase) => {
  it(testCase.name, () => {
    const editor = createEditor(testCase.markdown);

    testCase.select(editor);
    pressTab(editor, testCase.shift);

    const markdown = editor.getMarkdown();
    const cursor = getCursorContext(editor);

    for (const pattern of testCase.expectMarkdown) {
      expect(markdown).toMatch(pattern);
    }

    for (const pattern of testCase.mustNotMarkdown ?? []) {
      expect(markdown).not.toMatch(pattern);
    }

    if (testCase.expectPath) {
      expect(cursor.path).toEqual(testCase.expectPath);
    }

    if (testCase.expectCursorText) {
      expect(cursor.text).toBe(testCase.expectCursorText);
    }

    editor.destroy();
  });
});
