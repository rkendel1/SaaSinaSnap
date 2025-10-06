#!/usr/bin/env node

/**
 * Demo Environment Setup Script
 * Sets up instant demo environments for different platforms
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'instant-demo';
const platform = args.find(arg => arg.startsWith('--platform='))?.split('=')[1] || 'local';

console.log(`🌐 Setting up demo environment: ${mode} on ${platform}\n`);

/**
 * Setup local demo environment
 */
async function setupLocalDemo() {
  console.log('💻 Setting up local demo environment...');
  
  // Create demo configuration
  const demoConfig = {
    mode: mode,
    platform: 'local',
    baseUrl: 'http://127.0.0.1:32100',
    features: {
      authentication: true,
      platformOwner: true,
      creatorOnboarding: true,
      productManagement: true,
      subscriptionFlows: true,
      paymentProcessing: true
    },
    mockData: true,
    setupTime: new Date().toISOString()
  };
  
  // Create demo data directory
  const demoDir = path.join(process.cwd(), 'demo-data');
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(demoDir, 'config.json'),
    JSON.stringify(demoConfig, null, 2)
  );
  
  // Setup environment variables for demo
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  
  const demoVars = [
    'DEMO_MODE=true',
    'NEXT_PUBLIC_DEMO_MODE=true',
    'DEMO_DATA_ENABLED=true',
    'NEXT_PUBLIC_SITE_URL=http://127.0.0.1:32100',
    'PORT=32100'
  ];
  
  demoVars.forEach(varLine => {
    const [key] = varLine.split('=');
    if (!envContent.includes(key)) {
      envContent += `\n${varLine}`;
    }
  });
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Local demo environment configured');
  return demoConfig;
}

/**
 * Setup Codespaces demo environment
 */
