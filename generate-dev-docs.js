#!/usr/bin/env node

const fs = require('fs');
const { spawn } = require('child_process');

class DeveloperDocsGenerator {
  constructor() {
    this.docs = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: 'generating'
    };
  }

  async generateAll() {
    console.log('📚 FILO Health Platform - Developer Documentation Generator');
    console.log('=======================================================\n');
    
    try {
      await this.generateAPIGuide();
      await this.generateCodebaseGuide();
      this.generateMasterIndex();
      this.cleanupOldFiles();
      
      console.log('\n✅ All documentation generated successfully!');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Documentation generation failed:', error.message);
      process.exit(1);
    }
  }

  async generateAPIGuide() {
    console.log('🌐 Generating API documentation...');
    
    // Run the API documentation generator
    await this.runGenerator('./dev-api-docs-generator.js');
    
    if (fs.existsSync('API_DEVELOPER_GUIDE.md')) {
      console.log('   ✅ API guide generated');
    } else {
      throw new Error('API guide generation failed');
    }
  }

  async generateCodebaseGuide() {
    console.log('📁 Generating codebase documentation...');
    
    // Run the codebase documentation generator
    await this.runGenerator('./dev-codebase-docs-generator.js');
    
    if (fs.existsSync('DEVELOPER_SETUP_GUIDE.md')) {
      console.log('   ✅ Setup guide generated');
    } else {
      throw new Error('Codebase guide generation failed');
    }
  }

  async runGenerator(scriptPath) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [scriptPath], { stdio: 'pipe' });
      
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Generator failed with code ${code}`));
        }
      });
    });
  }

  generateMasterIndex() {
    console.log('📋 Creating master documentation index...');
    
    const indexMarkdown = `# FILO Health Platform - Developer Documentation

Welcome to the FILO Health Platform developer documentation. This guide will help you get up and running quickly.

## 🚀 Quick Start

1. **[Setup Guide](./DEVELOPER_SETUP_GUIDE.md)** - Get the codebase running locally
2. **[API Guide](./API_DEVELOPER_GUIDE.md)** - Understand the API endpoints
3. **[Examples](#examples)** - Common development tasks

## 📖 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [Developer Setup Guide](./DEVELOPER_SETUP_GUIDE.md) | Project structure, installation, development workflow | New developers |
| [API Developer Guide](./API_DEVELOPER_GUIDE.md) | API endpoints, authentication, examples | Frontend/API developers |

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- AWS CLI (for deployment)

### Installation
\`\`\`bash
# Clone and install
git clone <repository-url>
cd health-platform
npm install

# Start development
npm run dev
\`\`\`

### API Testing
\`\`\`bash
# Test API connectivity
curl https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev/api/v1/protocols

# Search foods
curl "https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev/api/v1/foods/search?search=chicken"
\`\`\`

## Examples

### Common Development Tasks

#### Adding a New Component
1. Create component in \`frontend/shared/components/\`
2. Export from \`frontend/shared/index.js\`
3. Import and use in your application

#### Calling the API
\`\`\`javascript
const response = await fetch('/api/v1/protocols');
const protocols = await response.json();
\`\`\`

#### Using Shared Components
\`\`\`javascript
import { ProtocolCard, FoodSearch } from '../shared';
\`\`\`

## 🔧 Troubleshooting

### Build Issues
- Check Node.js version: \`node --version\` (requires 18+)
- Clear dependencies: \`rm -rf node_modules && npm install\`
- Check console for specific error messages

### API Issues  
- Verify network connectivity
- Check API base URL in configuration
- Use browser dev tools to inspect requests

### Component Issues
- Verify import paths
- Check component export syntax
- Ensure all dependencies are installed

## 🚀 Deployment

The platform uses AWS Amplify for deployment:

\`\`\`bash
amplify init
amplify push
\`\`\`

## 📊 Project Status

- **API Endpoints:** Working in development mode
- **Authentication:** Demo user (production JWT coming soon)  
- **Frontend:** React with shared component library
- **Deployment:** AWS Amplify

## 🆘 Getting Help

1. Check this documentation first
2. Look for console error messages
3. Verify your development environment setup
4. Check the troubleshooting section above

---

*Documentation generated on ${new Date().toLocaleDateString()}*

## File Structure

\`\`\`
docs/
├── README.md                    # This file
├── DEVELOPER_SETUP_GUIDE.md     # Codebase and setup guide  
├── API_DEVELOPER_GUIDE.md       # API documentation
├── api-docs.json               # Structured API data
└── codebase-summary.json       # Structured codebase data
\`\`\`
`;

    fs.writeFileSync('README.md', indexMarkdown);
    console.log('   ✅ Master index created');
  }

  cleanupOldFiles() {
    console.log('🧹 Cleaning up old documentation files...');
    
    const oldFiles = [
      'API_ANALYSIS_COMPLETE.json',
      'API_OPENAPI_SPEC.json', 
      'API_SUMMARY.json',
      'FILO_ANALYSIS_REPORT.json'
    ];
    
    let cleaned = 0;
    oldFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`   ✅ Removed ${cleaned} old files`);
    }
  }

  printSummary() {
    const files = [
      'README.md',
      'DEVELOPER_SETUP_GUIDE.md', 
      'API_DEVELOPER_GUIDE.md',
      'api-docs.json',
      'codebase-summary.json'
    ];
    
    console.log('\n📝 Generated Documentation Files:');
    console.log('=====================================');
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`✅ ${file.padEnd(30)} (${sizeKB}KB)`);
      } else {
        console.log(`❌ ${file.padEnd(30)} (missing)`);
      }
    });
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Share README.md with new developers');
    console.log('2. Keep documentation updated as code changes');
    console.log('3. Run this generator periodically to refresh docs');
    
    console.log('\n📖 For new developers:');
    console.log('   Start with: README.md → DEVELOPER_SETUP_GUIDE.md → API_DEVELOPER_GUIDE.md');
  }
}

// Create the generator scripts in the current directory
function createGeneratorScripts() {
  // This would be handled by your build process or you can manually create the files
  console.log('📦 Ensure generator scripts are available:');
  console.log('   - dev-api-docs-generator.js');
  console.log('   - dev-codebase-docs-generator.js');
}

// CLI execution
if (require.main === module) {
  const generator = new DeveloperDocsGenerator();
  generator.generateAll().catch(console.error);
}

module.exports = DeveloperDocsGenerator;