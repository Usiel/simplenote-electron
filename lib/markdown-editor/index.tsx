import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import { debounce } from 'lodash';

import {
  buildPreviewClipboardPayload,
  shouldCopyWholePreview,
  writeClipboardPayload,
} from '../utils/clipboard/copy';
import { withCheckboxSyntax } from '../utils/task-transform';
import actions from '../state/actions';

import { createNoteEditorExtensions } from './extensions';
import { handleEditorClick } from './handle-editor-click';
import { normalizeNoteMarkdown } from './note-first-line';
import { MarkdownEditorToolbar } from './toolbar';

import './style.scss';

import * as S from '../state';
import * as T from '../types';

const SAVE_DELAY = 300;

type OwnProps = {
  storeFocusEditor?: (focusSetter: () => void) => void;
  storeHasFocus?: (focusGetter: () => boolean) => void;
};

type StateProps = {
  note: T.Note | null;
  noteId: T.EntityId | null;
  notes: Map<T.EntityId, T.Note>;
  spellCheckEnabled: boolean;
};

type DispatchProps = {
  editNote: (noteId: T.EntityId, changes: Partial<T.Note>) => void;
  openNote: (noteId: T.EntityId) => void;
};

type Props = OwnProps & StateProps & DispatchProps;

const getMarkdownFromEditor = (editor: Editor) => editor.getMarkdown();

const setMarkdownContent = (editor: Editor, content: string) =>
  editor.commands.setContent(content, {
    contentType: 'markdown',
    emitUpdate: false,
  });

export const MarkdownEditorView: React.FunctionComponent<Props> = ({
  editNote,
  note,
  noteId,
  notes,
  openNote,
  spellCheckEnabled,
  storeFocusEditor,
  storeHasFocus,
}) => {
  const editorRef = useRef<Editor | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastSavedContent = useRef<string | null>(null);
  const lastNoteId = useRef<T.EntityId | null>(null);
  const extensions = useMemo(() => createNoteEditorExtensions(), []);

  const debouncedSave = useRef(
    debounce((editor: Editor, saveNoteId: T.EntityId | null) => {
      if (editor.isDestroyed || editor.view.composing || !saveNoteId) {
        return;
      }

      const markdown = normalizeNoteMarkdown(
        withCheckboxSyntax(getMarkdownFromEditor(editor))
      );
      lastSavedContent.current = markdown;
      editNote(saveNoteId, { content: markdown });
    }, SAVE_DELAY)
  );

  useEffect(() => () => debouncedSave.current.cancel(), []);

  const editor = useEditor(
    {
      extensions,
      content: normalizeNoteMarkdown(note?.content ?? ''),
      contentType: 'markdown',
      shouldRerenderOnTransaction: true,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          'aria-label': 'Note content',
          class: 'tiptap note-detail-markdown',
          'data-markdown-root': 'true',
          spellcheck: spellCheckEnabled ? 'true' : 'false',
          tabindex: '0',
        },
        handleDOMEvents: {
          click: (_view, event) =>
            handleEditorClick(event as MouseEvent, notes, openNote),
        },
      },
      onUpdate: ({ editor: currentEditor }) => {
        debouncedSave.current(currentEditor, noteId);
      },
      onDestroy: () => {
        editorRef.current = null;
      },
    },
    [extensions]
  );

  useEffect(() => {
    editorRef.current = editor ?? null;
  }, [editor]);

  const focusEditor = useCallback(() => {
    editorRef.current?.commands.focus();
  }, []);

  const hasFocus = useCallback(
    () =>
      !!editorRef.current?.isFocused ||
      !!rootRef.current?.contains(document.activeElement),
    []
  );

  useEffect(() => {
    storeFocusEditor?.(focusEditor);
    storeHasFocus?.(hasFocus);
  }, [focusEditor, hasFocus, storeFocusEditor, storeHasFocus]);

  useEffect(() => {
    const toggleTaskList = () => {
      if (!editor || editor.isDestroyed) {
        return;
      }

      editor.chain().focus().toggleTaskList().run();
    };

    const onEditorCommand = (command: { action?: string }) => {
      if (command?.action === 'insertChecklist') {
        toggleTaskList();
      }
    };

    window.addEventListener('toggleChecklist', toggleTaskList, true);
    window.electron?.receive('editorCommand', onEditorCommand);

    return () => {
      window.removeEventListener('toggleChecklist', toggleTaskList, true);
      window.electron?.removeListener('editorCommand', onEditorCommand);
    };
  }, [editor]);

  useEffect(() => {
    if (editor?.view.dom) {
      editor.view.dom.setAttribute(
        'spellcheck',
        spellCheckEnabled ? 'true' : 'false'
      );
    }
  }, [editor, spellCheckEnabled]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    const content = normalizeNoteMarkdown(note?.content ?? '');

    if (noteId !== lastNoteId.current) {
      debouncedSave.current.cancel();
      lastNoteId.current = noteId;
      lastSavedContent.current = null;
      setMarkdownContent(editor, content);
      lastSavedContent.current = content;
      return;
    }

    if (content === lastSavedContent.current) {
      return;
    }

    if (editor.isFocused) {
      return;
    }

    setMarkdownContent(editor, content);
    lastSavedContent.current = content;
  }, [editor, note?.content, noteId]);

  useEffect(() => {
    const copyNote = (event: ClipboardEvent) => {
      const currentEditor = editorRef.current;
      const root = currentEditor?.view.dom ?? rootRef.current;

      if (
        !note ||
        !root ||
        !event.clipboardData ||
        !shouldCopyWholePreview(
          root,
          document.getSelection(),
          document.activeElement
        )
      ) {
        return;
      }

      const markdown = normalizeNoteMarkdown(
        currentEditor
          ? withCheckboxSyntax(getMarkdownFromEditor(currentEditor))
          : (note.content ?? '')
      );

      const didWrite = writeClipboardPayload(
        event.clipboardData,
        buildPreviewClipboardPayload(
          markdown,
          true,
          currentEditor?.getText() ?? root.textContent ?? ''
        )
      );

      if (didWrite) {
        event.preventDefault();
      }
    };

    document.addEventListener('copy', copyNote, false);
    return () => document.removeEventListener('copy', copyNote, false);
  }, [note?.content]);

  if (!editor) {
    return (
      <div className="note-detail-wrapper" ref={rootRef}>
        <div className="note-detail note-detail-markdown-editor">
          <div className="markdown-editor-wrapper">
            <div
              aria-label="Note content"
              className="note-detail-markdown"
              data-markdown-root
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="note-detail-wrapper" ref={rootRef}>
      <div className="note-detail note-detail-markdown-editor">
        <div className="markdown-editor-wrapper">
          <MarkdownEditorToolbar editor={editor} />
          <div className="markdown-editor-content">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps: S.MapState<StateProps> = (state) => ({
  note: state.data.notes.get(state.ui.openedNote) ?? null,
  noteId: state.ui.openedNote,
  notes: state.data.notes,
  spellCheckEnabled: state.settings.spellCheckEnabled,
});

const mapDispatchToProps: S.MapDispatch<DispatchProps> = {
  editNote: actions.data.editNote,
  openNote: actions.ui.selectNote,
};

export default connect(mapStateToProps, mapDispatchToProps)(MarkdownEditorView);

export { getMarkdownFromEditor };
