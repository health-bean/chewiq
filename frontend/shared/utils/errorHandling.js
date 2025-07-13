/**
 * Production-grade error handling utilities
 */

/**
 * Error types for the application
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  SETUP: 'SETUP_ERROR',
  DATA_CORRUPTION: 'DATA_CORRUPTION_ERROR'
};

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.NETWORK, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Handles setup-related errors with appropriate user messaging
 * @param {Error} error - The error to handle
 * @returns {string} - User-friendly error message
 */
export const handleSetupError = (error) => {
  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorTypes.VALIDATION:
        return 'Please check your selections and try again.';
      case ErrorTypes.NETWORK:
        return 'Unable to save your preferences. Please check your connection and try again.';
      case ErrorTypes.DATA_CORRUPTION:
        return 'There was an issue with your data. Please refresh and try again.';
      default:
        return error.message || 'An unexpected error occurred during setup.';
    }
  }
  
  // Handle network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  // Handle validation errors
  if (error.message.includes('validation') || error.message.includes('serializable')) {
    return 'There was an issue with your selections. Please try again.';
  }
  
  // Generic fallback
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Logs errors for debugging while sanitizing sensitive information
 * @param {Error} error - Error to log
 * @param {string} context - Context where error occurred
 * @param {object} metadata - Additional metadata (will be sanitized)
 */
export const logError = (error, context, metadata = {}) => {
  // In production, you would send this to a logging service
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error.name,
      message: error.message,
      type: error.type || 'UNKNOWN'
    },
    // Sanitize metadata to remove sensitive information
    metadata: sanitizeMetadata(metadata)
  };
  
  console.error(`[${context}]`, errorLog);
  
  // In production, send to logging service:
  // sendToLoggingService(errorLog);
};

/**
 * Sanitizes metadata to remove sensitive information
 * @param {object} metadata - Metadata to sanitize
 * @returns {object} - Sanitized metadata
 */
const sanitizeMetadata = (metadata) => {
  const sanitized = { ...metadata };
  
  // Remove sensitive keys
  const sensitiveKeys = ['password', 'token', 'auth', 'secret', 'key'];
  
  const removeSensitiveData = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        cleaned[key] = removeSensitiveData(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };
  
  return removeSensitiveData(sanitized);
};
