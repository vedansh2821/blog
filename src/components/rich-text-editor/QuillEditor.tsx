
'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'quill/dist/quill.snow.css'; // Import Quill styles
import type { ReactQuillProps } from 'react-quill';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface QuillEditorProps extends ReactQuillProps {
  forwardedRef?: React.Ref<any>;
  // Add any other custom props you might need
}

const QuillEditor: React.FC<QuillEditorProps> = ({ forwardedRef, ...props }) => {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, false] }], // Heading dropdown
      ['bold', 'italic', 'underline', 'link'],        // Basic formatting + link
      [{'list': 'ordered'}, {'list': 'bullet'}], // Lists
      [{ 'align': [] }],                         // Alignment
      // ['image'], // Optional: Image button (requires custom handler or base64)
      ['clean']                                  // Remove formatting button
    ],
    // Optional: Image handler configuration (if using images)
    // imageHandler: { ... }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'link',
    'list', 'bullet',
    'align',
    // 'image' // Include if using images
  ];

  return (
    <ReactQuill
      ref={forwardedRef}
      theme="snow"
      modules={modules}
      formats={formats}
      {...props}
    />
  );
};

export default QuillEditor;
