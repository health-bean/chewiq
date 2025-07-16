// Comprehensive test for correlations endpoint
const { getCurrentUser } = require('./backend/functions/api/middleware/auth');
const { handleGetCorrelationInsights } = require('./backend/functions/api/handlers/correlations');

async function testCorrelationsFlow() {
  console.log('Testing complete correlations flow...');
  
  // Simulate a request with demo headers
  const mockEvent = {
    headers: {
      'x-demo-mode': 'true',
      'x-demo-user-id': 'sarah-aip'
    },
    queryStringParameters: {
      confidence_threshold: '0.1',
      timeframe_days: '180'
    }
  };
  
  try {
    console.log('Step 1: Testing auth middleware...');
    const user = await getCurrentUser(mockEvent);
    
    if (user) {
      console.log('Authentication successful!');
      console.log('User:', JSON.stringify(user, null, 2));
      
      // Add user to event like the main handler does
      mockEvent.user = user;
      
      console.log('Step 2: Calling correlations handler...');
      const response = await handleGetCorrelationInsights(mockEvent.queryStringParameters, mockEvent);
      
      console.log('Correlations response:', JSON.stringify(response, null, 2));
    } else {
      console.log('Authentication failed - no user returned');
    }
  } catch (error) {
    console.error('Error during test:', error);
    console.error('Error stack:', error.stack);
  }
}

testCorrelationsFlow().catch(console.error);