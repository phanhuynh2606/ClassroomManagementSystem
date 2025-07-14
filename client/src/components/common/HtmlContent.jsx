import React from "react";
import "react-quill/dist/quill.snow.css";

// CSS styles for HTML content (same as StreamItem)
const htmlContentStyles = `
  .html-content * {
    font-family: inherit !important;
  }
  .html-content h1, .html-content h2, .html-content h3 {
    margin: 16px 0 8px 0 !important;
    font-weight: 600 !important;
    color: #262626 !important;
    line-height: 1.4 !important;
  }
  .html-content h1 { font-size: 24px !important; }
  .html-content h2 { font-size: 20px !important; }
  .html-content h3 { font-size: 16px !important; }
  .html-content p {
    margin: 8px 0 !important;
    line-height: 1.6 !important;
    color: inherit !important;
  }
  .html-content strong {
    font-weight: 600 !important;
  }
  .html-content em {
    font-style: italic !important;
  }
  .html-content u {
    text-decoration: underline !important;
  }
  
  /* --- Lists --- */
  .html-content ul, .html-content ol {
    padding-left: 2em !important;
    margin: 8px 0 !important;
  }
  .html-content ul {
    list-style-type: disc !important;
  }
  .html-content ol {
    list-style-type: decimal !important;
  }
  .html-content li {
    margin: 4px 0 !important;
    line-height: 1.6 !important;
  }

  /* --- Code Blocks & Inline Code --- */
  .html-content pre {
    background: #23272e !important;
    color: #f8f8f2 !important;
    font-family: 'Fira Mono', 'Consolas', 'Menlo', 'Monaco', 'monospace' !important;
    font-size: 15px !important;
    padding: 16px !important;
    border-radius: 8px !important;
    margin: 16px 0 !important;
    overflow-x: auto !important;
    white-space: pre !important;
  }
  
  .html-content code:not(pre > code) {
    background: #e7e7e7 !important;
    color: #d63384 !important;
    padding: 2px 5px !important;
    border-radius: 4px !important;
    font-family: 'Fira Mono', 'Consolas', 'Menlo', 'Monaco', 'monospace' !important;
    font-size: 0.9em !important;
  }

  /* ReactQuill specific list handling */
  .html-content li[data-list="bullet"] {
    list-style-type: disc !important;
  }
  
  .html-content li[data-list="ordered"] {
    list-style-type: decimal !important;
  }
  
  .html-content li[data-list="bullet"]:before {
    content: none !important;
  }
  
  .html-content li[data-list="ordered"]:before {
    content: none !important;
  }
  
  .html-content a {
    color: #1890ff !important;
    text-decoration: none !important;
  }
  .html-content a:hover {
    text-decoration: underline !important;
  }
  .html-content blockquote {
    margin: 16px 0 !important;
    padding: 12px 16px !important;
    background: #f6f6f6 !important;
    border-left: 4px solid #d9d9d9 !important;
    font-style: italic !important;
  }
  .html-content .ql-align-center {
    text-align: center !important;
  }
  .html-content .ql-align-right {
    text-align: right !important;
  }
  .html-content .ql-align-justify {
    text-align: justify !important;
  }
  .html-content .ql-indent-1 {
    margin-left: 3em !important;
  }
  .html-content .ql-indent-2 {
    margin-left: 6em !important;
  }
  .html-content .ql-indent-3 {
    margin-left: 9em !important;
  }
  .html-content .ql-font-serif {
    font-family: Georgia, serif !important;
  }
  .html-content .ql-font-monospace {
    font-family: 'Courier New', monospace !important;
  }
  .html-content .ql-size-small {
    font-size: 0.75em !important;
  }
  .html-content .ql-size-large {
    font-size: 1.5em !important;
  }
  .html-content .ql-size-huge {
    font-size: 2.5em !important;
  }
  /* Support for warning/error colors */
  .html-content .ql-color-red {
    color: #e74c3c !important;
  }
  .html-content .ql-color-orange {
    color: #f39c12 !important;
  }
  .html-content .ql-color-yellow {
    color: #f1c40f !important;
  }
  .html-content .ql-color-green {
    color: #27ae60 !important;
  }
  .html-content .ql-color-blue {
    color: #3498db !important;
  }
  .html-content .ql-bg-red {
    background-color: #ffebee !important;
  }
  .html-content .ql-bg-yellow {
    background-color: #fff9c4 !important;
  }
`;

const HtmlContent = ({
  content,
  className = "",
  ellipsis = false,
  maxLines = 2,
}) => {
  const ellipsisStyle = ellipsis
    ? {
        display: "-webkit-box",
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }
    : {};

  return (
    <>
      <style>{htmlContentStyles}</style>
      <div
        className={`html-content ${className}`}
        style={ellipsisStyle}
        dangerouslySetInnerHTML={{ __html: content || "" }}
      />
    </>
  );
};

export default HtmlContent;
