// Test for the full authentication flow
import React, { useState, useEffect } from 'react';
import { SimpleAuthProvider, useSimpleAuth } from '../SimpleAuthProvider';
import { simpleApiClient } from '../../../../../shared/services/simpleApi';

// Protected content component
const ProtectedContent = ({ onApiCall }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Make an API call to a protected endpoint
      const result = await simpleApiClient.get('/user/profile');
      setData(result);
      onApiCall && onApiCall(true, result);
    } catch (err) {
      setError(err.message);
      onApiCall && onApiCall(false, err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-md shadow-md mb-4">
      <h3 className="font-semibold mb-2">Protected Content</h3>
      
      <button
        onClick={fetchData}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? 'Loading...' : 'Fetch Protected Data'}
      </button>
      
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 rounded-md mb-3">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {data && (
        <div className="bg-gray-100 p-3 rounded-md">
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// Login form component
const LoginForm = ({ onLogin }) => {
  const { login, loading, error } = useSimpleAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('real');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await login(email, password, loginType);
      onLogin && onLogin(result.success, result);
    } catch (err) {
      onLogin && onLogin(false, err.message);
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-md shadow-md mb-4">
      <h3 className="font-semibold mb-2">Login</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div className="mb-3">
          <select
            value={loginType}
            onChange={(e) => setLoginType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="real">Real User</option>
            <option value="demo">Demo User</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Logging In...' : 'Login'}
        </button>
      </form>
      
      {error && (
        <div className="mt-3 p-3 bg-red-100 border border-red-400 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

// Full auth flow test component
const AuthFlowTester = () => {
  const { isAuthenticated, user, logout } = useSimpleAuth();
  const [flowSteps, setFlowSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Add a step to the flow
  const addFlowStep = (step) => {
    setFlowSteps(prev => [...prev, {
      ...step,
      timestamp: new Date().toISOString()
    }]);
  };
  
  // Handle login result
  const handleLogin = (success, result) => {
    addFlowStep({
      name: 'Login',
      success,
      details: result
    });
    
    if (success) {
      setCurrentStep(1);
    }
  };
  
  // Handle API call result
  const handleApiCall = (success, result) => {
    addFlowStep({
      name: 'API Call',
      success,
      details: result
    });
    
    if (success) {
      setCurrentStep(2);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      
      addFlowStep({
        name: 'Logout',
        success: true
      });
      
      setCurrentStep(3);
    } catch (err) {
      addFlowStep({
        name: 'Logout',
        success: false,
        details: err.message
      });
    }
  };
  
  // Reset the flow
  const resetFlow = () => {
    setFlowSteps([]);
    setCurrentStep(0);
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Full Authentication Flow Test</h2>
      
      {/* Flow Progress */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Flow Progress:</h3>
        <div className="flex items-center mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 0 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            1
          </div>
          <div className={`h-1 flex-1 ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            2
          </div>
          <div className={`h-1 flex-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            3
          </div>
          <div className={`h-1 flex-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            4
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <div className="text-center">Login</div>
          <div className="text-center">Protected Content</div>
          <div className="text-center">API Call</div>
          <div className="text-center">Logout</div>
        </div>
      </div>
      
      {/* Current Step */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Current Step:</h3>
        
        {currentStep === 0 && (
          <div>
            <p className="mb-3">Step 1: Login with your credentials</p>
            <LoginForm onLogin={handleLogin} />
          </div>
        )}
        
        {currentStep === 1 && (
          <div>
            <p className="mb-3">Step 2: Access protected content and make an API call</p>
            <ProtectedContent onApiCall={handleApiCall} />
          </div>
        )}
        
        {currentStep === 2 && (
          <div>
            <p className="mb-3">Step 3: Logout to complete the flow</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        )}
        
        {currentStep === 3 && (
          <div>
            <p className="mb-3">Step 4: Flow completed successfully!</p>
            <button
              onClick={resetFlow}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Reset Flow
            </button>
          </div>
        )}
      </div>
      
      {/* Auth Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">Auth Status:</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-gray-700">Authenticated:</div>
          <div>{isAuthenticated ? '✓' : '✗'}</div>
          
          <div className="text-gray-700">User ID:</div>
          <div>{user?.id || 'Not logged in'}</div>
          
          <div className="text-gray-700">User Email:</div>
          <div>{user?.email || 'Not logged in'}</div>
        </div>
      </div>
      
      {/* Flow Steps Log */}
      {flowSteps.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Flow Steps Log:</h3>
          <div className="border border-gray-300 rounded-md overflow-hidden">
            {flowSteps.map((step, index) => (
              <div 
                key={index} 
                className={`p-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${index === flowSteps.length - 1 ? '' : 'border-b border-gray-300'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold">
                    {step.name}
                  </div>
                  <div className={`text-sm ${step.success ? 'text-green-600' : 'text-red-600'}`}>
                    {step.success ? '✓ Success' : '✗ Failed'}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </div>
                {step.details && (
                  <div className="mt-2 bg-gray-100 p-2 rounded-md">
                    <pre className="text-xs overflow-auto max-h-20">
                      {typeof step.details === 'object' 
                        ? JSON.stringify(step.details, null, 2)
                        : step.details}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component that provides SimpleAuthProvider
const FullAuthFlowTest = () => {
  return (
    <SimpleAuthProvider>
      <AuthFlowTester />
    </SimpleAuthProvider>
  );
};

export default FullAuthFlowTest;
