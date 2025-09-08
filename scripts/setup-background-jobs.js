#!/usr/bin/env node

/**
 * Background Job Scheduler Setup
 * 
 * This script sets up background jobs for credit management and task processing.
 * It can be run with a cron job scheduler like GitHub Actions, Vercel Cron, or a VPS.
 */

const fetch = require('node-fetch');

// Configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  backgroundJobToken: process.env.BACKGROUND_JOB_TOKEN,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
};

// Job definitions
const jobs = [
  {
    name: 'process-enhancement-tasks',
    schedule: '*/2 * * * *', // Every 2 minutes
    endpoint: '/api/background/process-tasks',
    description: 'Process pending enhancement tasks'
  },
  {
    name: 'check-credit-thresholds',
    schedule: '*/15 * * * *', // Every 15 minutes
    endpoint: '/api/admin/check-thresholds',
    description: 'Check credit thresholds and send alerts'
  },
  {
    name: 'daily-usage-summary',
    schedule: '0 1 * * *', // 1 AM daily
    endpoint: '/api/admin/daily-summary',
    description: 'Generate daily usage summary'
  },
  {
    name: 'monthly-credit-reset',
    schedule: '0 0 1 * *', // First day of each month
    endpoint: '/api/admin/reset-monthly-credits',
    description: 'Reset monthly credit allocations'
  }
];

/**
 * Execute a background job
 */
async function executeJob(job) {
  try {
    console.log(`Executing job: ${job.name}`);
    
    const response = await fetch(`${config.baseUrl}${job.endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.backgroundJobToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Job ${job.name} completed:`, result.message);
    } else {
      const error = await response.text();
      console.error(`❌ Job ${job.name} failed:`, error);
    }
  } catch (error) {
    console.error(`❌ Job ${job.name} error:`, error.message);
  }
}

/**
 * Run all jobs (for manual execution)
 */
async function runAllJobs() {
  console.log('🚀 Starting background job execution...');
  
  for (const job of jobs) {
    await executeJob(job);
    // Wait 1 second between jobs to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ All jobs completed');
}

/**
 * Run a specific job by name
 */
async function runJob(jobName) {
  const job = jobs.find(j => j.name === jobName);
  if (!job) {
    console.error(`Job not found: ${jobName}`);
    process.exit(1);
  }
  
  await executeJob(job);
}

/**
 * Health check
 */
async function healthCheck() {
  try {
    const response = await fetch(`${config.baseUrl}/api/background/process-tasks`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Health check passed:', result.message);
    } else {
      console.error('❌ Health check failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];
const jobName = process.argv[3];

switch (command) {
  case 'run-all':
    runAllJobs();
    break;
  case 'run':
    if (!jobName) {
      console.error('Job name required. Usage: node setup-background-jobs.js run <job-name>');
      process.exit(1);
    }
    runJob(jobName);
    break;
  case 'health':
    healthCheck();
    break;
  case 'list':
    console.log('Available jobs:');
    jobs.forEach(job => {
      console.log(`  - ${job.name}: ${job.description} (${job.schedule})`);
    });
    break;
  default:
    console.log(`
Background Job Scheduler

Usage:
  node setup-background-jobs.js <command> [options]

Commands:
  run-all                    Run all background jobs
  run <job-name>            Run a specific job
  health                    Check if the system is healthy
  list                     List all available jobs

Examples:
  node setup-background-jobs.js run-all
  node setup-background-jobs.js run process-enhancement-tasks
  node setup-background-jobs.js health
  node setup-background-jobs.js list

Cron Setup:
  # Add to your crontab for every 2 minutes
  */2 * * * * cd /path/to/project && node scripts/setup-background-jobs.js run process-enhancement-tasks

  # Or use GitHub Actions, Vercel Cron, or similar services
`);
    break;
}

module.exports = {
  executeJob,
  runAllJobs,
  runJob,
  healthCheck,
  jobs
};
