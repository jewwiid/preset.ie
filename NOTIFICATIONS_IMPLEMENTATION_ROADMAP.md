# 🔔 Notifications System - Complete Implementation Roadmap

**Goal**: Achieve 100% notification coverage across all platform features
**Current Coverage**: ~30%
**Target**: 100%
**Estimated Timeline**: 4-6 weeks (3 phases)

---

## 📊 Current State Analysis

### ✅ What's Working (30% Coverage)
- **Gig Matchmaking**: When gigs are published, top 20 compatible talent are notified
- **Collaboration System**: Invites, project updates, file sharing
- **Marketplace Messages**: New message notifications
- **Admin Actions**: User sanctions/warnings
- **Infrastructure**: Full database schema, preferences system, UI components ready

### ❌ Critical Gaps (70% Missing)
- **Gig Applications**: Zero notifications (biggest gap!)
- **Bookings**: No notifications at all
- **Payments/Credits**: No financial notifications
- **Marketplace**: Incomplete (only messages work)
- **Social**: No engagement notifications
- **System**: Minimal coverage

---

## 🎯 Phase 1: Critical Business Functions (Week 1-2)

### Priority: 🔴 CRITICAL - Revenue & Core Workflow Impact

### 1. Gig Application System Notifications

#### 1.1 Application Received Notification
**Trigger**: When talent applies to a gig
**Recipient**: Gig owner
**Implementation**:

```typescript
// File: apps/web/app/api/gigs/[id]/apply/route.ts
// OR: Create new file if doesn't exist

export async function POST(request: NextRequest) {
  // ... existing application logic ...

  // After successful application creation:
  await supabase
    .from('notifications')
    .insert({
      recipient_id: gigOwner.user_id,
      user_id: applicant.user_id,
      type: 'new_application',
      category: 'gig',
      title: `New application for "${gig.title}"`,
      message: `${applicant.display_name} applied for your gig`,
      avatar_url: applicant.avatar_url,
      action_url: `/gigs/${gig.id}/applications`,
      data: {
        gig_id: gig.id,
        gig_title: gig.title,
        applicant_id: applicant.id,
        applicant_name: applicant.display_name
      }
    })
}
```

**Database Trigger Alternative** (Recommended):
```sql
-- File: supabase/migrations/110_gig_application_notifications.sql

CREATE OR REPLACE FUNCTION notify_gig_application_received()
RETURNS TRIGGER AS $$
DECLARE
  v_gig RECORD;
  v_applicant RECORD;
  v_owner_prefs RECORD;
BEGIN
  -- Get gig details
  SELECT g.*, up.user_id as owner_user_id, up.display_name as owner_name
  INTO v_gig
  FROM gigs g
  JOIN users_profile up ON g.owner_user_id = up.user_id
  WHERE g.id = NEW.gig_id;

  -- Get applicant details
  SELECT user_id, display_name, avatar_url
  INTO v_applicant
  FROM users_profile
  WHERE id = NEW.applicant_id;

  -- Check owner's notification preferences
  SELECT application_notifications, in_app_enabled
  INTO v_owner_prefs
  FROM notification_preferences
  WHERE user_id = v_gig.owner_user_id;

  -- Only send if preferences allow
  IF v_owner_prefs.application_notifications AND v_owner_prefs.in_app_enabled THEN
    INSERT INTO notifications (
      recipient_id,
      user_id,
      type,
      category,
      title,
      message,
      avatar_url,
      action_url,
      data
    ) VALUES (
      v_gig.owner_user_id,
      v_applicant.user_id,
      'new_application',
      'gig',
      'New application for "' || v_gig.title || '"',
      v_applicant.display_name || ' applied for your gig',
      v_applicant.avatar_url,
      '/gigs/' || v_gig.id || '/applications',
      jsonb_build_object(
        'gig_id', v_gig.id,
        'gig_title', v_gig.title,
        'applicant_id', NEW.applicant_id,
        'applicant_name', v_applicant.display_name,
        'application_id', NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_gig_application_received
  AFTER INSERT ON gig_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_gig_application_received();
```

