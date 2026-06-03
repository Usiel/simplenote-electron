import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode, Schema } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';

import type { ActiveListType } from './editor-utils';
import { stripEmbeddedTaskMarker } from './task-list-markdown';

export type ToolbarListType = ActiveListType;

type SubListInfo = {
  node: ProseMirrorNode;
  pos: number;
};

type SubListSelectionAnchor = {
  itemIndex: number;
  textOffset: number;
};

/** Which list item and text offset the cursor was in before replacing a sub-list. */
const captureSubListSelectionAnchor = (
  editor: Editor,
  info: SubListInfo
): SubListSelectionAnchor => {
  const { $from } = editor.state.selection;
  const listStart = info.pos;
  const listEnd = info.pos + info.node.nodeSize;

  if ($from.pos < listStart || $from.pos > listEnd) {
    return { itemIndex: 0, textOffset: 0 };
  }

  let childPos = listStart + 1;

  for (let index = 0; index < info.node.childCount; index += 1) {
    const child = info.node.child(index);
    const childEnd = childPos + child.nodeSize;

    if ($from.pos >= childPos && $from.pos <= childEnd) {
      let blockPos = childPos + 1;
      let textOffset = 0;

      child.forEach((block) => {
        if (block.type.name === 'paragraph') {
          const paragraphStart = blockPos + 1;
          const paragraphEnd = blockPos + block.nodeSize - 1;

          if ($from.pos >= paragraphStart && $from.pos <= paragraphEnd) {
            textOffset = $from.pos - paragraphStart;
          }
        }

        blockPos += block.nodeSize;
      });

      return { itemIndex: index, textOffset };
    }

    childPos = childEnd;
  }

  return { itemIndex: 0, textOffset: 0 };
};

const textPositionInListItem = (
  listPos: number,
  list: ProseMirrorNode,
  itemIndex: number,
  textOffset: number
): number => {
  let pos = listPos + 1;
  const clampedIndex = Math.min(
    Math.max(itemIndex, 0),
    Math.max(0, list.childCount - 1)
  );

  for (let index = 0; index < clampedIndex; index += 1) {
    pos += list.child(index).nodeSize;
  }

  const item = list.child(clampedIndex);

  if (!item) {
    return pos + 1;
  }

  pos += 1;
  let blockPos = pos;

  for (let blockIndex = 0; blockIndex < item.childCount; blockIndex += 1) {
    const block = item.child(blockIndex);

    if (block.type.name === 'paragraph') {
      const textLength = block.textContent.length;
      const clampedOffset = Math.min(Math.max(textOffset, 0), textLength);

      return blockPos + 1 + clampedOffset;
    }

    blockPos += block.nodeSize;
  }

  return pos;
};

const textPositionInUnwrappedBlocks = (
  blockStartPos: number,
  blocks: ProseMirrorNode[],
  itemIndex: number,
  textOffset: number
): number => {
  let pos = blockStartPos;
  const clampedIndex = Math.min(
    Math.max(itemIndex, 0),
    Math.max(0, blocks.length - 1)
  );

  for (let index = 0; index < clampedIndex; index += 1) {
    pos += blocks[index].nodeSize;
  }

  const block = blocks[clampedIndex];

  if (block?.type.name === 'paragraph') {
    const textLength = block.textContent.length;
    const clampedOffset = Math.min(Math.max(textOffset, 0), textLength);

    return pos + 1 + clampedOffset;
  }

  return pos + 1;
};

const replaceSubListPreservingSelection = (
  editor: Editor,
  info: SubListInfo,
  newList: ProseMirrorNode
): boolean => {
  const anchor = captureSubListSelectionAnchor(editor, info);

  return editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.replaceWith(info.pos, info.pos + info.node.nodeSize, newList);
      const selectionPos = textPositionInListItem(
        info.pos,
        newList,
        anchor.itemIndex,
        anchor.textOffset
      );
      tr.setSelection(TextSelection.create(tr.doc, selectionPos));
      return true;
    })
    .run();
};

