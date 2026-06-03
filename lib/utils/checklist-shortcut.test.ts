import {
  dispatchToggleChecklist,
  isInsertChecklistShortcut,
} from './checklist-shortcut';

describe('checklist-shortcut', () => {
  describe('isInsertChecklistShortcut', () => {
    const event = {
      key: 'c',
      shiftKey: true,
      ctrlKey: false,
      metaKey: false,
    } as KeyboardEvent;

    it('matches Cmd/Ctrl+Shift+C', () => {
      expect(isInsertChecklistShortcut({ ...event, metaKey: true })).toBe(true);
      expect(isInsertChecklistShortcut({ ...event, ctrlKey: true })).toBe(true);
    });

    it('does not match without shift or modifier', () => {
      expect(
        isInsertChecklistShortcut({ ...event, metaKey: true, shiftKey: false })
      ).toBe(false);
      expect(isInsertChecklistShortcut({ ...event, key: 'm' })).toBe(false);
    });
  });

  describe('dispatchToggleChecklist', () => {
    it('dispatches toggleChecklist on window', () => {
      const listener = jest.fn();
      window.addEventListener('toggleChecklist', listener);

      dispatchToggleChecklist();

      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener('toggleChecklist', listener);
    });
  });
});
