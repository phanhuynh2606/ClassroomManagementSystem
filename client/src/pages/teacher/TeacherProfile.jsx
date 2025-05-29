import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  message,
  Upload,
  Avatar,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Popconfirm,
  Tabs,
  Divider,
  Space,
  Typography,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  LaptopOutlined,
  MobileOutlined,
  TabletOutlined,
  DesktopOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  LogoutOutlined,
  LockOutlined,
  EditOutlined,
  SafetyOutlined,
  SettingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import dayjs from "dayjs";
import userAPI from "../../services/api/user.api";
import { authAPI } from "../../services/api";
import { logout, updatePassword } from "../../store/slices/authSlice";

const { Option } = Select;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

const TeacherProfile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      const response = await authAPI.getProfile();
      const resDevices = await authAPI.getUserDevices();
      setUserData(response.data);
      setDevices(resDevices.data);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (userData) {
      form.setFieldsValue({
        ...userData,
        dateOfBirth: userData.dateOfBirth ? dayjs(userData.dateOfBirth) : null,
      });
    }
  }, [userData, form]);

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      const updatedData = {
        ...values,
        dateOfBirth: values.dateOfBirth?.toISOString(),
      };

      await userAPI.updateProfile(updatedData);
      message.success("Profile updated successfully");
    } catch (error) {
      message.error("Failed to update profile");
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
    
    setSelectedFile(file);
    return false; // Prevent automatic upload
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      message.error("Please select an image first");
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("image", selectedFile);

      // Replace with your actual upload API
      const response = await userAPI.updateProfileImage(formData);
      console.log(response)
      if (response.success) {
        setImageUrl(response.imageUrl);
        setUserData({...userData, image: response.imageUrl});
        setPreviewUrl(null);
        setSelectedFile(null);
        message.success("Image uploaded successfully");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      message.error("Failed to upload image");
      console.error("Upload error:", error);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const getDeviceIcon = (device) => {
    if (device?.toLowerCase().includes("mobile")) return <MobileOutlined />;
    if (device?.toLowerCase().includes("tablet")) return <TabletOutlined />;
    if (device?.toLowerCase().includes("laptop")) return <LaptopOutlined />;
    return <DesktopOutlined />;
  };

  const handleLogoutDevice = async (token) => {
    try {
      const response = await authAPI.logoutDevice(token);

      if (response.isCurrentDevice) {
        // If current device is logged out, redirect to login
        message.success("You have been logged out");
        // Dispatch logout action to clear auth state
        dispatch(logout());
        return;
      }
      message.success("Device logged out successfully");
    } catch (error) {
      message.error("Failed to logout device");
      console.error("Error logging out device:", error);
    }
  };

  const deviceColumns = [
    {
      title: "Device",
      dataIndex: "userAgent",
      key: "userAgent",
      width: "30%",
      render: (userAgent, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {getDeviceIcon(record.device)}
          <span>
            {userAgent || "Unknown Device"}
            {record.isCurrentDevice && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                Current Device
              </Tag>
            )}
          </span>
        </div>
      ),
    },
    {
      title: "IP Address",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: "25%",
      render: (ip) => (
        <Tooltip title="IP Address">
          <span>
            <GlobalOutlined style={{ marginRight: 8 }} />
            {ip}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Last Active",
      dataIndex: "createdAt",
      key: "createdAt",
      width: "30%",
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Status",
      dataIndex: "isRevoked",
      key: "isRevoked",
      width: "5%",
      render: (isRevoked, record) => (
        <Tag color={isRevoked ? "red" : "green"}>
          {isRevoked ? "Revoked" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: "10%",
      render: (_, record) =>
        !record.isRevoked && (
          <Popconfirm
            title={
              record.isCurrentDevice
                ? "Logout current device?"
                : "Logout this device?"
            }
            description={
              record.isCurrentDevice
                ? "You will be logged out and redirected to login page"
                : "Are you sure you want to logout this device?"
            }
            onConfirm={() => handleLogoutDevice(record.token)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<LogoutOutlined />}>
              Logout
            </Button>
          </Popconfirm>
        ),
    },
  ];

  return (
    <div style={{ 
      minHeight: "100vh",
      background: "linear-gradient(134deg, #ddd 0%, #764ba2 100%)",
      padding: "24px"
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ 
          textAlign: "center", 
          marginBottom: 24,
          color: "white"
        }}>
          <Title level={1} style={{ color: "white", marginBottom: 8 }}>
            Teacher Profile
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}>
            Manage your profile information and account settings
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* Left Column - Profile Card */}
          <Col xs={24} lg={8}>
            <Card
              style={{
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                border: "none",
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(10px)",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Avatar
                    size={140}
                    src={previewUrl || userData?.image}
                    icon={<UserOutlined />}
                    style={{
                      marginBottom: 10,
                      border: "6px solid #fff",
                      boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                      opacity: previewUrl ? 0.8 : 1,
                    }}
                  />
                  {previewUrl && (
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      background: "rgba(0,0,0,0.6)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}>
                      Preview
                    </div>
                  )}
                  <Upload
                    name="image"
                    showUploadList={false}
                    beforeUpload={handleFileSelect}
                    accept="image/*"
                  >
                    <Button
                      shape="circle"
                      icon={<EditOutlined />}
                      style={{
                        position: "absolute",
                        bottom: 20,
                        right: 10,
                        background: "#4299e1",
                        border: "none",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(66, 153, 225, 0.4)",
                      }}
                    />
                  </Upload>
                </div>
                
                {/* Upload Confirmation */}
                {selectedFile && (
                  <div style={{
                    background: "#f7fafc",
                    borderRadius: "12px",
                    padding: "8px",
                    marginTop: "0px",
                    border: "2px dashed #e2e8f0"
                  }}>
                    <Space>
                      <Button
                        type="primary"
                        loading={uploadLoading}
                        onClick={handleImageUpload}
                        style={{
                          background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "500"
                        }}
                      >
                        Upload Image
                      </Button>
                      <Button
                        onClick={handleCancelUpload}
                        style={{
                          borderRadius: "8px",
                          fontWeight: "500"
                        }}
                      >
                        Cancel
                      </Button>
                    </Space>
                                     </div>
                 )}
              </div>
                
                <Title level={4} style={{ marginBottom: 4, color: "#2d3748" }}>
                  {userData?.fullName}
                </Title>
                <Text style={{ color: "#718096", fontSize: "15px", display: "block", marginBottom: 8 }}>
                  {userData?.email}
                </Text>
                <Tag 
                  color="blue" 
                  style={{ 
                    fontSize: "14px", 
                    padding: "4px 12px",
                    borderRadius: "20px",
                    border: "none"
                  }}
                >
                  {userData?.role?.toUpperCase()}
                </Tag>
              

              <Divider style={{ margin: "24px 0" }} />

              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div style={{ 
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "16px",
                  padding: "15px",
                  color: "white"
                }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Active Sessions</span>}
                        value={devices?.filter((t) => !t.isRevoked).length || 0}
                        prefix={<CheckCircleOutlined style={{ color: "#48bb78" }} />}
                        valueStyle={{ color: "white", fontSize: "22px" }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Account Status</span>}
                        value={userData?.isActive ? "Active" : "Inactive"}
                        prefix={<SafetyOutlined style={{ color: userData?.isActive ? "#48bb78" : "#f56565" }} />}
                        valueStyle={{ 
                          color: userData?.isActive ? "#48bb78" : "#f56565",
                          fontSize: "20px",
                          fontWeight: "600"
                        }}
                      />
                    </Col>
                  </Row>
                </div>

                <div style={{ 
                  background: "rgba(178, 218, 255,0.4)",
                  borderRadius: "12px",
                  padding: "12px"
                }}>
                  <Text strong style={{ color: "#4a5568" }}>Last Login: </Text>
                  <Text style={{ color: "#718096" }}>
                    {userData?.lastLogin
                      ? dayjs(userData.lastLogin).format("DD-MM-YYYY HH:mm")
                      : "Never"}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Right Column - Tabs */}
          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                border: "none",
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(10px)",
              }}
              bodyStyle={{ padding: "0" }}
            >
              <Tabs 
                defaultActiveKey="1" 
                size="large"
                style={{ padding: "0 24px 34px" }}
                tabBarStyle={{ 
                  borderBottom: "2px solid #e2e8f0",
                  marginBottom: "0"
                }}
              >
                <TabPane 
                  tab={
                    <span style={{ fontSize: "16px", fontWeight: "500" }}>
                      <EditOutlined style={{ marginRight: 8 }} />
                      Edit Profile
                    </span>
                  } 
                  key="1"
                >
                  <div style={{ padding: "32px 0" }}>
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleUpdateProfile}
                      initialValues={userData}
                    >
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            name="fullName"
                            label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Full Name</span>}
                            rules={[
                              {
                                required: true,
                                message: "Please input your full name!",
                              },
                            ]}
                          >
                            <Input 
                              prefix={<UserOutlined style={{ color: "#a0aec0" }} />} 
                              size="large"
                              style={{ borderRadius: "12px" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="email"
                            label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Email</span>}
                            rules={[
                              { required: true, message: "Please input your email!" },
                              { type: "email", message: "Please enter a valid email!" },
                            ]}
                          >
                            <Input 
                              prefix={<MailOutlined style={{ color: "#a0aec0" }} />} 
                              disabled 
                              size="large"
                              style={{ borderRadius: "12px", background: "#f7fafc" }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            name="phone"
                            label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Phone Number</span>}
                            rules={[
                              {
                                required: true,
                                message: "Please input your phone number!",
                              },
                            ]}
                          >
                            <Input 
                              prefix={<PhoneOutlined style={{ color: "#a0aec0" }} />} 
                              size="large"
                              style={{ borderRadius: "12px" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item 
                            name="dateOfBirth" 
                            label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Date of Birth</span>}
                          >
                            <DatePicker 
                              style={{ width: "100%", borderRadius: "12px" }} 
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        name="gender"
                        label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Gender</span>}
                        rules={[
                          { required: true, message: "Please select your gender!" },
                        ]}
                      >
                        <Select size="large" style={{ borderRadius: "12px" }}>
                          <Option value="male">Male</Option>
                          <Option value="female">Female</Option>
                          <Option value="other">Other</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item style={{ marginTop: "32px", display: "flex", justifyContent: "center" }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                          size="large"
                          style={{
                            height: "40px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            fontSize: "16px",
                            fontWeight: "600",
                            width: "200px",
                            boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
                          }}
                        >
                          Update Profile
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                </TabPane>

                <TabPane 
                  tab={
                    <span style={{ fontSize: "16px", fontWeight: "500" }}>
                      <LockOutlined style={{ marginRight: 8 }} />
                      Security
                    </span>
                  } 
                  key="2"
                >
                  <div style={{ padding: "32px 0" }}>
                    <Title level={4} style={{ color: "#4a5568", marginBottom: "24px" }}>
                      Change Password
                    </Title>
                    <Form
                      form={passwordForm}
                      layout="vertical"
                      onFinish={async (values) => {
                        try {
                          await dispatch(updatePassword(values)).unwrap();
                          message.success("Password updated successfully");
                          passwordForm.resetFields();
                        } catch (error) {
                          message.error(error.message || "Failed to update password");
                        }
                      }}
                    >
                      <Form.Item
                        name="currentPassword"
                        label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Current Password</span>}
                        rules={[{ required: true, message: "Please input your current password!" }]}
                      >
                        <Input.Password 
                          prefix={<LockOutlined style={{ color: "#a0aec0" }} />} 
                          size="large" 
                          style={{ borderRadius: "12px" }}
                          placeholder="Enter current password"
                        />
                      </Form.Item>

                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            name="newPassword"
                            label={<span style={{ fontWeight: 600, color: "#4a5568" }}>New Password</span>}
                            rules={[
                              { required: true, message: "Please input your new password!" },
                              { min: 6, message: "Password must be at least 6 characters!" }
                            ]}
                          >
                            <Input.Password 
                              prefix={<LockOutlined style={{ color: "#a0aec0" }} />} 
                              size="large" 
                              style={{ borderRadius: "12px" }}
                              placeholder="Enter new password"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="confirmPassword"
                            label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Confirm New Password</span>}
                            dependencies={["newPassword"]}
                            rules={[
                              { required: true, message: "Please confirm your new password!" },
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  if (!value || getFieldValue("newPassword") === value) {
                                    return Promise.resolve();
                                  }
                                  return Promise.reject(new Error("The two passwords do not match!"));
                                },
                              }),
                            ]}
                          >
                            <Input.Password 
                              prefix={<LockOutlined style={{ color: "#a0aec0" }} />} 
                              size="large" 
                              style={{ borderRadius: "12px" }}
                              placeholder="Confirm new password"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item style={{ marginTop: "32px" }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          size="large"
                          style={{
                            height: "50px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                            border: "none",
                            fontSize: "16px",
                            fontWeight: "600",
                            width: "200px",
                            boxShadow: "0 8px 25px rgba(245, 87, 108, 0.3)",
                          }}
                        >
                          Update Password
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                </TabPane>

                <TabPane 
                  tab={
                    <span style={{ fontSize: "16px", fontWeight: "500" }}>
                      <InfoCircleOutlined style={{ marginRight: 8 }} />
                      Account Info
                    </span>
                  } 
                  key="3"
                >
                  <div style={{ padding: "32px 0" }}>
                    <Row gutter={[32, 24]}>
                      <Col span={12}>
                        <Card 
                          size="small"
                          style={{ 
                            borderRadius: "16px",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            color: "white"
                          }}
                          bodyStyle={{ padding: "24px" }}
                        >
                          <Space direction="vertical" size="small">
                            <Text style={{ color: "rgba(255,255,255,0.8)" }}>Role</Text>
                            <Title level={4} style={{ color: "white", margin: 0 }}>
                              {userData?.role?.toUpperCase()}
                            </Title>
                          </Space>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card 
                          size="small"
                          style={{ 
                            borderRadius: "16px",
                            background: userData?.isActive 
                              ? "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                              : "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                            border: "none",
                            color: "white"
                          }}
                          bodyStyle={{ padding: "24px" }}
                        >
                          <Space direction="vertical" size="small">
                            <Text style={{ color: "rgba(255,255,255,0.8)" }}>Account Status</Text>
                            <Title level={4} style={{ color: "white", margin: 0 }}>
                              {userData?.isActive ? "Active" : "Inactive"}
                            </Title>
                          </Space>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card 
                          size="small"
                          style={{ 
                            borderRadius: "16px",
                            background: userData?.verified 
                              ? "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
                              : "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                            border: "none"
                          }}
                          bodyStyle={{ padding: "24px" }}
                        >
                          <Space direction="vertical" size="small">
                            <Text style={{ color: "#4a5568" }}>Verification Status</Text>
                            <Title level={4} style={{ color: "#2d3748", margin: 0 }}>
                              {userData?.verified ? "Verified" : "Pending"}
                            </Title>
                          </Space>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card 
                          size="small"
                          style={{ 
                            borderRadius: "16px",
                            background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                            border: "none"
                          }}
                          bodyStyle={{ padding: "24px" }}
                        >
                          <Space direction="vertical" size="small">
                            <Text style={{ color: "#4a5568" }}>Member Since</Text>
                            <Title level={4} style={{ color: "#2d3748", margin: 0 }}>
                              {userData?.createdAt 
                                ? dayjs(userData.createdAt).format("DD-MM-YYYY")
                                : "Unknown"}
                            </Title>
                          </Space>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                </TabPane>

                <TabPane 
                  tab={
                    <span style={{ fontSize: "16px", fontWeight: "500" }}>
                      <SettingOutlined style={{ marginRight: 8 }} />
                      Devices
                    </span>
                  } 
                  key="4"
                >
                  <div style={{ padding: "32px 0" }}>
                    <Title level={4} style={{ color: "#4a5568", marginBottom: "24px" }}>
                      Active Devices & Sessions
                    </Title>
                    <Table
                      columns={deviceColumns}
                      dataSource={devices || []}
                      rowKey="token"
                      pagination={false}
                      style={{ 
                        background: "transparent",
                      }}
                      className="custom-table"
                      tableLayout="auto"
                      size="large"
                      scroll={{ y: true }}
                    />
                  </div>
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default TeacherProfile;