const LIST_TYPES = ['taskList', 'orderedList', 'bulletList'] as const;
type ListTypeName = (typeof LIST_TYPES)[number];

const isListType = (name: string): name is ListTypeName =>
  LIST_TYPES.includes(name as ListTypeName);

const LIST_CONTAINER_TYPES = ['taskItem', 'listItem'] as const;

/**
 * Innermost list nested directly inside a task item or list item
 * (including when the cursor is on the parent item label).
 */
export const findNestedSubList = (editor: Editor): SubListInfo | null => {
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    const parentName = $from.node(depth - 1)?.type.name;

    if (
      isListType(node.type.name) &&
      LIST_CONTAINER_TYPES.includes(
        parentName as (typeof LIST_CONTAINER_TYPES)[number]
      )
    ) {
      return { node, pos: $from.before(depth) };
    }
  }

  for (let depth = $from.depth; depth > 0; depth--) {
    const container = $from.node(depth);

    if (
      !LIST_CONTAINER_TYPES.includes(
        container.type.name as (typeof LIST_CONTAINER_TYPES)[number]
      )
    ) {
      continue;
    }

    let pos = $from.before(depth) + 1;

    for (let i = 0; i < container.childCount; i++) {
      const child = container.child(i);

      if (isListType(child.type.name)) {
        return { node: child, pos };
      }

      pos += child.nodeSize;
    }
  }

  return null;
};

/** Innermost list wrapping the selection (top-level or otherwise). */
const findInnermostListAtSelection = (editor: Editor): SubListInfo | null => {
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);

    if (isListType(node.type.name)) {
      return { node, pos: $from.before(depth) };
    }
  }

  return null;
};

const listItemBlocks = (listItem: ProseMirrorNode): ProseMirrorNode[] => {
  const blocks: ProseMirrorNode[] = [];

  listItem.forEach((block) => {
    if (!isListType(block.type.name)) {
      blocks.push(block);
    }
  });

  return blocks;
};

const stripTaskMarkerFromParagraph = (
  paragraph: ProseMirrorNode,
  schema: Schema
): ProseMirrorNode => {
  if (paragraph.type.name !== 'paragraph') {
    return paragraph;
  }

  const paragraphType = schema.nodes.paragraph;
  const content: ProseMirrorNode[] = [];
  let changed = false;

  paragraph.forEach((child) => {
    if (!child.isText) {
      content.push(child);
      return;
    }

    const stripped = stripEmbeddedTaskMarker(child.text ?? '');

    if (stripped !== child.text) {
      changed = true;
    }

    if (stripped) {
      content.push(schema.text(stripped, child.marks));
    }
  });

  if (!changed) {
    return paragraph;
  }

  return content.length
    ? paragraphType.create(null, content)
    : paragraphType.create();
};

const taskItemBlocks = (
  taskItem: ProseMirrorNode,
  schema: Schema
): ProseMirrorNode[] => {
  const blocks: ProseMirrorNode[] = [];

  taskItem.forEach((block) => {
    if (isListType(block.type.name)) {
      return;
    }

    blocks.push(
      block.type.name === 'paragraph'
        ? stripTaskMarkerFromParagraph(block, schema)
        : block
    );
  });

  return blocks;
};

const extractItemContent = (
  item: ProseMirrorNode,
  schema: Schema
): ProseMirrorNode[] => {
  if (item.type.name === 'taskItem') {
    return taskItemBlocks(item, schema);
  }

  if (item.type.name === 'listItem') {
    return listItemBlocks(item);
  }

  return [];
};

