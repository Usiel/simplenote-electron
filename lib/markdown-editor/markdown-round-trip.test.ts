import { Editor } from '@tiptap/core';

import { createNoteEditorExtensions } from './extensions';

const createEditor = () =>
  new Editor({
    extensions: createNoteEditorExtensions(),
  });

const roundTrip = (markdown: string): string => {
  const editor = createEditor();
  editor.commands.setContent(markdown, { contentType: 'markdown' });
  return editor.getMarkdown();
};

const normalizeMd = (s: string) => s.replace(/\r\n/g, '\n').trim();

describe('markdown round-trip via @tiptap/markdown', () => {
  afterEach(() => {
    // editors are not explicitly destroyed in each test; gc handles in jest
  });

  it('round-trips a title H1 and body paragraph', () => {
    const input = '# Title\n\nBody text.';
    expect(normalizeMd(roundTrip(input))).toBe(normalizeMd(input));
  });

  it('round-trips bold, italic, strike, and inline code', () => {
    const input =
      '# Note\n\n**bold** *italic* ~~strike~~ `code` and a [link](https://example.com).';
    const out = roundTrip(input);
    expect(out).toContain('**bold**');
    expect(out).toContain('*italic*');
    expect(out).toContain('~~strike~~');
    expect(out).toContain('`code`');
    expect(out).toContain('[link](https://example.com)');
  });

  it('round-trips GFM task lists', () => {
    const input = '# Tasks\n\n- [ ] Todo\n- [x] Done';
    const out = roundTrip(input);
    expect(out).toMatch(/- \[ \]/);
    expect(out).toMatch(/- \[[xX]\]/);
  });

  it('round-trips nested bullet lists', () => {
    const input = '# List\n\n- one\n  - two\n    - three';
    const out = roundTrip(input);
    expect(out).toContain('- one');
    expect(out).toContain('two');
    expect(out).toContain('three');
  });

  it('round-trips ordered lists', () => {
    const input = '# Ordered\n\n1. first\n2. second';
    expect(normalizeMd(roundTrip(input))).toBe(normalizeMd(input));
  });

  it('round-trips blockquote', () => {
    const input = '# Quote\n\n> quoted text';
    expect(normalizeMd(roundTrip(input))).toBe(normalizeMd(input));
  });

  it('round-trips fenced code block', () => {
    const input = '# Code\n\n```js\nconst x = 1;\n```';
    const out = roundTrip(input);
    expect(out).toContain('```');
    expect(out).toContain('const x = 1');
  });

  it('round-trips a markdown table', () => {
    const input = '# Table\n\n| A | B |\n| --- | --- |\n| 1 | 2 |';
    const out = roundTrip(input);
    expect(out).toMatch(/\|\s*A\s*\|/);
    expect(out).toMatch(/\|\s*1\s*\|/);
  });

  it('round-trips horizontal rule', () => {
    const input = '# HR\n\n---\n\nAfter';
    const out = roundTrip(input);
    expect(out).toMatch(/---|^\*\*\*$/m);
    expect(out).toContain('After');
  });
});
