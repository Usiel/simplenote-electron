import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

import type { ActiveListType } from './editor-utils';
import { getActiveListType } from './editor-utils';

export type ToolbarListType = ActiveListType;

type NestedListInTaskItem = {
  node: ProseMirrorNode;
  pos: number;
};

const NESTED_LIST_TYPES = ['taskList', 'orderedList', 'bulletList'] as const;

/** List nested inside a task item (cursor in the list or on the parent task label). */
const findNestedListInTaskItem = (
  editor: Editor
): NestedListInTaskItem | null => {
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    const { name } = node.type;

    if (
      NESTED_LIST_TYPES.includes(name as (typeof NESTED_LIST_TYPES)[number]) &&
      $from.node(depth - 1)?.type.name === 'taskItem'
    ) {
      return { node, pos: $from.before(depth) };
    }
  }

  for (let depth = $from.depth; depth > 0; depth--) {
    const taskItem = $from.node(depth);

    if (taskItem.type.name !== 'taskItem') {
      continue;
    }

    let pos = $from.before(depth) + 1;

    for (let i = 0; i < taskItem.childCount; i++) {
      const child = taskItem.child(i);

      if (
        NESTED_LIST_TYPES.includes(
          child.type.name as (typeof NESTED_LIST_TYPES)[number]
        )
      ) {
        return { node: child, pos };
      }

      pos += child.nodeSize;
    }
  }

  return null;
};

const listItemBlocks = (listItem: ProseMirrorNode): ProseMirrorNode[] => {
  const blocks: ProseMirrorNode[] = [];

  listItem.forEach((block) => {
    if (
      !NESTED_LIST_TYPES.includes(
        block.type.name as (typeof NESTED_LIST_TYPES)[number]
      )
    ) {
      blocks.push(block);
    }
  });

  return blocks;
};

const replaceNestedTaskListWithList = (
  editor: Editor,
  info: NestedListInTaskItem,
  listType: 'bulletList' | 'orderedList'
): boolean => {
  const { schema } = editor.state;
  const listNodeType = schema.nodes[listType];
  const listItemType = schema.nodes.listItem;
  const paragraphType = schema.nodes.paragraph;

  if (!listNodeType || !listItemType || !paragraphType) {
    return false;
  }

  const listItems: ProseMirrorNode[] = [];

  info.node.forEach((child) => {
    if (child.type.name !== 'taskItem') {
      return;
    }

    const blocks = listItemBlocks(child);

    listItems.push(
      listItemType.create(null, blocks.length ? blocks : paragraphType.create())
    );
  });

  const newList = listNodeType.create(null, listItems);

  return editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.replaceWith(info.pos, info.pos + info.node.nodeSize, newList);
      return true;
    })
    .run();
};

const replaceNestedListWithTaskList = (
  editor: Editor,
  info: NestedListInTaskItem
): boolean => {
  const { schema } = editor.state;
  const taskListType = schema.nodes.taskList;
  const taskItemType = schema.nodes.taskItem;
  const paragraphType = schema.nodes.paragraph;

  if (!taskListType || !taskItemType || !paragraphType) {
    return false;
  }

  const taskItems: ProseMirrorNode[] = [];

  info.node.forEach((child) => {
    if (child.type.name !== 'listItem') {
      return;
    }

    const blocks = listItemBlocks(child);

    taskItems.push(
      taskItemType.create(
        { checked: false },
        blocks.length ? blocks : paragraphType.create()
      )
    );
  });

  const newList = taskListType.create(null, taskItems);

  return editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.replaceWith(info.pos, info.pos + info.node.nodeSize, newList);
      return true;
    })
    .run();
};

const replaceNestedListWithList = (
  editor: Editor,
  info: NestedListInTaskItem,
  listType: 'bulletList' | 'orderedList'
): boolean => {
  const { schema } = editor.state;
  const listNodeType = schema.nodes[listType];
  const listItemType = schema.nodes.listItem;
  const paragraphType = schema.nodes.paragraph;

  if (!listNodeType || !listItemType || !paragraphType) {
    return false;
  }

  const listItems: ProseMirrorNode[] = [];

  info.node.forEach((child) => {
    if (child.type.name !== 'listItem') {
      return;
    }

    const blocks = listItemBlocks(child);

    listItems.push(
      listItemType.create(null, blocks.length ? blocks : paragraphType.create())
    );
  });

  const newList = listNodeType.create(null, listItems);

  return editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.replaceWith(info.pos, info.pos + info.node.nodeSize, newList);
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
 * Toggle list type at the selection. Nested lists inside task items convert all
 * sibling items together, including when the cursor is on the parent task label.
 */
export const toggleListAtSelection = (
  editor: Editor,
  listType: ToolbarListType
): boolean => {
  const nested = findNestedListInTaskItem(editor);

  if (nested?.node.type.name === 'taskList' && listType !== 'taskList') {
    return replaceNestedTaskListWithList(
      editor,
      nested,
      listType as 'bulletList' | 'orderedList'
    );
  }

  if (
    nested &&
    (nested.node.type.name === 'orderedList' ||
      nested.node.type.name === 'bulletList')
  ) {
    if (listType === 'taskList') {
      return replaceNestedListWithTaskList(editor, nested);
    }

    if (listType === 'bulletList' || listType === 'orderedList') {
      return replaceNestedListWithList(
        editor,
        nested,
        listType as 'bulletList' | 'orderedList'
      );
    }
  }

  const active = getActiveListType(editor);

  if (active === listType) {
    return toggleCommands[listType](editor);
  }

  return toggleCommands[listType](editor);
};
