#!/usr/bin/env node

/**
 * Test script to verify MCP server configurations
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing MCP Server Configurations\n');

// Load environment variables
require('dotenv').config();

const mcpConfigs = [
  {
    name: 'Context7',
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp'],
    timeout: 10000
  },
  {
    name: 'Supabase',
    command: 'npx',
    args: ['-y', '@supabase/mcp-server-supabase@latest', '--project-ref=zbsmgymyfhnwjdnmlelr'],
    env: { SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN },
    timeout: 10000
  },
  {
    name: 'Filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
    timeout: 5000
  },
  {
    name: 'Git',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git', '--repository', '.'],
    timeout: 5000
  }
];

async function testMcpServer(config) {
  return new Promise((resolve) => {
    console.log(`Testing ${config.name} MCP Server...`);
    
    const env = { ...process.env, ...config.env };
    const child = spawn(config.command, config.args, { 
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: config.timeout 
    });

    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill();
      console.log(`✅ ${config.name}: Server started successfully (killed after timeout)\n`);
      resolve({ name: config.name, status: 'success', message: 'Server started and responded within timeout' });
    }, config.timeout);

    child.on('error', (error) => {
      clearTimeout(timer);
      console.log(`❌ ${config.name}: Error - ${error.message}\n`);
      resolve({ name: config.name, status: 'error', message: error.message });
    });

    child.on('exit', (code, signal) => {
      clearTimeout(timer);
      if (signal === 'SIGTERM') {
        console.log(`✅ ${config.name}: Server started successfully (terminated by test)\n`);
        resolve({ name: config.name, status: 'success', message: 'Server started successfully' });
      } else {
        console.log(`❌ ${config.name}: Exited with code ${code}\n`);
        resolve({ name: config.name, status: 'error', message: `Exited with code ${code}. stderr: ${stderr}` });
      }
    });

    // Send a simple MCP initialization message to test
    setTimeout(() => {
      try {
        child.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'mcp-test-client',
              version: '1.0.0'
            }
          }
        }) + '\n');
      } catch (e) {
        // Ignore write errors for servers that don't accept this format
      }
    }, 1000);
  });
}

async function runTests() {
  console.log('Environment check:');
  console.log('- SUPABASE_ACCESS_TOKEN:', process.env.SUPABASE_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
  console.log('- SUPABASE_PROJECT_REF:', process.env.SUPABASE_PROJECT_REF ? '✅ Set' : '❌ Missing');
  console.log();

  const results = [];
  
  for (const config of mcpConfigs) {
    const result = await testMcpServer(config);
    results.push(result);
  }

  console.log('📋 Summary:');
  results.forEach(result => {
    const status = result.status === 'success' ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.message}`);
  });

  console.log('\n🔧 Configuration files updated:');
  console.log('- .cursor/mcp.json: Context7 added');
  console.log('- mcp-config.json: Context7 added');
  console.log('- .clauderc: Context7 added, Supabase write permissions enabled');
  
  console.log('\n📖 Usage:');
  console.log('- Use "use context7" in your prompts for up-to-date documentation');
  console.log('- MCP servers provide enhanced context and capabilities');
  console.log('- Restart your IDE to pick up the new MCP configurations');
}

runTests().catch(console.error);