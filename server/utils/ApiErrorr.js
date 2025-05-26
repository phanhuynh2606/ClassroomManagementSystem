class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    
    // Add timestamp for logging/debugging
    this.timestamp = new Date();
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Create a validation error with structured error details
   * @param {Object[]} errors - Array of error objects with field and message
   * @returns {ApiError} - New ApiError instance with validation details
   */
  static validationError(errors = []) {
    const formattedErrors = errors.map(err => ({
      field: err.field || 'unknown',
      message: err.message || 'Invalid value'
    }));
    
    return new ApiError(
      400,
      formattedErrors.map(e => `${e.field}: ${e.message}`).join(', '),
      true,
      '',
      formattedErrors
    );
  }
}

module.exports = ApiError;