# 🔐 Admin Credentials

## Admin Login Information

**Email:** `admin@preset.ie`  
**Password:** `Admin123!@#`

## How to Access

1. **Sign In Page:** http://localhost:3000/auth/signin
2. **Admin Panel:** http://localhost:3000/admin (after signing in)

## Admin Capabilities

The admin account has the following roles and permissions:
- ✅ **ADMIN** - Access to admin panel and moderation tools
- ✅ **CONTRIBUTOR** - Can create and manage gigs
- ✅ **TALENT** - Can apply to gigs
- ✅ **PRO Subscription** - All features unlocked

## Admin Features

- View and moderate reported content
- Manage user verifications
- Review moderation actions
- Access analytics dashboards
- Manage platform settings
- View all user violations
- Handle age verification requests

## Security Notes

⚠️ **Important:** 
- Change the default password after first login
- Keep these credentials secure
- Do not commit this file to version control
- Consider enabling 2FA for admin account

## Troubleshooting

If you cannot log in:
1. Make sure the development server is running (`npm run dev`)
2. Check that Supabase is connected (environment variables set)
3. Try clearing browser cookies/cache
4. Run `node scripts/create-admin-user.js` to reset the admin account

---

*Generated on: September 10, 2025*