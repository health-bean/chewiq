# Development Guide

This guide covers development practices, coding standards, and workflows for the Health Platform.

## 🚀 Getting Started

### Prerequisites
- **Node.js**: 18+ (LTS recommended)
- **PostgreSQL**: 14+ with JSONB support
- **Git**: Latest version
- **AWS CLI**: For deployment (optional for local development)

### Local Development Setup

#### 1. Clone and Install
```bash
git clone <repository-url>
cd health-platform
npm install
```

#### 2. Environment Configuration
```bash
# Backend environment
cd backend
cp .env.example .env
# Edit .env with your database credentials and API keys

# Frontend environment  
cd ../frontend/web-app
cp .env.example .env
# Edit .env with your API endpoints
```

#### 3. Database Setup
```bash
# Start PostgreSQL service
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Create database
createdb healthplatform_dev

# Run migrations
cd backend
npm run db:migrate
npm run db:seed
```

#### 4. Start Development Servers
```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Web App
cd frontend/web-app  
npm run dev

# Terminal 3: Practitioner Dashboard (optional)
cd frontend/practioner-dashboard
npm run dev
```

## 🏗️ Project Structure

```
health-platform/
├── backend/
│   ├── functions/api/          # API endpoints
│   │   ├── handlers/          # Route handlers
│   │   ├── middleware/        # Auth, validation, etc.
│   │   └── utils/            # Utilities and helpers
│   ├── database/             # Schema and migrations
│   └── scripts/              # Utility scripts
├── frontend/
│   ├── shared/               # Shared components and utilities
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API clients and services
│   │   └── utils/           # Utility functions
│   ├── web-app/             # Patient-facing application
│   └── practioner-dashboard/ # Provider interface
├── docs/                    # Documentation
├── dev-notes/              # Development notes and analysis
└── scripts/                # Build and deployment scripts
```

## 💻 Development Workflow

### Git Workflow

#### Branch Naming
```bash
# Feature branches
feature/user-authentication
feature/reflection-data-jsonb

# Bug fixes
fix/api-500-errors
fix/duplicate-api-calls

# Security improvements
security/safe-logging-implementation

# Documentation
docs/api-documentation-update
```

#### Commit Messages
```bash
# Format: type(scope): description
feat(auth): implement JWT refresh token rotation
fix(api): resolve journal API 500 errors with JSONB structure
security(logging): implement safe logging utility
docs(api): update JSONB structure documentation
refactor(hooks): add request deduplication to prevent duplicate calls
```

#### Pull Request Process
1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Implement your feature with tests
3. **Test Locally**: Ensure all tests pass
4. **Security Check**: Verify no sensitive data in logs
5. **Create PR**: Include description and testing notes
6. **Code Review**: Address feedback
7. **Merge**: Squash and merge to main

### Code Standards

#### TypeScript/JavaScript
```javascript
// Use modern ES6+ syntax
const fetchUserData = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    safeLogger.error('Failed to fetch user data', { 
      userId, 
      error: error.message 
    });
    throw error;
  }
};

// Use proper error handling
const handleApiError = (error, context) => {
  safeLogger.error('API Error', { 
    context, 
    status: error.status,
    message: error.message 
  });
};
```

#### React Components
```jsx
// Use functional components with hooks
const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await apiClient.get(`/users/${userId}`);
        
        if (!isCancelled) {
          setUser(userData);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message);
          safeLogger.error('Failed to load user profile', { 
            userId, 
            error: err.message 
          });
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchUser();
    
    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [userId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;

  return (
    <div className="user-profile">
      <h1>{user.firstName} {user.lastName}</h1>
      <p>{user.email}</p>
    </div>
  );
};
```

