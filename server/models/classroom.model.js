const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    students: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
      }
    }],
    maxStudents: {
      type: Number,
      default: 50
    },
    category: {
      type: String,
      enum: ['academic', 'professional', 'other'],
      default: 'academic'
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending_delete', 'pending_edit', 'pending_creation', 'deleted'],
      default: 'inactive',
      index: true
    },
    isActive: {
      type: Boolean,
      default: false, // Default false, will be activated after approval
      index: true
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Appearance and customization
    appearance: {
      background: {
        type: {
          type: String,
          enum: ['color', 'gradient', 'image', 'theme'],
          default: 'gradient'
        },
        // For solid colors
        color: {
          type: String,
          default: '#1976d2'
        },
        // For gradients
        gradient: {
          type: String,
          default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        // For background images
        image: {
          url: String,
          position: {
            type: String,
            default: 'center'
          },
          size: {
            type: String,
            default: 'cover'
          },
          repeat: {
            type: String,
            default: 'no-repeat'
          }
        },
        // For predefined themes
        theme: {
          type: String,
          enum: ['default', 'ocean', 'forest', 'sunset', 'night', 'autumn', 'spring'],
          default: 'default'
        }
      },
      // Header customization
      header: {
        showSubject: {
          type: Boolean,
          default: true
        },
        showDescription: {
          type: Boolean,
          default: true
        },
        textColor: {
          type: String,
          default: '#ffffff'
        }
      },
      // Custom styling
      customCss: {
        type: String,
        maxlength: 2000 // Limit custom CSS for security
      }
    },
    settings: {
      allowStudentInvite: {
        type: Boolean,
        default: false
      },
      allowStudentPost: {
        type: Boolean,
        default: true
      },
      allowStudentComment: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true,
  }
);

// Predefined themes
const PREDEFINED_THEMES = {
  default: {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff'
  },
  ocean: {
    gradient: 'linear-gradient(135deg, #667db6 0%, #0082c8 35%, #0082c8 100%)',
    textColor: '#ffffff'
  },
  forest: {
    gradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    textColor: '#ffffff'
  },
  sunset: {
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
    textColor: '#ffffff'
  },
  night: {
    gradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    textColor: '#ffffff'
  },
  autumn: {
    gradient: 'linear-gradient(135deg, #d63031 0%, #e17055 100%)',
    textColor: '#ffffff'
  },
  spring: {
    gradient: 'linear-gradient(135deg, #00b894 0%, #55a3ff 100%)',
    textColor: '#ffffff'
  }
};

// Instance methods for appearance management
classroomSchema.methods.getBackgroundStyle = function() {
  const appearance = this.appearance || {};
  const background = appearance.background || {};
  
  switch (background.type) {
    case 'color':
      return {
        background: background.color || '#1976d2'
      };
    case 'gradient':
      return {
        background: background.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      };
    case 'image':
      if (background.image && background.image.url) {
        return {
          backgroundImage: `url(${background.image.url})`,
          backgroundPosition: background.image.position || 'center',
          backgroundSize: background.image.size || 'cover',
          backgroundRepeat: background.image.repeat || 'no-repeat'
        };
      }
      return { background: '#1976d2' };
    case 'theme':
      const theme = PREDEFINED_THEMES[background.theme] || PREDEFINED_THEMES.default;
      return {
        background: theme.gradient
      };
    default:
      return {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      };
  }
};

classroomSchema.methods.setBackground = function(backgroundData) {
  if (!this.appearance) {
    this.appearance = {};
  }
  if (!this.appearance.background) {
    this.appearance.background = {};
  }
  
  Object.assign(this.appearance.background, backgroundData);
  return this.save();
};

classroomSchema.methods.resetToDefaultAppearance = function() {
  this.appearance = {
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
  };
  return this.save();
};

// Static method to get available themes
classroomSchema.statics.getAvailableThemes = function() {
  return Object.keys(PREDEFINED_THEMES).map(key => ({
    name: key,
    gradient: PREDEFINED_THEMES[key].gradient,
    textColor: PREDEFINED_THEMES[key].textColor
  }));
};

// Validation middleware
classroomSchema.pre('save', function(next) {
  // Validate background settings
  if (this.appearance && this.appearance.background) {
    const bg = this.appearance.background;
    
    // Validate color format (basic hex validation)
    if (bg.color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(bg.color)) {
      return next(new Error('Invalid color format. Please use hex format (#RRGGBB or #RGB)'));
    }
    
    // Validate theme
    if (bg.theme && !PREDEFINED_THEMES[bg.theme]) {
      return next(new Error('Invalid theme selected'));
    }
    
    // Sanitize custom CSS to prevent XSS
    if (this.appearance.customCss) {
      // Basic sanitization - remove script tags and dangerous properties
      this.appearance.customCss = this.appearance.customCss
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/expression\s*\(/gi, '');
    }
  }
  
  next();
});

// Indexes
classroomSchema.index({ teacher: 1, isActive: 1 });
classroomSchema.index({ 'students.student': 1, 'students.status': 1 });
classroomSchema.index({ code: 1, isActive: 1 });
classroomSchema.index({ category: 1, level: 1 });
classroomSchema.index({ status: 1, isActive: 1 });

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = Classroom; 