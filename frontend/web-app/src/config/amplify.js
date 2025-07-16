// File: frontend/web-app/src/config/amplify.js
// AWS Amplify configuration for Cognito authentication

import { Amplify } from '@aws-amplify/core';

// Cognito configuration from your existing setup
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_8lWGDfv0w',
      userPoolClientId: '20gj35c0vmamtm4qgtk3euoh27',
      region: 'us-east-1',
      // Social providers will be configured here once set up in Cognito
      socialProviders: ['GOOGLE', 'FACEBOOK'],
      // Optional: Custom domain if you set one up later
      // loginWith: {
      //   oauth: {
      //     domain: 'your-domain.auth.us-east-1.amazoncognito.com',
      //     scopes: ['email', 'profile', 'openid'],
      //     redirectSignIn: ['http://localhost:5173/', 'https://your-domain.com/'],
      //     redirectSignOut: ['http://localhost:5173/', 'https://your-domain.com/'],
      //     responseType: 'code'
      //   }
      // }
    }
  }
};

// Configure Amplify
Amplify.configure(amplifyConfig);

export default amplifyConfig;
