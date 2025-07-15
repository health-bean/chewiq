# Security Guide

This document outlines the security practices, implementations, and guidelines for the Health Platform.

## 🔒 Security Overview

The Health Platform implements a security-first approach with multiple layers of protection for sensitive health data.

## 🛡️ Authentication & Authorization

### JWT-Based Authentication
- **Access Tokens**: 15-minute expiration for security
- **Refresh Tokens**: 7-day expiration with rotation
- **Token Storage**: sessionStorage (cleared on browser close)
- **Token Sanitization**: Never logged or exposed in console

### Session Management
```javascript
// Secure session storage (not localStorage)
sessionStorage.setItem('auth_token', token);
sessionStorage.setItem('refresh_token', refreshToken);
sessionStorage.setItem('user', JSON.stringify(user));
```

### Authentication Flow
1. User logs in with credentials
2. Server validates and returns JWT + refresh token
3. Client stores tokens in sessionStorage (not localStorage)
4. All API requests include JWT in Authorization header
5. Token automatically refreshes before expiration
6. Session clears when browser closes

## 🔐 Safe Logging System

### Overview
Custom logging utility that prevents sensitive data exposure while maintaining debugging capabilities.

### Implementation
**File**: `frontend/shared/utils/safeLogger.js`

```javascript
import safeLogger from '../utils/safeLogger';

// Safe logging examples
safeLogger.debug('User login attempt', { email: user.email }); // Email sanitized
safeLogger.auth('Login successful', { userId: user.id }); // No sensitive data
safeLogger.error('API Error', { endpoint: '/api/users' }); // No tokens logged
```

### Features
- **Automatic Sanitization**: Removes tokens, passwords, API keys
- **Environment Awareness**: Minimal logging in production
- **Email Protection**: Shows only first 2 characters
- **Structured Levels**: DEBUG, INFO, WARN, ERROR, AUTH

### Sensitive Data Patterns (Automatically Removed)
```javascript
const sensitiveKeys = [
  'password', 'token', 'secret', 'key', 'auth', 'authorization',
  'jwt', 'refresh_token', 'access_token', 'bearer', 'api_key'
];
```

## 🗄️ Data Protection

### Database Security
- **Encryption at Rest**: All data encrypted in PostgreSQL
- **Encryption in Transit**: HTTPS/TLS for all communications
- **JSONB Storage**: Structured data with proper indexing
- **Access Control**: Role-based database permissions

### HIPAA Compliance Features
- **Audit Logging**: All data access logged (without PII)
- **Data Minimization**: Only necessary data collected
- **Consent Tracking**: `consent_to_anonymize` field in journal entries
- **Session Isolation**: Data cleared when browser closes

### Data Sanitization
```javascript
// Example of automatic data sanitization
const sanitizedData = safeLogger.sanitizeData({
  email: 'user@example.com',
  token: 'jwt_token_here',
  preferences: { theme: 'dark' }
});
// Result: { email: 'us***@***', token: '[REDACTED]', preferences: { theme: 'dark' } }
```

## 🌐 API Security

### Request Security
- **HTTPS Only**: All API communication encrypted
- **CORS Protection**: Restricted to approved domains
- **Rate Limiting**: 1000 requests/hour for authenticated users
- **Input Validation**: All inputs sanitized and validated

### Response Security
- **No Sensitive Data**: Tokens never included in API responses
- **Error Sanitization**: Error messages don't expose system details
- **Structured Responses**: Consistent, safe response format

### Authentication Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## 🔍 Logging & Monitoring

### Safe Logging Practices

#### ✅ Good Examples
```javascript
// Safe authentication logging
safeLogger.auth('User login attempt', { email: user.email });
safeLogger.debug('API request', { endpoint: '/api/users', method: 'GET' });
safeLogger.error('Database error', { table: 'users', operation: 'SELECT' });
```

