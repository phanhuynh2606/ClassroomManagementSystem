import React, { useState } from 'react';
import {
  Card,
  Typography,
  Input,
  Upload,
  Button,
  message,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

const StudentAssignmentDetail = () => {
  const navigate = useNavigate();
  const { classroomId, assignmentId } = useParams();

  const textKey = `text-${assignmentId}`;
  const fileKey = `filelist-${assignmentId}`;

  const [submitted, setSubmitted] = useState(() => {
    return localStorage.getItem(`submitted-${assignmentId}`) === 'true';
  });
  const [isEditing, setIsEditing] = useState(false);

  const [textContent, setTextContent] = useState('');
  const [fileList, setFileList] = useState([]);

  const dummyRequest = ({ onSuccess }) => {
    setTimeout(() => onSuccess('ok'), 1000);
  };

  const handleSave = () => {
    localStorage.setItem(`submitted-${assignmentId}`, 'true');
    localStorage.setItem(textKey, textContent);
    localStorage.setItem(
      fileKey,
      JSON.stringify(fileList.map((file) => ({ name: file.name, uid: file.uid })))
    );

    setSubmitted(true);
    setIsEditing(false);
    message.success('Submission saved!');
    navigate(`/student/classroom/${classroomId}#assignments`)
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleEdit = () => {
    const savedText = localStorage.getItem(textKey) || '';
    const savedFiles = JSON.parse(localStorage.getItem(fileKey) || '[]');

    setTextContent(savedText);
    setFileList(savedFiles);
    setIsEditing(true);
  };

  return (
    <div className="p-6">
      <Title level={3}>Assignment: {assignmentId}</Title>

      <Card className="mb-6">
        <Paragraph>
          For this project, you will be required to collaborate in groups and present your findings to the class during the final week of the semester.
        </Paragraph>
        <Paragraph>
          Using statistical software such as Excel, R, or Python, you will analyze the data employing inferential statistical techniques to derive meaningful insights.
        </Paragraph>
        <Paragraph>
          You must conduct a <Text strong>regression analysis</Text> and apply at least three of the following:
        </Paragraph>
        <ol style={{ marginLeft: '20px' }}>
          <li>Test & confidence interval for the population mean.</li>
          <li>Test & confidence interval for the population proportion.</li>
          <li>Test & confidence interval for difference of means between two populations.</li>
          <li>Test & confidence interval for difference of proportions between two populations.</li>
        </ol>
      </Card>

      {!isEditing && (
        <Button type="primary" onClick={handleEdit}>
          {submitted ? 'Edit Submission' : 'Upload Submission'}
        </Button>
      )}
      {isEditing && (
        <>
          <Card title="Online text" className="mb-6">
            <TextArea
              rows={8}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Write your answer here..."
            />
          </Card>

          <Card title="File submissions" className="mb-6">
            <Dragger
              customRequest={dummyRequest}
              multiple
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              accept="*"
              maxCount={20}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Accepted file types: All. Max size: 20MB, up to 20 files.
              </p>
            </Dragger>
          </Card>

          <div className="flex gap-4">
            <Button type="primary" onClick={handleSave}>
              {submitted ? 'Update Submission' : 'Save Submission'}
            </Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAssignmentDetail;
