

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."application_status" AS ENUM (
    'PENDING',
    'SHORTLISTED',
    'ACCEPTED',
    'DECLINED',
    'WITHDRAWN'
);


ALTER TYPE "public"."application_status" OWNER TO "postgres";


CREATE TYPE "public"."compensation_type" AS ENUM (
    'TFP',
    'PAID',
    'EXPENSES'
);


ALTER TYPE "public"."compensation_type" OWNER TO "postgres";


CREATE TYPE "public"."gig_purpose" AS ENUM (
    'PORTFOLIO',
    'COMMERCIAL',
    'EDITORIAL',
    'FASHION',
    'BEAUTY',
    'LIFESTYLE',
    'WEDDING',
    'EVENT',
    'PRODUCT',
    'ARCHITECTURE',
    'STREET',
    'CONCEPTUAL',
    'OTHER'
);


ALTER TYPE "public"."gig_purpose" OWNER TO "postgres";


CREATE TYPE "public"."gig_status" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'APPLICATIONS_CLOSED',
    'BOOKED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE "public"."gig_status" OWNER TO "postgres";


CREATE TYPE "public"."media_type" AS ENUM (
    'IMAGE',
    'VIDEO',
    'PDF'
);


ALTER TYPE "public"."media_type" OWNER TO "postgres";


CREATE TYPE "public"."message_status" AS ENUM (
    'sent',
    'delivered',
    'read'
);


ALTER TYPE "public"."message_status" OWNER TO "postgres";


CREATE TYPE "public"."showcase_visibility" AS ENUM (
    'DRAFT',
    'PUBLIC',
    'PRIVATE'
);


ALTER TYPE "public"."showcase_visibility" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'ACTIVE',
    'CANCELLED',
    'EXPIRED',
    'TRIAL'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."subscription_tier" AS ENUM (
    'FREE',
    'PLUS',
    'PRO'
);


ALTER TYPE "public"."subscription_tier" OWNER TO "postgres";


CREATE TYPE "public"."usage_rights_type" AS ENUM (
    'PORTFOLIO_ONLY',
    'SOCIAL_MEDIA_PERSONAL',
    'SOCIAL_MEDIA_COMMERCIAL',
    'WEBSITE_PERSONAL',
    'WEBSITE_COMMERCIAL',
    'EDITORIAL_PRINT',
    'COMMERCIAL_PRINT',
    'ADVERTISING',
    'FULL_COMMERCIAL',
    'EXCLUSIVE_BUYOUT',
    'CUSTOM'
);


ALTER TYPE "public"."usage_rights_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'CONTRIBUTOR',
    'TALENT',
    'ADMIN'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."verification_status" AS ENUM (
    'UNVERIFIED',
    'EMAIL_VERIFIED',
    'ID_VERIFIED'
);


