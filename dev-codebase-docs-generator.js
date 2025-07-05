#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DeveloperCodebaseDocGenerator {
  constructor(rootPath = process.cwd()) {
    this.rootPath = rootPath;
    this.docs = {
      overview: {},
      structure: {},
      components: {},
      setup: {},
      development: {}
    };
  }

  async generateDocs() {
    console.log('📚 Generating Developer Codebase Guide...\n');
    
    this.analyzeProjectStructure();
    this.findKeyComponents();
    this.analyzeConfiguration();
    this.generateSetupGuide();
    this.generateMarkdown();
    
    console.log('✅ Developer guide generated successfully!');
  }

  analyzeProjectStructure() {
    console.log('📁 Analyzing project structure...');
    
    const structure = this.getProjectStructure();
    this.docs.structure = structure;
    
    // Identify project type
    this.docs.overview = {
      type: this.detectProjectType(),
      framework: this.detectFramework(),
      deployment: this.detectDeployment(),
      lastModified: this.getLastModified()
    };
  }

  getProjectStructure() {
    const structure = {};
    const importantDirs = ['frontend', 'backend', 'src', 'components', 'pages', 'api', 'lambda'];
    
    importantDirs.forEach(dir => {
      const dirPath = path.join(this.rootPath, dir);
      if (fs.existsSync(dirPath)) {
        structure[dir] = {
          exists: true,
          files: this.getDirectoryContents(dirPath),
          purpose: this.getDirectoryPurpose(dir)
        };
      }
    });
    
    return structure;
  }

  getDirectoryContents(dirPath, maxDepth = 2, currentDepth = 0) {
    if (currentDepth >= maxDepth) return null;
    
    const contents = [];
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items.slice(0, 10)) { // Limit to first 10 items
        if (item.startsWith('.') || item === 'node_modules') continue;
        
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          contents.push({
            name: item,
            type: 'directory',
            children: this.getDirectoryContents(itemPath, maxDepth, currentDepth + 1)
          });
        } else if (this.isImportantFile(item)) {
          contents.push({
            name: item,
            type: 'file',
            purpose: this.getFilePurpose(item)
          });
        }
      }
    } catch (error) {
      return { error: 'Cannot read directory' };
    }
    
    return contents;
  }

  isImportantFile(filename) {
    const important = [
      /\.jsx?$/, /\.tsx?$/, /\.vue$/, /\.py$/,
      /package\.json$/, /requirements\.txt$/, /Dockerfile$/,
      /\.md$/, /\.yml$/, /\.yaml$/, /\.json$/
    ];
    return important.some(pattern => pattern.test(filename));
  }

  getDirectoryPurpose(dirname) {
    const purposes = {
      frontend: 'React/Vue frontend application',
      backend: 'Backend API and business logic',
      src: 'Main source code',
      components: 'Reusable UI components',
      pages: 'Application pages/routes',
      api: 'API endpoints and handlers',
      lambda: 'AWS Lambda functions'
    };
    return purposes[dirname] || 'Application code';
  }

  getFilePurpose(filename) {
    if (filename === 'package.json') return 'Node.js dependencies and scripts';
    if (filename === 'amplify.yml') return 'AWS Amplify deployment config';
    if (filename === 'vite.config.js') return 'Vite build configuration';
    if (filename === 'tailwind.config.js') return 'Tailwind CSS configuration';
    if (filename.endsWith('.md')) return 'Documentation';
    if (filename.endsWith('.env')) return 'Environment variables';
    return null;
  }

  detectProjectType() {
    if (fs.existsSync(path.join(this.rootPath, 'amplify.yml'))) return 'AWS Amplify Fullstack';
    if (fs.existsSync(path.join(this.rootPath, 'frontend')) && fs.existsSync(path.join(this.rootPath, 'backend'))) return 'Fullstack Web Application';
    if (fs.existsSync(path.join(this.rootPath, 'package.json'))) return 'Node.js Application';
    return 'Web Application';
  }

  detectFramework() {
    const packageJsonPath = this.findPackageJson();
    if (!packageJsonPath) return 'Unknown';
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.react) return 'React';
      if (deps.vue) return 'Vue.js';
      if (deps.angular) return 'Angular';
      if (deps.express) return 'Express.js';
      if (deps.fastapi) return 'FastAPI';
    } catch (error) {
      // Package.json parse error
    }
    
    return 'Unknown';
  }

  detectDeployment() {
    if (fs.existsSync(path.join(this.rootPath, 'amplify.yml'))) return 'AWS Amplify';
    if (fs.existsSync(path.join(this.rootPath, 'vercel.json'))) return 'Vercel';
    if (fs.existsSync(path.join(this.rootPath, 'netlify.toml'))) return 'Netlify';
    if (fs.existsSync(path.join(this.rootPath, 'Dockerfile'))) return 'Docker';
    return 'Unknown';
  }

  findKeyComponents() {
    console.log('⚛️  Finding key components...');
    
    const componentDirs = [
      path.join(this.rootPath, 'frontend', 'shared'),
      path.join(this.rootPath, 'src', 'components'),
      path.join(this.rootPath, 'components')
    ];
    
    this.docs.components = {
      shared: [],
      pages: [],
      hooks: []
    };
    
    componentDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.docs.components.shared.push(...this.findReactComponents(dir));
      }
    });
    
    // Find custom hooks
    this.docs.components.hooks = this.findCustomHooks(this.rootPath);
  }

  findReactComponents(dirPath) {
    const components = [];
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items.slice(0, 20)) { // Limit results
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isFile() && item.match(/\.(jsx?|tsx?)$/)) {
          const content = fs.readFileSync(itemPath, 'utf8');
          
          if (this.isReactComponent(content)) {
            components.push({
              name: item.replace(/\.(jsx?|tsx?)$/, ''),
              type: this.getComponentType(content),
              path: path.relative(this.rootPath, itemPath)
            });
          }
        }
      }
    } catch (error) {
      // Directory read error
    }
    
    return components;
  }

  findCustomHooks(rootPath) {
    const hooks = [];
    const searchDirs = [
      path.join(rootPath, 'frontend', 'shared', 'hooks'),
      path.join(rootPath, 'src', 'hooks'),
      path.join(rootPath, 'hooks')
    ];
    
    searchDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        try {
          const items = fs.readdirSync(dir);
          items.forEach(item => {
            if (item.match(/^use[A-Z].*\.(js|ts)$/)) {
              hooks.push({
                name: item.replace(/\.(js|ts)$/, ''),
                path: path.relative(rootPath, path.join(dir, item))
              });
            }
          });
        } catch (error) {
          // Directory read error
        }
      }
    });
    
    return hooks;
  }

  isReactComponent(content) {
    return (content.includes('export default') || content.includes('export const')) &&
           content.includes('return') &&
           (content.includes('<') || content.includes('jsx'));
  }

  getComponentType(content) {
    if (content.includes('useState') || content.includes('useEffect')) return 'Functional (Hooks)';
    if (content.includes('function') && content.includes('return')) return 'Functional';
    if (content.includes('class') && content.includes('render')) return 'Class';
    return 'Component';
  }

  analyzeConfiguration() {
    console.log('⚙️  Analyzing configuration...');
    
    const configs = {};
    const configFiles = [
      'package.json',
      'amplify.yml', 
      'vite.config.js',
      'tailwind.config.js'
    ];
    
    configFiles.forEach(configFile => {
      const filePath = path.join(this.rootPath, configFile);
      if (fs.existsSync(filePath)) {
        configs[configFile] = this.analyzeConfigFile(filePath, configFile);
      }
    });
    
    this.docs.configuration = configs;
  }

  analyzeConfigFile(filePath, filename) {
    try {
      if (filename === 'package.json') {
        const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          name: pkg.name,
          scripts: Object.keys(pkg.scripts || {}),
          dependencies: Object.keys(pkg.dependencies || {}).length,
          devDependencies: Object.keys(pkg.devDependencies || {}).length
        };
      }
      
      return { exists: true, analyzed: false };
    } catch (error) {
      return { exists: true, error: 'Parse error' };
    }
  }

  generateSetupGuide() {
    const packageJsonPath = this.findPackageJson();
    let scripts = [];
    
    if (packageJsonPath) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        scripts = Object.keys(pkg.scripts || {});
      } catch (error) {
        // Package.json parse error
      }
    }
    
    this.docs.setup = {
      prerequisites: this.getPrerequisites(),
      installation: this.getInstallationSteps(),
      development: this.getDevelopmentSteps(scripts),
      deployment: this.getDeploymentSteps()
    };
  }

  getPrerequisites() {
    const prereqs = ['Node.js 18+', 'npm or yarn'];
    
    if (this.docs.overview.deployment === 'AWS Amplify') {
      prereqs.push('AWS CLI', 'Amplify CLI');
    }
    
    return prereqs;
  }

  getInstallationSteps() {
    const steps = [
      'Clone the repository',
      'npm install'
    ];
    
    if (fs.existsSync(path.join(this.rootPath, 'frontend', 'package.json'))) {
      steps.push('cd frontend && npm install');
    }
    
    if (fs.existsSync(path.join(this.rootPath, 'backend', 'package.json'))) {
      steps.push('cd backend && npm install');
    }
    
    return steps;
  }

  getDevelopmentSteps(scripts) {
    const steps = [];
    
    if (scripts.includes('dev')) steps.push('npm run dev');
    else if (scripts.includes('start')) steps.push('npm start');
    else steps.push('Check package.json for available scripts');
    
    return steps;
  }

  getDeploymentSteps() {
    if (this.docs.overview.deployment === 'AWS Amplify') {
      return ['amplify init', 'amplify push'];
    }
    
    return ['Check deployment configuration'];
  }

  findPackageJson() {
    const locations = [
      path.join(this.rootPath, 'package.json'),
      path.join(this.rootPath, 'frontend', 'package.json')
    ];
    
    return locations.find(loc => fs.existsSync(loc));
  }

  getLastModified() {
    try {
      const packageJsonPath = this.findPackageJson();
      if (packageJsonPath) {
        const stat = fs.statSync(packageJsonPath);
        return stat.mtime.toLocaleDateString();
      }
    } catch (error) {
      // Stat error
    }
    return 'Unknown';
  }

  generateMarkdown() {
    const componentCount = this.docs.components.shared.length;
    const hookCount = this.docs.components.hooks.length;
    
    const markdown = `# FILO Health Platform - Developer Setup Guide

## Project Overview

**Type:** ${this.docs.overview.type}  
**Framework:** ${this.docs.overview.framework}  
**Deployment:** ${this.docs.overview.deployment}  
**Last Modified:** ${this.docs.overview.lastModified}

## Quick Start

### Prerequisites
${this.docs.setup.prerequisites.map(req => `- ${req}`).join('\n')}

### Installation
\`\`\`bash
${this.docs.setup.installation.map(step => step.startsWith('npm') || step.startsWith('cd') ? step : `# ${step}`).join('\n')}
\`\`\`

### Development
\`\`\`bash
${this.docs.setup.development.join('\n')}
\`\`\`

## Project Structure

\`\`\`
${this.generateStructureTree()}
\`\`\`

## Key Components

### Shared Components (${componentCount})
${componentCount > 0 ? this.docs.components.shared.map(comp => 
  `- **${comp.name}** (${comp.type}) - \`${comp.path}\``
).join('\n') : 'No shared components found'}

