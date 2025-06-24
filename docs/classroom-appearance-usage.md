# Classroom Appearance Management

## Tổng quan

Classroom model đã được cập nhật để hỗ trợ customization background và appearance settings. Giáo viên có thể tùy chỉnh giao diện classroom với nhiều tùy chọn khác nhau.

## Cấu trúc Appearance

```javascript
{
  appearance: {
    background: {
      type: 'gradient', // 'color', 'gradient', 'image', 'theme'
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      image: {
        url: 'https://example.com/background.jpg',
        position: 'center',
        size: 'cover',
        repeat: 'no-repeat'
      },
      theme: 'default'
    },
    header: {
      showSubject: true,
      showDescription: true,
      textColor: '#ffffff'
    },
    customCss: 'body { font-family: "Arial"; }'
  }
}
```

## Các loại Background

### 1. Solid Color
```javascript
await classroom.setBackground({
  type: 'color',
  color: '#1976d2'
});
```

### 2. Gradient Background
```javascript
await classroom.setBackground({
  type: 'gradient',
  gradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)'
});
```

### 3. Image Background
```javascript
await classroom.setBackground({
  type: 'image',
  image: {
    url: 'https://example.com/classroom-bg.jpg',
    position: 'center top',
    size: 'cover',
    repeat: 'no-repeat'
  }
});
```

### 4. Predefined Theme
```javascript
await classroom.setBackground({
  type: 'theme',
  theme: 'ocean' // 'default', 'ocean', 'forest', 'sunset', 'night', 'autumn', 'spring'
});
```

## API Usage Examples

### Lấy style background cho frontend
```javascript
const classroom = await Classroom.findById(classroomId);
const backgroundStyle = classroom.getBackgroundStyle();

// Trả về object CSS style:
// { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
// hoặc
// { 
//   backgroundImage: 'url(...)',
//   backgroundPosition: 'center',
//   backgroundSize: 'cover',
//   backgroundRepeat: 'no-repeat'
// }
```

### Lấy danh sách themes có sẵn
```javascript
const availableThemes = Classroom.getAvailableThemes();
/*
Trả về:
[
  {
    name: 'default',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff'
  },
  {
    name: 'ocean',
    gradient: 'linear-gradient(135deg, #667db6 0%, #0082c8 35%, #0082c8 100%)',
    textColor: '#ffffff'
  },
  // ...
]
*/
```

### Update appearance settings
```javascript
const classroom = await Classroom.findById(classroomId);

// Set specific background
await classroom.setBackground({
  type: 'gradient',
  gradient: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)'
});

// Update header settings
classroom.appearance.header = {
  showSubject: true,
  showDescription: false,
  textColor: '#000000'
};
await classroom.save();

// Reset to default
await classroom.resetToDefaultAppearance();
```

## Frontend Implementation

### React Component Example
```jsx
import React, { useState, useEffect } from 'react';

const ClassroomHeader = ({ classroomId }) => {
  const [classroom, setClassroom] = useState(null);
  const [backgroundStyle, setBackgroundStyle] = useState({});

  useEffect(() => {
    fetchClassroom();
  }, [classroomId]);

  const fetchClassroom = async () => {
    const response = await api.get(`/classrooms/${classroomId}`);
    const classroomData = response.data;
    setClassroom(classroomData);
    
    // Apply background style
    setBackgroundStyle(getBackgroundStyle(classroomData.appearance));
  };

  const getBackgroundStyle = (appearance) => {
    if (!appearance?.background) {
      return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
    }

    const bg = appearance.background;
    switch (bg.type) {
      case 'color':
        return { background: bg.color };
      case 'gradient':
        return { background: bg.gradient };
      case 'image':
        return bg.image?.url ? {
          backgroundImage: `url(${bg.image.url})`,
          backgroundPosition: bg.image.position || 'center',
          backgroundSize: bg.image.size || 'cover',
          backgroundRepeat: bg.image.repeat || 'no-repeat'
        } : { background: '#1976d2' };
      case 'theme':
        return { background: getThemeGradient(bg.theme) };
      default:
        return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
    }
  };

  return (
    <div 
      className="classroom-header"
      style={{
        ...backgroundStyle,
        color: classroom?.appearance?.header?.textColor || '#ffffff',
        padding: '40px 20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}
    >
      <h1>{classroom?.name}</h1>
      {classroom?.appearance?.header?.showSubject && (
        <p>{classroom?.subject}</p>
      )}
      {classroom?.appearance?.header?.showDescription && classroom?.description && (
        <p>{classroom?.description}</p>
      )}
    </div>
  );
};
```

