const { handleLogin, handleRegister, handleLogout, handleVerify } = require('./handlers/auth');
const { handleGetJournals, handleCreateJournal, handleUpdateJournal, handleDeleteJournal } = require('./handlers/journal');
const { handleGetProtocols } = require('./handlers/protocols');
const { handleGetTimelineEntries, handleCreateTimelineEntry } = require('./handlers/timeline');
const { handleSearchFoods, handleGetProtocolFoods } = require('./handlers/foods');
const { handleGetCorrelationInsights } = require('./handlers/correlations');
const { handleSearchSymptoms } = require('./handlers/symptoms');
const { handleSearchSupplements } = require('./handlers/supplements');
const { handleSearchMedications } = require('./handlers/medications');
const { handleSearchDetoxTypes } = require('./handlers/detox');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
};

exports.handler = async (event, context) => {
  try {
    const { httpMethod, path, pathParameters, queryStringParameters } = event;
    const route = path || event.resource;
    
    console.log(`Processing ${httpMethod} ${route}`);
    
    // Handle preflight OPTIONS requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }
    
    // Parse body if it exists
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        console.error('Body parsing error:', e);
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }
    }
    
    // Auth routes
    if (route === '/api/v1/auth/login' && httpMethod === 'POST') {
      return await handleLogin(body, event);
    }
    
    if (route === '/api/v1/auth/register' && httpMethod === 'POST') {
      return await handleRegister(body, event);
    }
    
    if (route === '/api/v1/auth/logout' && httpMethod === 'POST') {
      return await handleLogout(body, event);
    }
    
    if (route === '/api/v1/auth/verify' && httpMethod === 'GET') {
      return await handleVerify(body, event);
    }
    
    // Journal routes
    if (route === '/api/v1/journals' && httpMethod === 'GET') {
      return await handleGetJournals(event, context);
    }
    
    if (route === '/api/v1/journals' && httpMethod === 'POST') {
      return await handleCreateJournal(event, context);
    }
    
    if (route.startsWith('/api/v1/journals/') && httpMethod === 'PUT') {
      return await handleUpdateJournal(event, context);
    }
    
    if (route.startsWith('/api/v1/journals/') && httpMethod === 'DELETE') {
      return await handleDeleteJournal(event, context);
    }
    
    // Protocol routes
    if (route === '/api/v1/protocols' && httpMethod === 'GET') {
      return await handleGetProtocols(queryStringParameters || {}, event);
    }
    
    // Timeline routes
    if (route === '/api/v1/timeline/entries' && httpMethod === 'GET') {
      return await handleGetTimelineEntries(queryStringParameters || {}, event);
    }
    
    if (route === '/api/v1/timeline/entries' && httpMethod === 'POST') {
      return await handleCreateTimelineEntry(body, event);
    }
    
    // Food routes
    if (route === '/api/v1/foods/search' && httpMethod === 'GET') {
      return await handleSearchFoods(queryStringParameters || {}, event);
    }
    
    if (route === '/api/v1/foods/by-protocol' && httpMethod === 'GET') {
      return await handleGetProtocolFoods(queryStringParameters || {}, event);
    }
    
    // Search routes for Track dropdown
    if (route === '/api/v1/symptoms/search' && httpMethod === 'GET') {
      return await handleSearchSymptoms(queryStringParameters || {}, event);
    }
    
    if (route === '/api/v1/supplements/search' && httpMethod === 'GET') {
      return await handleSearchSupplements(queryStringParameters || {}, event);
    }
    
    if (route === '/api/v1/medications/search' && httpMethod === 'GET') {
      return await handleSearchMedications(queryStringParameters || {}, event);
    }
    
    if (route === '/api/v1/detox/search' && httpMethod === 'GET') {
      return await handleSearchDetoxTypes(queryStringParameters || {}, event);
    }
    
    // Correlation routes
    if (route === '/api/v1/correlations/insights' && httpMethod === 'GET') {
      return await handleGetCorrelationInsights(queryStringParameters || {}, event);
    }
    
    return {
      statusCode: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Route not found',
        route: route,
        method: httpMethod
      })
    };
    
  } catch (error) {
    console.error('Lambda handler error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
