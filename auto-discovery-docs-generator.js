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
      architecture: {},
      environment: {} // 🔥 NEW: Environment variables
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
    
    // 🔥 NEW: Enhanced discovery methods
    await this.discoverDatabaseSchema();
    await this.discoverEnvironmentVariables();
    await this.discoverDeploymentConfiguration();
    
    this.generateIntroduction();
    this.generateQuickStart();
    this.generateDevelopmentSetup();
    this.generateAPIDocumentation();
    this.generateAuthenticationDocs();
    this.generateComponentDocs();
    this.generateArchitectureDocs();
    this.generateDeploymentDocs();
    
    // 🔥 NEW: Enhanced documentation
    this.generateDatabaseDocumentation();
    this.generateEnvironmentDocumentation();
    this.generateConfigurationDocumentation();
    
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
      'frontend/shared',
      'frontend/shared/components',
      'frontend/shared/hooks',
      'frontend/shared/ui',
      'frontend/web-app/src/components',
      'frontend/web-app/src/features',
      'frontend/web-app/src/features/setup',
      'frontend/web-app/src/features/setup/steps'
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
    const hasGithubActions = fs.existsSync(path.join(this.rootPath, '.github/workflows'));
    const hasAmplify = fs.existsSync(path.join(this.rootPath, 'amplify.yml'));
    const hasFrontend = fs.existsSync(path.join(this.rootPath, 'frontend'));
    const hasBackend = fs.existsSync(path.join(this.rootPath, 'backend'));
    
    // Check if GitHub Actions is being used for deployment
    if (hasGithubActions) {
      try {
        const workflowFiles = fs.readdirSync(path.join(this.rootPath, '.github/workflows'));
        const hasDeploymentWorkflow = workflowFiles.some(file => 
          file.includes('deploy') || file.includes('deployment')
        );
        if (hasDeploymentWorkflow) {
          return 'GitHub Actions Deployment';
        }
      } catch (error) {
        // Error reading workflows
      }
    }
    
    if (hasAmplify && hasFrontend && hasBackend) return 'AWS Amplify Fullstack';
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

  // 🔥 NEW: DATABASE SCHEMA DISCOVERY METHODS
  async discoverDatabaseSchema() {
    console.log('🗄️  Auto-discovering database schema...');
    
    try {
      // Find database connection and schema files
      const dbFiles = this.findDatabaseFiles();
      const schemaFiles = this.findSchemaFiles();
      const migrationFiles = this.findMigrationFiles();
      
      // Extract database configuration
      const dbConfig = this.extractDatabaseConfig();
      
      // Parse schema from files
      const tables = this.extractTables(schemaFiles, migrationFiles);
      const relationships = this.extractRelationships(schemaFiles);
      
      // Get Lambda environment variables
      const lambdaEnvVars = await this.extractLambdaEnvVars();
      
      this.discovered.database = {
        ...this.discovered.database, // Keep existing detection
        connectionFiles: dbFiles,
        schemaFiles: schemaFiles,
        migrationFiles: migrationFiles,
        configuration: dbConfig,
        tables: tables,
        relationships: relationships,
        lambdaEnvironment: lambdaEnvVars
      };
      
      console.log(`   ✅ Found ${tables.length} tables, ${relationships.length} relationships`);
    } catch (error) {
      console.warn('   ⚠️  Database schema discovery failed:', error.message);
    }
  }

  findDatabaseFiles() {
    const dbPatterns = [
      /database|db|connection/i,
      /postgres|pg|mysql|mongo/i
    ];
    
    const searchPaths = [
      'backend/database',
      'backend/functions/api/database',
      'backend/functions/api/db',
      'backend/functions/api',
      'backend/shared',
      'database',
      'db'
    ];
    
    const dbFiles = [];
    searchPaths.forEach(searchPath => {
      const fullPath = path.join(this.rootPath, searchPath);
      if (fs.existsSync(fullPath)) {
        dbPatterns.forEach(pattern => {
          const files = this.findFilesRecursive(fullPath, pattern);
          dbFiles.push(...files);
        });
      }
    });
    
    return dbFiles;
  }

  findSchemaFiles() {
    const schemaPatterns = [
      /schema\.sql$/i,
      /create.*\.sql$/i,
      /tables.*\.sql$/i,
      /schema\.js$/i,
      /models.*\.js$/i,
      /queries\.js$/i,
      /migration.*\.sql$/i
    ];
    
    const searchPaths = [
      'backend/database',
      'backend/functions/api/database',
      'backend/functions/api',
      'database',
      'migrations',
      'schema'
    ];
    
    const schemaFiles = [];
    searchPaths.forEach(searchPath => {
      const fullPath = path.join(this.rootPath, searchPath);
      if (fs.existsSync(fullPath)) {
        schemaPatterns.forEach(pattern => {
          const files = this.findFilesRecursive(fullPath, pattern);
          schemaFiles.push(...files);
        });
      }
    });
    
    return schemaFiles;
  }

  findMigrationFiles() {
    const migrationPaths = [
      'backend/database/migrations',
      'backend/functions/api/database/migrations',
      'backend/migrations',
      'migrations',
      'database/migrations',
      'db/migrations'
    ];
    
    const migrationFiles = [];
    migrationPaths.forEach(migPath => {
      const fullPath = path.join(this.rootPath, migPath);
      if (fs.existsSync(fullPath)) {
        const files = this.findFilesRecursive(fullPath, /\.(sql|js)$/i);
        migrationFiles.push(...files);
      }
    });
    
    return migrationFiles;
  }

  extractDatabaseConfig() {
    const configFiles = [
      'backend/database/connection.js',
      'backend/functions/api/database/connection.js',
      'backend/functions/api/db/config.js',
      'backend/functions/api/.env',
      'backend/database/config.js',
      'backend/database/queries.js',
      'backend/functions/api/database/queries.js',
      '.env'
    ];
    
    const config = {};
    
    for (const configFile of configFiles) {
      const fullPath = path.join(this.rootPath, configFile);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          if (configFile.endsWith('.env')) {
            const envVars = this.parseEnvFile(content);
            config.environment = envVars;
          } else if (configFile.endsWith('.js')) {
            // Extract database connection details from JS files
            const dbDetails = this.extractDbDetailsFromJs(content);
            config.connection = dbDetails;
          }
        } catch (error) {
          console.warn(`Could not read ${configFile}:`, error.message);
        }
      }
    }
    
    return config;
  }

  extractDbDetailsFromJs(content) {
    const details = {};
    
    // Extract host
    const hostMatch = content.match(/host['"]?\s*:\s*['"]([^'"]+)['"]/i);
    if (hostMatch) details.host = hostMatch[1];
    
    // Extract database name
    const dbMatch = content.match(/database['"]?\s*:\s*['"]([^'"]+)['"]/i);
    if (dbMatch) details.database = dbMatch[1];
    
    // Extract port
    const portMatch = content.match(/port['"]?\s*:\s*['"]?(\d+)['"]?/i);
    if (portMatch) details.port = portMatch[1];
    
    return details;
  }

  extractTables(schemaFiles, migrationFiles) {
    const tables = [];
    const allFiles = [...schemaFiles, ...migrationFiles];
    
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, file), 'utf8');
        const fileTables = this.parseTablesFromSql(content);
        tables.push(...fileTables);
      } catch (error) {
        console.warn(`Could not parse ${file}:`, error.message);
      }
    }
    
    // Remove duplicates and merge
    return this.mergeTableDefinitions(tables);
  }

  parseTablesFromSql(content) {
    const tables = [];
    
    // Match CREATE TABLE statements
    const tableMatches = content.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(([\s\S]*?)\);/gi);
    
    if (tableMatches) {
      tableMatches.forEach(match => {
        const tableNameMatch = match.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/i);
        const columnsMatch = match.match(/\(([\s\S]*?)\);/);
        
        if (tableNameMatch && columnsMatch) {
          const tableName = tableNameMatch[1].replace(/[`"']/g, '');
          const columns = this.parseColumns(columnsMatch[1]);
          
          tables.push({
            name: tableName,
            columns: columns,
            primaryKey: columns.find(col => col.isPrimaryKey)?.name,
            foreignKeys: columns.filter(col => col.isForeignKey)
          });
        }
      });
    }
    
    return tables;
  }

  parseColumns(columnsText) {
    const columns = [];
    const lines = columnsText.split(',').map(line => line.trim());
    
    lines.forEach(line => {
      if (line && !line.startsWith('CONSTRAINT') && !line.startsWith('PRIMARY KEY') && !line.startsWith('FOREIGN KEY')) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const column = {
            name: parts[0].replace(/[`"']/g, ''),
            type: parts[1],
            nullable: !line.toUpperCase().includes('NOT NULL'),
            isPrimaryKey: line.toUpperCase().includes('PRIMARY KEY'),
            isForeignKey: line.toUpperCase().includes('REFERENCES'),
            defaultValue: this.extractDefault(line)
          };
          
          if (column.isForeignKey) {
            const refMatch = line.match(/REFERENCES\s+([^\s(]+)/i);
            if (refMatch) {
              column.references = refMatch[1].replace(/[`"']/g, '');
            }
          }
          
          columns.push(column);
        }
      }
    });
    
    return columns;
  }

  extractDefault(line) {
    const defaultMatch = line.match(/DEFAULT\s+([^,\s]+)/i);
    return defaultMatch ? defaultMatch[1].replace(/['"]/g, '') : null;
  }

  mergeTableDefinitions(tables) {
    const merged = {};
    
    tables.forEach(table => {
      if (!merged[table.name]) {
        merged[table.name] = table;
      } else {
        // Merge columns if table appears multiple times
        const existingColumns = merged[table.name].columns.map(col => col.name);
        table.columns.forEach(col => {
          if (!existingColumns.includes(col.name)) {
            merged[table.name].columns.push(col);
          }
        });
      }
    });
    
    return Object.values(merged);
  }

  extractRelationships(schemaFiles) {
    const relationships = [];
    
    schemaFiles.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, file), 'utf8');
        const fileRelationships = this.parseRelationships(content);
        relationships.push(...fileRelationships);
      } catch (error) {
        // File read error
      }
    });
    
    return relationships;
  }

  parseRelationships(content) {
    const relationships = [];
    
    // Parse FOREIGN KEY constraints
    const fkMatches = content.match(/FOREIGN\s+KEY\s*\([^)]+\)\s+REFERENCES\s+([^\s(]+)\s*\([^)]+\)/gi);
    
    if (fkMatches) {
      fkMatches.forEach(match => {
        const refMatch = match.match(/REFERENCES\s+([^\s(]+)/i);
        if (refMatch) {
          relationships.push({
            type: 'foreign_key',
            references: refMatch[1].replace(/[`"']/g, '')
          });
        }
      });
    }
    
    return relationships;
  }

  // 🔥 NEW: ENHANCED ENVIRONMENT VARIABLES DISCOVERY
  async discoverEnvironmentVariables() {
    console.log('🔧 Auto-discovering environment variables...');
    
    try {
      // Local environment files
      const localEnvVars = this.extractLocalEnvVars();
      
      // Lambda environment variables
      const lambdaEnvVars = await this.extractLambdaEnvVars();
      
      // GitHub Actions secrets
      const githubSecrets = this.extractGithubSecrets();
      
      // Required variables from code
      const requiredVars = this.extractRequiredEnvVars();
      
      // AWS configuration
      const awsConfig = await this.extractAWSConfig();
      
      this.discovered.environment = {
        local: localEnvVars,
        lambda: lambdaEnvVars,
        github: githubSecrets,
        required: requiredVars,
        aws: awsConfig
      };
      
      const totalVars = Object.keys(localEnvVars).length + Object.keys(lambdaEnvVars).length;
      console.log(`   ✅ Found ${totalVars} environment variables`);
    } catch (error) {
      console.warn('   ⚠️  Environment discovery failed:', error.message);
    }
  }

  extractLocalEnvVars() {
    const envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      'backend/functions/api/.env',
      'frontend/web-app/.env.development'
    ];
    
    const allEnvVars = {};
    
    for (const envFile of envFiles) {
      const fullPath = path.join(this.rootPath, envFile);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const vars = this.parseEnvFile(content);
          allEnvVars[envFile] = vars;
        } catch (error) {
          console.warn(`Could not read ${envFile}:`, error.message);
        }
      }
    }
    
    return allEnvVars;
  }

  parseEnvFile(content) {
    const vars = {};
    const lines = content.split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=').trim();
          // Remove surrounding quotes
          value = value.replace(/^["']|["']$/g, '');
          vars[key.trim()] = value;
        }
      }
    });
    
    return vars;
  }

  async extractLambdaEnvVars() {
    try {
      const { execSync } = require('child_process');
      const output = execSync('aws lambda get-function-configuration --function-name health-platform-dev --query "Environment.Variables"', { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (error) {
      console.warn('Could not fetch Lambda environment variables:', error.message);
      return {};
    }
  }

  extractGithubSecrets() {
    // Parse from workflow files to see what secrets are expected
    const workflowFiles = this.findFilesRecursive(path.join(this.rootPath, '.github/workflows'), /\.ya?ml$/);
    const secrets = new Set();
    
    for (const workflowFile of workflowFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, workflowFile), 'utf8');
        const secretMatches = content.match(/\$\{\{\s*secrets\.([A-Z_]+)\s*\}\}/g);
        
        if (secretMatches) {
          secretMatches.forEach(match => {
            const secretName = match.match(/secrets\.([A-Z_]+)/)[1];
            secrets.add(secretName);
          });
        }
      } catch (error) {
        // File read error
      }
    }
    
    return Array.from(secrets);
  }

  extractRequiredEnvVars() {
    // Scan code files for process.env usage
    const codeFiles = [
      ...this.findFilesRecursive(path.join(this.rootPath, 'backend'), /\.js$/),
      ...this.findFilesRecursive(path.join(this.rootPath, 'frontend'), /\.jsx?$/)
    ];
    
    const requiredVars = new Set();
    
    for (const codeFile of codeFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, codeFile), 'utf8');
        const envMatches = content.match(/process\.env\.([A-Z_]+)/g);
        
        if (envMatches) {
          envMatches.forEach(match => {
            const varName = match.replace('process.env.', '');
            requiredVars.add(varName);
          });
        }
      } catch (error) {
        // File read error
      }
    }
    
    return Array.from(requiredVars);
  }

  async extractAWSConfig() {
    const awsConfig = {};
    
    try {
      const { execSync } = require('child_process');
      
      // Get Lambda function details
      const lambdaOutput = execSync('aws lambda list-functions --query "Functions[?contains(FunctionName, `health-platform`)]"', { encoding: 'utf8' });
      awsConfig.lambdaFunctions = JSON.parse(lambdaOutput);
      
      // Get API Gateway details (if accessible)
      try {
        const apiOutput = execSync('aws apigateway get-rest-apis --query "items[?name==`health-platform-api`]"', { encoding: 'utf8' });
        awsConfig.apiGateways = JSON.parse(apiOutput);
      } catch (apiError) {
        awsConfig.apiGateways = [];
      }
      
    } catch (error) {
      console.warn('Could not fetch AWS configuration:', error.message);
    }
    
    return awsConfig;
  }

  // 🔥 NEW: ENHANCED DEPLOYMENT CONFIGURATION DISCOVERY
  async discoverDeploymentConfiguration() {
    console.log('🚀 Auto-discovering deployment configuration...');
    
    try {
      // GitHub Actions workflows
      const workflows = this.extractWorkflowDetails();
      
      // AWS resources
      const awsResources = await this.extractAWSResources();
      
      // Package.json deploy scripts
      const deployScripts = this.extractDeployScripts();
      
      // Environment-specific configurations
      const envConfigs = this.extractEnvironmentConfigs();
      
      this.discovered.deployment = {
        ...this.discovered.deployment, // Keep existing
        workflows: workflows,
        awsResources: awsResources,
        scripts: deployScripts,
        environments: envConfigs
      };
      
      console.log(`   ✅ Found ${workflows.length} workflows, ${Object.keys(awsResources).length} AWS resources`);
    } catch (error) {
      console.warn('   ⚠️  Deployment discovery failed:', error.message);
    }
  }

  extractWorkflowDetails() {
    const workflowDir = path.join(this.rootPath, '.github/workflows');
    if (!fs.existsSync(workflowDir)) return [];
    
    const workflows = [];
    const workflowFiles = fs.readdirSync(workflowDir).filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
    
    for (const file of workflowFiles) {
      try {
        const content = fs.readFileSync(path.join(workflowDir, file), 'utf8');
        const workflow = this.parseWorkflowFile(content);
        workflow.filename = file;
        workflows.push(workflow);
      } catch (error) {
        console.warn(`Could not parse workflow ${file}:`, error.message);
      }
    }
    
    return workflows;
  }

  parseWorkflowFile(content) {
    const workflow = {
      name: null,
      triggers: [],
      jobs: [],
      secrets: [],
      awsActions: []
    };
    
    // Extract workflow name
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    if (nameMatch) workflow.name = nameMatch[1].trim();
    
    // Extract triggers
    const onMatch = content.match(/^on:\s*([\s\S]*?)^(?=\w)/m);
    if (onMatch) {
      workflow.triggers = this.parseTriggers(onMatch[1]);
    }
    
    // Extract job names
    const jobMatches = content.match(/^\s+([a-zA-Z0-9_-]+):\s*$/gm);
    if (jobMatches) {
      workflow.jobs = jobMatches.map(match => match.trim().replace(':', ''));
    }
    
    // Extract secrets usage
    const secretMatches = content.match(/\$\{\{\s*secrets\.([A-Z_]+)\s*\}\}/g);
    if (secretMatches) {
      workflow.secrets = [...new Set(secretMatches.map(match => match.match(/secrets\.([A-Z_]+)/)[1]))];
    }
    
    // Check for AWS actions
    if (content.includes('aws-actions') || content.includes('aws lambda') || content.includes('aws apigateway')) {
      workflow.awsActions = this.extractAWSActions(content);
    }
    
    return workflow;
  }

  parseTriggers(triggerText) {
    const triggers = [];
    
    if (triggerText.includes('push:')) triggers.push('push');
    if (triggerText.includes('pull_request:')) triggers.push('pull_request');
    if (triggerText.includes('workflow_dispatch:')) triggers.push('manual');
    if (triggerText.includes('schedule:')) triggers.push('scheduled');
    
    return triggers;
  }

  extractAWSActions(content) {
    const actions = [];
    
    if (content.includes('aws lambda update-function-code')) actions.push('Lambda Deployment');
    if (content.includes('aws apigateway create-deployment')) actions.push('API Gateway Deployment');
    if (content.includes('aws-actions/configure-aws-credentials')) actions.push('AWS Authentication');
    
    return actions;
  }

  async extractAWSResources() {
    const resources = {};
    
    try {
      const { execSync } = require('child_process');
      
      // Lambda functions
      const lambdaOutput = execSync('aws lambda list-functions --query "Functions[?contains(FunctionName, `health-platform`)].[FunctionName,Runtime,LastModified]"', { encoding: 'utf8' });
      resources.lambda = JSON.parse(lambdaOutput);
      
      // API Gateways
      try {
        const apiOutput = execSync('aws apigateway get-rest-apis --query "items[?contains(name, `health-platform`)].[name,id,createdDate]"', { encoding: 'utf8' });
        resources.apiGateway = JSON.parse(apiOutput);
      } catch (error) {
        resources.apiGateway = [];
      }
      
    } catch (error) {
      console.warn('Could not fetch AWS resources:', error.message);
    }
    
    return resources;
  }

  extractDeployScripts() {
    const scripts = {};
    const packageFiles = this.discovered.architecture.packages;
    
    packageFiles.forEach(pkg => {
      const deployRelatedScripts = pkg.scripts.filter(script => 
        script.includes('deploy') || script.includes('build') || script.includes('start')
      );
      
      if (deployRelatedScripts.length > 0) {
        scripts[pkg.name] = deployRelatedScripts;
      }
    });
    
    return scripts;
  }

  extractEnvironmentConfigs() {
    const configs = {};
    
    // Check for different environment configurations
    const envTypes = ['development', 'staging', 'production'];
    
    envTypes.forEach(env => {
      const envFile = `.env.${env}`;
      if (fs.existsSync(path.join(this.rootPath, envFile))) {
        configs[env] = {
          configFile: envFile,
          hasConfig: true
        };
      }
    });
    
    return configs;
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
- **Database:** ${this.discovered.architecture.database?.type || 'Unknown'} (${this.discovered.database.tables?.length || 0} tables)
- **Authentication:** ${authStatus}
- **Working APIs:** ${workingAPIs}/${this.discovered.apis.length}
- **Environment Variables:** ${Object.keys(this.discovered.environment.lambda || {}).length} Lambda, ${Object.keys(this.discovered.environment.local || {}).length} Local

## Quick Start

1. **[Development Setup](./development/setup)**
2. **[API Documentation](./api/overview)**
3. **[Database Schema](./database/schema)**
4. **[Environment Configuration](./configuration/environment)**

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
    
    if (this.discovered.database.tables && this.discovered.database.tables.length > 0) {
      features.push(`- ✅ **${this.discovered.database.tables.length} Database Tables**`);
    }
    
    if (this.discovered.deployment.workflows && this.discovered.deployment.workflows.length > 0) {
      features.push(`- ✅ **${this.discovered.deployment.workflows.length} Deployment Workflows**`);
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
${this.discovered.database.type === 'PostgreSQL' ? '- PostgreSQL database' : ''}

## Installation

\`\`\`bash
# Clone the repository
git clone ${this.repositoryUrl}.git
cd health-platform

# Install dependencies
${this.generateInstallationSteps()}

# Configure environment variables
${this.generateEnvironmentSetup()}

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
2. **[Configure Database](./database/schema)** - Set up database connection
3. **[Set Environment Variables](./configuration/environment)** - Configure credentials
4. **[Browse Components](./components/overview)** - Use shared components
5. **[Understand Architecture](./architecture/overview)** - System design

## Development URLs

- **Frontend:** http://localhost:5173 (Vite dev server)
- **API:** ${this.baseURL}
- **Documentation:** This site

---

*Installation verified on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('quick-start.md', quickStart);
  }

  generateEnvironmentSetup() {
    const requiredVars = this.discovered.environment.required || [];
    if (requiredVars.length === 0) return 'No environment variables required';
    
    return `# Copy and configure environment variables
cp .env.example .env.development

# Required variables:
${requiredVars.map(varName => `# ${varName}=your_value_here`).join('\n')}`;
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
${this.discovered.database.type === 'PostgreSQL' ? '- PostgreSQL database' : ''}

## Clone Repository

\`\`\`bash
git clone ${this.repositoryUrl}.git
cd health-platform
\`\`\`

## Install Dependencies

${this.generateInstallationSteps()}

## Environment Configuration

${this.generateEnvironmentDocs()}

## Database Setup

${this.generateDatabaseSetupDocs()}

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
- **Database connection failed:** Verify database credentials and server is running
- **Build errors:** Clear node_modules and reinstall dependencies

### Getting Help

- Check the [API Documentation](../api/overview) for endpoint details
- Review [Database Schema](../database/schema) for database structure
- Examine [Environment Configuration](../configuration/environment) for setup details
- Review [Architecture Overview](../architecture/overview) for system understanding

---

*Development setup guide auto-generated on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('development/setup.md', setupDoc);
  }

  generateDatabaseSetupDocs() {
    if (!this.discovered.database.tables || this.discovered.database.tables.length === 0) {
      return 'No database setup required - schema not detected.';
    }
    
    return `### Database Configuration

1. **Install PostgreSQL** (if not already installed)
2. **Create database:**
   \`\`\`sql
   CREATE DATABASE health_platform_dev;
   \`\`\`

3. **Configure environment variables:**
   \`\`\`bash
   DB_HOST=localhost
   DB_NAME=health_platform_dev
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_PORT=5432
   \`\`\`

4. **Run migrations** (if available):
   \`\`\`bash
   npm run migrate
   \`\`\``;
  }

  generateEnvironmentDocs() {
    const localEnvFiles = Object.keys(this.discovered.environment.local || {});
    const requiredVars = this.discovered.environment.required || [];
    
    if (localEnvFiles.length === 0 && requiredVars.length === 0) {
      return 'No environment configuration detected.';
    }
    
    let docs = '';
    
    if (localEnvFiles.length > 0) {
      docs += `**Environment Files Found:**\n`;
      localEnvFiles.forEach(file => {
        docs += `- \`${file}\`\n`;
      });
      docs += `\n`;
    }
    
    if (requiredVars.length > 0) {
      docs += `**Required Variables:**\n`;
      requiredVars.forEach(varName => {
        docs += `- \`${varName}\`\n`;
      });
      docs += `\n`;
    }
    
    docs += `Configure your environment variables before starting development.`;
    
    return docs;
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
    
    if (steps.length === 0) {
      return 'npm install';
    }
    
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
sidebar_position: 4
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
sidebar_position: 5
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
sidebar_position: 6
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
sidebar_position: 7
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

### Database
${this.discovered.database.tables ? `
- **Type:** ${this.discovered.database.type}
- **Tables:** ${this.discovered.database.tables.length}
- **Schema Files:** ${this.discovered.database.schemaFiles.length}
- **Migration Files:** ${this.discovered.database.migrationFiles.length}
` : 'Database architecture not detected'}

## Project Structure

\`\`\`
health-platform/
├── frontend/
│   ├── shared/           # Component library
│   └── web-app/          # Main React application
├── backend/
│   └── functions/api/    # API backend
├── database/             # Database schema and migrations
└── docs/                 # Documentation (this site)
\`\`\`

## Package Management

${this.discovered.architecture.packages.map(pkg => 
  `### ${pkg.name} (\`${pkg.path}\`)\n\n**Type:** ${pkg.type}\n**Dependencies:** ${pkg.dependencies.length}\n**Scripts:** ${pkg.scripts.join(', ')}\n`
).join('\n')}

