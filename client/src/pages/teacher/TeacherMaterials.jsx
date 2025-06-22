import React, { useState, memo } from 'react';
import { 
  Card, 
  List, 
  Button, 
  Typography, 
  Space, 
  Tag, 
  Upload,
  Modal,
  Form,
  Input,
  Select,
  message,
  Dropdown,
  Empty,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  UploadOutlined,
  FolderOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  VideoCameraOutlined,
  PlusOutlined,
  MoreOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const TeacherMaterials = () => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // list or grid

  // Mock data for materials
  const [materials, setMaterials] = useState([
    {
      id: '1',
      name: 'React Hooks Tutorial.pdf',
      type: 'pdf',
      size: '2.5 MB',
      category: 'Lecture',
      uploadedAt: '2024-01-15T10:00:00Z',
      sharedWith: ['Web Development', 'Advanced React'],
      description: 'Comprehensive guide to React Hooks'
    },
    {
      id: '2',
      name: 'JavaScript Fundamentals',
      type: 'folder',
      items: 15,
      category: 'Course Material',
      uploadedAt: '2024-01-10T14:30:00Z',
      sharedWith: ['Programming Fundamentals'],
      description: 'Complete JavaScript course materials'
    },
    {
      id: '3',
      name: 'CSS Grid Layout Demo.mp4',
      type: 'video',
      size: '45.2 MB',
      category: 'Demo',
      uploadedAt: '2024-01-12T09:15:00Z',
      sharedWith: ['Web Development'],
      description: 'Video demonstration of CSS Grid'
    },
    {
      id: '4',
      name: 'Assignment Template.docx',
      type: 'word',
      size: '126 KB',
      category: 'Template',
      uploadedAt: '2024-01-08T16:45:00Z',
      sharedWith: ['All Classes'],
      description: 'Standard assignment submission template'
    },
    {
      id: '5',
      name: 'Student Progress Tracker.xlsx',
      type: 'excel',
      size: '89 KB',
      category: 'Administration',
      uploadedAt: '2024-01-05T11:20:00Z',
      sharedWith: [],
      description: 'Excel template for tracking student progress'
    }
  ]);

  const getFileIcon = (type) => {
    switch (type) {
      case 'folder': return <FolderOutlined className="text-blue-500 text-2xl" />;
      case 'pdf': return <FilePdfOutlined className="text-red-500 text-2xl" />;
      case 'word': return <FileWordOutlined className="text-blue-600 text-2xl" />;
      case 'excel': return <FileExcelOutlined className="text-green-600 text-2xl" />;
      case 'video': return <VideoCameraOutlined className="text-purple-500 text-2xl" />;
      case 'image': return <FileImageOutlined className="text-orange-500 text-2xl" />;
      default: return <FileTextOutlined className="text-gray-500 text-2xl" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Lecture': return 'blue';
      case 'Assignment': return 'green';
      case 'Demo': return 'purple';
      case 'Template': return 'orange';
      case 'Administration': return 'red';
      default: return 'default';
    }
  };

  const handleUpload = async (values) => {
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Files uploaded successfully');
      setUploadModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Upload failed');
    }
  };

  const handleCreateFolder = async (values) => {
    try {
      const newFolder = {
        id: Date.now().toString(),
        name: values.name,
        type: 'folder',
        items: 0,
        category: values.category,
        uploadedAt: new Date().toISOString(),
        sharedWith: values.sharedWith || [],
        description: values.description
      };
      
      setMaterials(prev => [newFolder, ...prev]);
      setFolderModalVisible(false);
      form.resetFields();
      message.success('Folder created successfully');
    } catch (error) {
      message.error('Failed to create folder');
    }
  };

  const materialActions = (material) => [
    {
      key: 'view',
      label: 'View',
      icon: <EyeOutlined />,
      onClick: () => message.info(`Opening ${material.name}`)
    },
    {
      key: 'share',
      label: 'Share to class',
      icon: <ShareAltOutlined />,
      onClick: () => message.info(`Sharing ${material.name}`)
    },
    {
      key: 'download',
      label: 'Download',
      icon: <DownloadOutlined />,
      onClick: () => message.info(`Downloading ${material.name}`)
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => message.info(`Editing ${material.name}`)
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => message.warning(`Delete ${material.name}`)
    }
  ];

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = filterType === 'all' || material.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalSize = materials
    .filter(m => m.size)
    .reduce((sum, m) => sum + parseFloat(m.size), 0);

  const totalFiles = materials.filter(m => m.type !== 'folder').length;
  const totalFolders = materials.filter(m => m.type === 'folder').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={2} className="mb-0">Thư viện tài liệu</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setFolderModalVisible(true)}
          >
            Tạo thư mục
          </Button>
          <Button 
            type="primary" 
            icon={<UploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
          >
            Tải lên
          </Button>
        </Space>
      </div>

      {/* Statistics */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số file"
              value={totalFiles}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Thư mục"
              value={totalFolders}
              prefix={<FolderOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Dung lượng"
              value={totalSize.toFixed(1)}
              suffix="MB"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã chia sẻ"
              value={materials.filter(m => m.sharedWith.length > 0).length}
              prefix={<ShareAltOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Space>
            <Search
              placeholder="Tìm kiếm tài liệu..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 150 }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="folder">Thư mục</Option>
              <Option value="pdf">PDF</Option>
              <Option value="word">Word</Option>
              <Option value="excel">Excel</Option>
              <Option value="video">Video</Option>
              <Option value="image">Hình ảnh</Option>
            </Select>
          </Space>
        </div>

        {/* Materials List */}
        {filteredMaterials.length === 0 ? (
          <Empty 
            description="Không có tài liệu nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={filteredMaterials}
            renderItem={(material) => (
              <List.Item
                actions={[
                  <Dropdown
                    key="actions"
                    menu={{ items: materialActions(material) }}
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <Button 
                      type="text" 
                      icon={<MoreOutlined />}
                      size="small"
                    />
                  </Dropdown>
                ]}
              >
                <List.Item.Meta
                  avatar={getFileIcon(material.type)}
                  title={
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{material.name}</span>
                      <Tag color={getCategoryColor(material.category)}>
                        {material.category}
                      </Tag>
                      {material.sharedWith.length > 0 && (
                        <Tag color="green" icon={<ShareAltOutlined />}>
                          Đã chia sẻ
                        </Tag>
                      )}
                    </div>
                  }
                  description={
                    <Space direction="vertical" size={2} className="w-full">
                      <Text className="text-gray-600">{material.description}</Text>
                      <div className="flex items-center gap-4">
                        <Text type="secondary">
                          {material.type === 'folder' 
                            ? `${material.items} items`
                            : material.size
                          }
                        </Text>
                        <Text type="secondary">
                          {new Date(material.uploadedAt).toLocaleDateString()}
                        </Text>
                        {material.sharedWith.length > 0 && (
                          <Text type="secondary">
                            Shared with: {material.sharedWith.slice(0, 2).join(', ')}
                            {material.sharedWith.length > 2 && ` +${material.sharedWith.length - 2} more`}
                          </Text>
                        )}
                      </div>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Tải lên tài liệu"
        open={uploadModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setUploadModalVisible(false);
          form.resetFields();
        }}
        okText="Tải lên"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
        >
          <Form.Item
            name="files"
            label="Chọn file"
            rules={[{ required: true, message: 'Vui lòng chọn file' }]}
          >
            <Upload.Dragger
              multiple
              beforeUpload={() => false}
              showUploadList={{ showRemoveIcon: true }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Kéo thả file hoặc click để chọn
              </p>
              <p className="ant-upload-hint">
                Hỗ trợ: PDF, Word, Excel, PowerPoint, Video, Images
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select placeholder="Chọn danh mục">
              <Option value="Lecture">Bài giảng</Option>
              <Option value="Assignment">Bài tập</Option>
              <Option value="Demo">Demo</Option>
              <Option value="Template">Template</Option>
              <Option value="Administration">Quản lý</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea 
              rows={3} 
              placeholder="Mô tả ngắn về tài liệu"
            />
          </Form.Item>

          <Form.Item
            name="sharedWith"
            label="Chia sẻ với lớp"
          >
            <Select
              mode="multiple"
              placeholder="Chọn lớp để chia sẻ"
              allowClear
            >
              <Option value="Web Development">Web Development</Option>
              <Option value="Programming Fundamentals">Programming Fundamentals</Option>
              <Option value="Advanced React">Advanced React</Option>
              <Option value="Database Design">Database Design</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        title="Tạo thư mục mới"
        open={folderModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setFolderModalVisible(false);
          form.resetFields();
        }}
        okText="Tạo thư mục"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateFolder}
        >
          <Form.Item
            name="name"
            label="Tên thư mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên thư mục' }]}
          >
            <Input placeholder="Nhập tên thư mục" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select placeholder="Chọn danh mục">
              <Option value="Course Material">Tài liệu khóa học</Option>
              <Option value="Assignment">Bài tập</Option>
              <Option value="Lecture">Bài giảng</Option>
              <Option value="Administration">Quản lý</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea 
              rows={3} 
              placeholder="Mô tả thư mục"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default memo(TeacherMaterials); 