### Custom Hooks (${hookCount})
${hookCount > 0 ? this.docs.components.hooks.map(hook => 
  `- **${hook.name}** - \`${hook.path}\``
).join('\n') : 'No custom hooks found'}

## Configuration Files

${Object.keys(this.docs.configuration || {}).map(config => {
  const configData = this.docs.configuration[config];
  return `### ${config}
${configData.name ? `- **Name:** ${configData.name}` : ''}
${configData.scripts ? `- **Scripts:** ${configData.scripts.join(', ')}` : ''}
${configData.dependencies ? `- **Dependencies:** ${configData.dependencies}` : ''}
${configData.devDependencies ? `- **Dev Dependencies:** ${configData.devDependencies}` : ''}
`;
}).join('\n')}

## Development Workflow

1. **Make changes** to components in \`frontend/shared/\` or main app
2. **Test locally** with \`npm run dev\`
3. **Commit changes** following conventional commits
4. **Deploy** ${this.docs.overview.deployment === 'AWS Amplify' ? 'automatically via Amplify' : 'using deployment scripts'}

## API Integration

The frontend connects to: \`https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev\`

See \`API_DEVELOPER_GUIDE.md\` for complete API documentation.

## Troubleshooting

### Common Issues
- **Build errors:** Check Node.js version (requires 18+)
- **API errors:** Verify base URL and network connection  
- **Component issues:** Check import paths and dependencies

### Getting Help
- Check console for error messages
- Verify all dependencies are installed
- Ensure environment variables are set correctly

---
*Generated on ${new Date().toLocaleDateString()} for developer onboarding*
`;

    // Save files
    fs.writeFileSync('DEVELOPER_SETUP_GUIDE.md', markdown);
    fs.writeFileSync('codebase-summary.json', JSON.stringify(this.docs, null, 2));
    
    console.log('📝 Generated files:');
    console.log('   - DEVELOPER_SETUP_GUIDE.md (Setup guide)');
    console.log('   - codebase-summary.json (Structured data)');
  }

  generateStructureTree() {
    const tree = [];
    Object.keys(this.docs.structure).forEach(dir => {
      const data = this.docs.structure[dir];
      if (data.exists) {
        tree.push(`${dir}/                 # ${data.purpose}`);
        if (data.files && data.files.length > 0) {
          data.files.slice(0, 5).forEach(file => { // Show max 5 files
            tree.push(`├── ${file.name}${file.purpose ? `    # ${file.purpose}` : ''}`);
          });
          if (data.files.length > 5) {
            tree.push(`├── ... and ${data.files.length - 5} more files`);
          }
        }
      }
    });
    return tree.join('\n');
  }
}

// CLI execution
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const generator = new DeveloperCodebaseDocGenerator(projectPath);
  generator.generateDocs();
}

module.exports = DeveloperCodebaseDocGenerator;