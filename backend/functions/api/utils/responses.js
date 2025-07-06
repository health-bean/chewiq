const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,X-Requested-With',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'false',
    'Content-Type': 'application/json'
};

const createResponse = (statusCode, data, headers = {}) => ({
    statusCode,
    headers: { ...corsHeaders, ...headers },
    body: JSON.stringify(data)
});

const successResponse = (data, statusCode = 200) => 
    createResponse(statusCode, data);

const errorResponse = (message, statusCode = 500, details = null) => 
    createResponse(statusCode, {
        error: message,
        ...(details && { details })
    });

// CORS handling function
const handleCors = (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'CORS preflight successful' })
        };
    }
    return null;
};

module.exports = {
    corsHeaders,
    createResponse,
    successResponse,
    errorResponse,
    handleCors
};