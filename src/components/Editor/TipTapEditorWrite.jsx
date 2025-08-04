import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import Document from '@tiptap/extension-document';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import Mention from '@tiptap/extension-mention';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Strike from '@tiptap/extension-strike';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Text from '@tiptap/extension-text';
import Underline from '@tiptap/extension-underline';
import { BubbleMenu, EditorContent, isNodeSelection, PureEditorContent, useEditor } from '@tiptap/react';
import mentionHandler from './suggestion';
import { forwardRef, use, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { EmojiNode } from './CustomEmojiExtension';
import { cn } from '@/lib/utils';
import MenuBar from './MenuBar';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';


const TiptapEditorWrite = forwardRef(({ users, editable, placeholder, onChange, emojiToAdd, setEmojiToAdd, jsonContent = null, setEditorFocus = true, setNoText, className }, ref) => {


    const [isLink, setIsLink] = useState(false);
    const [inputLink, setInputLink] = useState('');
    const canUpdateStateAndContentCursor = useRef(true);


    useImperativeHandle(ref, () => ({
        setContent,
    }));

    const getCleanedJSON = (json) => {
        if (!json?.content) {
            return json;
        }

        const newJson = JSON.parse(JSON.stringify(json));

        newJson.content = newJson.content.map(pNode => {
            if (pNode.type !== 'paragraph' || !pNode.content) {
                return pNode;
            }

            const visibleNodes = pNode.content.filter(child => {
                if (child.type === 'text' && child.text.trim().length === 0) {
                    return false;
                }
                return true;
            });

            // V-- THIS LOGIC IS UPDATED --V
            // Check if there's at least one visible node AND if every visible node is an emoji.
            const allVisibleAreEmojis = visibleNodes.length > 0 && visibleNodes.every(node => node.type === 'emoji');

            if (allVisibleAreEmojis) {
                // Rebuild the paragraph's content with ALL the visible emoji nodes.
                pNode.content = visibleNodes;
            }

            return pNode;
        });

        return newJson;
    };

    const editor = useEditor(
        {
            extensions: [Document,
                Text,
                Strike,
                EmojiNode,
                // CustomImage.configure({
                //     allowBase64: true,
                //     // HTMLAttributes: {
                //     //   class: 'block-node',
                //     // },
                // }),
                Blockquote.configure({
                    HTMLAttributes: {
                        class: 'block-node',
                    },
                }),
                Link.configure({
                    protocols: ['https', 'ftp', 'mailto'],
                    openOnClick: true,
                    HTMLAttributes: {
                        class: 'cursor-pointer underline',
                    },
                }),
                Mention.configure({
                    renderHTML({ options, node }) {
                        // return `${options.suggestion.char}${node.attrs.name ?? node.attrs.id}`
                        return `${options.suggestion.char} ${node.attrs.id.name}`;
                    },
                    HTMLAttributes: {
                        class: 'mention',
                    },
                    suggestion: mentionHandler(users),
                }),
                Paragraph.configure({
                    HTMLAttributes: {
                        class: 'text-node',
                    },
                }),
                TaskList.configure({
                    HTMLAttributes: {
                        class: 'list-node',
                    },
                }),
                TaskItem.configure({
                    HTMLAttributes: {
                        class: 'todo_content',
                    },
                    nested: true,
                }),
                CodeBlock.configure({
                    HTMLAttributes: {
                        class: 'block-code',
                    },
                }),
                BulletList.configure({
                    HTMLAttributes: {
                        class: 'list-disc',
                    },
                }),
                OrderedList.configure({
                    HTMLAttributes: {
                        class: 'list-decimal',
                    },
                }),
                ListItem,
                Underline.configure({
                    HTMLAttributes: {
                        class: 'underline-offset-1',
                    },
                }),
                Italic.configure({
                    HTMLAttributes: {
                        class: 'italic',
                    },
                }),
                Bold.configure({
                    HTMLAttributes: {
                        class: 'font-bold',
                    },
                }),
                Code.configure({
                    HTMLAttributes: {
                        class: 'inline',
                    },
                }),
                Placeholder.configure({
                    placeholder,
                    showOnlyWhenEditable: true,
                }),
            ],
            editable,
            editorProps: {
                /**
                 * This function is called when plain text is pasted.
                 * @param {string} text The pasted text.
                 * @returns {string} The modified text to be inserted.
                 */
                transformPastedText(text) {
                    // Replace all newline characters (\n) with a space
                    // The 'g' flag ensures all occurrences are replaced, not just the first one.
                    return text.replace(/\n/g, ' ');
                },
            },
            onUpdate: ({ editor }) => {
                if (editor.isEmpty) {
                    setNoText(true);
                    onChange(null);
                } else {
                    setNoText(false);
                    const rawJSON = editor.getJSON();
                    const cleanedJSON = getCleanedJSON(rawJSON);
                    onChange(cleanedJSON);
                }
            },
            content: jsonContent,
            immediatelyRender: false,
        },
    );

    useEffect(() => {
        if (!editor) return
        if (jsonContent && canUpdateStateAndContentCursor.current) {
            canUpdateStateAndContentCursor.current = false;
            setNoText(false);
            editor.chain().focus('end').run();
        }
    }, [editor, jsonContent, canUpdateStateAndContentCursor])



    const setContent = (content) => {
        editor.commands.setContent(content);
    };

    useEffect(() => {
        if (!editor) return;
        const emojiUrl = emojiToAdd?.emoji;
        if (emojiUrl) {

            editor
                .chain()
                .focus()
                .insertEmoji({
                    emoji: emojiUrl,
                    annotation: emojiUrl,
                    // url: 'https://zamma.com',
                })
                .run();
            setEmojiToAdd(null);
        }
    }, [editor, setEmojiToAdd, emojiToAdd])

    useEffect(() => {
        if (!editor) return;
        editor.commands.focus();
    }, [editor, setEditorFocus])


    const HiddenBubbleMenu = () => {
        setIsLink(false);
        setInputLink('');
    };

    const setLink = () => {
        setIsLink(true);
    };

    const addHttpsIfNeeded = (value) => {
        if (!value) return null;

        // Check if the URL already has any protocol
        if (/^[a-z][a-z0-9+.-]*:/.test(value)) {
            return value;
        }

        // Basic check for a domain-like structure to prepend https
        if (value.includes('.') && !value.includes(' ')) {
            return 'https://' + value;
        }

        return null;
    };


    const addLink = () => {
        const url = addHttpsIfNeeded(inputLink);
        if (url === null) {
            return;
        }
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();

            return;
        }

        // update link
        editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: url })
            .run();

        setIsLink(false);
        setInputLink('');
    };

    return (
        <div className={cn('text-[12px] leading-relaxed', className)}>
            {editor && (
                <BubbleMenu
                    onClickOutside={() => HiddenBubbleMenu()}
                    editor={editor}
                    tippyOptions={{ duration: 100, onHidden: HiddenBubbleMenu }}
                >
                    {!isLink ? (
                        <MenuBar editor={editor} setLink={setLink} />
                    ) : (
                        <div className="flex items-center justify-center w-full shadow  gap-1 py-1.5 px-2 bg-background border rounded-lg">
                            <Input
                                className="border-none shadow-none h-7"
                                onChange={(event) => setInputLink(event.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        addLink();
                                    }
                                }}
                                placeholder="Enter link URL"
                            />
                            <Separator className="h-7" orientation="vertical" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => HiddenBubbleMenu()}
                            >
                                <Trash className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}
                </BubbleMenu>
            )}
            <EditorContent editor={editor} />
        </div>
    );
});

export default TiptapEditorWrite