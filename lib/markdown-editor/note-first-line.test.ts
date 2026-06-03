import {
  ensureMarkdownH1,
  normalizeNoteMarkdown,
  stripMarkdownH1,
} from './note-first-line';

describe('ensureMarkdownH1', () => {
  it('prepends # to the first line when missing', () => {
    expect(ensureMarkdownH1('Title\n\nBody')).toBe('# Title\n\nBody');
  });

  it('is idempotent when the first line already has #', () => {
    const md = '# Title\n\nBody';
    expect(ensureMarkdownH1(md)).toBe(md);
  });

  it('handles an empty note', () => {
    expect(ensureMarkdownH1('')).toBe('# ');
  });
});

describe('stripMarkdownH1', () => {
  it('removes a single leading # from the first line', () => {
    expect(stripMarkdownH1('# Title\n\nBody')).toBe('Title\n\nBody');
  });

  it('leaves content unchanged when the first line has no #', () => {
    expect(stripMarkdownH1('Title\n\nBody')).toBe('Title\n\nBody');
  });

  it('does not strip ## from the first line', () => {
    expect(stripMarkdownH1('## Subtitle\n\nBody')).toBe('## Subtitle\n\nBody');
  });
});

describe('normalizeNoteMarkdown', () => {
  it('ensures H1 on the first line', () => {
    expect(normalizeNoteMarkdown('Hello\n\nWorld')).toBe('# Hello\n\nWorld');
  });

  it('round-trips with strip after ensure', () => {
    const original = 'My title\n\nContent';
    const withH1 = ensureMarkdownH1(original);
    expect(stripMarkdownH1(withH1)).toBe(original);
  });

  it('collapses duplicate task markers on one line', () => {
    expect(
      normalizeNoteMarkdown('# Note\n\n- [ ] - [ ] change this to ordered\n')
    ).toBe('# Note\n\n- [ ] change this to ordered\n');
  });
});