## Deployment

**Strategy:** ${this.discovered.deployment.type}
${this.discovered.deployment.config ? `**Configuration:** \`${this.discovered.deployment.config}\`` : ''}

${this.discovered.deployment.workflows ? `
**Workflows:** ${this.discovered.deployment.workflows.length}
${this.discovered.deployment.workflows.map(wf => `- ${wf.name || wf.filename}`).join('\n')}
` : ''}

---

*Architecture documentation auto-generated on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('architecture/overview.md', archDoc);
  }

  generateDeploymentDocs() {
    const deployDoc = `---
title: Deployment Guide
sidebar_position: 8
---

# Deployment Guide

How to deploy the FILO Health Platform.

## Deployment Strategy

**Current:** ${this.discovered.deployment.type}

${this.generateDeploymentInstructions()}

## Environment Configuration

${this.generateEnvironmentDocs()}

## GitHub Actions Workflows

${this.discovered.deployment.workflows ? `
${this.discovered.deployment.workflows.map(workflow => `
### ${workflow.name || workflow.filename}

**Triggers:** ${workflow.triggers.join(', ')}
**Jobs:** ${workflow.jobs.join(', ')}
**AWS Actions:** ${workflow.awsActions.join(', ')}
**Secrets Used:** ${workflow.secrets.join(', ')}
`).join('\n')}
` : 'No GitHub Actions workflows detected.'}

## AWS Resources

${this.discovered.deployment.awsResources ? `
### Lambda Functions
${this.discovered.deployment.awsResources.lambda?.map(func => `- **${func[0]}** (${func[1]})`).join('\n') || 'None found'}

### API Gateways  
${this.discovered.deployment.awsResources.apiGateway?.map(api => `- **${api[0]}** (${api[1]})`).join('\n') || 'None found'}
` : 'No AWS resources discovered.'}

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

Check \`.github/workflows/\` for configuration.

**Required Secrets:**
${this.discovered.environment.github.map(secret => `- \`${secret}\``).join('\n')}`;
      
      default:
        return 'Deployment configuration not detected. Manual deployment may be required.';
    }
  }

  // 🔥 NEW: Generate comprehensive database documentation
  generateDatabaseDocumentation() {
    if (!this.discovered.database.tables || this.discovered.database.tables.length === 0) {
      return; // Skip if no database schema found
    }
    
    const dbDoc = `---