async function setupCodespacesDemo() {
  console.log('☁️ Setting up Codespaces demo environment...');
  
  const demoConfig = {
    mode: mode,
    platform: 'codespaces',
    baseUrl: process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN 
      ? `https://${process.env.GITHUB_CODESPACE_NAME}-32100.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
      : 'http://127.0.0.1:32100',
    features: {
      authentication: true,
      platformOwner: true,
      creatorOnboarding: true,
      productManagement: true,
      subscriptionFlows: true,
      paymentProcessing: true
    },
    mockData: true,
    setupTime: new Date().toISOString()
  };
  
  // Create Codespaces-specific configuration
  const codespacesConfig = {
    "name": "Staryer Demo Environment",
    "image": "mcr.microsoft.com/devcontainers/javascript-node:18",
    "features": {
      "ghcr.io/devcontainers/features/github-cli:1": {}
    },
    "postCreateCommand": "npm ci && npm run dev",
    "forwardPorts": [32100],
    "portsAttributes": {
      "32100": {
        "label": "Staryer Demo",
        "onAutoForward": "openPreview"
      }
    }
  };
  
  // Create .devcontainer directory if it doesn't exist
  const devcontainerDir = path.join(process.cwd(), '.devcontainer');
  if (!fs.existsSync(devcontainerDir)) {
    fs.mkdirSync(devcontainerDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(devcontainerDir, 'devcontainer.json'),
    JSON.stringify(codespacesConfig, null, 2)
  );
  
  console.log('✅ Codespaces demo environment configured');
  return demoConfig;
}

/**
 * Setup Vercel demo environment
 */
async function setupVercelDemo() {
  console.log('🚀 Setting up Vercel demo environment...');
  
  const demoConfig = {
    mode: mode,
    platform: 'vercel',
    baseUrl: 'https://staryer-demo.vercel.app',
    features: {
      authentication: true,
      platformOwner: true,
      creatorOnboarding: true,
      productManagement: true,
      subscriptionFlows: true,
      paymentProcessing: true
    },
    mockData: true,
    setupTime: new Date().toISOString()
  };
  
  // Create Vercel configuration
  const vercelConfig = {
    "name": "staryer-demo",
    "version": 2,
    "builds": [
      {
        "src": "package.json",
        "use": "@vercel/next"
      }
    ],
    "env": {
      "NODE_ENV": "production",
      "DEMO_MODE": "true",
      "NEXT_PUBLIC_DEMO_MODE": "true"
    },
    "regions": ["iad1"]
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'vercel.json'),
    JSON.stringify(vercelConfig, null, 2)
  );
  
  // Create deployment script
  const deployScript = `#!/bin/bash
echo "🚀 Deploying to Vercel..."
npx vercel --prod --confirm
echo "✅ Deployment complete"
`;
  
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts', 'deploy-vercel-demo.sh'),
    deployScript
  );
  
  // Make deploy script executable
  fs.chmodSync(path.join(process.cwd(), 'scripts', 'deploy-vercel-demo.sh'), '755');
  
  console.log('✅ Vercel demo environment configured');
  return demoConfig;
}

/**
 * Setup fallback demo from last successful build
 */
async function setupFallbackDemo() {
  console.log('🔄 Setting up fallback demo environment...');
  
  // Check for last successful build artifacts
  const fallbackDir = path.join(process.cwd(), 'fallback-build');
  
  let demoConfig = {
    mode: 'fallback-demo',
    platform: platform,
    baseUrl: platform === 'vercel' ? 'https://staryer-fallback.vercel.app' : 'http://127.0.0.1:32100',
    features: {
      authentication: true,
      platformOwner: true,
      creatorOnboarding: true,
      productManagement: true,
      subscriptionFlows: true,
      paymentProcessing: true
    },
    mockData: true,
    fallback: true,
    setupTime: new Date().toISOString()
  };
  
  if (fs.existsSync(fallbackDir)) {
    console.log('📦 Found previous successful build');
    
    // Copy fallback build to current directory
    const copyCommand = `cp -r ${fallbackDir}/* .`;
    exec(copyCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error copying fallback build:', error);
      } else {
        console.log('✅ Fallback build restored');
      }
    });
  } else {
    console.log('⚠️ No fallback build found, using current build');
  }
  
  return demoConfig;
}

/**
 * Generate demo startup script
 */
function generateStartupScript(config) {
  const startupScript = `#!/bin/bash

echo "🚀 Starting Staryer Demo Environment"
echo "Mode: ${config.mode}"
echo "Platform: ${config.platform}"
echo "URL: ${config.baseUrl}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm ci
fi

# Setup environment
echo "⚙️ Setting up environment..."
if [ ! -f ".env.local" ]; then
  cp env.local.txt .env.local
fi

# Initialize demo data
echo "🎭 Initializing demo data..."
node scripts/initialize-demo-data.js

# Start the application
echo "🌐 Starting application..."
if [ "${config.platform}" = "vercel" ]; then
  echo "Vercel deployment configured - use 'npm run deploy' to deploy"
else
  echo "Starting local development server..."
  npm run dev
fi
`;

  fs.writeFileSync(
    path.join(process.cwd(), 'start-demo.sh'),
    startupScript
  );
  
  // Make script executable
  fs.chmodSync(path.join(process.cwd(), 'start-demo.sh'), '755');
  
  console.log('✅ Demo startup script created');
}

/**
 * Generate demo documentation
 */
function generateDemoDocumentation(config) {
  const documentation = `# 🌐 Staryer Demo Environment

## Configuration
- **Mode:** ${config.mode}
- **Platform:** ${config.platform}
- **Base URL:** ${config.baseUrl}
- **Setup Time:** ${config.setupTime}

## Available Features
${Object.entries(config.features)
  .map(([feature, enabled]) => `- ${enabled ? '✅' : '❌'} ${feature}`)
  .join('\n')}

## Quick Start

### Local Development
\`\`\`bash
# Start the demo environment
./start-demo.sh

# Or manually:
npm run dev
\`\`\`

### Access the Demo
- **Main Application:** ${config.baseUrl}
- **Platform Dashboard:** ${config.baseUrl}/dashboard
- **Creator Onboarding:** ${config.baseUrl}/onboarding
- **Authentication:** ${config.baseUrl}/auth

## Demo Credentials
- **Platform Owner:** owner@staryer.com / owner-password-123
- **Creator:** creator@staryer.com / creator-password-123
- **End User:** user@staryer.com / user-password-123

## Demo Features

### Platform Owner Dashboard
- Revenue analytics and metrics
- Creator management
- Platform configuration
- Usage tracking

### Creator Experience
- 7-step onboarding process
- Product and pricing setup
- Stripe Connect integration
- Brand customization
- White-label page creation

### End User Experience
- Subscription plan selection
- Payment processing
- Usage tracking
- Plan management

## Troubleshooting

### Port Issues
If port 32100 is in use, you can change it in \`.env.local\`:
\`\`\`
PORT=3000
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
\`\`\`

### Environment Variables
Copy \`env.local.txt\` to \`.env.local\` and update with your actual values for full functionality.

### Database Connection
The demo uses mock data by default. For full database functionality, configure Supabase credentials in \`.env.local\`.

## Support
For issues with the demo environment, check the logs or contact the development team.
`;

  fs.writeFileSync(
    path.join(process.cwd(), 'DEMO_GUIDE.md'),
    documentation
  );
  
  console.log('✅ Demo documentation generated');
}

/**
 * Main setup function
 */
async function main() {
  try {
    let config;
    
  
  switch (platform) {
    case 'local':
      config = await setupLocalDemo();
      break;
    case 'codespaces':
      config = await setupCodespacesDemo();
      break;
    case 'vercel':
      config = await setupVercelDemo();
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
    
    // Handle fallback mode
    if (mode === 'fallback-demo') {
      config = await setupFallbackDemo();
    }
    
    // Generate supporting files
    generateStartupScript(config);
    generateDemoDocumentation(config);
    
    console.log('\n✅ Demo environment setup completed successfully!');
    console.log(`🌐 Platform: ${config.platform}`);
    console.log(`🎯 Mode: ${config.mode}`);
    console.log(`🔗 URL: ${config.baseUrl}`);
    console.log('\n📖 See DEMO_GUIDE.md for detailed instructions');
    
  } catch (error) {
    console.error('❌ Demo environment setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  setupLocalDemo,
  setupCodespacesDemo,
  setupVercelDemo,
  setupFallbackDemo
};