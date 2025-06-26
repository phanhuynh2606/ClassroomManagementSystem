import React, { useState, useRef, useCallback } from 'react';
import { MdFormatClear } from "react-icons/md";
import { Avatar, Button, Tooltip } from 'antd';
import { 
  UserOutlined, 
  BoldOutlined, 
  ItalicOutlined, 
  UnderlineOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  SendOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';

const CommentInput = ({ 
  onSubmit, 
  onCancel,
  loading = false, 
  placeholder = "Add a class comment...",
  autoFocus = false
}) => {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const editorRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  const handleFocus = useCallback(() => {
    setIsExpanded(true);
    setShowToolbar(true);
  }, []);

  const handleBlur = useCallback((e) => {
    // Check if the blur is happening because user clicked outside the entire component
    const currentTarget = e.currentTarget;
    
    setTimeout(() => {
      // If no element within the comment input container has focus, collapse it
      if (!currentTarget.contains(document.activeElement)) {
        if (!hasContent) {
          setIsExpanded(false);
          setShowToolbar(false);
        }
      }
    }, 100);
  }, [hasContent]);

  // Auto focus if specified
  React.useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
      setIsExpanded(true);
      setShowToolbar(true);
    }
  }, [autoFocus]);

  // Force placeholder to show when no content
  React.useEffect(() => {
    if (editorRef.current && !hasContent) {
      const textContent = editorRef.current.textContent || editorRef.current.innerText || '';
      if (textContent.trim() === '' && editorRef.current.innerHTML.trim() !== '') {
        editorRef.current.innerHTML = '';
      }
    }
  }, [hasContent]);

  const handleCancel = useCallback(() => {
    setContent('');
    setHasContent(false);
    setIsExpanded(false);
    setShowToolbar(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      editorRef.current.blur();
    }
    // Call parent cancel handler if provided
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const handleSubmit = useCallback(async () => {
    const textContent = editorRef.current?.textContent?.trim() || content.trim();
    if (!textContent) return;
    
    try {
      await onSubmit(content.trim() || editorRef.current?.innerHTML?.trim());
      setContent('');
      setHasContent(false);
      setIsExpanded(false);
      setShowToolbar(false);
      // Clear the editor content
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        editorRef.current.blur();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  }, [content, onSubmit]);

  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
      return;
    }
    
    // Auto-continue lists when pressing Enter
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const textContent = container.textContent || container.nodeValue || '';
        
        // Get current line content
        const beforeCursor = textContent.substring(0, range.startOffset);
        const lines = beforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        
        // Check if current line starts with numbered list
        const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
        if (numberedMatch) {
          e.preventDefault();
          const indent = numberedMatch[1];
          const currentNumber = parseInt(numberedMatch[2]);
          const nextNumber = currentNumber + 1;
          const nextLine = `<br>${indent}${nextNumber}. `;
          execCommand('insertHTML', nextLine);
          return;
        }
        
        // Check if current line starts with bullet
        const bulletMatch = currentLine.match(/^(\s*)•\s/);
        if (bulletMatch) {
          e.preventDefault();
          const indent = bulletMatch[1];
          const nextLine = `<br>${indent}• `;
          execCommand('insertHTML', nextLine);
          return;
        }
      }
    }
  }, [handleSubmit, execCommand]);

  const handleInput = useCallback((e) => {
    const htmlContent = e.target.innerHTML;
    const textContent = e.target.textContent || e.target.innerText || '';
    
    // Nếu chỉ có thẻ HTML rỗng, xóa sạch để hiện placeholder
    if (textContent.trim() === '' && htmlContent.trim() !== '') {
      e.target.innerHTML = '';
    }
    
    setContent(htmlContent);
    const hasText = textContent.trim().length > 0;
    setHasContent(hasText);
    
    // Nếu không có text và không focus, collapse về trạng thái ban đầu
    if (!hasText && !document.activeElement?.isEqualNode(e.target)) {
      setIsExpanded(false);
      setShowToolbar(false);
    }
  }, []);

  return (
    <div className="comment-input-container">
      <style>{`
        .comment-input-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .comment-input-container {
          border: 1px solid transparent;
          border-radius: 24px;
          // background: #f1f3f4;
          transition: all 0.2s ease;
          position: relative;
          flex: 1;
        }
        .comment-input-container-input {
          border: 1px solid #dadce0;
          border-radius: 24px;
          // background: #f1f3f4;
          transition: all 0.2s ease;
          position: relative;
          flex: 1;
        }
        
        .comment-input-container.expanded {
          border: 1px solid #dadce0;
          background: white;
          box-shadow: 0 1px 6px rgba(32,33,36,.18);
        }
        
        .comment-input-container.expanded:focus-within {
          border-color: #1a73e8;
        }
        
        .comment-editor {
          min-height: 40px;
          max-height: 120px;
          overflow-y: auto;
          padding: 12px 16px;
          outline: none;
          font-size: 14px;
          line-height: 1.5;
          color: #3c4043;
          border: none;
          background: transparent;
        }
        
        .comment-input-container.expanded .comment-editor {
          padding: 12px 16px 4px 16px;
          min-height: 60px;
        }
        
        .comment-editor:empty:before {
          content: attr(data-placeholder);
          color: #5f6368;
          cursor: text;
          pointer-events: none;
        }
        
        .comment-editor:focus:empty:before {
          content: attr(data-placeholder);
          color: #5f6368;
        }
        
        .send-icon {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: #1a73e8;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 14px;
          margin-top: 8px;
        }
        
        .send-icon:hover {
          background: #1557b0;
        }
        
        .send-icon:disabled {
          background: #dadce0;
          color: #9aa0a6;
          cursor: not-allowed;
        }
        
        .comment-toolbar {
          display: flex;
          align-items: center;
          padding: 4px 12px 8px 12px;
          border-top: 1px solid #e8eaed;
          background: transparent;
          margin-top: 4px;
        }
        
        .toolbar-button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          color: #5f6368;
          transition: all 0.1s ease;
        }
        
        .toolbar-button:hover {
          background: #e8f0fe;
          color: #1a73e8;
        }
        
        .toolbar-button.active {
          background: #e8f0fe;
          color: #1a73e8;
        }
        
        .comment-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }
        
        .send-button {
          background: #1a73e8 !important;
          border-color: #1a73e8 !important;
          color: white !important;
          border-radius: 20px !important;
          padding: 4px 16px !important;
          height: auto !important;
          font-weight: 500 !important;
        }
        
        .send-button:hover {
          background: #1557b0 !important;
          border-color: #1557b0 !important;
        }
        
        .send-button:disabled {
          background: #dadce0 !important;
          border-color: #dadce0 !important;
          color: #9aa0a6 !important;
        }
      `}</style>
      
      <div className="flex gap-3">
        <Avatar
          icon={<UserOutlined />}
          src={user?.image}
          size="default"
          className="mt-1"
        />
        
        <div className="flex-1">
          <div 
            className={`${hasContent || isExpanded ? 'comment-input-container-input' : 'comment-input-container-input'} ${isExpanded ? 'expanded' : ''}`}
            onBlur={handleBlur}
          >
            <div
              ref={editorRef}
              className="comment-editor"
              contentEditable
              data-placeholder={placeholder}
              onFocus={handleFocus}
              onInput={handleInput}
              onKeyUp={handleInput}
              onPaste={handleInput}
              onKeyDown={handleKeyPress}
              suppressContentEditableWarning={true}
            />
            
            {showToolbar && (
              <div className="comment-toolbar">
                <Tooltip title="Bold">
                  <button
                    className="toolbar-button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('bold')}
                  >
                    <BoldOutlined />
                  </button>
                </Tooltip>
                
                <Tooltip title="Italic">
                  <button
                    className="toolbar-button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('italic')}
                  >
                    <ItalicOutlined />
                  </button>
                </Tooltip>
                
                <Tooltip title="Underline">
                  <button
                    className="toolbar-button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('underline')}
                  >
                    <UnderlineOutlined />
                  </button>
                </Tooltip>
                
                <Tooltip title="Bulleted list">
                  <button
                    className="toolbar-button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const selection = window.getSelection();
                      if (selection.rangeCount > 0) {
                        const selectedText = selection.toString().trim();
                        if (selectedText) {
                          // Có text được chọn - thêm bullet vào đầu mỗi dòng
                          const lines = selectedText.split('\n');
                          const bulletedText = lines.map(line => line.trim() ? `• ${line}` : line).join('<br>');
                          execCommand('insertHTML', bulletedText);
                        } else {
                          // Không có text được chọn - chỉ thêm bullet
                          execCommand('insertHTML', '• ');
                        }
                      } else {
                        execCommand('insertHTML', '• ');
                      }
                    }}
                  >
                    <UnorderedListOutlined />
                  </button>
                </Tooltip>
                
                <Tooltip title="Numbered list">
                  <button
                    className="toolbar-button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const selection = window.getSelection();
                      if (selection.rangeCount > 0) {
                        const selectedText = selection.toString().trim();
                        if (selectedText) {
                          // Có text được chọn - thêm số vào đầu mỗi dòng
                          const lines = selectedText.split('\n');
                          let counter = 1;
                          const numberedText = lines.map(line => line.trim() ? `${counter++}. ${line}` : line).join('<br>');
                          execCommand('insertHTML', numberedText);
                        } else {
                          // Không có text được chọn - chỉ thêm số
                          execCommand('insertHTML', '1. ');
                        }
                      } else {
                        execCommand('insertHTML', '1. ');
                      }
                    }}
                  >
                    <OrderedListOutlined />
                  </button>
                </Tooltip>
                
                <Tooltip title="Remove formatting">
                  <button
                    className="toolbar-button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('removeFormat')}
                  >
                    <MdFormatClear style={{fontSize: '15px',color: '#5f6368'}}/>
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
        
        {/* Send button ở ngoài như Google Classroom */}
        <button
          className="send-icon"
          onClick={handleSubmit}
          disabled={!hasContent}
          title="Send"
        >
          <SendOutlined color='white' style={{fontSize: '15px',marginLeft: '5px'}}/>
        </button>
      </div>
    </div>
  );
};

export default CommentInput; 