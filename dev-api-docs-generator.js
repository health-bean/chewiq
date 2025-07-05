#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

class DeveloperAPIDocGenerator {
  constructor() {
    this.baseURL = 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';
    this.docs = {
      meta: {
        title: 'FILO Health Platform API',
        description: 'Developer onboarding guide for the FILO Health Platform API',
        baseURL: this.baseURL,
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      },
      quickStart: {},
      authentication: {},
      endpoints: {},
      examples: {},
      errors: {}
    };
  }

  async generateDocs() {
    console.log('📚 Generating Developer API Documentation...\n');
    
    await this.testCoreEndpoints();
    this.generateQuickStart();
    this.generateAuthentication();
    this.generateErrorHandling();
    this.generateMarkdown();
    
    console.log('✅ Documentation generated successfully!');
  }

  async testCoreEndpoints() {
    const coreEndpoints = [
      {
        path: '/api/v1/protocols',
        method: 'GET',
        category: 'Core',
        description: 'Get available health protocols',
        auth: false,
        params: []
      },
      {
        path: '/api/v1/foods/search',
        method: 'GET', 
        category: 'Foods',
        description: 'Search food database',
        auth: false,
        params: [
          { name: 'search', type: 'string', required: true, description: 'Food name to search' },
          { name: 'protocol_id', type: 'string', required: false, description: 'Filter by protocol' }
        ]
      },
      {
        path: '/api/v1/foods/by-protocol',
        method: 'GET',
        category: 'Foods', 
        description: 'Get foods for specific protocol',
        auth: false,
        params: [
          { name: 'protocol_id', type: 'string', required: true, description: 'Protocol UUID' }
        ]
      },
      {
        path: '/api/v1/correlations/insights',
        method: 'GET',
        category: 'AI',
        description: 'Get AI-generated food-symptom correlations',
        auth: false,
        params: [
          { name: 'userId', type: 'string', required: true, description: 'User UUID' },
          { name: 'confidence_threshold', type: 'number', required: false, description: 'Minimum confidence (0.0-1.0)' }
        ]
      },
      {
        path: '/api/v1/timeline/entries',
        method: 'GET',
        category: 'Timeline',
        description: 'Get user timeline entries',
        auth: false,
        params: [
          { name: 'userId', type: 'string', required: false, description: 'User UUID' },
          { name: 'date', type: 'string', required: false, description: 'Date filter (YYYY-MM-DD)' }
        ]
      },
      {
        path: '/api/v1/timeline/entries',
        method: 'POST',
        category: 'Timeline',
        description: 'Create timeline entry',
        auth: false,
        bodyExample: {
          userId: 'uuid',
          entryDate: '2025-07-04',
          entryType: 'food|symptom|supplement',
          content: 'Entry description'
        }
      }
    ];

    console.log('🔍 Testing core endpoints...');
    
    for (const endpoint of coreEndpoints) {
      await this.testEndpoint(endpoint);
    }
  }