ALTER TYPE "public"."verification_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_user_violation"("p_user_id" "uuid", "p_violation_type" "text", "p_severity" "text", "p_description" "text", "p_report_id" "uuid" DEFAULT NULL::"uuid", "p_evidence_urls" "text"[] DEFAULT NULL::"text"[], "p_expires_in_days" integer DEFAULT NULL::integer) RETURNS TABLE("violation_id" "uuid", "should_auto_enforce" boolean, "suggested_action" "text", "total_violations" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_violation_id UUID;
    v_total_violations INTEGER;
    v_expires_at TIMESTAMPTZ;
    v_suggested_action TEXT;
    v_should_enforce BOOLEAN := false;
BEGIN
    -- Calculate expiration
    IF p_expires_in_days IS NOT NULL THEN
        v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
    END IF;
    
    -- Insert violation
    INSERT INTO user_violations (
        user_id,
        violation_type,
        severity,
        description,
        report_id,
        evidence_urls,
        expires_at
    ) VALUES (
        p_user_id,
        p_violation_type,
        p_severity,
        p_description,
        p_report_id,
        p_evidence_urls,
        v_expires_at
    ) RETURNING id INTO v_violation_id;
    
    -- Count total active violations
    SELECT COUNT(*) INTO v_total_violations
    FROM user_violations
    WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Check thresholds for auto-enforcement
    SELECT action_type, auto_apply INTO v_suggested_action, v_should_enforce
    FROM violation_thresholds
    WHERE violation_count <= v_total_violations
    AND severity_threshold <= p_severity
    ORDER BY violation_count DESC
    LIMIT 1;
    
    -- Return results
    violation_id := v_violation_id;
    should_auto_enforce := v_should_enforce;
    suggested_action := v_suggested_action;
    total_violations := v_total_violations;
    
    RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."add_user_violation"("p_user_id" "uuid", "p_violation_type" "text", "p_severity" "text", "p_description" "text", "p_report_id" "uuid", "p_evidence_urls" "text"[], "p_expires_in_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_moderation_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_user_id" "uuid", "p_reason" "text", "p_duration_hours" integer DEFAULT NULL::integer, "p_report_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_action_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Calculate expiration if duration provided
    IF p_duration_hours IS NOT NULL THEN
        v_expires_at := NOW() + (p_duration_hours || ' hours')::INTERVAL;
    END IF;
    
    -- Revoke any existing actions of the same type if this is ban/unban
    IF p_action_type IN ('ban', 'unban') THEN
        UPDATE moderation_actions
        SET revoked_at = NOW(),
            revoked_by = p_admin_id,
            revoke_reason = 'Superseded by new ' || p_action_type
        WHERE target_user_id = p_target_user_id
        AND action_type IN ('ban', 'suspend')
        AND revoked_at IS NULL;
    END IF;
    
    -- Insert new action
    INSERT INTO moderation_actions (
        admin_user_id,
        target_user_id,
        action_type,
        reason,
        duration_hours,
        expires_at,
        report_id
    ) VALUES (
        p_admin_id,
        p_target_user_id,
        p_action_type,
        p_reason,
        p_duration_hours,
        v_expires_at,
        p_report_id
    ) RETURNING id INTO v_action_id;
    
    -- Update user profile flags based on action
    IF p_action_type = 'ban' THEN
        UPDATE users_profile
        SET role_flags = array_append(
            array_remove(role_flags, 'BANNED'),
            'BANNED'
        )
        WHERE user_id = p_target_user_id;
    ELSIF p_action_type = 'unban' THEN
        UPDATE users_profile
        SET role_flags = array_remove(role_flags, 'BANNED')
        WHERE user_id = p_target_user_id;
    ELSIF p_action_type = 'shadowban' THEN
        UPDATE users_profile
        SET role_flags = array_append(
            array_remove(role_flags, 'SHADOWBANNED'),
            'SHADOWBANNED'
        )
        WHERE user_id = p_target_user_id;
    ELSIF p_action_type = 'unshadowban' THEN
        UPDATE users_profile
        SET role_flags = array_remove(role_flags, 'SHADOWBANNED')
        WHERE user_id = p_target_user_id;
    END IF;
    
    RETURN v_action_id;
END;
$$;


ALTER FUNCTION "public"."apply_moderation_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_user_id" "uuid", "p_reason" "text", "p_duration_hours" integer, "p_report_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_progressive_enforcement"("p_user_id" "uuid", "p_admin_id" "uuid", "p_violation_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_violation_count INTEGER;
    v_action_type TEXT;
    v_duration_hours INTEGER;
    v_action_id UUID;
    v_severity TEXT;
BEGIN
    -- Get violation details
    SELECT severity INTO v_severity
    FROM user_violations
    WHERE id = p_violation_id;
    
    -- Count violations
    SELECT COUNT(*) INTO v_violation_count
    FROM user_violations
    WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Determine action based on thresholds
    SELECT action_type INTO v_action_type
    FROM violation_thresholds
    WHERE violation_count <= v_violation_count
    AND severity_threshold <= v_severity
    AND auto_apply = true
    ORDER BY violation_count DESC
    LIMIT 1;
    
    -- Convert action type to duration
    CASE v_action_type
        WHEN 'suspend_24h' THEN v_duration_hours := 24;
        WHEN 'suspend_7d' THEN v_duration_hours := 168;
        WHEN 'suspend_30d' THEN v_duration_hours := 720;
        ELSE v_duration_hours := NULL;
    END CASE;
    
    -- Apply the action if determined
    IF v_action_type IS NOT NULL THEN
        IF v_action_type = 'warning' THEN
            -- Just log the warning
            INSERT INTO moderation_actions (
                admin_user_id,
                target_user_id,
                action_type,
                reason,
                metadata
            ) VALUES (
                p_admin_id,
                p_user_id,
                'warning',
                'Progressive enforcement: Violation #' || v_violation_count,
                jsonb_build_object('violation_id', p_violation_id, 'auto_applied', true)
            ) RETURNING id INTO v_action_id;
        ELSIF v_action_type LIKE 'suspend%' THEN
            -- Apply suspension
            v_action_id := apply_moderation_action(
                p_admin_id,
                'suspend',
                p_user_id,
                'Progressive enforcement: Violation #' || v_violation_count,
                v_duration_hours
            );
        ELSIF v_action_type = 'ban' THEN
            -- Apply ban (requires manual confirmation in our setup)
            v_action_id := NULL; -- Return null to indicate manual review needed
        END IF;
        
        -- Update violation with action reference
        IF v_action_id IS NOT NULL THEN
            UPDATE user_violations
            SET moderation_action_id = v_action_id
            WHERE id = p_violation_id;
        END IF;
    END IF;
    
    RETURN v_action_id;
END;
$$;


ALTER FUNCTION "public"."apply_progressive_enforcement"("p_user_id" "uuid", "p_admin_id" "uuid", "p_violation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_review_notes" "text" DEFAULT NULL::"text", "p_badge_expires_in_days" integer DEFAULT NULL::integer) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID;
    v_verification_type TEXT;
    v_badge_type TEXT;
    v_badge_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Get request details
    SELECT user_id, verification_type INTO v_user_id, v_verification_type
    FROM verification_requests
    WHERE id = p_request_id
    AND status = 'pending';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Verification request not found or not pending';
    END IF;
    
    -- Determine badge type
    v_badge_type := 'verified_' || v_verification_type;
    
    -- Calculate expiration
    IF p_badge_expires_in_days IS NOT NULL THEN
        v_expires_at := NOW() + (p_badge_expires_in_days || ' days')::INTERVAL;
    END IF;
    
    -- Update request status
    UPDATE verification_requests
    SET status = 'approved',
        reviewed_by = p_reviewer_id,
        review_notes = p_review_notes,
        reviewed_at = NOW()
    WHERE id = p_request_id;
    
    -- Revoke any existing badge of the same type
    UPDATE verification_badges
    SET revoked_at = NOW(),
        revoked_by = p_reviewer_id,
        revoke_reason = 'Superseded by new verification'
    WHERE user_id = v_user_id
    AND badge_type = v_badge_type
    AND is_active = true;
    
    -- Issue new badge
    INSERT INTO verification_badges (
        user_id,
        badge_type,
        verification_request_id,
        issued_by,
        expires_at
    ) VALUES (
        v_user_id,
        v_badge_type,
        p_request_id,
        p_reviewer_id,
        v_expires_at
    ) RETURNING id INTO v_badge_id;
    
    -- Update user profile with verification flag
    IF v_verification_type = 'identity' THEN
        UPDATE users_profile
        SET role_flags = array_append(
            array_remove(role_flags, 'VERIFIED_ID'),
            'VERIFIED_ID'
        )
        WHERE user_id = v_user_id;
    ELSIF v_verification_type = 'professional' THEN
        UPDATE users_profile
        SET role_flags = array_append(
            array_remove(role_flags, 'VERIFIED_PRO'),
            'VERIFIED_PRO'
        )
        WHERE user_id = v_user_id;
    END IF;
    
    RETURN v_badge_id;
END;
$$;


ALTER FUNCTION "public"."approve_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_review_notes" "text", "p_badge_expires_in_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_escalate_report_priority"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    report_count INTEGER;
    recent_report_count INTEGER;
BEGIN
    -- Count total reports for this content/user
    IF NEW.reported_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO report_count
        FROM reports
        WHERE reported_user_id = NEW.reported_user_id
        AND status != 'dismissed';
        
        -- Count reports in last 24 hours
        SELECT COUNT(*) INTO recent_report_count
        FROM reports
        WHERE reported_user_id = NEW.reported_user_id
        AND created_at > NOW() - INTERVAL '24 hours'
        AND status != 'dismissed';
    ELSIF NEW.reported_content_id IS NOT NULL THEN
        SELECT COUNT(*) INTO report_count
        FROM reports
        WHERE reported_content_id = NEW.reported_content_id
        AND content_type = NEW.content_type
        AND status != 'dismissed';
        
        SELECT COUNT(*) INTO recent_report_count
        FROM reports
        WHERE reported_content_id = NEW.reported_content_id
        AND content_type = NEW.content_type
        AND created_at > NOW() - INTERVAL '24 hours'
        AND status != 'dismissed';
    END IF;
    
    -- Auto-escalate priority based on report frequency
    IF recent_report_count >= 5 OR report_count >= 10 THEN
        NEW.priority = 'critical';
    ELSIF recent_report_count >= 3 OR report_count >= 5 THEN
        NEW.priority = 'high';
    ELSIF report_count >= 2 THEN
        NEW.priority = 'medium';
    END IF;
    
    -- Safety and underage reports are always high priority
    IF NEW.reason IN ('underage', 'safety') THEN
        NEW.priority = 'critical';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_escalate_report_priority"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_user_risk_score"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    risk_score INTEGER := 0;
    recent_reports INTEGER;
    total_reports INTEGER;
    resolved_violations INTEGER;
BEGIN
    -- Recent reports (last 30 days)
    SELECT COUNT(*) INTO recent_reports
    FROM reports
    WHERE reported_user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days'
    AND status != 'dismissed';
    
    -- Total reports
    SELECT COUNT(*) INTO total_reports
    FROM reports
    WHERE reported_user_id = p_user_id
    AND status != 'dismissed';
    
    -- Resolved violations
    SELECT COUNT(*) INTO resolved_violations
    FROM reports
    WHERE reported_user_id = p_user_id
    AND status = 'resolved'
    AND resolution_action != 'dismissed';
    
    -- Calculate risk score (0-100)
    risk_score := LEAST(100, 
        (recent_reports * 20) + 
        (total_reports * 5) + 
        (resolved_violations * 15)
    );
    
    RETURN risk_score;
END;
$$;


ALTER FUNCTION "public"."calculate_user_risk_score"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_users_communicate"("user1_id" "uuid", "user2_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if either user has blocked the other
    RETURN NOT EXISTS (
        SELECT 1 FROM user_blocks 
        WHERE (blocker_user_id = user1_id AND blocked_user_id = user2_id)
           OR (blocker_user_id = user2_id AND blocked_user_id = user1_id)
    );
END;
$$;


ALTER FUNCTION "public"."can_users_communicate"("user1_id" "uuid", "user2_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_users_communicate"("user1_id" "uuid", "user2_id" "uuid") IS 'Checks if two users can communicate (not blocked)';



CREATE OR REPLACE FUNCTION "public"."check_content_moderation"("p_content_id" "uuid", "p_content_type" "text", "p_content_text" "text", "p_user_id" "uuid") RETURNS TABLE("should_flag" boolean, "flagged_reasons" "text"[], "severity_score" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_reasons TEXT[] := ARRAY[]::TEXT[];
    v_score INTEGER := 0;
    v_should_flag BOOLEAN := FALSE;
    v_word TEXT;
    v_inappropriate_words TEXT[] := ARRAY[
        'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap',
        'nude', 'naked', 'sex', 'porn', 'xxx', 'nsfw', 'adult',
        'hate', 'nazi', 'racist', 'sexist', 'homophobic', 'transphobic',
        'buy now', 'click here', 'free money', 'get rich', 'promotion',
        'follow me', 'like for like', 'sub4sub', 'follow4follow',
        'illegal', 'drugs', 'violence', 'weapon', 'blood', 'gore'
    ];
    v_spam_patterns TEXT[] := ARRAY[
        'visit my profile', 'check out my', 'dm me', 'message me',
        'whatsapp', 'instagram', 'telegram', 'snapchat', 'onlyfans'
    ];
BEGIN
    -- Check for inappropriate words
    FOREACH v_word IN ARRAY v_inappropriate_words
    LOOP
        IF LOWER(p_content_text) ~ ('\\m' || v_word || '\\M') THEN
            v_reasons := array_append(v_reasons, 'inappropriate_language');
            v_score := v_score + 20;
            v_should_flag := TRUE;
            EXIT; -- Only add reason once
        END IF;
    END LOOP;
    
    -- Check for spam patterns
    FOREACH v_word IN ARRAY v_spam_patterns
    LOOP
        IF LOWER(p_content_text) ~ v_word THEN
            v_reasons := array_append(v_reasons, 'potential_spam');
            v_score := v_score + 15;
            v_should_flag := TRUE;
            EXIT;
        END IF;
    END LOOP;
    
    -- Check for excessive caps (>50% of text)
    IF LENGTH(p_content_text) > 10 AND 
       (LENGTH(REGEXP_REPLACE(p_content_text, '[^A-Z]', '', 'g'))::FLOAT / LENGTH(p_content_text)::FLOAT) > 0.5 THEN
        v_reasons := array_append(v_reasons, 'excessive_caps');
        v_score := v_score + 10;
        v_should_flag := TRUE;
    END IF;
    
    -- Check for repeated characters (more than 4 in a row)
    IF p_content_text ~ '(.)\1{4,}' THEN
        v_reasons := array_append(v_reasons, 'spam_pattern');
        v_score := v_score + 10;
        v_should_flag := TRUE;
    END IF;
    
    -- Check for URL patterns (basic detection)
    IF p_content_text ~ '(https?://|www\.|\.com|\.org|\.net)' THEN
        v_reasons := array_append(v_reasons, 'external_links');
        v_score := v_score + 25;
        v_should_flag := TRUE;
    END IF;
    
    -- Cap the severity score
    v_score := LEAST(v_score, 100);
    
    RETURN QUERY SELECT v_should_flag, v_reasons, v_score;
END;
$$;


ALTER FUNCTION "public"."check_content_moderation"("p_content_id" "uuid", "p_content_type" "text", "p_content_text" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_resource_type" character varying, "p_subscription_tier" "public"."subscription_tier") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_limit_config RECORD;
    v_window_start TIMESTAMPTZ;
    v_current_usage INTEGER;
BEGIN
    -- Get rate limit configuration for this resource and subscription tier
    SELECT time_window_minutes, max_actions 
    INTO v_limit_config
    FROM rate_limits
    WHERE resource_type = p_resource_type 
    AND subscription_tier = p_subscription_tier;
    
    -- If no limit configured, allow action
    IF v_limit_config IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Calculate time window start
    v_window_start := date_trunc('minute', NOW()) - 
                     (EXTRACT(minute FROM NOW())::INTEGER % v_limit_config.time_window_minutes) * INTERVAL '1 minute';
    
    -- Get current usage in this time window
    SELECT COALESCE(action_count, 0)
    INTO v_current_usage
    FROM rate_limit_usage
    WHERE user_id = p_user_id
    AND resource_type = p_resource_type
    AND time_window_start = v_window_start;
    
    -- Check if under limit
    IF v_current_usage < v_limit_config.max_actions THEN
        -- Update usage count
        INSERT INTO rate_limit_usage (user_id, resource_type, time_window_start, action_count)
        VALUES (p_user_id, p_resource_type, v_window_start, 1)
        ON CONFLICT (user_id, resource_type, time_window_start)
        DO UPDATE SET action_count = rate_limit_usage.action_count + 1;
        
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;


ALTER FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_resource_type" character varying, "p_subscription_tier" "public"."subscription_tier") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_resource_type" character varying, "p_subscription_tier" "public"."subscription_tier") IS 'Enforces rate limits based on subscription tier';



CREATE OR REPLACE FUNCTION "public"."check_user_connection"("sender_user_id" "uuid", "recipient_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if they've worked together on completed gigs
  -- Case 1: One applied to the other's gig and was accepted
  RETURN EXISTS (
    SELECT 1 
    FROM applications a1
    JOIN gigs g ON a1.gig_id = g.id
    JOIN users_profile up ON g.owner_user_id = up.id
    WHERE a1.applicant_user_id = sender_user_id
    AND up.user_id = recipient_user_id
    AND a1.status = 'ACCEPTED'
    AND g.status = 'COMPLETED'
  ) OR EXISTS (
    SELECT 1 
    FROM applications a2
    JOIN gigs g ON a2.gig_id = g.id
    JOIN users_profile up ON g.owner_user_id = up.id
    WHERE a2.applicant_user_id = recipient_user_id
    AND up.user_id = sender_user_id
    AND a2.status = 'ACCEPTED'
    AND g.status = 'COMPLETED'
  ) OR EXISTS (
    -- Case 2: They both worked on the same gig (both were accepted)
    SELECT 1 
    FROM applications a1
    JOIN applications a2 ON a1.gig_id = a2.gig_id
    WHERE a1.applicant_user_id = sender_user_id
    AND a2.applicant_user_id = recipient_user_id
    AND a1.status = 'ACCEPTED'
    AND a2.status = 'ACCEPTED'
    AND a1.gig_id IN (
      SELECT id FROM gigs WHERE status = 'COMPLETED'
    )
  ) OR EXISTS (
    -- Case 3: They have mutual showcases together
    SELECT 1 
    FROM showcases s
    WHERE (s.creator_user_id = sender_user_id AND s.talent_user_id = recipient_user_id)
    OR (s.creator_user_id = recipient_user_id AND s.talent_user_id = sender_user_id)
    AND s.visibility = 'PUBLIC'
  );
END;
$$;


ALTER FUNCTION "public"."check_user_connection"("sender_user_id" "uuid", "recipient_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_user_connection"("sender_user_id" "uuid", "recipient_user_id" "uuid") IS 'Checks if two users have worked together through completed gigs or showcases';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_domain_events"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM domain_events
  WHERE occurred_at < NOW() - INTERVAL '90 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_domain_events"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_notifications"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND (read_at IS NOT NULL OR dismissed_at IS NOT NULL);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_rate_limit_usage"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limit_usage 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_rate_limit_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_typing_indicators"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM typing_indicators 
    WHERE last_activity < NOW() - INTERVAL '10 seconds';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_typing_indicators"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consume_platform_credits"("p_provider" character varying, "p_credits" integer, "p_cost" numeric) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update platform pool
  UPDATE credit_pools
  SET 
    total_consumed = total_consumed + p_credits,
    available_balance = available_balance - p_credits,
    updated_at = NOW()
  WHERE provider = p_provider AND status = 'active';
  
  -- Check if pool is now low
  IF (SELECT available_balance FROM credit_pools WHERE provider = p_provider) <= 
     (SELECT auto_refill_threshold FROM credit_pools WHERE provider = p_provider) THEN
    -- Log alert for low credits
    INSERT INTO system_alerts (type, level, message)
    VALUES ('low_platform_credits', 'warning', 
            'Platform credits low for ' || p_provider || '. Auto-refill may be triggered.');
  END IF;
END;
$$;


ALTER FUNCTION "public"."consume_platform_credits"("p_provider" character varying, "p_credits" integer, "p_cost" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) RETURNS TABLE("remaining_balance" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT current_balance INTO current_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  -- Check if user has enough credits
  IF current_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient credits. Available: %, Required: %', current_balance, p_credits;
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - p_credits;
  
  -- Update user credits
  UPDATE user_credits
  SET 
    current_balance = new_balance,
    consumed_this_month = consumed_this_month + p_credits,
    lifetime_consumed = lifetime_consumed + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_used,
    enhancement_type,
    status
  ) VALUES (
    p_user_id,
    'deduction',
    p_credits,
    p_enhancement_type,
    'completed'
  );
  
  -- Return remaining balance
  RETURN QUERY SELECT new_balance;
END;
$$;


ALTER FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_notification_preferences"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_notification_preferences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_user_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_user_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_old_violations"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Violations automatically expire via the GENERATED column
    -- This function can be used for any additional cleanup
    
    -- Log expiration events if needed
    INSERT INTO moderation_actions (
        admin_user_id,
        target_user_id,
        action_type,
        reason,
        metadata
    )
    SELECT 
        '00000000-0000-0000-0000-000000000000'::UUID, -- System user
        user_id,
        'warning',
        'Violations expired',
        jsonb_build_object(
            'expired_count', COUNT(*),
            'auto_generated', true
        )
    FROM user_violations
    WHERE expires_at <= NOW()
    AND expires_at > NOW() - INTERVAL '1 hour'
    GROUP BY user_id;
END;
$$;


ALTER FUNCTION "public"."expire_old_violations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_suspensions"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE moderation_actions
    SET revoked_at = NOW(),
        revoke_reason = 'Suspension period expired'
    WHERE action_type = 'suspend'
    AND expires_at IS NOT NULL
    AND expires_at <= NOW()
    AND revoked_at IS NULL;
END;
$$;


ALTER FUNCTION "public"."expire_suspensions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_verifications"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Expire verification requests older than 30 days
    UPDATE verification_requests
    SET status = 'expired'
    WHERE status = 'pending'
    AND submitted_at < NOW() - INTERVAL '30 days';
    
    -- Remove verification flags from users with expired badges
    UPDATE users_profile up
    SET role_flags = array_remove(array_remove(role_flags, 'VERIFIED_ID'), 'VERIFIED_PRO')
    WHERE EXISTS (
        SELECT 1 FROM verification_badges vb
        WHERE vb.user_id = up.user_id
        AND vb.expires_at <= NOW()
        AND vb.revoked_at IS NULL
    );
END;
$$;


ALTER FUNCTION "public"."expire_verifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Create deterministic conversation ID based on gig and sorted participant UUIDs
  -- This ensures the same conversation ID regardless of message direction
  RETURN uuid_generate_v5(
    gig_uuid,
    CASE 
      WHEN user1_uuid < user2_uuid THEN user1_uuid::text || user2_uuid::text
      ELSE user2_uuid::text || user1_uuid::text
    END
  );
END;
$$;


ALTER FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_average_resolution_time"() RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN (
        SELECT COALESCE(
            AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600), 
            0
        )
        FROM content_moderation_queue 
        WHERE resolved_at IS NOT NULL 
        AND created_at IS NOT NULL
    );
END;
$$;


ALTER FUNCTION "public"."get_average_resolution_time"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_average_severity"() RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN (
        SELECT COALESCE(AVG(severity_score), 0)
        FROM content_moderation_queue 
        WHERE severity_score IS NOT NULL
    );
END;
$$;


ALTER FUNCTION "public"."get_average_severity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_conversation_summary"("p_gig_id" "uuid", "p_user1_id" "uuid", "p_user2_id" "uuid") RETURNS TABLE("total_messages" bigint, "last_message_at" timestamp with time zone, "unread_count_user1" bigint, "unread_count_user2" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_messages,
        MAX(created_at) as last_message_at,
        COUNT(*) FILTER (WHERE to_user_id = p_user1_id AND read_at IS NULL) as unread_count_user1,
        COUNT(*) FILTER (WHERE to_user_id = p_user2_id AND read_at IS NULL) as unread_count_user2
    FROM messages
    WHERE gig_id = p_gig_id
    AND ((from_user_id = p_user1_id AND to_user_id = p_user2_id)
         OR (from_user_id = p_user2_id AND to_user_id = p_user1_id));
END;
$$;


ALTER FUNCTION "public"."get_conversation_summary"("p_gig_id" "uuid", "p_user1_id" "uuid", "p_user2_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_saved_count"("gig_id_param" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM saved_gigs
    WHERE gig_id = gig_id_param
  );
END;
$$;


ALTER FUNCTION "public"."get_saved_count"("gig_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_violation_flags"() RETURNS TABLE("flag" "text", "count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(flagged_reason) as flag,
        COUNT(*)::BIGINT as count
    FROM content_moderation_queue 
    WHERE flagged_reason IS NOT NULL 
    GROUP BY unnest(flagged_reason)
    ORDER BY count DESC
    LIMIT 10;
END;
$$;


ALTER FUNCTION "public"."get_top_violation_flags"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_conversations"("p_user_id" "uuid", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("gig_id" "uuid", "other_user_id" "uuid", "last_message_id" "uuid", "last_message_content" "text", "last_message_at" timestamp with time zone, "unread_count" bigint, "other_user_blocked" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH conversation_summary AS (
        SELECT 
            m.gig_id,
            CASE 
                WHEN m.from_user_id = p_user_id THEN m.to_user_id
                ELSE m.from_user_id
            END as other_user_id,
            m.id as message_id,
            m.body,
            m.created_at,
            ROW_NUMBER() OVER (
                PARTITION BY m.gig_id, 
                CASE 
                    WHEN m.from_user_id = p_user_id THEN m.to_user_id
                    ELSE m.from_user_id
                END
                ORDER BY m.created_at DESC
            ) as rn
        FROM messages m
        WHERE m.from_user_id = p_user_id OR m.to_user_id = p_user_id
    ),
    unread_counts AS (
        SELECT 
            gig_id,
            CASE 
                WHEN from_user_id = p_user_id THEN to_user_id
                ELSE from_user_id
            END as other_user_id,
            COUNT(*) as unread_count
        FROM messages
        WHERE to_user_id = p_user_id 
        AND read_at IS NULL
        GROUP BY gig_id, CASE WHEN from_user_id = p_user_id THEN to_user_id ELSE from_user_id END
    ),
    blocking_status AS (
        SELECT 
            blocked_user_id,
            TRUE as is_blocked
        FROM user_blocks
        WHERE blocker_user_id = p_user_id
    )
    SELECT 
        cs.gig_id,
        cs.other_user_id,
        cs.message_id as last_message_id,
        cs.body as last_message_content,
        cs.created_at as last_message_at,
        COALESCE(uc.unread_count, 0) as unread_count,
        COALESCE(bs.is_blocked, FALSE) as other_user_blocked
    FROM conversation_summary cs
    LEFT JOIN unread_counts uc ON cs.gig_id = uc.gig_id AND cs.other_user_id = uc.other_user_id
    LEFT JOIN blocking_status bs ON cs.other_user_id = bs.blocked_user_id
    WHERE cs.rn = 1
    ORDER BY cs.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_user_conversations"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) IS 'Efficiently retrieves user conversation list with metadata';



CREATE OR REPLACE FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") RETURNS TABLE("has_verified_identity" boolean, "has_verified_professional" boolean, "has_verified_business" boolean, "identity_expires_at" timestamp with time zone, "professional_expires_at" timestamp with time zone, "business_expires_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS (
            SELECT 1 FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_identity'
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
        ) as has_verified_identity,
        EXISTS (
            SELECT 1 FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_professional'
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
        ) as has_verified_professional,
        EXISTS (
            SELECT 1 FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_business'
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
        ) as has_verified_business,
        (
            SELECT expires_at FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_identity'
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
            LIMIT 1
        ) as identity_expires_at,
        (
            SELECT expires_at FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_professional'
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
            LIMIT 1
        ) as professional_expires_at,
        (
            SELECT expires_at FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_business'
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
            LIMIT 1
        ) as business_expires_at;
END;
$$;


ALTER FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_violation_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    violation_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO violation_count
    FROM reports
    WHERE reported_user_id = p_user_id
    AND status = 'resolved'
    AND resolution_action IN ('warning', 'content_removed', 'user_suspended', 'user_banned');
    
    RETURN violation_count;
END;
$$;


ALTER FUNCTION "public"."get_user_violation_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_violation_summary"("p_user_id" "uuid") RETURNS TABLE("total_violations" integer, "active_violations" integer, "minor_count" integer, "moderate_count" integer, "severe_count" integer, "critical_count" integer, "last_violation_date" timestamp with time zone, "risk_level" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_risk_level TEXT;
    v_total INTEGER;
    v_severe_critical INTEGER;
BEGIN
    -- Get counts
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE expires_at IS NULL OR expires_at > NOW()) as active,
        COUNT(*) FILTER (WHERE severity = 'minor') as minor,
        COUNT(*) FILTER (WHERE severity = 'moderate') as moderate,
        COUNT(*) FILTER (WHERE severity = 'severe') as severe,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical,
        MAX(created_at) as last_violation
    INTO 
        v_total,
        active_violations,
        minor_count,
        moderate_count,
        severe_count,
        critical_count,
        last_violation_date
    FROM user_violations
    WHERE user_id = p_user_id;
    
    total_violations := v_total;
    
    -- Calculate risk level
    v_severe_critical := severe_count + critical_count;
    
    IF v_severe_critical > 0 OR v_total >= 10 THEN
        v_risk_level := 'high';
    ELSIF moderate_count > 2 OR v_total >= 5 THEN
        v_risk_level := 'medium';
    ELSIF v_total > 0 THEN
        v_risk_level := 'low';
    ELSE
        v_risk_level := 'none';
    END IF;
    
    risk_level := v_risk_level;
    
    RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."get_user_violation_summary"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_user_credits"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
  BEGIN
      INSERT INTO user_credits (
          user_id,
          subscription_tier,
          monthly_allowance,
          current_balance,
          consumed_this_month,
          last_reset_at
      )
      SELECT
          NEW.user_id,
          COALESCE(NEW.subscription_tier,
  'FREE'),
          CASE
              WHEN NEW.subscription_tier =
   'PRO' THEN 25
              WHEN NEW.subscription_tier =
   'PLUS' THEN 10
              ELSE 0
          END,
          CASE
              WHEN NEW.subscription_tier =
   'PRO' THEN 25
              WHEN NEW.subscription_tier =
   'PLUS' THEN 10
              ELSE 0
          END,
          0,
          NOW()
      WHERE NOT EXISTS (
          SELECT 1 FROM user_credits WHERE
   user_id = NEW.user_id
      );
      RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."initialize_user_credits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_gig_saved_by_user"("gig_id_param" "uuid", "user_id_param" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM saved_gigs
    WHERE gig_id = gig_id_param
    AND user_id = user_id_param
  );
END;
$$;


ALTER FUNCTION "public"."is_gig_saved_by_user"("gig_id_param" "uuid", "user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_suspended_or_banned"("p_user_id" "uuid") RETURNS TABLE("is_suspended" boolean, "is_banned" boolean, "suspension_expires_at" timestamp with time zone, "ban_reason" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS (
            SELECT 1 FROM moderation_actions
            WHERE target_user_id = p_user_id
            AND action_type = 'suspend'
            AND (expires_at IS NULL OR expires_at > NOW())
            AND revoked_at IS NULL
        ) as is_suspended,
        EXISTS (
            SELECT 1 FROM moderation_actions
            WHERE target_user_id = p_user_id
            AND action_type = 'ban'
            AND revoked_at IS NULL
        ) as is_banned,
        (
            SELECT expires_at FROM moderation_actions
            WHERE target_user_id = p_user_id
            AND action_type = 'suspend'
            AND (expires_at IS NULL OR expires_at > NOW())
            AND revoked_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        ) as suspension_expires_at,
        (
            SELECT reason FROM moderation_actions
            WHERE target_user_id = p_user_id
            AND action_type = 'ban'
            AND revoked_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        ) as ban_reason;
END;
$$;


ALTER FUNCTION "public"."is_user_suspended_or_banned"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_conversation_delivered"("conversation_uuid" "uuid", "user_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE messages 
    SET status = 'delivered'
    WHERE conversation_id = conversation_uuid 
    AND to_user_id = user_uuid
    AND status = 'sent';
END;
$$;


ALTER FUNCTION "public"."mark_conversation_delivered"("conversation_uuid" "uuid", "user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."queue_for_moderation"("p_content_id" "uuid", "p_content_type" "text", "p_content_text" "text", "p_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_queue_id UUID;
    v_moderation_check RECORD;
BEGIN
    -- Check if content should be flagged
    SELECT * FROM check_content_moderation(p_content_id, p_content_type, p_content_text, p_user_id)
    INTO v_moderation_check;
    
    -- Only queue if flagged
    IF v_moderation_check.should_flag THEN
        INSERT INTO moderation_queue (
            content_id,
            content_type,
            content_text,
            user_id,
            flagged_reason,
            severity_score
        ) VALUES (
            p_content_id,
            p_content_type,
            p_content_text,
            p_user_id,
            v_moderation_check.flagged_reasons,
            v_moderation_check.severity_score
        ) RETURNING id INTO v_queue_id;
    END IF;
    
    RETURN v_queue_id;
END;
$$;


ALTER FUNCTION "public"."queue_for_moderation"("p_content_id" "uuid", "p_content_type" "text", "p_content_text" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_rejection_reason" "text", "p_review_notes" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE verification_requests
    SET status = 'rejected',
        reviewed_by = p_reviewer_id,
        rejection_reason = p_rejection_reason,
        review_notes = p_review_notes,
        reviewed_at = NOW()
    WHERE id = p_request_id
    AND status IN ('pending', 'reviewing');
END;
$$;


ALTER FUNCTION "public"."reject_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_rejection_reason" "text", "p_review_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_monthly_credits"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
  BEGIN
      UPDATE user_credits
      SET
          current_balance =
  monthly_allowance,
          consumed_this_month = 0,
          last_reset_at = NOW(),
          updated_at = NOW()
      WHERE
          last_reset_at <
  date_trunc('month', NOW())
          AND monthly_allowance > 0;
  END;
  $$;


ALTER FUNCTION "public"."reset_monthly_credits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_gig_notification_preferences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."update_gig_notification_preferences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_message_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If read_at is being set and status is not already 'read', update to 'read'
    IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
        NEW.status = 'read';
    END IF;
    
    -- Update updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_message_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reports_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reports_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."user_credits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "subscription_tier" character varying(20) NOT NULL,
    "monthly_allowance" integer DEFAULT 0,
    "current_balance" integer DEFAULT 0,
    "consumed_this_month" integer DEFAULT 0,
    "last_reset_at" timestamp with time zone DEFAULT "date_trunc"('month'::"text", "now"()),
    "lifetime_consumed" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_credits" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text" DEFAULT NULL::"text", "p_reference_id" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "public"."user_credits"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_user_credits user_credits;
BEGIN
    -- Get current balance (with lock)
    SELECT balance INTO v_current_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- If no record exists, create one
    IF v_current_balance IS NULL THEN
        INSERT INTO user_credits (user_id, balance, lifetime_earned, lifetime_consumed)
        VALUES (p_user_id, 0, 0, 0)
        RETURNING balance INTO v_current_balance;
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_current_balance + p_amount;
    
    -- Check for negative balance
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient credits. Current balance: %, Requested: %', v_current_balance, ABS(p_amount);
    END IF;
    
    -- Update user_credits
    UPDATE user_credits
    SET 
        balance = v_new_balance,
        lifetime_earned = CASE 
            WHEN p_type IN ('purchase', 'refund', 'bonus') 
            THEN lifetime_earned + p_amount 
            ELSE lifetime_earned 
        END,
        lifetime_consumed = CASE 
            WHEN p_type = 'consume' 
            THEN lifetime_consumed + ABS(p_amount) 
            ELSE lifetime_consumed 
        END,
        last_purchase_at = CASE 
            WHEN p_type = 'purchase' 
            THEN now() 
            ELSE last_purchase_at 
        END,
        last_consumed_at = CASE 
            WHEN p_type = 'consume' 
            THEN now() 
            ELSE last_consumed_at 
        END,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_user_credits;
    
    -- Log transaction
    INSERT INTO credit_transactions (
        user_id, 
        type, 
        amount, 
        balance_before, 
        balance_after, 
        description, 
        reference_id, 
        metadata
    ) VALUES (
        p_user_id,
        p_type,
        p_amount,
        v_current_balance,
        v_new_balance,
        p_description,
        p_reference_id,
        p_metadata
    );
    
    RETURN v_user_credits;
END;
$$;


ALTER FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_verification_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_verification_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_message_permission"("sender_user_id" "uuid", "recipient_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  recipient_settings RECORD;
  are_connected BOOLEAN;
BEGIN
  -- Get recipient's messaging settings
  SELECT allow_stranger_messages 
  INTO recipient_settings
  FROM user_settings 
  WHERE user_id = recipient_user_id;
  
  -- If no settings found, default to allowing strangers
  IF recipient_settings IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If recipient allows stranger messages, allow it
  IF recipient_settings.allow_stranger_messages THEN
    RETURN TRUE;
  END IF;
  
  -- Check if they have a connection
  SELECT check_user_connection(sender_user_id, recipient_user_id) INTO are_connected;
  
  -- Allow if they have a connection
  RETURN are_connected;
END;
$$;


ALTER FUNCTION "public"."validate_message_permission"("sender_user_id" "uuid", "recipient_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_message_permission"("sender_user_id" "uuid", "recipient_user_id" "uuid") IS 'Validates if a user can send a message to another user based on stranger message settings';



CREATE TABLE IF NOT EXISTS "public"."moderation_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "target_user_id" "uuid",
    "target_content_id" "uuid",
    "content_type" "text",
    "action_type" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "duration_hours" integer,
    "expires_at" timestamp with time zone,
    "report_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "revoke_reason" "text",
    CONSTRAINT "moderation_actions_action_type_check" CHECK (("action_type" = ANY (ARRAY['warning'::"text", 'suspend'::"text", 'ban'::"text", 'unban'::"text", 'content_remove'::"text", 'shadowban'::"text", 'unshadowban'::"text", 'verify'::"text", 'unverify'::"text"]))),
    CONSTRAINT "moderation_actions_content_type_check" CHECK (("content_type" = ANY (ARRAY['user'::"text", 'gig'::"text", 'showcase'::"text", 'message'::"text", 'image'::"text", 'moodboard'::"text"]))),
    CONSTRAINT "valid_target" CHECK ((("target_user_id" IS NOT NULL) OR ("target_content_id" IS NOT NULL)))
);


ALTER TABLE "public"."moderation_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_user_id" "uuid" NOT NULL,
    "reported_user_id" "uuid",
    "reported_content_id" "uuid",
    "content_type" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "resolved_by" "uuid",
    "resolution_notes" "text",
    "resolution_action" "text",
    "evidence_urls" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    CONSTRAINT "reports_content_type_check" CHECK (("content_type" = ANY (ARRAY['user'::"text", 'gig'::"text", 'showcase'::"text", 'message'::"text", 'image'::"text", 'moodboard'::"text"]))),
    CONSTRAINT "reports_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "reports_reason_check" CHECK (("reason" = ANY (ARRAY['spam'::"text", 'inappropriate'::"text", 'harassment'::"text", 'scam'::"text", 'copyright'::"text", 'other'::"text", 'underage'::"text", 'safety'::"text"]))),
    CONSTRAINT "reports_resolution_action_check" CHECK (("resolution_action" = ANY (ARRAY['warning'::"text", 'content_removed'::"text", 'user_suspended'::"text", 'user_banned'::"text", 'dismissed'::"text", 'no_action'::"text"]))),
    CONSTRAINT "reports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text", 'resolved'::"text", 'dismissed'::"text"]))),
    CONSTRAINT "valid_content_reference" CHECK (((("content_type" = 'user'::"text") AND ("reported_user_id" IS NOT NULL)) OR (("content_type" <> 'user'::"text") AND ("reported_content_id" IS NOT NULL))))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users_profile" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" character varying(255) NOT NULL,
    "handle" character varying(50) NOT NULL,
    "avatar_url" "text",
    "bio" "text",
    "city" character varying(255),
    "role_flags" "public"."user_role"[] DEFAULT '{}'::"public"."user_role"[],
    "style_tags" "text"[] DEFAULT '{}'::"text"[],
    "subscription_tier" "public"."subscription_tier" DEFAULT 'FREE'::"public"."subscription_tier",
    "subscription_status" "public"."subscription_status" DEFAULT 'ACTIVE'::"public"."subscription_status",
    "subscription_started_at" timestamp with time zone DEFAULT "now"(),
    "subscription_expires_at" timestamp with time zone,
    "verified_id" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "date_of_birth" "date",
    "vibe_tags" "text"[] DEFAULT '{}'::"text"[],
    "header_banner_url" "text",
    "header_banner_position" "text" DEFAULT '{"y":0,"scale":1}'::"text",
    CONSTRAINT "handle_format" CHECK ((("handle")::"text" ~ '^[a-z0-9_]+$'::"text"))
);


ALTER TABLE "public"."users_profile" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users_profile"."date_of_birth" IS 'User date of birth for age verification and compliance';



COMMENT ON COLUMN "public"."users_profile"."vibe_tags" IS 'Array of vibe tags selected by the user';



COMMENT ON COLUMN "public"."users_profile"."header_banner_url" IS 'URL of the user''s custom header banner image';



COMMENT ON COLUMN "public"."users_profile"."header_banner_position" IS 'JSON string containing y position (pixels) and scale (1.0 = normal) for header banner positioning';



CREATE OR REPLACE VIEW "public"."admin_moderation_audit" AS
 SELECT "ma"."id",
    "ma"."admin_user_id",
    "ma"."target_user_id",
    "ma"."target_content_id",
    "ma"."content_type",
    "ma"."action_type",
    "ma"."reason",
    "ma"."duration_hours",
    "ma"."expires_at",
    "ma"."report_id",
    "ma"."metadata",
    "ma"."created_at",
    "ma"."revoked_at",
    "ma"."revoked_by",
    "ma"."revoke_reason",
    "admin"."display_name" AS "admin_name",
    "admin"."handle" AS "admin_handle",
    "target"."display_name" AS "target_name",
    "target"."handle" AS "target_handle",
    "revoker"."display_name" AS "revoker_name",
    "r"."reason" AS "report_reason",
    "r"."content_type" AS "reported_content_type"
   FROM (((("public"."moderation_actions" "ma"
     LEFT JOIN "public"."users_profile" "admin" ON (("ma"."admin_user_id" = "admin"."user_id")))
     LEFT JOIN "public"."users_profile" "target" ON (("ma"."target_user_id" = "target"."user_id")))
     LEFT JOIN "public"."users_profile" "revoker" ON (("ma"."revoked_by" = "revoker"."user_id")))
     LEFT JOIN "public"."reports" "r" ON (("ma"."report_id" = "r"."id")))
  ORDER BY "ma"."created_at" DESC;


ALTER VIEW "public"."admin_moderation_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moderation_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "content_text" "text",
    "user_id" "uuid" NOT NULL,
    "flagged_reason" "text"[] DEFAULT ARRAY[]::"text"[],
    "severity_score" integer DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text",
    "reviewer_id" "uuid",
    "auto_flagged_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "resolution_notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "moderation_queue_content_type_check" CHECK (("content_type" = ANY (ARRAY['message'::"text", 'gig'::"text", 'showcase'::"text", 'profile'::"text", 'image'::"text"]))),
    CONSTRAINT "moderation_queue_severity_score_check" CHECK ((("severity_score" >= 0) AND ("severity_score" <= 100))),
    CONSTRAINT "moderation_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text", 'approved'::"text", 'rejected'::"text", 'escalated'::"text"])))
);


ALTER TABLE "public"."moderation_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."moderation_queue" IS 'Queue for content that needs manual moderation review';



CREATE OR REPLACE VIEW "public"."admin_moderation_dashboard" AS
 SELECT "mq"."id",
    "mq"."content_id",
    "mq"."content_type",
    "mq"."content_text",
    "mq"."user_id",
    "mq"."flagged_reason",
    "mq"."severity_score",
    "mq"."status",
    "mq"."reviewer_id",
    "mq"."auto_flagged_at",
    "mq"."reviewed_at",
    "mq"."resolution_notes",
    "mq"."metadata",
    "mq"."created_at",
    "mq"."updated_at",
    "up"."display_name" AS "user_name",
    "up"."handle" AS "user_handle",
    "reviewer"."display_name" AS "reviewer_name"
   FROM (("public"."moderation_queue" "mq"
     LEFT JOIN "public"."users_profile" "up" ON (("mq"."user_id" = "up"."user_id")))
     LEFT JOIN "public"."users_profile" "reviewer" ON (("mq"."reviewer_id" = "reviewer"."user_id")))
  ORDER BY
        CASE "mq"."status"
            WHEN 'pending'::"text" THEN 1
            WHEN 'reviewing'::"text" THEN 2
            WHEN 'escalated'::"text" THEN 3
            ELSE 4
        END, "mq"."severity_score" DESC, "mq"."created_at" DESC;


ALTER VIEW "public"."admin_moderation_dashboard" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_reports_dashboard" AS
 SELECT "r"."id",
    "r"."reporter_user_id",
    "r"."reported_user_id",
    "r"."reported_content_id",
    "r"."content_type",
    "r"."reason",
    "r"."description",
    "r"."status",
    "r"."priority",
    "r"."resolved_by",
    "r"."resolution_notes",
    "r"."resolution_action",
    "r"."evidence_urls",
    "r"."created_at",
    "r"."updated_at",
    "r"."resolved_at",
    "reporter"."display_name" AS "reporter_name",
    "reporter"."handle" AS "reporter_handle",
    "reported"."display_name" AS "reported_name",
    "reported"."handle" AS "reported_handle",
    "resolver"."display_name" AS "resolver_name",
    "public"."get_user_violation_count"("r"."reported_user_id") AS "reported_user_violations",
    "public"."calculate_user_risk_score"("r"."reported_user_id") AS "reported_user_risk_score"
   FROM ((("public"."reports" "r"
     LEFT JOIN "public"."users_profile" "reporter" ON (("r"."reporter_user_id" = "reporter"."user_id")))
     LEFT JOIN "public"."users_profile" "reported" ON (("r"."reported_user_id" = "reported"."user_id")))
     LEFT JOIN "public"."users_profile" "resolver" ON (("r"."resolved_by" = "resolver"."user_id")));


ALTER VIEW "public"."admin_reports_dashboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verification_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_type" "text" NOT NULL,
    "verification_request_id" "uuid",
    "issued_by" "uuid" NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "revoke_reason" "text",
    CONSTRAINT "verification_badges_badge_type_check" CHECK (("badge_type" = ANY (ARRAY['verified_identity'::"text", 'verified_professional'::"text", 'verified_business'::"text"])))
);


