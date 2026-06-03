import { Editor } from '@tiptap/core';

import { createNoteEditorExtensions } from './extensions';
import type { ToolbarListType } from './list-toggle';
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

type SymmetricCase = {
  name: string;
  markdown: string;
  select: (editor: Editor) => void;
  toggle: ToolbarListType;
  expect: RegExp[];
  mustNot?: RegExp[];
};

/** Top-level lists use the same whole-list conversion as nested sub-lists. */
const topLevelCases: SymmetricCase[] = [
  {
    name: 'top-level bullets → ordered',
    markdown: '# Note\n\n- one\n- two\n',
    select: (e) => selectInParagraph(e, 'one'),
    toggle: 'orderedList',
    expect: [/1\.\s+one/, /2\.\s+two/],
    mustNot: [/^- one/m],
  },
  {
    name: 'top-level bullets → tasks',
    markdown: '# Note\n\n- one\n- two\n',
    select: (e) => selectInParagraph(e, 'one'),
    toggle: 'taskList',
    expect: [/- \[ \] one/, /- \[ \] two/],
    mustNot: [/^- one/m],
  },
  {
    name: 'top-level ordered → bullets',
    markdown: '# Note\n\n1. one\n2. two\n',
    select: (e) => selectInParagraph(e, 'one'),
    toggle: 'bulletList',
    expect: [/- one/, /- two/],
    mustNot: [/1\.\s+one/],
  },
  {
    name: 'top-level ordered → tasks',
    markdown: '# Note\n\n1. one\n2. two\n',
    select: (e) => selectInParagraph(e, 'two'),
    toggle: 'taskList',
    expect: [/- \[ \] one/, /- \[ \] two/],
    mustNot: [/1\.\s+two/],
  },
  {
    name: 'top-level tasks → bullets',
    markdown: '# Note\n\n- [ ] one\n- [ ] two\n',
    select: (e) => selectInTaskItem(e, 'one'),
    toggle: 'bulletList',
    expect: [/- one/, /- two/],
    mustNot: [/- \[ \]/],
  },
  {
    name: 'top-level tasks → ordered',
    markdown: '# Note\n\n- [ ] one\n- [ ] two\n',
    select: (e) => selectInTaskItem(e, 'two'),
    toggle: 'orderedList',
    expect: [/1\.\s+one/, /2\.\s+two/],
    mustNot: [/- \[ \]/],
  },
];

describe.each(topLevelCases)(
  'symmetric top-level list conversion',
  (testCase) => {
    it(testCase.name, () => {
      const editor = createEditor(testCase.markdown);

      testCase.select(editor);
      toggleListAtSelection(editor, testCase.toggle);

      const md = editor.getMarkdown();

      for (const pattern of testCase.expect) {
        expect(md).toMatch(pattern);
      }

      for (const pattern of testCase.mustNot ?? []) {
        expect(md).not.toMatch(pattern);
      }

      editor.destroy();
    });
  }
);
