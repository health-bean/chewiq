const { corsHeaders } = require('../utils/responses');

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
    handleCors,
    corsHeaders
};