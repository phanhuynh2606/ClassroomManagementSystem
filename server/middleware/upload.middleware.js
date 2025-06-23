// middlewares/uploadMiddleware.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary.config');


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

  // File filter to only allow images
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  };

  // Configure multer with storage and limits
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
  // Configure Cloudinary storage for materials
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
      // Determine resource type based on file type
      const isVideo = file.mimetype.startsWith('video/');
      const isImage = file.mimetype.startsWith('image/'); 
      const customFolder = req.body.customFolder || 'classmanagement';
      const classroomId = req.params.classId || req.body.classroomId || 'general';
      const folderStructure = `${customFolder}/${folderPath}/${classroomId}`;

      const baseParams = {
        folder: folderStructure,
        // Add custom public_id for better organization
        public_id: () => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const fileNameWithoutExt = file.originalname.split('.')[0]
            .replace(/[^a-zA-Z0-9]/g, '_'); // sanitize filename
          return `${fileNameWithoutExt}-${uniqueSuffix}`;
        }
      };

      if (isVideo) {
        return {
          ...baseParams,
          resource_type: 'video',
          allowed_formats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
          // Video-specific transformations (optional)
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        };
      } else if (isImage) {
        return {
          ...baseParams,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'],
          transformation: [
            { width: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        };
      } else {
        // For documents and other files
        return {
          ...baseParams,
          resource_type: 'raw',
          allowed_formats: [ 
            'pdf', 'doc', 'docx', 'txt', 
            'ppt', 'pptx', 'xls', 'xlsx',
            'csv', 'zip', 'rar', '7z' 
          ]
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

// Create different middleware instances for different use cases
const profileUpload = createUploadMiddleware('profiles', 1);

module.exports = {
  profileUpload,
  createUploadMiddleware // Export factory function for custom use cases
};