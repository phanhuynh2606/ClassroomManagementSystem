// File utility functions

import { fixVietnameseEncoding } from "./convertStr";
import { message } from "antd";
import axiosClient from "../services/axiosClient";
import * as XLSX from 'xlsx';

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

    // / ✅ FIX: Get the actual blob from response.data
    let blob;
    
    // Handle different response formats
    if (response instanceof Blob) {
      // If axiosClient is configured to return data directly
      blob = response;
    } else if (response.data instanceof Blob) {
      // Standard axios response format
      blob = response.data;
    } else if (response.data) {
      // Fallback: try to create blob from response data
      blob = new Blob([response.data]);
    } else {
      throw new Error('Invalid response format - no blob data received');
    }

    // Validate that we have a valid blob
    if (!(blob instanceof Blob)) {
      console.error('Invalid blob object:', blob);
      throw new Error('Failed to create blob from response');
    }
    
    console.log('✅ Blob created successfully:', {
      size: blob.size,
      type: blob.type,
      fileName: fixedFileName
    });
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

/**
 * Export assignment analytics data to Excel file
 * @param {Object} analyticsData - Analytics data object
 * @param {Object} assignment - Assignment object (for title, totalPoints, etc.)
 * @param {Array} submissions - Array of submissions (for top performers, etc.)
 * @param {string} fileName - File name for export (default: 'Assignment-Analytics.xlsx')
 */
export const exportAnalyticsToExcel = (analyticsData, assignment, submissions, fileName = 'Assignment-Analytics.xlsx') => {
  if (!analyticsData) {
    message.error('Không có dữ liệu để xuất báo cáo!');
    return;
  }
  try {
    // 1. Overview sheet
    const overviewSheet = [
      ['Assignment Title', assignment?.title || ''],
      ['Total Points', assignment?.totalPoints || ''],
      ['Total Students', analyticsData.overview?.totalStudents || ''],
      ['Submitted', analyticsData.overview?.submittedCount || ''],
      ['Graded', analyticsData.overview?.gradedCount || ''],
      ['Late Submissions', analyticsData.overview?.lateCount || ''],
      ['Average Grade', analyticsData.overview?.avgGrade || ''],
      ['Median Grade', analyticsData.overview?.medianGrade || ''],
      ['Highest Grade', analyticsData.overview?.highestGrade || ''],
      ['Lowest Grade', analyticsData.overview?.lowestGrade || ''],
      ['Passing Rate (%)', analyticsData.overview?.passingRate || ''],
    ];

    // 2. Grade Distribution sheet
    const gradeDistSheet = [
      ['Grade Range', 'Count', 'Percentage'],
      ...(analyticsData.gradeDistribution || []).map(g => [g.label, g.count, Math.round(g.percentage * 10) / 10])
    ];

    // 3. Top Performers sheet
    const topPerformers = (submissions || [])
      .filter(s => s && s.grade !== null && s.grade !== undefined && !isNaN(s.grade))
      .sort((a, b) => (Number(b.grade) || 0) - (Number(a.grade) || 0))
      .slice(0, 10)
      .map((s, idx) => [
        idx + 1,
        s.student?.fullName || 'Unknown',
        s.student?.email || '',
        s.grade,
        Math.round(((Number(s.grade) || 0) / (assignment?.totalPoints || 100)) * 100) + '%',
        s.status,
        s.submittedAt ? new Date(s.submittedAt).toLocaleString() : ''
      ]);
    const topPerformersSheet = [
      ['Rank', 'Student Name', 'Email', 'Grade', 'Percentage', 'Status', 'Submitted At'],
      ...topPerformers
    ];

    // 4. Submission Timeline sheet
    const timelineSheet = [
      ['Date', 'Hour', 'Is Late', 'Grade'],
      ...((analyticsData.submissionTimeline || []).map(item => [
        item.date,
        item.hour,
        item.isLate ? 'Yes' : 'No',
        item.grade
      ]))
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: assignment?.title || 'Assignment Analytics',
      Subject: 'Assignment Analytics',
      Author: 'LMS Export',
      CreatedDate: new Date()
    };
    wb.SheetNames = ['Overview', 'Grade Distribution', 'Top Performers', 'Timeline'];
    wb.Sheets = {
      'Overview': XLSX.utils.aoa_to_sheet(overviewSheet),
      'Grade Distribution': XLSX.utils.aoa_to_sheet(gradeDistSheet),
      'Top Performers': XLSX.utils.aoa_to_sheet(topPerformersSheet),
      'Timeline': XLSX.utils.aoa_to_sheet(timelineSheet)
    };

    // Export to file
    XLSX.writeFile(wb, fixVietnameseEncoding(fileName));
    message.success('Xuất báo cáo thành công!');
  } catch (err) {
    console.error('Export analytics to Excel failed:', err);
    message.error('Xuất báo cáo thất bại!');
  }
}; 

/**
 * Export assignment grades to Excel file
 * @param {Array} submissions - Array of submission objects
 * @param {Object} assignment - Assignment object (for title, totalPoints, etc.)
 * @param {string} fileName - File name for export (default: 'Assignment-Grades.xlsx')
 */
export const exportGradesToExcel = (submissions, assignment, fileName = 'Assignment-Grades.xlsx') => {
  if (!Array.isArray(submissions) || submissions.length === 0) {
    message.error('Không có dữ liệu điểm để xuất!');
    return;
  }
  try {
    const maxGrade = assignment?.totalPoints || 100;
    const sheetData = [
      ['STT', 'Tên học sinh', 'Email', 'Điểm', 'Tỉ lệ (%)', 'Trạng thái', 'Nộp lúc', 'Ghi chú/Feedback'],
      ...submissions.map((s, idx) => [
        idx + 1,
        s.student?.fullName || s.student?.name || 'Unknown',
        s.student?.email || '',
        s.grade !== null && s.grade !== undefined ? s.grade : '',
        s.grade !== null && s.grade !== undefined ? Math.round(((Number(s.grade) || 0) / maxGrade) * 100) + '%' : '',
        s.status === 'graded' ? 'Đã chấm' : s.status === 'missing' ? 'Chưa nộp' : 'Chưa chấm',
        s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "",
        s.feedback || ''
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Grades');
    XLSX.writeFile(wb, fixVietnameseEncoding(fileName));
    message.success('Xuất file điểm thành công!');
  } catch (err) {
    console.error('Export grades to Excel failed:', err);
    message.error('Xuất file điểm thất bại!');
  }
}; 