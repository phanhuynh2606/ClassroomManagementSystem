import React from 'react';
import { Modal, Card, Row, Col } from 'antd';
import { 
  EditOutlined, 
  FileExcelOutlined, 
  RobotOutlined 
} from '@ant-design/icons';

const { Meta } = Card;

const ModalSelectMethod = ({ visible, onCancel, onSelectMethod }) => {
  const methods = [
    {
      key: 'manual',
      title: 'Add Manually',
      description: 'Create questions manually with form input',
      icon: <EditOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      key: 'excel',
      title: 'Import from Excel',
      description: 'Upload Excel file to import multiple questions',
      icon: <FileExcelOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      key: 'ai',
      title: 'Generate with AI',
      description: 'Use AI to automatically generate questions',
      icon: <RobotOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
      color: '#722ed1'
    }
  ];

  const handleMethodSelect = (method) => {
    onSelectMethod(method);
  };

  return (
    <Modal
      title="Choose how to add questions"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
    >
      <Row gutter={[16, 16]} style={{ padding: '20px 0' }}>
        {methods.map((method) => (
          <Col xs={24} sm={8} key={method.key}>
            <Card
              hoverable
              style={{ 
                textAlign: 'center',
                cursor: 'pointer',
                border: `2px solid ${method.color}20`,
                borderRadius: '8px'
              }}
              bodyStyle={{ padding: '24px 16px' }}
              onClick={() => handleMethodSelect(method.key)}
            >
              <div style={{ marginBottom: '16px' }}>
                {method.icon}
              </div>
              <Meta
                title={
                  <span style={{ color: method.color, fontSize: '16px', fontWeight: 'bold' }}>
                    {method.title}
                  </span>
                }
                description={
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    {method.description}
                  </span>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Modal>
  );
};

export default ModalSelectMethod;