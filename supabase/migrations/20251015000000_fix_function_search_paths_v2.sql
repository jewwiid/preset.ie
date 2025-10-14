-- Fix Function Search Path Security Warnings (Safe Version)
-- This migration addresses the search_path security warnings by setting an immutable
-- search_path for all affected functions to prevent search path injection attacks.
--
-- This version uses DO blocks with exception handling to skip functions that don't exist.

DO $$
BEGIN
    -- ============================================================================
    -- HELPER FUNCTION: Safely alter function search path
    -- ============================================================================
    -- This function attempts to alter a function's search_path and silently continues if it doesn't exist

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
    -- APPLY FIXES TO ALL FUNCTIONS
    -- ============================================================================

    -- TRIGGER FUNCTIONS - Updated_at handlers
    PERFORM pg_temp.safe_alter_function_search_path('public.update_updated_at()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_showcase_updated_at()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_showcase_comment_updated_at()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_reports_updated_at()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_verification_updated_at()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_notifications_updated_at()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_notification_preferences_updated_at()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_edit_types_updated_at()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_equipment_updated_at()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_cinematic_presets_updated_at()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_updated_at_column()');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_showcase_comments_count()');

    -- CREDIT MANAGEMENT FUNCTIONS
    PERFORM pg_temp.safe_alter_function_search_path('public.consume_user_credits(uuid, integer, text, jsonb)');
    PERFORM pg_temp.safe_alter_function_search_path('public.consume_platform_credits(uuid, integer, text, jsonb)');
    PERFORM pg_temp.safe_alter_function_search_path('public.add_purchased_credits(uuid, integer)');
    PERFORM pg_temp.safe_alter_function_search_path('public.add_purchased_credits(uuid, integer, text, jsonb)');
    PERFORM pg_temp.safe_alter_function_search_path('public.refund_user_credits(uuid, integer, text, text)');

    -- USER MANAGEMENT & VERIFICATION
    PERFORM pg_temp.safe_alter_function_search_path('public.is_user_suspended_or_banned(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.apply_moderation_action(uuid, text, uuid, text, integer, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.verify_user_age(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.admin_delete_user(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_verification_status(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.approve_verification_request(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.approve_verification_request(uuid, uuid, text, integer)');
    PERFORM pg_temp.safe_alter_function_search_path('public.reject_verification_request(uuid, uuid, text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_violation_summary(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.add_user_violation(uuid, text, text, text, uuid, text[], integer)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_violation_count(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.calculate_user_risk_score(uuid)');

    -- USER SETTINGS & PREFERENCES
    PERFORM pg_temp.safe_alter_function_search_path('public.create_default_user_settings_safe(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_settings_safe(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.upsert_user_settings(uuid, jsonb)');
    PERFORM pg_temp.safe_alter_function_search_path('public.test_user_settings_access(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.create_notification_preferences_for_new_user()');

    -- MESSAGING & COMMUNICATION
    PERFORM pg_temp.safe_alter_function_search_path('public.can_users_message(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.validate_message_permission(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_conversation_participants(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_users_blocking_user(uuid)');

    -- NOTIFICATION TRIGGERS
    PERFORM pg_temp.safe_alter_function_search_path('public.trigger_verification_email()');
    PERFORM pg_temp.safe_alter_function_search_path('public.trigger_gig_published_email()');
    PERFORM pg_temp.safe_alter_function_search_path('public.trigger_message_received_email()');
    PERFORM pg_temp.safe_alter_function_search_path('public.trigger_subscription_change_email()');
    PERFORM pg_temp.safe_alter_function_search_path('public.notify_gig_invitation_sent()');
    PERFORM pg_temp.safe_alter_function_search_path('public.notify_collab_invitation_response()');

    -- MODERATION & CONTENT SAFETY
    PERFORM pg_temp.safe_alter_function_search_path('public.mark_content_nsfw(uuid, text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_content_moderation_info(uuid, text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.auto_escalate_report_priority()');

    -- GIG & COLLABORATION FUNCTIONS
    PERFORM pg_temp.safe_alter_function_search_path('public.calculate_collaboration_skill_match(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_role_status_on_acceptance()');
    PERFORM pg_temp.safe_alter_function_search_path('public.calculate_gig_compatibility_with_preferences(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_gigs_near_point(geography, double precision)');
    PERFORM pg_temp.safe_alter_function_search_path('public.format_gig_location(text, text, text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.expire_old_gig_invitations()');
    PERFORM pg_temp.safe_alter_function_search_path('public.send_gig_match_notifications()');

    -- PROFILE & SEARCH FUNCTIONS
    PERFORM pg_temp.safe_alter_function_search_path('public.search_profiles(text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_profiles_by_performance_role(text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_profiles_by_professional_skill(text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.validate_professional_skills_trigger()');
    PERFORM pg_temp.safe_alter_function_search_path('public.search_roles_and_skills(text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_skills_by_category(text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_profile_image_url(uuid)');

    -- PRESET & SHOWCASE FUNCTIONS
    PERFORM pg_temp.safe_alter_function_search_path('public.get_preset_by_id(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.add_verified_preset_sample(uuid, text, jsonb)');
    PERFORM pg_temp.safe_alter_function_search_path('public.add_verified_preset_sample(uuid, text, text, text, text, text, text, text, text, integer, text, jsonb)');
    PERFORM pg_temp.safe_alter_function_search_path('public.track_preset_usage(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_trending_presets_by_usage(integer, interval)');
    PERFORM pg_temp.safe_alter_function_search_path('public.update_preset_latest_promoted_image()');

    -- RATE LIMITING & PERFORMANCE
    PERFORM pg_temp.safe_alter_function_search_path('public.check_rate_limit(uuid, text, integer, interval)');
    PERFORM pg_temp.safe_alter_function_search_path('public.record_rate_limit_usage(uuid, text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.cleanup_old_rate_limits()');
    PERFORM pg_temp.safe_alter_function_search_path('public.log_provider_performance(text, text, integer, boolean, jsonb)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_preferred_provider(uuid)');

    -- CLEANUP & MAINTENANCE FUNCTIONS
    PERFORM pg_temp.safe_alter_function_search_path('public.cleanup_old_domain_events()');
    PERFORM pg_temp.safe_alter_function_search_path('public.expire_suspensions()');
    PERFORM pg_temp.safe_alter_function_search_path('public.expire_verifications()');
    PERFORM pg_temp.safe_alter_function_search_path('public.expire_old_violations()');
    PERFORM pg_temp.safe_alter_function_search_path('public.cleanup_orphaned_platform_images()');
    PERFORM pg_temp.safe_alter_function_search_path('public.on_storage_object_deleted()');

    -- INVITATION & USER ONBOARDING
    PERFORM pg_temp.safe_alter_function_search_path('public.auto_generate_user_invite_code()');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_invitation_stats(uuid)');

    -- EMAIL & NOTIFICATION BATCH FUNCTIONS
    PERFORM pg_temp.safe_alter_function_search_path('public.send_weekly_digest()');
    PERFORM pg_temp.safe_alter_function_search_path('public.send_subscription_expiring_reminders()');
    PERFORM pg_temp.safe_alter_function_search_path('public.send_marketplace_milestones()');

    -- LOCATION & GEOCODING
    PERFORM pg_temp.safe_alter_function_search_path('public.geocode_location_text(text)');

    -- SUBSCRIPTION & FEATURE ACCESS
    PERFORM pg_temp.safe_alter_function_search_path('public.can_access_feature(uuid, text)');

    -- TREATMENT & AB TESTING
    PERFORM pg_temp.safe_alter_function_search_path('public.get_treatment_with_versions(uuid, text)');

    -- OAUTH & AUTHENTICATION
    PERFORM pg_temp.safe_alter_function_search_path('public.get_recent_oauth_errors(integer)');

    -- ADDITIONAL COMPATIBILITY & MATCHING FUNCTIONS
    PERFORM pg_temp.safe_alter_function_search_path('public.calculate_complete_collaboration_compatibility(uuid, uuid, jsonb)');
    PERFORM pg_temp.safe_alter_function_search_path('public.calculate_enhanced_collaboration_compatibility(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.calculate_collaboration_compatibility(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.calculate_enhanced_compatibility_with_skills(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.calculate_physical_attribute_match(uuid, jsonb)');
    PERFORM pg_temp.safe_alter_function_search_path('public.calculate_skill_experience_score(uuid, text[])');
    PERFORM pg_temp.safe_alter_function_search_path('public.calculate_profile_completion(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.calculate_profile_completion(public.users_profile)');
    PERFORM pg_temp.safe_alter_function_search_path('public.calculate_age(date)');

    -- LANGUAGE & LOCALIZATION
    PERFORM pg_temp.safe_alter_function_search_path('public.add_user_language(uuid, text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.get_user_languages(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.search_languages(varchar)');

    -- CONVERSATION & PARTICIPANT MANAGEMENT
    PERFORM pg_temp.safe_alter_function_search_path('public.can_access_conversation(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.check_user_connection(uuid, uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.add_equipment_provider_as_participant()');
    PERFORM pg_temp.safe_alter_function_search_path('public.add_invited_user_as_participant()');
    PERFORM pg_temp.safe_alter_function_search_path('public.add_project_creator_as_participant()');

    -- RATE LIMITING EXTENDED
    PERFORM pg_temp.safe_alter_function_search_path('public.check_message_rate_limit(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.check_user_rate_limit(uuid, varchar, integer)');
    PERFORM pg_temp.safe_alter_function_search_path('public.check_duplicate_request(uuid, uuid, text)');

    -- PRESET & FEATURED CONTENT
    PERFORM pg_temp.safe_alter_function_search_path('public.can_submit_generation_as_sample(uuid, text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.approve_featured_preset_request(uuid, uuid, text)');
    PERFORM pg_temp.safe_alter_function_search_path('public.auto_increment_preset_usage_count()');

    -- REFUND & PAYMENT FUNCTIONS
    PERFORM pg_temp.safe_alter_function_search_path('public.check_refund_eligibility(uuid)');
    PERFORM pg_temp.safe_alter_function_search_path('public.auto_refund_trigger()');
    PERFORM pg_temp.safe_alter_function_search_path('public.notify_payment_received()');
    PERFORM pg_temp.safe_alter_function_search_path('public.check_payments_table_exists()');

    -- PROFILE & USER TRIGGERS
    PERFORM pg_temp.safe_alter_function_search_path('public.auto_update_profile_completion()');
    PERFORM pg_temp.safe_alter_function_search_path('public.cleanup_old_profile_photos()');

    -- VIOLATION & ENFORCEMENT
    PERFORM pg_temp.safe_alter_function_search_path('public.apply_progressive_enforcement(uuid, uuid, uuid)');

    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Migration complete! Check the output above for skipped functions.';
    RAISE NOTICE '====================================================================';
END $$;
