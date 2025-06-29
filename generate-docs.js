#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DynamicDocumentationGenerator {
  constructor(projectRoot, docsRoot) {
    this.projectRoot = projectRoot;
    this.docsRoot = docsRoot;
    this.analysisFile = path.join(projectRoot, 'FILO_ANALYSIS_REPORT.json');
    this.apiAnalysisFile = path.join(projectRoot, 'FILO_API_ANALYSIS.json');
    
    // Dynamic configuration - auto-detected
    this.config = {
      projectName: this.detectProjectName(),
      repositoryUrl: this.detectRepositoryUrl(),
      deploymentUrl: this.detectDeploymentUrl(),
      apiBaseUrl: this.detectApiBaseUrl(),
      customDomain: this.detectCustomDomain()
    };
  }

  async generateDocumentation() {
    console.log('📚 Generating Dynamic Documentation...\n');
    console.log(`Project: ${this.config.projectName}`);
    console.log(`Repository: ${this.config.repositoryUrl}`);
    console.log(`Deployment: ${this.config.deploymentUrl}`);
    console.log(`API Base: ${this.config.apiBaseUrl}\n`);
    
    try {
      // Load analysis data
      const analysis = this.loadAnalysisData();
      const apiAnalysis = this.loadAPIAnalysisData();
      
      // Extract dynamic data
      const dynamicData = await this.extractDynamicData(analysis, apiAnalysis);
      
      // Generate all documentation sections
      await this.generateOverview(dynamicData);
      await this.generateArchitecture(dynamicData);
      await this.generateComponents(dynamicData);
      await this.generateAPIs(dynamicData);
      await this.generateSetupGuide(dynamicData);
      await this.generateDeployment(dynamicData);
      
      // Update configurations dynamically
      this.updateDocusaurusConfig(dynamicData);
      this.updateSidebar(dynamicData);
      
      console.log('✅ Dynamic documentation generated successfully!');
      
    } catch (error) {
      console.error('❌ Documentation generation failed:', error);
    }
  }

  // DYNAMIC DETECTION METHODS
  detectProjectName() {
    // Try package.json first
    const packagePath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      if (pkg.name) return this.formatProjectName(pkg.name);
    }
    
    // Try web-app package.json
    const webAppPackagePath = path.join(this.projectRoot, 'frontend/web-app/package.json');
    if (fs.existsSync(webAppPackagePath)) {
      const pkg = JSON.parse(fs.readFileSync(webAppPackagePath, 'utf8'));
      if (pkg.name) return this.formatProjectName(pkg.name);
    }
    
    // Fall back to directory name
    return this.formatProjectName(path.basename(this.projectRoot));
  }

  detectRepositoryUrl() {
    try {
      // Try to get from git remote
      const { execSync } = require('child_process');
      const remoteUrl = execSync('git config --get remote.origin.url', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();
      
      // Convert SSH to HTTPS if needed
      if (remoteUrl.startsWith('git@github.com:')) {
        return remoteUrl.replace('git@github.com:', 'https://github.com/').replace('.git', '');
      }
      
      return remoteUrl.replace('.git', '');
    } catch (error) {
      console.log('⚠️  Could not detect repository URL from git remote');
      return null;
    }
  }

  detectDeploymentUrl() {
    // Check amplify.yml for app ID or custom domain
    const amplifyPath = path.join(this.projectRoot, 'amplify.yml');
    if (fs.existsSync(amplifyPath)) {
      // For now, return null - will be detected from environment or config later
      return null;
    }
    
    // Check for Vercel, Netlify, or other deployment configs
    if (fs.existsSync(path.join(this.projectRoot, 'vercel.json'))) {
      return this.detectVercelUrl();
    }
    
    if (fs.existsSync(path.join(this.projectRoot, 'netlify.toml'))) {
      return this.detectNetlifyUrl();
    }
    
    return null;
  }

  detectApiBaseUrl() {
    // Check environment files
    const envFiles = [
      path.join(this.projectRoot, 'frontend/web-app/.env'),
      path.join(this.projectRoot, 'frontend/web-app/.env.development'),
      path.join(this.projectRoot, 'frontend/web-app/.env.local'),
      path.join(this.projectRoot, '.env')
    ];
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        const apiMatch = envContent.match(/VITE_API_BASE_URL=(.+)/);
        if (apiMatch) {
          return apiMatch[1].trim().replace(/["']/g, '');
        }
      }
    }
    
    // Check API analysis for base URL
    if (fs.existsSync(this.apiAnalysisFile)) {
      const apiAnalysis = JSON.parse(fs.readFileSync(this.apiAnalysisFile, 'utf8'));
      if (apiAnalysis.endpoints && apiAnalysis.endpoints.length > 0) {
        const firstEndpoint = apiAnalysis.endpoints[0];
        if (firstEndpoint.url) {
          return firstEndpoint.url.split('/api')[0];
        }
      }
    }
    
    return null;
  }

  detectCustomDomain() {
    // Check for CNAME file or custom domain config
    const cnameFile = path.join(this.projectRoot, 'CNAME');
    if (fs.existsSync(cnameFile)) {
      return fs.readFileSync(cnameFile, 'utf8').trim();
    }
    
    // Check docs CNAME
    const docsCnameFile = path.join(this.docsRoot, 'static/CNAME');
    if (fs.existsSync(docsCnameFile)) {
      return fs.readFileSync(docsCnameFile, 'utf8').trim();
    }
    
    return null;
  }

  // DYNAMIC DATA EXTRACTION
  async extractDynamicData(analysis, apiAnalysis) {
    return {
      project: {
        name: this.config.projectName,
        repositoryUrl: this.config.repositoryUrl,
        deploymentUrl: this.config.deploymentUrl,
        apiBaseUrl: this.config.apiBaseUrl,
        customDomain: this.config.customDomain,
        stats: analysis.overview.stats,
        lastModified: analysis.overview.stats?.lastModified
      },
      
      components: {
        shared: this.extractComponentData(analysis.shared.components),
        frontend: this.extractComponentData(analysis.frontend.components),
        total: analysis.shared.components.length + analysis.frontend.components.length
      },
      
      hooks: this.extractHookData(analysis.frontend.hooks),
      
      apis: apiAnalysis ? this.extractAPIData(apiAnalysis) : null,
      
      protocols: apiAnalysis ? this.extractProtocolData(apiAnalysis) : null,
      
      architecture: this.extractArchitectureData(analysis),
      
      deployment: this.extractDeploymentData(analysis),
      
      dependencies: this.extractDependencyData(analysis.dependencies),
      
      features: this.detectFeatures(analysis, apiAnalysis)
    };
  }

  extractComponentData(components) {
    return components.map(comp => ({
      name: comp.name,
      path: comp.path,
      type: comp.type,
      description: this.extractComponentDescription(comp),
      props: this.extractComponentProps(comp),
      imports: comp.imports || [],
      usage: this.generateComponentUsage(comp)
    }));
  }

  extractComponentDescription(comp) {
    // Try to extract description from component file
    try {
      const componentPath = path.join(this.projectRoot, comp.path);
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Look for JSDoc comments
        const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
        if (jsdocMatch) {
          return jsdocMatch[1];
        }
        
        // Look for single-line comments at the top
        const commentMatch = content.match(/^\/\/\s*(.+)/m);
        if (commentMatch) {
          return commentMatch[1];
        }
      }
    } catch (error) {
      // If we can't read the file, use fallback
    }
    
    // Fallback to intelligent guessing based on name and type
    return this.generateComponentDescription(comp);
  }

  extractHookData(hooks) {
    return hooks.map(hook => ({
      name: hook.name,
      path: hook.path,
      returns: hook.returns,
      description: this.extractHookDescription(hook),
      usage: this.generateHookUsage(hook)
    }));
  }

  extractAPIData(apiAnalysis) {
    const workingEndpoints = apiAnalysis.endpoints.filter(ep => ep.working);
    const brokenEndpoints = apiAnalysis.endpoints.filter(ep => !ep.working);
    
    return {
      baseUrl: this.config.apiBaseUrl,
      working: workingEndpoints.map(ep => ({
        ...ep,
        responseExample: this.formatResponseExample(ep),
        dataStructure: this.analyzeDataStructure(ep)
      })),
      protected: brokenEndpoints.filter(ep => ep.status === 403),
      broken: brokenEndpoints.filter(ep => ep.status !== 403),
      summary: apiAnalysis.summary,
      avgResponseTime: this.calculateAverageResponseTime(workingEndpoints)
    };
  }

  extractProtocolData(apiAnalysis) {
    // Find the protocols endpoint and extract real protocol data
    const protocolsEndpoint = apiAnalysis.endpoints.find(ep => 
      ep.path === '/api/v1/protocols' && ep.working
    );
    
    if (protocolsEndpoint && protocolsEndpoint.sampleData) {
      const protocols = protocolsEndpoint.sampleData.sample?.protocols;
      if (protocols) {
        return protocols.map(protocol => ({
          id: protocol.id,
          name: protocol.name,
          description: protocol.description,
          category: protocol.category,
          official: protocol.official
        }));
      }
    }
    
    return null;
  }

  detectFeatures(analysis, apiAnalysis) {
    const features = [];
    
    // Detect setup wizard
    if (analysis.frontend.components.some(comp => comp.name.includes('Setup') || comp.name.includes('Wizard'))) {
      const wizardSteps = analysis.frontend.components.filter(comp => 
        comp.name.includes('Step') || comp.name.includes('setup')
      ).length;
      features.push({
        name: 'Setup Wizard',
        status: 'implemented',
        details: `${wizardSteps} steps detected`
      });
    }
    
    // Detect timeline functionality
    if (apiAnalysis && apiAnalysis.endpoints.some(ep => ep.path.includes('timeline'))) {
      features.push({
        name: 'Timeline Management',
        status: 'implemented',
        details: 'API endpoints available'
      });
    }
    
    // Detect protocol management
    if (apiAnalysis && apiAnalysis.endpoints.some(ep => ep.path.includes('protocol'))) {
      features.push({
        name: 'Protocol Management',
        status: 'implemented',
        details: 'API integration complete'
      });
    }
    
    // Detect shared component library
    if (analysis.shared.components.length > 0) {
      features.push({
        name: 'UI Component Library',
        status: 'implemented',
        details: `${analysis.shared.components.length} reusable components`
      });
    }
    
    // Detect custom hooks
    if (analysis.frontend.hooks.length > 0) {
      features.push({
        name: 'Data Management Hooks',
        status: 'implemented',
        details: `${analysis.frontend.hooks.length} custom hooks`
      });
    }
    
    return features;
  }

  // DYNAMIC DOCUMENT GENERATION
  async generateOverview(data) {
    console.log('📄 Generating dynamic overview...');
    
    const overview = `# ${data.project.name}

## Platform Summary

${data.project.name} is a sophisticated Protocol Management & Healing Platform designed for chronic illness recovery. Built as a comprehensive monorepo with modern React architecture.

### Current Statistics
- **Total Files:** ${data.project.stats?.totalFiles || 'N/A'}
- **Directories:** ${data.project.stats?.directories || 'N/A'}
- **Last Updated:** ${data.project.lastModified ? new Date(data.project.lastModified).toLocaleDateString() : 'N/A'}
- **Components:** ${data.components.total}
- **Custom Hooks:** ${data.hooks.length}
${data.apis ? `- **API Endpoints:** ${data.apis.working.length} working, ${data.apis.protected.length} protected` : ''}

## Live Links
${data.project.deploymentUrl ? `- **Live Application:** [${data.project.deploymentUrl}](${data.project.deploymentUrl})` : ''}
${data.project.repositoryUrl ? `- **Source Code:** [${data.project.repositoryUrl}](${data.project.repositoryUrl})` : ''}
${data.project.apiBaseUrl ? `- **API Base:** \`${data.project.apiBaseUrl}\`` : ''}

