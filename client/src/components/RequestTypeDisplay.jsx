import React from 'react';
import { Tag, Card, Descriptions, Typography, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const RequestTypeDisplay = ({ request }) => {
  if (!request) return null;

  const getTypeInfo = () => {
    switch (request.type) {
      case 'classroom_creation':
        return {
          icon: <PlusOutlined />,
          color: 'green',
          title: 'Classroom Creation Request',
          description: 'Request to create a new classroom'
        };
      case 'classroom_deletion':
        return {
          icon: <DeleteOutlined />,
          color: 'red',
          title: 'Classroom Deletion Request',
          description: 'Request to delete an existing classroom'
        };
      case 'classroom_edit':
        return {
          icon: <EditOutlined />,
          color: 'blue',
          title: 'Classroom Edit Request',
          description: 'Request to modify classroom information'
        };
      default:
        return {
          icon: null,
          color: 'default',
          title: request.type,
          description: 'Unknown request type'
        };
    }
  };

  const typeInfo = getTypeInfo();

  const renderEditChanges = () => {
    if (request.type !== 'classroom_edit' || !request.requestData?.changes) {
      return null;
    }

    const { changes, currentData } = request.requestData;
    const changedFields = Object.keys(changes).filter(key => 
      changes[key] !== currentData?.[key]
    );

    if (changedFields.length === 0) return null;

    return (
      <Card size="small" title="Proposed Changes" style={{ marginTop: 16 }}>
        <Descriptions column={1} size="small" bordered>
          {changedFields.map(field => (
            <Descriptions.Item key={field} label={field.charAt(0).toUpperCase() + field.slice(1)}>
              <div>
                <div>
                  <Text type="secondary">Current: </Text>
                  <Text delete>{currentData?.[field] || 'N/A'}</Text>
                </div>
                <div>
                  <Text type="secondary">Proposed: </Text>
                  <Text strong style={{ color: '#1890ff' }}>{changes[field]}</Text>
                </div>
              </div>
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>
    );
  };

  const renderDeletionInfo = () => {
    if (request.type !== 'classroom_deletion') return null;

    return (
      <Card size="small" title="Classroom to be Deleted" style={{ marginTop: 16 }}>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Name">{request.classroom?.name}</Descriptions.Item>
          <Descriptions.Item label="Code">{request.classroom?.code}</Descriptions.Item>
          <Descriptions.Item label="Subject">{request.classroom?.subject}</Descriptions.Item>
          <Descriptions.Item label="Grade">{request.classroom?.grade}</Descriptions.Item>
          <Descriptions.Item label="Students" span={2}>
            {request.classroom?.students?.length || 0} students enrolled
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  const renderCreationInfo = () => {
    if (request.type !== 'classroom_creation' || !request.requestData) return null;

    return (
      <Card size="small" title="New Classroom Details" style={{ marginTop: 16 }}>
        <Descriptions column={2} size="small" bordered>
          {Object.entries(request.requestData).map(([key, value]) => (
            <Descriptions.Item key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
              {typeof value === 'object' ? JSON.stringify(value) : value}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Tag 
          icon={typeInfo.icon} 
          color={typeInfo.color} 
          style={{ fontSize: '14px', padding: '4px 12px' }}
        >
          {typeInfo.title}
        </Tag>
      </div>
      
      <Text type="secondary">{typeInfo.description}</Text>
      
      <Divider />
      
      {/* Basic Request Info */}
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="Classroom">
          {request.classroom?.name} ({request.classroom?.code})
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={request.status === 'pending' ? 'orange' : request.status === 'approved' ? 'green' : 'red'}>
            {request.status?.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Requested By">
          {request.requestedBy?.fullName}
        </Descriptions.Item>
        <Descriptions.Item label="Requested Date">
          {new Date(request.createdAt).toLocaleString()}
        </Descriptions.Item>
        {request.reviewedBy && (
          <Descriptions.Item label="Reviewed By">
            {request.reviewedBy?.fullName}
          </Descriptions.Item>
        )}
        {request.reviewedAt && (
          <Descriptions.Item label="Reviewed Date">
            {new Date(request.reviewedAt).toLocaleString()}
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Type-specific details */}
      {renderEditChanges()}
      {renderDeletionInfo()}
      {renderCreationInfo()}

      {/* Admin reason/note */}
      {request.reason && (
        <Card size="small" title="Admin Note" style={{ marginTop: 16 }}>
          <Text>{request.reason}</Text>
        </Card>
      )}
    </div>
  );
};

export default RequestTypeDisplay; 