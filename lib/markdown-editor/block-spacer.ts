import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { ResolvedPos } from '@tiptap/pm/model';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import type { EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

const pluginKey = new PluginKey('blockSpacer');

const isNonParagraph = (node: ProseMirrorNode) =>
  node.type.name !== 'paragraph';

const isEmptyParagraph = (node: ProseMirrorNode) =>
  node.type.name === 'paragraph' && node.content.size === 0;

const getTextblockAtEdge = (
  blockPos: number,
  block: ProseMirrorNode,
  edge: 'first' | 'last'
): { pos: number; node: ProseMirrorNode } | null => {
  if (block.isTextblock) {
    return { pos: blockPos, node: block };
  }

  let match: { pos: number; node: ProseMirrorNode } | null = null;

  block.descendants((node, relativePos) => {
    if (!node.isTextblock) {
      return;
    }

    const pos = blockPos + 1 + relativePos;

    if (edge === 'first' && match === null) {
      match = { pos, node };
      return false;
    }

    if (edge === 'last') {
      match = { pos, node };
    }
  });

  return match;
};

const cursorInTextblock = (
  $pos: ResolvedPos,
  textblockNodePos: number,
  textblock: ProseMirrorNode
) => {
  const start = textblockNodePos + 1;
  const end = textblockNodePos + textblock.nodeSize - 1;

  return $pos.pos >= start && $pos.pos <= end;
};

const isOnLastLineOfTextblock = (text: string, offset: number) =>
  !text.slice(offset).includes('\n');

const isOnFirstLineOfTextblock = (text: string, offset: number) =>
  !text.slice(0, offset).includes('\n');

const isAtEndOfTextblock = ($head: ResolvedPos) => {
  const parent = $head.parent;

  if (!parent.isTextblock) {
    return false;
  }

  const text = parent.textContent;
  const offset = $head.parentOffset;

  if (offset >= parent.content.size) {
    return true;
  }

  return isOnLastLineOfTextblock(text, offset);
};

const isAtStartOfTextblock = ($head: ResolvedPos) => {
  const parent = $head.parent;

  if (!parent.isTextblock) {
    return false;
  }

  const text = parent.textContent;
  const offset = $head.parentOffset;

  if (offset <= 0) {
    return true;
  }

  return isOnFirstLineOfTextblock(text, offset);
};

const isAtBottomLeaf = ($head: ResolvedPos) => {
  if ($head.depth < 1) {
    return false;
  }

  const topPos = $head.before(1);
  const topBlock = $head.node(1);
  const last = getTextblockAtEdge(topPos, topBlock, 'last');

  if (!last) {
    return false;
  }

  return cursorInTextblock($head, last.pos, last.node);
};

const isAtTopLeaf = ($head: ResolvedPos) => {
  if ($head.depth < 1) {
    return false;
  }

  const topPos = $head.before(1);
  const topBlock = $head.node(1);
  const first = getTextblockAtEdge(topPos, topBlock, 'first');

  if (!first) {
    return false;
  }

  return cursorInTextblock($head, first.pos, first.node);
};

const insertSpacerParagraph = (
  view: EditorView,
  insertPos: number
): boolean => {
  const { state } = view;
  const paragraph = state.schema.nodes.paragraph;

  if (!paragraph) {
    return false;
  }

  const tr = state.tr.insert(insertPos, paragraph.create());
  tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
  view.dispatch(tr);

  return true;
};

const handleArrowDown = (view: EditorView): boolean => {
  const { state } = view;
  const { selection, doc } = state;
  const { $head, empty } = selection;

  if (!empty || $head.depth < 1) {
    return false;
  }

  if (!isAtEndOfTextblock($head) || !isAtBottomLeaf($head)) {
    return false;
  }

  const index = $head.index(0);
  const blockA = doc.child(index);

  if (!isNonParagraph(blockA)) {
    return false;
  }

  const blockB = doc.maybeChild(index + 1);

  if (!blockB || !isNonParagraph(blockB)) {
    return false;
  }

  return insertSpacerParagraph(view, $head.after(1));
};

const handleArrowUp = (view: EditorView): boolean => {
  const { state } = view;
  const { selection, doc } = state;
  const { $head, empty } = selection;

  if (!empty || $head.depth < 1) {
    return false;
  }

  if (!isAtStartOfTextblock($head) || !isAtTopLeaf($head)) {
    return false;
  }

  const index = $head.index(0);
  const blockB = doc.child(index);

  if (!isNonParagraph(blockB)) {
    return false;
  }

  const blockA = doc.maybeChild(index - 1);

  if (!blockA || !isNonParagraph(blockA)) {
    return false;
  }

  return insertSpacerParagraph(view, $head.before(1));
};

const removeUnusedSpacers = (newState: EditorState) => {
  const { doc, selection, schema } = newState;
  const paragraph = schema.nodes.paragraph;

  if (!paragraph) {
    return null;
  }

  const { head } = selection;
  const toDelete: { from: number; to: number }[] = [];
  let pos = 0;

  for (let index = 0; index < doc.childCount; index += 1) {
    const node = doc.child(index);
    const nodeFrom = pos;
    const nodeTo = pos + node.nodeSize;

    if (
      isEmptyParagraph(node) &&
      index > 0 &&
      index < doc.childCount - 1 &&
      isNonParagraph(doc.child(index - 1)) &&
      isNonParagraph(doc.child(index + 1)) &&
      (head < nodeFrom + 1 || head > nodeTo - 1)
    ) {
      toDelete.push({ from: nodeFrom, to: nodeTo });
    }

    pos = nodeTo;
  }

  if (toDelete.length === 0) {
    return null;
  }

  const tr = newState.tr;

  for (let index = toDelete.length - 1; index >= 0; index -= 1) {
    tr.delete(toDelete[index].from, toDelete[index].to);
  }

  return tr;
};

/**
 * Inserts a transient empty paragraph between adjacent non-paragraph blocks
 * when navigating across them with the arrow keys.
 */
export const BlockSpacer = Extension.create({
  name: 'blockSpacer',
  priority: 1000,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pluginKey,
        props: {
          handleKeyDown(view, event) {
            if (event.key === 'ArrowDown') {
              return handleArrowDown(view);
            }

            if (event.key === 'ArrowUp') {
              return handleArrowUp(view);
            }

            return false;
          },
        },
        appendTransaction: (_transactions, _oldState, newState) =>
          removeUnusedSpacers(newState),
      }),
    ];
  },
});
