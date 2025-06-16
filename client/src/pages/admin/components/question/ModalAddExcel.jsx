import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Alert,
  Table,
  message,
  Progress,
  Divider,
  Typography,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { questionAPI } from '../../../../services/api';
import * as XLSX from 'xlsx';


const { Title, Text } = Typography;
const { Dragger } = Upload;

const ModalAddExcel = ({ visible, onCancel, onSave, loading }) => {
  const [fileList, setFileList] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const columns = [
    {
      title: 'Question',
      dataIndex: 'content',
      key: 'content',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Option A',
      dataIndex: 'optionA',
      key: 'optionA',
      width: 100,
      ellipsis: true,
    },
    {
      title: 'Option B',
      dataIndex: 'optionB',
      key: 'optionB',
      width: 100,
      ellipsis: true,
    },
    {
      title: 'Option C',
      dataIndex: 'optionC',
      key: 'optionC',
      width: 100,
      ellipsis: true,
    },
    {
      title: 'Option D',
      dataIndex: 'optionD',
      key: 'optionD',
      width: 100,
      ellipsis: true,
    },
    {
      title: 'Correct',
      dataIndex: 'correctAnswer',
      key: 'correctAnswer',
      width: 80,
    },
    {
      title: 'Explanation',
      dataIndex: 'explanation',
      key: 'explanation',
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: 'Subject Code',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      width: 100,
    },
  ];

  const uploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    accept: '.xlsx,.xls',
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        message.error('You can only upload Excel files!');
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }

      setFileList([file]);
      processExcelFile(file);
      return false;
    },
    onRemove: () => {
      setFileList([]);
      setPreviewData([]);
      setUploadProgress(0);
    },
  };

  const processExcelFile = async (file) => {
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        console.log('Parsed JSON Data:', jsonData);

        const mappedData = jsonData.map((row, index) => ({
          key: index + 1,
          content: row['Content'] || '',
          optionA: row['Option A'] || '',
          optionB: row['Option B'] || '',
          optionC: row['Option C'] || '',
          optionD: row['Option D'] || '',
          correctAnswer: row['Correct Answer'] || '',
          explanation: row['Explanation'] || '',
          difficulty: row['Difficulty'] || '',
          category: row['Category'] || '',
          subjectCode: row['Subject Code'] || '',
        }));

        setPreviewData(mappedData);
        setUploadProgress(100);
        message.success('Excel file processed successfully!');
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      message.error('Failed to process Excel file');
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (previewData.length === 0) {
      message.error('Please upload and process an Excel file first');
      return;
    }

    const questionsData = previewData.map(item => ({
      content: item.content,
      options: [
        { content: item.optionA, isCorrect: item.correctAnswer === item.optionA ? true : false, image: null },
        { content: item.optionB, isCorrect: item.correctAnswer === item.optionB ? true : false, image: null },
        { content: item.optionC, isCorrect: item.correctAnswer === item.optionC ? true : false, image: null },
        { content: item.optionD, isCorrect: item.correctAnswer === item.optionD ? true : false, image: null },
      ],
      explanation: item.explanation,
      difficulty: item.difficulty,
      category: item.category,
      subjectCode: item.subjectCode,
    }));
    onSave(questionsData);
    setFileList([]);
    setPreviewData([]);
    setUploadProgress(0);
  };

  const handleCancel = () => {
    setFileList([]);
    setPreviewData([]);
    setUploadProgress(0);
    setIsProcessing(false);
    onCancel();
  };

  const downloadTemplate = async () => {
    try {


      const response = await questionAPI.downLoadTemplateExcel();

      if (!(response instanceof Blob)) {
        console.error('Response data is not a Blob!');
        return;
      }

      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'templateQuestion.xlsx');
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Failed to download template');
      console.error('Error downloading template:', error);
    }
  };

  return (
    <Modal
      title="Import Questions from Excel"
      open={visible}
      onCancel={handleCancel}
      width={1200}
      footer={[
        <Button key="template" icon={<DownloadOutlined />} onClick={downloadTemplate}>
          Download Template
        </Button>,
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          loading={loading}
          disabled={previewData.length === 0}
        >
          Import {previewData.length} Questions
        </Button>,
      ]}
    >
      <div>
        <Alert
          message="Excel Import Instructions"
          description="Please upload an Excel file with questions. You can download the template to see the required format."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
          <p className="ant-upload-drag-icon">
            <FileExcelOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
          </p>
          <p className="ant-upload-text">Click or drag Excel file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for .xlsx and .xls files. Maximum file size: 10MB
          </p>
        </Dragger>

        {isProcessing && (
          <div style={{ marginBottom: 16 }}>
            <Text>Processing Excel file...</Text>
            <Progress percent={uploadProgress} status="active" />
          </div>
        )}

        {previewData.length > 0 && (
          <>
            <Divider />
            <Title level={4}>Preview Questions ({previewData.length})</Title>
            <Table
              columns={columns}
              dataSource={previewData}
              scroll={{ x: 800 }}
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
              }}
              size="small"
            />
          </>
        )}
      </div>
    </Modal>
  );
};

export default ModalAddExcel;