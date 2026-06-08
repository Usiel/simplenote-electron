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

const pressArrow = (editor: Editor, direction: 'ArrowDown' | 'ArrowUp') => {
  const plugin = editor.state.plugins.find((candidate) =>
    candidate.spec.key?.key?.startsWith('blockSpacer')
  );
  const handleKeyDown = plugin?.props?.handleKeyDown;

  if (!handleKeyDown) {
    return false;
  }

  const event = new KeyboardEvent('keydown', {
    key: direction,
    code: direction,
    bubbles: true,
    cancelable: true,
  });

  return handleKeyDown(editor.view, event);
};

const moveSelectionToHeading = (editor: Editor, text: string) => {
  selectInHeadingText(editor, text);
};

const moveSelectionToCodeBlockEnd = (editor: Editor, code: string) => {
  selectAtEndOfCodeBlock(editor, code);
};

const selectAtEndOfCodeBlock = (editor: Editor, code: string) => {
  let pos = 0;

  editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name === 'codeBlock' && node.textContent === code) {
      pos = nodePos + 1 + node.content.size;
      return false;
    }
  });

  editor.commands.setTextSelection(pos);
};

const selectInHeadingText = (editor: Editor, text: string) => {
  let pos = 0;

  editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name === 'heading' && node.textContent === text) {
      pos = nodePos + 1;
      return false;
    }
  });

  editor.commands.setTextSelection(pos);
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

const selectAtEndOfParagraph = (editor: Editor, text: string) => {
  let pos = 0;

  editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name === 'paragraph' && node.textContent === text) {
      pos = nodePos + 1 + node.content.size;
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

const selectOffsetInCodeBlock = (
  editor: Editor,
  code: string,
  offsetInText: number
) => {
  let pos = 0;

  editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name === 'codeBlock' && node.textContent === code) {
      pos = nodePos + 1 + offsetInText;
      return false;
    }
  });

  editor.commands.setTextSelection(pos);
};

const selectRangeAtEndOfCodeBlock = (editor: Editor, code: string) => {
  let from = 0;
  let to = 0;

  editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name === 'codeBlock' && node.textContent === code) {
      to = nodePos + 1 + node.content.size;
      from = Math.max(nodePos + 1, to - 1);
      return false;
    }
  });

  editor.commands.setTextSelection({ from, to });
};

