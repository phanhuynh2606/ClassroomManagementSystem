import React, { useCallback } from 'react';
import {
  Button,
} from 'antd';
import {
  DeleteOutlined,
  PaperClipOutlined,
  LinkOutlined,
} from '@ant-design/icons';

const AttachmentList = ({
  attachments = [],
  onRemoveAttachment,
}) => {
  const handleRemoveAttachment = useCallback((attachmentId) => {
    if (onRemoveAttachment) {
      onRemoveAttachment(attachmentId);
    }
  }, [onRemoveAttachment]);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div 
            key={attachment.id}
            className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            {attachment.type === "video/youtube" ? (
              <>
                {/* YouTube Video Thumbnail */}
                <div className="relative w-16 h-12 bg-black rounded overflow-hidden flex-shrink-0">
                  <img
                    src={attachment.thumbnail}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0.5 right-0.5 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded leading-none">
                    {attachment.duration}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[3px] border-l-white border-t-[2px] border-t-transparent border-b-[2px] border-b-transparent ml-0.5"></div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {attachment.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    YouTube video • {attachment.duration}
                    {attachment.viewCount && ` • ${attachment.viewCount} views`}
                    {attachment.uploadedByUser && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Uploaded
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : attachment.type === "link" ? (
              <>
                {/* Link Thumbnail - Simple favicon style */}
                <div className="w-16 h-12 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <LinkOutlined className="text-white text-sm" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {attachment.title || "Just a moment..."}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {attachment.url}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* File Icon */}
                <div className="w-16 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                  <div className="text-center">
                    <PaperClipOutlined className="text-white text-lg" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {attachment.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {attachment.size}
                  </div>
                </div>
              </>
            )}
            
            {/* Delete button */}
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveAttachment(attachment.id)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
              title="Remove attachment"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentList; 