  async testEndpoint(endpoint) {
    return new Promise((resolve) => {
      // Build test URL
      let testURL = `${this.baseURL}${endpoint.path}`;
      if (endpoint.params && endpoint.method === 'GET') {
        const testParams = this.generateTestParams(endpoint.params);
        if (testParams) testURL += `?${testParams}`;
      }

      const options = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      };

      const req = https.request(testURL, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            this.addEndpointDoc(endpoint, res.statusCode, this.generateResponseSchema(data));
          } catch (error) {
            this.addEndpointDoc(endpoint, res.statusCode, { type: 'text' });
          }
          resolve();
        });
      });

      req.on('error', () => {
        this.addEndpointDoc(endpoint, 500, { error: 'Connection failed' });
        resolve();
      });

      if (endpoint.method === 'POST' && endpoint.bodyExample) {
        req.write(JSON.stringify(endpoint.bodyExample));
      }

      req.end();
    });
  }

  generateTestParams(params) {
    const testValues = {
      search: 'chicken',
      protocol_id: '1495844a-19de-404c-a288-7660eda0cbe1',
      userId: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0',
      date: '2025-07-04',
      confidence_threshold: '0.7'
    };

    return params
      .filter(p => p.required || testValues[p.name])
      .map(p => `${p.name}=${testValues[p.name]}`)
      .join('&');
  }

  generateResponseSchema(data) {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: this.getObjectSchema(data[0] || {})
      };
    }
    return this.getObjectSchema(data);
  }

  getObjectSchema(obj) {
    if (!obj || typeof obj !== 'object') return { type: typeof obj };
    
    const schema = { type: 'object', properties: {} };
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (Array.isArray(value)) {
        schema.properties[key] = { type: 'array', items: { type: typeof value[0] } };
      } else {
        schema.properties[key] = { type: typeof value };
      }
    });
    return schema;
  }

  addEndpointDoc(endpoint, statusCode, responseSchema) {
    const category = endpoint.category;
    if (!this.docs.endpoints[category]) {
      this.docs.endpoints[category] = [];
    }

    this.docs.endpoints[category].push({
      path: endpoint.path,
      method: endpoint.method,
      description: endpoint.description,
      authentication: endpoint.auth ? 'Required' : 'Optional (dev mode)',
      parameters: endpoint.params || [],
      requestBody: endpoint.bodyExample || null,
      response: {
        status: statusCode,
        schema: responseSchema
      },
      working: statusCode >= 200 && statusCode < 300
    });
  }

  generateQuickStart() {
    this.docs.quickStart = {
      baseURL: this.baseURL,
      testEndpoint: '/api/v1/protocols',
      exampleRequest: `curl ${this.baseURL}/api/v1/protocols`,
      environmentSetup: {
        development: 'No authentication required - uses demo user',
        production: 'JWT Bearer token required'
      }
    };
  }

  generateAuthentication() {
    this.docs.authentication = {
      development: {
        description: 'Development mode with demo user fallback',
        required: false,
        demoUser: {
          id: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0',
          email: 'patient@example.com'
        }
      },
      production: {
        description: 'JWT Bearer token authentication',
        required: true,
        header: 'Authorization: Bearer <token>',
        endpoints: {
          login: 'Not yet implemented',
          refresh: 'Not yet implemented'
        }
      }
    };
  }

  generateErrorHandling() {
    this.docs.errors = {
      formats: {
        standard: {
          error: 'Human readable message',
          code: 'ERROR_CODE',
          status: 'error'
        }
      },
      commonCodes: {
        400: 'Bad Request - Invalid parameters',
        401: 'Unauthorized - Authentication required',
        404: 'Not Found - Resource not found',
        500: 'Internal Server Error'
      }
    };
  }

  generateMarkdown() {
    const workingEndpoints = Object.values(this.docs.endpoints)
      .flat()
      .filter(e => e.working);

    const markdown = `# FILO Health Platform API - Developer Guide

## Quick Start

**Base URL:** \`${this.docs.meta.baseURL}\`

**Test the API:**
\`\`\`bash
curl ${this.docs.quickStart.exampleRequest}
\`\`\`

## Authentication

### Development Mode (Current)
- ✅ No authentication required
- 🔄 Automatically uses demo user
- 👤 Demo User ID: \`${this.docs.authentication.development.demoUser.id}\`

### Production Mode (Coming Soon)
- 🔐 JWT Bearer tokens required
- 📝 Header: \`Authorization: Bearer <token>\`

## Core Endpoints

${Object.keys(this.docs.endpoints).map(category => {
  const endpoints = this.docs.endpoints[category].filter(e => e.working);
  if (endpoints.length === 0) return '';
  
  return `### ${category}

${endpoints.map(endpoint => `#### ${endpoint.method} ${endpoint.path}

${endpoint.description}

**Parameters:**
${endpoint.parameters.length > 0 ? endpoint.parameters.map(p => 
  `- \`${p.name}\` (${p.type}) ${p.required ? '**Required**' : '*Optional*'} - ${p.description}`
).join('\n') : 'None'}

**Example:**
\`\`\`bash
curl "${this.baseURL}${endpoint.path}${endpoint.parameters.length > 0 ? '?' + endpoint.parameters.filter(p => p.required).map(p => `${p.name}=example`).join('&') : ''}"
\`\`\`

**Response:** \`${endpoint.response.status}\`
${endpoint.response.schema.type === 'array' ? 'Returns array of objects' : 'Returns object'}

---`).join('\n\n')}`;
}).join('\n\n')}

## Examples

### Search Foods
\`\`\`bash
# Basic search
curl "${this.baseURL}/api/v1/foods/search?search=chicken"

# Search with protocol filter  
curl "${this.baseURL}/api/v1/foods/search?search=broccoli&protocol_id=1495844a-19de-404c-a288-7660eda0cbe1"
\`\`\`

### Get Protocol Foods
\`\`\`bash
curl "${this.baseURL}/api/v1/foods/by-protocol?protocol_id=1495844a-19de-404c-a288-7660eda0cbe1"
\`\`\`

### Get AI Insights
\`\`\`bash
curl "${this.baseURL}/api/v1/correlations/insights?userId=8e8a568a-c2f8-43a8-abf2-4e54408dbdc0&confidence_threshold=0.7"
\`\`\`

## Error Handling

All errors return JSON in this format:
\`\`\`json
{
  "error": "Human readable message",
  "code": "ERROR_CODE", 
  "status": "error"
}
\`\`\`

**Common HTTP Status Codes:**
- \`200\` - Success
- \`400\` - Bad Request (invalid parameters)
- \`401\` - Unauthorized (production mode)
- \`404\` - Not Found
- \`500\` - Server Error

## Getting Started

1. **Test basic connectivity:**
   \`\`\`bash
   curl ${this.baseURL}/api/v1/protocols
   \`\`\`

2. **Try searching foods:**
   \`\`\`bash
   curl "${this.baseURL}/api/v1/foods/search?search=chicken"
   \`\`\`

3. **Explore a protocol:**
   \`\`\`bash
   curl "${this.baseURL}/api/v1/foods/by-protocol?protocol_id=1495844a-19de-404c-a288-7660eda0cbe1"
   \`\`\`

## Next Steps

- All endpoints currently work in development mode with demo data
- Production authentication will be added soon
- Rate limiting: 1000 requests/hour in production
- WebSocket support planned for real-time features

**Working Endpoints:** ${workingEndpoints.length}/${Object.values(this.docs.endpoints).flat().length}

---
*Last updated: ${new Date().toLocaleDateString()}*
`;

    // Save files
    fs.writeFileSync('API_DEVELOPER_GUIDE.md', markdown);
    fs.writeFileSync('api-docs.json', JSON.stringify(this.docs, null, 2));
    
    console.log('📝 Generated files:');
    console.log('   - API_DEVELOPER_GUIDE.md (Human-readable guide)');
    console.log('   - api-docs.json (Structured data)');
  }
}

// Run the generator
const generator = new DeveloperAPIDocGenerator();
generator.generateDocs().catch(console.error);