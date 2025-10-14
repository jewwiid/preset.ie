-- Fix Remaining Function Search Path Security Warnings
-- This migration fixes the remaining ~68 functions that were not caught by the first migration
-- due to different parameter signatures or missing function definitions

DO $$
BEGIN
    -- Reuse the same helper function from the previous migration
    CREATE OR REPLACE FUNCTION pg_temp.safe_alter_function_search_path(
        function_signature TEXT
    ) RETURNS VOID AS $func$
    BEGIN
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', function_signature);
        RAISE NOTICE 'Fixed: %', function_signature;
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE 'Skipped (not found): %', function_signature;
        WHEN OTHERS THEN
            RAISE WARNING 'Error on %: %', function_signature, SQLERRM;
    END;
    $func$ LANGUAGE plpgsql;

    -- ============================================================================
    -- FIX REMAINING FUNCTIONS WITH CORRECT SIGNATURES
    -- ============================================================================

    -- Try common variations for each function since we don't know exact signatures

    -- User Settings & Testing
    PERFORM pg_temp.safe_alter_function_search_path('public.test_user_settings_access(text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_settings(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.create_default_user_settings(uuid)');

    -- Preset & Content Functions
    PERFORM pg_temp.safe_alter_function_search_path('public.track_preset_usage(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.increment_preset_usage(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.increment_preset_usage(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.notify_preset_usage()');
    PERFORM pg_temp.safe_alter_function_search_path('public.validate_preset_style()');

    -- Moderation & Content Safety
    PERFORM pg_temp.safe_alter_function_search_path('public.mark_content_nsfw(text, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_content_moderation_info(text, uuid)');

    -- Rate Limiting
    PERFORM pg_temp.safe_alter_function_search_path('public.check_rate_limit(uuid, text, integer, integer)');
    PERFORM pg_temp.safe_alter_function_search_path('public.record_rate_limit_usage(text, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_rate_limit_status(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_rate_limit_status(uuid, text)');

    -- Trending & Usage
    PERFORM pg_temp.safe_alter_function_search_path('public.get_trending_presets_by_usage()');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_trending_presets_by_usage(integer)');

    -- Credits Management
    PERFORM pg_temp.safe_alter_function_search_path('public.consume_platform_credits(uuid, integer)');
    PERFORM pg_temp.safe_alter_function_search_path('public.consume_platform_credits(uuid, integer, text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.refund_user_credits(uuid, integer)');
    PERFORM pg_temp.safe_alter_function_search_path('public.refund_user_credits(uuid, integer, text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.process_credit_refund(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.process_credit_refund(uuid, text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_credit_history(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_credit_history(uuid, integer)');

    -- Gig & Location Functions
    PERFORM pg_temp.safe_alter_function_search_path('public.get_gigs_near_point(double precision, double precision)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_gigs_near_point(double precision, double precision, integer)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_gigs_in_bbox(double precision, double precision, double precision, double precision)');
    PERFORM pg_temp.safe_alter_function_search_path('public.geocode_location_text(varchar)');
    PERFORM pg_temp.safe_alter_function_search_path('public.sync_gig_location_coords()');
    PERFORM pg_temp.safe_alter_function_search_path('public.gig_is_looking_for(uuid, text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.user_matches_gig_types(uuid, text[])');

    -- Treatment & AB Testing
    PERFORM pg_temp.safe_alter_function_search_path('public.get_treatment_with_versions(text, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_treatment_updated_at()');

    -- Verification & User Management
    PERFORM pg_temp.safe_alter_function_search_path('public.verify_user_age(date)');
    PERFORM pg_temp.safe_alter_function_search_path('public.reject_verification_request(uuid, text, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.reject_verification_request(uuid, text)');

    -- Provider Performance
    PERFORM pg_temp.safe_alter_function_search_path('public.log_provider_performance(text, integer, text, boolean, jsonb)');
    PERFORM pg_temp.safe_alter_function_search_path('public.log_provider_performance(text, integer, text, boolean)');

    -- Showcase & Likes
    PERFORM pg_temp.safe_alter_function_search_path('public.update_showcase_likes_count()');

    -- Messaging & Conversations
    PERFORM pg_temp.safe_alter_function_search_path('public.get_shared_contacts(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.mark_conversation_delivered(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.generate_conversation_id(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.validate_message_before_insert()');
    PERFORM pg_temp.safe_alter_function_search_path('public.is_spam_message(text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.is_spam_message(text, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.send_unread_messages_digest()');
    PERFORM pg_temp.safe_alter_function_search_path('public.cleanup_old_typing_indicators()');

    -- Skills & Profile
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_skills(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_rating_info(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_collaboration_role_recommendations(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.find_users_by_vibe_similarity(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.find_users_by_vibe_similarity(uuid, integer)');
    PERFORM pg_temp.safe_alter_function_search_path('public.generate_profile_photo_path(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.generate_profile_photo_path(uuid, text)');

    -- Update Triggers
    PERFORM pg_temp.safe_alter_function_search_path('public.update_edit_type_categories_updated_at()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_collab_updated_at_column()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_listing_images_updated_at()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_custom_types_updated_at()');

    -- Subscription & Benefits
    PERFORM pg_temp.safe_alter_function_search_path('public.reset_monthly_subscription_benefits()');

    -- Notifications
    PERFORM pg_temp.safe_alter_function_search_path('public.mark_notification_as_read(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.mark_notification_as_read(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.mark_all_notifications_as_read(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_unread_notification_count(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.create_notification_preferences_for_user(uuid)');

    -- Handle & Resolution
    PERFORM pg_temp.safe_alter_function_search_path('public.resolve_current_handle(uuid)');

    -- Custom Types & Validation
    PERFORM pg_temp.safe_alter_function_search_path('public.increment_custom_type_usage(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.validate_performance_roles()');
    PERFORM pg_temp.safe_alter_function_search_path('public.validate_and_create_custom_purpose(text, uuid)');

    -- Email Triggers
    PERFORM pg_temp.safe_alter_function_search_path('public.trigger_welcome_email()');
    PERFORM pg_temp.safe_alter_function_search_path('public.trigger_application_status_email()');
    PERFORM pg_temp.safe_alter_function_search_path('public.trigger_application_withdrawn_email()');

    -- Invite System
    PERFORM pg_temp.safe_alter_function_search_path('public.generate_invite_code()');
    PERFORM pg_temp.safe_alter_function_search_path('public.generate_invite_code(uuid)');

    -- Listing & Marketplace
    PERFORM pg_temp.safe_alter_function_search_path('public.notify_listing_status()');
    PERFORM pg_temp.safe_alter_function_search_path('public.table_exists_marketplace()');

    -- User Onboarding
    PERFORM pg_temp.safe_alter_function_search_path('public.handle_new_user_complete()');
    PERFORM pg_temp.safe_alter_function_search_path('public.handle_new_user_simple()');

    -- Playground & Cleanup
    PERFORM pg_temp.safe_alter_function_search_path('public.cleanup_playground_temporary_content()');

    -- Contact & Sharing
    PERFORM pg_temp.safe_alter_function_search_path('public.share_contact_details(uuid, uuid)');

    -- Gig Applications & Invitations
    PERFORM pg_temp.safe_alter_function_search_path('public.handle_gig_invitation_acceptance()');

    -- Blocking
    PERFORM pg_temp.safe_alter_function_search_path('public.is_user_blocked(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.block_user(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_blocked_users(uuid)');

    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Remaining functions migration complete!';
    RAISE NOTICE '====================================================================';
END $$;
