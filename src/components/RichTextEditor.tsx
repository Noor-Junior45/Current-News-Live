import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

/**
 * RichTextEditor wraps react-quill-new and configures modules and formats
 * to specifically restrict styles, cleaning up dirty tags and classes 
 * pasted from Microsoft Word to preserve only headings, bold, italic, and lists.
 */
export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  
  // Strict formats list to filter out MS Word junk attributes like font families, inline line-heights, custom font-sizes and backgrounds.
  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
  ];

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean'] // Allows easily clear format
    ],
    clipboard: {
      matchVisual: false, // Prevents inserting extraneous inline styles on paste
    }
  };

  return (
    <div className="w-full" id="quill-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Compose your news post story here..."}
      />
      <div className="flex justify-between items-center px-2 py-1 bg-slate-50 border-x border-b border-slate-200 text-[10px] text-slate-400 font-mono rounded-b-lg">
        <span>Microsoft Word Clean Engine Active</span>
        <span>HTML output format</span>
      </div>
    </div>
  );
}
