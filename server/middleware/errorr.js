const httpStatus = require('http-status');
const ApiError = require('../utils/ApiErrorr');

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;
  
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  // Format validation errors from Joi
  if (error.statusCode === httpStatus.BAD_REQUEST && error.message.includes(',')) {
    const validationErrors = error.message.split(', ').map(msg => {
      // Parse the field name from the message (typically in the format "field" must be...)
      const fieldMatch = msg.match(/^"([^"]+)"/);
      const field = fieldMatch ? fieldMatch[1] : 'field';
      
      return {
        field,
        message: msg
      };
    });
    
    const response = {
      success: false,
      statusCode: error.statusCode,
      message: 'Validation Error',
      errors: validationErrors
    };
    
    return res.status(error.statusCode).json(response);
  }
  
  // Standard error response
  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
  };
  
  // Include stack trace in development
  // if (process.env.NODE_ENV === 'development') {
  //   response.stack = error.stack;
  // }
  
  res.status(error.statusCode).json(response);
};
const uploadErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err.name === 'MulterError') {
      // Handle Multer-specific errors
      let errorMessage = '';
      
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          errorMessage = 'File is too large. Maximum size is 5MB.';
          break;
        case 'LIMIT_FILE_COUNT':
          errorMessage = 'Too many files uploaded. Please try again with fewer files.';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          errorMessage = 'Unexpected file field. Please check your form submission.';
          break;
        default:
          errorMessage = `Upload error: ${err.message}`;
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    } else if (err.http_code) {
      // Handle Cloudinary-specific errors
      return res.status(err.http_code).json({
        success: false,
        message: `Cloudinary error: ${err.message}`
      });
    }
    
    // Generic error handling
    console.error('Upload error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error processing upload',
      error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
  }
  
  next();
};
module.exports = {
  errorHandler,
  uploadErrorHandler
};