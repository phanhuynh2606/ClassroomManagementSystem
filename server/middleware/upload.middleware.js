// middlewares/uploadMiddleware.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary.config');
const path = require('path');

const createUploadMiddleware = (folderPath = 'messages', maxCount = 5) => {
  // Configure Cloudinary storage for multer
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: (req, file) => {
        // Allow custom folders from request
        const customFolder = req.body.customFolder || 'classmanagement';
        return `${customFolder}/${folderPath}`;
      },
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ],

      // Add custom public_id for better organization
      public_id: (req, file) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileNameWithoutExt = file.originalname.split('.')[0]
          .replace(/[^a-zA-Z0-9]/g, '_'); // sanitize filename
        return `${fileNameWithoutExt}-${uniqueSuffix}`;
      }
    }
  });

  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit per file
      files: maxCount // Maximum number of files
    }
  });

  return upload;
};

const createMaterialUploadMiddleware = (folderPath = 'materials', maxCount = 1) => {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
      // Determine resource type based on file type
      const isVideo = file.mimetype.startsWith('video/');
      const isImage = file.mimetype.startsWith('image/');
      const customFolder = req.body.customFolder || 'classmanagement';
      const classroomId = req.params.classId || req.body.classroomId || 'general';
      const folderStructure = `${customFolder}/${folderPath}/${classroomId}`;

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileNameWithoutExt = file.originalname.split('.')[0]
        .replace(/[^a-zA-Z0-9]/g, '_') // sanitize filename
        .trim(); // Remove any leading/trailing whitespace
      const originalExtension = path.extname(file.originalname).toLowerCase();

      // Don't add extension to public_id - let Cloudinary handle it
      const publicId = `${fileNameWithoutExt}-${uniqueSuffix}${originalExtension}`;

      const baseParams = {
        folder: folderStructure,
        public_id: publicId,
        use_filename: false, // Don't use original filename
        unique_filename: true // Ensure unique filenames
      };

      console.log('Creating material upload params:', baseParams);

      if (isVideo) {
        return {
          ...baseParams,
          resource_type: 'video',
          // Don't restrict allowed_formats for videos - let Cloudinary handle it
        };
      } else if (isImage) {
        return {
          ...baseParams,
          resource_type: 'image',
          transformation: [
            { width: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        };
      } else {
        // For documents and other files - don't restrict formats
        return {
          ...baseParams,
          resource_type: 'raw'
          // Remove allowed_formats to allow all file types
        };
      }
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = {
      // Documents
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt',
      // Presentations
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',

      // Spreadsheets
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/csv': 'csv',
      // Videos
      'video/mp4': 'mp4',
      'video/avi': 'avi',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi',
      'video/x-ms-wmv': 'wmv',
      'video/x-flv': 'flv',
      'video/webm': 'webm',
      'video/x-matroska': 'mkv',

      // Archives
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'application/x-7z-compressed': '7z',
    };

    if (allowedMimeTypes[file.mimetype]) {
      // Add detected file type to request for later use
      req.detectedFileType = allowedMimeTypes[file.mimetype];
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported. Please upload PDF, Word documents, presentations, images, videos, or other supported formats.`), false);
    }
  };

  // Configure multer with enhanced settings for materials
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: getFileSizeLimit(), // Dynamic file size based on type
      files: maxCount
    }
  });

  return upload;
};

// Create specialized background upload middleware
const createBackgroundUploadMiddleware = () => {
  // Configure Cloudinary storage specifically for backgrounds
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'classmanagement/backgrounds',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' }, // HD resolution for backgrounds
        { quality: 'auto:good', fetch_format: 'auto' } // Higher quality for backgrounds
      ],
      // Custom public_id for backgrounds
      public_id: (req, file) => {
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1E9);
        return `bg_classroom_${timestamp}_${randomSuffix}`;
      }
    }
  });

  // File filter specifically for background images
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for backgrounds!'), false);
    }
  };

  // Configure multer with higher limits for backgrounds
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for background images
      files: 1 // Only single background image
    }
  });

  return upload;
};

function getFileSizeLimit() {
  return 20 * 1024 * 1024; // 20MB
}

const createAttachmentUploadMiddleware = () => {
  // Configure Cloudinary storage for attachments
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const isImage = file.mimetype.startsWith('image/');
      const customFolder = req.body.customFolder || 'classmanagement';
      const folderStructure = `${customFolder}/attachments`;

      const baseParams = {
        folder: folderStructure,
        public_id: () => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const fileNameWithoutExt = file.originalname.split('.')[0]
            .replace(/[^a-zA-Z0-9]/g, '_');
          return `attachment_${fileNameWithoutExt}_${uniqueSuffix}`;
        }
      };

      if (isVideo) {
        return {
          ...baseParams,
          resource_type: 'video',
          allowed_formats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
          transformation: [{ quality: 'auto' }]
        };
      } else if (isImage) {
        return {
          ...baseParams,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          transformation: [
            { width: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        };
      } else {
        return {
          ...baseParams,
          resource_type: 'raw',
          allowed_formats: [
            'pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx',
            'xls', 'xlsx', 'csv', 'zip', 'rar', '7z'
          ]
        };
      }
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // Documents
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      // Presentations
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Spreadsheets
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      // Videos
      'video/mp4', 'video/avi', 'video/quicktime', 'video/webm',
      // Archives
      'application/zip', 'application/x-rar-compressed'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported for attachments`), false);
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB limit for attachments
      files: 1
    }
  });

  return upload;
};


