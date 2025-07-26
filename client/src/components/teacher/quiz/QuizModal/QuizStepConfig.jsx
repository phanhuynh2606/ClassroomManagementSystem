import React from 'react';
import { Card, Row, Col, Form, DatePicker, Checkbox, Typography, Alert } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;

const QuizStepConfig = () => (
  <div>
    <Title level={4}>⚙️ Cấu hình bài thi</Title>
    
    <Row gutter={16}>
      <Col span={12}>
        <Card title="⏰ Thời gian" size="small" className="mb-4">
          <Form.Item 
            name="startTime" 
            require
            label="Thời gian bắt đầu"
            rules={[
              { required: true, message: 'Vui lòng chọn thời gian bắt đầu' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  
                  const now = dayjs();
                  if (value.isBefore(now)) {
                    return Promise.reject(new Error('Thời gian bắt đầu không thể trong quá khứ'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder="Chọn thời gian bắt đầu"
              showToday={false}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          
          <Form.Item 
            name="endTime" 
            label="Thời gian kết thúc"
            dependencies={['startTime']}
            rules={[
              {
                required: true,
                message: 'Vui lòng chọn thời gian kết thúc'
              },
              ({ getFieldValue }) => ({
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  
                  const startTime = getFieldValue('startTime');
                  if (startTime && value.isBefore(startTime)) {
                    return Promise.reject(new Error('Thời gian kết thúc phải sau thời gian bắt đầu'));
                  }
                  
                  const now = dayjs();
                  if (value.isBefore(now)) {
                    return Promise.reject(new Error('Thời gian kết thúc không thể trong quá khứ'));
                  }
                  
                  return Promise.resolve();
                }
              })
            ]}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder="Chọn thời gian kết thúc"
              showToday={false}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          
          <Alert
            message="Lưu ý"
            description="Nếu không đặt thời gian, bài thi sẽ luôn khả dụng"
            type="info"
            showIcon
            size="small"
          />
        </Card>
      </Col>
      
      <Col span={12}>
        <Card title="🔒 Quyền truy cập" size="small" className="mb-4">
          <Form.Item name="showResults" valuePropName="checked">
            <Checkbox>Hiện kết quả sau khi làm xong</Checkbox>
          </Form.Item>
          
          <Form.Item name="allowReview" valuePropName="checked">
            <Checkbox>Cho phép xem lại đáp án</Checkbox>
          </Form.Item>
          
          <Form.Item name="shuffleQuestions" valuePropName="checked">
            <Checkbox>Trộn thứ tự câu hỏi</Checkbox>
          </Form.Item>
          
          <Form.Item name="shuffleOptions" valuePropName="checked">
            <Checkbox>Trộn thứ tự đáp án</Checkbox>
          </Form.Item>
          
          <Alert
            message="Khuyến nghị"
            description="Nên bật tính năng trộn câu hỏi để tăng tính bảo mật"
            type="warning"
            showIcon
            size="small"
          />
        </Card>
      </Col>
    </Row>
    
    <Card title="🛡️ Chống gian lận" size="small" className="d-none" style={{display: "none"}}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="lockdownBrowser" valuePropName="checked">
            <Checkbox>Chế độ toàn màn hình (khóa trình duyệt)</Checkbox>
          </Form.Item>
          
          <Form.Item name="preventCopyPaste" valuePropName="checked">
            <Checkbox>Chặn copy/paste</Checkbox>
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item name="detectTabSwitch" valuePropName="checked">
            <Checkbox>Phát hiện chuyển tab</Checkbox>
          </Form.Item>
          
          <Form.Item name="randomizeQuestions" valuePropName="checked">
            <Checkbox>Random câu hỏi cho mỗi học sinh</Checkbox>
          </Form.Item>
        </Col>
      </Row>
      
      <Alert
        message="Cảnh báo"
        description="Các tính năng chống gian lận có thể ảnh hưởng đến trải nghiệm người dùng. Hãy cân nhắc kỹ trước khi sử dụng."
        type="warning"
        showIcon
        size="small"
      />
    </Card>
  </div>
);

export default QuizStepConfig;