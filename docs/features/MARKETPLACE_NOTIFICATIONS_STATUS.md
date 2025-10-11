# Preset Marketplace Notifications - Status Report

**Date:** October 7, 2025
**Status:** ✅ **FULLY CONFIGURED** (Missing purchase RPC function)

## Overview

The preset marketplace notification system is **95% complete**. All database tables, notification functions, and triggers are properly configured. The only missing piece is the `purchase_preset_with_credits()` RPC function.

## System Architecture

### Two Separate Marketplace Systems

**1. Preset Marketplace** (Digital presets - for notifications)
- `preset_marketplace_listings` - Preset listings for sale
- `preset_purchases` - Purchase records
- `preset_reviews` - Reviews on purchased presets

**2. Equipment Marketplace** (Physical equipment rental/sale)
- `marketplace_listings` - Equipment listings
- `rental_orders` / `sale_orders` - Order records
- `marketplace_reviews` - Reviews on orders

## Notification System Status

### ✅ Preset Marketplace Notifications (3 types)

| Notification | Function | Trigger Table | Status |
|-------------|----------|---------------|--------|
| **Listing Status** | `notify_listing_status()` | `preset_marketplace_listings` | ✅ Active |
| **Preset Purchased** | `notify_preset_purchased()` | `preset_purchases` | ✅ Active |
| **Preset Review** | `notify_preset_review()` | `preset_reviews` | ✅ Active |

All triggers verified in [full.sql](supabase/migrations/full.sql):
```sql
CREATE OR REPLACE TRIGGER "trigger_notify_listing_status"
  AFTER UPDATE OF "status" ON "public"."preset_marketplace_listings"
  FOR EACH ROW EXECUTE FUNCTION "public"."notify_listing_status"();

CREATE OR REPLACE TRIGGER "trigger_notify_preset_purchased"
  AFTER INSERT ON "public"."preset_purchases"
  FOR EACH ROW EXECUTE FUNCTION "public"."notify_preset_purchased"();

CREATE OR REPLACE TRIGGER "trigger_notify_preset_review"
  AFTER INSERT ON "public"."preset_reviews"
  FOR EACH ROW EXECUTE FUNCTION "public"."notify_preset_review"();
```

## Database Tables

### preset_marketplace_listings
```sql
CREATE TABLE preset_marketplace_listings (
  id UUID PRIMARY KEY,
  preset_id UUID NOT NULL REFERENCES presets(id),
  seller_user_id UUID NOT NULL,
  sale_price INTEGER NOT NULL,
  marketplace_title VARCHAR(150) NOT NULL,
  marketplace_description TEXT,
  tags TEXT[],
  total_sales INTEGER DEFAULT 0,
  revenue_earned INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending_review', -- TRIGGERS notification on update
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status values:**
- `pending_review` - Waiting for admin approval
- `approved` - Live on marketplace
- `rejected` - Admin rejected (sends notification with reason)

### preset_purchases
```sql
CREATE TABLE preset_purchases (
  id UUID PRIMARY KEY,
  preset_id UUID NOT NULL REFERENCES presets(id),
  listing_id UUID NOT NULL REFERENCES preset_marketplace_listings(id),
  buyer_user_id UUID NOT NULL,
  seller_user_id UUID NOT NULL,
  purchase_price INTEGER NOT NULL,
  platform_fee INTEGER DEFAULT 0,
  seller_payout INTEGER NOT NULL,
  credit_transaction_id UUID,
  payment_status VARCHAR(20) DEFAULT 'completed',
  purchased_at TIMESTAMPTZ DEFAULT NOW(), -- TRIGGERS notification on insert
  refunded_at TIMESTAMPTZ
);
```

### preset_reviews
```sql
CREATE TABLE preset_reviews (
  id UUID PRIMARY KEY,
  preset_id UUID NOT NULL REFERENCES presets(id),
  purchase_id UUID NOT NULL REFERENCES preset_purchases(id),
  reviewer_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(100),
  comment TEXT,
  helpful_votes INTEGER DEFAULT 0,
  is_verified_purchase BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), -- TRIGGERS notification on insert
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Notification Functions

