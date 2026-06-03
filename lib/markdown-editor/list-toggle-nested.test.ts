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

/** Task item whose own label paragraph matches (not ancestor aggregate text). */
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

type Case = {
  name: string;
  markdown: string;
  select: (editor: Editor) => void;
  toggle: ToolbarListType;
  expect: RegExp[];
  mustNot: RegExp[];
};

const cases: Case[] = [
  {
    name: 'task > nested tasks → ordered (from child)',
    markdown: '# Note\n\n- [ ] parent\n  - [ ] a\n  - [ ] b\n',
    select: (e) => selectInTaskItem(e, 'a'),
    toggle: 'orderedList',
    expect: [/1\.\s+a/, /2\.\s+b/, /- \[ \] parent/],
    mustNot: [/1\.\s+- \[ \]/],
  },
  {
    name: 'task > nested tasks → ordered (from parent label)',
    markdown: '# Note\n\n- [ ] parent\n  - [ ] a\n  - [ ] b\n',
    select: (e) => selectInTaskItem(e, 'parent'),
    toggle: 'orderedList',
    expect: [/1\.\s+a/, /2\.\s+b/],
    mustNot: [],
  },
  {
    name: 'task > nested tasks → bullet (from child)',
    markdown: '# Note\n\n- [ ] parent\n  - [ ] a\n  - [ ] b\n',
    select: (e) => selectInTaskItem(e, 'a'),
    toggle: 'bulletList',
    expect: [/- a/, /- b/],
    mustNot: [],
  },
  {
    name: 'task > nested ordered → task (from child)',
    markdown: '# Note\n\n- [ ] parent\n  1. a\n  2. b\n',
    select: (e) => selectInParagraph(e, 'a'),
    toggle: 'taskList',
    expect: [/- \[ \] a/, /- \[ \] b/],
    mustNot: [/1\.\s+a/],
  },
  {
    name: 'task > nested ordered → bullet (from child)',
    markdown: '# Note\n\n- [ ] parent\n  1. a\n  2. b\n',
    select: (e) => selectInParagraph(e, 'a'),
    toggle: 'bulletList',
    expect: [/- a/, /- b/],
    mustNot: [/1\.\s+a/],
  },
  {
    name: 'task > nested ordered → ordered unwraps nested list',
    markdown: '# Note\n\n- [ ] parent\n  1. a\n  2. b\n',
    select: (e) => selectInParagraph(e, 'a'),
    toggle: 'orderedList',
    expect: [/- \[ \] parent/, /\ba\b/, /\bb\b/],
    mustNot: [/1\.\s+a/],
  },
  {
    name: 'task > nested bullet → ordered (from child)',
    markdown: '# Note\n\n- [ ] parent\n  - a\n  - b\n',
    select: (e) => selectInParagraph(e, 'a'),
    toggle: 'orderedList',
    expect: [/1\.\s+a/, /2\.\s+b/],
    mustNot: [],
  },
  {
    name: 'task > nested bullet → task (from child)',
    markdown: '# Note\n\n- [ ] parent\n  - a\n  - b\n',
    select: (e) => selectInParagraph(e, 'a'),
    toggle: 'taskList',
    expect: [/- \[ \] a/, /- \[ \] b/],
    mustNot: [],
  },
  {
    name: 'task > nested tasks → task → ordered round-trip',
    markdown: '# Note\n\n- [ ] parent\n  - [ ] a\n  - [ ] b\n',
    select: (e) => {
      selectInTaskItem(e, 'a');
      toggleListAtSelection(e, 'orderedList');
      selectInParagraph(e, 'a');
    },
    toggle: 'taskList',
    expect: [/- \[ \] a/, /- \[ \] b/],
    mustNot: [/1\.\s+a/],
  },
  {
    name: 'bullet > nested ordered → task',
    markdown: '# Note\n\n- parent\n  1. child\n  2. more\n',
    select: (e) => selectInParagraph(e, 'child'),
    toggle: 'taskList',
    expect: [/- \[ \] child/, /- \[ \] more/],
    mustNot: [/1\.\s+child/],
  },
  {
    name: 'bullet > nested ordered → bullet',
    markdown: '# Note\n\n- parent\n  1. child\n  2. more\n',
    select: (e) => selectInParagraph(e, 'child'),
    toggle: 'bulletList',
    expect: [/- child/, /- more/],
    mustNot: [/1\.\s+child/],
  },
  {
    name: 'bullet > nested ordered → ordered unwraps nested list',
    markdown: '# Note\n\n- parent\n  1. child\n  2. more\n',
    select: (e) => selectInParagraph(e, 'child'),
    toggle: 'orderedList',
    expect: [/- parent/, /child/, /more/],
    mustNot: [/1\.\s+child/],
  },
  {
    name: 'nested task inside nested task → ordered on deep child',
    markdown:
      '# Note\n\n- [ ] outer\n  - [ ] mid\n    - [ ] deep\n    - [ ] also\n',
    select: (e) => selectInTaskItem(e, 'deep'),
    toggle: 'orderedList',
    expect: [/1\.\s+deep/, /2\.\s+also/, /- \[ \] mid/],
    mustNot: [],
  },
  {
    name: 'top-level tasks → ordered',
    markdown: '# Note\n\n- [ ] one\n- [ ] two\n',
    select: (e) => selectInTaskItem(e, 'one'),
    toggle: 'orderedList',
    expect: [/1\.\s+one/, /2\.\s+two/],
    mustNot: [/1\.\s+- \[ \]/],
  },
  {
    name: 'bullet > nested bullet → ordered',
    markdown: '# Note\n\n- parent\n  - child\n  - more\n',
    select: (e) => selectInParagraph(e, 'child'),
    toggle: 'orderedList',
    expect: [/1\.\s+child/, /2\.\s+more/],
    mustNot: [],
  },
  {
    name: 'bullet > nested bullet → task',
    markdown: '# Note\n\n- parent\n  - child\n  - more\n',
    select: (e) => selectInParagraph(e, 'child'),
    toggle: 'taskList',
    expect: [/- \[ \] child/, /- \[ \] more/],
    mustNot: [],
  },
];

describe.each(cases)('nested list type toggle', (testCase) => {
  it(testCase.name, () => {
    const editor = createEditor(testCase.markdown);

    testCase.select(editor);
    toggleListAtSelection(editor, testCase.toggle);

    const md = editor.getMarkdown();

    for (const pattern of testCase.expect) {
      expect(md).toMatch(pattern);
    }

    for (const pattern of testCase.mustNot) {
      expect(md).not.toMatch(pattern);
    }

    editor.destroy();
  });
});
