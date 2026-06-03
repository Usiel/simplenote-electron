import type { Editor } from '@tiptap/core';

export type ActiveListType = 'bulletList' | 'orderedList' | 'taskList';

/** Innermost list type containing the selection (avoids highlighting parent lists). */
export const getActiveListType = (editor: Editor): ActiveListType | null => {
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth > 0; depth--) {
    const { name } = $from.node(depth).type;

    if (
      name === 'bulletList' ||
      name === 'orderedList' ||
      name === 'taskList'
    ) {
      return name;
    }
  }

  return null;
};

/** True when the selection is inside the document's first top-level block (title). */
export const isSelectionInTitleBlock = (editor: Editor): boolean => {
  if (!editor.state.doc.firstChild) {
    return false;
  }

  return editor.state.selection.$from.index(0) === 0;
};
