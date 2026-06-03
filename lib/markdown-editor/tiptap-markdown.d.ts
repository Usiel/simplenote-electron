import '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    // Markdown extension commands are registered at runtime.
  }

  interface Editor {
    getMarkdown: () => string;
  }
}