ALTER TABLE "public"."verification_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verification_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "verification_type" "text" NOT NULL,
    "document_urls" "text"[] NOT NULL,
    "document_types" "text"[] NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "reviewed_by" "uuid",
    "review_notes" "text",
    "rejection_reason" "text",
    "additional_info_request" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "document_arrays_match" CHECK (("array_length"("document_urls", 1) = "array_length"("document_types", 1))),
    CONSTRAINT "verification_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text", 'approved'::"text", 'rejected'::"text", 'expired'::"text", 'additional_info_required'::"text"]))),
    CONSTRAINT "verification_requests_verification_type_check" CHECK (("verification_type" = ANY (ARRAY['identity'::"text", 'professional'::"text", 'business'::"text"])))
);


ALTER TABLE "public"."verification_requests" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_verification_dashboard" AS
 SELECT "vr"."id",
    "vr"."user_id",
    "vr"."verification_type",
    "vr"."document_urls",
    "vr"."document_types",
    "vr"."status",
    "vr"."reviewed_by",
    "vr"."review_notes",
    "vr"."rejection_reason",
    "vr"."additional_info_request",
    "vr"."metadata",
    "vr"."submitted_at",
    "vr"."reviewed_at",
    "vr"."expires_at",
    "vr"."created_at",
    "vr"."updated_at",
    "u"."display_name" AS "user_name",
    "u"."handle" AS "user_handle",
    "au"."email" AS "user_email",
    "reviewer"."display_name" AS "reviewer_name",
    ( SELECT "count"(*) AS "count"
           FROM "public"."verification_badges"
          WHERE (("verification_badges"."user_id" = "vr"."user_id") AND ("verification_badges"."revoked_at" IS NULL) AND (("verification_badges"."expires_at" IS NULL) OR ("verification_badges"."expires_at" > "now"())))) AS "active_badges_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."verification_requests"
          WHERE (("verification_requests"."user_id" = "vr"."user_id") AND ("verification_requests"."status" = 'rejected'::"text"))) AS "previous_rejections"
   FROM ((("public"."verification_requests" "vr"
     LEFT JOIN "public"."users_profile" "u" ON (("vr"."user_id" = "u"."user_id")))
     LEFT JOIN "auth"."users" "au" ON (("vr"."user_id" = "au"."id")))
     LEFT JOIN "public"."users_profile" "reviewer" ON (("vr"."reviewed_by" = "reviewer"."user_id")))
  ORDER BY
        CASE
            WHEN ("vr"."status" = 'pending'::"text") THEN 1
            WHEN ("vr"."status" = 'reviewing'::"text") THEN 2
            ELSE 3
        END, "vr"."submitted_at" DESC;


