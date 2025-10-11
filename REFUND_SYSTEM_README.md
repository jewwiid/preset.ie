# Credit Refund System - Complete Documentation

This directory contains a comprehensive analysis of your platform's credit refund logic and recommendations for fixing the identified issues.

## 📚 Documentation Index

### 1. **REFUND_EXECUTIVE_SUMMARY.md** ⭐ START HERE
**Best for:** Product managers, business owners, decision makers

**Contents:**
- High-level problem overview
- Business impact analysis
- Cost-benefit breakdown
- Quick start guide
- Next steps

**Read this if:** You want to understand the problem and solution in 5-10 minutes

---

### 2. **REFUND_LOGIC_ANALYSIS.md** 🔧 TECHNICAL DEEP DIVE
**Best for:** Developers, technical leads

**Contents:**
- Complete credit flow documentation
- Line-by-line code analysis
- Detailed implementation guide
- Code examples for fixes
- Monitoring recommendations

**Read this if:** You're implementing the fixes or need technical details

---

### 3. **CREDIT_FLOW_DIAGRAM.md** 📊 VISUAL GUIDE
**Best for:** Everyone

**Contents:**
- Mermaid flow diagrams showing current vs. ideal flows
- Credit transaction lifecycle examples
- Platform loss breakdown
- Cost analysis with scenarios

**Read this if:** You're a visual learner or need to present to stakeholders

---

### 4. **find_users_needing_refunds.sql** 🔍 AUDIT TOOL
**Best for:** Database admins, data analysts

**Contents:**
- 10 SQL queries to analyze the issue
- User discovery queries
- Statistics and breakdowns
- Batch refund script (commented out)

**Use this to:** Find affected users and understand the scope

---

## 🎯 Quick Navigation

### By Role

**Product Manager / Business Owner:**
```
1. REFUND_EXECUTIVE_SUMMARY.md
2. CREDIT_FLOW_DIAGRAM.md (optional visual reference)
3. Review Query 2 in find_users_needing_refunds.sql (scope)
```

**Developer / Engineer:**
```
1. REFUND_EXECUTIVE_SUMMARY.md (context)
2. REFUND_LOGIC_ANALYSIS.md (implementation guide)
3. Test with find_users_needing_refunds.sql
```

**Data Analyst / Support:**
```
1. REFUND_EXECUTIVE_SUMMARY.md (context)
2. find_users_needing_refunds.sql (all queries)
3. Export results for review
```

---

## 🚀 Implementation Workflow

### Phase 1: Understanding (30 minutes)
```
Step 1: Read REFUND_EXECUTIVE_SUMMARY.md
Step 2: Review CREDIT_FLOW_DIAGRAM.md
Step 3: Check if refund function exists (Query 7)
```

### Phase 2: Discovery (1 hour)
```
Step 1: Run all queries in find_users_needing_refunds.sql
Step 2: Export Query 6 results to CSV
Step 3: Calculate total scope and impact
Step 4: Present findings to stakeholders
```

### Phase 3: Implementation (4 hours)
```
Step 1: Review code examples in REFUND_LOGIC_ANALYSIS.md
Step 2: Implement callback handler refund (PRIORITY 1)
Step 3: Implement API route refunds
Step 4: Add helper functions
Step 5: Test thoroughly
```

### Phase 4: Deployment (2 hours)
```
Step 1: Code review
Step 2: Test in staging
Step 3: Deploy to production
Step 4: Monitor for 24 hours
```

### Phase 5: Historical Cleanup (Variable)
```
Step 1: Review affected users from Phase 2
Step 2: Get approval for batch refunds
Step 3: Run batch refund script
Step 4: Notify affected users
Step 5: Close support tickets
```

---

## 📊 Key Files in Your Codebase

### Files That Need Changes:

```
apps/web/app/api/enhance-image/route.ts
├─ Add refundUserCredits helper function
├─ Add refund after network errors (line 342-367)
├─ Add refund after API errors (line 373-442)
└─ Add refund after task creation fails (line 496-505)

apps/web/app/api/nanobanana/callback/route.ts
└─ Add refund when code !== 200 (line 93-143) [CRITICAL]
```

### Files That Already Have Refund Logic (Not Used):

```
packages/adapters/src/external/AsyncTaskManager.ts
└─ Has proper refund in processTaskAsync (line 159-183)
   BUT this class isn't used by main API route!
```

### Database Objects:

```sql
-- Refund function (already exists)
refund_user_credits(p_user_id, p_credits, p_enhancement_type)

-- Tables involved
user_credits          -- User's credit balance
credit_transactions   -- Transaction log (includes refunds)
enhancement_tasks     -- Task status tracking
system_alerts        -- Error logging
```

---

## 🎓 Understanding the Credit System

### User Perspective
```
1. User has credits in account (e.g., 10 credits)
2. User requests enhancement → charged 1 credit
3. Balance: 9 credits
4. If succeeds: Keep charge ✅
5. If fails: Should be refunded ❌ (CURRENTLY BROKEN)
```

### Platform Perspective
```
1. User charged: 1 credit ($0.10 value)
2. Platform spends: 4 NanoBanana credits ($0.10 cost)
3. Ratio: 1:4 (user:platform)
4. If fails early: Platform $0 cost, user should be refunded
5. If fails late: Platform $0.10 cost, user should STILL be refunded
```

