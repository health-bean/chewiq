// Direct authentication with AWS SDK (no Amplify)
import { CognitoIdentityProviderClient, InitiateAuthCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

// Cognito configuration
const REGION = 'us-east-1';
const USER_POOL_ID = 'us-east-1_vr1pPiP6N';
const CLIENT_ID = '5luhu590qnjdgi7579k1mqoct9';

// Create a Cognito Identity Provider client
const client = new CognitoIdentityProviderClient({ region: REGION });

/**
 * Check if a user exists in the user pool
 * @param {string} username - The username (email)
 * @returns {Promise<Object>} - The result
 */
export const checkUser = async (username) => {
  try {
    console.log('🔍 Checking if user exists:', { username });
    
    // Create the command
    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username
    });
    
    // Send the command
    const response = await client.send(command);
    
    console.log('✅ User exists:', {
      username,
      userStatus: response.UserStatus,
      enabled: response.Enabled,
      attributes: response.UserAttributes
    });
    
    return {
      exists: true,
      userStatus: response.UserStatus,
      enabled: response.Enabled,
      attributes: response.UserAttributes
    };
  } catch (error) {
    console.error('❌ Error checking user:', error);
    return {
      exists: false,
      error: error.message
    };
  }
};

/**
 * Sign in with username and password
 * @param {string} username - The username (email)
 * @param {string} password - The password
 * @returns {Promise<Object>} - The authentication result
 */
export const signIn = async (username, password) => {
  try {
    console.log('🔑 Direct sign in with:', { username });
    
    // Create the auth command
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    });
    
    // Send the command
    const response = await client.send(command);
    
    console.log('✅ Direct sign in successful');
    return {
      success: true,
      authResult: response.AuthenticationResult,
      challengeName: response.ChallengeName,
      session: response.Session
    };
  } catch (error) {
    console.error('❌ Direct sign in error:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed'
    };
  }
};

export default {
  signIn,
  checkUser
};
