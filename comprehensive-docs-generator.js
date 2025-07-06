#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class AutomatedProfessionalDocsGenerator {
  constructor(rootPath = process.cwd()) {
    this.rootPath = rootPath;
    this.discoveredInfo = {
      urls: {},
      architecture: {},
      database: {},
      apis: {},
      deployment: {},
      development: {},
      fileStructure: {},
      packages: {},
      git: {}
    };
  }

  async generateProfessionalDocs() {
    console.log('🚀 Generating Professional Documentation (Fully Automated)...\n');
    
    // Run all discovery in parallel
    await Promise.all([
      this.discoverProjectStructure(),
      this.discoverDeploymentInfo(),
      this.discoverDatabaseInfo(),
      this.discoverGitInfo(),
      this.discoverPackageInfo(),
      this.discoverAPIEndpoints(),
      this.discoverDevelopmentSetup()
    ]);

    // Generate professional documentation site
    await this.generateProfessionalSite();
    
    console.log('✅ Professional documentation generated successfully!');
    this.printSummary();
  }

  async discoverProjectStructure() {
    console.log('📁 Discovering project structure...');
    
    const structure = {
      frontend: {},
      backend: {},
      shared: {},
      configs: {},
      docs: {}
    };

    // Auto-discover frontend structure
    const frontendPaths = [
      'frontend/web-app',
      'frontend/shared',
      'src',
      'client'
    ];

    for (const fePath of frontendPaths) {
      const fullPath = path.join(this.rootPath, fePath);
      if (fs.existsSync(fullPath)) {
        structure.frontend[fePath] = await this.analyzeDirectory(fullPath);
      }
    }

    // Auto-discover backend structure
    const backendPaths = [
      'backend/functions/api',
      'backend/functions',
      'backend',
      'server',
      'api'
    ];

    for (const bePath of backendPaths) {
      const fullPath = path.join(this.rootPath, bePath);
      if (fs.existsSync(fullPath)) {
        structure.backend[bePath] = await this.analyzeDirectory(fullPath);
      }
    }

    // Auto-discover config files
    const configFiles = [
      'package.json',
      'vite.config.js',
      'tailwind.config.js',
      '.env*',
      'serverless.yml',
      'docker-compose.yml',
      'amplify.yml'
    ];

    for (const configPattern of configFiles) {
      const matches = this.findFiles(this.rootPath, configPattern);
      if (matches.length > 0) {
        structure.configs[configPattern] = matches;
      }
    }

    this.discoveredInfo.fileStructure = structure;
  }

  async analyzeDirectory(dirPath) {
    const analysis = {
      totalFiles: 0,
      fileTypes: {},
      components: [],
      hooks: [],
      utilities: [],
      size: 0
    };

    try {
      const files = this.getAllFiles(dirPath);
      analysis.totalFiles = files.length;

      for (const file of files) {
        const ext = path.extname(file);
        analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;

        const stat = fs.statSync(file);
        analysis.size += stat.size;

        // Identify React components
        if (ext === '.jsx' || ext === '.tsx') {
          const content = fs.readFileSync(file, 'utf8');
          if (this.isReactComponent(content)) {
            analysis.components.push({
              name: path.basename(file, ext),
              path: path.relative(this.rootPath, file),
              size: stat.size,
              hooks: this.extractHooks(content)
            });
          }
        }

        // Identify custom hooks
        if (path.basename(file).startsWith('use') && (ext === '.js' || ext === '.ts')) {
          analysis.hooks.push({
            name: path.basename(file, ext),
            path: path.relative(this.rootPath, file),
            size: stat.size
          });
        }
      }

      analysis.size = this.formatBytes(analysis.size);
    } catch (error) {
      console.log(`⚠️ Error analyzing ${dirPath}: ${error.message}`);
    }

    return analysis;
  }

  getAllFiles(dirPath) {
    let files = [];
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files = files.concat(this.getAllFiles(fullPath));
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory access error
    }
    return files;
  }

  findFiles(dirPath, pattern) {
    const files = [];
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile() && this.matchesPattern(item, pattern)) {
          files.push(path.relative(this.rootPath, fullPath));
        } else if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...this.findFiles(fullPath, pattern));
        }
      }
    } catch (error) {
      // Directory access error
    }
    return files;
  }

  matchesPattern(filename, pattern) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    }
    return filename === pattern;
  }

  async discoverDeploymentInfo() {
    console.log('🚀 Discovering deployment configuration...');
    
    const deployment = {
      frontend: {},
      backend: {},
      database: {},
      cdn: {}
    };

    // Check for Amplify configuration
    const amplifyConfig = path.join(this.rootPath, 'amplify.yml');
    if (fs.existsSync(amplifyConfig)) {
      deployment.frontend.service = 'AWS Amplify';
      deployment.frontend.config = 'amplify.yml';
      try {
        const config = fs.readFileSync(amplifyConfig, 'utf8');
        deployment.frontend.buildCommand = this.extractBuildCommand(config);
      } catch (error) {
        // Config read error
      }
    }

    // Check for Serverless configuration
    const serverlessConfig = path.join(this.rootPath, 'serverless.yml');
    if (fs.existsSync(serverlessConfig)) {
      deployment.backend.service = 'AWS Lambda (Serverless)';
      deployment.backend.config = 'serverless.yml';
    }

    // Check for Docker
    const dockerConfig = path.join(this.rootPath, 'docker-compose.yml');
    if (fs.existsSync(dockerConfig)) {
      deployment.containerization = 'Docker';
      deployment.dockerConfig = 'docker-compose.yml';
    }

    // Auto-discover URLs from package.json scripts and env files
    await this.discoverUrls();

    this.discoveredInfo.deployment = deployment;
  }

  async discoverUrls() {
    console.log('🌐 Discovering application URLs...');
    
    const urls = {
      frontend: null,
      backend: null,
      api: null,
      docs: null
    };

    // Check environment files for URLs
    const envFiles = this.findFiles(this.rootPath, '.env*');
    for (const envFile of envFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, envFile), 'utf8');
        const apiUrlMatch = content.match(/VITE_API_BASE_URL=(.+)/);
        if (apiUrlMatch) {
          urls.api = apiUrlMatch[1].trim();
        }
      } catch (error) {
        // Env file read error
      }
    }

    // Check package.json for homepage or deployment URLs
    const packageFiles = this.findFiles(this.rootPath, 'package.json');
    for (const pkgFile of packageFiles) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(this.rootPath, pkgFile), 'utf8'));
        if (pkg.homepage) {
          urls.frontend = pkg.homepage;
        }
      } catch (error) {
        // Package.json read error
      }
    }

    // Try to discover GitHub Pages URL
    try {
      const gitRemote = execSync('git config --get remote.origin.url', { 
        cwd: this.rootPath, 
        encoding: 'utf8' 
      }).trim();
      
      if (gitRemote.includes('github.com')) {
        const repoMatch = gitRemote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        if (repoMatch) {
          urls.docs = `https://${repoMatch[1]}.github.io/${repoMatch[2]}/`;
        }
      }
    } catch (error) {
      // Git command error
    }

    // Test URLs to see which ones are live
    for (const [type, url] of Object.entries(urls)) {
      if (url) {
        const isLive = await this.testUrl(url);
        urls[type] = { url, live: isLive };
      }
    }

    this.discoveredInfo.urls = urls;
  }

  async testUrl(url) {
    return new Promise((resolve) => {
      try {
        const protocol = url.startsWith('https://') ? https : require('http');
        const req = protocol.get(url, (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 400);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => {
          req.destroy();
          resolve(false);
        });
      } catch (error) {
        resolve(false);
      }
    });
  }

  async discoverDatabaseInfo() {
    console.log('🗄️ Discovering database information...');
    
    const database = {
      type: 'Unknown',
      tables: [],
      relationships: [],
      connectionInfo: {}
    };

    // Check for database connection strings in env files
    const envFiles = this.findFiles(this.rootPath, '.env*');
    for (const envFile of envFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, envFile), 'utf8');
        
        if (content.includes('DATABASE_URL') || content.includes('POSTGRES')) {
          database.type = 'PostgreSQL';
        } else if (content.includes('MYSQL')) {
          database.type = 'MySQL';
        } else if (content.includes('MONGODB')) {
          database.type = 'MongoDB';
        }

        // Extract connection info (without credentials)
        const dbUrlMatch = content.match(/DATABASE_URL=(.+)/);
        if (dbUrlMatch) {
          const url = dbUrlMatch[1].trim();
          database.connectionInfo = this.parseConnectionString(url);
        }
      } catch (error) {
        // Env file read error
      }
    }

    // Check backend code for database models/schemas
    const backendDirs = Object.keys(this.discoveredInfo.fileStructure.backend || {});
    for (const backendDir of backendDirs) {
      const modelFiles = this.findFiles(path.join(this.rootPath, backendDir), '*.js');
      for (const modelFile of modelFiles) {
        try {
          const content = fs.readFileSync(path.join(this.rootPath, modelFile), 'utf8');
          const tables = this.extractTableNames(content);
          database.tables.push(...tables);
        } catch (error) {
          // Model file read error
        }
      }
    }

    // Remove duplicates
    database.tables = [...new Set(database.tables)];

    this.discoveredInfo.database = database;
  }

  parseConnectionString(connectionString) {
    // Parse connection string without exposing credentials
    try {
      const url = new URL(connectionString);
      return {
        host: url.hostname,
        port: url.port,
        database: url.pathname.slice(1),
        ssl: url.searchParams.get('ssl') || url.searchParams.get('sslmode')
      };
    } catch (error) {
      return { raw: 'Connection string format not recognized' };
    }
  }

  extractTableNames(content) {
    const tables = [];
    
    // Look for SQL table references
    const sqlMatches = content.match(/CREATE TABLE\s+(\w+)|INSERT INTO\s+(\w+)|SELECT.*FROM\s+(\w+)|UPDATE\s+(\w+)/gi);
    if (sqlMatches) {
      sqlMatches.forEach(match => {
        const tableMatch = match.match(/(?:CREATE TABLE|INSERT INTO|FROM|UPDATE)\s+(\w+)/i);
        if (tableMatch) {
          tables.push(tableMatch[1]);
        }
      });
    }

    // Look for ORM model references
    const ormMatches = content.match(/\.table\(['"](\w+)['"]\)/g);
    if (ormMatches) {
      ormMatches.forEach(match => {
        const tableMatch = match.match(/\.table\(['"](\w+)['"]\)/);
        if (tableMatch) {
          tables.push(tableMatch[1]);
        }
      });
    }

    return tables;
  }

  async discoverGitInfo() {
    console.log('📝 Discovering Git repository information...');
    
    const git = {
      repository: null,
      branch: null,
      lastCommit: null,
      contributors: [],
      totalCommits: 0
    };

    try {
      // Get repository URL
      const remoteUrl = execSync('git config --get remote.origin.url', { 
        cwd: this.rootPath, 
        encoding: 'utf8' 
      }).trim();
      git.repository = remoteUrl.replace(/\.git$/, '');

      // Get current branch
      git.branch = execSync('git branch --show-current', { 
        cwd: this.rootPath, 
        encoding: 'utf8' 
      }).trim();

      // Get last commit info
      const lastCommit = execSync('git log -1 --format="%h|%s|%an|%ad"', { 
        cwd: this.rootPath, 
        encoding: 'utf8' 
      }).trim();
      
      const [hash, message, author, date] = lastCommit.split('|');
      git.lastCommit = { hash, message, author, date };

      // Get total commits
      git.totalCommits = parseInt(execSync('git rev-list --count HEAD', { 
        cwd: this.rootPath, 
        encoding: 'utf8' 
      }).trim());

      // Get contributors
      const contributors = execSync('git log --format="%an" | sort | uniq -c | sort -nr', { 
        cwd: this.rootPath, 
        encoding: 'utf8' 
      }).trim().split('\n').slice(0, 5);
      
      git.contributors = contributors.map(line => {
        const [count, name] = line.trim().split(/\s+(.+)/);
        return { name, commits: parseInt(count) };
      });

    } catch (error) {
      console.log('⚠️ Git information not available');
    }

    this.discoveredInfo.git = git;
  }

  async discoverPackageInfo() {
    console.log('📦 Discovering package information...');
    
    const packages = {};
    const packageFiles = this.findFiles(this.rootPath, 'package.json');
    
    for (const pkgFile of packageFiles) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(this.rootPath, pkgFile), 'utf8'));
        packages[pkgFile] = {
          name: pkg.name,
          version: pkg.version,
          description: pkg.description,
          scripts: Object.keys(pkg.scripts || {}),
          dependencies: Object.keys(pkg.dependencies || {}).length,
          devDependencies: Object.keys(pkg.devDependencies || {}).length,
          engines: pkg.engines
        };
      } catch (error) {
        // Package.json read error
      }
    }

    this.discoveredInfo.packages = packages;
  }

  async discoverAPIEndpoints() {
    console.log('🌐 Discovering API endpoints...');
    
    const apis = {
      baseUrl: null,
      endpoints: [],
      workingCount: 0,
      totalCount: 0,
      categories: {}
    };

    // Get API base URL from discovered URLs
    if (this.discoveredInfo.urls.api) {
      apis.baseUrl = this.discoveredInfo.urls.api.url;
    }

    // If no API URL found, try to find it in code
    if (!apis.baseUrl) {
      const jsFiles = this.findFiles(this.rootPath, '*.js');
      for (const jsFile of jsFiles) {
        try {
          const content = fs.readFileSync(path.join(this.rootPath, jsFile), 'utf8');
          const apiMatch = content.match(/https?:\/\/[^'"\s]+\.execute-api\.[^'"\s]+/);
          if (apiMatch) {
            apis.baseUrl = apiMatch[0];
            break;
          }
        } catch (error) {
          // File read error
        }
      }
    }

    // Test common endpoints if we have a base URL
    if (apis.baseUrl) {
      const commonEndpoints = [
        { path: '/api/v1/health', method: 'GET', category: 'System' },
        { path: '/api/v1/protocols', method: 'GET', category: 'Core' },
        { path: '/api/v1/foods/search', method: 'GET', category: 'Foods' },
        { path: '/api/v1/timeline/entries', method: 'GET', category: 'Timeline' },
        { path: '/api/v1/correlations/insights', method: 'GET', category: 'AI' }
      ];

      for (const endpoint of commonEndpoints) {
        const result = await this.testAPIEndpoint(apis.baseUrl, endpoint);
        apis.endpoints.push(result);
        if (result.working) apis.workingCount++;
        
        if (!apis.categories[endpoint.category]) {
          apis.categories[endpoint.category] = { working: 0, total: 0 };
        }
        apis.categories[endpoint.category].total++;
        if (result.working) apis.categories[endpoint.category].working++;
      }
      
      apis.totalCount = apis.endpoints.length;
    }

    this.discoveredInfo.apis = apis;
  }

  async testAPIEndpoint(baseUrl, endpoint) {
    return new Promise((resolve) => {
      const testUrl = `${baseUrl}${endpoint.path}`;
      const startTime = Date.now();
      
      const req = https.get(testUrl, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({
          ...endpoint,
          status: res.statusCode,
          working: res.statusCode >= 200 && res.statusCode < 300,
          responseTime: responseTime
        });
      });

      req.on('error', () => {
        resolve({
          ...endpoint,
          status: 500,
          working: false,
          error: 'Connection failed'
        });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({
          ...endpoint,
          status: 408,
          working: false,
          error: 'Timeout'
        });
      });
    });
  }

  async discoverDevelopmentSetup() {
    console.log('🔧 Discovering development setup requirements...');
    
    const development = {
      nodeVersion: null,
      packageManager: 'npm',
      scripts: {},
      environmentVariables: [],
      ports: {},
      prerequisites: [],
      setupSteps: []
    };

    // Check for Node.js version requirements
    const packageFiles = this.findFiles(this.rootPath, 'package.json');
    for (const pkgFile of packageFiles) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(this.rootPath, pkgFile), 'utf8'));
        if (pkg.engines && pkg.engines.node) {
          development.nodeVersion = pkg.engines.node;
        }
        
        // Collect all scripts
        if (pkg.scripts) {
          development.scripts[pkgFile] = pkg.scripts;
        }
      } catch (error) {
        // Package.json read error
      }
    }

    // Check for package manager
    if (fs.existsSync(path.join(this.rootPath, 'yarn.lock'))) {
      development.packageManager = 'yarn';
    } else if (fs.existsSync(path.join(this.rootPath, 'pnpm-lock.yaml'))) {
      development.packageManager = 'pnpm';
    }

    // Discover environment variables
    const envFiles = this.findFiles(this.rootPath, '.env*');
    for (const envFile of envFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, envFile), 'utf8');
        const envVars = content.split('\n')
          .filter(line => line.includes('=') && !line.startsWith('#'))
          .map(line => {
            const [key] = line.split('=');
            return key.trim();
          });
        development.environmentVariables.push(...envVars);
      } catch (error) {
        // Env file read error
      }
    }

    // Remove duplicates
    development.environmentVariables = [...new Set(development.environmentVariables)];

    // Generate setup steps
    development.setupSteps = this.generateSetupSteps(development);

    this.discoveredInfo.development = development;
  }

  generateSetupSteps(development) {
    const steps = [];
    
    steps.push({
      step: 1,
      title: 'Clone Repository',
      command: 'git clone <repository-url>',
      description: 'Clone the repository to your local machine'
    });

    if (development.nodeVersion) {
      steps.push({
        step: 2,
        title: 'Install Node.js',
        command: `Use Node.js ${development.nodeVersion}`,
        description: 'Install the required Node.js version'
      });
    }

    steps.push({
      step: 3,
      title: 'Install Dependencies',
      command: `${development.packageManager} install`,
      description: 'Install all project dependencies'
    });

    if (development.environmentVariables.length > 0) {
      steps.push({
        step: 4,
        title: 'Setup Environment Variables',
        command: 'Copy .env.example to .env and fill in values',
        description: `Configure: ${development.environmentVariables.slice(0, 3).join(', ')}${development.environmentVariables.length > 3 ? '...' : ''}`
      });
    }

    const hasDevScript = Object.values(development.scripts).some(scripts => scripts.dev || scripts.start);
    if (hasDevScript) {
      steps.push({
        step: 5,
        title: 'Start Development Server',
        command: `${development.packageManager} run dev`,
        description: 'Start the development server'
      });
    }

    return steps;
  }

  async generateProfessionalSite() {
    console.log('🎨 Generating professional documentation site...');
    
    // Create docs directory
    const docsDir = path.join(this.rootPath, 'docs-site');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Generate HTML site
    const htmlContent = this.generateProfessionalHTML();
    fs.writeFileSync(path.join(docsDir, 'index.html'), htmlContent);

    // Generate JSON data
    const jsonData = this.generateJSONData();
    fs.writeFileSync(path.join(docsDir, 'platform-data.json'), JSON.stringify(jsonData, null, 2));

    // Generate README
    const readmeContent = this.generateREADME();
    fs.writeFileSync(path.join(docsDir, 'README.md'), readmeContent);

    console.log('✅ Professional documentation site generated in docs-site/');
  }

  generateProfessionalHTML() {
    const info = this.discoveredInfo;
    const stats = this.calculateStats();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FILO Health Platform - Technical Documentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: #f8fafc;
        }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 0;
            text-align: center;
        }
        
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        
        /* Navigation */
        .nav { 
            background: white; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .nav ul { 
            display: flex; 
            list-style: none; 
            justify-content: center;
            padding: 1rem 0;
        }
        
        .nav a { 
            text-decoration: none; 
            color: #4a5568; 
            padding: 0.5rem 1rem; 
            margin: 0 0.5rem;
            border-radius: 5px;
            transition: all 0.3s;
        }
        
        .nav a:hover { background: #edf2f7; color: #667eea; }
        
        /* Main Content */
        .main { padding: 3rem 0; }
        
        .section { 
            background: white; 
            margin-bottom: 2rem; 
            padding: 2rem; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .section h2 { 
            color: #2d3748; 
            margin-bottom: 1rem; 
            font-size: 1.8rem;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 0.5rem;
        }
        
        /* Stats Grid */
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 1rem; 
            margin-bottom: 2rem;
        }
        
        .stat-card { 
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white; 
            padding: 1.5rem; 
            border-radius: 10px; 
            text-align: center;
        }
        
        .stat-card.api { background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); }
        .stat-card.db { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); }
        .stat-card.git { background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%); }
        
        .stat-number { font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem; }
        .stat-label { font-size: 0.9rem; opacity: 0.9; }
        
        /* Two Column Layout */
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        
        /* Lists */
        .feature-list { list-style: none; }
        .feature-list li { 
            padding: 0.5rem 0; 
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
        }
        .feature-list li:before { 
            content: '✅'; 
            margin-right: 0.5rem; 
        }
        
        /* Code Blocks */
        .code-block { 
            background: #2d3748; 
            color: #e2e8f0; 
            padding: 1rem; 
            border-radius: 5px; 
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        
        /* Links */
        .links { display: flex; gap: 1rem; margin-top: 1rem; }
        .link-btn { 
            background: #667eea; 
            color: white; 
            padding: 0.75rem 1.5rem; 
            text-decoration: none; 
            border-radius: 5px;
            transition: all 0.3s;
        }
        .link-btn:hover { background: #5a67d8; }
        
        /* Responsive */
        @media (max-width: 768px) {
            .two-col { grid-template-columns: 1fr; }
            .nav ul { flex-direction: column; text-align: center; }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>🚀 FILO Health Platform</h1>
            <p>AI-Powered Health Tracking & Correlation Discovery</p>
        </div>
    </header>

    <nav class="nav">
        <div class="container">
            <ul>
                <li><a href="#overview">Overview</a></li>
                <li><a href="#architecture">Architecture</a></li>
                <li><a href="#api">API Documentation</a></li>
                <li><a href="#database">Database</a></li>
                <li><a href="#development">Development</a></li>
                <li><a href="#deployment">Deployment</a></li>
            </ul>
        </div>
    </nav>

    <main class="main">
        <div class="container">
            <!-- Overview Section -->
            <section id="overview" class="section">
                <h2>📊 Platform Overview</h2>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${stats.totalComponents}</div>
                        <div class="stat-label">Components</div>
                    </div>
                    <div class="stat-card api">
                        <div class="stat-number">${stats.workingAPIs}/${stats.totalAPIs}</div>
                        <div class="stat-label">API Endpoints</div>
                    </div>
                    <div class="stat-card db">
                        <div class="stat-number">${stats.totalTables}</div>
                        <div class="stat-label">Database Tables</div>
                    </div>
                    <div class="stat-card git">
                        <div class="stat-number">${stats.totalCommits}</div>
                        <div class="stat-label">Git Commits</div>
                    </div>
                </div>

                <div class="two-col">
                    <div>
                        <h3>🎯 Key Features</h3>
                        <ul class="feature-list">
                            <li>AI-powered health correlation discovery</li>
                            <li>Real-time food & symptom tracking</li>
                            <li>Protocol-based nutrition guidance</li>
                            <li>Daily reflection & mood tracking</li>
                            <li>Comprehensive health insights</li>
                        </ul>
                    </div>
                    <div>
                        <h3>🔗 Live Links</h3>
                        <div class="links">
                            ${info.urls.frontend ? `<a href="${info.urls.frontend.url}" class="link-btn">Live App</a>` : ''}
                            ${info.urls.api ? `<a href="${info.urls.api.url}" class="link-btn">API</a>` : ''}
                            ${info.git.repository ? `<a href="${info.git.repository}" class="link-btn">GitHub</a>` : ''}
                        </div>
                    </div>
                </div>
            </section>

            <!-- Architecture Section -->
            <section id="architecture" class="section">
                <h2>🏗️ Architecture</h2>
                
                <div class="two-col">
                    <div>
                        <h3>Frontend Stack</h3>
                        <ul class="feature-list">
                            <li>React 18 with Hooks</li>
                            <li>Vite for fast development</li>
                            <li>Tailwind CSS for styling</li>
                            <li>Lucide React icons</li>
                            <li>AWS Amplify deployment</li>
                        </ul>
                    </div>
                    <div>
                        <h3>Backend Stack</h3>
                        <ul class="feature-list">
                            <li>AWS Lambda (Node.js)</li>
                            <li>PostgreSQL database</li>
                            <li>RESTful API design</li>
                            <li>CORS-enabled endpoints</li>
                            <li>Serverless architecture</li>
                        </ul>
                    </div>
                </div>

                <h3>📁 Project Structure</h3>
                <div class="code-block">
health-platform/
├── frontend/
│   ├── web-app/           # React application
│   └── shared/            # Reusable components & hooks
├── backend/
│   └── functions/api/     # AWS Lambda functions
├── docs-site/             # Generated documentation
└── README.md</div>
            </section>

            <!-- API Documentation -->
            <section id="api" class="section">
                <h2>🌐 API Documentation</h2>
                
                <div class="two-col">
                    <div>
                        <h3>API Status</h3>
                        <p><strong>Base URL:</strong> ${info.apis.baseUrl || 'Not configured'}</p>
                        <p><strong>Working Endpoints:</strong> ${info.apis.workingCount}/${info.apis.totalCount}</p>
                        <p><strong>Categories:</strong> ${Object.keys(info.apis.categories).length}</p>
                    </div>
                    <div>
                        <h3>Example Request</h3>
                        <div class="code-block">
curl "${info.apis.baseUrl}/api/v1/protocols" \\
  -H "Content-Type: application/json"</div>
                    </div>
                </div>

                ${Object.keys(info.apis.categories).length > 0 ? `
                <h3>📍 Endpoint Categories</h3>
                <div class="stats-grid">
                    ${Object.entries(info.apis.categories).map(([category, stats]) => `
                    <div class="stat-card api">
                        <div class="stat-number">${stats.working}/${stats.total}</div>
                        <div class="stat-label">${category} APIs</div>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
            </section>

            <!-- Database Section -->
            <section id="database" class="section">
                <h2>🗄️ Database</h2>
                
                <div class="two-col">
                    <div>
                        <h3>Database Info</h3>
                        <p><strong>Type:</strong> ${info.database.type}</p>
                        <p><strong>Tables:</strong> ${info.database.tables.length}</p>
                        ${info.database.connectionInfo.host ? `<p><strong>Host:</strong> ${info.database.connectionInfo.host}</p>` : ''}
                        ${info.database.connectionInfo.database ? `<p><strong>Database:</strong> ${info.database.connectionInfo.database}</p>` : ''}
                    </div>
                    <div>
                        <h3>Discovered Tables</h3>
                        <ul class="feature-list">
                            ${info.database.tables.slice(0, 8).map(table => `<li>${table}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </section>

            <!-- Development Section -->
            <section id="development" class="section">
                <h2>🔧 Development Setup</h2>
                
                <div class="two-col">
                    <div>
                        <h3>Requirements</h3>
                        ${info.development.nodeVersion ? `<p><strong>Node.js:</strong> ${info.development.nodeVersion}</p>` : ''}
                        <p><strong>Package Manager:</strong> ${info.development.packageManager}</p>
                        <p><strong>Environment Variables:</strong> ${info.development.environmentVariables.length}</p>
                    </div>
                    <div>
                        <h3>Quick Start</h3>
                        <div class="code-block">
git clone &lt;repository&gt;
cd health-platform
${info.development.packageManager} install
cp .env.example .env
${info.development.packageManager} run dev</div>
                    </div>
                </div>

                <h3>📋 Setup Steps</h3>
                <ol>
                    ${info.development.setupSteps.map(step => `
                    <li><strong>${step.title}:</strong> ${step.description}
                        <div class="code-block">${step.command}</div>
                    </li>
                    `).join('')}
                </ol>
            </section>

            <!-- Deployment Section -->
            <section id="deployment" class="section">
                <h2>🚀 Deployment</h2>
                
                <div class="two-col">
                    <div>
                        <h3>Frontend Deployment</h3>
                        <p><strong>Service:</strong> ${info.deployment.frontend.service || 'AWS Amplify'}</p>
                        <p><strong>URL:</strong> ${info.urls.frontend ? `<a href="${info.urls.frontend.url}">${info.urls.frontend.url}</a>` : 'Not configured'}</p>
                    </div>
                    <div>
                        <h3>Backend Deployment</h3>
                        <p><strong>Service:</strong> ${info.deployment.backend.service || 'AWS Lambda'}</p>
                        <p><strong>API URL:</strong> ${info.urls.api ? `<a href="${info.urls.api.url}">${info.urls.api.url}</a>` : 'Not configured'}</p>
                    </div>
                </div>

                <h3>🔄 CI/CD Pipeline</h3>
                <ul class="feature-list">
                    <li>GitHub Actions for automated deployment</li>
                    <li>Lambda function updates on code changes</li>
                    <li>Amplify builds on frontend changes</li>
                    <li>Automated documentation generation</li>
                </ul>
            </section>
        </div>
    </main>

    <footer style="background: #2d3748; color: white; padding: 2rem 0; text-align: center; margin-top: 3rem;">
        <div class="container">
            <p>Generated automatically on ${new Date().toLocaleDateString()} • 
               Last updated: ${info.git.lastCommit ? info.git.lastCommit.date : 'Unknown'}</p>
        </div>
    </footer>
</body>
</html>`;
  }

  generateJSONData() {
    return {
      meta: {
        generated: new Date().toISOString(),
        version: '1.0.0',
        generator: 'AutomatedProfessionalDocsGenerator'
      },
      platform: {
        name: 'FILO Health Platform',
        description: 'AI-Powered Health Tracking & Correlation Discovery',
        version: '1.0.0',
        status: 'Active Development'
      },
      statistics: this.calculateStats(),
      discoveredInfo: this.discoveredInfo
    };
  }

  generateREADME() {
    const info = this.discoveredInfo;
    
    return `# FILO Health Platform

AI-Powered Health Tracking & Correlation Discovery

## Quick Start

\`\`\`bash
git clone ${info.git.repository || '<repository>'}
cd health-platform
${info.development.packageManager} install
cp .env.example .env
${info.development.packageManager} run dev
\`\`\`

## Links

- **Live Application:** ${info.urls.frontend ? info.urls.frontend.url : 'TBD'}
- **API Endpoints:** ${info.urls.api ? info.urls.api.url : 'TBD'}
- **Documentation:** ${info.urls.docs || 'TBD'}

## Architecture

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** AWS Lambda + Node.js
- **Database:** ${info.database.type}
- **Deployment:** AWS Amplify + Lambda

## Development

**Requirements:**
- Node.js ${info.development.nodeVersion || '18+'}
- ${info.development.packageManager}
- Environment variables (${info.development.environmentVariables.length} required)

**Available Scripts:**
${Object.entries(info.development.scripts).map(([file, scripts]) => 
  Object.entries(scripts).map(([script, command]) => `- \`${info.development.packageManager} run ${script}\` - ${command}`).join('\n')
).join('\n')}

## API Status

- **Base URL:** ${info.apis.baseUrl || 'Not configured'}
- **Working Endpoints:** ${info.apis.workingCount}/${info.apis.totalCount}
- **Categories:** ${Object.keys(info.apis.categories).join(', ')}

## Database

- **Type:** ${info.database.type}
- **Tables:** ${info.database.tables.length} discovered
- **Connection:** ${info.database.connectionInfo.host ? `${info.database.connectionInfo.host}:${info.database.connectionInfo.port}` : 'Configured via environment'}

---

*This README was generated automatically. For complete documentation, visit the [documentation site](${info.urls.docs || '#'}).*
`;
  }

  calculateStats() {
    const info = this.discoveredInfo;
    
    return {
      totalComponents: Object.values(info.fileStructure.frontend || {}).reduce((sum, dir) => sum + (dir.components?.length || 0), 0),
      totalHooks: Object.values(info.fileStructure.frontend || {}).reduce((sum, dir) => sum + (dir.hooks?.length || 0), 0),
      totalFiles: Object.values(info.fileStructure.frontend || {}).reduce((sum, dir) => sum + (dir.totalFiles || 0), 0),
      workingAPIs: info.apis.workingCount || 0,
      totalAPIs: info.apis.totalCount || 0,
      totalTables: info.database.tables.length || 0,
      totalCommits: info.git.totalCommits || 0,
      contributors: info.git.contributors?.length || 0
    };
  }

  isReactComponent(content) {
    return content.includes('export') && 
           (content.includes('function') || content.includes('const')) &&
           (content.includes('return') || content.includes('=>')) &&
           (content.includes('jsx') || content.includes('<') || content.includes('React'));
  }

  extractHooks(content) {
    const hooks = [];
    const hookMatches = content.match(/use[A-Z]\w+/g);
    if (hookMatches) {
      hooks.push(...[...new Set(hookMatches)]);
    }
    return hooks;
  }

  extractBuildCommand(content) {
    const buildMatch = content.match(/build:\s*\n.*?commands:\s*\n.*?-\s*(.+)/s);
    return buildMatch ? buildMatch[1].trim() : null;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  printSummary() {
    const info = this.discoveredInfo;
    const stats = this.calculateStats();
    
    console.log('\n📊 PROFESSIONAL DOCUMENTATION SUMMARY');
    console.log('=====================================');
    console.log(`📱 Components: ${stats.totalComponents} (${stats.totalHooks} hooks)`);
    console.log(`🌐 APIs: ${stats.workingAPIs}/${stats.totalAPIs} working`);
    console.log(`🗄️ Database: ${stats.totalTables} tables (${info.database.type})`);
    console.log(`📝 Git: ${stats.totalCommits} commits, ${stats.contributors} contributors`);
    console.log(`🔧 Development: Node.js ${info.development.nodeVersion || 'Any'}, ${info.development.packageManager}`);
    console.log(`🚀 Deployment: ${Object.keys(info.deployment).length} services configured`);
    console.log('\n📁 Generated Files:');
    console.log('   - docs-site/index.html (Professional documentation site)');
    console.log('   - docs-site/platform-data.json (Structured data)');
    console.log('   - docs-site/README.md (Developer guide)');
    console.log(`\n🌐 Documentation URL: ${info.urls.docs || 'Deploy to GitHub Pages'}`);
    console.log('\n✅ Professional documentation ready for investors and developers!');
  }
}

// CLI execution
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const generator = new AutomatedProfessionalDocsGenerator(projectPath);
  generator.generateProfessionalDocs();
}

module.exports = AutomatedProfessionalDocsGenerator;