import React, { useState, memo } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Switch, 
  Button, 
  Typography, 
  Space, 
  Select,
  TimePicker,
  Radio,
  Divider,
  message,
  Tabs,
  Avatar,
  Upload,
  Row,
  Col,
  Slider
} from 'antd';
import {
  UserOutlined,
  BellOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  SettingOutlined,
  SaveOutlined,
  CameraOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const TeacherSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('preferences');

  // Mock user data
  const [userSettings, setUserSettings] = useState({
    preferences: {
      language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
      theme: 'light',
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      assignmentReminders: true,
      autoGrading: false,
      classroomUpdates: true
    },
    teaching: {
      defaultGradingScale: 100,
      lateSubmissionDeduction: 10,
      allowLateSubmissions: true,
      maxLateHours: 48,
      autoPublishGrades: false,
      defaultAssignmentPoints: 100,
      requireSubmissionComments: false,
      enablePeerReview: false
    },
    privacy: {
      profileVisibility: 'students',
      showEmail: true,
      showPhone: false,
      allowMessages: true,
      shareProgress: true
    }
  });

  const handleSave = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUserSettings(prev => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], ...values }
      }));
      message.success('Settings saved successfully');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (file) => {
    // Simulate avatar upload
    message.success('Avatar updated successfully');
    return false;
  };

  

  const PreferencesSettings = () => (
    <Form
      layout="vertical"
      initialValues={userSettings.preferences}
      onFinish={handleSave}
    >
      <Title level={4}>Giao diện & Ngôn ngữ</Title>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item name="language" label="Ngôn ngữ">
            <Select>
              <Option value="vi">Tiếng Việt</Option>
              <Option value="en">English</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="timezone" label="Múi giờ">
            <Select>
              <Option value="Asia/Ho_Chi_Minh">GMT+7 (Việt Nam)</Option>
              <Option value="Asia/Tokyo">GMT+9 (Tokyo)</Option>
              <Option value="America/New_York">GMT-5 (New York)</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="theme" label="Giao diện">
        <Radio.Group>
          <Radio value="light">Sáng</Radio>
          <Radio value="dark">Tối</Radio>
          <Radio value="auto">Tự động</Radio>
        </Radio.Group>
      </Form.Item>

      <Divider />

      <Title level={4}>Thông báo</Title>
      <Form.Item name="emailNotifications" valuePropName="checked">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Email thông báo</Text>
            <br />
            <Text type="secondary">Nhận thông báo qua email</Text>
          </div>
          <Switch />
        </div>
      </Form.Item>

      <Form.Item name="pushNotifications" valuePropName="checked">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Thông báo đẩy</Text>
            <br />
            <Text type="secondary">Thông báo trên trình duyệt</Text>
          </div>
          <Switch />
        </div>
      </Form.Item>

      <Form.Item name="weeklyDigest" valuePropName="checked">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Báo cáo tuần</Text>
            <br />
            <Text type="secondary">Tổng hợp hoạt động hàng tuần</Text>
          </div>
          <Switch />
        </div>
      </Form.Item>

      <Form.Item name="assignmentReminders" valuePropName="checked">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Nhắc nhở bài tập</Text>
            <br />
            <Text type="secondary">Thông báo về deadline bài tập</Text>
          </div>
          <Switch />
        </div>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
          Lưu cài đặt
        </Button>
      </Form.Item>
    </Form>
  );

  const TeachingSettings = () => (
    <Form
      layout="vertical"
      initialValues={userSettings.teaching}
      onFinish={handleSave}
    >
      <Title level={4}>Chấm điểm</Title>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item name="defaultGradingScale" label="Thang điểm mặc định">
            <Select>
              <Option value={100}>100 điểm</Option>
              <Option value={10}>10 điểm</Option>
              <Option value={4}>4.0 GPA</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="defaultAssignmentPoints" label="Điểm mặc định cho bài tập">
            <Input type="number" min={1} max={1000} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="autoPublishGrades" valuePropName="checked">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Tự động công bố điểm</Text>
            <br />
            <Text type="secondary">Điểm được hiển thị ngay sau khi chấm</Text>
          </div>
          <Switch />
        </div>
      </Form.Item>

      <Divider />

      <Title level={4}>Bài tập nộp muộn</Title>
      <Form.Item name="allowLateSubmissions" valuePropName="checked">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Cho phép nộp muộn</Text>
            <br />
            <Text type="secondary">Học sinh có thể nộp bài sau deadline</Text>
          </div>
          <Switch />
        </div>
      </Form.Item>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item name="maxLateHours" label="Thời gian cho phép nộp muộn (giờ)">
            <Slider
              min={0}
              max={168}
              marks={{
                0: '0h',
                24: '1 ngày',
                48: '2 ngày', 
                72: '3 ngày',
                168: '1 tuần'
              }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="lateSubmissionDeduction" label="Trừ điểm nộp muộn (%)">
            <Slider
              min={0}
              max={50}
              marks={{
                0: '0%',
                10: '10%',
                20: '20%',
                30: '30%',
                50: '50%'
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Title level={4}>Tùy chọn khác</Title>
      <Form.Item name="requireSubmissionComments" valuePropName="checked">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Bắt buộc ghi chú khi nộp bài</Text>
            <br />
            <Text type="secondary">Học sinh phải viết comment khi nộp bài</Text>
          </div>
          <Switch />
        </div>
      </Form.Item>

      <Form.Item name="enablePeerReview" valuePropName="checked">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Cho phép đánh giá lẫn nhau</Text>
            <br />
            <Text type="secondary">Học sinh có thể đánh giá bài của nhau</Text>
          </div>
          <Switch />
        </div>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
          Lưu cài đặt
        </Button>
      </Form.Item>
    </Form>
  );

  const PrivacySettings = () => (
    <Form
      layout="vertical"
      initialValues={userSettings.privacy}
      onFinish={handleSave}
    >
      <Title level={4}>Quyền riêng tư hồ sơ</Title>
      
      <Form.Item name="profileVisibility" label="Ai có thể xem hồ sơ của bạn?">
        <Radio.Group>
          <Radio value="public">Công khai</Radio>
          <Radio value="students">Chỉ học sinh</Radio>
          <Radio value="teachers">Chỉ giáo viên</Radio>
          <Radio value="private">Riêng tư</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item name="showEmail" valuePropName="checked">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Hiển thị email</Text>
            <br />
            <Text type="secondary">Cho phép học sinh xem email của bạn</Text>
          </div>
          <Switch />
        </div>
      </Form.Item>

      <Form.Item name="showPhone" valuePropName="checked">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Hiển thị số điện thoại</Text>
            <br />
            <Text type="secondary">Cho phép học sinh xem số điện thoại</Text>
          </div>
          <Switch />
        </div>
      </Form.Item>

      <Divider />

      <Title level={4}>Tương tác</Title>
      <Form.Item name="allowMessages" valuePropName="checked">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Cho phép nhắn tin</Text>
            <br />
            <Text type="secondary">Học sinh có thể gửi tin nhắn riêng</Text>
          </div>
          <Switch />
        </div>
      </Form.Item>

      <Form.Item name="shareProgress" valuePropName="checked">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Chia sẻ tiến độ lớp học</Text>
            <br />
            <Text type="secondary">Hiển thị thống kê tiến độ chung với học sinh</Text>
          </div>
          <Switch />
        </div>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
          Lưu cài đặt
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">Cài đặt</Title>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>

        <TabPane 
          tab={
            <span>
              <SettingOutlined />
              Tùy chọn
            </span>
          } 
          key="preferences"
        >
          <Card>
            <PreferencesSettings />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <BellOutlined />
              Giảng dạy
            </span>
          } 
          key="teaching"
        >
          <Card>
            <TeachingSettings />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <LockOutlined />
              Quyền riêng tư
            </span>
          } 
          key="privacy"
        >
          <Card>
            <PrivacySettings />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default memo(TeacherSettings); 