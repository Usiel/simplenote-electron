import React, { ElementType } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { Tooltip } from '@mui/material';

import ChecklistIcon from '../icons/check-list';
import { CmdOrCtrl } from '../utils/platform';
import { isSelectionInTitleBlock } from './editor-utils';
import {
  BlockquoteIcon,
  BoldIcon,
  BulletListIcon,
  CodeBlockIcon,
  CodeIcon,
  HeadingIcon,
  HorizontalRuleIcon,
  ItalicIcon,
  LinkIcon,
  OrderedListIcon,
  RedoIcon,
  StrikeIcon,
  UndoIcon,
} from './toolbar-icons';

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  icon: ElementType;
  onClick: () => void;
  title: string;
};

const ToolbarButton = ({
  active,
  disabled,
  icon: Icon,
  onClick,
  title,
}: ToolbarButtonProps) => (
  <Tooltip
    classes={{ tooltip: 'icon-button__tooltip' }}
    enterDelay={200}
    title={title}
  >
    <span>
      <button
        aria-label={title}
        aria-pressed={active}
        className={`tiptap-button${active ? ' is-active' : ''}`}
        data-active-state={active ? 'on' : 'off'}
        data-size="small"
        disabled={disabled}
        onClick={onClick}
        type="button"
      >
        <span className="tiptap-button-icon">
          <Icon />
        </span>
      </button>
    </span>
  </Tooltip>
);

const ToolbarSeparator = () => (
  <div className="tiptap-separator" role="separator" />
);

const ToolbarGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="tiptap-toolbar-group">{children}</div>
);

type Props = {
  editor: Editor;
};

export const MarkdownEditorToolbar: React.FunctionComponent<Props> = ({
  editor,
}) => {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      inTitle: isSelectionInTitleBlock(current),
      canUndo: current.can().chain().undo().run(),
      canRedo: current.can().chain().redo().run(),
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      strike: current.isActive('strike'),
      code: current.isActive('code'),
      link: current.isActive('link'),
      h2: current.isActive('heading', { level: 2 }),
      h3: current.isActive('heading', { level: 3 }),
      h4: current.isActive('heading', { level: 4 }),
      bulletList: current.isActive('bulletList'),
      orderedList: current.isActive('orderedList'),
      taskList: current.isActive('taskList'),
      blockquote: current.isActive('blockquote'),
      codeBlock: current.isActive('codeBlock'),
    }),
  });

  const blockDisabled = state.inTitle;

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', previous ?? 'https://');

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div
      aria-label="Markdown formatting"
      className="tiptap-toolbar"
      data-variant="fixed"
      role="toolbar"
    >
      <ToolbarGroup>
        <ToolbarButton
          disabled={!state.canUndo}
          icon={UndoIcon}
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        />
        <ToolbarButton
          disabled={!state.canRedo}
          icon={RedoIcon}
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          active={state.bold}
          icon={BoldIcon}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        />
        <ToolbarButton
          active={state.italic}
          icon={ItalicIcon}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        />
        <ToolbarButton
          active={state.strike}
          icon={StrikeIcon}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        />
        <ToolbarButton
          active={state.code}
          icon={CodeIcon}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline code"
        />
        <ToolbarButton
          active={state.link}
          icon={LinkIcon}
          onClick={setLink}
          title="Link"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          active={state.h2}
          disabled={blockDisabled}
          icon={() => <HeadingIcon level={2} />}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading 2"
        />
        <ToolbarButton
          active={state.h3}
          disabled={blockDisabled}
          icon={() => <HeadingIcon level={3} />}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Heading 3"
        />
        <ToolbarButton
          active={state.h4}
          disabled={blockDisabled}
          icon={() => <HeadingIcon level={4} />}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          title="Heading 4"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          active={state.bulletList}
          disabled={blockDisabled}
          icon={BulletListIcon}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        />
        <ToolbarButton
          active={state.orderedList}
          disabled={blockDisabled}
          icon={OrderedListIcon}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        />
        <ToolbarButton
          active={state.taskList}
          disabled={blockDisabled}
          icon={ChecklistIcon}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title={`Task list • ${CmdOrCtrl}+Shift+C`}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          active={state.blockquote}
          disabled={blockDisabled}
          icon={BlockquoteIcon}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        />
        <ToolbarButton
          active={state.codeBlock}
          disabled={blockDisabled}
          icon={CodeBlockIcon}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code block"
        />
        <ToolbarButton
          disabled={blockDisabled}
          icon={HorizontalRuleIcon}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        />
      </ToolbarGroup>
    </div>
  );
};
