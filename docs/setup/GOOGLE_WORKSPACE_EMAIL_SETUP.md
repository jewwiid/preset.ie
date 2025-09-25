# Google Workspace Email Setup for Presetie.com

## Overview
This guide will help you set up Google Workspace email services for your Preset platform using the new domains `presetie.com` and `presetie.io`.

## Step 1: Google Workspace Account Setup

### 1.1 Sign up for Google Workspace
1. Go to [Google Workspace](https://workspace.google.com/)
2. Choose a plan (Business Starter recommended for small teams)
3. Use your domain `presetie.com` as the primary domain
4. Add `presetie.io` as an alias domain

### 1.2 Domain Verification
1. In Google Admin Console, go to **Domains** > **Manage domains**
2. Add both `presetie.com` and `presetie.io`
3. Follow the DNS verification process for each domain

## Step 2: DNS Configuration

### 2.1 MX Records (Required for email)
Add these MX records to your DNS provider for both domains:

```
Priority: 1, Value: aspmx.l.google.com
Priority: 5, Value: alt1.aspmx.l.google.com
Priority: 5, Value: alt2.aspmx.l.google.com
Priority: 10, Value: alt3.aspmx.l.google.com
Priority: 10, Value: alt4.aspmx.l.google.com
```

### 2.2 SPF Record (Anti-spam)
Add this TXT record to both domains:
```
v=spf1 include:_spf.google.com ~all
```

### 2.3 DKIM Record (Email authentication)
1. In Google Admin Console, go to **Apps** > **Google Workspace** > **Gmail** > **Authenticate email**
2. Generate DKIM key for each domain
3. Add the provided TXT record to your DNS

### 2.4 DMARC Record (Email security)
Add this TXT record to both domains:
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@presetie.com
```

## Step 3: Email Account Creation

### 3.1 Create Support Email
1. In Google Admin Console, go to **Users**
2. Create user: `support@presetie.com`
3. Set up proper permissions and forwarding if needed

### 3.2 Additional Email Addresses
Consider creating these additional addresses:
- `noreply@presetie.com` (for automated emails)
- `admin@presetie.com` (for admin communications)
- `marketing@presetie.com` (for marketing campaigns)
- `billing@presetie.com` (for payment-related emails)

## Step 4: Gmail API Setup

### 4.1 Enable Gmail API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API
4. Create credentials (OAuth 2.0 or Service Account)

### 4.2 Service Account Setup (Recommended)
1. Create a Service Account
2. Download the JSON key file
3. Grant necessary permissions to the service account
4. Use the service account email in your application

## Step 5: Environment Variables

Add these to your `.env` files:

```bash
# Google Workspace Email Configuration
GOOGLE_WORKSPACE_DOMAIN=presetie.com
GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL=your-service-account@presetie.com.iam.gserviceaccount.com
GOOGLE_WORKSPACE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_WORKSPACE_PROJECT_ID=your-project-id

# Email Configuration
FROM_EMAIL=support@presetie.com
FROM_NAME=Preset Support
REPLY_TO_EMAIL=support@presetie.com

# Email Templates
EMAIL_TEMPLATE_BRAND_COLOR=#007bff
EMAIL_TEMPLATE_LOGO_URL=https://presetie.com/logo.png
```

## Step 6: Testing

### 6.1 DNS Propagation Check
Use these tools to verify your DNS settings:
- [MXToolbox](https://mxtoolbox.com/)
- [Google Admin Toolbox](https://toolbox.googleapps.com/)

### 6.2 Email Testing
1. Send test emails from `support@presetie.com`
2. Check spam folders
3. Verify email authentication (SPF, DKIM, DMARC)

## Step 7: Migration from Current Setup

### 7.1 Update Email Service
The email service will be updated to use Google Workspace Gmail API instead of the current placeholder implementation.

### 7.2 Update Email Templates
All email templates will be updated to use the new domain and branding.

## Troubleshooting

### Common Issues
1. **DNS Propagation**: Can take up to 48 hours
2. **Authentication Errors**: Check service account permissions
3. **Spam Issues**: Ensure SPF, DKIM, and DMARC are properly configured

### Support Resources
- [Google Workspace Help](https://support.google.com/a/)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [DNS Configuration Guide](https://support.google.com/a/answer/140034)

## Next Steps
1. Complete DNS configuration
2. Set up Google Workspace account
3. Configure Gmail API credentials
4. Update application email service
5. Test email functionality
6. Update all email templates with new branding

## Security Considerations
- Keep service account keys secure
- Use environment variables for sensitive data
- Regularly rotate API keys
- Monitor email sending quotas and limits
- Set up proper email authentication (SPF, DKIM, DMARC)
