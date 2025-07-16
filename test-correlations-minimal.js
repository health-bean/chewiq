// Minimal test to isolate the correlations issue
const { getCurrentUser } = require('./backend/functions/api/middleware/auth');

async function testAuth() {
  console.log('Testing auth middleware with demo headers...');
  
  // Simulate a request with demo headers
  const mockEvent = {
    headers: {
      'x-demo-mode': 'true',
      'x-demo-user-id': 'sarah-aip'
    }
  };
  
  try {
    console.log('Calling getCurrentUser with mock event...');
    const user = await getCurrentUser(mockEvent);
    
    if (user) {
      console.log('Authentication successful!');
      console.log('User:', JSON.stringify(user, null, 2));
    } else {
      console.log('Authentication failed - no user returned');
    }
  } catch (error) {
    console.error('Error during authentication:', error);
  }
}

testAuth().catch(console.error);