title: Database Schema
sidebar_position: 9
---

# Database Schema

Complete database schema documentation auto-discovered from implementation.

## Overview

- **Database Type:** ${this.discovered.database.type}
- **Tables:** ${this.discovered.database.tables.length}
- **Schema Files:** ${this.discovered.database.schemaFiles.length}
- **Migration Files:** ${this.discovered.database.migrationFiles.length}

## Connection Configuration

${this.discovered.database.configuration ? `
### Environment Variables
${Object.keys(this.discovered.database.lambdaEnvironment || {}).filter(key => key.startsWith('DB_')).map(key => `- \`${key}\`: ${this.discovered.database.lambdaEnvironment[key]}`).join('\n')}

### Connection Details
${this.discovered.database.configuration.connection ? `
- **Host:** ${this.discovered.database.configuration.connection.host || 'Not specified'}
- **Database:** ${this.discovered.database.configuration.connection.database || 'Not specified'}
- **Port:** ${this.discovered.database.configuration.connection.port || 'Not specified'}
` : 'No connection configuration found.'}

### Connection Files
${this.discovered.database.connectionFiles.map(file => `- \`${file}\``).join('\n')}
` : 'No connection configuration discovered.'}

## Database Tables

${this.discovered.database.tables.map(table => `
### ${table.name}

