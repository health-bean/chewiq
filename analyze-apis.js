#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

class FILOAPIAnalyzer {
  constructor() {
    this.baseURL = 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';
    this.results = {
      endpoints: [],
      status: 'unknown',
      timestamp: new Date().toISOString(),
      summary: {
        working: 0,
        broken: 0,
        total: 0
      }
    };
  }

  async analyzeAPIs() {
    console.log('🌐 Testing FILO Health Platform APIs...');
    console.log(`Base URL: ${this.baseURL}\n`);
    
    // Known endpoints from your deployment summary
    const knownEndpoints = [
      { path: '/api/v1/protocols', method: 'GET', description: 'Get available health protocols' },
      { path: '/api/v1/foods', method: 'GET', description: 'Get food database' },
      { path: '/api/v1/timeline/entries', method: 'GET', description: 'Get timeline entries' },
      { path: '/api/v1/users', method: 'GET', description: 'Get user data' },
      { path: '/api/v1/journal', method: 'GET', description: 'Get journal entries' },
      { path: '/api/v1/user-preferences', method: 'GET', description: 'Get user preferences' },
      { path: '/api/v1/exposure-types', method: 'GET', description: 'Get exposure types' },
      { path: '/api/v1/detox-types', method: 'GET', description: 'Get detox types' },
      // Test with date parameter for timeline
      { path: '/api/v1/timeline/entries?date=2025-06-29', method: 'GET', description: 'Get timeline entries with date filter' }
    ];

    console.log(`Testing ${knownEndpoints.length} known endpoints...\n`);
    
    for (const endpoint of knownEndpoints) {
      await this.testEndpoint(endpoint);
      await this.sleep(300); // Rate limiting between requests
    }

    this.generateReport();
    this.saveResults();
  }

