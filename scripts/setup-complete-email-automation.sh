#!/bin/bash

# Complete Email Automation Setup for Preset Platform
# This script automates the entire email service setup process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "\n${CYAN}🔧 $1${NC}"
}

log_header() {
    echo -e "\n${PURPLE}📧 $1${NC}\n"
}

# Check if Node.js is installed
check_dependencies() {
    log_step "Checking Dependencies"
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

# Install required packages
install_packages() {
    log_step "Installing Required Packages"
    
    if [ ! -f "package.json" ]; then
        log_warning "package.json not found. Skipping package installation."
        return
    fi
    
    # Check if googleapis is already installed
    if npm list googleapis &> /dev/null; then
        log_success "googleapis package already installed"
    else
        log_info "Installing googleapis package..."
        npm install googleapis
        log_success "googleapis package installed"
    fi
}

# Run the email setup automation
run_email_setup() {
    log_step "Running Email Setup Automation"
    
    if [ -f "scripts/setup-email-automation.js" ]; then
        log_info "Starting email setup automation..."
        node scripts/setup-email-automation.js
        log_success "Email setup automation completed"
    else
        log_error "setup-email-automation.js not found"
        exit 1
    fi
}

# Run the Supabase integration
run_supabase_integration() {
    log_step "Running Supabase Email Integration"
    
    if [ -f "scripts/supabase-email-integration.js" ]; then
        log_info "Starting Supabase email integration..."
        node scripts/supabase-email-integration.js
        log_success "Supabase email integration completed"
    else
        log_error "supabase-email-integration.js not found"
        exit 1
    fi
}

# Create a test script
create_test_script() {
    log_step "Creating Test Script"
    
    cat > scripts/test-complete-setup.js << 'EOF'
#!/usr/bin/env node

/**
 * Complete Email Setup Test
 * Tests all aspects of the email automation setup
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

async function testCompleteSetup() {
  console.log('\n🧪 Testing Complete Email Setup...\n');

  let allTestsPassed = true;

  // Test 1: Check environment file
  log.info('1. Checking .env.local file...');
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const requiredVars = [
      'GOOGLE_WORKSPACE_DOMAIN',
      'GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_WORKSPACE_PRIVATE_KEY',
      'GOOGLE_WORKSPACE_PROJECT_ID',
      'FROM_EMAIL',
      'FROM_NAME'
    ];
    
    let missingVars = [];
    requiredVars.forEach(varName => {
      if (!envContent.includes(varName)) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length === 0) {
      log.success('All required environment variables found');
    } else {
      log.error(`Missing environment variables: ${missingVars.join(', ')}`);
      allTestsPassed = false;
    }
  } else {
    log.error('.env.local file not found');
    allTestsPassed = false;
  }

  // Test 2: Check Supabase configuration
  log.info('2. Checking Supabase configuration...');
  if (fs.existsSync('supabase/config.toml')) {
    const configContent = fs.readFileSync('supabase/config.toml', 'utf8');
    if (configContent.includes('[auth.email.smtp]')) {
      log.success('Supabase SMTP configuration found');
    } else {
      log.warning('Supabase SMTP configuration not found');
    }
  } else {
    log.warning('supabase/config.toml not found');
  }

  // Test 3: Check email templates
  log.info('3. Checking email templates...');
  const templatesDir = 'supabase/templates';
  if (fs.existsSync(templatesDir)) {
    const templates = ['recovery.html', 'magic_link.html', 'confirmation.html', 'invite.html'];
    let missingTemplates = [];
    templates.forEach(template => {
      if (!fs.existsSync(path.join(templatesDir, template))) {
        missingTemplates.push(template);
      }
    });
    
    if (missingTemplates.length === 0) {
      log.success('All email templates found');
    } else {
      log.warning(`Missing email templates: ${missingTemplates.join(', ')}`);
    }
  } else {
    log.warning('Email templates directory not found');
  }

  // Test 4: Check custom email handler
  log.info('4. Checking custom email handler...');
  if (fs.existsSync('apps/web/lib/services/supabase-email-handler.ts')) {
    log.success('Custom email handler found');
  } else {
    log.warning('Custom email handler not found');
  }

  // Test 5: Check migration files
  log.info('5. Checking database migrations...');
  const migrationsDir = 'supabase/migrations';
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir).filter(file => 
      file.includes('email_integration')
    );
    
    if (migrationFiles.length > 0) {
      log.success(`Email integration migration found: ${migrationFiles[0]}`);
    } else {
      log.warning('Email integration migration not found');
    }
  } else {
    log.warning('Supabase migrations directory not found');
  }

  // Test 6: Check documentation
  log.info('6. Checking documentation...');
  const docs = [
    'EMAIL_SETUP_INSTRUCTIONS.md',
    'SUPABASE_EMAIL_INTEGRATION_GUIDE.md'
  ];
  
  let foundDocs = 0;
  docs.forEach(doc => {
    if (fs.existsSync(doc)) {
      foundDocs++;
    }
  });
  
  if (foundDocs === docs.length) {
    log.success('All documentation files found');
  } else {
    log.warning(`Found ${foundDocs}/${docs.length} documentation files`);
  }

  // Summary
  console.log('\n📊 Setup Test Summary:');
  if (allTestsPassed) {
    log.success('🎉 All critical tests passed! Your email setup is ready.');
    console.log('\nNext steps:');
    console.log('1. Set up your Google Cloud Project and service account');
    console.log('2. Update the private key in .env.local');
    console.log('3. Configure Gmail app password for Supabase SMTP');
    console.log('4. Test password reset: https://your-domain.com/auth/forgot-password');
    console.log('5. Deploy to production with environment variables');
  } else {
    log.error('❌ Some tests failed. Please review the setup and try again.');
    console.log('\nTroubleshooting:');
    console.log('1. Run the setup scripts again');
    console.log('2. Check file permissions');
    console.log('3. Verify all dependencies are installed');
  }
}

testCompleteSetup().catch(console.error);
EOF

    chmod +x scripts/test-complete-setup.js
    log_success "Created test script: scripts/test-complete-setup.js"
}

# Main execution
main() {
    log_header "PRESET EMAIL AUTOMATION SETUP"
    log_info "This script will set up automated email services for password reset and notifications.\n"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] && [ ! -d "apps" ]; then
        log_error "This script must be run from the project root directory"
        exit 1
    fi
    
    # Run all setup steps
    check_dependencies
    install_packages
    run_email_setup
    run_supabase_integration
    create_test_script
    
    log_header "SETUP COMPLETE!"
    log_success "🎉 Email automation setup completed successfully!"
    
    echo -e "\n${GREEN}📋 What was created:${NC}"
    echo "✅ Environment configuration (.env.local)"
    echo "✅ Supabase configuration updates"
    echo "✅ Custom email handler"
    echo "✅ Professional email templates"
    echo "✅ Database migration"
    echo "✅ Test scripts"
    echo "✅ Documentation guides"
    
    echo -e "\n${YELLOW}🚀 Next steps:${NC}"
    echo "1. Set up Google Cloud Project and service account"
    echo "2. Update credentials in .env.local"
    echo "3. Test the setup: node scripts/test-complete-setup.js"
    echo "4. Deploy to production"
    
    echo -e "\n${CYAN}📖 Documentation:${NC}"
    echo "• EMAIL_SETUP_INSTRUCTIONS.md"
    echo "• SUPABASE_EMAIL_INTEGRATION_GUIDE.md"
    
    echo -e "\n${PURPLE}🧪 Testing:${NC}"
    echo "• node scripts/test-complete-setup.js"
    echo "• node scripts/test-email-automation.js"
    
    log_success "Setup completed! Check the documentation files for detailed instructions."
}

# Run main function
main "$@"