${table.columns.length > 0 ? `
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
${table.columns.map(col => {
  const notes = [];
  if (col.isPrimaryKey) notes.push('Primary Key');
  if (col.isForeignKey) notes.push(`FK → ${col.references}`);
  
  return `| ${col.name} | ${col.type} | ${col.nullable ? 'Yes' : 'No'} | ${col.defaultValue || '-'} | ${notes.join(', ')} |`;
}).join('\n')}
` : 'No columns detected.'}

${table.primaryKey ? `**Primary Key:** ${table.primaryKey}` : ''}
${table.foreignKeys.length > 0 ? `**Foreign Keys:** ${table.foreignKeys.map(fk => `${fk.name} → ${fk.references}`).join(', ')}` : ''}
`).join('\n')}

## Schema Files

${this.discovered.database.schemaFiles.length > 0 ? `
${this.discovered.database.schemaFiles.map(file => `- \`${file}\``).join('\n')}
` : 'No schema files found.'}

## Migration Files

${this.discovered.database.migrationFiles.length > 0 ? `
${this.discovered.database.migrationFiles.map(file => `- \`${file}\``).join('\n')}
` : 'No migration files found.'}

## Relationships

${this.discovered.database.relationships.length > 0 ? `
${this.discovered.database.relationships.map(rel => `- ${rel.type}: ${rel.references}`).join('\n')}
` : 'No relationships detected.'}

---

*Database documentation auto-generated on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('database/schema.md', dbDoc);
  }

  // 🔥 NEW: Generate comprehensive environment documentation
  generateEnvironmentDocumentation() {
    const envDoc = `---
