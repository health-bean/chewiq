# API Reference

## Overview

The Web App API provides endpoints for managing health protocols, timeline entries, and user data.

**Base URL:** `https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev`
**Current Status:** Active Development

## Authentication

**Current:** Development phase - mixed authentication requirements
**Production Plan:** JWT Bearer token authentication

## Working Endpoints (3)


### GET /api/v1/protocols

**Description:** Get available health protocols  
**Response Time:** 1464ms  
**Status:** 200

**Response Example:**
```json
{
  "protocols": [
    {
      "id": "1495844a-19de-404c-a288-7660eda0cbe1",
      "name": "AIP Core",
      "description": "Autoimmune Protocol - Elimination Phase. Removes nightshades, grains, legumes, dairy, eggs, nuts, seeds, and certain spices.",
      "category": null,
      "phases": null,
      "official": true,
      "version": "1.0"
    },
    {
      "id": "34236e47-3e54-49fa-99a4-797dbcf66c2d",
      "name": "AIP Modified",
      "description": "Modified Autoimmune Protocol with selective reintroductions and personalized modifications.",
      "category": "aip",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "b0c3b21c-f32c-4ac4-8afa-251d2819c3c0",
      "name": "Elimination Diet",
      "description": "Systematic food elimination and reintroduction",
      "category": "elimination",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "a80be547-6db1-4722-a5a4-60930143a2d9",
      "name": "Low FODMAP",
      "description": "Eliminates fermentable carbohydrates to manage IBS and digestive symptoms.",
      "category": "low_fodmap",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "51ca7a24-4691-4629-8ee5-c20876e68c29",
      "name": "Low Histamine",
      "description": "Reduces histamine-rich foods to manage histamine intolerance and allergic reactions.",
      "category": "low_histamine",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "fd2c2435-48ea-4d5d-9d04-6fe5b8ac3b0c",
      "name": "Low Lectin",
      "description": "Avoids lectin-rich foods to reduce digestive inflammation and autoimmune triggers.",
      "category": "low_lectin",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "12f1d4f1-f56a-48a3-b936-41026014656b",
      "name": "Low Oxalate",
      "description": "Limits oxalate-containing foods to prevent kidney stones and reduce inflammation.",
      "category": "low_oxalate",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "40b6955c-fd3b-4aba-846b-03caa7119ff9",
      "name": "No Nightshades",
      "description": "Removes nightshade vegetables to reduce inflammation in sensitive individuals.",
      "category": "no_nightshades",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "46de08fb-03bf-4032-b507-122bb934ecb9",
      "name": "Paleo",
      "description": "Paleolithic diet focusing on whole foods, excluding grains, legumes, and processed foods.",
      "category": "paleo",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "5cd8f8c7-3cbb-4405-ab88-a253ff7c907b",
      "name": "Whole30",
      "description": "30-day elimination program removing sugar, alcohol, grains, legumes, and dairy.",
      "category": "whole30",
      "phases": null,
      "official": false,
      "version": "1.0"
    }
  ],
  "total": 10
}
```

**Data Structure:**
- `protocols`: array[10]
- `total`: number


### GET /api/v1/timeline/entries

**Description:** Get timeline entries  
**Response Time:** 61ms  
**Status:** 200

**Response Example:**
```json
{
  "entries": [],
  "total": 0
}
```

**Data Structure:**
- `entries`: array[0]
- `total`: number


### GET /api/v1/timeline/entries?date=2025-06-29

**Description:** Get timeline entries with date filter  
**Response Time:** 52ms  
**Status:** 200

**Response Example:**
```json
{
  "entries": [],
  "total": 0
}
```

**Data Structure:**
- `entries`: array[0]
- `total`: number


## Protected Endpoints (0)

These endpoints require authentication in production:



## Performance Metrics

- **Average Response Time:** 526ms
- **Success Rate:** 100%

## Error Handling

### Common HTTP Status Codes
- **200:** Success
- **400:** Bad Request - Invalid parameters
- **401:** Unauthorized - Authentication required
- **403:** Forbidden - Access denied
- **404:** Not Found - Endpoint or resource not found
- **500:** Internal Server Error

### Error Response Format
```json
{
  "error": "Human readable error message",
  "code": "ERROR_CODE", 
  "status": "error"
}
```

## Rate Limiting

- **Development:** No rate limiting
- **Production:** 1000 requests per hour per authenticated user

## Testing

### Automated Testing
```bash
# Test all endpoints
npm run analyze-api
```

### Manual Testing
```bash
# Test working endpoints
curl https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev/api/v1/protocols

# Test with authentication (when available)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev/api/v1/user-preferences
```

---

*API documentation is automatically generated from live endpoint testing.*
