export const isInsertChecklistShortcut = (event: KeyboardEvent): boolean => {
  const { ctrlKey, metaKey, shiftKey } = event;

  return (ctrlKey || metaKey) && shiftKey && event.key.toLowerCase() === 'c';
};

export const dispatchToggleChecklist = (): void => {
  window.dispatchEvent(new Event('toggleChecklist'));
};
