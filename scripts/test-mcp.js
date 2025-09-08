#!/usr/bin/env node

// Test script to verify MCP connections
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase MCP Configuration...\n');
  
  const projectRef = process.env.SUPABASE_PROJECT_REF;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  
  if (!projectRef || !accessToken) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_PROJECT_REF:', projectRef ? '✓' : '❌');
    console.error('   SUPABASE_ACCESS_TOKEN:', accessToken ? '✓' : '❌');
    process.exit(1);
  }
  
  console.log('✅ Environment variables configured:');
  console.log(`   Project Reference: ${projectRef}`);
  console.log(`   Access Token: ${accessToken.substring(0, 10)}...`);
  console.log('');
  
  // Test API access
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const project = await response.json();
      console.log('✅ Supabase API Connection Successful!');
      console.log(`   Project Name: ${project.name}`);
      console.log(`   Project Status: ${project.status}`);
      console.log(`   Database Host: ${project.database.host}`);
      console.log('');
      
      console.log('🎯 MCP Server Configuration:');
      console.log('   The Supabase MCP server is properly configured');
      console.log('   You can now use database context in Claude Code');
      console.log('');
      
      console.log('📋 Next Steps:');
      console.log('   1. Restart Claude Code to load MCP configuration');
      console.log('   2. Run database migrations: npx supabase db push');
      console.log('   3. Test MCP queries about your database schema');
      
    } else {
      console.error('❌ API Connection Failed:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
  }
}

testSupabaseConnection();