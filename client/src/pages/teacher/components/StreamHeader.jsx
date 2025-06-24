import React, { memo, useMemo } from 'react';
import { Typography, Button } from 'antd';
import { SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const StreamHeader = ({ classData, onCustomizeClick }) => {
  // Get background style from classroom appearance
  console.log("classData", classData)
  const getBackgroundStyle = useMemo(() => {
    const appearance = classData?.appearance;
    const background = appearance?.background;
    
    if (!background) {
      return {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundImage: 'url(data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="36" cy="24" r="5"/%3E%3Cpath d="m36 19c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E)'
      };
    }
    
    switch (background.type) {
      case 'color':
        return { background: background.color || '#1976d2' };
      case 'gradient':
        return { 
          background: background.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundImage: 'url(data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="36" cy="24" r="5"/%3E%3Cpath d="m36 19c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E)'
        };
      case 'image':
        if (background.image?.url) {
          return {
            backgroundImage: `url(${background.image.url})`,
            backgroundPosition: background.image.position || 'center',
            backgroundSize: background.image.size || 'cover',
            backgroundRepeat: background.image.repeat || 'no-repeat'
          };
        }
        return { background: '#1976d2' };
      case 'theme':
        const themes = {
          default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          ocean: 'linear-gradient(135deg, #667db6 0%, #0082c8 35%, #0082c8 100%)',
          forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
          sunset: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
          night: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          autumn: 'linear-gradient(135deg, #d63031 0%, #e17055 100%)',
          spring: 'linear-gradient(135deg, #00b894 0%, #55a3ff 100%)'
        };
        return { 
          background: themes[background.theme] || themes.default,
          backgroundImage: 'url(data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="36" cy="24" r="5"/%3E%3Cpath d="m36 19c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E)'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundImage: 'url(data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="36" cy="24" r="5"/%3E%3Cpath d="m36 19c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E)'
        };
    }
  }, [classData?.appearance]);

  // Get header settings
  const headerSettings = classData?.appearance?.header || {
    showSubject: true,
    showDescription: true,
    textColor: '#ffffff'
  };

  const textColor = headerSettings.textColor || '#ffffff';

  return (
    <div 
      className="relative h-64 mb-6 rounded-lg overflow-hidden"
      style={getBackgroundStyle}
    >
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <div className="absolute bottom-6 left-6" style={{ color: textColor }}>
        <Title level={1} style={{ color: textColor, margin: 0, marginBottom: '8px' }}>
          {classData?.name || 'Classroom'}
        </Title>
        {headerSettings.showSubject && classData?.subject && (
          <Text style={{ color: textColor, fontSize: '18px', opacity: 0.9 }}>
            {classData.subject}
          </Text>
        )}
        {headerSettings.showDescription && classData?.description && (
          <div className="mt-2">
            <Text style={{ color: textColor, opacity: 0.8 }}>
              {classData.description}
            </Text>
          </div>
        )}
      </div>
      <div className="absolute top-4 right-4">
        <Button
          icon={<SettingOutlined />}
          onClick={onCustomizeClick}
          style={{
            color: textColor,
            borderColor: textColor,
          }}
          className="hover:bg-white hover:text-gray-800"
          ghost
        >
          Customize
        </Button>
      </div>
      <div className="absolute bottom-4 right-4">
        <Button
          icon={<InfoCircleOutlined />}
          shape="circle"
          style={{
            color: textColor,
            borderColor: textColor,
          }}
          className="hover:bg-white hover:text-gray-800"
          ghost
        />
      </div>
    </div>
  );
};

export default memo(StreamHeader); 