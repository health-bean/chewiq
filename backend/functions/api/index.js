const { handleLogin, handleRegister, handleLogout, handleVerify } = require('./handlers/auth');
const { handleGetJournals, handleCreateJournal, handleUpdateJournal, handleDeleteJournal } = require('./handlers/journal');

exports.handler = async (event, context) => {
  try {
    const { httpMethod, path, pathParameters } = event;
    const route = path || event.resource;
    
    console.log(`Processing ${httpMethod} ${route}`);
    
    // Auth routes
    if (route === '/api/v1/auth/login' && httpMethod === 'POST') {
      return await handleLogin(event, context);
    }
    
    if (route === '/api/v1/auth/register' && httpMethod === 'POST') {
      return await handleRegister(event, context);
    }
    
    if (route === '/api/v1/auth/logout' && httpMethod === 'POST') {
      return await handleLogout(event, context);
    }
    
    if (route === '/api/v1/auth/verify' && httpMethod === 'GET') {
      return await handleVerify(event, context);
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
    
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
