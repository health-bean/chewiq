// Dedicated Amplify initialization file
import { Amplify } from 'aws-amplify';

// Configure Amplify with the correct format for v6
const amplifyConfig = {
  Auth: {
    Cognito: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_vr1pPiP6N',
      userPoolClientId: '5luhu590qnjdgi7579k1mqoct9',
      loginWith: {
        email: true,
        username: false,
        phone: false
      },
      authenticationFlowType: 'USER_SRP_AUTH' // Changed to USER_SRP_AUTH to avoid device tracking issues
    }
  }
};

// Configure Amplify
console.log('🔄 Initializing Amplify with config:', JSON.stringify(amplifyConfig, null, 2));
Amplify.configure(amplifyConfig);
console.log('✅ Amplify initialized successfully');

export default amplifyConfig;
