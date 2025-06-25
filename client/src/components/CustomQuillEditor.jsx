import React, { useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CustomQuillEditor = React.forwardRef(({ 
  value, 
  onChange, 
  placeholder, 
  modules, 
  formats, 
  theme = "snow",
  style,
  ...props 
}, ref) => {
  const quillRef = useRef(null);

  return (
    <ReactQuill
      ref={ref || quillRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      modules={modules}
      formats={formats}
      theme={theme}
      style={style}
      {...props}
    />
  );
});

CustomQuillEditor.displayName = 'CustomQuillEditor';

export default CustomQuillEditor; 