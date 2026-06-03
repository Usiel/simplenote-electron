import {
  normalizeDuplicateTaskMarkers,
  stripEmbeddedTaskMarker,
} from './task-list-markdown';

describe('task-list-markdown', () => {
  it('collapses duplicate task markers on one line', () => {
    const input =
      '- [ ] - [ ] change this to ordered or unordered list and see what happens';
    expect(normalizeDuplicateTaskMarkers(input)).toBe(
      '- [ ] change this to ordered or unordered list and see what happens'
    );
  });

  it('strips an embedded task marker from label text', () => {
    expect(stripEmbeddedTaskMarker('- [ ] change this')).toBe('change this');
  });
});
