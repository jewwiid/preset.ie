# 🚀 Preset Platform Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works)

## Step 1: Installation
```bash
# Clone the repository
git clone https://github.com/preset/preset.ie.git
cd preset

# Install dependencies
npm install
```

## Step 2: Environment Setup
Create `.env.local` file in the root directory with your credentials:
```env
# Copy from .env.example and fill in your values
cp .env.example .env.local
```

## Step 3: Start Development Server
```bash
npm run dev
```
The app will be available at http://localhost:3000

## Step 4: Access Admin Dashboard

### Admin Login Credentials
- **Email**: `admin@preset.ie`
- **Password**: `AdminPreset2025!`
- **URL**: http://localhost:3000/admin

### First Admin Login
1. Go to http://localhost:3000/auth/signin
2. Enter admin credentials
3. Click "Sign In"
4. Navigate to http://localhost:3000/admin

## Step 5: Platform Configuration

### Check Platform Credits
1. Go to Admin Dashboard → Credits tab
2. Verify NanoBanana balance (should show 10,000 credits)
3. If low, click "+10,000" to refill

### Monitor Platform Health
- 🟢 Green = Healthy (>5x threshold)
- 🟡 Yellow = Good (>2x threshold)  
- 🟠 Orange = Warning (>1x threshold)
- 🔴 Red = Critical (below threshold)

## Quick Test: Enhancement Flow

### 1. Create a Test User
```bash
node scripts/test-mock-enhancement.js
```
This creates a test user with credits and a sample gig.

### 2. Test Enhancement
1. Sign in as the test user
2. Go to Dashboard → Your Gigs
3. Click on the test gig
4. View moodboard and click "Enhance" on any image
5. Watch the credit deduction (1 credit from user perspective)

## Common Commands

### Admin Management
```bash
# Make any user an admin
node scripts/make-admin.js user@example.com

# Create new admin account
node scripts/create-admin-user.js
```

### Database Operations
```bash
# Run migrations
npx supabase db push

# Check database status
npx supabase db status

# Reset database (CAUTION!)
npx supabase db reset
```

### Testing
```bash
# Test credit system
node scripts/test-user-credits.js

# Test enhancement API
node scripts/test-credit-api.js

# Run all tests
npm test
```

## Troubleshooting

### "Cannot access admin dashboard"
```bash
# Ensure user has admin role
node scripts/make-admin.js your-email@example.com
```

### "Platform has insufficient credits"
1. Go to Admin Dashboard → Credits
2. Click "+10,000" next to NanoBanana
3. Confirm the refill

### "Enhancement failing"
Check:
1. User has credits (Admin → Users)
2. Platform has credits (Admin → Credits)
3. NanoBanana API key is valid (.env.local)

### "Database connection issues"
```bash
# Test connection
npx supabase status

# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

## Development Workflow

### 1. Regular Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run linter
npm run typecheck    # Check TypeScript
```

### 2. Admin Tasks (Daily)
- Check platform credit levels
- Review analytics trends
- Monitor error rates
- Check for reported content

### 3. Platform Maintenance (Weekly)
- Review user growth metrics
- Analyze credit consumption
- Check revenue reports
- Update credit packages if needed

## Key URLs

### Development
- App: http://localhost:3000
- Admin: http://localhost:3000/admin
- Auth: http://localhost:3000/auth/signin

### Documentation
- Admin Guide: [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md)
- Credit System: [CREDIT_MARKETPLACE.md](./CREDIT_MARKETPLACE.md)
- Architecture: [CLAUDE.md](./CLAUDE.md)

## Support Channels

### For Developers
- GitHub Issues: Report bugs and feature requests
- Documentation: Check `/docs` folder
- Admin Guide: [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md)

### For Platform Admins
- Admin Dashboard: http://localhost:3000/admin
- Analytics: Monitor platform health
- Credit Management: Ensure sufficient provider credits

## Next Steps

1. ✅ Verify admin access works
2. ✅ Check platform credits are sufficient
3. ✅ Test the enhancement flow
4. ✅ Review analytics dashboard
5. ✅ Configure credit packages if needed

---

**Need help?** Check the [Admin Dashboard Guide](./ADMIN_DASHBOARD.md) or create an issue on GitHub.