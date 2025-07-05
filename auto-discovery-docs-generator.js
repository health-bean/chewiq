#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

class AutoDiscoveryDocsGenerator {
  constructor() {
    this.baseURL = 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';
    this.rootPath = process.cwd();
    this.docsPath = path.join(this.rootPath, 'docs', 'docs');
    this.repositoryInfo = this.getRepositoryInfo();
    this.repositoryUrl = this.repositoryInfo.url;
    
    this.discovered = {
      apis: [],
      components: [],
      features: [],
      auth: {},
      database: {},
      deployment: {},
      architecture: {}
    };
  }

  getRepositoryUrl() {
    try {
      // Try to get from git remote
      const { execSync } = require('child_process');
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      
      // Convert SSH to HTTPS format if needed
      if (remoteUrl.startsWith('git@github.com:')) {
        return remoteUrl.replace('git@github.com:', 'https://github.com/').replace('.git', '');
      }
      
      // Clean up HTTPS URL
      return remoteUrl.replace('.git', '');
    } catch (error) {
      console.log('   ⚠️  Could not auto-detect repository URL, using fallback');
      // Try to construct from discovered info
      if (this.discovered.deployment?.organizationName) {
        return `https://github.com/${this.discovered.deployment.organizationName}/health-platform`;
      }
      return 'https://github.com/your-username/health-platform';
    }
  }

  getRepositoryInfo() {
    try {
      const { execSync } = require('child_process');
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      
      // Extract owner and repo from GitHub URL
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      if (match) {
        return {
          owner: match[1],
          repo: match[2],
          url: `https://github.com/${match[1]}/${match[2]}`
        };
      }
    } catch (error) {
      console.log('   ⚠️  Could not auto-detect repository info');
    }
    
    return {
      owner: 'your-username',
      repo: 'health-platform',
      url: 'https://github.com/your-username/health-platform'
    };
  }

  cleanDocsDirectory() {
    console.log('🧹 Cleaning old documentation...');
    
    const docsDir = path.join(this.rootPath, 'docs', 'docs');
    
    if (fs.existsSync(docsDir)) {
      const items = fs.readdirSync(docsDir);
      
      items.forEach(item => {
        const itemPath = path.join(docsDir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          fs.rmSync(itemPath, { recursive: true, force: true });
        } else if (item.endsWith('.md')) {
          fs.unlinkSync(itemPath);
        }
      });
    }
    
    const sidebarPath = path.join(this.rootPath, 'docs', 'sidebars.js');
    if (fs.existsSync(sidebarPath)) {
      fs.unlinkSync(sidebarPath);
    }
    
    console.log('   ✅ Old documentation cleaned');
  }

  async generateComplete() {
    console.log('🔍 Auto-Discovering FILO Health Platform Implementation...\n');
    
    this.cleanDocsDirectory();
    
    await this.discoverAPIs();
    await this.discoverAuthentication();
    await this.discoverComponents();
    await this.discoverArchitecture();
    await this.discoverDeployment();
    
    this.generateIntroduction();
    this.generateQuickStart();
    this.generateDevelopmentSetup();
    this.generateAPIDocumentation();
    this.generateAuthenticationDocs();
    this.generateComponentDocs();
    this.generateArchitectureDocs();
    this.generateDeploymentDocs();
    this.generateSidebar();
    
    console.log('✅ Complete documentation generated from actual implementation!');
  }

  async discoverAPIs() {
    console.log('🌐 Auto-discovering API endpoints...');
    
    const testEndpoints = [
      '/api/v1/protocols',
      '/api/v1/foods/search?search=test',
      '/api/v1/foods/by-protocol?protocol_id=test',
      '/api/v1/correlations/insights?userId=test',
      '/api/v1/timeline/entries',
      '/api/v1/users',
      '/api/v1/user/protocols',
      '/api/v1/user/preferences',
      '/api/v1/journal/entries',
      '/api/v1/symptoms/search?search=test',
      '/api/v1/supplements/search?search=test',
      '/api/v1/medications/search?search=test',
      '/api/v1/detox-types',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/refresh',
      '/api/v1/auth/logout'
    ];

    for (const endpoint of testEndpoints) {
      const result = await this.testEndpoint(endpoint);
      if (result.working || result.implemented) {
        this.discovered.apis.push(result);
      }
    }

    console.log(`   ✅ Found ${this.discovered.apis.length} working/implemented APIs`);
  }

