// File: frontend/shared/components/AmplifyAuthProvider.jsx
// Simplified authentication provider with AWS Amplify + Demo mode support

import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from '@aws-amplify/auth';
import { Amplify } from '@aws-amplify/core';

// Configure Amplify directly here
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_8lWGDfv0w',
      userPoolClientId: '20gj35c0vmamtm4qgtk3euoh27',
      region: 'us-east-1'
    }
  }
};

// Configure Amplify
Amplify.configure(amplifyConfig);

// Create Auth Context
const AuthContext = createContext(null);

// Demo user profiles for prototype (same as before)
const DEMO_USERS = [
  {
    id: 'sarah-aip',
    email: 'sarah.aip@test.com',
    name: 'Sarah Johnson',
    avatar: '👩‍💼',
    protocol: 'AIP (Autoimmune Protocol)',
    entries: '1,052 entries',
    joinDate: '2023-03-15'
  },
  {
    id: 'mike-fodmap',
    email: 'mike.fodmap@test.com',
    name: 'Mike Chen',
    avatar: '👨‍💻',
    protocol: 'Low FODMAP',
    entries: '1,215 entries',
    joinDate: '2023-01-20'
  },
  {
    id: 'lisa-histamine',
    email: 'lisa.histamine@test.com',
    name: 'Lisa Rodriguez',
    avatar: '👩‍🔬',
    protocol: 'Low Histamine',
    entries: '933 entries',
    joinDate: '2023-05-10'
  },
  {
    id: 'john-paleo',
    email: 'john.paleo@test.com',
    name: 'John Williams',
    avatar: '👨‍🍳',
    protocol: 'Paleo AIP',
    entries: '970 entries',
    joinDate: '2023-02-28'
  },
  {
    id: 'emma-multi',
    email: 'emma.multi@test.com',
    name: 'Emma Davis',
    avatar: '👩‍⚕️',
    protocol: 'Multiple Protocols',
    entries: '1,071 entries',
    joinDate: '2023-04-05'
  }
];

// Simple logger for debugging
const logger = {
  info: (msg, data) => console.log(`[AUTH] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[AUTH] ${msg}`, data || ''),
  debug: (msg, data) => console.log(`[AUTH DEBUG] ${msg}`, data || '')
};

// Enhanced Auth Provider Component
export const AmplifyAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // Authentication state
  const isAuthenticated = !!currentUser;
  const isDemoMode = currentUser?.isDemo || false;

  // Initialize auth state on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  // Check current authentication state
  const checkAuthState = async () => {
    try {
      setLoading(true);
      
      // Try to get current Cognito user
      const cognitoUser = await getCurrentUser();
      if (cognitoUser) {
        // Get auth session for token
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        
        const user = {
          id: cognitoUser.userId,
          email: cognitoUser.signInDetails?.loginId || 'unknown@cognito.com',
          name: cognitoUser.username,
          cognitoUser: cognitoUser,
          isDemo: false,
          sessionId: `cognito_${Date.now()}`,
          loginTime: new Date().toISOString()
        };
        
        setCurrentUser(user);
        setAuthToken(token);
        
        logger.info('Cognito user session restored', { 
          userId: user.id,
          email: user.email 
        });
      }
    } catch (error) {
      // No current user - this is normal for logged out state
      logger.debug('No current Cognito session', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Generate simple session ID for demo users
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Enhanced login - supports both Cognito and demo
  const login = async (email, password = 'demo123') => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Login attempt', { email, isDemo: password === 'demo123' });
      
      // Check if this is a demo user
      const demoUser = DEMO_USERS.find(user => 
        user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (demoUser && password === 'demo123') {
        // Demo login
        const sessionUser = {
          ...demoUser,
          sessionId: generateSessionId(),
          loginTime: new Date().toISOString(),
          isDemo: true
        };
        
        setCurrentUser(sessionUser);
        setAuthToken(null); // No token for demo users
        
        logger.info('Demo login successful', { 
          userId: sessionUser.id,
          name: sessionUser.name,
          sessionId: sessionUser.sessionId
        });
        
        return { success: true, user: sessionUser };
      }
      
      // Real Cognito login
      try {
        const cognitoResult = await signIn({
          username: email,
          password: password
        });
        
        if (cognitoResult.isSignedIn) {
          // Get user details and token
          const cognitoUser = await getCurrentUser();
          const session = await fetchAuthSession();
          const token = session.tokens?.idToken?.toString();
          
          const user = {
            id: cognitoUser.userId,
            email: email,
            name: cognitoUser.username,
            cognitoUser: cognitoUser,
            isDemo: false,
            sessionId: `cognito_${Date.now()}`,
            loginTime: new Date().toISOString()
          };
          
          setCurrentUser(user);
          setAuthToken(token);
          
          logger.info('Cognito login successful', { 
            userId: user.id,
            email: user.email 
          });
          
          return { success: true, user: user };
        } else {
          throw new Error('Sign in not completed');
        }
      } catch (cognitoError) {
        // If Cognito fails and it's not a demo user, show error
        if (!demoUser) {
          throw new Error(`Authentication failed: ${cognitoError.message}`);
        }
        // If it was a demo user with wrong password
        throw new Error('Invalid password. Use "demo123" for demo accounts or your real password for Cognito accounts.');
      }
      
    } catch (error) {
      logger.error('Login failed', { error: error.message, email });
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced signup - only for real users (demo users are predefined)
  const signup = async (email, password, firstName, lastName) => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Signup attempt', { email });
      
      // Check if this is a demo email
      const isDemoEmail = DEMO_USERS.some(user => 
        user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (isDemoEmail) {
        throw new Error('This email is reserved for demo users. Please use the demo login or choose a different email.');
      }
      
      // Real Cognito signup
      const result = await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
            given_name: firstName,
            family_name: lastName
          }
        }
      });
      
      logger.info('Cognito signup successful', { 
        email,
        userId: result.userId,
        nextStep: result.nextStep?.signUpStep 
      });
      
      return { 
        success: true, 
        result: result,
        needsConfirmation: result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP'
      };
      
    } catch (error) {
      logger.error('Signup failed', { error: error.message, email });
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logout - handles both Cognito and demo
  const logout = async () => {
    try {
      logger.info('Logout attempt', { 
        userId: currentUser?.id,
        isDemo: currentUser?.isDemo 
      });
      
      if (currentUser && !currentUser.isDemo) {
        // Sign out from Cognito
        await signOut();
      }
      
      // Clear local state for both demo and real users
      setCurrentUser(null);
      setAuthToken(null);
      setError(null);
      
      logger.info('Logout successful');
      
    } catch (error) {
      logger.error('Logout error', { error: error.message });
      // Clear state anyway
      setCurrentUser(null);
      setAuthToken(null);
    }
  };

  // Get current user context for API calls
  const getUserContext = () => {
    if (!currentUser) return null;
    
    return {
      userId: currentUser.id,
      email: currentUser.email,
      sessionId: currentUser.sessionId,
      isDemo: currentUser.isDemo,
      token: authToken
    };
  };

  // Enhanced auth context value
  const value = {
    // State
    user: currentUser,
    loading,
    error,
    isAuthenticated,
    isDemoMode,
    authToken,
    
    // Actions
    login,
    signup,
    logout,
    getUserContext,
    setError,
    checkAuthState,
    
    // Demo users for UI
    demoUsers: DEMO_USERS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAmplifyAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAmplifyAuth must be used within an AmplifyAuthProvider');
  }
  return context;
};

// Export context for advanced usage
export { AuthContext };
