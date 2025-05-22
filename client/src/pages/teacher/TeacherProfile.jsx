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
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import dayjs from "dayjs";
import userAPI from "../../services/api/user.api";
import { authAPI } from "../../services/api";
import { logout } from "../../store/slices/authSlice";

const { Option } = Select;

const TeacherProfile = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(user?.image || "");
  const [userData, setUserData] = useState(null);
  const [devices, setDevices] = useState([]);
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

      await userAPI.updateUser(updatedData);
      message.success("Profile updated successfully");
    } catch (error) {
      message.error("Failed to update profile");
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (info) => {
    if (info.file.status === "done") {
      setImageUrl(info.file.response.url);
      message.success("Image uploaded successfully");
    } else if (info.file.status === "error") {
      message.error("Failed to upload image");
    }
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
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Status",
      dataIndex: "isRevoked",
      key: "isRevoked",
      render: (isRevoked, record) => (
        <Tag color={isRevoked ? "red" : "green"}>
          {isRevoked ? "Revoked" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
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
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
      <Row gutter={[24, 24]}>
        {/* Left Column - Profile Card */}
        <Col xs={24} md={8}>
          <Card
            style={{
              borderRadius: "15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Avatar
                size={120}
                src={imageUrl}
                icon={<UserOutlined />}
                style={{
                  marginBottom: 16,
                  border: "4px solid #f0f0f0",
                }}
              />
              <h2 style={{ marginBottom: 8 }}>{userData?.fullName}</h2>
              <p style={{ color: "#666", marginBottom: 16 }}>
                {userData?.email}
              </p>
              <Upload
                name="image"
                showUploadList={false}
                action="/api/upload"
                onChange={handleImageUpload}
              >
                <Button
                  icon={<UploadOutlined />}
                  style={{
                    borderRadius: "20px",
                    background: "#f0f0f0",
                    border: "none",
                  }}
                >
                  Change Avatar
                </Button>
              </Upload>
            </div>

            <div style={{ marginTop: 24 }}>
              <Statistic
                title="Active Sessions"
                value={devices?.filter((t) => !t.isRevoked).length || 0}
                prefix={<CheckCircleOutlined />}
                style={{ marginBottom: 16 }}
              />
              <Statistic
                title="Last Login"
                value={
                  userData?.lastLogin
                    ? dayjs(userData.lastLogin).format("MMM DD, YYYY")
                    : "Never"
                }
                prefix={<ClockCircleOutlined />}
              />
            </div>
          </Card>
        </Col>

        {/* Right Column - Forms and Info */}
        <Col xs={24} md={16}>
          <Card
            title="Edit Profile"
            style={{
              marginBottom: 24,
              borderRadius: "15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={userData}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="fullName"
                    label="Full Name"
                    rules={[
                      {
                        required: true,
                        message: "Please input your full name!",
                      },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Please input your email!" },
                      { type: "email", message: "Please enter a valid email!" },
                    ]}
                  >
                    <Input prefix={<MailOutlined />} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[
                      {
                        required: true,
                        message: "Please input your phone number!",
                      },
                    ]}
                  >
                    <Input prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="dateOfBirth" label="Date of Birth">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="gender"
                label="Gender"
                rules={[
                  { required: true, message: "Please select your gender!" },
                ]}
              >
                <Select>
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    height: "45px",
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #4299e1 0%, #2b6cb0 100%)",
                    border: "none",
                    fontSize: "1rem",
                    fontWeight: "500",
                  }}
                >
                  Update Profile
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card
            title="Account Information"
            style={{
              marginBottom: 24,
              borderRadius: "15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <strong>Role:</strong>{" "}
                  <span
                    style={{
                      color: "#4299e1",
                      fontWeight: "500",
                    }}
                  >
                    {userData?.role?.toUpperCase()}
                  </span>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Account Status:</strong>{" "}
                  <span
                    style={{
                      color: userData?.isActive ? "#48bb78" : "#f56565",
                      fontWeight: "500",
                    }}
                  >
                    {userData?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <strong>Verification Status:</strong>{" "}
                  <span
                    style={{
                      color: userData?.verified ? "#48bb78" : "#ed8936",
                      fontWeight: "500",
                    }}
                  >
                    {userData?.verified ? "Verified" : "Pending Verification"}
                  </span>
                </div>
                <div>
                  <strong>Last Login:</strong>{" "}
                  <span style={{ color: "#718096" }}>
                    {userData?.lastLogin
                      ? dayjs(userData.lastLogin).format("YYYY-MM-DD HH:mm")
                      : "Never"}
                  </span>
                </div>
              </Col>
            </Row>
          </Card>

          <Card
            title="Active Devices"
            style={{
              borderRadius: "15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Table
              columns={deviceColumns}
              dataSource={devices || []}
              rowKey="token"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherProfile;
