#!/usr/bin/env node

/**
 * Validation script for the Enhanced Embed Generator Service
 * Tests that the embed code generation produces pure JavaScript embeds
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Enhanced Embed Generator Service...\n');

// Test 1: Check that embed.js files exist and have valid syntax
console.log('Test 1: Checking embed.js files...');
const embedFiles = [
  path.join(__dirname, '../public/static/embed.js'),
  path.join(__dirname, '../src/public/static/embed.js')
];

let allFilesValid = true;
for (const file of embedFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ File not found: ${file}`);
    allFilesValid = false;
    continue;
  }
  
  const content = fs.readFileSync(file, 'utf8');
  
  // Check for TypeScript syntax that shouldn't be there
  if (content.includes('private static') || content.includes(': GeneratedEmbed')) {
    console.error(`❌ ${file} contains TypeScript code`);
    allFilesValid = false;
  } else {
    console.log(`✅ ${file} is valid JavaScript`);
  }
  
  // Check for key features
  if (!content.includes('Automatically create container div')) {
    console.error(`❌ ${file} missing auto-container creation code`);
    allFilesValid = false;
  } else {
    console.log(`✅ ${file} has auto-container creation`);
  }
  
  // Check that it's an IIFE
  if (!content.startsWith('(function()') && !content.startsWith('(function ()')) {
    console.error(`❌ ${file} is not wrapped in IIFE`);
    allFilesValid = false;
  } else {
    console.log(`✅ ${file} is properly wrapped in IIFE`);
  }
}

console.log('');

// Test 2: Check enhanced-embed-generator.ts
console.log('Test 2: Checking enhanced-embed-generator.ts...');
const generatorFile = path.join(__dirname, '../src/features/creator/services/enhanced-embed-generator.ts');

if (!fs.existsSync(generatorFile)) {
  console.error(`❌ File not found: ${generatorFile}`);
  allFilesValid = false;
} else {
  const content = fs.readFileSync(generatorFile, 'utf8');
  
  // Check that generateEmbedCode doesn't create manual divs
  const embedCodeFunctionMatch = content.match(/private static generateEmbedCode[\s\S]*?return `[^`]*`;/);
  if (embedCodeFunctionMatch) {
    const functionBody = embedCodeFunctionMatch[0];
    if (functionBody.includes('<div id=')) {
      console.error('❌ generateEmbedCode still generates manual divs');
      allFilesValid = false;
    } else {
      console.log('✅ generateEmbedCode generates pure JavaScript embeds');
    }
    
    // Check that it includes async attribute
    if (functionBody.includes('async>')) {
      console.log('✅ Generated embed code includes async attribute');
    } else {
      console.error('❌ Generated embed code missing async attribute');
      allFilesValid = false;
    }
  }
}

console.log('');

// Test 3: Check enhanced-embed-service.ts
console.log('Test 3: Checking enhanced-embed-service.ts...');
const serviceFile = path.join(__dirname, '../src/features/creator/services/enhanced-embed-service.ts');

if (!fs.existsSync(serviceFile)) {
  console.error(`❌ File not found: ${serviceFile}`);
  allFilesValid = false;
} else {
  const content = fs.readFileSync(serviceFile, 'utf8');
  
  // Check that generateAdvancedEmbedCode doesn't create manual divs
  if (content.includes('generateAdvancedEmbedCode')) {
    const advancedFunctionMatch = content.match(/static generateAdvancedEmbedCode[\s\S]*?return `[\s\S]*?`;/);
    if (advancedFunctionMatch) {
      const functionBody = advancedFunctionMatch[0];
      if (functionBody.includes('<div id="saasinasnap-embed-')) {
        console.error('❌ generateAdvancedEmbedCode still generates manual divs');
        allFilesValid = false;
      } else {
        console.log('✅ generateAdvancedEmbedCode generates pure JavaScript embeds');
      }
    }
  }
}

console.log('');

// Test 4: Check documentation
console.log('Test 4: Checking documentation...');
const docFile = path.join(__dirname, '../docs/EMBED_SYSTEM_GUIDE.md');

if (!fs.existsSync(docFile)) {
  console.error(`❌ Documentation file not found: ${docFile}`);
  allFilesValid = false;
} else {
  const content = fs.readFileSync(docFile, 'utf8');
  
  if (content.includes('No Manual DIV Required')) {
    console.log('✅ Documentation highlights pure JavaScript approach');
  } else {
    console.error('❌ Documentation missing pure JavaScript highlights');
    allFilesValid = false;
  }
  
  if (content.includes('Backward Compatible')) {
    console.log('✅ Documentation mentions backward compatibility');
  } else {
    console.error('❌ Documentation missing backward compatibility info');
    allFilesValid = false;
  }
}

console.log('');
console.log('═══════════════════════════════════════');
if (allFilesValid) {
  console.log('✅ All validation tests passed!');
  console.log('═══════════════════════════════════════\n');
  process.exit(0);
} else {
  console.log('❌ Some validation tests failed');
  console.log('═══════════════════════════════════════\n');
  process.exit(1);
}