title: Environment Configuration
sidebar_position: 10
---

# Environment Configuration

Complete environment variable documentation auto-discovered from implementation.

## Overview

- **Local Environment Files:** ${Object.keys(this.discovered.environment.local || {}).length}
- **Lambda Environment Variables:** ${Object.keys(this.discovered.environment.lambda || {}).length}
- **GitHub Secrets:** ${this.discovered.environment.github?.length || 0}
- **Required Variables:** ${this.discovered.environment.required?.length || 0}

## Required Variables

${this.discovered.environment.required?.length > 0 ? `
These variables are required for the application to function properly:

${this.discovered.environment.required.map(varName => `- \`${varName}\``).join('\n')}
` : 'No required variables detected from code analysis.'}

## Local Environment Files

${Object.keys(this.discovered.environment.local || {}).length > 0 ? `
${Object.keys(this.discovered.environment.local).map(file => `
### ${file}

${Object.keys(this.discovered.environment.local[file]).map(key => `- \`${key}\`: ${this.discovered.environment.local[file][key]}`).join('\n')}
`).join('\n')}
` : 'No local environment files found.'}

## Lambda Environment Variables

${Object.keys(this.discovered.environment.lambda || {}).length > 0 ? `
These variables are currently configured in the Lambda function:

${Object.keys(this.discovered.environment.lambda).map(key => `- \`${key}\`: ${key.includes('SECRET') || key.includes('PASSWORD') ? '[HIDDEN]' : this.discovered.environment.lambda[key]}`).join('\n')}
` : 'No Lambda environment variables found.'}

## GitHub Secrets

${this.discovered.environment.github?.length > 0 ? `
These secrets are used in GitHub Actions workflows:

${this.discovered.environment.github.map(secret => `- \`${secret}\``).join('\n')}
` : 'No GitHub secrets detected.'}

## Setup Instructions

### Local Development
1. Copy environment template:
   \`\`\`bash
   cp .env.example .env.development
   \`\`\`

2. Configure required variables:
${this.discovered.environment.required?.map(varName => `   - \`${varName}\``).join('\n') || '   No required variables detected'}

### Lambda Deployment
Environment variables are automatically configured via GitHub Actions.

### GitHub Repository Setup
Add these secrets to your GitHub repository:
${this.discovered.environment.github?.map(secret => `- \`${secret}\``).join('\n') || 'No secrets required'}

## AWS Resources

${this.discovered.environment.aws && Object.keys(this.discovered.environment.aws).length > 0 ? `
### Lambda Functions
${this.discovered.environment.aws.lambdaFunctions?.map(func => `- **${func.FunctionName}** (${func.Runtime})`).join('\n') || 'None found'}

### API Gateways
${this.discovered.environment.aws.apiGateways?.map(api => `- **${api.name}** (${api.id})`).join('\n') || 'None found'}
` : 'No AWS resource information available.'}

---

*Environment documentation auto-generated on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('configuration/environment.md', envDoc);
  }

  // 🔥 NEW: Generate comprehensive configuration documentation
  generateConfigurationDocumentation() {
    const configDoc = `---
title: Deployment Configuration
sidebar_position: 11
---

# Deployment Configuration

Complete deployment configuration auto-discovered from implementation.

## GitHub Actions Workflows

${this.discovered.deployment.workflows?.length > 0 ? `
${this.discovered.deployment.workflows.map(workflow => `
### ${workflow.name || workflow.filename}

**File:** \`${workflow.filename}\`
**Triggers:** ${workflow.triggers.join(', ')}
**Jobs:** ${workflow.jobs.join(', ')}
**AWS Actions:** ${workflow.awsActions.join(', ')}
**Secrets Used:** ${workflow.secrets.join(', ')}
`).join('\n')}
` : 'No GitHub Actions workflows found.'}

## AWS Resources

${this.discovered.deployment.awsResources && Object.keys(this.discovered.deployment.awsResources).length > 0 ? `
### Lambda Functions
${this.discovered.deployment.awsResources.lambda?.map(func => `- **${func[0]}** (${func[1]}) - Last Modified: ${func[2]}`).join('\n') || 'None found'}

### API Gateways  
${this.discovered.deployment.awsResources.apiGateway?.map(api => `- **${api[0]}** (${api[1]}) - Created: ${api[2]}`).join('\n') || 'None found'}
` : 'No AWS resources discovered.'}

## Deployment Scripts

${this.discovered.deployment.scripts && Object.keys(this.discovered.deployment.scripts).length > 0 ? `
${Object.keys(this.discovered.deployment.scripts).map(pkg => `
### ${pkg}
${this.discovered.deployment.scripts[pkg].map(script => `- \`${script}\``).join('\n')}
`).join('\n')}
` : 'No deployment scripts found.'}