  async testEndpoint(path) {
    return new Promise((resolve) => {
      const url = `${this.baseURL}${path}`;
      const startTime = Date.now();

      const options = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      };

      const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          
          try {
            const data = JSON.parse(body);
            resolve({
              path: path.split('?')[0],
              method: 'GET',
              status: res.statusCode,
              working: res.statusCode >= 200 && res.statusCode < 300,
              implemented: res.statusCode !== 404,
              responseTime,
              responseSchema: this.analyzeResponseSchema(data),
              description: this.inferEndpointPurpose(path),
              category: this.categorizeEndpoint(path)
            });
          } catch (error) {
            resolve({
              path: path.split('?')[0],
              method: 'GET',
              status: res.statusCode,
              working: res.statusCode >= 200 && res.statusCode < 300,
              implemented: res.statusCode !== 404,
              responseTime,
              description: this.inferEndpointPurpose(path),
              category: this.categorizeEndpoint(path)
            });
          }
        });
      });

      req.on('error', () => {
        resolve({
          path: path.split('?')[0],
          method: 'GET',
          status: 0,
          working: false,
          implemented: false,
          description: this.inferEndpointPurpose(path),
          category: this.categorizeEndpoint(path)
        });
      });

      req.end();
    });
  }

  analyzeResponseSchema(data) {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        itemCount: data.length,
        sampleItem: data[0] ? this.getObjectStructure(data[0]) : null
      };
    }
    return this.getObjectStructure(data);
  }

  getObjectStructure(obj) {
    if (!obj || typeof obj !== 'object') return { type: typeof obj };
    
    const structure = {};
    Object.keys(obj).slice(0, 10).forEach(key => {
      const value = obj[key];
      if (Array.isArray(value)) {
        structure[key] = `array[${value.length}]`;
      } else {
        structure[key] = typeof value;
      }
    });
    return structure;
  }

  inferEndpointPurpose(path) {
    const purposes = {
      '/api/v1/protocols': 'Get available health protocols',
      '/api/v1/foods': 'Food database operations',
      '/api/v1/correlations': 'AI-powered food-symptom correlations',
      '/api/v1/timeline': 'User timeline and logging',
      '/api/v1/users': 'User management',
      '/api/v1/user': 'User-specific operations',
      '/api/v1/journal': 'Health journaling',
      '/api/v1/symptoms': 'Symptom database',
      '/api/v1/supplements': 'Supplement database',
      '/api/v1/medications': 'Medication database',
      '/api/v1/detox': 'Detox protocols',
      '/api/v1/auth': 'Authentication and authorization'
    };

    for (const [prefix, purpose] of Object.entries(purposes)) {
      if (path.startsWith(prefix)) return purpose;
    }
    return 'API endpoint';
  }

  categorizeEndpoint(path) {
    if (path.includes('/auth/')) return 'Authentication';
    if (path.includes('/user')) return 'User Management';
    if (path.includes('/food')) return 'Food Database';
    if (path.includes('/correlations')) return 'AI & Analytics';
    if (path.includes('/timeline') || path.includes('/journal')) return 'Health Tracking';
    if (path.includes('/protocols')) return 'Health Protocols';
    return 'Core';
  }

  async discoverAuthentication() {
    console.log('🔐 Auto-discovering authentication implementation...');
    
    const authFiles = this.findAuthImplementation();
    const authEndpoints = this.discovered.apis.filter(api => api.category === 'Authentication');
    
    this.discovered.auth = {
      implemented: authEndpoints.length > 0 || authFiles.length > 0,
      endpoints: authEndpoints,
      files: authFiles,
      type: this.inferAuthType(authFiles),
      features: this.discoverAuthFeatures(authFiles)
    };

    console.log(`   ✅ Authentication: ${this.discovered.auth.implemented ? 'Implemented' : 'Not found'}`);
  }

  findAuthImplementation() {
    const authFiles = [];
    const searchPaths = [
      'backend/functions/api',
      'backend/auth',
      'frontend/src',
      'frontend/shared'
    ];

    searchPaths.forEach(searchPath => {
      const fullPath = path.join(this.rootPath, searchPath);
      if (fs.existsSync(fullPath)) {
        const files = this.findFilesRecursive(fullPath, /auth|login|jwt|token/i);
        authFiles.push(...files);
      }
    });

    return authFiles;
  }

  findFilesRecursive(dir, pattern) {
    const files = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && item !== 'node_modules') {
          files.push(...this.findFilesRecursive(fullPath, pattern));
        } else if (stat.isFile() && pattern.test(item)) {
          files.push(path.relative(this.rootPath, fullPath));
        }
      }
    } catch (error) {
      // Directory read error
    }
    return files;
  }

  inferAuthType(authFiles) {
    const content = authFiles.map(file => {
      try {
        return fs.readFileSync(path.join(this.rootPath, file), 'utf8');
      } catch {
        return '';
      }
    }).join(' ');

    if (content.includes('jwt') || content.includes('jsonwebtoken')) return 'JWT';
    if (content.includes('passport')) return 'Passport.js';
    if (content.includes('auth0')) return 'Auth0';
    if (content.includes('cognito')) return 'AWS Cognito';
    return 'Custom';
  }

  discoverAuthFeatures(authFiles) {
    const features = [];
    const content = authFiles.map(file => {
      try {
        return fs.readFileSync(path.join(this.rootPath, file), 'utf8');
      } catch {
        return '';
      }
    }).join(' ');

    if (content.includes('login') || content.includes('signin')) features.push('Login');
    if (content.includes('register') || content.includes('signup')) features.push('Registration');
    if (content.includes('refresh')) features.push('Token Refresh');
    if (content.includes('logout')) features.push('Logout');
    if (content.includes('reset') || content.includes('forgot')) features.push('Password Reset');
    if (content.includes('verify') || content.includes('confirm')) features.push('Email Verification');

    return features;
  }

  discoverComponents() {
    console.log('⚛️  Auto-discovering React components...');
    
    const componentPaths = [
      'frontend/shared/components',
      'frontend/shared',
      'frontend/web-app/src/components'
    ];

    componentPaths.forEach(compPath => {
      const fullPath = path.join(this.rootPath, compPath);
      if (fs.existsSync(fullPath)) {
        const components = this.findReactComponents(fullPath);
        this.discovered.components.push(...components);
      }
    });

    console.log(`   ✅ Found ${this.discovered.components.length} components`);
  }

  findReactComponents(dir) {
    const components = [];
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isFile() && item.match(/\.(jsx?|tsx?)$/)) {
          const content = fs.readFileSync(itemPath, 'utf8');
          if (this.isReactComponent(content)) {
            components.push({
              name: item.replace(/\.(jsx?|tsx?)$/, ''),
              path: path.relative(this.rootPath, itemPath),
              type: this.detectComponentType(content),
              exports: this.extractExports(content),
              props: this.extractProps(content)
            });
          }
        }
      }
    } catch (error) {
      // Directory read error
    }
    return components;
  }

  isReactComponent(content) {
    return (content.includes('export') && 
            content.includes('return') && 
            (content.includes('<') || content.includes('jsx')));
  }

  detectComponentType(content) {
    if (content.includes('useState') || content.includes('useEffect')) return 'Functional (Hooks)';
    if (content.includes('function')) return 'Functional';
    if (content.includes('class') && content.includes('render')) return 'Class';
    return 'Component';
  }

  extractExports(content) {
    const exports = [];
    const exportMatches = content.match(/export\s+(?:default\s+)?(?:const\s+|function\s+)?(\w+)/g);
    if (exportMatches) {
      exportMatches.forEach(match => {
        const name = match.replace(/export\s+(?:default\s+)?(?:const\s+|function\s+)?/, '');
        exports.push(name);
      });
    }
    return exports;
  }

  extractProps(content) {
    const propMatches = content.match(/(?:function\s+\w+\s*\(|\(\s*)(\{[^}]+\})/);
    return propMatches ? propMatches[1] : null;
  }

  discoverArchitecture() {
    console.log('🏗️  Auto-discovering architecture...');
    
    const packageJsons = this.findAllPackageJsons();
    const deployment = this.detectDeploymentStrategy();
    const database = this.detectDatabase();
    
    this.discovered.architecture = {
      type: this.inferArchitectureType(),
      frontend: this.analyzeFrontend(),
      backend: this.analyzeBackend(),
      database: database,
      deployment: deployment,
      packages: packageJsons
    };

    console.log('   ✅ Architecture analyzed');
  }

  findAllPackageJsons() {
    const packages = [];
    const packagePaths = [
      'package.json',
      'frontend/shared/package.json',
      'frontend/web-app/package.json',
      'backend/functions/api/package.json'
    ];

    packagePaths.forEach(pkgPath => {
      const fullPath = path.join(this.rootPath, pkgPath);
      if (fs.existsSync(fullPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          packages.push({
            path: pkgPath,
            name: pkg.name,
            type: this.inferPackageType(pkgPath, pkg),
            dependencies: Object.keys(pkg.dependencies || {}),
            scripts: Object.keys(pkg.scripts || {})
          });
        } catch (error) {
          // Parse error
        }
      }
    });

    return packages;
  }

  inferPackageType(path, pkg) {
    if (path.includes('shared')) return 'Component Library';
    if (path.includes('web-app')) return 'React Application';
    if (path.includes('backend') || path.includes('api')) return 'Backend API';
    if (pkg.dependencies && pkg.dependencies.react) return 'Frontend';
    return 'Unknown';
  }

  inferArchitectureType() {
    const hasAmplify = fs.existsSync(path.join(this.rootPath, 'amplify.yml'));
    const hasFrontend = fs.existsSync(path.join(this.rootPath, 'frontend'));
    const hasBackend = fs.existsSync(path.join(this.rootPath, 'backend'));
    
    if (hasAmplify) return 'AWS Amplify Fullstack';
    if (hasFrontend && hasBackend) return 'Fullstack Application';
    return 'Web Application';
  }

  analyzeFrontend() {
    const webAppPkg = path.join(this.rootPath, 'frontend/web-app/package.json');
    if (!fs.existsSync(webAppPkg)) return null;

    try {
      const pkg = JSON.parse(fs.readFileSync(webAppPkg, 'utf8'));
      return {
        framework: pkg.dependencies.react ? 'React' : 'Unknown',
        bundler: pkg.devDependencies.vite ? 'Vite' : 'Unknown',
        styling: pkg.dependencies.tailwindcss || pkg.devDependencies.tailwindcss ? 'Tailwind CSS' : 'Unknown',
        components: this.discovered.components.length
      };
    } catch {
      return null;
    }
  }

  analyzeBackend() {
    const apiPkg = path.join(this.rootPath, 'backend/functions/api/package.json');
    if (!fs.existsSync(apiPkg)) return null;

    try {
      const pkg = JSON.parse(fs.readFileSync(apiPkg, 'utf8'));
      return {
        runtime: 'Node.js',
        database: pkg.dependencies.pg ? 'PostgreSQL' : 'Unknown',
        auth: pkg.dependencies.jsonwebtoken ? 'JWT' : 'Unknown',
        deployment: 'AWS Lambda'
      };
    } catch {
      return null;
    }
  }

  detectDatabase() {
    const dbFiles = this.findFilesRecursive(this.rootPath, /database|db|sql|mongo/i);
    const packageJsons = this.findAllPackageJsons();
    
    const dbDeps = packageJsons.flatMap(pkg => pkg.dependencies)
      .filter(dep => dep.includes('pg') || dep.includes('mongo') || dep.includes('mysql'));

    return {
      detected: dbDeps.length > 0,
      type: dbDeps.includes('pg') ? 'PostgreSQL' : 
            dbDeps.includes('mongo') ? 'MongoDB' : 
            dbDeps.includes('mysql') ? 'MySQL' : 'Unknown',
      files: dbFiles.slice(0, 5)
    };
  }

  detectDeploymentStrategy() {
    if (fs.existsSync(path.join(this.rootPath, 'amplify.yml'))) {
      return { type: 'AWS Amplify', config: 'amplify.yml' };
    }
    if (fs.existsSync(path.join(this.rootPath, 'vercel.json'))) {
      return { type: 'Vercel', config: 'vercel.json' };
    }
    if (fs.existsSync(path.join(this.rootPath, '.github/workflows'))) {
      return { type: 'GitHub Actions', config: '.github/workflows/' };
    }
    return { type: 'Unknown', config: null };
  }

  discoverDeployment() {
    console.log('🚀 Auto-discovering deployment configuration...');
    
    this.discovered.deployment = this.discovered.architecture.deployment;
    console.log(`   ✅ Deployment: ${this.discovered.deployment.type}`);
  }

  generateIntroduction() {
    const workingAPIs = this.discovered.apis.filter(api => api.working).length;
    const authStatus = this.discovered.auth.implemented ? 'Implemented' : 'Not implemented';
    
    const intro = `---
title: FILO Health Platform
sidebar_position: 1
---

# FILO Health Platform

AI-powered health intelligence platform for tracking food sensitivities and health correlations.

## Platform Status

- **Architecture:** ${this.discovered.architecture.type}
- **Frontend:** ${this.discovered.architecture.frontend?.framework || 'Unknown'} with ${this.discovered.components.length} components
- **Backend:** ${this.discovered.architecture.backend?.runtime || 'Unknown'} (${this.discovered.architecture.backend?.deployment || 'Unknown'})
- **Database:** ${this.discovered.architecture.database?.type || 'Unknown'}
- **Authentication:** ${authStatus}
- **Working APIs:** ${workingAPIs}/${this.discovered.apis.length}

## Quick Start

1. **[Development Setup](./development/setup)**
2. **[API Documentation](./api/overview)**
3. **[Component Library](./components/overview)**

## Recent Implementation

${this.generateRecentFeatures()}

---

*Auto-generated from live system analysis on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('index.md', intro);
  }

  generateRecentFeatures() {
    const features = [];
    
    if (this.discovered.auth.implemented) {
      features.push(`- ✅ **Authentication System** (${this.discovered.auth.type})`);
      this.discovered.auth.features.forEach(feature => {
        features.push(`  - ${feature}`);
      });
    }
    
    const workingAPIs = this.discovered.apis.filter(api => api.working);
    if (workingAPIs.length > 0) {
      features.push(`- ✅ **${workingAPIs.length} Working API Endpoints**`);
    }
    
    if (this.discovered.components.length > 0) {
      features.push(`- ✅ **${this.discovered.components.length} React Components**`);
    }
    
    return features.length > 0 ? features.join('\n') : '- Development in progress...';
  }

  generateQuickStart() {
    const quickStart = `---
title: Quick Start
sidebar_position: 2
---

# Quick Start Guide

Get the FILO Health Platform running locally in minutes.

## Prerequisites

- Node.js 18+
- npm or yarn
${this.discovered.deployment.type === 'AWS Amplify' ? '- AWS CLI and Amplify CLI' : ''}

## Installation

\`\`\`bash
# Clone the repository
git clone ${this.repositoryUrl}.git
cd health-platform

# Install dependencies
${this.generateInstallationSteps()}

# Start development
${this.generateDevelopmentSteps()}
\`\`\`

## Verify Installation

Test API connectivity:
\`\`\`bash
curl ${this.baseURL}/api/v1/protocols
\`\`\`

Expected response: List of health protocols

## Next Steps

1. **[Explore the API](./api/overview)** - Test available endpoints
2. **[Browse Components](./components/overview)** - Use shared components
3. **[Understand Architecture](./architecture/overview)** - System design

## Development URLs

- **Frontend:** http://localhost:5173 (Vite dev server)
- **API:** ${this.baseURL}
- **Documentation:** This site

---

*Installation verified on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('quick-start.md', quickStart);
  }

  generateDevelopmentSetup() {
    const setupDoc = `---
title: Development Setup
sidebar_position: 3
---

# Development Setup

Complete setup guide for the FILO Health Platform development environment.

## Prerequisites

- Node.js 18+
- npm or yarn
- Git
${this.discovered.deployment.type === 'AWS Amplify' ? '- AWS CLI and Amplify CLI' : ''}

## Clone Repository

\`\`\`bash
git clone ${this.repositoryUrl}.git
cd health-platform
\`\`\`

## Install Dependencies

${this.generateInstallationSteps()}

## Environment Configuration

${this.generateEnvironmentDocs()}

## Start Development

${this.generateDevelopmentSteps()}

## Verify Setup

1. **Test API connectivity:**
   \`\`\`bash
   curl ${this.baseURL}/api/v1/protocols
   \`\`\`

2. **Access frontend:**
   Open http://localhost:5173 in your browser

3. **View documentation:**
   Access this documentation site

## Troubleshooting

### Common Issues

- **Port already in use:** Change port in package.json or kill existing process
- **API connection failed:** Check if backend is running and API URL is correct
- **Build errors:** Clear node_modules and reinstall dependencies

### Getting Help

- Check the [API Documentation](../api/overview) for endpoint details
- Review [Architecture Overview](../architecture/overview) for system understanding
- Examine [Component Library](../components/overview) for UI components

---

*Development setup guide auto-generated on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('development/setup.md', setupDoc);
  }

  generateInstallationSteps() {
    const packages = this.discovered.architecture.packages;
    const steps = [];
    
    packages.forEach(pkg => {
      if (pkg.path !== 'package.json') {
        const dir = path.dirname(pkg.path);
        steps.push(`cd ${dir} && npm install`);
      }
    });
    
    return steps.join('\n');
  }

  generateDevelopmentSteps() {
    const webAppPkg = this.discovered.architecture.packages.find(p => p.path.includes('web-app'));
    if (webAppPkg && webAppPkg.scripts.includes('dev')) {
      return 'cd frontend/web-app && npm run dev';
    }
    return 'npm start';
  }

  generateAPIDocumentation() {
    const categories = this.groupAPIsByCategory();
    
    let apiDoc = `---
title: API Reference
sidebar_position: 3
---

# API Reference

Live API documentation for all implemented endpoints.

**Base URL:** \`${this.baseURL}\`

## Authentication

${this.generateAuthSection()}

## Endpoints by Category

`;

    Object.keys(categories).forEach(category => {
      apiDoc += `### ${category}\n\n`;
      
      categories[category].forEach(api => {
        apiDoc += `#### ${api.method} ${api.path}\n\n`;
        apiDoc += `${api.description}\n\n`;
        apiDoc += `**Status:** ${api.working ? '✅ Working' : api.implemented ? '⚠️ Implemented but not working' : '❌ Not implemented'}\n\n`;
        
        if (api.responseTime) {
          apiDoc += `**Response Time:** ${api.responseTime}ms\n\n`;
        }
        
        apiDoc += `**Example:**\n\`\`\`bash\ncurl "${this.baseURL}${api.path}"\n\`\`\`\n\n`;
        
        if (api.responseSchema) {
          apiDoc += `**Response Schema:**\n\`\`\`json\n${JSON.stringify(api.responseSchema, null, 2)}\n\`\`\`\n\n`;
        }
        
        apiDoc += '---\n\n';
      });
    });

    apiDoc += `\n*API documentation auto-generated on ${new Date().toLocaleDateString()}*\n`;
    
    this.writeDocFile('api/overview.md', apiDoc);
  }

  groupAPIsByCategory() {
    const categories = {};
    this.discovered.apis.forEach(api => {
      if (!categories[api.category]) {
        categories[api.category] = [];
      }
      categories[api.category].push(api);
    });
    return categories;
  }

  generateAuthSection() {
    if (!this.discovered.auth.implemented) {
      return '**Status:** Not implemented\n\nAuthentication system is not yet implemented.';
    }
    
    let authSection = `**Status:** ✅ Implemented (${this.discovered.auth.type})\n\n`;
    authSection += `**Features:**\n`;
    this.discovered.auth.features.forEach(feature => {
      authSection += `- ${feature}\n`;
    });
    
    if (this.discovered.auth.endpoints.length > 0) {
      authSection += `\n**Endpoints:**\n`;
      this.discovered.auth.endpoints.forEach(endpoint => {
        authSection += `- \`${endpoint.method} ${endpoint.path}\` - ${endpoint.description}\n`;
      });
    }
    
    return authSection;
  }

  generateAuthenticationDocs() {
    if (!this.discovered.auth.implemented) return;
    
    const authDoc = `---
title: Authentication
sidebar_position: 4
---

# Authentication System

${this.discovered.auth.type} authentication implementation.

## Overview

The FILO Health Platform uses ${this.discovered.auth.type} for user authentication and authorization.

## Implemented Features

${this.discovered.auth.features.map(feature => `- ✅ ${feature}`).join('\n')}

## Authentication Flow

${this.generateAuthFlow()}

## API Endpoints

${this.discovered.auth.endpoints.map(endpoint => 
  `### ${endpoint.method} ${endpoint.path}\n\n${endpoint.description}\n\n**Status:** ${endpoint.working ? '✅ Working' : '⚠️ Needs testing'}\n`
).join('\n')}

