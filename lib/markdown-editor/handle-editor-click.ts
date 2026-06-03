import { viewExternalUrl } from '../utils/url-utils';
import { isSameDocumentLink, normalizeSafeLinkHref } from '../utils/url-safety';

import * as T from '../types';

export const handleEditorClick = (
  event: MouseEvent,
  notes: Map<T.EntityId, T.Note>,
  openNote: (noteId: T.EntityId) => void
): boolean => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const anchor = target.closest('a');

  if (!anchor) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();

  if (anchor.href.startsWith('simplenote://note/')) {
    const match = /^simplenote:\/\/note\/(.+)$/.exec(anchor.href);

    if (!match) {
      return true;
    }

    const linkedNoteId = match[1] as T.EntityId;

    if (notes.has(linkedNoteId)) {
      openNote(linkedNoteId);
    }

    return true;
  }

  if (!isSameDocumentLink(anchor.href)) {
    const href = normalizeSafeLinkHref(anchor.href);

    if (href) {
      viewExternalUrl(href);
    }
  }

  return true;
};