  async testEndpoint(endpoint) {
    return new Promise((resolve) => {
      const url = `${this.baseURL}${endpoint.path}`;
      const startTime = Date.now();
      
      console.log(`🔄 Testing: ${endpoint.method} ${endpoint.path}`);
      
      const request = https.get(url, (response) => {
        const responseTime = Date.now() - startTime;
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          let responseData = null;
          let dataType = 'unknown';
          let parsedData = null;
          
          try {
            parsedData = JSON.parse(data);
            responseData = parsedData;
            dataType = Array.isArray(parsedData) ? 'array' : 'object';
          } catch (e) {
            responseData = data.substring(0, 200);
            dataType = 'text';
          }
          
          const result = {
            ...endpoint,
            url,
            status: response.statusCode,
            responseTime,
            dataType,
            dataSize: data.length,
            sampleData: this.getSampleData(parsedData),
            headers: {
              'content-type': response.headers['content-type'],
              'content-length': response.headers['content-length']
            },
            working: response.statusCode >= 200 && response.statusCode < 300,
            rawResponse: dataType === 'text' ? data.substring(0, 500) : null
          };
          
          this.results.endpoints.push(result);
          
          if (result.working) {
            console.log(`  ✅ ${response.statusCode} (${responseTime}ms) - ${this.getDataSummary(result)}`);
            this.results.summary.working++;
          } else {
            console.log(`  ❌ ${response.statusCode} (${responseTime}ms) - ${result.rawResponse || 'Error'}`);
            this.results.summary.broken++;
          }
          
          this.results.summary.total++;
          resolve(result);
        });
      });
      
      request.on('error', (error) => {
        const result = {
          ...endpoint,
          url,
          status: 'ERROR',
          error: error.message,
          working: false,
          responseTime: Date.now() - startTime
        };
        
        this.results.endpoints.push(result);
        console.log(`  ❌ ERROR: ${error.message}`);
        this.results.summary.broken++;
        this.results.summary.total++;
        resolve(result);
      });
      
      request.setTimeout(10000, () => {
        request.destroy();
        const result = {
          ...endpoint,
          url,
          status: 'TIMEOUT',
          working: false,
          responseTime: 10000
        };
        this.results.endpoints.push(result);
        console.log(`  ⏱️  TIMEOUT (>10s)`);
        this.results.summary.broken++;
        this.results.summary.total++;
        resolve(result);
      });
    });
  }

  getSampleData(data) {
    if (!data) return null;
    
    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        sample: data.slice(0, 2), // First 2 items
        structure: data.length > 0 ? Object.keys(data[0] || {}) : [],
        itemTypes: data.length > 0 ? this.analyzeObjectStructure(data[0]) : {}
      };
    } else if (typeof data === 'object') {
      return {
        type: 'object',
        keys: Object.keys(data),
        sample: Object.fromEntries(
          Object.entries(data).slice(0, 5) // First 5 properties
        ),
        structure: this.analyzeObjectStructure(data)
      };
    } else {
      return {
        type: 'string',
        preview: String(data).substring(0, 100)
      };
    }
  }

  analyzeObjectStructure(obj) {
    if (!obj || typeof obj !== 'object') return {};
    
    const structure = {};
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        structure[key] = `array[${value.length}]`;
      } else if (value === null) {
        structure[key] = 'null';
      } else {
        structure[key] = typeof value;
      }
    }
    return structure;
  }

  getDataSummary(result) {
    if (!result.sampleData) return 'No data';
    
    if (result.sampleData.type === 'array') {
      return `Array with ${result.sampleData.length} items`;
    } else if (result.sampleData.type === 'object') {
      return `Object with ${result.sampleData.keys.length} properties`;
    } else {
      return `Text response (${result.dataSize} chars)`;
    }
  }

  generateReport() {
    console.log('\n📊 FILO API Analysis Report');
    console.log('============================\n');
    
    // Summary
    console.log('🎯 SUMMARY:');
    console.log(`✅ Working: ${this.results.summary.working}/${this.results.summary.total}`);
    console.log(`❌ Broken: ${this.results.summary.broken}/${this.results.summary.total}`);
    console.log(`📊 Success Rate: ${Math.round((this.results.summary.working / this.results.summary.total) * 100)}%\n`);
    
    // Working endpoints
    const workingEndpoints = this.results.endpoints.filter(ep => ep.working);
    if (workingEndpoints.length > 0) {
      console.log('🟢 WORKING ENDPOINTS:');
      workingEndpoints.forEach(ep => {
        console.log(`  ${ep.method} ${ep.path}`);
        console.log(`    Status: ${ep.status} | Response Time: ${ep.responseTime}ms`);
        
        if (ep.sampleData) {
          if (ep.sampleData.type === 'array') {
            console.log(`    Data: Array with ${ep.sampleData.length} items`);
            if (ep.sampleData.structure.length > 0) {
              console.log(`    Structure: ${ep.sampleData.structure.join(', ')}`);
            }
          } else if (ep.sampleData.type === 'object') {
            console.log(`    Data: Object with keys: ${ep.sampleData.keys.join(', ')}`);
          }
        }
        console.log('');
      });
    }
    
    // Broken endpoints
    const brokenEndpoints = this.results.endpoints.filter(ep => !ep.working);
    if (brokenEndpoints.length > 0) {
      console.log('🔴 BROKEN/ERROR ENDPOINTS:');
      brokenEndpoints.forEach(ep => {
        console.log(`  ${ep.method} ${ep.path}`);
        console.log(`    Status: ${ep.status} | Issue: ${ep.error || ep.rawResponse || 'Unknown'}`);
        console.log('');
      });
    }
    
    // Performance analysis
    const workingTimes = workingEndpoints.map(ep => ep.responseTime).filter(t => t);
    if (workingTimes.length > 0) {
      const avgTime = Math.round(workingTimes.reduce((a, b) => a + b, 0) / workingTimes.length);
      const minTime = Math.min(...workingTimes);
      const maxTime = Math.max(...workingTimes);
      
      console.log('⚡ PERFORMANCE METRICS:');
      console.log(`  Average Response Time: ${avgTime}ms`);
      console.log(`  Fastest Response: ${minTime}ms`);
      console.log(`  Slowest Response: ${maxTime}ms\n`);
    }
    
    // Data structure insights
    console.log('📋 API DATA INSIGHTS:');
    workingEndpoints.forEach(ep => {
      if (ep.sampleData?.structure) {
        console.log(`  ${ep.path}:`);
        if (ep.sampleData.type === 'array' && ep.sampleData.itemTypes) {
          Object.entries(ep.sampleData.itemTypes).forEach(([key, type]) => {
            console.log(`    - ${key}: ${type}`);
          });
        } else if (ep.sampleData.type === 'object' && ep.sampleData.structure) {
          Object.entries(ep.sampleData.structure).forEach(([key, type]) => {
            console.log(`    - ${key}: ${type}`);
          });
        }
        console.log('');
      }
    });
  }

  saveResults() {
    // Save detailed JSON report
    const reportPath = 'FILO_API_ANALYSIS.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`💾 Detailed API report saved to: ${reportPath}`);
    
    // Generate OpenAPI/Swagger documentation
    if (this.results.summary.working > 0) {
      const swagger = this.generateSwaggerDoc();
      fs.writeFileSync('FILO_API_SWAGGER.json', JSON.stringify(swagger, null, 2));
      console.log(`📋 API documentation saved to: FILO_API_SWAGGER.json`);
    }
    
    // Create simple summary file
    const summary = {
      timestamp: this.results.timestamp,
      baseURL: this.baseURL,
      summary: this.results.summary,
      workingEndpoints: this.results.endpoints.filter(ep => ep.working).map(ep => ep.path),
      brokenEndpoints: this.results.endpoints.filter(ep => !ep.working).map(ep => ep.path)
    };
    
    fs.writeFileSync('FILO_API_SUMMARY.json', JSON.stringify(summary, null, 2));
    console.log(`📊 API summary saved to: FILO_API_SUMMARY.json`);
  }

  generateSwaggerDoc() {
    const workingEndpoints = this.results.endpoints.filter(ep => ep.working);
    
    return {
      openapi: '3.0.0',
      info: {
        title: 'FILO Health Platform API',
        version: '1.0.0',
        description: 'Protocol Management & Healing Platform API',
        contact: {
          name: 'FILO Health Platform'
        }
      },
      servers: [
        {
          url: this.baseURL,
          description: 'Production server'
        }
      ],
      paths: workingEndpoints.reduce((paths, endpoint) => {
        const pathKey = endpoint.path.split('?')[0]; // Remove query parameters for OpenAPI
        const method = endpoint.method.toLowerCase();
        
        if (!paths[pathKey]) {
          paths[pathKey] = {};
        }
        
        paths[pathKey][method] = {
          summary: endpoint.description,
          description: `${endpoint.description}. Response time: ${endpoint.responseTime}ms`,
          responses: {
            [endpoint.status]: {
              description: 'Success',
              content: {
                'application/json': {
                  schema: this.generateSchema(endpoint.sampleData)
                }
              }
            }
          }
        };
        
        // Add query parameters if they exist
        if (endpoint.path.includes('?')) {
          const queryString = endpoint.path.split('?')[1];
          const params = queryString.split('&').map(param => {
            const [name, value] = param.split('=');
            return {
              name,
              in: 'query',
              required: false,
              schema: { type: 'string' },
              example: value
            };
          });
          paths[pathKey][method].parameters = params;
        }
        
        return paths;
      }, {})
    };
  }

  generateSchema(sampleData) {
    if (!sampleData) return { type: 'string' };
    
    if (sampleData.type === 'array') {
      const itemSchema = { type: 'object' };
      if (sampleData.itemTypes) {
        itemSchema.properties = Object.entries(sampleData.itemTypes).reduce((props, [key, type]) => {
          props[key] = { type: type === 'array[0]' ? 'array' : type };
          return props;
        }, {});
      }
      
      return {
        type: 'array',
        items: itemSchema
      };
    } else if (sampleData.type === 'object') {
      const schema = { type: 'object' };
      if (sampleData.structure) {
        schema.properties = Object.entries(sampleData.structure).reduce((props, [key, type]) => {
          props[key] = { type: type.startsWith('array') ? 'array' : type };
          return props;
        }, {});
      }
      return schema;
    }
    
    return { type: 'string' };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const analyzer = new FILOAPIAnalyzer();
  analyzer.analyzeAPIs().catch(error => {
    console.error('❌ API analysis failed:', error);
    process.exit(1);
  });
}

module.exports = FILOAPIAnalyzer;