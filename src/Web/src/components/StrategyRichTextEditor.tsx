import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect, useRef, useState } from 'react';

const ToolbarIcon = ({ path }: { path: string }) => (
  <svg
    viewBox="0 0 16 16"
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d={path} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
};

export const StrategyRichTextEditor = ({ value, onChange, placeholder, onImageUpload }: Props) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'min-h-32 rounded-b-md border border-t-0 border-slate-300 px-3 py-2 text-sm focus:outline-none',
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(updatedEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = editor.getHTML();
    const incoming = value || '<p></p>';
    if (current !== incoming) {
      editor.commands.setContent(incoming, false);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImageUpload) {
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await onImageUpload(file);
      editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-t-md border border-slate-300 bg-slate-50 px-2 py-2">
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
          title="Bold"
        >
          <ToolbarIcon path="M4 2.5h4.2a2.3 2.3 0 0 1 0 4.6H4z M4 7.1h4.8a2.5 2.5 0 0 1 0 5H4z" />
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
          title="Italic"
        >
          <ToolbarIcon path="M10.5 2.5h-4 M9.5 2.5l-3 11 M9.5 13.5h-4" />
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
          title="Bullet list"
        >
          <ToolbarIcon path="M3.2 4.5h.1 M5.5 4.5h7 M3.2 8h.1 M5.5 8h7 M3.2 11.5h.1 M5.5 11.5h7" />
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
          onClick={() => editor.chain().focus().setParagraph().run()}
          aria-label="Paragraph"
          title="Paragraph"
        >
          <ToolbarIcon path="M4 2.5h5.2a2.6 2.6 0 0 1 0 5.2H6.6v5.8 M8.8 7.7v5.8" />
        </button>
        {onImageUpload ? (
          <>
            <button
              type="button"
              className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-50"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              aria-label={uploadingImage ? 'Uploading image' : 'Insert image'}
              title={uploadingImage ? 'Uploading image' : 'Insert image'}
            >
              {uploadingImage ? (
                <span className="text-[10px]">...</span>
              ) : (
                <ToolbarIcon path="M2.5 3.5h11v9h-11z M4.5 10l2.2-2.3 1.8 1.9 2.1-2.4 1.4 1.6 M6 6a.7.7 0 1 0 0 .01" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                void handleImageUpload(e);
              }}
            />
          </>
        ) : null}
      </div>
      <EditorContent editor={editor} />
      {placeholder ? <p className="mt-1 text-xs text-slate-500">{placeholder}</p> : null}
    </div>
  );
};
