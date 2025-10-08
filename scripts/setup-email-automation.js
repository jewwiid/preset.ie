#!/usr/bin/env node

/**
 * Automated Email Service Setup for Preset Platform
 * 
 * This script automates the setup of Google Workspace email service
 * and Supabase integration for password reset functionality.
 * 
 * Run with: node scripts/setup-email-automation.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  step: (msg) => console.log(`\n${colors.cyan}🔧 ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.magenta}📧 ${msg}${colors.reset}\n`)
};

class EmailSetupAutomation {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.config = {
      domain: 'presetie.com',
      fromEmail: 'support@presetie.com',
      fromName: 'Preset Support',
      projectId: '',
      serviceAccountEmail: '',
      privateKey: '',
      gmailAppPassword: ''
    };
  }

  async run() {
    try {
      log.header('PRESET EMAIL SERVICE AUTOMATION');
      log.info('This script will help you set up automated email services for password reset and notifications.\n');

      await this.gatherConfiguration();
      await this.generateEnvironmentFiles();
      await this.updateSupabaseConfig();
      await this.createTestScript();
      await this.generateSetupInstructions();

      log.success('🎉 Email service automation setup complete!');
      this.displayNextSteps();
    } catch (error) {
      log.error(`Setup failed: ${error.message}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async gatherConfiguration() {
    log.step('Gathering Configuration Information');

    // Domain configuration
    this.config.domain = await this.askQuestion(
      'Enter your domain (default: presetie.com): ',
      this.config.domain
    );

    this.config.fromEmail = await this.askQuestion(
      `Enter your support email (default: support@${this.config.domain}): `,
      `support@${this.config.domain}`
    );

    this.config.fromName = await this.askQuestion(
      'Enter your sender name (default: Preset Support): ',
      this.config.fromName
    );

    // Google Cloud Project
    log.info('\n📋 Google Cloud Project Setup:');
    log.info('1. Go to: https://console.cloud.google.com/');
    log.info('2. Create or select a project');
    log.info('3. Enable Gmail API');
    log.info('4. Create a service account');

    this.config.projectId = await this.askQuestion(
      'Enter your Google Cloud Project ID: '
    );

    // Service Account
    log.info('\n🔑 Service Account Setup:');
    log.info('1. Go to IAM & Admin > Service Accounts');
    log.info('2. Create service account with Gmail API access');
    log.info('3. Download the JSON key file');

    this.config.serviceAccountEmail = await this.askQuestion(
      'Enter your service account email: '
    );

    // Private Key
    log.info('\n🔐 Private Key Setup:');
    log.info('Paste your private key from the JSON file (including BEGIN/END markers):');
    log.warning('Make sure to include the full key with proper formatting!');

    this.config.privateKey = await this.askQuestion(
      'Enter your private key: '
    );

    // Gmail App Password (for SMTP fallback)
    log.info('\n📧 Gmail App Password (for Supabase SMTP):');
    log.info('1. Enable 2-factor authentication on your Google account');
    log.info('2. Generate an app-specific password for "Mail"');
    log.info('3. Use this password for Supabase SMTP configuration');

    this.config.gmailAppPassword = await this.askQuestion(
      'Enter your Gmail app password (optional, for SMTP): '
    );
  }

  async generateEnvironmentFiles() {
    log.step('Generating Environment Configuration Files');

    // Generate .env.local
    const envContent = `# Google Workspace Email Configuration
GOOGLE_WORKSPACE_DOMAIN=${this.config.domain}
GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL=${this.config.serviceAccountEmail}
GOOGLE_WORKSPACE_PRIVATE_KEY="${this.config.privateKey}"
GOOGLE_WORKSPACE_PROJECT_ID=${this.config.projectId}

# Email Configuration
FROM_EMAIL=${this.config.fromEmail}
FROM_NAME=${this.config.fromName}
REPLY_TO_EMAIL=${this.config.fromEmail}

# Gmail App Password (for Supabase SMTP)
GMAIL_APP_PASSWORD=${this.config.gmailAppPassword}

# App URL Configuration
NEXT_PUBLIC_APP_URL=https://${this.config.domain}

# Email Templates
EMAIL_TEMPLATE_BRAND_COLOR=#00876f
EMAIL_TEMPLATE_LOGO_URL=https://${this.config.domain}/logo.png
`;

    fs.writeFileSync('.env.local', envContent);
    log.success('Created .env.local file');

    // Generate .env.example update
    const envExamplePath = '.env.example';
    if (fs.existsSync(envExamplePath)) {
      const existingContent = fs.readFileSync(envExamplePath, 'utf8');
      const newEmailSection = `# Google Workspace Email Configuration
GOOGLE_WORKSPACE_DOMAIN=your-domain.com
GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-domain.com.iam.gserviceaccount.com
GOOGLE_WORKSPACE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"
GOOGLE_WORKSPACE_PROJECT_ID=your-project-id

# Email Configuration
FROM_EMAIL=support@your-domain.com
FROM_NAME=Your App Support
REPLY_TO_EMAIL=support@your-domain.com

# Gmail App Password (for Supabase SMTP)
GMAIL_APP_PASSWORD=your_gmail_app_password

`;

      if (!existingContent.includes('GOOGLE_WORKSPACE_DOMAIN')) {
        fs.writeFileSync(envExamplePath, existingContent + '\n' + newEmailSection);
        log.success('Updated .env.example file');
      }
    }
  }

  async updateSupabaseConfig() {
    log.step('Updating Supabase Configuration');

    const configPath = 'supabase/config.toml';
    if (fs.existsSync(configPath)) {
      let configContent = fs.readFileSync(configPath, 'utf8');

      // Update site URL
      configContent = configContent.replace(
        /site_url = ".*"/,
        `site_url = "https://${this.config.domain}"`
      );

      // Add SMTP configuration
      const smtpConfig = `
# Production SMTP Configuration (Gmail)
[auth.email.smtp]
enabled = true
host = "smtp.gmail.com"
port = 587
user = "${this.config.fromEmail}"
pass = "env(GMAIL_APP_PASSWORD)"
admin_email = "${this.config.fromEmail}"
sender_name = "${this.config.fromName}"
`;

      // Replace existing SMTP config or add new one
      if (configContent.includes('[auth.email.smtp]')) {
        const smtpStart = configContent.indexOf('[auth.email.smtp]');
        const smtpEnd = configContent.indexOf('\n[auth.', smtpStart);
        const endIndex = smtpEnd === -1 ? configContent.length : smtpEnd;
        configContent = configContent.substring(0, smtpStart) + smtpConfig.trim() + configContent.substring(endIndex);
      } else {
        // Find the end of [auth.email] section and add SMTP config
        const emailSectionEnd = configContent.indexOf('\n[auth.sms]');
        configContent = configContent.substring(0, emailSectionEnd) + smtpConfig + configContent.substring(emailSectionEnd);
      }

      fs.writeFileSync(configPath, configContent);
      log.success('Updated supabase/config.toml');
    } else {
      log.warning('supabase/config.toml not found - you may need to update it manually');
    }
  }

  async createTestScript() {
    log.step('Creating Email Test Script');

    const testScript = `#!/usr/bin/env node

/**
 * Email Service Test Script
 * Tests both Google Workspace API and Supabase SMTP configurations
 */

