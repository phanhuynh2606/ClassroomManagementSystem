// File utility functions

import { fixVietnameseEncoding } from "./convertStr";
import { message } from "antd";
import axiosClient from "../services/axiosClient";

/**
 * Format file size to human readable format
 * @param {number|string} size - File size in bytes (can be fileSize or size field)
 * @param {Object} file - File object that might have fileSize or size field
 * @returns {string} Formatted size string
 */
export const formatFileSize = (size, file = null) => {
  // Try different ways to get the size
  let sizeInBytes;
  
  if (typeof size === 'number') {
    sizeInBytes = size;
  } else if (file) {
    sizeInBytes = file.fileSize || file.size;
  } else {
    return 'Unknown size';
  }

  if (!sizeInBytes || isNaN(sizeInBytes)) {
    return 'Unknown size';
  }

  const bytes = Number(sizeInBytes);
  
  // Convert bytes to appropriate unit
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 * @param {string} filename 
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Get file icon based on file type
 * @param {string} filename
 * @param {string} fileType 
 * @returns {string} Icon class or emoji
 */
export const getFileIcon = (filename, fileType) => {
  const ext = getFileExtension(filename);
  
  // Document types
  if (['pdf'].includes(ext)) return '📄';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
  if (['ppt', 'pptx'].includes(ext)) return '📰';
  
  // Archive types
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️';
  
  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return '🖼️';
  
  // Video types
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) return '🎬';
  
  // Audio types
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return '🎵';
  
  // Text types
  if (['txt', 'md', 'rtf'].includes(ext)) return '📄';
  
  // Code types
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml'].includes(ext)) return '💻';
  
  return '📎'; // Default file icon
};

/**
 * Check if file size is within limit
 * @param {File|Object} file - File object
 * @param {number} limitMB - Size limit in MB
 * @returns {boolean} True if within limit
 */
export const isFileSizeValid = (file, limitMB) => {
  const sizeInBytes = file.fileSize || file.size;
  if (!sizeInBytes) return false;
  
  const limitInBytes = limitMB * 1024 * 1024;
  return sizeInBytes <= limitInBytes;
};

/**
 * Check if file type is allowed
 * @param {File|Object} file - File object
 * @param {string[]} allowedTypes - Array of allowed file extensions
 * @returns {boolean} True if allowed
 */
export const isFileTypeAllowed = (file, allowedTypes) => {
  if (!allowedTypes || allowedTypes.length === 0) return true;
  
  const filename = file.name || file.originalname;
  const ext = getFileExtension(filename);
  
  return allowedTypes.includes(ext);
};

// Get browser info for download support
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = "Unknown";
  let isModernBrowser = true;

  if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Chrome";
  } else if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Firefox";
  } else if (userAgent.indexOf("Safari") > -1) {
    browserName = "Safari";
  } else if (userAgent.indexOf("Edge") > -1) {
    browserName = "Edge";
  } else if (userAgent.indexOf("Opera") > -1) {
    browserName = "Opera";
  } else {
    isModernBrowser = false;
  }

  return { browserName, isModernBrowser };
};

