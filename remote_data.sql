SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '588e3a82-2628-4e60-b9bf-45c604b2a55f', '{"action":"login","actor_id":"550e8400-e29b-41d4-a716-446655440000","actor_username":"admin@preset.ie","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-18 08:17:08.033349+00', ''),
	('00000000-0000-0000-0000-000000000000', '20fded27-56b7-4cd9-933a-382a84f56ceb', '{"action":"logout","actor_id":"550e8400-e29b-41d4-a716-446655440000","actor_username":"admin@preset.ie","actor_via_sso":false,"log_type":"account"}', '2025-09-18 08:17:08.163667+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b393a3c1-28a6-4507-9ffb-8a8e64fe7647', '{"action":"login","actor_id":"550e8400-e29b-41d4-a716-446655440000","actor_username":"admin@preset.ie","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-18 08:17:50.075195+00', ''),
	('00000000-0000-0000-0000-000000000000', '61ba603f-8c74-4a2c-b256-a295b334d484', '{"action":"login","actor_id":"550e8400-e29b-41d4-a716-446655440000","actor_username":"admin@preset.ie","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-18 08:19:01.034806+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a2b64e82-6f5a-458b-b124-abd508939f3c', '{"action":"token_refreshed","actor_id":"550e8400-e29b-41d4-a716-446655440000","actor_username":"admin@preset.ie","actor_via_sso":false,"log_type":"token"}', '2025-09-18 09:38:48.597604+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bb5983d2-7f5c-45fc-a539-be410ece6b58', '{"action":"token_revoked","actor_id":"550e8400-e29b-41d4-a716-446655440000","actor_username":"admin@preset.ie","actor_via_sso":false,"log_type":"token"}', '2025-09-18 09:38:48.599205+00', ''),
	('00000000-0000-0000-0000-000000000000', '81cc580e-f961-4453-a035-50d95918bd13', '{"action":"token_refreshed","actor_id":"550e8400-e29b-41d4-a716-446655440000","actor_username":"admin@preset.ie","actor_via_sso":false,"log_type":"token"}', '2025-09-18 16:25:00.490964+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c6fceca6-9262-4d88-9d6c-9f22438ddb3a', '{"action":"token_revoked","actor_id":"550e8400-e29b-41d4-a716-446655440000","actor_username":"admin@preset.ie","actor_via_sso":false,"log_type":"token"}', '2025-09-18 16:25:00.492848+00', ''),
	('00000000-0000-0000-0000-000000000000', '74a133e2-34a7-448e-a8fc-6c6103022bc6', '{"action":"token_refreshed","actor_id":"550e8400-e29b-41d4-a716-446655440000","actor_username":"admin@preset.ie","actor_via_sso":false,"log_type":"token"}', '2025-09-18 18:19:12.297394+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f1b11b6d-1aba-4462-bbc4-5ca835bfcd9b', '{"action":"token_revoked","actor_id":"550e8400-e29b-41d4-a716-446655440000","actor_username":"admin@preset.ie","actor_via_sso":false,"log_type":"token"}', '2025-09-18 18:19:12.299023+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440000', 'authenticated', 'authenticated', 'admin@preset.ie', '$2a$06$iDefma/UUwRGfaZksDITVugq/OUIbHZ/lTdcu3G0gVAru2H3Sx0aW', '2025-09-18 08:16:56.825666+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-09-18 08:19:01.036167+00', '{"provider": "email", "providers": ["email"]}', '{"role": "ADMIN"}', NULL, '2025-09-18 08:16:56.825666+00', '2025-09-18 18:19:12.301712+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('dd981f3e-7adc-4799-901b-0d8de6400960', '550e8400-e29b-41d4-a716-446655440000', '2025-09-18 08:17:50.076524+00', '2025-09-18 08:17:50.076524+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:143.0) Gecko/20100101 Firefox/143.0', '109.78.110.169', NULL),
	('f0a25c22-771b-45d3-a23c-64d2159faadb', '550e8400-e29b-41d4-a716-446655440000', '2025-09-18 08:19:01.036262+00', '2025-09-18 18:19:12.303322+00', NULL, 'aal1', NULL, '2025-09-18 18:19:12.303247', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:143.0) Gecko/20100101 Firefox/143.0', '194.125.134.6', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('dd981f3e-7adc-4799-901b-0d8de6400960', '2025-09-18 08:17:50.078862+00', '2025-09-18 08:17:50.078862+00', 'password', '11770321-64a7-4455-87d0-817bc05c1456'),
	('f0a25c22-771b-45d3-a23c-64d2159faadb', '2025-09-18 08:19:01.040088+00', '2025-09-18 08:19:01.040088+00', 'password', '8f1a3e95-00e5-43b7-889d-c98af5caf32a');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 246, 'uqqvdsxxra7b', '550e8400-e29b-41d4-a716-446655440000', false, '2025-09-18 08:17:50.077551+00', '2025-09-18 08:17:50.077551+00', NULL, 'dd981f3e-7adc-4799-901b-0d8de6400960'),
	('00000000-0000-0000-0000-000000000000', 247, '7cskb2ved3y2', '550e8400-e29b-41d4-a716-446655440000', true, '2025-09-18 08:19:01.037666+00', '2025-09-18 09:38:48.599936+00', NULL, 'f0a25c22-771b-45d3-a23c-64d2159faadb'),
	('00000000-0000-0000-0000-000000000000', 248, 'jvqc3fa6cdcp', '550e8400-e29b-41d4-a716-446655440000', true, '2025-09-18 09:38:48.603025+00', '2025-09-18 16:25:00.494041+00', '7cskb2ved3y2', 'f0a25c22-771b-45d3-a23c-64d2159faadb'),
	('00000000-0000-0000-0000-000000000000', 249, 'kf4djqkn45nd', '550e8400-e29b-41d4-a716-446655440000', true, '2025-09-18 16:25:00.49545+00', '2025-09-18 18:19:12.299616+00', 'jvqc3fa6cdcp', 'f0a25c22-771b-45d3-a23c-64d2159faadb'),
	('00000000-0000-0000-0000-000000000000', 250, '7e7qljb477xu', '550e8400-e29b-41d4-a716-446655440000', false, '2025-09-18 18:19:12.300469+00', '2025-09-18 18:19:12.300469+00', 'kf4djqkn45nd', 'f0a25c22-771b-45d3-a23c-64d2159faadb');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: age_verification_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: api_providers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."api_providers" ("id", "name", "base_url", "api_key_encrypted", "cost_per_request", "rate_limit_per_minute", "priority", "is_active", "health_check_url", "last_health_check", "success_rate_24h", "created_at") VALUES
	('7a9ddba9-6f71-403c-a520-334ed2947143', 'nanobanan', 'https://api.nanobananapi.ai', 'ENCRYPTED_API_KEY_PLACEHOLDER', 0.0250, 60, 1, true, NULL, NULL, 100.00, '2025-09-17 21:08:26.956385+00');


