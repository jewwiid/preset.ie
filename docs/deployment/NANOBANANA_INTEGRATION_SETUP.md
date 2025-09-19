# NanoBanana API Integration Setup Guide

This guide will help you set up the complete NanoBanana API integration with credit management system.

## 🚀 Quick Start

### 1. Environment Variables

Copy the environment variables template and fill in your values:

```bash
cp env.example .env.local
```

Required variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NanoBanana API Configuration
NANOBANAN_API_KEY=your_nanobanan_api_key

# Background Job Configuration
BACKGROUND_JOB_TOKEN=your_secure_background_job_token
```

### 2. Database Migrations

Run the database migrations to set up the credit management system:

```bash
# Apply the credit management migration
npx supabase db push

# Or manually run the SQL files:
# - supabase/migrations/008_credit_management_system.sql
# - supabase/migrations/009_enhancement_tasks.sql
```

### 3. Install Dependencies

```bash
npm install
```

## 📋 Features Implemented

### ✅ Credit Management System
- **Hybrid Credit Model**: Platform pre-purchases credits + user allowances
- **Subscription Tiers**: Free (0), Plus (10), Pro (25) credits per month
- **Auto-refill**: Platform credits refill automatically when low
- **Real-time Tracking**: Monitor usage and costs in real-time

### ✅ NanoBanana API Integration
- **Async Task Processing**: Submit tasks and poll for completion
- **Proper API Endpoints**: Uses correct NanoBanana API endpoints
- **Error Handling**: Comprehensive error handling and retry logic
- **Cost Tracking**: Track costs per enhancement

### ✅ Fallback System
- **Multi-provider Support**: NanoBanana, FalAI, KieAI, Google Direct
- **Graceful Degradation**: CSS filters when AI services fail
- **Health Monitoring**: Track provider health and success rates

### ✅ Admin Dashboard
- **Credit Monitoring**: Real-time credit pool status
- **Usage Analytics**: Daily usage and cost tracking
- **Manual Controls**: Manual credit refills and overrides
- **Alert System**: Notifications for low credits and failures

## 🔧 API Endpoints

### Image Enhancement
```typescript
// Submit enhancement task
POST /api/enhance-image
{
  "inputImageUrl": "https://example.com/image.jpg",
  "enhancementType": "lighting", // lighting, style, background, mood, custom
  "prompt": "warm golden hour lighting",
  "strength": 0.8,
  "moodboardId": "optional-moodboard-id"
}

// Check task status
GET /api/enhance-image?taskId=task-id

// Get user's recent tasks
GET /api/enhance-image?limit=10
```

### Admin Endpoints
```typescript
// Get credit statistics
GET /api/admin/credit-stats

// Manually refill credits
POST /api/admin/refill-credits
{
  "provider": "nanobanan",
  "amount": 500
}

// Process background tasks
POST /api/background/process-tasks
```

## 🗄️ Database Schema

### Key Tables
- `credit_pools`: Platform credit pools per provider
- `user_credits`: User credit allocations and usage
- `credit_transactions`: Detailed transaction logging
- `enhancement_tasks`: Async task management
- `api_providers`: Provider configurations
- `system_alerts`: Alert and notification log

### Functions
- `consume_user_credits()`: Deduct user credits
- `consume_platform_credits()`: Use platform pool
- `refund_user_credits()`: Refund failed tasks

## ⚙️ Background Jobs

### Setup Cron Jobs
```bash
# Process enhancement tasks every 2 minutes
*/2 * * * * cd /path/to/project && node scripts/setup-background-jobs.js run process-enhancement-tasks

# Check credit thresholds every 15 minutes
*/15 * * * * cd /path/to/project && node scripts/setup-background-jobs.js run check-credit-thresholds

# Daily usage summary at 1 AM
0 1 * * * cd /path/to/project && node scripts/setup-background-jobs.js run daily-usage-summary

# Monthly credit reset on 1st of month
0 0 1 * * cd /path/to/project && node scripts/setup-background-jobs.js run monthly-credit-reset
```

### Manual Job Execution
```bash
# Run all jobs
node scripts/setup-background-jobs.js run-all