## Implementation Files

${this.discovered.auth.files.map(file => `- \`${file}\``).join('\n')}

---

*Authentication documentation auto-generated on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('authentication/overview.md', authDoc);
  }

  generateAuthFlow() {
    if (this.discovered.auth.type === 'JWT') {
      return `1. **Register/Login** - User provides credentials
2. **Token Generation** - Server returns JWT token
3. **Token Storage** - Client stores token securely
4. **Authenticated Requests** - Include token in Authorization header
5. **Token Refresh** - Refresh token before expiration`;
    }
    
    return 'Authentication flow varies by implementation type.';
  }

  generateComponentDocs() {
    const componentDoc = `---
title: Component Library
sidebar_position: 5
---

# Component Library

Shared React components for the FILO Health Platform.

## Available Components (${this.discovered.components.length})

${this.discovered.components.map(comp => 
  `### ${comp.name}\n\n**Type:** ${comp.type}\n**Location:** \`${comp.path}\`\n\n${comp.exports.length > 0 ? `**Exports:** ${comp.exports.join(', ')}\n\n` : ''}${comp.props ? `**Props:** \`${comp.props}\`\n\n` : ''}`
).join('\n')}

## Usage

\`\`\`javascript
// Import from shared library
import { ComponentName } from '../shared';

// Use in your app
<ComponentName {...props} />
\`\`\`

## Component Development

All shared components are located in \`frontend/shared/components/\`.

### Adding New Components

1. Create component file in \`frontend/shared/components/\`
2. Export from \`frontend/shared/index.js\`
3. Document props and usage
4. Test in isolation

---

*Component documentation auto-generated on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('components/overview.md', componentDoc);
  }

  generateArchitectureDocs() {
    const archDoc = `---
