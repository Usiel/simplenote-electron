import { Markdown } from '@tiptap/markdown';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';
import Typography from '@tiptap/extension-typography';
import StarterKit from '@tiptap/starter-kit';

import { normalizeSafeLinkHref } from '../utils/url-safety';
import { BlockSpacer } from './block-spacer';
import { MarkdownClipboard } from './clipboard';
import { FirstLineH1 } from './first-line-h1';

export { normalizeNoteMarkdown } from './note-first-line';

const simplenoteNoteLink = /^simplenote:\/\/note\/[a-zA-Z0-9-]+$/;

const isAllowedLinkHref = (href: string) =>
  simplenoteNoteLink.test(href) || !!normalizeSafeLinkHref(href);

/** TipTap extensions limited to GitHub Flavored Markdown. */
export const createNoteEditorExtensions = () => [
  StarterKit.configure({
    horizontalRule: false,
    underline: false,
    hardBreak: false,
    link: false,
  }),
  Link.configure({
    openOnClick: false,
    enableClickSelection: true,
    autolink: false,
    validate: (href) => isAllowedLinkHref(href),
    HTMLAttributes: {
      rel: 'external noopener noreferrer',
      target: '_blank',
    },
  }),
  HorizontalRule,
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit.configure({ table: { resizable: false } }),
  Image.configure({ allowBase64: false }),
  Typography,
  FirstLineH1,
  BlockSpacer,
  MarkdownClipboard,
  Markdown.configure({ markedOptions: { gfm: true } }),
];