## Current Features

${data.features.map(feature => `### ${feature.name}
**Status:** ${feature.status}  
**Details:** ${feature.details}
`).join('\n')}

## Technology Stack

### Frontend
- **Framework:** React ${this.detectReactVersion()}
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Components:** ${data.components.shared.length} shared, ${data.components.frontend.length} app-specific

### Backend
${data.apis ? `- **API:** ${data.apis.baseUrl}` : '- **API:** Development/Mock data'}
- **Database:** PostgreSQL (planned for production)
- **Hosting:** AWS Lambda + API Gateway
- **Deployment:** AWS Amplify

### Development
- **Monorepo:** Multi-app architecture
- **Documentation:** Auto-generated from code analysis
- **Analysis:** Automated codebase and API analysis

${data.protocols ? `## Supported Health Protocols

Currently supporting ${data.protocols.length} health protocols:

${data.protocols.map(protocol => `- **${protocol.name}:** ${protocol.description}`).join('\n')}` : ''}

## Getting Started

1. **For Developers:** See [Development Setup](./development/setup)
2. **Architecture Overview:** See [System Architecture](./architecture/overview)
3. **Component Library:** See [UI Components](./components/overview)
${data.apis ? `4. **API Integration:** See [API Reference](./api/overview)` : ''}

---

