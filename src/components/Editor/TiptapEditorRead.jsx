import { PureEditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

// Renders Tiptap JSON content to React elements
const TiptapEditorRead =({ jsonContent, className }) => {
  if (!jsonContent || !jsonContent.content) {
    return null;
  }

   const editor = useEditor(
    {
      extensions: [StarterKit],
      content: jsonContent,
      editable: false,
      immediatelyRender: false, // This helps prevent hydration errors in SSR environments like Next.js
      shouldRerenderOnTransaction: false,
    },
    [jsonContent],
  );

  return (
    <div className={cn('text-[12px] leading-relaxed', className)}>
      <PureEditorContent editor={editor} />
    </div>
  );
};

TiptapEditorRead.displayName = 'TiptapEditorRead';

TiptapEditorRead.propTypes = {
  jsonContent: PropTypes.object,
  className: PropTypes.string,
};

export default memo(TiptapEditorRead);
