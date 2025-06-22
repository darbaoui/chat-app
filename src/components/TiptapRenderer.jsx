import { PureEditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Renders Tiptap JSON content to React elements
const TiptapRenderer = ({ jsonContent }) => {
  if (!jsonContent || !jsonContent.content) {
    return null;
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: jsonContent,
    editable: false,
    immediatelyRender: false, // This fixes your empty background issue
    shouldRerenderOnTransaction: false,
  });

  return (
    <div className="text-sm leading-relaxed">
      <PureEditorContent editor={editor} />
    </div>
  );
};

export default TiptapRenderer;
