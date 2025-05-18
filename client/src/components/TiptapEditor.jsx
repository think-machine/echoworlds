import React from 'react';
import { useEditor, EditorContent, FloatingMenu, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
  BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CodeIcon, ListIcon, ListOrderedIcon, QuoteIcon, LinkIcon, UndoIcon, RedoIcon
} from 'lucide-react'; // Using lucide-react for icons

// Basic Toolbar Component
const TiptapToolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const iconSize = 18; // Consistent icon size

  return (
    <div className="flex flex-wrap gap-1 p-2 border border-gray-300 dark:border-gray-600 rounded-t-md bg-gray-50 dark:bg-gray-700">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('bold') ? 'is-active bg-gray-200 dark:bg-gray-600' : ''}`}
        title="Bold"
      >
        <BoldIcon size={iconSize} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('italic') ? 'is-active bg-gray-200 dark:bg-gray-600' : ''}`}
        title="Italic"
      >
        <ItalicIcon size={iconSize} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('underline') ? 'is-active bg-gray-200 dark:bg-gray-600' : ''}`}
        title="Underline"
      >
        <UnderlineIcon size={iconSize} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('strike') ? 'is-active bg-gray-200 dark:bg-gray-600' : ''}`}
        title="Strikethrough"
      >
        <StrikethroughIcon size={iconSize} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('code') ? 'is-active bg-gray-200 dark:bg-gray-600' : ''}`}
        title="Code"
      >
        <CodeIcon size={iconSize} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('bulletList') ? 'is-active bg-gray-200 dark:bg-gray-600' : ''}`}
        title="Bullet List"
      >
        <ListIcon size={iconSize} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('orderedList') ? 'is-active bg-gray-200 dark:bg-gray-600' : ''}`}
        title="Ordered List"
      >
        <ListOrderedIcon size={iconSize} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('blockquote') ? 'is-active bg-gray-200 dark:bg-gray-600' : ''}`}
        title="Blockquote"
      >
        <QuoteIcon size={iconSize} />
      </button>
       <button
        onClick={() => {
          const previousUrl = editor.getAttributes('link').href;
          const url = window.prompt('URL', previousUrl);
          if (url === null) return; // Cancelled
          if (url === '') { // Unset link
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('link') ? 'is-active bg-gray-200 dark:bg-gray-600' : ''}`}
        title="Set Link"
      >
        <LinkIcon size={iconSize} />
      </button>
      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Undo">
        <UndoIcon size={iconSize} />
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Redo">
        <RedoIcon size={iconSize} />
      </button>
    </div>
  );
};


const TiptapEditor = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure StarterKit options if needed
        // For example, to disable some default extensions:
        // heading: { levels: [1, 2, 3] },
        // history: true, // Already enabled by default
      }),
      Underline, // Add Underline extension
      Link.configure({ // Configure Link extension
        openOnClick: false, // Don't open link on click in editor
        autolink: true,     // Autolink URLs
        // linkOnPaste: true, // Link on paste (can be annoying sometimes)
      }),
      // TODO: Add @mention extension here later
    ],
    content: content || '', // Initial content for the editor
    editorProps: {
      attributes: {
        // Apply Tailwind classes for styling the editor content area
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none min-h-[150px] p-3 border border-gray-300 dark:border-gray-600 rounded-b-md',
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(updatedEditor.getHTML()); // Pass HTML content back to parent
    },
  });

  return (
    <div className="text-gray-900 dark:text-white dark:bg-gray-700 rounded-md shadow-sm">
      <TiptapToolbar editor={editor} />
      {/* Placeholder for FloatingMenu or BubbleMenu if desired
      {editor && (
        <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
          // Menu content
        </FloatingMenu>
      )}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          // Menu content
        </BubbleMenu>
      )}
      */}
      <EditorContent editor={editor} placeholder={placeholder || "Write something amazing..."} />
    </div>
  );
};

export default TiptapEditor;
