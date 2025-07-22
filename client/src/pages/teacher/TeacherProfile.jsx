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
      message.success("Hồ sơ đã được cập nhật thành công");
    } catch (error) {
      message.error("Không thể cập nhật hồ sơ");
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
      message.error("Vui lòng chọn một hình ảnh");
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("image", selectedFile);

      // Replace with your actual upload API
      const response = await userAPI.updateProfileImage(formData);
      if (response.success) {
        setImageUrl(response.imageUrl);
        setUserData({...userData, image: response.imageUrl});
        setPreviewUrl(null);
        setSelectedFile(null);
        message.success("Hình ảnh đã được tải lên thành công");
      } else {
        throw new Error("Tải lên thất bại");
      }
    } catch (error) {
      message.error("Không thể tải lên hình ảnh");
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
        message.success("Bạn đã đăng xuất");
        // Dispatch logout action to clear auth state
        dispatch(logout());
        return;
      }
      message.success("Thiết bị đã đăng xuất thành công");
    } catch (error) {
      message.error("Không thể đăng xuất thiết bị");
      console.error("Error logging out device:", error);
    }
  };

  const deviceColumns = [
    {
      title: "Thiết bị",
      dataIndex: "userAgent",
      key: "userAgent",
      width: "30%",
      render: (userAgent, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {getDeviceIcon(record.device)}
          <span>
            {userAgent || "Thiết bị không xác định"}
            {record.isCurrentDevice && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                Thiết bị hiện tại
              </Tag>
            )}
          </span>
        </div>
      ),
    },
    {
      title: "Địa chỉ IP",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: "25%",
      render: (ip) => (
        <Tooltip title="Địa chỉ IP">
          <span>
            <GlobalOutlined style={{ marginRight: 8 }} />
            {ip}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Hoạt động gần nhất",
      dataIndex: "createdAt",
      key: "createdAt",
      width: "30%",
      render: (date) => dayjs(date).format("DD-MM-YYYY HH:mm"),
    },
    {
      title: "Trạng thái",
      dataIndex: "isRevoked",
      key: "isRevoked",
      width: "5%",
      render: (isRevoked, record) => (
        <Tag color={isRevoked ? "red" : "green"}>
          {isRevoked ? "Đã thu hồi" : "Đang hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: "10%",
      render: (_, record) =>
        !record.isRevoked && (
          <Popconfirm
            title={
              record.isCurrentDevice
                ? "Bạn có chắc chắn muốn đăng xuất thiết bị hiện tại?"
                : "Bạn có chắc chắn muốn đăng xuất thiết bị này?"
            }
            description={
              record.isCurrentDevice
                ? "Bạn sẽ đăng xuất và được chuyển hướng đến trang đăng nhập"
                : "Bạn có chắc chắn muốn đăng xuất thiết bị này?"
            }
            onConfirm={() => handleLogoutDevice(record.token)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="text" danger icon={<LogoutOutlined />}>
              Đăng xuất
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
            Hồ sơ giáo viên
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}>
            Quản lý thông tin hồ sơ và cài đặt tài khoản
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
                      Xem trước
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
                        Tải ảnh lên
                      </Button>
                      <Button
                        onClick={handleCancelUpload}
                        style={{
                          borderRadius: "8px",
                          fontWeight: "500"
                        }}
                      >
                        Hủy
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
                        title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Phiên hoạt động</span>}
                        value={devices?.filter((t) => !t.isRevoked).length || 0}
                        prefix={<CheckCircleOutlined style={{ color: "#48bb78" }} />}
                        valueStyle={{ color: "white", fontSize: "22px" }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Trạng thái tài khoản</span>}
                        value={userData?.isActive ? "Đang hoạt động" : "Không hoạt động"}
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
                  <Text strong style={{ color: "#4a5568" }}>Đăng nhập gần đây: </Text>
                  <Text style={{ color: "#718096" }}>
                    {userData?.lastLogin
                      ? dayjs(userData.lastLogin).format("DD-MM-YYYY HH:mm")
                      : "Không từng đăng nhập"}
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
                      Chỉnh sửa hồ sơ
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
                            label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Họ và tên</span>}
                            rules={[
                              {
                                required: true,
                                message: "Vui lòng nhập họ và tên!",
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
                              { required: true, message: "Vui lòng nhập email!" },
                              { type: "email", message: "Vui lòng nhập email hợp lệ!" },
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
                            label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Số điện thoại</span>}
                            rules={[
                              { required: true, message: "Vui lòng nhập số điện thoại!" },
                              { pattern: /^(0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])[0-9]{7}$/, message: "Số điện thoại phải có 10 số, bắt đầu bằng 0 và đúng đầu số di động Việt Nam!" }
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
                            label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Ngày sinh</span>}
                            rules={[
                              { required: true, message: "Vui lòng chọn ngày sinh!" },
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  if (!value) return Promise.resolve();
                                  const today = new Date();
                                  const dob = value.toDate ? value.toDate() : value;
                                  const age = today.getFullYear() - dob.getFullYear() - (today < new Date(dob.setFullYear(today.getFullYear())));
                                  if (age >= 12) return Promise.resolve();
                                  return Promise.reject(new Error("Bạn phải từ 12 tuổi trở lên!"));
                                }
                              })
                            ]}
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
                        label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Giới tính</span>}
                        rules={[
                          { required: true, message: "Vui lòng chọn giới tính!" },
                        ]}
                      >
                        <Select size="large" style={{ borderRadius: "12px" }}>
                          <Option value="male">Nam</Option>
                          <Option value="female">Nữ</Option>
                          <Option value="other">Khác</Option>
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
                          Cập nhật hồ sơ
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                </TabPane>

                <TabPane 
                  tab={
                    <span style={{ fontSize: "16px", fontWeight: "500" }}>
                      <LockOutlined style={{ marginRight: 8 }} />
                      Bảo mật
                    </span>
                  } 
                  key="2"
                >
                  <div style={{ padding: "32px 0" }}>
                    <Title level={4} style={{ color: "#4a5568", marginBottom: "24px" }}>
                      Đổi mật khẩu
                    </Title>
                    <Form
                      form={passwordForm}
                      layout="vertical"
                      onFinish={async (values) => {
                        try {
                          await dispatch(updatePassword(values)).unwrap();
                          message.success("Mật khẩu đã được cập nhật thành công");
                          passwordForm.resetFields();
                        } catch (error) {
                          message.error(error.message || "Không thể cập nhật mật khẩu");
                        }
                      }}
                    >
                      <Form.Item
                        name="currentPassword"
                        label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Mật khẩu hiện tại</span>}
                        rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại!" }]}
                      >
                        <Input.Password 
                          prefix={<LockOutlined style={{ color: "#a0aec0" }} />} 
                          size="large" 
                          style={{ borderRadius: "12px" }}
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                      </Form.Item>

                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            name="newPassword"
                            label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Mật khẩu mới</span>}
                            rules={[
                              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
                              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" }
                            ]}
                          >
                            <Input.Password 
                              prefix={<LockOutlined style={{ color: "#a0aec0" }} />} 
                              size="large" 
                              style={{ borderRadius: "12px" }}
                              placeholder="Nhập mật khẩu mới"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="confirmPassword"
                            label={<span style={{ fontWeight: 600, color: "#4a5568" }}>Xác nhận mật khẩu mới</span>}
                            dependencies={["newPassword"]}
                            rules={[
                              { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  if (!value || getFieldValue("newPassword") === value) {
                                    return Promise.resolve();
                                  }
                                  return Promise.reject(new Error("Mật khẩu không khớp!"));
                                },
                              }),
                            ]}
                          >
                            <Input.Password 
                              prefix={<LockOutlined style={{ color: "#a0aec0" }} />} 
                              size="large" 
                              style={{ borderRadius: "12px" }}
                              placeholder="Xác nhận mật khẩu mới"
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
                          Cập nhật mật khẩu
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                </TabPane>

                <TabPane 
                  tab={
                    <span style={{ fontSize: "16px", fontWeight: "500" }}>
                      <InfoCircleOutlined style={{ marginRight: 8 }} />
                      Thông tin tài khoản
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
                            <Text style={{ color: "rgba(255,255,255,0.8)" }}>Vai trò</Text>
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
                            <Text style={{ color: "rgba(255,255,255,0.8)" }}>Trạng thái tài khoản</Text>
                            <Title level={4} style={{ color: "white", margin: 0 }}>
                              {userData?.isActive ? "Đang hoạt động" : "Không hoạt động"}
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
                            <Text style={{ color: "#4a5568" }}>Trạng thái xác thực</Text>
                            <Title level={4} style={{ color: "#2d3748", margin: 0 }}>
                              {userData?.verified ? "Đã xác thực" : "Chờ xác thực"}
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
                            <Text style={{ color: "#4a5568" }}>Thành viên từ</Text>
                            <Title level={4} style={{ color: "#2d3748", margin: 0 }}>
                              {userData?.createdAt 
                                ? dayjs(userData.createdAt).format("DD-MM-YYYY")
                                : "Không xác định"}
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
                      Thiết bị
                    </span>
                  } 
                  key="4"
                >
                  <div style={{ padding: "32px 0" }}>
                    <Title level={4} style={{ color: "#4a5568", marginBottom: "24px" }}>
                      Thiết bị & phiên hoạt động
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