**Testing Checklist**:
- [ ] Create test gig
- [ ] Apply to gig as different user
- [ ] Verify owner receives notification
- [ ] Check notification appears in bell dropdown
- [ ] Verify action URL navigates to applications page
- [ ] Confirm notification respects preferences

---

#### 1.2 Application Status Changed Notification
**Trigger**: When owner accepts/rejects application
**Recipient**: Applicant

```sql
-- File: supabase/migrations/110_gig_application_notifications.sql (continued)

CREATE OR REPLACE FUNCTION notify_application_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_gig RECORD;
  v_applicant RECORD;
  v_applicant_prefs RECORD;
  v_status_message TEXT;
  v_notification_title TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get gig details
  SELECT id, title
  INTO v_gig
  FROM gigs
  WHERE id = NEW.gig_id;

  -- Get applicant details and preferences
  SELECT up.user_id, up.display_name, up.avatar_url,
         np.application_notifications, np.in_app_enabled
  INTO v_applicant
  FROM users_profile up
  LEFT JOIN notification_preferences np ON up.user_id = np.user_id
  WHERE up.id = NEW.applicant_id;

  -- Only send if preferences allow
  IF v_applicant.application_notifications AND v_applicant.in_app_enabled THEN
    -- Customize message based on status
    CASE NEW.status
      WHEN 'ACCEPTED' THEN
        v_notification_title := '🎉 Application accepted!';
        v_status_message := 'Your application for "' || v_gig.title || '" was accepted';
      WHEN 'REJECTED' THEN
        v_notification_title := 'Application update';
        v_status_message := 'Your application for "' || v_gig.title || '" was not selected this time';
      WHEN 'SHORTLISTED' THEN
        v_notification_title := '⭐ You\'re shortlisted!';
        v_status_message := 'You\'re on the shortlist for "' || v_gig.title || '"';
      ELSE
        RETURN NEW; -- Don't notify for other status changes
    END CASE;

    INSERT INTO notifications (
      recipient_id,
      user_id,
      type,
      category,
      title,
      message,
      action_url,
      data
    ) VALUES (
      v_applicant.user_id,
      v_applicant.user_id, -- Self-notification
      'application_status',
      'gig',
      v_notification_title,
      v_status_message,
      '/gigs/' || v_gig.id,
      jsonb_build_object(
        'gig_id', v_gig.id,
        'gig_title', v_gig.title,
        'application_id', NEW.id,
        'new_status', NEW.status,
        'old_status', OLD.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_application_status_changed
  AFTER UPDATE ON gig_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_status_changed();
```

---

### 2. Booking System Notifications

#### 2.1 Booking Confirmed Notification
**Trigger**: When booking is created/confirmed
**Recipients**: Both gig owner and booked talent

```sql
-- File: supabase/migrations/111_booking_notifications.sql

CREATE OR REPLACE FUNCTION notify_booking_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  v_gig RECORD;
  v_talent RECORD;
  v_owner RECORD;
BEGIN
  -- Get gig and related user details
  SELECT g.*, up.user_id as owner_user_id, up.display_name as owner_name
  INTO v_gig
  FROM gigs g
  JOIN users_profile up ON g.owner_user_id = up.user_id
  WHERE g.id = NEW.gig_id;

  -- Get talent details
  SELECT user_id, display_name, avatar_url
  INTO v_talent
  FROM users_profile
  WHERE id = NEW.talent_id;

  -- Notify the talent (they got booked!)
  INSERT INTO notifications (
    recipient_id,
    user_id,
    type,
    category,
    title,
    message,
    action_url,
    data
  ) VALUES (
    v_talent.user_id,
    v_gig.owner_user_id,
    'booking_confirmed',
    'booking',
    '🎉 You\'re booked for "' || v_gig.title || '"!',
    'Shoot date: ' || to_char(v_gig.start_time, 'Mon DD, YYYY at HH12:MI AM'),
    '/bookings/' || NEW.id,
    jsonb_build_object(
      'booking_id', NEW.id,
      'gig_id', v_gig.id,
      'gig_title', v_gig.title,
      'start_time', v_gig.start_time,
      'location', v_gig.location_text
    )
  );

  -- Notify the gig owner (booking confirmed)
  INSERT INTO notifications (
    recipient_id,
    user_id,
    type,
    category,
    title,
    message,
    action_url,
    data
  ) VALUES (
    v_gig.owner_user_id,
    v_talent.user_id,
    'booking_confirmed',
    'booking',
    'Booking confirmed with ' || v_talent.display_name,
    'For "' || v_gig.title || '" on ' || to_char(v_gig.start_time, 'Mon DD, YYYY'),
    '/bookings/' || NEW.id,
    jsonb_build_object(
      'booking_id', NEW.id,
      'gig_id', v_gig.id,
      'talent_name', v_talent.display_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_booking_confirmed
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_confirmed();
```

