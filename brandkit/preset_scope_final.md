
# 📓 Preset (Preset.ie) — Final Scope Document
_A Subscription-based, cross-platform creative collaboration app built with DDD + Hexagonal architecture_

## 0) Elevator Pitch
Preset is a mobile-first platform where **Contributors** (photographers/videographers/cinematographers) post **Gigs** and **Talent** (creative partners) apply. It is **free to start** and monetized via **subscription tiers**—not per-gig payments. Portfolios live **inside** the app via **Showcases** created from completed shoots, and **Moodboards** make gigs look premium and clear.

---

## 1) Product Goals
- **Connect creatives safely** and efficiently for shoots.
- **Keep visual proof of work in-app** (Showcases) to reduce external links.
- **Make gigs beautiful and scannable** (Moodboards with tags/palette).
- **Scale across iOS, Android, and Web** with a shared design system.
- **Ship fast** with Supabase + Vercel, TypeScript everywhere.

---

## 2) Roles & Permissions
- **Contributors**: post/manage gigs, review applications, shortlist/book, create moodboards, message, complete shoots, publish showcases.
- **Talent**: create profile, browse/apply to gigs, message, upload selects for showcases, review contributors.
- **Admin**: moderate content/reports, oversee ID verification, enforce community rules.

---

## 3) Core Flows
1. **Create Gig**: title, description, purpose, comp type (informational: TFP/paid/expenses), location+radius, date/time window, usage rights, safety notes, application deadline, max applicants, moodboard upload.
2. **Apply**: talent filters/browses gigs → apply with profile snapshot + optional note.
3. **Review & Booking**: contributor shortlists, messages, books talent.
4. **Completion & Showcase**: both add **3–6 selects** → mutual approval → auto-credited **Showcase** on both profiles.
5. **Messaging & Reviews**: per-gig chat; mutual reviews after completion.

---

## 4) Subscription Model (No gig payments)
### Talent Tiers
- **Free**: basic profile; **3 applications/month**; up to **3 Showcases**.
- **Plus (€9/mo)**: unlimited applications; up to **10 Showcases**; basic analytics; “Verified Plus” badge.
- **Pro (€19/mo)**: unlimited applications & showcases; priority visibility; advanced analytics; early feature access.

### Contributor Tiers
- **Free**: **2 gigs/month**; up to **10 applications/gig**; basic moodboards.
- **Plus (€12/mo)**: unlimited gigs; advanced moodboards (video refs, AI tags); shortlist & bulk message; Verified Contributor badge.
- **Pro (€24/mo)**: All Plus; **boosted gigs** (priority ranking); unlimited applications/gig; team access (invite MUA/stylist/assistant).

**Gating**: application caps, gig caps, showcase limits, moodboard features, analytics, boosts, badges.

---

## 5) Key Features (MVP → V1)
- **Showcases** (in‑app mini portfolios) built from completed gigs with collaborator credits.
- **Moodboard Builder**: upload images/videos or paste URLs; AI vibe tags + palette extraction; drag‑reorder; shareable read‑only view.
- **Styles & Vibes**: aesthetic chips for profiles & matching.
- **Shotlist Snacks**: 3–5 shot cards; AI suggests prompts from gig description.
- **Golden Hour + Map Pins** for outdoor shoots.
- **Dashboards**: 
  - Contributor: views, saves, applications.
  - Talent: application status, profile views.
- **Messaging**: per‑gig threads, attachments, report/block, rate limits.
- **Reviews**: 1–5 + tags (professional, punctual).

---