/** Convert every item in a list node to another list type (same path for all pairs). */
const convertSubListType = (
  editor: Editor,
  info: SubListInfo,
  targetType: ToolbarListType
): boolean => {
  const { schema } = editor.state;
  const paragraphType = schema.nodes.paragraph;
  const listNodeType = schema.nodes[targetType];

  if (!listNodeType || !paragraphType) {
    return false;
  }

  const listItems: ProseMirrorNode[] = [];

  info.node.forEach((child) => {
    if (child.type.name !== 'listItem' && child.type.name !== 'taskItem') {
      return;
    }

    const blocks = extractItemContent(child, schema);
    const content = blocks.length ? blocks : [paragraphType.create()];

    if (targetType === 'taskList') {
      const taskItemType = schema.nodes.taskItem;

      if (!taskItemType) {
        return;
      }

      listItems.push(taskItemType.create({ checked: false }, content));
      return;
    }

    const listItemType = schema.nodes.listItem;

    if (!listItemType) {
      return;
    }

    listItems.push(listItemType.create(null, content));
  });

  if (listItems.length === 0) {
    return false;
  }

  const newList = listNodeType.create(null, listItems);

  return replaceSubListPreservingSelection(editor, info, newList);
};

/** Remove a nested sub-list wrapper and leave plain blocks inside the parent item. */
const unwrapSubList = (editor: Editor, info: SubListInfo): boolean => {
  const { schema } = editor.state;
  const paragraphType = schema.nodes.paragraph;
  const anchor = captureSubListSelectionAnchor(editor, info);
  const blocks: ProseMirrorNode[] = [];

  info.node.forEach((child) => {
    const itemType = child.type.name;

    if (itemType !== 'listItem' && itemType !== 'taskItem') {
      return;
    }

    child.forEach((block) => {
      if (!isListType(block.type.name)) {
        blocks.push(
          block.type.name === 'paragraph'
            ? stripTaskMarkerFromParagraph(block, schema)
            : block
        );
      }
    });
  });

  const replacement = blocks.length > 0 ? blocks : [paragraphType.create()];

  return editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.replaceWith(info.pos, info.pos + info.node.nodeSize, replacement);
      const selectionPos = textPositionInUnwrappedBlocks(
        info.pos,
        replacement,
        anchor.itemIndex,
        anchor.textOffset
      );
      tr.setSelection(TextSelection.create(tr.doc, selectionPos));
      return true;
    })
    .run();
};

const toggleCommands: Record<ToolbarListType, (editor: Editor) => boolean> = {
  bulletList: (editor) => editor.chain().focus().toggleBulletList().run(),
  orderedList: (editor) => editor.chain().focus().toggleOrderedList().run(),
  taskList: (editor) => editor.chain().focus().toggleTaskList().run(),
};

/**
 * Toggle list type at the selection.
 *
 * - Nested sub-list (inside a task/bullet item): convert the whole sub-list, or
 *   unwrap when the same type is clicked again.
 * - Any other list: convert the whole innermost list when changing type; use
 *   TipTap only to turn a list off (same button) or create a new list from prose.
 */
const focusEditorAfterToggle = (editor: Editor, ran: boolean): boolean => {
  if (ran) {
    editor.commands.focus();
  }

  return ran;
};

export const toggleListAtSelection = (
  editor: Editor,
  listType: ToolbarListType
): boolean => {
  const nested = findNestedSubList(editor);

  if (nested) {
    if (nested.node.type.name === listType) {
      return focusEditorAfterToggle(editor, unwrapSubList(editor, nested));
    }

    return focusEditorAfterToggle(
      editor,
      convertSubListType(editor, nested, listType)
    );
  }

  const listScope = findInnermostListAtSelection(editor);

  if (listScope) {
    if (listScope.node.type.name === listType) {
      return focusEditorAfterToggle(editor, toggleCommands[listType](editor));
    }

    return focusEditorAfterToggle(
      editor,
      convertSubListType(editor, listScope, listType)
    );
  }

  return focusEditorAfterToggle(editor, toggleCommands[listType](editor));
};
