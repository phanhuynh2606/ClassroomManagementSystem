import React, { useState } from 'react';
import { Card, Button, Space, Typography, Row, Col, message } from 'antd';
import { FormatPainterOutlined, SettingOutlined } from '@ant-design/icons';
import { StreamHeader } from '../../components/teacher/stream';
import { BackgroundCustomizer } from '../../components/teacher/classroom';

const { Title, Text } = Typography;

const BackgroundDemo = () => {
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Demo classroom data
  const [demoClassroom, setDemoClassroom] = useState({
    name: 'Programming Fundamentals',
    subject: 'Computer Science',
    description: 'Learn the basics of programming with hands-on exercises and projects.',
    code: 'ABC123',
    appearance: {
      background: {
        type: 'gradient',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        theme: 'default'
      },
      header: {
        showSubject: true,
        showDescription: true,
        textColor: '#ffffff'
      }
    }
  });

  const handleOpenCustomizer = () => {
    setCustomizeVisible(true);
  };

  const handleCloseCustomizer = () => {
    setCustomizeVisible(false);
  };

  const handleSaveAppearance = async (appearanceData) => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDemoClassroom(prev => ({
        ...prev,
        appearance: appearanceData
      }));
      
      setCustomizeVisible(false);
      message.success('Background updated successfully!');
    } catch (error) {
      message.error('Failed to update background');
    } finally {
      setSaving(false);
    }
  };

  const predefinedExamples = [
    {
      name: 'Ocean Theme',
      background: {
        type: 'theme',
        theme: 'ocean'
      },
      header: { showSubject: true, showDescription: true, textColor: '#ffffff' }
    },
    {
      name: 'Sunset Theme',
      background: {
        type: 'theme',
        theme: 'sunset'
      },
      header: { showSubject: true, showDescription: true, textColor: '#ffffff' }
    },
    {
      name: 'Forest Theme',
      background: {
        type: 'theme',
        theme: 'forest'
      },
      header: { showSubject: true, showDescription: true, textColor: '#ffffff' }
    },
    {
      name: 'Custom Gradient',
      background: {
        type: 'gradient',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      header: { showSubject: true, showDescription: true, textColor: '#ffffff' }
    },
    {
      name: 'Solid Blue',
      background: {
        type: 'color',
        color: '#1976d2'
      },
      header: { showSubject: true, showDescription: false, textColor: '#ffffff' }
    }
  ];

  const applyExample = (example) => {
    setDemoClassroom(prev => ({
      ...prev,
      appearance: {
        background: example.background,
        header: example.header
      }
    }));
    message.success(`Applied ${example.name}!`);
  };

  return (
    <div className="p-6" style={{ minHeight: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
      <Title level={2} className="mb-6">
        <FormatPainterOutlined className="mr-2" />
        Background Customization Demo
      </Title>

      <Text className="text-lg mb-6 block">
        Customize your classroom appearance with colors, gradients, themes, and images. 
        Click the examples below or use the customizer for full control.
      </Text>

      {/* Demo Classroom Header */}
      <Card className="mb-6">
        <Title level={4} className="mb-4">Live Preview</Title>
        <StreamHeader 
          classData={demoClassroom}
          onCustomizeClick={handleOpenCustomizer}
        />
        
        <div className="mt-4 flex justify-between items-center">
          <Space>
            <Text strong>Current Style:</Text>
            <Text>
              {demoClassroom.appearance.background.type === 'theme' 
                ? `${demoClassroom.appearance.background.theme} theme`
                : demoClassroom.appearance.background.type}
            </Text>
          </Space>
          <Button 
            type="primary" 
            icon={<SettingOutlined />}
            onClick={handleOpenCustomizer}
          >
            Customize Background
          </Button>
        </div>
      </Card>

      {/* Quick Examples */}
      <Card>
        <Title level={4} className="mb-4">Quick Examples</Title>
        <Text className="mb-4 block">
          Click any example below to apply it instantly:
        </Text>
        
        <Row gutter={[16, 16]}>
          {predefinedExamples.map((example, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <Card
                hoverable
                className="example-card"
                onClick={() => applyExample(example)}
                style={{ cursor: 'pointer' }}
              >
                {/* Mini preview */}
                <div 
                  className="h-20 rounded mb-3"
                  style={{
                    background: example.background.type === 'theme' 
                      ? getThemeGradient(example.background.theme)
                      : example.background.type === 'gradient'
                      ? example.background.gradient
                      : example.background.color || '#1976d2'
                  }}
                />
                <Text strong className="block text-center">
                  {example.name}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Features List */}
      <Card className="mt-6">
        <Title level={4} className="mb-4">Features</Title>
        <Row gutter={[32, 16]}>
          <Col xs={24} md={12}>
            <Title level={5}>🎨 Background Types</Title>
            <ul className="list-disc list-inside space-y-1">
              <li>Solid colors with color picker</li>
              <li>Custom gradients</li>
              <li>Predefined themes (7 options)</li>
              <li>Background images with positioning</li>
            </ul>
          </Col>
          <Col xs={24} md={12}>
            <Title level={5}>⚙️ Header Settings</Title>
            <ul className="list-disc list-inside space-y-1">
              <li>Show/hide subject and description</li>
              <li>Custom text color</li>
              <li>Live preview</li>
              <li>Reset to defaults</li>
            </ul>
          </Col>
        </Row>
      </Card>

      {/* Background Customizer Modal */}
      <BackgroundCustomizer
        visible={customizeVisible}
        onCancel={handleCloseCustomizer}
        onSave={handleSaveAppearance}
        classroomData={demoClassroom}
        loading={saving}
      />
    </div>
  );
};

// Helper function to get theme gradients
const getThemeGradient = (theme) => {
  const themes = {
    default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ocean: 'linear-gradient(135deg, #667db6 0%, #0082c8 35%, #0082c8 100%)',
    forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    sunset: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
    night: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    autumn: 'linear-gradient(135deg, #d63031 0%, #e17055 100%)',
    spring: 'linear-gradient(135deg, #00b894 0%, #55a3ff 100%)'
  };
  return themes[theme] || themes.default;
};

export default BackgroundDemo; 