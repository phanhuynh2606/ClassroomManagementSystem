import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Tabs, 
  Button, 
  Input, 
  Select, 
  Upload, 
  ColorPicker, 
  Row, 
  Col, 
  Card, 
  message,
  Space,
  Typography,
  Divider,
  Switch,
} from 'antd';
import {
  BgColorsOutlined,
  PictureOutlined,
  FormatPainterOutlined,
  ReloadOutlined,
  EyeOutlined,
  SaveOutlined,
  UploadOutlined
} from '@ant-design/icons';
import classroomAPI from '../../../services/api/classroom.api';

const { Title, Text } = Typography;
const { Option } = Select;

const BackgroundCustomizer = ({ 
  visible, 
  onCancel, 
  onSave, 
  classroomData,
  loading 
}) => {
  const [activeTab, setActiveTab] = useState('gradient');
  const [previewMode, setPreviewMode] = useState(false);
  
  // Background settings state
  const [backgroundSettings, setBackgroundSettings] = useState({
    type: 'gradient',
    color: '#1976d2',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    theme: 'default',
    image: {
      url: '',
      position: 'center',
      size: 'cover',
      repeat: 'no-repeat'
    }
  });

  // Store selected image file for preview (before upload)
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Header settings state
  const [headerSettings, setHeaderSettings] = useState({
    showSubject: true,
    showDescription: true,
    textColor: '#ffffff'
  });

  // Predefined themes
  const predefinedThemes = [
    {
      name: 'default',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff'
    },
    {
      name: 'ocean',
      gradient: 'linear-gradient(135deg, #667db6 0%, #0082c8 35%, #0082c8 100%)',
      preview: 'linear-gradient(135deg, #667db6 0%, #0082c8 35%, #0082c8 100%)',
      textColor: '#ffffff'
    },
    {
      name: 'forest',
      gradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
      preview: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
      textColor: '#ffffff'
    },
    {
      name: 'sunset',
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      preview: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      textColor: '#ffffff'
    },
    {
      name: 'night',
      gradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      preview: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      textColor: '#ffffff'
    },
    {
      name: 'autumn',
      gradient: 'linear-gradient(135deg, #d63031 0%, #e17055 100%)',
      preview: 'linear-gradient(135deg, #d63031 0%, #e17055 100%)',
      textColor: '#ffffff'
    },
    {
      name: 'spring',
      gradient: 'linear-gradient(135deg, #00b894 0%, #55a3ff 100%)',
      preview: 'linear-gradient(135deg, #00b894 0%, #55a3ff 100%)',
      textColor: '#ffffff'
    }
  ];

  // Initialize settings from classroom data
  useEffect(() => {
    if (classroomData?.appearance) {
      const appearance = classroomData.appearance;
      
      if (appearance.background) {
        setBackgroundSettings({
          type: appearance.background.type || 'gradient',
          color: appearance.background.color || '#1976d2',
          gradient: appearance.background.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          theme: appearance.background.theme || 'default',
          image: appearance.background.image || {
            url: '',
            position: 'center',
            size: 'cover',
            repeat: 'no-repeat'
          }
        });
        setActiveTab(appearance.background.type || 'gradient');
      }
      
      if (appearance.header) {
        setHeaderSettings({
          showSubject: appearance.header.showSubject !== false,
          showDescription: appearance.header.showDescription !== false,
          textColor: appearance.header.textColor || '#ffffff'
        });
      }
    }
  }, [classroomData]);

  // Cleanup preview URL when component unmounts or new image is selected
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  // Get current background style for preview
  const getCurrentBackgroundStyle = () => {
    switch (backgroundSettings.type) {
      case 'color':
        return { background: backgroundSettings.color };
      case 'gradient':
        return { background: backgroundSettings.gradient };
      case 'image':
        if (backgroundSettings.image.url) {
          return {
            backgroundImage: `url(${backgroundSettings.image.url})`,
            backgroundPosition: backgroundSettings.image.position,
            backgroundSize: backgroundSettings.image.size,
            backgroundRepeat: backgroundSettings.image.repeat
          };
        }
        return { background: '#1976d2' };
      case 'theme':
        const theme = predefinedThemes.find(t => t.name === backgroundSettings.theme);
        return { background: theme?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
      default:
        return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
    }
  };

  // Handle save
  const handleSave = async () => {
    try {
      let finalBackgroundSettings = { ...backgroundSettings };
      
      // Case 1: Upload new image file (only when new file is selected)
      if (selectedImageFile && previewImageUrl) {
        message.loading('Uploading new image to Cloudinary...', 0);
        
        try {
          const uploadResponse = await classroomAPI.uploadBackgroundImage(selectedImageFile);
          
          if (uploadResponse.success) {
            // Replace preview URL with actual Cloudinary URL
            finalBackgroundSettings.image.url = uploadResponse.data.url;
            message.destroy();
            message.success('New image uploaded to Cloudinary successfully');
          } else {
            message.destroy();
            message.error('Failed to upload new image to Cloudinary');
            return;
          }
        } catch (uploadError) {
          message.destroy();
          message.error('Failed to upload new image to Cloudinary');
          console.error('Upload error:', uploadError);
          return;
        }
      } 
      // Case 2: Update settings only (position, size, or other background types)
      else if (backgroundSettings.type === 'image' && backgroundSettings.image.url) {
        console.log('🔄 Updating image position/size settings only - NO Cloudinary upload');
        message.loading('Updating image settings...', 0);
        setTimeout(() => {
          message.destroy();
          message.success('Image settings updated (no re-upload needed)');
        }, 500);
      }
      // Case 3: Other background types (gradient, color, theme)
      else {
        console.log('🎨 Updating background style - NO Cloudinary upload');
      }
      
      const appearance = {
        background: finalBackgroundSettings,
        header: headerSettings
      };
      
      // Always call updateAppearance API (not upload API)
      onSave(appearance);
    } catch (error) {
      message.error('Failed to save appearance');
      console.error('Save error:', error);
    }
  };

  // Handle reset to default
  const handleReset = () => {
    // Clean up preview URL
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }
    
    setBackgroundSettings({
      type: 'gradient',
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      theme: 'default',
      image: {
        url: '',
        position: 'center',
        size: 'cover',
        repeat: 'no-repeat'
      }
    });
    setHeaderSettings({
      showSubject: true,
      showDescription: true,
      textColor: '#ffffff'
    });
    setSelectedImageFile(null);
    setPreviewImageUrl(null);
    setActiveTab('gradient');
  };

  // Handle file selection for preview (not upload yet)
  const handleImageSelect = (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      message.error('Invalid file type. Only JPEG, PNG, and GIF are allowed');
      return false;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      message.error('File too large. Maximum size is 5MB');
      return false;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Store file and preview URL
    setSelectedImageFile(file);
    setPreviewImageUrl(previewUrl);
    
    // Update background settings with preview URL
    setBackgroundSettings(prev => ({
      ...prev,
      type: 'image',
      image: {
        ...prev.image,
        url: previewUrl
      }
    }));
    
    setActiveTab('image');
    message.success('Image selected for preview. Click Save to upload.');
    
    // Prevent automatic upload
    return false;
  };

  // Tab items
  const tabItems = [
    {
      key: 'gradient',
      label: (
        <Space>
          <FormatPainterOutlined />
          Gradient
        </Space>
      ),
      children: (
        <div className="space-y-4">
          <div>
            <Text strong>Custom Gradient:</Text>
            <Input
              value={backgroundSettings.gradient}
              onChange={(e) => setBackgroundSettings(prev => ({ 
                ...prev, 
                type: 'gradient',
                gradient: e.target.value 
              }))}
              placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              className="mt-2"
            />
          </div>
          <div>
            <Text>Popular Gradients:</Text>
            <Row gutter={[8, 8]} className="mt-2">
              {[
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
              ].map((gradient, index) => (
                <Col span={8} key={index}>
                  <div
                    className="h-12 rounded cursor-pointer border-2 border-gray-200 hover:border-blue-400"
                    style={{ background: gradient }}
                    onClick={() => setBackgroundSettings(prev => ({ 
                      ...prev, 
                      type: 'gradient',
                      gradient 
                    }))}
                  />
                </Col>
              ))}
            </Row>
          </div>
        </div>
      )
    },
    {
      key: 'color',
      label: (
        <Space>
          <BgColorsOutlined />
          Solid Color
        </Space>
      ),
      children: (
        <div className="space-y-4">
          <div>
            <Text strong>Choose Color:</Text>
            <div className="mt-2">
              <ColorPicker
                value={backgroundSettings.color}
                onChange={(color) => setBackgroundSettings(prev => ({ 
                  ...prev, 
                  type: 'color',
                  color: color.toHexString() 
                }))}
                showText
                size="large"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'theme',
      label: (
        <Space>
          <FormatPainterOutlined />
          Themes
        </Space>
      ),
      children: (
        <div className="space-y-4">
          <Text strong>Predefined Themes:</Text>
          <Row gutter={[12, 12]}>
            {predefinedThemes.map((theme) => (
              <Col span={8} key={theme.name}>
                <Card
                  hoverable
                  className={`theme-card ${backgroundSettings.theme === theme.name && backgroundSettings.type === 'theme' ? 'selected' : ''}`}
                  onClick={() => setBackgroundSettings(prev => ({ 
                    ...prev, 
                    type: 'theme',
                    theme: theme.name 
                  }))}
                  style={{ border: backgroundSettings.theme === theme.name && backgroundSettings.type === 'theme' ? '2px solid #1890ff' : undefined }}
                >
                  <div 
                    className="h-16 rounded mb-2"
                    style={{ background: theme.preview }}
                  />
                  <Text className="text-center block capitalize">{theme.name}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )
    },
    {
      key: 'image',
      label: (
        <Space>
          <PictureOutlined />
          Image
        </Space>
      ),
      children: (
        <div className="space-y-4">
          <div>
            <Text strong>Upload Background Image:</Text>
            <Upload
              name="background"
              listType="picture-card"
              className="mt-2"
              showUploadList={false}
              beforeUpload={handleImageSelect}
              accept="image/*"
              multiple={false}
            >
              <div>
                <UploadOutlined />
                <div className="mt-2">Select Image</div>
              </div>
            </Upload>
            
            {previewImageUrl && (
              <div className="mt-3">
                <Text type="secondary" className="block mb-2">Preview:</Text>
                <img 
                  src={previewImageUrl} 
                  alt="Preview" 
                  className="max-w-full h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>
          
                      {backgroundSettings.image.url && (
              <>
                <div className='hidden'>
                  <Text strong>Image URL:</Text>
                  <Input
                    value={backgroundSettings.image.url}
                    onChange={(e) => setBackgroundSettings(prev => ({
                      ...prev,
                      type: 'image',
                      image: { ...prev.image, url: e.target.value }
                    }))}
                    className="mt-1"
                  />
                </div>
                
                <Row gutter={16} className="mt-3">
                  <Col span={12}>
                    <Text strong>Position:</Text>
                    <Select
                      value={backgroundSettings.image.position}
                      onChange={(value) => setBackgroundSettings(prev => ({
                        ...prev,
                        image: { ...prev.image, position: value }
                      }))}
                      className="w-full mt-1"
                    >
                      <Option value="center">Center</Option>
                      <Option value="top">Top</Option>
                      <Option value="bottom">Bottom</Option>
                      <Option value="left">Left</Option>
                      <Option value="right">Right</Option>
                    </Select>
                  </Col>
                  <Col span={12}>
                    <Text strong>Size:</Text>
                    <Select
                      value={backgroundSettings.image.size}
                      onChange={(value) => setBackgroundSettings(prev => ({
                        ...prev,
                        image: { ...prev.image, size: value }
                      }))}
                      className="w-full mt-1"
                    >
                      <Option value="cover">Cover</Option>
                      <Option value="contain">Contain</Option>
                      <Option value="auto">Auto</Option>
                      <Option value="100% 100%">Stretch</Option>
                    </Select>
                  </Col>
                </Row>
              </>
            )}
        </div>
      )
    }
  ];

  return (
    <Modal
      title="Customize Classroom Background"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="reset" onClick={handleReset}>
          <ReloadOutlined /> Reset
        </Button>,
        <Button key="preview" onClick={() => setPreviewMode(!previewMode)}>
          <EyeOutlined /> {previewMode ? 'Hide' : 'Preview'}
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          <SaveOutlined /> Save Changes
        </Button>
      ]}
    >
      {/* Preview Section */}
      {previewMode && (
        <div className="mb-6">
          <div 
            className="preview-header rounded-lg p-6 mb-4"
            style={{
              ...getCurrentBackgroundStyle(),
              color: headerSettings.textColor,
              minHeight: '120px'
            }}
          >
            <Title level={3} style={{ color: headerSettings.textColor, margin: 0 }}>
              {classroomData?.name || 'Classroom Name'}
            </Title>
            {headerSettings.showSubject && (
              <Text style={{ color: headerSettings.textColor, opacity: 0.9 }}>
                {classroomData?.subject || 'Subject'}
              </Text>
            )}
            {headerSettings.showDescription && classroomData?.description && (
              <div className="mt-2">
                <Text style={{ color: headerSettings.textColor, opacity: 0.8 }}>
                  {classroomData.description}
                </Text>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Background Type Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          setBackgroundSettings(prev => ({ ...prev, type: key }));
        }}
        items={tabItems}
      />

      <Divider />

      {/* Header Settings */}
      <div className="space-y-4">
        <Title level={5}>Header Settings</Title>
        
        <Row gutter={16}>
          <Col span={8}>
            <Space>
              <Text>Show Subject:</Text>
              <Switch
                checked={headerSettings.showSubject}
                onChange={(checked) => setHeaderSettings(prev => ({ 
                  ...prev, 
                  showSubject: checked 
                }))}
              />
            </Space>
          </Col>
          
          <Col span={8}>
            <Space>
              <Text>Show Description:</Text>
              <Switch
                checked={headerSettings.showDescription}
                onChange={(checked) => setHeaderSettings(prev => ({ 
                  ...prev, 
                  showDescription: checked 
                }))}
              />
            </Space>
          </Col>
          
          <Col span={8}>
            <Space>
              <Text>Text Color:</Text>
              <ColorPicker
                value={headerSettings.textColor}
                onChange={(color) => setHeaderSettings(prev => ({ 
                  ...prev, 
                  textColor: color.toHexString() 
                }))}
                size="small"
              />
            </Space>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default BackgroundCustomizer; 