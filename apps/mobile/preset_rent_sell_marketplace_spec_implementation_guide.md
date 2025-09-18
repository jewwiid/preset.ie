# Preset — Rent & Sell Marketplace (Spec + Implementation Guide)

> Add a **Rent** section where users can list gear for **rent** or **sale**, toggle **retainer/borrow**, message to organise hand‑off, and receive notifications. Treat it like a peer‑to‑peer equipment marketplace. Platform is **not liable** and recommends transacting with **Verified** users.

---

## 1) Objectives & Scope

- Allow users to **list** equipment with photos, set **rent** (daily/weekly) and/or **sale** price, choose **retainer fee** or **borrow (no fee)**.
- Facilitate **in‑app messaging** (reuse existing threads) and **notifications** for offers, booking requests, payments, and returns.
- Support **verification badges** and a **liability disclaimer** across UI and contracts.
- Integrate payments using **Credits** and/or **Stripe** (retainer holds, deposits, payouts), without the platform assuming liability.

---

## 2) Information Architecture

### Entities

- **users** (existing) — includes verification status.
- **listings** — a single record for rent/sale; supports both toggles.
- **listing\_images** — multiple images per listing in storage bucket `listings`.
- **listing\_availability** — calendar blocks, blackout dates.
- **rental\_orders** — booking/retainer records.
- **sale\_orders** — one‑off purchase records.
- **offers** — price/terms negotiation for rent or sale.
- **messages**/**threads** (existing) — link to listings and orders.
- **reviews** — post‑transaction ratings for both parties.
- **disputes** — optional, keeps audit trail; not arbitration.
- **notifications** — event stream (db + realtime) consumed by UI.

### Listing Modes

- `mode`: `rent`, `sale`, or `both`.
- `retainer_mode`: `none` | `credit_hold` | `card_hold`.
- `borrow_ok`: boolean (if true, renter can request with **€0** hold).
- `deposit_amount`: optional refundable deposit (separate from retainer).

---

## 3) Database Schema (Supabase SQL)

> Adjust table names if you already have close equivalents.

```sql
-- LISTINGS
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text,              -- e.g., camera, lens, lighting
  condition text,             -- e.g., new, like_new, used
  mode text check (mode in ('rent','sale','both')) not null default 'rent',
  rent_day_cents int,         -- null if not for rent
  rent_week_cents int,        -- optional weekly price
  sale_price_cents int,       -- null if not for sale
  retainer_mode text check (retainer_mode in ('none','credit_hold','card_hold')) not null default 'none',
  retainer_cents int default 0,
  deposit_cents int default 0,
  borrow_ok boolean not null default false,
  quantity int not null default 1,
  location_city text,
  location_country text,
  latitude double precision,
  longitude double precision,
  verified_only boolean not null default false, -- only verified can book
  status text check (status in ('active','paused','archived')) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- LISTING IMAGES
create table if not exists listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  path text not null,           -- storage path in bucket 'listings'
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- AVAILABILITY (blackouts or reservations)
create table if not exists listing_availability (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  kind text check (kind in ('blackout','reserved')) not null,
  ref_order_id uuid,           -- link when reserved
  created_at timestamptz not null default now()
);

-- RENTAL ORDERS
create table if not exists rental_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  renter_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  day_rate_cents int not null,
  calculated_total_cents int not null,
  retainer_mode text not null,
  retainer_cents int not null default 0,
  deposit_cents int not null default 0,
  currency text not null default 'EUR',
  status text check (status in (
    'requested','accepted','rejected','paid','in_progress','completed','cancelled','refunded','disputed'
  )) not null default 'requested',
  credits_tx_id uuid,          -- if using credits marketplace
  stripe_pi_id text,           -- PaymentIntent id for card hold/capture
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SALE ORDERS
create table if not exists sale_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  unit_price_cents int not null,
  quantity int not null default 1,
  total_cents int not null,
  currency text not null default 'EUR',
  status text check (status in ('placed','paid','shipped','delivered','cancelled','refunded','disputed')) not null default 'placed',
  credits_tx_id uuid,
  stripe_pi_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- OFFERS (for rent or sale)
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  context text check (context in ('rent','sale')) not null,
  payload jsonb not null,      -- {price_cents, start_date, end_date, quantity}
  status text check (status in ('open','countered','accepted','declined','expired')) not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- REVIEWS
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_type text check (order_type in ('rent','sale')) not null,
  order_id uuid not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  rating int check (rating between 1 and 5) not null,
  comment text,
  created_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,          -- e.g., new_message, offer_received, booking_request
  data jsonb not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
```

### Storage

- Bucket: `listings` (public read, authenticated write). Folder per listing: `listings/{listing_id}/{filename}.jpg`.

### RLS (examples)

```sql
-- LISTINGS: anyone can read active listings; only owner can modify
alter table listings enable row level security;
create policy "listings_read" on listings for select using (status = 'active' or auth.uid() = owner_id);
create policy "listings_write_own" on listings for insert with check (auth.uid() = owner_id);
create policy "listings_update_own" on listings for update using (auth.uid() = owner_id);

-- IMAGES: read if parent listing visible; write if owner
alter table listing_images enable row level security;
create policy "images_read" on listing_images for select using (exists (select 1 from listings l where l.id = listing_id and (l.status='active' or l.owner_id = auth.uid())));
create policy "images_write_own" on listing_images for insert with check (exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));
```

---

## 4) Messaging Integration

- Reuse **threads** and **messages** tables. Add nullable foreign keys: `listing_id`, `rental_order_id`, `sale_order_id`.
- Auto‑create (or reuse) a thread **on first contact** from listing page: participants = owner & inquirer.
- Thread `type = 'marketplace'` to enable marketplace‑specific UI (offer cards, booking widgets).
- System messages posted by server on status changes (e.g., “Offer accepted”, “Retainer held”).

---

## 5) Notifications

**Event → Notification**

- `new_message` (thread\_id)
- `offer_received` / `offer_updated` / `offer_accepted`
- `booking_request` / `booking_status_changed`
- `payment_hold_created` / `payment_captured` / `payment_released`
- `return_due_tomorrow` (rental)
- `review_reminder`

Implementation:

- DB triggers (or app server) insert into `notifications`.
- **Realtime** subscription on `notifications` by `user_id`.
- Optional: email/push using your existing notification adapter.

---

## 6) Payments & Retainers

### Options

- **Borrow**: `retainer_mode = 'none'`, total due = €0; owner must **accept** request.
- **Credit Hold**: use your in‑platform **Credits** ledger to place a **hold** (escrow style) equal to `retainer_cents` and release on completion.
- **Card Hold**: create Stripe **PaymentIntent** with `capture_method=manual` for `retainer_cents`.

### Rental Flow (Card Hold example)

1. Renter selects dates → total + retainer calculated.
2. Create `rental_orders(status='requested')` and tentative `listing_availability(kind='reserved')`.
3. Owner **accepts** → server confirms dates remain free.
4. Create **PaymentIntent** for retainer; on success set `status='paid'`.
5. Handover occurs (off‑platform).
6. On **return**, owner marks completed → capture `0` and release hold; refund deposit if applicable; set `status='completed'`.
7. Both parties prompted for **reviews**.

> If damage/loss: owner can **capture part/all** of hold (within Stripe timeframe) or claim from deposit (Credits ledger → dispute path).

### Sale Flow

- Simple checkout: immediate charge via Credits or Stripe; `sale_orders.status='paid'`.

---

## 7) Availability & Conflict Prevention

- On `accepted/paid` rental, write `listing_availability(kind='reserved')` for date range.
- Deny overlapping `accepted/paid` rentals at DB level with exclusion constraint or app logic.

---

## 8) Verification & Safety

- Display **Verified** badge for users who passed your existing verification (KYC/
