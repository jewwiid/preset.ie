// Script to update environment variables for production deployment
const fs = require('fs');
const path = require('path');

const productionEnvVars = {
  // Image Generation Provider Configuration
  IMAGE_PROVIDER: 'nanobanana', // or seedream
  NEXT_PUBLIC_APP_URL: 'https://preset.ie',
  
  // NanoBanana API Configuration
  NANOBANANA_BASE_URL: 'https://api.nanobanana.ai',
  NANOBANANA_CALLBACK_URL: 'https://preset.ie/api/imagegen/callback',
  
  // WaveSpeed API Configuration (for Seedream V4)
  WAVESPEED_API_KEY: 'your_wavespeed_api_key_here',
  WAVESPEED_BASE_URL: 'https://api.wavespeed.ai',
  WAVESPEED_WEBHOOK_SECRET: 'your_webhook_secret_here',
  
  // Credit Configuration
  USER_CREDITS_PER_NANOBANANA_ENHANCEMENT: '1',
  USER_CREDITS_PER_SEEDREAM_ENHANCEMENT: '2',
  
  // Provider Performance Tracking
  ENABLE_PROVIDER_ANALYTICS: 'true',
  PROVIDER_FALLBACK_ENABLED: 'true'
};

function updateEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  
  try {
    // Read existing .env.local
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Add production variables
    const productionVars = Object.entries(productionEnvVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Check if production vars already exist
    const hasProductionVars = Object.keys(productionEnvVars).some(key => 
      envContent.includes(`${key}=`)
    );
    
    if (!hasProductionVars) {
      const updatedContent = envContent + '\n\n# Production Multi-Provider Configuration\n' + productionVars;
      fs.writeFileSync(envPath, updatedContent);
      console.log('✅ Production environment variables added to .env.local');
    } else {
      console.log('ℹ️  Production environment variables already exist in .env.local');
    }
    
    // Display Vercel environment variables
    console.log('\n📋 Add these to your Vercel project environment variables:');
    console.log('=' .repeat(60));
    Object.entries(productionEnvVars).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });
    console.log('=' .repeat(60));
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Get WaveSpeed API key from https://wavespeed.ai/dashboard');
    console.log('2. Update WAVESPEED_API_KEY in .env.local');
    console.log('3. Set up webhook URL in WaveSpeed dashboard: https://preset.ie/api/imagegen/callback');
    console.log('4. Update webhook URL in NanoBanana dashboard: https://preset.ie/api/imagegen/callback');
    console.log('5. Deploy to Vercel');
    
  } catch (error) {
    console.error('❌ Error updating environment file:', error.message);
  }
}

function generateVercelEnvFile() {
  const vercelEnvPath = path.join(__dirname, '.env.production');
  
  const vercelEnvContent = `# Vercel Production Environment Variables
# Copy these to your Vercel project settings

# Image Generation Provider Configuration
IMAGE_PROVIDER=nanobanana
NEXT_PUBLIC_APP_URL=https://preset.ie

# NanoBanana API Configuration
NANOBANANA_API_KEY=your_nanobanana_api_key_here
NANOBANANA_BASE_URL=https://api.nanobanana.ai
NANOBANANA_CALLBACK_URL=https://preset.ie/api/imagegen/callback

# WaveSpeed API Configuration (for Seedream V4)
WAVESPEED_API_KEY=your_wavespeed_api_key_here
WAVESPEED_BASE_URL=https://api.wavespeed.ai
WAVESPEED_WEBHOOK_SECRET=your_webhook_secret_here

# Credit Configuration
USER_CREDITS_PER_NANOBANANA_ENHANCEMENT=1
USER_CREDITS_PER_SEEDREAM_ENHANCEMENT=2

# Provider Performance Tracking
ENABLE_PROVIDER_ANALYTICS=true
PROVIDER_FALLBACK_ENABLED=true

# Existing Supabase variables (keep these)
NEXT_PUBLIC_SUPABASE_URL=https://zbsmgymyfhnwjdnmlelr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Other existing variables...
`;

  fs.writeFileSync(vercelEnvPath, vercelEnvContent);
  console.log('✅ Generated .env.production file for Vercel');
}

// Run the script
console.log('🚀 Updating environment variables for production deployment...\n');
updateEnvFile();
generateVercelEnvFile();

console.log('\n🎯 Production Deployment Checklist:');
console.log('□ Update WaveSpeed webhook URL to https://preset.ie/api/imagegen/callback');
console.log('□ Update NanoBanana callback URL to https://preset.ie/api/imagegen/callback');
console.log('□ Add environment variables to Vercel project settings');
console.log('□ Test production deployment');
console.log('□ Verify webhook callbacks work');
console.log('□ Monitor provider performance');