### Background Customizer Component
```jsx
const BackgroundCustomizer = ({ classroomId, onUpdate }) => {
  const [backgroundType, setBackgroundType] = useState('gradient');
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [customColor, setCustomColor] = useState('#1976d2');
  const [customGradient, setCustomGradient] = useState('');
  const [availableThemes, setAvailableThemes] = useState([]);

  useEffect(() => {
    fetchAvailableThemes();
  }, []);

  const fetchAvailableThemes = async () => {
    const response = await api.get('/classrooms/themes');
    setAvailableThemes(response.data);
  };

  const handleUpdateBackground = async () => {
    const backgroundData = { type: backgroundType };

    switch (backgroundType) {
      case 'color':
        backgroundData.color = customColor;
        break;
      case 'gradient':
        backgroundData.gradient = customGradient;
        break;
      case 'theme':
        backgroundData.theme = selectedTheme;
        break;
    }

    try {
      await api.put(`/classrooms/${classroomId}/appearance`, { background: backgroundData });
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error updating background:', error);
    }
  };

  return (
    <div className="background-customizer">
      <div className="bg-type-selector">
        <label>
          <input
            type="radio"
            value="color"
            checked={backgroundType === 'color'}
            onChange={(e) => setBackgroundType(e.target.value)}
          />
          Solid Color
        </label>
        <label>
          <input
            type="radio"
            value="gradient"
            checked={backgroundType === 'gradient'}
            onChange={(e) => setBackgroundType(e.target.value)}
          />
          Custom Gradient
        </label>
        <label>
          <input
            type="radio"
            value="theme"
            checked={backgroundType === 'theme'}
            onChange={(e) => setBackgroundType(e.target.value)}
          />
          Predefined Theme
        </label>
      </div>

      {backgroundType === 'color' && (
        <input
          type="color"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
        />
      )}

      {backgroundType === 'gradient' && (
        <input
          type="text"
          placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          value={customGradient}
          onChange={(e) => setCustomGradient(e.target.value)}
        />
      )}

      {backgroundType === 'theme' && (
        <select
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(e.target.value)}
        >
          {availableThemes.map(theme => (
            <option key={theme.name} value={theme.name}>
              {theme.name.charAt(0).toUpperCase() + theme.name.slice(1)}
            </option>
          ))}
        </select>
      )}

      <button onClick={handleUpdateBackground}>
        Update Background
      </button>
    </div>
  );
};
```

## API Endpoints (Suggested)

```javascript
// Get classroom with appearance
GET /api/classrooms/:id

// Update classroom appearance
PUT /api/classrooms/:id/appearance
Body: {
  background: { type: 'gradient', gradient: '...' },
  header: { showSubject: true, textColor: '#fff' }
}

// Get available themes
GET /api/classrooms/themes

// Reset to default appearance  
POST /api/classrooms/:id/appearance/reset
```

## Controller Example

```javascript
// classroom.controller.js
const updateClassroomAppearance = async (req, res) => {
  try {
    const { id } = req.params;
    const { background, header, customCss } = req.body;

    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Update background
    if (background) {
      await classroom.setBackground(background);
    }

    // Update header settings
    if (header) {
      if (!classroom.appearance) classroom.appearance = {};
      classroom.appearance.header = { ...classroom.appearance.header, ...header };
    }

    // Update custom CSS
    if (customCss !== undefined) {
      if (!classroom.appearance) classroom.appearance = {};
      classroom.appearance.customCss = customCss;
    }

    await classroom.save();

    res.json({
      success: true,
      data: {
        appearance: classroom.appearance,
        backgroundStyle: classroom.getBackgroundStyle()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const getAvailableThemes = async (req, res) => {
  try {
    const themes = Classroom.getAvailableThemes();
    res.json({ success: true, data: themes });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
```

## Security Considerations

1. **CSS Sanitization**: Custom CSS được sanitize để ngăn XSS
2. **File Upload**: Background images nên được validate size và type
3. **Rate Limiting**: Giới hạn số lần update appearance
4. **Permissions**: Chỉ teacher của classroom mới được phép update

## Best Practices

1. **Performance**: Cache background styles ở client
2. **UX**: Preview trước khi apply changes
3. **Accessibility**: Đảm bảo contrast ratio đủ tốt
4. **Mobile**: Responsive design cho mobile devices
5. **Fallbacks**: Luôn có fallback cho trường hợp không load được background

---

*Tính năng appearance customization giúp tạo ra classroom environment cá nhân hóa và hấp dẫn hơn!* 🎨 