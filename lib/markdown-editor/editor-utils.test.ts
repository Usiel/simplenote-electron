import { Editor } from '@tiptap/core';

import { createNoteEditorExtensions } from './extensions';
import { getActiveListType } from './editor-utils';

describe('getActiveListType', () => {
  it('returns the innermost list type at the selection', () => {
    const editor = new Editor({
      extensions: createNoteEditorExtensions(),
    });

    editor.commands.setContent('# Note\n\n- bullet\n\n1. ordered\n', {
      contentType: 'markdown',
    });

    let selectionInOrdered = 0;
    let selectionInBullet = 0;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'orderedList' && !selectionInOrdered) {
        selectionInOrdered = pos + 3;
      }
      if (node.type.name === 'bulletList' && !selectionInBullet) {
        selectionInBullet = pos + 3;
      }
    });

    editor.commands.setTextSelection(selectionInOrdered);
    expect(getActiveListType(editor)).toBe('orderedList');

    editor.commands.setTextSelection(selectionInBullet);
    expect(getActiveListType(editor)).toBe('bulletList');

    editor.destroy();
  });
});