## 6) Safety & Trust
**Risks**: fake profiles, harassment, unsafe meetings, non‑consensual content use, underage access, privacy leaks, scams, reputational harm.  
**Solutions**:
- Account integrity: email/phone verification; optional **ID verification** badge.
- Harassment prevention: in‑app chat only; **block/report**; first‑contact rate limits; abuse keyword filter.
- Safe meetings: safety notes on gigs; public venue nudge; optional **“Mark Safe”** check‑in.
- Usage rights: **release forms (e‑sign)** required for Showcases; immutable PDFs stored.
- Age gating: **18+ only**; re‑attestation; optional ID checks.
- Data protection: private buckets; signed URLs; **strip EXIF GPS**; GDPR export/delete.
- Scam prevention: posting limits for new/free accounts; moderation queue; report on every gig.
- Reputation: mutual reviews; track report rates; shadowban tools for repeat offenders.

**MVP priority**: age‑gate, release forms, report/block, moderation queue, reviews, private storage, EXIF stripping.  
**Post‑MVP**: verified ID badge, Mark Safe, shadowban tools, AI content moderation.

---

## 7) Architecture — DDD + Hexagonal (Ports & Adapters)
- **Domain** (pure TS): Entities, Value Objects, Domain Services, Domain Events. No framework imports.
- **Application**: Use cases (commands/queries), Ports (interfaces): `GigRepository`, `ApplicationRepository`, `MediaStorage`, `SubscriptionPolicy`, `EventBus`, `Clock`, `IdGen`.
- **Adapters**: 
  - Persistence: Supabase repositories implementing ports.
  - Delivery: Next.js handlers (web), Edge Functions, mobile service adapters.
  - Infra: Supabase Storage, Realtime bus, Email/Push, Stripe (subs only).

**Bounded Contexts**: Identity & Access, Gigs, Applications, Collaboration & Messaging, Media & Moodboards, Showcases & Reviews.

**Domain Events (examples)**: `GigCreated`, `ApplicationSubmitted`, `GigBooked`, `ShowcasePublished`, `UserReported`.

---

## 8) Monorepo (Turborepo) Structure
```
preset/
  apps/
    web/         # Next.js (Vercel) — SEO public pages, app shell, API routes
    mobile/      # Expo (React Native) — iOS/Android apps
    edge/        # Supabase Edge Functions + Vercel serverless handlers
  packages/
    domain/      # pure DDD domain for all contexts
    application/ # use cases + ports (per context)
    adapters/    # Supabase repos, storage, auth, messaging, http handlers
    ui/          # shared design system (Tamagui or RN Web + NativeWind)
    tokens/      # design tokens (colors, radii, spacing, type scale)
    types/       # zod schemas, DTOs, api clients
```

---

## 9) Tech Stack
- **Language**: **TypeScript** end‑to‑end.
- **Web**: **Next.js** (Vercel) — SSR/SEO for gigs & profiles.
- **Mobile**: **Expo (React Native)** — iOS & Android; 90% shared components.
- **UI parity**: **Tamagui** (or RN Web + NativeWind) + shared tokens.
- **Backend**: **Supabase** (Postgres + RLS, Auth, Storage, Realtime).
- **Serverless**: Vercel API Routes (web), **Supabase Edge Functions** (AI, signed URLs, policies).
- **Billing**: **Stripe Billing** (subscriptions only).
- **AI assists**: Edge Functions calling LLM for tags/summaries/shotlists; local palette/blurhash.
- **Observability**: PostHog (events), Sentry (errors), Edge logs.

---

## 10) Data Model (High-Level)
- **users_profile**: `id, user_id, display_name, handle, avatar_url, bio, city, role_flags[], style_tags[], subscription_tier`
- **gigs**: `id, owner_user_id, title, description, comp_type, location_text, lat, lng, radius_m, start_time, end_time, application_deadline, max_applicants, usage_rights, safety_notes, status, boost_level`
- **applications**: `id, gig_id, applicant_user_id, note, status`
- **media**: `id, owner_user_id, gig_id?, type(image|video|pdf), bucket, path, width, height, duration, palette[], blurhash, exif_json, visibility`
- **moodboards**: `id, gig_id, owner_user_id, title, summary, palette[], items[]`
- **showcases**: `id, gig_id, creator_user_id, talent_user_id, media_ids[], caption, tags[], palette[], approved_by_creator_at, approved_by_talent_at, visibility`
- **messages**: `id, gig_id, from_user_id, to_user_id, body, attachments[], created_at, read_at`
- **subscriptions**: `id, user_id, tier, status, started_at, expires_at`

