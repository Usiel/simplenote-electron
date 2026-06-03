import { notes } from './reducer';

import * as T from '../../types';

const noteId = 'note-1' as T.EntityId;

const baseNote: T.Note = {
  content: 'My title\n\nBody',
  creationDate: 1,
  modificationDate: 1,
  deleted: false,
  publishURL: '',
  shareURL: '',
  systemTags: [],
  tags: [],
};

describe('notes reducer MARKDOWN_NOTE', () => {
  const initial = new Map([[noteId, baseNote]]);

  it('adds markdown tag and ensures H1 when enabling', () => {
    const next = notes(initial, {
      type: 'MARKDOWN_NOTE',
      noteId,
      shouldEnableMarkdown: true,
    });

    const note = next.get(noteId)!;
    expect(note.systemTags).toContain('markdown');
    expect(note.content.startsWith('# ')).toBe(true);
    expect(note.content).toContain('My title');
  });

  it('removes markdown tag and strips H1 when disabling', () => {
    const withMarkdown = new Map([
      [
        noteId,
        {
          ...baseNote,
          content: '# My title\n\nBody',
          systemTags: ['markdown' as T.SystemTag],
        },
      ],
    ]);

    const next = notes(withMarkdown, {
      type: 'MARKDOWN_NOTE',
      noteId,
      shouldEnableMarkdown: false,
    });

    const note = next.get(noteId)!;
    expect(note.systemTags).not.toContain('markdown');
    expect(note.content.startsWith('# ')).toBe(false);
    expect(note.content).toBe('My title\n\nBody');
  });

  it('round-trips enable then disable', () => {
    const enabled = notes(initial, {
      type: 'MARKDOWN_NOTE',
      noteId,
      shouldEnableMarkdown: true,
    });

    const disabled = notes(enabled, {
      type: 'MARKDOWN_NOTE',
      noteId,
      shouldEnableMarkdown: false,
    });

    expect(disabled.get(noteId)!.content).toBe(baseNote.content);
  });
});