#### Backend API Handlers
```javascript
const handleGetUser = async (queryParams, event) => {
  try {
    safeLogger.debug('Getting user profile', { userId: event.user.id });
    
    const client = await pool.connect();
    const userId = event.user.id;
    
    const query = `
      SELECT id, email, first_name, last_name, user_type, created_at
      FROM users 
      WHERE id = $1
    `;
    
    const result = await client.query(query, [userId]);
    client.release();
    
    if (result.rows.length === 0) {
      return errorResponse('User not found', 404);
    }
    
    safeLogger.debug('User profile retrieved successfully');
    return successResponse({ user: result.rows[0] });
    
  } catch (error) {
    safeLogger.error('Failed to get user profile', { 
      error: error.message,
      userId: event.user?.id 
    });
    
    const appError = handleDatabaseError(error, 'get user profile');
    return errorResponse(appError.message, appError.statusCode);
  }
};
```

## 🔒 Security Guidelines

### Safe Logging (CRITICAL)
```javascript
// ✅ ALWAYS use safeLogger instead of console.log
import safeLogger from '../utils/safeLogger';

// ✅ Good - sensitive data automatically sanitized
safeLogger.debug('User login attempt', { email: user.email });
safeLogger.auth('Authentication successful', { userId: user.id });
safeLogger.error('API Error', { endpoint: '/api/users', error: error.message });

// ❌ NEVER do this - exposes sensitive data
console.log('Login response:', { token: jwt, user: userData });
console.log('API headers:', { Authorization: `Bearer ${token}` });
```

### Authentication
```javascript
// ✅ Store tokens in sessionStorage (not localStorage)
sessionStorage.setItem('auth_token', token);
sessionStorage.setItem('refresh_token', refreshToken);

// ✅ Always check authentication
const isAuthenticated = () => {
  const token = sessionStorage.getItem('auth_token');
  return token && !isTokenExpired(token);
};

// ✅ Handle token refresh
const refreshAuthToken = async () => {
  const refreshToken = sessionStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');
  
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  sessionStorage.setItem('auth_token', response.token);
  sessionStorage.setItem('refresh_token', response.refreshToken);
};
```

### Input Validation
```javascript
// ✅ Validate all inputs
const validateReflectionData = (data) => {
  const errors = [];
  
  if (data.energy_level && (data.energy_level < 1 || data.energy_level > 10)) {
    errors.push('Energy level must be between 1 and 10');
  }
  
  if (data.bedtime && !isValidTime(data.bedtime)) {
    errors.push('Invalid bedtime format');
  }
  
  return errors;
};

// ✅ Sanitize JSONB data
const sanitizeJsonbData = (data) => {
  // Remove any potentially dangerous keys
  const sanitized = { ...data };
  delete sanitized.__proto__;
  delete sanitized.constructor;
  return sanitized;
};
```

## 🧪 Testing

### Unit Tests
```javascript
// Example test for safe logging
describe('safeLogger', () => {
  it('should sanitize sensitive data', () => {
    const logSpy = jest.spyOn(console, 'log');
    
    safeLogger.debug('Test message', {
      email: 'user@example.com',
      token: 'jwt_token_here',
      password: 'secret123'
    });
    
    expect(logSpy).toHaveBeenCalledWith(
      '[DEBUG] Test message',
      {
        email: 'us***@***',
        token: '[REDACTED]',
        password: '[REDACTED]'
      }
    );
  });
});
```

### Integration Tests
```javascript
// Example API test
describe('Journal API', () => {
  it('should create journal entry with JSONB structure', async () => {
    const reflectionData = {
      sleep: { bedtime: '22:30', wake_time: '07:00' },
      wellness: { energy_level: 8, mood_level: 7 }
    };
    
    const response = await request(app)
      .post('/api/v1/journal/entries')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        entry_date: '2025-07-15',
        ...reflectionData
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### End-to-End Tests
```javascript
// Example E2E test with Playwright
test('user can save reflection data', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid=email]', 'test@example.com');
  await page.fill('[data-testid=password]', 'password123');
  await page.click('[data-testid=login-button]');
  
  await page.goto('/reflect');
  await page.fill('[data-testid=bedtime]', '22:30');
  await page.fill('[data-testid=energy-level]', '8');
  await page.click('[data-testid=save-reflection]');
  
  await expect(page.locator('[data-testid=success-message]')).toBeVisible();
});
```

## 🚀 Deployment

### Environment Configuration
```bash
# Development
VITE_APP_ENV=development
VITE_API_URL=http://localhost:3000
VITE_AUTH_ENABLED=true

