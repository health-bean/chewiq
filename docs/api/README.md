# API Documentation

The Health Platform API provides secure, RESTful endpoints for managing health data, user authentication, and clinical workflows with JSONB-based flexible data storage.

## Base URL
```
Production: https://api.healthplatform.com/api/v1
Development: https://dev-api.healthplatform.com/api/v1
Local: http://localhost:3000/api/v1
```

## Authentication

All API endpoints (except registration and login) require authentication via JWT tokens.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Token Refresh
Tokens expire after 15 minutes. Use the refresh endpoint to get new tokens without re-authentication.

## API Endpoints Overview

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration  
- `POST /auth/logout` - User logout
- `GET /auth/verify` - Verify token validity
- `POST /auth/refresh` - Refresh JWT token

### Users
- `GET /users` - Get current user profile
- `POST /users` - Update user profile
- `GET /user/protocols` - Get user's protocols
- `GET /user/preferences` - Get user preferences
- `POST /user/preferences` - Update user preferences

### User Protocols
- `GET /users/current-protocol` - Get current active protocol
- `GET /users/protocol-history` - Get protocol change history
- `POST /users/change-protocol` - Change user's protocol

### Journal Entries (Reflection Data)
- `GET /journal/entries` - Get journal entries
- `POST /journal/entries` - Create/update journal entry
- `GET /journal/entries/:date` - Get specific journal entry
- `PUT /journal/entries/:date` - Update journal entry

### Timeline Entries
- `GET /timeline/entries` - Get timeline entries
- `POST /timeline/entries` - Create timeline entry

### Search & Reference Data
- `GET /foods/search` - Search food database
- `GET /foods/by-protocol` - Get foods by protocol
- `GET /symptoms/search` - Search symptoms
- `GET /supplements/search` - Search supplements
- `GET /medications/search` - Search medications
- `GET /detox-types/search` - Search detox types
- `GET /exposures/search` - Search exposure types

### Protocols
- `GET /protocols` - Get available protocols

### Analytics
- `GET /correlations/insights` - Get correlation insights

### Admin (Development Only)
- `POST /admin/seed-demo-data` - Seed demo data

## Data Structures

### JSONB-Based Storage

The API uses PostgreSQL JSONB for flexible, structured data storage.

#### **Journal Entry Structure:**
```json
{
  "entry_date": "2025-07-15",
  "reflection_data": {
    "sleep": {
      "bedtime": "22:30",
      "wake_time": "07:00", 
      "sleep_quality": "good",
      "sleep_symptoms": ["back pain"]
    },
    "wellness": {
      "energy_level": 8,
      "mood_level": 7,
      "physical_comfort": 6
    },
    "activity": {
      "activity_level": "moderate"
    },
    "meditation": {
      "meditation_duration": 15,
      "meditation_practice": true
    },
    "cycle": {
      "cycle_day": "5",
      "ovulation": false
    },
    "notes": {
      "personal_reflection": "Feeling good today..."
    }
  }
}
```

#### **Timeline Entry Structure:**
```json
{
  "entry_date": "2025-07-15",
  "entry_time": "14:30",
  "entry_type": "food",
  "structured_content": {
    "type": "food",
    "foods": [{
      "name": "chicken",
      "food_id": "uuid",
      "category": "protein",
      "compliance_status": "included"
    }],
    "notes": "Grilled chicken breast"
  }
}
```

## Error Handling

The API uses standard HTTP status codes and returns errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited to prevent abuse:
- **Authenticated users**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination using query parameters:

```http
GET /api/v1/journal/entries?page=1&limit=20&sort=date&order=desc
```

Response format:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Data Formats

### Dates
All dates are in ISO 8601 format: `2024-01-15T10:30:00Z`

### Health Metrics
Numeric values with context stored in JSONB:
```json
{
  "wellness": {
    "energy_level": 8,
    "mood_level": 7,
    "physical_comfort": 6
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Security

### HTTPS Only
All API communication must use HTTPS in production.

### CORS
Cross-origin requests are allowed from approved domains only.

### Input Validation
All inputs are validated and sanitized to prevent injection attacks.

### Secure Logging
- API requests are logged with sensitive data sanitized
- JWT tokens and auth headers are never logged
- Environment-aware logging (minimal in production)

### Audit Logging
All API requests are logged for security and compliance purposes with PII protection.

## Recent Updates (July 2025)

### **JSONB Migration:**
- Migrated from individual columns to JSONB storage
- Improved flexibility for health data structures
- Better performance with GIN indexes

### **Security Improvements:**
- Implemented safe logging utility
- Eliminated sensitive data exposure in logs
- Added environment-aware logging levels

### **Performance Enhancements:**
- Fixed duplicate API call issues
- Added request deduplication
- Optimized database queries

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @health-platform/api-client
```

### Usage Example
```javascript
import { HealthPlatformAPI } from '@health-platform/api-client';

const api = new HealthPlatformAPI({
  baseURL: 'https://api.healthplatform.com/api/v1',
  apiKey: 'your-api-key'
});

// Get user profile
const user = await api.users.getProfile();

// Create journal entry with JSONB structure
const entry = await api.journal.create({
  entry_date: '2025-07-15',
  reflection_data: {
    sleep: {
      bedtime: '22:30',
      wake_time: '07:00',
      sleep_quality: 'good'
    },
    wellness: {
      energy_level: 8,
      mood_level: 7
    }
  }
});
```

## Webhooks

The API supports webhooks for real-time notifications:

### Supported Events
- `user.created` - New user registration
- `journal.entry.created` - New journal entry
- `protocol.changed` - User changed protocol
- `timeline.entry.created` - New timeline entry

### Webhook Format
```json
{
  "event": "journal.entry.created",
  "timestamp": "2025-07-15T10:30:00Z",
  "data": {
    "userId": "user_123",
    "entryId": "entry_456",
    "date": "2025-07-15"
  }
}
```

## Testing

### Postman Collection
Import our Postman collection for easy API testing:
[Download Collection](./postman/health-platform-api.json)

### Demo Data
Use the demo data seeding endpoint for testing:
```http
POST /api/v1/admin/seed-demo-data
```

## Support

For API support and questions:
- Documentation: [docs.healthplatform.com](https://docs.healthplatform.com)
- Email: api-support@healthplatform.com
- Status Page: [status.healthplatform.com](https://status.healthplatform.com)

---

**Last Updated**: July 15, 2025  
**API Version**: 2.0 (JSONB-based)  
**Next Review**: August 15, 2025