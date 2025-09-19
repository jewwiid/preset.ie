# Collaborate & Marketplace — Wireframes + Markdown

This doc includes **low‑fi wireframes** (ASCII) and a **Markdown spec** for the new **Collaborate** flow + integration with the **Rent & Sell** marketplace. It’s designed to drop into the existing Preset stack (Supabase + React + Stripe/Credits + Realtime messaging/notifications).

---

## 1) Wireframes (Low‑Fi)

### 1.1 `/collaborate` — Hub (Discover Projects)

```
┌───────────────────────────────────────────────────────────────────────┐
│  Header:  Preset ▸ Collaborate      [Search] [Filters] [Start a Project] │
├───────────────────────────────────────────────────────────────────────┤
│ Filters: [Role v] [Skills v] [Gear Needed v] [City/Radius v] [Dates v] │
│          [Verified Only □] [Open □ In‑Progress □ Completed □]          │
├───────────────────────────────────────────────────────────────────────┤
│ ┌───────────────ProjectCard──────────────┐ ┌──────────────ProjectCard─────────────┐ │
│ │ [Moodboard grid 2x2]                  │ │ [Moodboard grid 2x2]                  │ │
│ │ Title · City · Dates                  │ │ Title · City · Dates                  │ │
│ │ Roles needed: Dir(1), CamOp(2)       │ │ Roles needed: Gaffer(1)               │ │
│ │ Gear needed: BMPCC, 35mm, 300D       │ │ Gear needed: FX3, MixPre              │ │
│ │ [View] [Volunteer] [Offer Gear]      │ │ [View] [Volunteer] [Offer Gear]       │ │
│ └───────────────────────────────────────┘ └────────────────────────────────────────┘ │
│ ...                                                                           ... │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 `/collaborate/new` — Project Wizard

```
┌───────────────────────────────────────────┐
│ Stepper: Basics → Moodboard → Roles → Gear → Review & Publish │
├───────────────────────────────────────────┤
│ Basics: Title, Synopsis, City, Country, Dates, Visibility      │
│ [Next]                                                         │
├───────────────────────────────────────────┤
│ Moodboard: [+ Upload]  [Paste URLs]  (grid preview)            │
│ [Next] [Back]                                                │
├───────────────────────────────────────────┤
│ Roles:  [Add Role] role name, skills[], paid? comp, headcount  │
│  List: Dir(1) · CamOp(2) · Gaffer(1)                          │
│ [Next] [Back]                                                 │
├───────────────────────────────────────────┤
│ Gear Requests: [Add Gear] category, spec, qty, borrow/retainer │
│  List: Camera(BMPCC) x1 · Light(300D) x2                       │
│ [Next] [Back]                                                 │
├───────────────────────────────────────────┤
│ Review: Summary + Auto‑Matches (Users / Listings)              │
│ [Publish]  [Save Draft]  [Cancel]                              │
└───────────────────────────────────────────┘
```

### 1.3 `/collaborate/:id` — Project Detail

```
┌─────────────────────────────────────────────────────────────────────┐
│ Title                [Verified Creator]      City · Dates           │
│ Moodboard (grid)  |  Share  |  Report                                        │
├─────────────────────────────────────────────────────────────────────┤
│ Synopsis                                                             │
│ Tags: #shortfilm #fashion #outdoor                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Roles Needed (apply):                                                │
│  • Director (1)  [Volunteer]   • Cam Op (2) [Volunteer]              │
│  • Gaffer (1)    [Volunteer]                                         │
├─────────────────────────────────────────────────────────────────────┤
│ Gear Requests (offer):                                               │
│  • Camera: BMPCC 6K (x1)  [Offer Gear]  (Borrow ✓  Retainer €0)      │
│  • Light: Aputure 300D (x2) [Offer Gear] (Retainer €200)             │
├─────────────────────────────────────────────────────────────────────┤
│ Matches                                                              │
│  Users (skills match): [@Ava(Dir)] [@Leo(Cam)] ...                   │
│  Listings (gear match): [BMPCC by @Sam] [300D by @Mia] ...           │
├─────────────────────────────────────────────────────────────────────┤
│ Thread                                                             │
│ [Message Creator]    [Join Project Chat] (if accepted)                │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.4 Listing Detail (Marketplace) — Rent/Sell + Contact

```
┌───────────────────────────────────────────────┐
│ Gallery | Title | Owner [Verified] | City     │
│ Mode: Rent / Sale                                │
│ Rent: €45/day · €250/week  | Retainer: Card Hold €150 │
│ Availability: [Date Range Picker]                │
│ [Request to Rent]  [Message Owner]               │
│ Sale: €980   [Buy Now]                           │
└───────────────────────────────────────────────┘
```

---

## 2) Markdown Spec (Copy‑Ready)

### 2.1 Overview

- **Collaborate** lets creators post project briefs with **roles** (people) and **gear requests** (equipment), attach a **moodboard**, and recruit collaborators.
- Integrated with **Marketplace** so gear offers convert into **rental orders** (or borrow) with retainer/availability logic.
- Uses existing **Messaging** and **Notifications** for coordination, with **Verified** user emphasis and platform **disclaimer**.

### 2.2 Key Entities

