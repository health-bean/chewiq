import React, { useState } from 'react';
import { Rocket, User, Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button, Alert, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import { useAuth } from '../../contexts/AuthProvider';

const LoginPage = () => {
  const [authMode, setAuthMode] = useState('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
    confirmationCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login, signup, confirmSignUp, resendConfirmationCode, error, setError, demoUsers } = useAuth();

  const switchMode = (mode) => {
    setAuthMode(mode);
    setErrors({});
    setError(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }; 
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (authMode !== 'confirm') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (authMode === 'signup' && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
    }
    if (authMode === 'signup') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    if (authMode === 'confirm') {
      if (!formData.confirmationCode.trim()) {
        newErrors.confirmationCode = 'Confirmation code is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setError(null);
    try {
      if (authMode === 'signin') {
        const result = await login(formData.email, formData.password, 'standard');
        if (!result.success) {
          if (result.error && (result.error.includes('CONFIRMATION_REQUIRED') || result.error.includes('Sign in not completed'))) {
            switchMode('confirm');
          } else {
            setError(result.error || 'Login failed');
          }
        }
      } else if (authMode === 'signup') {
        await signup(formData.email.trim().toLowerCase(), formData.password, formData.firstName.trim(), formData.lastName.trim());
        switchMode('confirm');
      } else if (authMode === 'confirm') {
        const result = await confirmSignUp(formData.email, formData.confirmationCode);
        if (result.success) {
          setError('Email confirmed successfully! You can now sign in.');
          switchMode('signin');
          setFormData(prev => ({ ...prev, password: '', confirmationCode: '' }));
        } else {
          setError(result.error || 'Failed to confirm account. Please try again.');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoUser) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await login(demoUser.email, 'demo123', 'demo');
      if (!result.success) {
        setError(result.error || 'Demo login failed');
      }
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      const result = await resendConfirmationCode(formData.email);
      if (result.success) {
        setError('New confirmation code sent to your email!');
      } else {
        setError(result.error || 'Failed to resend code. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Rocket className="mr-2" size={32} />
          <h1 className="text-2xl font-bold">FILO Health</h1>
        </div>
        <p className="text-primary-100">Your Personal Health Journey</p>
        <p className="text-primary-200 text-sm mt-2">Prototype Demo - Incognito Optimized</p>
      </div>
      <div className="p-6 max-w-md mx-auto">
        {authMode !== 'confirm' && (
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button onClick={() => switchMode('signin')} className={cn("flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors", authMode === 'signin' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}>
              Sign In
            </button>
            <button onClick={() => switchMode('signup')} className={cn("flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors", authMode === 'signup' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}>
              Sign Up
            </button>
          </div>
        )}
        {error && (
          <Alert variant="error" className="mb-4" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}       
 {authMode === 'confirm' && (
          <div className="mb-6">
            <Card variant="outlined" padding="md" className="bg-blue-50 border-blue-200">
              <div className="text-center">
                <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Check Your Email</h3>
                <p className="text-sm text-blue-700">
                  We've sent a confirmation code to <strong>{formData.email}</strong>.
                  Please enter the code below to verify your email address.
                </p>
              </div>
            </Card>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className={cn("w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", errors.email ? "border-red-500" : "border-gray-300")} placeholder="Enter your email" disabled={authMode === 'confirm'} />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>         
 {authMode === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input id="firstName" type="text" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className={cn("w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", errors.firstName ? "border-red-500" : "border-gray-300")} placeholder="First name" />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input id="lastName" type="text" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className={cn("w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", errors.lastName ? "border-red-500" : "border-gray-300")} placeholder="Last name" />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>
          )}
          {authMode !== 'confirm' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} className={cn("w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", errors.password ? "border-red-500" : "border-gray-300")} placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              {authMode === 'signup' && <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters</p>}
            </div>
          )}      
    {authMode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} className={cn("w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", errors.confirmPassword ? "border-red-500" : "border-gray-300")} placeholder="Confirm your password" />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>
          )}
          {authMode === 'confirm' && (
            <div>
              <label htmlFor="confirmationCode" className="block text-sm font-medium text-gray-700 mb-1">Confirmation Code</label>
              <input id="confirmationCode" type="text" value={formData.confirmationCode} onChange={(e) => handleInputChange('confirmationCode', e.target.value)} className={cn("w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-wider", errors.confirmationCode ? "border-red-500" : "border-gray-300")} placeholder="Enter confirmation code" autoFocus />
              {errors.confirmationCode && <p className="mt-1 text-xs text-red-500">{errors.confirmationCode}</p>}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading} loading={isLoading}>
            {authMode === 'signin' && (isLoading ? 'Signing in...' : 'Sign In')}
            {authMode === 'signup' && (isLoading ? 'Creating account...' : 'Create Account')}
            {authMode === 'confirm' && (isLoading ? 'Verifying...' : 'Verify Account')}
          </Button>
        </form>       
 {authMode === 'confirm' && (
          <div className="mt-4 text-center space-y-3">
            <button onClick={handleResendCode} disabled={isLoading} className="text-sm text-blue-600 hover:text-blue-800 disabled:text-blue-300">
              {isLoading ? 'Sending...' : 'Resend confirmation code'}
            </button>
            <div className="text-xs text-gray-500">
              <p>Didn't receive the code? Check your spam folder or click resend.</p>
              <p>Codes expire after 24 hours.</p>
            </div>
            <button onClick={() => switchMode('signin')} className="text-sm text-gray-600 hover:text-gray-800">Back to sign in</button>
          </div>
        )}
        {authMode === 'signin' && (
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-50 text-gray-500">Or try a demo account</span></div>
            </div>
            <div className="mt-6 space-y-3">
              {demoUsers.map((user) => (
                <Card key={user.id} variant="outlined" padding="sm" className={cn("cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-300", isLoading && "opacity-50 cursor-not-allowed")} onClick={() => !isLoading && handleDemoLogin(user)}>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{user.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.protocol}</p>
                      <p className="text-xs text-gray-400">{user.entries}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">Demo</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800"><Shield className="w-3 h-3 mr-1" />Private</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center mb-3"><User className="h-4 w-4 text-gray-400 mr-2" /><span className="text-sm text-gray-600">Demo Account Access</span></div>
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Session:</strong> Automatically cleared on browser close</p>
                <p><strong>Data:</strong> Demo data showcasing different health protocols</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};export default LoginPage;