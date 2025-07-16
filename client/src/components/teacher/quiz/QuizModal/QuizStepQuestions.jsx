import React from 'react';
import { Card, Row, Col, Input, Button, Table, List, Tag, Typography, Checkbox, Select, InputNumber, Alert, Upload, Progress } from 'antd';
import { EditOutlined, FileTextOutlined, RobotOutlined, SearchOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const QuizStepQuestions = ({
  quizQuestions,
  setQuizQuestions,
  questionSource,
  setQuestionSource,
  manualQuestion,
  setManualQuestion,
  handleAddManualQuestion,
  searchText,
  setSearchText,
  selectedQuestions,
  setSelectedQuestions,
  questionBankColumns,
  filteredQuestionBank,
  handleAddSelectedQuestions,
  handleGenerateAIQuestions,
  aiGenerating,
  aiProgress
}) => (
  <div>
    <div className="flex justify-between items-center mb-4">
      <Title level={4}>❓ Quản lý câu hỏi</Title>
      <div className="text-right">
        <Text strong>Tổng câu hỏi: {quizQuestions.length}</Text><br />
        <Text type="secondary">
          Tổng điểm: {quizQuestions.reduce((sum, q) => sum + (q.points || 1), 0)}
        </Text>
      </div>
    </div>
    {/* Question Source Selection */}
    <Card title="Chọn nguồn câu hỏi" size="small" className="mb-4">
      <div className="grid grid-cols-3 gap-4">
        <div 
          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            questionSource === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
          onClick={() => setQuestionSource('manual')}
        >
          <div className="text-center">
            <EditOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <div className="mt-2 font-medium">Tạo thủ công</div>
            <Text type="secondary" className="text-sm">Tự soạn câu hỏi mới</Text>
          </div>
        </div>
        <div 
          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            questionSource === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
          onClick={() => setQuestionSource('bank')}
        >
          <div className="text-center">
            <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />
            <div className="mt-2 font-medium">Ngân hàng câu hỏi</div>
            <Text type="secondary" className="text-sm">Chọn từ câu hỏi có sẵn</Text>
          </div>
        </div>
        <div 
          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            questionSource === 'ai' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
          onClick={() => setQuestionSource('ai')}
        >
          <div className="text-center">
            <RobotOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
            <div className="mt-2 font-medium">AI tạo câu hỏi</div>
            <Text type="secondary" className="text-sm">Tự động từ tài liệu</Text>
          </div>
        </div>
      </div>
    </Card>
    {/* Manual Question Creation */}
    {questionSource === 'manual' && (
      <Card title="➕ Tạo câu hỏi thủ công" size="small" className="mb-4">
        <Row gutter={16}>
          <Col span={16}>
            <Input.TextArea
              value={manualQuestion.content}
              onChange={(e) => setManualQuestion({...manualQuestion, content: e.target.value})}
              placeholder="Nhập nội dung câu hỏi..."
              rows={3}
              className="mb-3"
            />
            <div className="space-y-2 mb-3">
              {manualQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    checked={option.isCorrect}
                    onChange={(e) => {
                      const newOptions = [...manualQuestion.options];
                      newOptions.forEach((opt, i) => {
                        opt.isCorrect = i === index ? e.target.checked : false;
                      });
                      setManualQuestion({...manualQuestion, options: newOptions});
                    }}
                  />
                  <Input
                    value={option.content}
                    onChange={(e) => {
                      const newOptions = [...manualQuestion.options];
                      newOptions[index].content = e.target.value;
                      setManualQuestion({...manualQuestion, options: newOptions});
                    }}
                    placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>
          </Col>
          <Col span={8}>
            <Select
              value={manualQuestion.difficulty}
              onChange={(value) => setManualQuestion({...manualQuestion, difficulty: value})}
              style={{ width: '100%', marginBottom: 8 }}
            >
              <Option value="easy">Dễ</Option>
              <Option value="medium">Trung bình</Option>
              <Option value="hard">Khó</Option>
            </Select>
            <InputNumber
              value={manualQuestion.points}
              onChange={(value) => setManualQuestion({...manualQuestion, points: value})}
              min={1}
              max={10}
              style={{ width: '100%', marginBottom: 8 }}
              placeholder="Điểm"
            />
            <Button 
              type="primary" 
              onClick={handleAddManualQuestion}
              style={{ width: '100%' }}
            >
              Thêm câu hỏi
            </Button>
          </Col>
        </Row>
      </Card>
    )}
    {/* Question Bank Selection */}
    {questionSource === 'bank' && (
      <Card title="📚 Ngân hàng câu hỏi" size="small" className="mb-4">
        <div className="mb-4">
          <Input
            placeholder="Tìm kiếm câu hỏi..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
          />
          <Button 
            type="primary" 
            onClick={handleAddSelectedQuestions}
            disabled={selectedQuestions.length === 0}
            className="ml-4"
          >
            Thêm {selectedQuestions.length} câu hỏi đã chọn
          </Button>
        </div>
        <Table
          rowSelection={{
            selectedRowKeys: selectedQuestions,
            onChange: setSelectedQuestions,
          }}
          columns={questionBankColumns}
          dataSource={filteredQuestionBank}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    )}
    {/* AI Question Generation */}
    {questionSource === 'ai' && (
      <Card title="🤖 AI tạo câu hỏi" size="small" className="mb-4">
        <Alert
          message="Tính năng AI"
          description="Upload tài liệu hoặc nhập chủ đề để AI tự động tạo câu hỏi trắc nghiệm"
          type="info"
          showIcon
          className="mb-4"
        />
        <Row gutter={16}>
          <Col span={12}>
            <Upload.Dragger
              multiple={false}
              beforeUpload={() => false}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Upload tài liệu</p>
              <p className="ant-upload-hint">
                Hỗ trợ PDF, DOCX, TXT
              </p>
            </Upload.Dragger>
          </Col>
          <Col span={12}>
            <Input.TextArea
              placeholder="Hoặc nhập chủ đề, nội dung cần tạo câu hỏi..."
              rows={6}
              className="mb-3"
            />
            <Button 
              type="primary" 
              onClick={handleGenerateAIQuestions}
              loading={aiGenerating}
              style={{ width: '100%' }}
              icon={<RobotOutlined />}
            >
              {aiGenerating ? 'Đang tạo câu hỏi...' : 'Tạo câu hỏi với AI'}
            </Button>
            {aiGenerating && (
              <Progress 
                percent={aiProgress} 
                status="active"
                className="mt-2"
              />
            )}
          </Col>
        </Row>
      </Card>
    )}
    {/* Current Questions List */}
    {quizQuestions.length > 0 && (
      <Card title="📋 Câu hỏi đã thêm" size="small">
        <List
          dataSource={quizQuestions}
          renderItem={(question, index) => (
            <List.Item
              actions={[
                <Button 
                  type="link" 
                  icon={<EditOutlined />} 
                  size="small"
                >
                  Sửa
                </Button>,
                <Button 
                  type="link" 
                  danger 
                  icon={<DeleteOutlined />} 
                  size="small"
                  onClick={() => {
                    setQuizQuestions(prev => prev.filter((_, i) => i !== index));
                  }}
                >
                  Xóa
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="flex items-center gap-2">
                    <Text strong>Câu {index + 1}: {question.content}</Text>
                    <Tag color={question.source === 'ai' ? 'orange' : question.source === 'bank' ? 'green' : 'blue'}>
                      {question.source === 'ai' ? 'AI' : question.source === 'bank' ? 'Ngân hàng' : 'Thủ công'}
                    </Tag>
                    <Tag>{question.points || 1} điểm</Tag>
                  </div>
                }
                description={
                  <div>
                    {question.options?.map((opt, i) => (
                      <div key={i} className={opt.isCorrect ? 'text-green-600 font-medium' : ''}>
                        {String.fromCharCode(65 + i)}. {opt.content}
                        {opt.isCorrect && ' ✓'}
                      </div>
                    ))}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    )}
  </div>
);

export default QuizStepQuestions;