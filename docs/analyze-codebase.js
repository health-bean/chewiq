#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class FILOCodebaseAnalyzer {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.analysis = {
      overview: {},
      frontend: {
        components: [],
        hooks: [],
        pages: [],
        utilities: []
      },
      backend: {
        endpoints: [],
        lambdaFunctions: [],
        databaseModels: []
      },
      shared: {
        components: [],
        utilities: []
      },
      dependencies: {
        frontend: {},
        backend: {},
        shared: {}
      },
      config: {
        environment: {},
        build: {},
        deployment: {}
      }
    };
  }

  // Main analysis runner
  async analyze() {
    console.log('🔍 Starting FILO Health Platform Analysis...\n');
    
    try {
      await this.analyzeStructure();
      await this.analyzeComponents();
      await this.analyzeAPIs();
      await this.analyzeDependencies();
      await this.analyzeConfiguration();
      
      this.generateReport();
      this.identifyGaps();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    }
  }

  // Analyze overall project structure
  async analyzeStructure() {
    console.log('📁 Analyzing project structure...');
    
    const structure = this.getDirectoryTree(this.rootPath);
    this.analysis.overview.structure = structure;
    
    // Count key items
    this.analysis.overview.stats = {
      totalFiles: this.countFiles(this.rootPath),
      directories: this.countDirectories(this.rootPath),
      lastModified: this.getLastModified(this.rootPath)
    };
  }

  // Extract all React components
  async analyzeComponents() {
    console.log('⚛️  Analyzing React components...');
    
    const frontendPath = path.join(this.rootPath, 'frontend');
    const sharedPath = path.join(this.rootPath, 'frontend', 'shared');
    
    // Scan for React components
    if (fs.existsSync(frontendPath)) {
      this.analysis.frontend.components = this.findReactComponents(frontendPath);
    }
    
    if (fs.existsSync(sharedPath)) {
      this.analysis.shared.components = this.findReactComponents(sharedPath);
    }
    
    // Find custom hooks
    this.analysis.frontend.hooks = this.findCustomHooks(frontendPath);
  }

  // Extract API endpoints and backend structure
  async analyzeAPIs() {
    console.log('🌐 Analyzing API endpoints...');
    
    const backendPaths = [
      path.join(this.rootPath, 'backend'),
      path.join(this.rootPath, 'lambda'),
      path.join(this.rootPath, 'api')
    ];
    
    for (const backendPath of backendPaths) {
      if (fs.existsSync(backendPath)) {
        this.analysis.backend.endpoints.push(...this.findAPIEndpoints(backendPath));
        this.analysis.backend.lambdaFunctions.push(...this.findLambdaFunctions(backendPath));
      }
    }
  }

  // Analyze all dependencies
  async analyzeDependencies() {
    console.log('📦 Analyzing dependencies...');
    
    const packageJsonPaths = this.findPackageJsonFiles(this.rootPath);
    
    for (const pkgPath of packageJsonPaths) {
      const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const relativeDir = path.relative(this.rootPath, path.dirname(pkgPath));
      
      const category = relativeDir.includes('frontend') ? 'frontend' : 
                     relativeDir.includes('backend') ? 'backend' : 'shared';
      
      this.analysis.dependencies[category][relativeDir || 'root'] = {
        dependencies: pkgContent.dependencies || {},
        devDependencies: pkgContent.devDependencies || {},
        scripts: pkgContent.scripts || {}
      };
    }
  }

  // Analyze configuration files
  async analyzeConfiguration() {
    console.log('⚙️  Analyzing configuration...');
    
    const configFiles = [
      'amplify.yml',
      'vite.config.js',
      'tsconfig.json',
      'tailwind.config.js',
      '.env',
      '.env.local'
    ];
    
    for (const configFile of configFiles) {
      const filePath = path.join(this.rootPath, configFile);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          this.analysis.config[configFile.replace('.', '_')] = {
            exists: true,
            content: configFile.includes('.env') ? '[REDACTED]' : content.substring(0, 500)
          };
        } catch (error) {
          this.analysis.config[configFile.replace('.', '_')] = { exists: true, error: error.message };
        }
      }
    }
  }

  // Helper methods
  getDirectoryTree(dirPath, level = 0) {
    if (level > 3) return null; // Limit depth
    
    const items = [];
    if (!fs.existsSync(dirPath)) return items;
    
    const dirItems = fs.readdirSync(dirPath);
    
    for (const item of dirItems) {
      if (item.startsWith('.') && !item.includes('env')) continue;
      if (item === 'node_modules') continue;
      
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        items.push({
          name: item,
          type: 'directory',
          children: this.getDirectoryTree(itemPath, level + 1)
        });
      } else {
        items.push({
          name: item,
          type: 'file',
          size: stat.size
        });
      }
    }
    
    return items;
  }

  findReactComponents(dirPath) {
    const components = [];
    if (!fs.existsSync(dirPath)) return components;
    
    const findInDir = (currentPath) => {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && item !== 'node_modules') {
          findInDir(itemPath);
        } else if (item.match(/\.(jsx?|tsx?)$/)) {
          const content = fs.readFileSync(itemPath, 'utf8');
          
          // Look for React component patterns
          if (content.includes('export default') || content.includes('export const')) {
            if (content.includes('return') && (content.includes('<') || content.includes('jsx'))) {
              components.push({
                name: item.replace(/\.(jsx?|tsx?)$/, ''),
                path: path.relative(this.rootPath, itemPath),
                type: this.detectComponentType(content),
                props: this.extractProps(content),
                imports: this.extractImports(content)
              });
            }
          }
        }
      }
    };
    
    findInDir(dirPath);
    return components;
  }

  findCustomHooks(dirPath) {
    const hooks = [];
    if (!fs.existsSync(dirPath)) return hooks;
    
    const findInDir = (currentPath) => {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && item !== 'node_modules') {
          findInDir(itemPath);
        } else if (item.match(/use[A-Z].*\.(js|ts)$/)) {
          const content = fs.readFileSync(itemPath, 'utf8');
          
          hooks.push({
            name: item.replace(/\.(js|ts)$/, ''),
            path: path.relative(this.rootPath, itemPath),
            returns: this.extractHookReturns(content)
          });
        }
      }
    };
    
    findInDir(dirPath);
    return hooks;
  }

  findAPIEndpoints(dirPath) {
    const endpoints = [];
    if (!fs.existsSync(dirPath)) return endpoints;
    
    const findInDir = (currentPath) => {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          findInDir(itemPath);
        } else if (item.match(/\.(js|py|ts)$/)) {
          const content = fs.readFileSync(itemPath, 'utf8');
          
          // Look for API patterns
          const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
          for (const method of httpMethods) {
            const regex = new RegExp(`${method}.*?['"\`]([/\\w-{}:]+)['"\`]`, 'gi');
            const matches = content.match(regex);
            if (matches) {
              matches.forEach(match => {
                endpoints.push({
                  method,
                  path: match,
                  file: path.relative(this.rootPath, itemPath)
                });
              });
            }
          }
        }
      }
    };
    
    findInDir(dirPath);
    return endpoints;
  }

  findLambdaFunctions(dirPath) {
    const functions = [];
    // Implementation for finding Lambda functions
    return functions;
  }

  findPackageJsonFiles(dirPath) {
    const packageFiles = [];
    
    const findInDir = (currentPath) => {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        
        if (item === 'package.json') {
          packageFiles.push(itemPath);
        } else if (stat.isDirectory() && item !== 'node_modules') {
          findInDir(itemPath);
        }
      }
    };
    
    findInDir(dirPath);
    return packageFiles;
  }

  // Helper methods for content analysis
  detectComponentType(content) {
    if (content.includes('useState') || content.includes('useEffect')) return 'functional-hooks';
    if (content.includes('function') && content.includes('return')) return 'functional';
    if (content.includes('class') && content.includes('render')) return 'class';
    return 'unknown';
  }

  extractProps(content) {
    const propMatches = content.match(/\{([^}]*)\}/g);
    return propMatches ? propMatches.slice(0, 3) : []; // First 3 prop patterns
  }

  extractImports(content) {
    const importMatches = content.match(/import.*from ['"][^'"]+['"]/g);
    return importMatches || [];
  }

  extractHookReturns(content) {
    const returnMatch = content.match(/return\s+(\{[^}]+\}|\[[^\]]+\])/);
    return returnMatch ? returnMatch[1] : null;
  }

  countFiles(dirPath) {
    let count = 0;
    const countInDir = (currentPath) => {
      const items = fs.readdirSync(currentPath);
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isFile()) {
          count++;
        } else if (stat.isDirectory() && item !== 'node_modules') {
          countInDir(itemPath);
        }
      }
    };
    countInDir(dirPath);
    return count;
  }

  countDirectories(dirPath) {
    let count = 0;
    const countInDir = (currentPath) => {
      const items = fs.readdirSync(currentPath);
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory() && item !== 'node_modules') {
          count++;
          countInDir(itemPath);
        }
      }
    };
    countInDir(dirPath);
    return count;
  }

  getLastModified(dirPath) {
    let latest = 0;
    const checkInDir = (currentPath) => {
      const items = fs.readdirSync(currentPath);
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.mtime.getTime() > latest) {
          latest = stat.mtime.getTime();
        }
        if (stat.isDirectory() && item !== 'node_modules') {
          checkInDir(itemPath);
        }
      }
    };
    checkInDir(dirPath);
    return new Date(latest);
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📊 FILO Health Platform Analysis Report');
    console.log('========================================\n');
    
    // Overview
    console.log('🎯 OVERVIEW');
    console.log(`Total Files: ${this.analysis.overview.stats.totalFiles}`);
    console.log(`Directories: ${this.analysis.overview.stats.directories}`);
    console.log(`Last Modified: ${this.analysis.overview.stats.lastModified.toLocaleDateString()}\n`);
    
    // Frontend
    console.log('⚛️  FRONTEND COMPONENTS');
    console.log(`Shared Components: ${this.analysis.shared.components.length}`);
    this.analysis.shared.components.forEach(comp => {
      console.log(`  - ${comp.name} (${comp.type})`);
    });
    
    console.log(`\nApp Components: ${this.analysis.frontend.components.length}`);
    this.analysis.frontend.components.forEach(comp => {
      console.log(`  - ${comp.name} (${comp.type})`);
    });
    
    console.log(`\nCustom Hooks: ${this.analysis.frontend.hooks.length}`);
    this.analysis.frontend.hooks.forEach(hook => {
      console.log(`  - ${hook.name}`);
    });
    
    // Backend
    console.log('\n🌐 BACKEND & APIs');
    console.log(`API Endpoints Found: ${this.analysis.backend.endpoints.length}`);
    this.analysis.backend.endpoints.forEach(endpoint => {
      console.log(`  - ${endpoint.method} ${endpoint.path}`);
    });
    
    // Dependencies
    console.log('\n📦 DEPENDENCIES');
    Object.keys(this.analysis.dependencies).forEach(category => {
      if (Object.keys(this.analysis.dependencies[category]).length > 0) {
        console.log(`${category.toUpperCase()}:`);
        Object.keys(this.analysis.dependencies[category]).forEach(project => {
          const deps = this.analysis.dependencies[category][project];
          const depCount = Object.keys(deps.dependencies || {}).length;
          const devDepCount = Object.keys(deps.devDependencies || {}).length;
          console.log(`  - ${project}: ${depCount} deps, ${devDepCount} dev deps`);
        });
      }
    });
    
    // Save detailed report
    const reportPath = path.join(this.rootPath, 'FILO_ANALYSIS_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.analysis, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  }

  // Identify potential gaps and missing pieces
  identifyGaps() {
    console.log('\n🔍 GAP ANALYSIS');
    console.log('================\n');
    
    const gaps = [];
    
    // Check for common missing pieces
    if (this.analysis.backend.endpoints.length < 5) {
      gaps.push('⚠️  Expected 5+ API endpoints, found ' + this.analysis.backend.endpoints.length);
    }
    
    if (this.analysis.shared.components.length < 6) {
      gaps.push('⚠️  Expected 6+ shared components, found ' + this.analysis.shared.components.length);
    }
    
    if (!this.analysis.config.amplify_yml?.exists) {
      gaps.push('⚠️  Missing amplify.yml deployment configuration');
    }
    
    if (Object.keys(this.analysis.dependencies.frontend).length === 0) {
      gaps.push('⚠️  No frontend dependencies found - check package.json files');
    }
    
    if (gaps.length === 0) {
      console.log('✅ No major gaps detected! Your platform appears well-structured.');
    } else {
      console.log('POTENTIAL ISSUES:');
      gaps.forEach(gap => console.log(gap));
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('- Run this analyzer periodically to track changes');
    console.log('- Use the generated JSON report for documentation');
    console.log('- Check the detailed analysis for optimization opportunities');
  }
}

// CLI execution
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const analyzer = new FILOCodebaseAnalyzer(projectPath);
  analyzer.analyze();
}

module.exports = FILOCodebaseAnalyzer;