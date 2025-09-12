# 🎯 How to Add Credit Balance to Navigation

## Quick Integration Guide

### Step 1: Import the Credit Balance Component
```typescript
import CreditBalance from '../components/CreditBalance';
```

### Step 2: Add to Your Navigation/Header Component
```typescript
// In your navigation component (e.g., NavBar.tsx, Header.tsx, Layout.tsx)

export default function Navigation() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/gigs">Gigs</Link>
            <Link href="/showcases">Showcases</Link>
            
            {/* Credit Balance Widget */}
            <CreditBalance showPurchaseButton={true} />
            
            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
```

## 📱 Component Props

### `CreditBalance` Component
```typescript
interface CreditBalanceProps {
  className?: string;           // Optional CSS classes
  showPurchaseButton?: boolean; // Show "Buy" button when credits are low
}

// Usage examples:
<CreditBalance />                                    // Default
<CreditBalance showPurchaseButton={false} />        // No purchase button
<CreditBalance className="ml-4" />                  // Custom styling
```

## 🎨 Visual Examples

### 1. Full Navigation Bar
```typescript
<div className="flex items-center space-x-4">
  <Link href="/dashboard">Dashboard</Link>
  <CreditBalance />
  <UserDropdown />
</div>
```
**Result:** `[Dashboard] [💰 25 credits] [Buy] [👤 User ▾]`

### 2. Sidebar Layout
```typescript
<aside className="w-64 bg-gray-50">
  <div className="p-4 space-y-4">
    <h2>Quick Stats</h2>
    <CreditBalance className="w-full" />
    <Link href="/profile">Profile Settings</Link>
  </div>
</aside>
```

### 3. Mobile-Friendly Header
```typescript
<header className="bg-white shadow-sm">
  <div className="flex items-center justify-between p-4">
    <Logo />
    <div className="flex items-center space-x-2">
      <CreditBalance showPurchaseButton={false} />
      <MobileMenuButton />
    </div>
  </div>
</header>
```

## 🔄 Auto-Refresh Feature

The credit balance automatically refreshes when:
- ✅ User logs in/out
- ✅ Credit purchase completes
- ✅ Credits are consumed for enhancements

### Manual Refresh (if needed)
```typescript
import { refreshCreditBalance } from '../components/CreditBalance';

// After a credit transaction
refreshCreditBalance();
```

## 🎯 User Experience Features

### Low Credit Warning
When user has < 10 credits, the component automatically shows a "Buy" button:

```
💰 3 credits [Buy More]
```

### Loading State
Shows loading animation while fetching balance:

```
⚫ -- credits  (loading)
```

### No User State
Component automatically hides when user is not logged in.

## 📍 Recommended Placement

### ✅ Best Places to Add Credit Balance:
1. **Main Navigation Bar** - Always visible
2. **User Dashboard Header** - Context-appropriate
3. **Sidebar Menu** - Easy access
4. **Mobile Header** - Space-efficient

### ❌ Avoid These Places:
- Landing pages (before login)
- Public showcase pages
- Marketing pages
- Error pages

## 🛠️ Example Integration

Here's a complete example of integrating into an existing navigation:

```typescript
// components/NavBar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import CreditBalance from './CreditBalance';

export default function NavBar() {
  const { user, loading } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-800">
              Preset
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {user && !loading && (
              <>
                <Link href="/gigs" className="text-gray-700 hover:text-gray-900">
                  Gigs
                </Link>
                <Link href="/showcases" className="text-gray-700 hover:text-gray-900">
                  Showcases
                </Link>
                
                {/* Credit Balance - Always visible for logged-in users */}
                <CreditBalance showPurchaseButton={true} />
                
                <Link href="/profile" className="text-gray-700 hover:text-gray-900">
                  Profile
                </Link>
              </>
            )}
            
            {!user && !loading && (
              <Link href="/auth/signin" className="btn-primary">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

## 🎉 Result
Users will see their credit balance in the navigation and can easily:
- ✅ Check their current balance at any time
- ✅ Get prompted to buy more when running low
- ✅ Click to go to the purchase page
- ✅ See their balance update in real-time

This creates a seamless credit management experience integrated directly into your app's navigation!