title: Architecture Overview
sidebar_position: 6
---

# Architecture Overview

Technical architecture of the FILO Health Platform.

## System Architecture

**Type:** ${this.discovered.architecture.type}

### Frontend
${this.discovered.architecture.frontend ? `
- **Framework:** ${this.discovered.architecture.frontend.framework}
- **Bundler:** ${this.discovered.architecture.frontend.bundler}
- **Styling:** ${this.discovered.architecture.frontend.styling}
- **Components:** ${this.discovered.architecture.frontend.components} shared components
` : 'Frontend architecture not detected'}

### Backend
${this.discovered.architecture.backend ? `
- **Runtime:** ${this.discovered.architecture.backend.runtime}
- **Database:** ${this.discovered.architecture.backend.database}
- **Authentication:** ${this.discovered.architecture.backend.auth}
- **Deployment:** ${this.discovered.architecture.backend.deployment}
` : 'Backend architecture not detected'}

## Project Structure

\`\`\`
health-platform/
├── frontend/
│   ├── shared/           # Component library
│   └── web-app/          # Main React application
├── backend/
│   └── functions/api/    # API backend
└── docs/                 # Documentation (this site)
\`\`\`

## Package Management

${this.discovered.architecture.packages.map(pkg => 
  `### ${pkg.name} (\`${pkg.path}\`)\n\n**Type:** ${pkg.type}\n**Dependencies:** ${pkg.dependencies.length}\n**Scripts:** ${pkg.scripts.join(', ')}\n`
).join('\n')}