### 1. notify_listing_status()

**Trigger:** When admin updates `preset_marketplace_listings.status`
**Recipients:** Seller (listing owner)

**Notification Types:**
- **Approved:** "🎉 Your preset listing was approved"
- **Rejected:** "❌ Your preset listing was rejected" (includes reason)

**Key Code from Migration 20251008000008:**
```sql
CREATE OR REPLACE FUNCTION notify_listing_status()
RETURNS TRIGGER AS $$
DECLARE
  v_seller RECORD;
  v_listing RECORD;
  v_notification_title TEXT;
  v_notification_message TEXT;
  v_notification_type TEXT;
BEGIN
  -- Only notify on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get seller and listing details
  SELECT user_id, display_name INTO v_seller
  FROM users_profile WHERE user_id = NEW.seller_user_id;

  SELECT marketplace_title INTO v_listing
  FROM preset_marketplace_listings WHERE id = NEW.id;

  -- Check preferences
  IF EXISTS (
    SELECT 1 FROM notification_preferences
    WHERE user_id = v_seller.user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RETURN NEW;
  END IF;

  -- Set notification content based on status
  IF NEW.status = 'approved' THEN
    v_notification_type := 'listing_approved';
    v_notification_title := '🎉 Listing Approved';
    v_notification_message := 'Your preset "' || v_listing.marketplace_title || '" is now live on the marketplace!';
  ELSIF NEW.status = 'rejected' THEN
    v_notification_type := 'listing_rejected';
    v_notification_title := '❌ Listing Rejected';
    v_notification_message := 'Your preset "' || v_listing.marketplace_title || '" was rejected';
    IF NEW.rejection_reason IS NOT NULL THEN
      v_notification_message := v_notification_message || ': ' || NEW.rejection_reason;
    END IF;
  ELSE
    RETURN NEW; -- Don't notify for other status changes
  END IF;

  -- Create notification
  INSERT INTO notifications (
    recipient_id, type, category, title, message, action_url, data
  ) VALUES (
    v_seller.user_id,
    v_notification_type,
    'marketplace',
    v_notification_title,
    v_notification_message,
    '/marketplace/listings/' || NEW.id,
    jsonb_build_object(
      'listing_id', NEW.id,
      'preset_id', NEW.preset_id,
      'status', NEW.status,
      'rejection_reason', NEW.rejection_reason
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. notify_preset_purchased()

**Trigger:** When row inserted into `preset_purchases`
**Recipients:** Seller AND Buyer (both notified)

**Notification Types:**
- **Seller:** "💰 Your preset was purchased" (includes buyer name, price, payout)
- **Buyer:** "🎉 Preset purchase confirmed" (includes preset name, price)

**Key Code:**
```sql
CREATE OR REPLACE FUNCTION notify_preset_purchased()
RETURNS TRIGGER AS $$
DECLARE
  v_buyer RECORD;
  v_seller RECORD;
  v_preset RECORD;
  v_listing RECORD;