const { EmailService } = require('../apps/web/lib/services/email.service');
const { supabase } = require('../apps/web/lib/supabase');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\\n');

  const emailService = EmailService.getInstance();
  const testRecipient = {
    name: 'Test User',
    email: '${this.config.fromEmail}' // Send to yourself for testing
  };

  // Test 1: Google Workspace API
  console.log('1️⃣ Testing Google Workspace API...');
  try {
    const success = await emailService.sendPasswordReset(
      testRecipient,
      'https://${this.config.domain}/auth/reset-password?token=test'
    );
    
    if (success) {
      console.log('✅ Google Workspace API test passed');
    } else {
      console.log('❌ Google Workspace API test failed');
    }
  } catch (error) {
    console.log('❌ Google Workspace API error:', error.message);
  }

  // Test 2: Supabase SMTP (if configured)
  console.log('\\n2️⃣ Testing Supabase SMTP...');
  try {
    if (!supabase) {
      console.log('⚠️ Supabase client not available');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      testRecipient.email,
      {
        redirectTo: 'https://${this.config.domain}/auth/reset-password'
      }
    );

    if (error) {
      console.log('❌ Supabase SMTP error:', error.message);
    } else {
      console.log('✅ Supabase SMTP test passed');
    }
  } catch (error) {
    console.log('❌ Supabase SMTP error:', error.message);
  }

  console.log('\\n🎉 Email service testing complete!');
  console.log('Check your email inbox for test messages.');
}

