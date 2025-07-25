import React, { useState, useCallback } from 'react';
import {
  Modal, 
  Button, 
  Space, 
  Image, 
  Typography,
  message,
  Tooltip,
  Spin,
  Table
} from 'antd';
import {
  DownloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  PictureOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { downloadGenericFile } from '../../../utils/fileUtils';
import { useSelector } from 'react-redux';
import { fixVietnameseEncoding } from '../../../utils/convertStr';
// Import react-doc-viewer
import DocViewer, { DocViewerRenderers } from 'react-doc-viewer';
import axiosClient from '../../../services/axiosClient';
const { Text } = Typography;

const FileViewer = ({ 
  visible, 
  onCancel, 
  file, 
  title,
  showAnnotations = true 
}) => {
  // All hooks must be at the top in consistent order
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewerError, setViewerError] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadingBlob, setLoadingBlob] = useState(false);

  // Add user selector for secure downloads
  const { token } = useSelector((state) => state.auth);

  // Check if file is secure (needs authentication)
  const isSecureFile = useCallback(() => {
    if (!file) return false;
    const fileUrl = file.url || file.previewUrl || file.downloadUrl;
    return token && (
      fileUrl?.includes('/api/files/') || 
      file.downloadUrl || 
      fileUrl?.includes('downloadUrl')
    );
  }, [file, token]);

  // Reset error when file changes (hook must be before early returns)
  React.useEffect(() => {
    if (file) {
      setViewerError(false);
      setBlobUrl(null);
    }
  }, [file]);

  // Create blob URL for secure files that need preview (PDF, images)
  React.useEffect(() => {
    if (!file || !visible || !isSecureFile()) return;
    
    // Only create blob URLs for files that need visual preview
    if (!isPDF() && !isImage()) return;
    
    setLoadingBlob(true);
    const fileUrl = file.url || file.previewUrl || file.downloadUrl;
    
    axiosClient.get(fileUrl, { responseType: 'blob' })
    .then(response => {
      // Nếu response là full object (do interceptor), lấy response.data
      const blob = response.data || response;
      const url = window.URL.createObjectURL(blob);
      setBlobUrl(url);
      setLoadingBlob(false);
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch file for preview');
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      setBlobUrl(url);
      setLoadingBlob(false);
    })
    .catch(error => {
      console.error('Error creating blob URL for preview:', error);
      setLoadingBlob(false);
    });

    // Cleanup blob URL when component unmounts or file changes
    return () => {
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file, visible, token, isSecureFile]);

  // Load text content for text files, CSV files, and JSON files
  React.useEffect(() => {
    if (file && visible && (isTextFile() || isCSVFile() || isJSONFile())) {
      setLoadingText(true);
      setTextContent('');
      
      // Use downloadUrl as fallback for secure files
      const fileUrl = file.url || file.previewUrl || file.downloadUrl;
      const fetchOptions = {
        method: 'GET',
        headers: {
          'Accept': 'text/plain,*/*'
        }
      };

      // Add authorization header if token is available and URL looks like a secure endpoint
      if (token && (fileUrl.includes('/api/files/') || fileUrl.includes('downloadUrl'))) {
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
      } else {
        fetchOptions.credentials = 'include';
      }
      
      fetch(fileUrl, fetchOptions)
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch');
          return response.text();
        })
        .then(text => {
          setTextContent(text);
          setLoadingText(false);
        })
        .catch(error => {
          console.error('Error loading file content:', error);
          setTextContent('❌ Không thể tải nội dung file');
          setLoadingText(false);
        });
    }
  }, [file, visible, token]);

  if (!file || !visible) return null;

  const getFileExtension = () => {
    return file.name?.split('.').pop()?.toLowerCase() || '';
  };

  const isTextFile = () => {
    const ext = getFileExtension();
    return ['txt', 'md', 'xml', 'log'].includes(ext);
  };

  const isCSVFile = () => {
    const ext = getFileExtension();
    return ext === 'csv';
  };

  const isJSONFile = () => {
    const ext = getFileExtension();
    return ext === 'json';
  };

  const isImage = () => {
    const ext = getFileExtension();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
  };

  const isPDF = () => {
    return getFileExtension() === 'pdf';
  };

  const isOfficeDoc = () => {
    const ext = getFileExtension();
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext);
  };

  // Fix Vietnamese filename encoding
  

  const handleDownload = async () => {
    try {
      // Fix filename encoding
      const fixedFileName = fixVietnameseEncoding(file.name);
      
      if ((isTextFile() || isCSVFile() || isJSONFile()) && textContent) {
        // For text/CSV/JSON files that we've already loaded, create blob and download
        const mimeType = isCSVFile() ? 'text/csv;charset=utf-8' : 
                         isJSONFile() ? 'application/json;charset=utf-8' : 
                         'text/plain;charset=utf-8';
        const blob = new Blob([textContent], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fixedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        message.success(`Download started: ${fixedFileName}`);
      } else {
        // For other files, use the utility function
        await downloadGenericFile(file, token);
      }
    } catch (error) {
      console.error('Download error:', error);
      message.error(error.message || 'Download failed. Please try again.');
    }
  };

  const getFileIcon = () => {
    const ext = getFileExtension();
    const iconProps = { style: { fontSize: 20} };
    
    switch (ext) {
      case 'pdf':
        return <FilePdfOutlined {...iconProps} style={{ ...iconProps.style, color: '#ff4d4f' }} />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined {...iconProps} style={{ ...iconProps.style, color: '#1890ff' }} />;
      case 'ppt':
      case 'pptx':
        return <FilePptOutlined {...iconProps} style={{ ...iconProps.style, color: '#fa8c16' }} />;
      case 'xls':
      case 'csv':
      case 'xlsx':
        return <FileExcelOutlined {...iconProps} style={{ ...iconProps.style, color: '#52c41a' }} />;
      case 'txt':
      case 'md':
        return <FileTextOutlined {...iconProps} style={{ ...iconProps.style, color: '#722ed1' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return <PictureOutlined {...iconProps} style={{ ...iconProps.style, color: '#13c2c2' }} />;
      default:
        return <FileTextOutlined {...iconProps} style={{ ...iconProps.style, color: '#8c8c8c' }} />;
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => prev + 90);

  // Prepare docs for react-doc-viewer (after getFileExtension is defined)
  const getPreviewUrl = () => {
    if (isSecureFile() && blobUrl) {
      return blobUrl;
    }
    return file.url || file.previewUrl || file.downloadUrl;
  };

  const docs = [{
    uri: getPreviewUrl(),
    fileName: fixVietnameseEncoding(file.name),
    fileType: getFileExtension(),
  }];

  const renderPDFViewer = () => {
    // For secure files, use blob URL if available
    const previewUrl = isSecureFile() ? blobUrl : (file.url || file.previewUrl || file.downloadUrl);
    
    return (
      <div>
        <div className="mb-2 text-center">
          <Text className="text-sm text-gray-600">
            {getFileIcon()} PDF Viewer - {fixVietnameseEncoding(file.name)}
          </Text>
        </div>
        <div style={{ 
          height: '70vh', 
          border: '1px solid #d9d9d9', 
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          {isSecureFile() && loadingBlob ? (
            <div className="flex items-center justify-center h-full">
              <Spin size="large" />
              <Text className="ml-2">Loading secure preview...</Text>
            </div>
          ) : previewUrl ? (
            <iframe
              src={`${previewUrl}#view=FitH&toolbar=1&navpanes=1&scrollbar=1`}
              width="100%"
              height="100%"
              title={file.name}
              style={{ border: 'none' }}
              onError={() => {
                message.error('Cannot preview PDF - Please download to view');
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Text type="secondary">PDF preview not available</Text>
                <div className="mt-2">
                  <Button type="primary" onClick={handleDownload}>
                    Download to view
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTextViewer = () => (
    <div>
      <div className="mb-2 text-center">
        <Text className="text-sm text-gray-600">
          {getFileIcon()} Text Viewer - {fixVietnameseEncoding(file.name)}
        </Text>
      </div>
      <div style={{ 
        height: '70vh', 
        border: '1px solid #d9d9d9', 
        borderRadius: '6px',
        overflow: 'auto',
        backgroundColor: '#fafafa'
      }}>
        {loadingText ? (
          <div className="flex items-center justify-center h-full">
            <Spin size="large" />
            <Text className="ml-2">Đang tải nội dung...</Text>
          </div>
        ) : (
          <pre style={{
            padding: '16px',
            margin: 0,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: `${Math.round(zoomLevel * 0.14)}px`,
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            color: '#333',
            backgroundColor: 'transparent'
          }}>
            {textContent}
          </pre>
        )}
      </div>
    </div>
  );

  const renderCSVViewer = () => {
    // Parse CSV content into table data
    const parseCSV = (csvText) => {
      if (!csvText) return { headers: [], data: [] };
      
      try {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length === 0) return { headers: [], data: [] };
        
        // Parse headers (first line)
        const headers = lines[0].split(',').map(header => header.trim().replace(/['"]/g, ''));
        
        // Parse data rows
        const data = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(value => value.trim().replace(/['"]/g, ''));
          const row = { key: index };
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          return row;
        });
        
        return { headers, data };
      } catch (error) {
        console.error('Error parsing CSV:', error);
        return { headers: [], data: [] };
      }
    };

    const { headers, data } = parseCSV(textContent);

    // Create table columns
    const columns = headers.map(header => ({
      title: header,
      dataIndex: header,
      key: header,
      width: 100,
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    }));

    return (
      <div>
        <div className="mb-2 text-center">
          <Text className="text-sm text-gray-600">
            {getFileIcon()} CSV Viewer - {fixVietnameseEncoding(file.name)}
          </Text>
          <div className="text-xs text-gray-500">
            {data.length} rows × {headers.length} columns
          </div>
        </div>
        <div style={{ 
          height: `${Math.min(75, window.innerHeight * 0.7)}vh`, 
          border: '1px solid #d9d9d9', 
          borderRadius: '6px',
          overflow: 'hidden',
          backgroundColor: '#fff'
        }}>
          {loadingText ? (
            <div className="flex items-center justify-center h-full">
              <Spin size="large" />
              <Text className="ml-2">Đang tải CSV...</Text>
            </div>
          ) : headers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Text type="secondary">Không thể parse CSV data</Text>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={data}
              className="csv-table-viewer"

              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} rows`,
                size: 'small'
              }}
              scroll={{ x: true, y: 'calc(70vh - 100px)' }}
              // size="small"
              bordered
              style={{ 
                fontSize: `${Math.round(zoomLevel * 0.12)}px`
              }}
            />
          )}
        </div>
      </div>
         );
   };

  const renderJSONViewer = () => {
    // Parse and format JSON content
    const formatJSON = (jsonText) => {
      try {
        const parsed = JSON.parse(jsonText);
        return JSON.stringify(parsed, null, 2);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        return jsonText; // Return original if parsing fails
      }
    };

    const formattedJSON = textContent ? formatJSON(textContent) : '';

    return (
      <div>
        <div className="mb-2 text-center">
          <Text className="text-sm text-gray-600">
            {getFileIcon()} JSON Viewer - {fixVietnameseEncoding(file.name)}
          </Text>
          <div className="text-xs text-gray-500">
            Formatted JSON with syntax highlighting
          </div>
        </div>
        <div style={{ 
          height: '70vh', 
          border: '1px solid #d9d9d9', 
          borderRadius: '6px',
          overflow: 'auto',
          backgroundColor: '#fafafa'
        }}>
          {loadingText ? (
            <div className="flex items-center justify-center h-full">
              <Spin size="large" />
              <Text className="ml-2">Đang tải JSON...</Text>
            </div>
          ) : (
            <pre style={{
              padding: '16px',
              margin: 0,
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: `${Math.round(zoomLevel * 0.14)}px`,
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              color: '#333',
              backgroundColor: 'transparent'
            }}>
              <code style={{
                color: '#d73a49'
              }}>
                {formattedJSON}
              </code>
            </pre>
          )}
        </div>
      </div>
    );
  };
  
    const renderDocViewer = () => {
    if (viewerError) {
      // Fallback to default viewer if DocViewer fails
      return renderDefaultViewer();
    }

    return (
      <div>
        <div className="mb-2 text-center">
          <Text className="text-sm text-gray-600">
            {getFileIcon()} {fixVietnameseEncoding(file.name)}
          </Text>
        </div>
        <div style={{ 
          height: `${Math.min(75, window.innerHeight * 0.7)}vh`, 
          // width: `${Math.min(75, window.innerWidth * 0.7)}vw`,
          border: '1px solid #d9d9d9', 
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <DocViewer
            documents={docs}
            pluginRenderers={DocViewerRenderers}
            style={{ height: '100%', width: '100%' }}
            config={{
              header: {
                disableHeader: true,
                disableFileName: true,
                retainURLParams: false
              },
              csvDelimiter: ",",
              pdfZoom: {
                defaultZoom: 1.1,
                zoomJump: 0.2,
              },
              pdfVerticalScrollByDefault: true,
            }}
            onError={(error) => {
              console.error('DocViewer error:', error);
              message.warning('Viewer gặp lỗi - Chuyển sang chế độ dự phòng');
              setViewerError(true);
            }}
          />
        </div>
      </div>
    );
  };

  const renderImageViewer = () => {
    // For secure files, use blob URL if available
    const previewUrl = isSecureFile() ? blobUrl : (file.url || file.previewUrl || file.downloadUrl);

    return (
      <div className="text-center">
        {isSecureFile() && loadingBlob ? (
          <div className="flex items-center justify-center" style={{ height: '70vh' }}>
            <Spin size="large" />
            <Text className="ml-2">Loading secure preview...</Text>
          </div>
        ) : previewUrl ? (
          <Image
            src={previewUrl}
            alt={file.name}
            style={{ 
              maxWidth: '100%',
              maxHeight: '70vh',
              transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
            preview={false}
            onError={() => message.error('Cannot load image')}
          />
        ) : (
          <div className="flex items-center justify-center" style={{ height: '70vh' }}>
            <div className="text-center">
              <Text type="secondary">Image preview not available</Text>
              <div className="mt-2">
                <Button type="primary" onClick={handleDownload}>
                  Download to view
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const isDocViewerSupported = () => {
    const ext = getFileExtension();
    // react-doc-viewer supports these formats (excluding PDF and text files)
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  };

  const renderDefaultViewer = () => (
    <div className="text-center p-8">
      {getFileIcon()}
      <div className="mt-4">
        <Text strong className="block mb-2">{fixVietnameseEncoding(file.name)}</Text>
        <Text type="secondary" className="block mb-4">
          {file?.fileSize && (
            <span className="block">Kích thước: {(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
          )}
          Không thể xem trước file này
        </Text>
        <Button 
          type="primary" 
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          size="large"
        >
          Tải xuống để xem
        </Button>
      </div>
    </div>
  );

  const renderFileContent = () => {
    if (isImage()) {
      // Use custom image viewer for better zoom/rotate control
      return renderImageViewer();
    } else if (isPDF()) {
      // Use iframe for PDFs (more reliable than react-doc-viewer for PDFs)
      return renderPDFViewer();
    } else if (isCSVFile()) {
      // Use custom CSV viewer with table format
      return renderCSVViewer();
    } else if (isJSONFile()) {
      // Use custom JSON viewer with formatted display
      return renderJSONViewer();
    } else if (isTextFile()) {
      // Use custom text viewer for proper formatting
      return renderTextViewer();
    } else if (isDocViewerSupported()) {
      // Use react-doc-viewer for Office documents
      return renderDocViewer();
    } else {
      // Fallback to download for unsupported formats
      return renderDefaultViewer();
    }
  };

  return (
    <Modal
      title={
        <div className="flex justify-between items-center">
          <Space>
            <EyeOutlined />
            <span>{title || `Xem trước: ${file?.name || 'Unknown File'}`}</span>
          </Space>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={`${Math.min(75, window.innerWidth * 0.7)}vw`}
      style={{ top: 20 }}
      footer={[
        <Space key="tools">
          {(isImage() || isTextFile() || isCSVFile() || isJSONFile()) && (
            <>
              <Tooltip title="Thu nhỏ">
                <Button 
                  icon={<ZoomOutOutlined />}
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 25}
                />
              </Tooltip>
              <Text>{zoomLevel}%</Text>
              <Tooltip title="Phông to">
                <Button 
                  icon={<ZoomInOutlined />}
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 300}
                />
              </Tooltip>
              {isImage() && (
                <Tooltip title="Xoay">
                  <Button 
                    icon={<FullscreenOutlined />}
                    onClick={handleRotate}
                  />
                </Tooltip>
              )}
            </>
          )}
          
          {isDocViewerSupported() && (
            <Text type="secondary" className="text-xs">
              💡 Sử dụng built-in zoom/scroll trong viewer
            </Text>
          )}
          
          {isPDF() && (
            <Text type="secondary" className="text-xs">
              📄 Sử dụng browser PDF controls để zoom/navigate
            </Text>
          )}
          
          {isTextFile() && (
            <Text type="secondary" className="text-xs">
              📝 Text viewer với zoom và word wrap
            </Text>
          )}
          
          {isCSVFile() && (
            <Text type="secondary" className="text-xs">
              📊 CSV table viewer với zoom và pagination
            </Text>
          )}
          
          {isJSONFile() && (
            <Text type="secondary" className="text-xs">
              📋 JSON formatted viewer với zoom và syntax highlighting
            </Text>
          )}
          
          <Tooltip title="Tải xuống">
            <Button 
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              type="primary"
            />
          </Tooltip>
          
          <Button onClick={onCancel}>
            Đóng
          </Button>
        </Space>
      ]}
    >
      <div style={{ minHeight: '70vh' }}>
        {renderFileContent()}
      </div>
    </Modal>
  );
};

export default FileViewer; 