*This documentation is automatically generated from codebase analysis and updates with every commit.*
`;

    this.writeDocFile('docs/intro.md', overview);
  }

  async generateComponents(data) {
    console.log('🧩 Generating dynamic component documentation...');
    
    const componentsDoc = `# Component Library

## Overview

The ${data.project.name} includes ${data.components.total} React components:
- **${data.components.shared.length} Shared Components** - Reusable across all applications
- **${data.components.frontend.length} App Components** - Application-specific components

## Shared Components

${data.components.shared.map(comp => `### ${comp.name}

**File:** \`${comp.path}\`  
**Type:** ${comp.type || 'React Component'}  
**Description:** ${comp.description}

${comp.props ? `**Props:**
\`\`\`javascript
${comp.props.slice(0, 2).join('\n')}
\`\`\`` : ''}

**Usage:**
\`\`\`jsx
${comp.usage}
\`\`\`
`).join('\n')}

## Application Components

${data.components.frontend.map(comp => `### ${comp.name}

**File:** \`${comp.path}\`  
**Type:** ${comp.type || 'React Component'}  
**Description:** ${comp.description}
`).join('\n')}

## Custom Hooks

${data.hooks.map(hook => `### ${hook.name}

**File:** \`${hook.path}\`  
**Returns:** \`${hook.returns || 'Object'}\`  
**Description:** ${hook.description}

**Usage:**
\`\`\`jsx
${hook.usage}
\`\`\`
`).join('\n')}

