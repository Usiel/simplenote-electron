import { combineReducers } from 'redux';

import * as A from '../action-types';
import * as T from '../../types';

const accountName: A.Reducer<string | null> = (state = null, action) => {
  switch (action.type) {
    case 'setAccountName':
      return action.accountName;
    default:
      return state;
  }
};

const autoHideMenuBar: A.Reducer<boolean> = (state = false, action) => {
  switch (action.type) {
    case 'setAutoHideMenuBar':
      return action.autoHideMenuBar;
    case 'TOGGLE_AUTO_HIDE_MENU_BAR':
      return !state;
    default:
      return state;
  }
};

const focusModeEnabled: A.Reducer<boolean> = (state = false, action) => {
  switch (action.type) {
    case 'setFocusMode':
      return action.focusModeEnabled;
    case 'TOGGLE_FOCUS_MODE':
      return !state;
    default:
      return state;
  }
};

const keyboardShortcuts: A.Reducer<boolean> = (state = true, action) => {
  switch (action.type) {
    case 'KEYBOARD_SHORTCUTS_TOGGLE':
      return !state;
    default:
      return state;
  }
};

const lineLength: A.Reducer<T.LineLength> = (state = 'narrow', action) => {
  switch (action.type) {
    case 'setLineLength':
      return action.lineLength;
    default:
      return state;
  }
};

const markdownEnabled: A.Reducer<boolean> = (state = false, action) => {
  switch (action.type) {
    case 'SET_SYSTEM_TAG':
      if ('markdown' === action.tagName) {
        return action.shouldHaveTag;
      }
      return state;
    default:
      return state;
  }
};

const noteDisplay: A.Reducer<T.ListDisplayMode> = (state = 'comfy', action) => {
  switch (action.type) {
    case 'setNoteDisplay':
      return action.noteDisplay;
    default:
      return state;
  }
};

// Caching the notifications permission status (expensive in Electron)
let notificationsGranted = window.Notification?.permission === 'granted';

navigator.permissions?.query({ name: 'notifications' }).then((status) => {
  status.addEventListener('change', () => {
    notificationsGranted = status.state === 'granted';
  });
});

const sendNotifications: A.Reducer<boolean> = (
  state = notificationsGranted,
  action
) => {
  switch (action.type) {
    case 'REQUEST_NOTIFICATIONS':
      // An explicit user action, and the permission prompt may have just
      // resolved: re-read the real value instead of trusting the cache.
      notificationsGranted = window.Notification?.permission === 'granted';
      return action.sendNotifications ? notificationsGranted : false;

    default:
      return state && notificationsGranted;
  }
};

const sortReversed: A.Reducer<boolean> = (state = false, action) => {
  switch (action.type) {
    case 'setSortReversed':
      return action.sortReversed;
    case 'setSortType':
      return typeof action.sortReversed !== 'undefined'
        ? action.sortReversed
        : state;
    case 'TOGGLE_SORT_ORDER':
      return !state;
    default:
      return state;
  }
};

const sortTagsAlpha: A.Reducer<boolean> = (state = false, action) => {
  switch (action.type) {
    case 'setSortTagsAlpha':
      return action.sortTagsAlpha;
    case 'TOGGLE_SORT_TAGS_ALPHA':
      return !state;
    default:
      return state;
  }
};
const sortType: A.Reducer<T.SortType> = (
  state = 'modificationDate',
  action
) => {
  switch (action.type) {
    case 'setSortType':
      return action.sortType;
    default:
      return state;
  }
};
const spellCheckEnabled: A.Reducer<boolean> = (state = true, action) => {
  switch (action.type) {
    case 'setSpellCheck':
      return action.spellCheckEnabled;
    case 'TOGGLE_SPELLCHECK':
      return !state;
    default:
      return state;
  }
};

const theme: A.Reducer<T.Theme> = (state = 'system', action) => {
  switch (action.type) {
    case 'setTheme':
      return action.theme;
    default:
      return state;
  }
};

export default combineReducers({
  accountName,
  autoHideMenuBar,
  focusModeEnabled,
  keyboardShortcuts,
  lineLength,
  markdownEnabled,
  noteDisplay,
  sendNotifications,
  sortReversed,
  sortTagsAlpha,
  sortType,
  spellCheckEnabled,
  theme,
});
