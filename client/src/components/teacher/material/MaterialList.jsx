import React, { useState, useEffect } from 'react';
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
    Space
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    PlusOutlined,
    ExclamationCircleOutlined,
    InboxOutlined,
    UploadOutlined,
    DownloadOutlined
} from '@ant-design/icons';
import Dragger from 'antd/es/upload/Dragger';
import TextArea from 'antd/es/input/TextArea';
import { materialAPI } from '../../../services/api';

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const MaterialList = ({ classId, classData }) => {
    const [materialsData, setMaterialsData] = useState([]);
    const [materialsLoading, setMaterialsLoading] = useState(false);
    const [materialSearchText, setMaterialSearchText] = useState('');
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
    const [inputTag, setInputTag] = useState('');

    useEffect(() => {
        fetchMaterialsData();
    }, []);

    const fetchMaterialsData = async () => {
        setMaterialsLoading(true);
        try {
            const response = await materialAPI.getMaterials(classId); 
            setMaterialsData(response.data.materials || [] );
        } catch (error) {
            console.error('Error fetching materials:', error);
            message.error('Failed to fetch materials');
        } finally {
            setMaterialsLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getTypeIcon = (type) => {
        const icons = {
            pdf: '📄',
            slide: '📊',
            video: '🎥',
            other: '📁'
        };
        return icons[type] || '📁';
    };

    const getTypeBadgeColor = (type) => {
        const colors = {
            pdf: 'red',
            slide: 'blue',
            video: 'green',
            other: 'default'
        };
        return colors[type] || 'default';
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
            isPublic: material.isPublic
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
            // await classroomAPI.deleteMaterial(selectedMaterial._id);
            message.success('Material deleted successfully');
            setMaterialDeleteModalVisible(false);
            setSelectedMaterial(null);
            fetchMaterialsData(); // Refresh data
        } catch (error) {
            message.error('Failed to delete material');
        } finally {
            setDeletingMaterial(false);
        }
    };

    const handleDownloadMaterial = async (material) => {
        try {
            // await classroomAPI.downloadMaterial(material._id);
            message.success('Download started');
            // Update download count
            setMaterialsData(prev =>
                prev.map(m =>
                    m._id === material._id
                        ? { ...m, downloadCount: m.downloadCount + 1 }
                        : m
                )
            );
        } catch (error) {
            message.error('Download failed');
        }
    };

    const handleSubmitMaterial = async (values) => {
        if (!isEditMode && fileList.length === 0) {
            message.error('Please upload a file');
            return;
        }

        setSubmittingMaterial(true);
        try {
            const formData = new FormData();
            formData.append('title', values.title);
            formData.append('description', values.description || '');
            formData.append('isPublic', values.isPublic);
            formData.append('tags', JSON.stringify(tags));
            formData.append('classroom', classId); 
            if (fileList.length > 0) {
                const file = fileList[0].originFileObj || fileList[0].file || fileList[0]; 
                formData.append('file', file);
            } 
            if (isEditMode) {
                await materialAPI.updateMaterial(selectedMaterial._id, formData);
                message.success('Material updated successfully');
            } else {
                const respone = await materialAPI.createMaterial(classId, formData); 
                message.success('Material uploaded successfully');
            }

            setCreateEditModalVisible(false);
            fetchMaterialsData(); // Refresh data
        } catch (error) {
            console.error('Error submitting material:', error);
            message.error(isEditMode ? 'Failed to update material' : 'Failed to upload material');
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
            setInputTag('');
        }
    };

    const handleTagRemove = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const uploadProps = {
        name: 'file',
        multiple: false,
        fileList: fileList,
        beforeUpload: (file) => {
            setFileList([file]);
            return false; // Prevent auto upload
        },
        onRemove: () => {
            setFileList([]);
        }
    };

    const materialColumns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            filteredValue: materialSearchText ? [materialSearchText] : null,
            onFilter: (value, record) =>
                record.title?.toLowerCase().includes(value.toLowerCase()) ||
                record.description?.toLowerCase().includes(value.toLowerCase()) ||
                record.tags?.some(tag => tag.toLowerCase().includes(value.toLowerCase())),
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
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type) => (
                <Badge
                    color={getTypeBadgeColor(type)}
                    text={type.toUpperCase()}
                />
            ),
        },
        {
            title: 'File Size',
            dataIndex: 'fileSize',
            key: 'fileSize',
            width: 100,
            render: (size) => formatFileSize(size),
        },
        {
            title: 'Downloads',
            dataIndex: 'downloadCount',
            key: 'downloadCount',
            width: 100,
            sorter: (a, b) => a.downloadCount - b.downloadCount,
            render: (count) => (
                <span className="text-blue-600 font-medium">{count}</span>
            ),
        },
        {
            title: 'Views',
            dataIndex: 'viewCount',
            key: 'viewCount',
            width: 100,
            sorter: (a, b) => a.viewCount - b.viewCount,
            render: (count) => (
                <span className="text-green-600 font-medium">{count}</span>
            ),
        },
        {
            title: 'Visibility',
            dataIndex: 'isPublic',
            key: 'isPublic',
            width: 100,
            render: (isPublic) => (
                <Badge
                    color={isPublic ? 'green' : 'orange'}
                    text={isPublic ? 'Public' : 'Private'}
                />
            ),
        },
        {
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            width: 150,
            render: (tags) => (
                <div className="flex flex-wrap gap-1">
                    {tags?.slice(0, 2).map(tag => (
                        <Badge key={tag} color="blue" text={tag} />
                    ))}
                    {tags?.length > 2 && (
                        <Tooltip title={tags.slice(2).join(', ')}>
                            <Badge color="gray" text={`+${tags.length - 2}`} />
                        </Tooltip>
                    )}
                </div>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
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
                    placeholder="Search materials, descriptions, tags..."
                    value={materialSearchText}
                    onChange={(e) => setMaterialSearchText(e.target.value)}
                    onSearch={setMaterialSearchText}
                    style={{ width: 400 }}
                    prefix={<SearchOutlined />}
                />
                <div className="flex items-center gap-4">
                    <Text type="secondary">
                        Total: {materialsData.length} materials
                    </Text>
                    {classData?.status === 'active' && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreateMaterial}
                        >
                            Upload Material
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
                        `${range[0]}-${range[1]} of ${total} materials`,
                }}
                locale={{
                    emptyText: materialsLoading ? 'Loading...' : 'No materials uploaded yet'
                }}
            />

            {/* Create/Edit Material Modal */}
            <Modal
                title={isEditMode ? 'Edit Material' : 'Upload New Material'}
                open={createEditModalVisible}
                onCancel={handleCancelCreateEdit}
                footer={null}
                width={600}
            >
                <Form
                    form={materialForm}
                    layout="vertical"
                    onFinish={handleSubmitMaterial}
                    initialValues={{ isPublic: false, type: 'pdf' }}
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Please enter material title' }]}
                    >
                        <Input placeholder="Enter material title" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Enter material description (optional)"
                        />
                    </Form.Item> 

                    {!isEditMode && (
                        <Form.Item
                            label="Upload File"
                            required
                        >
                            <Dragger {...uploadProps}>
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                <p className="ant-upload-hint">
                                    Support for PDF, PowerPoint, Videos and other document formats
                                </p>
                            </Dragger>
                        </Form.Item>
                    )}

                    <Form.Item label="Tags">
                        <div className="mb-2">
                            <Input
                                placeholder="Add tag"
                                value={inputTag}
                                onChange={(e) => setInputTag(e.target.value)}
                                onPressEnter={handleTagAdd}
                                style={{ width: 'calc(100% - 80px)', marginRight: 8 }}
                            />
                            <Button onClick={handleTagAdd}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {tags.map(tag => (
                                <Tag
                                    key={tag}
                                    closable
                                    onClose={() => handleTagRemove(tag)}
                                >
                                    {tag}
                                </Tag>
                            ))}
                        </div>
                    </Form.Item>

                    <Form.Item
                        name="isPublic"
                        label="Visibility"
                        valuePropName="checked"
                    >
                        <Switch
                            checkedChildren="Public"
                            unCheckedChildren="Private"
                        />
                    </Form.Item>

                    <Form.Item className="mb-0 text-right">
                        <Space>
                            <Button onClick={handleCancelCreateEdit}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submittingMaterial}
                                icon={<UploadOutlined />}
                            >
                                {isEditMode ? 'Update Material' : 'Upload Material'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                title="Delete Material"
                open={materialDeleteModalVisible}
                onOk={confirmDeleteMaterial}
                onCancel={() => {
                    setMaterialDeleteModalVisible(false);
                    setSelectedMaterial(null);
                }}
                confirmLoading={deletingMaterial}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
            >
                <div className="py-4">
                    <ExclamationCircleOutlined className="text-orange-500 mr-2" />
                    <Text>
                        Are you sure you want to delete "{selectedMaterial?.title}"?
                        This action cannot be undone.
                    </Text>
                </div>
            </Modal>
        </div>
    );
};

export default MaterialList;