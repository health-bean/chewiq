#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

class AutoDiscoveryAPIAnalyzer {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';
    this.lambdaPath = options.lambdaPath || './backend/functions/api/';
    this.results = {
      endpoints: [],
      discoveredRoutes: [],
      status: 'unknown',
      timestamp: new Date().toISOString(),
      summary: {
        discovered: 0,
        working: 0,
        broken: 0,
        total: 0
      }
    };
  }

  async analyzeAPIs() {
    console.log('🔍 Auto-discovering FILO Health Platform APIs...');
    console.log(`Lambda Path: ${this.lambdaPath}`);
    console.log(`Base URL: ${this.baseURL}\n`);
    
    // Step 1: Auto-discover endpoints from Lambda code
    const discoveredEndpoints = await this.discoverEndpoints();
    
    if (discoveredEndpoints.length === 0) {
      console.log('⚠️  No endpoints discovered. Falling back to known endpoints...');
      return this.fallbackToKnownEndpoints();
    }
    
    console.log(`🎯 Discovered ${discoveredEndpoints.length} endpoints from Lambda code\n`);
    
    // Step 2: Test all discovered endpoints
    for (const endpoint of discoveredEndpoints) {
      await this.testEndpoint(endpoint);
      await this.sleep(300); // Rate limiting
    }

    this.generateReport();
    this.saveResults();
  }

  async discoverEndpoints() {
    const endpoints = [];
    
    try {
      // Scan Lambda function files
      const lambdaFiles = this.findLambdaFiles();
      
      for (const file of lambdaFiles) {
        const routes = this.parseRoutes(file);
        endpoints.push(...routes);
      }
      
      // Add common test variations
      const enhancedEndpoints = this.enhanceEndpoints(endpoints);
      
      this.results.discoveredRoutes = enhancedEndpoints;
      this.results.summary.discovered = enhancedEndpoints.length;
      
      return enhancedEndpoints;
      
    } catch (error) {
      console.error('❌ Error discovering endpoints:', error.message);
      return [];
    }
  }

  findLambdaFiles() {
    const files = [];
    
    const searchPaths = [
      this.lambdaPath,
      './backend/',
      './src/',
      './functions/',
      './'
    ];
    
    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        const foundFiles = this.scanDirectory(searchPath);
        files.push(...foundFiles);
        if (foundFiles.length > 0) {
          console.log(`📁 Found ${foundFiles.length} Lambda files in ${searchPath}`);
          break; // Use first valid directory
        }
      }
    }
    
    return files;
  }

  scanDirectory(dir) {
    const files = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...this.scanDirectory(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or no permission
    }
    
    return files;
  }

  parseRoutes(filePath) {
    const routes = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse different route patterns
      const patterns = [
        // AWS Lambda event routing
        /(?:path|resource)\s*===?\s*['"`]([^'"`]+)['"`]/g,
        /(?:httpMethod|method)\s*===?\s*['"`]([^'"`]+)['"`]/g,
        
        // Express-style routes
        /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
        
        // Route objects
        /route\s*:\s*['"`]([^'"`]+)['"`]/g,
        /method\s*:\s*['"`]([^'"`]+)['"`]/g,
        
        // API Gateway proxy patterns
        /\/api\/v\d+\/[a-zA-Z0-9\-\/\?\=\&\_]+/g,
        
        // Custom route handlers
        /(['"`]\/api\/[^'"`]+['"`])/g
      ];
      
      const foundPaths = new Set();
      const foundMethods = new Set();
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const value = match[1] || match[2];
          if (value) {
            if (value.startsWith('/')) {
              foundPaths.add(value);
            } else if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(value.toUpperCase())) {
              foundMethods.add(value.toUpperCase());
            }
          }
        }
      }
      
      // Extract route information from Lambda handler patterns
      const lambdaRoutes = this.extractLambdaRoutes(content);
      routes.push(...lambdaRoutes);
      
      // Combine found paths with methods
      for (const apiPath of foundPaths) {
        if (apiPath.startsWith('/api/')) {
          const methods = foundMethods.size > 0 ? Array.from(foundMethods) : ['GET'];
          for (const method of methods) {
            routes.push({
              path: apiPath,
              method: method,
              description: `Auto-discovered ${method} ${apiPath}`,
              source: path.basename(filePath),
              requiresAuth: this.inferAuthRequirement(apiPath, content)
            });
          }
        }
      }
      
    } catch (error) {
      console.warn(`⚠️  Could not parse ${filePath}: ${error.message}`);
    }
    
    return routes;
  }

  extractLambdaRoutes(content) {
    const routes = [];
    
    // Look for Lambda handler routing patterns
    const routePatterns = [
      // if (httpMethod === 'GET' && path === '/api/v1/protocols')
      /if\s*\(\s*(?:httpMethod|method)\s*===?\s*['"`](\w+)['"`]\s*&&\s*(?:path|resource)\s*===?\s*['"`]([^'"`]+)['"`]/g,
      
      // if (path.startsWith('/api/v1/foods') && httpMethod === 'GET')
      /if\s*\(\s*(?:path|resource)\.startsWith\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*&&\s*(?:httpMethod|method)\s*===?\s*['"`](\w+)['"`]/g,
      
      // case '/api/v1/protocols':
      /case\s*['"`]([^'"`]+)['"`]\s*:/g,
      
      // Switch statement patterns
      /switch\s*\(\s*(?:path|resource)\s*\)[^}]*case\s*['"`]([^'"`]+)['"`]/g
    ];
    
    for (const pattern of routePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && match[2]) {
          // httpMethod and path
          routes.push({
            path: match[2],
            method: match[1].toUpperCase(),
            description: `Lambda route ${match[1]} ${match[2]}`,
            source: 'lambda-handler',
            requiresAuth: this.inferAuthRequirement(match[2], content)
          });
        } else if (match[1] && match[1].startsWith('/api/')) {
          // Just path, assume GET
          routes.push({
            path: match[1],
            method: 'GET',
            description: `Lambda route ${match[1]}`,
            source: 'lambda-handler',
            requiresAuth: this.inferAuthRequirement(match[1], content)
          });
        }
      }
    }
    
    return routes;
  }

  inferAuthRequirement(apiPath, content) {
    // Look for auth-related patterns near this route
    const authPatterns = [
      /getCurrentUser/,
      /requireAuth/,
      /authenticate/,
      /verifyToken/,
      /Authorization/,
      /Bearer/
    ];
    
    // Check if any auth patterns exist in the content
    for (const pattern of authPatterns) {
      if (pattern.test(content)) {
        // If it's a user-specific endpoint, probably needs auth
        if (apiPath.includes('/user/') || apiPath.includes('/journal/')) {
          return true;
        }
      }
    }
    
    return false; // Default to no auth required for dev mode
  }

  enhanceEndpoints(baseEndpoints) {
    const enhanced = [];
    
    // Remove duplicates
    const uniqueEndpoints = this.deduplicateEndpoints(baseEndpoints);
    
    for (const endpoint of uniqueEndpoints) {
      enhanced.push(endpoint);
      
      // Add common test variations for search endpoints
      if (endpoint.path.includes('/search')) {
        enhanced.push({
          ...endpoint,
          path: endpoint.path + (endpoint.path.includes('?') ? '&' : '?') + 'search=test',
          description: endpoint.description + ' (with search term)',
          isVariation: true
        });
      }
      
      // Add date filter variations
      if (endpoint.path.includes('/entries')) {
        enhanced.push({
          ...endpoint,
          path: endpoint.path + (endpoint.path.includes('?') ? '&' : '?') + 'date=2025-07-04',
          description: endpoint.description + ' (with date filter)',
          isVariation: true
        });
      }
      
      // Add userId variations for dev mode
      if (endpoint.requiresAuth || endpoint.path.includes('/user') || endpoint.path.includes('/correlation')) {
        enhanced.push({
          ...endpoint,
          path: endpoint.path + (endpoint.path.includes('?') ? '&' : '?') + 'userId=8e8a568a-c2f8-43a8-abf2-4e54408dbdc0',
          description: endpoint.description + ' (with userId)',
          isVariation: true
        });
      }
    }
    
    // Add POST endpoint variations
    const postEndpoints = this.generatePostEndpoints(uniqueEndpoints);
    enhanced.push(...postEndpoints);
    
    return enhanced;
  }

  deduplicateEndpoints(endpoints) {
    const seen = new Set();
    return endpoints.filter(endpoint => {
      const key = `${endpoint.method}:${endpoint.path}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  generatePostEndpoints(endpoints) {
    const postEndpoints = [];
    
    // Look for endpoints that might have POST variants
    const postCandidates = [
      '/api/v1/timeline/entries',
      '/api/v1/journal/entries',
      '/api/v1/auth',
      '/api/v1/users'
    ];
    
    for (const candidate of postCandidates) {
      const exists = endpoints.some(e => e.path === candidate && e.method === 'POST');
      if (!exists) {
        postEndpoints.push({
          path: candidate,
          method: 'POST',
          description: `Auto-discovered POST ${candidate}`,
          source: 'inferred',
          requiresAuth: candidate.includes('/user') || candidate.includes('/journal'),
          body: this.generatePostBody(candidate)
        });
      }
    }
    
    return postEndpoints;
  }

  generatePostBody(path) {
    const bodies = {
      '/api/v1/timeline/entries': {
        userId: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0',
        entryDate: '2025-07-04',
        entryType: 'food',
        content: 'Auto-discovery test entry'
      },
      '/api/v1/journal/entries': {
        userId: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0',
        date: '2025-07-04',
        mood: 'good',
        energy: 'high'
      },
      '/api/v1/auth': {
        email: 'patient@example.com',
        password: 'demo123456'
      }
    };
    
    return bodies[path] || { test: true };
  }

  async fallbackToKnownEndpoints() {
    console.log('🔄 Using fallback known endpoints...');
    
    // Your current working endpoints as fallback
    const knownEndpoints = [
      { path: '/api/v1/protocols', method: 'GET', description: 'Get available protocols' },
      { path: '/api/v1/correlations/insights?userId=8e8a568a-c2f8-43a8-abf2-4e54408dbdc0', method: 'GET', description: 'Get correlation insights' },
      { path: '/api/v1/foods/search?search=chicken', method: 'GET', description: 'Search foods' },
      { path: '/api/v1/timeline/entries', method: 'GET', description: 'Get timeline entries' },
      { path: '/api/v1/users', method: 'GET', description: 'Get user data' },
      { path: '/api/v1/symptoms/search?search=headache', method: 'GET', description: 'Search symptoms' }
    ];
    
    for (const endpoint of knownEndpoints) {
      await this.testEndpoint(endpoint);
      await this.sleep(300);
    }
    
    this.generateReport();
    this.saveResults();
  }

  async testEndpoint(endpoint) {
    return new Promise((resolve) => {
      const url = `${this.baseURL}${endpoint.path}`;
      const startTime = Date.now();
      
      console.log(`🔄 Testing: ${endpoint.method} ${endpoint.path}`);
      
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FILO-Auto-Discovery/1.0'
        }
      };

      // Add body for POST requests
      let postData = null;
      if (endpoint.method === 'POST' && endpoint.body) {
        postData = JSON.stringify(endpoint.body);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = https.request(url, options, (res) => {
        let body = '';
        const responseTime = Date.now() - startTime;
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedBody = JSON.parse(body);
            const dataType = Array.isArray(parsedBody) ? 'array' : typeof parsedBody;
            const working = res.statusCode >= 200 && res.statusCode < 300;
            
            const endpointResult = {
              path: endpoint.path,
              method: endpoint.method,
              description: endpoint.description,
              url: url,
              status: res.statusCode,
              responseTime: responseTime,
              dataType: dataType,
              dataSize: Buffer.byteLength(body),
              sampleData: this.createSampleData(parsedBody),
              headers: {
                'content-type': res.headers['content-type'],
                'content-length': res.headers['content-length']
              },
              working: working,
              source: endpoint.source || 'discovered',
              isVariation: endpoint.isVariation || false,
              requiresAuth: endpoint.requiresAuth || false,
              rawResponse: working ? null : body.substring(0, 500)
            };
            
            this.results.endpoints.push(endpointResult);
            
            if (working) {
              this.results.summary.working++;
              const dataInfo = parsedBody && typeof parsedBody === 'object' ? 
                `${dataType} with ${Object.keys(parsedBody).length} properties` : 
                `${dataType}`;
              console.log(`  ✅ ${res.statusCode} (${responseTime}ms) - ${dataInfo}`);
            } else {
              this.results.summary.broken++;
              console.log(`  ❌ ${res.statusCode} (${responseTime}ms) - Error`);
            }
            
          } catch (error) {
            const working = res.statusCode >= 200 && res.statusCode < 300;
            this.results.endpoints.push({
              path: endpoint.path,
              method: endpoint.method,
              description: endpoint.description,
              url: url,
              status: res.statusCode,
              responseTime: responseTime,
              dataType: 'text',
              dataSize: Buffer.byteLength(body),
              sampleData: { raw: body.substring(0, 200) },
              headers: {
                'content-type': res.headers['content-type'],
                'content-length': res.headers['content-length']
              },
              working: working,
              source: endpoint.source || 'discovered',
              isVariation: endpoint.isVariation || false,
              requiresAuth: endpoint.requiresAuth || false,
              rawResponse: body.substring(0, 500)
            });
            
            if (working) {
              this.results.summary.working++;
              console.log(`  ✅ ${res.statusCode} (${responseTime}ms) - Text response`);
            } else {
              this.results.summary.broken++;
              console.log(`  ❌ ${res.statusCode} (${responseTime}ms) - Parse error`);
            }
          }
          
          this.results.summary.total++;
          resolve();
        });
      });
      
      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        this.results.endpoints.push({
          path: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          url: url,
          status: 0,
          responseTime: responseTime,
          dataType: 'error',
          dataSize: 0,
          sampleData: { error: error.message },
          headers: {},
          working: false,
          source: endpoint.source || 'discovered',
          isVariation: endpoint.isVariation || false,
          requiresAuth: endpoint.requiresAuth || false,
          rawResponse: error.message
        });
        
        this.results.summary.broken++;
        this.results.summary.total++;
        console.log(`  ❌ Network Error (${responseTime}ms) - ${error.message}`);
        resolve();
      });
      
      if (postData) {
        req.write(postData);
      }
      
      req.end();
    });
  }

  createSampleData(data) {
    if (!data || typeof data !== 'object') {
      return { raw: data };
    }
    
    const type = Array.isArray(data) ? 'array' : 'object';
    const keys = Array.isArray(data) ? [] : Object.keys(data);
    
    const structure = {};
    if (Array.isArray(data)) {
      structure.length = data.length;
      if (data.length > 0) {
        structure.sample = data[0];
      }
    } else {
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (Array.isArray(value)) {
          structure[key] = `array[${value.length}]`;
        } else {
          structure[key] = typeof value;
        }
      });
    }
    
    return {
      type: type,
      keys: keys,
      sample: Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data,
      structure: structure
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateReport() {
    const successRate = this.results.summary.total > 0 
      ? Math.round((this.results.summary.working / this.results.summary.total) * 100)
      : 0;
    
    console.log('\n📊 FILO Auto-Discovery API Analysis Report');
    console.log('==========================================\n');
    
    console.log('🎯 DISCOVERY SUMMARY:');
    console.log(`🔍 Endpoints Discovered: ${this.results.summary.discovered}`);
    console.log(`✅ Working: ${this.results.summary.working}/${this.results.summary.total}`);
    console.log(`❌ Broken: ${this.results.summary.broken}/${this.results.summary.total}`);
    console.log(`📊 Success Rate: ${successRate}%\n`);
    
    // Show discovered routes
    if (this.results.discoveredRoutes.length > 0) {
      console.log('🔍 DISCOVERED ROUTES:');
      const routesBySource = this.groupBy(this.results.discoveredRoutes, 'source');
      Object.keys(routesBySource).forEach(source => {
        console.log(`  📁 From ${source}:`);
        routesBySource[source].forEach(route => {
          console.log(`    ${route.method} ${route.path}`);
        });
      });
      console.log('');
    }
    
    const workingEndpoints = this.results.endpoints.filter(e => e.working);
    const brokenEndpoints = this.results.endpoints.filter(e => !e.working);
    
    if (workingEndpoints.length > 0) {
      console.log('🟢 WORKING ENDPOINTS:');
      workingEndpoints.forEach(endpoint => {
        const sourceInfo = endpoint.source ? ` (${endpoint.source})` : '';
        console.log(`  ${endpoint.method} ${endpoint.path}${sourceInfo}`);
        console.log(`    Status: ${endpoint.status} | Response Time: ${endpoint.responseTime}ms`);
        console.log(`    Data: ${endpoint.dataType} with keys: ${endpoint.sampleData.keys ? endpoint.sampleData.keys.join(', ') : 'N/A'}`);
        console.log('');
      });
    }
    
    if (brokenEndpoints.length > 0) {
      console.log('🔴 BROKEN/ERROR ENDPOINTS:');
      brokenEndpoints.forEach(endpoint => {
        const sourceInfo = endpoint.source ? ` (${endpoint.source})` : '';
        console.log(`  ${endpoint.method} ${endpoint.path}${sourceInfo}`);
        console.log(`    Status: ${endpoint.status} | Issue: ${this.getErrorDescription(endpoint.status)}`);
        console.log('');
      });
    }
    
    this.results.status = successRate > 50 ? 'healthy' : 'degraded';
  }

  groupBy(array, key) {
    return array.reduce((result, item) => {
      (result[item[key]] = result[item[key]] || []).push(item);
      return result;
    }, {});
  }

  getErrorDescription(statusCode) {
    const descriptions = {
      0: 'Network Error',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden', 
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    return descriptions[statusCode] || 'HTTP Error';
  }

  saveResults() {
    // Save detailed analysis
    fs.writeFileSync('FILO_AUTO_DISCOVERY_ANALYSIS.json', JSON.stringify(this.results, null, 2));
    console.log('\n💾 Auto-discovery report saved to: FILO_AUTO_DISCOVERY_ANALYSIS.json');
    
    // Save discovered routes for future reference
    const routeMap = {
      timestamp: this.results.timestamp,
      discovered: this.results.discoveredRoutes,
      working: this.results.endpoints.filter(e => e.working).map(e => ({
        path: e.path,
        method: e.method,
        description: e.description,
        source: e.source
      }))
    };
    fs.writeFileSync('FILO_DISCOVERED_ROUTES.json', JSON.stringify(routeMap, null, 2));
    console.log('🗺️  Route map saved to: FILO_DISCOVERED_ROUTES.json');
    
    // Generate OpenAPI spec from discovered routes
    const openapi = this.generateOpenAPI();
    fs.writeFileSync('FILO_AUTO_OPENAPI.json', JSON.stringify(openapi, null, 2));
    console.log('📋 OpenAPI spec saved to: FILO_AUTO_OPENAPI.json');
  }

  generateOpenAPI() {
    const openapi = {
      openapi: '3.0.0',
      info: {
        title: 'FILO Health Platform API',
        version: '1.0.0',
        description: 'Auto-discovered API endpoints for FILO Health Platform'
      },
      servers: [
        {
          url: this.baseURL,
          description: 'Production API Gateway'
        }
      ],
      paths: {}
    };
    
    this.results.endpoints.forEach(endpoint => {
      const path = endpoint.path.split('?')[0];
      if (!openapi.paths[path]) {
        openapi.paths[path] = {};
      }
      
      openapi.paths[path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        tags: [this.inferTag(endpoint.path)],
        responses: {
          [endpoint.status]: {
            description: endpoint.working ? 'Success' : 'Error',
            content: {
              'application/json': {
                schema: {
                  type: endpoint.sampleData.type || 'object'
                }
              }
            }
          }
        }
      };
    });
    
    return openapi;
  }

  inferTag(path) {
    if (path.includes('/protocol')) return 'Protocols';
    if (path.includes('/food')) return 'Foods';
    if (path.includes('/correlation')) return 'Correlations';
    if (path.includes('/timeline')) return 'Timeline';
    if (path.includes('/journal')) return 'Journal';
    if (path.includes('/user')) return 'Users';
    if (path.includes('/symptom')) return 'Symptoms';
    if (path.includes('/supplement')) return 'Supplements';
    if (path.includes('/medication')) return 'Medications';
    return 'General';
  }
}

// Run the auto-discovery analysis
const analyzer = new AutoDiscoveryAPIAnalyzer({
  baseURL: 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev',
  lambdaPath: './backend/functions/api/' // Adjust this path as needed
});

analyzer.analyzeAPIs().catch(console.error);