const createUploadAssignmentMiddleware = (folderPath = 'assignments', maxCount = 5) => {
  // Configure Cloudinary storage for multer
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: (req, file) => {
        // Allow custom folders from request
        const customFolder = req.body.customFolder || 'classmanagement';
        const classroomId = req.params.classroomId || req.body.classroomId || req.resolvedClassroomId || 'general';
        return `${customFolder}/assignments/${classroomId}/${folderPath}`;
      },
      // Support all file types
      // allowed_formats: [
      //   // Images
      //   'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg',
      //   // Documents
      //   'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf',
      //   // Videos
      //   'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',
      //   // Audio
      //   'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma',
      //   // Archives
      //   'zip', 'rar', '7z', 'tar', 'gz',
      //   // Others
      //   'csv', 'json', 'xml', 'html', 'css', 'js', 'ts'
      // ],
      // Resource type based on file type
      resource_type: (req, file) => {
        if (file.mimetype.startsWith('image/')) {
          return 'image';
        } else if (file.mimetype.startsWith('video/')) {
          return 'video';
        } else if (file.mimetype.startsWith('audio/')) {
          return 'video'; // Cloudinary uses 'video' for audio files
        } else {
          return 'raw'; // For documents and other file types
        }
      },
      // Conditional transformations (only for images)
      transformation: (req, file) => {
        if (file.mimetype.startsWith('image/')) {
          return [
            { width: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ];
        }
        return []; // No transformation for non-image files
      },

      // Add custom public_id for better organization
      public_id: (req, file) => {
        const timestamp = Date.now();
        const fileNameWithoutExt = file.originalname.split('.')[0]
          .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
        const extension = file.originalname.split('.').pop();
        return `${fileNameWithoutExt}_${timestamp}.${extension}`;
      },
      use_filename: true,
      unique_filename: true,
    }
  });

  // File filter - now allows all file types with size validation
  const fileFilter = (req, file, cb) => {
    // Define allowed MIME types
    const allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'image/bmp', 'image/tiff', 'image/svg+xml',
      // Documents
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'application/rtf',
      // Videos
      'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
      'video/x-flv', 'video/webm', 'video/x-matroska',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac',
      'audio/ogg', 'audio/x-ms-wma',
      // Archives
      'application/zip', 'application/x-rar-compressed',
      'application/x-7z-compressed', 'application/x-tar', 'application/gzip',
      // Others
      'text/csv', 'application/json', 'application/xml', 'text/xml',
      'text/html', 'text/css', 'application/javascript', 'application/typescript'
    ];

    // Check if file type is allowed
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed!`), false);
    }
  };

  // Configure multer with storage and limits
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: maxCount
    }
  });

  return upload;
};
// Create different middleware instances for different use cases
const profileUpload = createUploadMiddleware('profiles', 1);
const questionImageUpload = createUploadMiddleware('questions', 1);
const backgroundImageUpload = createBackgroundUploadMiddleware();
const attachmentUpload = createAttachmentUploadMiddleware();
const materialUpload = createMaterialUploadMiddleware('materials', 1);

// Assignment-related uploads - separated by purpose
const assignmentUpload = createUploadAssignmentMiddleware("teacher", 5); // Teacher assignment materials
const submissionUpload = createUploadAssignmentMiddleware("submissions", 10); // Student submissions

module.exports = {
  profileUpload,
  questionImageUpload,
  backgroundImageUpload,
  attachmentUpload,
  assignmentUpload,     // For teacher assignment attachments
  submissionUpload,     // For student submissions
  createUploadMiddleware, // Export factory function for custom use cases
  materialUpload
};