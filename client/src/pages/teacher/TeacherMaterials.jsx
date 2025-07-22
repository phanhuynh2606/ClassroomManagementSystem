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
  Switch,
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
  InboxOutlined,
  ExclamationCircleOutlined,
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
  const [materialDeleteModalVisible, setMaterialDeleteModalVisible] = useState(false);
  
  const [classModal, setClassModal] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currMaterial, setCurrMaterial] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState([]);
  const [inputTag, setInputTag] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

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
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileExtension = (mimeType) => {
    const mimeToExt = {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "application/msword": "doc",
      "application/pdf": "pdf",
      "application/vnd.ms-excel": "xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
      "application/vnd.ms-powerpoint": "ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
      "text/plain": "txt",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
    };
    return mimeToExt[mimeType] || "bin";
  };

  const extractFilename = (response, material) => {
    const contentDisposition = response.headers["content-disposition"];
    if (contentDisposition) {
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
      if (utf8Match) {
        return decodeURIComponent(utf8Match[1]);
      }
      const regularMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (regularMatch && regularMatch[1]) {
        return regularMatch[1].replace(/['"]/g, "");
      }
    }

    if (material.fileUrl) {
      const urlParts = material.fileUrl.split("/");
      const cloudinaryFilename = urlParts[urlParts.length - 1];
      if (cloudinaryFilename && cloudinaryFilename.includes(".")) {
        return cloudinaryFilename;
      }
    }

    if (material.originalFileName) {
      return material.originalFileName;
    }
    const extension = getFileExtension(material.fileType);
    return `${material.title || "download"}.${extension}`;
  };

  const handleDownloadMaterial = async (material) => {
    try {
      const loadingMessage = message.loading("Downloading", 0);

      const response = await materialAPI.downloadMaterial(material._id);
      loadingMessage();

      if (!response.data || response.data.size === 0) {
        throw new Error("No data received from server");
      }

      let filename = extractFilename(response, material);
      console.log("Final filename:", filename);

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || material.fileType,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      message.success(`Download successful: ${filename}`);
      fetchMaterialsData();
    } catch (error) {
      console.error("Download error:", error);
      message.error(`Download failed: ${error.message}`);
    }
  };

  const handleEditMaterial = (material) => {
    setIsEditMode(true);
    setSelectedMaterial(material);
    setTags(material.tags || []);
    setFileList([]);
    const sharedWithIds = (material.classroom || [])
      .map(classroomItem => {
        return typeof classroomItem === 'string' ? classroomItem : classroomItem._id || classroomItem.id;
      })
      .filter(Boolean);

    form.setFieldsValue({
      title: material.title,
      description: material.description,
      isPublic: material.isPublic,
      sharedWith: sharedWithIds,
    });

    setUploadModalVisible(true);
  };
  const handleUpload = async (values) => {
    if (!isEditMode && fileList.length === 0) {
      message.error("Please upload a file");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description || "");
      formData.append("isPublic", values.isPublic || false);
      formData.append("tags", JSON.stringify(tags));

      if (values.sharedWith && values.sharedWith.length > 0) {
        formData.append("sharedWith", JSON.stringify(values.sharedWith));
      }

      if (fileList.length > 0) {
        const file = fileList[0].originFileObj || fileList[0].file || fileList[0];
        formData.append("file", file);
      }

      if (isEditMode) {
        await materialAPI.updateMaterial(selectedMaterial._id, formData);
        message.success("Material updated successfully");
      } else {
        const response = await materialAPI.createMaterialInLibrary(formData);
        message.success("Material uploaded successfully");
      }
      setUploadModalVisible(false);
      resetUploadForm();
      fetchMaterialsData();
    } catch (error) {
      console.error("Error submitting material:", error);
      message.error(
        isEditMode ? "Failed to update material" : "Failed to upload material"
      );
    } finally {
      setUploading(false);
    }
  };
  const handleDeleteMaterial = (material) => {
    setSelectedMaterial(material);
    setMaterialDeleteModalVisible(true);
  };

  const confirmDeleteMaterial = async () => {
    setUploading(true);
    try {
      const respone = await materialAPI.deleteMaterialFromLibrary( 
        selectedMaterial._id
      );
      if (respone.success) {
        message.success(respone.message || "Material deleted successfully");
        setMaterialDeleteModalVisible(false);
        setSelectedMaterial(null);
        fetchMaterialsData();
      }
    } catch (error) {
      message.error("Failed to delete material");
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    form.resetFields();
    setFileList([]);
    setTags([]);
    setInputTag("");
    setIsEditMode(false);
    setSelectedMaterial(null);
  };

  const handleTagAdd = () => {
    if (inputTag && !tags.includes(inputTag)) {
      setTags([...tags, inputTag]);
      setInputTag("");
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
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
      case "video":
        return <VideoCameraOutlined className="text-purple-600 text-2xl" />;
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
      case "video":
        return "purple";
      default:
        return "yellow";
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
      console.log("currMaterial:", currMaterial);
      console.log("Sharing with class:", values.class);
      const response = await materialAPI.shareMaterial(currMaterial._id, values.class);
      if (!response.success) {
        message.error(response.message);
      } else {
        message.success(response.message);
      }
      setClassModal(false);
      form.resetFields();
    } catch (error) {
      console.error("Share error:", error);
      message.error(`Không thể chia sẻ "${currMaterial.title}"`);
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
      onClick: () => handleDownloadMaterial(material),
    },
    {
      key: "edit",
      label: "Edit",
      icon: <EditOutlined />,
      onClick: () => handleEditMaterial(material),
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      label: "Delete",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDeleteMaterial(material),
    },
  ];

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.title
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesType = filterType === "all" || material.type === filterType;
    return matchesSearch && matchesType;
  });
  const totalFiles = materials.filter((m) => m.type !== "folder").length;

  const uploadProps = {
    name: "file",
    multiple: false,
    fileList: fileList,
    beforeUpload: (file) => {
      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    },
  };

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
                      {material.isPublic !== undefined && (
                        <Tag color={material.isPublic ? "green" : "orange"}>
                          {material.isPublic ? "Public" : "Private"}
                        </Tag>
                      )}
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
                        {material.downloadCount !== undefined && (
                          <Text type="secondary">
                            Downloads: {material.downloadCount}
                          </Text>
                        )}
                      </div>
                      {material.tags && material.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {material.tags.map((tag) => (
                            <Tag key={tag} size="small" color="blue">
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Updated Upload Modal - now handles both create and edit */}
      <Modal
        title={isEditMode ? "Chỉnh sửa tài liệu" : "Tải lên tài liệu"}
        open={uploadModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setUploadModalVisible(false);
          resetUploadForm();
        }}
        okText={isEditMode ? "Cập nhật" : "Tải lên"}
        cancelText="Hủy"
        confirmLoading={uploading}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
          initialValues={{ isPublic: false }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề tài liệu" }]}
          >
            <Input placeholder="Nhập tiêu đề tài liệu" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả ngắn về tài liệu" />
          </Form.Item>

          <Form.Item
            label={isEditMode ? "Cập nhật file (tùy chọn)" : "Upload File"}
            required={!isEditMode}
          >
            {isEditMode && selectedMaterial?.filename && (
              <div className="mb-2 p-2 bg-gray-50 rounded">
                <Text type="secondary">File hiện tại: </Text>
                <Text strong>{selectedMaterial.filename}</Text>
              </div>
            )}
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Kéo thả file hoặc click để {isEditMode ? "thay thế file hiện tại" : "chọn"}
              </p>
              <p className="ant-upload-hint">
                Hỗ trợ: PDF, Word, Excel, PowerPoint, Video, Images
                {isEditMode && <br />}
                {isEditMode && "Bỏ trống để giữ file hiện tại"}
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item label="Tags">
            <div className="mb-2">
              <Input
                placeholder="Thêm tag"
                value={inputTag}
                onChange={(e) => setInputTag(e.target.value)}
                onPressEnter={handleTagAdd}
                style={{ width: "calc(100% - 80px)", marginRight: 8 }}
              />
              <Button onClick={handleTagAdd}>Thêm</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Tag key={tag} closable onClose={() => handleTagRemove(tag)}>
                  {tag}
                </Tag>
              ))}
            </div>
          </Form.Item>

          <Form.Item name="isPublic" label="Hiển thị" valuePropName="checked">
            <Switch checkedChildren="Public" unCheckedChildren="Private" />
          </Form.Item>

          <Form.Item
            name="sharedWith"
            label="Shared With"
          >
            <Select
              mode="multiple"
              placeholder="Select classes"
              options={classes.map(cls => ({
                label: cls.name,        // Hiển thị tên
                value: cls._id || cls.id // Value là _id
              }))}
            />
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

      {/* Share class modal */}
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
              {classes.map((c) => (
                <Option key={c._id} value={c._id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Delete Material"
        open={materialDeleteModalVisible}
        onOk={confirmDeleteMaterial}
        onCancel={() => {
          setMaterialDeleteModalVisible(false);
          setSelectedMaterial(null);
        }}
        confirmLoading={uploading}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <div className="py-4">
          <ExclamationCircleOutlined className="text-orange-500 mr-2" />
          <Text>
            Are you sure you want to delete "{selectedMaterial?.title}"? This
            action cannot be undone.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default memo(TeacherMaterials);