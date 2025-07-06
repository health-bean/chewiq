// backend/functions/api/index.js
const { handleLogin, handleRegister, handleLogout, handleRefresh, handleVerify } = require('./handlers/auth');
const { handleGetJournalEntries, handleCreateJournalEntry, handleGetJournalEntry, handleUpdateJournalEntry } = require('./handlers/journal');
const { handleGetProtocols } = require('./handlers/protocols');
const { handleGetTimelineEntries, handleCreateTimelineEntry } = require('./handlers/timeline');
const { handleSearchFoods, handleGetProtocolFoods } = require('./handlers/foods');
const { handleGetCorrelationInsights } = require('./handlers/correlations');
const { handleSearchSymptoms } = require('./handlers/symptoms');
const { handleSearchSupplements } = require('./handlers/supplements');
const { handleSearchMedications } = require('./handlers/medications');
const { handleSearchDetoxTypes } = require('./handlers/detox');
const { handleGetUser, handleUpdateUser, handleGetUserProtocols, handleGetUserPreferences, handleUpdateUserPreferences } = require('./handlers/users');

// Import auth middleware
const { getCurrentUser } = require('./middleware/auth');

// Import CORS handling
const { handleCors, corsHeaders, errorResponse } = require('./utils/responses');

exports.handler = async (event) => {
  try {
    // Handle CORS preflight requests
    const corsResponse = handleCors(event);
    if (corsResponse) return corsResponse;

    const { httpMethod, path, queryStringParameters: queryParams, body } = event;
    const route = path;

    console.log(`${httpMethod} ${route}`, { 
      queryParams: queryParams || {}, 
      body: body ? 'Present' : 'None' 
    });

    // Parse request body for POST/PUT requests
    let parsedBody = {};
    if (body) {
      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        console.error('Error parsing request body:', e);
        return errorResponse('Invalid JSON in request body', 400);
      }
    }

    // Authentication routes (PUBLIC)
    if (route === '/api/v1/auth/register' && httpMethod === 'POST') {
      return await handleRegister(parsedBody, event);
    }
    if (route === '/api/v1/auth/login' && httpMethod === 'POST') {
      return await handleLogin(parsedBody, event);
    }
    if (route === '/api/v1/auth/logout' && httpMethod === 'POST') {
      return await handleLogout(parsedBody, event);
    }
    if (route === '/api/v1/auth/refresh' && httpMethod === 'POST') {
      return await handleRefresh(parsedBody, event);
    }
    if (route === '/api/v1/auth/verify' && httpMethod === 'GET') {
      return await handleVerify(queryParams || {}, event);
    }

    // Health check route (PUBLIC)
    if (route === '/api/v1/health' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        })
      };
    }

    // Get current user for protected routes
    let currentUser;
    try {
      currentUser = await getCurrentUser(event);
    } catch (error) {
      console.log('Authentication not required for public routes');
      // Some routes don't require authentication
    }

    // User routes (PROTECTED)
    if (route === '/api/v1/users' && httpMethod === 'GET') {
      return await handleGetUser(queryParams || {}, event, currentUser);
    }
    if (route === '/api/v1/users' && httpMethod === 'PUT') {
      return await handleUpdateUser(parsedBody, event, currentUser);
    }
    if (route === '/api/v1/users/me' && httpMethod === 'GET') {
      return await handleGetUser(queryParams || {}, event, currentUser);
    }
    if (route === '/api/v1/users/me' && httpMethod === 'PUT') {
      return await handleUpdateUser(parsedBody, event, currentUser);
    }
    if (route === '/api/v1/user/protocols' && httpMethod === 'GET') {
      return await handleGetUserProtocols(queryParams || {}, event, currentUser);
    }
    if (route === '/api/v1/users/me/protocols' && httpMethod === 'GET') {
      return await handleGetUserProtocols(queryParams || {}, event, currentUser);
    }
    if (route === '/api/v1/user/preferences' && httpMethod === 'GET') {
      return await handleGetUserPreferences(queryParams || {}, event, currentUser);
    }
    if (route === '/api/v1/user/preferences' && httpMethod === 'PUT') {
      return await handleUpdateUserPreferences(parsedBody, event, currentUser);
    }
    if (route === '/api/v1/users/me/preferences' && httpMethod === 'GET') {
      return await handleGetUserPreferences(queryParams || {}, event, currentUser);
    }
    if (route === '/api/v1/users/me/preferences' && httpMethod === 'PUT') {
      return await handleUpdateUserPreferences(parsedBody, event, currentUser);
    }

    // Journal routes (PROTECTED)
    if (route === '/api/v1/journal/entries' && httpMethod === 'GET') {
      return await handleGetJournalEntries(queryParams || {}, event, currentUser);
    }
    if (route === '/api/v1/journal/entries' && httpMethod === 'POST') {
      return await handleCreateJournalEntry(parsedBody, event, currentUser);
    }
    if (route.startsWith('/api/v1/journal/entries/') && httpMethod === 'GET') {
      const entryId = route.split('/').pop();
      return await handleGetJournalEntry({ ...queryParams, entryId }, event, currentUser);
    }
    if (route.startsWith('/api/v1/journal/entries/') && httpMethod === 'PUT') {
      const entryId = route.split('/').pop();
      return await handleUpdateJournalEntry({ ...parsedBody, entryId }, event, currentUser);
    }

    // Timeline routes (PROTECTED)
    if (route === '/api/v1/timeline/entries' && httpMethod === 'GET') {
      return await handleGetTimelineEntries(queryParams || {}, event, currentUser);
    }
    if (route === '/api/v1/timeline/entries' && httpMethod === 'POST') {
      return await handleCreateTimelineEntry(parsedBody, event, currentUser);
    }

    // Protocol routes (PROTECTED)
    if (route === '/api/v1/protocols' && httpMethod === 'GET') {
      return await handleGetProtocols(queryParams || {}, event);
    }

    // Food routes (PROTECTED)
    if (route === '/api/v1/foods/search' && httpMethod === 'GET') {
      return await handleSearchFoods(queryParams || {}, event);
    }
    if (route === '/api/v1/foods/by-protocol' && httpMethod === 'GET') {
      return await handleGetProtocolFoods(queryParams || {}, event);
    }

    // Search routes (PUBLIC)
    if (route === '/api/v1/symptoms/search' && httpMethod === 'GET') {
      return await handleSearchSymptoms(queryParams || {}, event);
    }
    if (route === '/api/v1/supplements/search' && httpMethod === 'GET') {
      return await handleSearchSupplements(queryParams || {}, event);
    }
    if (route === '/api/v1/medications/search' && httpMethod === 'GET') {
      return await handleSearchMedications(queryParams || {}, event);
    }
    if (route === '/api/v1/detox/search' && httpMethod === 'GET') {
      return await handleSearchDetoxTypes(queryParams || {}, event);
    }
    if (route === '/api/v1/detox-types' && httpMethod === 'GET') {
      return await handleSearchDetoxTypes(queryParams || {}, event);
    }

    // Correlation routes (PUBLIC with userId param)
    if (route === '/api/v1/correlations/insights' && httpMethod === 'GET') {
      return await handleGetCorrelationInsights(queryParams || {}, event);
    }

    // Legacy routes for backward compatibility
    if (route === '/api/v1/exposure-types' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          exposure_types: [
            { id: 1, name: 'Environmental', description: 'Air, water, soil contaminants' },
            { id: 2, name: 'Chemical', description: 'Household chemicals, pesticides' },
            { id: 3, name: 'Food', description: 'Processed foods, additives' },
            { id: 4, name: 'Digital', description: 'EMF, blue light exposure' }
          ]
        })
      };
    }

    // Default response for unknown routes
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Route not found',
        route: route,
        method: httpMethod,
        message: `${httpMethod} ${route} is not implemented`
      })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};