#### ❌ Dangerous Examples (Now Prevented)
```javascript
// These would expose sensitive data (now automatically sanitized)
console.log('Login response:', { token: 'jwt_here', user: userData });
console.log('API headers:', { Authorization: 'Bearer token_here' });
console.log('Database query:', { password: 'user_password' });
```

### Production Logging
- **Minimal Logging**: Only essential information logged
- **No Sensitive Data**: All PII and credentials sanitized
- **Structured Format**: JSON-formatted logs for analysis
- **Audit Trail**: User actions logged without exposing data

## 🛠️ Development Security

### Environment Configuration
```bash
# Development
VITE_APP_ENV=development
VITE_AUTH_ENABLED=true
VITE_API_URL=http://localhost:3000

# Production
VITE_APP_ENV=production
VITE_AUTH_ENABLED=true
VITE_API_URL=https://api.healthplatform.com
```

### Secure Development Practices
1. **Never commit secrets** to version control
2. **Use environment variables** for configuration
3. **Sanitize all logs** using safeLogger utility
4. **Test authentication flows** thoroughly
5. **Validate all inputs** on client and server

### Code Review Checklist
- [ ] No sensitive data in console.log statements
- [ ] All API calls use safeLogger for debugging
- [ ] Authentication tokens stored in sessionStorage
- [ ] Error messages don't expose system details
- [ ] Input validation implemented
- [ ] HTTPS used for all external communications

## 🚨 Incident Response

### Security Monitoring
- **Failed Login Attempts**: Tracked and rate-limited
- **API Abuse**: Rate limiting and blocking
- **Data Access**: Audit logs for all database operations
- **Error Patterns**: Monitoring for unusual error rates

### Response Procedures
1. **Identify**: Monitor logs for security events
2. **Contain**: Rate limit or block suspicious activity
3. **Investigate**: Analyze logs (safely, without exposing PII)
4. **Remediate**: Fix vulnerabilities and update systems
5. **Document**: Record incident and lessons learned

## 🔧 Security Tools & Utilities

### Safe Logger Utility
```javascript
// Import and use throughout the application
import safeLogger from '../utils/safeLogger';

// Different log levels
safeLogger.debug('Development info', data);
safeLogger.info('General information', data);
safeLogger.warn('Warning message', data);
safeLogger.error('Error occurred', data);
safeLogger.auth('Authentication event', data);
```

### Authentication Helpers
```javascript
// Secure token management
const token = sessionStorage.getItem('auth_token');
const isAuthenticated = !!token && !isTokenExpired(token);

// Safe user data access
const user = JSON.parse(sessionStorage.getItem('user') || '{}');
```

## 📋 Security Checklist

### Pre-Deployment
- [ ] All console.log replaced with safeLogger
- [ ] No hardcoded secrets in code
- [ ] HTTPS configured for production
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Error handling doesn't expose system details

### Post-Deployment
- [ ] Monitor authentication logs
- [ ] Check for unusual API patterns
- [ ] Verify HTTPS certificate validity
- [ ] Review access logs regularly
- [ ] Test token refresh functionality

## 🎯 Recent Security Improvements (July 2025)

### Implemented
- ✅ **Safe Logging Utility**: Prevents sensitive data exposure
- ✅ **Token Sanitization**: JWT tokens never appear in logs
- ✅ **Environment-Aware Logging**: Minimal production logging
- ✅ **Session Storage**: Secure token storage that clears on browser close
- ✅ **Request Deduplication**: Prevents API abuse from duplicate calls

### Benefits
- **Zero Sensitive Data Exposure**: No tokens, passwords, or PII in logs
- **HIPAA Compliance**: Proper audit logging without privacy violations
- **Developer Friendly**: Easy to use, automatic sanitization
- **Production Ready**: Minimal performance impact

## 📞 Security Contacts

- **Security Team**: security@healthplatform.com
- **Incident Response**: incident@healthplatform.com
- **Compliance**: compliance@healthplatform.com

---

**Last Updated**: July 15, 2025  
**Security Version**: 2.0 (Safe Logging Implementation)  
**Next Security Review**: August 15, 2025