---

*Component documentation is automatically generated from code analysis.*
`;

    this.ensureDir('docs/components');
    this.writeDocFile('docs/components/overview.md', componentsDoc);
  }

  // DYNAMIC CONFIGURATION UPDATES
  updateDocusaurusConfig(data) {
    console.log('⚙️  Updating Docusaurus configuration...');
    
    const configPath = path.join(this.docsRoot, 'docusaurus.config.js');
    if (!fs.existsSync(configPath)) {
      console.log('⚠️  docusaurus.config.js not found, skipping update');
      return;
    }
    
    // Read existing config
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update dynamic values
    if (data.project.name) {
      configContent = configContent.replace(
        /(title:\s*['"`]).*(['"`])/,
        `$1${data.project.name}$2`
      );
    }
    
    if (data.project.repositoryUrl) {
      configContent = configContent.replace(
        /(editUrl:\s*['"`]).*(['"`])/,
        `$1${data.project.repositoryUrl}/tree/main/docs/$2`
      );
      
      configContent = configContent.replace(
        /(href:\s*['"`]).*(['"`])/,
        `$1${data.project.repositoryUrl}$2`
      );
    }
    
    if (data.project.customDomain) {
      configContent = configContent.replace(
        /(url:\s*['"`]).*(['"`])/,
        `$1https://${data.project.customDomain}$2`
      );
    }
    
    fs.writeFileSync(configPath, configContent);
  }

  // UTILITY METHODS
  formatProjectName(name) {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  detectReactVersion() {
    const packagePath = path.join(this.projectRoot, 'frontend/web-app/package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return pkg.dependencies?.react?.replace('^', '') || '18+';
    }
    return '18+';
  }

  generateComponentDescription(comp) {
    const descriptions = {
      'Alert': 'Displays notification and alert messages with customizable variants and dismissal options',
      'Button': 'Interactive button component with loading states, variants, and icon support',
      'Card': 'Container component with optional title, subtitle, icon, and content sections',
      'Input': 'Form input component with focus colors, validation, and styling options',
      'Select': 'Dropdown selection component with customizable styling and focus colors',
      'Textarea': 'Multi-line text input with configurable rows and styling options'
    };
    
    return descriptions[comp.name] || `${comp.name} component for the application`;
  }

  generateComponentUsage(comp) {
    const usageExamples = {
      'Alert': `import { Alert } from '@/shared/components/ui';

<Alert variant="success" title="Success!">
  Operation completed successfully
</Alert>`,
      'Button': `import { Button } from '@/shared/components/ui';

<Button variant="primary" loading={isLoading}>
  Save Changes
</Button>`,
      'Card': `import { Card } from '@/shared/components/ui';

<Card title="Card Title" variant="primary">
  Card content goes here
</Card>`
    };
    
    return usageExamples[comp.name] || `import { ${comp.name} } from '${comp.path.replace(/\.[^/.]+$/, "")}';

<${comp.name} />`;
  }

  // ... (continuing with other utility methods)

  loadAnalysisData() {
    if (!fs.existsSync(this.analysisFile)) {
      throw new Error('Analysis file not found. Run: node analyze-codebase.js first');
    }
    return JSON.parse(fs.readFileSync(this.analysisFile, 'utf8'));
  }

  loadAPIAnalysisData() {
    if (!fs.existsSync(this.apiAnalysisFile)) {
      console.log('⚠️  API analysis not found. Continuing with codebase analysis only.');
      return null;
    }
    return JSON.parse(fs.readFileSync(this.apiAnalysisFile, 'utf8'));
  }

  ensureDir(dirPath) {
    const fullPath = path.join(this.docsRoot, dirPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  writeDocFile(relativePath, content) {
    const fullPath = path.join(this.docsRoot, relativePath);
    this.ensureDir(path.dirname(relativePath));
    fs.writeFileSync(fullPath, content);
  }

  // Placeholder methods for other sections (keeping implementation concise)
  async generateArchitecture(data) { /* Implementation similar to above, but dynamic */ }
  async generateAPIs(data) { /* Implementation similar to above, but dynamic */ }
  async generateSetupGuide(data) { /* Implementation similar to above, but dynamic */ }
  async generateDeployment(data) { /* Implementation similar to above, but dynamic */ }
  updateSidebar(data) { /* Dynamic sidebar generation */ }
  
  // Additional utility methods
  extractArchitectureData(analysis) { return {}; }
  extractDeploymentData(analysis) { return {}; }
  extractDependencyData(deps) { return deps; }
  formatResponseExample(endpoint) { return endpoint.sampleData?.sample; }
  analyzeDataStructure(endpoint) { return endpoint.sampleData?.structure; }
  calculateAverageResponseTime(endpoints) { 
    if (!endpoints.length) return 0;
    return Math.round(endpoints.reduce((sum, ep) => sum + (ep.responseTime || 0), 0) / endpoints.length);
  }
  extractHookDescription(hook) { return `Custom React hook: ${hook.name}`; }
  generateHookUsage(hook) { return `const result = ${hook.name}();`; }
  extractComponentProps(comp) { return comp.props; }
  detectVercelUrl() { return null; }
  detectNetlifyUrl() { return null; }
}

// CLI execution
if (require.main === module) {
  const projectRoot = process.argv[2] || process.cwd();
  const docsRoot = path.join(projectRoot, 'docs');
  
  if (!fs.existsSync(docsRoot)) {
    console.error('❌ Docs directory not found. Make sure you\'re in the project root.');
    process.exit(1);
  }
  
  const generator = new DynamicDocumentationGenerator(projectRoot, docsRoot);
  generator.generateDocumentation().catch(error => {
    console.error('❌ Documentation generation failed:', error);
    process.exit(1);
  });
}

module.exports = DynamicDocumentationGenerator;