ALTER VIEW "public"."admin_verification_dashboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_violations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "violation_type" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "report_id" "uuid",
    "moderation_action_id" "uuid",
    "description" "text" NOT NULL,
    "evidence_urls" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    CONSTRAINT "user_violations_severity_check" CHECK (("severity" = ANY (ARRAY['minor'::"text", 'moderate'::"text", 'severe'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."user_violations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_violation_stats" AS
 SELECT "count"(*) AS "total_violations",
    "count"(DISTINCT "user_id") AS "unique_violators",
    "count"(*) FILTER (WHERE ("severity" = 'minor'::"text")) AS "minor_violations",
    "count"(*) FILTER (WHERE ("severity" = 'moderate'::"text")) AS "moderate_violations",
    "count"(*) FILTER (WHERE ("severity" = 'severe'::"text")) AS "severe_violations",
    "count"(*) FILTER (WHERE ("severity" = 'critical'::"text")) AS "critical_violations",
    "count"(*) FILTER (WHERE (("expires_at" IS NULL) OR ("expires_at" > "now"()))) AS "active_violations",
    "count"(*) FILTER (WHERE ("created_at" > ("now"() - '24:00:00'::interval))) AS "violations_24h",
    "count"(*) FILTER (WHERE ("created_at" > ("now"() - '7 days'::interval))) AS "violations_7d",
    "count"(*) FILTER (WHERE ("created_at" > ("now"() - '30 days'::interval))) AS "violations_30d"
   FROM "public"."user_violations";


ALTER VIEW "public"."admin_violation_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_violations_dashboard" AS
 SELECT "uv"."id",
    "uv"."user_id",
    "uv"."violation_type",
    "uv"."severity",
    "uv"."report_id",
    "uv"."moderation_action_id",
    "uv"."description",
    "uv"."evidence_urls",
    "uv"."created_at",
    "uv"."expires_at",
    "u"."display_name" AS "user_name",
    "u"."handle" AS "user_handle",
    "r"."reason" AS "report_reason",
    "r"."content_type" AS "reported_content_type",
    "ma"."action_type" AS "enforcement_action",
    "ma"."expires_at" AS "enforcement_expires",
    ( SELECT "count"(*) AS "count"
           FROM "public"."user_violations"
          WHERE (("user_violations"."user_id" = "uv"."user_id") AND (("user_violations"."expires_at" IS NULL) OR ("user_violations"."expires_at" > "now"())))) AS "active_violation_count",
    "vs"."total_violations",
    "vs"."minor_count",
    "vs"."moderate_count",
    "vs"."severe_count",
    "vs"."critical_count",
    "vs"."risk_level"
   FROM (((("public"."user_violations" "uv"
     LEFT JOIN "public"."users_profile" "u" ON (("uv"."user_id" = "u"."user_id")))
     LEFT JOIN "public"."reports" "r" ON (("uv"."report_id" = "r"."id")))
     LEFT JOIN "public"."moderation_actions" "ma" ON (("uv"."moderation_action_id" = "ma"."id")))
     LEFT JOIN LATERAL "public"."get_user_violation_summary"("uv"."user_id") "vs"("total_violations", "active_violations", "minor_count", "moderate_count", "severe_count", "critical_count", "last_violation_date", "risk_level") ON (true))
  ORDER BY "uv"."created_at" DESC;


ALTER VIEW "public"."admin_violations_dashboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "base_url" "text" NOT NULL,
    "api_key_encrypted" "text" NOT NULL,
    "cost_per_request" numeric(8,4) NOT NULL,
    "rate_limit_per_minute" integer DEFAULT 60,
    "priority" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "health_check_url" "text",
    "last_health_check" timestamp with time zone,
    "success_rate_24h" numeric(5,2) DEFAULT 100.00,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "applicant_user_id" "uuid" NOT NULL,
    "note" "text",
    "status" "public"."application_status" DEFAULT 'PENDING'::"public"."application_status",
    "applied_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkout_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_session_id" character varying(255) NOT NULL,
    "package_id" character varying(50),
    "credits" integer NOT NULL,
    "amount_usd" numeric(10,2) NOT NULL,
    "status" character varying(50) DEFAULT 'created'::character varying NOT NULL,
    "expires_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."checkout_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_moderation_queue" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "content_type" character varying(50) NOT NULL,
    "content_text" "text",
    "user_id" "uuid" NOT NULL,
    "flagged_reason" "text"[] DEFAULT '{}'::"text"[],
    "severity_score" integer DEFAULT 0,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "resolved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "admin_notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "content_moderation_queue_severity_score_check" CHECK ((("severity_score" >= 0) AND ("severity_score" <= 100))),
    CONSTRAINT "content_moderation_queue_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'reviewing'::character varying, 'approved'::character varying, 'rejected'::character varying, 'escalated'::character varying])::"text"[])))
);


ALTER TABLE "public"."content_moderation_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "alert_type" character varying(50) NOT NULL,
    "threshold_value" numeric(10,4),
    "notification_channels" "text"[],
    "is_active" boolean DEFAULT true,
    "last_triggered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."credit_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_packages" (
    "id" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "credits" integer NOT NULL,
    "price_usd" numeric(10,2) NOT NULL,
    "stripe_price_id" character varying(255),
    "is_active" boolean DEFAULT true,
    "is_popular" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."credit_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_pools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" character varying(50) NOT NULL,
    "total_purchased" numeric(12,4) DEFAULT 0,
    "total_consumed" numeric(12,4) DEFAULT 0,
    "available_balance" numeric(12,4) DEFAULT 0,
    "cost_per_credit" numeric(8,4) NOT NULL,
    "last_refill_at" timestamp with time zone,
    "auto_refill_threshold" numeric(12,4) DEFAULT 100,
    "auto_refill_amount" numeric(12,4) DEFAULT 500,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."credit_pools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_purchase_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" character varying(50) NOT NULL,
    "amount_requested" numeric(12,4) NOT NULL,
    "estimated_cost" numeric(10,4) NOT NULL,
    "status" character varying(20) DEFAULT 'pending_manual_approval'::character varying,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "transaction_id" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."credit_purchase_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "moodboard_id" "uuid",
    "transaction_type" character varying(20) NOT NULL,
    "credits_used" integer NOT NULL,
    "cost_usd" numeric(8,4),
    "provider" character varying(50),
    "api_request_id" character varying(100),
    "enhancement_type" character varying(50),
    "status" character varying(20) DEFAULT 'completed'::character varying,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_usage_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "total_requests" integer DEFAULT 0,
    "successful_requests" integer DEFAULT 0,
    "failed_requests" integer DEFAULT 0,
    "total_credits_consumed" integer DEFAULT 0,
    "total_cost_usd" numeric(10,4) DEFAULT 0,
    "free_tier_usage" integer DEFAULT 0,
    "plus_tier_usage" integer DEFAULT 0,
    "pro_tier_usage" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_usage_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."domain_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "aggregate_id" character varying(255) NOT NULL,
    "event_type" character varying(100) NOT NULL,
    "payload" "jsonb" NOT NULL,
    "metadata" "jsonb",
    "occurred_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."domain_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gig_notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "location_radius" integer DEFAULT 25 NOT NULL,
    "min_budget" integer,
    "max_budget" integer,
    "preferred_purposes" "text"[] DEFAULT '{}'::"text"[],
    "preferred_vibes" "text"[] DEFAULT '{}'::"text"[],
    "preferred_styles" "text"[] DEFAULT '{}'::"text"[],
    "notify_on_match" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_budget_range" CHECK ((("min_budget" IS NULL) OR ("max_budget" IS NULL) OR ("min_budget" <= "max_budget"))),
    CONSTRAINT "gig_notification_preferences_location_radius_check" CHECK ((("location_radius" >= 5) AND ("location_radius" <= 100))),
    CONSTRAINT "gig_notification_preferences_max_budget_check" CHECK (("max_budget" >= 0)),
    CONSTRAINT "gig_notification_preferences_min_budget_check" CHECK (("min_budget" >= 0))
);


ALTER TABLE "public"."gig_notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gigs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "comp_type" "public"."compensation_type" NOT NULL,
    "comp_details" "text",
    "location_text" character varying(255) NOT NULL,
    "location" "public"."geography"(Point,4326),
    "radius_meters" integer,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "application_deadline" timestamp with time zone NOT NULL,
    "max_applicants" integer DEFAULT 20 NOT NULL,
    "usage_rights" "text" NOT NULL,
    "safety_notes" "text",
    "status" "public"."gig_status" DEFAULT 'DRAFT'::"public"."gig_status",
    "boost_level" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "purpose" "text",
    "style_tags" "text"[] DEFAULT '{}'::"text"[],
    "vibe_tags" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "valid_boost" CHECK (("boost_level" >= 0)),
    CONSTRAINT "valid_deadline" CHECK (("application_deadline" <= "start_time")),
    CONSTRAINT "valid_time_range" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."gigs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."gigs"."purpose" IS 'The purpose/category of the photography shoot';



COMMENT ON COLUMN "public"."gigs"."style_tags" IS 'Array of style tags for this gig (e.g., portrait, fashion, editorial)';



COMMENT ON COLUMN "public"."gigs"."vibe_tags" IS 'Array of vibe tags for this gig (e.g., moody, bright, ethereal)';



CREATE TABLE IF NOT EXISTS "public"."lootbox_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" character varying(50) NOT NULL,
    "nano_banana_threshold" integer DEFAULT 10000 NOT NULL,
    "nano_banana_credits_at_trigger" integer NOT NULL,
    "user_credits_offered" integer DEFAULT 2000 NOT NULL,
    "price_usd" numeric(10,2) NOT NULL,
    "margin_percentage" numeric(5,2) NOT NULL,
    "available_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "purchased_at" timestamp with time zone,
    "purchased_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lootbox_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lootbox_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "user_credits" integer NOT NULL,
    "price_usd" numeric(10,2) NOT NULL,
    "nano_banana_threshold" integer DEFAULT 10000 NOT NULL,
    "margin_percentage" numeric(5,2) DEFAULT 35.0 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lootbox_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "gig_id" "uuid",
    "type" "public"."media_type" NOT NULL,
    "bucket" character varying(255) NOT NULL,
    "path" "text" NOT NULL,
    "width" integer,
    "height" integer,
    "duration" integer,
    "palette" "jsonb",
    "blurhash" character varying(255),
    "exif_json" "jsonb",
    "visibility" "public"."showcase_visibility" DEFAULT 'PRIVATE'::"public"."showcase_visibility",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "from_user_id" "uuid" NOT NULL,
    "to_user_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    "conversation_id" "uuid" NOT NULL,
    "status" "public"."message_status" DEFAULT 'sent'::"public"."message_status"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."messaging_performance_stats" AS
 SELECT "schemaname",
    "relname" AS "tablename",
    "indexrelname" AS "indexname",
    "idx_scan" AS "num_scans",
    "idx_tup_read" AS "tup_read",
    "idx_tup_fetch" AS "tup_fetch"
   FROM "pg_stat_user_indexes"
  WHERE ("relname" = ANY (ARRAY['messages'::"name", 'user_blocks'::"name", 'reports'::"name", 'moderation_queue'::"name", 'rate_limit_usage'::"name", 'typing_indicators'::"name"]))
  ORDER BY "idx_scan" DESC;


ALTER VIEW "public"."messaging_performance_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moodboard_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moodboard_id" "uuid",
    "source" character varying(20) NOT NULL,
    "url" "text" NOT NULL,
    "thumbnail_url" "text",
    "attribution" "text",
    "width" integer,
    "height" integer,
    "palette" "text"[] DEFAULT '{}'::"text"[],
    "blurhash" character varying(50),
    "enhancement_prompt" "text",
    "original_image_id" "uuid",
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "moodboard_items_source_check" CHECK ((("source")::"text" = ANY ((ARRAY['pexels'::character varying, 'user-upload'::character varying, 'ai-enhanced'::character varying, 'ai-generated'::character varying])::"text"[])))
);


ALTER TABLE "public"."moodboard_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moodboards" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "title" character varying(255),
    "summary" "text",
    "palette" "jsonb",
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_public" boolean DEFAULT false,
    "source_breakdown" "jsonb" DEFAULT '{"pexels": 0, "ai_enhanced": 0, "ai_generated": 0, "user_uploads": 0}'::"jsonb",
    "enhancement_log" "jsonb" DEFAULT '[]'::"jsonb",
    "total_cost" numeric(10,4) DEFAULT 0,
    "generated_prompts" "text"[] DEFAULT '{}'::"text"[],
    "ai_provider" character varying(50),
    "vibe_summary" "text",
    "mood_descriptors" "text"[] DEFAULT '{}'::"text"[],
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "ai_analysis_status" character varying(50) DEFAULT 'pending'::character varying,
    "ai_analyzed_at" timestamp with time zone
);