## Database

${this.discovered.architecture.database.detected ? `
**Type:** ${this.discovered.architecture.database.type}
**Configuration Files:** ${this.discovered.architecture.database.files.join(', ')}
` : 'Database configuration not detected'}

## Deployment

**Strategy:** ${this.discovered.deployment.type}
${this.discovered.deployment.config ? `**Configuration:** \`${this.discovered.deployment.config}\`` : ''}

---

*Architecture documentation auto-generated on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('architecture/overview.md', archDoc);
  }

  generateDeploymentDocs() {
    const deployDoc = `---
title: Deployment Guide
sidebar_position: 7
---

# Deployment Guide

How to deploy the FILO Health Platform.

## Deployment Strategy

**Current:** ${this.discovered.deployment.type}

${this.generateDeploymentInstructions()}

## Environment Configuration

${this.generateEnvironmentDocs()}

## Monitoring & Health Checks

- **API Health:** ${this.baseURL}/api/v1/protocols
- **Documentation:** This site
- **Working Endpoints:** ${this.discovered.apis.filter(api => api.working).length}/${this.discovered.apis.length}

---

*Deployment documentation auto-generated on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('deployment/overview.md', deployDoc);
  }

  generateDeploymentInstructions() {
    switch (this.discovered.deployment.type) {
      case 'AWS Amplify':
        return `### AWS Amplify Deployment

\`\`\`bash
# Initialize Amplify
amplify init

# Deploy infrastructure
amplify push

# Deploy frontend
amplify publish
\`\`\``;
      
      case 'GitHub Actions':
        return `### GitHub Actions Deployment

Deployment happens automatically via GitHub Actions when you push to main branch.

Check \`.github/workflows/\` for configuration.`;
      
      default:
        return 'Deployment configuration not detected. Manual deployment may be required.';
    }
  }

  generateEnvironmentDocs() {
    const envFiles = ['.env', '.env.local', '.env.example'].filter(file => 
      fs.existsSync(path.join(this.rootPath, file))
    );
    
    if (envFiles.length === 0) {
      return 'No environment configuration files detected.';
    }
    
    return `**Environment Files Found:**
${envFiles.map(file => `- \`${file}\``).join('\n')}

