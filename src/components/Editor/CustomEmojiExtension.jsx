import { mergeAttributes, Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
export const EmojiNode = Node.create({
  name: 'emoji',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      emoji: { default: null },
      annotation: { default: null },
      url: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-node="emoji"]',

        getAttrs(node) {
          let attrs = {};

          const annotation = node.getAttribute('data-annotation');
          const emoji = node.getAttribute('data-emoji');
          const url = node.getAttribute('data-url');

          if (annotation && (emoji || url)) {
            attrs = {
              annotation,
              emoji,
              url,
            };
          }

          return attrs;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {

    const { emoji, annotation, ...restHTMLAttributes } = HTMLAttributes;

    return [
      'span',
      mergeAttributes(restHTMLAttributes, {
        class: 'emoji',
        'data-node': 'emoji',
        'data-emoji': node.attrs.emoji,
        'data-annotation': node.attrs.annotation,
        'data-url': node.attrs.url,
        style: `user-select: text; font-family: "Twemoji Mozilla", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", sans-serif;`,
      }),
      node.attrs.emoji,

    ];
  },

  renderText({ node }) {
    return node.attrs.emoji;
  },

  addCommands() {
    return {
      insertEmoji({ annotation, url, emoji }) {
        return ({ editor, chain }) => {
          //   const shouldInsertSpace = shouldInsertSpaceAfterCurrentCursor(editor);

          return chain()
            .insertContent({
              type: 'emoji',
              attrs: {
                annotation,
                url,
                emoji,
              },
            })
            .run();
        };
      },
    };
  },

  // ... inside your EmojiNode.create({ ... })
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('emojiSizing'),
        props: {
          decorations(state) {
            const decorations = [];
            const { doc } = state;

            doc.descendants((node, pos) => {
              if (node.type.name !== 'paragraph') {
                return;
              }

              let emojiCount = 0;
              let hasOtherVisibleContent = false;

              node.forEach(childNode => {
                if (childNode.type.name === 'emoji') {
                  emojiCount++;
                } else if (childNode.isText) {
                  if (childNode.textContent.trim().length > 0) {
                    hasOtherVisibleContent = true;
                  }
                } else {
                  hasOtherVisibleContent = true;
                }
              });

              // V-- THIS IS THE ONLY CHANGE HERE --V
              // If there are one or more emojis and no other text...
              if (emojiCount > 0 && !hasOtherVisibleContent) {
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: 'is-emoji-only',
                  })
                );
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
  // ...
});