ALTER TABLE "public"."moodboards" OWNER TO "postgres";


COMMENT ON COLUMN "public"."moodboards"."mood_descriptors" IS 'AI-generated mood descriptors like ethereal, bold, minimalist';



COMMENT ON COLUMN "public"."moodboards"."tags" IS 'Searchable tags for moodboard discovery';



COMMENT ON COLUMN "public"."moodboards"."ai_analysis_status" IS 'Status of AI analysis: pending, completed, failed';



COMMENT ON COLUMN "public"."moodboards"."ai_analyzed_at" IS 'Timestamp when AI analysis was performed';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "type" character varying(50) NOT NULL,
    "category" character varying(20) NOT NULL,
    "title" character varying(255) NOT NULL,
    "message" "text",
    "avatar_url" "text",
    "thumbnail_url" "text",
    "action_url" "text",
    "action_data" "jsonb",
    "sender_id" "uuid",
    "related_gig_id" "uuid",
    "related_application_id" "uuid",
    "read_at" timestamp with time zone,
    "dismissed_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "delivered_push" boolean DEFAULT false,
    "delivered_email" boolean DEFAULT false,
    "delivered_in_app" boolean DEFAULT false,
    "scheduled_for" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Core notifications table storing all platform notifications with rich content support and delivery tracking';



COMMENT ON COLUMN "public"."notifications"."type" IS 'Specific notification type (e.g., gig_published, application_received, talent_booked)';



COMMENT ON COLUMN "public"."notifications"."category" IS 'Broad notification category for filtering (gig, application, message, system)';



COMMENT ON COLUMN "public"."notifications"."action_data" IS 'Flexible JSON data for notification actions and context';



COMMENT ON COLUMN "public"."notifications"."scheduled_for" IS 'When the notification should be delivered (enables scheduled notifications)';



CREATE OR REPLACE VIEW "public"."notification_delivery_stats" AS
 SELECT "date_trunc"('day'::"text", "created_at") AS "date",
    "category",
    "count"(*) AS "total_sent",
    "count"(*) FILTER (WHERE ("delivered_in_app" = true)) AS "delivered_in_app",
    "count"(*) FILTER (WHERE ("delivered_email" = true)) AS "delivered_email",
    "count"(*) FILTER (WHERE ("delivered_push" = true)) AS "delivered_push",
    "count"(*) FILTER (WHERE ("read_at" IS NOT NULL)) AS "read_count",
    "avg"((EXTRACT(epoch FROM ("read_at" - "created_at")) / (60)::numeric)) FILTER (WHERE ("read_at" IS NOT NULL)) AS "avg_time_to_read_minutes"
   FROM "public"."notifications"
  WHERE ("created_at" >= ("now"() - '30 days'::interval))
  GROUP BY ("date_trunc"('day'::"text", "created_at")), "category"
  ORDER BY ("date_trunc"('day'::"text", "created_at")) DESC, "category";


ALTER VIEW "public"."notification_delivery_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_enabled" boolean DEFAULT true,
    "push_enabled" boolean DEFAULT true,
    "in_app_enabled" boolean DEFAULT true,
    "gig_notifications" boolean DEFAULT true,
    "application_notifications" boolean DEFAULT true,
    "message_notifications" boolean DEFAULT true,
    "booking_notifications" boolean DEFAULT true,
    "system_notifications" boolean DEFAULT true,
    "marketing_notifications" boolean DEFAULT false,
    "digest_frequency" character varying(20) DEFAULT 'real-time'::character varying,
    "quiet_hours_start" time without time zone,
    "quiet_hours_end" time without time zone,
    "timezone" character varying(50) DEFAULT 'UTC'::character varying,
    "badge_count_enabled" boolean DEFAULT true,
    "sound_enabled" boolean DEFAULT true,
    "vibration_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_preferences" IS 'User-specific notification preferences for multi-channel delivery control';



COMMENT ON COLUMN "public"."notification_preferences"."digest_frequency" IS 'How often to send digest emails: real-time, hourly, daily, weekly';



COMMENT ON COLUMN "public"."notification_preferences"."quiet_hours_start" IS 'Time to stop sending push notifications (local time)';



COMMENT ON COLUMN "public"."notification_preferences"."quiet_hours_end" IS 'Time to resume sending push notifications (local time)';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "handle" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "avatar_url" "text",
    "bio" "text",
    "city" character varying(100),
    "style_tags" "text"[] DEFAULT '{}'::"text"[],
    "showcase_ids" "text"[] DEFAULT '{}'::"text"[],
    "website_url" "text",
    "instagram_handle" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "handle_format" CHECK ((("handle")::"text" ~ '^[a-z0-9_]{3,50}$'::"text"))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles with display information and preferences';



COMMENT ON COLUMN "public"."profiles"."handle" IS 'Unique username for profile URL (lowercase, alphanumeric, underscore)';



COMMENT ON COLUMN "public"."profiles"."style_tags" IS 'Array of style/aesthetic tags for matching';



COMMENT ON COLUMN "public"."profiles"."showcase_ids" IS 'Array of showcase IDs linked to this profile';



CREATE TABLE IF NOT EXISTS "public"."rate_limit_usage" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "resource_type" character varying(50) NOT NULL,
    "time_window_start" timestamp with time zone NOT NULL,
    "action_count" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_limit_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."rate_limit_usage" IS 'Tracks API usage per user per time window for rate limiting';



CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "resource_type" character varying(50) NOT NULL,
    "subscription_tier" "public"."subscription_tier" NOT NULL,
    "time_window_minutes" integer NOT NULL,
    "max_actions" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "reviewer_user_id" "uuid" NOT NULL,
    "reviewed_user_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_gigs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "saved_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_gigs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."showcases" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "creator_user_id" "uuid" NOT NULL,
    "talent_user_id" "uuid" NOT NULL,
    "media_ids" "uuid"[] NOT NULL,
    "caption" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "palette" "jsonb",
    "approved_by_creator_at" timestamp with time zone,
    "approved_by_talent_at" timestamp with time zone,
    "visibility" "public"."showcase_visibility" DEFAULT 'DRAFT'::"public"."showcase_visibility",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "media_count" CHECK ((("array_length"("media_ids", 1) >= 3) AND ("array_length"("media_ids", 1) <= 6)))
);


ALTER TABLE "public"."showcases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(20) NOT NULL,
    "display_name" character varying(50) NOT NULL,
    "max_moodboards_per_day" integer DEFAULT 3 NOT NULL,
    "max_user_uploads" integer DEFAULT 0 NOT NULL,
    "max_ai_enhancements" integer DEFAULT 0 NOT NULL,
    "ai_cost_per_enhancement" numeric(10,4) DEFAULT 0.025,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" character varying(255),
    "stripe_subscription_id" character varying(255),
    "tier" "public"."subscription_tier" NOT NULL,
    "status" "public"."subscription_status" NOT NULL,
    "started_at" timestamp with time zone NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" character varying(50) NOT NULL,
    "level" character varying(20) NOT NULL,
    "message" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."typing_indicators" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "is_typing" boolean DEFAULT false,
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."typing_indicators" OWNER TO "postgres";


COMMENT ON TABLE "public"."typing_indicators" IS 'Real-time typing status for conversations';



CREATE TABLE IF NOT EXISTS "public"."usage_rights_options" (
    "id" integer NOT NULL,
    "value" "public"."usage_rights_type" NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."usage_rights_options" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."usage_rights_options_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."usage_rights_options_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."usage_rights_options_id_seq" OWNED BY "public"."usage_rights_options"."id";



CREATE TABLE IF NOT EXISTS "public"."user_blocks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "blocker_user_id" "uuid" NOT NULL,
    "blocked_user_id" "uuid" NOT NULL,
    "reason" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_blocks_check" CHECK (("blocker_user_id" <> "blocked_user_id"))
);


ALTER TABLE "public"."user_blocks" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_blocks" IS 'User blocking system - prevents communication between blocked users';



