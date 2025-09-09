# Preset - Creative Collaboration Platform

A subscription-based, cross-platform creative collaboration app where photographers, videographers, and talent connect for shoots. Built with DDD + Hexagonal architecture.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access the app
open http://localhost:3000
```

## 🔑 Admin Access

### Admin Credentials
- **Email**: admin@preset.ie
- **Password**: AdminPreset2025!
- **Dashboard**: http://localhost:3000/admin

### Admin Capabilities
- Platform credit management
- User administration
- Analytics and monitoring
- Content moderation
- System configuration

## 📱 Key Features

### For Contributors (Photographers/Videographers)
- Create and manage gigs
- AI-powered moodboard generation
- Review applications and book talent
- Showcase completed work

### For Talent
- Browse and apply to gigs
- Build portfolio through showcases
- Message with contributors
- Track application status

### Platform Features
- **AI Moodboard Builder**: Upload images or generate with AI
- **Credit Marketplace**: Simple 1-credit pricing (handles provider complexity)
- **Subscription Tiers**: Free, Plus (€9-12/mo), Pro (€19-24/mo)
- **Safety & Trust**: Age verification, release forms, moderation

## 💳 Credit System

### User Perspective
- 1 credit = 1 enhancement/generation
- Simple, predictable pricing

### Platform Reality (Admin Only)
- NanoBanana: 1 user credit = 4 provider credits
- OpenAI: 1 user credit = 0.1 provider credits
- Pexels: 1 user credit = 1 API call

### Credit Packages
- **Starter Pack**: 10 credits @ €9.99
- **Creative Bundle**: 50 credits @ €39.99
- **Pro Pack**: 100 credits @ €69.99
- **Studio Pack**: 500 credits @ €299.99

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React, TailwindCSS
- **Backend**: Supabase (Postgres + Auth + Storage)
- **AI Services**: NanoBanana, OpenAI, Pexels
- **Architecture**: Domain-Driven Design with Hexagonal/Ports & Adapters
- **Deployment**: Vercel + Supabase Edge Functions

### Project Structure
```
preset/
├── apps/
│   ├── web/         # Next.js app
│   └── edge/        # Edge functions
├── packages/
│   ├── domain/      # DDD domain logic
│   ├── application/ # Use cases & ports
│   ├── adapters/    # External integrations
│   └── ui/          # Shared components
└── scripts/         # Admin & utility scripts
```

## 🛠️ Development

### Environment Variables
Create `.env.local` with:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# NanoBanana API
NANOBANANA_API_KEY=your_api_key
NANOBANANA_CREDIT_RATIO=4

# Other services
OPENAI_API_KEY=your_openai_key
PEXELS_API_KEY=your_pexels_key
```

### Database Setup
```bash
# Apply migrations
npx supabase db push

# Create platform credit tables
psql $DATABASE_URL -f execute_platform_sql.sql

# Create admin user
node scripts/create-admin-user.js
```

### Testing
```bash
# Run tests
npm test

# Test enhancement flow
node scripts/test-mock-enhancement.js

# Test credit system
node scripts/test-user-credits.js
```

## 📊 Admin Dashboard

### Accessing Admin Features
1. Sign in with admin credentials
2. Navigate to `/admin`
3. Monitor platform health, credits, and analytics

### Key Admin Functions
- **Credit Management**: Monitor and refill platform credits
- **User Management**: View users, modify roles, manage subscriptions
- **Analytics**: Track growth, revenue, usage patterns
- **Content Moderation**: Review reported content
- **System Health**: Monitor error rates and performance

## 🔒 Security

### Authentication
- Supabase Auth with email/OTP
- Role-based access control (ADMIN, CONTRIBUTOR, TALENT)
- Row Level Security (RLS) policies

### Data Protection
- Private storage buckets
- Signed URLs for media
- EXIF data stripping
- GDPR compliance ready

## 📈 Monitoring

### Platform Health Indicators
- 🟢 **Excellent**: >5x credit threshold
- 🟡 **Good**: >2x credit threshold
- 🟠 **Warning**: >1x threshold
- 🔴 **Critical**: Below threshold

### Key Metrics
- User growth rate
- Credit consumption
- Revenue per user
- Error rates
- Active users

## 🚢 Deployment

### Production Deployment
```bash
# Deploy to Vercel
vercel deploy --prod

# Update environment variables
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Run production migrations
npx supabase db push --db-url $PRODUCTION_DB_URL
```

### Monitoring Production
- Check `/admin` dashboard regularly
- Monitor Supabase dashboard
- Review Vercel analytics
- Track error rates in logs

## 📝 Documentation

- [Admin Dashboard Guide](./ADMIN_DASHBOARD.md)
- [Credit Marketplace](./CREDIT_MARKETPLACE.md)
- [API Documentation](./docs/API.md)
- [Architecture Overview](./CLAUDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Copyright © 2025 Preset. All rights reserved.

## 🆘 Support

- **Admin Issues**: Check [Admin Dashboard Guide](./ADMIN_DASHBOARD.md)
- **Credit Issues**: See [Credit Marketplace](./CREDIT_MARKETPLACE.md)
- **General Help**: Create an issue on GitHub

---

Built with ❤️ for the creative community