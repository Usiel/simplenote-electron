import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Keeps the document's first block as a level-1 heading in the TipTap editor.
 */
export const FirstLineH1 = Extension.create({
  name: 'firstLineH1',

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('firstLineH1');

    return [
      new Plugin({
        key: pluginKey,
        appendTransaction: (_transactions, _oldState, newState) => {
          const { doc, schema } = newState;
          const heading = schema.nodes.heading;

          if (!heading) {
            return null;
          }

          const first = doc.firstChild;

          if (!first) {
            return newState.tr.insert(0, heading.create({ level: 1 }));
          }

          if (first.type.name === 'heading' && first.attrs.level === 1) {
            return null;
          }

          if (first.type.name === 'codeBlock') {
            return newState.tr.insert(0, heading.create({ level: 1 }));
          }

          const headingNode = first.content.size
            ? heading.create({ level: 1 }, first.content)
            : heading.create({ level: 1 });

          return newState.tr.replaceWith(0, first.nodeSize, headingNode);
        },
      }),
    ];
  },
});