CREATE TABLE IF NOT EXISTS "public"."user_credit_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "package_id" character varying(50),
    "credits_purchased" integer NOT NULL,
    "amount_paid_usd" numeric(10,2) NOT NULL,
    "payment_method" character varying(50) DEFAULT 'stripe'::character varying,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "stripe_session_id" character varying(255),
    "stripe_customer_id" character varying(255),
    "error_message" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_credit_purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "marketing_emails" boolean DEFAULT false,
    "profile_visibility" character varying(20) DEFAULT 'public'::character varying,
    "show_contact_info" boolean DEFAULT true,
    "two_factor_enabled" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "message_notifications" boolean DEFAULT true,
    "message_read_receipts" boolean DEFAULT true,
    "allow_stranger_messages" boolean DEFAULT true,
    CONSTRAINT "user_settings_profile_visibility_check" CHECK ((("profile_visibility")::"text" = ANY ((ARRAY['public'::character varying, 'private'::character varying, 'connections'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_settings"."message_notifications" IS 'Whether user wants to receive notifications for new messages';



COMMENT ON COLUMN "public"."user_settings"."message_read_receipts" IS 'Whether user wants to show read receipts to others';



COMMENT ON COLUMN "public"."user_settings"."allow_stranger_messages" IS 'Whether user allows messages from users they havent worked with';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "role" "public"."user_role" DEFAULT 'TALENT'::"public"."user_role" NOT NULL,
    "subscription_tier" "public"."subscription_tier" DEFAULT 'FREE'::"public"."subscription_tier" NOT NULL,
    "subscription_expires_at" timestamp with time zone,
    "stripe_customer_id" character varying(255),
    "stripe_subscription_id" character varying(255),
    "verification_status" "public"."verification_status" DEFAULT 'UNVERIFIED'::"public"."verification_status" NOT NULL,
    "email_verified_at" timestamp with time zone,
    "id_verified_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Core user table extending Supabase auth with subscription and verification';



COMMENT ON COLUMN "public"."users"."subscription_tier" IS 'User subscription level: FREE, PLUS, or PRO';



COMMENT ON COLUMN "public"."users"."verification_status" IS 'User verification level for trust and safety';



CREATE TABLE IF NOT EXISTS "public"."vibes_master" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(30) NOT NULL,
    "color_hex" character varying(7),
    "emoji" character varying(10),
    "is_active" boolean DEFAULT true,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vibes_master" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."violation_thresholds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "violation_count" integer NOT NULL,
    "action_type" "text" NOT NULL,
    "severity_threshold" "text" NOT NULL,
    "auto_apply" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "violation_thresholds_action_type_check" CHECK (("action_type" = ANY (ARRAY['warning'::"text", 'suspend_24h'::"text", 'suspend_7d'::"text", 'suspend_30d'::"text", 'ban'::"text"]))),
    CONSTRAINT "violation_thresholds_severity_threshold_check" CHECK (("severity_threshold" = ANY (ARRAY['minor'::"text", 'moderate'::"text", 'severe'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."violation_thresholds" OWNER TO "postgres";


ALTER TABLE ONLY "public"."usage_rights_options" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."usage_rights_options_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."api_providers"
    ADD CONSTRAINT "api_providers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."api_providers"
    ADD CONSTRAINT "api_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_gig_id_applicant_user_id_key" UNIQUE ("gig_id", "applicant_user_id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_stripe_session_id_key" UNIQUE ("stripe_session_id");



ALTER TABLE ONLY "public"."content_moderation_queue"
    ADD CONSTRAINT "content_moderation_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_alerts"
    ADD CONSTRAINT "credit_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_packages"
    ADD CONSTRAINT "credit_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_pools"
    ADD CONSTRAINT "credit_pools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_pools"
    ADD CONSTRAINT "credit_pools_provider_key" UNIQUE ("provider");



ALTER TABLE ONLY "public"."credit_purchase_requests"
    ADD CONSTRAINT "credit_purchase_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_usage_summary"
    ADD CONSTRAINT "daily_usage_summary_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."daily_usage_summary"
    ADD CONSTRAINT "daily_usage_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domain_events"
    ADD CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gig_notification_preferences"
    ADD CONSTRAINT "gig_notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gig_notification_preferences"
    ADD CONSTRAINT "gig_notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."gigs"
    ADD CONSTRAINT "gigs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lootbox_events"
    ADD CONSTRAINT "lootbox_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lootbox_packages"
    ADD CONSTRAINT "lootbox_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderation_actions"
    ADD CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderation_queue"
    ADD CONSTRAINT "moderation_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moodboard_items"
    ADD CONSTRAINT "moodboard_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moodboards"
    ADD CONSTRAINT "moodboards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_handle_key" UNIQUE ("handle");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limit_usage"
    ADD CONSTRAINT "rate_limit_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limit_usage"
    ADD CONSTRAINT "rate_limit_usage_user_id_resource_type_time_window_start_key" UNIQUE ("user_id", "resource_type", "time_window_start");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_resource_type_subscription_tier_key" UNIQUE ("resource_type", "subscription_tier");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_gig_id_reviewer_user_id_reviewed_user_id_key" UNIQUE ("gig_id", "reviewer_user_id", "reviewed_user_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_gigs"
    ADD CONSTRAINT "saved_gigs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_gigs"
    ADD CONSTRAINT "saved_gigs_user_id_gig_id_key" UNIQUE ("user_id", "gig_id");



ALTER TABLE ONLY "public"."showcases"
    ADD CONSTRAINT "showcases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_tiers"
    ADD CONSTRAINT "subscription_tiers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."subscription_tiers"
    ADD CONSTRAINT "subscription_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."system_alerts"
    ADD CONSTRAINT "system_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_conversation_id_user_id_key" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_rights_options"
    ADD CONSTRAINT "usage_rights_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_rights_options"
    ADD CONSTRAINT "usage_rights_options_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_blocker_user_id_blocked_user_id_key" UNIQUE ("blocker_user_id", "blocked_user_id");



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credit_purchases"
    ADD CONSTRAINT "user_credit_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_violations"
    ADD CONSTRAINT "user_violations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users_profile"
    ADD CONSTRAINT "users_profile_handle_key" UNIQUE ("handle");



ALTER TABLE ONLY "public"."users_profile"
    ADD CONSTRAINT "users_profile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification_badges"
    ADD CONSTRAINT "verification_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification_requests"
    ADD CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vibes_master"
    ADD CONSTRAINT "vibes_master_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."vibes_master"
    ADD CONSTRAINT "vibes_master_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."violation_thresholds"
    ADD CONSTRAINT "violation_thresholds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."violation_thresholds"
    ADD CONSTRAINT "violation_thresholds_violation_count_key" UNIQUE ("violation_count");



CREATE INDEX "idx_api_providers_name" ON "public"."api_providers" USING "btree" ("name");



CREATE INDEX "idx_applications_applicant" ON "public"."applications" USING "btree" ("applicant_user_id");



CREATE INDEX "idx_applications_gig" ON "public"."applications" USING "btree" ("gig_id");



CREATE INDEX "idx_applications_user_gig_status" ON "public"."applications" USING "btree" ("applicant_user_id", "gig_id", "status") WHERE ("status" = 'ACCEPTED'::"public"."application_status");



CREATE INDEX "idx_checkout_sessions_stripe_session_id" ON "public"."checkout_sessions" USING "btree" ("stripe_session_id");



CREATE INDEX "idx_checkout_sessions_user_id" ON "public"."checkout_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_credit_pools_provider" ON "public"."credit_pools" USING "btree" ("provider");



CREATE INDEX "idx_credit_transactions_created_at" ON "public"."credit_transactions" USING "btree" ("created_at");



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_daily_usage_date" ON "public"."daily_usage_summary" USING "btree" ("date");



CREATE INDEX "idx_domain_events_aggregate_id" ON "public"."domain_events" USING "btree" ("aggregate_id");



CREATE INDEX "idx_domain_events_event_type" ON "public"."domain_events" USING "btree" ("event_type");



CREATE INDEX "idx_domain_events_occurred_at" ON "public"."domain_events" USING "btree" ("occurred_at");



CREATE INDEX "idx_gig_notification_preferences_notify_on_match" ON "public"."gig_notification_preferences" USING "btree" ("notify_on_match") WHERE ("notify_on_match" = true);



CREATE INDEX "idx_gig_notification_preferences_user_id" ON "public"."gig_notification_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_gigs_dates" ON "public"."gigs" USING "btree" ("start_time", "end_time");



CREATE INDEX "idx_gigs_location" ON "public"."gigs" USING "gist" ("location");



CREATE INDEX "idx_gigs_owner" ON "public"."gigs" USING "btree" ("owner_user_id");



CREATE INDEX "idx_gigs_owner_status" ON "public"."gigs" USING "btree" ("owner_user_id", "status") WHERE ("status" = 'COMPLETED'::"public"."gig_status");



CREATE INDEX "idx_gigs_status" ON "public"."gigs" USING "btree" ("status");



CREATE INDEX "idx_gigs_style_tags" ON "public"."gigs" USING "gin" ("style_tags");



CREATE INDEX "idx_gigs_vibe_tags" ON "public"."gigs" USING "gin" ("vibe_tags");



CREATE INDEX "idx_lootbox_events_available" ON "public"."lootbox_events" USING "btree" ("event_type", "available_at") WHERE ((("event_type")::"text" = 'available'::"text") AND ("expires_at" IS NULL));



CREATE INDEX "idx_lootbox_packages_active" ON "public"."lootbox_packages" USING "btree" ("is_active", "nano_banana_threshold");



CREATE INDEX "idx_media_owner" ON "public"."media" USING "btree" ("owner_user_id");



CREATE INDEX "idx_messages_conversation_created_at" ON "public"."messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_gig" ON "public"."messages" USING "btree" ("gig_id");



CREATE INDEX "idx_messages_gig_created" ON "public"."messages" USING "btree" ("gig_id", "created_at" DESC);



CREATE INDEX "idx_messages_gig_participants_created" ON "public"."messages" USING "btree" ("gig_id", "from_user_id", "to_user_id", "created_at" DESC);



CREATE INDEX "idx_messages_gig_participants_reverse_created" ON "public"."messages" USING "btree" ("gig_id", "to_user_id", "from_user_id", "created_at" DESC);



CREATE INDEX "idx_messages_recipient_unread" ON "public"."messages" USING "btree" ("to_user_id", "read_at", "created_at" DESC) WHERE ("read_at" IS NULL);



CREATE INDEX "idx_messages_sender_created" ON "public"."messages" USING "btree" ("from_user_id", "created_at" DESC);



CREATE INDEX "idx_messages_status" ON "public"."messages" USING "btree" ("status");



CREATE INDEX "idx_messages_users" ON "public"."messages" USING "btree" ("from_user_id", "to_user_id");



CREATE INDEX "idx_moderation_actions_admin" ON "public"."moderation_actions" USING "btree" ("admin_user_id");



CREATE INDEX "idx_moderation_actions_created" ON "public"."moderation_actions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_moderation_actions_expires" ON "public"."moderation_actions" USING "btree" ("expires_at") WHERE (("expires_at" IS NOT NULL) AND ("revoked_at" IS NULL));



CREATE INDEX "idx_moderation_actions_report" ON "public"."moderation_actions" USING "btree" ("report_id") WHERE ("report_id" IS NOT NULL);



CREATE INDEX "idx_moderation_actions_target_user" ON "public"."moderation_actions" USING "btree" ("target_user_id") WHERE ("target_user_id" IS NOT NULL);



CREATE INDEX "idx_moderation_actions_type" ON "public"."moderation_actions" USING "btree" ("action_type");



CREATE INDEX "idx_moderation_queue_content" ON "public"."moderation_queue" USING "btree" ("content_type", "content_id") WHERE ("content_type" = 'message'::"text");



CREATE INDEX "idx_moderation_queue_priority_status" ON "public"."moderation_queue" USING "btree" ("severity_score" DESC, "status", "created_at" DESC) WHERE ("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text"]));



CREATE INDEX "idx_moderation_queue_user_created" ON "public"."moderation_queue" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_moodboard_items_moodboard_id" ON "public"."moodboard_items" USING "btree" ("moodboard_id");



CREATE INDEX "idx_moodboard_items_position" ON "public"."moodboard_items" USING "btree" ("moodboard_id", "position");



CREATE INDEX "idx_moodboards_mood" ON "public"."moodboards" USING "gin" ("mood_descriptors");



CREATE INDEX "idx_moodboards_tags" ON "public"."moodboards" USING "gin" ("tags");



CREATE INDEX "idx_moodboards_vibe_search" ON "public"."moodboards" USING "gin" ("to_tsvector"('"english"'::"regconfig", COALESCE("vibe_summary", ''::"text")));



CREATE INDEX "idx_notification_preferences_user_id" ON "public"."notification_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_category" ON "public"."notifications" USING "btree" ("category", "created_at");



CREATE INDEX "idx_notifications_delivery" ON "public"."notifications" USING "btree" ("delivered_in_app", "delivered_email", "delivered_push", "created_at");



CREATE INDEX "idx_notifications_recipient_unread" ON "public"."notifications" USING "btree" ("recipient_id", "read_at") WHERE ("read_at" IS NULL);



CREATE INDEX "idx_notifications_related_application" ON "public"."notifications" USING "btree" ("related_application_id") WHERE ("related_application_id" IS NOT NULL);



CREATE INDEX "idx_notifications_related_gig" ON "public"."notifications" USING "btree" ("related_gig_id") WHERE ("related_gig_id" IS NOT NULL);



CREATE INDEX "idx_notifications_scheduled" ON "public"."notifications" USING "btree" ("scheduled_for") WHERE ("delivered_at" IS NULL);



CREATE INDEX "idx_profiles_handle" ON "public"."profiles" USING "btree" ("handle");



CREATE INDEX "idx_profiles_style_tags" ON "public"."profiles" USING "gin" ("style_tags");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "idx_rate_limit_usage_user_resource_window" ON "public"."rate_limit_usage" USING "btree" ("user_id", "resource_type", "time_window_start" DESC);



CREATE INDEX "idx_reports_content" ON "public"."reports" USING "btree" ("content_type", "reported_content_id") WHERE ("reported_content_id" IS NOT NULL);



CREATE INDEX "idx_reports_created_at" ON "public"."reports" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reports_message_content" ON "public"."reports" USING "btree" ("reported_content_id", "content_type") WHERE ("content_type" = 'message'::"text");



CREATE INDEX "idx_reports_message_priority_status" ON "public"."reports" USING "btree" ("priority", "status", "created_at" DESC) WHERE ("content_type" = 'message'::"text");



CREATE INDEX "idx_reports_message_reporter" ON "public"."reports" USING "btree" ("reporter_user_id", "reported_content_id", "content_type") WHERE ("content_type" = 'message'::"text");



CREATE INDEX "idx_reports_priority" ON "public"."reports" USING "btree" ("priority", "created_at" DESC) WHERE ("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text"]));



CREATE INDEX "idx_reports_reported_user" ON "public"."reports" USING "btree" ("reported_user_id") WHERE ("reported_user_id" IS NOT NULL);



CREATE INDEX "idx_reports_reporter" ON "public"."reports" USING "btree" ("reporter_user_id");



CREATE INDEX "idx_reports_status" ON "public"."reports" USING "btree" ("status") WHERE ("status" <> 'resolved'::"text");



CREATE INDEX "idx_saved_gigs_gig_id" ON "public"."saved_gigs" USING "btree" ("gig_id");



CREATE INDEX "idx_saved_gigs_saved_at" ON "public"."saved_gigs" USING "btree" ("saved_at" DESC);



CREATE INDEX "idx_saved_gigs_user_id" ON "public"."saved_gigs" USING "btree" ("user_id");



CREATE INDEX "idx_showcases_creator" ON "public"."showcases" USING "btree" ("creator_user_id");



CREATE INDEX "idx_showcases_participants" ON "public"."showcases" USING "btree" ("creator_user_id", "talent_user_id", "visibility") WHERE ("visibility" = 'PUBLIC'::"public"."showcase_visibility");



CREATE INDEX "idx_showcases_talent" ON "public"."showcases" USING "btree" ("talent_user_id");



CREATE INDEX "idx_typing_indicators_activity" ON "public"."typing_indicators" USING "btree" ("last_activity");



CREATE INDEX "idx_typing_indicators_conversation" ON "public"."typing_indicators" USING "btree" ("conversation_id");



CREATE INDEX "idx_usage_rights_options_active_sort" ON "public"."usage_rights_options" USING "btree" ("is_active", "sort_order");



CREATE INDEX "idx_user_blocks_blocked_blocker" ON "public"."user_blocks" USING "btree" ("blocked_user_id", "blocker_user_id");



CREATE INDEX "idx_user_blocks_blocker_blocked" ON "public"."user_blocks" USING "btree" ("blocker_user_id", "blocked_user_id");



CREATE INDEX "idx_user_blocks_blocker_created" ON "public"."user_blocks" USING "btree" ("blocker_user_id", "created_at" DESC);



CREATE INDEX "idx_user_credit_purchases_created_at" ON "public"."user_credit_purchases" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_credit_purchases_stripe_session_id" ON "public"."user_credit_purchases" USING "btree" ("stripe_session_id");



CREATE INDEX "idx_user_credit_purchases_user_id" ON "public"."user_credit_purchases" USING "btree" ("user_id");



CREATE INDEX "idx_user_credits_user_id" ON "public"."user_credits" USING "btree" ("user_id");



CREATE INDEX "idx_user_settings_allow_stranger_messages" ON "public"."user_settings" USING "btree" ("allow_stranger_messages") WHERE ("allow_stranger_messages" = false);



CREATE INDEX "idx_user_settings_message_notifications" ON "public"."user_settings" USING "btree" ("message_notifications") WHERE ("message_notifications" = false);



CREATE INDEX "idx_user_settings_user_id" ON "public"."user_settings" USING "btree" ("user_id");



CREATE INDEX "idx_user_violations_active" ON "public"."user_violations" USING "btree" ("user_id", "expires_at");



CREATE INDEX "idx_user_violations_created" ON "public"."user_violations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_violations_not_expired" ON "public"."user_violations" USING "btree" ("user_id") WHERE ("expires_at" IS NULL);



CREATE INDEX "idx_user_violations_report" ON "public"."user_violations" USING "btree" ("report_id") WHERE ("report_id" IS NOT NULL);



CREATE INDEX "idx_user_violations_severity" ON "public"."user_violations" USING "btree" ("severity");



CREATE INDEX "idx_user_violations_user" ON "public"."user_violations" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_profile_header_banner_url" ON "public"."users_profile" USING "btree" ("header_banner_url") WHERE ("header_banner_url" IS NOT NULL);



CREATE INDEX "idx_users_profile_vibe_tags" ON "public"."users_profile" USING "gin" ("vibe_tags");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_users_stripe_customer_id" ON "public"."users" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_users_subscription_tier" ON "public"."users_profile" USING "btree" ("subscription_tier");



CREATE INDEX "idx_verification_badges_active" ON "public"."verification_badges" USING "btree" ("user_id", "badge_type") WHERE ("revoked_at" IS NULL);



CREATE INDEX "idx_verification_badges_user" ON "public"."verification_badges" USING "btree" ("user_id");



CREATE INDEX "idx_verification_requests_status" ON "public"."verification_requests" USING "btree" ("status") WHERE ("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text"]));



CREATE INDEX "idx_verification_requests_submitted" ON "public"."verification_requests" USING "btree" ("submitted_at" DESC);



CREATE INDEX "idx_verification_requests_type" ON "public"."verification_requests" USING "btree" ("verification_type");



CREATE INDEX "idx_verification_requests_user" ON "public"."verification_requests" USING "btree" ("user_id");



CREATE UNIQUE INDEX "unique_active_badge_per_type" ON "public"."verification_badges" USING "btree" ("user_id", "badge_type") WHERE ("revoked_at" IS NULL);



CREATE OR REPLACE TRIGGER "auto_escalate_report_trigger" BEFORE INSERT ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."auto_escalate_report_priority"();



CREATE OR REPLACE TRIGGER "init_user_credits_on_profile_create" AFTER INSERT ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."initialize_user_credits"();



CREATE OR REPLACE TRIGGER "moderation_queue_updated_at_trigger" BEFORE UPDATE ON "public"."moderation_queue" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "reports_updated_at_trigger" BEFORE UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_reports_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_message_status" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_message_status"();



CREATE OR REPLACE TRIGGER "update_applications_updated_at" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_gig_notification_preferences_updated_at" BEFORE UPDATE ON "public"."gig_notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_gig_notification_preferences_updated_at"();



CREATE OR REPLACE TRIGGER "update_gigs_updated_at" BEFORE UPDATE ON "public"."gigs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_moodboards_updated_at" BEFORE UPDATE ON "public"."moodboards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_notification_preferences_updated_at" BEFORE UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_showcases_updated_at" BEFORE UPDATE ON "public"."showcases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_users_profile_updated_at" BEFORE UPDATE ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "verification_updated_at_trigger" BEFORE UPDATE ON "public"."verification_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_verification_updated_at"();



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_applicant_user_id_fkey" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_moderation_queue"
    ADD CONSTRAINT "content_moderation_queue_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."content_moderation_queue"
    ADD CONSTRAINT "content_moderation_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_purchase_requests"
    ADD CONSTRAINT "credit_purchase_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_moodboard_id_fkey" FOREIGN KEY ("moodboard_id") REFERENCES "public"."moodboards"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."gig_notification_preferences"
    ADD CONSTRAINT "gig_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gigs"
    ADD CONSTRAINT "gigs_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lootbox_events"
    ADD CONSTRAINT "lootbox_events_purchased_by_fkey" FOREIGN KEY ("purchased_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moderation_actions"
    ADD CONSTRAINT "moderation_actions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moderation_actions"
    ADD CONSTRAINT "moderation_actions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."moderation_actions"
    ADD CONSTRAINT "moderation_actions_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."moderation_actions"
    ADD CONSTRAINT "moderation_actions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."moderation_queue"
    ADD CONSTRAINT "moderation_queue_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."moderation_queue"
    ADD CONSTRAINT "moderation_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moodboard_items"
    ADD CONSTRAINT "moodboard_items_moodboard_id_fkey" FOREIGN KEY ("moodboard_id") REFERENCES "public"."moodboards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moodboards"
    ADD CONSTRAINT "moodboards_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moodboards"
    ADD CONSTRAINT "moodboards_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_application_id_fkey" FOREIGN KEY ("related_application_id") REFERENCES "public"."applications"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_gig_id_fkey" FOREIGN KEY ("related_gig_id") REFERENCES "public"."gigs"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rate_limit_usage"
    ADD CONSTRAINT "rate_limit_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewed_user_id_fkey" FOREIGN KEY ("reviewed_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_gigs"
    ADD CONSTRAINT "saved_gigs_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_gigs"
    ADD CONSTRAINT "saved_gigs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcases"
    ADD CONSTRAINT "showcases_creator_user_id_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcases"
    ADD CONSTRAINT "showcases_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcases"
    ADD CONSTRAINT "showcases_talent_user_id_fkey" FOREIGN KEY ("talent_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_blocker_user_id_fkey" FOREIGN KEY ("blocker_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_credit_purchases"
    ADD CONSTRAINT "user_credit_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_violations"
    ADD CONSTRAINT "user_violations_moderation_action_id_fkey" FOREIGN KEY ("moderation_action_id") REFERENCES "public"."moderation_actions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_violations"
    ADD CONSTRAINT "user_violations_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_violations"
    ADD CONSTRAINT "user_violations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users_profile"
    ADD CONSTRAINT "users_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_badges"
    ADD CONSTRAINT "verification_badges_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."verification_badges"
    ADD CONSTRAINT "verification_badges_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."verification_badges"
    ADD CONSTRAINT "verification_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_badges"
    ADD CONSTRAINT "verification_badges_verification_request_id_fkey" FOREIGN KEY ("verification_request_id") REFERENCES "public"."verification_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."verification_requests"
    ADD CONSTRAINT "verification_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."verification_requests"
    ADD CONSTRAINT "verification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin users can update all applications" ON "public"."applications" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admin users can view all applications" ON "public"."applications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admins can update moderation items" ON "public"."moderation_queue" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admins can update moderation queue items" ON "public"."content_moderation_queue" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admins can view all moderation items" ON "public"."moderation_queue" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admins can view all moderation queue items" ON "public"."content_moderation_queue" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Anyone can view moodboards for published gigs" ON "public"."moodboards" FOR SELECT USING ((("gig_id" IN ( SELECT "gigs"."id"
   FROM "public"."gigs"
  WHERE ("gigs"."status" = 'PUBLISHED'::"public"."gig_status"))) OR ("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Anyone can view public showcases" ON "public"."showcases" FOR SELECT USING ((("visibility" = 'PUBLIC'::"public"."showcase_visibility") OR ("creator_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("talent_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Anyone can view published gigs" ON "public"."gigs" FOR SELECT USING ((("status" = 'PUBLISHED'::"public"."gig_status") OR ("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Anyone can view reviews" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Anyone can view subscription tiers" ON "public"."subscription_tiers" FOR SELECT USING (true);



CREATE POLICY "Applicants can update own applications" ON "public"."applications" FOR UPDATE USING (("applicant_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Contributors can create gigs" ON "public"."gigs" FOR INSERT WITH CHECK ((("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('CONTRIBUTOR'::"public"."user_role" = ANY ("users_profile"."role_flags")))))));



CREATE POLICY "Gig owners can create moodboards" ON "public"."moodboards" FOR INSERT WITH CHECK ((("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) AND ("gig_id" IN ( SELECT "gigs"."id"
   FROM "public"."gigs"
  WHERE ("gigs"."owner_user_id" = ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Gig owners can delete own gigs" ON "public"."gigs" FOR DELETE USING (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Gig owners can update applications to their gigs" ON "public"."applications" FOR UPDATE USING (("gig_id" IN ( SELECT "gigs"."id"
   FROM "public"."gigs"
  WHERE ("gigs"."owner_user_id" = ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Gig owners can update own gigs" ON "public"."gigs" FOR UPDATE USING (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Gig owners can view applications to their gigs" ON "public"."applications" FOR SELECT USING ((("gig_id" IN ( SELECT "gigs"."id"
   FROM "public"."gigs"
  WHERE ("gigs"."owner_user_id" = ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))))) OR ("applicant_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Moodboard owners can delete own moodboards" ON "public"."moodboards" FOR DELETE USING (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Moodboard owners can update own moodboards" ON "public"."moodboards" FOR UPDATE USING (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Participants can create reviews" ON "public"."reviews" FOR INSERT WITH CHECK ((("reviewer_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) AND ("gig_id" IN ( SELECT "gigs"."id"
   FROM "public"."gigs"
  WHERE ("gigs"."status" = 'COMPLETED'::"public"."gig_status")))));



CREATE POLICY "Participants can create showcases" ON "public"."showcases" FOR INSERT WITH CHECK ((("creator_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("talent_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Participants can update showcases" ON "public"."showcases" FOR UPDATE USING ((("creator_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("talent_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Profiles are publicly readable" ON "public"."profiles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public moodboards are viewable by everyone" ON "public"."moodboards" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Service role can insert domain events" ON "public"."domain_events" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can manage lootbox events" ON "public"."lootbox_events" USING (true);



CREATE POLICY "Service role can manage lootbox packages" ON "public"."lootbox_packages" USING (true);



CREATE POLICY "Service role can read domain events" ON "public"."domain_events" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Service role has full access to profiles" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to users" ON "public"."users" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role manages checkout sessions" ON "public"."checkout_sessions" USING (true) WITH CHECK (true);



CREATE POLICY "Service role manages credit purchases" ON "public"."user_credit_purchases" USING (true) WITH CHECK (true);



CREATE POLICY "Service role manages credits" ON "public"."user_credits" USING (true) WITH CHECK (true);



CREATE POLICY "Service role manages packages" ON "public"."credit_packages" USING (true) WITH CHECK (true);



CREATE POLICY "Service role manages transactions" ON "public"."credit_transactions" USING (true) WITH CHECK (true);



CREATE POLICY "System can create notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert moderation items" ON "public"."moderation_queue" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert moderation queue items" ON "public"."content_moderation_queue" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can manage subscriptions" ON "public"."subscriptions" USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "users_profile"."user_id"))));



CREATE POLICY "System can update delivery status" ON "public"."notifications" FOR UPDATE USING (true);



CREATE POLICY "Talent can apply to gigs" ON "public"."applications" FOR INSERT WITH CHECK ((("applicant_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('TALENT'::"public"."user_role" = ANY ("users_profile"."role_flags")))))));



CREATE POLICY "Usage rights are publicly readable" ON "public"."usage_rights_options" FOR SELECT USING (true);



CREATE POLICY "Users can access own preferences" ON "public"."notification_preferences" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can access own settings" ON "public"."user_settings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create blocks" ON "public"."user_blocks" FOR INSERT WITH CHECK (("blocker_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own moodboards" ON "public"."moodboards" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can delete own media" ON "public"."media" FOR DELETE USING (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete own saved gigs" ON "public"."saved_gigs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own blocks" ON "public"."user_blocks" FOR DELETE USING (("blocker_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their own moodboards" ON "public"."moodboards" FOR DELETE USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."users_profile" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own gig
  notification preferences" ON "public"."gig_notification_preferences" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own moodboard items" ON "public"."moodboard_items" USING ((EXISTS ( SELECT 1
   FROM "public"."moodboards"
  WHERE (("moodboards"."id" = "moodboard_items"."moodboard_id") AND ("moodboards"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own typing indicators" ON "public"."typing_indicators" USING (("user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can read lootbox packages" ON "public"."lootbox_packages" FOR SELECT USING (true);



CREATE POLICY "Users can read own user record" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can read their own domain events" ON "public"."domain_events" FOR SELECT TO "authenticated" USING (((("metadata" ->> 'userId'::"text") = ("auth"."uid"())::"text") OR (("aggregate_id")::"text" IN ( SELECT ("moodboards"."id")::"text" AS "id"
   FROM "public"."moodboards"
  WHERE ("moodboards"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read their own lootbox events" ON "public"."lootbox_events" FOR SELECT USING (("auth"."uid"() = "purchased_by"));



CREATE POLICY "Users can save gigs" ON "public"."saved_gigs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can send messages" ON "public"."messages" FOR INSERT WITH CHECK (("from_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own media" ON "public"."media" FOR UPDATE USING (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users_profile" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own user record" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own moodboards" ON "public"."moodboards" FOR UPDATE USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can upload own media" ON "public"."media" FOR INSERT WITH CHECK (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view active packages" ON "public"."credit_packages" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Users can view all profiles" ON "public"."users_profile" FOR SELECT USING (true);



CREATE POLICY "Users can view blocks they created" ON "public"."user_blocks" FOR SELECT USING (("blocker_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view messages in their gigs" ON "public"."messages" FOR SELECT USING ((("from_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("to_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view moodboard items" ON "public"."moodboard_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moodboards"
  WHERE (("moodboards"."id" = "moodboard_items"."moodboard_id") AND (("moodboards"."is_public" = true) OR ("moodboards"."owner_user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view own checkout sessions" ON "public"."checkout_sessions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own credit purchases" ON "public"."user_credit_purchases" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own credits" ON "public"."user_credits" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own media" ON "public"."media" FOR SELECT USING ((("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("visibility" = 'PUBLIC'::"public"."showcase_visibility")));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can view own saved gigs" ON "public"."saved_gigs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own subscription" ON "public"."subscriptions" FOR SELECT USING (("user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own transactions" ON "public"."credit_transactions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own credits" ON "public"."user_credits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own moodboards" ON "public"."moodboards" FOR SELECT USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can view their own rate limit usage" ON "public"."rate_limit_usage" FOR SELECT USING (("user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own transactions" ON "public"."credit_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view typing indicators in their conversations" ON "public"."typing_indicators" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."messages" "m"
  WHERE (("m"."conversation_id" = "typing_indicators"."conversation_id") AND (("m"."from_user_id" = ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("m"."to_user_id" = ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Vibes master is publicly readable" ON "public"."vibes_master" FOR SELECT USING (true);



CREATE POLICY "admin_create_actions" ON "public"."moderation_actions" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))) AND ("admin_user_id" = "auth"."uid"())));



CREATE POLICY "admin_manage_badges" ON "public"."verification_badges" USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "admin_manage_thresholds" ON "public"."violation_thresholds" USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "admin_manage_violations" ON "public"."user_violations" USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "admin_update_actions" ON "public"."moderation_actions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "admin_update_reports" ON "public"."reports" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "admin_update_verification_requests" ON "public"."verification_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "admin_view_all_actions" ON "public"."moderation_actions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "admin_view_all_reports" ON "public"."reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "admin_view_all_verification_requests" ON "public"."verification_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "admin_view_all_violations" ON "public"."user_violations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkout_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_moderation_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."domain_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "enhanced_messages_insert" ON "public"."messages" FOR INSERT WITH CHECK ((("from_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) AND "public"."can_users_communicate"("from_user_id", "to_user_id") AND (EXISTS ( SELECT 1
   FROM "public"."gigs" "g"
  WHERE (("g"."id" = "messages"."gig_id") AND (("g"."owner_user_id" = "messages"."from_user_id") OR ("g"."owner_user_id" = "messages"."to_user_id")))))));



CREATE POLICY "enhanced_messages_select" ON "public"."messages" FOR SELECT USING (((("from_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("to_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))) AND "public"."can_users_communicate"("from_user_id", "to_user_id")));



CREATE POLICY "enhanced_messages_update" ON "public"."messages" FOR UPDATE USING ((("to_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) AND "public"."can_users_communicate"("from_user_id", "to_user_id")));



ALTER TABLE "public"."gig_notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gigs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lootbox_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lootbox_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moderation_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moderation_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moodboard_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moodboards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_view_badges" ON "public"."verification_badges" FOR SELECT USING (true);



ALTER TABLE "public"."rate_limit_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_gigs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."showcases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."typing_indicators" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_rights_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_blocks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_create_reports" ON "public"."reports" FOR INSERT WITH CHECK (("reporter_user_id" = "auth"."uid"()));



CREATE POLICY "user_create_verification_requests" ON "public"."verification_requests" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_credit_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_credits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_view_own_actions" ON "public"."moderation_actions" FOR SELECT USING (("target_user_id" = "auth"."uid"()));



CREATE POLICY "user_view_own_reports" ON "public"."reports" FOR SELECT USING (("reporter_user_id" = "auth"."uid"()));



CREATE POLICY "user_view_own_verification_requests" ON "public"."verification_requests" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_view_own_violations" ON "public"."user_violations" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_violations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users_profile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vibes_master" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."violation_thresholds" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_user_violation"("p_user_id" "uuid", "p_violation_type" "text", "p_severity" "text", "p_description" "text", "p_report_id" "uuid", "p_evidence_urls" "text"[], "p_expires_in_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_user_violation"("p_user_id" "uuid", "p_violation_type" "text", "p_severity" "text", "p_description" "text", "p_report_id" "uuid", "p_evidence_urls" "text"[], "p_expires_in_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_user_violation"("p_user_id" "uuid", "p_violation_type" "text", "p_severity" "text", "p_description" "text", "p_report_id" "uuid", "p_evidence_urls" "text"[], "p_expires_in_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_moderation_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_user_id" "uuid", "p_reason" "text", "p_duration_hours" integer, "p_report_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_moderation_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_user_id" "uuid", "p_reason" "text", "p_duration_hours" integer, "p_report_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_moderation_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_user_id" "uuid", "p_reason" "text", "p_duration_hours" integer, "p_report_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_progressive_enforcement"("p_user_id" "uuid", "p_admin_id" "uuid", "p_violation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_progressive_enforcement"("p_user_id" "uuid", "p_admin_id" "uuid", "p_violation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_progressive_enforcement"("p_user_id" "uuid", "p_admin_id" "uuid", "p_violation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_review_notes" "text", "p_badge_expires_in_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."approve_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_review_notes" "text", "p_badge_expires_in_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_review_notes" "text", "p_badge_expires_in_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_escalate_report_priority"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_escalate_report_priority"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_escalate_report_priority"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_user_risk_score"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_user_risk_score"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_user_risk_score"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_users_communicate"("user1_id" "uuid", "user2_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_users_communicate"("user1_id" "uuid", "user2_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_users_communicate"("user1_id" "uuid", "user2_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_content_moderation"("p_content_id" "uuid", "p_content_type" "text", "p_content_text" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_content_moderation"("p_content_id" "uuid", "p_content_type" "text", "p_content_text" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_content_moderation"("p_content_id" "uuid", "p_content_type" "text", "p_content_text" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_resource_type" character varying, "p_subscription_tier" "public"."subscription_tier") TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_resource_type" character varying, "p_subscription_tier" "public"."subscription_tier") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_resource_type" character varying, "p_subscription_tier" "public"."subscription_tier") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_connection"("sender_user_id" "uuid", "recipient_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_connection"("sender_user_id" "uuid", "recipient_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_connection"("sender_user_id" "uuid", "recipient_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_domain_events"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_domain_events"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_domain_events"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_rate_limit_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_rate_limit_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_rate_limit_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_typing_indicators"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_typing_indicators"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_typing_indicators"() TO "service_role";



GRANT ALL ON FUNCTION "public"."consume_platform_credits"("p_provider" character varying, "p_credits" integer, "p_cost" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."consume_platform_credits"("p_provider" character varying, "p_credits" integer, "p_cost" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."consume_platform_credits"("p_provider" character varying, "p_credits" integer, "p_cost" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_user_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_user_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_user_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_old_violations"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_old_violations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_old_violations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_suspensions"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_suspensions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_suspensions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_verifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_verifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_verifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_average_resolution_time"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_average_resolution_time"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_average_resolution_time"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_average_severity"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_average_severity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_average_severity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversation_summary"("p_gig_id" "uuid", "p_user1_id" "uuid", "p_user2_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversation_summary"("p_gig_id" "uuid", "p_user1_id" "uuid", "p_user2_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversation_summary"("p_gig_id" "uuid", "p_user1_id" "uuid", "p_user2_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_saved_count"("gig_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_saved_count"("gig_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_saved_count"("gig_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_violation_flags"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_violation_flags"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_violation_flags"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_violation_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_violation_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_violation_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_violation_summary"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_violation_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_violation_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_user_credits"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_user_credits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_user_credits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_gig_saved_by_user"("gig_id_param" "uuid", "user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_gig_saved_by_user"("gig_id_param" "uuid", "user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_gig_saved_by_user"("gig_id_param" "uuid", "user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_suspended_or_banned"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_suspended_or_banned"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_suspended_or_banned"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_conversation_delivered"("conversation_uuid" "uuid", "user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_conversation_delivered"("conversation_uuid" "uuid", "user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_conversation_delivered"("conversation_uuid" "uuid", "user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."queue_for_moderation"("p_content_id" "uuid", "p_content_type" "text", "p_content_text" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."queue_for_moderation"("p_content_id" "uuid", "p_content_type" "text", "p_content_text" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."queue_for_moderation"("p_content_id" "uuid", "p_content_type" "text", "p_content_text" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_rejection_reason" "text", "p_review_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_rejection_reason" "text", "p_review_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_rejection_reason" "text", "p_review_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_monthly_credits"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_monthly_credits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_monthly_credits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_gig_notification_preferences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_gig_notification_preferences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_gig_notification_preferences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_message_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_message_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_message_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."user_credits" TO "anon";
GRANT ALL ON TABLE "public"."user_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credits" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_verification_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_verification_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_verification_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_message_permission"("sender_user_id" "uuid", "recipient_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_message_permission"("sender_user_id" "uuid", "recipient_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_message_permission"("sender_user_id" "uuid", "recipient_user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."moderation_actions" TO "anon";
GRANT ALL ON TABLE "public"."moderation_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_actions" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."users_profile" TO "anon";
GRANT ALL ON TABLE "public"."users_profile" TO "authenticated";
GRANT ALL ON TABLE "public"."users_profile" TO "service_role";



GRANT ALL ON TABLE "public"."admin_moderation_audit" TO "anon";
GRANT ALL ON TABLE "public"."admin_moderation_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_moderation_audit" TO "service_role";



GRANT ALL ON TABLE "public"."moderation_queue" TO "anon";
GRANT ALL ON TABLE "public"."moderation_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_queue" TO "service_role";



GRANT ALL ON TABLE "public"."admin_moderation_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."admin_moderation_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_moderation_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."admin_reports_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."admin_reports_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_reports_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."verification_badges" TO "anon";
GRANT ALL ON TABLE "public"."verification_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."verification_badges" TO "service_role";



GRANT ALL ON TABLE "public"."verification_requests" TO "anon";
GRANT ALL ON TABLE "public"."verification_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."verification_requests" TO "service_role";



GRANT ALL ON TABLE "public"."admin_verification_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."admin_verification_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_verification_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."user_violations" TO "anon";
GRANT ALL ON TABLE "public"."user_violations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_violations" TO "service_role";



GRANT ALL ON TABLE "public"."admin_violation_stats" TO "anon";
GRANT ALL ON TABLE "public"."admin_violation_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_violation_stats" TO "service_role";



GRANT ALL ON TABLE "public"."admin_violations_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."admin_violations_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_violations_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."api_providers" TO "anon";
GRANT ALL ON TABLE "public"."api_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."api_providers" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."checkout_sessions" TO "anon";
GRANT ALL ON TABLE "public"."checkout_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."checkout_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."content_moderation_queue" TO "anon";
GRANT ALL ON TABLE "public"."content_moderation_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."content_moderation_queue" TO "service_role";



GRANT ALL ON TABLE "public"."credit_alerts" TO "anon";
GRANT ALL ON TABLE "public"."credit_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."credit_packages" TO "anon";
GRANT ALL ON TABLE "public"."credit_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_packages" TO "service_role";



GRANT ALL ON TABLE "public"."credit_pools" TO "anon";
GRANT ALL ON TABLE "public"."credit_pools" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_pools" TO "service_role";



GRANT ALL ON TABLE "public"."credit_purchase_requests" TO "anon";
GRANT ALL ON TABLE "public"."credit_purchase_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_purchase_requests" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."daily_usage_summary" TO "anon";
GRANT ALL ON TABLE "public"."daily_usage_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_usage_summary" TO "service_role";



GRANT ALL ON TABLE "public"."domain_events" TO "anon";
GRANT ALL ON TABLE "public"."domain_events" TO "authenticated";
GRANT ALL ON TABLE "public"."domain_events" TO "service_role";



GRANT ALL ON TABLE "public"."gig_notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."gig_notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."gig_notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."gigs" TO "anon";
GRANT ALL ON TABLE "public"."gigs" TO "authenticated";
GRANT ALL ON TABLE "public"."gigs" TO "service_role";



GRANT ALL ON TABLE "public"."lootbox_events" TO "anon";
GRANT ALL ON TABLE "public"."lootbox_events" TO "authenticated";
GRANT ALL ON TABLE "public"."lootbox_events" TO "service_role";



GRANT ALL ON TABLE "public"."lootbox_packages" TO "anon";
GRANT ALL ON TABLE "public"."lootbox_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."lootbox_packages" TO "service_role";



GRANT ALL ON TABLE "public"."media" TO "anon";
GRANT ALL ON TABLE "public"."media" TO "authenticated";
GRANT ALL ON TABLE "public"."media" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."messaging_performance_stats" TO "anon";
GRANT ALL ON TABLE "public"."messaging_performance_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."messaging_performance_stats" TO "service_role";



GRANT ALL ON TABLE "public"."moodboard_items" TO "anon";
GRANT ALL ON TABLE "public"."moodboard_items" TO "authenticated";
GRANT ALL ON TABLE "public"."moodboard_items" TO "service_role";



GRANT ALL ON TABLE "public"."moodboards" TO "anon";
GRANT ALL ON TABLE "public"."moodboards" TO "authenticated";
GRANT ALL ON TABLE "public"."moodboards" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."notification_delivery_stats" TO "anon";
GRANT ALL ON TABLE "public"."notification_delivery_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_delivery_stats" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limit_usage" TO "anon";
GRANT ALL ON TABLE "public"."rate_limit_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limit_usage" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."saved_gigs" TO "anon";
GRANT ALL ON TABLE "public"."saved_gigs" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_gigs" TO "service_role";



GRANT ALL ON TABLE "public"."showcases" TO "anon";
GRANT ALL ON TABLE "public"."showcases" TO "authenticated";
GRANT ALL ON TABLE "public"."showcases" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_tiers" TO "anon";
GRANT ALL ON TABLE "public"."subscription_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_tiers" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."system_alerts" TO "anon";
GRANT ALL ON TABLE "public"."system_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."system_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."typing_indicators" TO "anon";
GRANT ALL ON TABLE "public"."typing_indicators" TO "authenticated";
GRANT ALL ON TABLE "public"."typing_indicators" TO "service_role";



GRANT ALL ON TABLE "public"."usage_rights_options" TO "anon";
GRANT ALL ON TABLE "public"."usage_rights_options" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_rights_options" TO "service_role";



GRANT ALL ON SEQUENCE "public"."usage_rights_options_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."usage_rights_options_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."usage_rights_options_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_blocks" TO "anon";
GRANT ALL ON TABLE "public"."user_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."user_credit_purchases" TO "anon";
GRANT ALL ON TABLE "public"."user_credit_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credit_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vibes_master" TO "anon";
GRANT ALL ON TABLE "public"."vibes_master" TO "authenticated";
GRANT ALL ON TABLE "public"."vibes_master" TO "service_role";



GRANT ALL ON TABLE "public"."violation_thresholds" TO "anon";
GRANT ALL ON TABLE "public"."violation_thresholds" TO "authenticated";
GRANT ALL ON TABLE "public"."violation_thresholds" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