## Environment Configurations

${this.discovered.deployment.environments && Object.keys(this.discovered.deployment.environments).length > 0 ? `
${Object.keys(this.discovered.deployment.environments).map(env => `
### ${env}
- Configuration file: \`${this.discovered.deployment.environments[env].configFile}\`
- Status: ${this.discovered.deployment.environments[env].hasConfig ? '✅ Configured' : '❌ Not configured'}
`).join('\n')}
` : 'No environment-specific configurations found.'}

## Deployment Process

### Manual Deployment
\`\`\`bash
# Backend (Lambda)
cd backend/functions/api
npm install
zip -r deploy.zip .
aws lambda update-function-code --function-name health-platform-dev --zip-file fileb://deploy.zip

# Frontend (if applicable)
cd frontend/web-app
npm run build
npm run deploy
\`\`\`

### Automated Deployment
${this.discovered.deployment.type === 'GitHub Actions' ? `
Deployment happens automatically when you push to the main branch.

**Required Setup:**
1. Add AWS credentials to GitHub Secrets
2. Configure environment variables
3. Push changes to trigger deployment
` : 'No automated deployment configured.'}

---

*Configuration documentation auto-generated on ${new Date().toLocaleDateString()}*
`;

    this.writeDocFile('configuration/deployment.md', configDoc);
  }

  // 🔥 UPDATED: Generate enhanced sidebar
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
      }
    ];

    if (this.discovered.auth.implemented) {
      sidebarItems.push({
        type: 'category',
        label: 'Authentication',
        items: ['authentication/overview']
      });
    }

    sidebarItems.push({
      type: 'category', 
      label: 'Components',
      items: ['components/overview']
    });

    sidebarItems.push({
      type: 'category',
      label: 'Architecture',
      items: ['architecture/overview']
    });

    // 🔥 NEW: Database and Configuration sections
    if (this.discovered.database.tables && this.discovered.database.tables.length > 0) {
      sidebarItems.push({
        type: 'category',
        label: 'Database',
        items: ['database/schema']
      });
    }

    sidebarItems.push({
      type: 'category',
      label: 'Configuration',
      items: ['configuration/environment', 'configuration/deployment']
    });

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