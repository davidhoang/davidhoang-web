#!/usr/bin/env node

/**
 * Test script for the AI Bio Summary API endpoint
 * 
 * Usage:
 *   node scripts/test-bio-summary.js [status|generate]
 * 
 * Examples:
 *   node scripts/test-bio-summary.js status
 *   node scripts/test-bio-summary.js generate
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env file manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  // .env file doesn't exist or can't be read, that's okay
}

const command = process.argv[2] || 'status';
const baseUrl = process.env.API_URL || 'http://localhost:4321';
const secret = process.env.BIO_UPDATE_SECRET;

async function checkStatus() {
  console.log('📊 Checking AI Summary status...\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/generate-bio-summary`);
    const data = await response.json();
    
    if (data.exists) {
      console.log('✅ AI Summary exists');
      console.log(`   Last updated: ${data.lastUpdated || 'Unknown'}`);
      console.log(`   Content length: ${data.contentLength} characters`);
    } else {
      console.log('❌ AI Summary not yet generated');
      console.log('   Run "generate" command to create it');
    }
  } catch (error) {
    console.error('❌ Error checking status:', error.message);
    console.log('\n💡 Make sure the dev server is running: npm run dev');
  }
}

async function generateSummary() {
  console.log('🤖 Generating AI Summary...\n');
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (secret) {
    headers['Authorization'] = `Bearer ${secret}`;
    console.log('🔐 Using authentication token');
  } else {
    console.log('⚠️  No BIO_UPDATE_SECRET set - endpoint may be unprotected');
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/generate-bio-summary`, {
      method: 'POST',
      headers
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ AI Summary generated successfully!');
      console.log(`   Last updated: ${data.lastUpdated}`);
      console.log('\n💡 Refresh your about page to see the new AI Summary');
    } else {
      console.error('❌ Error generating summary:', data.error || data.message);
      if (data.message) {
        console.error('   Details:', data.message);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Dev server is running: npm run dev');
    console.log('   2. API keys are set in .env file');
    console.log('   3. You have OPENAI_API_KEY or ANTHROPIC_API_KEY configured');
  }
}

// Main
console.log('🎯 AI Bio Summary Test Script\n');

if (command === 'status') {
  checkStatus();
} else if (command === 'generate') {
  generateSummary();
} else {
  console.log('Usage: node scripts/test-bio-summary.js [status|generate]');
  console.log('\nCommands:');
  console.log('  status    - Check if AI summary exists');
  console.log('  generate  - Generate/update AI summary');
  process.exit(1);
}

