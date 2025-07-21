import React, { useState, memo, useEffect } from "react";
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
  Statistic,
} from "antd";
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
  SearchOutlined,
  FilePptOutlined,
} from "@ant-design/icons";
import { materialAPI } from "../../services/api";
import classroomAPI from "../../services/api/classroom.api";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const TeacherMaterials = () => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [classModal, setClassModal] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currMaterial, setCurrMaterial] = useState(null);
  useEffect(() => {
    fetchMaterialsData();
    fetchClassrooms();
  }, []);
  const fetchMaterialsData = async () => {
    try {
      const response = await materialAPI.getMaterialByTeacher();
      console.log("Fetched materials:", response.data);
      setMaterials(response.data.materials || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
      message.error("Failed to fetch materials");
    } finally {
    }
  };
  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getAllByTeacher();
      if (response && response.success && Array.isArray(response.data)) {
        setClasses(response.data);
      } else if (Array.isArray(response.data)) {
        setClasses(response.data);
      } else if (Array.isArray(response)) {
        setClasses(response);
      } else {
        console.error("Unexpected response format:", response);
        setClasses([]);
      }
    } catch (error) {
      message.error("Failed to fetch classrooms");
      console.error("Error fetching classrooms:", error);
      setClasses([]);
    } finally {
      console.log("Classrooms fetched successfully", classes);
    }
  };
  const getFileIcon = (type) => {
    switch (type) {
      case "folder":
        return <FolderOutlined className="text-blue-500 text-2xl" />;
      case "pdf":
        return <FilePdfOutlined className="text-red-500 text-2xl" />;
      case "document":
        return <FileWordOutlined className="text-blue-600 text-2xl" />;
      case "excel":
        return <FileExcelOutlined className="text-green-600 text-2xl" />;
      case "presentation":
        return <FilePptOutlined className="text-purple-500 text-2xl" />;
      case "image":
        return <FileImageOutlined className="text-orange-500 text-2xl" />;
      default:
        return <FileTextOutlined className="text-gray-500 text-2xl" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "folder":
        return "blue";
      case "pdf":
        return "green";
      case "document":
        return "purple";
      case "excel":
        return "orange";
      case "presentation":
        return "red";
      default:
        return "yellow";
    }
  };

  const handleUpload = async (values) => {
    try {
      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success("Files uploaded successfully");
      setUploadModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Upload failed");
    }
  };

  const handleCreateFolder = async (values) => {
    try {
      const newFolder = {
        id: Date.now().toString(),
        name: values.name,
        type: "folder",
        items: 0,
        category: values.category,
        uploadedAt: new Date().toISOString(),
        sharedWith: values.sharedWith || [],
        description: values.description,
      };

      setMaterials((prev) => [newFolder, ...prev]);
      setFolderModalVisible(false);
      form.resetFields();
      message.success("Folder created successfully");
    } catch (error) {
      message.error("Failed to create folder");
    }
  };
  const handleShare = async (values) => {
    try {
      const respone = await materialAPI.shareMaterial(currMaterial._id, values.class);  
      if (!respone.success){
        message.error(respone.message);
      }
      else{
        message.success(respone.message);
      }
      setClassModal(false);
      form.resetFields();
    } catch (error) {
      console.error("Share error:", error);
      message.error(`Không thể chia sẻ "${currMaterial.title}"`);
    } finally {
    }
  };

  const materialActions = (material) => [
    {
      key: "share",
      label: "Share to class",
      icon: <ShareAltOutlined />,
      onClick: () => {
        setCurrMaterial(material);
        setClassModal(true);
      },
    },
    {
      key: "download",
      label: "Download",
      icon: <DownloadOutlined />,
      onClick: () => message.info(`Downloading ${material.title}`),
    },
    {
      key: "edit",
      label: "Edit",
      icon: <EditOutlined />,
      onClick: () => message.info(`Editing ${material.title}`),
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      label: "Delete",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => message.warning(`Delete ${material.title}`),
    },
  ];
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.title
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesType = filterType === "all" || material.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalSize = materials
    .filter((m) => m.size)
    .reduce((sum, m) => sum + parseFloat(m.size), 0);

  const totalFiles = materials.filter((m) => m.type !== "folder").length;
  const totalFolders = materials.filter((m) => m.type === "folder").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={2} className="mb-0">
          Thư viện tài liệu
        </Title>
        <Space>
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
              title="Dung lượng"
              value={
                Math.round(
                  (materials.reduce(
                    (total, material) => total + (material.fileSize || 0),
                    0
                  ) /
                    (1024 * 1024)) *
                    100
                ) / 100
              }
              suffix="MB"
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
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <Button type="text" icon={<MoreOutlined />} size="small" />
                  </Dropdown>,
                ]}
              >
                <List.Item.Meta
                  avatar={getFileIcon(material.type)}
                  title={
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{material.title}</span>
                      <Tag color={getTypeColor(material.type)}>
                        {material.type}
                      </Tag>
                    </div>
                  }
                  description={
                    <Space direction="vertical" size={2} className="w-full">
                      <Text className="text-gray-600">
                        {material.description}
                      </Text>
                      <div className="flex items-center gap-4">
                        <Text type="secondary">
                          {formatFileSize(material.fileSize)}
                        </Text>
                        <Text type="secondary">
                          {new Date(material.createdAt).toLocaleDateString()}
                        </Text>
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
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item
            name="files"
            label="Chọn file"
            rules={[{ required: true, message: "Vui lòng chọn file" }]}
          >
            <Upload.Dragger
              multiple
              beforeUpload={() => false}
              showUploadList={{ showRemoveIcon: true }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Kéo thả file hoặc click để chọn</p>
              <p className="ant-upload-hint">
                Hỗ trợ: PDF, Word, Excel, PowerPoint, Video, Images
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
          >
            <Select placeholder="Chọn danh mục">
              <Option value="Lecture">Bài giảng</Option>
              <Option value="Assignment">Bài tập</Option>
              <Option value="Demo">Demo</Option>
              <Option value="Template">Template</Option>
              <Option value="Administration">Quản lý</Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả ngắn về tài liệu" />
          </Form.Item>

          <Form.Item name="sharedWith" label="Chia sẻ với lớp">
            <Select
              mode="multiple"
              placeholder="Chọn lớp để chia sẻ"
              allowClear
            >
              <Option value="Web Development">Web Development</Option>
              <Option value="Programming Fundamentals">
                Programming Fundamentals
              </Option>
              <Option value="Advanced React">Advanced React</Option>
              <Option value="Database Design">Database Design</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
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
        <Form form={form} layout="vertical" onFinish={handleCreateFolder}>
          <Form.Item
            name="name"
            label="Tên thư mục"
            rules={[{ required: true, message: "Vui lòng nhập tên thư mục" }]}
          >
            <Input placeholder="Nhập tên thư mục" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
          >
            <Select placeholder="Chọn danh mục">
              <Option value="Course Material">Tài liệu khóa học</Option>
              <Option value="Assignment">Bài tập</Option>
              <Option value="Lecture">Bài giảng</Option>
              <Option value="Administration">Quản lý</Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả thư mục" />
          </Form.Item>
        </Form>
      </Modal>
      {/* shareclass modal */}
      <Modal
        title="Chia sẻ tài liệu với lớp học khác"
        open={classModal}
        onOk={() => form.submit()}
        onCancel={() => {
          setCurrMaterial(null);
          setClassModal(false);
          form.resetFields();
        }}
        okText="OK"
      >
        <Form form={form} layout="vertical" onFinish={handleShare}>
          <Form.Item
            name="class"
            rules={[{ required: true, message: "Vui lòng chọn lớp học" }]}
          >
            <Select placeholder="Chọn lớp học">
              {classes.map((c) => {
                return (
                  <Option key={c._id} value={c._id}>
                    {c.name}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default memo(TeacherMaterials);
