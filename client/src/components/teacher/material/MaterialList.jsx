import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Typography,
  Badge,
  message,
  Tooltip,
  Modal,
  Form,
  Select,
  Tag,
  Switch,
  Space,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  UploadOutlined,
  DownloadOutlined,
  FolderOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import Dragger from "antd/es/upload/Dragger";
import TextArea from "antd/es/input/TextArea";
import { materialAPI } from "../../../services/api";

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const MaterialList = ({ classId, classData }) => {
  const [materialsData, setMaterialsData] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialSearchText, setMaterialSearchText] = useState("");
  const [materialDeleteModalVisible, setMaterialDeleteModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [deletingMaterial, setDeletingMaterial] = useState(false);

  // Create/Edit Modal States
  const [createEditModalVisible, setCreateEditModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [materialForm] = Form.useForm();
  const [submittingMaterial, setSubmittingMaterial] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [tags, setTags] = useState([]);
  const [inputTag, setInputTag] = useState("");

  useEffect(() => {
    fetchMaterialsData();
  }, []);
 
  const fetchMaterialsData = async () => {
    setMaterialsLoading(true);
    try {
      const response = await materialAPI.getMaterials(classId);
      setMaterialsData(response.data.materials || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
      message.error("Failed to fetch materials");
    } finally {
      setMaterialsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTypeIcon = (type) => {
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

  const getTypeBadgeColor = (type) => {
    const colors = {
      pdf: "red",
      slide: "blue",
      video: "green",
      other: "yellow",
    };
    return colors[type] || "yellow";
  };

  const handleCreateMaterial = () => {
    setIsEditMode(false);
    setSelectedMaterial(null);
    setTags([]);
    setFileList([]);
    materialForm.resetFields();
    setCreateEditModalVisible(true);
  };

  const handleEditMaterial = (material) => {
    setIsEditMode(true);
    setSelectedMaterial(material);
    setTags(material.tags || []);
    setFileList([]);
    materialForm.setFieldsValue({
      title: material.title,
      description: material.description,
      isPublic: material.isPublic,
    });
    setCreateEditModalVisible(true);
  };

  const handleDeleteMaterial = (material) => {
    setSelectedMaterial(material);
    setMaterialDeleteModalVisible(true);
  };

  const confirmDeleteMaterial = async () => {
    setDeletingMaterial(true);
    try {
      const respone = await materialAPI.deleteMaterial(
        classId,
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
      setDeletingMaterial(false);
    }
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

  const extractFilename = (response, material) => {
    const contentDisposition = response.headers["content-disposition"];
    if (contentDisposition) {
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
      if (utf8Match) {
        return decodeURIComponent(utf8Match[1]);
      }
      const regularMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
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

  const getFileExtension = (mimeType) => {
    const mimeToExt = {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/msword": "doc",
      "application/pdf": "pdf",
      "application/vnd.ms-excel": "xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
      "application/vnd.ms-powerpoint": "ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "pptx",
      "text/plain": "txt",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
    };
    return mimeToExt[mimeType] || "bin";
  };
  const handleSubmitMaterial = async (values) => {
    if (!isEditMode && fileList.length === 0) {
      message.error("Please upload a file");
      return;
    }
    setSubmittingMaterial(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description || "");
      formData.append("isPublic", values.isPublic);
      formData.append("tags", JSON.stringify(tags));
      formData.append("classroom", null);

      // Thêm file nếu có (cho cả create và update)
      if (fileList.length > 0) {
        const file = fileList[0].originFileObj || fileList[0].file || fileList[0];
        formData.append("file", file);
      }
      if (isEditMode) {
        await materialAPI.updateMaterial(selectedMaterial._id, formData);
        message.success(
          fileList.length > 0
            ? "Material and file updated successfully"
            : "Material updated successfully"
        );
      } else {
        const response = await materialAPI.createMaterial(classId, formData);
        console.log(response);
        message.success("Material uploaded successfully");
      }

      setCreateEditModalVisible(false);
      fetchMaterialsData();
      materialForm.resetFields();
      setFileList([]);
      setTags([]);

    } catch (error) {
      console.error("Error submitting material:", error);
      message.error(
        isEditMode ? "Failed to update material" : "Failed to upload material"
      );
    } finally {
      setSubmittingMaterial(false);
    }
  };

  const handleCancelCreateEdit = () => {
    setCreateEditModalVisible(false);
    setSelectedMaterial(null);
    setTags([]);
    setFileList([]);
    materialForm.resetFields();
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

  const materialColumns = [
    {
      width: 150,
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      filteredValue: materialSearchText ? [materialSearchText] : null,
      onFilter: (value, record) =>
        record.title?.toLowerCase().includes(value.toLowerCase()) ||
        record.description?.toLowerCase().includes(value.toLowerCase()) ||
        record.tags?.some((tag) =>
          tag.toLowerCase().includes(value.toLowerCase())
        ),
      render: (title, record) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon(record.type)}</span>
          <div>
            <div className="font-medium">{title}</div>
            {record.description && (
              <div className="text-gray-500 text-sm">{record.description}</div>
            )}
          </div>
        </div>
      ),
      
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 150,
      render: (type) => (
        <Badge color={getTypeBadgeColor(type)} text={type.toUpperCase()} />
      ),
    },
    {
      title: "Kích thước",
      dataIndex: "fileSize",
      key: "fileSize",
      width: 100,
      render: (size) => formatFileSize(size),
    },
    {
      title: "Tải xuống",
      dataIndex: "downloadCount",
      key: "downloadCount",
      width: 100,
      sorter: (a, b) => a.downloadCount - b.downloadCount,
      render: (count) => (
        <span className="text-blue-600 font-medium">{count}</span>
      ),
    },
    {
      title: "Xem",
      dataIndex: "viewCount",
      key: "viewCount",
      width: 100,
      sorter: (a, b) => a.viewCount - b.viewCount,
      render: (count) => (
        <span className="text-green-600 font-medium">{count}</span>
      ),
    },
    {
      title: "Hiển thị",
      dataIndex: "isPublic",
      key: "isPublic",
      width: 100,
      render: (isPublic) => (
        <Badge
          color={isPublic ? "green" : "orange"}
          text={isPublic ? "Public" : "Private"}
        />
      ),
    },
    {
      title: "Thẻ",
      dataIndex: "tags",
      key: "tags",
      width: 150,
      render: (tags) => (
        <div className="flex flex-wrap gap-1">
          {tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} color="blue" text={tag} />
          ))}
          {tags?.length > 2 && (
            <Tooltip title={tags.slice(2).join(", ")}>
              <Badge color="gray" text={`+${tags.length - 2}`} />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Ngày tải lên",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Download">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadMaterial(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditMaterial(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteMaterial(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Search
          placeholder="Tìm kiếm tài liệu, mô tả, thẻ..."
          value={materialSearchText}
          onChange={(e) => setMaterialSearchText(e.target.value)}
          onSearch={setMaterialSearchText}
          style={{ width: 400 }}
          prefix={<SearchOutlined />}
        />
        <div className="flex items-center gap-4">
          <Text type="secondary">Tổng: {materialsData.length} tài liệu</Text>
          {classData?.status === "active" && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateMaterial}
            >
              Tải lên
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={materialColumns}
        dataSource={materialsData}
        rowKey="_id"
        loading={materialsLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} tài liệu`,
        }}
        locale={{
          emptyText: materialsLoading
            ? "Đang tải..."
            : "Chưa có tài liệu nào được tải lên",
        }}
      />

      {/* Create/Edit Material Modal */}
      <Modal
        title={isEditMode ? "Sửa tài liệu" : "Tải lên tài liệu mới"}
        open={createEditModalVisible}
        onCancel={handleCancelCreateEdit}
        footer={null}
        width={600}
      >
        <Form
          form={materialForm}
          layout="vertical"
          onFinish={handleSubmitMaterial}
          initialValues={{ isPublic: false, type: "pdf" }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề tài liệu" }]}
          >
            <Input placeholder="Nhập tiêu đề tài liệu" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea
              rows={3}
              placeholder="Nhập mô tả tài liệu (tùy chọn)"
            />
          </Form.Item>

          <Form.Item
            label={isEditMode ? "Cập nhật tài liệu (tùy chọn)" : "Tải lên tài liệu"}
            required={!isEditMode}
          >
            {isEditMode && selectedMaterial?.filename && (
              <div className="mb-2 p-2 bg-gray-50 rounded">
                <Text type="secondary">Tài liệu hiện tại: </Text>
                <Text strong>{selectedMaterial.filename}</Text>
              </div>
            )}
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Nhấn hoặc kéo tài liệu vào vùng này để {isEditMode ? "thay thế tài liệu hiện tại" : "tải lên"}
              </p>
              <p className="ant-upload-hint">
                Hỗ trợ PDF, PowerPoint, và các định dạng tài liệu khác
                {isEditMode && <br />}
                {isEditMode && "Leave empty to keep current file"}
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item label="Tags">
            <div className="mb-2">
              <Input
                placeholder="Thêm thẻ"
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
            <Switch checkedChildren="Công khai" unCheckedChildren="Riêng tư" />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={handleCancelCreateEdit}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submittingMaterial}
                icon={<UploadOutlined />}
              >
                {isEditMode ? "Cập nhật tài liệu" : "Tải lên tài liệu"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xóa tài liệu"
        open={materialDeleteModalVisible}
        onOk={confirmDeleteMaterial}
        onCancel={() => {
          setMaterialDeleteModalVisible(false);
          setSelectedMaterial(null);
        }}
        confirmLoading={deletingMaterial}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <div className="py-4">
          <ExclamationCircleOutlined className="text-orange-500 mr-2" />
          <Text>
            Bạn có chắc chắn muốn xóa "{selectedMaterial?.title}"? Hành động này không thể được hoàn tác.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default MaterialList;