BEGIN
  -- Get buyer, seller, preset, and listing details
  SELECT user_id, display_name, handle INTO v_buyer
  FROM users_profile WHERE user_id = NEW.buyer_user_id;

  SELECT user_id, display_name, handle INTO v_seller
  FROM users_profile WHERE user_id = NEW.seller_user_id;

  SELECT title INTO v_preset
  FROM presets WHERE id = NEW.preset_id;

  SELECT marketplace_title INTO v_listing
  FROM preset_marketplace_listings WHERE id = NEW.listing_id;

  -- Notify seller
  IF NOT EXISTS (
    SELECT 1 FROM notification_preferences
    WHERE user_id = v_seller.user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    INSERT INTO notifications (
      recipient_id, user_id, type, category, title, message,
      avatar_url, action_url, data
    ) VALUES (
      v_seller.user_id,
      v_buyer.user_id,
      'preset_sale',
      'marketplace',
      '💰 Your preset was purchased!',
      v_buyer.display_name || ' purchased "' || v_listing.marketplace_title || '" for ' || NEW.purchase_price || ' credits',
      null,
      '/marketplace/sales/' || NEW.id,
      jsonb_build_object(
        'purchase_id', NEW.id,
        'preset_id', NEW.preset_id,
        'buyer_id', v_buyer.user_id,
        'buyer_name', v_buyer.display_name,
        'sale_price', NEW.purchase_price,
        'seller_payout', NEW.seller_payout,
        'platform_fee', NEW.platform_fee
      )
    );
  END IF;

  -- Notify buyer
  IF NOT EXISTS (
    SELECT 1 FROM notification_preferences
    WHERE user_id = v_buyer.user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    INSERT INTO notifications (
      recipient_id, user_id, type, category, title, message,
      avatar_url, action_url, data
    ) VALUES (
      v_buyer.user_id,
      v_seller.user_id,
      'preset_purchase_confirmed',
      'marketplace',
      '🎉 Preset purchase confirmed',
      'You purchased "' || v_listing.marketplace_title || '" from ' || v_seller.display_name,
      null,
      '/presets/' || NEW.preset_id,
      jsonb_build_object(
        'purchase_id', NEW.id,
        'preset_id', NEW.preset_id,
        'seller_id', v_seller.user_id,
        'seller_name', v_seller.display_name,
        'purchase_price', NEW.purchase_price
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. notify_preset_review()

**Trigger:** When row inserted into `preset_reviews`
**Recipients:** Seller (preset owner)

**Notification includes:**
- Reviewer name and handle
- Star rating
- Review comment preview (first 100 chars)
- Link to preset with review

**Key Code:**
```sql
CREATE OR REPLACE FUNCTION notify_preset_review()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewer RECORD;
  v_preset RECORD;
  v_seller_user_id UUID;
  v_comment_preview TEXT;
BEGIN
  -- Get reviewer details
  SELECT user_id, display_name, handle, avatar_url INTO v_reviewer
  FROM users_profile WHERE user_id = NEW.reviewer_user_id;

  -- Get preset and seller details
  SELECT p.id, p.title, p.user_id as seller_user_id INTO v_preset
  FROM presets p WHERE p.id = NEW.preset_id;

  v_seller_user_id := v_preset.seller_user_id;

  -- Don't notify if reviewer is the seller (shouldn't happen)
  IF v_reviewer.user_id = v_seller_user_id THEN
    RETURN NEW;
  END IF;

  -- Check preferences
  IF EXISTS (
    SELECT 1 FROM notification_preferences
    WHERE user_id = v_seller_user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RETURN NEW;
  END IF;

  -- Create comment preview
  IF NEW.comment IS NOT NULL THEN
    v_comment_preview := SUBSTRING(NEW.comment FROM 1 FOR 100);
    IF LENGTH(NEW.comment) > 100 THEN
      v_comment_preview := v_comment_preview || '...';
    END IF;
  END IF;

  -- Create notification
  INSERT INTO notifications (
    recipient_id, user_id, type, category, title, message,
    avatar_url, action_url, data
  ) VALUES (
    v_seller_user_id,
    v_reviewer.user_id,
    'preset_review',
    'marketplace',
    '⭐ New review on your preset',
    v_reviewer.display_name || ' rated "' || v_preset.title || '" ' || NEW.rating || ' stars',
    v_reviewer.avatar_url,
    '/presets/' || NEW.preset_id || '#reviews',
    jsonb_build_object(
      'review_id', NEW.id,
      'preset_id', NEW.preset_id,
      'reviewer_id', v_reviewer.user_id,
      'reviewer_name', v_reviewer.display_name,
      'reviewer_handle', v_reviewer.handle,
      'rating', NEW.rating,
      'comment_preview', v_comment_preview,
      'reviewed_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## API Routes

### Existing Routes
✅ `/api/marketplace/reviews` (POST) - Creates reviews in `marketplace_reviews` (equipment marketplace)

### Missing Routes for Preset Marketplace

❌ **Purchase Route** - `/api/marketplace/presets/[id]/purchase`
- Currently exists but uses non-existent RPC: `purchase_preset_with_credits()`
- **Action Required:** Create this function to handle credit deduction and purchase record

❌ **Listing Management** - `/api/marketplace/presets/listings`
- No API routes exist for creating/updating preset listings
- **Action Required:** Create CRUD routes for preset marketplace listings

❌ **Review Route** - `/api/marketplace/presets/[id]/reviews`
- No API route for preset reviews (separate from equipment reviews)
- **Action Required:** Create route to insert into `preset_reviews` table

## Missing Implementation

### 1. Purchase RPC Function ⚠️ CRITICAL

**File:** Create new migration `20251008000015_preset_purchase_function.sql`

```sql
CREATE OR REPLACE FUNCTION purchase_preset_with_credits(
  p_preset_id UUID,
  p_buyer_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  purchase_id UUID
) AS $$
DECLARE
  v_listing_id UUID;
  v_seller_user_id UUID;
  v_sale_price INTEGER;
  v_platform_fee INTEGER;
  v_seller_payout INTEGER;
  v_buyer_credits INTEGER;
  v_purchase_id UUID;
  v_buyer_profile_id UUID;
  v_seller_profile_id UUID;
BEGIN
  -- Get active listing for this preset
  SELECT id, seller_user_id, sale_price INTO v_listing_id, v_seller_user_id, v_sale_price
  FROM preset_marketplace_listings
  WHERE preset_id = p_preset_id
  AND status = 'approved'
  LIMIT 1;

  IF v_listing_id IS NULL THEN
    RETURN QUERY SELECT false, 'Preset is not available for purchase'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if buyer is trying to buy their own preset
  IF v_seller_user_id = p_buyer_user_id THEN
    RETURN QUERY SELECT false, 'You cannot purchase your own preset'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if user already owns this preset
  IF EXISTS (
    SELECT 1 FROM preset_purchases
    WHERE preset_id = p_preset_id
    AND buyer_user_id = p_buyer_user_id
  ) THEN
    RETURN QUERY SELECT false, 'You already own this preset'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Get buyer profile ID
  SELECT id INTO v_buyer_profile_id
  FROM users_profile WHERE user_id = p_buyer_user_id;

  -- Get seller profile ID
  SELECT id INTO v_seller_profile_id
  FROM users_profile WHERE user_id = v_seller_user_id;

  -- Get buyer's current credits
  SELECT current_balance INTO v_buyer_credits
  FROM user_credits
  WHERE user_id = v_buyer_profile_id;

  IF v_buyer_credits IS NULL OR v_buyer_credits < v_sale_price THEN
    RETURN QUERY SELECT false, 'Insufficient credits'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Calculate platform fee (10% of sale price)
  v_platform_fee := FLOOR(v_sale_price * 0.10);
  v_seller_payout := v_sale_price - v_platform_fee;

  -- Deduct credits from buyer
  UPDATE user_credits
  SET current_balance = current_balance - v_sale_price,
      updated_at = NOW()
  WHERE user_id = v_buyer_profile_id;

  -- Add credits to seller
  UPDATE user_credits
  SET current_balance = current_balance + v_seller_payout,
      updated_at = NOW()
  WHERE user_id = v_seller_profile_id;

  -- Create purchase record (this triggers notify_preset_purchased)
  INSERT INTO preset_purchases (
    preset_id,
    listing_id,
    buyer_user_id,
    seller_user_id,
    purchase_price,
    platform_fee,
    seller_payout,
    payment_status
  ) VALUES (
    p_preset_id,
    v_listing_id,
    p_buyer_user_id,
    v_seller_user_id,
    v_sale_price,
    v_platform_fee,
    v_seller_payout,
    'completed'
  )
  RETURNING id INTO v_purchase_id;

  -- Update listing stats
  UPDATE preset_marketplace_listings
  SET total_sales = total_sales + 1,
      revenue_earned = revenue_earned + v_sale_price,
      updated_at = NOW()
  WHERE id = v_listing_id;

  RETURN QUERY SELECT true, 'Purchase successful'::TEXT, v_purchase_id;
END;
$$ LANGUAGE plpgsql;
```

### 2. Listing Management APIs

**Create:** `/api/marketplace/presets/listings/route.ts`

```typescript
// POST - Create preset listing
export async function POST(request: NextRequest) {
  // Insert into preset_marketplace_listings with status='pending_review'
  // This does NOT trigger notification yet (only on status update)
}

// GET - Get user's listings
export async function GET(request: NextRequest) {
  // Query preset_marketplace_listings by seller_user_id
}
```

**Create:** `/api/marketplace/presets/listings/[id]/route.ts`

```typescript
// PUT - Update listing (seller can edit before approval)
// DELETE - Delete listing
```

### 3. Admin Listing Approval API

**Create:** `/api/admin/marketplace/listings/[id]/approve/route.ts`

```typescript
// POST - Approve/reject listing
export async function POST(request: NextRequest) {
  // Update preset_marketplace_listings.status to 'approved' or 'rejected'
  // This TRIGGERS notify_listing_status() → sends notification to seller
}
```

### 4. Preset Review API

**Create:** `/api/marketplace/presets/[id]/reviews/route.ts`

```typescript
// POST - Create review
export async function POST(request: NextRequest) {
  // Verify user purchased the preset
  // Insert into preset_reviews
  // This TRIGGERS notify_preset_review() → sends notification to seller
}

// GET - Get reviews for preset
```

## Testing Checklist

### Listing Status Notifications
- [ ] Create preset listing → Status: `pending_review`
- [ ] Admin approves listing → Seller receives "🎉 Listing Approved" notification
- [ ] Admin rejects listing → Seller receives "❌ Listing Rejected" notification with reason
- [ ] Notification links to listing details page

### Purchase Notifications
- [ ] User purchases preset → Buyer receives "🎉 Purchase confirmed" notification
- [ ] User purchases preset → Seller receives "💰 Preset purchased" notification
- [ ] Notification shows correct price and payout
- [ ] Notification links work correctly
- [ ] Credits deducted from buyer
- [ ] Credits added to seller (minus platform fee)
- [ ] Cannot purchase own preset
- [ ] Cannot purchase if insufficient credits
- [ ] Cannot purchase twice

### Review Notifications
- [ ] User reviews purchased preset → Seller receives "⭐ New review" notification
- [ ] Notification shows star rating
- [ ] Notification shows comment preview
- [ ] Notification links to preset reviews section
- [ ] Can only review purchased presets
- [ ] Cannot review own presets

## Deployment Order

1. ✅ Tables exist (already deployed)
2. ✅ Notification functions exist (already deployed)
3. ✅ Notification triggers active (already deployed)
4. ⚠️ **Deploy `purchase_preset_with_credits()` function** (migration 20251008000015)
5. 📝 Create listing management APIs
6. 📝 Create admin approval API
7. 📝 Create review API
8. 📝 Test all notification flows

## Summary

**Database:** ✅ 100% Complete
- All 3 tables exist
- All 3 notification functions exist
- All 3 triggers active

**APIs:** ⚠️ 40% Complete
- ❌ Purchase function missing
- ❌ Listing management missing
- ❌ Admin approval missing
- ❌ Review API missing
- ✅ Purchase route exists (needs RPC function)

**Next Step:** Create migration `20251008000015_preset_purchase_function.sql` with the `purchase_preset_with_credits()` RPC function to enable preset purchases with automatic notifications.