#### 2.2 Booking Reminder Notification
**Trigger**: 48 hours before shoot time (scheduled job)

```typescript
// File: apps/web/app/api/cron/booking-reminders/route.ts

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find bookings happening in 48 hours
  const in48Hours = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const in47Hours = new Date(Date.now() + 47 * 60 * 60 * 1000);

  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      gig_id,
      talent_id,
      gigs (
        id,
        title,
        start_time,
        location_text,
        owner_user_id
      ),
      users_profile:talent_id (
        user_id,
        display_name
      )
    `)
    .gte('gigs.start_time', in47Hours.toISOString())
    .lte('gigs.start_time', in48Hours.toISOString())
    .eq('status', 'CONFIRMED');

  // Create reminder notifications
  const notifications = [];

  for (const booking of upcomingBookings || []) {
    // Remind talent
    notifications.push({
      recipient_id: booking.users_profile.user_id,
      type: 'booking_reminder',
      category: 'booking',
      title: '📅 Reminder: Shoot in 48 hours',
      message: `"${booking.gigs.title}" at ${booking.gigs.location_text}`,
      action_url: `/bookings/${booking.id}`,
      data: {
        booking_id: booking.id,
        gig_id: booking.gig_id,
        gig_title: booking.gigs.title,
        start_time: booking.gigs.start_time
      }
    });

    // Remind owner
    notifications.push({
      recipient_id: booking.gigs.owner_user_id,
      type: 'booking_reminder',
      category: 'booking',
      title: '📅 Reminder: Shoot in 48 hours',
      message: `"${booking.gigs.title}" with ${booking.users_profile.display_name}`,
      action_url: `/bookings/${booking.id}`,
      data: {
        booking_id: booking.id,
        talent_name: booking.users_profile.display_name
      }
    });
  }

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
  }

  return NextResponse.json({
    success: true,
    remindersSent: notifications.length / 2
  });
}
```

**Vercel Cron Setup**:
```json
// File: vercel.json
{
  "crons": [{
    "path": "/api/cron/booking-reminders",
    "schedule": "0 */6 * * *"
  }]
}
```

---

### 3. Payment & Credit Notifications

#### 3.1 Low Credit Warning
**Trigger**: When user's credits fall below threshold

```sql
-- File: supabase/migrations/112_credit_notifications.sql

CREATE OR REPLACE FUNCTION notify_low_credit()
RETURNS TRIGGER AS $$
DECLARE
  v_user_prefs RECORD;
  v_threshold INTEGER := 10; -- Warn when credits < 10