--
-- Data for Name: users_profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users_profile" ("id", "user_id", "display_name", "handle", "avatar_url", "bio", "city", "role_flags", "style_tags", "subscription_tier", "subscription_status", "subscription_started_at", "subscription_expires_at", "verified_id", "created_at", "updated_at", "header_banner_url", "header_banner_position", "vibe_tags", "country", "age_verified", "account_status", "instagram_handle", "tiktok_handle", "website_url", "portfolio_url", "phone_number", "years_experience", "specializations", "equipment_list", "editing_software", "languages", "hourly_rate_min", "hourly_rate_max", "available_for_travel", "travel_radius_km", "studio_name", "has_studio", "studio_address", "typical_turnaround_days", "height_cm", "measurements", "eye_color", "hair_color", "shoe_size", "clothing_sizes", "tattoos", "piercings", "talent_categories", "date_of_birth", "age_verified_at", "verification_method", "verification_attempts", "first_name", "last_name") VALUES
	('c13e901b-70e3-4afd-8aa5-8977dca0511f', '550e8400-e29b-41d4-a716-446655440000', 'admin', 'admin', NULL, '', '', '{TALENT}', '{}', 'FREE', 'ACTIVE', '2025-09-18 08:27:07.733987+00', NULL, false, '2025-09-18 08:27:07.733987+00', '2025-09-18 16:26:55.343246+00', NULL, '{"y":0,"scale":1}', '{}', '', false, 'pending_verification', NULL, NULL, NULL, NULL, NULL, 0, '{}', '{}', '{}', '{}', NULL, NULL, false, 50, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', false, false, '{}', NULL, NULL, NULL, 0, NULL, NULL);


--
-- Data for Name: gigs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."badges" ("id", "name", "slug", "description", "type", "category", "icon", "color", "background_color", "is_active", "is_automatic", "requires_approval", "rarity", "points", "created_at", "created_by", "updated_at") VALUES
	('a7bf6b18-9848-46c0-a8a9-c000212aa236', 'Age Verified', 'age-verified', 'Verified to be 18 years or older', 'verification', 'identity', 'shield-check', 'green', 'green', true, true, false, 'common', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('b8e47c48-c87e-430e-a2a8-fad0176bd396', 'ID Verified', 'id-verified', 'Government ID verified', 'verification', 'identity', 'badge-check', 'blue', 'blue', true, false, false, 'rare', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('919b8767-b9b0-4fe5-8e51-e49147ba8f1f', 'Email Verified', 'email-verified', 'Email address verified', 'verification', 'identity', 'mail-check', 'emerald', 'emerald', true, true, false, 'common', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('0db4046e-ec28-44d9-81c6-aff07e2907ae', 'Phone Verified', 'phone-verified', 'Phone number verified', 'verification', 'identity', 'phone', 'teal', 'teal', true, false, false, 'common', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('633a2219-1f04-4797-91f6-8d19d4863a6d', 'Plus Member', 'plus-member', 'Active Plus subscription', 'subscription', 'platform', 'crown', 'purple', 'purple', true, true, false, 'rare', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('9ac4d0ee-3850-4a55-a459-df7eb8c7ab76', 'Pro Member', 'pro-member', 'Active Pro subscription', 'subscription', 'platform', 'gem', 'gold', 'yellow', true, true, false, 'epic', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('a4533333-3978-4ab3-aeda-6bf39caf047a', 'First Gig', 'first-gig', 'Completed your first gig', 'achievement', 'achievement', 'camera', 'orange', 'orange', true, true, false, 'common', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('c8a9d502-a416-453a-8f5a-5e94d47b0bbb', '10 Gigs Complete', '10-gigs', 'Completed 10 gigs', 'achievement', 'achievement', 'target', 'blue', 'blue', true, true, false, 'rare', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('b402e670-42c6-40fb-83a4-42b1ed608b72', '50 Gigs Complete', '50-gigs', 'Completed 50 gigs', 'achievement', 'achievement', 'trophy', 'gold', 'yellow', true, true, false, 'epic', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('1ceabf5d-3f3c-4a73-88a8-9e322d634938', '100 Gigs Complete', '100-gigs', 'Completed 100 gigs', 'achievement', 'achievement', 'award', 'gold', 'yellow', true, true, false, 'legendary', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('b5660e5b-b372-486f-9320-ab99e7fe5839', 'Early Adopter', 'early-adopter', 'Joined during beta period', 'special', 'special', 'star', 'indigo', 'indigo', true, false, false, 'rare', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('a866d020-3c5b-482d-a188-ee0f0b1a4e3f', 'Beta Tester', 'beta-tester', 'Helped test new features', 'special', 'special', 'flask', 'pink', 'pink', true, false, false, 'rare', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('738f94dd-cd08-4f9c-b0cc-2322b30ed2c8', 'Featured Creator', 'featured-creator', 'Showcased work was featured', 'special', 'community', 'spotlight', 'yellow', 'yellow', true, false, false, 'epic', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('0af80cea-38eb-4eb8-aae6-f6d0b9129803', 'Trusted Member', 'trusted-member', 'Long-standing community member in good standing', 'moderation', 'community', 'heart', 'red', 'red', true, false, false, 'rare', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00'),
	('c38c04fd-7282-4475-a0e9-46a41385bdaa', 'Community Helper', 'community-helper', 'Actively helps other community members', 'moderation', 'community', 'users', 'green', 'green', true, false, false, 'rare', 0, '2025-09-17 21:08:27.360119+00', NULL, '2025-09-17 21:08:27.360119+00');


--
-- Data for Name: moodboards; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: collab_projects; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: collab_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: collab_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: collab_gear_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: collab_gear_offers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: collab_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: credit_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."credit_alerts" ("id", "alert_type", "threshold_value", "notification_channels", "is_active", "last_triggered_at", "created_at") VALUES
	('6d336ef9-51dd-4249-9010-a685f159625e', 'low_platform_credits', 100.0000, '{email,slack}', true, NULL, '2025-09-17 21:08:26.956385+00'),
	('d18f11a9-1df3-49a8-bbef-d850c29c1cfc', 'high_credit_usage', 90.0000, '{email}', true, NULL, '2025-09-17 21:08:26.956385+00'),
	('0e673895-f8c8-47ed-ada9-5754d569e812', 'api_failure', 0.0000, '{slack}', true, NULL, '2025-09-17 21:08:26.956385+00');


--
-- Data for Name: credit_pools; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."credit_pools" ("id", "provider", "total_purchased", "total_consumed", "available_balance", "cost_per_credit", "last_refill_at", "auto_refill_threshold", "auto_refill_amount", "status", "created_at", "updated_at") VALUES
	('02cd1ebe-db01-4b6f-a0c5-f445e75bf879', 'nanobanan', 1000.0000, 0.0000, 1000.0000, 0.0250, NULL, 100.0000, 500.0000, 'active', '2025-09-17 21:08:26.956385+00', '2025-09-17 21:08:26.956385+00');


--
-- Data for Name: credit_purchase_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: credit_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: daily_usage_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: domain_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: enhancement_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: equipment_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: gig_notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: listing_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: listing_enhancements; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: listing_images; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: marketplace_disputes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: marketplace_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: offers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rental_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sale_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: moderation_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: moodboard_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "email", "role", "subscription_tier", "subscription_expires_at", "stripe_customer_id", "stripe_subscription_id", "verification_status", "email_verified_at", "id_verified_at", "is_active", "created_at", "updated_at") VALUES
	('550e8400-e29b-41d4-a716-446655440000', 'admin@preset.ie', 'ADMIN', 'FREE', NULL, NULL, NULL, 'UNVERIFIED', NULL, NULL, true, '2025-09-18 08:16:56.825666+00', '2025-09-18 08:16:56.825666+00');


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notification_preferences" ("id", "user_id", "email_enabled", "push_enabled", "in_app_enabled", "gig_notifications", "application_notifications", "message_notifications", "booking_notifications", "system_notifications", "marketing_notifications", "digest_frequency", "timezone", "badge_count_enabled", "sound_enabled", "vibration_enabled", "marketplace_notifications", "listing_notifications", "offer_notifications", "order_notifications", "payment_notifications", "review_notifications", "dispute_notifications", "created_at", "updated_at") VALUES
	('fab3e603-fe24-4b98-9b97-184b52175d36', '550e8400-e29b-41d4-a716-446655440000', true, true, true, true, true, true, true, true, false, 'real-time', 'UTC', true, true, true, true, true, true, true, true, true, true, '2025-09-18 08:23:13.69677+00', '2025-09-18 08:23:13.69677+00');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_presets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: preset_usage_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: request_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: request_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: saved_gigs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: showcases; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: supabase_admin
--



--
-- Data for Name: subscription_benefits; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."subscription_benefits" ("id", "user_id", "subscription_tier", "benefit_type", "benefit_value", "used_this_month", "monthly_limit", "last_reset_at", "created_at", "updated_at") VALUES
	('04584b19-e795-4266-bcda-23606c6d8e23', 'c13e901b-70e3-4afd-8aa5-8977dca0511f', 'FREE', 'monthly_bump', '{"type": "monthly_bump"}', 0, 0, '2025-09-01 00:00:00+00', '2025-09-18 09:19:05.090945+00', '2025-09-18 09:19:05.090945+00');


--
-- Data for Name: subscription_tiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."subscription_tiers" ("id", "name", "display_name", "max_moodboards_per_day", "max_user_uploads", "max_ai_enhancements", "ai_cost_per_enhancement", "created_at") VALUES
	('82aeede7-548d-4089-99f4-f42e2c9a7480', 'free', 'Free', 3, 0, 0, 0.0250, '2025-09-17 21:08:26.906214+00'),
	('ee9487ad-64d3-46c5-a513-0560d363f68d', 'plus', 'Plus', 10, 3, 2, 0.0250, '2025-09-17 21:08:26.906214+00'),
	('ed4964b3-acd3-4370-96dd-2fc050a4b70a', 'pro', 'Pro', 25, 6, 4, 0.0250, '2025-09-17 21:08:26.906214+00');


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: system_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."system_alerts" ("id", "type", "level", "message", "metadata", "created_at") VALUES
	('d42ff2ef-f378-4763-81c0-9c5312c55773', 'migration_completed', 'info', 'Marketplace schema migration completed successfully', '{"migration": "092_marketplace_schema.sql", "tables_created": 8, "indexes_created": 25, "policies_created": 20}', '2025-09-17 22:42:11.314721+00'),
	('da68a2b2-1d90-4f32-8b1d-458ec567248e', 'migration_completed', 'info', 'Collaboration system migration completed successfully', '{"migration": "098_collaboration_system.sql", "tables_created": 6, "indexes_created": 20, "policies_created": 18}', '2025-09-18 12:39:58.430223+00');


--
-- Data for Name: typing_indicators; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_credits; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_credits" ("id", "user_id", "subscription_tier", "monthly_allowance", "current_balance", "consumed_this_month", "last_reset_at", "lifetime_consumed", "created_at", "updated_at") VALUES
	('afb12b91-31e3-42c0-a809-80bd1c64c9ba', '550e8400-e29b-41d4-a716-446655440000', 'FREE', 10, 10, 0, '2025-09-01 00:00:00+00', 0, '2025-09-18 08:16:56.825666+00', '2025-09-18 08:16:56.825666+00');


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_settings" ("id", "user_id", "email_notifications", "push_notifications", "marketing_emails", "profile_visibility", "show_contact_info", "two_factor_enabled", "created_at", "updated_at", "profile_id", "message_notifications", "allow_stranger_messages", "privacy_level") VALUES
	('b9a3756b-992a-4155-9422-b6bf20da242a', '550e8400-e29b-41d4-a716-446655440000', true, true, false, 'public', true, false, '2025-09-18 08:16:56.825666+00', '2025-09-18 08:16:56.825666+00', NULL, true, false, 'standard');


--
-- Data for Name: user_violations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: verification_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: verification_badges; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: violation_thresholds; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."violation_thresholds" ("id", "violation_count", "action_type", "severity_threshold", "auto_apply", "created_at") VALUES
	('ddfec007-710b-4f8f-8876-cf4ed11a643c', 1, 'warning', 'minor', true, '2025-09-17 21:08:27.19776+00'),
	('dbae1701-8989-4f4e-ab4b-554591244d70', 2, 'warning', 'minor', true, '2025-09-17 21:08:27.19776+00'),
	('57e29cb1-b4f9-403a-85fd-f7852b654da4', 3, 'suspend_24h', 'minor', true, '2025-09-17 21:08:27.19776+00'),
	('fd4cfef8-b969-4088-96d8-22ff0527dcb8', 5, 'suspend_7d', 'moderate', true, '2025-09-17 21:08:27.19776+00'),
	('cd1aaa33-06bd-4a87-9bbb-5ee4b77efe63', 7, 'suspend_30d', 'moderate', true, '2025-09-17 21:08:27.19776+00'),
	('fa135c41-b1d3-4ae2-93f3-d59bed6fad01', 10, 'ban', 'severe', false, '2025-09-17 21:08:27.19776+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('moodboard-images', 'moodboard-images', NULL, '2025-09-08 16:26:19.812911+00', '2025-09-08 16:26:19.812911+00', true, false, 10485760, '{image/jpeg,image/png,image/webp,image/gif}', NULL, 'STANDARD'),
	('user-media', 'user-media', NULL, '2025-09-08 12:40:13.295138+00', '2025-09-08 12:40:13.295138+00', true, false, 52428800, '{image/*,video/*}', NULL, 'STANDARD'),
	('profile-images', 'profile-images', NULL, '2025-09-10 00:57:20.874432+00', '2025-09-10 00:57:20.874432+00', true, false, 5242880, '{image/jpeg,image/png,image/webp,image/gif}', NULL, 'STANDARD'),
	('verification-documents', 'verification-documents', NULL, '2025-09-10 11:38:43.800975+00', '2025-09-10 11:38:43.800975+00', false, false, 5242880, '{image/jpeg,image/png,image/webp,application/pdf}', NULL, 'STANDARD'),
	('avatars', 'avatars', NULL, '2025-09-13 00:25:41.771433+00', '2025-09-13 00:25:41.771433+00', true, false, 52428800, '{image/jpeg,image/png,image/webp,image/gif}', NULL, 'STANDARD'),
	('moodboard-uploads', 'moodboard-uploads', NULL, '2025-09-13 00:25:41.925207+00', '2025-09-13 00:25:41.925207+00', false, false, 52428800, '{image/jpeg,image/png,image/webp,image/gif}', NULL, 'STANDARD'),
	('playground-gallery', 'playground-gallery', NULL, '2025-09-15 14:38:36.902943+00', '2025-09-15 14:38:36.902943+00', true, false, 10485760, '{image/jpeg,image/png,image/webp}', NULL, 'STANDARD'),
	('playground-uploads', 'playground-uploads', NULL, '2025-09-16 12:33:57.532083+00', '2025-09-16 12:33:57.532083+00', true, false, 10485760, '{image/jpeg,image/png,image/webp,image/gif}', NULL, 'STANDARD'),
	('listings', 'listings', NULL, '2025-09-17 22:42:39.959289+00', '2025-09-17 22:42:39.959289+00', true, false, 10485760, '{image/jpeg,image/png,image/webp}', NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "level") VALUES
	('e02cc0eb-ecd5-440a-8c30-d3cda2f0e2f3', 'moodboard-images', 'enhanced_b53efa8c04c7227f8ffe0b8fa4681088_1757365633567.jpg', NULL, '2025-09-08 21:07:13.764099+00', '2025-09-08 21:07:13.764099+00', '2025-09-08 21:07:13.764099+00', '{"eTag": "\"60f4000a4e387a2c5c885035239caeb8\"", "size": 26834, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-08T21:07:14.000Z", "contentLength": 26834, "httpStatusCode": 200}', '9b2f8ea7-9919-47a9-bc17-6a6a667b5c6c', NULL, '{}', 1),
	('1e916b77-15ee-419a-b08a-36e6f865c00b', 'moodboard-images', 'enhanced_1757371427822_32bee7e7377ebb13ee7125b380bfd410.jpeg', NULL, '2025-09-08 22:43:48.160492+00', '2025-09-08 22:43:48.160492+00', '2025-09-08 22:43:48.160492+00', '{"eTag": "\"1aa1529168b84da94a4770f405133bda\"", "size": 226844, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-08T22:43:49.000Z", "contentLength": 226844, "httpStatusCode": 200}', '330dbcaa-881b-477e-b244-f0a67ae366a5', NULL, '{}', 1),
	('90237fdf-b02b-4a42-9457-3fb918e914af', 'moodboard-images', 'enhanced_1757371442509_32bee7e7377ebb13ee7125b380bfd410.jpeg', NULL, '2025-09-08 22:44:02.904526+00', '2025-09-08 22:44:02.904526+00', '2025-09-08 22:44:02.904526+00', '{"eTag": "\"1aa1529168b84da94a4770f405133bda\"", "size": 226844, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-08T22:44:03.000Z", "contentLength": 226844, "httpStatusCode": 200}', '58d444bf-321f-43c0-9b21-1dd1b7af364d', NULL, '{}', 1),
	('14c1dfe4-37c0-4df3-934b-21087c3a0427', 'moodboard-images', 'enhanced_eabe72d0bd5339cabef3c90e2c2343a6_1757404009502.jpg', NULL, '2025-09-09 07:46:49.732305+00', '2025-09-09 07:46:49.732305+00', '2025-09-09 07:46:49.732305+00', '{"eTag": "\"5336bed7f43175ed78b490fe1ee3bd6f\"", "size": 110196, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T07:46:50.000Z", "contentLength": 110196, "httpStatusCode": 200}', 'e76b5ec1-a755-4b50-94e5-8e3af12e0e09', NULL, '{}', 1),
	('0d0ab3a4-3881-45c6-aa4d-52f929190952', 'moodboard-images', 'enhanced_451105f83926be798f2c797b76a52862_1757404167716.jpg', NULL, '2025-09-09 07:49:27.875116+00', '2025-09-09 07:49:27.875116+00', '2025-09-09 07:49:27.875116+00', '{"eTag": "\"78c43c1cb63bb04530fa5359689c8370\"", "size": 52659, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T07:49:28.000Z", "contentLength": 52659, "httpStatusCode": 200}', 'a758b7f2-538b-49e5-a07a-448af4e813e3', NULL, '{}', 1),
	('90a80644-9fa8-45cc-b8a0-82ffdb70100d', 'user-media', 'd14b04a9-528e-45ec-8957-34e36bfd97aa-1757406143208-62wmy.jpeg', 'd14b04a9-528e-45ec-8957-34e36bfd97aa', '2025-09-09 08:22:23.608062+00', '2025-09-09 08:22:23.608062+00', '2025-09-09 08:22:23.608062+00', '{"eTag": "\"2a197c7dc62ab2363bf507e5a5f87f04\"", "size": 246536, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T08:22:24.000Z", "contentLength": 246536, "httpStatusCode": 200}', '2ea64fa2-3c12-48a4-82ce-9e0ead23ce12', 'd14b04a9-528e-45ec-8957-34e36bfd97aa', '{}', 1),
	('b43b73db-c324-49c2-837f-6966e9149273', 'user-media', 'd14b04a9-528e-45ec-8957-34e36bfd97aa-1757410483816-984pj.jpeg', 'd14b04a9-528e-45ec-8957-34e36bfd97aa', '2025-09-09 09:34:44.037293+00', '2025-09-09 09:34:44.037293+00', '2025-09-09 09:34:44.037293+00', '{"eTag": "\"30fc635a12de103eb29deae8f6c230f6\"", "size": 390421, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T09:34:44.000Z", "contentLength": 390421, "httpStatusCode": 200}', 'dbf87b68-dc4e-45bf-8603-f7466760b56a', 'd14b04a9-528e-45ec-8957-34e36bfd97aa', '{}', 1),
	('1c808c06-d1bf-4e34-a66f-efc31b6ad943', 'user-media', 'd14b04a9-528e-45ec-8957-34e36bfd97aa-1757410505369-lshb98.jpeg', 'd14b04a9-528e-45ec-8957-34e36bfd97aa', '2025-09-09 09:35:05.59558+00', '2025-09-09 09:35:05.59558+00', '2025-09-09 09:35:05.59558+00', '{"eTag": "\"30fc635a12de103eb29deae8f6c230f6\"", "size": 390421, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T09:35:06.000Z", "contentLength": 390421, "httpStatusCode": 200}', 'c9d41a99-be05-451f-a802-a20557ea99e1', 'd14b04a9-528e-45ec-8957-34e36bfd97aa', '{}', 1),
	('b8ac0e6b-94db-44d7-bcf5-be084cff74ae', 'moodboard-images', 'enhanced_d2b27d91694e091615f73a30879c1549_1757412806424.jpg', NULL, '2025-09-09 10:13:27.080265+00', '2025-09-09 10:13:27.080265+00', '2025-09-09 10:13:27.080265+00', '{"eTag": "\"78d005659394d505acc7b04d91a3a5fa\"", "size": 49789, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T10:13:28.000Z", "contentLength": 49789, "httpStatusCode": 200}', '5e6d6d9d-d91e-4070-8dcc-172973d37e38', NULL, '{}', 1),
	('9fdb8264-b342-46c5-b4b3-68e69803121a', 'moodboard-images', 'enhanced_3f9320f54426f283a4575dadbaccc3e6_1757412843273.jpg', NULL, '2025-09-09 10:14:04.008935+00', '2025-09-09 10:14:04.008935+00', '2025-09-09 10:14:04.008935+00', '{"eTag": "\"487de8cb3ba7dbe964c3043ae870570d\"", "size": 62830, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T10:14:04.000Z", "contentLength": 62830, "httpStatusCode": 200}', '98dc3c33-8178-4f25-be95-fa2cec59d469', NULL, '{}', 1),
	('cc5b9411-1bff-47b1-bca5-ed0873bd8734', 'profile-images', '78b444d3-55ab-4533-b931-34c2e2af6874/1757613233764.JPG', '78b444d3-55ab-4533-b931-34c2e2af6874', '2025-09-11 17:53:54.612498+00', '2025-09-11 17:53:54.612498+00', '2025-09-11 17:53:54.612498+00', '{"eTag": "\"62bb4d4b4081d6180ccb91eb2b177179\"", "size": 3125685, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-11T17:53:55.000Z", "contentLength": 3125685, "httpStatusCode": 200}', '3ca49e41-304a-4b91-94f7-4966689b648e', '78b444d3-55ab-4533-b931-34c2e2af6874', '{}', 2),
	('f9aa1df0-c395-4331-967f-9e2dcebae805', 'profile-images', '78b444d3-55ab-4533-b931-34c2e2af6874/header-banner-1757708450605.jpg', '78b444d3-55ab-4533-b931-34c2e2af6874', '2025-09-12 20:20:51.361043+00', '2025-09-12 20:20:51.361043+00', '2025-09-12 20:20:51.361043+00', '{"eTag": "\"ad9cf5ce5f3514a844b7ba774899a99e\"", "size": 2203099, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-12T20:20:52.000Z", "contentLength": 2203099, "httpStatusCode": 200}', '18f114a6-cfcf-462d-bb28-0e6d314c07eb', '78b444d3-55ab-4533-b931-34c2e2af6874', '{}', 2),
	('7b443ad3-7db6-4792-8614-781fd5cc28ab', 'profile-images', '78b444d3-55ab-4533-b931-34c2e2af6874/header-banner-1757708507009.jpg', '78b444d3-55ab-4533-b931-34c2e2af6874', '2025-09-12 20:21:47.716343+00', '2025-09-12 20:21:47.716343+00', '2025-09-12 20:21:47.716343+00', '{"eTag": "\"ad9cf5ce5f3514a844b7ba774899a99e\"", "size": 2203099, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-12T20:21:48.000Z", "contentLength": 2203099, "httpStatusCode": 200}', 'e5af56f1-c1b4-41b1-a49f-9ff0ff2f72eb', '78b444d3-55ab-4533-b931-34c2e2af6874', '{}', 2),
	('a1918671-b189-439b-b05a-3faaf4043997', 'profile-images', '78b444d3-55ab-4533-b931-34c2e2af6874/header-banner-1757708793208.jpg', '78b444d3-55ab-4533-b931-34c2e2af6874', '2025-09-12 20:26:33.938575+00', '2025-09-12 20:26:33.938575+00', '2025-09-12 20:26:33.938575+00', '{"eTag": "\"ad9cf5ce5f3514a844b7ba774899a99e\"", "size": 2203099, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-12T20:26:34.000Z", "contentLength": 2203099, "httpStatusCode": 200}', 'b8f9e488-feb2-4e0d-b101-9dfbed3d46ae', '78b444d3-55ab-4533-b931-34c2e2af6874', '{}', 2),
	('b5310e3d-36ad-41b6-958d-3d36b73f9f08', 'profile-images', '78b444d3-55ab-4533-b931-34c2e2af6874/header-banner-1757721936714.jpg', '78b444d3-55ab-4533-b931-34c2e2af6874', '2025-09-13 00:05:37.37375+00', '2025-09-13 00:05:37.37375+00', '2025-09-13 00:05:37.37375+00', '{"eTag": "\"ad9cf5ce5f3514a844b7ba774899a99e\"", "size": 2203099, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-13T00:05:38.000Z", "contentLength": 2203099, "httpStatusCode": 200}', '63241445-af8a-495c-aeaf-9fb8d2b3543c', '78b444d3-55ab-4533-b931-34c2e2af6874', '{}', 2),
	('c5883825-33d5-45c4-9556-3304c5345685', 'avatars', '78b444d3-55ab-4533-b931-34c2e2af6874/header-1757723309704.jpg', '78b444d3-55ab-4533-b931-34c2e2af6874', '2025-09-13 00:28:30.241022+00', '2025-09-13 00:28:30.241022+00', '2025-09-13 00:28:30.241022+00', '{"eTag": "\"ad9cf5ce5f3514a844b7ba774899a99e\"", "size": 2203099, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-13T00:28:31.000Z", "contentLength": 2203099, "httpStatusCode": 200}', 'c1607668-fc15-4088-aa77-a523fc1bd9bf', '78b444d3-55ab-4533-b931-34c2e2af6874', '{}', 2),
	('fc777c4a-6c76-47a1-86ec-269ab15a5487', 'avatars', '78b444d3-55ab-4533-b931-34c2e2af6874/header-1757726490177.jpg', '78b444d3-55ab-4533-b931-34c2e2af6874', '2025-09-13 01:21:31.016666+00', '2025-09-13 01:21:31.016666+00', '2025-09-13 01:21:31.016666+00', '{"eTag": "\"ad9cf5ce5f3514a844b7ba774899a99e\"", "size": 2203099, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-13T01:21:31.000Z", "contentLength": 2203099, "httpStatusCode": 200}', '4b07b918-deed-4f71-9254-93559a99a26e', '78b444d3-55ab-4533-b931-34c2e2af6874', '{}', 2),
	('4d0c0c87-8826-46bd-a841-dc016d44487f', 'playground-uploads', '78b444d3-55ab-4533-b931-34c2e2af6874/base-images/.emptyFolderPlaceholder', NULL, '2025-09-17 22:17:38.846698+00', '2025-09-17 22:17:38.846698+00', '2025-09-17 22:17:38.846698+00', '{"eTag": "\"d41d8cd98f00b204e9800998ecf8427e\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2025-09-17T22:17:38.846Z", "contentLength": 0, "httpStatusCode": 200}', '63517c06-7e29-4d9e-8de0-5764c82c212d', NULL, '{}', 3);


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."prefixes" ("bucket_id", "name", "created_at", "updated_at") VALUES
	('profile-images', '78b444d3-55ab-4533-b931-34c2e2af6874', '2025-09-11 17:53:54.612498+00', '2025-09-11 17:53:54.612498+00'),
	('avatars', '78b444d3-55ab-4533-b931-34c2e2af6874', '2025-09-13 00:28:30.241022+00', '2025-09-13 00:28:30.241022+00'),
	('playground-uploads', '78b444d3-55ab-4533-b931-34c2e2af6874', '2025-09-17 22:17:38.846698+00', '2025-09-17 22:17:38.846698+00'),
	('playground-uploads', '78b444d3-55ab-4533-b931-34c2e2af6874/base-images', '2025-09-17 22:17:38.846698+00', '2025-09-17 22:17:38.846698+00');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 250, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
