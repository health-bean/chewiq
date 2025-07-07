// backend/functions/api/utils/responses.js

const allowedOrigins = [
  'http://localhost:5173',
  'https://main.d45x824boqj7y.amplifyapp.com'
];

const getCorsHeaders = (origin) => {
  if (allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,X-Requested-With',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'application/json'
    };
  } else {
    return {
      'Access-Control-Allow-Origin': 'null', // Or omit to reject
      'Content-Type': 'application/json'
    };
  }
};

const createResponse = (statusCode, data, event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const corsHeaders = getCorsHeaders(origin);

  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data)
  };
};

const successResponse = (data, event, statusCode = 200) => 
  createResponse(statusCode, data, event);

const errorResponse = (message, event, statusCode = 500, details = null) => 
  createResponse(statusCode, {
    error: message,
    ...(details && { details })
  }, event);

// Handle OPTIONS preflight requests
const handleCors = (event) => {
  if (event.httpMethod === 'OPTIONS') {
    const origin = event.headers?.origin || event.headers?.Origin || '';
    if (allowedOrigins.includes(origin)) {
      return {
        statusCode: 200,
        headers: getCorsHeaders(origin),
        body: JSON.stringify({ message: 'CORS preflight successful' })
      };
    } else {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'CORS origin not allowed' })
      };
    }
  }
  return null;
};

module.exports = {
  successResponse,
  errorResponse,
  handleCors
};
