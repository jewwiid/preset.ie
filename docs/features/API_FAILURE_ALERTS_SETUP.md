# 🚨 API Failure Alert System

## Overview

Automatically sends immediate email alerts to admins when WaveSpeed API failures occur, including:
- **Credit Exhaustion** - When WaveSpeed runs out of credits
- **API Errors** - Server errors, authentication issues
- **Timeouts** - Network connectivity problems
- **Rate Limiting** - Too many requests
- **Provider Downtime** - Service outages

## 🚀 Quick Setup

### 1. Environment Variables
Already configured in your system:
```bash
PLUNK_API_KEY=your_plunk_api_key
ADMIN_EMAIL=support@presetie.com
```

### 2. Automatic Integration
The alert system is **already integrated** into:
- ✅ **Enhance Image API** (`/api/enhance-image`) - Alerts on API failures
- ✅ **NanoBanana Callback** (`/api/nanobanana/callback`) - Alerts on task failures
- ✅ **Error Analysis** - Automatically categorizes error types

## 📧 Alert Types & Triggers

### **🚨 Critical Alerts (Immediate Action Required)**
- **Credits Exhausted** - WaveSpeed account out of credits
- **Provider Down** - API service completely unavailable
- **Authentication Failed** - API key issues

### **⚠️ High Priority Alerts**
- **API Errors** - 500/502/503 server errors
- **Rate Limiting** - Too many requests
- **Timeouts** - Network connectivity issues

### **⚡ Medium Priority Alerts**
- **Generic API Errors** - Unknown error types

## 🎯 What You'll Receive

### **Email Subject Examples:**
- `🚨 API Alert: CREDITS_EXHAUSTED - nanobanana`
- `🚨 API Alert: API_ERROR - seedream`
- `🚨 API Alert: TIMEOUT - seedance`

### **Email Content Includes:**
- **Alert Type & Severity** - Color-coded by urgency
- **Provider Information** - Which API failed (NanoBanana, Seedream, etc.)
- **Error Details** - Full error message and context
- **User Information** - Who was affected (if applicable)
- **Timestamp** - When the failure occurred
- **Action Steps** - Specific instructions for each error type

## 🧪 Testing the System

### **Test Different Alert Types:**
```bash
# Test credit exhaustion alert
curl "http://localhost:3000/api/admin/test-api-alerts?type=credits_exhausted&provider=nanobanana"

# Test API error alert
curl "http://localhost:3000/api/admin/test-api-alerts?type=api_error&provider=seedream"

# Test timeout alert
curl "http://localhost:3000/api/admin/test-api-alerts?type=timeout&provider=seedance"

# Test rate limit alert
curl "http://localhost:3000/api/admin/test-api-alerts?type=rate_limit&provider=nanobanana"

# Test provider down alert
curl "http://localhost:3000/api/admin/test-api-alerts?type=provider_down&provider=seedream"
```

### **Test on Production:**
```bash
# Replace localhost with your domain
curl "https://yourdomain.com/api/admin/test-api-alerts?type=credits_exhausted"
```

## 📊 Alert Examples

### **Credit Exhaustion Alert:**
```
🚨 CRITICAL ALERT

Provider: nanobanana
Type: Credits Exhausted
Severity: CRITICAL

Error: Insufficient credits remaining. Please top up your account.

Action Required:
1. Check WaveSpeed Credits: Log into WaveSpeed dashboard
2. Purchase Additional Credits: If credits are low
3. Update Credit Settings: Consider adjusting ratios
4. Test Service: Try a manual generation
```

### **API Error Alert:**
```
⚠️ HIGH PRIORITY ALERT

Provider: seedream
Type: API Error
Severity: HIGH

Error: HTTP 500 Internal Server Error

Action Required:
1. Check API Status: Visit WaveSpeed status page
2. Verify API Keys: Ensure valid permissions
3. Review Error Logs: Check recent changes
4. Test Service: Try a manual generation
```

## 🔧 Integration Points

### **Automatic Triggers:**
1. **API Call Failures** - Network errors, timeouts
2. **Error Responses** - HTTP error codes from WaveSpeed
3. **Task Failures** - Failed generations via callbacks
4. **Credit Issues** - Insufficient balance errors

### **Error Analysis:**
The system automatically analyzes error messages to:
- **Detect credit issues** - "credit", "insufficient", "balance"
- **Identify rate limits** - "rate limit", "too many requests", "429"
- **Spot timeouts** - "timeout", "timed out", "408"
- **Recognize server errors** - "500", "502", "503", "504"
- **Find auth issues** - "401", "403", "unauthorized"

## 🎯 Benefits

### **For Admins:**
- **Immediate Notification** - Know about issues instantly
- **Specific Actions** - Clear steps to resolve each problem
- **User Context** - See who was affected
- **Historical Tracking** - All alerts logged for analysis

### **For Users:**
- **Automatic Refunds** - Credits returned on failures
- **Faster Resolution** - Admins can fix issues quickly
- **Better Reliability** - Proactive monitoring prevents extended outages

## 🚀 Production Deployment

### **Ready to Deploy:**
- ✅ **Alert System** - Fully implemented and tested
- ✅ **Email Integration** - Uses existing Plunk setup
- ✅ **Error Analysis** - Intelligent error categorization
- ✅ **User Context** - Includes affected user information
- ✅ **Actionable Alerts** - Specific resolution steps

### **No Additional Setup Required:**
The system works with your existing:
- Plunk email service
- Supabase database
- Admin email configuration

## 📈 Monitoring Dashboard Integration

The alerts work alongside your daily admin summary emails:
- **Daily Summaries** - Overall usage and trends
- **Immediate Alerts** - Critical issues requiring instant attention
- **Admin Dashboard** - Real-time monitoring and historical data

## 🎉 Ready to Use!

Your API failure alert system is now active and will automatically notify you of any WaveSpeed API issues. Test it with the commands above, and you'll start receiving immediate alerts for any problems! 🚀