testEmailService().catch(console.error);
`;

    fs.writeFileSync('scripts/test-email-automation.js', testScript);
    fs.chmodSync('scripts/test-email-automation.js', '755');
    log.success('Created scripts/test-email-automation.js');
  }

  async generateSetupInstructions() {
    log.step('Generating Setup Instructions');

    const instructions = `# Email Service Setup Instructions

## 🎉 Automated Setup Complete!

Your email service has been configured with the following settings:

### 📧 Configuration Summary
- **Domain**: ${this.config.domain}
- **Support Email**: ${this.config.fromEmail}
- **Sender Name**: ${this.config.fromName}
- **Google Project**: ${this.config.projectId}
- **Service Account**: ${this.config.serviceAccountEmail}

### 🔧 Files Created/Updated
- ✅ \`.env.local\` - Environment variables
- ✅ \`.env.example\` - Updated example file
- ✅ \`supabase/config.toml\` - Supabase SMTP configuration
- ✅ \`scripts/test-email-automation.js\` - Test script

### 🚀 Next Steps

1. **Set up Google Cloud Project**:
   \`\`\`bash
   # Go to: https://console.cloud.google.com/
   # 1. Create/select project: ${this.config.projectId}
   # 2. Enable Gmail API
   # 3. Create service account
   # 4. Download JSON key file
   # 5. Update GOOGLE_WORKSPACE_PRIVATE_KEY in .env.local
   \`\`\`

2. **Configure Gmail App Password** (for Supabase SMTP):
   \`\`\`bash
   # 1. Enable 2FA on your Google account
   # 2. Generate app password for "Mail"
   # 3. Update GMAIL_APP_PASSWORD in .env.local
   \`\`\`

3. **Test the Setup**:
   \`\`\`bash
   # Run the test script
   node scripts/test-email-automation.js
   
   # Or test password reset manually
   # Go to: https://${this.config.domain}/auth/forgot-password
   \`\`\`

4. **Deploy to Production**:
   \`\`\`bash
   # Add environment variables to your hosting platform:
   # - Vercel: vercel env add
   # - Netlify: netlify env:set
   # - Railway: railway variables set
   \`\`\`

### 🔍 Troubleshooting

**Google Workspace API Issues**:
- Verify service account has Gmail API access
- Check private key format (must include \\n for newlines)
- Ensure project ID is correct

**Supabase SMTP Issues**:
- Verify Gmail app password is correct
- Check if 2FA is enabled on Google account
- Ensure email is not blocked by spam filters

**Password Reset Not Working**:
- Check NEXT_PUBLIC_APP_URL is set correctly
- Verify redirect URLs in Supabase dashboard
- Test with a valid email address

### 📞 Support

If you encounter issues:
1. Check the test script output
2. Review Supabase logs
3. Verify Google Cloud Console settings
4. Check email spam folders

---

Generated on: ${new Date().toISOString()}
Domain: ${this.config.domain}
`;

    fs.writeFileSync('EMAIL_SETUP_INSTRUCTIONS.md', instructions);
    log.success('Created EMAIL_SETUP_INSTRUCTIONS.md');
  }

  displayNextSteps() {
    log.header('NEXT STEPS');
    log.info('1. Set up your Google Cloud Project and service account');
    log.info('2. Update the private key in .env.local if needed');
    log.info('3. Configure Gmail app password for Supabase SMTP');
    log.info('4. Test the setup: node scripts/test-email-automation.js');
    log.info('5. Deploy to production with environment variables');
    
    console.log(`\n${colors.bright}${colors.green}📋 Detailed instructions saved to: EMAIL_SETUP_INSTRUCTIONS.md${colors.reset}`);
  }

  async askQuestion(question, defaultValue = '') {
    return new Promise((resolve) => {
      const prompt = defaultValue ? `${question}[${defaultValue}]: ` : question;
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }
}

// Run the automation
if (require.main === module) {
  const automation = new EmailSetupAutomation();
  automation.run().catch(console.error);
}

module.exports = EmailSetupAutomation;