RLS: owners can CRUD their rows; public can read open gigs + public media; caps & limits enforced in **Application layer** (e.g., monthly application cap for Free tier).

---

## 11) APIs (REST-ish, MVP)
- **Auth**: Supabase Auth (email OTP; later 2FA).
- **Gigs**: `POST /gigs`, `GET /gigs`, `GET /gigs/:id`, `PATCH /gigs/:id` (close/book).
- **Applications**: `POST /gigs/:id/apply`, `GET /gigs/:id/applications`, `PATCH /applications/:id`.
- **Moodboards**: `POST /moodboards`, `PATCH /moodboards/:id` (add/remove/reorder items).
- **Media**: signed upload URLs (or direct Supabase Storage client); `GET /media/:id` (signed/public).
- **Showcases**: `POST /gigs/:id/showcase`, `POST /showcases/:id/approve`.
- **Messaging**: `GET/POST /gigs/:id/messages` (WS for realtime).
- **Reports**: `POST /reports`.
- **Subscriptions**: Stripe checkout/portal webhooks → update `subscriptions` table.

---

## 12) AI Assists (MVP)
- **Auto-tags & vibe summaries** (LLM) for gigs/moodboards.
- **Palette extraction & blurhash** for all images.
- **Shotlist prompt generator** from gig description.
- Optional later: micro-reel stitching (start with carousel autoplay).

---

## 13) MVP Scope (8–10 Weeks)
- Auth & onboarding (roles + vibes)
- Create gig + moodboard upload
- Gig feed (filters: date, location, comp)
- Talent profile + showcases (upload → approve → publish)
- Apply flow + application inbox (shortlist/book/decline)
- Messaging (per‑gig threads) + push notifications
- Reviews + report/block + moderation queue
- Subscription tiers + Stripe integration (caps, badges, gating)
- Safety basics: release forms with e‑sign, EXIF strip, private storage
- Admin basics: reports queue, takedowns

**Defer**: server‑stitched reels, agencies/team roles beyond invite, advanced AI moderation, calendar sync, escrow (not planned).

---

## 14) KPI Targets
- **Supply**: gigs/day, moodboards per gig, time‑to‑first application.
- **Demand**: applications/gig, profile completion rate.
- **Quality**: completion rate, average rating, report rate < 1%.
- **Revenue**: Free→Plus/Pro conversion, churn < 5%/mo.
- **Growth**: DAU/MAU, activation (first post/apply).

---

## 15) Visual & UX Principles
- **Image‑first** cards, rounded corners, soft elevation, snappy transitions.
- **Palette‑themed UI**: derive accent colors from latest uploaded media.
- **Performance**: lazy loading, blurhash placeholders, responsive srcsets.
- **Accessiblity**: color contrast, focus states, large tap targets.

---

## 16) Delivery Plan (Sprints)
**Sprint 1**: Design tokens + shared UI; Auth + Profiles; Create Gig + Moodboard; Feed & Filters.  
**Sprint 2**: Apply + Inbox + Messaging; Showcases flow; Reviews; Safety basics (release, reports).  
**Sprint 3**: Subscriptions + gating; Dashboards; AI assists (tags/palette/shotlist); Admin lite; Polish & beta.

---

## 17) Risks & Mitigations
- **SEO for discovery** → Next.js SSR + public gig/profile pages.
- **Cross‑platform parity** → shared UI kit (Tamagui) + tokens; platform fallbacks.
- **Moderation load** → rate limits, AI pre‑filters, clear reporting UX.
- **Vendor lock‑in** → Hexagonal ports; adapters for Supabase/Stripe are swappable.

---

**End of Document**
