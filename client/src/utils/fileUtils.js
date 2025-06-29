// File utility functions

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