# Run specific job
node scripts/setup-background-jobs.js run process-enhancement-tasks

# Health check
node scripts/setup-background-jobs.js health

# List available jobs
node scripts/setup-background-jobs.js list
```

## 🎯 Usage Examples

### Frontend Integration
```typescript
// Submit enhancement request
const response = await fetch('/api/enhance-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inputImageUrl: 'https://example.com/image.jpg',
    enhancementType: 'lighting',
    prompt: 'warm golden hour lighting',
    strength: 0.8
  })
});

const { taskId } = await response.json();

// Poll for completion
const checkStatus = async () => {
  const statusResponse = await fetch(`/api/enhance-image?taskId=${taskId}`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  
  const { task } = await statusResponse.json();
  
  if (task.status === 'completed') {
    console.log('Enhanced image:', task.resultUrl);
  } else if (task.status === 'failed') {
    console.error('Enhancement failed:', task.errorMessage);
  } else {
    // Still processing, check again in 2 seconds
    setTimeout(checkStatus, 2000);
  }
};

checkStatus();
```

### Admin Dashboard
```typescript
// Add to your admin page
import CreditManagementDashboard from '../components/CreditManagementDashboard';

export default function AdminPage() {
  return <CreditManagementDashboard />;
}
```

## 🔍 Monitoring & Alerts

### Credit Thresholds
- **Low Platform Credits**: Alert when below 100 credits
- **High Usage**: Alert when usage exceeds 90% of monthly allocation
- **Provider Failures**: Alert when API providers are unhealthy

### Health Checks
- **Provider Status**: Monitor API provider health
- **Task Processing**: Track task success/failure rates
- **Credit Consumption**: Monitor real-time credit usage

## 🚨 Troubleshooting

### Common Issues

1. **"Insufficient credits" error**
   - Check user's subscription tier
   - Verify platform credit pool has available balance
   - Check if monthly reset is needed

2. **Task stuck in "processing" status**
   - Check NanoBanana API status
   - Verify API key is correct
   - Check background job processor is running

3. **Background jobs not running**
   - Verify cron jobs are set up correctly
   - Check BACKGROUND_JOB_TOKEN is configured
   - Ensure the script has proper permissions

### Debug Commands
```bash
# Check system health
node scripts/setup-background-jobs.js health

# View recent tasks
# Check the enhancement_tasks table in Supabase

# Check credit pools
# Query the credit_pools table in Supabase

# View system alerts
# Check the system_alerts table in Supabase
```

## 📊 Cost Management

### Credit Allocation Strategy
- **Platform Pool**: 80% of monthly revenue allocated to credits
- **User Allowances**: Based on subscription tier
- **Overflow Protection**: Emergency credit reserves
- **Auto-refill**: Triggered at 20% remaining

### Cost Optimization
- **Smart Allocation**: Reallocate unused credits
- **Provider Fallback**: Use cheapest available provider
- **Graceful Degradation**: CSS filters when credits depleted

## 🔐 Security

### API Security
- **Bearer Token Authentication**: All API calls require valid tokens
- **Row Level Security**: Users can only access their own data
- **Service Role**: Admin operations use service role key

### Credit Security
- **Atomic Transactions**: Credit operations are atomic
- **Refund System**: Failed tasks automatically refund credits
- **Audit Trail**: All transactions are logged

## 📈 Scaling

### Performance Optimizations
- **Async Processing**: Non-blocking task submission
- **Batch Processing**: Process multiple tasks efficiently
- **Caching**: Cache provider health and credit status
- **Database Indexing**: Optimized queries for large datasets

### Monitoring
- **Real-time Dashboards**: Track system health
- **Alert System**: Proactive issue detection
- **Usage Analytics**: Understand usage patterns

## 🎉 Next Steps

1. **Deploy the migrations** to your Supabase instance
2. **Configure environment variables** with your API keys
3. **Set up background jobs** using cron or your preferred scheduler
4. **Test the integration** with sample enhancement requests
5. **Monitor the system** using the admin dashboard
6. **Scale as needed** based on usage patterns

The system is designed to handle hundreds to thousands of users while maintaining healthy unit economics and user satisfaction.
