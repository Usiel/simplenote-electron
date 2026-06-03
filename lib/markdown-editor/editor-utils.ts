import type { Editor } from '@tiptap/core';

/** True when the selection is inside the document's first top-level block (title). */
export const isSelectionInTitleBlock = (editor: Editor): boolean => {
  if (!editor.state.doc.firstChild) {
    return false;
  }

  return editor.state.selection.$from.index(0) === 0;
};