### The Problem
```
Currently:
├─ User charged immediately ✅
├─ Task submitted ✅
├─ Task fails ❌
├─ User NOT refunded ❌
└─ User loses money for nothing ❌

Should be:
├─ User charged immediately ✅
├─ Task submitted ✅
├─ Task fails ❌
├─ User refunded automatically ✅
└─ User pays nothing (fair!) ✅
```

---

## 📈 Success Metrics

### Before Implementation
- Failed charges: ~5/month (estimated)
- User complaints: 2-3/month
- Support time: 2-3 hours/month
- Trust level: Low

### After Implementation
- Failed charges: 0/month
- User complaints: 0/month
- Support time: 0 hours/month
- Trust level: High

### Monitor These:
1. **Refund Rate:** Should be < 5%
2. **Failure Rate:** Should be < 5%
3. **Refund Time:** Should be < 1 second
4. **User Satisfaction:** Should increase

---

## 🔧 Testing Checklist

### Manual Testing
- [ ] Submit enhancement with invalid URL
- [ ] Verify task fails
- [ ] Check user credit balance increased
- [ ] Verify refund transaction logged
- [ ] Check system_alerts for issues

### Automated Testing (Recommended)
```typescript
describe('Refund System', () => {
  it('refunds on network error', async () => {
    // Mock network error
    // Submit enhancement
    // Verify refund
  });
  
  it('refunds on API error', async () => {
    // Mock API error response
    // Submit enhancement
    // Verify refund
  });
  
  it('refunds on callback failure', async () => {
    // Mock failed callback
    // Process callback
    // Verify refund
  });
});
```

---

## 🐛 Common Issues & Troubleshooting

### Issue: Refund function doesn't exist
```sql
-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'refund_user_credits';

-- If missing, run the function creation from:
-- scripts/apply-credit-schema-direct.js (lines 252-283)
```

### Issue: Refund not appearing in user balance
```sql
-- Check if refund transaction was created
SELECT * FROM credit_transactions 
WHERE user_id = 'USER_ID' 
  AND transaction_type = 'refund'
ORDER BY created_at DESC;

-- Check user_credits table
SELECT * FROM user_credits WHERE user_id = 'USER_ID';
```

### Issue: System alerts for failed refunds
```sql
-- Check for refund errors
SELECT * FROM system_alerts 
WHERE type = 'refund_failed' 
ORDER BY created_at DESC;
```

---

## 💬 Communication Templates

### User Notification (Automated)
```
Subject: Credit Refund for Failed Enhancement

Hi [User Name],

We noticed your recent image enhancement request failed due to a 
technical issue. Don't worry - we've automatically refunded 1 credit 
to your account.

Your new balance: [X] credits

We apologize for the inconvenience and appreciate your understanding.

Best regards,
The Preset Team
```

### Historical Refund Email
```
Subject: Credit Refund - Our Apologies

Hi [User Name],

We recently identified an issue where some failed enhancement requests 
weren't automatically refunded. We've reviewed your account and 
refunded [X] credits that were incorrectly charged.

Your new balance: [X] credits

We sincerely apologize for this error and have implemented fixes to 
prevent it from happening again.

If you have any questions, please don't hesitate to contact us.

Best regards,
The Preset Team
```

---

## 🔐 Security Considerations

1. **Refund Function:** Only callable by service role or authenticated backend
2. **Validation:** Verify task belongs to user before refunding
3. **Audit Trail:** All refunds logged in credit_transactions
4. **Alerts:** Failed refunds trigger system alerts
5. **Rate Limits:** Monitor for refund abuse patterns

---

## 📞 Support & Questions

### Internal Questions
- **Product:** See REFUND_EXECUTIVE_SUMMARY.md
- **Engineering:** See REFUND_LOGIC_ANALYSIS.md
- **Data:** See find_users_needing_refunds.sql

### User Questions
- Document refund policy in user-facing docs
- Add FAQ section about credits and refunds
- Update ToS if needed

---

## 📝 Changelog

### 2025-01-11: Initial Analysis
- Identified missing refund logic
- Created comprehensive documentation
- Provided implementation guide
- Generated SQL audit queries

### [Future]: After Implementation
- Log implementation date
- Note any issues encountered
- Document final refund count
- Update success metrics

---

## ✅ Sign-Off Checklist

Before marking this as complete:

### Discovery Phase
- [ ] Reviewed all documentation
- [ ] Ran SQL queries to understand scope
- [ ] Identified affected users
- [ ] Calculated impact

### Implementation Phase
- [ ] Added callback refund logic
- [ ] Added API route refunds
- [ ] Added helper functions
- [ ] Tested all scenarios
- [ ] Code reviewed and approved

### Deployment Phase
- [ ] Deployed to staging
- [ ] Tested in staging
- [ ] Deployed to production
- [ ] Monitoring active

### Cleanup Phase
- [ ] Batch refunds executed (if applicable)
- [ ] Users notified
- [ ] Documentation updated
- [ ] Refund policy published

---

**Last Updated:** 2025-01-11  
**Status:** Documentation Complete - Ready for Implementation  
**Priority:** 🔴 HIGH