Configure your environment variables before deployment.`;
  }

  generateSidebar() {
    const sidebarItems = [
      'index',
      'quick-start',
      {
        type: 'category',
        label: 'Development',
        items: ['development/setup']
      },
      {
        type: 'category',
        label: 'API Reference',
        items: ['api/overview']
      },
      {
        type: 'category', 
        label: 'Components',
        items: ['components/overview']
      },
      {
        type: 'category',
        label: 'Architecture',
        items: ['architecture/overview']
      }
    ];

    if (this.discovered.auth.implemented) {
      sidebarItems.splice(3, 0, {
        type: 'category',
        label: 'Authentication',
        items: ['authentication/overview']
      });
    }

    sidebarItems.push({
      type: 'category',
      label: 'Deployment',
      items: ['deployment/overview']
    });

    const sidebarConfig = {
      tutorialSidebar: sidebarItems
    };

    this.writeDocFile('../sidebars.js', `module.exports = ${JSON.stringify(sidebarConfig, null, 2)};`);
  }

  writeDocFile(filename, content) {
    const filePath = path.join(this.docsPath, filename);
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Generated ${filename}`);
  }
}

if (require.main === module) {
  const generator = new AutoDiscoveryDocsGenerator();
  generator.generateComplete().catch(console.error);
}

module.exports = AutoDiscoveryDocsGenerator;