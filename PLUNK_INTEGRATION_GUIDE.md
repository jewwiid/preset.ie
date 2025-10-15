# 📧 Plunk Email Integration Setup Guide

## ✅ **What's Been Implemented:**

### **1. Plunk SDK Integration**
- ✅ Installed `@plunk/node` package
- ✅ Created `EmailService` class with Plunk integration
- ✅ Added development mode (logs emails instead of sending)
- ✅ Added production mode with full Plunk features

### **2. Brand-Consistent Email Templates**
- ✅ Updated all showcase email templates with your brand colors:
  - **Primary Green**: `#00876f` (your main brand color)
  - **Secondary Green**: `#0d7d72` (gradient)
  - **Accent Amber**: `#f59e0b` (for warnings/feedback)
  - **Background**: `#fafdfc` (light teal tint)

### **3. Complete Email Workflow**
- ✅ **Showcase Submitted for Approval** → Email to talent
- ✅ **Showcase Approved** → Email to creator  
- ✅ **Changes Requested** → Email to creator with feedback
- ✅ All emails use your brand colors and styling

### **4. API Integration**
- ✅ Updated `/api/showcases/[id]/submit` to send emails
- ✅ Updated `/api/showcases/[id]/approve` to send emails
- ✅ Added error handling (emails won't break the workflow)

### **5. Testing Tools**
- ✅ Created `/api/test-email` endpoint
- ✅ Created `/test-email` page for easy testing
- ✅ Test email with your brand colors and styling

## 🚀 **Setup Instructions:**

### **Step 1: Get Plunk API Key**
1. Go to [Plunk Dashboard](https://plunk.com/dashboard)
2. Sign up/login to your account
3. Go to Settings → API Keys
4. Copy your API key

### **Step 2: Add Environment Variable**
Add to your `.env.local` file:
```env
PLUNK_API_KEY=your_plunk_api_key_here
```

### **Step 3: Test the Integration**
1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/test-email`
3. Enter your email address
4. Click "Send Test Email"
5. Check your inbox for the test email

### **Step 4: Verify Brand Colors**
The test email should show:
- ✅ Green gradient header (`#00876f` to `#0d7d72`)
- ✅ Green buttons and accents
- ✅ Light teal background highlights
- ✅ Professional Preset branding

## 📋 **Email Templates Overview:**

### **1. Showcase Submitted for Approval**
- **To**: Talent
- **Subject**: "Showcase Review Required: [Gig Title]"
- **Content**: Review request with gig details and approval button
- **Colors**: Green header, teal highlights

### **2. Showcase Approved**
- **To**: Creator
- **Subject**: "🎉 Your showcase for '[Gig Title]' has been approved!"
- **Content**: Congratulations message with showcase link
- **Colors**: Green header, success styling

### **3. Changes Requested**
- **To**: Creator
- **Subject**: "📝 Changes requested for your '[Gig Title]' showcase"
- **Content**: Feedback message with change request details
- **Colors**: Green header, amber feedback box

## 🔧 **Configuration Options:**

### **Email Service Settings**
```typescript
// In email-service.ts, you can customize:
- reply_to: 'hello@preset.ie'
- from_name: 'Preset'
- from_email: 'noreply@preset.ie'
- track_opens: true
- track_clicks: true
- unsubscribe_url: '/unsubscribe'
```

### **Development vs Production**
- **Development**: Emails are logged to console (no actual sending)
- **Production**: Full Plunk integration with tracking and delivery

## 🧪 **Testing Checklist:**

- [ ] Plunk API key is configured
- [ ] Test email endpoint works (`/api/test-email`)
- [ ] Test email page loads (`/test-email`)
- [ ] Test email is received in inbox
- [ ] Brand colors are correct in email
- [ ] Showcase workflow emails work
- [ ] Error handling works (try invalid email)

## 🎯 **Production Deployment:**

1. **Add environment variable** to your production environment
2. **Test in staging** first
3. **Monitor email delivery** in Plunk dashboard
4. **Set up email analytics** (opens, clicks, bounces)

## 📊 **Monitoring & Analytics:**

Plunk provides:
- ✅ Email delivery tracking
- ✅ Open rate analytics
- ✅ Click tracking
- ✅ Bounce handling
- ✅ Unsubscribe management

## 🚨 **Troubleshooting:**

### **Common Issues:**
1. **"Invalid API key"** → Check your Plunk API key
2. **"Email not received"** → Check spam folder, verify email address
3. **"Template error"** → Check console logs for template issues
4. **"Rate limit exceeded"** → Plunk has rate limits, check dashboard

### **Debug Steps:**
1. Check browser console for errors
2. Check server logs for email service errors
3. Verify environment variables are loaded
4. Test with `/test-email` endpoint first

## 🎉 **Ready to Use!**

Your Plunk integration is now complete with:
- ✅ Brand-consistent email templates
- ✅ Full showcase workflow notifications
- ✅ Development and production modes
- ✅ Error handling and fallbacks
- ✅ Testing tools and monitoring

The email system will automatically send notifications when:
- Creators submit showcases for approval
- Talent approves or requests changes
- Showcases are published

All emails use your exact brand colors and maintain professional Preset branding!
