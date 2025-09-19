

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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."application_status" AS ENUM (
    'PENDING',
    'SHORTLISTED',
    'ACCEPTED',
    'DECLINED',
    'WITHDRAWN'
);


ALTER TYPE "public"."application_status" OWNER TO "postgres";


CREATE TYPE "public"."badge_category" AS ENUM (
    'identity',
    'platform',
    'community',
    'achievement',
    'special'
);


ALTER TYPE "public"."badge_category" OWNER TO "postgres";


CREATE TYPE "public"."badge_type" AS ENUM (
    'verification',
    'achievement',
    'subscription',
    'special',
    'moderation'
);


ALTER TYPE "public"."badge_type" OWNER TO "postgres";


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


CREATE TYPE "public"."user_role" AS ENUM (
    'CONTRIBUTOR',
    'TALENT',
    'ADMIN',
    'USER',
    'MODERATOR'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."verification_status" AS ENUM (
    'UNVERIFIED',
    'EMAIL_VERIFIED',
    'ID_VERIFIED'
);


ALTER TYPE "public"."verification_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_equipment_provider_as_participant"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only process when status changes to 'accepted'
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        INSERT INTO collab_participants (project_id, user_id, role_type, status)
        VALUES (NEW.project_id, NEW.offerer_id, 'equipment_provider', 'active')
        ON CONFLICT (project_id, user_id) DO UPDATE SET
            role_type = 'equipment_provider',
            status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_equipment_provider_as_participant"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_project_creator_as_participant"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO collab_participants (project_id, user_id, role_type, status)
    VALUES (NEW.id, NEW.creator_id, 'creator', 'active');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_project_creator_as_participant"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."award_badge"("p_user_id" "uuid", "p_badge_slug" character varying, "p_awarded_by" "uuid" DEFAULT NULL::"uuid", "p_reason" "text" DEFAULT NULL::"text", "p_verified_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_badge_id UUID;
  v_user_badge_id UUID;
BEGIN
  -- Get badge ID from slug
  SELECT id INTO v_badge_id
  FROM badges
  WHERE slug = p_badge_slug AND is_active = true;
  
  IF v_badge_id IS NULL THEN
    RAISE EXCEPTION 'Badge with slug % not found or inactive', p_badge_slug;
  END IF;
  
  -- Award the badge (INSERT ... ON CONFLICT to handle duplicates)
  INSERT INTO user_badges (user_id, badge_id, awarded_by, awarded_reason, verified_data)
  VALUES (p_user_id, v_badge_id, p_awarded_by, p_reason, p_verified_data)
  ON CONFLICT (user_id, badge_id) 
  DO UPDATE SET 
    is_active = true,
    awarded_at = NOW(),
    awarded_by = p_awarded_by,
    awarded_reason = p_reason,
    verified_data = COALESCE(p_verified_data, user_badges.verified_data)
  RETURNING id INTO v_user_badge_id;
  
  RETURN v_user_badge_id;
END;
$$;


ALTER FUNCTION "public"."award_badge"("p_user_id" "uuid", "p_badge_slug" character varying, "p_awarded_by" "uuid", "p_reason" "text", "p_verified_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_age"("birth_date" "date") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN DATE_PART('year', AGE(CURRENT_DATE, birth_date))::INTEGER;
END;
$$;


ALTER FUNCTION "public"."calculate_age"("birth_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_location_score"("user_city" "text", "gig_location" "text", "user_travels" boolean DEFAULT false, "travel_radius_km" integer DEFAULT 50) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Simple city matching logic
    -- In production, this could use PostGIS for actual distance calculations
    IF user_city IS NULL OR gig_location IS NULL THEN
        RETURN 0;
    END IF;
    
    IF LOWER(user_city) = LOWER(gig_location) THEN
        RETURN 25; -- Same city
    ELSIF user_travels = true THEN
        RETURN 15; -- User can travel
    ELSE
        RETURN 5; -- Different cities, no travel
    END IF;
END;
$$;


ALTER FUNCTION "public"."calculate_location_score"("user_city" "text", "gig_location" "text", "user_travels" boolean, "travel_radius_km" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_style_compatibility"("user_tags" "text"[], "gig_tags" "text"[]) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    match_count INTEGER;
BEGIN
    IF user_tags IS NULL OR gig_tags IS NULL THEN
        RETURN 0;
    END IF;
    
    SELECT COUNT(*) INTO match_count
    FROM unnest(user_tags) AS user_tag
    WHERE user_tag = ANY(gig_tags);
    
    RETURN LEAST(match_count * 5, 20); -- 5 points per match, max 20
END;
$$;


ALTER FUNCTION "public"."calculate_style_compatibility"("user_tags" "text"[], "gig_tags" "text"[]) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_status TEXT;
    v_age_verified BOOLEAN;
BEGIN
    SELECT account_status, age_verified 
    INTO v_user_status, v_age_verified
    FROM users_profile
    WHERE user_id = p_user_id;
    
    -- Define feature access rules
    CASE p_feature
        WHEN 'view_gigs' THEN
            -- Anyone can view gigs
            RETURN true;
        WHEN 'create_profile' THEN
            -- Need email verification (basic)
            RETURN v_user_status != 'banned';
        WHEN 'apply_to_gigs' THEN
            -- Need age verification
            RETURN v_age_verified AND v_user_status NOT IN ('suspended', 'banned');
        WHEN 'create_gigs' THEN
            -- Need age verification
            RETURN v_age_verified AND v_user_status NOT IN ('suspended', 'banned');
        WHEN 'messaging' THEN
            -- Need age verification
            RETURN v_age_verified AND v_user_status NOT IN ('suspended', 'banned');
        WHEN 'create_showcases' THEN
            -- Need full verification
            RETURN v_user_status = 'fully_verified';
        ELSE
            -- Default: require age verification
            RETURN v_age_verified;
    END CASE;
END;
$$;


ALTER FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_use_monthly_bump"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_tier VARCHAR(20);
    benefit_record RECORD;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM users_profile
    WHERE id = p_user_id;
    
    -- Check if user has monthly bump benefit
    SELECT * INTO benefit_record
    FROM subscription_benefits
    WHERE user_id = p_user_id 
    AND benefit_type = 'monthly_bump';
    
    -- If no benefit record exists, create one based on tier
    IF NOT FOUND THEN
        INSERT INTO subscription_benefits (user_id, subscription_tier, benefit_type, benefit_value, monthly_limit)
        VALUES (
            p_user_id,
            user_tier,
            'monthly_bump',
            jsonb_build_object('type', 'monthly_bump'),
            CASE user_tier
                WHEN 'FREE' THEN 0
                WHEN 'PLUS' THEN 1
                WHEN 'PRO' THEN 3
                ELSE 0
            END
        );
        
        -- Return eligibility based on tier
        RETURN CASE user_tier
            WHEN 'FREE' THEN FALSE
            WHEN 'PLUS' THEN TRUE
            WHEN 'PRO' THEN TRUE
            ELSE FALSE
        END;
    END IF;
    
    -- Reset monthly usage if new month
    IF DATE_TRUNC('month', benefit_record.last_reset_at) < DATE_TRUNC('month', NOW()) THEN
        UPDATE subscription_benefits 
        SET 
            used_this_month = 0,
            last_reset_at = DATE_TRUNC('month', NOW())
        WHERE id = benefit_record.id;
        
        RETURN benefit_record.monthly_limit > 0;
    END IF;
    
    -- Check if user has remaining bumps
    RETURN benefit_record.used_this_month < benefit_record.monthly_limit;
END;
$$;


ALTER FUNCTION "public"."can_use_monthly_bump"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_use_monthly_bump"("p_user_id" "uuid") IS 'Checks if user can use their monthly bump benefit';



CREATE OR REPLACE FUNCTION "public"."check_rental_availability"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check for overlapping reservations for the same listing
    IF EXISTS (
        SELECT 1 FROM rental_orders ro
        WHERE ro.listing_id = NEW.listing_id
        AND ro.status IN ('accepted', 'paid', 'in_progress')
        AND ro.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
            (NEW.start_date BETWEEN ro.start_date AND ro.end_date) OR
            (NEW.end_date BETWEEN ro.start_date AND ro.end_date) OR
            (NEW.start_date <= ro.start_date AND NEW.end_date >= ro.end_date)
        )
    ) THEN
        RAISE EXCEPTION 'Listing is not available for the selected dates';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_rental_availability"() OWNER TO "postgres";


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
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only insert if the user exists in public.users
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.notification_preferences (
      user_id,
      email_enabled,
      push_enabled,
      in_app_enabled,
      gig_notifications,
      application_notifications,
      message_notifications,
      booking_notifications,
      system_notifications,
      marketing_notifications,
      digest_frequency,
      timezone,
      badge_count_enabled,
      sound_enabled,
      vibration_enabled,
      marketplace_notifications,
      listing_notifications,
      offer_notifications,
      order_notifications,
      payment_notifications,
      review_notifications,
      dispute_notifications
    )
    VALUES (
      NEW.id,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      'real-time',
      'UTC',
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_notification_preferences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_user_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_settings (
    user_id,
    email_notifications,
    push_notifications,
    marketing_emails,
    profile_visibility,
    show_contact_info,
    two_factor_enabled,
    message_notifications,
    allow_stranger_messages,
    privacy_level,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    true,
    true,
    false,
    'public',
    true,
    false,
    true,
    false,
    'standard',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_user_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_marketplace_conversation"("p_listing_id" "uuid", "p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_initial_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_conversation_id UUID;
  v_message_id UUID;
BEGIN
  -- For marketplace, we'll use the listing_id as the "gig_id" for conversation grouping
  -- This maintains compatibility with the existing messaging system
  
  -- Check if conversation already exists
  SELECT id INTO v_conversation_id
  FROM messages
  WHERE gig_id = p_listing_id
    AND from_user_id = p_from_user_id
    AND to_user_id = p_to_user_id
    AND context_type = 'marketplace'
  LIMIT 1;
  
  -- If conversation exists, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;
  
  -- Create initial message (this will create the conversation)
  INSERT INTO messages (
    gig_id,
    listing_id,
    from_user_id,
    to_user_id,
    body,
    context_type,
    created_at
  ) VALUES (
    p_listing_id,
    p_listing_id,
    p_from_user_id,
    p_to_user_id,
    COALESCE(p_initial_message, 'Hello! I''m interested in your listing.'),
    'marketplace',
    NOW()
  ) RETURNING id INTO v_message_id;
  
  RETURN p_listing_id; -- Return listing_id as conversation_id
END;
$$;


ALTER FUNCTION "public"."create_marketplace_conversation"("p_listing_id" "uuid", "p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_initial_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_marketplace_conversation"("p_listing_id" "uuid", "p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_initial_message" "text") IS 'Creates a new marketplace conversation between two users about a listing';



CREATE OR REPLACE FUNCTION "public"."create_marketplace_notification"("p_recipient_id" "uuid", "p_type" character varying, "p_title" character varying, "p_message" "text" DEFAULT NULL::"text", "p_avatar_url" "text" DEFAULT NULL::"text", "p_action_url" "text" DEFAULT NULL::"text", "p_action_data" "jsonb" DEFAULT NULL::"jsonb", "p_sender_id" "uuid" DEFAULT NULL::"uuid", "p_listing_id" "uuid" DEFAULT NULL::"uuid", "p_rental_order_id" "uuid" DEFAULT NULL::"uuid", "p_sale_order_id" "uuid" DEFAULT NULL::"uuid", "p_offer_id" "uuid" DEFAULT NULL::"uuid", "p_review_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_notification_id UUID;
    v_category VARCHAR(20);
BEGIN
    -- Determine category based on notification type
    CASE p_type
        WHEN 'listing_created', 'listing_updated', 'listing_inquiry' THEN
            v_category := 'marketplace';
        WHEN 'offer_received', 'offer_accepted', 'offer_declined', 'offer_expired' THEN
            v_category := 'marketplace';
        WHEN 'rental_request', 'rental_confirmed', 'rental_cancelled', 'rental_completed' THEN
            v_category := 'marketplace';
        WHEN 'sale_request', 'sale_confirmed', 'sale_cancelled', 'sale_completed' THEN
            v_category := 'marketplace';
        WHEN 'payment_received', 'payment_failed' THEN
            v_category := 'marketplace';
        WHEN 'review_received', 'review_updated' THEN
            v_category := 'marketplace';
        WHEN 'dispute_opened', 'dispute_resolved' THEN
            v_category := 'marketplace';
        ELSE
            v_category := 'system';
    END CASE;

    -- Check if user has marketplace notifications enabled
    IF NOT EXISTS (
        SELECT 1 FROM notification_preferences 
        WHERE user_id = p_recipient_id 
        AND marketplace_notifications = true
    ) THEN
        -- User has disabled marketplace notifications, don't create notification
        RETURN NULL;
    END IF;

    -- Create the notification
    INSERT INTO notifications (
        recipient_id,
        type,
        category,
        title,
        message,
        avatar_url,
        action_url,
        action_data,
        sender_id,
        related_listing_id,
        related_rental_order_id,
        related_sale_order_id,
        related_offer_id,
        related_review_id,
        delivered_in_app,
        created_at
    ) VALUES (
        p_recipient_id,
        p_type,
        v_category,
        p_title,
        p_message,
        p_avatar_url,
        p_action_url,
        p_action_data,
        p_sender_id,
        p_listing_id,
        p_rental_order_id,
        p_sale_order_id,
        p_offer_id,
        p_review_id,
        true, -- Marketplace notifications are always delivered in-app
        NOW()
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."create_marketplace_notification"("p_recipient_id" "uuid", "p_type" character varying, "p_title" character varying, "p_message" "text", "p_avatar_url" "text", "p_action_url" "text", "p_action_data" "jsonb", "p_sender_id" "uuid", "p_listing_id" "uuid", "p_rental_order_id" "uuid", "p_sale_order_id" "uuid", "p_offer_id" "uuid", "p_review_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_marketplace_notification"("p_recipient_id" "uuid", "p_type" character varying, "p_title" character varying, "p_message" "text", "p_avatar_url" "text", "p_action_url" "text", "p_action_data" "jsonb", "p_sender_id" "uuid", "p_listing_id" "uuid", "p_rental_order_id" "uuid", "p_sale_order_id" "uuid", "p_offer_id" "uuid", "p_review_id" "uuid") IS 'Creates marketplace-specific notifications with proper categorization and preference checking';



CREATE OR REPLACE FUNCTION "public"."create_rental_availability_block"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- When a rental is accepted or paid, create availability block
    IF NEW.status IN ('accepted', 'paid', 'in_progress') AND 
       OLD.status NOT IN ('accepted', 'paid', 'in_progress') THEN
        
        INSERT INTO listing_availability (listing_id, start_date, end_date, kind, ref_order_id)
        VALUES (NEW.listing_id, NEW.start_date, NEW.end_date, 'reserved', NEW.id);
        
    -- When a rental is cancelled or completed, remove availability block
    ELSIF NEW.status IN ('cancelled', 'completed', 'refunded') AND 
          OLD.status IN ('accepted', 'paid', 'in_progress') THEN
        
        DELETE FROM listing_availability 
        WHERE listing_id = NEW.listing_id 
        AND ref_order_id = NEW.id 
        AND kind = 'reserved';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_rental_availability_block"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_settings_on_profile_create"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Create user settings when profile is created
  INSERT INTO user_settings (user_id, profile_id)
  VALUES (NEW.user_id, NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_user_settings_on_profile_create"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_equipment_requests"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE equipment_requests 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
  AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Also expire related responses
  UPDATE request_responses 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
  AND request_id IN (
    SELECT id FROM equipment_requests WHERE status = 'expired'
  );
  
  RETURN expired_count;
END;
$$;


ALTER FUNCTION "public"."expire_equipment_requests"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_listing_enhancements"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Mark expired enhancements
    UPDATE listing_enhancements 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Update listings to remove expired enhancements
    UPDATE listings 
    SET 
        current_enhancement_type = NULL,
        enhancement_expires_at = NULL,
        premium_badge = FALSE,
        boost_level = 0,
        updated_at = NOW()
    WHERE id IN (
        SELECT listing_id 
        FROM listing_enhancements 
        WHERE status = 'expired' 
        AND expires_at < NOW()
    );
    
    RETURN expired_count;
END;
$$;


ALTER FUNCTION "public"."expire_listing_enhancements"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."expire_listing_enhancements"() IS 'Expires all listing enhancements that have passed their expiration date';



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


CREATE OR REPLACE FUNCTION "public"."extract_cinematic_tags"("metadata" "jsonb") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    tags TEXT[] := '{}';
BEGIN
    -- Extract camera angle
    IF metadata->>'cameraAngle' IS NOT NULL THEN
        tags := array_append(tags, 'camera_' || (metadata->>'cameraAngle'));
    END IF;
    
    -- Extract lens type
    IF metadata->>'lensType' IS NOT NULL THEN
        tags := array_append(tags, 'lens_' || (metadata->>'lensType'));
    END IF;
    
    -- Extract lighting style
    IF metadata->>'lightingStyle' IS NOT NULL THEN
        tags := array_append(tags, 'lighting_' || (metadata->>'lightingStyle'));
    END IF;
    
    -- Extract director style
    IF metadata->>'directorStyle' IS NOT NULL THEN
        tags := array_append(tags, 'style_' || (metadata->>'directorStyle'));
    END IF;
    
    -- Extract color palette
    IF metadata->>'colorPalette' IS NOT NULL THEN
        tags := array_append(tags, 'color_' || (metadata->>'colorPalette'));
    END IF;
    
    -- Extract aspect ratio
    IF metadata->>'aspectRatio' IS NOT NULL THEN
        tags := array_append(tags, 'aspect_' || (metadata->>'aspectRatio'));
    END IF;
    
    RETURN tags;
END;
$$;


ALTER FUNCTION "public"."extract_cinematic_tags"("metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_compatible_gigs_for_user"("p_profile_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("gig_id" "uuid", "title" "text", "description" "text", "location_text" "text", "start_time" timestamp with time zone, "end_time" timestamp with time zone, "comp_type" "text", "compatibility_score" integer, "match_factors" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    user_profile RECORD;
    gig_record RECORD;
    score INTEGER;
    factors JSONB;
    location_score INTEGER;
    style_score INTEGER;
    experience_score INTEGER;
    availability_score INTEGER;
    compensation_score INTEGER;
    purpose_score INTEGER;
BEGIN
    -- Get user profile data
    SELECT * INTO user_profile 
    FROM public.users_profile 
    WHERE id = p_profile_id;
    
    IF user_profile IS NULL THEN
        RETURN;
    END IF;
    
    -- Loop through published gigs and calculate compatibility
    FOR gig_record IN 
        SELECT g.*, 
               up.city as gig_city,
               up.country as gig_country
        FROM public.gigs g
        LEFT JOIN public.users_profile up ON g.owner_user_id = up.id
        WHERE g.status = 'PUBLISHED' 
        AND g.application_deadline > NOW()
        AND g.owner_user_id != p_profile_id
        ORDER BY g.created_at DESC
        LIMIT p_limit * 2  -- Get more to filter by compatibility
    LOOP
        score := 0;
        factors := jsonb_build_object();
        
        -- 1. Location Compatibility (25 points max)
        location_score := 0;
        IF user_profile.city IS NOT NULL AND gig_record.location_text IS NOT NULL THEN
            -- Simple city matching (can be enhanced with distance calculation)
            IF LOWER(user_profile.city) = LOWER(gig_record.location_text) THEN
                location_score := 25;
            ELSIF user_profile.available_for_travel = true AND user_profile.travel_radius_km IS NOT NULL THEN
                -- If user travels and gig is within radius
                location_score := 15;
            ELSE
                -- Different cities but both specified
                location_score := 5;
            END IF;
        END IF;
        score := score + location_score;
        factors := factors || jsonb_build_object('location_score', location_score);
        
        -- 2. Style/Vibe Compatibility (20 points max)
        style_score := 0;
        IF user_profile.vibe_tags IS NOT NULL AND gig_record.vibe_tags IS NOT NULL THEN
            -- Count matching vibe tags
            SELECT COUNT(*) INTO style_score
            FROM unnest(user_profile.vibe_tags) AS user_tag
            WHERE user_tag = ANY(gig_record.vibe_tags);
            style_score := LEAST(style_score * 5, 20); -- 5 points per match, max 20
        END IF;
        score := score + style_score;
        factors := factors || jsonb_build_object('style_score', style_score);
        
        -- 3. Experience Compatibility (20 points max)
        experience_score := 0;
        IF user_profile.years_experience IS NOT NULL THEN
            -- More experience = higher score
            experience_score := LEAST(user_profile.years_experience * 2, 20);
        END IF;
        score := score + experience_score;
        factors := factors || jsonb_build_object('experience_score', experience_score);
        
        -- 4. Availability Compatibility (15 points max)
        availability_score := 0;
        IF user_profile.typical_turnaround_days IS NOT NULL THEN
            -- Check if user can meet gig timeline
            IF gig_record.start_time > NOW() + INTERVAL '1 day' * user_profile.typical_turnaround_days THEN
                availability_score := 15;
            ELSIF gig_record.start_time > NOW() + INTERVAL '1 day' * (user_profile.typical_turnaround_days * 2) THEN
                availability_score := 10;
            ELSE
                availability_score := 5;
            END IF;
        END IF;
        score := score + availability_score;
        factors := factors || jsonb_build_object('availability_score', availability_score);
        
        -- 5. Compensation Compatibility (10 points max)
        compensation_score := 0;
        IF user_profile.hourly_rate_min IS NOT NULL AND user_profile.hourly_rate_max IS NOT NULL THEN
            -- Check if gig compensation aligns with user rates
            IF gig_record.comp_type = 'PAID' THEN
                compensation_score := 10;
            ELSIF gig_record.comp_type = 'EXPENSES' THEN
                compensation_score := 7;
            ELSE -- TFP
                compensation_score := 5;
            END IF;
        END IF;
        score := score + compensation_score;
        factors := factors || jsonb_build_object('compensation_score', compensation_score);
        
        -- 6. Purpose/Category Compatibility (10 points max)
        purpose_score := 0;
        IF user_profile.talent_categories IS NOT NULL AND gig_record.purpose IS NOT NULL THEN
            -- Check if user's talent categories match gig purpose
            IF gig_record.purpose = ANY(user_profile.talent_categories) THEN
                purpose_score := 10;
            ELSE
                purpose_score := 5;
            END IF;
        END IF;
        score := score + purpose_score;
        factors := factors || jsonb_build_object('purpose_score', purpose_score);
        
        -- Add total score and additional metadata
        factors := factors || jsonb_build_object(
            'total_score', score,
            'user_experience', user_profile.years_experience,
            'user_city', user_profile.city,
            'user_travel', user_profile.available_for_travel,
            'gig_city', gig_record.location_text,
            'gig_purpose', gig_record.purpose
        );
        
        -- Return the gig with compatibility data
        gig_id := gig_record.id;
        title := gig_record.title;
        description := gig_record.description;
        location_text := gig_record.location_text;
        start_time := gig_record.start_time;
        end_time := gig_record.end_time;
        comp_type := gig_record.comp_type::TEXT;
        compatibility_score := score;
        match_factors := factors;
        
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$;


ALTER FUNCTION "public"."find_compatible_gigs_for_user"("p_profile_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_compatible_users_for_contributor"("p_profile_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("user_id" "uuid", "display_name" "text", "handle" "text", "bio" "text", "city" "text", "compatibility_score" integer, "match_factors" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    contributor_profile RECORD;
    talent_record RECORD;
    score INTEGER;
    factors JSONB;
    profile_completeness_score INTEGER;
    experience_score INTEGER;
    location_score INTEGER;
    style_score INTEGER;
    availability_score INTEGER;
    verification_score INTEGER;
BEGIN
    -- Get contributor profile data
    SELECT * INTO contributor_profile 
    FROM public.users_profile 
    WHERE id = p_profile_id;
    
    IF contributor_profile IS NULL THEN
        RETURN;
    END IF;
    
    -- Loop through talent users and calculate compatibility
    FOR talent_record IN 
        SELECT up.*
        FROM public.users_profile up
        WHERE up.id != p_profile_id
        AND ('TALENT' = ANY(up.role_flags) OR 'BOTH' = ANY(up.role_flags))
        ORDER BY up.created_at DESC
        LIMIT p_limit * 2  -- Get more to filter by compatibility
    LOOP
        score := 0;
        factors := jsonb_build_object();
        
        -- 1. Profile Completeness (25 points max)
        profile_completeness_score := 0;
        IF talent_record.bio IS NOT NULL THEN profile_completeness_score := profile_completeness_score + 5; END IF;
        IF talent_record.city IS NOT NULL THEN profile_completeness_score := profile_completeness_score + 5; END IF;
        IF talent_record.avatar_url IS NOT NULL THEN profile_completeness_score := profile_completeness_score + 5; END IF;
        IF talent_record.years_experience IS NOT NULL THEN profile_completeness_score := profile_completeness_score + 5; END IF;
        IF talent_record.specializations IS NOT NULL THEN profile_completeness_score := profile_completeness_score + 5; END IF;
        score := score + profile_completeness_score;
        factors := factors || jsonb_build_object('profile_completeness_score', profile_completeness_score);
        
        -- 2. Experience Level (20 points max)
        experience_score := 0;
        IF talent_record.years_experience IS NOT NULL THEN
            -- More experience = higher score
            experience_score := LEAST(talent_record.years_experience * 3, 20);
        END IF;
        score := score + experience_score;
        factors := factors || jsonb_build_object('experience_score', experience_score);
        
        -- 3. Location Compatibility (15 points max)
        location_score := 0;
        IF contributor_profile.city IS NOT NULL AND talent_record.city IS NOT NULL THEN
            -- Same city gets highest score
            IF LOWER(contributor_profile.city) = LOWER(talent_record.city) THEN
                location_score := 15;
            ELSIF talent_record.available_for_travel = true THEN
                -- Talent can travel
                location_score := 10;
            ELSE
                -- Different cities
                location_score := 5;
            END IF;
        END IF;
        score := score + location_score;
        factors := factors || jsonb_build_object('location_score', location_score);
        
        -- 4. Style/Vibe Compatibility (15 points max)
        style_score := 0;
        IF contributor_profile.vibe_tags IS NOT NULL AND talent_record.vibe_tags IS NOT NULL THEN
            -- Count matching vibe tags
            SELECT COUNT(*) INTO style_score
            FROM unnest(contributor_profile.vibe_tags) AS contrib_tag
            WHERE contrib_tag = ANY(talent_record.vibe_tags);
            style_score := LEAST(style_score * 3, 15); -- 3 points per match, max 15
        END IF;
        score := score + style_score;
        factors := factors || jsonb_build_object('style_score', style_score);
        
        -- 5. Availability Compatibility (10 points max)
        availability_score := 0;
        IF talent_record.typical_turnaround_days IS NOT NULL THEN
            -- Faster turnaround = higher score
            IF talent_record.typical_turnaround_days <= 3 THEN
                availability_score := 10;
            ELSIF talent_record.typical_turnaround_days <= 7 THEN
                availability_score := 7;
            ELSE
                availability_score := 5;
            END IF;
        END IF;
        score := score + availability_score;
        factors := factors || jsonb_build_object('availability_score', availability_score);
        
        -- 6. Verification Status (10 points max)
        verification_score := 0;
        IF talent_record.verified_id = true THEN
            verification_score := verification_score + 5;
        END IF;
        IF talent_record.age_verified = true THEN
            verification_score := verification_score + 5;
        END IF;
        score := score + verification_score;
        factors := factors || jsonb_build_object('verification_score', verification_score);
        
        -- Add total score and additional metadata
        factors := factors || jsonb_build_object(
            'total_score', score,
            'talent_experience', talent_record.years_experience,
            'talent_city', talent_record.city,
            'talent_travel', talent_record.available_for_travel,
            'talent_verified', talent_record.verified_id,
            'contributor_city', contributor_profile.city
        );
        
        -- Return the talent user with compatibility data
        user_id := talent_record.id;
        display_name := talent_record.display_name;
        handle := talent_record.handle;
        bio := talent_record.bio;
        city := talent_record.city;
        compatibility_score := score;
        match_factors := factors;
        
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$;


ALTER FUNCTION "public"."find_compatible_users_for_contributor"("p_profile_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Create a deterministic UUID based on gig_id and sorted user IDs
  -- This ensures the same conversation_id for the same participants in the same gig
  RETURN uuid_generate_v5(
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid,
    gig_uuid::text || '|' || LEAST(user1_uuid, user2_uuid)::text || '|' || GREATEST(user1_uuid, user2_uuid)::text
  );
END;
$$;


ALTER FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_marketplace_conversation_context"("p_conversation_id" "uuid") RETURNS TABLE("listing_id" "uuid", "listing_title" "text", "listing_category" "text", "listing_mode" "text", "owner_id" "uuid", "owner_name" "text", "owner_handle" "text", "owner_verified" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.category,
    l.mode,
    l.owner_id,
    up.display_name,
    up.handle,
    up.verified_id
  FROM listings l
  JOIN users_profile up ON up.id = l.owner_id
  WHERE l.id = p_conversation_id;
END;
$$;


ALTER FUNCTION "public"."get_marketplace_conversation_context"("p_conversation_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_marketplace_conversation_context"("p_conversation_id" "uuid") IS 'Gets the listing context for a marketplace conversation';



CREATE OR REPLACE FUNCTION "public"."get_marketplace_conversation_participants"("p_conversation_id" "uuid") RETURNS TABLE("user_id" "uuid", "display_name" "text", "handle" "text", "avatar_url" "text", "verified_id" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    up.id,
    up.display_name,
    up.handle,
    up.avatar_url,
    up.verified_id
  FROM messages m
  JOIN users_profile up ON up.id = m.from_user_id OR up.id = m.to_user_id
  WHERE m.gig_id = p_conversation_id
    AND m.context_type = 'marketplace'
    AND up.id != auth.uid(); -- Exclude current user
END;
$$;


ALTER FUNCTION "public"."get_marketplace_conversation_participants"("p_conversation_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_marketplace_conversation_participants"("p_conversation_id" "uuid") IS 'Gets all participants in a marketplace conversation';



CREATE OR REPLACE FUNCTION "public"."get_request_stats"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_requests', COUNT(*),
    'active_requests', COUNT(*) FILTER (WHERE status = 'active'),
    'fulfilled_requests', COUNT(*) FILTER (WHERE status = 'fulfilled'),
    'total_responses', (
      SELECT COUNT(*) FROM request_responses 
      WHERE responder_id = p_user_id
    ),
    'accepted_responses', (
      SELECT COUNT(*) FROM request_responses 
      WHERE responder_id = p_user_id AND status = 'accepted'
    )
  ) INTO stats
  FROM equipment_requests
  WHERE requester_id = p_user_id;
  
  RETURN COALESCE(stats, '{}'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_request_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_badges"("p_user_id" "uuid") RETURNS TABLE("badge_name" character varying, "badge_slug" character varying, "badge_description" "text", "badge_type" "public"."badge_type", "badge_category" "public"."badge_category", "icon" character varying, "color" character varying, "background_color" character varying, "rarity" character varying, "awarded_at" timestamp with time zone, "is_featured" boolean, "verified_data" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.name,
    b.slug,
    b.description,
    b.type,
    b.category,
    b.icon,
    b.color,
    b.background_color,
    b.rarity,
    ub.awarded_at,
    ub.is_featured,
    ub.verified_data
  FROM user_badges ub
  JOIN badges b ON ub.badge_id = b.id
  WHERE ub.user_id = p_user_id
  AND ub.is_active = true
  AND b.is_active = true
  ORDER BY ub.is_featured DESC, ub.awarded_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_badges"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_subscription_benefits"("p_user_id" "uuid") RETURNS TABLE("benefit_type" character varying, "monthly_limit" integer, "used_this_month" integer, "remaining" integer, "benefit_value" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sb.benefit_type,
        sb.monthly_limit,
        sb.used_this_month,
        GREATEST(0, sb.monthly_limit - sb.used_this_month) as remaining,
        sb.benefit_value
    FROM subscription_benefits sb
    WHERE sb.user_id = p_user_id
    ORDER BY sb.benefit_type;
END;
$$;


ALTER FUNCTION "public"."get_user_subscription_benefits"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_subscription_benefits"("p_user_id" "uuid") IS 'Returns all subscription benefits for a user';



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


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert into public.users with proper type casting
  INSERT INTO public.users (
    id,
    email,
    role,
    subscription_tier,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE')::subscription_tier,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_profile_views"("profile_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE profiles
  SET profile_views = profile_views + 1
  WHERE id = profile_id;
END;
$$;


ALTER FUNCTION "public"."increment_profile_views"("profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_user_credits"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  monthly_allowance INTEGER;
BEGIN
  -- Determine monthly allowance based on subscription tier
  monthly_allowance := CASE 
    WHEN COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE') = 'FREE' THEN 10
    WHEN COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE') = 'PREMIUM' THEN 50
    WHEN COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE') = 'PRO' THEN 100
    ELSE 10
  END;

  -- Insert into user_credits table
  INSERT INTO user_credits (
    user_id,
    subscription_tier,
    monthly_allowance,
    current_balance,
    consumed_this_month,
    last_reset_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE'),
    monthly_allowance,
    monthly_allowance,
    0,
    DATE_TRUNC('month', NOW()),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_user_credits"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."notify_listing_event"("p_listing_id" "uuid", "p_event_type" character varying, "p_recipient_id" "uuid", "p_sender_id" "uuid" DEFAULT NULL::"uuid", "p_custom_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_notification_id UUID;
    v_listing_title TEXT;
    v_sender_name TEXT;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- Get listing title
    SELECT title INTO v_listing_title
    FROM listings
    WHERE id = p_listing_id;

    -- Get sender name if provided
    IF p_sender_id IS NOT NULL THEN
        SELECT display_name INTO v_sender_name
        FROM users_profile
        WHERE user_id = p_sender_id;
    END IF;

    -- Generate title and message based on event type
    CASE p_event_type
        WHEN 'listing_inquiry' THEN
            v_title := 'New inquiry about your listing';
            v_message := COALESCE(p_custom_message, 
                CASE 
                    WHEN v_sender_name IS NOT NULL 
                    THEN v_sender_name || ' is interested in "' || v_listing_title || '"'
                    ELSE 'Someone is interested in "' || v_listing_title || '"'
                END
            );
        WHEN 'offer_received' THEN
            v_title := 'New offer received';
            v_message := COALESCE(p_custom_message,
                CASE 
                    WHEN v_sender_name IS NOT NULL 
                    THEN v_sender_name || ' made an offer on "' || v_listing_title || '"'
                    ELSE 'You received an offer on "' || v_listing_title || '"'
                END
            );
        WHEN 'rental_request' THEN
            v_title := 'Rental request received';
            v_message := COALESCE(p_custom_message,
                CASE 
                    WHEN v_sender_name IS NOT NULL 
                    THEN v_sender_name || ' wants to rent "' || v_listing_title || '"'
                    ELSE 'You received a rental request for "' || v_listing_title || '"'
                END
            );
        WHEN 'sale_request' THEN
            v_title := 'Sale request received';
            v_message := COALESCE(p_custom_message,
                CASE 
                    WHEN v_sender_name IS NOT NULL 
                    THEN v_sender_name || ' wants to buy "' || v_listing_title || '"'
                    ELSE 'You received a sale request for "' || v_listing_title || '"'
                END
            );
        ELSE
            v_title := 'Marketplace update';
            v_message := COALESCE(p_custom_message, 'Update regarding "' || v_listing_title || '"');
    END CASE;

    -- Create notification
    SELECT create_marketplace_notification(
        p_recipient_id,
        p_event_type,
        v_title,
        v_message,
        NULL, -- avatar_url
        '/marketplace/listings/' || p_listing_id, -- action_url
        jsonb_build_object('listing_id', p_listing_id, 'event_type', p_event_type), -- action_data
        p_sender_id,
        p_listing_id,
        NULL, -- rental_order_id
        NULL, -- sale_order_id
        NULL, -- offer_id
        NULL  -- review_id
    ) INTO v_notification_id;

    RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."notify_listing_event"("p_listing_id" "uuid", "p_event_type" character varying, "p_recipient_id" "uuid", "p_sender_id" "uuid", "p_custom_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_listing_event"("p_listing_id" "uuid", "p_event_type" character varying, "p_recipient_id" "uuid", "p_sender_id" "uuid", "p_custom_message" "text") IS 'Creates notifications for listing-related events (inquiries, offers, requests)';



CREATE OR REPLACE FUNCTION "public"."notify_order_event"("p_order_id" "uuid", "p_order_type" character varying, "p_event_type" character varying, "p_recipient_id" "uuid", "p_custom_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_notification_id UUID;
    v_listing_title TEXT;
    v_title TEXT;
    v_message TEXT;
    v_action_url TEXT;
BEGIN
    -- Get listing title from order
    IF p_order_type = 'rental' THEN
        SELECT l.title INTO v_listing_title
        FROM rental_orders ro
        JOIN listings l ON l.id = ro.listing_id
        WHERE ro.id = p_order_id;
        
        v_action_url := '/marketplace/orders?tab=rental';
    ELSE
        SELECT l.title INTO v_listing_title
        FROM sale_orders so
        JOIN listings l ON l.id = so.listing_id
        WHERE so.id = p_order_id;
        
        v_action_url := '/marketplace/orders?tab=sale';
    END IF;

    -- Generate title and message based on event type
    CASE p_event_type
        WHEN 'rental_confirmed', 'sale_confirmed' THEN
            v_title := 'Order confirmed';
            v_message := COALESCE(p_custom_message, 'Your order for "' || v_listing_title || '" has been confirmed');
        WHEN 'rental_cancelled', 'sale_cancelled' THEN
            v_title := 'Order cancelled';
            v_message := COALESCE(p_custom_message, 'Your order for "' || v_listing_title || '" has been cancelled');
        WHEN 'rental_completed', 'sale_completed' THEN
            v_title := 'Order completed';
            v_message := COALESCE(p_custom_message, 'Your order for "' || v_listing_title || '" has been completed');
        WHEN 'payment_received' THEN
            v_title := 'Payment received';
            v_message := COALESCE(p_custom_message, 'Payment received for "' || v_listing_title || '"');
        WHEN 'payment_failed' THEN
            v_title := 'Payment failed';
            v_message := COALESCE(p_custom_message, 'Payment failed for "' || v_listing_title || '"');
        ELSE
            v_title := 'Order update';
            v_message := COALESCE(p_custom_message, 'Update regarding your order for "' || v_listing_title || '"');
    END CASE;

    -- Create notification
    IF p_order_type = 'rental' THEN
        SELECT create_marketplace_notification(
            p_recipient_id,
            p_event_type,
            v_title,
            v_message,
            NULL, -- avatar_url
            v_action_url,
            jsonb_build_object('order_id', p_order_id, 'order_type', p_order_type, 'event_type', p_event_type),
            NULL, -- sender_id
            NULL, -- listing_id
            p_order_id, -- rental_order_id
            NULL, -- sale_order_id
            NULL, -- offer_id
            NULL  -- review_id
        ) INTO v_notification_id;
    ELSE
        SELECT create_marketplace_notification(
            p_recipient_id,
            p_event_type,
            v_title,
            v_message,
            NULL, -- avatar_url
            v_action_url,
            jsonb_build_object('order_id', p_order_id, 'order_type', p_order_type, 'event_type', p_event_type),
            NULL, -- sender_id
            NULL, -- listing_id
            NULL, -- rental_order_id
            p_order_id, -- sale_order_id
            NULL, -- offer_id
            NULL  -- review_id
        ) INTO v_notification_id;
    END IF;

    RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."notify_order_event"("p_order_id" "uuid", "p_order_type" character varying, "p_event_type" character varying, "p_recipient_id" "uuid", "p_custom_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_order_event"("p_order_id" "uuid", "p_order_type" character varying, "p_event_type" character varying, "p_recipient_id" "uuid", "p_custom_message" "text") IS 'Creates notifications for order-related events (confirmations, cancellations, payments)';



CREATE OR REPLACE FUNCTION "public"."refund_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Add credits back to user
  UPDATE user_credits
  SET 
    current_balance = current_balance + p_credits,
    consumed_this_month = GREATEST(consumed_this_month - p_credits, 0),
    lifetime_consumed = GREATEST(lifetime_consumed - p_credits, 0),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log refund transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_used,
    enhancement_type,
    status
  ) VALUES (
    p_user_id,
    'refund',
    p_credits,
    p_enhancement_type,
    'completed'
  );
END;
$$;


ALTER FUNCTION "public"."refund_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."remove_badge"("p_user_id" "uuid", "p_badge_slug" character varying) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE user_badges
  SET is_active = false
  WHERE user_id = p_user_id
  AND badge_id = (SELECT id FROM badges WHERE slug = p_badge_slug)
  AND is_active = true;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."remove_badge"("p_user_id" "uuid", "p_badge_slug" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_monthly_subscription_benefits"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    -- Reset monthly usage for all benefits
    UPDATE subscription_benefits 
    SET 
        used_this_month = 0,
        last_reset_at = DATE_TRUNC('month', NOW()),
        updated_at = NOW()
    WHERE DATE_TRUNC('month', last_reset_at) < DATE_TRUNC('month', NOW());
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    
    RETURN reset_count;
END;
$$;


ALTER FUNCTION "public"."reset_monthly_subscription_benefits"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reset_monthly_subscription_benefits"() IS 'Resets monthly usage counters for subscription benefits';



CREATE OR REPLACE FUNCTION "public"."set_conversation_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Set conversation_id if not provided
  IF NEW.conversation_id IS NULL THEN
    NEW.conversation_id := generate_conversation_id(NEW.gig_id, NEW.from_user_id, NEW.to_user_id);
  END IF;
  
  -- Set updated_at
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_conversation_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_marketplace_review_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Notify the user who received the review
    PERFORM notify_listing_event(
        NEW.id,
        'review_received',
        NEW.subject_user_id,
        NEW.author_id,
        'You received a new review'
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_marketplace_review_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_marketplace_review_response_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Only notify if response was added or updated
    IF (OLD.response IS NULL AND NEW.response IS NOT NULL) OR 
       (OLD.response IS NOT NULL AND NEW.response IS NOT NULL AND OLD.response != NEW.response) THEN
        
        -- Notify the original reviewer about the response
        PERFORM notify_listing_event(
            NEW.id,
            'review_updated',
            NEW.author_id,
            NEW.subject_user_id,
            'Your review received a response'
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_marketplace_review_response_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_offer_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Notify the listing owner about the new offer
    PERFORM notify_listing_event(
        NEW.listing_id,
        'offer_received',
        NEW.to_user,
        NEW.from_user,
        'You received a new offer for your listing'
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_offer_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_offer_response_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Only notify if status changed
    IF OLD.status != NEW.status THEN
        CASE NEW.status
            WHEN 'accepted' THEN
                PERFORM notify_listing_event(
                    NEW.listing_id,
                    'offer_accepted',
                    NEW.from_user,
                    NEW.to_user,
                    'Your offer was accepted!'
                );
            WHEN 'declined' THEN
                PERFORM notify_listing_event(
                    NEW.listing_id,
                    'offer_declined',
                    NEW.from_user,
                    NEW.to_user,
                    'Your offer was declined'
                );
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_offer_response_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_order_status_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Only notify if status changed
    IF OLD.status != NEW.status THEN
        -- Notify both owner and renter/buyer
        PERFORM notify_order_event(
            NEW.id,
            'rental',
            NEW.status,
            NEW.owner_id,
            'Order status updated'
        );
        
        PERFORM notify_order_event(
            NEW.id,
            'rental',
            NEW.status,
            NEW.renter_id,
            'Order status updated'
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_order_status_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_rental_order_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Notify the listing owner about the rental request
    PERFORM notify_listing_event(
        NEW.listing_id,
        'rental_request',
        NEW.owner_id,
        NEW.renter_id,
        'You received a rental request'
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_rental_order_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_sale_order_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Notify the listing owner about the sale request
    PERFORM notify_listing_event(
        NEW.listing_id,
        'sale_request',
        NEW.owner_id,
        NEW.buyer_id,
        'You received a sale request'
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_sale_order_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_cinematic_tags"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.cinematic_tags := extract_cinematic_tags(NEW.ai_metadata);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_cinematic_tags"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_collab_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_collab_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_gig_notification_preferences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_gig_notification_preferences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_listing_enhancement_status"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Update listing when enhancement is created
    IF TG_OP = 'INSERT' THEN
        UPDATE listings 
        SET 
            current_enhancement_type = NEW.enhancement_type,
            enhancement_expires_at = NEW.expires_at,
            premium_badge = (NEW.enhancement_type = 'premium_bump'),
            boost_level = CASE 
                WHEN NEW.enhancement_type = 'premium_bump' THEN 3
                WHEN NEW.enhancement_type = 'priority_bump' THEN 2
                WHEN NEW.enhancement_type = 'basic_bump' THEN 1
                ELSE 0
            END,
            updated_at = NOW()
        WHERE id = NEW.listing_id;
        
        RETURN NEW;
    END IF;
    
    -- Update listing when enhancement expires
    IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'expired' THEN
        UPDATE listings 
        SET 
            current_enhancement_type = NULL,
            enhancement_expires_at = NULL,
            premium_badge = FALSE,
            boost_level = 0,
            updated_at = NOW()
        WHERE id = NEW.listing_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_listing_enhancement_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notification_preferences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notification_preferences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reports_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reports_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_role_status_on_acceptance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    role_headcount INTEGER;
    current_filled INTEGER;
BEGIN
    -- Only process when status changes to 'accepted'
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        -- Get role headcount
        SELECT headcount INTO role_headcount
        FROM collab_roles
        WHERE id = NEW.role_id;
        
        -- Count current filled positions
        SELECT COUNT(*) INTO current_filled
        FROM collab_applications
        WHERE role_id = NEW.role_id AND status = 'accepted';
        
        -- Update role status if filled
        IF current_filled >= role_headcount THEN
            UPDATE collab_roles
            SET status = 'filled'
            WHERE id = NEW.role_id;
        END IF;
        
        -- Add user as participant
        INSERT INTO collab_participants (project_id, user_id, role_type, role_id, status)
        VALUES (NEW.project_id, NEW.applicant_id, 'collaborator', NEW.role_id, 'active')
        ON CONFLICT (project_id, user_id) DO UPDATE SET
            role_type = 'collaborator',
            role_id = NEW.role_id,
            status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_role_status_on_acceptance"() OWNER TO "postgres";


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


COMMENT ON TABLE "public"."user_credits" IS 'User credit balance and usage tracking';



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


CREATE OR REPLACE FUNCTION "public"."validate_review_order_reference"("p_order_type" "text", "p_order_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF p_order_type = 'rent' THEN
        RETURN EXISTS (SELECT 1 FROM rental_orders WHERE id = p_order_id);
    ELSIF p_order_type = 'sale' THEN
        RETURN EXISTS (SELECT 1 FROM sale_orders WHERE id = p_order_id);
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;


ALTER FUNCTION "public"."validate_review_order_reference"("p_order_type" "text", "p_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_user_age"("p_user_id" "uuid", "p_date_of_birth" "date", "p_method" "text" DEFAULT 'manual'::"text", "p_verified_by" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_age INTEGER;
  v_success BOOLEAN;
BEGIN
  -- Calculate age
  v_age := DATE_PART('year', AGE(CURRENT_DATE, p_date_of_birth))::INTEGER;
  
  -- Check if user is 18 or older
  IF v_age >= 18 THEN
    -- Update user profile
    UPDATE users_profile
    SET 
      date_of_birth = p_date_of_birth,
      age_verified = TRUE,
      age_verified_at = NOW(),
      verification_method = p_method,
      account_status = 'active'
    WHERE user_id = p_user_id;
    
    v_success := TRUE;
  ELSE
    -- User is under 18, suspend account
    UPDATE users_profile
    SET 
      date_of_birth = p_date_of_birth,
      age_verified = FALSE,
      verification_method = p_method,
      account_status = 'suspended'
    WHERE user_id = p_user_id;
    
    v_success := FALSE;
  END IF;
  
  -- Log the verification attempt
  INSERT INTO age_verification_logs (
    user_id,
    verification_type,
    verification_method,
    verified_by,
    success,
    failure_reason
  ) VALUES (
    p_user_id,
    'age',
    p_method,
    p_verified_by,
    v_success,
    CASE WHEN NOT v_success THEN 'User is under 18 years old' ELSE NULL END
  );
  
  -- Increment verification attempts
  UPDATE users_profile
  SET verification_attempts = COALESCE(verification_attempts, 0) + 1
  WHERE user_id = p_user_id;
  
  RETURN v_success;
END;
$$;


ALTER FUNCTION "public"."verify_user_age"("p_user_id" "uuid", "p_date_of_birth" "date", "p_method" "text", "p_verified_by" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."age_verification_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "verification_type" "text" NOT NULL,
    "verification_method" "text" NOT NULL,
    "verified_by" "uuid",
    "verification_data" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "success" boolean NOT NULL,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "age_verification_logs_verification_type_check" CHECK (("verification_type" = ANY (ARRAY['age'::"text", 'email'::"text", 'identity'::"text", 'professional'::"text"])))
);


ALTER TABLE "public"."age_verification_logs" OWNER TO "postgres";


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
    "header_banner_url" "text",
    "header_banner_position" "text" DEFAULT '{"y":0,"scale":1}'::"text",
    "vibe_tags" "text"[] DEFAULT '{}'::"text"[],
    "country" character varying(255),
    "age_verified" boolean DEFAULT false,
    "account_status" character varying(50) DEFAULT 'pending_verification'::character varying,
    "instagram_handle" character varying(255),
    "tiktok_handle" character varying(255),
    "website_url" "text",
    "portfolio_url" "text",
    "phone_number" character varying(20),
    "years_experience" integer DEFAULT 0,
    "specializations" "text"[] DEFAULT '{}'::"text"[],
    "equipment_list" "text"[] DEFAULT '{}'::"text"[],
    "editing_software" "text"[] DEFAULT '{}'::"text"[],
    "languages" "text"[] DEFAULT '{}'::"text"[],
    "hourly_rate_min" numeric(10,2),
    "hourly_rate_max" numeric(10,2),
    "available_for_travel" boolean DEFAULT false,
    "travel_radius_km" integer DEFAULT 50,
    "studio_name" character varying(255),
    "has_studio" boolean DEFAULT false,
    "studio_address" "text",
    "typical_turnaround_days" integer,
    "height_cm" integer,
    "measurements" "text",
    "eye_color" character varying(50),
    "hair_color" character varying(50),
    "shoe_size" character varying(10),
    "clothing_sizes" "text",
    "tattoos" boolean DEFAULT false,
    "piercings" boolean DEFAULT false,
    "talent_categories" "text"[] DEFAULT '{}'::"text"[],
    "date_of_birth" "date",
    "age_verified_at" timestamp with time zone,
    "verification_method" "text",
    "verification_attempts" integer DEFAULT 0,
    "first_name" character varying(100),
    "last_name" character varying(100),
    CONSTRAINT "check_account_status_valid" CHECK ((("account_status")::"text" = ANY ((ARRAY['pending_verification'::character varying, 'active'::character varying, 'suspended'::character varying, 'banned'::character varying])::"text"[]))),
    CONSTRAINT "check_height_positive" CHECK ((("height_cm" IS NULL) OR ("height_cm" > 0))),
    CONSTRAINT "check_hourly_rate_valid" CHECK ((("hourly_rate_min" IS NULL) OR ("hourly_rate_max" IS NULL) OR ("hourly_rate_min" <= "hourly_rate_max"))),
    CONSTRAINT "check_travel_radius_positive" CHECK (("travel_radius_km" >= 0)),
    CONSTRAINT "check_turnaround_days_positive" CHECK ((("typical_turnaround_days" IS NULL) OR ("typical_turnaround_days" > 0))),
    CONSTRAINT "check_years_experience_positive" CHECK (("years_experience" >= 0)),
    CONSTRAINT "handle_format" CHECK ((("handle")::"text" ~ '^[a-z0-9_]+$'::"text")),
    CONSTRAINT "users_profile_verification_method_check" CHECK (("verification_method" = ANY (ARRAY['self_attestation'::"text", 'document_upload'::"text", 'third_party'::"text", 'admin_override'::"text"])))
);


ALTER TABLE "public"."users_profile" OWNER TO "postgres";


COMMENT ON TABLE "public"."users_profile" IS 'Main user profiles with display information and preferences';



COMMENT ON COLUMN "public"."users_profile"."header_banner_position" IS 'JSON string containing y position (pixels) and scale (1.0 = normal) for header banner positioning';



COMMENT ON COLUMN "public"."users_profile"."vibe_tags" IS 'Array of vibe tags selected by the user (e.g., calm, energetic, creative)';



COMMENT ON COLUMN "public"."users_profile"."country" IS 'User country for location-based matching';



COMMENT ON COLUMN "public"."users_profile"."age_verified" IS 'Whether user age has been verified by admin';



COMMENT ON COLUMN "public"."users_profile"."account_status" IS 'Current status of the user account';



COMMENT ON COLUMN "public"."users_profile"."instagram_handle" IS 'Instagram username for social verification';



COMMENT ON COLUMN "public"."users_profile"."tiktok_handle" IS 'TikTok username for social verification';



COMMENT ON COLUMN "public"."users_profile"."website_url" IS 'Personal or business website URL';



COMMENT ON COLUMN "public"."users_profile"."portfolio_url" IS 'Portfolio website URL';



COMMENT ON COLUMN "public"."users_profile"."phone_number" IS 'Contact phone number';



COMMENT ON COLUMN "public"."users_profile"."years_experience" IS 'Years of experience in creative field';



COMMENT ON COLUMN "public"."users_profile"."specializations" IS 'Array of specializations/skills';



COMMENT ON COLUMN "public"."users_profile"."equipment_list" IS 'Array of equipment owned';



COMMENT ON COLUMN "public"."users_profile"."editing_software" IS 'Array of editing software proficiency';



COMMENT ON COLUMN "public"."users_profile"."languages" IS 'Array of languages spoken';



COMMENT ON COLUMN "public"."users_profile"."hourly_rate_min" IS 'Minimum hourly rate for services';



COMMENT ON COLUMN "public"."users_profile"."hourly_rate_max" IS 'Maximum hourly rate for services';



COMMENT ON COLUMN "public"."users_profile"."available_for_travel" IS 'Whether available for travel shoots';



COMMENT ON COLUMN "public"."users_profile"."travel_radius_km" IS 'Maximum travel radius in kilometers';



COMMENT ON COLUMN "public"."users_profile"."studio_name" IS 'Name of studio if applicable';



COMMENT ON COLUMN "public"."users_profile"."has_studio" IS 'Whether user has access to a studio';



COMMENT ON COLUMN "public"."users_profile"."studio_address" IS 'Address of studio if applicable';



COMMENT ON COLUMN "public"."users_profile"."typical_turnaround_days" IS 'Typical turnaround time for deliverables';



COMMENT ON COLUMN "public"."users_profile"."height_cm" IS 'Height in centimeters (for talent)';



COMMENT ON COLUMN "public"."users_profile"."measurements" IS 'Body measurements (for talent)';



COMMENT ON COLUMN "public"."users_profile"."eye_color" IS 'Eye color (for talent)';



COMMENT ON COLUMN "public"."users_profile"."hair_color" IS 'Hair color (for talent)';



COMMENT ON COLUMN "public"."users_profile"."shoe_size" IS 'Shoe size (for talent)';



COMMENT ON COLUMN "public"."users_profile"."clothing_sizes" IS 'Clothing sizes (for talent)';



COMMENT ON COLUMN "public"."users_profile"."tattoos" IS 'Whether user has visible tattoos';



COMMENT ON COLUMN "public"."users_profile"."piercings" IS 'Whether user has visible piercings';



COMMENT ON COLUMN "public"."users_profile"."talent_categories" IS 'Array of talent categories (model, actor, etc.)';



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
    CONSTRAINT "verification_badges_badge_type_check" CHECK (("badge_type" = ANY (ARRAY['verified_age'::"text", 'verified_email'::"text", 'verified_identity'::"text", 'verified_professional'::"text", 'verified_business'::"text"])))
);


ALTER TABLE "public"."verification_badges" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_age_verification_queue" AS
 SELECT "up"."user_id",
    "up"."display_name",
    "up"."handle",
    "au"."email",
    "up"."date_of_birth",
    "public"."calculate_age"("up"."date_of_birth") AS "calculated_age",
    "up"."age_verified",
    "up"."age_verified_at",
    "up"."account_status",
    "up"."verification_method",
    "up"."created_at",
    ( SELECT "count"(*) AS "count"
           FROM "public"."age_verification_logs"
          WHERE (("age_verification_logs"."user_id" = "up"."user_id") AND ("age_verification_logs"."verification_type" = 'age'::"text"))) AS "verification_attempts",
    ( SELECT "jsonb_agg"("jsonb_build_object"('type', "verification_badges"."badge_type", 'issued_at', "verification_badges"."issued_at")) AS "jsonb_agg"
           FROM "public"."verification_badges"
          WHERE (("verification_badges"."user_id" = "up"."user_id") AND ("verification_badges"."revoked_at" IS NULL))) AS "active_badges"
   FROM ("public"."users_profile" "up"
     LEFT JOIN "auth"."users" "au" ON (("up"."user_id" = "au"."id")))
  WHERE ("up"."date_of_birth" IS NOT NULL)
  ORDER BY
        CASE
            WHEN (("up"."account_status")::"text" = 'pending_verification'::"text") THEN 1
            WHEN (("up"."account_status")::"text" = 'suspended'::"text") THEN 2
            ELSE 3
        END, "up"."created_at" DESC;


ALTER VIEW "public"."admin_age_verification_queue" OWNER TO "postgres";


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


COMMENT ON TABLE "public"."reports" IS 'Content and user reports for moderation';



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


COMMENT ON TABLE "public"."applications" IS 'User applications to gigs';



CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "description" "text",
    "type" "public"."badge_type" NOT NULL,
    "category" "public"."badge_category" NOT NULL,
    "icon" character varying(50),
    "color" character varying(20),
    "background_color" character varying(20),
    "is_active" boolean DEFAULT true,
    "is_automatic" boolean DEFAULT false,
    "requires_approval" boolean DEFAULT false,
    "rarity" character varying(20) DEFAULT 'common'::character varying,
    "points" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collab_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "role_id" "uuid",
    "applicant_id" "uuid" NOT NULL,
    "application_type" "text" NOT NULL,
    "message" "text",
    "portfolio_url" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "collab_applications_application_type_check" CHECK (("application_type" = ANY (ARRAY['role'::"text", 'general'::"text"]))),
    CONSTRAINT "collab_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'withdrawn'::"text"]))),
    CONSTRAINT "valid_application" CHECK (((("application_type" = 'role'::"text") AND ("role_id" IS NOT NULL)) OR (("application_type" = 'general'::"text") AND ("role_id" IS NULL))))
);


ALTER TABLE "public"."collab_applications" OWNER TO "postgres";


COMMENT ON TABLE "public"."collab_applications" IS 'Applications for project roles';



COMMENT ON COLUMN "public"."collab_applications"."application_type" IS 'Type of application: role-specific or general interest';



CREATE TABLE IF NOT EXISTS "public"."collab_gear_offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "gear_request_id" "uuid",
    "offerer_id" "uuid" NOT NULL,
    "listing_id" "uuid",
    "offer_type" "text" NOT NULL,
    "daily_rate_cents" integer,
    "total_price_cents" integer,
    "message" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "collab_gear_offers_offer_type_check" CHECK (("offer_type" = ANY (ARRAY['rent'::"text", 'sell'::"text", 'borrow'::"text"]))),
    CONSTRAINT "collab_gear_offers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'withdrawn'::"text"]))),
    CONSTRAINT "valid_gear_offer" CHECK (((("offer_type" = ANY (ARRAY['rent'::"text", 'borrow'::"text"])) AND ("daily_rate_cents" IS NOT NULL) AND ("daily_rate_cents" > 0)) OR (("offer_type" = 'sell'::"text") AND ("total_price_cents" IS NOT NULL) AND ("total_price_cents" > 0))))
);


ALTER TABLE "public"."collab_gear_offers" OWNER TO "postgres";


COMMENT ON TABLE "public"."collab_gear_offers" IS 'Offers to provide equipment for projects';



CREATE TABLE IF NOT EXISTS "public"."collab_gear_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "equipment_spec" "text",
    "quantity" integer DEFAULT 1,
    "borrow_preferred" boolean DEFAULT true,
    "retainer_acceptable" boolean DEFAULT false,
    "max_daily_rate_cents" integer,
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "collab_gear_requests_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'fulfilled'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_quantity" CHECK (("quantity" > 0)),
    CONSTRAINT "valid_rate" CHECK ((("max_daily_rate_cents" IS NULL) OR ("max_daily_rate_cents" > 0)))
);


ALTER TABLE "public"."collab_gear_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."collab_gear_requests" IS 'Equipment requests for projects';



COMMENT ON COLUMN "public"."collab_gear_requests"."borrow_preferred" IS 'Whether borrowing is preferred over renting';



CREATE TABLE IF NOT EXISTS "public"."collab_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_type" "text" NOT NULL,
    "role_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "collab_participants_role_type_check" CHECK (("role_type" = ANY (ARRAY['creator'::"text", 'collaborator'::"text", 'equipment_provider'::"text"]))),
    CONSTRAINT "collab_participants_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'left'::"text"]))),
    CONSTRAINT "valid_role_assignment" CHECK ((("role_type" = 'creator'::"text") OR (("role_type" = 'collaborator'::"text") AND ("role_id" IS NOT NULL)) OR ("role_type" = 'equipment_provider'::"text")))
);


ALTER TABLE "public"."collab_participants" OWNER TO "postgres";


COMMENT ON TABLE "public"."collab_participants" IS 'Users involved in projects';



CREATE TABLE IF NOT EXISTS "public"."collab_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "synopsis" "text",
    "city" "text",
    "country" "text",
    "start_date" "date",
    "end_date" "date",
    "visibility" "text" DEFAULT 'public'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "moodboard_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "collab_projects_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "collab_projects_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text", 'invite_only'::"text"]))),
    CONSTRAINT "valid_project_dates" CHECK (((("start_date" IS NULL) AND ("end_date" IS NULL)) OR (("start_date" IS NOT NULL) AND ("end_date" IS NOT NULL) AND ("end_date" >= "start_date"))))
);


ALTER TABLE "public"."collab_projects" OWNER TO "postgres";


COMMENT ON TABLE "public"."collab_projects" IS 'Project-based collaboration system for creators';



COMMENT ON COLUMN "public"."collab_projects"."visibility" IS 'Project visibility: public, private, or invite_only';



COMMENT ON COLUMN "public"."collab_projects"."status" IS 'Project status: draft, published, in_progress, completed, cancelled';



CREATE TABLE IF NOT EXISTS "public"."collab_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "role_name" "text" NOT NULL,
    "skills_required" "text"[],
    "is_paid" boolean DEFAULT false,
    "compensation_details" "text",
    "headcount" integer DEFAULT 1,
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "collab_roles_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'filled'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_headcount" CHECK (("headcount" > 0))
);


ALTER TABLE "public"."collab_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."collab_roles" IS 'Roles needed for projects (photographer, model, etc.)';



COMMENT ON COLUMN "public"."collab_roles"."skills_required" IS 'Array of required skills for the role';



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


CREATE TABLE IF NOT EXISTS "public"."enhancement_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "moodboard_id" "uuid",
    "input_image_url" "text" NOT NULL,
    "enhancement_type" character varying(50) NOT NULL,
    "prompt" "text" NOT NULL,
    "strength" numeric(3,2) DEFAULT 0.8,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "provider" character varying(50) DEFAULT 'nanobanan'::character varying,
    "api_task_id" character varying(100),
    "result_url" "text",
    "cost_usd" numeric(8,4),
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."enhancement_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equipment_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "equipment_type" "text",
    "condition_preference" "text",
    "request_type" "text" DEFAULT 'rent'::"text" NOT NULL,
    "rental_start_date" "date",
    "rental_end_date" "date",
    "max_daily_rate_cents" integer,
    "max_total_cents" integer,
    "max_purchase_price_cents" integer,
    "location_city" "text",
    "location_country" "text",
    "latitude" double precision,
    "longitude" double precision,
    "pickup_preferred" boolean DEFAULT true,
    "delivery_acceptable" boolean DEFAULT false,
    "max_distance_km" integer DEFAULT 50,
    "verified_users_only" boolean DEFAULT false,
    "min_rating" numeric(3,2) DEFAULT 0.0,
    "urgent" boolean DEFAULT false,
    "status" "text" DEFAULT 'active'::"text",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "equipment_requests_condition_preference_check" CHECK (("condition_preference" = ANY (ARRAY['any'::"text", 'new'::"text", 'like_new'::"text", 'used'::"text", 'fair'::"text"]))),
    CONSTRAINT "equipment_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['rent'::"text", 'buy'::"text", 'both'::"text"]))),
    CONSTRAINT "equipment_requests_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'fulfilled'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."equipment_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."equipment_requests" IS 'Equipment requests posted by users looking for specific gear';



COMMENT ON COLUMN "public"."equipment_requests"."condition_preference" IS 'Preferred condition of equipment (any, new, like_new, used, fair)';



COMMENT ON COLUMN "public"."equipment_requests"."request_type" IS 'Type of request: rent, buy, or both';



COMMENT ON COLUMN "public"."equipment_requests"."urgent" IS 'Whether this is an urgent request that should be prioritized';



CREATE TABLE IF NOT EXISTS "public"."gig_notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "location_radius" integer DEFAULT 25,
    "min_budget" numeric(10,2),
    "max_budget" numeric(10,2),
    "preferred_purposes" "text"[] DEFAULT '{}'::"text"[],
    "preferred_vibes" "text"[] DEFAULT '{}'::"text"[],
    "preferred_styles" "text"[] DEFAULT '{}'::"text"[],
    "notify_on_match" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "gig_notification_preferences_location_radius_check" CHECK ((("location_radius" >= 5) AND ("location_radius" <= 100)))
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
    "city" character varying(255),
    "country" character varying(100),
    "style_tags" "text"[] DEFAULT '{}'::"text"[],
    "vibe_tags" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "valid_boost" CHECK (("boost_level" >= 0)),
    CONSTRAINT "valid_deadline" CHECK (("application_deadline" <= "start_time")),
    CONSTRAINT "valid_time_range" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."gigs" OWNER TO "postgres";


COMMENT ON TABLE "public"."gigs" IS 'Photography gig postings and opportunities';



COMMENT ON COLUMN "public"."gigs"."purpose" IS 'The purpose/category of the photography shoot';



CREATE TABLE IF NOT EXISTS "public"."listing_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "kind" "text" NOT NULL,
    "ref_order_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "listing_availability_kind_check" CHECK (("kind" = ANY (ARRAY['blackout'::"text", 'reserved'::"text"]))),
    CONSTRAINT "valid_date_range" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "valid_reservation" CHECK (((("kind" = 'blackout'::"text") AND ("ref_order_id" IS NULL)) OR (("kind" = 'reserved'::"text") AND ("ref_order_id" IS NOT NULL))))
);


ALTER TABLE "public"."listing_availability" OWNER TO "postgres";


COMMENT ON TABLE "public"."listing_availability" IS 'Availability blocks and reservations for listings';



CREATE TABLE IF NOT EXISTS "public"."listing_enhancements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "enhancement_type" character varying(20) NOT NULL,
    "payment_intent_id" character varying(255),
    "amount_cents" integer DEFAULT 0 NOT NULL,
    "duration_days" integer NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "listing_enhancements_enhancement_type_check" CHECK ((("enhancement_type")::"text" = ANY ((ARRAY['basic_bump'::character varying, 'priority_bump'::character varying, 'premium_bump'::character varying])::"text"[]))),
    CONSTRAINT "listing_enhancements_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'expired'::character varying, 'cancelled'::character varying])::"text"[]))),
    CONSTRAINT "valid_amount" CHECK (("amount_cents" >= 0)),
    CONSTRAINT "valid_date_range" CHECK (("expires_at" > "starts_at")),
    CONSTRAINT "valid_duration" CHECK (("duration_days" > 0))
);


ALTER TABLE "public"."listing_enhancements" OWNER TO "postgres";


COMMENT ON TABLE "public"."listing_enhancements" IS 'Tracks marketplace listing enhancements (bumps) with payment and expiration data';



COMMENT ON COLUMN "public"."listing_enhancements"."enhancement_type" IS 'Type of enhancement: basic_bump, priority_bump, or premium_bump';



COMMENT ON COLUMN "public"."listing_enhancements"."payment_intent_id" IS 'Stripe payment intent ID for paid enhancements';



COMMENT ON COLUMN "public"."listing_enhancements"."amount_cents" IS 'Amount paid in cents (0 for subscription benefits)';



COMMENT ON COLUMN "public"."listing_enhancements"."duration_days" IS 'How many days the enhancement lasts';



CREATE TABLE IF NOT EXISTS "public"."listing_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "path" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "alt_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."listing_images" OWNER TO "postgres";


COMMENT ON TABLE "public"."listing_images" IS 'Images associated with listings';



CREATE TABLE IF NOT EXISTS "public"."listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "condition" "text" DEFAULT 'good'::"text",
    "mode" "text" DEFAULT 'rent'::"text" NOT NULL,
    "rent_day_cents" integer,
    "rent_week_cents" integer,
    "sale_price_cents" integer,
    "retainer_mode" "text" DEFAULT 'none'::"text" NOT NULL,
    "retainer_cents" integer DEFAULT 0,
    "deposit_cents" integer DEFAULT 0,
    "borrow_ok" boolean DEFAULT false NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "location_city" "text",
    "location_country" "text",
    "latitude" double precision,
    "longitude" double precision,
    "verified_only" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "current_enhancement_type" character varying(20),
    "enhancement_expires_at" timestamp with time zone,
    "boost_level" integer DEFAULT 0,
    "premium_badge" boolean DEFAULT false,
    "verified_badge" boolean DEFAULT false,
    CONSTRAINT "listings_condition_check" CHECK (("condition" = ANY (ARRAY['new'::"text", 'like_new'::"text", 'good'::"text", 'fair'::"text", 'poor'::"text"]))),
    CONSTRAINT "listings_mode_check" CHECK (("mode" = ANY (ARRAY['rent'::"text", 'sale'::"text", 'both'::"text"]))),
    CONSTRAINT "listings_retainer_mode_check" CHECK (("retainer_mode" = ANY (ARRAY['none'::"text", 'credit_hold'::"text", 'card_hold'::"text"]))),
    CONSTRAINT "listings_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'archived'::"text"]))),
    CONSTRAINT "valid_boost_level" CHECK ((("boost_level" >= 0) AND ("boost_level" <= 3))),
    CONSTRAINT "valid_enhancement_type" CHECK ((("current_enhancement_type" IS NULL) OR (("current_enhancement_type")::"text" = ANY ((ARRAY['basic_bump'::character varying, 'priority_bump'::character varying, 'premium_bump'::character varying])::"text"[])))),
    CONSTRAINT "valid_location" CHECK (((("latitude" IS NULL) AND ("longitude" IS NULL)) OR (("latitude" IS NOT NULL) AND ("longitude" IS NOT NULL)))),
    CONSTRAINT "valid_rent_pricing" CHECK (((("mode" = ANY (ARRAY['rent'::"text", 'both'::"text"])) AND ("rent_day_cents" IS NOT NULL) AND ("rent_day_cents" > 0)) OR ("mode" = 'sale'::"text"))),
    CONSTRAINT "valid_sale_pricing" CHECK (((("mode" = ANY (ARRAY['sale'::"text", 'both'::"text"])) AND ("sale_price_cents" IS NOT NULL) AND ("sale_price_cents" > 0)) OR ("mode" = 'rent'::"text")))
);


ALTER TABLE "public"."listings" OWNER TO "postgres";


COMMENT ON TABLE "public"."listings" IS 'Equipment listings for rent and/or sale';



COMMENT ON COLUMN "public"."listings"."mode" IS 'Whether listing is for rent, sale, or both';



COMMENT ON COLUMN "public"."listings"."retainer_mode" IS 'Type of retainer hold: none, credit_hold, or card_hold';



COMMENT ON COLUMN "public"."listings"."borrow_ok" IS 'Whether item can be borrowed without retainer';



COMMENT ON COLUMN "public"."listings"."verified_only" IS 'Whether only verified users can book this listing';



COMMENT ON COLUMN "public"."listings"."current_enhancement_type" IS 'Currently active enhancement type';



COMMENT ON COLUMN "public"."listings"."enhancement_expires_at" IS 'When the current enhancement expires';



COMMENT ON COLUMN "public"."listings"."boost_level" IS 'Boost level: 0=none, 1=basic, 2=priority, 3=premium';



COMMENT ON COLUMN "public"."listings"."premium_badge" IS 'Whether listing has premium badge';



COMMENT ON COLUMN "public"."listings"."verified_badge" IS 'Whether listing owner is verified';



CREATE TABLE IF NOT EXISTS "public"."marketplace_disputes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_type" "text" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "reported_user_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "resolution" "text",
    "resolved_by" "uuid",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "different_users" CHECK (("reporter_id" <> "reported_user_id")),
    CONSTRAINT "marketplace_disputes_order_type_check" CHECK (("order_type" = ANY (ARRAY['rent'::"text", 'sale'::"text"]))),
    CONSTRAINT "marketplace_disputes_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'investigating'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."marketplace_disputes" OWNER TO "postgres";


COMMENT ON TABLE "public"."marketplace_disputes" IS 'Dispute tracking for marketplace transactions';



CREATE TABLE IF NOT EXISTS "public"."marketplace_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_type" "text" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "subject_user_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "response" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "different_users" CHECK (("author_id" <> "subject_user_id")),
    CONSTRAINT "marketplace_reviews_order_type_check" CHECK (("order_type" = ANY (ARRAY['rent'::"text", 'sale'::"text"]))),
    CONSTRAINT "marketplace_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."marketplace_reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."marketplace_reviews" IS 'Reviews for marketplace transactions';



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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "ai_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "cinematic_tags" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."media" OWNER TO "postgres";


COMMENT ON TABLE "public"."media" IS 'Media files and metadata';



COMMENT ON COLUMN "public"."media"."ai_metadata" IS 'JSONB field storing cinematic parameters and AI generation metadata including camera angle, lens type, lighting style, director style, etc.';



COMMENT ON COLUMN "public"."media"."cinematic_tags" IS 'Automatically generated tags from ai_metadata for efficient querying';



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "from_user_id" "uuid" NOT NULL,
    "to_user_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    "listing_id" "uuid",
    "rental_order_id" "uuid",
    "sale_order_id" "uuid",
    "offer_id" "uuid",
    "context_type" "text" DEFAULT 'gig'::"text",
    "conversation_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" character varying(50) DEFAULT 'sent'::character varying,
    CONSTRAINT "messages_context_type_check" CHECK (("context_type" = ANY (ARRAY['gig'::"text", 'marketplace'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."messages" IS 'Direct messaging between users';



COMMENT ON COLUMN "public"."messages"."listing_id" IS 'References the marketplace listing for marketplace conversations';



COMMENT ON COLUMN "public"."messages"."rental_order_id" IS 'References the rental order for order-specific conversations';



COMMENT ON COLUMN "public"."messages"."sale_order_id" IS 'References the sale order for order-specific conversations';



COMMENT ON COLUMN "public"."messages"."offer_id" IS 'References the offer for offer-specific conversations';



COMMENT ON COLUMN "public"."messages"."context_type" IS 'Type of conversation: gig (existing) or marketplace (new)';



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
    "ai_analyzed_at" timestamp with time zone,
    "vibe_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    CONSTRAINT "check_moodboard_vibe_limit" CHECK ((("array_length"("vibe_ids", 1) IS NULL) OR ("array_length"("vibe_ids", 1) <= 5)))
);


ALTER TABLE "public"."moodboards" OWNER TO "postgres";


COMMENT ON TABLE "public"."moodboards" IS 'Gig mood boards and inspiration collections';



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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "related_listing_id" "uuid",
    "related_rental_order_id" "uuid",
    "related_sale_order_id" "uuid",
    "related_offer_id" "uuid",
    "related_review_id" "uuid"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Core notifications table storing all platform notifications with rich content support and delivery tracking';



COMMENT ON COLUMN "public"."notifications"."type" IS 'Specific notification type (e.g., gig_published, application_received, talent_booked)';



COMMENT ON COLUMN "public"."notifications"."category" IS 'Broad notification category for filtering (gig, application, message, system)';



COMMENT ON COLUMN "public"."notifications"."action_data" IS 'Flexible JSON data for notification actions and context';



COMMENT ON COLUMN "public"."notifications"."scheduled_for" IS 'When the notification should be delivered (enables scheduled notifications)';



COMMENT ON COLUMN "public"."notifications"."related_listing_id" IS 'References marketplace listing for listing-related notifications';



COMMENT ON COLUMN "public"."notifications"."related_rental_order_id" IS 'References rental order for order-related notifications';



COMMENT ON COLUMN "public"."notifications"."related_sale_order_id" IS 'References sale order for order-related notifications';



COMMENT ON COLUMN "public"."notifications"."related_offer_id" IS 'References offer for offer-related notifications';



COMMENT ON COLUMN "public"."notifications"."related_review_id" IS 'References marketplace review for review-related notifications';



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
    "digest_frequency" "text" DEFAULT 'real-time'::"text",
    "timezone" "text" DEFAULT 'UTC'::"text",
    "badge_count_enabled" boolean DEFAULT true,
    "sound_enabled" boolean DEFAULT true,
    "vibration_enabled" boolean DEFAULT true,
    "marketplace_notifications" boolean DEFAULT true,
    "listing_notifications" boolean DEFAULT true,
    "offer_notifications" boolean DEFAULT true,
    "order_notifications" boolean DEFAULT true,
    "payment_notifications" boolean DEFAULT true,
    "review_notifications" boolean DEFAULT true,
    "dispute_notifications" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notification_preferences_digest_frequency_check" CHECK (("digest_frequency" = ANY (ARRAY['real-time'::"text", 'daily'::"text", 'weekly'::"text", 'never'::"text"])))
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "from_user" "uuid" NOT NULL,
    "to_user" "uuid" NOT NULL,
    "context" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "different_users" CHECK (("from_user" <> "to_user")),
    CONSTRAINT "offers_context_check" CHECK (("context" = ANY (ARRAY['rent'::"text", 'sale'::"text"]))),
    CONSTRAINT "offers_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'countered'::"text", 'accepted'::"text", 'declined'::"text", 'expired'::"text"]))),
    CONSTRAINT "valid_payload" CHECK (("payload" ? 'price_cents'::"text"))
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


COMMENT ON TABLE "public"."offers" IS 'Price/terms negotiation offers';



COMMENT ON COLUMN "public"."offers"."status" IS 'Current status of offer negotiation';



CREATE TABLE IF NOT EXISTS "public"."preset_usage_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preset_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "usage_type" character varying(50) NOT NULL,
    "context_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."preset_usage_log" OWNER TO "postgres";


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


COMMENT ON TABLE "public"."profiles" IS 'Alternative profile structure for compatibility';



COMMENT ON COLUMN "public"."profiles"."handle" IS 'Unique username for profile URL (lowercase, alphanumeric, underscore)';



COMMENT ON COLUMN "public"."profiles"."style_tags" IS 'Array of style/aesthetic tags for matching';



COMMENT ON COLUMN "public"."profiles"."showcase_ids" IS 'Array of showcase IDs linked to this profile';



CREATE TABLE IF NOT EXISTS "public"."rental_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "renter_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "day_rate_cents" integer NOT NULL,
    "calculated_total_cents" integer NOT NULL,
    "retainer_mode" "text" NOT NULL,
    "retainer_cents" integer DEFAULT 0 NOT NULL,
    "deposit_cents" integer DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "credits_tx_id" "uuid",
    "stripe_pi_id" "text",
    "pickup_location" "text",
    "return_location" "text",
    "special_instructions" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "different_users" CHECK (("owner_id" <> "renter_id")),
    CONSTRAINT "rental_orders_status_check" CHECK (("status" = ANY (ARRAY['requested'::"text", 'accepted'::"text", 'rejected'::"text", 'paid'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text", 'refunded'::"text", 'disputed'::"text"]))),
    CONSTRAINT "valid_rental_amounts" CHECK ((("day_rate_cents" > 0) AND ("calculated_total_cents" > 0) AND ("retainer_cents" >= 0) AND ("deposit_cents" >= 0))),
    CONSTRAINT "valid_rental_dates" CHECK (("end_date" > "start_date"))
);


ALTER TABLE "public"."rental_orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."rental_orders" IS 'Rental transactions and bookings';



COMMENT ON COLUMN "public"."rental_orders"."status" IS 'Current status of rental transaction';



CREATE TABLE IF NOT EXISTS "public"."request_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "responder_id" "uuid" NOT NULL,
    "response_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "request_conversations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'closed'::"text", 'converted_to_order'::"text"])))
);


ALTER TABLE "public"."request_conversations" OWNER TO "postgres";


COMMENT ON TABLE "public"."request_conversations" IS 'Conversations between requesters and responders';



CREATE TABLE IF NOT EXISTS "public"."request_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "responder_id" "uuid" NOT NULL,
    "listing_id" "uuid",
    "response_type" "text" DEFAULT 'offer'::"text" NOT NULL,
    "message" "text",
    "offered_price_cents" integer,
    "offered_daily_rate_cents" integer,
    "offered_total_cents" integer,
    "available_start_date" "date",
    "available_end_date" "date",
    "condition" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "request_responses_response_type_check" CHECK (("response_type" = ANY (ARRAY['offer'::"text", 'inquiry'::"text", 'available'::"text"]))),
    CONSTRAINT "request_responses_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'expired'::"text", 'converted'::"text"])))
);


ALTER TABLE "public"."request_responses" OWNER TO "postgres";


COMMENT ON TABLE "public"."request_responses" IS 'Responses from equipment owners to requests';



COMMENT ON COLUMN "public"."request_responses"."listing_id" IS 'Optional link to existing listing if responder has one';



COMMENT ON COLUMN "public"."request_responses"."response_type" IS 'Type of response: offer, inquiry, or just availability notification';



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


COMMENT ON TABLE "public"."reviews" IS 'User reviews and ratings';



CREATE TABLE IF NOT EXISTS "public"."sale_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "unit_price_cents" integer NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "total_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "status" "text" DEFAULT 'placed'::"text" NOT NULL,
    "credits_tx_id" "uuid",
    "stripe_pi_id" "text",
    "shipping_address" "jsonb",
    "tracking_number" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "different_users" CHECK (("owner_id" <> "buyer_id")),
    CONSTRAINT "sale_orders_status_check" CHECK (("status" = ANY (ARRAY['placed'::"text", 'paid'::"text", 'shipped'::"text", 'delivered'::"text", 'cancelled'::"text", 'refunded'::"text", 'disputed'::"text"]))),
    CONSTRAINT "valid_sale_amounts" CHECK ((("unit_price_cents" > 0) AND ("quantity" > 0) AND ("total_cents" > 0)))
);


ALTER TABLE "public"."sale_orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."sale_orders" IS 'Sale transactions';



COMMENT ON COLUMN "public"."sale_orders"."status" IS 'Current status of sale transaction';



CREATE TABLE IF NOT EXISTS "public"."saved_gigs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "saved_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_gigs" OWNER TO "postgres";


COMMENT ON TABLE "public"."saved_gigs" IS 'Table for storing user-saved/bookmarked gigs';



COMMENT ON COLUMN "public"."saved_gigs"."user_id" IS 'ID of the user who saved the gig';



COMMENT ON COLUMN "public"."saved_gigs"."gig_id" IS 'ID of the gig that was saved';



COMMENT ON COLUMN "public"."saved_gigs"."saved_at" IS 'When the gig was saved';



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


COMMENT ON TABLE "public"."showcases" IS 'Portfolio showcases from completed gigs';



CREATE TABLE IF NOT EXISTS "public"."subscription_benefits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subscription_tier" character varying(20) NOT NULL,
    "benefit_type" character varying(50) NOT NULL,
    "benefit_value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "used_this_month" integer DEFAULT 0,
    "monthly_limit" integer DEFAULT 0,
    "last_reset_at" timestamp with time zone DEFAULT "date_trunc"('month'::"text", "now"()),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_limit" CHECK (("monthly_limit" >= 0)),
    CONSTRAINT "valid_usage" CHECK (("used_this_month" >= 0))
);


ALTER TABLE "public"."subscription_benefits" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscription_benefits" IS 'Tracks subscription-based benefits and monthly usage limits';



COMMENT ON COLUMN "public"."subscription_benefits"."benefit_type" IS 'Type of benefit: monthly_bump, unlimited_bumps, etc.';



COMMENT ON COLUMN "public"."subscription_benefits"."benefit_value" IS 'Flexible JSON data for benefit-specific information';



COMMENT ON COLUMN "public"."subscription_benefits"."used_this_month" IS 'Number of times used this month';



COMMENT ON COLUMN "public"."subscription_benefits"."monthly_limit" IS 'Maximum uses per month for this benefit';



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


COMMENT ON TABLE "public"."subscriptions" IS 'User subscription management';



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
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "is_typing" boolean DEFAULT false
);


ALTER TABLE "public"."typing_indicators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_id" "uuid" NOT NULL,
    "awarded_at" timestamp with time zone DEFAULT "now"(),
    "awarded_by" "uuid",
    "awarded_reason" "text",
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "verified_data" "jsonb",
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_presets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'custom'::character varying,
    "prompt_template" "text" NOT NULL,
    "negative_prompt" "text",
    "style_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "technical_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "seedream_config" "jsonb" DEFAULT '{}'::"jsonb",
    "usage_count" integer DEFAULT 0,
    "is_public" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_presets" OWNER TO "postgres";


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
    "profile_id" "uuid",
    "message_notifications" boolean DEFAULT true,
    "allow_stranger_messages" boolean DEFAULT false,
    "privacy_level" character varying(20) DEFAULT 'standard'::character varying,
    CONSTRAINT "user_settings_profile_visibility_check" CHECK ((("profile_visibility")::"text" = ANY ((ARRAY['public'::character varying, 'private'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_settings" IS 'User preferences and settings';



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


ALTER TABLE ONLY "public"."age_verification_logs"
    ADD CONSTRAINT "age_verification_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_providers"
    ADD CONSTRAINT "api_providers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."api_providers"
    ADD CONSTRAINT "api_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_gig_id_applicant_user_id_key" UNIQUE ("gig_id", "applicant_user_id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."collab_applications"
    ADD CONSTRAINT "collab_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collab_gear_offers"
    ADD CONSTRAINT "collab_gear_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collab_gear_requests"
    ADD CONSTRAINT "collab_gear_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collab_participants"
    ADD CONSTRAINT "collab_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collab_projects"
    ADD CONSTRAINT "collab_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collab_roles"
    ADD CONSTRAINT "collab_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_alerts"
    ADD CONSTRAINT "credit_alerts_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."enhancement_tasks"
    ADD CONSTRAINT "enhancement_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment_requests"
    ADD CONSTRAINT "equipment_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gig_notification_preferences"
    ADD CONSTRAINT "gig_notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gig_notification_preferences"
    ADD CONSTRAINT "gig_notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."gigs"
    ADD CONSTRAINT "gigs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_availability"
    ADD CONSTRAINT "listing_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_enhancements"
    ADD CONSTRAINT "listing_enhancements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_images"
    ADD CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_disputes"
    ADD CONSTRAINT "marketplace_disputes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_reviews"
    ADD CONSTRAINT "marketplace_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderation_actions"
    ADD CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preset_usage_log"
    ADD CONSTRAINT "preset_usage_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_handle_key" UNIQUE ("handle");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rental_orders"
    ADD CONSTRAINT "rental_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_conversations"
    ADD CONSTRAINT "request_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_conversations"
    ADD CONSTRAINT "request_conversations_request_id_responder_id_key" UNIQUE ("request_id", "responder_id");



ALTER TABLE ONLY "public"."request_responses"
    ADD CONSTRAINT "request_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_responses"
    ADD CONSTRAINT "request_responses_request_id_responder_id_key" UNIQUE ("request_id", "responder_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_gig_id_reviewer_user_id_reviewed_user_id_key" UNIQUE ("gig_id", "reviewer_user_id", "reviewed_user_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sale_orders"
    ADD CONSTRAINT "sale_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_gigs"
    ADD CONSTRAINT "saved_gigs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_gigs"
    ADD CONSTRAINT "saved_gigs_user_id_gig_id_key" UNIQUE ("user_id", "gig_id");



ALTER TABLE ONLY "public"."showcases"
    ADD CONSTRAINT "showcases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_benefits"
    ADD CONSTRAINT "subscription_benefits_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."collab_participants"
    ADD CONSTRAINT "unique_project_participant" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."subscription_benefits"
    ADD CONSTRAINT "unique_user_benefit" UNIQUE ("user_id", "benefit_type");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_badge_id_key" UNIQUE ("user_id", "badge_id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_presets"
    ADD CONSTRAINT "user_presets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_profile_id_key" UNIQUE ("profile_id");



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



ALTER TABLE ONLY "public"."violation_thresholds"
    ADD CONSTRAINT "violation_thresholds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."violation_thresholds"
    ADD CONSTRAINT "violation_thresholds_violation_count_key" UNIQUE ("violation_count");



CREATE INDEX "idx_age_verification_logs_created_at" ON "public"."age_verification_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_age_verification_logs_type" ON "public"."age_verification_logs" USING "btree" ("verification_type");



CREATE INDEX "idx_age_verification_logs_user" ON "public"."age_verification_logs" USING "btree" ("user_id");



CREATE INDEX "idx_age_verification_logs_user_id" ON "public"."age_verification_logs" USING "btree" ("user_id");



CREATE INDEX "idx_api_providers_name" ON "public"."api_providers" USING "btree" ("name");



CREATE INDEX "idx_applications_applicant" ON "public"."applications" USING "btree" ("applicant_user_id");



CREATE INDEX "idx_applications_gig" ON "public"."applications" USING "btree" ("gig_id");



CREATE INDEX "idx_badges_active" ON "public"."badges" USING "btree" ("is_active");



CREATE INDEX "idx_badges_category" ON "public"."badges" USING "btree" ("category");



CREATE INDEX "idx_badges_slug" ON "public"."badges" USING "btree" ("slug");



CREATE INDEX "idx_badges_type" ON "public"."badges" USING "btree" ("type");



CREATE INDEX "idx_collab_applications_applicant_id" ON "public"."collab_applications" USING "btree" ("applicant_id");



CREATE INDEX "idx_collab_applications_project_id" ON "public"."collab_applications" USING "btree" ("project_id");



CREATE INDEX "idx_collab_applications_role_id" ON "public"."collab_applications" USING "btree" ("role_id");



CREATE INDEX "idx_collab_applications_status" ON "public"."collab_applications" USING "btree" ("status");



CREATE INDEX "idx_collab_gear_offers_gear_request_id" ON "public"."collab_gear_offers" USING "btree" ("gear_request_id");



CREATE INDEX "idx_collab_gear_offers_listing_id" ON "public"."collab_gear_offers" USING "btree" ("listing_id");



CREATE INDEX "idx_collab_gear_offers_offerer_id" ON "public"."collab_gear_offers" USING "btree" ("offerer_id");



CREATE INDEX "idx_collab_gear_offers_project_id" ON "public"."collab_gear_offers" USING "btree" ("project_id");



CREATE INDEX "idx_collab_gear_offers_status" ON "public"."collab_gear_offers" USING "btree" ("status");



CREATE INDEX "idx_collab_gear_requests_category" ON "public"."collab_gear_requests" USING "btree" ("category");



CREATE INDEX "idx_collab_gear_requests_project_id" ON "public"."collab_gear_requests" USING "btree" ("project_id");



CREATE INDEX "idx_collab_gear_requests_status" ON "public"."collab_gear_requests" USING "btree" ("status");



CREATE INDEX "idx_collab_participants_project_id" ON "public"."collab_participants" USING "btree" ("project_id");



CREATE INDEX "idx_collab_participants_role_type" ON "public"."collab_participants" USING "btree" ("role_type");



CREATE INDEX "idx_collab_participants_status" ON "public"."collab_participants" USING "btree" ("status");



CREATE INDEX "idx_collab_participants_user_id" ON "public"."collab_participants" USING "btree" ("user_id");



CREATE INDEX "idx_collab_projects_created_at" ON "public"."collab_projects" USING "btree" ("created_at");



CREATE INDEX "idx_collab_projects_creator_id" ON "public"."collab_projects" USING "btree" ("creator_id");



CREATE INDEX "idx_collab_projects_dates" ON "public"."collab_projects" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_collab_projects_location" ON "public"."collab_projects" USING "btree" ("city", "country");



CREATE INDEX "idx_collab_projects_status" ON "public"."collab_projects" USING "btree" ("status");



CREATE INDEX "idx_collab_projects_visibility" ON "public"."collab_projects" USING "btree" ("visibility");



CREATE INDEX "idx_collab_roles_project_id" ON "public"."collab_roles" USING "btree" ("project_id");



CREATE INDEX "idx_collab_roles_skills" ON "public"."collab_roles" USING "gin" ("skills_required");



CREATE INDEX "idx_collab_roles_status" ON "public"."collab_roles" USING "btree" ("status");



CREATE INDEX "idx_credit_pools_provider" ON "public"."credit_pools" USING "btree" ("provider");



CREATE INDEX "idx_credit_transactions_created_at" ON "public"."credit_transactions" USING "btree" ("created_at");



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_daily_usage_date" ON "public"."daily_usage_summary" USING "btree" ("date");



CREATE INDEX "idx_domain_events_aggregate_id" ON "public"."domain_events" USING "btree" ("aggregate_id");



CREATE INDEX "idx_domain_events_event_type" ON "public"."domain_events" USING "btree" ("event_type");



CREATE INDEX "idx_domain_events_occurred_at" ON "public"."domain_events" USING "btree" ("occurred_at");



CREATE INDEX "idx_enhancement_tasks_created_at" ON "public"."enhancement_tasks" USING "btree" ("created_at");



CREATE INDEX "idx_enhancement_tasks_moodboard_id" ON "public"."enhancement_tasks" USING "btree" ("moodboard_id");



CREATE INDEX "idx_enhancement_tasks_status" ON "public"."enhancement_tasks" USING "btree" ("status");



CREATE INDEX "idx_enhancement_tasks_user_id" ON "public"."enhancement_tasks" USING "btree" ("user_id");



CREATE INDEX "idx_equipment_requests_category" ON "public"."equipment_requests" USING "btree" ("category");



CREATE INDEX "idx_equipment_requests_expires_at" ON "public"."equipment_requests" USING "btree" ("expires_at");



CREATE INDEX "idx_equipment_requests_location" ON "public"."equipment_requests" USING "btree" ("location_city", "location_country");



CREATE INDEX "idx_equipment_requests_rental_dates" ON "public"."equipment_requests" USING "btree" ("rental_start_date", "rental_end_date");



CREATE INDEX "idx_equipment_requests_requester_id" ON "public"."equipment_requests" USING "btree" ("requester_id");



CREATE INDEX "idx_equipment_requests_status" ON "public"."equipment_requests" USING "btree" ("status");



CREATE INDEX "idx_equipment_requests_urgent" ON "public"."equipment_requests" USING "btree" ("urgent") WHERE ("urgent" = true);



CREATE INDEX "idx_gig_notification_preferences_notify_on_match" ON "public"."gig_notification_preferences" USING "btree" ("notify_on_match") WHERE ("notify_on_match" = true);



CREATE INDEX "idx_gig_notification_preferences_user_id" ON "public"."gig_notification_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_gigs_city" ON "public"."gigs" USING "btree" ("city");



CREATE INDEX "idx_gigs_country" ON "public"."gigs" USING "btree" ("country");



CREATE INDEX "idx_gigs_dates" ON "public"."gigs" USING "btree" ("start_time", "end_time");



CREATE INDEX "idx_gigs_location" ON "public"."gigs" USING "gist" ("location");



CREATE INDEX "idx_gigs_owner" ON "public"."gigs" USING "btree" ("owner_user_id");



CREATE INDEX "idx_gigs_purpose" ON "public"."gigs" USING "btree" ("purpose");



CREATE INDEX "idx_gigs_status" ON "public"."gigs" USING "btree" ("status");



CREATE INDEX "idx_gigs_status_deadline" ON "public"."gigs" USING "btree" ("status", "application_deadline");



CREATE INDEX "idx_gigs_style_tags" ON "public"."gigs" USING "gin" ("style_tags");



CREATE INDEX "idx_gigs_vibe_tags" ON "public"."gigs" USING "gin" ("vibe_tags");



CREATE INDEX "idx_listing_availability_dates" ON "public"."listing_availability" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_listing_availability_kind" ON "public"."listing_availability" USING "btree" ("kind");



CREATE INDEX "idx_listing_availability_listing_id" ON "public"."listing_availability" USING "btree" ("listing_id");



CREATE INDEX "idx_listing_enhancements_active" ON "public"."listing_enhancements" USING "btree" ("listing_id", "status", "expires_at") WHERE (("status")::"text" = 'active'::"text");



CREATE INDEX "idx_listing_enhancements_expires_at" ON "public"."listing_enhancements" USING "btree" ("expires_at");



CREATE INDEX "idx_listing_enhancements_listing_id" ON "public"."listing_enhancements" USING "btree" ("listing_id");



CREATE INDEX "idx_listing_enhancements_status" ON "public"."listing_enhancements" USING "btree" ("status");



CREATE INDEX "idx_listing_enhancements_type" ON "public"."listing_enhancements" USING "btree" ("enhancement_type");



CREATE INDEX "idx_listing_enhancements_user_id" ON "public"."listing_enhancements" USING "btree" ("user_id");



CREATE INDEX "idx_listing_images_listing_id" ON "public"."listing_images" USING "btree" ("listing_id");



CREATE INDEX "idx_listing_images_sort_order" ON "public"."listing_images" USING "btree" ("listing_id", "sort_order");



CREATE INDEX "idx_listings_boost_level" ON "public"."listings" USING "btree" ("boost_level");



CREATE INDEX "idx_listings_category" ON "public"."listings" USING "btree" ("category");



CREATE INDEX "idx_listings_created_at" ON "public"."listings" USING "btree" ("created_at");



CREATE INDEX "idx_listings_enhancement_expires" ON "public"."listings" USING "btree" ("enhancement_expires_at") WHERE ("enhancement_expires_at" IS NOT NULL);



CREATE INDEX "idx_listings_location" ON "public"."listings" USING "btree" ("latitude", "longitude") WHERE ("latitude" IS NOT NULL);



CREATE INDEX "idx_listings_mode" ON "public"."listings" USING "btree" ("mode");



CREATE INDEX "idx_listings_owner_id" ON "public"."listings" USING "btree" ("owner_id");



CREATE INDEX "idx_listings_premium_badge" ON "public"."listings" USING "btree" ("premium_badge") WHERE ("premium_badge" = true);



CREATE INDEX "idx_listings_status" ON "public"."listings" USING "btree" ("status");



CREATE INDEX "idx_listings_verified_badge" ON "public"."listings" USING "btree" ("verified_badge") WHERE ("verified_badge" = true);



CREATE INDEX "idx_listings_verified_only" ON "public"."listings" USING "btree" ("verified_only");



CREATE INDEX "idx_marketplace_disputes_order" ON "public"."marketplace_disputes" USING "btree" ("order_type", "order_id");



CREATE INDEX "idx_marketplace_disputes_reported" ON "public"."marketplace_disputes" USING "btree" ("reported_user_id");



CREATE INDEX "idx_marketplace_disputes_reporter" ON "public"."marketplace_disputes" USING "btree" ("reporter_id");



CREATE INDEX "idx_marketplace_disputes_status" ON "public"."marketplace_disputes" USING "btree" ("status");



CREATE INDEX "idx_marketplace_reviews_author" ON "public"."marketplace_reviews" USING "btree" ("author_id");



CREATE INDEX "idx_marketplace_reviews_order" ON "public"."marketplace_reviews" USING "btree" ("order_type", "order_id");



CREATE INDEX "idx_marketplace_reviews_subject" ON "public"."marketplace_reviews" USING "btree" ("subject_user_id");



CREATE INDEX "idx_media_ai_metadata_gin" ON "public"."media" USING "gin" ("ai_metadata");



CREATE INDEX "idx_media_aspect_ratio" ON "public"."media" USING "btree" ((("ai_metadata" ->> 'aspectRatio'::"text")));



CREATE INDEX "idx_media_camera_angle" ON "public"."media" USING "btree" ((("ai_metadata" ->> 'cameraAngle'::"text")));



CREATE INDEX "idx_media_cinematic_tags_gin" ON "public"."media" USING "gin" ("cinematic_tags");



CREATE INDEX "idx_media_color_palette" ON "public"."media" USING "btree" ((("ai_metadata" ->> 'colorPalette'::"text")));



CREATE INDEX "idx_media_director_style" ON "public"."media" USING "btree" ((("ai_metadata" ->> 'directorStyle'::"text")));



CREATE INDEX "idx_media_gig" ON "public"."media" USING "btree" ("gig_id");



CREATE INDEX "idx_media_lens_type" ON "public"."media" USING "btree" ((("ai_metadata" ->> 'lensType'::"text")));



CREATE INDEX "idx_media_lighting_style" ON "public"."media" USING "btree" ((("ai_metadata" ->> 'lightingStyle'::"text")));



CREATE INDEX "idx_media_owner" ON "public"."media" USING "btree" ("owner_user_id");



CREATE INDEX "idx_media_type" ON "public"."media" USING "btree" ("type");



CREATE INDEX "idx_media_visibility" ON "public"."media" USING "btree" ("visibility");



CREATE INDEX "idx_messages_context_type" ON "public"."messages" USING "btree" ("context_type");



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_conversation_created_at" ON "public"."messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_gig" ON "public"."messages" USING "btree" ("gig_id");



CREATE INDEX "idx_messages_listing_id" ON "public"."messages" USING "btree" ("listing_id") WHERE ("listing_id" IS NOT NULL);



CREATE INDEX "idx_messages_offer_id" ON "public"."messages" USING "btree" ("offer_id") WHERE ("offer_id" IS NOT NULL);



CREATE INDEX "idx_messages_read_at" ON "public"."messages" USING "btree" ("read_at") WHERE ("read_at" IS NOT NULL);



CREATE INDEX "idx_messages_rental_order_id" ON "public"."messages" USING "btree" ("rental_order_id") WHERE ("rental_order_id" IS NOT NULL);



CREATE INDEX "idx_messages_sale_order_id" ON "public"."messages" USING "btree" ("sale_order_id") WHERE ("sale_order_id" IS NOT NULL);



CREATE INDEX "idx_messages_status" ON "public"."messages" USING "btree" ("status");



CREATE INDEX "idx_messages_users" ON "public"."messages" USING "btree" ("from_user_id", "to_user_id");



CREATE INDEX "idx_moderation_actions_admin" ON "public"."moderation_actions" USING "btree" ("admin_user_id");



CREATE INDEX "idx_moderation_actions_created" ON "public"."moderation_actions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_moderation_actions_expires" ON "public"."moderation_actions" USING "btree" ("expires_at") WHERE (("expires_at" IS NOT NULL) AND ("revoked_at" IS NULL));



CREATE INDEX "idx_moderation_actions_report" ON "public"."moderation_actions" USING "btree" ("report_id") WHERE ("report_id" IS NOT NULL);



CREATE INDEX "idx_moderation_actions_target_user" ON "public"."moderation_actions" USING "btree" ("target_user_id") WHERE ("target_user_id" IS NOT NULL);



CREATE INDEX "idx_moderation_actions_type" ON "public"."moderation_actions" USING "btree" ("action_type");



CREATE INDEX "idx_moodboard_items_moodboard_id" ON "public"."moodboard_items" USING "btree" ("moodboard_id");



CREATE INDEX "idx_moodboard_items_position" ON "public"."moodboard_items" USING "btree" ("moodboard_id", "position");



CREATE INDEX "idx_moodboards_gig" ON "public"."moodboards" USING "btree" ("gig_id");



CREATE INDEX "idx_moodboards_mood" ON "public"."moodboards" USING "gin" ("mood_descriptors");



CREATE INDEX "idx_moodboards_owner" ON "public"."moodboards" USING "btree" ("owner_user_id");



CREATE INDEX "idx_moodboards_tags" ON "public"."moodboards" USING "gin" ("tags");



CREATE INDEX "idx_moodboards_vibe_ids" ON "public"."moodboards" USING "gin" ("vibe_ids");



CREATE INDEX "idx_moodboards_vibe_search" ON "public"."moodboards" USING "gin" ("to_tsvector"('"english"'::"regconfig", COALESCE("vibe_summary", ''::"text")));



CREATE INDEX "idx_notifications_category" ON "public"."notifications" USING "btree" ("category", "created_at");



CREATE INDEX "idx_notifications_delivery" ON "public"."notifications" USING "btree" ("delivered_in_app", "delivered_email", "delivered_push", "created_at");



CREATE INDEX "idx_notifications_marketplace_listing" ON "public"."notifications" USING "btree" ("related_listing_id") WHERE ("related_listing_id" IS NOT NULL);



CREATE INDEX "idx_notifications_marketplace_offer" ON "public"."notifications" USING "btree" ("related_offer_id") WHERE ("related_offer_id" IS NOT NULL);



CREATE INDEX "idx_notifications_marketplace_rental_order" ON "public"."notifications" USING "btree" ("related_rental_order_id") WHERE ("related_rental_order_id" IS NOT NULL);



CREATE INDEX "idx_notifications_marketplace_review" ON "public"."notifications" USING "btree" ("related_review_id") WHERE ("related_review_id" IS NOT NULL);



CREATE INDEX "idx_notifications_marketplace_sale_order" ON "public"."notifications" USING "btree" ("related_sale_order_id") WHERE ("related_sale_order_id" IS NOT NULL);



CREATE INDEX "idx_notifications_recipient_unread" ON "public"."notifications" USING "btree" ("recipient_id", "read_at") WHERE ("read_at" IS NULL);



CREATE INDEX "idx_notifications_related_application" ON "public"."notifications" USING "btree" ("related_application_id") WHERE ("related_application_id" IS NOT NULL);



CREATE INDEX "idx_notifications_related_gig" ON "public"."notifications" USING "btree" ("related_gig_id") WHERE ("related_gig_id" IS NOT NULL);



CREATE INDEX "idx_notifications_scheduled" ON "public"."notifications" USING "btree" ("scheduled_for") WHERE ("delivered_at" IS NULL);



CREATE INDEX "idx_offers_expires_at" ON "public"."offers" USING "btree" ("expires_at");



CREATE INDEX "idx_offers_from_user" ON "public"."offers" USING "btree" ("from_user");



CREATE INDEX "idx_offers_listing_id" ON "public"."offers" USING "btree" ("listing_id");



CREATE INDEX "idx_offers_status" ON "public"."offers" USING "btree" ("status");



CREATE INDEX "idx_offers_to_user" ON "public"."offers" USING "btree" ("to_user");



CREATE INDEX "idx_profiles_handle" ON "public"."profiles" USING "btree" ("handle");



CREATE INDEX "idx_profiles_style_tags" ON "public"."profiles" USING "gin" ("style_tags");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "idx_rental_orders_dates" ON "public"."rental_orders" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_rental_orders_listing_id" ON "public"."rental_orders" USING "btree" ("listing_id");



CREATE INDEX "idx_rental_orders_owner_id" ON "public"."rental_orders" USING "btree" ("owner_id");



CREATE INDEX "idx_rental_orders_renter_id" ON "public"."rental_orders" USING "btree" ("renter_id");



CREATE INDEX "idx_rental_orders_status" ON "public"."rental_orders" USING "btree" ("status");



CREATE INDEX "idx_reports_content" ON "public"."reports" USING "btree" ("content_type", "reported_content_id") WHERE ("reported_content_id" IS NOT NULL);



CREATE INDEX "idx_reports_created_at" ON "public"."reports" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reports_priority" ON "public"."reports" USING "btree" ("priority", "created_at" DESC) WHERE ("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text"]));



CREATE INDEX "idx_reports_reported_user" ON "public"."reports" USING "btree" ("reported_user_id") WHERE ("reported_user_id" IS NOT NULL);



CREATE INDEX "idx_reports_reporter" ON "public"."reports" USING "btree" ("reporter_user_id");



CREATE INDEX "idx_reports_status" ON "public"."reports" USING "btree" ("status") WHERE ("status" <> 'resolved'::"text");



CREATE INDEX "idx_request_conversations_request_id" ON "public"."request_conversations" USING "btree" ("request_id");



CREATE INDEX "idx_request_conversations_requester_id" ON "public"."request_conversations" USING "btree" ("requester_id");



CREATE INDEX "idx_request_conversations_responder_id" ON "public"."request_conversations" USING "btree" ("responder_id");



CREATE INDEX "idx_request_conversations_status" ON "public"."request_conversations" USING "btree" ("status");



CREATE INDEX "idx_request_responses_listing_id" ON "public"."request_responses" USING "btree" ("listing_id");



CREATE INDEX "idx_request_responses_request_id" ON "public"."request_responses" USING "btree" ("request_id");



CREATE INDEX "idx_request_responses_responder_id" ON "public"."request_responses" USING "btree" ("responder_id");



CREATE INDEX "idx_request_responses_status" ON "public"."request_responses" USING "btree" ("status");



CREATE INDEX "idx_sale_orders_buyer_id" ON "public"."sale_orders" USING "btree" ("buyer_id");



CREATE INDEX "idx_sale_orders_listing_id" ON "public"."sale_orders" USING "btree" ("listing_id");



CREATE INDEX "idx_sale_orders_owner_id" ON "public"."sale_orders" USING "btree" ("owner_id");



CREATE INDEX "idx_sale_orders_status" ON "public"."sale_orders" USING "btree" ("status");



CREATE INDEX "idx_saved_gigs_gig_id" ON "public"."saved_gigs" USING "btree" ("gig_id");



CREATE INDEX "idx_saved_gigs_saved_at" ON "public"."saved_gigs" USING "btree" ("saved_at");



CREATE INDEX "idx_saved_gigs_user_id" ON "public"."saved_gigs" USING "btree" ("user_id");



CREATE INDEX "idx_showcases_creator" ON "public"."showcases" USING "btree" ("creator_user_id");



CREATE INDEX "idx_showcases_gig" ON "public"."showcases" USING "btree" ("gig_id");



CREATE INDEX "idx_showcases_talent" ON "public"."showcases" USING "btree" ("talent_user_id");



CREATE INDEX "idx_showcases_visibility" ON "public"."showcases" USING "btree" ("visibility");



CREATE INDEX "idx_subscription_benefits_reset" ON "public"."subscription_benefits" USING "btree" ("last_reset_at");



CREATE INDEX "idx_subscription_benefits_tier" ON "public"."subscription_benefits" USING "btree" ("subscription_tier");



CREATE INDEX "idx_subscription_benefits_type" ON "public"."subscription_benefits" USING "btree" ("benefit_type");



CREATE INDEX "idx_subscription_benefits_user_id" ON "public"."subscription_benefits" USING "btree" ("user_id");



CREATE INDEX "idx_subscriptions_stripe_customer" ON "public"."subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_subscriptions_stripe_subscription" ON "public"."subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_subscriptions_user" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_typing_indicators_activity" ON "public"."typing_indicators" USING "btree" ("last_activity");



CREATE INDEX "idx_typing_indicators_conversation" ON "public"."typing_indicators" USING "btree" ("conversation_id");



CREATE INDEX "idx_user_badges_active" ON "public"."user_badges" USING "btree" ("is_active");



CREATE INDEX "idx_user_badges_awarded_at" ON "public"."user_badges" USING "btree" ("awarded_at" DESC);



CREATE INDEX "idx_user_badges_badge_id" ON "public"."user_badges" USING "btree" ("badge_id");



CREATE INDEX "idx_user_badges_featured" ON "public"."user_badges" USING "btree" ("is_featured");



CREATE INDEX "idx_user_badges_user_id" ON "public"."user_badges" USING "btree" ("user_id");



CREATE INDEX "idx_user_credits_user_id" ON "public"."user_credits" USING "btree" ("user_id");



CREATE INDEX "idx_user_settings_profile_id" ON "public"."user_settings" USING "btree" ("profile_id");



CREATE INDEX "idx_user_settings_user_id" ON "public"."user_settings" USING "btree" ("user_id");



CREATE INDEX "idx_user_violations_active" ON "public"."user_violations" USING "btree" ("user_id", "expires_at");



CREATE INDEX "idx_user_violations_created" ON "public"."user_violations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_violations_not_expired" ON "public"."user_violations" USING "btree" ("user_id") WHERE ("expires_at" IS NULL);



CREATE INDEX "idx_user_violations_report" ON "public"."user_violations" USING "btree" ("report_id") WHERE ("report_id" IS NOT NULL);



CREATE INDEX "idx_user_violations_severity" ON "public"."user_violations" USING "btree" ("severity");



CREATE INDEX "idx_user_violations_user" ON "public"."user_violations" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_profile_account_status" ON "public"."users_profile" USING "btree" ("account_status");



CREATE INDEX "idx_users_profile_age_verified" ON "public"."users_profile" USING "btree" ("age_verified");



CREATE INDEX "idx_users_profile_country" ON "public"."users_profile" USING "btree" ("country");



CREATE INDEX "idx_users_profile_date_of_birth" ON "public"."users_profile" USING "btree" ("date_of_birth");



CREATE INDEX "idx_users_profile_first_name" ON "public"."users_profile" USING "btree" ("first_name");



CREATE INDEX "idx_users_profile_handle" ON "public"."users_profile" USING "btree" ("handle");



CREATE INDEX "idx_users_profile_header_banner_url" ON "public"."users_profile" USING "btree" ("header_banner_url") WHERE ("header_banner_url" IS NOT NULL);



CREATE INDEX "idx_users_profile_hourly_rate" ON "public"."users_profile" USING "btree" ("hourly_rate_min", "hourly_rate_max");



CREATE INDEX "idx_users_profile_last_name" ON "public"."users_profile" USING "btree" ("last_name");



CREATE INDEX "idx_users_profile_role_flags" ON "public"."users_profile" USING "gin" ("role_flags");



CREATE INDEX "idx_users_profile_style_tags" ON "public"."users_profile" USING "gin" ("style_tags");



CREATE INDEX "idx_users_profile_subscription_tier" ON "public"."users_profile" USING "btree" ("subscription_tier");



CREATE INDEX "idx_users_profile_talent_categories" ON "public"."users_profile" USING "gin" ("talent_categories");



CREATE INDEX "idx_users_profile_travel_radius" ON "public"."users_profile" USING "btree" ("travel_radius_km");



CREATE INDEX "idx_users_profile_user_id" ON "public"."users_profile" USING "btree" ("user_id");



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



CREATE OR REPLACE TRIGGER "add_equipment_provider_as_participant_trigger" AFTER UPDATE ON "public"."collab_gear_offers" FOR EACH ROW EXECUTE FUNCTION "public"."add_equipment_provider_as_participant"();



CREATE OR REPLACE TRIGGER "add_project_creator_as_participant_trigger" AFTER INSERT ON "public"."collab_projects" FOR EACH ROW EXECUTE FUNCTION "public"."add_project_creator_as_participant"();



CREATE OR REPLACE TRIGGER "auto_escalate_report_trigger" BEFORE INSERT ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."auto_escalate_report_priority"();



CREATE OR REPLACE TRIGGER "check_rental_availability_trigger" BEFORE INSERT OR UPDATE ON "public"."rental_orders" FOR EACH ROW EXECUTE FUNCTION "public"."check_rental_availability"();



CREATE OR REPLACE TRIGGER "create_rental_availability_block_trigger" AFTER UPDATE ON "public"."rental_orders" FOR EACH ROW EXECUTE FUNCTION "public"."create_rental_availability_block"();



CREATE OR REPLACE TRIGGER "create_user_settings_on_profile_create" AFTER INSERT ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."create_user_settings_on_profile_create"();



CREATE OR REPLACE TRIGGER "marketplace_review_notification_trigger" AFTER INSERT ON "public"."marketplace_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_marketplace_review_notification"();



CREATE OR REPLACE TRIGGER "marketplace_review_response_notification_trigger" AFTER UPDATE ON "public"."marketplace_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_marketplace_review_response_notification"();



CREATE OR REPLACE TRIGGER "offer_notification_trigger" AFTER INSERT ON "public"."offers" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_offer_notification"();



CREATE OR REPLACE TRIGGER "offer_response_notification_trigger" AFTER UPDATE ON "public"."offers" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_offer_response_notification"();



CREATE OR REPLACE TRIGGER "rental_order_notification_trigger" AFTER INSERT ON "public"."rental_orders" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_rental_order_notification"();



CREATE OR REPLACE TRIGGER "rental_order_status_notification_trigger" AFTER UPDATE ON "public"."rental_orders" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_order_status_notification"();



CREATE OR REPLACE TRIGGER "reports_updated_at_trigger" BEFORE UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_reports_updated_at"();



CREATE OR REPLACE TRIGGER "sale_order_notification_trigger" AFTER INSERT ON "public"."sale_orders" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_sale_order_notification"();



CREATE OR REPLACE TRIGGER "sale_order_status_notification_trigger" AFTER UPDATE ON "public"."sale_orders" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_order_status_notification"();



CREATE OR REPLACE TRIGGER "set_messages_conversation_id" BEFORE INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."set_conversation_id"();



CREATE OR REPLACE TRIGGER "update_applications_updated_at" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_badges_updated_at" BEFORE UPDATE ON "public"."badges" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_collab_applications_updated_at" BEFORE UPDATE ON "public"."collab_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_collab_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_collab_gear_offers_updated_at" BEFORE UPDATE ON "public"."collab_gear_offers" FOR EACH ROW EXECUTE FUNCTION "public"."update_collab_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_collab_gear_requests_updated_at" BEFORE UPDATE ON "public"."collab_gear_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_collab_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_collab_projects_updated_at" BEFORE UPDATE ON "public"."collab_projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_collab_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_collab_roles_updated_at" BEFORE UPDATE ON "public"."collab_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_collab_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_enhancement_tasks_updated_at" BEFORE UPDATE ON "public"."enhancement_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_equipment_requests_updated_at" BEFORE UPDATE ON "public"."equipment_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_gig_notification_preferences_updated_at" BEFORE UPDATE ON "public"."gig_notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_gig_notification_preferences_updated_at"();



CREATE OR REPLACE TRIGGER "update_gigs_updated_at" BEFORE UPDATE ON "public"."gigs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_listing_enhancement_status_trigger" AFTER INSERT OR UPDATE ON "public"."listing_enhancements" FOR EACH ROW EXECUTE FUNCTION "public"."update_listing_enhancement_status"();



CREATE OR REPLACE TRIGGER "update_listings_updated_at" BEFORE UPDATE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_media_cinematic_tags" BEFORE INSERT OR UPDATE OF "ai_metadata" ON "public"."media" FOR EACH ROW EXECUTE FUNCTION "public"."update_cinematic_tags"();



CREATE OR REPLACE TRIGGER "update_messages_updated_at" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_moodboards_updated_at" BEFORE UPDATE ON "public"."moodboards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_notification_preferences_updated_at" BEFORE UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_offers_updated_at" BEFORE UPDATE ON "public"."offers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_rental_orders_updated_at" BEFORE UPDATE ON "public"."rental_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reports_updated_at" BEFORE UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_request_conversations_updated_at" BEFORE UPDATE ON "public"."request_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_request_responses_updated_at" BEFORE UPDATE ON "public"."request_responses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_role_status_on_acceptance_trigger" AFTER UPDATE ON "public"."collab_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_role_status_on_acceptance"();



CREATE OR REPLACE TRIGGER "update_sale_orders_updated_at" BEFORE UPDATE ON "public"."sale_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_showcases_updated_at" BEFORE UPDATE ON "public"."showcases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_credits_updated_at" BEFORE UPDATE ON "public"."user_credits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_users_profile_updated_at" BEFORE UPDATE ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "verification_updated_at_trigger" BEFORE UPDATE ON "public"."verification_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_verification_updated_at"();



ALTER TABLE ONLY "public"."age_verification_logs"
    ADD CONSTRAINT "age_verification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."age_verification_logs"
    ADD CONSTRAINT "age_verification_logs_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_applicant_user_id_fkey" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users_profile"("id");



ALTER TABLE ONLY "public"."collab_applications"
    ADD CONSTRAINT "collab_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_applications"
    ADD CONSTRAINT "collab_applications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."collab_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_applications"
    ADD CONSTRAINT "collab_applications_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."collab_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_gear_offers"
    ADD CONSTRAINT "collab_gear_offers_gear_request_id_fkey" FOREIGN KEY ("gear_request_id") REFERENCES "public"."collab_gear_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_gear_offers"
    ADD CONSTRAINT "collab_gear_offers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_gear_offers"
    ADD CONSTRAINT "collab_gear_offers_offerer_id_fkey" FOREIGN KEY ("offerer_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_gear_offers"
    ADD CONSTRAINT "collab_gear_offers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."collab_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_gear_requests"
    ADD CONSTRAINT "collab_gear_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."collab_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_participants"
    ADD CONSTRAINT "collab_participants_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."collab_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_participants"
    ADD CONSTRAINT "collab_participants_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."collab_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_participants"
    ADD CONSTRAINT "collab_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_projects"
    ADD CONSTRAINT "collab_projects_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_projects"
    ADD CONSTRAINT "collab_projects_moodboard_id_fkey" FOREIGN KEY ("moodboard_id") REFERENCES "public"."moodboards"("id");



ALTER TABLE ONLY "public"."collab_roles"
    ADD CONSTRAINT "collab_roles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."collab_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_purchase_requests"
    ADD CONSTRAINT "credit_purchase_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_moodboard_id_fkey" FOREIGN KEY ("moodboard_id") REFERENCES "public"."moodboards"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."enhancement_tasks"
    ADD CONSTRAINT "enhancement_tasks_moodboard_id_fkey" FOREIGN KEY ("moodboard_id") REFERENCES "public"."moodboards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."enhancement_tasks"
    ADD CONSTRAINT "enhancement_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."equipment_requests"
    ADD CONSTRAINT "equipment_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gig_notification_preferences"
    ADD CONSTRAINT "gig_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gigs"
    ADD CONSTRAINT "gigs_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_availability"
    ADD CONSTRAINT "listing_availability_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_enhancements"
    ADD CONSTRAINT "listing_enhancements_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_enhancements"
    ADD CONSTRAINT "listing_enhancements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_images"
    ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_disputes"
    ADD CONSTRAINT "marketplace_disputes_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_disputes"
    ADD CONSTRAINT "marketplace_disputes_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_disputes"
    ADD CONSTRAINT "marketplace_disputes_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."users_profile"("id");



ALTER TABLE ONLY "public"."marketplace_reviews"
    ADD CONSTRAINT "marketplace_reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_reviews"
    ADD CONSTRAINT "marketplace_reviews_subject_user_id_fkey" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_rental_order_id_fkey" FOREIGN KEY ("rental_order_id") REFERENCES "public"."rental_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sale_order_id_fkey" FOREIGN KEY ("sale_order_id") REFERENCES "public"."sale_orders"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."moodboard_items"
    ADD CONSTRAINT "moodboard_items_moodboard_id_fkey" FOREIGN KEY ("moodboard_id") REFERENCES "public"."moodboards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moodboards"
    ADD CONSTRAINT "moodboards_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moodboards"
    ADD CONSTRAINT "moodboards_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_application_id_fkey" FOREIGN KEY ("related_application_id") REFERENCES "public"."applications"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_gig_id_fkey" FOREIGN KEY ("related_gig_id") REFERENCES "public"."gigs"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_listing_id_fkey" FOREIGN KEY ("related_listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_offer_id_fkey" FOREIGN KEY ("related_offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_rental_order_id_fkey" FOREIGN KEY ("related_rental_order_id") REFERENCES "public"."rental_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_review_id_fkey" FOREIGN KEY ("related_review_id") REFERENCES "public"."marketplace_reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_sale_order_id_fkey" FOREIGN KEY ("related_sale_order_id") REFERENCES "public"."sale_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_from_user_fkey" FOREIGN KEY ("from_user") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_to_user_fkey" FOREIGN KEY ("to_user") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_usage_log"
    ADD CONSTRAINT "preset_usage_log_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "public"."user_presets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_usage_log"
    ADD CONSTRAINT "preset_usage_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rental_orders"
    ADD CONSTRAINT "rental_orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rental_orders"
    ADD CONSTRAINT "rental_orders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rental_orders"
    ADD CONSTRAINT "rental_orders_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."request_conversations"
    ADD CONSTRAINT "request_conversations_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."equipment_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_conversations"
    ADD CONSTRAINT "request_conversations_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_conversations"
    ADD CONSTRAINT "request_conversations_responder_id_fkey" FOREIGN KEY ("responder_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_conversations"
    ADD CONSTRAINT "request_conversations_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "public"."request_responses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_responses"
    ADD CONSTRAINT "request_responses_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."request_responses"
    ADD CONSTRAINT "request_responses_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."equipment_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_responses"
    ADD CONSTRAINT "request_responses_responder_id_fkey" FOREIGN KEY ("responder_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewed_user_id_fkey" FOREIGN KEY ("reviewed_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_orders"
    ADD CONSTRAINT "sale_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_orders"
    ADD CONSTRAINT "sale_orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_orders"
    ADD CONSTRAINT "sale_orders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."subscription_benefits"
    ADD CONSTRAINT "subscription_benefits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_awarded_by_fkey" FOREIGN KEY ("awarded_by") REFERENCES "public"."users_profile"("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_presets"
    ADD CONSTRAINT "user_presets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



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



CREATE POLICY "Admins can manage badges" ON "public"."badges" USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admins can manage user badges" ON "public"."user_badges" USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Anyone can view active badges" ON "public"."badges" FOR SELECT USING (("is_active" = true));



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



CREATE POLICY "Request owners can update responses to their requests" ON "public"."request_responses" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."equipment_requests"
  WHERE (("equipment_requests"."id" = "request_responses"."request_id") AND (("equipment_requests"."requester_id")::"text" = ("auth"."uid"())::"text")))));



CREATE POLICY "Service role can insert domain events" ON "public"."domain_events" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can insert users" ON "public"."users" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can read domain events" ON "public"."domain_events" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Service role has full access to profiles" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to users" ON "public"."users" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "System can create notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create transactions" ON "public"."credit_transactions" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert logs" ON "public"."age_verification_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can manage credits" ON "public"."user_credits" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage subscriptions" ON "public"."subscriptions" USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "users_profile"."user_id"))));



CREATE POLICY "System can update delivery status" ON "public"."notifications" FOR UPDATE USING (true);



CREATE POLICY "Talent can apply to gigs" ON "public"."applications" FOR INSERT WITH CHECK ((("applicant_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('TALENT'::"public"."user_role" = ANY ("users_profile"."role_flags")))))));



CREATE POLICY "Users can access own settings" ON "public"."user_settings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create conversations for their requests" ON "public"."request_conversations" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("requester_id")::"text"));



CREATE POLICY "Users can create enhancements for their listings" ON "public"."listing_enhancements" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_enhancements"."listing_id") AND ("l"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create equipment requests" ON "public"."equipment_requests" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("requester_id")::"text"));



CREATE POLICY "Users can create own gig notification preferences" ON "public"."gig_notification_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create responses to requests" ON "public"."request_responses" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("responder_id")::"text"));



CREATE POLICY "Users can create their own benefits" ON "public"."subscription_benefits" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own moodboards" ON "public"."moodboards" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can create their own showcases" ON "public"."showcases" FOR INSERT WITH CHECK (("auth"."uid"() = "creator_user_id"));



CREATE POLICY "Users can delete own gig notification preferences" ON "public"."gig_notification_preferences" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own media" ON "public"."media" FOR DELETE USING (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their own equipment requests" ON "public"."equipment_requests" FOR DELETE USING ((("auth"."uid"())::"text" = ("requester_id")::"text"));



CREATE POLICY "Users can delete their own moodboards" ON "public"."moodboards" FOR DELETE USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can insert own notification preferences" ON "public"."notification_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."users_profile" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own tasks" ON "public"."enhancement_tasks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own moodboard items" ON "public"."moodboard_items" USING ((EXISTS ( SELECT 1
   FROM "public"."moodboards"
  WHERE (("moodboards"."id" = "moodboard_items"."moodboard_id") AND ("moodboards"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read own credits" ON "public"."user_credits" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read own transactions" ON "public"."credit_transactions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read own user record" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can read their own domain events" ON "public"."domain_events" FOR SELECT TO "authenticated" USING (((("metadata" ->> 'userId'::"text") = ("auth"."uid"())::"text") OR (("aggregate_id")::"text" IN ( SELECT ("moodboards"."id")::"text" AS "id"
   FROM "public"."moodboards"
  WHERE ("moodboards"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can save gigs" ON "public"."saved_gigs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can send messages" ON "public"."messages" FOR INSERT WITH CHECK (("from_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can unsave gigs" ON "public"."saved_gigs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update conversations they're part of" ON "public"."request_conversations" FOR UPDATE USING (((("auth"."uid"())::"text" = ("requester_id")::"text") OR (("auth"."uid"())::"text" = ("responder_id")::"text")));



CREATE POLICY "Users can update own credits" ON "public"."user_credits" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own gig notification preferences" ON "public"."gig_notification_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own media" ON "public"."media" FOR UPDATE USING (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own notification preferences" ON "public"."notification_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users_profile" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own record" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own user record" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own benefits" ON "public"."subscription_benefits" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own enhancements" ON "public"."listing_enhancements" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own equipment requests" ON "public"."equipment_requests" FOR UPDATE USING ((("auth"."uid"())::"text" = ("requester_id")::"text"));



CREATE POLICY "Users can update their own moodboards" ON "public"."moodboards" FOR UPDATE USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can update their own responses" ON "public"."request_responses" FOR UPDATE USING ((("auth"."uid"())::"text" = ("responder_id")::"text"));



CREATE POLICY "Users can update their own tasks" ON "public"."enhancement_tasks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can upload own media" ON "public"."media" FOR INSERT WITH CHECK (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view active equipment requests" ON "public"."equipment_requests" FOR SELECT USING (("status" = 'active'::"text"));



CREATE POLICY "Users can view all profiles" ON "public"."users_profile" FOR SELECT USING (true);



CREATE POLICY "Users can view all user badges" ON "public"."user_badges" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Users can view conversations they're part of" ON "public"."request_conversations" FOR SELECT USING (((("auth"."uid"())::"text" = ("requester_id")::"text") OR (("auth"."uid"())::"text" = ("responder_id")::"text")));



CREATE POLICY "Users can view messages in their gigs" ON "public"."messages" FOR SELECT USING ((("from_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("to_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view moodboard items" ON "public"."moodboard_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moodboards"
  WHERE (("moodboards"."id" = "moodboard_items"."moodboard_id") AND (("moodboards"."is_public" = true) OR ("moodboards"."owner_user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view own gig notification preferences" ON "public"."gig_notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own logs" ON "public"."age_verification_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own media" ON "public"."media" FOR SELECT USING ((("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("visibility" = 'PUBLIC'::"public"."showcase_visibility")));



CREATE POLICY "Users can view own notification preferences" ON "public"."notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can view own record" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own subscription" ON "public"."subscriptions" FOR SELECT USING (("user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own user badges" ON "public"."user_badges" FOR SELECT USING (("auth"."uid"() IN ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_badges"."user_id"))));



CREATE POLICY "Users can view public showcases" ON "public"."showcases" FOR SELECT USING (("visibility" = 'PUBLIC'::"public"."showcase_visibility"));



CREATE POLICY "Users can view responses to their requests" ON "public"."request_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."equipment_requests"
  WHERE (("equipment_requests"."id" = "request_responses"."request_id") AND (("equipment_requests"."requester_id")::"text" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can view their own benefits" ON "public"."subscription_benefits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own credits" ON "public"."user_credits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own enhancements" ON "public"."listing_enhancements" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own equipment requests" ON "public"."equipment_requests" USING ((("auth"."uid"())::"text" = ("requester_id")::"text"));



CREATE POLICY "Users can view their own moodboards" ON "public"."moodboards" FOR SELECT USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can view their own responses" ON "public"."request_responses" FOR SELECT USING ((("auth"."uid"())::"text" = ("responder_id")::"text"));



CREATE POLICY "Users can view their own saved gigs" ON "public"."saved_gigs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own tasks" ON "public"."enhancement_tasks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own transactions" ON "public"."credit_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



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



CREATE POLICY "admin_view_all_logs" ON "public"."age_verification_logs" FOR SELECT USING (("auth"."uid"() IN ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags")))));



CREATE POLICY "admin_view_all_reports" ON "public"."reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "admin_view_all_verification_requests" ON "public"."verification_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "admin_view_all_violations" ON "public"."user_violations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



ALTER TABLE "public"."age_verification_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collab_applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_applications_insert_as_applicant" ON "public"."collab_applications" FOR INSERT WITH CHECK (("auth"."uid"() = "applicant_id"));



CREATE POLICY "collab_applications_read_own" ON "public"."collab_applications" FOR SELECT USING ((("auth"."uid"() = "applicant_id") OR (EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_applications"."project_id") AND ("cp"."creator_id" = "auth"."uid"()))))));



CREATE POLICY "collab_applications_update_own" ON "public"."collab_applications" FOR UPDATE USING ((("auth"."uid"() = "applicant_id") OR (EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_applications"."project_id") AND ("cp"."creator_id" = "auth"."uid"()))))));



ALTER TABLE "public"."collab_gear_offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_gear_offers_insert_as_offerer" ON "public"."collab_gear_offers" FOR INSERT WITH CHECK (("auth"."uid"() = "offerer_id"));



CREATE POLICY "collab_gear_offers_read_own" ON "public"."collab_gear_offers" FOR SELECT USING ((("auth"."uid"() = "offerer_id") OR (EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_gear_offers"."project_id") AND ("cp"."creator_id" = "auth"."uid"()))))));



CREATE POLICY "collab_gear_offers_update_own" ON "public"."collab_gear_offers" FOR UPDATE USING ((("auth"."uid"() = "offerer_id") OR (EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_gear_offers"."project_id") AND ("cp"."creator_id" = "auth"."uid"()))))));



ALTER TABLE "public"."collab_gear_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_gear_requests_manage_own" ON "public"."collab_gear_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_gear_requests"."project_id") AND ("cp"."creator_id" = "auth"."uid"())))));



CREATE POLICY "collab_gear_requests_read" ON "public"."collab_gear_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_gear_requests"."project_id") AND (("cp"."visibility" = 'public'::"text") OR ("cp"."creator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."collab_participants" "cpp"
          WHERE (("cpp"."project_id" = "cp"."id") AND ("cpp"."user_id" = "auth"."uid"())))))))));



ALTER TABLE "public"."collab_participants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_participants_manage_own" ON "public"."collab_participants" USING ((EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_participants"."project_id") AND ("cp"."creator_id" = "auth"."uid"())))));



CREATE POLICY "collab_participants_read_own" ON "public"."collab_participants" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_participants"."project_id") AND (("cp"."creator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."collab_participants" "cpp"
          WHERE (("cpp"."project_id" = "cp"."id") AND ("cpp"."user_id" = "auth"."uid"()))))))))));



ALTER TABLE "public"."collab_projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_projects_delete_own" ON "public"."collab_projects" FOR DELETE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "collab_projects_insert_own" ON "public"."collab_projects" FOR INSERT WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "collab_projects_read" ON "public"."collab_projects" FOR SELECT USING ((("visibility" = 'public'::"text") OR ("auth"."uid"() = "creator_id") OR (EXISTS ( SELECT 1
   FROM "public"."collab_participants" "cp"
  WHERE (("cp"."project_id" = "cp"."id") AND ("cp"."user_id" = "auth"."uid"()))))));



CREATE POLICY "collab_projects_update_own" ON "public"."collab_projects" FOR UPDATE USING (("auth"."uid"() = "creator_id"));



ALTER TABLE "public"."collab_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_roles_manage_own" ON "public"."collab_roles" USING ((EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_roles"."project_id") AND ("cp"."creator_id" = "auth"."uid"())))));



CREATE POLICY "collab_roles_read" ON "public"."collab_roles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_roles"."project_id") AND (("cp"."visibility" = 'public'::"text") OR ("cp"."creator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."collab_participants" "cpp"
          WHERE (("cpp"."project_id" = "cp"."id") AND ("cpp"."user_id" = "auth"."uid"())))))))));



ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."domain_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enhancement_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gig_notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gigs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_availability" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "listing_availability_manage_own" ON "public"."listing_availability" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_availability"."listing_id") AND ("l"."owner_id" = "auth"."uid"())))));



CREATE POLICY "listing_availability_read" ON "public"."listing_availability" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_availability"."listing_id") AND (("l"."status" = 'active'::"text") OR ("l"."owner_id" = "auth"."uid"()))))));



ALTER TABLE "public"."listing_enhancements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "listing_images_delete_own" ON "public"."listing_images" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_images"."listing_id") AND ("l"."owner_id" = "auth"."uid"())))));



CREATE POLICY "listing_images_insert_own" ON "public"."listing_images" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_images"."listing_id") AND ("l"."owner_id" = "auth"."uid"())))));



CREATE POLICY "listing_images_read" ON "public"."listing_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_images"."listing_id") AND (("l"."status" = 'active'::"text") OR ("l"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "listing_images_update_own" ON "public"."listing_images" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_images"."listing_id") AND ("l"."owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."listings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "listings_delete_own" ON "public"."listings" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "listings_insert_own" ON "public"."listings" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "listings_read_active" ON "public"."listings" FOR SELECT USING ((("status" = 'active'::"text") OR ("auth"."uid"() = "owner_id")));



CREATE POLICY "listings_update_own" ON "public"."listings" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



ALTER TABLE "public"."marketplace_disputes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "marketplace_disputes_insert_as_reporter" ON "public"."marketplace_disputes" FOR INSERT WITH CHECK (("auth"."uid"() = "reporter_id"));



CREATE POLICY "marketplace_disputes_read_own" ON "public"."marketplace_disputes" FOR SELECT USING ((("auth"."uid"() = "reporter_id") OR ("auth"."uid"() = "reported_user_id")));



ALTER TABLE "public"."marketplace_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "marketplace_reviews_insert_as_author" ON "public"."marketplace_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "marketplace_reviews_read_own" ON "public"."marketplace_reviews" FOR SELECT USING ((("auth"."uid"() = "author_id") OR ("auth"."uid"() = "subject_user_id")));



CREATE POLICY "marketplace_reviews_update_own" ON "public"."marketplace_reviews" FOR UPDATE USING (("auth"."uid"() = "author_id"));



ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_marketplace_insert" ON "public"."messages" FOR INSERT WITH CHECK (((("context_type" = 'gig'::"text") AND ((EXISTS ( SELECT 1
   FROM "public"."gigs"
  WHERE (("gigs"."id" = "messages"."gig_id") AND ("gigs"."owner_user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."applications"
  WHERE (("applications"."gig_id" = "messages"."gig_id") AND ("applications"."applicant_user_id" = "auth"."uid"())))))) OR (("context_type" = 'marketplace'::"text") AND ("listing_id" IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "messages"."listing_id") AND ("listings"."owner_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."rental_orders"
  WHERE (("rental_orders"."listing_id" = "messages"."listing_id") AND (("rental_orders"."owner_id" = "auth"."uid"()) OR ("rental_orders"."renter_id" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."sale_orders"
  WHERE (("sale_orders"."listing_id" = "messages"."listing_id") AND (("sale_orders"."owner_id" = "auth"."uid"()) OR ("sale_orders"."buyer_id" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."offers"
  WHERE (("offers"."listing_id" = "messages"."listing_id") AND (("offers"."from_user" = "auth"."uid"()) OR ("offers"."to_user" = "auth"."uid"()))))))) OR (("context_type" = 'marketplace'::"text") AND ((("rental_order_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."rental_orders"
  WHERE (("rental_orders"."id" = "messages"."rental_order_id") AND (("rental_orders"."owner_id" = "auth"."uid"()) OR ("rental_orders"."renter_id" = "auth"."uid"())))))) OR (("sale_order_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."sale_orders"
  WHERE (("sale_orders"."id" = "messages"."sale_order_id") AND (("sale_orders"."owner_id" = "auth"."uid"()) OR ("sale_orders"."buyer_id" = "auth"."uid"())))))) OR (("offer_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."offers"
  WHERE (("offers"."id" = "messages"."offer_id") AND (("offers"."from_user" = "auth"."uid"()) OR ("offers"."to_user" = "auth"."uid"()))))))))));



CREATE POLICY "messages_marketplace_read" ON "public"."messages" FOR SELECT USING (((("context_type" = 'gig'::"text") AND ((EXISTS ( SELECT 1
   FROM "public"."gigs"
  WHERE (("gigs"."id" = "messages"."gig_id") AND ("gigs"."owner_user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."applications"
  WHERE (("applications"."gig_id" = "messages"."gig_id") AND ("applications"."applicant_user_id" = "auth"."uid"())))))) OR (("context_type" = 'marketplace'::"text") AND ("listing_id" IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "messages"."listing_id") AND ("listings"."owner_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."rental_orders"
  WHERE (("rental_orders"."listing_id" = "messages"."listing_id") AND (("rental_orders"."owner_id" = "auth"."uid"()) OR ("rental_orders"."renter_id" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."sale_orders"
  WHERE (("sale_orders"."listing_id" = "messages"."listing_id") AND (("sale_orders"."owner_id" = "auth"."uid"()) OR ("sale_orders"."buyer_id" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."offers"
  WHERE (("offers"."listing_id" = "messages"."listing_id") AND (("offers"."from_user" = "auth"."uid"()) OR ("offers"."to_user" = "auth"."uid"()))))))) OR (("context_type" = 'marketplace'::"text") AND ((("rental_order_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."rental_orders"
  WHERE (("rental_orders"."id" = "messages"."rental_order_id") AND (("rental_orders"."owner_id" = "auth"."uid"()) OR ("rental_orders"."renter_id" = "auth"."uid"())))))) OR (("sale_order_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."sale_orders"
  WHERE (("sale_orders"."id" = "messages"."sale_order_id") AND (("sale_orders"."owner_id" = "auth"."uid"()) OR ("sale_orders"."buyer_id" = "auth"."uid"())))))) OR (("offer_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."offers"
  WHERE (("offers"."id" = "messages"."offer_id") AND (("offers"."from_user" = "auth"."uid"()) OR ("offers"."to_user" = "auth"."uid"()))))))))));



ALTER TABLE "public"."moderation_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moodboard_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moodboards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "offers_insert_as_sender" ON "public"."offers" FOR INSERT WITH CHECK (("auth"."uid"() = "from_user"));



CREATE POLICY "offers_read_own" ON "public"."offers" FOR SELECT USING ((("auth"."uid"() = "from_user") OR ("auth"."uid"() = "to_user")));



CREATE POLICY "offers_update_own" ON "public"."offers" FOR UPDATE USING ((("auth"."uid"() = "from_user") OR ("auth"."uid"() = "to_user")));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_view_badges" ON "public"."verification_badges" FOR SELECT USING (true);



ALTER TABLE "public"."rental_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rental_orders_insert_as_renter" ON "public"."rental_orders" FOR INSERT WITH CHECK (("auth"."uid"() = "renter_id"));



CREATE POLICY "rental_orders_read_own" ON "public"."rental_orders" FOR SELECT USING ((("auth"."uid"() = "owner_id") OR ("auth"."uid"() = "renter_id")));



CREATE POLICY "rental_orders_update_own" ON "public"."rental_orders" FOR UPDATE USING ((("auth"."uid"() = "owner_id") OR ("auth"."uid"() = "renter_id")));



ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."request_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."request_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sale_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sale_orders_insert_as_buyer" ON "public"."sale_orders" FOR INSERT WITH CHECK (("auth"."uid"() = "buyer_id"));



CREATE POLICY "sale_orders_read_own" ON "public"."sale_orders" FOR SELECT USING ((("auth"."uid"() = "owner_id") OR ("auth"."uid"() = "buyer_id")));



CREATE POLICY "sale_orders_update_own" ON "public"."sale_orders" FOR UPDATE USING ((("auth"."uid"() = "owner_id") OR ("auth"."uid"() = "buyer_id")));



ALTER TABLE "public"."saved_gigs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."showcases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_benefits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "system_insert_logs" ON "public"."age_verification_logs" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_create_reports" ON "public"."reports" FOR INSERT WITH CHECK (("reporter_user_id" = "auth"."uid"()));



CREATE POLICY "user_create_verification_requests" ON "public"."verification_requests" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_credits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_view_own_actions" ON "public"."moderation_actions" FOR SELECT USING (("target_user_id" = "auth"."uid"()));



CREATE POLICY "user_view_own_logs" ON "public"."age_verification_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_view_own_reports" ON "public"."reports" FOR SELECT USING (("reporter_user_id" = "auth"."uid"()));



CREATE POLICY "user_view_own_verification_requests" ON "public"."verification_requests" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_view_own_violations" ON "public"."user_violations" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_violations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users_profile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."violation_thresholds" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."box2d_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2d_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."box2d_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2d_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2d_out"("public"."box2d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2d_out"("public"."box2d") TO "anon";
GRANT ALL ON FUNCTION "public"."box2d_out"("public"."box2d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2d_out"("public"."box2d") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2df_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2df_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."box2df_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2df_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2df_out"("public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2df_out"("public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."box2df_out"("public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2df_out"("public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3d_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3d_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."box3d_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3d_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3d_out"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3d_out"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."box3d_out"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3d_out"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_analyze"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_analyze"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_analyze"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_analyze"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_out"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_out"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_out"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_out"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_send"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_send"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_send"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_send"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_typmod_out"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_typmod_out"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_typmod_out"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_typmod_out"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_analyze"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_analyze"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_analyze"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_analyze"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_out"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_out"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_out"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_out"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_recv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_recv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_recv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_recv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_send"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_send"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_send"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_send"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_typmod_out"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_typmod_out"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_typmod_out"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_typmod_out"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gidx_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gidx_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gidx_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gidx_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gidx_out"("public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."gidx_out"("public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."gidx_out"("public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gidx_out"("public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."spheroid_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."spheroid_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."spheroid_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."spheroid_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."spheroid_out"("public"."spheroid") TO "postgres";
GRANT ALL ON FUNCTION "public"."spheroid_out"("public"."spheroid") TO "anon";
GRANT ALL ON FUNCTION "public"."spheroid_out"("public"."spheroid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."spheroid_out"("public"."spheroid") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3d"("public"."box2d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3d"("public"."box2d") TO "anon";
GRANT ALL ON FUNCTION "public"."box3d"("public"."box2d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3d"("public"."box2d") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("public"."box2d") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box2d") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box2d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box2d") TO "service_role";



GRANT ALL ON FUNCTION "public"."box"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."box"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2d"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2d"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."box2d"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2d"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."geography"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."bytea"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography"("public"."geography", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography"("public"."geography", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."geography"("public"."geography", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography"("public"."geography", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."box"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."box"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."box"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."box2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."box3d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."bytea"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geography"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("public"."geometry", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geometry", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geometry", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geometry", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."json"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."json"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."json"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."json"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."jsonb"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."jsonb"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."jsonb"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."jsonb"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."path"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."path"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."path"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."path"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."point"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."point"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."point"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."point"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."polygon"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."polygon"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."polygon"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."polygon"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."text"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."text"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."text"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."text"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("path") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("path") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("path") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("path") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("point") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("point") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("point") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("point") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("polygon") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("polygon") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("polygon") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("polygon") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("text") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."_postgis_deprecate"("oldname" "text", "newname" "text", "version" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_deprecate"("oldname" "text", "newname" "text", "version" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_deprecate"("oldname" "text", "newname" "text", "version" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_deprecate"("oldname" "text", "newname" "text", "version" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_index_extent"("tbl" "regclass", "col" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_index_extent"("tbl" "regclass", "col" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_index_extent"("tbl" "regclass", "col" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_index_extent"("tbl" "regclass", "col" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_join_selectivity"("regclass", "text", "regclass", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_join_selectivity"("regclass", "text", "regclass", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_join_selectivity"("regclass", "text", "regclass", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_join_selectivity"("regclass", "text", "regclass", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_pgsql_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_pgsql_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_pgsql_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_pgsql_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_scripts_pgsql_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_scripts_pgsql_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_scripts_pgsql_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_scripts_pgsql_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_selectivity"("tbl" "regclass", "att_name" "text", "geom" "public"."geometry", "mode" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_selectivity"("tbl" "regclass", "att_name" "text", "geom" "public"."geometry", "mode" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_selectivity"("tbl" "regclass", "att_name" "text", "geom" "public"."geometry", "mode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_selectivity"("tbl" "regclass", "att_name" "text", "geom" "public"."geometry", "mode" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_stats"("tbl" "regclass", "att_name" "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_stats"("tbl" "regclass", "att_name" "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_stats"("tbl" "regclass", "att_name" "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_stats"("tbl" "regclass", "att_name" "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_asgml"(integer, "public"."geometry", integer, integer, "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_asgml"(integer, "public"."geometry", integer, integer, "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_asgml"(integer, "public"."geometry", integer, integer, "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_asgml"(integer, "public"."geometry", integer, integer, "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_asx3d"(integer, "public"."geometry", integer, integer, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_asx3d"(integer, "public"."geometry", integer, integer, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_asx3d"(integer, "public"."geometry", integer, integer, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_asx3d"(integer, "public"."geometry", integer, integer, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography", double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography", double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography", double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography", double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_expand"("public"."geography", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_expand"("public"."geography", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_expand"("public"."geography", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_expand"("public"."geography", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_geomfromgml"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_geomfromgml"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_geomfromgml"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_geomfromgml"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_pointoutside"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_pointoutside"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_pointoutside"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_pointoutside"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_sortablehash"("geom" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_sortablehash"("geom" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_sortablehash"("geom" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_sortablehash"("geom" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_voronoi"("g1" "public"."geometry", "clip" "public"."geometry", "tolerance" double precision, "return_polygons" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_voronoi"("g1" "public"."geometry", "clip" "public"."geometry", "tolerance" double precision, "return_polygons" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_voronoi"("g1" "public"."geometry", "clip" "public"."geometry", "tolerance" double precision, "return_polygons" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_voronoi"("g1" "public"."geometry", "clip" "public"."geometry", "tolerance" double precision, "return_polygons" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_equipment_provider_as_participant"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_equipment_provider_as_participant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_equipment_provider_as_participant"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_project_creator_as_participant"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_project_creator_as_participant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_project_creator_as_participant"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_user_violation"("p_user_id" "uuid", "p_violation_type" "text", "p_severity" "text", "p_description" "text", "p_report_id" "uuid", "p_evidence_urls" "text"[], "p_expires_in_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_user_violation"("p_user_id" "uuid", "p_violation_type" "text", "p_severity" "text", "p_description" "text", "p_report_id" "uuid", "p_evidence_urls" "text"[], "p_expires_in_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_user_violation"("p_user_id" "uuid", "p_violation_type" "text", "p_severity" "text", "p_description" "text", "p_report_id" "uuid", "p_evidence_urls" "text"[], "p_expires_in_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."addauth"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."addauth"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."addauth"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."addauth"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "service_role";



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



GRANT ALL ON FUNCTION "public"."award_badge"("p_user_id" "uuid", "p_badge_slug" character varying, "p_awarded_by" "uuid", "p_reason" "text", "p_verified_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."award_badge"("p_user_id" "uuid", "p_badge_slug" character varying, "p_awarded_by" "uuid", "p_reason" "text", "p_verified_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_badge"("p_user_id" "uuid", "p_badge_slug" character varying, "p_awarded_by" "uuid", "p_reason" "text", "p_verified_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3dtobox"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3dtobox"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."box3dtobox"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3dtobox"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_age"("birth_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_age"("birth_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_age"("birth_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_location_score"("user_city" "text", "gig_location" "text", "user_travels" boolean, "travel_radius_km" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_location_score"("user_city" "text", "gig_location" "text", "user_travels" boolean, "travel_radius_km" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_location_score"("user_city" "text", "gig_location" "text", "user_travels" boolean, "travel_radius_km" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_style_compatibility"("user_tags" "text"[], "gig_tags" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_style_compatibility"("user_tags" "text"[], "gig_tags" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_style_compatibility"("user_tags" "text"[], "gig_tags" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_user_risk_score"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_user_risk_score"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_user_risk_score"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_use_monthly_bump"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_use_monthly_bump"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_use_monthly_bump"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rental_availability"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_rental_availability"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rental_availability"() TO "service_role";



GRANT ALL ON FUNCTION "public"."checkauth"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."checkauth"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."checkauthtrigger"() TO "postgres";
GRANT ALL ON FUNCTION "public"."checkauthtrigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."checkauthtrigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkauthtrigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_domain_events"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_domain_events"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_domain_events"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."consume_platform_credits"("p_provider" character varying, "p_credits" integer, "p_cost" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."consume_platform_credits"("p_provider" character varying, "p_credits" integer, "p_cost" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."consume_platform_credits"("p_provider" character varying, "p_credits" integer, "p_cost" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."contains_2d"("public"."geometry", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."geometry", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."geometry", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."geometry", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_user_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_user_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_user_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_marketplace_conversation"("p_listing_id" "uuid", "p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_initial_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_marketplace_conversation"("p_listing_id" "uuid", "p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_initial_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_marketplace_conversation"("p_listing_id" "uuid", "p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_initial_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_marketplace_notification"("p_recipient_id" "uuid", "p_type" character varying, "p_title" character varying, "p_message" "text", "p_avatar_url" "text", "p_action_url" "text", "p_action_data" "jsonb", "p_sender_id" "uuid", "p_listing_id" "uuid", "p_rental_order_id" "uuid", "p_sale_order_id" "uuid", "p_offer_id" "uuid", "p_review_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_marketplace_notification"("p_recipient_id" "uuid", "p_type" character varying, "p_title" character varying, "p_message" "text", "p_avatar_url" "text", "p_action_url" "text", "p_action_data" "jsonb", "p_sender_id" "uuid", "p_listing_id" "uuid", "p_rental_order_id" "uuid", "p_sale_order_id" "uuid", "p_offer_id" "uuid", "p_review_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_marketplace_notification"("p_recipient_id" "uuid", "p_type" character varying, "p_title" character varying, "p_message" "text", "p_avatar_url" "text", "p_action_url" "text", "p_action_data" "jsonb", "p_sender_id" "uuid", "p_listing_id" "uuid", "p_rental_order_id" "uuid", "p_sale_order_id" "uuid", "p_offer_id" "uuid", "p_review_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_rental_availability_block"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_rental_availability_block"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_rental_availability_block"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_settings_on_profile_create"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_settings_on_profile_create"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_settings_on_profile_create"() TO "service_role";



GRANT ALL ON FUNCTION "public"."disablelongtransactions"() TO "postgres";
GRANT ALL ON FUNCTION "public"."disablelongtransactions"() TO "anon";
GRANT ALL ON FUNCTION "public"."disablelongtransactions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."disablelongtransactions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("table_name" character varying, "column_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("table_name" character varying, "column_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("table_name" character varying, "column_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("table_name" character varying, "column_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrytable"("table_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("table_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("table_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("table_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrytable"("schema_name" character varying, "table_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("schema_name" character varying, "table_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("schema_name" character varying, "table_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("schema_name" character varying, "table_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrytable"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."enablelongtransactions"() TO "postgres";
GRANT ALL ON FUNCTION "public"."enablelongtransactions"() TO "anon";
GRANT ALL ON FUNCTION "public"."enablelongtransactions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enablelongtransactions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_equipment_requests"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_equipment_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_equipment_requests"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_listing_enhancements"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_listing_enhancements"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_listing_enhancements"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_old_violations"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_old_violations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_old_violations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_suspensions"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_suspensions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_suspensions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_verifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_verifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_verifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."extract_cinematic_tags"("metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."extract_cinematic_tags"("metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."extract_cinematic_tags"("metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_compatible_gigs_for_user"("p_profile_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_compatible_gigs_for_user"("p_profile_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_compatible_gigs_for_user"("p_profile_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_compatible_users_for_contributor"("p_profile_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_compatible_users_for_contributor"("p_profile_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_compatible_users_for_contributor"("p_profile_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_srid"(character varying, character varying, character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."find_srid"(character varying, character varying, character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."find_srid"(character varying, character varying, character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_srid"(character varying, character varying, character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."geog_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geog_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geog_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geog_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_cmp"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_cmp"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_cmp"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_cmp"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_distance_knn"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_distance_knn"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_distance_knn"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_distance_knn"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_eq"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_eq"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_eq"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_eq"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_ge"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_ge"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_ge"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_ge"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_consistent"("internal", "public"."geography", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_consistent"("internal", "public"."geography", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_consistent"("internal", "public"."geography", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_consistent"("internal", "public"."geography", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_distance"("internal", "public"."geography", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_distance"("internal", "public"."geography", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_distance"("internal", "public"."geography", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_distance"("internal", "public"."geography", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_same"("public"."box2d", "public"."box2d", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_same"("public"."box2d", "public"."box2d", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_same"("public"."box2d", "public"."box2d", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_same"("public"."box2d", "public"."box2d", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_union"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_union"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_union"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_union"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gt"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gt"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gt"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gt"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_le"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_le"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_le"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_le"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_lt"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_lt"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_lt"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_lt"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_overlaps"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_overlaps"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_overlaps"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_overlaps"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_choose_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_choose_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_choose_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_choose_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_compress_nd"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_compress_nd"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_compress_nd"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_compress_nd"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_config_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_config_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_config_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_config_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_inner_consistent_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_inner_consistent_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_inner_consistent_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_inner_consistent_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_leaf_consistent_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_leaf_consistent_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_leaf_consistent_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_leaf_consistent_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_picksplit_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_picksplit_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_picksplit_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_picksplit_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geom2d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geom2d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geom2d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geom2d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geom3d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geom3d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geom3d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geom3d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geom4d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geom4d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geom4d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geom4d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_above"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_above"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_above"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_above"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_below"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_below"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_below"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_below"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_cmp"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_cmp"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_cmp"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_cmp"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_contained_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_contained_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_contained_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_contained_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_contains_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_contains_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_contains_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_contains_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_contains_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_contains_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_contains_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_contains_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_distance_box"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_distance_box"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_distance_box"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_distance_box"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_distance_centroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_distance_centroid_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_distance_cpa"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_distance_cpa"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_distance_cpa"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_distance_cpa"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_eq"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_eq"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_eq"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_eq"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_ge"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_ge"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_ge"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_ge"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_compress_2d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_2d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_2d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_2d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_compress_nd"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_nd"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_nd"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_nd"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_2d"("internal", "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_2d"("internal", "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_2d"("internal", "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_2d"("internal", "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_nd"("internal", "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_nd"("internal", "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_nd"("internal", "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_nd"("internal", "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_2d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_2d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_2d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_2d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_nd"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_nd"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_nd"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_nd"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_distance_2d"("internal", "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_2d"("internal", "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_2d"("internal", "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_2d"("internal", "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_distance_nd"("internal", "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_nd"("internal", "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_nd"("internal", "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_nd"("internal", "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_2d"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_2d"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_2d"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_2d"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_nd"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_nd"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_nd"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_nd"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_same_2d"("geom1" "public"."geometry", "geom2" "public"."geometry", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_2d"("geom1" "public"."geometry", "geom2" "public"."geometry", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_2d"("geom1" "public"."geometry", "geom2" "public"."geometry", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_2d"("geom1" "public"."geometry", "geom2" "public"."geometry", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_same_nd"("public"."geometry", "public"."geometry", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_nd"("public"."geometry", "public"."geometry", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_nd"("public"."geometry", "public"."geometry", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_nd"("public"."geometry", "public"."geometry", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_sortsupport_2d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_sortsupport_2d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_sortsupport_2d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_sortsupport_2d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_union_2d"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_2d"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_2d"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_2d"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_union_nd"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_nd"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_nd"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_nd"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_hash"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_hash"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_hash"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_hash"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_le"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_le"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_le"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_le"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_left"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_left"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_left"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_left"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_lt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_lt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_lt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_lt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overabove"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overabove"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overabove"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overabove"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overbelow"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overbelow"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overbelow"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overbelow"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overlaps_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overlaps_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overleft"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overleft"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overleft"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overleft"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overright"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overright"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overright"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overright"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_right"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_right"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_right"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_right"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_same"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_same"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_same"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_same"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_same_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_same_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_same_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_same_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_same_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_same_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_same_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_same_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_sortsupport"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_sortsupport"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_sortsupport"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_sortsupport"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_2d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_2d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_2d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_2d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_3d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_3d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_3d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_3d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_nd"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_nd"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_nd"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_nd"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_config_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_config_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_config_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_within_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_within_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_within_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_within_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geomfromewkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."geomfromewkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."geomfromewkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geomfromewkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."geomfromewkt"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."geomfromewkt"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."geomfromewkt"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geomfromewkt"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_marketplace_conversation_context"("p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_marketplace_conversation_context"("p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_marketplace_conversation_context"("p_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_marketplace_conversation_participants"("p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_marketplace_conversation_participants"("p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_marketplace_conversation_participants"("p_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_proj4_from_srid"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."get_proj4_from_srid"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_proj4_from_srid"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_proj4_from_srid"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_request_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_request_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_request_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_badges"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_badges"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_badges"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_subscription_benefits"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_subscription_benefits"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_subscription_benefits"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_violation_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_violation_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_violation_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_violation_summary"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_violation_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_violation_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."gettransactionid"() TO "postgres";
GRANT ALL ON FUNCTION "public"."gettransactionid"() TO "anon";
GRANT ALL ON FUNCTION "public"."gettransactionid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."gettransactionid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_2d"("internal", "oid", "internal", smallint) TO "postgres";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_2d"("internal", "oid", "internal", smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_2d"("internal", "oid", "internal", smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_2d"("internal", "oid", "internal", smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_nd"("internal", "oid", "internal", smallint) TO "postgres";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_nd"("internal", "oid", "internal", smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_nd"("internal", "oid", "internal", smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_nd"("internal", "oid", "internal", smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_2d"("internal", "oid", "internal", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_2d"("internal", "oid", "internal", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_2d"("internal", "oid", "internal", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_2d"("internal", "oid", "internal", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_nd"("internal", "oid", "internal", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_nd"("internal", "oid", "internal", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_nd"("internal", "oid", "internal", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_nd"("internal", "oid", "internal", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_profile_views"("profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_profile_views"("profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_profile_views"("profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_user_credits"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_user_credits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_user_credits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."geometry", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."geometry", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."geometry", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."geometry", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_suspended_or_banned"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_suspended_or_banned"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_suspended_or_banned"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", timestamp without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text", timestamp without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text", timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text", timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text", timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."longtransactionsenabled"() TO "postgres";
GRANT ALL ON FUNCTION "public"."longtransactionsenabled"() TO "anon";
GRANT ALL ON FUNCTION "public"."longtransactionsenabled"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."longtransactionsenabled"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_listing_event"("p_listing_id" "uuid", "p_event_type" character varying, "p_recipient_id" "uuid", "p_sender_id" "uuid", "p_custom_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_listing_event"("p_listing_id" "uuid", "p_event_type" character varying, "p_recipient_id" "uuid", "p_sender_id" "uuid", "p_custom_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_listing_event"("p_listing_id" "uuid", "p_event_type" character varying, "p_recipient_id" "uuid", "p_sender_id" "uuid", "p_custom_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_order_event"("p_order_id" "uuid", "p_order_type" character varying, "p_event_type" character varying, "p_recipient_id" "uuid", "p_custom_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_order_event"("p_order_id" "uuid", "p_order_type" character varying, "p_event_type" character varying, "p_recipient_id" "uuid", "p_custom_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_order_event"("p_order_id" "uuid", "p_order_type" character varying, "p_event_type" character varying, "p_recipient_id" "uuid", "p_custom_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."geometry", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."geometry", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."geometry", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."geometry", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."geography", "public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."geography", "public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."geography", "public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."geography", "public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."geometry", "public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."geometry", "public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."geometry", "public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."geometry", "public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_combinefn"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_combinefn"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_combinefn"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_combinefn"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_deserialfn"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_deserialfn"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_deserialfn"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_deserialfn"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_serialfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_serialfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_serialfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_serialfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterintersecting_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterintersecting_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterintersecting_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterintersecting_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterwithin_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterwithin_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterwithin_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterwithin_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_collect_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_collect_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_collect_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_collect_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_makeline_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_makeline_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_makeline_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_makeline_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_polygonize_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_polygonize_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_polygonize_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_polygonize_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_combinefn"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_combinefn"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_combinefn"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_combinefn"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_deserialfn"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_deserialfn"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_deserialfn"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_deserialfn"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_serialfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_serialfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_serialfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_serialfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("tbl_oid" "oid", "use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("tbl_oid" "oid", "use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("tbl_oid" "oid", "use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("tbl_oid" "oid", "use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_addbbox"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_addbbox"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_addbbox"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_addbbox"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_cache_bbox"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_cache_bbox"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_cache_bbox"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_cache_bbox"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_constraint_dims"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_constraint_dims"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_constraint_dims"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_constraint_dims"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_constraint_srid"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_constraint_srid"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_constraint_srid"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_constraint_srid"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_constraint_type"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_constraint_type"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_constraint_type"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_constraint_type"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_dropbbox"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_dropbbox"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_dropbbox"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_dropbbox"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_extensions_upgrade"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_extensions_upgrade"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_extensions_upgrade"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_extensions_upgrade"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_full_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_full_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_full_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_full_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_geos_noop"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_geos_noop"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_geos_noop"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_geos_noop"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_geos_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_geos_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_geos_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_geos_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_getbbox"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_getbbox"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_getbbox"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_getbbox"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_hasbbox"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_hasbbox"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_hasbbox"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_hasbbox"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_index_supportfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_index_supportfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_index_supportfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_index_supportfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_lib_build_date"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_lib_build_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_lib_build_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_lib_build_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_lib_revision"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_lib_revision"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_lib_revision"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_lib_revision"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_lib_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_lib_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_lib_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_lib_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_libjson_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_libjson_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_libjson_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_libjson_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_liblwgeom_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_liblwgeom_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_liblwgeom_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_liblwgeom_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_libprotobuf_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_libprotobuf_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_libprotobuf_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_libprotobuf_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_libxml_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_libxml_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_libxml_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_libxml_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_noop"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_noop"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_noop"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_noop"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_proj_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_proj_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_proj_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_proj_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_scripts_build_date"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_scripts_build_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_scripts_build_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_scripts_build_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_scripts_installed"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_scripts_installed"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_scripts_installed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_scripts_installed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_scripts_released"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_scripts_released"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_scripts_released"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_scripts_released"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_svn_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_svn_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_svn_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_svn_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_transform_geometry"("geom" "public"."geometry", "text", "text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_transform_geometry"("geom" "public"."geometry", "text", "text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_transform_geometry"("geom" "public"."geometry", "text", "text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_transform_geometry"("geom" "public"."geometry", "text", "text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_type_name"("geomname" character varying, "coord_dimension" integer, "use_new_name" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_type_name"("geomname" character varying, "coord_dimension" integer, "use_new_name" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_type_name"("geomname" character varying, "coord_dimension" integer, "use_new_name" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_type_name"("geomname" character varying, "coord_dimension" integer, "use_new_name" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_typmod_dims"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_typmod_dims"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_typmod_dims"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_typmod_dims"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_typmod_srid"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_typmod_srid"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_typmod_srid"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_typmod_srid"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_typmod_type"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_typmod_type"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_typmod_type"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_typmod_type"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_wagyu_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_wagyu_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_wagyu_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_wagyu_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refund_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."refund_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."refund_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_rejection_reason" "text", "p_review_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_rejection_reason" "text", "p_review_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_rejection_reason" "text", "p_review_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_badge"("p_user_id" "uuid", "p_badge_slug" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."remove_badge"("p_user_id" "uuid", "p_badge_slug" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_badge"("p_user_id" "uuid", "p_badge_slug" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_monthly_subscription_benefits"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_monthly_subscription_benefits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_monthly_subscription_benefits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_conversation_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_conversation_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_conversation_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dclosestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dclosestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dclosestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dclosestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3ddistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3ddistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3ddistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3ddistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dlength"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dlength"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dlength"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dlength"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dlineinterpolatepoint"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dlineinterpolatepoint"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dlineinterpolatepoint"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dlineinterpolatepoint"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dlongestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dlongestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dlongestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dlongestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dmakebox"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dmakebox"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dmakebox"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dmakebox"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dmaxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dmaxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dmaxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dmaxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dperimeter"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dperimeter"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dperimeter"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dperimeter"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dshortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dshortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dshortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dshortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_addmeasure"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_addmeasure"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_addmeasure"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_addmeasure"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_angle"("line1" "public"."geometry", "line2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_angle"("line1" "public"."geometry", "line2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_angle"("line1" "public"."geometry", "line2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_angle"("line1" "public"."geometry", "line2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_angle"("pt1" "public"."geometry", "pt2" "public"."geometry", "pt3" "public"."geometry", "pt4" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_angle"("pt1" "public"."geometry", "pt2" "public"."geometry", "pt3" "public"."geometry", "pt4" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_angle"("pt1" "public"."geometry", "pt2" "public"."geometry", "pt3" "public"."geometry", "pt4" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_angle"("pt1" "public"."geometry", "pt2" "public"."geometry", "pt3" "public"."geometry", "pt4" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_area"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_area"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_area"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_area"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_area"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_area"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_area"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_area"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_area"("geog" "public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_area"("geog" "public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_area"("geog" "public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_area"("geog" "public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_area2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_area2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_area2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_area2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asencodedpolyline"("geom" "public"."geometry", "nprecision" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asencodedpolyline"("geom" "public"."geometry", "nprecision" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asencodedpolyline"("geom" "public"."geometry", "nprecision" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asencodedpolyline"("geom" "public"."geometry", "nprecision" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeojson"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeojson"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeojson"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeojson"("r" "record", "geom_column" "text", "maxdecimaldigits" integer, "pretty_bool" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("r" "record", "geom_column" "text", "maxdecimaldigits" integer, "pretty_bool" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("r" "record", "geom_column" "text", "maxdecimaldigits" integer, "pretty_bool" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("r" "record", "geom_column" "text", "maxdecimaldigits" integer, "pretty_bool" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_askml"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_askml"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_askml"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_askml"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_askml"("geog" "public"."geography", "maxdecimaldigits" integer, "nprefix" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_askml"("geog" "public"."geography", "maxdecimaldigits" integer, "nprefix" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_askml"("geog" "public"."geography", "maxdecimaldigits" integer, "nprefix" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_askml"("geog" "public"."geography", "maxdecimaldigits" integer, "nprefix" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_askml"("geom" "public"."geometry", "maxdecimaldigits" integer, "nprefix" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_askml"("geom" "public"."geometry", "maxdecimaldigits" integer, "nprefix" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_askml"("geom" "public"."geometry", "maxdecimaldigits" integer, "nprefix" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_askml"("geom" "public"."geometry", "maxdecimaldigits" integer, "nprefix" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_aslatlontext"("geom" "public"."geometry", "tmpl" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_aslatlontext"("geom" "public"."geometry", "tmpl" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_aslatlontext"("geom" "public"."geometry", "tmpl" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_aslatlontext"("geom" "public"."geometry", "tmpl" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmarc21"("geom" "public"."geometry", "format" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmarc21"("geom" "public"."geometry", "format" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmarc21"("geom" "public"."geometry", "format" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmarc21"("geom" "public"."geometry", "format" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvtgeom"("geom" "public"."geometry", "bounds" "public"."box2d", "extent" integer, "buffer" integer, "clip_geom" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvtgeom"("geom" "public"."geometry", "bounds" "public"."box2d", "extent" integer, "buffer" integer, "clip_geom" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvtgeom"("geom" "public"."geometry", "bounds" "public"."box2d", "extent" integer, "buffer" integer, "clip_geom" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvtgeom"("geom" "public"."geometry", "bounds" "public"."box2d", "extent" integer, "buffer" integer, "clip_geom" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_assvg"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_assvg"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_assvg"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_assvg"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_assvg"("geog" "public"."geography", "rel" integer, "maxdecimaldigits" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_assvg"("geog" "public"."geography", "rel" integer, "maxdecimaldigits" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_assvg"("geog" "public"."geography", "rel" integer, "maxdecimaldigits" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_assvg"("geog" "public"."geography", "rel" integer, "maxdecimaldigits" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_assvg"("geom" "public"."geometry", "rel" integer, "maxdecimaldigits" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_assvg"("geom" "public"."geometry", "rel" integer, "maxdecimaldigits" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_assvg"("geom" "public"."geometry", "rel" integer, "maxdecimaldigits" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_assvg"("geom" "public"."geometry", "rel" integer, "maxdecimaldigits" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry", "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry", "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry", "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry", "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry"[], "ids" bigint[], "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry"[], "ids" bigint[], "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry"[], "ids" bigint[], "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry"[], "ids" bigint[], "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asx3d"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asx3d"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asx3d"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asx3d"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_azimuth"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_azimuth"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_bdmpolyfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_bdmpolyfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_bdmpolyfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_bdmpolyfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_bdpolyfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_bdpolyfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_bdpolyfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_bdpolyfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_boundary"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_boundary"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_boundary"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_boundary"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_boundingdiagonal"("geom" "public"."geometry", "fits" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_boundingdiagonal"("geom" "public"."geometry", "fits" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_boundingdiagonal"("geom" "public"."geometry", "fits" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_boundingdiagonal"("geom" "public"."geometry", "fits" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_box2dfromgeohash"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_box2dfromgeohash"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_box2dfromgeohash"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_box2dfromgeohash"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "quadsegs" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "quadsegs" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "quadsegs" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "quadsegs" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "options" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "options" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "options" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "options" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buildarea"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buildarea"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_buildarea"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buildarea"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_centroid"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_centroid"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_centroid"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_centroid"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_chaikinsmoothing"("public"."geometry", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_chaikinsmoothing"("public"."geometry", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_chaikinsmoothing"("public"."geometry", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_chaikinsmoothing"("public"."geometry", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_cleangeometry"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_cleangeometry"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_cleangeometry"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_cleangeometry"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clipbybox2d"("geom" "public"."geometry", "box" "public"."box2d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clipbybox2d"("geom" "public"."geometry", "box" "public"."box2d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_clipbybox2d"("geom" "public"."geometry", "box" "public"."box2d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clipbybox2d"("geom" "public"."geometry", "box" "public"."box2d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_closestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_closestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_closestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_closestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_closestpointofapproach"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_closestpointofapproach"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_closestpointofapproach"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_closestpointofapproach"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterdbscan"("public"."geometry", "eps" double precision, "minpoints" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterdbscan"("public"."geometry", "eps" double precision, "minpoints" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterdbscan"("public"."geometry", "eps" double precision, "minpoints" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterdbscan"("public"."geometry", "eps" double precision, "minpoints" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterkmeans"("geom" "public"."geometry", "k" integer, "max_radius" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterkmeans"("geom" "public"."geometry", "k" integer, "max_radius" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterkmeans"("geom" "public"."geometry", "k" integer, "max_radius" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterkmeans"("geom" "public"."geometry", "k" integer, "max_radius" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry"[], double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry"[], double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry"[], double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry"[], double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collect"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collect"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_collect"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collect"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collectionhomogenize"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collectionhomogenize"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_collectionhomogenize"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collectionhomogenize"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box2d", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box2d", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box2d", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box2d", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_concavehull"("param_geom" "public"."geometry", "param_pctconvex" double precision, "param_allow_holes" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_concavehull"("param_geom" "public"."geometry", "param_pctconvex" double precision, "param_allow_holes" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_concavehull"("param_geom" "public"."geometry", "param_pctconvex" double precision, "param_allow_holes" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_concavehull"("param_geom" "public"."geometry", "param_pctconvex" double precision, "param_allow_holes" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_convexhull"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_convexhull"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_convexhull"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_convexhull"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_coorddim"("geometry" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_coorddim"("geometry" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_coorddim"("geometry" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_coorddim"("geometry" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_coveredby"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_coveredby"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_coveredby"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_coveredby"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_covers"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_covers"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_covers"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_covers"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_cpawithin"("public"."geometry", "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_cpawithin"("public"."geometry", "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_cpawithin"("public"."geometry", "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_cpawithin"("public"."geometry", "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_curvetoline"("geom" "public"."geometry", "tol" double precision, "toltype" integer, "flags" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_curvetoline"("geom" "public"."geometry", "tol" double precision, "toltype" integer, "flags" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_curvetoline"("geom" "public"."geometry", "tol" double precision, "toltype" integer, "flags" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_curvetoline"("geom" "public"."geometry", "tol" double precision, "toltype" integer, "flags" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_delaunaytriangles"("g1" "public"."geometry", "tolerance" double precision, "flags" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_delaunaytriangles"("g1" "public"."geometry", "tolerance" double precision, "flags" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_delaunaytriangles"("g1" "public"."geometry", "tolerance" double precision, "flags" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_delaunaytriangles"("g1" "public"."geometry", "tolerance" double precision, "flags" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_difference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_difference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_difference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_difference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dimension"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dimension"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dimension"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dimension"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_disjoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_disjoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_disjoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_disjoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distance"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distance"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distance"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distance"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distance"("geog1" "public"."geography", "geog2" "public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distance"("geog1" "public"."geography", "geog2" "public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_distance"("geog1" "public"."geography", "geog2" "public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distance"("geog1" "public"."geography", "geog2" "public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancecpa"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancecpa"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancecpa"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancecpa"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry", "radius" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry", "radius" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry", "radius" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry", "radius" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry", "public"."spheroid") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry", "public"."spheroid") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry", "public"."spheroid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry", "public"."spheroid") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dump"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dump"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dump"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dump"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dumppoints"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dumppoints"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dumppoints"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dumppoints"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dumprings"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dumprings"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dumprings"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dumprings"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dumpsegments"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dumpsegments"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dumpsegments"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dumpsegments"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dwithin"("text", "text", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dwithin"("text", "text", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_dwithin"("text", "text", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dwithin"("text", "text", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_endpoint"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_endpoint"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_endpoint"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_endpoint"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_envelope"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_envelope"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_envelope"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_envelope"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("public"."box2d", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box2d", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box2d", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box2d", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("public"."box3d", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box3d", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box3d", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box3d", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box2d", "dx" double precision, "dy" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box2d", "dx" double precision, "dy" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box2d", "dx" double precision, "dy" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box2d", "dx" double precision, "dy" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box3d", "dx" double precision, "dy" double precision, "dz" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box3d", "dx" double precision, "dy" double precision, "dz" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box3d", "dx" double precision, "dy" double precision, "dz" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box3d", "dx" double precision, "dy" double precision, "dz" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("geom" "public"."geometry", "dx" double precision, "dy" double precision, "dz" double precision, "dm" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("geom" "public"."geometry", "dx" double precision, "dy" double precision, "dz" double precision, "dm" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("geom" "public"."geometry", "dx" double precision, "dy" double precision, "dz" double precision, "dm" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("geom" "public"."geometry", "dx" double precision, "dy" double precision, "dz" double precision, "dm" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_exteriorring"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_exteriorring"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_exteriorring"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_exteriorring"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_filterbym"("public"."geometry", double precision, double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_filterbym"("public"."geometry", double precision, double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_filterbym"("public"."geometry", double precision, double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_filterbym"("public"."geometry", double precision, double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_flipcoordinates"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_flipcoordinates"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_flipcoordinates"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_flipcoordinates"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_force2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force3d"("geom" "public"."geometry", "zvalue" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force3d"("geom" "public"."geometry", "zvalue" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_force3d"("geom" "public"."geometry", "zvalue" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force3d"("geom" "public"."geometry", "zvalue" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force3dm"("geom" "public"."geometry", "mvalue" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force3dm"("geom" "public"."geometry", "mvalue" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_force3dm"("geom" "public"."geometry", "mvalue" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force3dm"("geom" "public"."geometry", "mvalue" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force3dz"("geom" "public"."geometry", "zvalue" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force3dz"("geom" "public"."geometry", "zvalue" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_force3dz"("geom" "public"."geometry", "zvalue" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force3dz"("geom" "public"."geometry", "zvalue" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force4d"("geom" "public"."geometry", "zvalue" double precision, "mvalue" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force4d"("geom" "public"."geometry", "zvalue" double precision, "mvalue" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_force4d"("geom" "public"."geometry", "zvalue" double precision, "mvalue" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force4d"("geom" "public"."geometry", "zvalue" double precision, "mvalue" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcecollection"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcecollection"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcecollection"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcecollection"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcecurve"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcecurve"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcecurve"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcecurve"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcepolygonccw"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcepolygonccw"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcepolygonccw"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcepolygonccw"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcepolygoncw"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcepolygoncw"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcepolygoncw"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcepolygoncw"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcerhr"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcerhr"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcerhr"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcerhr"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry", "version" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry", "version" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry", "version" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry", "version" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_frechetdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_frechetdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_frechetdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_frechetdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_fromflatgeobuf"("anyelement", "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuf"("anyelement", "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuf"("anyelement", "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuf"("anyelement", "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_fromflatgeobuftotable"("text", "text", "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuftotable"("text", "text", "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuftotable"("text", "text", "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuftotable"("text", "text", "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer, "seed" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer, "seed" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer, "seed" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer, "seed" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geogfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geogfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geogfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geogfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geogfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geogfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geogfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geogfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geographyfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geographyfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geographyfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geographyfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geohash"("geog" "public"."geography", "maxchars" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geohash"("geog" "public"."geography", "maxchars" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geohash"("geog" "public"."geography", "maxchars" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geohash"("geog" "public"."geography", "maxchars" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geohash"("geom" "public"."geometry", "maxchars" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geohash"("geom" "public"."geometry", "maxchars" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geohash"("geom" "public"."geometry", "maxchars" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geohash"("geom" "public"."geometry", "maxchars" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometricmedian"("g" "public"."geometry", "tolerance" double precision, "max_iter" integer, "fail_if_not_converged" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometricmedian"("g" "public"."geometry", "tolerance" double precision, "max_iter" integer, "fail_if_not_converged" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometricmedian"("g" "public"."geometry", "tolerance" double precision, "max_iter" integer, "fail_if_not_converged" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometricmedian"("g" "public"."geometry", "tolerance" double precision, "max_iter" integer, "fail_if_not_converged" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometryn"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometryn"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometryn"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometryn"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometrytype"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometrytype"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometrytype"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometrytype"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromewkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromewkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromewkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromewkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromewkt"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromewkt"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromewkt"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromewkt"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgeohash"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgeohash"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgeohash"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgeohash"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"(json) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"(json) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"(json) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"(json) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromkml"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromkml"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromkml"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromkml"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfrommarc21"("marc21xml" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfrommarc21"("marc21xml" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfrommarc21"("marc21xml" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfrommarc21"("marc21xml" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromtwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromtwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromtwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromtwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_gmltosql"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_gmltosql"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hasarc"("geometry" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hasarc"("geometry" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_hasarc"("geometry" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hasarc"("geometry" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hexagon"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hexagon"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_hexagon"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hexagon"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hexagongrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hexagongrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_hexagongrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hexagongrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_interiorringn"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_interiorringn"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_interiorringn"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_interiorringn"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_interpolatepoint"("line" "public"."geometry", "point" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_interpolatepoint"("line" "public"."geometry", "point" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_interpolatepoint"("line" "public"."geometry", "point" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_interpolatepoint"("line" "public"."geometry", "point" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersection"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersection"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersection"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersection"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersection"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersection"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersection"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersection"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersection"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersection"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersection"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersection"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersects"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersects"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersects"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersects"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersects"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersects"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersects"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersects"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isclosed"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isclosed"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isclosed"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isclosed"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_iscollection"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_iscollection"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_iscollection"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_iscollection"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isempty"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isempty"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isempty"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isempty"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ispolygonccw"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ispolygonccw"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ispolygonccw"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ispolygonccw"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ispolygoncw"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ispolygoncw"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ispolygoncw"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ispolygoncw"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isring"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isring"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isring"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isring"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_issimple"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_issimple"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_issimple"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_issimple"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvaliddetail"("geom" "public"."geometry", "flags" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvaliddetail"("geom" "public"."geometry", "flags" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvaliddetail"("geom" "public"."geometry", "flags" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvaliddetail"("geom" "public"."geometry", "flags" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalidtrajectory"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalidtrajectory"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalidtrajectory"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalidtrajectory"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_length"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_length"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length"("geog" "public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length"("geog" "public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_length"("geog" "public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length"("geog" "public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_length2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length2dspheroid"("public"."geometry", "public"."spheroid") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length2dspheroid"("public"."geometry", "public"."spheroid") TO "anon";
GRANT ALL ON FUNCTION "public"."st_length2dspheroid"("public"."geometry", "public"."spheroid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length2dspheroid"("public"."geometry", "public"."spheroid") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_lengthspheroid"("public"."geometry", "public"."spheroid") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_lengthspheroid"("public"."geometry", "public"."spheroid") TO "anon";
GRANT ALL ON FUNCTION "public"."st_lengthspheroid"("public"."geometry", "public"."spheroid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_lengthspheroid"("public"."geometry", "public"."spheroid") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_letters"("letters" "text", "font" json) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_letters"("letters" "text", "font" json) TO "anon";
GRANT ALL ON FUNCTION "public"."st_letters"("letters" "text", "font" json) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_letters"("letters" "text", "font" json) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromencodedpolyline"("txtin" "text", "nprecision" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromencodedpolyline"("txtin" "text", "nprecision" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromencodedpolyline"("txtin" "text", "nprecision" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromencodedpolyline"("txtin" "text", "nprecision" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefrommultipoint"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefrommultipoint"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefrommultipoint"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefrommultipoint"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoint"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoint"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoint"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoint"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoints"("public"."geometry", double precision, "repeat" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoints"("public"."geometry", double precision, "repeat" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoints"("public"."geometry", double precision, "repeat" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoints"("public"."geometry", double precision, "repeat" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linelocatepoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linelocatepoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linelocatepoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linelocatepoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linesubstring"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linesubstring"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linesubstring"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linesubstring"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linetocurve"("geometry" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linetocurve"("geometry" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linetocurve"("geometry" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linetocurve"("geometry" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_locatealong"("geometry" "public"."geometry", "measure" double precision, "leftrightoffset" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_locatealong"("geometry" "public"."geometry", "measure" double precision, "leftrightoffset" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_locatealong"("geometry" "public"."geometry", "measure" double precision, "leftrightoffset" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_locatealong"("geometry" "public"."geometry", "measure" double precision, "leftrightoffset" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_locatebetween"("geometry" "public"."geometry", "frommeasure" double precision, "tomeasure" double precision, "leftrightoffset" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_locatebetween"("geometry" "public"."geometry", "frommeasure" double precision, "tomeasure" double precision, "leftrightoffset" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_locatebetween"("geometry" "public"."geometry", "frommeasure" double precision, "tomeasure" double precision, "leftrightoffset" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_locatebetween"("geometry" "public"."geometry", "frommeasure" double precision, "tomeasure" double precision, "leftrightoffset" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_locatebetweenelevations"("geometry" "public"."geometry", "fromelevation" double precision, "toelevation" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_locatebetweenelevations"("geometry" "public"."geometry", "fromelevation" double precision, "toelevation" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_locatebetweenelevations"("geometry" "public"."geometry", "fromelevation" double precision, "toelevation" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_locatebetweenelevations"("geometry" "public"."geometry", "fromelevation" double precision, "toelevation" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_m"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_m"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_m"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_m"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makebox2d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makebox2d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makebox2d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makebox2d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makeenvelope"(double precision, double precision, double precision, double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makeenvelope"(double precision, double precision, double precision, double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makeenvelope"(double precision, double precision, double precision, double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makeenvelope"(double precision, double precision, double precision, double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makeline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makeline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makeline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makeline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepointm"(double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepointm"(double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepointm"(double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepointm"(double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry", "public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry", "public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry", "public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry", "public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makevalid"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makevalid"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makevalid"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makevalid"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makevalid"("geom" "public"."geometry", "params" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makevalid"("geom" "public"."geometry", "params" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makevalid"("geom" "public"."geometry", "params" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makevalid"("geom" "public"."geometry", "params" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_maximuminscribedcircle"("public"."geometry", OUT "center" "public"."geometry", OUT "nearest" "public"."geometry", OUT "radius" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_maximuminscribedcircle"("public"."geometry", OUT "center" "public"."geometry", OUT "nearest" "public"."geometry", OUT "radius" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_maximuminscribedcircle"("public"."geometry", OUT "center" "public"."geometry", OUT "nearest" "public"."geometry", OUT "radius" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_maximuminscribedcircle"("public"."geometry", OUT "center" "public"."geometry", OUT "nearest" "public"."geometry", OUT "radius" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_memsize"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_memsize"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_memsize"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_memsize"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_minimumboundingcircle"("inputgeom" "public"."geometry", "segs_per_quarter" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_minimumboundingcircle"("inputgeom" "public"."geometry", "segs_per_quarter" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_minimumboundingcircle"("inputgeom" "public"."geometry", "segs_per_quarter" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_minimumboundingcircle"("inputgeom" "public"."geometry", "segs_per_quarter" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_minimumboundingradius"("public"."geometry", OUT "center" "public"."geometry", OUT "radius" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_minimumboundingradius"("public"."geometry", OUT "center" "public"."geometry", OUT "radius" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_minimumboundingradius"("public"."geometry", OUT "center" "public"."geometry", OUT "radius" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_minimumboundingradius"("public"."geometry", OUT "center" "public"."geometry", OUT "radius" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_minimumclearance"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_minimumclearance"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_minimumclearance"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_minimumclearance"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_minimumclearanceline"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_minimumclearanceline"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_minimumclearanceline"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_minimumclearanceline"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multi"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multi"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multi"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multi"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multilinefromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multilinefromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multilinefromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multilinefromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipointfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipointfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipointfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipointfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ndims"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ndims"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ndims"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ndims"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_node"("g" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_node"("g" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_node"("g" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_node"("g" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_normalize"("geom" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_normalize"("geom" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_normalize"("geom" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_normalize"("geom" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_npoints"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_npoints"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_npoints"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_npoints"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_nrings"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_nrings"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_nrings"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_nrings"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numgeometries"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numgeometries"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numgeometries"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numgeometries"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numinteriorring"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numinteriorring"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numinteriorring"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numinteriorring"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numinteriorrings"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numinteriorrings"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numinteriorrings"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numinteriorrings"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numpatches"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numpatches"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numpatches"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numpatches"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numpoints"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numpoints"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numpoints"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numpoints"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_offsetcurve"("line" "public"."geometry", "distance" double precision, "params" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_offsetcurve"("line" "public"."geometry", "distance" double precision, "params" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_offsetcurve"("line" "public"."geometry", "distance" double precision, "params" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_offsetcurve"("line" "public"."geometry", "distance" double precision, "params" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_orientedenvelope"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_orientedenvelope"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_orientedenvelope"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_orientedenvelope"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_patchn"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_patchn"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_patchn"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_patchn"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_perimeter"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_perimeter"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_perimeter"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_perimeter"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_perimeter"("geog" "public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_perimeter"("geog" "public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_perimeter"("geog" "public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_perimeter"("geog" "public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_perimeter2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_perimeter2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_perimeter2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_perimeter2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision, "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision, "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision, "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision, "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromgeohash"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromgeohash"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromgeohash"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromgeohash"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointinsidecircle"("public"."geometry", double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointinsidecircle"("public"."geometry", double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointinsidecircle"("public"."geometry", double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointinsidecircle"("public"."geometry", double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointm"("xcoordinate" double precision, "ycoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointm"("xcoordinate" double precision, "ycoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointm"("xcoordinate" double precision, "ycoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointm"("xcoordinate" double precision, "ycoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointn"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointn"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointn"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointn"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointonsurface"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointonsurface"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointonsurface"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointonsurface"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_points"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_points"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_points"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_points"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointz"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointz"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointz"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointz"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointzm"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointzm"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointzm"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointzm"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygon"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygon"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygon"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygon"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_project"("geog" "public"."geography", "distance" double precision, "azimuth" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_project"("geog" "public"."geography", "distance" double precision, "azimuth" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_project"("geog" "public"."geography", "distance" double precision, "azimuth" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_project"("geog" "public"."geography", "distance" double precision, "azimuth" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_quantizecoordinates"("g" "public"."geometry", "prec_x" integer, "prec_y" integer, "prec_z" integer, "prec_m" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_quantizecoordinates"("g" "public"."geometry", "prec_x" integer, "prec_y" integer, "prec_z" integer, "prec_m" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_quantizecoordinates"("g" "public"."geometry", "prec_x" integer, "prec_y" integer, "prec_z" integer, "prec_m" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_quantizecoordinates"("g" "public"."geometry", "prec_x" integer, "prec_y" integer, "prec_z" integer, "prec_m" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_reduceprecision"("geom" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_reduceprecision"("geom" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_reduceprecision"("geom" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_reduceprecision"("geom" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_relatematch"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_relatematch"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_relatematch"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_relatematch"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_removepoint"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_removepoint"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_removepoint"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_removepoint"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_removerepeatedpoints"("geom" "public"."geometry", "tolerance" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_removerepeatedpoints"("geom" "public"."geometry", "tolerance" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_removerepeatedpoints"("geom" "public"."geometry", "tolerance" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_removerepeatedpoints"("geom" "public"."geometry", "tolerance" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_reverse"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_reverse"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_reverse"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_reverse"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotatex"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotatex"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotatex"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotatex"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotatey"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotatey"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotatey"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotatey"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotatez"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotatez"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotatez"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotatez"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry", "origin" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry", "origin" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry", "origin" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry", "origin" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scroll"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scroll"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_scroll"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scroll"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_segmentize"("geog" "public"."geography", "max_segment_length" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_segmentize"("geog" "public"."geography", "max_segment_length" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_segmentize"("geog" "public"."geography", "max_segment_length" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_segmentize"("geog" "public"."geography", "max_segment_length" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_segmentize"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_segmentize"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_segmentize"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_segmentize"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_seteffectivearea"("public"."geometry", double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_seteffectivearea"("public"."geometry", double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_seteffectivearea"("public"."geometry", double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_seteffectivearea"("public"."geometry", double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_setpoint"("public"."geometry", integer, "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_setpoint"("public"."geometry", integer, "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_setpoint"("public"."geometry", integer, "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_setpoint"("public"."geometry", integer, "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_setsrid"("geog" "public"."geography", "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geog" "public"."geography", "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geog" "public"."geography", "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geog" "public"."geography", "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_setsrid"("geom" "public"."geometry", "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geom" "public"."geometry", "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geom" "public"."geometry", "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geom" "public"."geometry", "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_sharedpaths"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_sharedpaths"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_sharedpaths"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_sharedpaths"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_shiftlongitude"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_shiftlongitude"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_shiftlongitude"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_shiftlongitude"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_shortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_shortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_shortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_shortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplifypolygonhull"("geom" "public"."geometry", "vertex_fraction" double precision, "is_outer" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplifypolygonhull"("geom" "public"."geometry", "vertex_fraction" double precision, "is_outer" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplifypolygonhull"("geom" "public"."geometry", "vertex_fraction" double precision, "is_outer" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplifypolygonhull"("geom" "public"."geometry", "vertex_fraction" double precision, "is_outer" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplifypreservetopology"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplifypreservetopology"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplifypreservetopology"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplifypreservetopology"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplifyvw"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplifyvw"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplifyvw"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplifyvw"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snap"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snap"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snap"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snap"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snaptogrid"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_split"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_split"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_split"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_split"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_square"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_square"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_square"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_square"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_squaregrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_squaregrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_squaregrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_squaregrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_srid"("geog" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_srid"("geog" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_srid"("geog" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_srid"("geog" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_srid"("geom" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_srid"("geom" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_srid"("geom" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_srid"("geom" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_startpoint"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_startpoint"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_startpoint"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_startpoint"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_subdivide"("geom" "public"."geometry", "maxvertices" integer, "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_subdivide"("geom" "public"."geometry", "maxvertices" integer, "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_subdivide"("geom" "public"."geometry", "maxvertices" integer, "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_subdivide"("geom" "public"."geometry", "maxvertices" integer, "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_summary"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_summary"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_swapordinates"("geom" "public"."geometry", "ords" "cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_swapordinates"("geom" "public"."geometry", "ords" "cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."st_swapordinates"("geom" "public"."geometry", "ords" "cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_swapordinates"("geom" "public"."geometry", "ords" "cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_symdifference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_symdifference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_symdifference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_symdifference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_symmetricdifference"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_symmetricdifference"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_symmetricdifference"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_symmetricdifference"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_tileenvelope"("zoom" integer, "x" integer, "y" integer, "bounds" "public"."geometry", "margin" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_tileenvelope"("zoom" integer, "x" integer, "y" integer, "bounds" "public"."geometry", "margin" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_tileenvelope"("zoom" integer, "x" integer, "y" integer, "bounds" "public"."geometry", "margin" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_tileenvelope"("zoom" integer, "x" integer, "y" integer, "bounds" "public"."geometry", "margin" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transform"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transform"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_transform"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transform"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "to_proj" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "to_proj" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "to_proj" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "to_proj" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_proj" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_proj" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_proj" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_proj" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transscale"("public"."geometry", double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transscale"("public"."geometry", double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_transscale"("public"."geometry", double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transscale"("public"."geometry", double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_triangulatepolygon"("g1" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_triangulatepolygon"("g1" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_triangulatepolygon"("g1" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_triangulatepolygon"("g1" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_unaryunion"("public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_unaryunion"("public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_unaryunion"("public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_unaryunion"("public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_voronoilines"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_voronoilines"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_voronoilines"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_voronoilines"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_voronoipolygons"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_voronoipolygons"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_voronoipolygons"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_voronoipolygons"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_wkbtosql"("wkb" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_wkbtosql"("wkb" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_wkbtosql"("wkb" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_wkbtosql"("wkb" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_wkttosql"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_wkttosql"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_wkttosql"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_wkttosql"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_wrapx"("geom" "public"."geometry", "wrap" double precision, "move" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_wrapx"("geom" "public"."geometry", "wrap" double precision, "move" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_wrapx"("geom" "public"."geometry", "wrap" double precision, "move" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_wrapx"("geom" "public"."geometry", "wrap" double precision, "move" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_x"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_x"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_x"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_x"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_xmax"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_xmax"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_xmax"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_xmax"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_xmin"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_xmin"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_xmin"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_xmin"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_y"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_y"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_y"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_y"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ymax"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ymax"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ymax"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ymax"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ymin"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ymin"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ymin"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ymin"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_z"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_z"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_z"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_z"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_zmax"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_zmax"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_zmax"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_zmax"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_zmflag"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_zmflag"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_zmflag"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_zmflag"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_zmin"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_zmin"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_zmin"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_zmin"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_marketplace_review_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_marketplace_review_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_marketplace_review_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_marketplace_review_response_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_marketplace_review_response_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_marketplace_review_response_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_offer_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_offer_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_offer_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_offer_response_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_offer_response_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_offer_response_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_order_status_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_order_status_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_order_status_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_rental_order_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_rental_order_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_rental_order_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_sale_order_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_sale_order_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_sale_order_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unlockrows"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unlockrows"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."unlockrows"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unlockrows"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_cinematic_tags"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_cinematic_tags"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_cinematic_tags"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_collab_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_collab_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_collab_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_gig_notification_preferences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_gig_notification_preferences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_gig_notification_preferences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_listing_enhancement_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_listing_enhancement_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_listing_enhancement_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notification_preferences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notification_preferences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notification_preferences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_role_status_on_acceptance"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_role_status_on_acceptance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_role_status_on_acceptance"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, character varying, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, character varying, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, character varying, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, character varying, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."updategeometrysrid"("catalogn_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"("catalogn_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"("catalogn_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"("catalogn_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_review_order_reference"("p_order_type" "text", "p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_review_order_reference"("p_order_type" "text", "p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_review_order_reference"("p_order_type" "text", "p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_user_age"("p_user_id" "uuid", "p_date_of_birth" "date", "p_method" "text", "p_verified_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_user_age"("p_user_id" "uuid", "p_date_of_birth" "date", "p_method" "text", "p_verified_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_user_age"("p_user_id" "uuid", "p_date_of_birth" "date", "p_method" "text", "p_verified_by" "uuid") TO "service_role";












GRANT ALL ON FUNCTION "public"."st_3dextent"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dextent"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dextent"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dextent"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_extent"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_extent"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_extent"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_extent"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_memcollect"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_memcollect"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_memcollect"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_memcollect"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_memunion"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_memunion"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_memunion"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_memunion"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry", double precision) TO "service_role";









GRANT ALL ON TABLE "public"."age_verification_logs" TO "anon";
GRANT ALL ON TABLE "public"."age_verification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."age_verification_logs" TO "service_role";



GRANT ALL ON TABLE "public"."users_profile" TO "anon";
GRANT ALL ON TABLE "public"."users_profile" TO "authenticated";
GRANT ALL ON TABLE "public"."users_profile" TO "service_role";



GRANT ALL ON TABLE "public"."verification_badges" TO "anon";
GRANT ALL ON TABLE "public"."verification_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."verification_badges" TO "service_role";



GRANT ALL ON TABLE "public"."admin_age_verification_queue" TO "anon";
GRANT ALL ON TABLE "public"."admin_age_verification_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_age_verification_queue" TO "service_role";



GRANT ALL ON TABLE "public"."moderation_actions" TO "anon";
GRANT ALL ON TABLE "public"."moderation_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_actions" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."admin_moderation_audit" TO "anon";
GRANT ALL ON TABLE "public"."admin_moderation_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_moderation_audit" TO "service_role";



GRANT ALL ON TABLE "public"."admin_reports_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."admin_reports_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_reports_dashboard" TO "service_role";



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



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."collab_applications" TO "anon";
GRANT ALL ON TABLE "public"."collab_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_applications" TO "service_role";



GRANT ALL ON TABLE "public"."collab_gear_offers" TO "anon";
GRANT ALL ON TABLE "public"."collab_gear_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_gear_offers" TO "service_role";



GRANT ALL ON TABLE "public"."collab_gear_requests" TO "anon";
GRANT ALL ON TABLE "public"."collab_gear_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_gear_requests" TO "service_role";



GRANT ALL ON TABLE "public"."collab_participants" TO "anon";
GRANT ALL ON TABLE "public"."collab_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_participants" TO "service_role";



GRANT ALL ON TABLE "public"."collab_projects" TO "anon";
GRANT ALL ON TABLE "public"."collab_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_projects" TO "service_role";



GRANT ALL ON TABLE "public"."collab_roles" TO "anon";
GRANT ALL ON TABLE "public"."collab_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_roles" TO "service_role";



GRANT ALL ON TABLE "public"."credit_alerts" TO "anon";
GRANT ALL ON TABLE "public"."credit_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_alerts" TO "service_role";



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



GRANT ALL ON TABLE "public"."enhancement_tasks" TO "anon";
GRANT ALL ON TABLE "public"."enhancement_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."enhancement_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_requests" TO "anon";
GRANT ALL ON TABLE "public"."equipment_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_requests" TO "service_role";



GRANT ALL ON TABLE "public"."gig_notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."gig_notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."gig_notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."gigs" TO "anon";
GRANT ALL ON TABLE "public"."gigs" TO "authenticated";
GRANT ALL ON TABLE "public"."gigs" TO "service_role";



GRANT ALL ON TABLE "public"."listing_availability" TO "anon";
GRANT ALL ON TABLE "public"."listing_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_availability" TO "service_role";



GRANT ALL ON TABLE "public"."listing_enhancements" TO "anon";
GRANT ALL ON TABLE "public"."listing_enhancements" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_enhancements" TO "service_role";



GRANT ALL ON TABLE "public"."listing_images" TO "anon";
GRANT ALL ON TABLE "public"."listing_images" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_images" TO "service_role";



GRANT ALL ON TABLE "public"."listings" TO "anon";
GRANT ALL ON TABLE "public"."listings" TO "authenticated";
GRANT ALL ON TABLE "public"."listings" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_disputes" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_disputes" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_disputes" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_reviews" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."media" TO "anon";
GRANT ALL ON TABLE "public"."media" TO "authenticated";
GRANT ALL ON TABLE "public"."media" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



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



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON TABLE "public"."preset_usage_log" TO "anon";
GRANT ALL ON TABLE "public"."preset_usage_log" TO "authenticated";
GRANT ALL ON TABLE "public"."preset_usage_log" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rental_orders" TO "anon";
GRANT ALL ON TABLE "public"."rental_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."rental_orders" TO "service_role";



GRANT ALL ON TABLE "public"."request_conversations" TO "anon";
GRANT ALL ON TABLE "public"."request_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."request_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."request_responses" TO "anon";
GRANT ALL ON TABLE "public"."request_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."request_responses" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."sale_orders" TO "anon";
GRANT ALL ON TABLE "public"."sale_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."sale_orders" TO "service_role";



GRANT ALL ON TABLE "public"."saved_gigs" TO "anon";
GRANT ALL ON TABLE "public"."saved_gigs" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_gigs" TO "service_role";



GRANT ALL ON TABLE "public"."showcases" TO "anon";
GRANT ALL ON TABLE "public"."showcases" TO "authenticated";
GRANT ALL ON TABLE "public"."showcases" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_benefits" TO "anon";
GRANT ALL ON TABLE "public"."subscription_benefits" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_benefits" TO "service_role";



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



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."user_presets" TO "anon";
GRANT ALL ON TABLE "public"."user_presets" TO "authenticated";
GRANT ALL ON TABLE "public"."user_presets" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



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