BEGIN
  -- Only notify when crossing threshold (not every time)
  IF NEW.credits < v_threshold AND OLD.credits >= v_threshold THEN

    -- Check user preferences
    SELECT system_notifications, in_app_enabled
    INTO v_user_prefs
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    IF v_user_prefs.system_notifications AND v_user_prefs.in_app_enabled THEN
      INSERT INTO notifications (
        recipient_id,
        user_id,
        type,
        category,
        title,
        message,
        action_url,
        data
      ) VALUES (
        NEW.user_id,
        NEW.user_id,
        'low_credit_warning',
        'system',
        '⚠️ Low credit balance',
        'You have ' || NEW.credits || ' credits remaining. Top up to continue posting gigs.',
        '/credits/purchase',
        jsonb_build_object(
          'current_credits', NEW.credits,
          'threshold', v_threshold
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_low_credit
  AFTER UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_credit();
```

#### 3.2 Payment Received Notification
**Trigger**: When payment is processed successfully

```sql
-- File: supabase/migrations/112_credit_notifications.sql (continued)

CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    INSERT INTO notifications (
      recipient_id,
      user_id,
      type,
      category,
      title,
      message,
      action_url,
      data
    ) VALUES (
      NEW.user_id,
      NEW.user_id,
      'payment_received',
      'system',
      '✅ Payment received',
      'Your payment of €' || NEW.amount || ' has been processed',
      '/credits/history',
      jsonb_build_object(
        'payment_id', NEW.id,
        'amount', NEW.amount,
        'credits_added', NEW.credits_amount
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_payment_received
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();
```

---

## 🎯 Phase 2: User Engagement & Marketplace (Week 3-4)

### Priority: 🟡 IMPORTANT - Drives engagement and marketplace activity

### 4. Marketplace Notifications

#### 4.1 New Offer Received
```sql
-- File: supabase/migrations/113_marketplace_notifications.sql

CREATE OR REPLACE FUNCTION notify_marketplace_offer()
RETURNS TRIGGER AS $$
DECLARE
  v_listing RECORD;
  v_buyer RECORD;
BEGIN
  -- Get listing and seller details
  SELECT l.*, up.user_id as seller_user_id
  INTO v_listing
  FROM marketplace_listings l
  JOIN users_profile up ON l.seller_id = up.id
  WHERE l.id = NEW.listing_id;

  -- Get buyer details
  SELECT user_id, display_name, avatar_url
  INTO v_buyer
  FROM users_profile
  WHERE id = NEW.buyer_id;

  -- Notify seller
  INSERT INTO notifications (
    recipient_id,
    user_id,
    type,
    category,
    title,
    message,
    avatar_url,
    action_url,
    data
  ) VALUES (
    v_listing.seller_user_id,
    v_buyer.user_id,
    'new_offer_received',
    'marketplace',
    'New offer: €' || NEW.offer_amount,
    v_buyer.display_name || ' made an offer on "' || v_listing.title || '"',
    v_buyer.avatar_url,
    '/marketplace/offers/' || NEW.id,
    jsonb_build_object(
      'offer_id', NEW.id,
      'listing_id', v_listing.id,
      'offer_amount', NEW.offer_amount,
      'buyer_name', v_buyer.display_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_marketplace_offer
  AFTER INSERT ON marketplace_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_marketplace_offer();
```

#### 4.2 Offer Status Changed
```sql
CREATE OR REPLACE FUNCTION notify_offer_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_listing RECORD;
  v_buyer RECORD;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get buyer details
  SELECT user_id, display_name
  INTO v_buyer
  FROM users_profile
  WHERE id = NEW.buyer_id;

  -- Get listing details
  SELECT title
  INTO v_listing
  FROM marketplace_listings
  WHERE id = NEW.listing_id;

  CASE NEW.status
    WHEN 'ACCEPTED' THEN
      v_notification_title := '🎉 Offer accepted!';
      v_notification_message := 'Your offer for "' || v_listing.title || '" was accepted';
    WHEN 'REJECTED' THEN
      v_notification_title := 'Offer declined';
      v_notification_message := 'Your offer for "' || v_listing.title || '" was declined';
    WHEN 'COUNTERED' THEN
      v_notification_title := 'Counter-offer received';
      v_notification_message := 'Seller countered your offer for "' || v_listing.title || '"';
    ELSE
      RETURN NEW;
  END CASE;

  -- Notify buyer
  INSERT INTO notifications (
    recipient_id,
    user_id,
    type,
    category,
    title,
    message,
    action_url,
    data
  ) VALUES (
    v_buyer.user_id,
    v_buyer.user_id,
    'offer_' || lower(NEW.status),
    'marketplace',
    v_notification_title,
    v_notification_message,
    '/marketplace/offers/' || NEW.id,
    jsonb_build_object(
      'offer_id', NEW.id,
      'listing_id', v_listing.id,
      'new_status', NEW.status
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_offer_status_changed
  AFTER UPDATE ON marketplace_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_offer_status_changed();
```

---

### 5. Gig Deadline Notifications

#### 5.1 Application Deadline Approaching (24h reminder)
```typescript
// File: apps/web/app/api/cron/gig-deadline-reminders/route.ts

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const in23Hours = new Date(Date.now() + 23 * 60 * 60 * 1000);

  // Find gigs with deadline in ~24 hours
  const { data: expiringGigs } = await supabase
    .from('gigs')
    .select(`
      id,
      title,
      application_deadline,
      owner_user_id,
      users_profile!owner_user_id (
        display_name
      )
    `)
    .gte('application_deadline', in23Hours.toISOString())
    .lte('application_deadline', in24Hours.toISOString())
    .eq('status', 'PUBLISHED');

  // Find users who viewed but haven't applied
  const notifications = [];

  for (const gig of expiringGigs || []) {
    // Get users who have the gig in their saved/interested list
    const { data: interestedUsers } = await supabase
      .from('saved_gigs')
      .select('user_id')
      .eq('gig_id', gig.id)
      .not('user_id', 'in', `(
        SELECT user_id
        FROM gig_applications
        WHERE gig_id = '${gig.id}'
      )`);

    for (const user of interestedUsers || []) {
      notifications.push({
        recipient_id: user.user_id,
        type: 'gig_deadline',
        category: 'gig',
        title: '⏰ Deadline tomorrow!',
        message: `Last chance to apply for "${gig.title}"`,
        action_url: `/gigs/${gig.id}`,
        data: {
          gig_id: gig.id,
          gig_title: gig.title,
          deadline: gig.application_deadline
        }
      });
    }
  }

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
  }

  return NextResponse.json({
    success: true,
    remindersSent: notifications.length
  });
}
```

---

## 🎯 Phase 3: Social & Engagement (Week 5-6)

### Priority: 🟢 NICE TO HAVE - Drives platform stickiness

### 6. Social Notifications

#### 6.1 New Follower
```sql
-- File: supabase/migrations/114_social_notifications.sql

CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  v_follower RECORD;
  v_followed RECORD;
BEGIN
  -- Get follower details
  SELECT user_id, display_name, avatar_url
  INTO v_follower
  FROM users_profile
  WHERE id = NEW.follower_id;

  -- Get followed user details
  SELECT user_id
  INTO v_followed
  FROM users_profile
  WHERE id = NEW.followed_id;

  -- Create notification
  INSERT INTO notifications (
    recipient_id,
    user_id,
    type,
    category,
    title,
    message,
    avatar_url,
    action_url,
    data
  ) VALUES (
    v_followed.user_id,
    v_follower.user_id,
    'new_follower',
    'social',
    'New follower',
    v_follower.display_name || ' started following you',
    v_follower.avatar_url,
    '/profile/' || v_follower.user_id,
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follower_name', v_follower.display_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_follower
  AFTER INSERT ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();
```

#### 6.2 Showcase Liked
```sql
CREATE OR REPLACE FUNCTION notify_showcase_liked()
RETURNS TRIGGER AS $$
DECLARE
  v_liker RECORD;
  v_showcase RECORD;
BEGIN
  -- Get liker details
  SELECT user_id, display_name, avatar_url
  INTO v_liker
  FROM users_profile
  WHERE id = NEW.user_id;

  -- Get showcase and owner details
  SELECT s.id, s.title, up.user_id as owner_user_id
  INTO v_showcase
  FROM showcases s
  JOIN users_profile up ON s.user_id = up.id
  WHERE s.id = NEW.showcase_id;

  -- Don't notify if user likes their own showcase
  IF v_liker.user_id = v_showcase.owner_user_id THEN
    RETURN NEW;
  END IF;

  -- Create notification
  INSERT INTO notifications (
    recipient_id,
    user_id,
    type,
    category,
    title,
    message,
    avatar_url,
    action_url,
    data
  ) VALUES (
    v_showcase.owner_user_id,
    v_liker.user_id,
    'showcase_like',
    'social',
    '❤️ Someone liked your work',
    v_liker.display_name || ' liked "' || v_showcase.title || '"',
    v_liker.avatar_url,
    '/showcases/' || v_showcase.id,
    jsonb_build_object(
      'showcase_id', v_showcase.id,
      'liker_name', v_liker.display_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_showcase_liked
  AFTER INSERT ON showcase_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_showcase_liked();
```

#### 6.3 Showcase Comment
```sql
CREATE OR REPLACE FUNCTION notify_showcase_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_commenter RECORD;
  v_showcase RECORD;
BEGIN
  -- Get commenter details
  SELECT user_id, display_name, avatar_url
  INTO v_commenter
  FROM users_profile
  WHERE id = NEW.user_id;

  -- Get showcase and owner details
  SELECT s.id, s.title, up.user_id as owner_user_id
  INTO v_showcase
  FROM showcases s
  JOIN users_profile up ON s.user_id = up.id
  WHERE s.id = NEW.showcase_id;

  -- Don't notify if user comments on their own showcase
  IF v_commenter.user_id = v_showcase.owner_user_id THEN
    RETURN NEW;
  END IF;

  -- Create notification
  INSERT INTO notifications (
    recipient_id,
    user_id,
    type,
    category,
    title,
    message,
    avatar_url,
    action_url,
    data
  ) VALUES (
    v_showcase.owner_user_id,
    v_commenter.user_id,
    'showcase_comment',
    'social',
    '💬 New comment',
    v_commenter.display_name || ' commented on "' || v_showcase.title || '"',
    v_commenter.avatar_url,
    '/showcases/' || v_showcase.id || '#comments',
    jsonb_build_object(
      'showcase_id', v_showcase.id,
      'comment_id', NEW.id,
      'commenter_name', v_commenter.display_name,
      'comment_preview', substring(NEW.comment, 1, 50)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_showcase_comment
  AFTER INSERT ON showcase_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_showcase_comment();
```

---

### 7. System Notifications

#### 7.1 Verification Status Update
```sql
-- File: supabase/migrations/115_system_notifications.sql

CREATE OR REPLACE FUNCTION notify_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  v_status_message TEXT;
  v_notification_title TEXT;
BEGIN
  IF OLD.verified_id = NEW.verified_id THEN
    RETURN NEW;
  END IF;

  IF NEW.verified_id = true THEN
    v_notification_title := '✅ Verification approved!';
    v_status_message := 'Your ID verification has been approved. You now have a verified badge!';
  ELSE
    v_notification_title := 'Verification update';
    v_status_message := 'Your verification status has been updated. Check your profile for details.';
  END IF;

  INSERT INTO notifications (
    recipient_id,
    user_id,
    type,
    category,
    title,
    message,
    action_url,
    data
  ) VALUES (
    NEW.user_id,
    NEW.user_id,
    'verification_status_update',
    'system',
    v_notification_title,
    v_status_message,
    '/profile',
    jsonb_build_object(
      'verified', NEW.verified_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_verification_status
  AFTER UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION notify_verification_status();
```

---

## 📋 Implementation Checklist

### Phase 1 (Critical) - Week 1-2
- [ ] **Gig Applications**
  - [ ] Create migration 110_gig_application_notifications.sql
  - [ ] Application received trigger
  - [ ] Application status changed trigger
  - [ ] Test all application flows
  - [ ] Verify notifications appear in UI

- [ ] **Bookings**
  - [ ] Create migration 111_booking_notifications.sql
  - [ ] Booking confirmed trigger
  - [ ] Create booking reminders cron job
  - [ ] Add vercel.json cron config
  - [ ] Test booking flow end-to-end

- [ ] **Payments/Credits**
  - [ ] Create migration 112_credit_notifications.sql
  - [ ] Low credit warning trigger
  - [ ] Payment received trigger
  - [ ] Test credit purchases
  - [ ] Verify threshold logic

### Phase 2 (Important) - Week 3-4
- [ ] **Marketplace**
  - [ ] Create migration 113_marketplace_notifications.sql
  - [ ] New offer trigger
  - [ ] Offer status changed trigger
  - [ ] Test marketplace flows

- [ ] **Gig Deadlines**
  - [ ] Create gig-deadline-reminders cron
  - [ ] Add to vercel.json
  - [ ] Test reminder delivery

- [ ] **Performance Optimization**
  - [ ] Add indexes if needed
  - [ ] Test notification query performance
  - [ ] Implement batching for bulk notifications

### Phase 3 (Engagement) - Week 5-6
- [ ] **Social**
  - [ ] Create migration 114_social_notifications.sql
  - [ ] New follower trigger
  - [ ] Showcase liked trigger
  - [ ] Showcase comment trigger
  - [ ] Test all social interactions

- [ ] **System**
  - [ ] Create migration 115_system_notifications.sql
  - [ ] Verification status trigger
  - [ ] Platform announcement system
  - [ ] Test admin notification flow

### Final Polish
- [ ] **Testing**
  - [ ] End-to-end notification testing
  - [ ] Load testing (100+ concurrent notifications)
  - [ ] Preference respect verification
  - [ ] Cross-device notification sync

- [ ] **Documentation**
  - [ ] Update API documentation
  - [ ] Create notification types reference
  - [ ] Document trigger logic
  - [ ] Update user-facing help docs

- [ ] **Monitoring**
  - [ ] Add notification delivery metrics
  - [ ] Set up error alerting
  - [ ] Track notification engagement
  - [ ] Monitor database performance

---

## 🔧 Technical Implementation Notes

### Database Trigger Best Practices
1. **Always check preferences** before creating notifications
2. **Use AFTER triggers** to ensure data integrity
3. **Handle errors gracefully** - don't block main operations
4. **Add proper indexes** on foreign keys
5. **Test with transaction rollbacks**

### Performance Considerations
- **Batch insertions** for bulk notifications (>10)
- **Use database functions** for complex logic
- **Cache user preferences** when possible
- **Implement rate limiting** to prevent notification spam
- **Archive old notifications** (>90 days)

### Real-time Integration Plan
When re-enabling real-time:
1. Notifications will automatically appear via subscription
2. Check `sound_enabled` preference before playing sound
3. Check `in_app_enabled` before showing toast
4. Respect `badge_count_enabled` for unread counts
5. Use `digest_frequency` for email batching

---

## 📊 Success Metrics

### Coverage Goals
- **Phase 1 Complete**: 70% coverage (from 30%)
- **Phase 2 Complete**: 90% coverage
- **Phase 3 Complete**: 100% coverage

### Engagement Metrics
- Notification open rate: >40%
- Action taken rate: >25%
- Notification dismissal rate: <10%
- Mute rate: <5%

### Performance Metrics
- Notification delivery time: <2 seconds
- Database query time: <100ms
- Cron job execution: <30 seconds
- Zero failed notifications

---

## 🚀 Quick Start Commands

```bash
# Run all migrations
npx supabase migration up

# Test notifications
curl -X POST http://localhost:3000/api/notifications/test

# Run cron jobs locally
curl -X GET http://localhost:3000/api/cron/booking-reminders \
  -H "Authorization: Bearer $CRON_SECRET"

# Check notification counts
psql $DATABASE_URL -c "SELECT type, count(*) FROM notifications GROUP BY type;"
```

---

## 📞 Support & Questions

For implementation questions:
- Review existing notification code in `/api/notifications/gig-created/`
- Check database schema in migrations 20250125000016
- Reference useNotifications hook documentation
- Test with `/api/notifications/test` endpoint

---

**Last Updated**: 2025-01-27
**Status**: Ready for Implementation
**Estimated Completion**: 6 weeks
**Current Coverage**: 30% → Target: 100%