# Staging
VITE_APP_ENV=staging
VITE_API_URL=https://staging-api.healthplatform.com
VITE_AUTH_ENABLED=true

# Production
VITE_APP_ENV=production
VITE_API_URL=https://api.healthplatform.com
VITE_AUTH_ENABLED=true
```

### Build Process
```bash
# Frontend build
cd frontend/web-app
npm run build

# Backend deployment
cd backend
npm run deploy:staging  # Deploy to staging
npm run deploy:prod     # Deploy to production
```

### Database Migrations
```bash
# Run migrations
npm run db:migrate

# Rollback if needed
npm run db:rollback

# Check migration status
npm run db:status
```

## 🔧 Debugging

### Common Issues

#### API 500 Errors
```bash
# Check backend logs
npm run logs:backend

# Common causes:
# 1. Database connection issues
# 2. JSONB structure mismatches
# 3. Missing authentication context
# 4. Invalid SQL queries
```

#### Authentication Issues
```bash
# Check token validity
# In browser console:
const token = sessionStorage.getItem('auth_token');
console.log('Token exists:', !!token);

# Check token expiration
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires:', new Date(payload.exp * 1000));
```

#### JSONB Query Issues
```sql
-- Test JSONB queries in database
SELECT reflection_data FROM journal_entries WHERE id = 'your-id';

-- Validate JSONB structure
SELECT jsonb_pretty(reflection_data) FROM journal_entries LIMIT 1;

-- Check for missing keys
SELECT * FROM journal_entries WHERE NOT (reflection_data ? 'sleep');
```

### Development Tools

#### Browser Extensions
- **React Developer Tools**: Debug React components
- **Redux DevTools**: Debug state management (if using Redux)
- **JSON Viewer**: Format JSONB data in browser

#### Database Tools
- **pgAdmin**: PostgreSQL administration
- **DBeaver**: Universal database tool
- **psql**: Command-line PostgreSQL client

#### API Testing
- **Postman**: API testing and documentation
- **Insomnia**: Alternative API client
- **curl**: Command-line HTTP client

## 📋 Code Review Checklist

### Security
- [ ] No sensitive data in console.log statements
- [ ] All logging uses safeLogger utility
- [ ] Authentication tokens stored in sessionStorage
- [ ] Input validation implemented
- [ ] Error messages don't expose system details

### Performance
- [ ] Database queries are optimized
- [ ] JSONB indexes used appropriately
- [ ] API responses are paginated
- [ ] React components use proper cleanup
- [ ] No memory leaks in useEffect hooks

### Code Quality
- [ ] Functions are small and focused
- [ ] Error handling is comprehensive
- [ ] Tests cover critical functionality
- [ ] Documentation is updated
- [ ] TypeScript types are accurate

### JSONB Best Practices
- [ ] JSONB structure is consistent
- [ ] Appropriate indexes are created
- [ ] Queries use specific paths
- [ ] Data validation is implemented

## 🤝 Contributing

### Getting Help
- **Documentation**: Check docs/ folder first
- **Issues**: Create GitHub issue with reproduction steps
- **Security**: Email security@healthplatform.com for security issues
- **General**: Use team Slack or email

### Submitting Changes
1. **Fork Repository**: Create your own fork
2. **Create Branch**: Use descriptive branch names
3. **Make Changes**: Follow coding standards
4. **Test Thoroughly**: Include unit and integration tests
5. **Update Documentation**: Keep docs current
6. **Submit PR**: Include detailed description

---

**Last Updated**: July 15, 2025  
**Development Version**: 2.0 (Post-JSONB Migration)  
**Next Review**: August 15, 2025