# health-platform

Documentation deployment
# Permissions fix test
# Testing workflow trigger
# Testing workflow on main branch

## Amplify Authentication Fix

The AWS Amplify authentication has been fixed to resolve the "Auth UserPool not configured" error with Amplify v6.13.3 and @aws-amplify/core v6.12.3 in the React 19.1.0 + Vite 6.3.5 application.

### Key Changes

1. **Fixed Amplify Configuration**:
   - Updated to proper v6 format with explicit loginWith settings
   - Added authenticationFlowType: 'USER_PASSWORD_AUTH'
   - Enabled debug logging

2. **Fixed Authentication Functions**:
   - Replaced dynamic imports with direct imports
   - Added explicit authentication flow type to sign-in calls
   - Fixed error handling

3. **Added Test Components**:
   - Created test utilities and UI components
   - Added a test route in the main app

### Testing Instructions

See [AMPLIFY_AUTH_TEST.md](frontend/web-app/AMPLIFY_AUTH_TEST.md) for detailed testing instructions.

Quick start:
1. Run the app: `cd frontend/web-app && npm run dev`
2. Click "Test Amplify Auth" on the login page
3. Test authentication with your Cognito credentials