// Universal secure file download function that works for all contexts
export const handleSecureDownload = async (options) => {
  const {
    downloadUrl,           // Secure download URL (preferred)
    fallbackUrl,          // Direct URL (fallback)
    fileName,             // File name for download
    type = 'file',        // Type: 'stream', 'assignment', 'submission', 'file'
    context = {},         // Additional context: { assignmentId, submissionId, streamId, attachmentIndex }
    onProgress,           // Progress callback (optional)
    onSuccess,            // Success callback (optional)
    onError               // Error callback (optional)
  } = options;

  // Validate required parameters
  if (!fileName) {
    const error = new Error('File name is required for download');
    onError?.(error);
    throw error;
  }


  const fixedFileName = fixVietnameseEncoding(fileName);
  const hideLoading = onProgress?.('start') || 
    message.loading(`Downloading ${fixedFileName}...`, 0);

  try {
    let finalDownloadUrl = downloadUrl;

    // If no downloadUrl provided, construct one based on type and context
    if (!finalDownloadUrl && type && context) {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      
      switch (type) {
        case 'stream':
          if (context.streamId !== undefined && context.attachmentIndex !== undefined) {
            finalDownloadUrl = `${serverUrl}/api/files/stream/${context.streamId}/attachment/${context.attachmentIndex}`;
          }
          break;
        case 'assignment':
          if (context.assignmentId !== undefined && context.attachmentIndex !== undefined) {
            finalDownloadUrl = `${serverUrl}/api/files/assignment/${context.assignmentId}/attachment/${context.attachmentIndex}`;
          }
          break;
        case 'submission':
          if (context.assignmentId !== undefined && context.submissionId !== undefined && context.attachmentIndex !== undefined) {
            finalDownloadUrl = `${serverUrl}/api/files/submission/${context.assignmentId}/${context.submissionId}/${context.attachmentIndex}`;
          }
          break;
        default:
          // For generic files, use the fallbackUrl
          finalDownloadUrl = fallbackUrl;
          break;
      }
    }

    // Use fallbackUrl if still no finalDownloadUrl
    if (!finalDownloadUrl) {
      finalDownloadUrl = fallbackUrl;
    }

    if (!finalDownloadUrl) {
      throw new Error('No download URL available');
    }

      onProgress?.('downloading');
    console.log("finalDownloadUrl", finalDownloadUrl);
    
    // Extract only the path part if finalDownloadUrl is a full URL
    let requestPath = finalDownloadUrl;
    if (finalDownloadUrl.startsWith('http')) {
      try {
        const url = new URL(finalDownloadUrl);
        requestPath = url.pathname; // Just the path part: /api/files/stream/xxx/attachment/0
        
        // Remove /api prefix since axiosClient already has /api in baseURL
        if (requestPath.startsWith('/api')) {
          requestPath = requestPath.substring(4); // Remove '/api' -> /files/stream/xxx/attachment/0
        }
      } catch (error) {
        console.warn('Failed to parse URL, using as-is:', error);
      }
    }
    
    console.log("requestPath", requestPath);
    
    // Use axiosClient with just the path to avoid double baseURL
    const response = await axiosClient.get(requestPath, {
      responseType: 'blob', // Important for file downloads
      headers: {
        'Accept': '*/*',
      }
    });

    onProgress?.('processing');

    // axiosClient returns response.data directly, which is the blob
    const blob = response;
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fixedFileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 100);

    const successMessage = `Download started: ${fixedFileName}`;
    onSuccess?.(successMessage);
    
    message.success(successMessage);

    return true;

  } catch (error) {
    console.error('Download failed:', error);
    const errorMessage = error.message || 'Download failed. Please try again.';
    onError?.(error);
    
    message.error(errorMessage);
    
    throw error;
  } finally {
    hideLoading?.();
    onProgress?.('complete');
  }
};

// Convenience functions for specific download types
export const downloadStreamAttachment = async (streamId, attachmentIndex, fileName, attachment = {}) => {
  return handleSecureDownload({
    downloadUrl: attachment.downloadUrl,
    fallbackUrl: attachment.url,
    fileName,
    type: 'stream',
    context: { streamId, attachmentIndex }
  });
};

export const downloadAssignmentAttachment = async (assignmentId, attachmentIndex, fileName, attachment = {}) => {
  return handleSecureDownload({
    downloadUrl: attachment.downloadUrl,
    fallbackUrl: attachment.url,
    fileName,
    type: 'assignment',
    context: { assignmentId, attachmentIndex }
  });
};

export const downloadSubmissionAttachment = async (assignmentId, submissionId, attachmentIndex, fileName, attachment = {}) => {
  return handleSecureDownload({
    downloadUrl: attachment.downloadUrl,
    fallbackUrl: attachment.url,
    fileName,
    type: 'submission',
    context: { assignmentId, submissionId, attachmentIndex }
  });
};

export const downloadGenericFile = async (file) => {
  return handleSecureDownload({
    downloadUrl: file.downloadUrl,
    fallbackUrl: file.url || file.previewUrl,
    fileName: file.name,
    type: 'file'
  });
}; 