- `collab_projects`, `collab_roles`, `collab_gear_requests`, `collab_applications`, `collab_gear_offers`, `collab_pledges (optional)`.
- Reuse: `listings`, `listing_availability`, `rental_orders`, `threads/messages`, `notifications`.

### 2.3 Core Flows

1. **Create Project** → publish → notify matched users/owners.
2. **Volunteer/Apply** for roles → creator accepts → project chat.
3. **Offer Gear** from existing listing → accept → rental order + availability block.
4. **Borrow vs Retainer** handled via Credits hold or Stripe card hold.
5. **Complete & Review** on finish; release holds, prompt ratings.

### 2.4 Filters & Matching

- Filters: `role`, `skills`, `gear needed`, `city/radius`, `dates`, `verified‑only`, `status`.
- Matching: suggest users/listings based on roles/skills/equipment\_owned and proximity.

### 2.5 UI Components (React)

- **Collaborate**: `ProjectCard`, `ProjectWizard`, `RoleRequirement`, `GearRequest`, `VolunteerButton`, `OfferGearButton`, `MoodboardGrid`, `PledgeWidget (opt)`, `ProjectMatches`, `ProjectThreadLink`.
- **Marketplace**: `ListingCard`, `AvailabilityPicker`, `RentPanel`, `SalePanel`, `OfferPanel`, `VerifiedBadge`.
- **Shared**: `NotificationBell`, `ThreadPreview`, `UserMiniCard`.

### 2.6 API Surface (Edge/Server)

- `POST /collab/projects` (create/update/publish)
- `GET /collab/projects` (filters)
- `POST /collab/applications` (apply/withdraw/accept)
- `POST /collab/gear-offers` (offer/accept/decline)
- `POST /marketplace/rentals` (create/accept/cancel/complete)
- (Optional) `POST /collab/pledges` (authorise/capture/refund)

### 2.7 Notifications

- `collab_project_published`, `collab_application_received/status`, `collab_gear_offer_received/status`, `booking_request/status`, `payment_hold_created/released`, `return_due`, `review_reminder`.

### 2.8 Safety/Legal Copy

> Preset is a peer‑to‑peer platform. Transactions and hand‑offs are organised between users. Preset is **not a party** to the transaction and does not assume liability. Work with **Verified** users, use in‑app messaging, and record condition at hand‑off.

### 2.9 Acceptance Criteria (QA)

- Can create/publish a project with roles+gear, upload moodboard.
- Filters narrow results by role/skills/gear/location/dates/verified.
- Users can apply; owners can offer gear from existing listings.
- Accepting gear offer creates a rental order and blocks availability.
- Retainer holds (Credits/Stripe) can be placed, released, or captured.
- Messaging and notifications update in real time across flows.
- Reviews prompted on completion; ratings saved to both parties.

### 2.10 Rollout Plan

1. Migrations + RLS → 2) Storage & image presets → 3) Edge functions (holds) → 4) Wizard + Hub pages → 5) Matching → 6) Beta with verified users → 7) Pledges (optional).

---

## 3) Extras (Snippets)

### 3.1 Project Card Fields

- Moodboard (first 4), Title, City, Dates, Roles Needed, Gear Needed, Badges: `Verified Creator`, `Open`.

### 3.2 Empty States

- Hub: “No projects match. Try widening filters or **Start a Project**.”
- Wizard: “No roles yet. Add at least one role to publish.”
- Detail: “No applications yet. Share your project or invite matches.”

### 3.3 Accessibility

- Keyboard‑navigable cards, form steps; alt text on moodboard images; clear status text.

---

**Done.** This wireframe + markdown is ready to hand to design/engineering for implementation. Adjust copy to your tone and ship the wizard first for fastest value.



---

## 2.11 Equipment Hire Requests — Integration with Collaborate (uses your existing request system)

> You mentioned you’ve already designed a **request equipment system**. Below plugs it directly into Collaborate and Marketplace so requests can (a) surface matching **listings** and (b) convert to **rental orders** when accepted.

### A) Data & Links

- Keep your existing **equipment\_requests** table as the source of truth.
- Add foreign keys (nullable): `project_id (collab_projects.id)`, `thread_id (threads.id)`.
- When a request stands alone (not tied to a project), users can still post it from the **Marketplace ▸ Requests** tab.

### B) Flow (Request → Offers → Book)

1. **Create Request**: category, spec/notes, date range, qty, **borrow/retainer** preference, city/radius.
2. **Auto‑Match**: show **listings** that meet spec + proximity; notify **owners** who opted into matching.
3. **Offers**: owners reply with **Offer Gear** (links to listing; can counter with rate/deposit/retainer mode).
4. **Accept**: requester accepts an offer → create **rental\_order**, block dates in `listing_availability`.
5. **Message**: dedicated **thread** opened or reused, with system status posts.

### C) UI Additions

- New tab on `/collaborate/:id`: **Requests** (lists linked equipment requests for that project).
- New page `/marketplace/requests`: feed + filters (category, dates, radius, borrow/retainer, verified‑only).
- Listing cards get a **“Respond to Request”** CTA when navigated from a request/match context.

### D) Filters powered by Profile Fields

Ensure `users_profile` has:

- `roles[]`, `skills[]`, \`equipment\_owned[