const getTopLevelBlockTypes = (editor: Editor) => {
  const types: string[] = [];

  editor.state.doc.forEach((node) => {
    types.push(node.type.name);
  });

  return types;
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

const hasEmptySpacerBetweenNonParagraphs = (editor: Editor) => {
  const { doc } = editor.state;

  for (let index = 1; index < doc.childCount - 1; index += 1) {
    const node = doc.child(index);

    if (
      node.type.name === 'paragraph' &&
      node.content.size === 0 &&
      doc.child(index - 1).type.name !== 'paragraph' &&
      doc.child(index + 1).type.name !== 'paragraph'
    ) {
      return true;
    }
  }

  return false;
};

describe('block spacer paragraph', () => {
  it('ArrowDown from code block before heading creates a spacer and moves into it', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\n## Heading\n');

    selectAtEndOfCodeBlock(editor, 'code');
    pressArrow(editor, 'ArrowDown');

    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(true);
    expect(getCursorContext(editor).path).toEqual(['paragraph']);
    expect(getTopLevelBlockTypes(editor)).toEqual([
      'heading',
      'codeBlock',
      'paragraph',
      'heading',
      'paragraph',
    ]);

    editor.destroy();
  });

  it('ArrowDown again moves into the heading and removes the spacer', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\n## Heading\n');

    selectAtEndOfCodeBlock(editor, 'code');
    pressArrow(editor, 'ArrowDown');
    moveSelectionToHeading(editor, 'Heading');

    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);
    expect(getCursorContext(editor).path).toEqual(['heading']);
    expect(getCursorContext(editor).text).toBe('Heading');

    editor.destroy();
  });

  it('ArrowDown from list before heading creates a spacer', () => {
    const editor = createEditor('# Note\n\n- one\n## Heading\n');

    selectAtEndOfParagraph(editor, 'one');
    pressArrow(editor, 'ArrowDown');

    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(true);
    expect(getTopLevelBlockTypes(editor)).toEqual([
      'heading',
      'bulletList',
      'paragraph',
      'heading',
      'paragraph',
    ]);

    editor.destroy();
  });

  it('ArrowDown from blockquote before code block creates a spacer', () => {
    const editor = createEditor('# Note\n\n> quote\n```\ncode\n```\n');

    selectAtEndOfParagraph(editor, 'quote');
    pressArrow(editor, 'ArrowDown');

    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(true);
    expect(getTopLevelBlockTypes(editor)).toEqual([
      'heading',
      'blockquote',
      'paragraph',
      'codeBlock',
      'paragraph',
    ]);

    editor.destroy();
  });

  it('ArrowDown from code block before another code block creates a spacer', () => {
    const editor = createEditor(
      '# Note\n\n```\nfirst\n```\n```\nsecond\n```\n'
    );

    selectAtEndOfCodeBlock(editor, 'first');
    pressArrow(editor, 'ArrowDown');

    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(true);
    expect(getTopLevelBlockTypes(editor)).toEqual([
      'heading',
      'codeBlock',
      'paragraph',
      'codeBlock',
      'paragraph',
    ]);

    editor.destroy();
  });

  it('ArrowDown does nothing when the next sibling is a paragraph', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\n\nBody text\n');

    selectAtEndOfCodeBlock(editor, 'code');
    pressArrow(editor, 'ArrowDown');

    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);
    expect(getTopLevelBlockTypes(editor)).toEqual([
      'heading',
      'codeBlock',
      'paragraph',
    ]);

    editor.destroy();
  });

  it('ArrowDown from a paragraph before a heading does not create a spacer', () => {
    const editor = createEditor('# Note\n\nBody\n## Heading\n');

    selectAtEndOfParagraph(editor, 'Body');

    expect(pressArrow(editor, 'ArrowDown')).toBe(false);
    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);

    editor.destroy();
  });

  it('ArrowUp from a paragraph below a code block does not create a spacer', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\nBody\n');

    selectInParagraph(editor, 'Body');

    expect(pressArrow(editor, 'ArrowUp')).toBe(false);
    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);

    editor.destroy();
  });

  it('ArrowDown from a middle line of a multiline code block does not create a spacer', () => {
    const editor = createEditor(
      '# Note\n\n```\nline1\nline2\n```\n## Heading\n'
    );

    selectOffsetInCodeBlock(editor, 'line1\nline2', 'line1'.length);

    expect(pressArrow(editor, 'ArrowDown')).toBe(false);
    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);

    editor.destroy();
  });

  it('ArrowUp from the second line of a blockquote below a code block does not create a spacer', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\n> line1\n> line2\n');

    selectOffsetInParagraph(editor, 'line1\nline2', 'line1'.length + 1);

    expect(pressArrow(editor, 'ArrowUp')).toBe(false);
    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);

    editor.destroy();
  });

  it('ArrowDown with a range selection does not create a spacer', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\n## Heading\n');

    selectRangeAtEndOfCodeBlock(editor, 'code');

    expect(editor.state.selection.empty).toBe(false);
    expect(pressArrow(editor, 'ArrowDown')).toBe(false);
    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);

    editor.destroy();
  });

  it('ArrowDown from a code block at the document end falls through without creating a spacer', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\n');

    selectAtEndOfCodeBlock(editor, 'code');

    expect(pressArrow(editor, 'ArrowDown')).toBe(false);
    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);

    editor.commands.exitCode();

    expect(getTopLevelBlockTypes(editor).at(-1)).toBe('paragraph');

    editor.destroy();
  });

  it('ArrowUp from heading below code block creates a spacer', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\n## Heading\n');

    selectInHeadingText(editor, 'Heading');
    pressArrow(editor, 'ArrowUp');

    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(true);
    expect(getCursorContext(editor).path).toEqual(['paragraph']);

    editor.destroy();
  });

  it('ArrowUp from the middle of a blockquote below a code block creates a spacer', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\n> abc\n');

    selectOffsetInParagraph(editor, 'abc', 1);

    expect(getCursorContext(editor).text).toBe('abc');
    expect(pressArrow(editor, 'ArrowUp')).toBe(true);
    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(true);
    expect(getCursorContext(editor).path).toEqual(['paragraph']);
    expect(getTopLevelBlockTypes(editor)).toEqual([
      'heading',
      'codeBlock',
      'paragraph',
      'blockquote',
      'paragraph',
    ]);

    editor.destroy();
  });

  it('ArrowUp again enters the code block and removes the spacer', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\n## Heading\n');

    selectInHeadingText(editor, 'Heading');
    pressArrow(editor, 'ArrowUp');
    moveSelectionToCodeBlockEnd(editor, 'code');

    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);
    expect(getCursorContext(editor).path).toEqual(['codeBlock']);

    editor.destroy();
  });

  it('ArrowDown between list items does not create a spacer', () => {
    const editor = createEditor('# Note\n\n- one\n- two\n## Heading\n');

    selectAtEndOfParagraph(editor, 'one');

    expect(pressArrow(editor, 'ArrowDown')).toBe(false);
    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);
    expect(getCursorContext(editor).text).toBe('one');

    editor.destroy();
  });

  it('ArrowUp from the start of a nested list item does not create a spacer', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\n- one\n- two\n');

    selectInParagraph(editor, 'two');

    expect(pressArrow(editor, 'ArrowUp')).toBe(false);
    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);
    expect(getCursorContext(editor).text).toBe('two');

    editor.destroy();
  });

  it('typing in the spacer keeps it when the cursor leaves', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\n## Heading\n');

    selectAtEndOfCodeBlock(editor, 'code');
    pressArrow(editor, 'ArrowDown');
    editor.commands.insertContent('inserted');

    expect(getCursorContext(editor).text).toBe('inserted');

    selectAtEndOfCodeBlock(editor, 'code');

    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);
    expect(getTopLevelBlockTypes(editor)).toContain('paragraph');
    expect(editor.getMarkdown()).toMatch(/inserted/);

    editor.destroy();
  });

  it('auto-cleanup removes an empty spacer when the cursor leaves it', () => {
    const editor = createEditor('# Note\n\n```\ncode\n```\n## Heading\n');

    selectAtEndOfCodeBlock(editor, 'code');
    pressArrow(editor, 'ArrowDown');
    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(true);

    selectAtEndOfCodeBlock(editor, 'code');

    expect(hasEmptySpacerBetweenNonParagraphs(editor)).toBe(false);

    editor.destroy();
  });
});
