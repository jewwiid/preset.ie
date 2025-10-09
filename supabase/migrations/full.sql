

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


CREATE TYPE "public"."attachment_type" AS ENUM (
    'portfolio',
    'resume',
    'reference',
    'document',
    'other'
);


ALTER TYPE "public"."attachment_type" OWNER TO "postgres";


CREATE TYPE "public"."compensation_type" AS ENUM (
    'TFP',
    'PAID',
    'EXPENSES'
);


ALTER TYPE "public"."compensation_type" OWNER TO "postgres";


CREATE TYPE "public"."feedback_type" AS ENUM (
    'rejection',
    'selection',
    'general',
    'improvement'
);


ALTER TYPE "public"."feedback_type" OWNER TO "postgres";


CREATE TYPE "public"."gig_status" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'APPLICATIONS_CLOSED',
    'BOOKED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE "public"."gig_status" OWNER TO "postgres";


CREATE TYPE "public"."looking_for_type" AS ENUM (
    'MODELS',
    'MODELS_FASHION',
    'MODELS_COMMERCIAL',
    'MODELS_FITNESS',
    'MODELS_EDITORIAL',
    'MODELS_RUNWAY',
    'MODELS_HAND',
    'MODELS_PARTS',
    'ACTORS',
    'DANCERS',
    'MUSICIANS',
    'SINGERS',
    'VOICE_ACTORS',
    'PERFORMERS',
    'INFLUENCERS',
    'PHOTOGRAPHERS',
    'VIDEOGRAPHERS',
    'CINEMATOGRAPHERS',
    'PRODUCTION_CREW',
    'PRODUCERS',
    'DIRECTORS',
    'CREATIVE_DIRECTORS',
    'ART_DIRECTORS',
    'MAKEUP_ARTISTS',
    'HAIR_STYLISTS',
    'FASHION_STYLISTS',
    'WARDROBE_STYLISTS',
    'EDITORS',
    'VIDEO_EDITORS',
    'PHOTO_EDITORS',
    'VFX_ARTISTS',
    'MOTION_GRAPHICS',
    'RETOUCHERS',
    'COLOR_GRADERS',
    'DESIGNERS',
    'GRAPHIC_DESIGNERS',
    'ILLUSTRATORS',
    'ANIMATORS',
    'CONTENT_CREATORS',
    'SOCIAL_MEDIA_MANAGERS',
    'DIGITAL_MARKETERS',
    'AGENCIES',
    'BRAND_MANAGERS',
    'MARKETING_TEAMS',
    'STUDIOS',
    'WRITERS',
    'COPYWRITERS',
    'SCRIPTWRITERS',
    'OTHER'
);


ALTER TYPE "public"."looking_for_type" OWNER TO "postgres";


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


CREATE TYPE "public"."proficiency_level" AS ENUM (
    'beginner',
    'intermediate',
    'advanced',
    'expert'
);


ALTER TYPE "public"."proficiency_level" OWNER TO "postgres";


CREATE TYPE "public"."requirement_type" AS ENUM (
    'skill',
    'equipment',
    'experience',
    'software',
    'certification'
);


ALTER TYPE "public"."requirement_type" OWNER TO "postgres";


CREATE TYPE "public"."showcase_visibility" AS ENUM (
    'DRAFT',
    'PUBLIC',
    'PRIVATE'
);


ALTER TYPE "public"."showcase_visibility" OWNER TO "postgres";


CREATE TYPE "public"."skill_type" AS ENUM (
    'technical',
    'creative',
    'equipment',
    'software',
    'interpersonal'
);


ALTER TYPE "public"."skill_type" OWNER TO "postgres";


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


CREATE TYPE "public"."treatment_format" AS ENUM (
    'film_tv',
    'documentary',
    'commercial_brand',
    'music_video',
    'short_social',
    'corporate_promo'
);


ALTER TYPE "public"."treatment_format" OWNER TO "postgres";


CREATE TYPE "public"."treatment_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."treatment_status" OWNER TO "postgres";


CREATE TYPE "public"."treatment_theme" AS ENUM (
    'cinematic',
    'minimal',
    'editorial',
    'bold_art',
    'brand_deck'
);


ALTER TYPE "public"."treatment_theme" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'CONTRIBUTOR',
    'TALENT',
    'ADMIN'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."add_invited_user_as_participant"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO collab_participants (project_id, user_id, role_type, role_id, status)
    VALUES (
      NEW.project_id, 
      NEW.invitee_id, 
      CASE WHEN NEW.role_id IS NOT NULL THEN 'collaborator' ELSE 'collaborator' END,
      NEW.role_id,
      'active'
    )
    ON CONFLICT (project_id, user_id) DO UPDATE SET
      role_type = 'collaborator',
      role_id = COALESCE(NEW.role_id, collab_participants.role_id),
      status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_invited_user_as_participant"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."add_purchased_credits"("p_user_id" "uuid", "p_credits" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Add to both current_balance and purchased_credits_balance
    UPDATE user_credits
    SET 
        current_balance = current_balance + p_credits,
        purchased_credits_balance = purchased_credits_balance + p_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."add_purchased_credits"("p_user_id" "uuid", "p_credits" integer) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."add_verified_preset_sample"("preset_uuid" "uuid", "result_image_url_param" "text", "prompt_param" "text", "generation_id_param" "text" DEFAULT NULL::"text", "source_image_url_param" "text" DEFAULT NULL::"text", "source_image_hash_param" "text" DEFAULT NULL::"text", "result_image_hash_param" "text" DEFAULT NULL::"text", "generation_provider_param" "text" DEFAULT 'nanobanana'::"text", "generation_model_param" "text" DEFAULT NULL::"text", "generation_credits_param" integer DEFAULT 0, "negative_prompt_param" "text" DEFAULT NULL::"text", "generation_settings_param" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  sample_id UUID;
  preset_exists BOOLEAN := false;
  user_id_var UUID := auth.uid();
  generation_exists BOOLEAN := false;
  preset_used_in_generation BOOLEAN := false;
BEGIN
  -- Check if user is authenticated
  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Verify the preset exists in either table
  SELECT EXISTS (
    SELECT 1 FROM presets WHERE id = preset_uuid
    UNION
    SELECT 1 FROM cinematic_presets WHERE id = preset_uuid
  ) INTO preset_exists;

  IF NOT preset_exists THEN
    RAISE EXCEPTION 'Preset not found';
  END IF;

  -- Verify that the generation_id exists and was created by this user (optional)
  IF generation_id_param IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM playground_projects 
      WHERE id::text = generation_id_param 
      AND user_id = user_id_var
    ) INTO generation_exists;

    IF generation_exists THEN
      -- Only verify preset usage if generation exists
      SELECT EXISTS (
        SELECT 1 FROM playground_projects 
        WHERE id::text = generation_id_param 
        AND user_id = user_id_var
        AND (
          metadata->>'preset_id' = preset_uuid::text
          OR metadata->>'custom_style_preset_id' = preset_uuid::text
          OR metadata->>'cinematic_preset_id' = preset_uuid::text
          OR metadata->>'applied_preset_id' = preset_uuid::text
        )
        UNION
        SELECT 1 FROM playground_gallery
        WHERE id::text = generation_id_param
        AND user_id = user_id_var
        AND (
          generation_metadata->>'custom_style_preset'->>'id' = preset_uuid::text
          OR generation_metadata->>'preset_id' = preset_uuid::text
          OR generation_metadata->>'cinematic_preset_id' = preset_uuid::text
          OR generation_metadata->>'applied_preset_id' = preset_uuid::text
          OR generation_metadata->>'style' = (
            SELECT style_settings->>'style' FROM presets WHERE id = preset_uuid
            UNION
            SELECT style_settings->>'style' FROM cinematic_presets WHERE id = preset_uuid
          )
        )
      ) INTO preset_used_in_generation;

      IF NOT preset_used_in_generation THEN
        RAISE EXCEPTION 'Generation was not created using the specified preset';
      END IF;
    END IF;

    -- Check if this generation has already been submitted as a sample
    SELECT EXISTS (
      SELECT 1 FROM preset_images 
      WHERE generation_id = generation_id_param 
      AND user_id = user_id_var
      AND preset_id = preset_uuid
    ) INTO generation_exists;

    IF generation_exists THEN
      RAISE EXCEPTION 'This generation has already been submitted as a sample for this preset';
    END IF;
  END IF;

  -- Insert the sample image
  INSERT INTO preset_images (
    preset_id,
    user_id,
    result_image_url,
    prompt_used,
    generation_id,
    generation_provider,
    generation_model,
    generation_credits,
    generation_settings,
    is_verified,
    verification_timestamp,
    verification_method
  ) VALUES (
    preset_uuid,
    user_id_var,
    result_image_url_param,
    prompt_param,
    generation_id_param,
    generation_provider_param,
    generation_model_param,
    generation_credits_param,
    generation_settings_param,
    true,
    NOW(),
    'manual'
  ) RETURNING id INTO sample_id;

  RETURN sample_id;
END;
$$;


ALTER FUNCTION "public"."add_verified_preset_sample"("preset_uuid" "uuid", "result_image_url_param" "text", "prompt_param" "text", "generation_id_param" "text", "source_image_url_param" "text", "source_image_hash_param" "text", "result_image_hash_param" "text", "generation_provider_param" "text", "generation_model_param" "text", "generation_credits_param" integer, "negative_prompt_param" "text", "generation_settings_param" "jsonb") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."approve_featured_preset_request"("request_id" "uuid", "admin_user_id" "uuid", "admin_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  preset_uuid UUID;
BEGIN
  -- Get the preset_id from the request
  SELECT preset_id INTO preset_uuid
  FROM featured_preset_requests
  WHERE id = request_id AND status = 'pending';
  
  IF preset_uuid IS NULL THEN
    RAISE EXCEPTION 'Featured preset request not found or already processed';
  END IF;
  
  -- Update the request status
  UPDATE featured_preset_requests
  SET 
    status = 'approved',
    reviewed_by = admin_user_id,
    reviewed_at = NOW(),
    admin_notes = COALESCE(admin_notes, 'Approved for featured status')
  WHERE id = request_id;
  
  -- Update the preset to be featured
  UPDATE presets
  SET is_featured = true
  WHERE id = preset_uuid;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."approve_featured_preset_request"("request_id" "uuid", "admin_user_id" "uuid", "admin_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."approve_featured_preset_request"("request_id" "uuid", "admin_user_id" "uuid", "admin_notes" "text") IS 'Approves a featured preset request and marks the preset as featured';



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


CREATE OR REPLACE FUNCTION "public"."auto_increment_preset_usage_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Increment the usage_count and update last_used_at
    UPDATE presets
    SET usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.preset_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_increment_preset_usage_count"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_increment_preset_usage_count"() IS 'Trigger function that auto-increments preset usage_count when preset_usage records are inserted';



CREATE OR REPLACE FUNCTION "public"."auto_refund_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_should_refund BOOLEAN;
BEGIN
  -- Only process if status changed to 'failed'
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    -- Check if error type warrants refund
    SELECT should_refund INTO v_should_refund
    FROM refund_policies
    WHERE error_type = NEW.error_type;
    
    IF v_should_refund IS NULL OR v_should_refund = TRUE THEN
      -- Process refund asynchronously (would be handled by callback in practice)
      PERFORM process_credit_refund(NEW.id, NEW.user_id, 1, COALESCE(NEW.error_type, 'generation_failed'));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_refund_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_update_profile_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.profile_completion_percentage := calculate_profile_completion(NEW);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_update_profile_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."block_user"("blocked_profile_id" "uuid", "block_reason" character varying DEFAULT NULL::character varying) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  blocker_profile_id UUID;
  block_id UUID;
BEGIN
  -- Get the current user's profile ID
  SELECT id INTO blocker_profile_id
  FROM users_profile
  WHERE user_id = auth.uid();
  
  IF blocker_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Prevent self-blocking
  IF blocker_profile_id = blocked_profile_id THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;
  
  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM users_profile WHERE id = blocked_profile_id) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Insert the block (ON CONFLICT DO NOTHING handles duplicates)
  INSERT INTO user_blocks (blocker_user_id, blocked_user_id, reason)
  VALUES (blocker_profile_id, blocked_profile_id, block_reason)
  ON CONFLICT (blocker_user_id, blocked_user_id) DO NOTHING
  RETURNING id INTO block_id;
  
  -- If no ID returned, block already exists
  IF block_id IS NULL THEN
    SELECT id INTO block_id
    FROM user_blocks
    WHERE blocker_user_id = blocker_profile_id
    AND blocked_user_id = blocked_profile_id;
  END IF;
  
  -- Log the blocking event
  PERFORM log_security_event(
    'user_blocked',
    auth.uid(),
    jsonb_build_object(
      'blocked_user_id', blocked_profile_id,
      'reason', block_reason,
      'block_id', block_id
    )
  );
  
  RETURN block_id;
END;
$$;


ALTER FUNCTION "public"."block_user"("blocked_profile_id" "uuid", "block_reason" character varying) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."block_user"("blocked_profile_id" "uuid", "block_reason" character varying) IS 'Block a user with optional reason';



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


CREATE OR REPLACE FUNCTION "public"."calculate_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid") RETURNS TABLE("overall_score" numeric, "skill_match_score" numeric, "profile_completeness_score" numeric, "matched_skills" "text"[], "missing_skills" "text"[], "missing_profile_fields" "text"[], "breakdown" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_overall_score DECIMAL(5,2) := 0;
    v_skill_score DECIMAL(5,2) := 0;
    v_profile_score DECIMAL(5,2) := 0;
    v_matched TEXT[] := ARRAY[]::TEXT[];
    v_missing TEXT[] := ARRAY[]::TEXT[];
    v_missing_fields TEXT[] := ARRAY[]::TEXT[];
    v_breakdown JSONB := '{}';
    v_profile RECORD;
    v_skill_result RECORD;
BEGIN
    -- Get profile data
    SELECT * INTO v_profile
    FROM users_profile
    WHERE id = p_profile_id;

    IF v_profile IS NULL THEN
        RETURN QUERY SELECT
            0.0::DECIMAL(5,2), 0.0::DECIMAL(5,2), 0.0::DECIMAL(5,2),
            ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['profile_not_found']::TEXT[],
            jsonb_build_object('error', 'profile_not_found');
        RETURN;
    END IF;

    -- Calculate skill match
    SELECT * INTO v_skill_result
    FROM calculate_collaboration_skill_match(p_profile_id, p_role_id);

    v_skill_score := v_skill_result.score;
    v_matched := v_skill_result.matched_skills;
    v_missing := v_skill_result.missing_skills;

    -- Calculate profile completeness (25 points each for 4 fields)
    v_profile_score := 0;

    IF v_profile.bio IS NOT NULL AND TRIM(v_profile.bio) != '' THEN
        v_profile_score := v_profile_score + 25.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'bio');
    END IF;

    IF v_profile.city IS NOT NULL AND TRIM(v_profile.city) != '' THEN
        v_profile_score := v_profile_score + 25.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'city');
    END IF;

    IF v_profile.country IS NOT NULL AND TRIM(v_profile.country) != '' THEN
        v_profile_score := v_profile_score + 25.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'country');
    END IF;

    IF v_profile.specializations IS NOT NULL AND array_length(v_profile.specializations, 1) > 0 THEN
        v_profile_score := v_profile_score + 25.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'specializations');
    END IF;

    -- Calculate overall score (70% skill match, 30% profile completeness)
    v_overall_score := ROUND((v_skill_score * 0.7) + (v_profile_score * 0.3), 2);

    -- Build comprehensive breakdown
    v_breakdown := jsonb_build_object(
        'skill_match', jsonb_build_object(
            'score', v_skill_score,
            'weight', 0.7,
            'weighted_contribution', ROUND(v_skill_score * 0.7, 2),
            'matched_skills', v_matched,
            'missing_skills', v_missing
        ),
        'profile_completeness', jsonb_build_object(
            'score', v_profile_score,
            'weight', 0.3,
            'weighted_contribution', ROUND(v_profile_score * 0.3, 2),
            'missing_fields', v_missing_fields
        ),
        'overall', jsonb_build_object(
            'score', v_overall_score,
            'meets_minimum_threshold', v_skill_score >= 30.0 AND v_profile_score = 100.0
        )
    );

    RETURN QUERY SELECT
        v_overall_score,
        v_skill_score,
        v_profile_score,
        v_matched,
        v_missing,
        v_missing_fields,
        v_breakdown;
END;
$$;


ALTER FUNCTION "public"."calculate_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid") IS 'Calculates overall compatibility including skill match and profile completeness for collaboration applications';



CREATE OR REPLACE FUNCTION "public"."calculate_collaboration_skill_match"("p_profile_id" "uuid", "p_role_id" "uuid") RETURNS TABLE("score" numeric, "matched_skills" "text"[], "missing_skills" "text"[], "breakdown" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_score DECIMAL(5,2) := 0;
    v_matched TEXT[] := ARRAY[]::TEXT[];
    v_missing TEXT[] := ARRAY[]::TEXT[];
    v_breakdown JSONB := '{}';
    v_user_skills TEXT[];
    v_required_skills TEXT[];
    v_match_count INTEGER := 0;
    v_required_count INTEGER := 0;
BEGIN
    -- Get user specializations
    SELECT specializations INTO v_user_skills
    FROM users_profile
    WHERE id = p_profile_id;

    -- Get role required skills
    SELECT skills_required INTO v_required_skills
    FROM collab_roles
    WHERE id = p_role_id;

    -- If no required skills, consider it a 100% match
    IF v_required_skills IS NULL OR array_length(v_required_skills, 1) IS NULL THEN
        RETURN QUERY SELECT
            100.0::DECIMAL(5,2),
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            jsonb_build_object('no_requirements', true);
        RETURN;
    END IF;

    -- If user has no skills but role requires skills, it's 0% match
    IF v_user_skills IS NULL OR array_length(v_user_skills, 1) IS NULL THEN
        RETURN QUERY SELECT
            0.0::DECIMAL(5,2),
            ARRAY[]::TEXT[],
            v_required_skills,
            jsonb_build_object(
                'user_has_no_skills', true,
                'required_count', array_length(v_required_skills, 1)
            );
        RETURN;
    END IF;

    -- Calculate matched and missing skills (case-insensitive)
    v_required_count := array_length(v_required_skills, 1);

    -- Find matched skills
    SELECT ARRAY(
        SELECT DISTINCT rs
        FROM unnest(v_required_skills) rs
        WHERE EXISTS (
            SELECT 1
            FROM unnest(v_user_skills) us
            WHERE LOWER(TRIM(us)) = LOWER(TRIM(rs))
        )
    ) INTO v_matched;

    -- Find missing skills
    SELECT ARRAY(
        SELECT DISTINCT rs
        FROM unnest(v_required_skills) rs
        WHERE NOT EXISTS (
            SELECT 1
            FROM unnest(v_user_skills) us
            WHERE LOWER(TRIM(us)) = LOWER(TRIM(rs))
        )
    ) INTO v_missing;

    v_match_count := array_length(v_matched, 1);
    IF v_match_count IS NULL THEN
        v_match_count := 0;
    END IF;

    -- Calculate percentage (0-100)
    v_score := ROUND((v_match_count::DECIMAL / v_required_count::DECIMAL) * 100, 2);

    -- Build breakdown
    v_breakdown := jsonb_build_object(
        'matched_count', v_match_count,
        'required_count', v_required_count,
        'user_skill_count', array_length(v_user_skills, 1),
        'match_percentage', v_score
    );

    RETURN QUERY SELECT v_score, v_matched, v_missing, v_breakdown;
END;
$$;


ALTER FUNCTION "public"."calculate_collaboration_skill_match"("p_profile_id" "uuid", "p_role_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_collaboration_skill_match"("p_profile_id" "uuid", "p_role_id" "uuid") IS 'Calculates skill match percentage between user and collaboration role with matched/missing skills breakdown';



CREATE OR REPLACE FUNCTION "public"."calculate_complete_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid", "p_physical_requirements" "jsonb" DEFAULT NULL::"jsonb") RETURNS TABLE("overall_score" numeric, "skill_match_score" numeric, "profile_completeness_score" numeric, "work_preference_score" numeric, "availability_score" numeric, "physical_match_score" numeric, "matched_skills" "text"[], "missing_skills" "text"[], "missing_profile_fields" "text"[], "physical_matched" "text"[], "physical_mismatches" "text"[], "breakdown" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_enhanced_result RECORD;
    v_physical_result RECORD;
BEGIN
    -- Get enhanced compatibility (existing function)
    SELECT * INTO v_enhanced_result
    FROM calculate_enhanced_collaboration_compatibility(p_profile_id, p_role_id);

    -- Calculate physical attribute match if requirements provided
    IF p_physical_requirements IS NOT NULL THEN
        SELECT * INTO v_physical_result
        FROM calculate_physical_attribute_match(p_profile_id, p_physical_requirements);
    ELSE
        -- No physical requirements, perfect score
        v_physical_result.score := 100.0;
        v_physical_result.matched_attributes := ARRAY[]::TEXT[];
        v_physical_result.mismatch_reasons := ARRAY[]::TEXT[];
    END IF;

    -- Calculate new overall score with physical attributes
    -- 40% skill, 15% profile, 15% work prefs, 15% availability, 15% physical
    DECLARE
        v_final_overall DECIMAL(5,2);
        v_final_breakdown JSONB;
    BEGIN
        v_final_overall := ROUND(
            (v_enhanced_result.skill_match_score * 0.40) +
            (v_enhanced_result.profile_completeness_score * 0.15) +
            (v_enhanced_result.work_preference_score * 0.15) +
            (v_enhanced_result.availability_score * 0.15) +
            (v_physical_result.score * 0.15),
            2
        );

        -- Build comprehensive breakdown
        v_final_breakdown := v_enhanced_result.breakdown || jsonb_build_object(
            'physical_match', jsonb_build_object(
                'score', v_physical_result.score,
                'weight', 0.15,
                'weighted_contribution', ROUND(v_physical_result.score * 0.15, 2),
                'matched_attributes', v_physical_result.matched_attributes,
                'mismatches', v_physical_result.mismatch_reasons
            ),
            'overall', jsonb_build_object(
                'score', v_final_overall,
                'meets_minimum_threshold',
                    v_enhanced_result.skill_match_score >= 30.0 AND
                    v_enhanced_result.profile_completeness_score >= 60.0 AND
                    v_physical_result.score >= 50.0
            )
        );

        RETURN QUERY SELECT
            v_final_overall,
            v_enhanced_result.skill_match_score,
            v_enhanced_result.profile_completeness_score,
            v_enhanced_result.work_preference_score,
            v_enhanced_result.availability_score,
            v_physical_result.score,
            v_enhanced_result.matched_skills,
            v_enhanced_result.missing_skills,
            v_enhanced_result.missing_profile_fields,
            v_physical_result.matched_attributes,
            v_physical_result.mismatch_reasons,
            v_final_breakdown;
    END;
END;
$$;


ALTER FUNCTION "public"."calculate_complete_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid", "p_physical_requirements" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_complete_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid", "p_physical_requirements" "jsonb") IS 'Complete compatibility calculation including skills, profile, work preferences, availability, and physical attributes';



CREATE OR REPLACE FUNCTION "public"."calculate_enhanced_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid") RETURNS TABLE("overall_score" numeric, "skill_match_score" numeric, "profile_completeness_score" numeric, "work_preference_score" numeric, "availability_score" numeric, "matched_skills" "text"[], "missing_skills" "text"[], "missing_profile_fields" "text"[], "breakdown" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_overall_score DECIMAL(5,2) := 0;
    v_skill_score DECIMAL(5,2) := 0;
    v_profile_score DECIMAL(5,2) := 0;
    v_work_pref_score DECIMAL(5,2) := 0;
    v_availability_score DECIMAL(5,2) := 0;
    v_matched TEXT[] := ARRAY[]::TEXT[];
    v_missing TEXT[] := ARRAY[]::TEXT[];
    v_missing_fields TEXT[] := ARRAY[]::TEXT[];
    v_breakdown JSONB := '{}';
    v_profile RECORD;
    v_role RECORD;
    v_skill_result RECORD;
    v_work_pref_reasons TEXT[] := ARRAY[]::TEXT[];
    v_availability_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get profile data with new fields
    SELECT * INTO v_profile
    FROM users_profile
    WHERE id = p_profile_id;

    IF v_profile IS NULL THEN
        RETURN QUERY SELECT
            0.0::DECIMAL(5,2), 0.0::DECIMAL(5,2), 0.0::DECIMAL(5,2),
            0.0::DECIMAL(5,2), 0.0::DECIMAL(5,2),
            ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['profile_not_found']::TEXT[],
            jsonb_build_object('error', 'profile_not_found');
        RETURN;
    END IF;

    -- Get role data with project information
    SELECT r.*, p.compensation_type, p.location_type, p.start_date, p.end_date
    INTO v_role
    FROM collab_roles r
    LEFT JOIN collab_projects p ON r.project_id = p.id
    WHERE r.id = p_role_id;

    -- Calculate skill match (using existing function)
    SELECT * INTO v_skill_result
    FROM calculate_collaboration_skill_match(p_profile_id, p_role_id);

    v_skill_score := v_skill_result.score;
    v_matched := v_skill_result.matched_skills;
    v_missing := v_skill_result.missing_skills;

    -- Calculate enhanced profile completeness (includes new demographic fields)
    v_profile_score := 0;

    -- Core fields (20 points each, 80 total)
    IF v_profile.bio IS NOT NULL AND TRIM(v_profile.bio) != '' THEN
        v_profile_score := v_profile_score + 20.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'bio');
    END IF;

    IF v_profile.city IS NOT NULL AND TRIM(v_profile.city) != '' THEN
        v_profile_score := v_profile_score + 20.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'city');
    END IF;

    IF v_profile.country IS NOT NULL AND TRIM(v_profile.country) != '' THEN
        v_profile_score := v_profile_score + 20.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'country');
    END IF;

    IF v_profile.specializations IS NOT NULL AND array_length(v_profile.specializations, 1) > 0 THEN
        v_profile_score := v_profile_score + 20.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'specializations');
    END IF;

    -- Enhanced demographic fields (5 points each, 20 total)
    IF v_profile.experience_level IS NOT NULL THEN
        v_profile_score := v_profile_score + 5.0;
    END IF;

    IF v_profile.nationality IS NOT NULL THEN
        v_profile_score := v_profile_score + 5.0;
    END IF;

    IF v_profile.body_type IS NOT NULL AND v_role.requires_physical_presence THEN
        v_profile_score := v_profile_score + 5.0;
    END IF;

    IF v_profile.availability_status IS NOT NULL THEN
        v_profile_score := v_profile_score + 5.0;
    END IF;

    -- Calculate work preference compatibility score (0-100)
    v_work_pref_score := 100.0; -- Start at perfect match

    -- Check compensation preferences
    IF v_role.compensation_type = 'tfp' AND v_profile.accepts_tfp = false THEN
        v_work_pref_score := v_work_pref_score - 30.0;
        v_work_pref_reasons := array_append(v_work_pref_reasons, 'Does not accept TFP');
    ELSIF v_role.compensation_type = 'tfp' AND v_profile.accepts_tfp = true THEN
        v_work_pref_reasons := array_append(v_work_pref_reasons, 'Accepts TFP work');
    END IF;

    -- Check location preferences
    IF v_role.location_type = 'studio' AND v_profile.prefers_outdoor = true AND v_profile.prefers_studio = false THEN
        v_work_pref_score := v_work_pref_score - 15.0;
        v_work_pref_reasons := array_append(v_work_pref_reasons, 'Prefers outdoor work');
    ELSIF v_role.location_type = 'outdoor' AND v_profile.prefers_studio = true AND v_profile.prefers_outdoor = false THEN
        v_work_pref_score := v_work_pref_score - 15.0;
        v_work_pref_reasons := array_append(v_work_pref_reasons, 'Prefers studio work');
    END IF;

    -- Check team work preferences
    IF v_role.team_size > 5 AND v_profile.prefers_solo_work = true AND v_profile.works_with_teams = false THEN
        v_work_pref_score := v_work_pref_score - 20.0;
        v_work_pref_reasons := array_append(v_work_pref_reasons, 'Prefers solo work');
    END IF;

    -- Ensure score doesn't go below 0
    v_work_pref_score := GREATEST(v_work_pref_score, 0.0);

    -- Calculate availability score (0-100)
    v_availability_score := 0;

    IF v_profile.availability_status = 'available' THEN
        v_availability_score := v_availability_score + 40.0;
        v_availability_reasons := array_append(v_availability_reasons, 'Currently available');
    ELSIF v_profile.availability_status = 'limited' THEN
        v_availability_score := v_availability_score + 25.0;
        v_availability_reasons := array_append(v_availability_reasons, 'Limited availability');
    ELSIF v_profile.availability_status = 'busy' THEN
        v_availability_score := v_availability_score + 10.0;
        v_availability_reasons := array_append(v_availability_reasons, 'Currently busy');
    END IF;

    -- Check schedule compatibility
    IF EXTRACT(DOW FROM v_role.start_date) IN (0, 6) THEN -- Weekend project
        IF v_profile.available_weekends = true THEN
            v_availability_score := v_availability_score + 30.0;
            v_availability_reasons := array_append(v_availability_reasons, 'Available on weekends');
        ELSE
            v_availability_score := v_availability_score + 5.0;
        END IF;
    ELSE -- Weekday project
        IF v_profile.available_weekdays = true THEN
            v_availability_score := v_availability_score + 30.0;
            v_availability_reasons := array_append(v_availability_reasons, 'Available on weekdays');
        END IF;
    END IF;

    -- Check evening availability
    IF v_role.requires_evening_work = true AND v_profile.available_evenings = true THEN
        v_availability_score := v_availability_score + 15.0;
        v_availability_reasons := array_append(v_availability_reasons, 'Available evenings');
    END IF;

    -- Check overnight availability
    IF v_role.requires_overnight = true AND v_profile.available_overnight = true THEN
        v_availability_score := v_availability_score + 15.0;
        v_availability_reasons := array_append(v_availability_reasons, 'Available overnight');
    END IF;

    -- Cap availability score at 100
    v_availability_score := LEAST(v_availability_score, 100.0);

    -- Calculate overall score with new weights:
    -- 50% skill match, 20% profile completeness, 15% work preferences, 15% availability
    v_overall_score := ROUND(
        (v_skill_score * 0.50) +
        (v_profile_score * 0.20) +
        (v_work_pref_score * 0.15) +
        (v_availability_score * 0.15),
        2
    );

    -- Build comprehensive breakdown
    v_breakdown := jsonb_build_object(
        'skill_match', jsonb_build_object(
            'score', v_skill_score,
            'weight', 0.50,
            'weighted_contribution', ROUND(v_skill_score * 0.50, 2),
            'matched_skills', v_matched,
            'missing_skills', v_missing
        ),
        'profile_completeness', jsonb_build_object(
            'score', v_profile_score,
            'weight', 0.20,
            'weighted_contribution', ROUND(v_profile_score * 0.20, 2),
            'missing_fields', v_missing_fields
        ),
        'work_preferences', jsonb_build_object(
            'score', v_work_pref_score,
            'weight', 0.15,
            'weighted_contribution', ROUND(v_work_pref_score * 0.15, 2),
            'reasons', v_work_pref_reasons
        ),
        'availability', jsonb_build_object(
            'score', v_availability_score,
            'weight', 0.15,
            'weighted_contribution', ROUND(v_availability_score * 0.15, 2),
            'reasons', v_availability_reasons
        ),
        'overall', jsonb_build_object(
            'score', v_overall_score,
            'meets_minimum_threshold', v_skill_score >= 30.0 AND v_profile_score >= 60.0
        )
    );

    RETURN QUERY SELECT
        v_overall_score,
        v_skill_score,
        v_profile_score,
        v_work_pref_score,
        v_availability_score,
        v_matched,
        v_missing,
        v_missing_fields,
        v_breakdown;
END;
$$;


ALTER FUNCTION "public"."calculate_enhanced_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_enhanced_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid") IS 'Enhanced compatibility calculation including demographics, work preferences, and availability';



CREATE OR REPLACE FUNCTION "public"."calculate_enhanced_compatibility_with_skills"("p_profile_id" "uuid", "p_gig_id" "uuid") RETURNS TABLE("compatibility_score" numeric, "matched_skills" "text"[], "missing_skills" "text"[], "experience_details" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_profile RECORD;
    v_gig RECORD;
    v_required_skills TEXT[];
    v_user_skills TEXT[];
    v_matched TEXT[];
    v_missing TEXT[];
    v_skill_score DECIMAL(5,2);
    v_experience_details JSONB;
    v_skill_details JSONB[] := ARRAY[]::JSONB[];
    v_skill_record RECORD;
BEGIN
    -- Get profile and gig data
    SELECT * INTO v_profile FROM users_profile WHERE id = p_profile_id;
    SELECT * INTO v_gig FROM gigs WHERE id = p_gig_id;
    
    IF v_profile IS NULL OR v_gig IS NULL THEN
        RETURN QUERY SELECT 0.0::DECIMAL(5,2), ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Extract required skills from gig preferences (if available)
    IF v_gig.applicant_preferences IS NOT NULL THEN
        SELECT array_agg(value::TEXT) INTO v_required_skills
        FROM jsonb_array_elements_text(v_gig.applicant_preferences->'professional'->'specializations');
    ELSE
        -- Fallback to basic specializations matching
        v_required_skills := v_profile.specializations;
    END IF;
    
    -- Get user skills
    SELECT array_agg(skill_name) INTO v_user_skills
    FROM user_skills 
    WHERE profile_id = p_profile_id;
    
    -- Calculate skill experience score
    v_skill_score := calculate_skill_experience_score(p_profile_id, v_required_skills);
    
    -- Find matched and missing skills
    IF v_required_skills IS NOT NULL AND array_length(v_required_skills, 1) > 0 THEN
        -- Matched skills
        SELECT array_agg(skill) INTO v_matched
        FROM unnest(v_required_skills) AS skill
        WHERE skill = ANY(v_user_skills);
        
        -- Missing skills
        SELECT array_agg(skill) INTO v_missing
        FROM unnest(v_required_skills) AS skill
        WHERE skill != ALL(COALESCE(v_user_skills, ARRAY[]::TEXT[]));
    END IF;
    
    -- Build experience details
    FOR v_skill_record IN
        SELECT skill_name, years_experience, proficiency_level
        FROM user_skills 
        WHERE profile_id = p_profile_id
        AND (v_required_skills IS NULL OR skill_name = ANY(v_required_skills))
        ORDER BY years_experience DESC NULLS LAST
    LOOP
        v_skill_details := array_append(v_skill_details, 
            jsonb_build_object(
                'skill', v_skill_record.skill_name,
                'years_experience', v_skill_record.years_experience,
                'proficiency_level', v_skill_record.proficiency_level
            )
        );
    END LOOP;
    
    v_experience_details := jsonb_build_object(
        'skill_experience_score', v_skill_score,
        'total_skills', array_length(v_user_skills, 1),
        'matched_skills_count', array_length(v_matched, 1),
        'skills', to_jsonb(v_skill_details)
    );
    
    RETURN QUERY SELECT 
        v_skill_score,
        COALESCE(v_matched, ARRAY[]::TEXT[]),
        COALESCE(v_missing, ARRAY[]::TEXT[]),
        v_experience_details;
END;
$$;


ALTER FUNCTION "public"."calculate_enhanced_compatibility_with_skills"("p_profile_id" "uuid", "p_gig_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_enhanced_compatibility_with_skills"("p_profile_id" "uuid", "p_gig_id" "uuid") IS 'Enhanced compatibility calculation using per-skill experience';



CREATE OR REPLACE FUNCTION "public"."calculate_gig_compatibility_with_preferences"("p_profile_id" "uuid", "p_gig_id" "uuid") RETURNS TABLE("score" numeric, "breakdown" "jsonb", "matched_attributes" "text"[], "missing_requirements" "text"[])
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_score DECIMAL(5,2) := 0;
    v_breakdown JSONB := '{}';
    v_matched TEXT[] := ARRAY[]::TEXT[];
    v_missing TEXT[] := ARRAY[]::TEXT[];
    v_profile RECORD;
    v_gig RECORD;
    v_preferences JSONB;
    v_physical_score DECIMAL(5,2) := 0;
    v_professional_score DECIMAL(5,2) := 0;
    v_availability_score DECIMAL(5,2) := 0;
    v_demographic_score DECIMAL(5,2) := 0;
    v_total_possible DECIMAL(5,2) := 0;
BEGIN
    -- Get profile data with ALL new fields
    SELECT
        height_cm, weight_kg, eye_color, hair_color, hair_length,
        skin_tone, body_type, tattoos, piercings,
        gender_identity, ethnicity, nationality,
        years_experience, specializations, equipment_list,
        available_for_travel, hourly_rate_min, hourly_rate_max,
        experience_level, availability_status,
        available_weekdays, available_weekends, available_evenings,
        accepts_tfp, accepts_expenses_only,
        prefers_studio, prefers_outdoor
    INTO v_profile
    FROM users_profile
    WHERE id = p_profile_id;

    -- Get gig data with preferences
    SELECT * INTO v_gig
    FROM gigs
    WHERE id = p_gig_id;

    -- Return 0 if either doesn't exist
    IF v_profile IS NULL OR v_gig IS NULL THEN
        RETURN QUERY SELECT
            0.0::DECIMAL(5,2),
            '{}'::JSONB,
            ARRAY[]::TEXT[],
            ARRAY['Profile or gig not found']::TEXT[];
        RETURN;
    END IF;

    -- Get preferences (default to empty object if null)
    v_preferences := COALESCE(v_gig.applicant_preferences, '{}'::JSONB);

    -- Base score for everyone (20 points)
    v_score := 20.0;
    v_total_possible := 20.0;

    -- ============================================
    -- PHYSICAL ATTRIBUTES MATCHING (35 points possible)
    -- ============================================
    IF v_preferences ? 'physical' THEN
        -- Height range (10 points)
        IF v_preferences->'physical' ? 'height_range' THEN
            v_total_possible := v_total_possible + 10.0;
            DECLARE
                min_height INTEGER := (v_preferences->'physical'->'height_range'->>'min')::INTEGER;
                max_height INTEGER := (v_preferences->'physical'->'height_range'->>'max')::INTEGER;
            BEGIN
                IF v_profile.height_cm IS NULL THEN
                    v_missing := array_append(v_missing, 'height');
                ELSIF (min_height IS NULL OR v_profile.height_cm >= min_height) AND
                      (max_height IS NULL OR v_profile.height_cm <= max_height) THEN
                    v_physical_score := v_physical_score + 10.0;
                    v_matched := array_append(v_matched, format('Height: %s cm', v_profile.height_cm));
                END IF;
            END;
        END IF;

        -- Eye color (5 points)
        IF v_preferences->'physical' ? 'eye_colors' THEN
            v_total_possible := v_total_possible + 5.0;
            DECLARE
                required_colors TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'physical'->'eye_colors'));
            BEGIN
                IF v_profile.eye_color IS NULL THEN
                    v_missing := array_append(v_missing, 'eye_color');
                ELSIF v_profile.eye_color = ANY(required_colors) THEN
                    v_physical_score := v_physical_score + 5.0;
                    v_matched := array_append(v_matched, format('Eye color: %s', v_profile.eye_color));
                END IF;
            END;
        END IF;

        -- Hair color (5 points)
        IF v_preferences->'physical' ? 'hair_colors' THEN
            v_total_possible := v_total_possible + 5.0;
            DECLARE
                required_colors TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'physical'->'hair_colors'));
            BEGIN
                IF v_profile.hair_color IS NULL THEN
                    v_missing := array_append(v_missing, 'hair_color');
                ELSIF v_profile.hair_color = ANY(required_colors) THEN
                    v_physical_score := v_physical_score + 5.0;
                    v_matched := array_append(v_matched, format('Hair color: %s', v_profile.hair_color));
                END IF;
            END;
        END IF;

        -- Hair length (3 points) - NEW
        IF v_preferences->'physical' ? 'hair_lengths' THEN
            v_total_possible := v_total_possible + 3.0;
            DECLARE
                required_lengths TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'physical'->'hair_lengths'));
            BEGIN
                IF v_profile.hair_length IS NULL THEN
                    v_missing := array_append(v_missing, 'hair_length');
                ELSIF v_profile.hair_length = ANY(required_lengths) THEN
                    v_physical_score := v_physical_score + 3.0;
                    v_matched := array_append(v_matched, format('Hair length: %s', v_profile.hair_length));
                END IF;
            END;
        END IF;

        -- Skin tone (3 points) - NEW
        IF v_preferences->'physical' ? 'skin_tones' THEN
            v_total_possible := v_total_possible + 3.0;
            DECLARE
                required_tones TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'physical'->'skin_tones'));
            BEGIN
                IF v_profile.skin_tone IS NULL THEN
                    v_missing := array_append(v_missing, 'skin_tone');
                ELSIF v_profile.skin_tone = ANY(required_tones) THEN
                    v_physical_score := v_physical_score + 3.0;
                    v_matched := array_append(v_matched, format('Skin tone: %s', v_profile.skin_tone));
                END IF;
            END;
        END IF;

        -- Body type (4 points) - NEW
        IF v_preferences->'physical' ? 'body_types' THEN
            v_total_possible := v_total_possible + 4.0;
            DECLARE
                required_types TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'physical'->'body_types'));
            BEGIN
                IF v_profile.body_type IS NULL THEN
                    v_missing := array_append(v_missing, 'body_type');
                ELSIF v_profile.body_type = ANY(required_types) THEN
                    v_physical_score := v_physical_score + 4.0;
                    v_matched := array_append(v_matched, format('Body type: %s', v_profile.body_type));
                END IF;
            END;
        END IF;

        -- Tattoos (3 points)
        IF v_preferences->'physical' ? 'tattoos_allowed' THEN
            v_total_possible := v_total_possible + 3.0;
            IF (v_preferences->'physical'->>'tattoos_allowed')::BOOLEAN = true OR
               v_profile.tattoos = false THEN
                v_physical_score := v_physical_score + 3.0;
                v_matched := array_append(v_matched,
                    CASE WHEN v_profile.tattoos THEN 'Has tattoos (allowed)' ELSE 'No tattoos' END);
            END IF;
        END IF;

        -- Piercings (2 points)
        IF v_preferences->'physical' ? 'piercings_allowed' THEN
            v_total_possible := v_total_possible + 2.0;
            IF (v_preferences->'physical'->>'piercings_allowed')::BOOLEAN = true OR
               v_profile.piercings = false THEN
                v_physical_score := v_physical_score + 2.0;
                v_matched := array_append(v_matched,
                    CASE WHEN v_profile.piercings THEN 'Has piercings (allowed)' ELSE 'No piercings' END);
            END IF;
        END IF;
    END IF;

    -- ============================================
    -- DEMOGRAPHIC MATCHING (15 points possible) - NEW
    -- ============================================
    IF v_preferences ? 'demographics' THEN
        -- Gender identity (8 points)
        IF v_preferences->'demographics' ? 'gender_identities' THEN
            v_total_possible := v_total_possible + 8.0;
            DECLARE
                required_genders TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'demographics'->'gender_identities'));
            BEGIN
                IF v_profile.gender_identity IS NULL THEN
                    v_missing := array_append(v_missing, 'gender_identity');
                ELSIF v_profile.gender_identity = ANY(required_genders) THEN
                    v_demographic_score := v_demographic_score + 8.0;
                    v_matched := array_append(v_matched, format('Gender: %s', v_profile.gender_identity));
                END IF;
            END;
        END IF;

        -- Ethnicity (4 points)
        IF v_preferences->'demographics' ? 'ethnicities' THEN
            v_total_possible := v_total_possible + 4.0;
            DECLARE
                required_ethnicities TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'demographics'->'ethnicities'));
            BEGIN
                IF v_profile.ethnicity IS NULL THEN
                    v_missing := array_append(v_missing, 'ethnicity');
                ELSIF v_profile.ethnicity = ANY(required_ethnicities) THEN
                    v_demographic_score := v_demographic_score + 4.0;
                    v_matched := array_append(v_matched, format('Ethnicity: %s', v_profile.ethnicity));
                END IF;
            END;
        END IF;

        -- Nationality (3 points)
        IF v_preferences->'demographics' ? 'nationalities' THEN
            v_total_possible := v_total_possible + 3.0;
            DECLARE
                required_nationalities TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'demographics'->'nationalities'));
            BEGIN
                IF v_profile.nationality IS NULL THEN
                    v_missing := array_append(v_missing, 'nationality');
                ELSIF v_profile.nationality = ANY(required_nationalities) THEN
                    v_demographic_score := v_demographic_score + 3.0;
                    v_matched := array_append(v_matched, format('Nationality: %s', v_profile.nationality));
                END IF;
            END;
        END IF;
    END IF;

    -- ============================================
    -- PROFESSIONAL PREFERENCES (20 points possible)
    -- ============================================
    IF v_preferences ? 'professional' THEN
        -- Experience level (8 points) - NEW
        IF v_preferences->'professional' ? 'experience_levels' THEN
            v_total_possible := v_total_possible + 8.0;
            DECLARE
                required_levels TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'professional'->'experience_levels'));
            BEGIN
                IF v_profile.experience_level IS NULL THEN
                    v_missing := array_append(v_missing, 'experience_level');
                ELSIF v_profile.experience_level = ANY(required_levels) THEN
                    v_professional_score := v_professional_score + 8.0;
                    v_matched := array_append(v_matched, format('Experience: %s', v_profile.experience_level));
                END IF;
            END;
        END IF;

        -- Specializations (12 points)
        IF v_preferences->'professional' ? 'specializations' THEN
            v_total_possible := v_total_possible + 12.0;
            IF v_profile.specializations IS NOT NULL AND array_length(v_profile.specializations, 1) > 0 THEN
                DECLARE
                    required_specs JSONB := v_preferences->'professional'->'specializations';
                    match_count INTEGER := 0;
                    total_required INTEGER := jsonb_array_length(required_specs);
                BEGIN
                    FOR i IN 0..total_required-1 LOOP
                        IF (required_specs->>i) = ANY(v_profile.specializations) THEN
                            match_count := match_count + 1;
                        END IF;
                    END LOOP;

                    IF total_required > 0 THEN
                        v_professional_score := v_professional_score + (12.0 * match_count / total_required);
                        v_matched := array_append(v_matched, format('%s/%s specializations match', match_count, total_required));
                    END IF;
                END;
            ELSE
                v_missing := array_append(v_missing, 'specializations');
            END IF;
        END IF;
    END IF;

    -- ============================================
    -- WORK PREFERENCES (10 points possible) - NEW
    -- ============================================
    IF v_preferences ? 'work_preferences' THEN
        -- TFP acceptance (3 points)
        IF v_preferences->'work_preferences' ? 'accepts_tfp' THEN
            v_total_possible := v_total_possible + 3.0;
            IF (v_preferences->'work_preferences'->>'accepts_tfp')::BOOLEAN = v_profile.accepts_tfp THEN
                v_availability_score := v_availability_score + 3.0;
                v_matched := array_append(v_matched, 'TFP preference matches');
            END IF;
        END IF;

        -- Location preference (studio/outdoor) (4 points)
        IF v_preferences->'work_preferences' ? 'location_type' THEN
            v_total_possible := v_total_possible + 4.0;
            DECLARE
                pref_location TEXT := v_preferences->'work_preferences'->>'location_type';
            BEGIN
                IF (pref_location = 'studio' AND v_profile.prefers_studio = true) OR
                   (pref_location = 'outdoor' AND v_profile.prefers_outdoor = true) THEN
                    v_availability_score := v_availability_score + 4.0;
                    v_matched := array_append(v_matched, format('Prefers %s work', pref_location));
                END IF;
            END;
        END IF;

        -- Schedule availability (3 points)
        IF v_preferences->'work_preferences' ? 'schedule' THEN
            v_total_possible := v_total_possible + 3.0;
            DECLARE
                schedule TEXT := v_preferences->'work_preferences'->>'schedule';
            BEGIN
                IF (schedule = 'weekdays' AND v_profile.available_weekdays = true) OR
                   (schedule = 'weekends' AND v_profile.available_weekends = true) OR
                   (schedule = 'evenings' AND v_profile.available_evenings = true) THEN
                    v_availability_score := v_availability_score + 3.0;
                    v_matched := array_append(v_matched, format('Available %s', schedule));
                END IF;
            END;
        END IF;
    END IF;

    -- Calculate final percentage score
    IF v_total_possible > 0 THEN
        v_score := ROUND((v_score + v_physical_score + v_demographic_score + v_professional_score + v_availability_score) / v_total_possible * 100, 2);
    ELSE
        v_score := 100.0; -- No requirements, everyone matches
    END IF;

    -- Build breakdown
    v_breakdown := jsonb_build_object(
        'total_score', v_score,
        'components', jsonb_build_object(
            'base', 20.0,
            'physical', v_physical_score,
            'demographics', v_demographic_score,
            'professional', v_professional_score,
            'availability', v_availability_score
        ),
        'total_possible', v_total_possible,
        'matched_count', array_length(v_matched, 1),
        'missing_count', array_length(v_missing, 1)
    );

    RETURN QUERY SELECT v_score, v_breakdown, v_matched, v_missing;
END;
$$;


ALTER FUNCTION "public"."calculate_gig_compatibility_with_preferences"("p_profile_id" "uuid", "p_gig_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_gig_compatibility_with_preferences"("p_profile_id" "uuid", "p_gig_id" "uuid") IS 'Enhanced gig compatibility matching with all physical attributes, demographics, work preferences (height, eye/hair color/length, skin tone, body type, gender, ethnicity, nationality, experience level, TFP acceptance, location preference, schedule)';



CREATE OR REPLACE FUNCTION "public"."calculate_physical_attribute_match"("p_profile_id" "uuid", "p_gig_requirements" "jsonb") RETURNS TABLE("score" numeric, "matched_attributes" "text"[], "missing_attributes" "text"[], "mismatch_reasons" "text"[])
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_score DECIMAL(5,2) := 100.0; -- Start at perfect match
    v_matched TEXT[] := ARRAY[]::TEXT[];
    v_missing TEXT[] := ARRAY[]::TEXT[];
    v_mismatches TEXT[] := ARRAY[]::TEXT[];
    v_profile RECORD;
    v_total_checks INTEGER := 0;
    v_passed_checks INTEGER := 0;
BEGIN
    -- Get user profile with physical attributes
    SELECT
        height_cm, weight_kg, eye_color, hair_color, hair_length,
        skin_tone, body_type, tattoos, piercings, gender_identity
    INTO v_profile
    FROM users_profile
    WHERE id = p_profile_id;

    IF v_profile IS NULL THEN
        RETURN QUERY SELECT 0.0::DECIMAL(5,2),
            ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Profile not found']::TEXT[];
        RETURN;
    END IF;

    -- Check height requirements (if specified)
    IF p_gig_requirements ? 'height_range' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_min_height INTEGER := (p_gig_requirements->'height_range'->>'min')::INTEGER;
            v_max_height INTEGER := (p_gig_requirements->'height_range'->>'max')::INTEGER;
        BEGIN
            IF v_profile.height_cm IS NULL THEN
                v_missing := array_append(v_missing, 'height');
                v_score := v_score - 15.0;
            ELSIF (v_min_height IS NULL OR v_profile.height_cm >= v_min_height) AND
                  (v_max_height IS NULL OR v_profile.height_cm <= v_max_height) THEN
                v_matched := array_append(v_matched, format('Height: %s cm', v_profile.height_cm));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Height %s cm outside range %s-%s cm',
                        v_profile.height_cm, v_min_height, v_max_height));
                v_score := v_score - 20.0;
            END IF;
        END;
    END IF;

    -- Check eye color requirements (if specified)
    IF p_gig_requirements ? 'eye_colors' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_required_eye_colors TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_gig_requirements->'eye_colors'));
        BEGIN
            IF v_profile.eye_color IS NULL THEN
                v_missing := array_append(v_missing, 'eye_color');
                v_score := v_score - 10.0;
            ELSIF v_profile.eye_color = ANY(v_required_eye_colors) THEN
                v_matched := array_append(v_matched, format('Eye color: %s', v_profile.eye_color));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Eye color %s not in required colors', v_profile.eye_color));
                v_score := v_score - 15.0;
            END IF;
        END;
    END IF;

    -- Check hair color requirements (if specified)
    IF p_gig_requirements ? 'hair_colors' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_required_hair_colors TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_gig_requirements->'hair_colors'));
        BEGIN
            IF v_profile.hair_color IS NULL THEN
                v_missing := array_append(v_missing, 'hair_color');
                v_score := v_score - 10.0;
            ELSIF v_profile.hair_color = ANY(v_required_hair_colors) THEN
                v_matched := array_append(v_matched, format('Hair color: %s', v_profile.hair_color));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Hair color %s not in required colors', v_profile.hair_color));
                v_score := v_score - 15.0;
            END IF;
        END;
    END IF;

    -- Check hair length requirements (if specified)
    IF p_gig_requirements ? 'hair_lengths' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_required_hair_lengths TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_gig_requirements->'hair_lengths'));
        BEGIN
            IF v_profile.hair_length IS NULL THEN
                v_missing := array_append(v_missing, 'hair_length');
                v_score := v_score - 8.0;
            ELSIF v_profile.hair_length = ANY(v_required_hair_lengths) THEN
                v_matched := array_append(v_matched, format('Hair length: %s', v_profile.hair_length));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Hair length %s not in required lengths', v_profile.hair_length));
                v_score := v_score - 12.0;
            END IF;
        END;
    END IF;

    -- Check skin tone requirements (if specified)
    IF p_gig_requirements ? 'skin_tones' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_required_skin_tones TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_gig_requirements->'skin_tones'));
        BEGIN
            IF v_profile.skin_tone IS NULL THEN
                v_missing := array_append(v_missing, 'skin_tone');
                v_score := v_score - 8.0;
            ELSIF v_profile.skin_tone = ANY(v_required_skin_tones) THEN
                v_matched := array_append(v_matched, format('Skin tone: %s', v_profile.skin_tone));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Skin tone %s not in required tones', v_profile.skin_tone));
                v_score := v_score - 12.0;
            END IF;
        END;
    END IF;

    -- Check body type requirements (if specified)
    IF p_gig_requirements ? 'body_types' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_required_body_types TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_gig_requirements->'body_types'));
        BEGIN
            IF v_profile.body_type IS NULL THEN
                v_missing := array_append(v_missing, 'body_type');
                v_score := v_score - 10.0;
            ELSIF v_profile.body_type = ANY(v_required_body_types) THEN
                v_matched := array_append(v_matched, format('Body type: %s', v_profile.body_type));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Body type %s not in required types', v_profile.body_type));
                v_score := v_score - 15.0;
            END IF;
        END;
    END IF;

    -- Check gender identity requirements (if specified)
    IF p_gig_requirements ? 'gender_identities' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_required_genders TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_gig_requirements->'gender_identities'));
        BEGIN
            IF v_profile.gender_identity IS NULL THEN
                v_missing := array_append(v_missing, 'gender_identity');
                v_score := v_score - 10.0;
            ELSIF v_profile.gender_identity = ANY(v_required_genders) THEN
                v_matched := array_append(v_matched, format('Gender: %s', v_profile.gender_identity));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Gender identity %s not in required identities', v_profile.gender_identity));
                v_score := v_score - 20.0;
            END IF;
        END;
    END IF;

    -- Check tattoo restrictions (if specified)
    IF p_gig_requirements ? 'tattoos_allowed' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_tattoos_allowed BOOLEAN := (p_gig_requirements->>'tattoos_allowed')::BOOLEAN;
        BEGIN
            IF v_tattoos_allowed = false AND v_profile.tattoos = true THEN
                v_mismatches := array_append(v_mismatches, 'Has tattoos but tattoos not allowed');
                v_score := v_score - 25.0;
            ELSIF v_tattoos_allowed = true OR v_profile.tattoos = false THEN
                v_matched := array_append(v_matched,
                    CASE WHEN v_profile.tattoos THEN 'Has tattoos (allowed)' ELSE 'No tattoos' END);
                v_passed_checks := v_passed_checks + 1;
            END IF;
        END;
    END IF;

    -- Check piercing restrictions (if specified)
    IF p_gig_requirements ? 'piercings_allowed' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_piercings_allowed BOOLEAN := (p_gig_requirements->>'piercings_allowed')::BOOLEAN;
        BEGIN
            IF v_piercings_allowed = false AND v_profile.piercings = true THEN
                v_mismatches := array_append(v_mismatches, 'Has piercings but piercings not allowed');
                v_score := v_score - 20.0;
            ELSIF v_piercings_allowed = true OR v_profile.piercings = false THEN
                v_matched := array_append(v_matched,
                    CASE WHEN v_profile.piercings THEN 'Has piercings (allowed)' ELSE 'No piercings' END);
                v_passed_checks := v_passed_checks + 1;
            END IF;
        END;
    END IF;

    -- Ensure score doesn't go below 0
    v_score := GREATEST(v_score, 0.0);

    RETURN QUERY SELECT v_score, v_matched, v_missing, v_mismatches;
END;
$$;


ALTER FUNCTION "public"."calculate_physical_attribute_match"("p_profile_id" "uuid", "p_gig_requirements" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_physical_attribute_match"("p_profile_id" "uuid", "p_gig_requirements" "jsonb") IS 'Calculates compatibility based on physical attributes (height, eye/hair color, body type, tattoos, etc.) for talent/modeling gigs';



CREATE OR REPLACE FUNCTION "public"."calculate_profile_completion"("user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    profile RECORD;
    completion INTEGER := 0;
    field_count INTEGER := 0;
    filled_count INTEGER := 0;
BEGIN
    SELECT * INTO profile FROM users_profile WHERE users_profile.user_id = $1;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Basic fields (required for all)
    field_count := field_count + 6;
    IF profile.display_name IS NOT NULL AND profile.display_name != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.handle IS NOT NULL AND profile.handle != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.bio IS NOT NULL AND profile.bio != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.city IS NOT NULL AND profile.city != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.country IS NOT NULL AND profile.country != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.avatar_url IS NOT NULL AND profile.avatar_url != '' THEN filled_count := filled_count + 1; END IF;
    
    -- Social media (optional but counted)
    field_count := field_count + 3;
    IF profile.instagram_handle IS NOT NULL AND profile.instagram_handle != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.website_url IS NOT NULL AND profile.website_url != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.phone_number IS NOT NULL AND profile.phone_number != '' THEN filled_count := filled_count + 1; END IF;
    
    -- Style tags
    field_count := field_count + 1;
    IF array_length(profile.style_tags, 1) > 0 THEN filled_count := filled_count + 1; END IF;
    
    -- Role-specific fields
    IF 'CONTRIBUTOR' = ANY(profile.role_flags) THEN
        field_count := field_count + 3;
        IF array_length(profile.equipment_list, 1) > 0 THEN filled_count := filled_count + 1; END IF;
        IF array_length(profile.editing_software, 1) > 0 THEN filled_count := filled_count + 1; END IF;
        IF profile.typical_turnaround_days IS NOT NULL THEN filled_count := filled_count + 1; END IF;
    END IF;
    
    IF 'TALENT' = ANY(profile.role_flags) THEN
        field_count := field_count + 4;
        IF profile.height_cm IS NOT NULL THEN filled_count := filled_count + 1; END IF;
        IF profile.eye_color IS NOT NULL THEN filled_count := filled_count + 1; END IF;
        IF profile.hair_color IS NOT NULL THEN filled_count := filled_count + 1; END IF;
        IF array_length(profile.talent_categories, 1) > 0 THEN filled_count := filled_count + 1; END IF;
    END IF;
    
    -- Calculate percentage
    IF field_count > 0 THEN
        completion := (filled_count * 100) / field_count;
    END IF;
    
    RETURN completion;
END;
$_$;


ALTER FUNCTION "public"."calculate_profile_completion"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_social_handle"("handle" "text", "platform" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    IF handle IS NULL OR handle = '' THEN
        RETURN true; -- Allow empty
    END IF;
    
    -- Remove @ if present
    handle := LTRIM(handle, '@');
    
    -- Basic validation for social media handles
    CASE platform
        WHEN 'instagram' THEN
            RETURN handle ~ '^[a-zA-Z0-9_.]{1,30}$';
        WHEN 'tiktok' THEN
            RETURN handle ~ '^[a-zA-Z0-9_.]{1,24}$';
        ELSE
            RETURN true;
    END CASE;
END;
$_$;


ALTER FUNCTION "public"."validate_social_handle"("handle" "text", "platform" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


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
    "first_name" "text",
    "last_name" "text",
    "email" character varying(255),
    "phone_public" boolean DEFAULT false,
    "email_public" boolean DEFAULT false,
    "show_location" boolean DEFAULT true,
    "travel_unit_preference" character varying(10) DEFAULT 'km'::character varying,
    "turnaround_unit_preference" character varying(10) DEFAULT 'days'::character varying,
    "phone_verified" boolean DEFAULT false,
    "profile_completion_percentage" integer DEFAULT 0,
    "instagram_url" "text",
    "tiktok_url" "text",
    "twitter_url" "text",
    "linkedin_url" "text",
    "gender_identity" character varying(50),
    "ethnicity" character varying(50),
    "nationality" character varying(100),
    "weight_kg" integer,
    "body_type" character varying(50),
    "hair_length" character varying(50),
    "skin_tone" character varying(50),
    "experience_level" character varying(50) DEFAULT 'beginner'::character varying,
    "availability_status" character varying(50) DEFAULT 'available'::character varying,
    "preferred_working_hours" "text",
    "state_province" character varying(100),
    "timezone" character varying(100),
    "passport_valid" boolean DEFAULT false,
    "show_age" boolean DEFAULT true,
    "show_physical_attributes" boolean DEFAULT true,
    "accepts_tfp" boolean DEFAULT false,
    "accepts_expenses_only" boolean DEFAULT false,
    "prefers_studio" boolean DEFAULT false,
    "prefers_outdoor" boolean DEFAULT false,
    "works_with_teams" boolean DEFAULT true,
    "prefers_solo_work" boolean DEFAULT false,
    "comfortable_with_nudity" boolean DEFAULT false,
    "comfortable_with_intimate_content" boolean DEFAULT false,
    "requires_model_release" boolean DEFAULT true,
    "show_phone" boolean DEFAULT false,
    "show_social_links" boolean DEFAULT true,
    "show_website" boolean DEFAULT true,
    "show_experience" boolean DEFAULT true,
    "show_specializations" boolean DEFAULT true,
    "show_equipment" boolean DEFAULT true,
    "show_rates" boolean DEFAULT false,
    "include_in_search" boolean DEFAULT true,
    "show_availability" boolean DEFAULT true,
    "allow_direct_messages" boolean DEFAULT true,
    "share_analytics" boolean DEFAULT false,
    "participate_research" boolean DEFAULT false,
    "primary_skill" "text",
    "working_time_preference" character varying(50) DEFAULT 'flexible'::character varying,
    "preferred_start_time" time without time zone,
    "preferred_end_time" time without time zone,
    "working_timezone" character varying(100),
    "contributor_roles" "text"[] DEFAULT '{}'::"text"[],
    "professional_skills" "text"[] DEFAULT '{}'::"text"[],
    "behance_url" "text",
    "dribbble_url" "text",
    "allow_direct_booking" boolean DEFAULT true,
    "available_weekdays" boolean DEFAULT true,
    "available_weekends" boolean DEFAULT false,
    "available_evenings" boolean DEFAULT false,
    "available_overnight" boolean DEFAULT false,
    "allow_collaboration_invites" boolean DEFAULT true,
    "allow_gig_invites" boolean DEFAULT true,
    CONSTRAINT "check_account_status_valid" CHECK ((("account_status")::"text" = ANY ((ARRAY['pending_verification'::character varying, 'active'::character varying, 'suspended'::character varying, 'banned'::character varying])::"text"[]))),
    CONSTRAINT "check_availability_status" CHECK ((("availability_status")::"text" = ANY ((ARRAY['Available'::character varying, 'Busy'::character varying, 'Unavailable'::character varying, 'Limited'::character varying, 'Weekends Only'::character varying, 'Weekdays Only'::character varying])::"text"[]))),
    CONSTRAINT "check_behance_url_format" CHECK ((("behance_url" IS NULL) OR ("behance_url" ~ '^https?://.*behance\.net.*'::"text"))),
    CONSTRAINT "check_dribbble_url_format" CHECK ((("dribbble_url" IS NULL) OR ("dribbble_url" ~ '^https?://.*dribbble\.com.*'::"text"))),
    CONSTRAINT "check_height_positive" CHECK ((("height_cm" IS NULL) OR ("height_cm" > 0))),
    CONSTRAINT "check_hourly_rate_valid" CHECK ((("hourly_rate_min" IS NULL) OR ("hourly_rate_max" IS NULL) OR ("hourly_rate_min" <= "hourly_rate_max"))),
    CONSTRAINT "check_style_tags_count" CHECK ((("array_length"("style_tags", 1) IS NULL) OR ("array_length"("style_tags", 1) <= 10))),
    CONSTRAINT "check_travel_radius_positive" CHECK (("travel_radius_km" >= 0)),
    CONSTRAINT "check_turnaround_days_positive" CHECK ((("typical_turnaround_days" IS NULL) OR ("typical_turnaround_days" > 0))),
    CONSTRAINT "check_vibe_tags_count" CHECK ((("array_length"("vibe_tags", 1) IS NULL) OR ("array_length"("vibe_tags", 1) <= 5))),
    CONSTRAINT "check_weight_kg_valid" CHECK ((("weight_kg" IS NULL) OR (("weight_kg" >= 30) AND ("weight_kg" <= 200)))),
    CONSTRAINT "check_working_time_preference" CHECK ((("working_time_preference")::"text" = ANY ((ARRAY['flexible'::character varying, 'standard_business_hours'::character varying, 'mornings_only'::character varying, 'evenings_only'::character varying, 'weekends_only'::character varying, 'overnight_only'::character varying, 'custom'::character varying])::"text"[]))),
    CONSTRAINT "check_years_experience_positive" CHECK (("years_experience" >= 0)),
    CONSTRAINT "handle_format" CHECK ((("handle")::"text" ~ '^[a-z0-9_]+$'::"text")),
    CONSTRAINT "users_profile_verification_method_check" CHECK (("verification_method" = ANY (ARRAY['self_attestation'::"text", 'document_upload'::"text", 'third_party'::"text", 'admin_override'::"text"]))),
    CONSTRAINT "valid_email_format" CHECK ((("email" IS NULL) OR (("email")::"text" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text"))),
    CONSTRAINT "valid_instagram_handle" CHECK ("public"."validate_social_handle"(("instagram_handle")::"text", 'instagram'::"text")),
    CONSTRAINT "valid_instagram_url" CHECK ((("instagram_url" IS NULL) OR ("instagram_url" ~* '^https://instagram\.com/[a-zA-Z0-9._]+$'::"text"))),
    CONSTRAINT "valid_linkedin_url" CHECK ((("linkedin_url" IS NULL) OR ("linkedin_url" ~* '^https://linkedin\.com/in/[a-zA-Z0-9-]+$'::"text"))),
    CONSTRAINT "valid_tiktok_handle" CHECK ("public"."validate_social_handle"(("tiktok_handle")::"text", 'tiktok'::"text")),
    CONSTRAINT "valid_tiktok_url" CHECK ((("tiktok_url" IS NULL) OR ("tiktok_url" ~* '^https://tiktok\.com/@[a-zA-Z0-9._]+$'::"text"))),
    CONSTRAINT "valid_twitter_url" CHECK ((("twitter_url" IS NULL) OR ("twitter_url" ~* '^https://twitter\.com/[a-zA-Z0-9_]+$'::"text")))
);


ALTER TABLE "public"."users_profile" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users_profile"."style_tags" IS 'Array of style tags (max 10)';



COMMENT ON COLUMN "public"."users_profile"."header_banner_url" IS 'URL of the user''s custom header banner image';



COMMENT ON COLUMN "public"."users_profile"."header_banner_position" IS 'JSON string containing banner position data (x, y, scale)';



COMMENT ON COLUMN "public"."users_profile"."vibe_tags" IS 'Array of vibe tags (max 5)';



COMMENT ON COLUMN "public"."users_profile"."country" IS 'Country where the user is located';



COMMENT ON COLUMN "public"."users_profile"."age_verified" IS 'Whether user age has been verified by admin';



COMMENT ON COLUMN "public"."users_profile"."account_status" IS 'Current status of the user account';



COMMENT ON COLUMN "public"."users_profile"."instagram_handle" IS 'Instagram username for social verification';



COMMENT ON COLUMN "public"."users_profile"."tiktok_handle" IS 'TikTok username for social verification';



COMMENT ON COLUMN "public"."users_profile"."website_url" IS 'Personal or business website URL';



COMMENT ON COLUMN "public"."users_profile"."portfolio_url" IS 'Portfolio website URL';



COMMENT ON COLUMN "public"."users_profile"."phone_number" IS 'Contact phone number';



COMMENT ON COLUMN "public"."users_profile"."years_experience" IS 'Number of years of professional experience';



COMMENT ON COLUMN "public"."users_profile"."specializations" IS 'Array of specialized skills or areas of expertise';



COMMENT ON COLUMN "public"."users_profile"."equipment_list" IS 'Array of equipment owned';



COMMENT ON COLUMN "public"."users_profile"."editing_software" IS 'Array of editing software proficiency';



COMMENT ON COLUMN "public"."users_profile"."languages" IS 'Array of languages spoken';



COMMENT ON COLUMN "public"."users_profile"."hourly_rate_min" IS 'Minimum hourly rate for services';



COMMENT ON COLUMN "public"."users_profile"."hourly_rate_max" IS 'Maximum hourly rate for services';



COMMENT ON COLUMN "public"."users_profile"."available_for_travel" IS 'Whether the user is available for travel assignments';



COMMENT ON COLUMN "public"."users_profile"."travel_radius_km" IS 'Maximum travel radius in kilometers';



COMMENT ON COLUMN "public"."users_profile"."studio_name" IS 'Name of the studio (if any)';



COMMENT ON COLUMN "public"."users_profile"."has_studio" IS 'Whether user has a studio (derived from studio_name/studio_address)';



COMMENT ON COLUMN "public"."users_profile"."studio_address" IS 'Address of the studio (if any)';



COMMENT ON COLUMN "public"."users_profile"."typical_turnaround_days" IS 'Typical turnaround time for deliverables';



COMMENT ON COLUMN "public"."users_profile"."height_cm" IS 'Physical attribute: Height in centimeters (Talent-Specific section)';



COMMENT ON COLUMN "public"."users_profile"."measurements" IS 'Body measurements (for talent)';



COMMENT ON COLUMN "public"."users_profile"."eye_color" IS 'Physical attribute: Eye color (Talent-Specific section)';



COMMENT ON COLUMN "public"."users_profile"."hair_color" IS 'Physical attribute: Hair color (Talent-Specific section)';



COMMENT ON COLUMN "public"."users_profile"."shoe_size" IS 'Shoe size (for talent)';



COMMENT ON COLUMN "public"."users_profile"."clothing_sizes" IS 'Clothing sizes (for talent)';



COMMENT ON COLUMN "public"."users_profile"."tattoos" IS 'Physical attribute: Has tattoos (Talent-Specific section)';



COMMENT ON COLUMN "public"."users_profile"."piercings" IS 'Physical attribute: Has piercings (Talent-Specific section)';



COMMENT ON COLUMN "public"."users_profile"."talent_categories" IS 'Array of talent categories (e.g., Fashion, Portrait, Commercial)';



COMMENT ON COLUMN "public"."users_profile"."first_name" IS 'User first name (separate from display_name)';



COMMENT ON COLUMN "public"."users_profile"."last_name" IS 'User last name (separate from display_name)';



COMMENT ON COLUMN "public"."users_profile"."email" IS 'User email address for contact sharing';



COMMENT ON COLUMN "public"."users_profile"."phone_public" IS 'Whether phone number can be shared with other users';



COMMENT ON COLUMN "public"."users_profile"."email_public" IS 'Whether email can be shared with other users';



COMMENT ON COLUMN "public"."users_profile"."show_location" IS 'Privacy setting to show/hide location';



COMMENT ON COLUMN "public"."users_profile"."travel_unit_preference" IS 'User preference for travel distance unit (km or mi)';



COMMENT ON COLUMN "public"."users_profile"."turnaround_unit_preference" IS 'User preference for turnaround time unit (days or hours)';



COMMENT ON COLUMN "public"."users_profile"."profile_completion_percentage" IS 'Percentage of profile completion (0-100)';



COMMENT ON COLUMN "public"."users_profile"."instagram_url" IS 'Full Instagram profile URL generated from handle';



COMMENT ON COLUMN "public"."users_profile"."tiktok_url" IS 'Full TikTok profile URL generated from handle';



COMMENT ON COLUMN "public"."users_profile"."twitter_url" IS 'Full Twitter/X profile URL generated from handle';



COMMENT ON COLUMN "public"."users_profile"."linkedin_url" IS 'Full LinkedIn profile URL generated from handle';



COMMENT ON COLUMN "public"."users_profile"."gender_identity" IS 'Demographics: Gender identity (Demographics section)';



COMMENT ON COLUMN "public"."users_profile"."ethnicity" IS 'Demographics: Ethnicity (Demographics section)';



COMMENT ON COLUMN "public"."users_profile"."nationality" IS 'Demographics: Nationality (Demographics section)';



COMMENT ON COLUMN "public"."users_profile"."weight_kg" IS 'Physical attribute: Weight in kilograms (Talent-Specific section)';



COMMENT ON COLUMN "public"."users_profile"."body_type" IS 'Physical attribute: Body type classification (Talent-Specific section)';



COMMENT ON COLUMN "public"."users_profile"."hair_length" IS 'Physical attribute: Hair length (Talent-Specific section)';



COMMENT ON COLUMN "public"."users_profile"."skin_tone" IS 'Physical attribute: Skin tone (Talent-Specific section)';



COMMENT ON COLUMN "public"."users_profile"."experience_level" IS 'Professional: Experience level (Demographics section)';



COMMENT ON COLUMN "public"."users_profile"."availability_status" IS 'User availability: Available, Busy, Unavailable, Limited, Weekends Only, Weekdays Only';



COMMENT ON COLUMN "public"."users_profile"."preferred_working_hours" IS 'Preferred working hours or schedule';



COMMENT ON COLUMN "public"."users_profile"."state_province" IS 'State or province of residence';



COMMENT ON COLUMN "public"."users_profile"."timezone" IS 'User timezone';



COMMENT ON COLUMN "public"."users_profile"."passport_valid" IS 'Whether user has a valid passport for travel';



COMMENT ON COLUMN "public"."users_profile"."show_age" IS 'Privacy setting to show/hide age';



COMMENT ON COLUMN "public"."users_profile"."show_physical_attributes" IS 'Privacy setting to show/hide physical attributes';



COMMENT ON COLUMN "public"."users_profile"."accepts_tfp" IS 'User accepts TFP (Trade for Portfolio) work';



COMMENT ON COLUMN "public"."users_profile"."accepts_expenses_only" IS 'User accepts work with expenses only (no fee)';



COMMENT ON COLUMN "public"."users_profile"."prefers_studio" IS 'User prefers working in studio environments';



COMMENT ON COLUMN "public"."users_profile"."prefers_outdoor" IS 'User prefers outdoor/location shoots';



COMMENT ON COLUMN "public"."users_profile"."works_with_teams" IS 'User is comfortable working with teams';



COMMENT ON COLUMN "public"."users_profile"."prefers_solo_work" IS 'User prefers working solo/one-on-one';



COMMENT ON COLUMN "public"."users_profile"."comfortable_with_nudity" IS 'User is comfortable with nude/artistic nudity content';



COMMENT ON COLUMN "public"."users_profile"."comfortable_with_intimate_content" IS 'User is comfortable with intimate/romantic content';



COMMENT ON COLUMN "public"."users_profile"."requires_model_release" IS 'User requires model release forms for all work';



COMMENT ON COLUMN "public"."users_profile"."show_phone" IS 'Privacy: Show phone number on profile';



COMMENT ON COLUMN "public"."users_profile"."show_social_links" IS 'Privacy: Show social media links (Instagram, TikTok, etc.)';



COMMENT ON COLUMN "public"."users_profile"."show_website" IS 'Privacy: Show website and portfolio links';



COMMENT ON COLUMN "public"."users_profile"."show_experience" IS 'Privacy: Show experience level and years of experience';



COMMENT ON COLUMN "public"."users_profile"."show_specializations" IS 'Privacy: Show specializations and skills';



COMMENT ON COLUMN "public"."users_profile"."show_equipment" IS 'Privacy: Show equipment list and software';



COMMENT ON COLUMN "public"."users_profile"."show_rates" IS 'Privacy: Show hourly rate and pricing information';



COMMENT ON COLUMN "public"."users_profile"."include_in_search" IS 'Privacy: Include profile in search results and discovery';



COMMENT ON COLUMN "public"."users_profile"."show_availability" IS 'Privacy: Show availability status to other users';



COMMENT ON COLUMN "public"."users_profile"."allow_direct_messages" IS 'Privacy: Allow other users to send direct messages';



COMMENT ON COLUMN "public"."users_profile"."share_analytics" IS 'Privacy: Share profile view analytics with platform';



COMMENT ON COLUMN "public"."users_profile"."participate_research" IS 'Privacy: Participate in platform research and surveys';



COMMENT ON COLUMN "public"."users_profile"."primary_skill" IS 'Primary skill or profession (e.g., Photographer, Model, Makeup Artist)';



COMMENT ON COLUMN "public"."users_profile"."working_time_preference" IS 'Preferred working time type: flexible, standard_business_hours, evenings_only, weekends_only, overnight_only';



COMMENT ON COLUMN "public"."users_profile"."preferred_start_time" IS 'Preferred start time for work (if applicable)';



COMMENT ON COLUMN "public"."users_profile"."preferred_end_time" IS 'Preferred end time for work (if applicable)';



COMMENT ON COLUMN "public"."users_profile"."working_timezone" IS 'Working timezone (e.g., EST, PST, GMT)';



COMMENT ON COLUMN "public"."users_profile"."contributor_roles" IS 'Array of contributor role names from predefined_roles table';



COMMENT ON COLUMN "public"."users_profile"."professional_skills" IS 'Array of professional skills, tools, and certifications';



COMMENT ON COLUMN "public"."users_profile"."behance_url" IS 'Behance portfolio/profile URL';



COMMENT ON COLUMN "public"."users_profile"."dribbble_url" IS 'Dribbble portfolio/profile URL';



COMMENT ON COLUMN "public"."users_profile"."allow_direct_booking" IS 'Privacy: Allow users to book this user directly for gigs/projects. When false, users cannot send direct booking requests.';



COMMENT ON COLUMN "public"."users_profile"."available_weekdays" IS 'User is available for work on weekdays';



COMMENT ON COLUMN "public"."users_profile"."available_weekends" IS 'User is available for work on weekends';



COMMENT ON COLUMN "public"."users_profile"."available_evenings" IS 'User is available for evening work';



COMMENT ON COLUMN "public"."users_profile"."available_overnight" IS 'User is available for overnight shoots';



COMMENT ON COLUMN "public"."users_profile"."allow_collaboration_invites" IS 'Privacy: Allow users to send collaboration/project invitations. When false, user will not appear in invitation search results and cannot receive new invitations.';



COMMENT ON COLUMN "public"."users_profile"."allow_gig_invites" IS 'Whether the user allows receiving gig invitations from contributors';



CREATE OR REPLACE FUNCTION "public"."calculate_profile_completion"("profile_record" "public"."users_profile") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  completed_weight INTEGER := 0;
  total_weight INTEGER := 0;
  has_contributor BOOLEAN;
  has_talent BOOLEAN;
BEGIN
  -- Determine user's role
  has_contributor := profile_record.role_flags && ARRAY['CONTRIBUTOR']::user_role[];
  has_talent := profile_record.role_flags && ARRAY['TALENT']::user_role[];
  
  -- ============================================================
  -- UNIVERSAL FIELDS (Apply to ALL roles)
  -- ============================================================
  
  -- Basic Profile Info
  -- avatar_url (weight: 15) - CRITICAL: Profile photo is essential for visual platforms
  IF profile_record.avatar_url IS NOT NULL AND profile_record.avatar_url != '' THEN
    completed_weight := completed_weight + 15;
  END IF;
  total_weight := total_weight + 15;
  
  -- primary_skill (weight: 15) - What you do is as important as who you are
  IF profile_record.primary_skill IS NOT NULL AND profile_record.primary_skill != '' THEN
    completed_weight := completed_weight + 15;
  END IF;
  total_weight := total_weight + 15;
  
  -- bio (weight: 10)
  IF profile_record.bio IS NOT NULL AND profile_record.bio != '' THEN
    completed_weight := completed_weight + 10;
  END IF;
  total_weight := total_weight + 10;
  
  -- city (weight: 8)
  IF profile_record.city IS NOT NULL AND profile_record.city != '' THEN
    completed_weight := completed_weight + 8;
  END IF;
  total_weight := total_weight + 8;
  
  -- country (weight: 5)
  IF profile_record.country IS NOT NULL AND profile_record.country != '' THEN
    completed_weight := completed_weight + 5;
  END IF;
  total_weight := total_weight + 5;
  
  -- specializations (weight: 12) - Additional specializations beyond primary
  IF profile_record.specializations IS NOT NULL AND array_length(profile_record.specializations, 1) > 0 THEN
    completed_weight := completed_weight + 12;
  END IF;
  total_weight := total_weight + 12;
  
  -- Professional Experience
  -- years_experience (weight: 10)
  IF profile_record.years_experience IS NOT NULL THEN
    completed_weight := completed_weight + 10;
  END IF;
  total_weight := total_weight + 10;
  
  -- experience_level (weight: 8)
  IF profile_record.experience_level IS NOT NULL AND profile_record.experience_level != '' THEN
    completed_weight := completed_weight + 8;
  END IF;
  total_weight := total_weight + 8;
  
  -- Rates & Availability
  -- hourly_rate_min (weight: 10)
  IF profile_record.hourly_rate_min IS NOT NULL THEN
    completed_weight := completed_weight + 10;
  END IF;
  total_weight := total_weight + 10;
  
  -- typical_turnaround_days (weight: 6)
  IF profile_record.typical_turnaround_days IS NOT NULL THEN
    completed_weight := completed_weight + 6;
  END IF;
  total_weight := total_weight + 6;
  
  -- availability_status (weight: 5)
  IF profile_record.availability_status IS NOT NULL AND profile_record.availability_status != '' THEN
    completed_weight := completed_weight + 5;
  END IF;
  total_weight := total_weight + 5;
  
  -- Contact Information
  -- phone_number (weight: 5)
  IF profile_record.phone_number IS NOT NULL AND profile_record.phone_number != '' THEN
    completed_weight := completed_weight + 5;
  END IF;
  total_weight := total_weight + 5;
  
  -- Portfolio & Social Links
  -- portfolio_url (weight: 8)
  IF profile_record.portfolio_url IS NOT NULL AND profile_record.portfolio_url != '' THEN
    completed_weight := completed_weight + 8;
  END IF;
  total_weight := total_weight + 8;
  
  -- website_url (weight: 5)
  IF profile_record.website_url IS NOT NULL AND profile_record.website_url != '' THEN
    completed_weight := completed_weight + 5;
  END IF;
  total_weight := total_weight + 5;
  
  -- instagram_handle (weight: 3)
  IF profile_record.instagram_handle IS NOT NULL AND profile_record.instagram_handle != '' THEN
    completed_weight := completed_weight + 3;
  END IF;
  total_weight := total_weight + 3;
  
  -- tiktok_handle (weight: 2)
  IF profile_record.tiktok_handle IS NOT NULL AND profile_record.tiktok_handle != '' THEN
    completed_weight := completed_weight + 2;
  END IF;
  total_weight := total_weight + 2;
  
  -- Additional Info
  -- available_for_travel (weight: 4)
  IF profile_record.available_for_travel IS NOT NULL THEN
    completed_weight := completed_weight + 4;
  END IF;
  total_weight := total_weight + 4;
  
  -- languages (weight: 4)
  IF profile_record.languages IS NOT NULL AND array_length(profile_record.languages, 1) > 0 THEN
    completed_weight := completed_weight + 4;
  END IF;
  total_weight := total_weight + 4;
  
  -- ============================================================
  -- CONTRIBUTOR-SPECIFIC FIELDS
  -- ============================================================
  IF has_contributor THEN
    -- equipment_list (weight: 8)
    IF profile_record.equipment_list IS NOT NULL AND array_length(profile_record.equipment_list, 1) > 0 THEN
      completed_weight := completed_weight + 8;
    END IF;
    total_weight := total_weight + 8;
    
    -- editing_software (weight: 6)
    IF profile_record.editing_software IS NOT NULL AND array_length(profile_record.editing_software, 1) > 0 THEN
      completed_weight := completed_weight + 6;
    END IF;
    total_weight := total_weight + 6;
    
    -- studio_name (weight: 4)
    IF profile_record.studio_name IS NOT NULL AND profile_record.studio_name != '' THEN
      completed_weight := completed_weight + 4;
    END IF;
    total_weight := total_weight + 4;
    
    -- has_studio (weight: 3)
    IF profile_record.has_studio IS NOT NULL THEN
      completed_weight := completed_weight + 3;
    END IF;
    total_weight := total_weight + 3;
  END IF;
  
  -- ============================================================
  -- TALENT-SPECIFIC FIELDS
  -- ============================================================
  IF has_talent THEN
    -- talent_categories (weight: 10)
    IF profile_record.talent_categories IS NOT NULL AND array_length(profile_record.talent_categories, 1) > 0 THEN
      completed_weight := completed_weight + 10;
    END IF;
    total_weight := total_weight + 10;
    
    -- Physical Attributes
    -- height_cm (weight: 6)
    IF profile_record.height_cm IS NOT NULL THEN
      completed_weight := completed_weight + 6;
    END IF;
    total_weight := total_weight + 6;
    
    -- weight_kg (weight: 4)
    IF profile_record.weight_kg IS NOT NULL THEN
      completed_weight := completed_weight + 4;
    END IF;
    total_weight := total_weight + 4;
    
    -- body_type (weight: 4)
    IF profile_record.body_type IS NOT NULL AND profile_record.body_type != '' THEN
      completed_weight := completed_weight + 4;
    END IF;
    total_weight := total_weight + 4;
    
    -- eye_color (weight: 3)
    IF profile_record.eye_color IS NOT NULL AND profile_record.eye_color != '' THEN
      completed_weight := completed_weight + 3;
    END IF;
    total_weight := total_weight + 3;
    
    -- hair_color (weight: 3)
    IF profile_record.hair_color IS NOT NULL AND profile_record.hair_color != '' THEN
      completed_weight := completed_weight + 3;
    END IF;
    total_weight := total_weight + 3;
    
    -- hair_length (weight: 2)
    IF profile_record.hair_length IS NOT NULL AND profile_record.hair_length != '' THEN
      completed_weight := completed_weight + 2;
    END IF;
    total_weight := total_weight + 2;
    
    -- skin_tone (weight: 2)
    IF profile_record.skin_tone IS NOT NULL AND profile_record.skin_tone != '' THEN
      completed_weight := completed_weight + 2;
    END IF;
    total_weight := total_weight + 2;
    
    -- Demographics (for talent profiles)
    -- gender_identity (weight: 4)
    IF profile_record.gender_identity IS NOT NULL AND profile_record.gender_identity != '' THEN
      completed_weight := completed_weight + 4;
    END IF;
    total_weight := total_weight + 4;
    
    -- ethnicity (weight: 3)
    IF profile_record.ethnicity IS NOT NULL AND profile_record.ethnicity != '' THEN
      completed_weight := completed_weight + 3;
    END IF;
    total_weight := total_weight + 3;
    
    -- nationality (weight: 3)
    IF profile_record.nationality IS NOT NULL AND profile_record.nationality != '' THEN
      completed_weight := completed_weight + 3;
    END IF;
    total_weight := total_weight + 3;
    
    -- tattoos/piercings info (weight: 2)
    IF profile_record.tattoos IS NOT NULL THEN
      completed_weight := completed_weight + 1;
    END IF;
    IF profile_record.piercings IS NOT NULL THEN
      completed_weight := completed_weight + 1;
    END IF;
    total_weight := total_weight + 2;
  END IF;
  
  -- Prevent division by zero
  IF total_weight = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((completed_weight::DECIMAL / total_weight) * 100);
END;
$$;


ALTER FUNCTION "public"."calculate_profile_completion"("profile_record" "public"."users_profile") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_skill_experience_score"("p_profile_id" "uuid", "p_required_skills" "text"[] DEFAULT NULL::"text"[]) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_total_score DECIMAL(5,2) := 0.0;
    v_skill_count INTEGER := 0;
    v_avg_experience DECIMAL(5,2) := 0.0;
    v_skill_record RECORD;
BEGIN
    -- If no required skills specified, use all user skills
    IF p_required_skills IS NULL OR array_length(p_required_skills, 1) IS NULL THEN
        -- Calculate average experience across all user skills
        SELECT 
            COALESCE(AVG(years_experience), 0) INTO v_avg_experience
        FROM user_skills 
        WHERE profile_id = p_profile_id;
        
        -- Score based on average experience (0-20 points max)
        v_total_score := LEAST(20.0, v_avg_experience * 2.0);
    ELSE
        -- Calculate score for specific required skills
        FOR v_skill_record IN
            SELECT skill_name, years_experience
            FROM user_skills 
            WHERE profile_id = p_profile_id 
            AND skill_name = ANY(p_required_skills)
        LOOP
            v_skill_count := v_skill_count + 1;
            -- Score based on years of experience (0-10 points per skill)
            v_total_score := v_total_score + LEAST(10.0, COALESCE(v_skill_record.years_experience, 0) * 1.0);
        END LOOP;
        
        -- If user has some but not all required skills, penalize slightly
        IF v_skill_count < array_length(p_required_skills, 1) THEN
            v_total_score := v_total_score * (v_skill_count::DECIMAL / array_length(p_required_skills, 1));
        END IF;
    END IF;
    
    RETURN v_total_score;
END;
$$;


ALTER FUNCTION "public"."calculate_skill_experience_score"("p_profile_id" "uuid", "p_required_skills" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_skill_experience_score"("p_profile_id" "uuid", "p_required_skills" "text"[]) IS 'Calculate experience score based on user skills and years of experience';



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


CREATE OR REPLACE FUNCTION "public"."call_email_api"("endpoint" "text", "payload" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  api_url TEXT;
BEGIN
  api_url := current_setting('app.base_url', true);
  IF api_url IS NULL THEN
    api_url := 'http://localhost:3000';
  END IF;

  PERFORM net.http_post(
    url := api_url || endpoint,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := payload
  );
  
  INSERT INTO email_logs (endpoint, payload, created_at)
  VALUES (endpoint, payload, NOW());
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Email API call failed: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."call_email_api"("endpoint" "text", "payload" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."call_email_api"("endpoint" "text", "payload" "jsonb") IS 'Makes async HTTP requests to email API endpoints';



CREATE OR REPLACE FUNCTION "public"."can_access_conversation"("conversation_uuid" "uuid", "requesting_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  has_access BOOLEAN := FALSE;
BEGIN
  -- Check if user is participant in any message in this conversation
  SELECT EXISTS (
    SELECT 1 FROM messages
    WHERE conversation_id = conversation_uuid
    AND (from_user_id = requesting_user_id OR to_user_id = requesting_user_id)
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;


ALTER FUNCTION "public"."can_access_conversation"("conversation_uuid" "uuid", "requesting_user_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."can_submit_generation_as_sample"("preset_uuid" "uuid", "generation_id_param" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_id_var UUID := auth.uid();
  generation_exists BOOLEAN := false;
  preset_used_in_generation BOOLEAN := false;
  already_submitted BOOLEAN := false;
  result JSONB;
BEGIN
  -- Check if user is authenticated
  IF user_id_var IS NULL THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'User must be authenticated'
    );
  END IF;

  -- Check if generation exists and belongs to user
  SELECT EXISTS (
    SELECT 1 FROM playground_projects 
    WHERE id::text = generation_id_param 
    AND user_id = user_id_var
  ) INTO generation_exists;

  IF NOT generation_exists THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'Generation not found or not owned by user'
    );
  END IF;

  -- Check if generation used the specified preset
  SELECT EXISTS (
    SELECT 1 FROM playground_projects 
    WHERE id::text = generation_id_param 
    AND user_id = user_id_var
    AND (
      metadata->>'preset_id' = preset_uuid::text
      OR metadata->>'custom_style_preset_id' = preset_uuid::text
      OR metadata->>'cinematic_preset_id' = preset_uuid::text
      OR metadata->>'applied_preset_id' = preset_uuid::text
    )
  ) INTO preset_used_in_generation;

  IF NOT preset_used_in_generation THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'Generation was not created using the specified preset'
    );
  END IF;

  -- Check if already submitted
  SELECT EXISTS (
    SELECT 1 FROM preset_images 
    WHERE generation_id = generation_id_param 
    AND user_id = user_id_var
    AND preset_id = preset_uuid
  ) INTO already_submitted;

  IF already_submitted THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'This generation has already been submitted as a sample for this preset'
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'can_submit', true,
    'reason', 'Generation is eligible to be submitted as a sample'
  );
END;
$$;


ALTER FUNCTION "public"."can_submit_generation_as_sample"("preset_uuid" "uuid", "generation_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_users_message"("sender_profile_id" "uuid", "recipient_profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if recipient has blocked sender
    IF is_user_blocked(recipient_profile_id, sender_profile_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Check if sender has blocked recipient (they might want to unblock first)
    IF is_user_blocked(sender_profile_id, recipient_profile_id) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."can_users_message"("sender_profile_id" "uuid", "recipient_profile_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_users_message"("sender_profile_id" "uuid", "recipient_profile_id" "uuid") IS 'Check if two users can send messages to each other (not blocked)';



CREATE OR REPLACE FUNCTION "public"."check_duplicate_request"("p_user_id" "uuid", "p_listing_id" "uuid", "p_table_name" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  IF p_table_name = 'rental_requests' THEN
    SELECT COUNT(*) INTO duplicate_count
    FROM rental_requests
    WHERE requester_id = p_user_id
    AND listing_id = p_listing_id
    AND status = 'pending';
  ELSIF p_table_name = 'offers' THEN
    -- FIXED: Check for ANY existing offers, not just pending
    SELECT COUNT(*) INTO duplicate_count
    FROM offers
    WHERE offerer_id = p_user_id
    AND listing_id = p_listing_id;
    -- Only allow if no offers exist at all
  ELSE
    RETURN FALSE;
  END IF;

  RETURN duplicate_count = 0;
END;
$$;


ALTER FUNCTION "public"."check_duplicate_request"("p_user_id" "uuid", "p_listing_id" "uuid", "p_table_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_duplicate_request"("p_user_id" "uuid", "p_listing_id" "uuid", "p_table_name" "text") IS 'UPDATED: Prevents users from making ANY offers for listings they already have offers on';



CREATE OR REPLACE FUNCTION "public"."check_message_rate_limit"("user_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  message_count INTEGER;
  time_window INTERVAL := '1 minute';
  max_messages INTEGER := 100; -- 100 messages per minute
BEGIN
  SELECT COUNT(*)
  INTO message_count
  FROM messages
  WHERE from_user_id = user_uuid
    AND created_at > NOW() - time_window;
  
  RETURN message_count < max_messages;
END;
$$;


ALTER FUNCTION "public"."check_message_rate_limit"("user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_message_rate_limit"("user_uuid" "uuid") IS 'Checks if user has exceeded the rate limit of 100 messages per minute';



CREATE OR REPLACE FUNCTION "public"."check_payments_table_exists"() RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'payments'
  );
END;
$$;


ALTER FUNCTION "public"."check_payments_table_exists"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_payments_table_exists"() IS 'Helper function to check if payments table exists before creating related triggers';



CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_table_name" "text", "p_limit_count" integer DEFAULT 5, "p_limit_hours" integer DEFAULT 24) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Count requests/offers in the last p_limit_hours
  IF p_table_name = 'rental_requests' THEN
    SELECT COUNT(*) INTO request_count
    FROM rental_requests
    WHERE requester_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour' * p_limit_hours;
  ELSIF p_table_name = 'offers' THEN
    -- FIXED: Use correct column names (offerer_id instead of from_user)
    SELECT COUNT(*) INTO request_count
    FROM offers
    WHERE offerer_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour' * p_limit_hours;
  ELSE
    RETURN FALSE;
  END IF;

  -- Return true if under limit, false if over limit
  RETURN request_count < p_limit_count;
END;
$$;


ALTER FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_table_name" "text", "p_limit_count" integer, "p_limit_hours" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_table_name" "text", "p_limit_count" integer, "p_limit_hours" integer) IS 'FIXED: Checks if user has exceeded rate limit for requests/offers using correct column names';



CREATE OR REPLACE FUNCTION "public"."check_refund_eligibility"("p_task_id" "uuid") RETURNS TABLE("eligible" boolean, "reason" character varying, "credits_to_refund" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_task RECORD;
  v_policy RECORD;
BEGIN
  -- Get task details
  SELECT * INTO v_task
  FROM enhancement_tasks
  WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Task not found'::VARCHAR, 0;
    RETURN;
  END IF;
  
  -- Check if already refunded
  IF v_task.refunded THEN
    RETURN QUERY SELECT FALSE, 'Already refunded'::VARCHAR, 0;
    RETURN;
  END IF;
  
  -- Check if failed
  IF v_task.status != 'failed' THEN
    RETURN QUERY SELECT FALSE, 'Task not failed'::VARCHAR, 0;
    RETURN;
  END IF;
  
  -- Get refund policy
  SELECT * INTO v_policy
  FROM refund_policies
  WHERE error_type = v_task.error_type;
  
  IF NOT FOUND THEN
    -- Default to refund if no policy
    RETURN QUERY SELECT TRUE, v_task.error_type::VARCHAR, 1;
    RETURN;
  END IF;
  
  IF v_policy.should_refund THEN
    RETURN QUERY SELECT TRUE, v_task.error_type::VARCHAR, ROUND(1 * v_policy.refund_percentage / 100)::INTEGER;
  ELSE
    RETURN QUERY SELECT FALSE, 'No refund for ' || v_task.error_type::VARCHAR, 0;
  END IF;
END;
$$;


ALTER FUNCTION "public"."check_refund_eligibility"("p_task_id" "uuid") OWNER TO "postgres";


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



CREATE OR REPLACE FUNCTION "public"."check_user_rate_limit"("checking_user_profile_id" "uuid", "resource" character varying, "action_count" integer DEFAULT 1) RETURNS TABLE("allowed" boolean, "remaining" integer, "reset_at" timestamp with time zone, "current_tier" "public"."subscription_tier")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_tier subscription_tier;
    limit_config RECORD;
    current_window_start TIMESTAMPTZ;
    current_usage INTEGER := 0;
    remaining_count INTEGER;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM users_profile
    WHERE id = checking_user_profile_id;
    
    -- Get rate limit configuration
    SELECT * INTO limit_config
    FROM rate_limits
    WHERE resource_type = resource 
    AND subscription_tier = user_tier;
    
    -- If no config found or unlimited (-1), allow
    IF limit_config IS NULL OR limit_config.max_actions = -1 THEN
        RETURN QUERY SELECT true, 999999, NOW() + INTERVAL '1 year', user_tier;
        RETURN;
    END IF;
    
    -- Calculate current time window start
    current_window_start := DATE_TRUNC('minute', NOW()) - 
                           ((EXTRACT(MINUTE FROM NOW())::INTEGER % limit_config.time_window_minutes) * INTERVAL '1 minute');
    
    -- Get current usage in this window
    SELECT COALESCE(SUM(action_count), 0) INTO current_usage
    FROM user_rate_limits
    WHERE user_profile_id = checking_user_profile_id
    AND resource_type = resource
    AND window_start >= current_window_start
    AND window_start < current_window_start + (limit_config.time_window_minutes * INTERVAL '1 minute');
    
    -- Calculate remaining actions
    remaining_count := limit_config.max_actions - current_usage - action_count;
    
    -- Return result
    RETURN QUERY SELECT 
        remaining_count >= 0,
        GREATEST(0, remaining_count + action_count),
        current_window_start + (limit_config.time_window_minutes * INTERVAL '1 minute'),
        user_tier;
END;
$$;


ALTER FUNCTION "public"."check_user_rate_limit"("checking_user_profile_id" "uuid", "resource" character varying, "action_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_user_rate_limit"("checking_user_profile_id" "uuid", "resource" character varying, "action_count" integer) IS 'Check if user can perform action within rate limits';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_domain_events"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM domain_events
  WHERE occurred_at < NOW() - INTERVAL '90 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_domain_events"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_profile_photos"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  old_photo_url TEXT;
BEGIN
  -- Get the old photo URL
  SELECT avatar_url INTO old_photo_url 
  FROM users_profile 
  WHERE user_id = NEW.user_id;
  
  -- If there was an old photo and it's different from the new one
  IF old_photo_url IS NOT NULL AND old_photo_url != NEW.avatar_url THEN
    -- Extract the path from the URL and delete from storage
    -- This is a placeholder - actual implementation would parse the URL
    -- and delete the file from storage
    NULL; -- Placeholder for cleanup logic
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_profile_photos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_rate_limits"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete records older than 7 days
    DELETE FROM user_rate_limits
    WHERE last_action < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_rate_limits"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_rate_limits"() IS 'Cleanup old rate limit records (run via cron job)';



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


CREATE OR REPLACE FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_credits RECORD;
    v_purchased_consumed INTEGER := 0;
    v_subscription_consumed INTEGER := 0;
BEGIN
    -- Get current credit state
    SELECT * INTO v_user_credits
    FROM user_credits
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User credits not found';
    END IF;
    
    -- Check if user has enough credits
    IF v_user_credits.current_balance < p_credits THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;
    
    -- Strategy: Consume purchased credits first (they're already paid for)
    -- Then consume subscription credits
    
    IF v_user_credits.purchased_credits_balance >= p_credits THEN
        -- All credits come from purchased
        v_purchased_consumed := p_credits;
    ELSE
        -- Some from purchased, rest from subscription
        v_purchased_consumed := v_user_credits.purchased_credits_balance;
        v_subscription_consumed := p_credits - v_purchased_consumed;
    END IF;
    
    -- Update the balances
    UPDATE user_credits
    SET 
        current_balance = current_balance - p_credits,
        purchased_credits_balance = purchased_credits_balance - v_purchased_consumed,
        consumed_this_month = consumed_this_month + v_subscription_consumed,
        lifetime_consumed = lifetime_consumed + p_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Return breakdown of what was consumed
    RETURN jsonb_build_object(
        'total_consumed', p_credits,
        'purchased_consumed', v_purchased_consumed,
        'subscription_consumed', v_subscription_consumed,
        'remaining_balance', v_user_credits.current_balance - p_credits,
        'remaining_purchased', v_user_credits.purchased_credits_balance - v_purchased_consumed
    );
END;
$$;


ALTER FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."create_default_user_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM create_default_user_settings_safe(NEW.id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_user_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_user_settings_safe"("user_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO user_settings (
        user_id,
        email_notifications,
        push_notifications,
        marketing_emails,
        profile_visibility,
        show_contact_info,
        two_factor_enabled
    )
    VALUES (
        user_uuid,
        true,
        true,
        false,
        'public',
        true,
        false
    )
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."create_default_user_settings_safe"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_handle_redirect"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only create redirect if handle actually changed
    IF OLD.handle IS DISTINCT FROM NEW.handle THEN
        INSERT INTO user_handle_redirects (old_handle, new_handle, user_profile_id)
        VALUES (OLD.handle, NEW.handle, NEW.id)
        ON CONFLICT (old_handle) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_handle_redirect"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_treatment_version"("p_treatment_id" "uuid", "p_change_summary" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_version_number INTEGER;
  v_treatment_content JSONB;
  v_version_id UUID;
BEGIN
  -- Get current content and next version number
  SELECT json_content, COALESCE(MAX(version_number), 0) + 1
  INTO v_treatment_content, v_version_number
  FROM treatments t
  LEFT JOIN treatment_versions tv ON t.id = tv.treatment_id
  WHERE t.id = p_treatment_id AND t.owner_id = auth.uid()
  GROUP BY t.json_content;
  
  IF v_treatment_content IS NULL THEN
    RAISE EXCEPTION 'Treatment not found or access denied';
  END IF;
  
  -- Create new version
  INSERT INTO treatment_versions (
    treatment_id, version_number, json_content, change_summary, created_by
  ) VALUES (
    p_treatment_id, v_version_number, v_treatment_content, p_change_summary, auth.uid()
  ) RETURNING id INTO v_version_id;
  
  RETURN v_version_id;
END;
$$;


ALTER FUNCTION "public"."create_treatment_version"("p_treatment_id" "uuid", "p_change_summary" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_profile_minimal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    base_handle TEXT;
    final_handle TEXT;
    profile_id UUID;
BEGIN
    -- Log the attempt
    RAISE LOG 'OAuth user creation attempt: % (email: %)', NEW.id, NEW.email;
    
    -- Generate a valid base handle from email or name
    base_handle := LOWER(
        COALESCE(
            REGEXP_REPLACE(NEW.raw_user_meta_data->>'full_name', '[^a-zA-Z0-9_]', '', 'g'),
            REGEXP_REPLACE(NEW.raw_user_meta_data->>'name', '[^a-zA-Z0-9_]', '', 'g'),
            REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'),
            'user'
        )
    );
    
    -- Ensure it starts with a letter (not number or underscore)
    IF base_handle ~ '^[0-9_]' THEN
        base_handle := 'user_' || base_handle;
    END IF;
    
    -- Ensure minimum length of 3 characters
    IF LENGTH(base_handle) < 3 THEN
        base_handle := base_handle || '_' || substr(md5(random()::text), 1, 3);
    END IF;
    
    -- Ensure maximum length of 50 characters
    IF LENGTH(base_handle) > 50 THEN
        base_handle := LEFT(base_handle, 47) || '_' || substr(md5(random()::text), 1, 2);
    END IF;
    
    final_handle := base_handle;
    
    -- Try to create profile with valid handle
    BEGIN
        INSERT INTO public.users_profile (
            user_id,
            display_name,
            handle
        ) VALUES (
            NEW.id,
            COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name', 
                split_part(NEW.email, '@', 1),
                'User'
            ),
            final_handle
        ) RETURNING id INTO profile_id;
        
        RAISE LOG 'Profile created successfully for user: % with handle: % and profile_id: %', NEW.id, final_handle, profile_id;
        
        -- Now create user_settings using profile_id instead of user_id
        BEGIN
            INSERT INTO user_settings (
                profile_id,
                email_notifications,
                push_notifications,
                marketing_emails,
                profile_visibility,
                show_contact_info,
                two_factor_enabled,
                created_at,
                updated_at
            ) VALUES (
                profile_id,
                true,
                true,
                false,
                'public',
                true,
                false,
                NOW(),
                NOW()
            );
            RAISE LOG 'User settings created successfully for profile_id: %', profile_id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE LOG 'Could not create user settings for profile_id %: %', profile_id, SQLERRM;
        END;
        
    EXCEPTION
        WHEN unique_violation THEN
            -- Handle already exists, try with timestamp suffix
            BEGIN
                final_handle := base_handle || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
                
                -- Ensure it's still within length limit
                IF LENGTH(final_handle) > 50 THEN
                    final_handle := LEFT(base_handle, 30) || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
                END IF;
                
                INSERT INTO public.users_profile (
                    user_id,
                    display_name,
                    handle
                ) VALUES (
                    NEW.id,
                    COALESCE(
                        NEW.raw_user_meta_data->>'full_name',
                        NEW.raw_user_meta_data->>'name', 
                        split_part(NEW.email, '@', 1),
                        'User'
                    ),
                    final_handle
                ) RETURNING id INTO profile_id;
                
                RAISE LOG 'Profile created with timestamp handle for user: % with handle: % and profile_id: %', NEW.id, final_handle, profile_id;
                
                -- Create user_settings
                BEGIN
                    INSERT INTO user_settings (
                        profile_id,
                        email_notifications,
                        push_notifications,
                        marketing_emails,
                        profile_visibility,
                        show_contact_info,
                        two_factor_enabled,
                        created_at,
                        updated_at
                    ) VALUES (
                        profile_id,
                        true,
                        true,
                        false,
                        'public',
                        true,
                        false,
                        NOW(),
                        NOW()
                    );
                    RAISE LOG 'User settings created with timestamp handle for profile_id: %', profile_id;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE LOG 'Could not create user settings with timestamp handle for profile_id %: %', profile_id, SQLERRM;
                END;
                
            EXCEPTION
                WHEN unique_violation THEN
                    -- Still conflicts, use UUID-based handle
                    BEGIN
                        final_handle := 'user_' || REPLACE(NEW.id::text, '-', '_');
                        
                        INSERT INTO public.users_profile (
                            user_id,
                            display_name,
                            handle
                        ) VALUES (
                            NEW.id,
                            COALESCE(
                                NEW.raw_user_meta_data->>'full_name',
                                NEW.raw_user_meta_data->>'name', 
                                split_part(NEW.email, '@', 1),
                                'User'
                            ),
                            final_handle
                        ) RETURNING id INTO profile_id;
                        
                        RAISE LOG 'Profile created with UUID handle for user: % with handle: % and profile_id: %', NEW.id, final_handle, profile_id;
                        
                        -- Create user_settings
                        BEGIN
                            INSERT INTO user_settings (
                                profile_id,
                                email_notifications,
                                push_notifications,
                                marketing_emails,
                                profile_visibility,
                                show_contact_info,
                                two_factor_enabled,
                                created_at,
                                updated_at
                            ) VALUES (
                                profile_id,
                                true,
                                true,
                                false,
                                'public',
                                true,
                                false,
                                NOW(),
                                NOW()
                            );
                            RAISE LOG 'User settings created with UUID handle for profile_id: %', profile_id;
                        EXCEPTION
                            WHEN OTHERS THEN
                                RAISE LOG 'Could not create user settings with UUID handle for profile_id %: %', profile_id, SQLERRM;
                        END;
                        
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE LOG 'Failed to create profile even with UUID handle for user %: %', NEW.id, SQLERRM;
                    END;
                    
                WHEN OTHERS THEN
                    RAISE LOG 'Failed to create profile with timestamp handle for user %: %', NEW.id, SQLERRM;
            END;
            
        WHEN check_violation THEN
            RAISE LOG 'Handle constraint violation for user %: handle "%" does not match format', NEW.id, final_handle;
            
        WHEN OTHERS THEN
            -- Log the specific error
            RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
            RAISE LOG 'Error detail: %', SQLSTATE;
            RAISE LOG 'Error context: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_user_profile_minimal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_settings_system"("user_uuid" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "email_notifications" boolean, "push_notifications" boolean, "marketing_emails" boolean, "profile_visibility" character varying, "show_contact_info" boolean, "two_factor_enabled" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Insert with system privileges
    RETURN QUERY
    INSERT INTO user_settings (
        user_id,
        email_notifications,
        push_notifications,
        marketing_emails,
        profile_visibility,
        show_contact_info,
        two_factor_enabled
    )
    VALUES (
        user_uuid,
        true,
        true,
        false,
        'public',
        true,
        false
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email_notifications = EXCLUDED.email_notifications,
        push_notifications = EXCLUDED.push_notifications,
        marketing_emails = EXCLUDED.marketing_emails,
        profile_visibility = EXCLUDED.profile_visibility,
        show_contact_info = EXCLUDED.show_contact_info,
        two_factor_enabled = EXCLUDED.two_factor_enabled,
        updated_at = NOW()
    RETURNING *;
END;
$$;


ALTER FUNCTION "public"."create_user_settings_system"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_skill"("p_profile_id" "uuid", "p_skill_name" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM user_skills 
    WHERE profile_id = p_profile_id 
    AND skill_name = p_skill_name;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count > 0;
END;
$$;


ALTER FUNCTION "public"."delete_user_skill"("p_profile_id" "uuid", "p_skill_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_user_skill"("p_profile_id" "uuid", "p_skill_name" "text") IS 'Delete a specific skill from user profile';



CREATE OR REPLACE FUNCTION "public"."diagnose_oauth_system"() RETURNS TABLE("component" "text", "status" "text", "details" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check auth.users table
  RETURN QUERY
  SELECT 
    'auth_users' as component,
    'healthy' as status,
    jsonb_build_object(
      'total_users', (SELECT COUNT(*) FROM auth.users),
      'google_users', (SELECT COUNT(*) FROM auth.users WHERE raw_app_meta_data->>'provider' = 'google'),
      'recent_users_24h', (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '24 hours')
    ) as details;

  -- Check trigger status
  RETURN QUERY
  SELECT 
    'auth_triggers' as component,
    CASE 
      WHEN COUNT(*) > 0 THEN 'healthy'
      ELSE 'unhealthy'
    END as status,
    jsonb_build_object(
      'triggers_found', COUNT(*),
      'triggers', jsonb_agg(jsonb_build_object('name', tgname, 'enabled', tgenabled))
    ) as details
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth' 
    AND c.relname = 'users'
    AND t.tgname LIKE '%auth_user%';

  -- Check users_profile table connectivity
  RETURN QUERY
  SELECT 
    'users_profile' as component,
    'healthy' as status,
    jsonb_build_object(
      'total_profiles', (SELECT COUNT(*) FROM users_profile),
      'orphaned_users', (
        SELECT COUNT(*) 
        FROM auth.users au 
        WHERE au.id NOT IN (SELECT user_id FROM users_profile WHERE user_id IS NOT NULL)
      ),
      'recent_profiles_24h', (SELECT COUNT(*) FROM users_profile WHERE created_at > NOW() - INTERVAL '24 hours')
    ) as details;

  -- Check recent OAuth activity
  RETURN QUERY
  SELECT 
    'oauth_activity' as component,
    CASE 
      WHEN (SELECT COUNT(*) FROM oauth_logs WHERE timestamp > NOW() - INTERVAL '1 hour') > 0 THEN 'active'
      WHEN (SELECT COUNT(*) FROM oauth_logs WHERE timestamp > NOW() - INTERVAL '24 hours') > 0 THEN 'quiet'
      ELSE 'silent'
    END as status,
    jsonb_build_object(
      'last_hour_events', (SELECT COUNT(*) FROM oauth_logs WHERE timestamp > NOW() - INTERVAL '1 hour'),
      'last_24h_events', (SELECT COUNT(*) FROM oauth_logs WHERE timestamp > NOW() - INTERVAL '24 hours'),
      'error_rate_24h', (
        CASE 
          WHEN (SELECT COUNT(*) FROM oauth_logs WHERE timestamp > NOW() - INTERVAL '24 hours' AND event_type = 'oauth_start') > 0
          THEN (
            SELECT COUNT(*) FROM oauth_logs 
            WHERE timestamp > NOW() - INTERVAL '24 hours' 
              AND event_type = 'oauth_error'
          )::NUMERIC / (
            SELECT COUNT(*) FROM oauth_logs 
            WHERE timestamp > NOW() - INTERVAL '24 hours' 
              AND event_type = 'oauth_start'
          )::NUMERIC * 100
          ELSE 0
        END
      )
    ) as details;
END;
$$;


ALTER FUNCTION "public"."diagnose_oauth_system"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."expire_old_gig_invitations"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE gig_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;


ALTER FUNCTION "public"."expire_old_gig_invitations"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."expire_old_gig_invitations"() IS 'Marks expired gig invitations as expired. Should be run periodically via cron job.';



CREATE OR REPLACE FUNCTION "public"."expire_old_invitations"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE collab_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."expire_old_invitations"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."find_compatible_gigs_for_user"("p_profile_id" "uuid", "p_limit" integer DEFAULT 20) RETURNS TABLE("gig_id" "uuid", "compatibility_score" numeric, "match_factors" "jsonb", "title" character varying, "location_text" character varying, "start_time" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        COALESCE(50.0, 50.0)::DECIMAL(5,2) as compatibility_score, -- Default neutral score
        '{"reason": "no_requirements_available"}'::JSONB as match_factors,
        g.title,
        g.location_text,
        g.start_time
    FROM gigs g
    WHERE g.status = 'PUBLISHED'
    ORDER BY g.created_at DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."find_compatible_gigs_for_user"("p_profile_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."find_compatible_gigs_for_user"("p_profile_id" "uuid", "p_limit" integer) IS 'Finds gigs compatible with a specific user - simplified version for basic functionality';



CREATE OR REPLACE FUNCTION "public"."find_demographic_compatible_users"("p_user_id" "uuid", "p_filters" "jsonb" DEFAULT '{}'::"jsonb", "p_limit" integer DEFAULT 20) RETURNS TABLE("profile_id" "uuid", "display_name" "text", "handle" "text", "avatar_url" "text", "bio" "text", "city" "text", "country" "text", "gender_identity" "text", "ethnicity" "text", "body_type" "text", "experience_level" "text", "compatibility_score" numeric, "match_reasons" "text"[])
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_profile RECORD;
BEGIN
    -- Get requesting user's profile
    SELECT * INTO v_user_profile
    FROM users_profile
    WHERE id = p_user_id;

    RETURN QUERY
    SELECT
        up.id,
        up.display_name,
        up.handle,
        up.avatar_url,
        up.bio,
        up.city,
        up.country,
        up.gender_identity,
        up.ethnicity,
        up.body_type,
        up.experience_level,
        -- Simple compatibility score based on shared attributes
        CAST(
            (CASE WHEN up.city = v_user_profile.city THEN 25 ELSE 0 END) +
            (CASE WHEN up.country = v_user_profile.country THEN 15 ELSE 0 END) +
            (CASE WHEN up.experience_level = v_user_profile.experience_level THEN 20 ELSE 0 END) +
            (CASE WHEN up.available_weekdays = v_user_profile.available_weekdays THEN 10 ELSE 0 END) +
            (CASE WHEN up.available_weekends = v_user_profile.available_weekends THEN 10 ELSE 0 END) +
            (CASE WHEN up.works_with_teams = v_user_profile.works_with_teams THEN 10 ELSE 0 END) +
            (CASE WHEN up.prefers_studio = v_user_profile.prefers_studio THEN 10 ELSE 0 END)
        AS DECIMAL(5,2)) as compatibility_score,
        -- Build match reasons
        ARRAY(
            SELECT reason FROM (
                SELECT 'Same city' as reason WHERE up.city = v_user_profile.city
                UNION ALL
                SELECT 'Same country' WHERE up.country = v_user_profile.country
                UNION ALL
                SELECT 'Similar experience level' WHERE up.experience_level = v_user_profile.experience_level
                UNION ALL
                SELECT 'Compatible schedule' WHERE up.available_weekdays = v_user_profile.available_weekdays
                UNION ALL
                SELECT 'Similar work style' WHERE up.works_with_teams = v_user_profile.works_with_teams
            ) reasons
        ) as match_reasons
    FROM users_profile up
    WHERE up.id != p_user_id
    AND up.include_in_search = true
    AND up.allow_direct_messages = true
    -- Apply optional filters from JSONB
    AND (p_filters->>'city' IS NULL OR up.city ILIKE '%' || (p_filters->>'city') || '%')
    AND (p_filters->>'country' IS NULL OR up.country = (p_filters->>'country'))
    AND (p_filters->>'gender_identity' IS NULL OR up.gender_identity = (p_filters->>'gender_identity'))
    AND (p_filters->>'ethnicity' IS NULL OR up.ethnicity = (p_filters->>'ethnicity'))
    AND (p_filters->>'body_type' IS NULL OR up.body_type = (p_filters->>'body_type'))
    AND (p_filters->>'experience_level' IS NULL OR up.experience_level = (p_filters->>'experience_level'))
    AND (p_filters->>'accepts_tfp' IS NULL OR up.accepts_tfp = (p_filters->>'accepts_tfp')::BOOLEAN)
    ORDER BY compatibility_score DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."find_demographic_compatible_users"("p_user_id" "uuid", "p_filters" "jsonb", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."find_demographic_compatible_users"("p_user_id" "uuid", "p_filters" "jsonb", "p_limit" integer) IS 'Find users with compatible demographics and work preferences for networking/collaboration';



CREATE OR REPLACE FUNCTION "public"."find_users_by_vibe_similarity"("target_user_id" "uuid", "limit_count" integer DEFAULT 10) RETURNS TABLE("user_id" "uuid", "display_name" "text", "handle" "text", "similarity_score" numeric, "shared_vibes" "text"[])
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    p.handle,
    -- Calculate cosine similarity based on vibe confidence scores
    COALESCE(
      (SELECT 
        SUM(uva1.confidence_score * uva2.confidence_score) / 
        (SQRT(SUM(uva1.confidence_score * uva1.confidence_score)) * 
         SQRT(SUM(uva2.confidence_score * uva2.confidence_score)))
       FROM public.user_vibe_analytics uva1
       JOIN public.user_vibe_analytics uva2 ON uva1.vibe_id = uva2.vibe_id
       WHERE uva1.user_id = target_user_id AND uva2.user_id = p.user_id
      ), 0.0
    )::DECIMAL as similarity_score,
    -- Get shared vibe names
    ARRAY(
      SELECT vm.name
      FROM public.user_vibe_analytics uva1
      JOIN public.user_vibe_analytics uva2 ON uva1.vibe_id = uva2.vibe_id
      JOIN public.vibes_master vm ON vm.id = uva1.vibe_id
      WHERE uva1.user_id = target_user_id AND uva2.user_id = p.user_id
      ORDER BY (uva1.confidence_score + uva2.confidence_score) DESC
      LIMIT 3
    ) as shared_vibes
  FROM public.users_profile p
  WHERE p.user_id != target_user_id
  AND EXISTS (
    SELECT 1 FROM public.user_vibe_analytics uva 
    WHERE uva.user_id = p.user_id
  )
  ORDER BY similarity_score DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."find_users_by_vibe_similarity"("target_user_id" "uuid", "limit_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."find_users_by_vibe_similarity"("target_user_id" "uuid", "limit_count" integer) IS 'Finds users with similar vibe preferences using cosine similarity';



CREATE OR REPLACE FUNCTION "public"."format_gig_location"("p_city" "text", "p_country" "text", "p_location_text" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- If we have both city and country, use structured format
  IF p_city IS NOT NULL AND p_country IS NOT NULL THEN
    RETURN p_city || ', ' || p_country;
  -- If we only have city, return it
  ELSIF p_city IS NOT NULL THEN
    RETURN p_city;
  -- Fall back to location_text
  ELSE
    RETURN p_location_text;
  END IF;
END;
$$;


ALTER FUNCTION "public"."format_gig_location"("p_city" "text", "p_country" "text", "p_location_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
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


CREATE OR REPLACE FUNCTION "public"."generate_invitation_token"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.invitation_token IS NULL THEN
    NEW.invitation_token := encode(gen_random_bytes(32), 'base64');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_invitation_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_profile_photo_path"("user_id" "uuid", "file_extension" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Path format: {user_id}/profile_{timestamp}.{extension}
  RETURN user_id::text || '/profile_' || 
         EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || '.' || 
         LOWER(file_extension);
END;
$$;


ALTER FUNCTION "public"."generate_profile_photo_path"("user_id" "uuid", "file_extension" "text") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_blocked_users"("requesting_user_profile_id" "uuid") RETURNS TABLE("block_id" "uuid", "blocked_user_id" "uuid", "blocked_display_name" character varying, "blocked_handle" character varying, "blocked_avatar_url" "text", "blocked_at" timestamp with time zone, "block_reason" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ub.id,
        up.id,
        up.display_name,
        up.handle,
        up.avatar_url,
        ub.created_at,
        ub.reason
    FROM user_blocks ub
    JOIN users_profile up ON up.id = ub.blocked_user_id
    WHERE ub.blocker_user_id = requesting_user_profile_id
    ORDER BY ub.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_blocked_users"("requesting_user_profile_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_blocked_users"("requesting_user_profile_id" "uuid") IS 'Get list of users blocked by the requesting user';



CREATE OR REPLACE FUNCTION "public"."get_collaboration_role_recommendations"("p_role_id" "uuid", "p_min_compatibility" numeric DEFAULT 30.0, "p_limit" integer DEFAULT 10) RETURNS TABLE("profile_id" "uuid", "display_name" "text", "handle" "text", "avatar_url" "text", "bio" "text", "city" "text", "country" "text", "overall_score" numeric, "skill_match_score" numeric, "matched_skills" "text"[], "missing_skills" "text"[])
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.id,
        up.display_name,
        up.handle,
        up.avatar_url,
        up.bio,
        up.city,
        up.country,
        cc.overall_score,
        cc.skill_match_score,
        cc.matched_skills,
        cc.missing_skills
    FROM users_profile up
    CROSS JOIN LATERAL calculate_collaboration_compatibility(up.id, p_role_id) cc
    WHERE cc.skill_match_score >= p_min_compatibility
    AND cc.profile_completeness_score = 100.0
    ORDER BY cc.overall_score DESC, cc.skill_match_score DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_collaboration_role_recommendations"("p_role_id" "uuid", "p_min_compatibility" numeric, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_collaboration_role_recommendations"("p_role_id" "uuid", "p_min_compatibility" numeric, "p_limit" integer) IS 'Finds recommended talent for a collaboration role based on skill match and profile completeness';



CREATE OR REPLACE FUNCTION "public"."get_conversation_participants"("conversation_uuid" "uuid") RETURNS TABLE("user_id" "uuid", "display_name" character varying, "handle" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    up.user_id,
    up.display_name,
    up.handle
  FROM messages m
  JOIN users_profile up ON (up.id = m.from_user_id OR up.id = m.to_user_id)
  WHERE m.conversation_id = conversation_uuid;
END;
$$;


ALTER FUNCTION "public"."get_conversation_participants"("conversation_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_gear_categories_by_category"("gear_category" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "name" "text", "category" "text", "description" "text", "sort_order" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pgc.id,
    pgc.name,
    pgc.category,
    pgc.description,
    pgc.sort_order
  FROM predefined_gear_categories pgc
  WHERE pgc.is_active = true
    AND (gear_category IS NULL OR pgc.category = gear_category)
  ORDER BY pgc.sort_order, pgc.name;
END;
$$;


ALTER FUNCTION "public"."get_gear_categories_by_category"("gear_category" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_oauth_metrics"("hours_back" integer DEFAULT 24) RETURNS TABLE("total_attempts" bigint, "successful_attempts" bigint, "failed_attempts" bigint, "success_rate" numeric, "avg_duration_ms" numeric, "google_attempts" bigint, "email_attempts" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH time_window AS (
    SELECT NOW() - INTERVAL '1 hour' * hours_back AS start_time
  ),
  stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE event_type = 'oauth_start') as total_attempts,
      COUNT(*) FILTER (WHERE event_type = 'oauth_success') as successful_attempts,
      COUNT(*) FILTER (WHERE event_type = 'oauth_error') as failed_attempts,
      AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as avg_duration_ms,
      COUNT(*) FILTER (WHERE event_type = 'oauth_start' AND provider = 'google') as google_attempts,
      COUNT(*) FILTER (WHERE event_type = 'oauth_start' AND provider = 'email') as email_attempts
    FROM oauth_logs, time_window
    WHERE timestamp >= time_window.start_time
  )
  SELECT 
    s.total_attempts,
    s.successful_attempts,
    s.failed_attempts,
    CASE 
      WHEN s.total_attempts > 0 THEN (s.successful_attempts::NUMERIC / s.total_attempts::NUMERIC * 100)
      ELSE 0 
    END as success_rate,
    s.avg_duration_ms,
    s.google_attempts,
    s.email_attempts
  FROM stats s;
END;
$$;


ALTER FUNCTION "public"."get_oauth_metrics"("hours_back" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_notifications" boolean DEFAULT true,
    "in_app_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "gig_notifications" boolean DEFAULT true,
    "message_notifications" boolean DEFAULT true,
    "collaboration_notifications" boolean DEFAULT true,
    "marketplace_notifications" boolean DEFAULT true,
    "system_notifications" boolean DEFAULT true,
    "notification_frequency" character varying(20) DEFAULT 'immediate'::character varying,
    "quiet_hours_enabled" boolean DEFAULT false,
    "quiet_hours_start" time without time zone DEFAULT '22:00:00'::time without time zone,
    "quiet_hours_end" time without time zone DEFAULT '08:00:00'::time without time zone,
    "quiet_hours_timezone" character varying(50) DEFAULT 'UTC'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "application_notifications" boolean DEFAULT true,
    "email_enabled" boolean DEFAULT true,
    "push_enabled" boolean DEFAULT true,
    "in_app_enabled" boolean DEFAULT true,
    "booking_notifications" boolean DEFAULT true,
    "marketing_notifications" boolean DEFAULT true,
    "digest_frequency" character varying(20) DEFAULT 'real-time'::character varying,
    "badge_count_enabled" boolean DEFAULT true,
    "sound_enabled" boolean DEFAULT true,
    "vibration_enabled" boolean DEFAULT true,
    "timezone" character varying(50) DEFAULT 'UTC'::character varying
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_preferences" IS 'User-specific notification preferences for multi-channel delivery control';



COMMENT ON COLUMN "public"."notification_preferences"."gig_notifications" IS 'Whether to receive gig-related notifications';



COMMENT ON COLUMN "public"."notification_preferences"."message_notifications" IS 'Whether to receive message notifications';



COMMENT ON COLUMN "public"."notification_preferences"."system_notifications" IS 'Whether to receive system notifications';



COMMENT ON COLUMN "public"."notification_preferences"."application_notifications" IS 'Whether to receive application-related notifications';



COMMENT ON COLUMN "public"."notification_preferences"."email_enabled" IS 'Whether email notifications are enabled';



COMMENT ON COLUMN "public"."notification_preferences"."push_enabled" IS 'Whether push notifications are enabled';



COMMENT ON COLUMN "public"."notification_preferences"."in_app_enabled" IS 'Whether in-app notifications are enabled';



COMMENT ON COLUMN "public"."notification_preferences"."booking_notifications" IS 'Whether to receive booking-related notifications';



COMMENT ON COLUMN "public"."notification_preferences"."marketing_notifications" IS 'Whether to receive marketing notifications';



COMMENT ON COLUMN "public"."notification_preferences"."digest_frequency" IS 'How often to send digest emails: real-time, hourly, daily, weekly';



COMMENT ON COLUMN "public"."notification_preferences"."badge_count_enabled" IS 'Whether to show badge counts';



COMMENT ON COLUMN "public"."notification_preferences"."sound_enabled" IS 'Whether to play notification sounds';



COMMENT ON COLUMN "public"."notification_preferences"."vibration_enabled" IS 'Whether to vibrate for notifications';



COMMENT ON COLUMN "public"."notification_preferences"."timezone" IS 'User timezone for notification timing';



CREATE OR REPLACE FUNCTION "public"."get_or_create_notification_preferences"("user_uuid" "uuid") RETURNS "public"."notification_preferences"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    prefs notification_preferences;
BEGIN
    -- Try to get existing preferences
    SELECT * INTO prefs FROM notification_preferences WHERE user_id = user_uuid;
    
    -- If no preferences exist, create default ones
    IF NOT FOUND THEN
        INSERT INTO notification_preferences (user_id)
        VALUES (user_uuid)
        RETURNING * INTO prefs;
    END IF;
    
    RETURN prefs;
END;
$$;


ALTER FUNCTION "public"."get_or_create_notification_preferences"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_preset_by_id"("preset_id" "uuid") RETURNS TABLE("id" "uuid", "preset_type" "text", "user_id" "uuid", "name" character varying, "display_name" character varying, "description" "text", "category" character varying, "prompt_template" "text", "negative_prompt" "text", "style_settings" "jsonb", "technical_settings" "jsonb", "ai_metadata" "jsonb", "seedream_config" "jsonb", "generation_mode" character varying, "is_public" boolean, "is_featured" boolean, "is_active" boolean, "sort_order" integer, "usage_count" integer, "last_used_at" timestamp with time zone, "is_for_sale" boolean, "sale_price" integer, "seller_user_id" "uuid", "marketplace_status" character varying, "total_sales" integer, "revenue_earned" integer, "likes_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM unified_presets WHERE unified_presets.id = preset_id;
END;
$$;


ALTER FUNCTION "public"."get_preset_by_id"("preset_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_preset_usage_stats"("preset_uuid" "uuid") RETURNS TABLE("total_uses" integer, "unique_users" integer, "recent_uses" integer, "last_used_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.usage_count, 0)::INTEGER as total_uses,
        COALESCE(COUNT(DISTINCT pu.user_id), 0)::INTEGER as unique_users,
        COALESCE(COUNT(CASE WHEN pu.used_at > NOW() - INTERVAL '7 days' THEN 1 END), 0)::INTEGER as recent_uses,
        p.last_used_at
    FROM presets p
    LEFT JOIN preset_usage pu ON p.id = pu.preset_id
    WHERE p.id = preset_uuid
    GROUP BY p.id, p.usage_count, p.last_used_at;
END;
$$;


ALTER FUNCTION "public"."get_preset_usage_stats"("preset_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_preset_usage_stats"("preset_uuid" "uuid") IS 'Returns usage statistics for a specific preset';



CREATE OR REPLACE FUNCTION "public"."get_recent_oauth_errors"("limit_count" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "logged_at" timestamp with time zone, "provider" "text", "step" "text", "error_message" "text", "error_code" "text", "ip_address" "inet", "user_id" "uuid", "session_id" "text", "metadata" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ol.id,
    ol.timestamp,
    ol.provider,
    ol.step,
    ol.error_message,
    ol.error_code,
    ol.ip_address,
    ol.user_id,
    ol.session_id,
    ol.metadata
  FROM oauth_logs ol
  WHERE ol.event_type = 'oauth_error'
  ORDER BY ol.timestamp DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_recent_oauth_errors"("limit_count" integer) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_roles_by_category"("role_category" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "name" "text", "category" "text", "description" "text", "sort_order" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.name,
    pr.category,
    pr.description,
    pr.sort_order
  FROM predefined_roles pr
  WHERE pr.is_active = true
    AND (role_category IS NULL OR pr.category = role_category)
  ORDER BY pr.sort_order, pr.name;
END;
$$;


ALTER FUNCTION "public"."get_roles_by_category"("role_category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_roles_by_category"("role_category" "text") IS 'Get all active roles, optionally filtered by category';



CREATE OR REPLACE FUNCTION "public"."get_shared_contacts"("p_conversation_id" "uuid", "p_conversation_type" "text", "p_user_id" "uuid") RETURNS TABLE("contact_type" "text", "contact_value" "text", "sharer_name" "text", "sharer_handle" "text", "shared_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.contact_type,
    cs.contact_value,
    up.display_name,
    up.handle,
    cs.shared_at
  FROM contact_sharing cs
  JOIN users_profile up ON cs.sharer_id = up.id
  WHERE cs.conversation_id = p_conversation_id
    AND cs.conversation_type = p_conversation_type
    AND cs.recipient_id = p_user_id
  ORDER BY cs.shared_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_shared_contacts"("p_conversation_id" "uuid", "p_conversation_type" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_skills_by_category"("skill_category" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "name" "text", "category" "text", "description" "text", "sort_order" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.name,
    ps.category,
    ps.description,
    ps.sort_order
  FROM predefined_skills ps
  WHERE ps.is_active = true
    AND (skill_category IS NULL OR ps.category = skill_category)
  ORDER BY ps.sort_order, ps.name;
END;
$$;


ALTER FUNCTION "public"."get_skills_by_category"("skill_category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_skills_by_category"("skill_category" "text") IS 'Get all active skills, optionally filtered by category';



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


CREATE OR REPLACE FUNCTION "public"."get_treatment_with_versions"("p_treatment_id" "uuid") RETURNS TABLE("treatment" "jsonb", "versions" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(t.*) as treatment,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', tv.id,
          'version_number', tv.version_number,
          'change_summary', tv.change_summary,
          'created_at', tv.created_at
        ) ORDER BY tv.version_number DESC
      ) FILTER (WHERE tv.id IS NOT NULL),
      '[]'::jsonb
    ) as versions
  FROM treatments t
  LEFT JOIN treatment_versions tv ON t.id = tv.treatment_id
  WHERE t.id = p_treatment_id 
    AND (t.owner_id = auth.uid() OR t.is_public = true)
  GROUP BY t.id;
END;
$$;


ALTER FUNCTION "public"."get_treatment_with_versions"("p_treatment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_trending_presets_by_usage"("days_back" integer DEFAULT 7, "limit_count" integer DEFAULT 10) RETURNS TABLE("preset_id" "uuid", "preset_name" character varying, "usage_count" integer, "recent_uses" integer, "unique_users" integer, "trending_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as preset_id,
        p.name as preset_name,
        p.usage_count,
        COALESCE(recent_usage.recent_uses, 0)::INTEGER as recent_uses,
        COALESCE(recent_usage.unique_users, 0)::INTEGER as unique_users,
        -- Calculate trending score: recent uses weighted by recency
        COALESCE(
            SUM(
                CASE 
                    WHEN pu.used_at > NOW() - INTERVAL '1 day' THEN 10
                    WHEN pu.used_at > NOW() - INTERVAL '3 days' THEN 7
                    WHEN pu.used_at > NOW() - INTERVAL '7 days' THEN 5
                    ELSE 1
                END
            ) / GREATEST(EXTRACT(EPOCH FROM (NOW() - MIN(pu.used_at))) / 3600, 1), -- Hours since first use
            0
        ) as trending_score
    FROM presets p
    LEFT JOIN preset_usage pu ON p.id = pu.preset_id 
        AND pu.used_at > NOW() - (days_back || ' days')::INTERVAL
    LEFT JOIN (
        SELECT 
            preset_id,
            COUNT(*) as recent_uses,
            COUNT(DISTINCT user_id) as unique_users
        FROM preset_usage 
        WHERE used_at > NOW() - (days_back || ' days')::INTERVAL
        GROUP BY preset_id
    ) recent_usage ON p.id = recent_usage.preset_id
    WHERE p.is_public = true
    GROUP BY p.id, p.name, p.usage_count, recent_usage.recent_uses, recent_usage.unique_users
    HAVING COALESCE(recent_usage.recent_uses, 0) > 0
    ORDER BY trending_score DESC, p.usage_count DESC
    LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_trending_presets_by_usage"("days_back" integer, "limit_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_trending_presets_by_usage"("days_back" integer, "limit_count" integer) IS 'Returns trending presets based on recent usage patterns';



CREATE OR REPLACE FUNCTION "public"."get_unread_notification_count"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications 
        WHERE recipient_id = user_uuid 
        AND read = false
    );
END;
$$;


ALTER FUNCTION "public"."get_unread_notification_count"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_average_rating"("user_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0.0)
    FROM marketplace_reviews 
    WHERE subject_user_id = user_id
  );
END;
$$;


ALTER FUNCTION "public"."get_user_average_rating"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_invitation_stats"("p_user_id" "uuid") RETURNS TABLE("pending_invitations" integer, "accepted_invitations" integer, "sent_invitations" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE invitee_id = p_user_id AND status = 'pending')::INTEGER,
    COUNT(*) FILTER (WHERE invitee_id = p_user_id AND status = 'accepted')::INTEGER,
    COUNT(*) FILTER (WHERE inviter_id = p_user_id)::INTEGER
  FROM collab_invitations;
END;
$$;


ALTER FUNCTION "public"."get_user_invitation_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_notifications"("limit_count" integer DEFAULT 20, "offset_count" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "type" "text", "title" "text", "message" "text", "data" "jsonb", "is_read" boolean, "created_at" timestamp with time zone, "read_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Return user's notifications
  RETURN QUERY
  SELECT 
    pn.id,
    pn.type,
    pn.title,
    pn.message,
    pn.data,
    pn.is_read,
    pn.created_at,
    pn.read_at
  FROM preset_notifications pn
  WHERE pn.creator_id = auth.uid()
  ORDER BY pn.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;


ALTER FUNCTION "public"."get_user_notifications"("limit_count" integer, "offset_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_oauth_journey"("target_user_id" "uuid") RETURNS TABLE("id" "uuid", "logged_at" timestamp with time zone, "event_type" "text", "provider" "text", "step" "text", "error_message" "text", "duration_ms" integer, "metadata" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ol.id,
    ol.timestamp,
    ol.event_type,
    ol.provider,
    ol.step,
    ol.error_message,
    ol.duration_ms,
    ol.metadata
  FROM oauth_logs ol
  WHERE ol.user_id = target_user_id
  ORDER BY ol.timestamp ASC;
END;
$$;


ALTER FUNCTION "public"."get_user_oauth_journey"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_preferred_provider"("p_user_id" "uuid") RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  preferred_provider VARCHAR(50);
BEGIN
  SELECT COALESCE(preferred_provider, 'nanobanana')
  INTO preferred_provider
  FROM user_provider_preferences
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(preferred_provider, 'nanobanana');
END;
$$;


ALTER FUNCTION "public"."get_user_preferred_provider"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_profile_image_url"("user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  image_url TEXT;
BEGIN
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM storage.objects 
        WHERE bucket_id = 'profile-images' 
        AND name LIKE user_id::text || '/%'
        ORDER BY created_at DESC 
        LIMIT 1
      ) THEN
        (SELECT 
          'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/profile-images/' || 
          (SELECT name FROM storage.objects 
           WHERE bucket_id = 'profile-images' 
           AND name LIKE user_id::text || '/%'
           ORDER BY created_at DESC 
           LIMIT 1)
        )
      ELSE NULL
    END INTO image_url;
  
  RETURN image_url;
END;
$$;


ALTER FUNCTION "public"."get_user_profile_image_url"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_rate_limit_status"("requesting_user_profile_id" "uuid") RETURNS TABLE("resource_type" character varying, "subscription_tier" "public"."subscription_tier", "max_actions" integer, "time_window_minutes" integer, "current_usage" integer, "remaining" integer, "reset_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_tier subscription_tier;
    limit_record RECORD;
    current_window_start TIMESTAMPTZ;
    usage_count INTEGER;
BEGIN
    -- Get user's subscription tier
    SELECT up.subscription_tier INTO user_tier
    FROM users_profile up
    WHERE up.id = requesting_user_profile_id;
    
    -- Loop through all rate limits for this user's tier
    FOR limit_record IN 
        SELECT * FROM rate_limits WHERE subscription_tier = user_tier
    LOOP
        -- Calculate current window start
        current_window_start := DATE_TRUNC('minute', NOW()) - 
                               ((EXTRACT(MINUTE FROM NOW())::INTEGER % limit_record.time_window_minutes) * INTERVAL '1 minute');
        
        -- Get current usage
        SELECT COALESCE(SUM(url.action_count), 0) INTO usage_count
        FROM user_rate_limits url
        WHERE url.user_profile_id = requesting_user_profile_id
        AND url.resource_type = limit_record.resource_type
        AND url.window_start >= current_window_start
        AND url.window_start < current_window_start + (limit_record.time_window_minutes * INTERVAL '1 minute');
        
        -- Return row
        RETURN QUERY SELECT 
            limit_record.resource_type,
            user_tier,
            limit_record.max_actions,
            limit_record.time_window_minutes,
            usage_count,
            CASE 
                WHEN limit_record.max_actions = -1 THEN 999999
                ELSE GREATEST(0, limit_record.max_actions - usage_count)
            END,
            current_window_start + (limit_record.time_window_minutes * INTERVAL '1 minute');
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."get_user_rate_limit_status"("requesting_user_profile_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_rate_limit_status"("requesting_user_profile_id" "uuid") IS 'Get current rate limit status for all resources for a user';



CREATE OR REPLACE FUNCTION "public"."get_user_rating_info"("user_id" "uuid") RETURNS TABLE("average_rating" numeric, "total_reviews" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating)::DECIMAL(3,2), 0.0) as average_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM marketplace_reviews 
  WHERE subject_user_id = user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_rating_info"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_settings"("user_uuid" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "profile_id" "uuid", "email_notifications" boolean, "push_notifications" boolean, "marketing_emails" boolean, "profile_visibility" character varying, "show_contact_info" boolean, "two_factor_enabled" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.user_id,
        us.profile_id,
        us.email_notifications,
        us.push_notifications,
        us.marketing_emails,
        us.profile_visibility,
        us.show_contact_info,
        us.two_factor_enabled,
        us.created_at,
        us.updated_at
    FROM user_settings us
    WHERE us.user_id = user_uuid
       OR us.profile_id IN (
           SELECT up.id FROM users_profile up WHERE up.user_id = user_uuid
       )
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_user_settings"("user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_settings"("user_uuid" "uuid") IS 'Safely retrieves user settings regardless of schema (user_id or profile_id)';



CREATE OR REPLACE FUNCTION "public"."get_user_settings_safe"("user_uuid" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "email_notifications" boolean, "push_notifications" boolean, "marketing_emails" boolean, "profile_visibility" character varying, "show_contact_info" boolean, "two_factor_enabled" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "profile_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.user_id,
        us.email_notifications,
        us.push_notifications,
        us.marketing_emails,
        us.profile_visibility,
        us.show_contact_info,
        us.two_factor_enabled,
        us.created_at,
        us.updated_at,
        us.profile_id
    FROM user_settings us
    WHERE us.user_id = user_uuid
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_user_settings_safe"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_skills"("p_profile_id" "uuid") RETURNS TABLE("id" "uuid", "skill_name" "text", "skill_type" "public"."skill_type", "proficiency_level" "public"."proficiency_level", "years_experience" integer, "verified" boolean, "description" "text", "is_featured" boolean, "experience_level_label" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.skill_name::TEXT,
        us.skill_type,
        us.proficiency_level,
        us.years_experience,
        us.verified,
        us.description,
        us.is_featured,
        CASE 
            WHEN us.years_experience IS NULL THEN 'Not specified'::TEXT
            WHEN us.years_experience = 0 THEN 'Beginner'::TEXT
            WHEN us.years_experience BETWEEN 1 AND 2 THEN 'Novice'::TEXT
            WHEN us.years_experience BETWEEN 3 AND 5 THEN 'Intermediate'::TEXT
            WHEN us.years_experience BETWEEN 6 AND 10 THEN 'Advanced'::TEXT
            WHEN us.years_experience > 10 THEN 'Expert'::TEXT
            ELSE 'Not specified'::TEXT
        END as experience_level_label
    FROM user_skills us
    WHERE us.profile_id = p_profile_id
    ORDER BY 
        us.is_featured DESC,
        COALESCE(us.years_experience, 0) DESC,
        us.proficiency_level DESC,
        us.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_skills"("p_profile_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_skills"("p_profile_id" "uuid") IS 'Get all skills for a user with calculated experience levels';



CREATE OR REPLACE FUNCTION "public"."get_user_top_skills"("p_profile_id" "uuid", "p_limit" integer DEFAULT 5) RETURNS TABLE("skill_name" "text", "years_experience" integer, "proficiency_level" "public"."proficiency_level", "experience_level_label" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.skill_name::TEXT,
        us.years_experience,
        us.proficiency_level,
        CASE 
            WHEN us.years_experience IS NULL THEN 'Not specified'::TEXT
            WHEN us.years_experience = 0 THEN 'Beginner'::TEXT
            WHEN us.years_experience BETWEEN 1 AND 2 THEN 'Novice'::TEXT
            WHEN us.years_experience BETWEEN 3 AND 5 THEN 'Intermediate'::TEXT
            WHEN us.years_experience BETWEEN 6 AND 10 THEN 'Advanced'::TEXT
            WHEN us.years_experience > 10 THEN 'Expert'::TEXT
            ELSE 'Not specified'::TEXT
        END as experience_level_label
    FROM user_skills us
    WHERE us.profile_id = p_profile_id
    ORDER BY 
        COALESCE(us.years_experience, 0) DESC,
        us.is_featured DESC,
        us.proficiency_level DESC,
        us.created_at DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_user_top_skills"("p_profile_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_top_skills"("p_profile_id" "uuid", "p_limit" integer) IS 'Get user top skills ordered by experience and proficiency';



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


CREATE OR REPLACE FUNCTION "public"."get_users_blocking_user"("blocked_user_profile_id" "uuid") RETURNS TABLE("block_id" "uuid", "blocker_user_id" "uuid", "blocker_display_name" character varying, "blocker_handle" character varying, "blocked_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Only allow admins or the blocked user themselves to see this
    IF NOT (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
        OR
        blocked_user_profile_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Unauthorized access to blocking information';
    END IF;

    RETURN QUERY
    SELECT 
        ub.id,
        up.id,
        up.display_name,
        up.handle,
        ub.created_at
    FROM user_blocks ub
    JOIN users_profile up ON up.id = ub.blocker_user_id
    WHERE ub.blocked_user_id = blocked_user_profile_id
    ORDER BY ub.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_users_blocking_user"("blocked_user_profile_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_users_blocking_user"("blocked_user_profile_id" "uuid") IS 'Get list of users who blocked the specified user (admin/self only)';



CREATE OR REPLACE FUNCTION "public"."gig_is_looking_for"("gig_types" "text"[], "search_type" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN search_type = ANY(gig_types);
END;
$$;


ALTER FUNCTION "public"."gig_is_looking_for"("gig_types" "text"[], "search_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_gig_invitation_acceptance"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- If invitation was accepted, auto-create application
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Check if user hasn't already applied
    IF NOT EXISTS (
      SELECT 1 FROM applications 
      WHERE gig_id = NEW.gig_id 
      AND applicant_user_id = NEW.invitee_id
    ) THEN
      -- Create application
      INSERT INTO applications (
        gig_id,
        applicant_user_id,
        note,
        status,
        applied_at
      ) VALUES (
        NEW.gig_id,
        NEW.invitee_id,
        COALESCE(NEW.message, 'Applied via invitation'),
        'PENDING',
        NOW()
      );
    END IF;
    
    -- Update accepted_at timestamp
    NEW.accepted_at = NOW();
    NEW.responded_at = NOW();
  END IF;
  
  -- If declined, update responded_at
  IF NEW.status = 'declined' AND OLD.status = 'pending' THEN
    NEW.responded_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_gig_invitation_acceptance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_complete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    monthly_credits INTEGER;
BEGIN
    -- Wait a moment to ensure the auth.users record is fully committed
    PERFORM pg_sleep(0.1);
    
    -- Determine monthly credits based on subscription tier
    monthly_credits := CASE 
        WHEN COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE') = 'PRO' THEN 200
        WHEN COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE') = 'PLUS' THEN 50
        ELSE 5  -- FREE tier gets 5 credits
    END;
    
    -- Insert into users table
    BEGIN
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (
            NEW.id,
            NEW.email,
            'TALENT',
            NOW(),
            NOW()
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- User already exists, that's fine
            NULL;
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth process
            RAISE LOG 'Error inserting user: %', SQLERRM;
    END;
    
    -- Insert into users_profile table
    BEGIN
        INSERT INTO users_profile (
            user_id,
            email,
            display_name,
            handle,
            bio,
            role_flags,
            subscription_tier,
            subscription_status,
            subscription_started_at,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
            'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
            'Welcome to Preset! Complete your profile to get started.',
            ARRAY['TALENT']::user_role[],
            'FREE',
            'ACTIVE',
            NOW(),
            NOW(),
            NOW()
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- Profile already exists, that's fine
            NULL;
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth process
            RAISE LOG 'Error inserting profile: %', SQLERRM;
    END;
    
    -- Initialize user credits with proper monthly allowance
    BEGIN
        INSERT INTO user_credits (
            user_id, 
            subscription_tier,
            monthly_allowance, 
            current_balance, 
            consumed_this_month,
            last_reset_at,
            created_at, 
            updated_at
        ) VALUES (
            NEW.id, 
            'FREE',
            monthly_credits, 
            monthly_credits,  -- Give them their full monthly allowance immediately
            0,
            NOW(),
            NOW(), 
            NOW()
        );
    EXCEPTION
        WHEN undefined_table THEN
            -- Credits table doesn't exist, skip
            NULL;
        WHEN unique_violation THEN
            -- Credits already exist, that's fine
            NULL;
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth process
            RAISE LOG 'Error inserting credits: %', SQLERRM;
    END;
    
    -- Create default notification preferences (if the table exists)
    BEGIN
        INSERT INTO notification_preferences (user_id, email_notifications, push_notifications, created_at, updated_at)
        VALUES (NEW.id, true, true, NOW(), NOW());
    EXCEPTION
        WHEN undefined_table THEN
            -- Notification preferences table doesn't exist, skip
            NULL;
        WHEN unique_violation THEN
            -- Preferences already exist, that's fine
            NULL;
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth process
            RAISE LOG 'Error inserting notification preferences: %', SQLERRM;
    END;
    
    -- Create default user settings (if the table exists)
    BEGIN
        INSERT INTO user_settings (user_id, created_at, updated_at)
        VALUES (NEW.id, NOW(), NOW());
    EXCEPTION
        WHEN undefined_table THEN
            -- User settings table doesn't exist, skip
            NULL;
        WHEN unique_violation THEN
            -- Settings already exist, that's fine
            NULL;
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth process
            RAISE LOG 'Error inserting user settings: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_complete"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user_complete"() IS 'Complete function to handle all user creation tasks including proper credit allocation';



CREATE OR REPLACE FUNCTION "public"."handle_new_user_simple"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Insert into users table
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        'TALENT',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Generate a simple handle
    DECLARE
        profile_handle TEXT;
    BEGIN
        profile_handle := 'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT;

        -- Insert into users_profile table with improved name handling
        INSERT INTO users_profile (
            user_id,
            email,
            first_name,
            last_name,
            display_name,
            handle,
            bio,
            role_flags,
            subscription_tier,
            subscription_status,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            -- Extract first_name from user metadata
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            -- Extract last_name from user metadata
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            -- Create display_name with fallback logic:
            -- 1. Use full_name if provided (Google OAuth)
            -- 2. Use name if provided (generic OAuth)
            -- 3. Combine first_name + last_name if provided (email signup)
            -- 4. Fallback to email username
            COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name',
                CASE
                    WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL OR NEW.raw_user_meta_data->>'last_name' IS NOT NULL
                    THEN TRIM(CONCAT(COALESCE(NEW.raw_user_meta_data->>'first_name', ''), ' ', COALESCE(NEW.raw_user_meta_data->>'last_name', '')))
                    ELSE SPLIT_PART(NEW.email, '@', 1)
                END
            ),
            profile_handle,
            'Welcome to Preset! Complete your profile to get started.',
            ARRAY['TALENT']::user_role[],
            'FREE',
            'ACTIVE',
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth process
        RAISE LOG 'Error in handle_new_user_simple: %', SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_simple"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user_simple"() IS 'Creates user and profile records with first_name, last_name, and display_name from user metadata when a new auth user is created';



CREATE OR REPLACE FUNCTION "public"."increment_preset_usage"("preset_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Increment the usage_count and update last_used_at
    UPDATE presets 
    SET usage_count = usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE id = preset_id;
END;
$$;


ALTER FUNCTION "public"."increment_preset_usage"("preset_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."increment_preset_usage"("preset_id" "uuid") IS 'Increments the usage count for a preset';



CREATE OR REPLACE FUNCTION "public"."increment_preset_usage"("preset_id" "uuid", "preset_type" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF preset_type = 'cinematic' THEN
        UPDATE cinematic_presets 
        SET usage_count = usage_count + 1, last_used_at = NOW()
        WHERE id = preset_id;
    ELSE
        UPDATE presets 
        SET usage_count = usage_count + 1, last_used_at = NOW()
        WHERE id = preset_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."increment_preset_usage"("preset_id" "uuid", "preset_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_spam_message"("content" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Check for excessive repetition (same character repeated 20+ times)
  IF content ~ '(.)\1{19,}' THEN
    RETURN TRUE;
  END IF;
  
  -- Check for excessive URLs
  IF (length(content) - length(replace(lower(content), 'http', ''))) / 4 > 3 THEN
    RETURN TRUE;
  END IF;
  
  -- Check for excessive caps (more than 70% uppercase)
  IF length(regexp_replace(content, '[^A-Z]', '', 'g'))::float / length(content) > 0.7 
     AND length(content) > 10 THEN
    RETURN TRUE;
  END IF;
  
  -- Check for excessive punctuation
  IF length(regexp_replace(content, '[^!?.]', '', 'g'))::float / length(content) > 0.3 
     AND length(content) > 10 THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."is_spam_message"("content" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_spam_message"("content" "text") IS 'Detects potential spam based on repetition, URLs, caps, and punctuation patterns';



CREATE OR REPLACE FUNCTION "public"."is_user_blocked"("blocker_profile_id" "uuid", "blocked_profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_blocks
        WHERE blocker_user_id = blocker_profile_id
        AND blocked_user_id = blocked_profile_id
    );
END;
$$;


ALTER FUNCTION "public"."is_user_blocked"("blocker_profile_id" "uuid", "blocked_profile_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_user_blocked"("blocker_profile_id" "uuid", "blocked_profile_id" "uuid") IS 'Check if one user has blocked another user';



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


CREATE OR REPLACE FUNCTION "public"."log_provider_performance"("p_provider" character varying, "p_success" boolean, "p_processing_time_ms" integer, "p_quality_score" numeric, "p_cost" numeric) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO provider_performance (
    provider,
    date,
    total_requests,
    successful_requests,
    failed_requests,
    average_processing_time_ms,
    average_quality_score,
    total_cost
  ) VALUES (
    p_provider,
    CURRENT_DATE,
    1,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    p_processing_time_ms,
    p_quality_score,
    p_cost
  )
  ON CONFLICT (provider, date) DO UPDATE SET
    total_requests = provider_performance.total_requests + 1,
    successful_requests = provider_performance.successful_requests + 
      CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_requests = provider_performance.failed_requests + 
      CASE WHEN p_success THEN 0 ELSE 1 END,
    average_processing_time_ms = (
      (provider_performance.average_processing_time_ms * provider_performance.total_requests + p_processing_time_ms) 
      / (provider_performance.total_requests + 1)
    ),
    average_quality_score = (
      (provider_performance.average_quality_score * provider_performance.total_requests + p_quality_score) 
      / (provider_performance.total_requests + 1)
    ),
    total_cost = provider_performance.total_cost + p_cost;
END;
$$;


ALTER FUNCTION "public"."log_provider_performance"("p_provider" character varying, "p_success" boolean, "p_processing_time_ms" integer, "p_quality_score" numeric, "p_cost" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_security_event"("event_type" "text", "user_id" "uuid", "details" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO system_logs (
    event_type,
    user_id,
    details,
    created_at
  ) VALUES (
    event_type,
    user_id,
    details,
    NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail if logging fails
    NULL;
END;
$$;


ALTER FUNCTION "public"."log_security_event"("event_type" "text", "user_id" "uuid", "details" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_as_read"("user_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE notifications 
    SET read = true, read_at = NOW(), updated_at = NOW()
    WHERE recipient_id = user_uuid 
    AND read = false;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_as_read"("user_uuid" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."mark_notification_as_read"("notification_id" "uuid", "user_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE notifications 
    SET read = true, read_at = NOW(), updated_at = NOW()
    WHERE id = notification_id 
    AND recipient_id = user_uuid;
END;
$$;


ALTER FUNCTION "public"."mark_notification_as_read"("notification_id" "uuid", "user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_specializations_to_user_skills"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    migration_count INTEGER := 0;
    profile_record RECORD;
    specialization_name TEXT;
BEGIN
    -- Loop through all users with specializations
    FOR profile_record IN 
        SELECT id, specializations 
        FROM users_profile 
        WHERE specializations IS NOT NULL 
        AND array_length(specializations, 1) > 0
    LOOP
        -- Loop through each specialization
        FOREACH specialization_name IN ARRAY profile_record.specializations
        LOOP
            -- Insert as user skill (assuming 'creative' type for specializations)
            INSERT INTO user_skills (profile_id, skill_type, skill_name, years_experience)
            VALUES (profile_record.id, 'creative', specialization_name, NULL)
            ON CONFLICT (profile_id, skill_name) DO NOTHING;
            
            migration_count := migration_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN format('Migrated %s specializations to user_skills', migration_count);
END;
$$;


ALTER FUNCTION "public"."migrate_specializations_to_user_skills"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_application_status_changed"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_gig RECORD;
  v_applicant RECORD;
  v_applicant_prefs RECORD;
  v_status_message TEXT;
  v_notification_title TEXT;
  v_notification_type TEXT;
BEGIN
  -- Only trigger on actual status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get gig details
  SELECT
    id,
    title,
    purpose,
    location_text,
    start_time
  INTO v_gig
  FROM gigs
  WHERE id = NEW.gig_id;

  -- Get applicant details and preferences
  SELECT
    up.user_id,
    up.display_name,
    up.handle,
    COALESCE(np.application_notifications, true) as application_notifications,
    COALESCE(np.in_app_enabled, true) as in_app_enabled
  INTO v_applicant
  FROM users_profile up
  LEFT JOIN notification_preferences np ON up.user_id = np.user_id
  WHERE up.id = NEW.applicant_user_id;

  -- Only send if preferences allow
  IF COALESCE(v_applicant.application_notifications, true)
     AND COALESCE(v_applicant.in_app_enabled, true) THEN

    -- Customize message based on status
    CASE NEW.status
      WHEN 'ACCEPTED' THEN
        v_notification_type := 'application_accepted';
        v_notification_title := '🎉 Application accepted!';
        v_status_message := 'Your application for "' || v_gig.title || '" was accepted! Check your messages for next steps.';

      WHEN 'REJECTED' THEN
        v_notification_type := 'application_rejected';
        v_notification_title := 'Application update';
        v_status_message := 'Your application for "' || v_gig.title || '" was not selected this time. Keep applying!';

      WHEN 'SHORTLISTED' THEN
        v_notification_type := 'application_shortlisted';
        v_notification_title := '⭐ You''re shortlisted!';
        v_status_message := 'You''re on the shortlist for "' || v_gig.title || '"! The client will contact you soon.';

      WHEN 'WITHDRAWN' THEN
        -- Don't notify on user-initiated withdrawal
        RETURN NEW;

      ELSE
        -- Don't notify for other status changes
        RETURN NEW;
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
      v_notification_type,
      'gig',
      v_notification_title,
      v_status_message,
      '/gigs/' || v_gig.id,
      jsonb_build_object(
        'gig_id', v_gig.id,
        'gig_title', v_gig.title,
        'application_id', NEW.id,
        'new_status', NEW.status,
        'old_status', OLD.status,
        'updated_at', NEW.updated_at,
        'location', v_gig.location_text,
        'start_time', v_gig.start_time
      )
    );

    -- Log for debugging
    RAISE NOTICE 'Status change notification sent: application_id=%, status=% -> %',
      NEW.id, OLD.status, NEW.status;
  ELSE
    RAISE NOTICE 'Status change notification skipped (preferences disabled): user=%',
      v_applicant.user_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the status update
    RAISE WARNING 'Error sending status change notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_application_status_changed"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_application_status_changed"() IS 'Sends notification to applicant when their application status changes (ACCEPTED, REJECTED, SHORTLISTED). Respects notification_preferences.application_notifications.';



CREATE OR REPLACE FUNCTION "public"."notify_collab_invitation_response"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invitee_profile RECORD;
  v_inviter_user_id UUID;
  v_project_title TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Only notify on status change to accepted or declined
  IF NEW.status NOT IN ('accepted', 'declined') OR OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Skip if no invitee (email invitation)
  IF NEW.invitee_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get invitee profile info
  SELECT 
    up.display_name,
    up.avatar_url
  INTO v_invitee_profile
  FROM users_profile up
  WHERE up.id = NEW.invitee_id;

  -- Get inviter user_id
  SELECT user_id INTO v_inviter_user_id
  FROM users_profile
  WHERE id = NEW.inviter_id;

  -- Get project title
  SELECT title INTO v_project_title
  FROM collab_projects
  WHERE id = NEW.project_id;

  -- Set notification content based on response
  IF NEW.status = 'accepted' THEN
    v_notification_title := 'Project invitation accepted!';
    v_notification_message := v_invitee_profile.display_name || ' accepted your invitation to "' || v_project_title || '"';
  ELSE
    v_notification_title := 'Project invitation declined';
    v_notification_message := v_invitee_profile.display_name || ' declined your invitation to "' || v_project_title || '"';
  END IF;

  -- Create notification for inviter
  INSERT INTO notifications (
    user_id,
    recipient_id,
    type,
    category,
    title,
    message,
    avatar_url,
    action_url,
    data
  ) VALUES (
    (SELECT user_id FROM users_profile WHERE id = NEW.invitee_id),
    v_inviter_user_id,
    'collab_invitation_response',
    'collaboration',
    v_notification_title,
    v_notification_message,
    v_invitee_profile.avatar_url,
    '/collaborate/projects/' || NEW.project_id,
    jsonb_build_object(
      'invitation_id', NEW.id,
      'project_id', NEW.project_id,
      'invitee_id', NEW.invitee_id,
      'invitee_name', v_invitee_profile.display_name,
      'project_title', v_project_title,
      'response', NEW.status
    )
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_collab_invitation_response"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_collab_invitation_response"() IS 'Sends notification when a collaboration invitation is accepted or declined';



CREATE OR REPLACE FUNCTION "public"."notify_collab_invitation_sent"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_inviter_profile RECORD;
  v_invitee_user_id UUID;
  v_project_title TEXT;
  v_role_name TEXT;
BEGIN
  -- Get inviter profile info
  SELECT 
    up.display_name,
    up.avatar_url,
    up.user_id
  INTO v_inviter_profile
  FROM users_profile up
  WHERE up.id = NEW.inviter_id;

  -- Get invitee user_id (if invitee exists in system)
  IF NEW.invitee_id IS NOT NULL THEN
    SELECT user_id INTO v_invitee_user_id
    FROM users_profile
    WHERE id = NEW.invitee_id;
  ELSE
    -- Email invitation, skip notification for now
    -- TODO: Implement email notifications
    RETURN NEW;
  END IF;

  -- Get project title
  SELECT title INTO v_project_title
  FROM collab_projects
  WHERE id = NEW.project_id;

  -- Get role name if specified
  IF NEW.role_id IS NOT NULL THEN
    SELECT role_name INTO v_role_name
    FROM collab_roles
    WHERE id = NEW.role_id;
  END IF;

  -- Create notification for invitee
  INSERT INTO notifications (
    user_id,
    recipient_id,
    type,
    category,
    title,
    message,
    avatar_url,
    action_url,
    data
  ) VALUES (
    v_inviter_profile.user_id,
    v_invitee_user_id,
    'collab_invitation',
    'collaboration',
    'You''ve been invited to a project!',
    v_inviter_profile.display_name || ' invited you to join "' || v_project_title || '"' || 
      CASE WHEN v_role_name IS NOT NULL THEN ' as ' || v_role_name ELSE '' END,
    v_inviter_profile.avatar_url,
    '/dashboard/invitations?type=collabs',
    jsonb_build_object(
      'invitation_id', NEW.id,
      'project_id', NEW.project_id,
      'inviter_id', NEW.inviter_id,
      'inviter_name', v_inviter_profile.display_name,
      'project_title', v_project_title,
      'role_name', v_role_name
    )
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_collab_invitation_sent"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_collab_invitation_sent"() IS 'Sends notification when a collaboration invitation is created';



CREATE OR REPLACE FUNCTION "public"."notify_credits_added"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_user_prefs RECORD;
  v_credits_added INTEGER;
BEGIN
  -- Only notify on significant credit increases (5+ credits)
  v_credits_added := NEW.current_balance - OLD.current_balance;

  IF v_credits_added >= 5 THEN

    -- Check user preferences
    SELECT
      COALESCE(system_notifications, true) as system_notifications,
      COALESCE(in_app_enabled, true) as in_app_enabled
    INTO v_user_prefs
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    -- Send notification if preferences allow
    IF COALESCE(v_user_prefs.system_notifications, true)
       AND COALESCE(v_user_prefs.in_app_enabled, true) THEN

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
        'credits_added',
        'system',
        '✅ Credits added',
        v_credits_added || ' credits added to your account. New balance: ' || NEW.current_balance,
        '/credits/history',
        jsonb_build_object(
          'credits_added', v_credits_added,
          'new_balance', NEW.current_balance,
          'previous_balance', OLD.current_balance,
          'added_at', NOW()
        )
      );

      RAISE NOTICE 'Credits added notification sent: user=%, amount=%',
        NEW.user_id, v_credits_added;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending credits added notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_credits_added"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_credits_added"() IS 'Sends notification when credits are added to user account (5+ credits). Fallback for when payments table does not exist.';



CREATE OR REPLACE FUNCTION "public"."notify_gig_application_received"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_gig RECORD;
  v_applicant RECORD;
  v_owner_prefs RECORD;
BEGIN
  -- Get gig details and owner info
  SELECT
    g.id,
    g.title,
    g.location_text,
    g.start_time,
    g.purpose,
    up.user_id as owner_user_id,
    up.display_name as owner_name
  INTO v_gig
  FROM gigs g
  JOIN users_profile up ON g.owner_user_id = up.user_id
  WHERE g.id = NEW.gig_id;

  -- Get applicant details
  SELECT
    up.user_id,
    up.display_name,
    up.avatar_url,
    up.handle
  INTO v_applicant
  FROM users_profile up
  WHERE up.id = NEW.applicant_user_id;

  -- Check owner's notification preferences
  SELECT
    COALESCE(application_notifications, true) as application_notifications,
    COALESCE(in_app_enabled, true) as in_app_enabled
  INTO v_owner_prefs
  FROM notification_preferences
  WHERE user_id = v_gig.owner_user_id;

  -- Only send if preferences allow (default to true if no preferences set)
  IF COALESCE(v_owner_prefs.application_notifications, true)
     AND COALESCE(v_owner_prefs.in_app_enabled, true) THEN

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
      v_applicant.display_name || ' applied for your ' || COALESCE(v_gig.purpose, 'gig') || ' gig',
      v_applicant.avatar_url,
      '/gigs/' || v_gig.id || '/applications',
      jsonb_build_object(
        'gig_id', v_gig.id,
        'gig_title', v_gig.title,
        'applicant_id', NEW.applicant_user_id,
        'applicant_name', v_applicant.display_name,
        'applicant_handle', v_applicant.handle,
        'application_id', NEW.id,
        'applied_at', NEW.applied_at,
        'location', v_gig.location_text
      )
    );

    -- Log for debugging
    RAISE NOTICE 'Application notification sent: gig_id=%, applicant=%',
      v_gig.id, v_applicant.display_name;
  ELSE
    RAISE NOTICE 'Application notification skipped (preferences disabled): user=%',
      v_gig.owner_user_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the application from being created
    RAISE WARNING 'Error sending application notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_gig_application_received"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_gig_application_received"() IS 'Sends notification to gig owner when a new application is received. Respects notification_preferences.application_notifications.';



CREATE OR REPLACE FUNCTION "public"."notify_gig_invitation_response"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invitee_profile RECORD;
  v_inviter_user_id UUID;
  v_gig_title TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Only notify on status change to accepted or declined
  IF NEW.status NOT IN ('accepted', 'declined') OR OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get invitee profile info
  SELECT 
    up.display_name,
    up.avatar_url
  INTO v_invitee_profile
  FROM users_profile up
  WHERE up.id = NEW.invitee_id;

  -- Get inviter user_id
  SELECT user_id INTO v_inviter_user_id
  FROM users_profile
  WHERE id = NEW.inviter_id;

  -- Get gig title
  SELECT title INTO v_gig_title
  FROM gigs
  WHERE id = NEW.gig_id;

  -- Set notification content based on response
  IF NEW.status = 'accepted' THEN
    v_notification_title := 'Gig invitation accepted!';
    v_notification_message := v_invitee_profile.display_name || ' accepted your invitation to "' || v_gig_title || '"';
  ELSE
    v_notification_title := 'Gig invitation declined';
    v_notification_message := v_invitee_profile.display_name || ' declined your invitation to "' || v_gig_title || '"';
  END IF;

  -- Create notification for inviter
  INSERT INTO notifications (
    user_id,
    recipient_id,
    type,
    category,
    title,
    message,
    avatar_url,
    action_url,
    data
  ) VALUES (
    (SELECT user_id FROM users_profile WHERE id = NEW.invitee_id),
    v_inviter_user_id,
    'gig_invitation_response',
    'gig',
    v_notification_title,
    v_notification_message,
    v_invitee_profile.avatar_url,
    '/gigs/' || NEW.gig_id,
    jsonb_build_object(
      'invitation_id', NEW.id,
      'gig_id', NEW.gig_id,
      'invitee_id', NEW.invitee_id,
      'invitee_name', v_invitee_profile.display_name,
      'gig_title', v_gig_title,
      'response', NEW.status
    )
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_gig_invitation_response"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_gig_invitation_response"() IS 'Sends notification when a gig invitation is accepted or declined';



CREATE OR REPLACE FUNCTION "public"."notify_gig_invitation_sent"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_inviter_profile RECORD;
  v_invitee_user_id UUID;
  v_gig_title TEXT;
BEGIN
  -- Get inviter profile info
  SELECT 
    up.display_name,
    up.avatar_url,
    up.user_id
  INTO v_inviter_profile
  FROM users_profile up
  WHERE up.id = NEW.inviter_id;

  -- Get invitee user_id
  SELECT user_id INTO v_invitee_user_id
  FROM users_profile
  WHERE id = NEW.invitee_id;

  -- Get gig title
  SELECT title INTO v_gig_title
  FROM gigs
  WHERE id = NEW.gig_id;

  -- Create notification for invitee
  INSERT INTO notifications (
    user_id,
    recipient_id,
    type,
    category,
    title,
    message,
    avatar_url,
    action_url,
    data
  ) VALUES (
    v_inviter_profile.user_id,
    v_invitee_user_id,
    'gig_invitation',
    'gig',
    'You''ve been invited to a gig!',
    v_inviter_profile.display_name || ' invited you to apply for "' || v_gig_title || '"',
    v_inviter_profile.avatar_url,
    '/dashboard/invitations?type=gigs',
    jsonb_build_object(
      'invitation_id', NEW.id,
      'gig_id', NEW.gig_id,
      'inviter_id', NEW.inviter_id,
      'inviter_name', v_inviter_profile.display_name,
      'gig_title', v_gig_title
    )
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_gig_invitation_sent"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_gig_invitation_sent"() IS 'Sends notification when a gig invitation is created';



CREATE OR REPLACE FUNCTION "public"."notify_listing_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_seller RECORD;
  v_preset RECORD;
  v_notification_title TEXT;
  v_notification_message TEXT;
  v_notification_type TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Only notify on approved/rejected status
  IF NEW.status NOT IN ('approved', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Get seller details
  SELECT
    user_id,
    display_name
  INTO v_seller
  FROM users_profile
  WHERE user_id = NEW.seller_user_id;

  -- Get preset details
  SELECT
    id,
    name,
    title
  INTO v_preset
  FROM presets
  WHERE id = NEW.preset_id;

  -- Check notification preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_seller.user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Listing status notification skipped (preferences disabled): user=%', v_seller.user_id;
    RETURN NEW;
  END IF;

  -- Customize message based on status
  IF NEW.status = 'approved' THEN
    v_notification_type := 'listing_approved';
    v_notification_title := '✅ Listing approved';
    v_notification_message := 'Your preset "' || COALESCE(v_preset.title, v_preset.name) || '" is now live in the marketplace!';
  ELSE
    v_notification_type := 'listing_rejected';
    v_notification_title := 'Listing needs attention';
    v_notification_message := 'Your preset "' || COALESCE(v_preset.title, v_preset.name) || '" needs some updates before it can be listed.';
  END IF;

  -- Create notification
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
    v_seller.user_id,
    v_seller.user_id,
    v_notification_type,
    'marketplace',
    v_notification_title,
    v_notification_message,
    '/marketplace/listings/' || NEW.id,
    jsonb_build_object(
      'listing_id', NEW.id,
      'preset_id', v_preset.id,
      'preset_name', COALESCE(v_preset.title, v_preset.name),
      'status', NEW.status,
      'rejection_reason', NEW.rejection_reason,
      'approved_at', NEW.approved_at,
      'approved_by', NEW.approved_by
    )
  );

  RAISE NOTICE 'Listing status notification sent: listing % status %',
    NEW.id, NEW.status;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending listing status notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_listing_status"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_listing_status"() IS 'Sends notification to seller when marketplace listing is approved or rejected';



CREATE OR REPLACE FUNCTION "public"."notify_low_credit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_user_prefs RECORD;
  v_threshold INTEGER := 10; -- Warn when credits fall below 10
  v_critical_threshold INTEGER := 3; -- Critical warning below 3
  v_warning_level TEXT;
  v_warning_title TEXT;
  v_warning_message TEXT;
BEGIN
  -- Only notify when crossing thresholds (not on every credit change)
  -- This prevents notification spam

  -- Check if crossing critical threshold (3 credits)
  IF NEW.current_balance < v_critical_threshold AND OLD.current_balance >= v_critical_threshold THEN
    v_warning_level := 'critical';
    v_warning_title := '🚨 Critical: Almost out of credits';
    v_warning_message := 'You have only ' || NEW.current_balance || ' credits left. Top up now to avoid service interruption.';

  -- Check if crossing low threshold (10 credits)
  ELSIF NEW.current_balance < v_threshold AND OLD.current_balance >= v_threshold THEN
    v_warning_level := 'low';
    v_warning_title := '⚠️ Low credit balance';
    v_warning_message := 'You have ' || NEW.current_balance || ' credits remaining. Consider topping up to continue posting gigs.';

  ELSE
    -- Not crossing a threshold, don't send notification
    RETURN NEW;
  END IF;

  -- Check user preferences
  SELECT
    COALESCE(system_notifications, true) as system_notifications,
    COALESCE(in_app_enabled, true) as in_app_enabled
  INTO v_user_prefs
  FROM notification_preferences
  WHERE user_id = NEW.user_id;

  -- Send notification if preferences allow
  IF COALESCE(v_user_prefs.system_notifications, true)
     AND COALESCE(v_user_prefs.in_app_enabled, true) THEN

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
      v_warning_title,
      v_warning_message,
      '/credits/purchase',
      jsonb_build_object(
        'current_credits', NEW.current_balance,
        'previous_credits', OLD.current_balance,
        'threshold', v_threshold,
        'warning_level', v_warning_level,
        'recommended_purchase', CASE
          WHEN NEW.current_balance < v_critical_threshold THEN 50
          ELSE 20
        END
      )
    );

    RAISE NOTICE 'Low credit notification sent: user=%, credits=%, level=%',
      NEW.user_id, NEW.current_balance, v_warning_level;
  ELSE
    RAISE NOTICE 'Low credit notification skipped (preferences disabled): user=%',
      NEW.user_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending low credit notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_low_credit"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_low_credit"() IS 'Sends notification when user credits fall below threshold (10 credits = warning, 3 credits = critical). Only notifies on threshold crossings to avoid spam.';



CREATE OR REPLACE FUNCTION "public"."notify_new_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_sender RECORD;
  v_recipient RECORD;
  v_gig_title TEXT;
  v_message_preview TEXT;
BEGIN
  -- Get sender details
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_sender
  FROM users_profile
  WHERE id = NEW.from_user_id;

  -- Get recipient details
  SELECT
    user_id,
    display_name
  INTO v_recipient
  FROM users_profile
  WHERE id = NEW.to_user_id;

  -- Get gig title for context
  SELECT title INTO v_gig_title
  FROM gigs
  WHERE id = NEW.gig_id;

  -- Check notification preferences (default to true)
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_recipient.user_id
    AND (application_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Message notification skipped (preferences disabled): user=%', v_recipient.user_id;
    RETURN NEW;
  END IF;

  -- Create message preview (first 100 characters)
  v_message_preview := substring(NEW.body, 1, 100);
  IF length(NEW.body) > 100 THEN
    v_message_preview := v_message_preview || '...';
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
    v_recipient.user_id,
    v_sender.user_id,
    'new_message',
    'gig',
    '💬 New message',
    v_sender.display_name || ' sent you a message about "' || v_gig_title || '"',
    v_sender.avatar_url,
    '/gigs/' || NEW.gig_id || '/messages',
    jsonb_build_object(
      'message_id', NEW.id,
      'gig_id', NEW.gig_id,
      'gig_title', v_gig_title,
      'sender_id', v_sender.user_id,
      'sender_name', v_sender.display_name,
      'sender_handle', v_sender.handle,
      'message_preview', v_message_preview,
      'has_attachments', (NEW.attachments IS NOT NULL AND jsonb_array_length(NEW.attachments) > 0),
      'sent_at', NEW.created_at
    )
  );

  RAISE NOTICE 'Message notification sent: % messaged % about gig %',
    v_sender.display_name, v_recipient.display_name, v_gig_title;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending message notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_new_message"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_new_message"() IS 'Sends notification when a user receives a new direct message about a gig';



CREATE OR REPLACE FUNCTION "public"."notify_preset_liked"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_liker RECORD;
  v_preset RECORD;
BEGIN
  -- Get liker details
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_liker
  FROM users_profile
  WHERE user_id = NEW.user_id;

  -- Get preset and owner details
  SELECT
    p.id,
    p.name,
    p.title,
    p.user_id as owner_user_id,
    up.display_name as owner_name
  INTO v_preset
  FROM presets p
  JOIN users_profile up ON p.user_id = up.user_id
  WHERE p.id = NEW.preset_id;

  -- Don't notify if user likes their own preset
  IF v_liker.user_id = v_preset.owner_user_id THEN
    RETURN NEW;
  END IF;

  -- Check notification preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_preset.owner_user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Preset like notification skipped (preferences disabled): user=%',
      v_preset.owner_user_id;
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
    v_preset.owner_user_id,
    v_liker.user_id,
    'preset_like',
    'social',
    '❤️ Someone liked your preset',
    v_liker.display_name || ' liked "' || COALESCE(v_preset.title, v_preset.name) || '"',
    v_liker.avatar_url,
    '/presets/' || v_preset.id,
    jsonb_build_object(
      'preset_id', v_preset.id,
      'preset_name', COALESCE(v_preset.title, v_preset.name),
      'liker_id', v_liker.user_id,
      'liker_name', v_liker.display_name,
      'liker_handle', v_liker.handle,
      'liked_at', NEW.created_at
    )
  );

  RAISE NOTICE 'Preset like notification sent: % liked %',
    v_liker.display_name, COALESCE(v_preset.title, v_preset.name);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending preset like notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_preset_liked"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_preset_liked"() IS 'Sends notification when someone likes a preset';



CREATE OR REPLACE FUNCTION "public"."notify_preset_milestone"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_owner RECORD;
  v_milestone INTEGER;
  v_milestone_reached BOOLEAN := false;
BEGIN
  -- Only check on usage count increase
  IF NEW.usage_count <= OLD.usage_count THEN
    RETURN NEW;
  END IF;

  -- Get preset owner details
  SELECT
    up.user_id,
    up.display_name
  INTO v_owner
  FROM users_profile up
  WHERE up.user_id = NEW.user_id;

  -- Check notification preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_owner.user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RETURN NEW;
  END IF;

  -- Check if milestone reached (10, 50, 100, 500, 1000, 5000)
  IF NEW.usage_count >= 5000 AND OLD.usage_count < 5000 THEN
    v_milestone := 5000;
    v_milestone_reached := true;
  ELSIF NEW.usage_count >= 1000 AND OLD.usage_count < 1000 THEN
    v_milestone := 1000;
    v_milestone_reached := true;
  ELSIF NEW.usage_count >= 500 AND OLD.usage_count < 500 THEN
    v_milestone := 500;
    v_milestone_reached := true;
  ELSIF NEW.usage_count >= 100 AND OLD.usage_count < 100 THEN
    v_milestone := 100;
    v_milestone_reached := true;
  ELSIF NEW.usage_count >= 50 AND OLD.usage_count < 50 THEN
    v_milestone := 50;
    v_milestone_reached := true;
  ELSIF NEW.usage_count >= 10 AND OLD.usage_count < 10 THEN
    v_milestone := 10;
    v_milestone_reached := true;
  END IF;

  -- Send milestone notification
  IF v_milestone_reached THEN
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
      v_owner.user_id,
      v_owner.user_id,
      'preset_milestone',
      'system',
      '🎉 Preset milestone reached!',
      'Your preset "' || NEW.name || '" has reached ' || v_milestone || ' uses!',
      '/presets/' || NEW.id || '/analytics',
      jsonb_build_object(
        'preset_id', NEW.id,
        'preset_name', NEW.name,
        'milestone', v_milestone,
        'total_usage', NEW.usage_count,
        'achieved_at', NOW()
      )
    );

    RAISE NOTICE 'Preset milestone notification sent: preset % reached % uses',
      NEW.name, v_milestone;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending preset milestone notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_preset_milestone"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_preset_milestone"() IS 'Sends notification when preset reaches usage milestones (10, 50, 100, 500, 1000, 5000 uses)';



CREATE OR REPLACE FUNCTION "public"."notify_preset_purchased"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_buyer RECORD;
  v_seller RECORD;
  v_preset RECORD;
BEGIN
  -- Only notify on completed purchases
  IF NEW.payment_status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get buyer details
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_buyer
  FROM users_profile
  WHERE user_id = NEW.buyer_user_id;

  -- Get seller details
  SELECT
    user_id,
    display_name
  INTO v_seller
  FROM users_profile
  WHERE user_id = NEW.seller_user_id;

  -- Get preset details
  SELECT
    id,
    name,
    title
  INTO v_preset
  FROM presets
  WHERE id = NEW.preset_id;

  -- Check seller notification preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_seller.user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Purchase notification skipped (seller preferences disabled): user=%', v_seller.user_id;
    RETURN NEW;
  END IF;

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
    v_seller.user_id,
    v_buyer.user_id,
    'preset_purchased',
    'marketplace',
    '💰 Preset sold!',
    v_buyer.display_name || ' purchased your preset "' || COALESCE(v_preset.title, v_preset.name) || '" for ' || NEW.purchase_price || ' credits',
    v_buyer.avatar_url,
    '/marketplace/sales',
    jsonb_build_object(
      'purchase_id', NEW.id,
      'preset_id', v_preset.id,
      'preset_name', COALESCE(v_preset.title, v_preset.name),
      'buyer_id', v_buyer.user_id,
      'buyer_name', v_buyer.display_name,
      'buyer_handle', v_buyer.handle,
      'purchase_price', NEW.purchase_price,
      'seller_payout', NEW.seller_payout,
      'platform_fee', NEW.platform_fee,
      'purchased_at', NEW.purchased_at
    )
  );

  -- Notify buyer (purchase confirmation)
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_buyer.user_id
    AND COALESCE(system_notifications, true) = true
    AND COALESCE(in_app_enabled, true) = true
  ) THEN
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
      'preset_purchase_confirmation',
      'marketplace',
      '✅ Purchase complete',
      'You purchased "' || COALESCE(v_preset.title, v_preset.name) || '" for ' || NEW.purchase_price || ' credits',
      '/marketplace/purchases',
      jsonb_build_object(
        'purchase_id', NEW.id,
        'preset_id', v_preset.id,
        'preset_name', COALESCE(v_preset.title, v_preset.name),
        'seller_id', v_seller.user_id,
        'seller_name', v_seller.display_name,
        'purchase_price', NEW.purchase_price,
        'purchased_at', NEW.purchased_at
      )
    );
  END IF;

  RAISE NOTICE 'Purchase notifications sent: % bought % from %',
    v_buyer.display_name, v_preset.name, v_seller.display_name;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending purchase notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_preset_purchased"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_preset_purchased"() IS 'Sends notifications to both seller (sale confirmation) and buyer (purchase confirmation) when preset is purchased';



CREATE OR REPLACE FUNCTION "public"."notify_preset_review"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_reviewer RECORD;
  v_seller RECORD;
  v_preset RECORD;
  v_rating_emoji TEXT;
BEGIN
  -- Get reviewer details
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_reviewer
  FROM users_profile
  WHERE user_id = NEW.reviewer_user_id;

  -- Get preset and seller details
  SELECT
    p.id,
    p.name,
    p.title,
    p.user_id as seller_user_id,
    up.user_id as seller_auth_user_id,
    up.display_name as seller_name
  INTO v_preset
  FROM presets p
  JOIN users_profile up ON p.user_id = up.user_id
  WHERE p.id = NEW.preset_id;

  -- Don't notify if reviewer is the seller
  IF v_reviewer.user_id = v_preset.seller_auth_user_id THEN
    RETURN NEW;
  END IF;

  -- Check notification preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_preset.seller_auth_user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Review notification skipped (preferences disabled): user=%', v_preset.seller_auth_user_id;
    RETURN NEW;
  END IF;

  -- Get rating emoji
  v_rating_emoji := CASE
    WHEN NEW.rating >= 5 THEN '⭐⭐⭐⭐⭐'
    WHEN NEW.rating >= 4 THEN '⭐⭐⭐⭐'
    WHEN NEW.rating >= 3 THEN '⭐⭐⭐'
    WHEN NEW.rating >= 2 THEN '⭐⭐'
    ELSE '⭐'
  END;

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
    v_preset.seller_auth_user_id,
    v_reviewer.user_id,
    'preset_review',
    'marketplace',
    '⭐ New review',
    v_reviewer.display_name || ' rated your preset "' || COALESCE(v_preset.title, v_preset.name) || '" ' || v_rating_emoji,
    v_reviewer.avatar_url,
    '/marketplace/presets/' || v_preset.id || '/reviews',
    jsonb_build_object(
      'review_id', NEW.id,
      'preset_id', v_preset.id,
      'preset_name', COALESCE(v_preset.title, v_preset.name),
      'reviewer_id', v_reviewer.user_id,
      'reviewer_name', v_reviewer.display_name,
      'reviewer_handle', v_reviewer.handle,
      'rating', NEW.rating,
      'review_title', NEW.title,
      'review_comment', NEW.comment,
      'reviewed_at', NEW.created_at
    )
  );

  RAISE NOTICE 'Review notification sent: % reviewed preset %',
    v_reviewer.display_name, v_preset.name;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending review notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_preset_review"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_preset_review"() IS 'Sends notification to preset seller when someone leaves a review';



CREATE OR REPLACE FUNCTION "public"."notify_preset_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_user RECORD;
  v_preset RECORD;
  v_owner RECORD;
  v_usage_count INTEGER;
BEGIN
  -- Get user who used the preset
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_user
  FROM users_profile
  WHERE id = NEW.user_id;

  -- Get preset and owner details
  SELECT
    p.id,
    p.name,
    p.usage_count,
    p.user_id as owner_user_id,
    up.display_name as owner_name,
    up.user_id as owner_auth_user_id
  INTO v_preset
  FROM presets p
  JOIN users_profile up ON p.user_id = up.user_id
  WHERE p.id = NEW.preset_id;

  -- Don't notify if user uses their own preset
  IF v_user.user_id = v_preset.owner_auth_user_id THEN
    RETURN NEW;
  END IF;

  -- Get current usage count (after this use)
  v_usage_count := COALESCE(v_preset.usage_count, 0) + 1;

  -- Check notification preferences (default to true)
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_preset.owner_auth_user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Preset usage notification skipped (preferences disabled): user=%', v_preset.owner_auth_user_id;
    RETURN NEW;
  END IF;

  -- Send notification for every use (can be adjusted to milestone-based)
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
    v_preset.owner_auth_user_id,
    v_user.user_id,
    'preset_used',
    'social',
    '🎨 Someone used your preset',
    v_user.display_name || ' used your preset "' || v_preset.name || '"',
    v_user.avatar_url,
    '/presets/' || v_preset.id,
    jsonb_build_object(
      'preset_id', v_preset.id,
      'preset_name', v_preset.name,
      'user_id', v_user.user_id,
      'user_name', v_user.display_name,
      'user_handle', v_user.handle,
      'usage_count', v_usage_count,
      'used_at', NEW.used_at
    )
  );

  RAISE NOTICE 'Preset usage notification sent: % used preset % (total uses: %)',
    v_user.display_name, v_preset.name, v_usage_count;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending preset usage notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_preset_usage"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_preset_usage"() IS 'Sends notification to preset owner when someone uses their preset';



CREATE OR REPLACE FUNCTION "public"."notify_showcase_comment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_commenter RECORD;
  v_showcase RECORD;
  v_parent_comment RECORD;
  v_comment_preview TEXT;
BEGIN
  -- Get commenter details
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_commenter
  FROM users_profile
  WHERE user_id = NEW.user_id;

  -- Get showcase and owner details
  SELECT
    s.id,
    s.title,
    s.creator_user_id,
    up.display_name as owner_name,
    up.user_id as owner_user_id
  INTO v_showcase
  FROM showcases s
  JOIN users_profile up ON s.creator_user_id = up.id
  WHERE s.id = NEW.showcase_id;

  -- Create comment preview (first 100 chars)
  v_comment_preview := SUBSTRING(NEW.comment FROM 1 FOR 100);
  IF LENGTH(NEW.comment) > 100 THEN
    v_comment_preview := v_comment_preview || '...';
  END IF;

  -- If this is a reply, notify the parent comment author
  IF NEW.parent_id IS NOT NULL THEN
    SELECT
      sc.user_id as parent_user_id,
      up.display_name as parent_author_name,
      up.user_id as parent_author_user_id
    INTO v_parent_comment
    FROM showcase_comments sc
    JOIN users_profile up ON sc.user_id = up.user_id
    WHERE sc.id = NEW.parent_id;

    -- Notify parent comment author (if not commenting on their own comment)
    IF v_commenter.user_id != v_parent_comment.parent_author_user_id THEN
      IF NOT EXISTS (
        SELECT 1
        FROM notification_preferences
        WHERE user_id = v_parent_comment.parent_author_user_id
        AND (system_notifications = false OR in_app_enabled = false)
      ) THEN
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
          v_parent_comment.parent_author_user_id,
          v_commenter.user_id,
          'showcase_comment_reply',
          'social',
          '💬 Someone replied to your comment',
          v_commenter.display_name || ' replied: "' || v_comment_preview || '"',
          v_commenter.avatar_url,
          '/showcases/' || v_showcase.id || '#comment-' || NEW.id,
          jsonb_build_object(
            'showcase_id', v_showcase.id,
            'showcase_title', v_showcase.title,
            'comment_id', NEW.id,
            'parent_comment_id', NEW.parent_id,
            'commenter_id', v_commenter.user_id,
            'commenter_name', v_commenter.display_name,
            'commenter_handle', v_commenter.handle,
            'comment_preview', v_comment_preview,
            'commented_at', NEW.created_at
          )
        );
      END IF;
    END IF;
  END IF;

  -- Notify showcase owner (unless they commented themselves)
  IF v_commenter.user_id != v_showcase.owner_user_id THEN
    IF NOT EXISTS (
      SELECT 1
      FROM notification_preferences
      WHERE user_id = v_showcase.owner_user_id
      AND (system_notifications = false OR in_app_enabled = false)
    ) THEN
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
        '💬 Someone commented on your showcase',
        v_commenter.display_name || ' commented: "' || v_comment_preview || '"',
        v_commenter.avatar_url,
        '/showcases/' || v_showcase.id || '#comment-' || NEW.id,
        jsonb_build_object(
          'showcase_id', v_showcase.id,
          'showcase_title', v_showcase.title,
          'comment_id', NEW.id,
          'commenter_id', v_commenter.user_id,
          'commenter_name', v_commenter.display_name,
          'commenter_handle', v_commenter.handle,
          'comment_preview', v_comment_preview,
          'commented_at', NEW.created_at
        )
      );
    END IF;
  END IF;

  RAISE NOTICE 'Showcase comment notification sent: % commented on %',
    v_commenter.display_name, v_showcase.title;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending showcase comment notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_showcase_comment"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_showcase_comment"() IS 'Sends notification when someone comments on a showcase or replies to a comment';



CREATE OR REPLACE FUNCTION "public"."notify_showcase_liked"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_liker RECORD;
  v_showcase RECORD;
BEGIN
  -- Get liker details
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_liker
  FROM users_profile
  WHERE user_id = NEW.user_id;

  -- Get showcase and owner details
  SELECT
    s.id,
    s.title,
    s.creator_user_id,
    up.display_name as owner_name,
    up.user_id as owner_user_id
  INTO v_showcase
  FROM showcases s
  JOIN users_profile up ON s.creator_user_id = up.id
  WHERE s.id = NEW.showcase_id;

  -- Don't notify if user likes their own showcase
  IF v_liker.user_id = v_showcase.owner_user_id THEN
    RETURN NEW;
  END IF;

  -- Check notification preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_showcase.owner_user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Showcase like notification skipped (preferences disabled): user=%',
      v_showcase.owner_user_id;
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
    '❤️ Someone liked your showcase',
    v_liker.display_name || ' liked "' || v_showcase.title || '"',
    v_liker.avatar_url,
    '/showcases/' || v_showcase.id,
    jsonb_build_object(
      'showcase_id', v_showcase.id,
      'showcase_title', v_showcase.title,
      'liker_id', v_liker.user_id,
      'liker_name', v_liker.display_name,
      'liker_handle', v_liker.handle,
      'liked_at', NEW.created_at
    )
  );

  RAISE NOTICE 'Showcase like notification sent: % liked %',
    v_liker.display_name, v_showcase.title;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending showcase like notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_showcase_liked"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_showcase_liked"() IS 'Sends notification when someone likes a showcase';



CREATE OR REPLACE FUNCTION "public"."notify_verification_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_status_message TEXT;
  v_notification_title TEXT;
  v_notification_type TEXT;
BEGIN
  -- Only trigger when verified_id status actually changes
  IF OLD.verified_id = NEW.verified_id THEN
    RETURN NEW;
  END IF;

  -- Check user notification preferences (default to true)
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = NEW.user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Verification notification skipped (preferences disabled): user=%', NEW.user_id;
    RETURN NEW;
  END IF;

  -- Customize notification based on verification status
  IF NEW.verified_id = true THEN
    v_notification_type := 'verification_approved';
    v_notification_title := '✅ Verification approved!';
    v_status_message := 'Your ID verification has been approved. You now have a verified badge on your profile!';
  ELSIF NEW.verified_id = false AND OLD.verified_id = true THEN
    -- Verification was revoked
    v_notification_type := 'verification_revoked';
    v_notification_title := 'Verification status updated';
    v_status_message := 'Your verification status has been updated. Please contact support if you have questions.';
  ELSE
    -- Verification rejected (was null or pending, now explicitly false)
    v_notification_type := 'verification_rejected';
    v_notification_title := 'Verification update';
    v_status_message := 'Your verification request could not be completed. Please ensure your ID is clear and valid, then try again.';
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
    v_notification_type,
    'system',
    v_notification_title,
    v_status_message,
    '/profile/settings',
    jsonb_build_object(
      'verified', NEW.verified_id,
      'previous_status', OLD.verified_id,
      'updated_at', NEW.updated_at
    )
  );

  RAISE NOTICE 'Verification status notification sent: user=%, status=%',
    NEW.user_id, NEW.verified_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending verification notification: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_verification_status"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_verification_status"() IS 'Sends notification when user ID verification status changes (approved, rejected, or revoked)';



CREATE OR REPLACE FUNCTION "public"."process_credit_refund"("p_task_id" "uuid", "p_user_id" "uuid", "p_credits" integer DEFAULT 1, "p_reason" character varying DEFAULT 'generation_failed'::character varying) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_refund_policy RECORD;
  v_credits_to_refund INTEGER;
BEGIN
  -- Get refund policy
  SELECT * INTO v_refund_policy
  FROM refund_policies
  WHERE error_type = p_reason;
  
  -- Check if should refund
  IF NOT FOUND OR NOT v_refund_policy.should_refund THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate refund amount
  v_credits_to_refund := ROUND(p_credits * v_refund_policy.refund_percentage / 100);
  
  IF v_credits_to_refund = 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Get current balance
  SELECT current_balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  v_new_balance := v_current_balance + v_credits_to_refund;
  
  -- Update user balance
  UPDATE user_credits
  SET 
    current_balance = v_new_balance,
    consumed_this_month = GREATEST(0, consumed_this_month - v_credits_to_refund),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Mark task as refunded
  UPDATE enhancement_tasks
  SET 
    refunded = true,
    refund_processed_at = NOW()
  WHERE id = p_task_id;
  
  -- Log refund
  INSERT INTO refund_audit_log (
    task_id,
    user_id,
    credits_refunded,
    refund_reason,
    previous_balance,
    new_balance,
    platform_loss
  ) VALUES (
    p_task_id,
    p_user_id,
    v_credits_to_refund,
    p_reason,
    v_current_balance,
    v_new_balance,
    4 -- Platform loses 4 NanoBanana credits
  );
  
  -- Create refund transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_used,
    provider,
    api_request_id,
    status,
    metadata
  ) VALUES (
    p_user_id,
    'refund',
    -v_credits_to_refund,
    'nanobanana',
    p_task_id::VARCHAR,
    'completed',
    jsonb_build_object(
      'refund_reason', p_reason,
      'original_task_id', p_task_id,
      'refund_policy', v_refund_policy.error_type
    )
  );
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."process_credit_refund"("p_task_id" "uuid", "p_user_id" "uuid", "p_credits" integer, "p_reason" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purchase_preset_with_credits"("p_preset_id" "uuid", "p_buyer_user_id" "uuid") RETURNS TABLE("success" boolean, "message" "text", "purchase_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
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
  SELECT id, seller_user_id, sale_price
  INTO v_listing_id, v_seller_user_id, v_sale_price
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

  IF v_buyer_profile_id IS NULL THEN
    RETURN QUERY SELECT false, 'Buyer profile not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Get seller profile ID
  SELECT id INTO v_seller_profile_id
  FROM users_profile WHERE user_id = v_seller_user_id;

  IF v_seller_profile_id IS NULL THEN
    RETURN QUERY SELECT false, 'Seller profile not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Get buyer's current credits
  SELECT current_balance INTO v_buyer_credits
  FROM user_credits
  WHERE user_id = v_buyer_profile_id;

  IF v_buyer_credits IS NULL OR v_buyer_credits < v_sale_price THEN
    RETURN QUERY SELECT false,
      'Insufficient credits. You have ' || COALESCE(v_buyer_credits::TEXT, '0') || ' credits but need ' || v_sale_price::TEXT,
      NULL::UUID;
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

  -- Add credits to seller (payout after platform fee)
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

  RAISE NOTICE 'Preset purchased successfully: purchase_id=%, buyer=%, seller=%, price=%',
    v_purchase_id, p_buyer_user_id, v_seller_user_id, v_sale_price;

  RETURN QUERY SELECT true, 'Purchase successful'::TEXT, v_purchase_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in purchase_preset_with_credits: %', SQLERRM;
    RETURN QUERY SELECT false, 'Purchase failed: ' || SQLERRM, NULL::UUID;
END;
$$;


ALTER FUNCTION "public"."purchase_preset_with_credits"("p_preset_id" "uuid", "p_buyer_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."purchase_preset_with_credits"("p_preset_id" "uuid", "p_buyer_user_id" "uuid") IS 'Purchases a preset using credits. Deducts from buyer, adds to seller (minus 10% platform fee), creates purchase record which triggers notification to both parties.';



CREATE OR REPLACE FUNCTION "public"."recommend_vibes_for_user"("target_user_id" "uuid", "limit_count" integer DEFAULT 5) RETURNS TABLE("vibe_id" "uuid", "name" character varying, "display_name" character varying, "category" character varying, "recommendation_score" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vm.id,
    vm.name,
    vm.display_name,
    vm.category,
    -- Score based on: global popularity + category preference + novelty
    (
      (vm.usage_count::DECIMAL / (SELECT MAX(usage_count) FROM public.vibes_master)) * 0.3 +
      COALESCE(cat_pref.category_score, 0) * 0.5 +
      (CASE WHEN user_usage.vibe_id IS NULL THEN 0.2 ELSE 0 END)
    ) as recommendation_score
  FROM public.vibes_master vm
  LEFT JOIN public.user_vibe_analytics user_usage ON user_usage.vibe_id = vm.id AND user_usage.user_id = target_user_id
  LEFT JOIN (
    -- Calculate user's preference for each category
    SELECT 
      vm_inner.category,
      AVG(uva_inner.confidence_score) as category_score
    FROM public.user_vibe_analytics uva_inner
    JOIN public.vibes_master vm_inner ON vm_inner.id = uva_inner.vibe_id
    WHERE uva_inner.user_id = target_user_id
    GROUP BY vm_inner.category
  ) cat_pref ON cat_pref.category = vm.category
  WHERE vm.is_active = true
  AND (user_usage.vibe_id IS NULL OR user_usage.confidence_score < 0.3) -- Exclude heavily used vibes
  ORDER BY recommendation_score DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."recommend_vibes_for_user"("target_user_id" "uuid", "limit_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."recommend_vibes_for_user"("target_user_id" "uuid", "limit_count" integer) IS 'Recommends new vibes for a user based on their patterns and global trends';



CREATE OR REPLACE FUNCTION "public"."record_rate_limit_usage"("using_user_profile_id" "uuid", "resource" character varying, "action_count" integer DEFAULT 1) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_tier subscription_tier;
    limit_config RECORD;
    current_window_start TIMESTAMPTZ;
    existing_record RECORD;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM users_profile
    WHERE id = using_user_profile_id;
    
    -- Get rate limit configuration
    SELECT * INTO limit_config
    FROM rate_limits
    WHERE resource_type = resource 
    AND subscription_tier = user_tier;
    
    -- If no config or unlimited, don't track
    IF limit_config IS NULL OR limit_config.max_actions = -1 THEN
        RETURN true;
    END IF;
    
    -- Calculate current time window start
    current_window_start := DATE_TRUNC('minute', NOW()) - 
                           ((EXTRACT(MINUTE FROM NOW())::INTEGER % limit_config.time_window_minutes) * INTERVAL '1 minute');
    
    -- Try to find existing record for this window
    SELECT * INTO existing_record
    FROM user_rate_limits
    WHERE user_profile_id = using_user_profile_id
    AND resource_type = resource
    AND window_start = current_window_start;
    
    IF existing_record IS NOT NULL THEN
        -- Update existing record
        UPDATE user_rate_limits
        SET action_count = action_count + record_rate_limit_usage.action_count,
            last_action = NOW(),
            updated_at = NOW()
        WHERE id = existing_record.id;
    ELSE
        -- Create new record
        INSERT INTO user_rate_limits (
            user_profile_id,
            resource_type,
            action_count,
            window_start,
            last_action
        ) VALUES (
            using_user_profile_id,
            resource,
            action_count,
            current_window_start,
            NOW()
        );
    END IF;
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."record_rate_limit_usage"("using_user_profile_id" "uuid", "resource" character varying, "action_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."record_rate_limit_usage"("using_user_profile_id" "uuid", "resource" character varying, "action_count" integer) IS 'Record usage of rate-limited resource';



CREATE OR REPLACE FUNCTION "public"."reject_featured_preset_request"("request_id" "uuid", "admin_user_id" "uuid", "admin_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  preset_uuid UUID;
BEGIN
  -- Get the preset_id from the request
  SELECT preset_id INTO preset_uuid
  FROM featured_preset_requests
  WHERE id = request_id AND status = 'pending';
  
  IF preset_uuid IS NULL THEN
    RAISE EXCEPTION 'Featured preset request not found or already processed';
  END IF;
  
  -- Update the request status
  UPDATE featured_preset_requests
  SET 
    status = 'rejected',
    reviewed_by = admin_user_id,
    reviewed_at = NOW(),
    admin_notes = COALESCE(admin_notes, 'Request rejected')
  WHERE id = request_id;
  
  -- Ensure the preset is not featured
  UPDATE presets
  SET is_featured = false
  WHERE id = preset_uuid;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."reject_featured_preset_request"("request_id" "uuid", "admin_user_id" "uuid", "admin_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reject_featured_preset_request"("request_id" "uuid", "admin_user_id" "uuid", "admin_notes" "text") IS 'Rejects a featured preset request and ensures preset is not featured';



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


CREATE OR REPLACE FUNCTION "public"."reset_monthly_subscription_benefits"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    reset_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Reset credits for all users based on their subscription tier
    FOR user_record IN 
        SELECT 
            uc.user_id,
            uc.subscription_tier,
            uc.monthly_allowance,
            uc.current_balance,
            uc.purchased_credits_balance,
            uc.consumed_this_month
        FROM user_credits uc
        WHERE uc.last_reset_at < date_trunc('month', NOW())
    LOOP
        -- IMPORTANT: Reset subscription credits but KEEP purchased credits
        -- New balance = monthly_allowance (subscription) + purchased_credits_balance (never expires)
        UPDATE user_credits 
        SET 
            current_balance = user_record.monthly_allowance + user_record.purchased_credits_balance,
            consumed_this_month = 0,
            last_reset_at = NOW(),
            updated_at = NOW()
        WHERE user_id = user_record.user_id;
        
        -- Log the reset transaction
        INSERT INTO credit_transactions (
            user_id,
            transaction_type,
            credits_used,
            enhancement_type,
            status,
            created_at
        ) VALUES (
            user_record.user_id,
            'monthly_reset',
            user_record.monthly_allowance,
            'monthly_allowance',
            'completed',
            NOW()
        );
        
        reset_count := reset_count + 1;
    END LOOP;
    
    RETURN reset_count;
END;
$$;


ALTER FUNCTION "public"."reset_monthly_subscription_benefits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_current_handle"("input_handle" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    current_handle TEXT;
BEGIN
    -- First check if it's a current handle
    IF EXISTS (SELECT 1 FROM users_profile WHERE handle = input_handle) THEN
        RETURN input_handle;
    END IF;
    
    -- Then check if it's an old handle that redirects
    SELECT new_handle INTO current_handle
    FROM user_handle_redirects
    WHERE old_handle = input_handle
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If we found a redirect, recursively resolve it (in case of multiple redirects)
    IF current_handle IS NOT NULL THEN
        RETURN resolve_current_handle(current_handle);
    END IF;
    
    -- No redirect found, return original
    RETURN input_handle;
END;
$$;


ALTER FUNCTION "public"."resolve_current_handle"("input_handle" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_username_to_email"("username_input" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_email text;
  cleaned_username text;
BEGIN
  -- Clean the input: remove @ prefix if present, convert to lowercase, trim whitespace
  cleaned_username := lower(trim(both '@' from trim(username_input)));
  
  -- Validate input
  IF cleaned_username = '' OR cleaned_username IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Look up email by handle in users_profile
  SELECT au.email INTO user_email
  FROM auth.users au
  JOIN users_profile up ON au.id = up.user_id
  WHERE up.handle = cleaned_username
    AND au.email_confirmed_at IS NOT NULL  -- Only confirmed users
    AND up.created_at IS NOT NULL;        -- Profile exists
  
  RETURN user_email;
END;
$$;


ALTER FUNCTION "public"."resolve_username_to_email"("username_input" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."resolve_username_to_email"("username_input" "text") IS 'Securely resolves a username/handle to an email address for authentication. Returns NULL if username not found or user not confirmed.';



CREATE OR REPLACE FUNCTION "public"."sanitize_message_content"("content" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  sanitized TEXT;
BEGIN
  -- Remove HTML tags
  sanitized := regexp_replace(content, '<[^>]*>', '', 'gi');
  
  -- Remove script tags and javascript
  sanitized := regexp_replace(sanitized, 'javascript:|data:|vbscript:', '', 'gi');
  
  -- Limit excessive whitespace
  sanitized := regexp_replace(sanitized, '\s+', ' ', 'g');
  
  -- Trim whitespace
  sanitized := trim(sanitized);
  
  RETURN sanitized;
END;
$$;


ALTER FUNCTION "public"."sanitize_message_content"("content" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sanitize_message_content"("content" "text") IS 'Sanitizes message content by removing HTML, scripts, and excessive whitespace';



CREATE OR REPLACE FUNCTION "public"."search_purposes"("p_search_term" "text" DEFAULT NULL::"text", "p_category" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "name" "text", "display_name" "text", "description" "text", "icon" "text", "category" "text", "sort_order" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    erp.id,
    erp.name,
    erp.display_name,
    erp.description,
    erp.icon,
    erp.category,
    erp.sort_order
  FROM equipment_request_purposes erp
  WHERE erp.is_active = TRUE
  AND (p_category IS NULL OR erp.category = p_category)
  AND (
    p_search_term IS NULL 
    OR erp.name ILIKE '%' || p_search_term || '%'
    OR erp.display_name ILIKE '%' || p_search_term || '%'
    OR erp.description ILIKE '%' || p_search_term || '%'
  )
  ORDER BY 
    CASE WHEN p_search_term IS NOT NULL THEN
      CASE 
        WHEN erp.name ILIKE p_search_term || '%' THEN 1
        WHEN erp.display_name ILIKE p_search_term || '%' THEN 2
        WHEN erp.name ILIKE '%' || p_search_term || '%' THEN 3
        WHEN erp.display_name ILIKE '%' || p_search_term || '%' THEN 4
        ELSE 5
      END
    ELSE erp.sort_order END,
    erp.display_name
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."search_purposes"("p_search_term" "text", "p_category" "text", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_purposes"("p_search_term" "text", "p_category" "text", "p_limit" integer) IS 'Searches purposes with fuzzy matching and category filtering';



CREATE OR REPLACE FUNCTION "public"."search_roles_and_skills"("search_term" "text") RETURNS TABLE("type" "text", "id" "uuid", "name" "text", "category" "text", "description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'role'::TEXT as type,
    pr.id,
    pr.name,
    pr.category,
    pr.description
  FROM predefined_roles pr
  WHERE pr.is_active = true
    AND (pr.name ILIKE '%' || search_term || '%' OR pr.description ILIKE '%' || search_term || '%')
  
  UNION ALL
  
  SELECT 
    'skill'::TEXT as type,
    ps.id,
    ps.name,
    ps.category,
    ps.description
  FROM predefined_skills ps
  WHERE ps.is_active = true
    AND (ps.name ILIKE '%' || search_term || '%' OR ps.description ILIKE '%' || search_term || '%')
  
  ORDER BY name;
END;
$$;


ALTER FUNCTION "public"."search_roles_and_skills"("search_term" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_roles_and_skills"("search_term" "text") IS 'Search both roles and skills by name or description';



CREATE OR REPLACE FUNCTION "public"."send_deadline_reminders"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  gig_record RECORD;
BEGIN
  -- Find gigs with deadlines in 24 hours
  FOR gig_record IN
    SELECT 
      g.id,
      g.title,
      g.owner_user_id,
      g.application_deadline,
      (SELECT COUNT(*) FROM applications WHERE gig_id = g.id) as application_count
    FROM gigs g
    WHERE g.status = 'PUBLISHED'
    AND g.application_deadline >= NOW() + INTERVAL '23 hours'
    AND g.application_deadline <= NOW() + INTERVAL '25 hours'
  LOOP
    PERFORM call_email_api(
      '/api/emails/deadline-approaching',
      jsonb_build_object(
        'gigId', gig_record.id,
        'ownerId', gig_record.owner_user_id,
        'applicationCount', gig_record.application_count
      )
    );
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."send_deadline_reminders"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_deadline_reminders"() IS 'Scheduled job to send deadline approaching emails';



CREATE OR REPLACE FUNCTION "public"."send_gig_match_notifications"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  talent_record RECORD;
  matched_gigs JSONB;
BEGIN
  -- Find talent users
  FOR talent_record IN
    SELECT 
      user_id,
      id as profile_id,
      display_name,
      city,
      style_tags
    FROM users_profile
    WHERE 'TALENT' = ANY(role_flags)
  LOOP
    -- Find gigs matching talent's location and style tags (simplified)
    -- This is a basic version - you'd want more sophisticated matching
    SELECT json_agg(json_build_object('id', id, 'title', title, 'location', location_text))
    INTO matched_gigs
    FROM gigs
    WHERE status = 'PUBLISHED'
    AND created_at >= NOW() - INTERVAL '24 hours' -- Only new gigs
    AND (
      city IS NULL OR 
      city = talent_record.city OR
      style_tags && talent_record.style_tags -- Array overlap
    )
    LIMIT 5;
    
    -- Send email if there are matches
    IF matched_gigs IS NOT NULL AND json_array_length(matched_gigs) > 0 THEN
      PERFORM call_email_api(
        '/api/emails/gig-matches',
        jsonb_build_object(
          'authUserId', talent_record.user_id,
          'name', talent_record.display_name,
          'matches', matched_gigs
        )
      );
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."send_gig_match_notifications"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_gig_match_notifications"() IS 'Daily digest of matching gigs for talent';



CREATE OR REPLACE FUNCTION "public"."send_marketplace_milestones"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  seller_record RECORD;
BEGIN
  -- Find sellers who just hit sales milestones (10, 50, 100, 500 sales)
  FOR seller_record IN
    SELECT 
      p.seller_user_id,
      up.user_id as auth_user_id,
      up.display_name,
      COUNT(pp.id) as total_sales,
      SUM(pp.seller_payout) as total_revenue
    FROM preset_purchases pp
    JOIN presets p ON pp.preset_id = p.id
    JOIN users_profile up ON p.seller_user_id = up.user_id
    WHERE pp.payment_status = 'completed'
    GROUP BY p.seller_user_id, up.user_id, up.display_name
    HAVING COUNT(pp.id) IN (10, 50, 100, 500, 1000)
  LOOP
    PERFORM call_email_api(
      '/api/emails/marketplace/sales-milestone',
      jsonb_build_object(
        'authUserId', seller_record.auth_user_id,
        'name', seller_record.display_name,
        'totalSales', seller_record.total_sales,
        'totalRevenue', seller_record.total_revenue
      )
    );
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."send_marketplace_milestones"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_marketplace_milestones"() IS 'Celebrates sales milestones';



CREATE OR REPLACE FUNCTION "public"."send_platform_announcement"("p_title" "text", "p_message" "text", "p_action_url" "text" DEFAULT NULL::"text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_user_count INTEGER;
  v_notifications_created INTEGER;
BEGIN
  -- Get count of users with system notifications enabled
  SELECT COUNT(*)
  INTO v_user_count
  FROM users_profile up
  LEFT JOIN notification_preferences np ON up.user_id = np.user_id
  WHERE COALESCE(np.system_notifications, true) = true
    AND COALESCE(np.in_app_enabled, true) = true;

  -- Insert notification for all eligible users
  INSERT INTO notifications (
    recipient_id,
    user_id,
    type,
    category,
    title,
    message,
    action_url,
    data
  )
  SELECT
    up.user_id,
    up.user_id,
    'platform_announcement',
    'system',
    p_title,
    p_message,
    p_action_url,
    jsonb_build_object(
      'announcement_type', 'platform_wide',
      'sent_at', NOW()
    )
  FROM users_profile up
  LEFT JOIN notification_preferences np ON up.user_id = np.user_id
  WHERE COALESCE(np.system_notifications, true) = true
    AND COALESCE(np.in_app_enabled, true) = true;

  GET DIAGNOSTICS v_notifications_created = ROW_COUNT;

  RAISE NOTICE 'Platform announcement sent: % notifications created for % eligible users',
    v_notifications_created, v_user_count;

  RETURN v_notifications_created;
END;
$$;


ALTER FUNCTION "public"."send_platform_announcement"("p_title" "text", "p_message" "text", "p_action_url" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_platform_announcement"("p_title" "text", "p_message" "text", "p_action_url" "text") IS 'Admin helper function to send announcement to all users with system notifications enabled. Returns count of notifications created.';



CREATE OR REPLACE FUNCTION "public"."send_profile_completion_reminders"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_record RECORD;
  completion_percentage INTEGER;
BEGIN
  -- Find incomplete profiles created 3+ days ago
  FOR user_record IN
    SELECT 
      user_id,
      display_name,
      avatar_url,
      bio,
      city,
      created_at
    FROM users_profile
    WHERE created_at <= NOW() - INTERVAL '3 days'
    AND created_at >= NOW() - INTERVAL '7 days'
  LOOP
    -- Calculate completion (simple version)
    completion_percentage := 0;
    IF user_record.avatar_url IS NOT NULL THEN completion_percentage := completion_percentage + 25; END IF;
    IF user_record.bio IS NOT NULL THEN completion_percentage := completion_percentage + 25; END IF;
    IF user_record.city IS NOT NULL THEN completion_percentage := completion_percentage + 25; END IF;
    completion_percentage := completion_percentage + 25; -- Display name always exists
    
    -- Send reminder if less than 75% complete
    IF completion_percentage < 75 THEN
      PERFORM call_email_api(
        '/api/emails/profile-completion',
        jsonb_build_object(
          'authUserId', user_record.user_id,
          'name', user_record.display_name,
          'completionPercentage', completion_percentage
        )
      );
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."send_profile_completion_reminders"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_profile_completion_reminders"() IS 'Scheduled job to remind users to complete profile';



CREATE OR REPLACE FUNCTION "public"."send_shoot_reminders"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  gig_record RECORD;
BEGIN
  -- Find gigs starting in 24 hours
  FOR gig_record IN
    SELECT 
      g.id,
      g.title,
      g.owner_user_id,
      g.start_time,
      g.location_text,
      g.comp_type
    FROM gigs g
    WHERE g.status = 'BOOKED'
    AND g.start_time >= NOW() + INTERVAL '23 hours'
    AND g.start_time <= NOW() + INTERVAL '25 hours'
  LOOP
    PERFORM call_email_api(
      '/api/emails/shoot-reminder',
      jsonb_build_object(
        'gigId', gig_record.id,
        'ownerId', gig_record.owner_user_id
      )
    );
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."send_shoot_reminders"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_shoot_reminders"() IS 'Scheduled job to send 24h shoot reminders';



CREATE OR REPLACE FUNCTION "public"."send_subscription_expiring_reminders"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find subscriptions expiring in 7 days
  FOR user_record IN
    SELECT 
      user_id,
      display_name,
      subscription_tier,
      subscription_expires_at
    FROM users_profile
    WHERE subscription_status = 'ACTIVE'
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at >= NOW() + INTERVAL '6 days'
    AND subscription_expires_at <= NOW() + INTERVAL '8 days'
  LOOP
    PERFORM call_email_api(
      '/api/emails/subscription-expiring',
      jsonb_build_object(
        'authUserId', user_record.user_id,
        'name', user_record.display_name,
        'tier', user_record.subscription_tier,
        'expiresAt', user_record.subscription_expires_at
      )
    );
  END LOOP;
  
  -- Also find subscriptions expiring in 1 day (final reminder)
  FOR user_record IN
    SELECT 
      user_id,
      display_name,
      subscription_tier,
      subscription_expires_at
    FROM users_profile
    WHERE subscription_status = 'ACTIVE'
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at >= NOW() + INTERVAL '23 hours'
    AND subscription_expires_at <= NOW() + INTERVAL '25 hours'
  LOOP
    PERFORM call_email_api(
      '/api/emails/subscription-expiring-urgent',
      jsonb_build_object(
        'authUserId', user_record.user_id,
        'name', user_record.display_name,
        'tier', user_record.subscription_tier,
        'expiresAt', user_record.subscription_expires_at,
        'urgent', true
      )
    );
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."send_subscription_expiring_reminders"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_subscription_expiring_reminders"() IS 'Sends reminders 7 days and 1 day before expiry';



CREATE OR REPLACE FUNCTION "public"."send_targeted_announcement"("p_title" "text", "p_message" "text", "p_role_filter" "text"[] DEFAULT NULL::"text"[], "p_city_filter" "text" DEFAULT NULL::"text", "p_action_url" "text" DEFAULT NULL::"text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_notifications_created INTEGER;
  v_query TEXT;
BEGIN
  -- Build dynamic notification insert based on filters
  INSERT INTO notifications (
    recipient_id,
    user_id,
    type,
    category,
    title,
    message,
    action_url,
    data
  )
  SELECT
    up.user_id,
    up.user_id,
    'targeted_announcement',
    'system',
    p_title,
    p_message,
    p_action_url,
    jsonb_build_object(
      'announcement_type', 'targeted',
      'filters', jsonb_build_object(
        'roles', p_role_filter,
        'city', p_city_filter
      ),
      'sent_at', NOW()
    )
  FROM users_profile up
  LEFT JOIN notification_preferences np ON up.user_id = np.user_id
  WHERE COALESCE(np.system_notifications, true) = true
    AND COALESCE(np.in_app_enabled, true) = true
    AND (p_role_filter IS NULL OR up.role_flags && p_role_filter)
    AND (p_city_filter IS NULL OR up.city = p_city_filter);

  GET DIAGNOSTICS v_notifications_created = ROW_COUNT;

  RAISE NOTICE 'Targeted announcement sent: % notifications created (roles: %, city: %)',
    v_notifications_created, p_role_filter, p_city_filter;

  RETURN v_notifications_created;
END;
$$;


ALTER FUNCTION "public"."send_targeted_announcement"("p_title" "text", "p_message" "text", "p_role_filter" "text"[], "p_city_filter" "text", "p_action_url" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_targeted_announcement"("p_title" "text", "p_message" "text", "p_role_filter" "text"[], "p_city_filter" "text", "p_action_url" "text") IS 'Admin helper function to send targeted announcements to specific user segments (by role or city). Returns count of notifications created.';



CREATE OR REPLACE FUNCTION "public"."send_unread_messages_digest"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_record RECORD;
  unread_count INTEGER;
  unread_messages JSONB;
BEGIN
  -- Find users with unread messages
  FOR user_record IN
    SELECT DISTINCT 
      up.user_id,
      up.display_name
    FROM users_profile up
    WHERE EXISTS (
      SELECT 1 
      FROM messages m
      WHERE m.to_user_id = up.id
      AND m.read_at IS NULL
      AND m.created_at >= NOW() - INTERVAL '24 hours'
    )
  LOOP
    -- Count unread messages
    SELECT COUNT(*) INTO unread_count
    FROM messages m
    JOIN users_profile up ON m.to_user_id = up.id
    WHERE up.user_id = user_record.user_id
    AND m.read_at IS NULL;
    
    -- Get unread message previews (max 5)
    SELECT json_agg(
      json_build_object(
        'senderName', sender.display_name,
        'gigTitle', g.title,
        'preview', substring(m.body, 1, 50),
        'sentAt', m.created_at
      )
    ) INTO unread_messages
    FROM messages m
    JOIN users_profile sender ON m.from_user_id = sender.id
    JOIN users_profile recipient ON m.to_user_id = recipient.id
    JOIN gigs g ON m.gig_id = g.id
    WHERE recipient.user_id = user_record.user_id
    AND m.read_at IS NULL
    ORDER BY m.created_at DESC
    LIMIT 5;
    
    -- Send digest
    PERFORM call_email_api(
      '/api/emails/messaging/unread-digest',
      jsonb_build_object(
        'authUserId', user_record.user_id,
        'name', user_record.display_name,
        'unreadCount', unread_count,
        'messages', unread_messages
      )
    );
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."send_unread_messages_digest"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_unread_messages_digest"() IS 'Sends digest of unread messages twice daily';



CREATE OR REPLACE FUNCTION "public"."send_weekly_digest"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_record RECORD;
  user_stats JSONB;
BEGIN
  FOR user_record IN
    SELECT user_id, id, display_name, role_flags
    FROM users_profile
  LOOP
    -- Gather user stats for the week
    SELECT jsonb_build_object(
      'newGigs', (
        SELECT COUNT(*) FROM gigs 
        WHERE owner_user_id = user_record.id 
        AND created_at >= NOW() - INTERVAL '7 days'
      ),
      'newApplications', (
        SELECT COUNT(*) FROM applications a
        JOIN gigs g ON a.gig_id = g.id
        WHERE g.owner_user_id = user_record.id 
        AND a.applied_at >= NOW() - INTERVAL '7 days'
      ),
      'profileViews', 0, -- Placeholder
      'newFollowers', 0  -- Placeholder
    ) INTO user_stats;
    
    -- Only send if there's activity
    IF (user_stats->>'newGigs')::int > 0 OR (user_stats->>'newApplications')::int > 0 THEN
      PERFORM call_email_api(
        '/api/emails/weekly-digest',
        jsonb_build_object(
          'authUserId', user_record.user_id,
          'name', user_record.display_name,
          'stats', user_stats
        )
      );
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."send_weekly_digest"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_weekly_digest"() IS 'Weekly activity summary';



CREATE OR REPLACE FUNCTION "public"."share_contact_details"("p_conversation_id" "uuid", "p_conversation_type" "text", "p_offer_id" "uuid", "p_sharer_id" "uuid", "p_recipient_id" "uuid", "p_contact_type" "text", "p_contact_value" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  sharing_id UUID;
BEGIN
  -- Insert contact sharing record
  INSERT INTO contact_sharing (
    conversation_id,
    conversation_type,
    offer_id,
    sharer_id,
    recipient_id,
    contact_type,
    contact_value
  ) VALUES (
    p_conversation_id,
    p_conversation_type,
    p_offer_id,
    p_sharer_id,
    p_recipient_id,
    p_contact_type,
    p_contact_value
  ) RETURNING id INTO sharing_id;
  
  RETURN sharing_id;
END;
$$;


ALTER FUNCTION "public"."share_contact_details"("p_conversation_id" "uuid", "p_conversation_type" "text", "p_offer_id" "uuid", "p_sharer_id" "uuid", "p_recipient_id" "uuid", "p_contact_type" "text", "p_contact_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_analytics_data"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Sync credit pools to platform_credits
    INSERT INTO platform_credits (provider, current_balance, low_balance_threshold)
    SELECT 
        provider,
        available_balance,
        auto_refill_threshold
    FROM credit_pools
    ON CONFLICT (provider) DO UPDATE SET
        current_balance = EXCLUDED.current_balance,
        low_balance_threshold = EXCLUDED.low_balance_threshold,
        updated_at = NOW();
        
    -- You can add more sync logic here as needed
END;
$$;


ALTER FUNCTION "public"."sync_analytics_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."table_exists"("table_name" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND tables.table_name = table_exists.table_name
  );
END;
$$;


ALTER FUNCTION "public"."table_exists"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."table_exists_marketplace"("table_name" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND tables.table_name = table_exists_marketplace.table_name
  );
END;
$$;


ALTER FUNCTION "public"."table_exists_marketplace"("table_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."table_exists_marketplace"("table_name" "text") IS 'Helper function to check if marketplace table exists';



CREATE OR REPLACE FUNCTION "public"."test_user_settings_access"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- This function will be called with the current user's context
    RETURN EXISTS (
        SELECT 1 FROM user_settings 
        WHERE user_id = auth.uid()
    );
END;
$$;


ALTER FUNCTION "public"."test_user_settings_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_preset_usage"("preset_uuid" "uuid", "usage_type_param" "text", "usage_data_param" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_usage_id UUID;
    preset_creator_id UUID;
    usage_count INTEGER;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Get current user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Get preset creator
    SELECT user_id INTO preset_creator_id FROM presets WHERE id = preset_uuid;

    -- Insert usage record (the trigger will auto-increment usage_count)
    -- Remove the unique constraint to allow multiple uses per day
    INSERT INTO preset_usage (preset_id, user_id, usage_type, usage_data)
    VALUES (preset_uuid, auth.uid(), usage_type_param, usage_data_param)
    RETURNING id INTO new_usage_id;

    -- Only create notification if preset has a creator (not system presets)
    IF preset_creator_id IS NOT NULL AND preset_creator_id != auth.uid() THEN
        -- Count total usage for this preset in last 24h
        SELECT COUNT(*) INTO usage_count
        FROM preset_usage
        WHERE preset_id = preset_uuid
        AND created_at >= NOW() - INTERVAL '24 hours';

        -- Create notification based on usage type
        CASE usage_type_param
            WHEN 'playground_generation' THEN
                notification_title := 'Your preset was used in playground';
                notification_message := 'Someone used your preset to generate an image. Click to view and verify if needed.';
            WHEN 'showcase_creation' THEN
                notification_title := 'Your preset was featured in a showcase';
                notification_message := 'Your preset was used to create a showcase. Check it out!';
            WHEN 'sample_verification' THEN
                notification_title := 'New sample created for your preset';
                notification_message := 'A new sample was created for your preset. Review and verify if needed.';
            ELSE
                notification_title := 'Your preset was used';
                notification_message := 'Someone used your preset. Check it out!';
        END CASE;

        -- Insert notification
        INSERT INTO preset_notifications (
            preset_id,
            creator_id,
            notification_type,
            title,
            message,
            data
        ) VALUES (
            preset_uuid,
            preset_creator_id,
            usage_type_param,
            notification_title,
            notification_message,
            jsonb_build_object(
                'usage_count_24h', usage_count,
                'usage_data', usage_data_param
            )
        );
    END IF;

    RETURN COALESCE(new_usage_id, gen_random_uuid());
END;
$$;


ALTER FUNCTION "public"."track_preset_usage"("preset_uuid" "uuid", "usage_type_param" "text", "usage_data_param" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_treatment_view"("p_treatment_id" "uuid", "p_session_id" "text" DEFAULT NULL::"text", "p_referrer" "text" DEFAULT NULL::"text", "p_user_agent" "text" DEFAULT NULL::"text", "p_ip_address" "inet" DEFAULT NULL::"inet") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO treatment_analytics (
    treatment_id, viewer_id, session_id, referrer, user_agent, ip_address
  ) VALUES (
    p_treatment_id, auth.uid(), p_session_id, p_referrer, p_user_agent, p_ip_address
  );
END;
$$;


ALTER FUNCTION "public"."track_treatment_view"("p_treatment_id" "uuid", "p_session_id" "text", "p_referrer" "text", "p_user_agent" "text", "p_ip_address" "inet") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_application_milestone"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  gig_record RECORD;
  application_count INTEGER;
  milestone_percentage INTEGER;
BEGIN
  SELECT * INTO gig_record FROM gigs WHERE id = NEW.gig_id;
  SELECT COUNT(*) INTO application_count FROM applications WHERE gig_id = NEW.gig_id;
  
  milestone_percentage := (application_count * 100) / gig_record.max_applicants;
  
  IF milestone_percentage >= 50 AND milestone_percentage < 55 THEN
    PERFORM call_email_api(
      '/api/emails/application-milestone',
      jsonb_build_object(
        'gigId', NEW.gig_id,
        'ownerId', gig_record.owner_user_id,
        'applicationCount', application_count,
        'maxApplicants', gig_record.max_applicants,
        'milestone', 50
      )
    );
  ELSIF milestone_percentage >= 80 AND milestone_percentage < 85 THEN
    PERFORM call_email_api(
      '/api/emails/application-milestone',
      jsonb_build_object(
        'gigId', NEW.gig_id,
        'ownerId', gig_record.owner_user_id,
        'applicationCount', application_count,
        'maxApplicants', gig_record.max_applicants,
        'milestone', 80
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_application_milestone"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_application_status_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    PERFORM call_email_api(
      '/api/emails/application-status',
      jsonb_build_object(
        'applicationId', NEW.id,
        'gigId', NEW.gig_id,
        'applicantId', NEW.applicant_user_id,
        'oldStatus', OLD.status,
        'newStatus', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_application_status_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_application_status_email"() IS 'Sends status update emails to applicants';



CREATE OR REPLACE FUNCTION "public"."trigger_application_withdrawn_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status = 'WITHDRAWN' AND (OLD.status IS NULL OR OLD.status != 'WITHDRAWN') THEN
    PERFORM call_email_api(
      '/api/emails/application-withdrawn',
      jsonb_build_object(
        'applicationId', NEW.id,
        'gigId', NEW.gig_id,
        'applicantId', NEW.applicant_user_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_application_withdrawn_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_application_withdrawn_email"() IS 'Notifies gig owner when applicant withdraws';



CREATE OR REPLACE FUNCTION "public"."trigger_applications_closed_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status = 'APPLICATIONS_CLOSED' AND OLD.status = 'PUBLISHED' THEN
    PERFORM call_email_api(
      '/api/emails/applications-closed',
      jsonb_build_object(
        'gigId', NEW.id,
        'ownerId', NEW.owner_user_id,
        'gigTitle', NEW.title,
        'applicationCount', (SELECT COUNT(*) FROM applications WHERE gig_id = NEW.id)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_applications_closed_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_applications_closed_email"() IS 'Notifies owner when application period ends';



CREATE OR REPLACE FUNCTION "public"."trigger_credits_low_warning"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Warn when credits drop below 5
  IF NEW.credits < 5 AND (OLD.credits IS NULL OR OLD.credits >= 5) THEN
    PERFORM call_email_api(
      '/api/emails/credits-low',
      jsonb_build_object(
        'authUserId', NEW.user_id,
        'remainingCredits', NEW.credits
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_credits_low_warning"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_gig_cancelled_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status = 'CANCELLED' AND (OLD IS NULL OR OLD.status != 'CANCELLED') THEN
    PERFORM call_email_api(
      '/api/emails/gig-cancelled',
      jsonb_build_object(
        'gigId', NEW.id,
        'ownerId', NEW.owner_user_id,
        'gigTitle', NEW.title
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_gig_cancelled_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_gig_cancelled_email"() IS 'Notifies applicants when gig is cancelled';



CREATE OR REPLACE FUNCTION "public"."trigger_gig_completed_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND (OLD IS NULL OR OLD.status != 'COMPLETED') THEN
    PERFORM call_email_api(
      '/api/emails/gig-completed',
      jsonb_build_object(
        'gigId', NEW.id,
        'ownerId', NEW.owner_user_id,
        'gigTitle', NEW.title
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_gig_completed_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_gig_completed_email"() IS 'Notifies both parties when gig is completed';



CREATE OR REPLACE FUNCTION "public"."trigger_gig_published_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status = 'PUBLISHED' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'PUBLISHED') THEN
    PERFORM call_email_api(
      '/api/emails/gig-published',
      jsonb_build_object('gigId', NEW.id, 'ownerId', NEW.owner_user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_gig_published_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_gig_published_email"() IS 'Sends notification when gig is published';



CREATE OR REPLACE FUNCTION "public"."trigger_message_received_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM call_email_api(
    '/api/emails/messaging/new-message',
    jsonb_build_object(
      'messageId', NEW.id,
      'gigId', NEW.gig_id,
      'fromUserId', NEW.from_user_id,
      'toUserId', NEW.to_user_id,
      'messagePreview', substring(NEW.body, 1, 100)
    )
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_message_received_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_message_received_email"() IS 'Notifies recipient of new message';



CREATE OR REPLACE FUNCTION "public"."trigger_new_application_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM call_email_api(
    '/api/emails/new-application',
    jsonb_build_object(
      'applicationId', NEW.id,
      'gigId', NEW.gig_id,
      'applicantId', NEW.applicant_user_id
    )
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_new_application_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_new_application_email"() IS 'Notifies contributor of new application';



CREATE OR REPLACE FUNCTION "public"."trigger_preset_listing_status_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  seller_auth_id UUID;
  preset_name TEXT;
BEGIN
  -- Only trigger when status changes
  IF NEW.status != OLD.status THEN
    
    SELECT user_id INTO seller_auth_id
    FROM users_profile
    WHERE user_id = NEW.seller_user_id;
    
    SELECT COALESCE(title, name) INTO preset_name
    FROM presets
    WHERE id = NEW.preset_id;
    
    -- Approved
    IF NEW.status = 'approved' AND OLD.status = 'pending_review' THEN
      PERFORM call_email_api(
        '/api/emails/marketplace/listing-approved',
        jsonb_build_object(
          'authUserId', seller_auth_id,
          'presetName', preset_name,
          'listingTitle', NEW.marketplace_title,
          'salePrice', NEW.sale_price,
          'listingId', NEW.id
        )
      );
    
    -- Rejected
    ELSIF NEW.status = 'rejected' THEN
      PERFORM call_email_api(
        '/api/emails/marketplace/listing-rejected',
        jsonb_build_object(
          'authUserId', seller_auth_id,
          'presetName', preset_name,
          'listingTitle', NEW.marketplace_title,
          'rejectionReason', NEW.rejection_reason,
          'listingId', NEW.id
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_preset_listing_status_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_preset_listing_status_email"() IS 'Notifies seller of listing approval/rejection';



CREATE OR REPLACE FUNCTION "public"."trigger_preset_purchase_confirmation_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  buyer_auth_id UUID;
  preset_name TEXT;
  seller_name TEXT;
BEGIN
  IF NEW.payment_status = 'completed' THEN
    
    SELECT user_id INTO buyer_auth_id
    FROM users_profile
    WHERE user_id = NEW.buyer_user_id;
    
    SELECT display_name INTO seller_name
    FROM users_profile
    WHERE user_id = NEW.seller_user_id;
    
    SELECT COALESCE(title, name) INTO preset_name
    FROM presets
    WHERE id = NEW.preset_id;
    
    PERFORM call_email_api(
      '/api/emails/marketplace/preset-purchased',
      jsonb_build_object(
        'authUserId', buyer_auth_id,
        'presetName', preset_name,
        'sellerName', seller_name,
        'purchasePrice', NEW.purchase_price,
        'purchaseId', NEW.id,
        'presetId', NEW.preset_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_preset_purchase_confirmation_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_preset_purchase_confirmation_email"() IS 'Sends purchase confirmation to buyer';



CREATE OR REPLACE FUNCTION "public"."trigger_preset_review_received_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  seller_auth_id UUID;
  reviewer_name TEXT;
  preset_name TEXT;
  purchase_record RECORD;
BEGIN
  -- Get purchase details
  SELECT * INTO purchase_record
  FROM preset_purchases
  WHERE id = NEW.purchase_id;
  
  -- Get seller auth ID
  SELECT user_id INTO seller_auth_id
  FROM users_profile
  WHERE user_id = purchase_record.seller_user_id;
  
  -- Get reviewer name
  SELECT display_name INTO reviewer_name
  FROM users_profile
  WHERE user_id = NEW.reviewer_user_id;
  
  -- Get preset name
  SELECT COALESCE(title, name) INTO preset_name
  FROM presets
  WHERE id = NEW.preset_id;
  
  PERFORM call_email_api(
    '/api/emails/marketplace/review-received',
    jsonb_build_object(
      'authUserId', seller_auth_id,
      'reviewerName', reviewer_name,
      'presetName', preset_name,
      'rating', NEW.rating,
      'reviewTitle', NEW.title,
      'reviewComment', NEW.comment,
      'reviewId', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_preset_review_received_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_preset_review_received_email"() IS 'Notifies seller when preset is reviewed';



CREATE OR REPLACE FUNCTION "public"."trigger_preset_sold_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    PERFORM call_email_api(
      '/api/emails/marketplace/preset-sold',
      jsonb_build_object(
        'purchaseId', NEW.id,
        'presetId', NEW.preset_id,
        'buyerUserId', NEW.buyer_user_id,
        'sellerUserId', NEW.seller_user_id,
        'purchasePrice', NEW.purchase_price,
        'sellerPayout', NEW.seller_payout
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_preset_sold_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_preset_sold_email"() IS 'Notifies seller when their preset is purchased';



CREATE OR REPLACE FUNCTION "public"."trigger_subscription_change_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.subscription_tier != OLD.subscription_tier THEN
    PERFORM call_email_api(
      '/api/emails/subscription-changed',
      jsonb_build_object(
        'authUserId', NEW.user_id,
        'name', NEW.display_name,
        'oldTier', OLD.subscription_tier,
        'newTier', NEW.subscription_tier
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_subscription_change_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_subscription_change_email"() IS 'Notifies user of subscription changes';



CREATE OR REPLACE FUNCTION "public"."trigger_welcome_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM call_email_api(
    '/api/emails/welcome',
    jsonb_build_object(
      'authUserId', NEW.user_id,
      'name', NEW.display_name,
      'role', (
        CASE 
          WHEN 'CONTRIBUTOR' = ANY(NEW.role_flags) AND 'TALENT' = ANY(NEW.role_flags) THEN 'BOTH'
          WHEN 'CONTRIBUTOR' = ANY(NEW.role_flags) THEN 'CONTRIBUTOR'
          ELSE 'TALENT'
        END
      )
    )
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_welcome_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_welcome_email"() IS 'Sends welcome email when user profile is created';



CREATE OR REPLACE FUNCTION "public"."unblock_user"("blocked_profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  blocker_profile_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Get the current user's profile ID
  SELECT id INTO blocker_profile_id
  FROM users_profile
  WHERE user_id = auth.uid();
  
  IF blocker_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Delete the block
  DELETE FROM user_blocks
  WHERE blocker_user_id = blocker_profile_id
  AND blocked_user_id = blocked_profile_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the unblocking event if a block was removed
  IF deleted_count > 0 THEN
    PERFORM log_security_event(
      'user_unblocked',
      auth.uid(),
      jsonb_build_object(
        'unblocked_user_id', blocked_profile_id
      )
    );
  END IF;
  
  RETURN deleted_count > 0;
END;
$$;


ALTER FUNCTION "public"."unblock_user"("blocked_profile_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."unblock_user"("blocked_profile_id" "uuid") IS 'Unblock a previously blocked user';



CREATE OR REPLACE FUNCTION "public"."update_cinematic_presets_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_cinematic_presets_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_collab_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_collab_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_last_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_equipment_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_equipment_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_featured_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_featured_requests_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_invitation_responded_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'declined') THEN
    NEW.responded_at := NOW();
    
    -- If accepted, also set accepted_at
    IF NEW.status = 'accepted' THEN
      NEW.accepted_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_invitation_responded_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_listing_comment_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE listings 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE listings 
    SET comment_count = comment_count - 1 
    WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_listing_comment_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_listing_images_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_listing_images_updated_at"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_notification_preferences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notification_preferences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notifications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notifications_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_predefined_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_predefined_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_preset_images_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_preset_images_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_preset_latest_promoted_image"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    preset_name_from_metadata TEXT;
    preset_record RECORD;
BEGIN
    -- Only proceed if is_verified was set to true
    IF NEW.is_verified = TRUE AND (OLD.is_verified IS NULL OR OLD.is_verified = FALSE) THEN

        -- Get the preset name from the gallery image's exif_json metadata
        preset_name_from_metadata := NEW.exif_json->'generation_metadata'->>'style';

        IF preset_name_from_metadata IS NOT NULL THEN
            -- Try to find matching preset in regular presets table (case-insensitive)
            SELECT id, name INTO preset_record
            FROM presets
            WHERE LOWER(name) = LOWER(preset_name_from_metadata)
            LIMIT 1;

            IF FOUND THEN
                -- Update the regular preset's latest promoted image
                UPDATE presets
                SET latest_promoted_image_url = NEW.image_url
                WHERE id = preset_record.id;

                RAISE NOTICE 'Updated latest_promoted_image_url for preset: % (ID: %)', preset_record.name, preset_record.id;
            ELSE
                -- Try cinematic_presets table
                SELECT id, name INTO preset_record
                FROM cinematic_presets
                WHERE LOWER(name) = LOWER(preset_name_from_metadata)
                LIMIT 1;

                IF FOUND THEN
                    -- Update the cinematic preset's latest promoted image
                    UPDATE cinematic_presets
                    SET latest_promoted_image_url = NEW.image_url
                    WHERE id = preset_record.id;

                    RAISE NOTICE 'Updated latest_promoted_image_url for cinematic preset: % (ID: %)', preset_record.name, preset_record.id;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_preset_latest_promoted_image"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_preset_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment likes_count when a like is added
        UPDATE presets 
        SET likes_count = likes_count + 1,
            updated_at = NOW()
        WHERE id = NEW.preset_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement likes_count when a like is removed
        UPDATE presets 
        SET likes_count = GREATEST(likes_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.preset_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_preset_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_preset_likes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_preset_likes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_preset_notifications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_preset_notifications_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_preset_usage_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.created_at = COALESCE(NEW.created_at, NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_preset_usage_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_presets_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_presets_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.profile_completion_percentage := calculate_profile_completion(NEW.user_id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_profile_completion"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_showcase_comments_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE showcases
    SET comments_count = comments_count + 1,
        updated_at = NOW()
    WHERE id = NEW.showcase_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE showcases
    SET comments_count = GREATEST(comments_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.showcase_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_showcase_comments_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_showcase_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE showcases
    SET likes_count = likes_count + 1,
        updated_at = NOW()
    WHERE id = NEW.showcase_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE showcases
    SET likes_count = GREATEST(likes_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.showcase_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_showcase_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_treatment_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_treatment_updated_at"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_user_blocks_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_blocks_updated_at"() OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "purchased_credits_balance" integer DEFAULT 0
);


ALTER TABLE "public"."user_credits" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_credits"."monthly_allowance" IS 'Subscription tier allowance. Resets to this value every month.';



COMMENT ON COLUMN "public"."user_credits"."current_balance" IS 'Total available credits = monthly_allowance (resets) + purchased_credits_balance (persists)';



COMMENT ON COLUMN "public"."user_credits"."purchased_credits_balance" IS 'Credits purchased via lootbox or credit packages. These NEVER expire and roll over indefinitely.';



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


CREATE OR REPLACE FUNCTION "public"."update_user_skills_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_skills_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_vibe_analytics"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  vibe_id UUID;
  total_usage INTEGER;
BEGIN
  -- Only process if vibe_ids changed or new moodboard
  IF (TG_OP = 'INSERT' OR NEW.vibe_ids IS DISTINCT FROM OLD.vibe_ids) THEN
    -- Update analytics for each vibe in the moodboard
    FOREACH vibe_id IN ARRAY NEW.vibe_ids
    LOOP
      -- Insert or update vibe usage
      INSERT INTO public.user_vibe_analytics (user_id, vibe_id, usage_count, last_used_at)
      VALUES (NEW.owner_user_id, vibe_id, 1, NOW())
      ON CONFLICT (user_id, vibe_id) 
      DO UPDATE SET 
        usage_count = user_vibe_analytics.usage_count + 1,
        last_used_at = NOW();
        
      -- Update global usage count in vibes_master
      UPDATE public.vibes_master 
      SET usage_count = usage_count + 1 
      WHERE id = vibe_id;
    END LOOP;
    
    -- Calculate confidence scores for this user
    SELECT COUNT(*) INTO total_usage 
    FROM public.user_vibe_analytics 
    WHERE user_id = NEW.owner_user_id;
    
    -- Update confidence scores (relative frequency)
    UPDATE public.user_vibe_analytics 
    SET confidence_score = LEAST(1.0, usage_count::DECIMAL / GREATEST(1, total_usage::DECIMAL))
    WHERE user_id = NEW.owner_user_id;
    
    -- Update user's primary vibe_tags based on top confidence scores
    UPDATE public.users_profile 
    SET vibe_tags = (
      SELECT ARRAY_AGG(vm.name ORDER BY uva.confidence_score DESC)
      FROM public.user_vibe_analytics uva
      JOIN public.vibes_master vm ON vm.id = uva.vibe_id
      WHERE uva.user_id = NEW.owner_user_id
      AND uva.confidence_score > 0.1 -- Only include meaningful vibes
      LIMIT 5
    )
    WHERE user_id = NEW.owner_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_vibe_analytics"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_user_vibe_analytics"() IS 'Automatically updates user vibe analytics when moodboard vibes change';



CREATE OR REPLACE FUNCTION "public"."update_verification_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_verification_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_user_settings"("user_uuid" "uuid", "settings_data" "jsonb") RETURNS TABLE("id" "uuid", "user_id" "uuid", "profile_id" "uuid", "email_notifications" boolean, "push_notifications" boolean, "marketing_emails" boolean, "profile_visibility" character varying, "show_contact_info" boolean, "two_factor_enabled" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    profile_uuid UUID;
    existing_settings RECORD;
BEGIN
    -- Get profile_id for the user
    SELECT up.id INTO profile_uuid FROM users_profile up WHERE up.user_id = user_uuid LIMIT 1;
    
    -- Check if settings already exist
    SELECT * INTO existing_settings FROM user_settings 
    WHERE user_id = user_uuid OR profile_id = profile_uuid
    LIMIT 1;
    
    IF existing_settings IS NOT NULL THEN
        -- Update existing settings
        UPDATE user_settings SET
            email_notifications = COALESCE((settings_data->>'email_notifications')::BOOLEAN, existing_settings.email_notifications),
            push_notifications = COALESCE((settings_data->>'push_notifications')::BOOLEAN, existing_settings.push_notifications),
            marketing_emails = COALESCE((settings_data->>'marketing_emails')::BOOLEAN, existing_settings.marketing_emails),
            profile_visibility = COALESCE(settings_data->>'profile_visibility', existing_settings.profile_visibility),
            show_contact_info = COALESCE((settings_data->>'show_contact_info')::BOOLEAN, existing_settings.show_contact_info),
            two_factor_enabled = COALESCE((settings_data->>'two_factor_enabled')::BOOLEAN, existing_settings.two_factor_enabled),
            updated_at = NOW()
        WHERE user_settings.id = existing_settings.id;
        
        RETURN QUERY SELECT * FROM user_settings WHERE user_settings.id = existing_settings.id;
    ELSE
        -- Insert new settings
        RETURN QUERY INSERT INTO user_settings (
            user_id,
            profile_id,
            email_notifications,
            push_notifications,
            marketing_emails,
            profile_visibility,
            show_contact_info,
            two_factor_enabled,
            updated_at
        )
        VALUES (
            user_uuid,
            profile_uuid,
            COALESCE((settings_data->>'email_notifications')::BOOLEAN, true),
            COALESCE((settings_data->>'push_notifications')::BOOLEAN, true),
            COALESCE((settings_data->>'marketing_emails')::BOOLEAN, false),
            COALESCE(settings_data->>'profile_visibility', 'public'),
            COALESCE((settings_data->>'show_contact_info')::BOOLEAN, true),
            COALESCE((settings_data->>'two_factor_enabled')::BOOLEAN, false),
            NOW()
        )
        RETURNING *;
    END IF;
END;
$$;


ALTER FUNCTION "public"."upsert_user_settings"("user_uuid" "uuid", "settings_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."upsert_user_settings"("user_uuid" "uuid", "settings_data" "jsonb") IS 'Safely upserts user settings with proper conflict resolution';



CREATE OR REPLACE FUNCTION "public"."upsert_user_settings_safe"("user_uuid" "uuid", "settings_data" "jsonb") RETURNS TABLE("id" "uuid", "user_id" "uuid", "email_notifications" boolean, "push_notifications" boolean, "marketing_emails" boolean, "profile_visibility" character varying, "show_contact_info" boolean, "two_factor_enabled" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "profile_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        WITH upserted AS (
            INSERT INTO user_settings (
                user_id,
                email_notifications,
                push_notifications,
                marketing_emails,
                profile_visibility,
                show_contact_info,
                two_factor_enabled
            )
            VALUES (
                %L,
                %L,
                %L,
                %L,
                %L,
                %L,
                %L
            )
            ON CONFLICT (user_id) DO UPDATE SET
                email_notifications = %L,
                push_notifications = %L,
                marketing_emails = %L,
                profile_visibility = %L,
                show_contact_info = %L,
                two_factor_enabled = %L,
                updated_at = NOW()
            RETURNING *
        )
        SELECT * FROM upserted
    ',
        user_uuid,
        COALESCE((settings_data->>'email_notifications')::BOOLEAN, true),
        COALESCE((settings_data->>'push_notifications')::BOOLEAN, true),
        COALESCE((settings_data->>'marketing_emails')::BOOLEAN, false),
        COALESCE(settings_data->>'profile_visibility', 'public'),
        COALESCE((settings_data->>'show_contact_info')::BOOLEAN, true),
        COALESCE((settings_data->>'two_factor_enabled')::BOOLEAN, false),
        COALESCE((settings_data->>'email_notifications')::BOOLEAN, true),
        COALESCE((settings_data->>'push_notifications')::BOOLEAN, true),
        COALESCE((settings_data->>'marketing_emails')::BOOLEAN, false),
        COALESCE(settings_data->>'profile_visibility', 'public'),
        COALESCE((settings_data->>'show_contact_info')::BOOLEAN, true),
        COALESCE((settings_data->>'two_factor_enabled')::BOOLEAN, false)
    );
END;
$$;


ALTER FUNCTION "public"."upsert_user_settings_safe"("user_uuid" "uuid", "settings_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_user_skill"("p_profile_id" "uuid", "p_skill_name" "text", "p_skill_type" "public"."skill_type" DEFAULT 'creative'::"public"."skill_type", "p_proficiency_level" "public"."proficiency_level" DEFAULT 'intermediate'::"public"."proficiency_level", "p_years_experience" integer DEFAULT NULL::integer, "p_description" "text" DEFAULT NULL::"text", "p_is_featured" boolean DEFAULT false) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_skill_id UUID;
BEGIN
    INSERT INTO user_skills (
        profile_id,
        skill_name,
        skill_type,
        proficiency_level,
        years_experience,
        description,
        is_featured
    ) VALUES (
        p_profile_id,
        p_skill_name,
        p_skill_type,
        p_proficiency_level,
        p_years_experience,
        p_description,
        p_is_featured
    )
    ON CONFLICT (profile_id, skill_name) 
    DO UPDATE SET
        skill_type = EXCLUDED.skill_type,
        proficiency_level = EXCLUDED.proficiency_level,
        years_experience = EXCLUDED.years_experience,
        description = EXCLUDED.description,
        is_featured = EXCLUDED.is_featured,
        updated_at = NOW()
    RETURNING id INTO v_skill_id;
    
    RETURN v_skill_id;
END;
$$;


ALTER FUNCTION "public"."upsert_user_skill"("p_profile_id" "uuid", "p_skill_name" "text", "p_skill_type" "public"."skill_type", "p_proficiency_level" "public"."proficiency_level", "p_years_experience" integer, "p_description" "text", "p_is_featured" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."upsert_user_skill"("p_profile_id" "uuid", "p_skill_name" "text", "p_skill_type" "public"."skill_type", "p_proficiency_level" "public"."proficiency_level", "p_years_experience" integer, "p_description" "text", "p_is_featured" boolean) IS 'Insert or update a user skill with experience details';



CREATE OR REPLACE FUNCTION "public"."user_has_project_access"("p_user_id" "uuid", "p_project_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_visibility TEXT;
  v_creator_id UUID;
BEGIN
  -- Get project visibility and creator
  SELECT visibility, creator_id INTO v_visibility, v_creator_id
  FROM collab_projects
  WHERE id = p_project_id;
  
  -- Public projects are accessible to everyone
  IF v_visibility = 'public' THEN
    RETURN TRUE;
  END IF;
  
  -- Creator has access
  IF v_creator_id = p_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a participant
  IF EXISTS (
    SELECT 1 FROM collab_participants
    WHERE project_id = p_project_id
    AND user_id = p_user_id
    AND status = 'active'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has an accepted invitation
  IF EXISTS (
    SELECT 1 FROM collab_invitations
    WHERE project_id = p_project_id
    AND invitee_id = p_user_id
    AND status = 'accepted'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."user_has_project_access"("p_user_id" "uuid", "p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_matches_gig_types"("user_primary_role" "text", "user_categories" "text"[], "gig_looking_for" "text"[]) RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Check if user's primary role matches any gig type
  IF user_primary_role = ANY(gig_looking_for) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if any user category matches any gig type
  IF user_categories && gig_looking_for THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."user_matches_gig_types"("user_primary_role" "text", "user_categories" "text"[], "gig_looking_for" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_owns_preset"("preset_id" "uuid", "user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    -- User created the preset
    SELECT 1 FROM presets
    WHERE id = preset_id
    AND presets.user_id = user_id
  ) OR EXISTS (
    -- User purchased the preset
    SELECT 1 FROM preset_purchases
    WHERE preset_purchases.preset_id = preset_id
    AND preset_purchases.buyer_user_id = user_id
  );
END;
$$;


ALTER FUNCTION "public"."user_owns_preset"("preset_id" "uuid", "user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_owns_preset"("preset_id" "uuid", "user_id" "uuid") IS 'Returns true if the user created or purchased the preset. Used for access control.';



CREATE OR REPLACE FUNCTION "public"."validate_and_create_custom_purpose"("p_custom_name" "text", "p_custom_display_name" "text" DEFAULT NULL::"text", "p_custom_description" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result JSONB;
  purpose_id UUID;
  sanitized_name TEXT;
  sanitized_display_name TEXT;
BEGIN
  -- Sanitize input
  sanitized_name := LOWER(TRIM(p_custom_name));
  sanitized_display_name := COALESCE(TRIM(p_custom_display_name), INITCAP(sanitized_name));
  
  -- Validate input
  IF sanitized_name IS NULL OR LENGTH(sanitized_name) < 2 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Purpose name must be at least 2 characters long'
    );
  END IF;
  
  IF LENGTH(sanitized_name) > 50 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Purpose name must be 50 characters or less'
    );
  END IF;
  
  -- Check if purpose already exists (case insensitive)
  SELECT id INTO purpose_id
  FROM equipment_request_purposes
  WHERE LOWER(name) = sanitized_name
  OR LOWER(display_name) = LOWER(sanitized_display_name);
  
  IF purpose_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'exists', true,
      'purpose_id', purpose_id,
      'message', 'Purpose already exists'
    );
  END IF;
  
  -- Create new custom purpose
  INSERT INTO equipment_request_purposes (
    name,
    display_name,
    description,
    icon,
    category,
    is_active,
    sort_order
  ) VALUES (
    sanitized_name,
    sanitized_display_name,
    COALESCE(p_custom_description, 'Custom purpose: ' || sanitized_display_name),
    'edit',
    'custom',
    true,
    999 -- Custom purposes appear last
  ) RETURNING id INTO purpose_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'exists', false,
    'purpose_id', purpose_id,
    'message', 'Custom purpose created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Failed to create custom purpose: ' || SQLERRM
  );
END;
$$;


ALTER FUNCTION "public"."validate_and_create_custom_purpose"("p_custom_name" "text", "p_custom_display_name" "text", "p_custom_description" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_and_create_custom_purpose"("p_custom_name" "text", "p_custom_display_name" "text", "p_custom_description" "text") IS 'Validates and creates custom purposes with duplicate checking';



CREATE OR REPLACE FUNCTION "public"."validate_contributor_roles"("user_roles" "text"[]) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    role_name TEXT;
    valid_role_count INTEGER;
BEGIN
    -- Check if all roles in the array exist in predefined_roles
    SELECT COUNT(*) INTO valid_role_count
    FROM unnest(user_roles) AS role_name
    WHERE role_name IN (
        SELECT name FROM predefined_roles WHERE is_active = true
    );
    
    -- Return true if all roles are valid
    RETURN valid_role_count = array_length(user_roles, 1);
END;
$$;


ALTER FUNCTION "public"."validate_contributor_roles"("user_roles" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_contributor_roles_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only validate if contributor_roles is not empty and user has CONTRIBUTOR role
    IF NEW.contributor_roles IS NOT NULL 
       AND array_length(NEW.contributor_roles, 1) > 0
       AND 'CONTRIBUTOR' = ANY(NEW.role_flags) THEN
        
        IF NOT validate_contributor_roles(NEW.contributor_roles) THEN
            RAISE EXCEPTION 'Invalid contributor role(s) found. All roles must exist in predefined_roles table.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_contributor_roles_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_instant_film_style"("style_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN style_name IN (
    'polaroid_originals', 'polaroid_600', 'instax_mini', 'instax_wide',
    'sx70', 'spectra', 'polaroid_go', 'vintage_instant',
    'bw_instant', 'sepia_instant', 'double_exposure_instant',
    'overexposed_instant', 'underexposed_instant', 'rainbow_border',
    'instant_portrait', 'instant_landscape'
  );
END;
$$;


ALTER FUNCTION "public"."validate_instant_film_style"("style_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_instant_film_style"("style_name" "text") IS 'Validates instant film style names';



CREATE OR REPLACE FUNCTION "public"."validate_message_before_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_profile_id UUID;
  sanitized_body TEXT;
  rate_check RECORD;
BEGIN
  -- Get the user's profile ID
  SELECT id INTO user_profile_id
  FROM users_profile
  WHERE user_id = auth.uid();
  
  -- Verify the user is sending as themselves
  IF NEW.from_user_id != user_profile_id THEN
    RAISE EXCEPTION 'Users can only send messages as themselves';
  END IF;
  
  -- Check if users can message each other (blocking check)
  IF NOT can_users_message(NEW.from_user_id, NEW.to_user_id) THEN
    -- Log the blocked message attempt
    PERFORM log_security_event(
      'blocked_message_attempt',
      auth.uid(),
      jsonb_build_object(
        'from_user_id', NEW.from_user_id,
        'to_user_id', NEW.to_user_id,
        'gig_id', NEW.gig_id
      )
    );
    RAISE EXCEPTION 'Cannot send message: user relationship blocked';
  END IF;
  
  -- Check rate limiting (both minute and hourly limits)
  SELECT * INTO rate_check FROM check_user_rate_limit(user_profile_id, 'messages', 1);
  IF NOT rate_check.allowed THEN
    PERFORM log_security_event(
      'rate_limit_exceeded',
      auth.uid(),
      jsonb_build_object(
        'resource_type', 'messages',
        'subscription_tier', rate_check.current_tier,
        'reset_at', rate_check.reset_at
      )
    );
    RAISE EXCEPTION 'Rate limit exceeded. You can send % more messages. Limit resets at %', 
      rate_check.remaining, rate_check.reset_at;
  END IF;
  
  -- Check hourly limit as well
  SELECT * INTO rate_check FROM check_user_rate_limit(user_profile_id, 'messages_hourly', 1);
  IF NOT rate_check.allowed THEN
    PERFORM log_security_event(
      'hourly_rate_limit_exceeded',
      auth.uid(),
      jsonb_build_object(
        'resource_type', 'messages_hourly',
        'subscription_tier', rate_check.current_tier,
        'reset_at', rate_check.reset_at
      )
    );
    RAISE EXCEPTION 'Hourly message limit exceeded. Limit resets at %', rate_check.reset_at;
  END IF;
  
  -- Sanitize message content
  sanitized_body := sanitize_message_content(NEW.body);
  
  -- Check if message is empty after sanitization
  IF length(trim(sanitized_body)) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  
  -- Check for spam
  IF is_spam_message(sanitized_body) THEN
    -- Log spam attempt
    PERFORM log_security_event(
      'spam_message_blocked',
      auth.uid(),
      jsonb_build_object(
        'original_body', NEW.body,
        'sanitized_body', sanitized_body,
        'to_user_id', NEW.to_user_id
      )
    );
    RAISE EXCEPTION 'Message flagged as potential spam';
  END IF;
  
  -- Check message length
  IF length(sanitized_body) > 2000 THEN
    RAISE EXCEPTION 'Message cannot exceed 2000 characters';
  END IF;
  
  -- Update the message body with sanitized content
  NEW.body := sanitized_body;
  
  -- Set default status if not provided
  IF NEW.status IS NULL THEN
    NEW.status := 'sent';
  END IF;
  
  -- Set conversation_id if not provided
  IF NEW.conversation_id IS NULL THEN
    NEW.conversation_id := generate_conversation_id(NEW.gig_id, NEW.from_user_id, NEW.to_user_id);
  END IF;
  
  -- Record rate limit usage after all checks pass
  PERFORM record_rate_limit_usage(user_profile_id, 'messages', 1);
  PERFORM record_rate_limit_usage(user_profile_id, 'messages_hourly', 1);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_message_before_insert"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_message_before_insert"() IS 'Validates and sanitizes messages before insertion, enforcing security policies';



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



CREATE OR REPLACE FUNCTION "public"."validate_preset_style"("style_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN style_name IN (
    -- Photographic Styles
    'Photorealistic', 'Cinematic', 'Portrait', 'Fashion', 'Editorial',
    'Commercial', 'Lifestyle', 'Street', 'Architecture', 'Nature',
    -- Artistic Styles
    'Impressionist', 'Renaissance', 'Baroque', 'Art Deco', 'Pop Art',
    'Watercolor', 'Oil Painting', 'Sketch', 'Abstract', 'Surreal',
    'Minimalist', 'Maximalist',
    -- Digital/Modern Styles
    'Digital Art', 'Concept Art', 'Illustration', 'Cartoon', 'Fantasy',
    'Sci-Fi', 'Cyberpunk',
    -- Classic Styles
    'Vintage', 'Artistic', 'Painterly'
  );
END;
$$;


ALTER FUNCTION "public"."validate_preset_style"("style_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_preset_style"("style_name" "text") IS 'Validates if a style name is one of the approved preset styles';



CREATE OR REPLACE FUNCTION "public"."validate_professional_skills"("user_skills" "text"[]) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    skill_name TEXT;
    valid_skill_count INTEGER;
BEGIN
    -- Check if all skills in the array exist in predefined_professional_skills
    SELECT COUNT(*) INTO valid_skill_count
    FROM unnest(user_skills) AS skill_name
    WHERE skill_name IN (
        SELECT skill_name FROM predefined_professional_skills WHERE is_active = true
    );
    
    -- Return true if all skills are valid
    RETURN valid_skill_count = array_length(user_skills, 1);
END;
$$;


ALTER FUNCTION "public"."validate_professional_skills"("user_skills" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_professional_skills_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only validate if professional_skills is not empty
    IF NEW.professional_skills IS NOT NULL 
       AND array_length(NEW.professional_skills, 1) > 0 THEN
        
        IF NOT validate_professional_skills(NEW.professional_skills) THEN
            RAISE EXCEPTION 'Invalid professional skill(s) found. All skills must exist in predefined_professional_skills table.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_professional_skills_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_reference_data"("p_reference_type" "text", "p_reference_title" "text", "p_reference_url" "text", "p_reference_description" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result JSONB;
BEGIN
  -- Validate reference type
  IF p_reference_type IS NOT NULL AND p_reference_type NOT IN ('moodboard', 'treatment', 'showcase', 'external_link', 'other') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid reference type. Must be one of: moodboard, treatment, showcase, external_link, other'
    );
  END IF;
  
  -- If reference type is provided, title is required
  IF p_reference_type IS NOT NULL AND (p_reference_title IS NULL OR TRIM(p_reference_title) = '') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reference title is required when reference type is specified'
    );
  END IF;
  
  -- Validate URL if provided
  IF p_reference_url IS NOT NULL AND p_reference_url != '' THEN
    IF NOT validate_reference_url(p_reference_url) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid URL format. Please provide a valid HTTP/HTTPS URL'
      );
    END IF;
  END IF;
  
  -- Validate title length
  IF p_reference_title IS NOT NULL AND LENGTH(p_reference_title) > 200 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reference title must be 200 characters or less'
    );
  END IF;
  
  -- Validate description length
  IF p_reference_description IS NOT NULL AND LENGTH(p_reference_description) > 1000 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reference description must be 1000 characters or less'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Reference data is valid'
  );
END;
$$;


ALTER FUNCTION "public"."validate_reference_data"("p_reference_type" "text", "p_reference_title" "text", "p_reference_url" "text", "p_reference_description" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_reference_data"("p_reference_type" "text", "p_reference_title" "text", "p_reference_url" "text", "p_reference_description" "text") IS 'Validates all reference data fields';



CREATE OR REPLACE FUNCTION "public"."validate_reference_url"("p_url" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
  -- Check if URL is valid format
  IF p_url IS NULL OR p_url = '' THEN
    RETURN TRUE; -- Allow empty URLs
  END IF;
  
  -- Basic URL validation
  IF p_url ~ '^https?://[^\s/$.?#].[^\s]*$' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$_$;


ALTER FUNCTION "public"."validate_reference_url"("p_url" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_reference_url"("p_url" "text") IS 'Validates if a URL has proper format';



CREATE OR REPLACE FUNCTION "public"."verify_preset_image"("image_id" "uuid", "verification_method_param" "text" DEFAULT 'manual'::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_id_var UUID := auth.uid();
  is_admin BOOLEAN := false;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM users_profile 
    WHERE users_profile.user_id = user_id_var 
    AND 'ADMIN'::user_role = ANY(users_profile.role_flags)
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can verify preset images';
  END IF;

  -- Update the image to verified
  UPDATE preset_images 
  SET 
    is_verified = true,
    verification_timestamp = NOW(),
    verification_method = verification_method_param
  WHERE id = image_id;

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."verify_preset_image"("image_id" "uuid", "verification_method_param" "text") OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."application_attachments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "media_id" "uuid" NOT NULL,
    "attachment_type" "public"."attachment_type" DEFAULT 'portfolio'::"public"."attachment_type" NOT NULL,
    "title" character varying(255),
    "description" "text",
    "display_order" integer DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."application_attachments" OWNER TO "postgres";


COMMENT ON TABLE "public"."application_attachments" IS 'Portfolio pieces, resumes, and documents attached to applications';



CREATE TABLE IF NOT EXISTS "public"."application_feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "from_user_id" "uuid" NOT NULL,
    "to_user_id" "uuid" NOT NULL,
    "feedback_type" "public"."feedback_type" DEFAULT 'general'::"public"."feedback_type" NOT NULL,
    "rating" integer,
    "feedback_text" "text",
    "is_public" boolean DEFAULT false,
    "is_constructive" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "application_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."application_feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."application_feedback" IS 'Feedback to help users improve applications';



CREATE TABLE IF NOT EXISTS "public"."application_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "from_user_id" "uuid" NOT NULL,
    "to_user_id" "uuid" NOT NULL,
    "message_body" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "message_type" character varying(20) DEFAULT 'message'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."application_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."application_messages" IS 'Direct messaging between applicants and gig owners';



CREATE TABLE IF NOT EXISTS "public"."application_status_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "previous_status" "public"."application_status",
    "new_status" "public"."application_status" NOT NULL,
    "changed_by" "uuid" NOT NULL,
    "reason" "text",
    "notes" "text",
    "automated" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."application_status_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."application_status_history" IS 'Tracks all status changes for applications';



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


CREATE TABLE IF NOT EXISTS "public"."aspect_ratios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'aspect'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."aspect_ratios" OWNER TO "postgres";


COMMENT ON TABLE "public"."aspect_ratios" IS 'Predefined aspect ratio options';



CREATE TABLE IF NOT EXISTS "public"."browser_cache_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" character varying(100) NOT NULL,
    "cache_strategy" character varying(50) NOT NULL,
    "cache_duration_hours" integer DEFAULT 24,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "cache_version" character varying(20) DEFAULT '1.0'::character varying,
    "is_active" boolean DEFAULT true,
    "hit_count" integer DEFAULT 0,
    "miss_count" integer DEFAULT 0,
    "last_hit" timestamp with time zone,
    "last_miss" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_cache_strategy" CHECK ((("cache_strategy")::"text" = ANY ((ARRAY['aggressive'::character varying, 'moderate'::character varying, 'conservative'::character varying])::"text"[])))
);


ALTER TABLE "public"."browser_cache_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."browser_cache_config" IS 'Configuration for browser-side caching of platform images';



COMMENT ON COLUMN "public"."browser_cache_config"."cache_strategy" IS 'Caching strategy: aggressive (long cache), moderate (medium cache), conservative (short cache)';



COMMENT ON COLUMN "public"."browser_cache_config"."cache_duration_hours" IS 'How long to cache this type of content in the browser (in hours)';



CREATE TABLE IF NOT EXISTS "public"."camera_angles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'camera'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."camera_angles" OWNER TO "postgres";


COMMENT ON TABLE "public"."camera_angles" IS 'Predefined camera angle options';



CREATE TABLE IF NOT EXISTS "public"."camera_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'movement'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."camera_movements" OWNER TO "postgres";


COMMENT ON TABLE "public"."camera_movements" IS 'Predefined camera movement options';



CREATE TABLE IF NOT EXISTS "public"."cinematic_presets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text" NOT NULL,
    "parameters" "jsonb" NOT NULL,
    "category" character varying(50) NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "prompt_template" "text",
    "negative_prompt" "text",
    "style_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "technical_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "seedream_config" "jsonb" DEFAULT '{}'::"jsonb",
    "generation_mode" character varying(20) DEFAULT 'image'::character varying,
    "is_public" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "is_for_sale" boolean DEFAULT false,
    "sale_price" integer DEFAULT 0,
    "seller_user_id" "uuid",
    "marketplace_status" character varying(20) DEFAULT 'private'::character varying,
    "total_sales" integer DEFAULT 0,
    "revenue_earned" integer DEFAULT 0,
    "likes_count" integer DEFAULT 0,
    "prompt_template_video" "text",
    "cinematic_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "latest_promoted_image_url" "text",
    CONSTRAINT "cinematic_presets_generation_mode_check" CHECK ((("generation_mode")::"text" = ANY ((ARRAY['image'::character varying, 'video'::character varying, 'both'::character varying])::"text"[]))),
    CONSTRAINT "cinematic_presets_marketplace_status_check" CHECK ((("marketplace_status")::"text" = ANY ((ARRAY['private'::character varying, 'pending_review'::character varying, 'approved'::character varying, 'rejected'::character varying, 'sold_out'::character varying])::"text"[]))),
    CONSTRAINT "valid_likes_count" CHECK (("likes_count" >= 0)),
    CONSTRAINT "valid_revenue_earned" CHECK (("revenue_earned" >= 0)),
    CONSTRAINT "valid_sale_price" CHECK (("sale_price" >= 0)),
    CONSTRAINT "valid_total_sales" CHECK (("total_sales" >= 0)),
    CONSTRAINT "valid_usage_count" CHECK (("usage_count" >= 0))
);


ALTER TABLE "public"."cinematic_presets" OWNER TO "postgres";


COMMENT ON COLUMN "public"."cinematic_presets"."display_name" IS 'Human-readable display name for the preset';



COMMENT ON COLUMN "public"."cinematic_presets"."parameters" IS 'Legacy parameter format (migrated to style_settings)';



COMMENT ON COLUMN "public"."cinematic_presets"."is_active" IS 'Whether this preset is currently active/available';



COMMENT ON COLUMN "public"."cinematic_presets"."sort_order" IS 'Order for displaying presets in lists';



COMMENT ON COLUMN "public"."cinematic_presets"."user_id" IS 'User who created the preset (null for system presets)';



COMMENT ON COLUMN "public"."cinematic_presets"."prompt_template" IS 'Prompt template for image generation (text-to-image, image-to-image)';



COMMENT ON COLUMN "public"."cinematic_presets"."style_settings" IS 'JSONB object containing style-related settings';



COMMENT ON COLUMN "public"."cinematic_presets"."technical_settings" IS 'JSONB object containing technical settings';



COMMENT ON COLUMN "public"."cinematic_presets"."ai_metadata" IS 'JSONB object containing AI-specific metadata';



COMMENT ON COLUMN "public"."cinematic_presets"."seedream_config" IS 'JSONB object containing Seedream-specific configuration';



COMMENT ON COLUMN "public"."cinematic_presets"."generation_mode" IS 'Type of content this preset generates: image, video, or both';



COMMENT ON COLUMN "public"."cinematic_presets"."prompt_template_video" IS 'Prompt template for video generation (text-to-video, image-to-video). Falls back to prompt_template if null.';



COMMENT ON COLUMN "public"."cinematic_presets"."cinematic_settings" IS 'Video-specific cinematic settings (camera movements, motion type, etc.)';



COMMENT ON COLUMN "public"."cinematic_presets"."latest_promoted_image_url" IS 'URL of the most recently promoted gallery image for this preset (auto-updated)';



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
    "offer_type" "text" NOT NULL,
    "message" "text",
    "equipment_details" "text",
    "rate_type" "text",
    "daily_rate_cents" integer,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "collab_gear_offers_offer_type_check" CHECK (("offer_type" = ANY (ARRAY['general'::"text", 'specific'::"text"]))),
    CONSTRAINT "collab_gear_offers_rate_type_check" CHECK (("rate_type" = ANY (ARRAY['free'::"text", 'borrow'::"text", 'retainer'::"text"]))),
    CONSTRAINT "collab_gear_offers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'withdrawn'::"text"]))),
    CONSTRAINT "valid_offer" CHECK (((("offer_type" = 'specific'::"text") AND ("gear_request_id" IS NOT NULL)) OR (("offer_type" = 'general'::"text") AND ("gear_request_id" IS NULL)))),
    CONSTRAINT "valid_rate_type" CHECK (((("rate_type" = 'free'::"text") AND ("daily_rate_cents" IS NULL)) OR (("rate_type" = ANY (ARRAY['borrow'::"text", 'retainer'::"text"])) AND ("daily_rate_cents" IS NOT NULL))))
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



CREATE TABLE IF NOT EXISTS "public"."collab_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "inviter_id" "uuid" NOT NULL,
    "invitee_id" "uuid",
    "invitee_email" "text",
    "role_id" "uuid",
    "invitation_token" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "message" "text",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "responded_at" timestamp with time zone,
    CONSTRAINT "collab_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'expired'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_invitee" CHECK ((("invitee_id" IS NOT NULL) OR ("invitee_email" IS NOT NULL)))
);


ALTER TABLE "public"."collab_invitations" OWNER TO "postgres";


COMMENT ON TABLE "public"."collab_invitations" IS 'Invitations for users to join private or invite-only projects';



COMMENT ON COLUMN "public"."collab_invitations"."invitee_email" IS 'Email address for inviting users not yet on the platform';



COMMENT ON COLUMN "public"."collab_invitations"."invitation_token" IS 'Unique token for email-based invitations';



COMMENT ON COLUMN "public"."collab_invitations"."message" IS 'Personal message from the inviter';



COMMENT ON COLUMN "public"."collab_invitations"."expires_at" IS 'Invitation expiration date (default 30 days)';



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



CREATE TABLE IF NOT EXISTS "public"."color_palettes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'color'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."color_palettes" OWNER TO "postgres";


COMMENT ON TABLE "public"."color_palettes" IS 'Predefined color palette options';



CREATE TABLE IF NOT EXISTS "public"."composition_techniques" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'composition'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."composition_techniques" OWNER TO "postgres";


COMMENT ON TABLE "public"."composition_techniques" IS 'Predefined composition technique options';



CREATE TABLE IF NOT EXISTS "public"."contact_sharing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "conversation_type" "text" NOT NULL,
    "offer_id" "uuid",
    "sharer_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "contact_type" "text" NOT NULL,
    "contact_value" "text" NOT NULL,
    "shared_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contact_sharing_contact_type_check" CHECK (("contact_type" = ANY (ARRAY['phone'::"text", 'email'::"text"]))),
    CONSTRAINT "contact_sharing_conversation_type_check" CHECK (("conversation_type" = ANY (ARRAY['listing'::"text", 'rental_order'::"text", 'sale_order'::"text"]))),
    CONSTRAINT "different_users" CHECK (("sharer_id" <> "recipient_id"))
);


ALTER TABLE "public"."contact_sharing" OWNER TO "postgres";


COMMENT ON TABLE "public"."contact_sharing" IS 'Tracks when users share contact details in conversations';



COMMENT ON COLUMN "public"."contact_sharing"."conversation_type" IS 'Type of conversation where contact was shared';



COMMENT ON COLUMN "public"."contact_sharing"."contact_type" IS 'Type of contact information shared (phone/email)';



COMMENT ON COLUMN "public"."contact_sharing"."contact_value" IS 'The actual contact information shared';



CREATE TABLE IF NOT EXISTS "public"."content_moderation_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
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


CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "last_read_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


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
    "credits" integer NOT NULL,
    "price_usd" numeric(10,4) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."credit_packages" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_packages" IS 'Analytics table defining available credit packages for purchase';



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


CREATE TABLE IF NOT EXISTS "public"."depth_of_field" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'focus'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."depth_of_field" OWNER TO "postgres";


COMMENT ON TABLE "public"."depth_of_field" IS 'Predefined depth of field options';



CREATE TABLE IF NOT EXISTS "public"."director_styles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'director'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."director_styles" OWNER TO "postgres";


COMMENT ON TABLE "public"."director_styles" IS 'Predefined director style options';



CREATE OR REPLACE VIEW "public"."directory_profiles" AS
 SELECT "id",
    "user_id",
    "display_name",
    "handle",
    "avatar_url",
    "bio",
    "city",
    "country",
    "primary_skill",
    "role_flags",
    "specializations",
    "talent_categories",
    "style_tags",
    "vibe_tags",
    "years_experience",
    "experience_level",
    "hourly_rate_min",
    "hourly_rate_max",
    "available_for_travel",
    "profile_completion_percentage",
    "account_status",
    "allow_collaboration_invites",
    "created_at"
   FROM "public"."users_profile"
  WHERE ((("account_status")::"text" = ANY ((ARRAY['active'::character varying, 'pending_verification'::character varying])::"text"[])) AND ("avatar_url" IS NOT NULL) AND ("primary_skill" IS NOT NULL) AND (NOT ("role_flags" @> ARRAY['ADMIN'::"public"."user_role"])) AND ("allow_collaboration_invites" = true))
  ORDER BY "created_at" DESC;


ALTER VIEW "public"."directory_profiles" OWNER TO "postgres";


COMMENT ON VIEW "public"."directory_profiles" IS 'Public directory view of user profiles filtered by primary_skill, excluding admins, incomplete profiles, and users who disabled collaboration invites. Used for directory pages like /photographers, /models, etc.';



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


CREATE TABLE IF NOT EXISTS "public"."email_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "endpoint" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_logs" IS 'Logs all email trigger attempts for debugging and monitoring';



CREATE TABLE IF NOT EXISTS "public"."enhancement_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "enhancement_type" character varying(50) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "credits_consumed" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "error_type" character varying(50),
    "failed_at" timestamp with time zone,
    "refunded" boolean DEFAULT false,
    "refund_processed_at" timestamp with time zone,
    "moodboard_item_index" integer,
    "provider" character varying(50) DEFAULT 'nanobanana'::character varying,
    "provider_task_id" character varying(100),
    "provider_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "cost_credits" integer DEFAULT 1,
    "provider_cost" numeric(8,4),
    "quality_score" numeric(3,2),
    "processing_time_ms" integer
);


ALTER TABLE "public"."enhancement_tasks" OWNER TO "postgres";


COMMENT ON TABLE "public"."enhancement_tasks" IS 'Analytics table tracking enhancement tasks and their status';



CREATE TABLE IF NOT EXISTS "public"."equipment_brands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."equipment_brands" OWNER TO "postgres";


COMMENT ON TABLE "public"."equipment_brands" IS 'Brands of equipment (Canon, Sony, Nikon, etc.)';



CREATE TABLE IF NOT EXISTS "public"."equipment_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "equipment_type_id" "uuid" NOT NULL,
    "brand" character varying(100) NOT NULL,
    "model" character varying(200) NOT NULL,
    "description" "text",
    "condition" character varying(20) DEFAULT 'excellent'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."equipment_models" OWNER TO "postgres";


COMMENT ON TABLE "public"."equipment_models" IS 'Specific equipment models with details';



CREATE TABLE IF NOT EXISTS "public"."equipment_predefined_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "equipment_type_id" "uuid" NOT NULL,
    "brand" character varying(100) NOT NULL,
    "model" character varying(200) NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."equipment_predefined_models" OWNER TO "postgres";


COMMENT ON TABLE "public"."equipment_predefined_models" IS 'Predefined equipment models for quick selection';



CREATE TABLE IF NOT EXISTS "public"."equipment_request_purposes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "category" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."equipment_request_purposes" OWNER TO "postgres";


COMMENT ON TABLE "public"."equipment_request_purposes" IS 'Predefined purposes for equipment requests to help categorize and filter requests';



COMMENT ON COLUMN "public"."equipment_request_purposes"."name" IS 'Unique identifier for the purpose (e.g., wedding, portrait)';



COMMENT ON COLUMN "public"."equipment_request_purposes"."display_name" IS 'Human-readable name for UI display';



COMMENT ON COLUMN "public"."equipment_request_purposes"."icon" IS 'Icon name for UI display';



COMMENT ON COLUMN "public"."equipment_request_purposes"."category" IS 'Grouping category for organization';



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
    "purpose_id" "uuid",
    "reference_type" "text",
    "reference_title" "text",
    "reference_url" "text",
    "reference_description" "text",
    "reference_thumbnail_url" "text",
    CONSTRAINT "equipment_requests_condition_preference_check" CHECK (("condition_preference" = ANY (ARRAY['any'::"text", 'new'::"text", 'like_new'::"text", 'used'::"text", 'fair'::"text"]))),
    CONSTRAINT "equipment_requests_reference_type_check" CHECK (("reference_type" = ANY (ARRAY['moodboard'::"text", 'treatment'::"text", 'showcase'::"text", 'external_link'::"text", 'other'::"text"]))),
    CONSTRAINT "equipment_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['rent'::"text", 'buy'::"text", 'both'::"text"]))),
    CONSTRAINT "equipment_requests_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'fulfilled'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."equipment_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."equipment_requests" IS 'Equipment requests posted by users looking for specific gear';



COMMENT ON COLUMN "public"."equipment_requests"."condition_preference" IS 'Preferred condition of equipment (any, new, like_new, used, fair)';



COMMENT ON COLUMN "public"."equipment_requests"."request_type" IS 'Type of request: rent, buy, or both';



COMMENT ON COLUMN "public"."equipment_requests"."urgent" IS 'Whether this is an urgent request that should be prioritized';



COMMENT ON COLUMN "public"."equipment_requests"."reference_type" IS 'Type of reference: moodboard, treatment, showcase, external_link, or other';



COMMENT ON COLUMN "public"."equipment_requests"."reference_title" IS 'Title of the reference material';



COMMENT ON COLUMN "public"."equipment_requests"."reference_url" IS 'URL to the reference material';



COMMENT ON COLUMN "public"."equipment_requests"."reference_description" IS 'Description of the reference material';



COMMENT ON COLUMN "public"."equipment_requests"."reference_thumbnail_url" IS 'URL to thumbnail/preview image of the reference';



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



COMMENT ON COLUMN "public"."marketplace_reviews"."order_type" IS 'Whether this review is for a rent or sale order';



CREATE OR REPLACE VIEW "public"."equipment_requests_with_ratings" AS
 SELECT "er"."id",
    "er"."requester_id",
    "er"."title",
    "er"."description",
    "er"."category",
    "er"."equipment_type",
    "er"."condition_preference",
    "er"."request_type",
    "er"."rental_start_date",
    "er"."rental_end_date",
    "er"."max_daily_rate_cents",
    "er"."max_total_cents",
    "er"."max_purchase_price_cents",
    "er"."location_city",
    "er"."location_country",
    "er"."latitude",
    "er"."longitude",
    "er"."pickup_preferred",
    "er"."delivery_acceptable",
    "er"."max_distance_km",
    "er"."verified_users_only",
    "er"."min_rating",
    "er"."urgent",
    "er"."status",
    "er"."expires_at",
    "er"."created_at",
    "er"."updated_at",
    "er"."purpose_id",
    "er"."reference_type",
    "er"."reference_title",
    "er"."reference_url",
    "er"."reference_description",
    "er"."reference_thumbnail_url",
    "up"."id" AS "requester_profile_id",
    "up"."display_name" AS "requester_display_name",
    "up"."handle" AS "requester_handle",
    "up"."avatar_url" AS "requester_avatar_url",
    "up"."verified_id" AS "requester_verified_id",
    COALESCE(( SELECT ("avg"("marketplace_reviews"."rating"))::numeric(3,2) AS "avg"
           FROM "public"."marketplace_reviews"
          WHERE ("marketplace_reviews"."subject_user_id" = "up"."id")), 0.0) AS "requester_average_rating",
    COALESCE(( SELECT ("count"(*))::integer AS "count"
           FROM "public"."marketplace_reviews"
          WHERE ("marketplace_reviews"."subject_user_id" = "up"."id")), 0) AS "requester_review_count",
    "erp"."name" AS "purpose_name",
    "erp"."display_name" AS "purpose_display_name",
    "erp"."description" AS "purpose_description",
    "erp"."icon" AS "purpose_icon",
    "erp"."category" AS "purpose_category"
   FROM (("public"."equipment_requests" "er"
     LEFT JOIN "public"."users_profile" "up" ON (("er"."requester_id" = "up"."id")))
     LEFT JOIN "public"."equipment_request_purposes" "erp" ON (("er"."purpose_id" = "erp"."id")));


ALTER VIEW "public"."equipment_requests_with_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equipment_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "icon" character varying(10),
    "category" character varying(50) NOT NULL,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."equipment_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."equipment_types" IS 'Types of equipment available in the system (cameras, lenses, etc.)';



CREATE TABLE IF NOT EXISTS "public"."era_emulations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'era'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."era_emulations" OWNER TO "postgres";


COMMENT ON TABLE "public"."era_emulations" IS 'Predefined era emulation options';



CREATE TABLE IF NOT EXISTS "public"."eye_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'eye'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."eye_contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."eye_contacts" IS 'Predefined eye contact options';



CREATE TABLE IF NOT EXISTS "public"."featured_preset_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preset_id" "uuid" NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "admin_notes" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "featured_preset_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."featured_preset_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."featured_preset_requests" IS 'Tracks requests for presets to be featured, with admin approval workflow';



CREATE TABLE IF NOT EXISTS "public"."foreground_elements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'foreground'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."foreground_elements" OWNER TO "postgres";


COMMENT ON TABLE "public"."foreground_elements" IS 'Predefined foreground element options';



CREATE TABLE IF NOT EXISTS "public"."gig_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "inviter_id" "uuid" NOT NULL,
    "invitee_id" "uuid" NOT NULL,
    "message" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "responded_at" timestamp with time zone
);


ALTER TABLE "public"."gig_invitations" OWNER TO "postgres";


COMMENT ON TABLE "public"."gig_invitations" IS 'Direct invitations from gig owners to talent to apply for specific gigs';



COMMENT ON COLUMN "public"."gig_invitations"."message" IS 'Personal message from gig owner to invitee (max 1000 characters)';



COMMENT ON COLUMN "public"."gig_invitations"."expires_at" IS 'Invitation expires after 7 days (shorter than project invitations)';



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
    "city" character varying(100),
    "country" character varying(100),
    "applicant_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "looking_for" "public"."looking_for_type",
    "looking_for_types" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "check_gig_style_tags_count" CHECK ((("array_length"("style_tags", 1) IS NULL) OR ("array_length"("style_tags", 1) <= 10))),
    CONSTRAINT "valid_boost" CHECK (("boost_level" >= 0)),
    CONSTRAINT "valid_deadline" CHECK (("application_deadline" <= "start_time")),
    CONSTRAINT "valid_looking_for_types" CHECK ((("array_length"("looking_for_types", 1) IS NULL) OR (("array_length"("looking_for_types", 1) >= 1) AND ("array_length"("looking_for_types", 1) <= 10)))),
    CONSTRAINT "valid_time_range" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."gigs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."gigs"."location_text" IS 'Free-text location description (legacy field, prefer city/country)';



COMMENT ON COLUMN "public"."gigs"."location" IS 'PostGIS geography point for map coordinates';



COMMENT ON COLUMN "public"."gigs"."style_tags" IS 'Array of style/aesthetic tags for this gig (fashion, portrait, etc.)';



COMMENT ON COLUMN "public"."gigs"."city" IS 'City name for structured location data';



COMMENT ON COLUMN "public"."gigs"."country" IS 'Country name for structured location data';



COMMENT ON COLUMN "public"."gigs"."applicant_preferences" IS 'Enhanced JSON structure for applicant matching with all new attributes including physical (height, eye/hair color/length, skin tone, body type, tattoos, piercings), demographics (gender, ethnicity, nationality), professional (experience, specializations), and work preferences (TFP, location type, schedule). See migration 20251004000009 and GIG_PREFERENCES_SCHEMA.md for full structure.';



COMMENT ON COLUMN "public"."gigs"."looking_for" IS 'Specifies the type of talent the gig is looking for (e.g., models, photographers, etc.)';



COMMENT ON COLUMN "public"."gigs"."looking_for_types" IS 'Array of role types this gig is looking for (e.g., [''MODELS'', ''MAKEUP_ARTISTS'']). 
Supports multiple selections for gigs needing various roles.
Valid values: MODELS, MODELS_FASHION, MODELS_COMMERCIAL, MODELS_FITNESS, ACTORS, DANCERS, 
PHOTOGRAPHERS, VIDEOGRAPHERS, MAKEUP_ARTISTS, HAIR_STYLISTS, FASHION_STYLISTS, 
PRODUCTION_CREW, PRODUCERS, DIRECTORS, EDITORS, VFX_ARTISTS, DESIGNERS, CONTENT_CREATORS, 
INFLUENCERS, AGENCIES, BRAND_MANAGERS, WRITERS, and more.
See gig-form-persistence.ts for complete list of 51 types.';



CREATE TABLE IF NOT EXISTS "public"."languages_master" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "native_name" character varying(100),
    "iso_code" character varying(10),
    "region" character varying(50),
    "is_popular" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."languages_master" OWNER TO "postgres";


COMMENT ON TABLE "public"."languages_master" IS 'Master list of languages for user selection';



COMMENT ON COLUMN "public"."languages_master"."name" IS 'English name of the language';



COMMENT ON COLUMN "public"."languages_master"."native_name" IS 'Native name of the language';



COMMENT ON COLUMN "public"."languages_master"."iso_code" IS 'ISO 639-1 or 639-3 language code';



COMMENT ON COLUMN "public"."languages_master"."region" IS 'Geographic region where language is primarily spoken';



COMMENT ON COLUMN "public"."languages_master"."is_popular" IS 'Mark commonly spoken languages';



CREATE TABLE IF NOT EXISTS "public"."lens_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'lens'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lens_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."lens_types" IS 'Predefined lens type options';



CREATE TABLE IF NOT EXISTS "public"."lighting_styles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'lighting'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lighting_styles" OWNER TO "postgres";


COMMENT ON TABLE "public"."lighting_styles" IS 'Predefined lighting style options';



CREATE TABLE IF NOT EXISTS "public"."listing_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_comment_id" "uuid",
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "listing_comments_body_check" CHECK ((("length"("body") > 0) AND ("length"("body") <= 2000)))
);


ALTER TABLE "public"."listing_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listing_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "path" "text" NOT NULL,
    "url" "text" NOT NULL,
    "alt_text" "text",
    "sort_order" integer DEFAULT 0,
    "file_size" integer,
    "mime_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."listing_images" OWNER TO "postgres";


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
    "equipment_type_id" "uuid",
    "equipment_brand_id" "uuid",
    "equipment_model_id" "uuid",
    "brand" character varying(100),
    "model" character varying(200),
    "comment_count" integer DEFAULT 0,
    CONSTRAINT "listings_condition_check" CHECK (("condition" = ANY (ARRAY['new'::"text", 'like_new'::"text", 'good'::"text", 'fair'::"text", 'poor'::"text"]))),
    CONSTRAINT "listings_mode_check" CHECK (("mode" = ANY (ARRAY['rent'::"text", 'sale'::"text", 'both'::"text"]))),
    CONSTRAINT "listings_retainer_mode_check" CHECK (("retainer_mode" = ANY (ARRAY['none'::"text", 'credit_hold'::"text", 'card_hold'::"text"]))),
    CONSTRAINT "listings_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'archived'::"text"]))),
    CONSTRAINT "valid_location" CHECK (((("latitude" IS NULL) AND ("longitude" IS NULL)) OR (("latitude" IS NOT NULL) AND ("longitude" IS NOT NULL)))),
    CONSTRAINT "valid_rent_pricing" CHECK (((("mode" = ANY (ARRAY['rent'::"text", 'both'::"text"])) AND ("rent_day_cents" IS NOT NULL) AND ("rent_day_cents" > 0)) OR ("mode" = 'sale'::"text"))),
    CONSTRAINT "valid_sale_pricing" CHECK (((("mode" = ANY (ARRAY['sale'::"text", 'both'::"text"])) AND ("sale_price_cents" IS NOT NULL) AND ("sale_price_cents" > 0)) OR ("mode" = 'rent'::"text")))
);


ALTER TABLE "public"."listings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."listings"."equipment_type_id" IS 'Foreign key to equipment_types table';



COMMENT ON COLUMN "public"."listings"."equipment_brand_id" IS 'Foreign key to equipment_brands table';



COMMENT ON COLUMN "public"."listings"."equipment_model_id" IS 'Foreign key to equipment_models table';



COMMENT ON COLUMN "public"."listings"."brand" IS 'Equipment brand name (for custom entries)';



COMMENT ON COLUMN "public"."listings"."model" IS 'Equipment model name (for custom entries)';



CREATE TABLE IF NOT EXISTS "public"."location_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'location'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."location_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."location_types" IS 'Predefined location type options';



CREATE TABLE IF NOT EXISTS "public"."lootbox_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" character varying(50) DEFAULT 'purchased'::character varying NOT NULL,
    "event_name" character varying(100),
    "user_credits_offered" integer DEFAULT 2000 NOT NULL,
    "price_usd" numeric(10,2) NOT NULL,
    "margin_percentage" numeric(5,2) DEFAULT 35.0 NOT NULL,
    "purchased_at" timestamp with time zone DEFAULT "now"(),
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
    "nano_banana_threshold" integer DEFAULT 0,
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
    "gig_id" "uuid",
    "from_user_id" "uuid" NOT NULL,
    "to_user_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    "conversation_id" "uuid",
    "message_type" character varying(50) DEFAULT 'text'::character varying,
    "status" character varying(20) DEFAULT 'sent'::character varying,
    "delivered_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "listing_id" "uuid",
    "rental_order_id" "uuid",
    "sale_order_id" "uuid",
    "offer_id" "uuid",
    "context_type" "text" DEFAULT 'gig'::"text",
    CONSTRAINT "check_message_participants" CHECK (("from_user_id" <> "to_user_id")),
    CONSTRAINT "messages_context_type_check" CHECK (("context_type" = ANY (ARRAY['gig'::"text", 'marketplace'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."messages" IS 'Messages table with enhanced RLS policies. Users can only access messages they sent or received, with rate limiting and content validation.';



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


COMMENT ON COLUMN "public"."moodboards"."mood_descriptors" IS 'AI-generated mood descriptors like ethereal, bold, minimalist';



COMMENT ON COLUMN "public"."moodboards"."tags" IS 'Searchable tags for moodboard discovery';



COMMENT ON COLUMN "public"."moodboards"."ai_analysis_status" IS 'Status of AI analysis: pending, completed, failed';



COMMENT ON COLUMN "public"."moodboards"."ai_analyzed_at" IS 'Timestamp when AI analysis was performed';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "recipient_id" "uuid" NOT NULL,
    "type" character varying(100) NOT NULL,
    "category" character varying(100) NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "avatar_url" "text",
    "thumbnail_url" "text",
    "action_url" "text",
    "data" "jsonb",
    "read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "dismissed_at" timestamp with time zone
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'User notifications for various platform events';



COMMENT ON COLUMN "public"."notifications"."user_id" IS 'ID of the user who triggered the notification';



COMMENT ON COLUMN "public"."notifications"."recipient_id" IS 'ID of the user who receives the notification';



COMMENT ON COLUMN "public"."notifications"."type" IS 'Type of notification (gig, message, application, etc.)';



COMMENT ON COLUMN "public"."notifications"."category" IS 'Category of notification for filtering';



COMMENT ON COLUMN "public"."notifications"."title" IS 'Notification title';



COMMENT ON COLUMN "public"."notifications"."message" IS 'Notification message body';



COMMENT ON COLUMN "public"."notifications"."avatar_url" IS 'Avatar URL for the notification';



COMMENT ON COLUMN "public"."notifications"."thumbnail_url" IS 'Thumbnail URL for the notification';



COMMENT ON COLUMN "public"."notifications"."action_url" IS 'URL to navigate to when notification is clicked';



COMMENT ON COLUMN "public"."notifications"."data" IS 'Additional data for the notification';



COMMENT ON COLUMN "public"."notifications"."read" IS 'Whether the notification has been read';



COMMENT ON COLUMN "public"."notifications"."read_at" IS 'Timestamp when notification was read';



COMMENT ON COLUMN "public"."notifications"."dismissed_at" IS 'Timestamp when notification was dismissed';



CREATE TABLE IF NOT EXISTS "public"."oauth_health_check" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "check_time" timestamp with time zone DEFAULT "now"(),
    "provider" "text" NOT NULL,
    "status" "text" NOT NULL,
    "response_time_ms" integer,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "oauth_health_check_status_check" CHECK (("status" = ANY (ARRAY['healthy'::"text", 'degraded'::"text", 'unhealthy'::"text"])))
);


ALTER TABLE "public"."oauth_health_check" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."oauth_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "provider" "text" NOT NULL,
    "step" "text",
    "error_message" "text",
    "error_code" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "duration_ms" integer,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "environment" "text" DEFAULT 'production'::"text",
    CONSTRAINT "oauth_logs_event_type_check" CHECK (("event_type" = ANY (ARRAY['oauth_start'::"text", 'oauth_callback'::"text", 'oauth_success'::"text", 'oauth_error'::"text", 'profile_creation'::"text", 'profile_error'::"text"]))),
    CONSTRAINT "oauth_logs_provider_check" CHECK (("provider" = ANY (ARRAY['google'::"text", 'email'::"text"])))
);


ALTER TABLE "public"."oauth_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "offerer_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "offer_amount_cents" integer NOT NULL,
    "message" "text",
    "contact_preference" "text" DEFAULT 'message'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_no_self_offers" CHECK (("offerer_id" <> "owner_id")),
    CONSTRAINT "offers_contact_preference_check" CHECK (("contact_preference" = ANY (ARRAY['message'::"text", 'phone'::"text", 'email'::"text"]))),
    CONSTRAINT "offers_offer_amount_cents_check" CHECK (("offer_amount_cents" > 0)),
    CONSTRAINT "offers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'withdrawn'::"text", 'expired'::"text"]))),
    CONSTRAINT "valid_offer_amount" CHECK (("offer_amount_cents" > 0))
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


COMMENT ON TABLE "public"."offers" IS 'Purchase offers for equipment listings';



COMMENT ON COLUMN "public"."offers"."offer_amount_cents" IS 'Offer amount in cents';



COMMENT ON COLUMN "public"."offers"."contact_preference" IS 'Preferred contact method for negotiation';



COMMENT ON CONSTRAINT "check_no_self_offers" ON "public"."offers" IS 'Prevents users from making offers on their own listings';



CREATE TABLE IF NOT EXISTS "public"."platform_credit_consumption" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" character varying(50) NOT NULL,
    "provider_credits_consumed" numeric(12,4) NOT NULL,
    "operation_type" character varying(50) NOT NULL,
    "cost_usd" numeric(8,4),
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."platform_credit_consumption" OWNER TO "postgres";


COMMENT ON TABLE "public"."platform_credit_consumption" IS 'Analytics table tracking platform credit consumption by provider';



CREATE TABLE IF NOT EXISTS "public"."platform_credits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" character varying(50) NOT NULL,
    "current_balance" numeric(12,4) DEFAULT 0,
    "low_balance_threshold" numeric(12,4) DEFAULT 100,
    "credit_ratio" numeric(8,4) DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."platform_credits" OWNER TO "postgres";


COMMENT ON TABLE "public"."platform_credits" IS 'Analytics table tracking platform credit balances by provider';



CREATE TABLE IF NOT EXISTS "public"."platform_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_key" character varying(100) NOT NULL,
    "image_type" character varying(50) NOT NULL,
    "category" character varying(100),
    "image_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "alt_text" "text",
    "title" character varying(255),
    "description" "text",
    "width" integer DEFAULT 1024,
    "height" integer DEFAULT 1024,
    "file_size" integer DEFAULT 0,
    "format" character varying(10) DEFAULT 'jpg'::character varying,
    "usage_context" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_image_type" CHECK ((("image_type")::"text" = ANY ((ARRAY['homepage'::character varying, 'preset_visual_aid'::character varying, 'category_icon'::character varying, 'marketing'::character varying, 'feature_showcase'::character varying])::"text"[])))
);


ALTER TABLE "public"."platform_images" OWNER TO "postgres";


COMMENT ON TABLE "public"."platform_images" IS 'Stores platform-wide images like homepage backgrounds and preset visual aids';



COMMENT ON COLUMN "public"."platform_images"."image_key" IS 'Unique identifier for the image (e.g., homepage_hero, cinematic_portrait_example)';



COMMENT ON COLUMN "public"."platform_images"."image_type" IS 'Type of platform image: homepage, preset_visual_aid, category_icon, etc.';



COMMENT ON COLUMN "public"."platform_images"."usage_context" IS 'JSON metadata about how this image should be used and displayed';



COMMENT ON COLUMN "public"."platform_images"."is_active" IS 'Whether this image is currently active and should be displayed';



CREATE TABLE IF NOT EXISTS "public"."playground_gallery" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "image_url" "text",
    "thumbnail_url" "text",
    "title" character varying(255),
    "description" "text",
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "width" integer,
    "height" integer,
    "format" character varying(50),
    "project_id" "uuid",
    "used_in_moodboard" boolean DEFAULT false,
    "used_in_showcase" boolean DEFAULT false,
    "media_type" character varying(20) DEFAULT 'image'::character varying,
    "video_url" "text",
    "video_duration" integer,
    "video_resolution" character varying(20),
    "video_format" character varying(20),
    "generation_metadata" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "exif_json" "jsonb",
    "is_verified" boolean DEFAULT false,
    "verification_timestamp" timestamp with time zone
);


ALTER TABLE "public"."playground_gallery" OWNER TO "postgres";


COMMENT ON TABLE "public"."playground_gallery" IS 'Stores user-saved images from the playground feature';



COMMENT ON COLUMN "public"."playground_gallery"."image_url" IS 'URL of the saved image';



COMMENT ON COLUMN "public"."playground_gallery"."tags" IS 'Array of tags for organizing saved images';



COMMENT ON COLUMN "public"."playground_gallery"."project_id" IS 'Reference to the playground project this image came from';



COMMENT ON COLUMN "public"."playground_gallery"."generation_metadata" IS 'JSON metadata about how the image was generated';



COMMENT ON COLUMN "public"."playground_gallery"."exif_json" IS 'EXIF data and generation metadata including promoted_from_playground flag and generation parameters';



COMMENT ON COLUMN "public"."playground_gallery"."is_verified" IS 'Whether this image has been promoted to be featured as a preset example';



COMMENT ON COLUMN "public"."playground_gallery"."verification_timestamp" IS 'Timestamp when the image was promoted';



CREATE TABLE IF NOT EXISTS "public"."playground_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "prompt" "text" NOT NULL,
    "negative_prompt" "text",
    "style" character varying(50) DEFAULT 'realistic'::character varying,
    "aspect_ratio" character varying(20) DEFAULT '1:1'::character varying,
    "resolution" character varying(20) DEFAULT '1024x1024'::character varying,
    "generated_images" "jsonb" DEFAULT '[]'::"jsonb",
    "selected_image_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "credits_used" integer DEFAULT 0,
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_generated_at" timestamp with time zone,
    "preset_id" "uuid",
    CONSTRAINT "playground_projects_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'generated'::character varying, 'saved'::character varying, 'published'::character varying, 'processing'::character varying])::"text"[])))
);


ALTER TABLE "public"."playground_projects" OWNER TO "postgres";


COMMENT ON TABLE "public"."playground_projects" IS 'Stores user-generated images from the playground feature';



COMMENT ON COLUMN "public"."playground_projects"."prompt" IS 'The text prompt used for image generation';



COMMENT ON COLUMN "public"."playground_projects"."generated_images" IS 'JSON array of generated image URLs and metadata';



COMMENT ON COLUMN "public"."playground_projects"."credits_used" IS 'Number of credits consumed for this generation';



COMMENT ON COLUMN "public"."playground_projects"."status" IS 'Current status: draft, generated, saved, published, or processing';



COMMENT ON COLUMN "public"."playground_projects"."preset_id" IS 'Reference to the preset that was used for this generation';



CREATE TABLE IF NOT EXISTS "public"."predefined_availability_statuses" (
    "id" integer NOT NULL,
    "status_name" character varying(100) NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_availability_statuses" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."predefined_availability_statuses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_availability_statuses_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_availability_statuses_id_seq" OWNED BY "public"."predefined_availability_statuses"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_body_types" (
    "id" integer NOT NULL,
    "body_type_name" character varying(100) NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_body_types" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."predefined_body_types_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_body_types_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_body_types_id_seq" OWNED BY "public"."predefined_body_types"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_clothing_size_systems" (
    "id" integer NOT NULL,
    "system_name" character varying(50) NOT NULL,
    "system_type" character varying(20) NOT NULL,
    "region" character varying(20) NOT NULL,
    "gender" character varying(10),
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "predefined_clothing_size_systems_gender_check" CHECK ((("gender")::"text" = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'unisex'::character varying])::"text"[]))),
    CONSTRAINT "predefined_clothing_size_systems_region_check" CHECK ((("region")::"text" = ANY ((ARRAY['US'::character varying, 'EU'::character varying, 'UK'::character varying, 'AU'::character varying, 'JP'::character varying, 'International'::character varying])::"text"[]))),
    CONSTRAINT "predefined_clothing_size_systems_system_type_check" CHECK ((("system_type")::"text" = ANY ((ARRAY['numeric'::character varying, 'alpha'::character varying, 'mixed'::character varying])::"text"[])))
);


ALTER TABLE "public"."predefined_clothing_size_systems" OWNER TO "postgres";


COMMENT ON TABLE "public"."predefined_clothing_size_systems" IS 'Predefined clothing size systems (US, UK, EU) with gender and type information';



COMMENT ON COLUMN "public"."predefined_clothing_size_systems"."system_type" IS 'Type of sizing: numeric (4,6,8), alpha (XS,S,M,L), or mixed';



COMMENT ON COLUMN "public"."predefined_clothing_size_systems"."region" IS 'Geographic region: US, UK, EU, AU, JP, International';



CREATE SEQUENCE IF NOT EXISTS "public"."predefined_clothing_size_systems_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_clothing_size_systems_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_clothing_size_systems_id_seq" OWNED BY "public"."predefined_clothing_size_systems"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_clothing_sizes" (
    "id" integer NOT NULL,
    "size_system_id" integer,
    "size_value" character varying(10) NOT NULL,
    "size_label" character varying(30),
    "numeric_equivalent" integer,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_clothing_sizes" OWNER TO "postgres";


COMMENT ON TABLE "public"."predefined_clothing_sizes" IS 'Predefined clothing sizes for each system (numeric and alpha)';



COMMENT ON COLUMN "public"."predefined_clothing_sizes"."numeric_equivalent" IS 'Numeric equivalent for alpha sizes (e.g., M = 6-8)';



CREATE SEQUENCE IF NOT EXISTS "public"."predefined_clothing_sizes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_clothing_sizes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_clothing_sizes_id_seq" OWNED BY "public"."predefined_clothing_sizes"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_equipment_options" (
    "id" integer NOT NULL,
    "equipment_name" character varying(100) NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_equipment_options" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."predefined_equipment_options_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_equipment_options_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_equipment_options_id_seq" OWNED BY "public"."predefined_equipment_options"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_ethnicities" (
    "id" integer NOT NULL,
    "ethnicity_name" character varying(100) NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_ethnicities" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."predefined_ethnicities_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_ethnicities_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_ethnicities_id_seq" OWNED BY "public"."predefined_ethnicities"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_experience_levels" (
    "id" integer NOT NULL,
    "level_name" character varying(100) NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_experience_levels" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."predefined_experience_levels_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_experience_levels_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_experience_levels_id_seq" OWNED BY "public"."predefined_experience_levels"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_eye_colors" (
    "id" integer NOT NULL,
    "color_name" character varying(100) NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_eye_colors" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."predefined_eye_colors_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_eye_colors_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_eye_colors_id_seq" OWNED BY "public"."predefined_eye_colors"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_gear_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_gear_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."predefined_gender_identities" (
    "id" integer NOT NULL,
    "identity_name" character varying(100) NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_gender_identities" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."predefined_gender_identities_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_gender_identities_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_gender_identities_id_seq" OWNED BY "public"."predefined_gender_identities"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_hair_colors" (
    "id" integer NOT NULL,
    "color_name" character varying(100) NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_hair_colors" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."predefined_hair_colors_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_hair_colors_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_hair_colors_id_seq" OWNED BY "public"."predefined_hair_colors"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_hair_lengths" (
    "id" integer NOT NULL,
    "length_name" character varying(100) NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_hair_lengths" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."predefined_hair_lengths_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_hair_lengths_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_hair_lengths_id_seq" OWNED BY "public"."predefined_hair_lengths"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_nationalities" (
    "id" integer NOT NULL,
    "nationality_name" character varying(100) NOT NULL,
    "country_code" character varying(3),
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_nationalities" OWNER TO "postgres";


COMMENT ON TABLE "public"."predefined_nationalities" IS 'Predefined nationalities for user profiles (sorted alphabetically)';



COMMENT ON COLUMN "public"."predefined_nationalities"."nationality_name" IS 'Name of the nationality (e.g., "American", "British", "French")';



COMMENT ON COLUMN "public"."predefined_nationalities"."country_code" IS 'ISO 3166-1 alpha-3 country code';



CREATE SEQUENCE IF NOT EXISTS "public"."predefined_nationalities_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_nationalities_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_nationalities_id_seq" OWNED BY "public"."predefined_nationalities"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_professional_skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "skill_name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_professional_skills" OWNER TO "postgres";


COMMENT ON TABLE "public"."predefined_professional_skills" IS 'Predefined professional skills, tools, and certifications for contributors';



COMMENT ON COLUMN "public"."predefined_professional_skills"."skill_name" IS 'Name of the skill, tool, or certification';



COMMENT ON COLUMN "public"."predefined_professional_skills"."category" IS 'Category: software, tools, certifications, languages, methodologies';



COMMENT ON COLUMN "public"."predefined_professional_skills"."description" IS 'Description of what the skill involves';



COMMENT ON COLUMN "public"."predefined_professional_skills"."is_active" IS 'Whether this skill is currently available for selection';



COMMENT ON COLUMN "public"."predefined_professional_skills"."sort_order" IS 'Order for displaying skills within categories';



CREATE TABLE IF NOT EXISTS "public"."predefined_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."predefined_roles" IS 'Predefined roles available for collaboration projects';



COMMENT ON COLUMN "public"."predefined_roles"."category" IS 'Role category: creative, technical, production, post-production, design, marketing';



CREATE TABLE IF NOT EXISTS "public"."predefined_shoe_size_systems" (
    "id" integer NOT NULL,
    "system_name" character varying(50) NOT NULL,
    "region" character varying(20) NOT NULL,
    "gender" character varying(10),
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "predefined_shoe_size_systems_gender_check" CHECK ((("gender")::"text" = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'unisex'::character varying])::"text"[]))),
    CONSTRAINT "predefined_shoe_size_systems_region_check" CHECK ((("region")::"text" = ANY ((ARRAY['US'::character varying, 'EU'::character varying, 'UK'::character varying, 'AU'::character varying, 'JP'::character varying])::"text"[])))
);


ALTER TABLE "public"."predefined_shoe_size_systems" OWNER TO "postgres";


COMMENT ON TABLE "public"."predefined_shoe_size_systems" IS 'Predefined shoe size systems (US Men, US Women, EU, UK, etc.)';



CREATE SEQUENCE IF NOT EXISTS "public"."predefined_shoe_size_systems_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_shoe_size_systems_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_shoe_size_systems_id_seq" OWNED BY "public"."predefined_shoe_size_systems"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_shoe_sizes" (
    "id" integer NOT NULL,
    "size_system_id" integer,
    "size_value" character varying(10) NOT NULL,
    "size_label" character varying(20),
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_shoe_sizes" OWNER TO "postgres";


COMMENT ON TABLE "public"."predefined_shoe_sizes" IS 'Predefined shoe sizes for each system';



CREATE SEQUENCE IF NOT EXISTS "public"."predefined_shoe_sizes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_shoe_sizes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_shoe_sizes_id_seq" OWNED BY "public"."predefined_shoe_sizes"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_skills" OWNER TO "postgres";


COMMENT ON TABLE "public"."predefined_skills" IS 'Predefined skills available for collaboration projects';



COMMENT ON COLUMN "public"."predefined_skills"."category" IS 'Skill category: technical, creative, post-production, software, interpersonal, marketing, specialized';



CREATE TABLE IF NOT EXISTS "public"."predefined_skin_tones" (
    "id" integer NOT NULL,
    "tone_name" character varying(100) NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_skin_tones" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."predefined_skin_tones_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_skin_tones_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_skin_tones_id_seq" OWNED BY "public"."predefined_skin_tones"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_style_tags" (
    "id" integer NOT NULL,
    "tag_name" character varying(50) NOT NULL,
    "category" character varying(50) DEFAULT 'general'::character varying,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_style_tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."predefined_style_tags" IS 'Predefined style tags for creative preferences';



CREATE SEQUENCE IF NOT EXISTS "public"."predefined_style_tags_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_style_tags_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_style_tags_id_seq" OWNED BY "public"."predefined_style_tags"."id";



CREATE TABLE IF NOT EXISTS "public"."predefined_talent_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_talent_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."predefined_talent_categories" IS 'Predefined talent/performer categories for users with TALENT role (e.g., Model, Actor, Dancer, Musician, Influencer). Used for primary_skill selection and talent_categories array.';



CREATE TABLE IF NOT EXISTS "public"."predefined_vibe_tags" (
    "id" integer NOT NULL,
    "tag_name" character varying(50) NOT NULL,
    "category" character varying(50) DEFAULT 'general'::character varying,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."predefined_vibe_tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."predefined_vibe_tags" IS 'Predefined vibe tags for mood and atmosphere';



CREATE SEQUENCE IF NOT EXISTS "public"."predefined_vibe_tags_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."predefined_vibe_tags_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."predefined_vibe_tags_id_seq" OWNED BY "public"."predefined_vibe_tags"."id";



CREATE TABLE IF NOT EXISTS "public"."presets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'style'::character varying,
    "prompt_template" "text",
    "negative_prompt" "text",
    "style_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "technical_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "seedream_config" "jsonb" DEFAULT '{}'::"jsonb",
    "generation_mode" character varying(20) DEFAULT 'image'::character varying,
    "is_public" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "likes_count" integer DEFAULT 0,
    "display_name" character varying(100),
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "is_for_sale" boolean DEFAULT false,
    "sale_price" integer DEFAULT 0,
    "seller_user_id" "uuid",
    "marketplace_status" character varying(20) DEFAULT 'private'::character varying,
    "total_sales" integer DEFAULT 0,
    "revenue_earned" integer DEFAULT 0,
    "prompt_template_video" "text",
    "cinematic_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "latest_promoted_image_url" "text",
    CONSTRAINT "presets_generation_mode_check" CHECK ((("generation_mode")::"text" = ANY ((ARRAY['image'::character varying, 'video'::character varying, 'both'::character varying])::"text"[]))),
    CONSTRAINT "presets_marketplace_status_check" CHECK ((("marketplace_status")::"text" = ANY ((ARRAY['private'::character varying, 'pending_review'::character varying, 'approved'::character varying, 'rejected'::character varying, 'sold_out'::character varying])::"text"[]))),
    CONSTRAINT "valid_category" CHECK ((("category")::"text" = ANY ((ARRAY['style'::character varying, 'effects'::character varying, 'cinematic'::character varying, 'technical'::character varying, 'custom'::character varying, 'headshot'::character varying, 'product_photography'::character varying, 'instant_film'::character varying, 'wedding_events'::character varying, 'real_estate'::character varying, 'fashion_lifestyle'::character varying, 'food_culinary'::character varying, 'pet_animal'::character varying, 'travel_landscape'::character varying, 'artistic'::character varying, 'corporate_portrait'::character varying, 'ecommerce'::character varying, 'linkedin_photo'::character varying, 'product_lifestyle'::character varying, 'product_studio'::character varying])::"text"[]))),
    CONSTRAINT "valid_usage_count" CHECK (("usage_count" >= 0))
);


ALTER TABLE "public"."presets" OWNER TO "postgres";


COMMENT ON TABLE "public"."presets" IS 'Includes 18 video-specific presets with cinematic_settings.video configuration (added 2025-10-09)';



COMMENT ON COLUMN "public"."presets"."prompt_template" IS 'Prompt template for image generation (text-to-image, image-to-image)';



COMMENT ON COLUMN "public"."presets"."style_settings" IS 'JSONB object containing style-related settings including:
- style: Style name (see ai_metadata.style for available values)
- resolution: Base resolution (1024, 2048)
- aspect_ratio: Image aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4, 21:9)
- intensity: Style strength (0.1-2.0)
- consistency_level: Output consistency (low, medium, high)
';



COMMENT ON COLUMN "public"."presets"."technical_settings" IS 'JSONB object containing technical settings including:
- num_images: Number of images to generate (1-10)
- generation_mode: text-to-image or image-to-image
';



COMMENT ON COLUMN "public"."presets"."ai_metadata" IS 'JSONB object containing AI-specific metadata including:
- style: One of the following values:
  Photographic Styles: Photorealistic, Cinematic, Portrait, Fashion, Editorial, Commercial, Lifestyle, Street, Architecture, Nature
  Artistic Styles: Impressionist, Renaissance, Baroque, Art Deco, Pop Art, Watercolor, Oil Painting, Sketch, Abstract, Surreal, Minimalist, Maximalist
  Digital/Modern Styles: Digital Art, Concept Art, Illustration, Cartoon, Fantasy, Sci-Fi, Cyberpunk
  Classic Styles: Vintage, Artistic, Painterly
- mood: Dramatic, Ethereal, Moody, Bright, Dark, Vibrant, Minimal, Maximal, Futuristic, Vintage, Natural, Surreal
- tags: Array of searchable tags
- subject: Optional default subject for the preset
';



COMMENT ON COLUMN "public"."presets"."seedream_config" IS 'JSONB object containing Seedream-specific configuration';



COMMENT ON COLUMN "public"."presets"."likes_count" IS 'Cached count of total likes for this preset';



COMMENT ON COLUMN "public"."presets"."display_name" IS 'Human-readable display name for the preset';



COMMENT ON COLUMN "public"."presets"."is_active" IS 'Whether this preset is currently active/available';



COMMENT ON COLUMN "public"."presets"."sort_order" IS 'Order for displaying presets in lists';



COMMENT ON COLUMN "public"."presets"."prompt_template_video" IS 'Prompt template for video generation (text-to-video, image-to-video). Falls back to prompt_template if null.';



COMMENT ON COLUMN "public"."presets"."cinematic_settings" IS 'Video-specific cinematic settings (camera movements, motion type, etc.)';



COMMENT ON COLUMN "public"."presets"."latest_promoted_image_url" IS 'URL of the most recently promoted gallery image for this preset (auto-updated)';



CREATE OR REPLACE VIEW "public"."preset_full_details" AS
 SELECT "id",
    "user_id",
    "name",
    "description",
    "category",
    "prompt_template",
    "negative_prompt",
    "style_settings",
    "technical_settings",
    "ai_metadata",
    "seedream_config",
    "generation_mode",
    "is_public",
    "is_featured",
    "usage_count",
    "last_used_at",
    "created_at",
    "updated_at",
    "likes_count",
    "display_name",
    "is_active",
    "sort_order",
    "is_for_sale",
    "sale_price",
    "seller_user_id",
    "marketplace_status",
    "total_sales",
    "revenue_earned",
    "prompt_template_video",
    "cinematic_settings",
        CASE
            WHEN (("auth"."uid"() = "user_id") OR "public"."user_owns_preset"("id", "auth"."uid"())) THEN "prompt_template"
            ELSE '🔒 Purchase this preset to view the prompt'::"text"
        END AS "accessible_prompt_template",
        CASE
            WHEN (("auth"."uid"() = "user_id") OR "public"."user_owns_preset"("id", "auth"."uid"())) THEN "negative_prompt"
            ELSE NULL::"text"
        END AS "accessible_negative_prompt",
        CASE
            WHEN (("auth"."uid"() = "user_id") OR "public"."user_owns_preset"("id", "auth"."uid"())) THEN "style_settings"
            ELSE '{}'::"jsonb"
        END AS "accessible_style_settings",
        CASE
            WHEN (("auth"."uid"() = "user_id") OR "public"."user_owns_preset"("id", "auth"."uid"())) THEN "technical_settings"
            ELSE '{}'::"jsonb"
        END AS "accessible_technical_settings",
        CASE
            WHEN (("auth"."uid"() = "user_id") OR "public"."user_owns_preset"("id", "auth"."uid"())) THEN "seedream_config"
            ELSE '{}'::"jsonb"
        END AS "accessible_seedream_config",
        CASE
            WHEN (("auth"."uid"() = "user_id") OR "public"."user_owns_preset"("id", "auth"."uid"())) THEN "cinematic_settings"
            ELSE '{}'::"jsonb"
        END AS "accessible_cinematic_settings",
    "public"."user_owns_preset"("id", COALESCE("auth"."uid"(), '00000000-0000-0000-0000-000000000000'::"uuid")) AS "user_owns_preset"
   FROM "public"."presets" "p";


ALTER VIEW "public"."preset_full_details" OWNER TO "postgres";


COMMENT ON VIEW "public"."preset_full_details" IS 'Full preset view with conditional access to sensitive fields based on ownership/purchase.';



CREATE TABLE IF NOT EXISTS "public"."preset_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preset_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "source_image_url" "text",
    "source_image_hash" "text",
    "result_image_url" "text" NOT NULL,
    "result_image_hash" "text",
    "generation_id" "text",
    "generation_provider" "text" DEFAULT 'nanobanana'::"text",
    "generation_model" "text",
    "generation_credits" integer DEFAULT 0,
    "prompt_used" "text" NOT NULL,
    "negative_prompt_used" "text",
    "generation_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "is_verified" boolean DEFAULT false,
    "verification_timestamp" timestamp with time zone,
    "verification_method" "text",
    "title" "text",
    "description" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."preset_images" OWNER TO "postgres";


COMMENT ON TABLE "public"."preset_images" IS 'Stores verified sample images generated using presets for showcasing purposes';



COMMENT ON COLUMN "public"."preset_images"."preset_id" IS 'References either presets.id or cinematic_presets.id';



COMMENT ON COLUMN "public"."preset_images"."generation_settings" IS 'JSON object containing generation parameters like steps, guidance_scale, etc.';



COMMENT ON COLUMN "public"."preset_images"."is_verified" IS 'Whether this image has been verified as a legitimate sample';



CREATE TABLE IF NOT EXISTS "public"."preset_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preset_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."preset_likes" OWNER TO "postgres";


COMMENT ON TABLE "public"."preset_likes" IS 'Tracks which users have liked which presets';



COMMENT ON COLUMN "public"."preset_likes"."preset_id" IS 'Reference to the liked preset';



COMMENT ON COLUMN "public"."preset_likes"."user_id" IS 'Reference to the user who liked the preset';



CREATE TABLE IF NOT EXISTS "public"."preset_marketplace_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preset_id" "uuid" NOT NULL,
    "seller_user_id" "uuid" NOT NULL,
    "sale_price" integer NOT NULL,
    "marketplace_title" character varying(150) NOT NULL,
    "marketplace_description" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "total_sales" integer DEFAULT 0,
    "revenue_earned" integer DEFAULT 0,
    "status" character varying(20) DEFAULT 'pending_review'::character varying,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "is_featured" boolean DEFAULT false,
    "featured_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "preset_marketplace_listings_sale_price_check" CHECK (("sale_price" > 0)),
    CONSTRAINT "preset_marketplace_listings_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending_review'::character varying, 'approved'::character varying, 'rejected'::character varying, 'paused'::character varying, 'sold_out'::character varying])::"text"[])))
);


ALTER TABLE "public"."preset_marketplace_listings" OWNER TO "postgres";


COMMENT ON TABLE "public"."preset_marketplace_listings" IS 'Tracks preset listings in the marketplace with approval workflow';



CREATE OR REPLACE VIEW "public"."preset_marketplace_preview" AS
 SELECT "id",
    "user_id",
    "name",
    "display_name",
    "description",
    "category",
    "generation_mode",
    "is_public",
    "is_featured",
    "usage_count",
    "created_at",
    "updated_at",
    "likes_count",
    "is_for_sale",
    "sale_price",
    "seller_user_id",
    "marketplace_status",
    "total_sales",
    ( SELECT "array_agg"("pi"."result_image_url" ORDER BY "pi"."created_at" DESC) AS "array_agg"
           FROM "public"."preset_images" "pi"
          WHERE ("pi"."preset_id" = "p"."id")
         LIMIT 5) AS "preview_images",
        CASE
            WHEN ("auth"."uid"() IS NULL) THEN false
            ELSE "public"."user_owns_preset"("id", "auth"."uid"())
        END AS "user_owns_preset"
   FROM "public"."presets" "p"
  WHERE (("is_public" = true) AND ("is_for_sale" = true) AND (("marketplace_status")::"text" = 'approved'::"text"));


ALTER VIEW "public"."preset_marketplace_preview" OWNER TO "postgres";


COMMENT ON VIEW "public"."preset_marketplace_preview" IS 'Safe view for browsing marketplace presets. Excludes sensitive fields like prompts and settings.';



CREATE TABLE IF NOT EXISTS "public"."preset_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "preset_id" "uuid",
    "type" character varying(100) NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "action_url" "text",
    "data" "jsonb",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."preset_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."preset_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preset_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "buyer_user_id" "uuid" NOT NULL,
    "seller_user_id" "uuid" NOT NULL,
    "purchase_price" integer NOT NULL,
    "platform_fee" integer DEFAULT 0,
    "seller_payout" integer NOT NULL,
    "credit_transaction_id" "uuid",
    "payment_status" character varying(20) DEFAULT 'completed'::character varying,
    "purchased_at" timestamp with time zone DEFAULT "now"(),
    "refunded_at" timestamp with time zone,
    "refund_reason" "text",
    CONSTRAINT "preset_purchases_payment_status_check" CHECK ((("payment_status")::"text" = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::"text"[])))
);


ALTER TABLE "public"."preset_purchases" OWNER TO "postgres";


COMMENT ON TABLE "public"."preset_purchases" IS 'Records all preset purchases with credit transaction details';



CREATE TABLE IF NOT EXISTS "public"."preset_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preset_id" "uuid" NOT NULL,
    "purchase_id" "uuid" NOT NULL,
    "reviewer_user_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "title" character varying(100),
    "comment" "text",
    "helpful_votes" integer DEFAULT 0,
    "is_verified_purchase" boolean DEFAULT true,
    "is_visible" boolean DEFAULT true,
    "moderated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "preset_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."preset_reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."preset_reviews" IS 'User reviews for purchased presets with ratings';



CREATE TABLE IF NOT EXISTS "public"."preset_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preset_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "used_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."preset_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."preset_usage" IS 'Tracks individual usage events for presets by users';



COMMENT ON COLUMN "public"."preset_usage"."preset_id" IS 'Reference to the preset that was used';



COMMENT ON COLUMN "public"."preset_usage"."user_id" IS 'Reference to the user who used the preset';



COMMENT ON COLUMN "public"."preset_usage"."used_at" IS 'When the preset was used';



CREATE TABLE IF NOT EXISTS "public"."preset_visual_aids" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preset_key" character varying(100) NOT NULL,
    "platform_image_id" "uuid" NOT NULL,
    "visual_aid_type" character varying(50) NOT NULL,
    "display_title" character varying(255),
    "display_description" "text",
    "is_primary" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_visual_aid_type" CHECK ((("visual_aid_type")::"text" = ANY ((ARRAY['example_result'::character varying, 'style_reference'::character varying, 'before_after'::character varying, 'inspiration'::character varying, 'parameter_demo'::character varying])::"text"[])))
);


ALTER TABLE "public"."preset_visual_aids" OWNER TO "postgres";


COMMENT ON TABLE "public"."preset_visual_aids" IS 'Links platform images to specific presets for visual guidance';



COMMENT ON COLUMN "public"."preset_visual_aids"."preset_key" IS 'Key identifying the preset this visual aid belongs to';



COMMENT ON COLUMN "public"."preset_visual_aids"."visual_aid_type" IS 'Type of visual aid: example_result, style_reference, before_after, etc.';



COMMENT ON COLUMN "public"."preset_visual_aids"."is_primary" IS 'Whether this is the primary visual aid for the preset';



CREATE TABLE IF NOT EXISTS "public"."provider_performance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" character varying(50) NOT NULL,
    "date" "date" NOT NULL,
    "total_requests" integer DEFAULT 0,
    "successful_requests" integer DEFAULT 0,
    "failed_requests" integer DEFAULT 0,
    "average_processing_time_ms" integer DEFAULT 0,
    "average_quality_score" numeric(3,2) DEFAULT 0,
    "total_cost" numeric(10,4) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."provider_performance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "resource_type" character varying(50) NOT NULL,
    "subscription_tier" "public"."subscription_tier" NOT NULL,
    "time_window_minutes" integer NOT NULL,
    "max_actions" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_limits" OWNER TO "postgres";


COMMENT ON TABLE "public"."rate_limits" IS 'Configuration table for rate limits per subscription tier and resource type';



CREATE TABLE IF NOT EXISTS "public"."refund_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid",
    "user_id" "uuid",
    "credits_refunded" integer NOT NULL,
    "refund_reason" character varying(100),
    "error_message" "text",
    "previous_balance" integer,
    "new_balance" integer,
    "platform_loss" integer DEFAULT 0,
    "processed_by" character varying(50) DEFAULT 'system'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."refund_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."refund_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "error_type" character varying(50) NOT NULL,
    "should_refund" boolean DEFAULT true NOT NULL,
    "refund_percentage" numeric(5,2) DEFAULT 100.00,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."refund_policies" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."rental_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "message" "text",
    "total_amount_cents" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rental_requests_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "rental_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'cancelled'::"text", 'completed'::"text"]))),
    CONSTRAINT "rental_requests_total_amount_cents_check" CHECK (("total_amount_cents" >= 0)),
    CONSTRAINT "valid_rental_amount" CHECK (("total_amount_cents" >= 0)),
    CONSTRAINT "valid_rental_dates" CHECK (("end_date" > "start_date"))
);


ALTER TABLE "public"."rental_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."rental_requests" IS 'Rental requests for equipment listings';



COMMENT ON COLUMN "public"."rental_requests"."total_amount_cents" IS 'Total cost including rental, deposit, and retainer';



CREATE TABLE IF NOT EXISTS "public"."request_conversation_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."request_conversation_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."request_conversation_messages" IS 'Messages within request conversations';



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


CREATE TABLE IF NOT EXISTS "public"."sale_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "unit_price_cents" integer NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "total_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
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


COMMENT ON TABLE "public"."sale_orders" IS 'Sale transactions for marketplace';



COMMENT ON COLUMN "public"."sale_orders"."status" IS 'Current status of sale transaction';



CREATE TABLE IF NOT EXISTS "public"."scene_moods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'mood'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."scene_moods" OWNER TO "postgres";


COMMENT ON TABLE "public"."scene_moods" IS 'Predefined scene mood options';



CREATE TABLE IF NOT EXISTS "public"."shot_sizes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'shot'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shot_sizes" OWNER TO "postgres";


COMMENT ON TABLE "public"."shot_sizes" IS 'Predefined shot size options';



CREATE TABLE IF NOT EXISTS "public"."showcase_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "showcase_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "comment" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."showcase_comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."showcase_comments" IS 'User comments on showcases with support for nested replies';



CREATE TABLE IF NOT EXISTS "public"."showcase_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "showcase_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."showcase_likes" OWNER TO "postgres";


COMMENT ON TABLE "public"."showcase_likes" IS 'Tracks which users have liked which showcases';



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
    "likes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    CONSTRAINT "media_count" CHECK ((("array_length"("media_ids", 1) >= 3) AND ("array_length"("media_ids", 1) <= 6)))
);


ALTER TABLE "public"."showcases" OWNER TO "postgres";


COMMENT ON COLUMN "public"."showcases"."likes_count" IS 'Cached count of total likes for this showcase';



COMMENT ON COLUMN "public"."showcases"."comments_count" IS 'Cached count of total comments for this showcase';



CREATE TABLE IF NOT EXISTS "public"."specializations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "category" character varying(50) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."specializations" OWNER TO "postgres";


COMMENT ON TABLE "public"."specializations" IS 'Professional specializations for creative and technical roles';



COMMENT ON COLUMN "public"."specializations"."name" IS 'Name of the specialization';



COMMENT ON COLUMN "public"."specializations"."category" IS 'Category: photography, videography, post-production, technical, business';



COMMENT ON COLUMN "public"."specializations"."description" IS 'Description of the specialization';



CREATE TABLE IF NOT EXISTS "public"."style_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "style_name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "category" character varying(50) NOT NULL,
    "text_to_image_prompt" "text" NOT NULL,
    "image_to_image_prompt" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."style_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subject_counts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'subject'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subject_counts" OWNER TO "postgres";


COMMENT ON TABLE "public"."subject_counts" IS 'Predefined subject count options';



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


CREATE TABLE IF NOT EXISTS "public"."system_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_type" character varying(100) NOT NULL,
    "user_id" "uuid",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."system_logs" IS 'Security event logging table with admin-only access';



CREATE TABLE IF NOT EXISTS "public"."time_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'time'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."time_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."time_settings" IS 'Predefined time setting options';



CREATE TABLE IF NOT EXISTS "public"."timezones" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "utc_offset" character varying(10) NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."timezones" OWNER TO "postgres";


COMMENT ON TABLE "public"."timezones" IS 'Available timezone options for user profiles';



COMMENT ON COLUMN "public"."timezones"."value" IS 'Timezone identifier (e.g., UTC, EST, PST)';



COMMENT ON COLUMN "public"."timezones"."label" IS 'Display label for the timezone';



COMMENT ON COLUMN "public"."timezones"."utc_offset" IS 'UTC offset (e.g., +00:00, -05:00)';



COMMENT ON COLUMN "public"."timezones"."description" IS 'Optional description of the timezone';



COMMENT ON COLUMN "public"."timezones"."sort_order" IS 'Order for display purposes';



COMMENT ON COLUMN "public"."timezones"."is_active" IS 'Whether this timezone is available for selection';



CREATE TABLE IF NOT EXISTS "public"."treatment_analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "treatment_id" "uuid" NOT NULL,
    "viewer_id" "uuid",
    "session_id" "text",
    "page_views" integer DEFAULT 1,
    "time_on_page_seconds" integer DEFAULT 0,
    "pages_viewed" "text"[],
    "referrer" "text",
    "user_agent" "text",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treatment_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treatment_assets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "treatment_id" "uuid" NOT NULL,
    "asset_type" "text" NOT NULL,
    "asset_id" "uuid",
    "asset_url" "text",
    "asset_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "position_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treatment_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treatment_sharing" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "treatment_id" "uuid" NOT NULL,
    "shared_with_user_id" "uuid",
    "shared_with_email" "text",
    "permission_level" "text" DEFAULT 'view'::"text" NOT NULL,
    "expires_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treatment_sharing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treatment_versions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "treatment_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "json_content" "jsonb" NOT NULL,
    "change_summary" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treatment_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treatments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "moodboard_id" "uuid",
    "title" "text" NOT NULL,
    "format" "public"."treatment_format" DEFAULT 'film_tv'::"public"."treatment_format" NOT NULL,
    "status" "public"."treatment_status" DEFAULT 'draft'::"public"."treatment_status" NOT NULL,
    "theme" "public"."treatment_theme" DEFAULT 'cinematic'::"public"."treatment_theme" NOT NULL,
    "outline_schema_version" integer DEFAULT 1 NOT NULL,
    "json_content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "cover_image_id" "uuid",
    "cover_image_url" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "password_hash" "text",
    "showcase_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "published_at" timestamp with time zone,
    CONSTRAINT "treatments_title_not_empty" CHECK (("length"(TRIM(BOTH FROM "title")) > 0))
);


ALTER TABLE "public"."treatments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."typing_indicators" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "is_typing" boolean DEFAULT true,
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."typing_indicators" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."unified_presets" AS
 SELECT "presets"."id",
    'regular'::"text" AS "preset_type",
    "presets"."user_id",
    "presets"."name",
    "presets"."display_name",
    "presets"."description",
    "presets"."category",
    "presets"."prompt_template",
    "presets"."negative_prompt",
    "presets"."style_settings",
    "presets"."technical_settings",
    "presets"."ai_metadata",
    "presets"."seedream_config",
    "presets"."generation_mode",
    "presets"."is_public",
    "presets"."is_featured",
    "presets"."is_active",
    "presets"."sort_order",
    "presets"."usage_count",
    "presets"."last_used_at",
    "presets"."is_for_sale",
    "presets"."sale_price",
    "presets"."seller_user_id",
    "presets"."marketplace_status",
    "presets"."total_sales",
    "presets"."revenue_earned",
    "presets"."likes_count",
    "presets"."created_at",
    "presets"."updated_at"
   FROM "public"."presets"
  WHERE ("presets"."is_active" = true)
UNION ALL
 SELECT "cinematic_presets"."id",
    'cinematic'::"text" AS "preset_type",
    "cinematic_presets"."user_id",
    "cinematic_presets"."name",
    "cinematic_presets"."display_name",
    "cinematic_presets"."description",
    "cinematic_presets"."category",
    "cinematic_presets"."prompt_template",
    "cinematic_presets"."negative_prompt",
    "cinematic_presets"."style_settings",
    "cinematic_presets"."technical_settings",
    "cinematic_presets"."ai_metadata",
    "cinematic_presets"."seedream_config",
    "cinematic_presets"."generation_mode",
    "cinematic_presets"."is_public",
    "cinematic_presets"."is_featured",
    "cinematic_presets"."is_active",
    "cinematic_presets"."sort_order",
    "cinematic_presets"."usage_count",
    "cinematic_presets"."last_used_at",
    "cinematic_presets"."is_for_sale",
    "cinematic_presets"."sale_price",
    "cinematic_presets"."seller_user_id",
    "cinematic_presets"."marketplace_status",
    "cinematic_presets"."total_sales",
    "cinematic_presets"."revenue_earned",
    "cinematic_presets"."likes_count",
    "cinematic_presets"."created_at",
    "cinematic_presets"."updated_at"
   FROM "public"."cinematic_presets"
  WHERE ("cinematic_presets"."is_active" = true);


ALTER VIEW "public"."unified_presets" OWNER TO "postgres";


COMMENT ON VIEW "public"."unified_presets" IS 'Unified view of both regular and cinematic presets with consistent structure';



CREATE TABLE IF NOT EXISTS "public"."user_availability" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "available_from" timestamp with time zone NOT NULL,
    "available_until" timestamp with time zone NOT NULL,
    "timezone" character varying(50) DEFAULT 'UTC'::character varying,
    "notes" "text",
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "jsonb",
    "is_blocked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_availability" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_availability" IS 'User availability schedules for shoot planning';



CREATE TABLE IF NOT EXISTS "public"."user_blocks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "blocker_user_id" "uuid" NOT NULL,
    "blocked_user_id" "uuid" NOT NULL,
    "reason" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_no_self_block" CHECK (("blocker_user_id" <> "blocked_user_id"))
);


ALTER TABLE "public"."user_blocks" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_blocks" IS 'User blocking system - stores which users have blocked other users';



CREATE TABLE IF NOT EXISTS "public"."user_clothing_sizes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "clothing_type" character varying(50) NOT NULL,
    "size_system_id" integer NOT NULL,
    "size_value" character varying(20) NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_clothing_sizes_clothing_type_check" CHECK ((("clothing_type")::"text" = ANY ((ARRAY['tops'::character varying, 'bottoms'::character varying, 'dresses'::character varying, 'outerwear'::character varying, 'underwear'::character varying, 'swimwear'::character varying, 'accessories'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_clothing_sizes" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_clothing_sizes" IS 'User-specific clothing sizes for different types and systems';



COMMENT ON COLUMN "public"."user_clothing_sizes"."clothing_type" IS 'Type of clothing: tops, bottoms, dresses, outerwear, etc.';



CREATE TABLE IF NOT EXISTS "public"."user_credit_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "package_id" character varying(50),
    "credits_purchased" integer NOT NULL,
    "amount_paid_usd" numeric(10,4) NOT NULL,
    "status" character varying(20) DEFAULT 'completed'::character varying,
    "payment_provider" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_credit_purchases" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_credit_purchases" IS 'Analytics table tracking user credit purchases';



CREATE TABLE IF NOT EXISTS "public"."user_equipment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "equipment_model_id" "uuid" NOT NULL,
    "is_primary" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_equipment" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_equipment" IS 'User-specific equipment inventory';



CREATE OR REPLACE VIEW "public"."user_equipment_view" AS
 SELECT "ue"."id",
    "ue"."profile_id",
    "ue"."is_primary",
    "ue"."display_order",
    "ue"."created_at",
    "ue"."updated_at",
    "em"."brand",
    "em"."model",
    "em"."description",
    "em"."condition",
    "et"."name" AS "equipment_type_name",
    "et"."display_name" AS "equipment_type_display_name",
    "et"."icon" AS "equipment_type_icon",
    "et"."category" AS "equipment_type_category"
   FROM (("public"."user_equipment" "ue"
     JOIN "public"."equipment_models" "em" ON (("ue"."equipment_model_id" = "em"."id")))
     JOIN "public"."equipment_types" "et" ON (("em"."equipment_type_id" = "et"."id")))
  ORDER BY "ue"."display_order", "et"."sort_order", "em"."brand", "em"."model";


ALTER VIEW "public"."user_equipment_view" OWNER TO "postgres";


COMMENT ON VIEW "public"."user_equipment_view" IS 'View combining user equipment with model and type details';



CREATE TABLE IF NOT EXISTS "public"."user_handle_redirects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "old_handle" character varying(50) NOT NULL,
    "new_handle" character varying(50) NOT NULL,
    "user_profile_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "new_handle_format" CHECK ((("new_handle")::"text" ~ '^[a-z0-9_]+$'::"text")),
    CONSTRAINT "no_self_redirect" CHECK ((("old_handle")::"text" <> ("new_handle")::"text")),
    CONSTRAINT "old_handle_format" CHECK ((("old_handle")::"text" ~ '^[a-z0-9_]+$'::"text"))
);


ALTER TABLE "public"."user_handle_redirects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_measurements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "measurement_type" character varying(50) NOT NULL,
    "measurement_value" numeric(5,2) NOT NULL,
    "unit" character varying(10) DEFAULT 'in'::character varying NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_measurements_measurement_type_check" CHECK ((("measurement_type")::"text" = ANY ((ARRAY['chest'::character varying, 'waist'::character varying, 'hips'::character varying, 'inseam'::character varying, 'sleeve'::character varying, 'neck'::character varying, 'shoulder'::character varying, 'bust'::character varying, 'underbust'::character varying])::"text"[]))),
    CONSTRAINT "user_measurements_unit_check" CHECK ((("unit")::"text" = ANY ((ARRAY['cm'::character varying, 'in'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_measurements" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_measurements" IS 'User body measurements (chest, waist, hips, etc.) for custom sizing';



COMMENT ON COLUMN "public"."user_measurements"."measurement_type" IS 'Type of measurement: chest, waist, hips, bust, inseam, etc.';



COMMENT ON COLUMN "public"."user_measurements"."unit" IS 'Unit of measurement: cm (centimeters) or in (inches)';



CREATE TABLE IF NOT EXISTS "public"."user_provider_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "preferred_provider" character varying(50) DEFAULT 'nanobanana'::character varying,
    "auto_fallback" boolean DEFAULT true,
    "quality_priority" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_provider_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_rate_limits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_profile_id" "uuid" NOT NULL,
    "resource_type" character varying(50) NOT NULL,
    "action_count" integer DEFAULT 1 NOT NULL,
    "window_start" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_action" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_rate_limits" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_rate_limits" IS 'Tracking table for user rate limit usage across time windows';



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
    "message_read_receipts" boolean DEFAULT true,
    "allow_stranger_messages" boolean DEFAULT true,
    CONSTRAINT "user_settings_profile_visibility_check" CHECK ((("profile_visibility")::"text" = ANY ((ARRAY['public'::character varying, 'private'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_settings" IS 'User-specific application settings including notifications, privacy, and security preferences';



COMMENT ON COLUMN "public"."user_settings"."message_notifications" IS 'Whether user wants to receive notifications for new messages';



COMMENT ON COLUMN "public"."user_settings"."message_read_receipts" IS 'Whether user wants to show read receipts to others';



COMMENT ON COLUMN "public"."user_settings"."allow_stranger_messages" IS 'Whether user allows messages from users they havent worked with';



CREATE TABLE IF NOT EXISTS "public"."user_skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "skill_type" "public"."skill_type" NOT NULL,
    "skill_name" character varying(100) NOT NULL,
    "proficiency_level" "public"."proficiency_level" DEFAULT 'intermediate'::"public"."proficiency_level",
    "years_experience" integer,
    "verified" boolean DEFAULT false,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "description" "text",
    "is_featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_skills_years_experience_check" CHECK ((("years_experience" >= 0) AND ("years_experience" <= 50)))
);


ALTER TABLE "public"."user_skills" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_skills" IS 'User skills with per-skill years of experience and proficiency levels';



COMMENT ON COLUMN "public"."user_skills"."skill_type" IS 'Type of skill: technical, creative, equipment, software, interpersonal';



COMMENT ON COLUMN "public"."user_skills"."skill_name" IS 'Name of the skill/specialization';



COMMENT ON COLUMN "public"."user_skills"."proficiency_level" IS 'User proficiency level: beginner, intermediate, advanced, expert';



COMMENT ON COLUMN "public"."user_skills"."years_experience" IS 'Years of experience in this specific skill (0-50)';



COMMENT ON COLUMN "public"."user_skills"."verified" IS 'Whether this skill has been verified by another user';



COMMENT ON COLUMN "public"."user_skills"."is_featured" IS 'Show this skill prominently on the profile';



CREATE OR REPLACE VIEW "public"."user_skills_view" AS
 SELECT "us"."id",
    "us"."profile_id",
    "up"."display_name",
    "up"."handle",
    "us"."skill_type",
    "us"."skill_name",
    "us"."proficiency_level",
    "us"."years_experience",
    "us"."verified",
    "us"."description",
    "us"."is_featured",
    "us"."created_at",
    "us"."updated_at",
        CASE
            WHEN ("us"."years_experience" IS NULL) THEN 'Not specified'::"text"
            WHEN ("us"."years_experience" = 0) THEN 'Beginner'::"text"
            WHEN (("us"."years_experience" >= 1) AND ("us"."years_experience" <= 2)) THEN 'Novice'::"text"
            WHEN (("us"."years_experience" >= 3) AND ("us"."years_experience" <= 5)) THEN 'Intermediate'::"text"
            WHEN (("us"."years_experience" >= 6) AND ("us"."years_experience" <= 10)) THEN 'Advanced'::"text"
            WHEN ("us"."years_experience" > 10) THEN 'Expert'::"text"
            ELSE 'Not specified'::"text"
        END AS "experience_level_label"
   FROM ("public"."user_skills" "us"
     JOIN "public"."users_profile" "up" ON (("us"."profile_id" = "up"."id")));


ALTER VIEW "public"."user_skills_view" OWNER TO "postgres";


COMMENT ON VIEW "public"."user_skills_view" IS 'View of user skills with calculated experience level labels';



CREATE TABLE IF NOT EXISTS "public"."user_vibe_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "vibe_id" "uuid",
    "usage_count" integer DEFAULT 1,
    "last_used_at" timestamp with time zone DEFAULT "now"(),
    "confidence_score" numeric(3,2) DEFAULT 0.0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_vibe_analytics" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_vibe_analytics" IS 'Tracks user vibe usage patterns for personalization and matching';



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


COMMENT ON TABLE "public"."vibes_master" IS 'Master list of available vibes/styles for moodboards and user profiles';



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


CREATE TABLE IF NOT EXISTS "public"."weather_conditions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'weather'::character varying,
    "usage_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."weather_conditions" OWNER TO "postgres";


COMMENT ON TABLE "public"."weather_conditions" IS 'Predefined weather condition options';



CREATE TABLE IF NOT EXISTS "public"."working_time_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "value" character varying(50) NOT NULL,
    "label" character varying(100) NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "description" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."working_time_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."working_time_preferences" IS 'Predefined working time preference options';



COMMENT ON COLUMN "public"."working_time_preferences"."value" IS 'Unique identifier for the preference';



COMMENT ON COLUMN "public"."working_time_preferences"."label" IS 'Display label for the preference';



COMMENT ON COLUMN "public"."working_time_preferences"."start_time" IS 'Default start time for this preference (optional)';



COMMENT ON COLUMN "public"."working_time_preferences"."end_time" IS 'Default end time for this preference (optional)';



COMMENT ON COLUMN "public"."working_time_preferences"."description" IS 'Optional description of the preference';



COMMENT ON COLUMN "public"."working_time_preferences"."sort_order" IS 'Order for display purposes';



COMMENT ON COLUMN "public"."working_time_preferences"."is_active" IS 'Whether this preference is available for selection';



ALTER TABLE ONLY "public"."predefined_availability_statuses" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_availability_statuses_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_body_types" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_body_types_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_clothing_size_systems" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_clothing_size_systems_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_clothing_sizes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_clothing_sizes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_equipment_options" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_equipment_options_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_ethnicities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_ethnicities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_experience_levels" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_experience_levels_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_eye_colors" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_eye_colors_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_gender_identities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_gender_identities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_hair_colors" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_hair_colors_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_hair_lengths" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_hair_lengths_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_nationalities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_nationalities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_shoe_size_systems" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_shoe_size_systems_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_shoe_sizes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_shoe_sizes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_skin_tones" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_skin_tones_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_style_tags" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_style_tags_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."predefined_vibe_tags" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."predefined_vibe_tags_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."age_verification_logs"
    ADD CONSTRAINT "age_verification_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_providers"
    ADD CONSTRAINT "api_providers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."api_providers"
    ADD CONSTRAINT "api_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_attachments"
    ADD CONSTRAINT "application_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_feedback"
    ADD CONSTRAINT "application_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_messages"
    ADD CONSTRAINT "application_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_status_history"
    ADD CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_gig_id_applicant_user_id_key" UNIQUE ("gig_id", "applicant_user_id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."aspect_ratios"
    ADD CONSTRAINT "aspect_ratios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."aspect_ratios"
    ADD CONSTRAINT "aspect_ratios_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."browser_cache_config"
    ADD CONSTRAINT "browser_cache_config_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."browser_cache_config"
    ADD CONSTRAINT "browser_cache_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."camera_angles"
    ADD CONSTRAINT "camera_angles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."camera_angles"
    ADD CONSTRAINT "camera_angles_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."camera_movements"
    ADD CONSTRAINT "camera_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."camera_movements"
    ADD CONSTRAINT "camera_movements_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."cinematic_presets"
    ADD CONSTRAINT "cinematic_presets_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."cinematic_presets"
    ADD CONSTRAINT "cinematic_presets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collab_applications"
    ADD CONSTRAINT "collab_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collab_gear_offers"
    ADD CONSTRAINT "collab_gear_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collab_gear_requests"
    ADD CONSTRAINT "collab_gear_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collab_invitations"
    ADD CONSTRAINT "collab_invitations_invitation_token_key" UNIQUE ("invitation_token");



ALTER TABLE ONLY "public"."collab_invitations"
    ADD CONSTRAINT "collab_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collab_participants"
    ADD CONSTRAINT "collab_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collab_projects"
    ADD CONSTRAINT "collab_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collab_roles"
    ADD CONSTRAINT "collab_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."color_palettes"
    ADD CONSTRAINT "color_palettes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."color_palettes"
    ADD CONSTRAINT "color_palettes_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."composition_techniques"
    ADD CONSTRAINT "composition_techniques_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."composition_techniques"
    ADD CONSTRAINT "composition_techniques_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."contact_sharing"
    ADD CONSTRAINT "contact_sharing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_moderation_queue"
    ADD CONSTRAINT "content_moderation_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_user_id_key" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."depth_of_field"
    ADD CONSTRAINT "depth_of_field_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."depth_of_field"
    ADD CONSTRAINT "depth_of_field_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."director_styles"
    ADD CONSTRAINT "director_styles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."director_styles"
    ADD CONSTRAINT "director_styles_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."domain_events"
    ADD CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enhancement_tasks"
    ADD CONSTRAINT "enhancement_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment_brands"
    ADD CONSTRAINT "equipment_brands_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."equipment_brands"
    ADD CONSTRAINT "equipment_brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment_models"
    ADD CONSTRAINT "equipment_models_equipment_type_id_brand_model_key" UNIQUE ("equipment_type_id", "brand", "model");



ALTER TABLE ONLY "public"."equipment_models"
    ADD CONSTRAINT "equipment_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment_predefined_models"
    ADD CONSTRAINT "equipment_predefined_models_equipment_type_id_brand_model_key" UNIQUE ("equipment_type_id", "brand", "model");



ALTER TABLE ONLY "public"."equipment_predefined_models"
    ADD CONSTRAINT "equipment_predefined_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment_request_purposes"
    ADD CONSTRAINT "equipment_request_purposes_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."equipment_request_purposes"
    ADD CONSTRAINT "equipment_request_purposes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment_requests"
    ADD CONSTRAINT "equipment_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment_types"
    ADD CONSTRAINT "equipment_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."equipment_types"
    ADD CONSTRAINT "equipment_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."era_emulations"
    ADD CONSTRAINT "era_emulations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."era_emulations"
    ADD CONSTRAINT "era_emulations_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."eye_contacts"
    ADD CONSTRAINT "eye_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eye_contacts"
    ADD CONSTRAINT "eye_contacts_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."featured_preset_requests"
    ADD CONSTRAINT "featured_preset_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."foreground_elements"
    ADD CONSTRAINT "foreground_elements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."foreground_elements"
    ADD CONSTRAINT "foreground_elements_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."gig_invitations"
    ADD CONSTRAINT "gig_invitations_gig_id_invitee_id_key" UNIQUE ("gig_id", "invitee_id");



ALTER TABLE ONLY "public"."gig_invitations"
    ADD CONSTRAINT "gig_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gigs"
    ADD CONSTRAINT "gigs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."languages_master"
    ADD CONSTRAINT "languages_master_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."languages_master"
    ADD CONSTRAINT "languages_master_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lens_types"
    ADD CONSTRAINT "lens_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lens_types"
    ADD CONSTRAINT "lens_types_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."lighting_styles"
    ADD CONSTRAINT "lighting_styles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lighting_styles"
    ADD CONSTRAINT "lighting_styles_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."listing_comments"
    ADD CONSTRAINT "listing_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_images"
    ADD CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."location_types"
    ADD CONSTRAINT "location_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."location_types"
    ADD CONSTRAINT "location_types_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."lootbox_events"
    ADD CONSTRAINT "lootbox_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lootbox_packages"
    ADD CONSTRAINT "lootbox_packages_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."oauth_health_check"
    ADD CONSTRAINT "oauth_health_check_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."oauth_logs"
    ADD CONSTRAINT "oauth_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_credit_consumption"
    ADD CONSTRAINT "platform_credit_consumption_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_credits"
    ADD CONSTRAINT "platform_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_credits"
    ADD CONSTRAINT "platform_credits_provider_key" UNIQUE ("provider");



ALTER TABLE ONLY "public"."platform_images"
    ADD CONSTRAINT "platform_images_image_key_key" UNIQUE ("image_key");



ALTER TABLE ONLY "public"."platform_images"
    ADD CONSTRAINT "platform_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playground_gallery"
    ADD CONSTRAINT "playground_gallery_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playground_projects"
    ADD CONSTRAINT "playground_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_availability_statuses"
    ADD CONSTRAINT "predefined_availability_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_body_types"
    ADD CONSTRAINT "predefined_body_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_clothing_size_systems"
    ADD CONSTRAINT "predefined_clothing_size_systems_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_clothing_size_systems"
    ADD CONSTRAINT "predefined_clothing_size_systems_system_name_region_gender_key" UNIQUE ("system_name", "region", "gender");



ALTER TABLE ONLY "public"."predefined_clothing_sizes"
    ADD CONSTRAINT "predefined_clothing_sizes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_clothing_sizes"
    ADD CONSTRAINT "predefined_clothing_sizes_size_system_id_size_value_key" UNIQUE ("size_system_id", "size_value");



ALTER TABLE ONLY "public"."predefined_equipment_options"
    ADD CONSTRAINT "predefined_equipment_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_ethnicities"
    ADD CONSTRAINT "predefined_ethnicities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_experience_levels"
    ADD CONSTRAINT "predefined_experience_levels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_eye_colors"
    ADD CONSTRAINT "predefined_eye_colors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_gear_categories"
    ADD CONSTRAINT "predefined_gear_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."predefined_gear_categories"
    ADD CONSTRAINT "predefined_gear_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_gender_identities"
    ADD CONSTRAINT "predefined_gender_identities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_hair_colors"
    ADD CONSTRAINT "predefined_hair_colors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_hair_lengths"
    ADD CONSTRAINT "predefined_hair_lengths_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_nationalities"
    ADD CONSTRAINT "predefined_nationalities_nationality_name_key" UNIQUE ("nationality_name");



ALTER TABLE ONLY "public"."predefined_nationalities"
    ADD CONSTRAINT "predefined_nationalities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_professional_skills"
    ADD CONSTRAINT "predefined_professional_skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_professional_skills"
    ADD CONSTRAINT "predefined_professional_skills_skill_name_key" UNIQUE ("skill_name");



ALTER TABLE ONLY "public"."predefined_roles"
    ADD CONSTRAINT "predefined_roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."predefined_roles"
    ADD CONSTRAINT "predefined_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_shoe_size_systems"
    ADD CONSTRAINT "predefined_shoe_size_systems_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_shoe_size_systems"
    ADD CONSTRAINT "predefined_shoe_size_systems_system_name_key" UNIQUE ("system_name");



ALTER TABLE ONLY "public"."predefined_shoe_sizes"
    ADD CONSTRAINT "predefined_shoe_sizes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_shoe_sizes"
    ADD CONSTRAINT "predefined_shoe_sizes_size_system_id_size_value_key" UNIQUE ("size_system_id", "size_value");



ALTER TABLE ONLY "public"."predefined_skills"
    ADD CONSTRAINT "predefined_skills_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."predefined_skills"
    ADD CONSTRAINT "predefined_skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_skin_tones"
    ADD CONSTRAINT "predefined_skin_tones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_style_tags"
    ADD CONSTRAINT "predefined_style_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_style_tags"
    ADD CONSTRAINT "predefined_style_tags_tag_name_key" UNIQUE ("tag_name");



ALTER TABLE ONLY "public"."predefined_talent_categories"
    ADD CONSTRAINT "predefined_talent_categories_category_name_key" UNIQUE ("category_name");



ALTER TABLE ONLY "public"."predefined_talent_categories"
    ADD CONSTRAINT "predefined_talent_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_vibe_tags"
    ADD CONSTRAINT "predefined_vibe_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predefined_vibe_tags"
    ADD CONSTRAINT "predefined_vibe_tags_tag_name_key" UNIQUE ("tag_name");



ALTER TABLE ONLY "public"."preset_images"
    ADD CONSTRAINT "preset_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preset_likes"
    ADD CONSTRAINT "preset_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preset_likes"
    ADD CONSTRAINT "preset_likes_preset_id_user_id_key" UNIQUE ("preset_id", "user_id");



ALTER TABLE ONLY "public"."preset_marketplace_listings"
    ADD CONSTRAINT "preset_marketplace_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preset_marketplace_listings"
    ADD CONSTRAINT "preset_marketplace_listings_preset_id_key" UNIQUE ("preset_id");



ALTER TABLE ONLY "public"."preset_notifications"
    ADD CONSTRAINT "preset_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preset_purchases"
    ADD CONSTRAINT "preset_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preset_purchases"
    ADD CONSTRAINT "preset_purchases_preset_id_buyer_user_id_key" UNIQUE ("preset_id", "buyer_user_id");



ALTER TABLE ONLY "public"."preset_reviews"
    ADD CONSTRAINT "preset_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preset_reviews"
    ADD CONSTRAINT "preset_reviews_purchase_id_key" UNIQUE ("purchase_id");



ALTER TABLE ONLY "public"."preset_usage"
    ADD CONSTRAINT "preset_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preset_visual_aids"
    ADD CONSTRAINT "preset_visual_aids_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."presets"
    ADD CONSTRAINT "presets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_performance"
    ADD CONSTRAINT "provider_performance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_performance"
    ADD CONSTRAINT "provider_performance_provider_date_key" UNIQUE ("provider", "date");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_resource_type_subscription_tier_key" UNIQUE ("resource_type", "subscription_tier");



ALTER TABLE ONLY "public"."refund_audit_log"
    ADD CONSTRAINT "refund_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refund_policies"
    ADD CONSTRAINT "refund_policies_error_type_key" UNIQUE ("error_type");



ALTER TABLE ONLY "public"."refund_policies"
    ADD CONSTRAINT "refund_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rental_orders"
    ADD CONSTRAINT "rental_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rental_requests"
    ADD CONSTRAINT "rental_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_conversation_messages"
    ADD CONSTRAINT "request_conversation_messages_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."scene_moods"
    ADD CONSTRAINT "scene_moods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scene_moods"
    ADD CONSTRAINT "scene_moods_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."shot_sizes"
    ADD CONSTRAINT "shot_sizes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shot_sizes"
    ADD CONSTRAINT "shot_sizes_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."showcase_comments"
    ADD CONSTRAINT "showcase_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."showcase_likes"
    ADD CONSTRAINT "showcase_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."showcase_likes"
    ADD CONSTRAINT "showcase_likes_showcase_id_user_id_key" UNIQUE ("showcase_id", "user_id");



ALTER TABLE ONLY "public"."showcases"
    ADD CONSTRAINT "showcases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."specializations"
    ADD CONSTRAINT "specializations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."specializations"
    ADD CONSTRAINT "specializations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."style_prompts"
    ADD CONSTRAINT "style_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."style_prompts"
    ADD CONSTRAINT "style_prompts_style_name_key" UNIQUE ("style_name");



ALTER TABLE ONLY "public"."subject_counts"
    ADD CONSTRAINT "subject_counts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subject_counts"
    ADD CONSTRAINT "subject_counts_value_key" UNIQUE ("value");



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



ALTER TABLE ONLY "public"."system_logs"
    ADD CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_settings"
    ADD CONSTRAINT "time_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_settings"
    ADD CONSTRAINT "time_settings_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."timezones"
    ADD CONSTRAINT "timezones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timezones"
    ADD CONSTRAINT "timezones_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."treatment_analytics"
    ADD CONSTRAINT "treatment_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_assets"
    ADD CONSTRAINT "treatment_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_sharing"
    ADD CONSTRAINT "treatment_sharing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_sharing"
    ADD CONSTRAINT "treatment_sharing_treatment_id_shared_with_email_key" UNIQUE ("treatment_id", "shared_with_email");



ALTER TABLE ONLY "public"."treatment_sharing"
    ADD CONSTRAINT "treatment_sharing_treatment_id_shared_with_user_id_key" UNIQUE ("treatment_id", "shared_with_user_id");



ALTER TABLE ONLY "public"."treatment_versions"
    ADD CONSTRAINT "treatment_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_versions"
    ADD CONSTRAINT "treatment_versions_treatment_id_version_number_key" UNIQUE ("treatment_id", "version_number");



ALTER TABLE ONLY "public"."treatments"
    ADD CONSTRAINT "treatments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_conversation_id_user_id_key" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users_profile"
    ADD CONSTRAINT "unique_handle" UNIQUE ("handle");



COMMENT ON CONSTRAINT "unique_handle" ON "public"."users_profile" IS 'Ensures each handle is unique across all users';



ALTER TABLE ONLY "public"."user_handle_redirects"
    ADD CONSTRAINT "unique_old_handle" UNIQUE ("old_handle");



ALTER TABLE ONLY "public"."collab_participants"
    ADD CONSTRAINT "unique_project_participant" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."user_rate_limits"
    ADD CONSTRAINT "unique_user_resource_window" UNIQUE ("user_profile_id", "resource_type", "window_start");



ALTER TABLE ONLY "public"."user_availability"
    ADD CONSTRAINT "user_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_blocker_user_id_blocked_user_id_key" UNIQUE ("blocker_user_id", "blocked_user_id");



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_clothing_sizes"
    ADD CONSTRAINT "user_clothing_sizes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_clothing_sizes"
    ADD CONSTRAINT "user_clothing_sizes_profile_id_clothing_type_size_system_id_key" UNIQUE ("profile_id", "clothing_type", "size_system_id");



ALTER TABLE ONLY "public"."user_credit_purchases"
    ADD CONSTRAINT "user_credit_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_equipment"
    ADD CONSTRAINT "user_equipment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_equipment"
    ADD CONSTRAINT "user_equipment_profile_id_equipment_model_id_key" UNIQUE ("profile_id", "equipment_model_id");



ALTER TABLE ONLY "public"."user_handle_redirects"
    ADD CONSTRAINT "user_handle_redirects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_measurements"
    ADD CONSTRAINT "user_measurements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_measurements"
    ADD CONSTRAINT "user_measurements_profile_id_measurement_type_key" UNIQUE ("profile_id", "measurement_type");



ALTER TABLE ONLY "public"."user_provider_preferences"
    ADD CONSTRAINT "user_provider_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_provider_preferences"
    ADD CONSTRAINT "user_provider_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_rate_limits"
    ADD CONSTRAINT "user_rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_profile_id_skill_name_key" UNIQUE ("profile_id", "skill_name");



ALTER TABLE ONLY "public"."user_vibe_analytics"
    ADD CONSTRAINT "user_vibe_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_vibe_analytics"
    ADD CONSTRAINT "user_vibe_analytics_user_id_vibe_id_key" UNIQUE ("user_id", "vibe_id");



ALTER TABLE ONLY "public"."user_violations"
    ADD CONSTRAINT "user_violations_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."weather_conditions"
    ADD CONSTRAINT "weather_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weather_conditions"
    ADD CONSTRAINT "weather_conditions_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."working_time_preferences"
    ADD CONSTRAINT "working_time_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."working_time_preferences"
    ADD CONSTRAINT "working_time_preferences_value_key" UNIQUE ("value");



CREATE INDEX "idx_age_verification_logs_created_at" ON "public"."age_verification_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_age_verification_logs_type" ON "public"."age_verification_logs" USING "btree" ("verification_type");



CREATE INDEX "idx_age_verification_logs_user" ON "public"."age_verification_logs" USING "btree" ("user_id");



CREATE INDEX "idx_age_verification_logs_user_id" ON "public"."age_verification_logs" USING "btree" ("user_id");



CREATE INDEX "idx_api_providers_name" ON "public"."api_providers" USING "btree" ("name");



CREATE INDEX "idx_application_attachments_application_id" ON "public"."application_attachments" USING "btree" ("application_id");



CREATE INDEX "idx_application_feedback_application_id" ON "public"."application_feedback" USING "btree" ("application_id");



CREATE INDEX "idx_application_messages_application_id" ON "public"."application_messages" USING "btree" ("application_id");



CREATE INDEX "idx_application_status_history_application_id" ON "public"."application_status_history" USING "btree" ("application_id");



CREATE INDEX "idx_applications_applicant" ON "public"."applications" USING "btree" ("applicant_user_id");



CREATE INDEX "idx_applications_applicant_user_id" ON "public"."applications" USING "btree" ("applicant_user_id");



CREATE INDEX "idx_applications_applied_at" ON "public"."applications" USING "btree" ("applied_at" DESC);



CREATE INDEX "idx_applications_gig" ON "public"."applications" USING "btree" ("gig_id");



CREATE INDEX "idx_applications_gig_id" ON "public"."applications" USING "btree" ("gig_id");



CREATE INDEX "idx_applications_status" ON "public"."applications" USING "btree" ("status");



CREATE INDEX "idx_applications_user_gig_status" ON "public"."applications" USING "btree" ("applicant_user_id", "gig_id", "status") WHERE ("status" = 'ACCEPTED'::"public"."application_status");



CREATE INDEX "idx_aspect_ratios_value" ON "public"."aspect_ratios" USING "btree" ("value");



CREATE INDEX "idx_browser_cache_config_active" ON "public"."browser_cache_config" USING "btree" ("is_active");



CREATE INDEX "idx_browser_cache_config_key" ON "public"."browser_cache_config" USING "btree" ("cache_key");



CREATE INDEX "idx_camera_angles_value" ON "public"."camera_angles" USING "btree" ("value");



CREATE INDEX "idx_camera_movements_value" ON "public"."camera_movements" USING "btree" ("value");



CREATE INDEX "idx_cinematic_presets_active" ON "public"."cinematic_presets" USING "btree" ("is_active");



CREATE INDEX "idx_cinematic_presets_ai_metadata" ON "public"."cinematic_presets" USING "gin" ("ai_metadata");



CREATE INDEX "idx_cinematic_presets_category" ON "public"."cinematic_presets" USING "btree" ("category");



CREATE INDEX "idx_cinematic_presets_created_at" ON "public"."cinematic_presets" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_cinematic_presets_is_featured" ON "public"."cinematic_presets" USING "btree" ("is_featured");



CREATE INDEX "idx_cinematic_presets_is_for_sale" ON "public"."cinematic_presets" USING "btree" ("is_for_sale");



CREATE INDEX "idx_cinematic_presets_is_public" ON "public"."cinematic_presets" USING "btree" ("is_public");



CREATE INDEX "idx_cinematic_presets_marketplace_status" ON "public"."cinematic_presets" USING "btree" ("marketplace_status");



CREATE INDEX "idx_cinematic_presets_seedream_config" ON "public"."cinematic_presets" USING "gin" ("seedream_config");



CREATE INDEX "idx_cinematic_presets_sort" ON "public"."cinematic_presets" USING "btree" ("sort_order");



CREATE INDEX "idx_cinematic_presets_style_settings" ON "public"."cinematic_presets" USING "gin" ("style_settings");



CREATE INDEX "idx_cinematic_presets_technical_settings" ON "public"."cinematic_presets" USING "gin" ("technical_settings");



CREATE INDEX "idx_cinematic_presets_usage_count" ON "public"."cinematic_presets" USING "btree" ("usage_count" DESC);



CREATE INDEX "idx_cinematic_presets_user_id" ON "public"."cinematic_presets" USING "btree" ("user_id");



CREATE INDEX "idx_collab_applications_applicant" ON "public"."collab_applications" USING "btree" ("applicant_id");



CREATE INDEX "idx_collab_applications_applicant_id" ON "public"."collab_applications" USING "btree" ("applicant_id");



CREATE INDEX "idx_collab_applications_project" ON "public"."collab_applications" USING "btree" ("project_id");



CREATE INDEX "idx_collab_applications_project_id" ON "public"."collab_applications" USING "btree" ("project_id");



CREATE INDEX "idx_collab_applications_role_id" ON "public"."collab_applications" USING "btree" ("role_id");



CREATE INDEX "idx_collab_applications_status" ON "public"."collab_applications" USING "btree" ("status");



CREATE INDEX "idx_collab_gear_offers_gear_request_id" ON "public"."collab_gear_offers" USING "btree" ("gear_request_id");



CREATE INDEX "idx_collab_gear_offers_offerer_id" ON "public"."collab_gear_offers" USING "btree" ("offerer_id");



CREATE INDEX "idx_collab_gear_offers_project" ON "public"."collab_gear_offers" USING "btree" ("project_id");



CREATE INDEX "idx_collab_gear_offers_project_id" ON "public"."collab_gear_offers" USING "btree" ("project_id");



CREATE INDEX "idx_collab_gear_offers_status" ON "public"."collab_gear_offers" USING "btree" ("status");



CREATE INDEX "idx_collab_gear_requests_category" ON "public"."collab_gear_requests" USING "btree" ("category");



CREATE INDEX "idx_collab_gear_requests_project" ON "public"."collab_gear_requests" USING "btree" ("project_id");



CREATE INDEX "idx_collab_gear_requests_project_id" ON "public"."collab_gear_requests" USING "btree" ("project_id");



CREATE INDEX "idx_collab_gear_requests_status" ON "public"."collab_gear_requests" USING "btree" ("status");



CREATE INDEX "idx_collab_invitations_expires_at" ON "public"."collab_invitations" USING "btree" ("expires_at");



CREATE INDEX "idx_collab_invitations_invitee_email" ON "public"."collab_invitations" USING "btree" ("invitee_email");



CREATE INDEX "idx_collab_invitations_invitee_id" ON "public"."collab_invitations" USING "btree" ("invitee_id");



CREATE INDEX "idx_collab_invitations_inviter_id" ON "public"."collab_invitations" USING "btree" ("inviter_id");



CREATE INDEX "idx_collab_invitations_project_id" ON "public"."collab_invitations" USING "btree" ("project_id");



CREATE INDEX "idx_collab_invitations_status" ON "public"."collab_invitations" USING "btree" ("status");



CREATE INDEX "idx_collab_invitations_token" ON "public"."collab_invitations" USING "btree" ("invitation_token");



CREATE UNIQUE INDEX "idx_collab_invitations_unique_pending" ON "public"."collab_invitations" USING "btree" ("project_id", "invitee_id") WHERE (("status" = 'pending'::"text") AND ("invitee_id" IS NOT NULL));



CREATE INDEX "idx_collab_participants_project" ON "public"."collab_participants" USING "btree" ("project_id");



CREATE INDEX "idx_collab_participants_project_id" ON "public"."collab_participants" USING "btree" ("project_id");



CREATE INDEX "idx_collab_participants_role_type" ON "public"."collab_participants" USING "btree" ("role_type");



CREATE INDEX "idx_collab_participants_status" ON "public"."collab_participants" USING "btree" ("status");



CREATE INDEX "idx_collab_participants_user" ON "public"."collab_participants" USING "btree" ("user_id");



CREATE INDEX "idx_collab_participants_user_id" ON "public"."collab_participants" USING "btree" ("user_id");



CREATE INDEX "idx_collab_projects_created_at" ON "public"."collab_projects" USING "btree" ("created_at");



CREATE INDEX "idx_collab_projects_creator" ON "public"."collab_projects" USING "btree" ("creator_id");



CREATE INDEX "idx_collab_projects_creator_id" ON "public"."collab_projects" USING "btree" ("creator_id");



CREATE INDEX "idx_collab_projects_dates" ON "public"."collab_projects" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_collab_projects_location" ON "public"."collab_projects" USING "btree" ("city", "country");



CREATE INDEX "idx_collab_projects_status" ON "public"."collab_projects" USING "btree" ("status");



CREATE INDEX "idx_collab_projects_visibility" ON "public"."collab_projects" USING "btree" ("visibility");



CREATE INDEX "idx_collab_roles_project" ON "public"."collab_roles" USING "btree" ("project_id");



CREATE INDEX "idx_collab_roles_project_id" ON "public"."collab_roles" USING "btree" ("project_id");



CREATE INDEX "idx_collab_roles_skills" ON "public"."collab_roles" USING "gin" ("skills_required");



CREATE INDEX "idx_collab_roles_status" ON "public"."collab_roles" USING "btree" ("status");



CREATE INDEX "idx_color_palettes_value" ON "public"."color_palettes" USING "btree" ("value");



CREATE INDEX "idx_composition_techniques_value" ON "public"."composition_techniques" USING "btree" ("value");



CREATE INDEX "idx_contact_sharing_conversation" ON "public"."contact_sharing" USING "btree" ("conversation_id", "conversation_type");



CREATE INDEX "idx_contact_sharing_offer" ON "public"."contact_sharing" USING "btree" ("offer_id");



CREATE INDEX "idx_contact_sharing_recipient" ON "public"."contact_sharing" USING "btree" ("recipient_id");



CREATE INDEX "idx_contact_sharing_shared_at" ON "public"."contact_sharing" USING "btree" ("shared_at");



CREATE INDEX "idx_contact_sharing_sharer" ON "public"."contact_sharing" USING "btree" ("sharer_id");



CREATE INDEX "idx_conversation_participants_conversation" ON "public"."conversation_participants" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversation_participants_user" ON "public"."conversation_participants" USING "btree" ("user_id");



CREATE INDEX "idx_conversations_created_by" ON "public"."conversations" USING "btree" ("created_by");



CREATE INDEX "idx_conversations_last_message" ON "public"."conversations" USING "btree" ("last_message_at");



CREATE INDEX "idx_credit_pools_provider" ON "public"."credit_pools" USING "btree" ("provider");



CREATE INDEX "idx_credit_transactions_created_at" ON "public"."credit_transactions" USING "btree" ("created_at");



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_daily_usage_date" ON "public"."daily_usage_summary" USING "btree" ("date");



CREATE INDEX "idx_depth_of_field_value" ON "public"."depth_of_field" USING "btree" ("value");



CREATE INDEX "idx_director_styles_value" ON "public"."director_styles" USING "btree" ("value");



CREATE INDEX "idx_domain_events_aggregate_id" ON "public"."domain_events" USING "btree" ("aggregate_id");



CREATE INDEX "idx_domain_events_event_type" ON "public"."domain_events" USING "btree" ("event_type");



CREATE INDEX "idx_domain_events_occurred_at" ON "public"."domain_events" USING "btree" ("occurred_at");



CREATE INDEX "idx_email_logs_created_at" ON "public"."email_logs" USING "btree" ("created_at");



CREATE INDEX "idx_enhancement_tasks_created_at" ON "public"."enhancement_tasks" USING "btree" ("created_at");



CREATE INDEX "idx_enhancement_tasks_provider" ON "public"."enhancement_tasks" USING "btree" ("provider");



CREATE INDEX "idx_enhancement_tasks_provider_task_id" ON "public"."enhancement_tasks" USING "btree" ("provider_task_id");



CREATE INDEX "idx_enhancement_tasks_status" ON "public"."enhancement_tasks" USING "btree" ("status");



CREATE INDEX "idx_enhancement_tasks_status_refunded" ON "public"."enhancement_tasks" USING "btree" ("status", "refunded") WHERE (("status")::"text" = 'failed'::"text");



CREATE INDEX "idx_enhancement_tasks_user_id" ON "public"."enhancement_tasks" USING "btree" ("user_id");



CREATE INDEX "idx_equipment_brands_sort_order" ON "public"."equipment_brands" USING "btree" ("sort_order");



CREATE INDEX "idx_equipment_models_type_id" ON "public"."equipment_models" USING "btree" ("equipment_type_id");



CREATE INDEX "idx_equipment_predefined_models_type_id" ON "public"."equipment_predefined_models" USING "btree" ("equipment_type_id");



CREATE INDEX "idx_equipment_requests_category" ON "public"."equipment_requests" USING "btree" ("category");



CREATE INDEX "idx_equipment_requests_expires_at" ON "public"."equipment_requests" USING "btree" ("expires_at");



CREATE INDEX "idx_equipment_requests_location" ON "public"."equipment_requests" USING "btree" ("location_city", "location_country");



CREATE INDEX "idx_equipment_requests_purpose_id" ON "public"."equipment_requests" USING "btree" ("purpose_id");



CREATE INDEX "idx_equipment_requests_reference_type" ON "public"."equipment_requests" USING "btree" ("reference_type");



CREATE INDEX "idx_equipment_requests_rental_dates" ON "public"."equipment_requests" USING "btree" ("rental_start_date", "rental_end_date");



CREATE INDEX "idx_equipment_requests_requester_id" ON "public"."equipment_requests" USING "btree" ("requester_id");



CREATE INDEX "idx_equipment_requests_status" ON "public"."equipment_requests" USING "btree" ("status");



CREATE INDEX "idx_equipment_requests_urgent" ON "public"."equipment_requests" USING "btree" ("urgent") WHERE ("urgent" = true);



CREATE INDEX "idx_equipment_types_category" ON "public"."equipment_types" USING "btree" ("category");



CREATE INDEX "idx_equipment_types_sort_order" ON "public"."equipment_types" USING "btree" ("sort_order");



CREATE INDEX "idx_era_emulations_value" ON "public"."era_emulations" USING "btree" ("value");



CREATE INDEX "idx_eye_contacts_value" ON "public"."eye_contacts" USING "btree" ("value");



CREATE INDEX "idx_featured_requests_preset_id" ON "public"."featured_preset_requests" USING "btree" ("preset_id");



CREATE INDEX "idx_featured_requests_requested_at" ON "public"."featured_preset_requests" USING "btree" ("requested_at" DESC);



CREATE INDEX "idx_featured_requests_requester_id" ON "public"."featured_preset_requests" USING "btree" ("requester_id");



CREATE INDEX "idx_featured_requests_status" ON "public"."featured_preset_requests" USING "btree" ("status");



CREATE INDEX "idx_foreground_elements_value" ON "public"."foreground_elements" USING "btree" ("value");



CREATE INDEX "idx_gig_invitations_expires_at" ON "public"."gig_invitations" USING "btree" ("expires_at");



CREATE INDEX "idx_gig_invitations_gig_id" ON "public"."gig_invitations" USING "btree" ("gig_id");



CREATE INDEX "idx_gig_invitations_invitee_id" ON "public"."gig_invitations" USING "btree" ("invitee_id");



CREATE INDEX "idx_gig_invitations_status" ON "public"."gig_invitations" USING "btree" ("status");



CREATE INDEX "idx_gigs_city" ON "public"."gigs" USING "btree" ("city");



CREATE INDEX "idx_gigs_country" ON "public"."gigs" USING "btree" ("country");



CREATE INDEX "idx_gigs_dates" ON "public"."gigs" USING "btree" ("start_time", "end_time");



CREATE INDEX "idx_gigs_location" ON "public"."gigs" USING "gist" ("location");



CREATE INDEX "idx_gigs_looking_for" ON "public"."gigs" USING "btree" ("looking_for") WHERE ("looking_for" IS NOT NULL);



CREATE INDEX "idx_gigs_looking_for_types" ON "public"."gigs" USING "gin" ("looking_for_types") WHERE (("looking_for_types" IS NOT NULL) AND ("looking_for_types" <> '{}'::"text"[]));



CREATE INDEX "idx_gigs_owner" ON "public"."gigs" USING "btree" ("owner_user_id");



CREATE INDEX "idx_gigs_owner_status" ON "public"."gigs" USING "btree" ("owner_user_id", "status") WHERE ("status" = 'COMPLETED'::"public"."gig_status");



CREATE INDEX "idx_gigs_preferences" ON "public"."gigs" USING "gin" ("applicant_preferences");



CREATE INDEX "idx_gigs_status" ON "public"."gigs" USING "btree" ("status");



CREATE INDEX "idx_gigs_style_tags" ON "public"."gigs" USING "gin" ("style_tags");



CREATE INDEX "idx_handle_redirects_old_handle" ON "public"."user_handle_redirects" USING "btree" ("old_handle");



CREATE INDEX "idx_handle_redirects_user_profile_id" ON "public"."user_handle_redirects" USING "btree" ("user_profile_id");



CREATE INDEX "idx_languages_master_active" ON "public"."languages_master" USING "btree" ("is_active");



CREATE INDEX "idx_languages_master_popular" ON "public"."languages_master" USING "btree" ("is_popular");



CREATE INDEX "idx_languages_master_sort_order" ON "public"."languages_master" USING "btree" ("sort_order");



CREATE INDEX "idx_lens_types_value" ON "public"."lens_types" USING "btree" ("value");



CREATE INDEX "idx_lighting_styles_value" ON "public"."lighting_styles" USING "btree" ("value");



CREATE INDEX "idx_listing_comments_created_at" ON "public"."listing_comments" USING "btree" ("created_at");



CREATE INDEX "idx_listing_comments_listing_id" ON "public"."listing_comments" USING "btree" ("listing_id");



CREATE INDEX "idx_listing_comments_parent_id" ON "public"."listing_comments" USING "btree" ("parent_comment_id");



CREATE INDEX "idx_listing_comments_user_id" ON "public"."listing_comments" USING "btree" ("user_id");



CREATE INDEX "idx_listing_images_listing_id" ON "public"."listing_images" USING "btree" ("listing_id");



CREATE INDEX "idx_listing_images_sort_order" ON "public"."listing_images" USING "btree" ("listing_id", "sort_order");



CREATE INDEX "idx_listings_brand" ON "public"."listings" USING "btree" ("brand");



CREATE INDEX "idx_listings_category" ON "public"."listings" USING "btree" ("category");



CREATE INDEX "idx_listings_created_at" ON "public"."listings" USING "btree" ("created_at");



CREATE INDEX "idx_listings_equipment_brand_id" ON "public"."listings" USING "btree" ("equipment_brand_id");



CREATE INDEX "idx_listings_equipment_model_id" ON "public"."listings" USING "btree" ("equipment_model_id");



CREATE INDEX "idx_listings_equipment_type_id" ON "public"."listings" USING "btree" ("equipment_type_id");



CREATE INDEX "idx_listings_location_city" ON "public"."listings" USING "btree" ("location_city");



CREATE INDEX "idx_listings_location_country" ON "public"."listings" USING "btree" ("location_country");



CREATE INDEX "idx_listings_mode" ON "public"."listings" USING "btree" ("mode");



CREATE INDEX "idx_listings_model" ON "public"."listings" USING "btree" ("model");



CREATE INDEX "idx_listings_owner_id" ON "public"."listings" USING "btree" ("owner_id");



CREATE INDEX "idx_listings_status" ON "public"."listings" USING "btree" ("status");



CREATE INDEX "idx_location_types_value" ON "public"."location_types" USING "btree" ("value");



CREATE INDEX "idx_lootbox_events_purchased" ON "public"."lootbox_events" USING "btree" ("purchased_by", "purchased_at");



CREATE INDEX "idx_lootbox_packages_active" ON "public"."lootbox_packages" USING "btree" ("is_active", "user_credits");



CREATE INDEX "idx_marketplace_listings_featured" ON "public"."preset_marketplace_listings" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_marketplace_listings_seller" ON "public"."preset_marketplace_listings" USING "btree" ("seller_user_id");



CREATE INDEX "idx_marketplace_listings_status" ON "public"."preset_marketplace_listings" USING "btree" ("status");



CREATE INDEX "idx_marketplace_reviews_author" ON "public"."marketplace_reviews" USING "btree" ("author_id");



CREATE INDEX "idx_marketplace_reviews_created_at" ON "public"."marketplace_reviews" USING "btree" ("created_at");



CREATE INDEX "idx_marketplace_reviews_order" ON "public"."marketplace_reviews" USING "btree" ("order_type", "order_id");



CREATE INDEX "idx_marketplace_reviews_subject" ON "public"."marketplace_reviews" USING "btree" ("subject_user_id");



CREATE INDEX "idx_media_owner" ON "public"."media" USING "btree" ("owner_user_id");



CREATE INDEX "idx_messages_blocking_check" ON "public"."messages" USING "btree" ("from_user_id", "to_user_id");



CREATE INDEX "idx_messages_context_type" ON "public"."messages" USING "btree" ("context_type");



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_conversation_created_at" ON "public"."messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_conversation_security" ON "public"."messages" USING "btree" ("conversation_id", "created_at") WHERE ("conversation_id" IS NOT NULL);



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at");



CREATE INDEX "idx_messages_from_user" ON "public"."messages" USING "btree" ("from_user_id");



CREATE INDEX "idx_messages_gig" ON "public"."messages" USING "btree" ("gig_id");



CREATE INDEX "idx_messages_listing_id" ON "public"."messages" USING "btree" ("listing_id") WHERE ("listing_id" IS NOT NULL);



CREATE INDEX "idx_messages_offer_id" ON "public"."messages" USING "btree" ("offer_id") WHERE ("offer_id" IS NOT NULL);



CREATE INDEX "idx_messages_rental_order_id" ON "public"."messages" USING "btree" ("rental_order_id") WHERE ("rental_order_id" IS NOT NULL);



CREATE INDEX "idx_messages_sale_order_id" ON "public"."messages" USING "btree" ("sale_order_id") WHERE ("sale_order_id" IS NOT NULL);



CREATE INDEX "idx_messages_security_lookup" ON "public"."messages" USING "btree" ("from_user_id", "to_user_id", "created_at");



CREATE INDEX "idx_messages_status" ON "public"."messages" USING "btree" ("status");



CREATE INDEX "idx_messages_to_user" ON "public"."messages" USING "btree" ("to_user_id");



CREATE INDEX "idx_messages_users" ON "public"."messages" USING "btree" ("from_user_id", "to_user_id");



CREATE INDEX "idx_moderation_actions_admin" ON "public"."moderation_actions" USING "btree" ("admin_user_id");



CREATE INDEX "idx_moderation_actions_created" ON "public"."moderation_actions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_moderation_actions_expires" ON "public"."moderation_actions" USING "btree" ("expires_at") WHERE (("expires_at" IS NOT NULL) AND ("revoked_at" IS NULL));



CREATE INDEX "idx_moderation_actions_report" ON "public"."moderation_actions" USING "btree" ("report_id") WHERE ("report_id" IS NOT NULL);



CREATE INDEX "idx_moderation_actions_target_user" ON "public"."moderation_actions" USING "btree" ("target_user_id") WHERE ("target_user_id" IS NOT NULL);



CREATE INDEX "idx_moderation_actions_type" ON "public"."moderation_actions" USING "btree" ("action_type");



CREATE INDEX "idx_moodboard_items_moodboard_id" ON "public"."moodboard_items" USING "btree" ("moodboard_id");



CREATE INDEX "idx_moodboard_items_position" ON "public"."moodboard_items" USING "btree" ("moodboard_id", "position");



CREATE INDEX "idx_moodboards_mood" ON "public"."moodboards" USING "gin" ("mood_descriptors");



CREATE INDEX "idx_moodboards_tags" ON "public"."moodboards" USING "gin" ("tags");



CREATE INDEX "idx_moodboards_vibe_ids" ON "public"."moodboards" USING "gin" ("vibe_ids");



CREATE INDEX "idx_moodboards_vibe_search" ON "public"."moodboards" USING "gin" ("to_tsvector"('"english"'::"regconfig", COALESCE("vibe_summary", ''::"text")));



CREATE INDEX "idx_notification_preferences_application" ON "public"."notification_preferences" USING "btree" ("application_notifications");



CREATE INDEX "idx_notification_preferences_booking" ON "public"."notification_preferences" USING "btree" ("booking_notifications");



CREATE INDEX "idx_notification_preferences_email_enabled" ON "public"."notification_preferences" USING "btree" ("email_enabled");



CREATE INDEX "idx_notification_preferences_gig_notifications" ON "public"."notification_preferences" USING "btree" ("gig_notifications");



CREATE INDEX "idx_notification_preferences_in_app_enabled" ON "public"."notification_preferences" USING "btree" ("in_app_notifications");



CREATE INDEX "idx_notification_preferences_marketing" ON "public"."notification_preferences" USING "btree" ("marketing_notifications");



CREATE INDEX "idx_notification_preferences_push_enabled" ON "public"."notification_preferences" USING "btree" ("push_enabled");



CREATE INDEX "idx_notification_preferences_user_id" ON "public"."notification_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_category" ON "public"."notifications" USING "btree" ("category");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("read");



CREATE INDEX "idx_notifications_recipient_created" ON "public"."notifications" USING "btree" ("recipient_id", "created_at");



CREATE INDEX "idx_notifications_recipient_id" ON "public"."notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_notifications_recipient_read" ON "public"."notifications" USING "btree" ("recipient_id", "read");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_oauth_health_check_provider" ON "public"."oauth_health_check" USING "btree" ("provider");



CREATE INDEX "idx_oauth_health_check_time" ON "public"."oauth_health_check" USING "btree" ("check_time" DESC);



CREATE INDEX "idx_oauth_logs_event_type" ON "public"."oauth_logs" USING "btree" ("event_type");



CREATE INDEX "idx_oauth_logs_provider" ON "public"."oauth_logs" USING "btree" ("provider");



CREATE INDEX "idx_oauth_logs_session_id" ON "public"."oauth_logs" USING "btree" ("session_id");



CREATE INDEX "idx_oauth_logs_timestamp" ON "public"."oauth_logs" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_oauth_logs_user_id" ON "public"."oauth_logs" USING "btree" ("user_id");



CREATE INDEX "idx_offers_listing_id" ON "public"."offers" USING "btree" ("listing_id");



CREATE INDEX "idx_offers_offerer_created_at" ON "public"."offers" USING "btree" ("offerer_id", "created_at");



CREATE INDEX "idx_offers_offerer_id" ON "public"."offers" USING "btree" ("offerer_id");



CREATE INDEX "idx_offers_owner_id" ON "public"."offers" USING "btree" ("owner_id");



CREATE INDEX "idx_offers_status" ON "public"."offers" USING "btree" ("status");



CREATE INDEX "idx_platform_credit_consumption_created_at" ON "public"."platform_credit_consumption" USING "btree" ("created_at");



CREATE INDEX "idx_platform_credit_consumption_provider" ON "public"."platform_credit_consumption" USING "btree" ("provider");



CREATE INDEX "idx_platform_images_active" ON "public"."platform_images" USING "btree" ("is_active");



CREATE INDEX "idx_platform_images_category" ON "public"."platform_images" USING "btree" ("category");



CREATE INDEX "idx_platform_images_display_order" ON "public"."platform_images" USING "btree" ("display_order");



CREATE INDEX "idx_platform_images_key" ON "public"."platform_images" USING "btree" ("image_key");



CREATE INDEX "idx_platform_images_type" ON "public"."platform_images" USING "btree" ("image_type");



CREATE INDEX "idx_playground_gallery_created_at" ON "public"."playground_gallery" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_playground_gallery_exif_preset_id" ON "public"."playground_gallery" USING "gin" (((("exif_json" -> 'generation_metadata'::"text") -> 'preset_id'::"text")));



CREATE INDEX "idx_playground_gallery_exif_promoted" ON "public"."playground_gallery" USING "gin" ((("exif_json" -> 'promoted_from_playground'::"text")));



CREATE INDEX "idx_playground_gallery_exif_style" ON "public"."playground_gallery" USING "gin" (((("exif_json" -> 'generation_metadata'::"text") -> 'style'::"text")));



CREATE INDEX "idx_playground_gallery_image_url" ON "public"."playground_gallery" USING "btree" ("image_url");



CREATE INDEX "idx_playground_gallery_is_verified" ON "public"."playground_gallery" USING "btree" ("is_verified");



CREATE INDEX "idx_playground_gallery_media_type" ON "public"."playground_gallery" USING "btree" ("media_type");



CREATE INDEX "idx_playground_gallery_project_id" ON "public"."playground_gallery" USING "btree" ("project_id");



CREATE INDEX "idx_playground_gallery_used_in_moodboard" ON "public"."playground_gallery" USING "btree" ("used_in_moodboard");



CREATE INDEX "idx_playground_gallery_used_in_showcase" ON "public"."playground_gallery" USING "btree" ("used_in_showcase");



CREATE INDEX "idx_playground_gallery_user_id" ON "public"."playground_gallery" USING "btree" ("user_id");



CREATE INDEX "idx_playground_projects_created_at" ON "public"."playground_projects" USING "btree" ("created_at");



CREATE INDEX "idx_playground_projects_last_generated" ON "public"."playground_projects" USING "btree" ("last_generated_at");



CREATE INDEX "idx_playground_projects_preset_id" ON "public"."playground_projects" USING "btree" ("preset_id");



CREATE INDEX "idx_playground_projects_status" ON "public"."playground_projects" USING "btree" ("status");



CREATE INDEX "idx_playground_projects_user_id" ON "public"."playground_projects" USING "btree" ("user_id");



CREATE INDEX "idx_predefined_clothing_size_systems_active" ON "public"."predefined_clothing_size_systems" USING "btree" ("is_active", "sort_order");



CREATE INDEX "idx_predefined_clothing_size_systems_region" ON "public"."predefined_clothing_size_systems" USING "btree" ("region", "gender");



CREATE INDEX "idx_predefined_clothing_sizes_system" ON "public"."predefined_clothing_sizes" USING "btree" ("size_system_id", "sort_order");



CREATE INDEX "idx_predefined_gear_categories_active" ON "public"."predefined_gear_categories" USING "btree" ("is_active");



CREATE INDEX "idx_predefined_gear_categories_category" ON "public"."predefined_gear_categories" USING "btree" ("category");



CREATE INDEX "idx_predefined_gear_categories_sort" ON "public"."predefined_gear_categories" USING "btree" ("sort_order");



CREATE INDEX "idx_predefined_nationalities_active" ON "public"."predefined_nationalities" USING "btree" ("is_active", "sort_order");



CREATE INDEX "idx_predefined_professional_skills_active" ON "public"."predefined_professional_skills" USING "btree" ("is_active");



CREATE INDEX "idx_predefined_professional_skills_category" ON "public"."predefined_professional_skills" USING "btree" ("category");



CREATE INDEX "idx_predefined_professional_skills_sort_order" ON "public"."predefined_professional_skills" USING "btree" ("sort_order");



CREATE INDEX "idx_predefined_roles_active" ON "public"."predefined_roles" USING "btree" ("is_active");



CREATE INDEX "idx_predefined_roles_category" ON "public"."predefined_roles" USING "btree" ("category");



CREATE INDEX "idx_predefined_roles_sort" ON "public"."predefined_roles" USING "btree" ("sort_order");



CREATE INDEX "idx_predefined_shoe_size_systems_region" ON "public"."predefined_shoe_size_systems" USING "btree" ("region", "gender");



CREATE INDEX "idx_predefined_shoe_sizes_system" ON "public"."predefined_shoe_sizes" USING "btree" ("size_system_id", "sort_order");



CREATE INDEX "idx_predefined_skills_active" ON "public"."predefined_skills" USING "btree" ("is_active");



CREATE INDEX "idx_predefined_skills_category" ON "public"."predefined_skills" USING "btree" ("category");



CREATE INDEX "idx_predefined_skills_sort" ON "public"."predefined_skills" USING "btree" ("sort_order");



CREATE INDEX "idx_predefined_talent_categories_active" ON "public"."predefined_talent_categories" USING "btree" ("is_active");



CREATE INDEX "idx_predefined_talent_categories_sort" ON "public"."predefined_talent_categories" USING "btree" ("sort_order");



CREATE INDEX "idx_preset_images_created_at" ON "public"."preset_images" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_preset_images_generation_id" ON "public"."preset_images" USING "btree" ("generation_id");



CREATE INDEX "idx_preset_images_is_verified" ON "public"."preset_images" USING "btree" ("is_verified");



CREATE INDEX "idx_preset_images_preset_id" ON "public"."preset_images" USING "btree" ("preset_id");



CREATE UNIQUE INDEX "idx_preset_images_unique_generation" ON "public"."preset_images" USING "btree" ("preset_id", "user_id", "generation_id") WHERE ("generation_id" IS NOT NULL);



CREATE INDEX "idx_preset_images_user_id" ON "public"."preset_images" USING "btree" ("user_id");



CREATE INDEX "idx_preset_likes_created_at" ON "public"."preset_likes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_preset_likes_preset_id" ON "public"."preset_likes" USING "btree" ("preset_id");



CREATE INDEX "idx_preset_likes_user_id" ON "public"."preset_likes" USING "btree" ("user_id");



CREATE INDEX "idx_preset_notifications_created_at" ON "public"."preset_notifications" USING "btree" ("created_at");



CREATE INDEX "idx_preset_notifications_creator_id" ON "public"."preset_notifications" USING "btree" ("creator_id");



CREATE INDEX "idx_preset_notifications_creator_read" ON "public"."preset_notifications" USING "btree" ("creator_id", "is_read");



CREATE INDEX "idx_preset_notifications_is_read" ON "public"."preset_notifications" USING "btree" ("is_read");



CREATE INDEX "idx_preset_notifications_preset_id" ON "public"."preset_notifications" USING "btree" ("preset_id");



CREATE INDEX "idx_preset_notifications_type" ON "public"."preset_notifications" USING "btree" ("type");



CREATE INDEX "idx_preset_purchases_buyer" ON "public"."preset_purchases" USING "btree" ("buyer_user_id");



CREATE INDEX "idx_preset_purchases_preset" ON "public"."preset_purchases" USING "btree" ("preset_id");



CREATE INDEX "idx_preset_purchases_seller" ON "public"."preset_purchases" USING "btree" ("seller_user_id");



CREATE INDEX "idx_preset_purchases_status" ON "public"."preset_purchases" USING "btree" ("payment_status");



CREATE INDEX "idx_preset_reviews_preset" ON "public"."preset_reviews" USING "btree" ("preset_id");



CREATE INDEX "idx_preset_reviews_rating" ON "public"."preset_reviews" USING "btree" ("rating");



CREATE INDEX "idx_preset_reviews_reviewer" ON "public"."preset_reviews" USING "btree" ("reviewer_user_id");



CREATE INDEX "idx_preset_usage_preset_id" ON "public"."preset_usage" USING "btree" ("preset_id");



CREATE INDEX "idx_preset_usage_preset_user" ON "public"."preset_usage" USING "btree" ("preset_id", "user_id");



CREATE INDEX "idx_preset_usage_used_at" ON "public"."preset_usage" USING "btree" ("used_at" DESC);



CREATE INDEX "idx_preset_usage_user_id" ON "public"."preset_usage" USING "btree" ("user_id");



CREATE INDEX "idx_preset_visual_aids_platform_image_id" ON "public"."preset_visual_aids" USING "btree" ("platform_image_id");



CREATE INDEX "idx_preset_visual_aids_preset_key" ON "public"."preset_visual_aids" USING "btree" ("preset_key");



CREATE INDEX "idx_preset_visual_aids_primary" ON "public"."preset_visual_aids" USING "btree" ("is_primary");



CREATE INDEX "idx_preset_visual_aids_type" ON "public"."preset_visual_aids" USING "btree" ("visual_aid_type");



CREATE INDEX "idx_presets_ai_metadata" ON "public"."presets" USING "gin" ("ai_metadata");



CREATE INDEX "idx_presets_ai_metadata_style" ON "public"."presets" USING "btree" ((("ai_metadata" ->> 'style'::"text")));



COMMENT ON INDEX "public"."idx_presets_ai_metadata_style" IS 'Index for querying presets by style from ai_metadata';



CREATE INDEX "idx_presets_category" ON "public"."presets" USING "btree" ("category");



CREATE INDEX "idx_presets_created_at" ON "public"."presets" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_presets_display_name" ON "public"."presets" USING "btree" ("display_name");



CREATE INDEX "idx_presets_headshot_industry" ON "public"."presets" USING "btree" ((("ai_metadata" ->> 'industry'::"text"))) WHERE (("ai_metadata" ->> 'preset_type'::"text") = 'headshot'::"text");



CREATE INDEX "idx_presets_instant_film_style" ON "public"."presets" USING "btree" ((("style_settings" ->> 'film_type'::"text"))) WHERE (("style_settings" ->> 'film_type'::"text") = 'instant'::"text");



CREATE INDEX "idx_presets_instant_film_type" ON "public"."presets" USING "btree" ((("ai_metadata" ->> 'preset_type'::"text"))) WHERE (("ai_metadata" ->> 'preset_type'::"text") = 'instant_film'::"text");



CREATE INDEX "idx_presets_is_active" ON "public"."presets" USING "btree" ("is_active");



CREATE INDEX "idx_presets_is_featured" ON "public"."presets" USING "btree" ("is_featured");



CREATE INDEX "idx_presets_is_for_sale" ON "public"."presets" USING "btree" ("is_for_sale");



CREATE INDEX "idx_presets_is_public" ON "public"."presets" USING "btree" ("is_public");



CREATE INDEX "idx_presets_marketplace_status" ON "public"."presets" USING "btree" ("marketplace_status");



CREATE INDEX "idx_presets_product_category" ON "public"."presets" USING "btree" ((("ai_metadata" ->> 'category'::"text"))) WHERE (("ai_metadata" ->> 'preset_type'::"text") = 'product'::"text");



CREATE INDEX "idx_presets_seedream_config" ON "public"."presets" USING "gin" ("seedream_config");



CREATE INDEX "idx_presets_sort_order" ON "public"."presets" USING "btree" ("sort_order");



CREATE INDEX "idx_presets_style_settings" ON "public"."presets" USING "gin" ("style_settings");



CREATE INDEX "idx_presets_style_settings_style" ON "public"."presets" USING "btree" ((("style_settings" ->> 'style'::"text")));



COMMENT ON INDEX "public"."idx_presets_style_settings_style" IS 'Index for querying presets by style from style_settings';



CREATE INDEX "idx_presets_technical_settings" ON "public"."presets" USING "gin" ("technical_settings");



CREATE INDEX "idx_presets_usage_count" ON "public"."presets" USING "btree" ("usage_count" DESC);



CREATE INDEX "idx_presets_user_id" ON "public"."presets" USING "btree" ("user_id");



CREATE INDEX "idx_provider_performance_provider_date" ON "public"."provider_performance" USING "btree" ("provider", "date");



CREATE INDEX "idx_rate_limits_resource_tier" ON "public"."rate_limits" USING "btree" ("resource_type", "subscription_tier");



CREATE INDEX "idx_refund_audit_log_created" ON "public"."refund_audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_refund_audit_log_task" ON "public"."refund_audit_log" USING "btree" ("task_id");



CREATE INDEX "idx_refund_audit_log_user" ON "public"."refund_audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_rental_orders_dates" ON "public"."rental_orders" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_rental_orders_listing_id" ON "public"."rental_orders" USING "btree" ("listing_id");



CREATE INDEX "idx_rental_orders_owner_id" ON "public"."rental_orders" USING "btree" ("owner_id");



CREATE INDEX "idx_rental_orders_renter_id" ON "public"."rental_orders" USING "btree" ("renter_id");



CREATE INDEX "idx_rental_orders_status" ON "public"."rental_orders" USING "btree" ("status");



CREATE INDEX "idx_rental_requests_dates" ON "public"."rental_requests" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_rental_requests_listing_id" ON "public"."rental_requests" USING "btree" ("listing_id");



CREATE INDEX "idx_rental_requests_owner_id" ON "public"."rental_requests" USING "btree" ("owner_id");



CREATE INDEX "idx_rental_requests_requester_created_at" ON "public"."rental_requests" USING "btree" ("requester_id", "created_at");



CREATE INDEX "idx_rental_requests_requester_id" ON "public"."rental_requests" USING "btree" ("requester_id");



CREATE INDEX "idx_rental_requests_status" ON "public"."rental_requests" USING "btree" ("status");



CREATE INDEX "idx_reports_content" ON "public"."reports" USING "btree" ("content_type", "reported_content_id") WHERE ("reported_content_id" IS NOT NULL);



CREATE INDEX "idx_reports_created_at" ON "public"."reports" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reports_priority" ON "public"."reports" USING "btree" ("priority", "created_at" DESC) WHERE ("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text"]));



CREATE INDEX "idx_reports_reported_user" ON "public"."reports" USING "btree" ("reported_user_id") WHERE ("reported_user_id" IS NOT NULL);



CREATE INDEX "idx_reports_reporter" ON "public"."reports" USING "btree" ("reporter_user_id");



CREATE INDEX "idx_reports_status" ON "public"."reports" USING "btree" ("status") WHERE ("status" <> 'resolved'::"text");



CREATE INDEX "idx_request_conversation_messages_conversation_id" ON "public"."request_conversation_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_request_conversation_messages_created_at" ON "public"."request_conversation_messages" USING "btree" ("created_at");



CREATE INDEX "idx_request_conversation_messages_sender_id" ON "public"."request_conversation_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_request_conversations_request_id" ON "public"."request_conversations" USING "btree" ("request_id");



CREATE INDEX "idx_request_conversations_requester_id" ON "public"."request_conversations" USING "btree" ("requester_id");



CREATE INDEX "idx_request_conversations_responder_id" ON "public"."request_conversations" USING "btree" ("responder_id");



CREATE INDEX "idx_request_conversations_status" ON "public"."request_conversations" USING "btree" ("status");



CREATE INDEX "idx_request_responses_listing_id" ON "public"."request_responses" USING "btree" ("listing_id");



CREATE INDEX "idx_request_responses_request_id" ON "public"."request_responses" USING "btree" ("request_id");



CREATE INDEX "idx_request_responses_responder_id" ON "public"."request_responses" USING "btree" ("responder_id");



CREATE INDEX "idx_request_responses_status" ON "public"."request_responses" USING "btree" ("status");



CREATE INDEX "idx_sale_orders_buyer_id" ON "public"."sale_orders" USING "btree" ("buyer_id");



CREATE INDEX "idx_sale_orders_created_at" ON "public"."sale_orders" USING "btree" ("created_at");



CREATE INDEX "idx_sale_orders_listing_id" ON "public"."sale_orders" USING "btree" ("listing_id");



CREATE INDEX "idx_sale_orders_owner_id" ON "public"."sale_orders" USING "btree" ("owner_id");



CREATE INDEX "idx_sale_orders_status" ON "public"."sale_orders" USING "btree" ("status");



CREATE INDEX "idx_scene_moods_value" ON "public"."scene_moods" USING "btree" ("value");



CREATE INDEX "idx_shot_sizes_value" ON "public"."shot_sizes" USING "btree" ("value");



CREATE INDEX "idx_showcase_comments_created" ON "public"."showcase_comments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_showcase_comments_parent" ON "public"."showcase_comments" USING "btree" ("parent_id");



CREATE INDEX "idx_showcase_comments_showcase" ON "public"."showcase_comments" USING "btree" ("showcase_id");



CREATE INDEX "idx_showcase_comments_user" ON "public"."showcase_comments" USING "btree" ("user_id");



CREATE INDEX "idx_showcase_likes_created" ON "public"."showcase_likes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_showcase_likes_showcase" ON "public"."showcase_likes" USING "btree" ("showcase_id");



CREATE INDEX "idx_showcase_likes_user" ON "public"."showcase_likes" USING "btree" ("user_id");



CREATE INDEX "idx_showcases_creator" ON "public"."showcases" USING "btree" ("creator_user_id");



CREATE INDEX "idx_showcases_participants" ON "public"."showcases" USING "btree" ("creator_user_id", "talent_user_id", "visibility") WHERE ("visibility" = 'PUBLIC'::"public"."showcase_visibility");



CREATE INDEX "idx_showcases_talent" ON "public"."showcases" USING "btree" ("talent_user_id");



CREATE INDEX "idx_specializations_active" ON "public"."specializations" USING "btree" ("is_active");



CREATE INDEX "idx_specializations_category" ON "public"."specializations" USING "btree" ("category");



CREATE INDEX "idx_specializations_sort_order" ON "public"."specializations" USING "btree" ("sort_order");



CREATE INDEX "idx_style_prompts_active" ON "public"."style_prompts" USING "btree" ("is_active");



CREATE INDEX "idx_style_prompts_category" ON "public"."style_prompts" USING "btree" ("category");



CREATE INDEX "idx_style_prompts_style_name" ON "public"."style_prompts" USING "btree" ("style_name");



CREATE INDEX "idx_subject_counts_value" ON "public"."subject_counts" USING "btree" ("value");



CREATE INDEX "idx_system_logs_created_at" ON "public"."system_logs" USING "btree" ("created_at");



CREATE INDEX "idx_system_logs_event_type" ON "public"."system_logs" USING "btree" ("event_type");



CREATE INDEX "idx_system_logs_user_id" ON "public"."system_logs" USING "btree" ("user_id");



CREATE INDEX "idx_time_settings_value" ON "public"."time_settings" USING "btree" ("value");



CREATE INDEX "idx_timezones_is_active" ON "public"."timezones" USING "btree" ("is_active");



CREATE INDEX "idx_timezones_sort_order" ON "public"."timezones" USING "btree" ("sort_order");



CREATE INDEX "idx_treatment_analytics_created_at" ON "public"."treatment_analytics" USING "btree" ("created_at");



CREATE INDEX "idx_treatment_analytics_treatment_id" ON "public"."treatment_analytics" USING "btree" ("treatment_id");



CREATE INDEX "idx_treatment_assets_asset_type" ON "public"."treatment_assets" USING "btree" ("asset_type");



CREATE INDEX "idx_treatment_assets_treatment_id" ON "public"."treatment_assets" USING "btree" ("treatment_id");



CREATE INDEX "idx_treatment_sharing_shared_with" ON "public"."treatment_sharing" USING "btree" ("shared_with_user_id");



CREATE INDEX "idx_treatment_sharing_treatment_id" ON "public"."treatment_sharing" USING "btree" ("treatment_id");



CREATE INDEX "idx_treatment_versions_treatment_id" ON "public"."treatment_versions" USING "btree" ("treatment_id");



CREATE INDEX "idx_treatment_versions_version_number" ON "public"."treatment_versions" USING "btree" ("version_number");



CREATE INDEX "idx_treatments_created_at" ON "public"."treatments" USING "btree" ("created_at");



CREATE INDEX "idx_treatments_format" ON "public"."treatments" USING "btree" ("format");



CREATE INDEX "idx_treatments_is_public" ON "public"."treatments" USING "btree" ("is_public");



CREATE INDEX "idx_treatments_owner_id" ON "public"."treatments" USING "btree" ("owner_id");



CREATE INDEX "idx_treatments_project_id" ON "public"."treatments" USING "btree" ("project_id");



CREATE INDEX "idx_treatments_status" ON "public"."treatments" USING "btree" ("status");



CREATE INDEX "idx_typing_indicators_activity" ON "public"."typing_indicators" USING "btree" ("last_activity");



CREATE INDEX "idx_typing_indicators_conversation" ON "public"."typing_indicators" USING "btree" ("conversation_id");



CREATE INDEX "idx_typing_indicators_user" ON "public"."typing_indicators" USING "btree" ("user_id");



CREATE INDEX "idx_user_availability_user_id" ON "public"."user_availability" USING "btree" ("user_id");



CREATE INDEX "idx_user_blocks_blocked" ON "public"."user_blocks" USING "btree" ("blocked_user_id");



CREATE INDEX "idx_user_blocks_blocker" ON "public"."user_blocks" USING "btree" ("blocker_user_id");



CREATE INDEX "idx_user_blocks_created_at" ON "public"."user_blocks" USING "btree" ("created_at");



CREATE INDEX "idx_user_clothing_sizes_profile" ON "public"."user_clothing_sizes" USING "btree" ("profile_id");



CREATE INDEX "idx_user_credit_purchases_created_at" ON "public"."user_credit_purchases" USING "btree" ("created_at");



CREATE INDEX "idx_user_credit_purchases_user_id" ON "public"."user_credit_purchases" USING "btree" ("user_id");



CREATE INDEX "idx_user_credits_current_balance" ON "public"."user_credits" USING "btree" ("current_balance");



CREATE INDEX "idx_user_credits_user_id" ON "public"."user_credits" USING "btree" ("user_id");



CREATE INDEX "idx_user_equipment_model_id" ON "public"."user_equipment" USING "btree" ("equipment_model_id");



CREATE INDEX "idx_user_equipment_profile_id" ON "public"."user_equipment" USING "btree" ("profile_id");



CREATE INDEX "idx_user_measurements_profile" ON "public"."user_measurements" USING "btree" ("profile_id");



CREATE INDEX "idx_user_provider_preferences_user_id" ON "public"."user_provider_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_user_rate_limits_last_action" ON "public"."user_rate_limits" USING "btree" ("last_action");



CREATE INDEX "idx_user_rate_limits_user_resource" ON "public"."user_rate_limits" USING "btree" ("user_profile_id", "resource_type");



CREATE INDEX "idx_user_rate_limits_window_start" ON "public"."user_rate_limits" USING "btree" ("window_start");



CREATE INDEX "idx_user_settings_allow_stranger_messages" ON "public"."user_settings" USING "btree" ("allow_stranger_messages") WHERE ("allow_stranger_messages" = false);



CREATE INDEX "idx_user_settings_message_notifications" ON "public"."user_settings" USING "btree" ("message_notifications") WHERE ("message_notifications" = false);



CREATE INDEX "idx_user_settings_profile_id" ON "public"."user_settings" USING "btree" ("profile_id");



CREATE INDEX "idx_user_settings_user_id" ON "public"."user_settings" USING "btree" ("user_id");



CREATE INDEX "idx_user_skills_featured" ON "public"."user_skills" USING "btree" ("profile_id", "is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_user_skills_name" ON "public"."user_skills" USING "btree" ("skill_name");



CREATE INDEX "idx_user_skills_proficiency" ON "public"."user_skills" USING "btree" ("proficiency_level");



CREATE INDEX "idx_user_skills_profile_id" ON "public"."user_skills" USING "btree" ("profile_id");



CREATE INDEX "idx_user_skills_type" ON "public"."user_skills" USING "btree" ("skill_type");



CREATE INDEX "idx_user_skills_years" ON "public"."user_skills" USING "btree" ("years_experience");



CREATE INDEX "idx_user_vibe_analytics_confidence" ON "public"."user_vibe_analytics" USING "btree" ("user_id", "confidence_score" DESC);



CREATE INDEX "idx_user_vibe_analytics_user" ON "public"."user_vibe_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_user_violations_active" ON "public"."user_violations" USING "btree" ("user_id", "expires_at");



CREATE INDEX "idx_user_violations_created" ON "public"."user_violations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_violations_not_expired" ON "public"."user_violations" USING "btree" ("user_id") WHERE ("expires_at" IS NULL);



CREATE INDEX "idx_user_violations_report" ON "public"."user_violations" USING "btree" ("report_id") WHERE ("report_id" IS NOT NULL);



CREATE INDEX "idx_user_violations_severity" ON "public"."user_violations" USING "btree" ("severity");



CREATE INDEX "idx_user_violations_user" ON "public"."user_violations" USING "btree" ("user_id");



CREATE INDEX "idx_users_profile_accepts_tfp" ON "public"."users_profile" USING "btree" ("accepts_tfp");



CREATE INDEX "idx_users_profile_account_status" ON "public"."users_profile" USING "btree" ("account_status");



CREATE INDEX "idx_users_profile_age_verified" ON "public"."users_profile" USING "btree" ("age_verified");



CREATE INDEX "idx_users_profile_allow_collaboration_invites" ON "public"."users_profile" USING "btree" ("allow_collaboration_invites");



CREATE INDEX "idx_users_profile_allow_direct_booking" ON "public"."users_profile" USING "btree" ("allow_direct_booking");



CREATE INDEX "idx_users_profile_allow_direct_messages" ON "public"."users_profile" USING "btree" ("allow_direct_messages");



CREATE INDEX "idx_users_profile_availability_status" ON "public"."users_profile" USING "btree" ("availability_status");



CREATE INDEX "idx_users_profile_available_for_travel" ON "public"."users_profile" USING "btree" ("available_for_travel");



CREATE INDEX "idx_users_profile_available_weekdays" ON "public"."users_profile" USING "btree" ("available_weekdays");



CREATE INDEX "idx_users_profile_available_weekends" ON "public"."users_profile" USING "btree" ("available_weekends");



CREATE INDEX "idx_users_profile_body_type" ON "public"."users_profile" USING "btree" ("body_type");



CREATE INDEX "idx_users_profile_completion" ON "public"."users_profile" USING "btree" ("profile_completion_percentage");



CREATE INDEX "idx_users_profile_contributor_roles" ON "public"."users_profile" USING "gin" ("contributor_roles");



CREATE INDEX "idx_users_profile_country" ON "public"."users_profile" USING "btree" ("country");



CREATE INDEX "idx_users_profile_date_of_birth" ON "public"."users_profile" USING "btree" ("date_of_birth");



CREATE INDEX "idx_users_profile_email" ON "public"."users_profile" USING "btree" ("email");



CREATE INDEX "idx_users_profile_email_public" ON "public"."users_profile" USING "btree" ("email_public");



CREATE INDEX "idx_users_profile_ethnicity" ON "public"."users_profile" USING "btree" ("ethnicity");



CREATE INDEX "idx_users_profile_experience_level" ON "public"."users_profile" USING "btree" ("experience_level");



CREATE INDEX "idx_users_profile_first_name" ON "public"."users_profile" USING "btree" ("first_name");



CREATE INDEX "idx_users_profile_full_name" ON "public"."users_profile" USING "btree" ("first_name", "last_name");



CREATE INDEX "idx_users_profile_gender_identity" ON "public"."users_profile" USING "btree" ("gender_identity");



CREATE INDEX "idx_users_profile_has_studio" ON "public"."users_profile" USING "btree" ("has_studio");



CREATE INDEX "idx_users_profile_header_banner_position" ON "public"."users_profile" USING "btree" ("header_banner_position") WHERE ("header_banner_position" IS NOT NULL);



CREATE INDEX "idx_users_profile_header_banner_url" ON "public"."users_profile" USING "btree" ("header_banner_url") WHERE ("header_banner_url" IS NOT NULL);



CREATE INDEX "idx_users_profile_hourly_rate" ON "public"."users_profile" USING "btree" ("hourly_rate_min", "hourly_rate_max");



CREATE INDEX "idx_users_profile_include_in_search" ON "public"."users_profile" USING "btree" ("include_in_search");



CREATE INDEX "idx_users_profile_instagram" ON "public"."users_profile" USING "btree" ("instagram_handle") WHERE ("instagram_handle" IS NOT NULL);



CREATE INDEX "idx_users_profile_last_name" ON "public"."users_profile" USING "btree" ("last_name");



CREATE INDEX "idx_users_profile_nationality" ON "public"."users_profile" USING "btree" ("nationality");



CREATE INDEX "idx_users_profile_phone_public" ON "public"."users_profile" USING "btree" ("phone_public");



CREATE INDEX "idx_users_profile_preferred_start_time" ON "public"."users_profile" USING "btree" ("preferred_start_time");



CREATE INDEX "idx_users_profile_prefers_outdoor" ON "public"."users_profile" USING "btree" ("prefers_outdoor");



CREATE INDEX "idx_users_profile_prefers_studio" ON "public"."users_profile" USING "btree" ("prefers_studio");



CREATE INDEX "idx_users_profile_primary_skill" ON "public"."users_profile" USING "btree" ("primary_skill") WHERE ("primary_skill" IS NOT NULL);



CREATE INDEX "idx_users_profile_professional_skills" ON "public"."users_profile" USING "gin" ("professional_skills");



CREATE INDEX "idx_users_profile_profile_completion" ON "public"."users_profile" USING "btree" ("profile_completion_percentage");



CREATE INDEX "idx_users_profile_show_location" ON "public"."users_profile" USING "btree" ("show_location");



CREATE INDEX "idx_users_profile_show_rates" ON "public"."users_profile" USING "btree" ("show_rates");



CREATE INDEX "idx_users_profile_specializations" ON "public"."users_profile" USING "gin" ("specializations");



CREATE INDEX "idx_users_profile_state_province" ON "public"."users_profile" USING "btree" ("state_province");



CREATE INDEX "idx_users_profile_talent_categories" ON "public"."users_profile" USING "gin" ("talent_categories");



CREATE INDEX "idx_users_profile_timezone" ON "public"."users_profile" USING "btree" ("timezone");



CREATE INDEX "idx_users_profile_travel_radius" ON "public"."users_profile" USING "btree" ("travel_radius_km");



CREATE INDEX "idx_users_profile_vibe_tags" ON "public"."users_profile" USING "gin" ("vibe_tags");



CREATE INDEX "idx_users_profile_working_time_preference" ON "public"."users_profile" USING "btree" ("working_time_preference");



CREATE INDEX "idx_users_profile_working_timezone" ON "public"."users_profile" USING "btree" ("working_timezone");



CREATE INDEX "idx_users_profile_works_with_teams" ON "public"."users_profile" USING "btree" ("works_with_teams");



CREATE INDEX "idx_users_subscription_tier" ON "public"."users_profile" USING "btree" ("subscription_tier");



CREATE INDEX "idx_verification_badges_active" ON "public"."verification_badges" USING "btree" ("user_id", "badge_type") WHERE ("revoked_at" IS NULL);



CREATE INDEX "idx_verification_badges_user" ON "public"."verification_badges" USING "btree" ("user_id");



CREATE INDEX "idx_verification_requests_status" ON "public"."verification_requests" USING "btree" ("status") WHERE ("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text"]));



CREATE INDEX "idx_verification_requests_submitted" ON "public"."verification_requests" USING "btree" ("submitted_at" DESC);



CREATE INDEX "idx_verification_requests_type" ON "public"."verification_requests" USING "btree" ("verification_type");



CREATE INDEX "idx_verification_requests_user" ON "public"."verification_requests" USING "btree" ("user_id");



CREATE INDEX "idx_weather_conditions_value" ON "public"."weather_conditions" USING "btree" ("value");



CREATE INDEX "idx_working_time_preferences_is_active" ON "public"."working_time_preferences" USING "btree" ("is_active");



CREATE INDEX "idx_working_time_preferences_sort_order" ON "public"."working_time_preferences" USING "btree" ("sort_order");



CREATE UNIQUE INDEX "unique_active_badge_per_type" ON "public"."verification_badges" USING "btree" ("user_id", "badge_type") WHERE ("revoked_at" IS NULL);



CREATE UNIQUE INDEX "unique_pending_rental_request" ON "public"."rental_requests" USING "btree" ("listing_id", "requester_id") WHERE ("status" = 'pending'::"text");



COMMENT ON INDEX "public"."unique_pending_rental_request" IS 'Prevents users from making multiple pending rental requests for the same listing';



CREATE UNIQUE INDEX "unique_user_listing_offer" ON "public"."offers" USING "btree" ("listing_id", "offerer_id");



COMMENT ON INDEX "public"."unique_user_listing_offer" IS 'Prevents users from making multiple offers for the same listing regardless of status';



CREATE OR REPLACE TRIGGER "add_equipment_provider_as_participant_trigger" AFTER UPDATE ON "public"."collab_gear_offers" FOR EACH ROW EXECUTE FUNCTION "public"."add_equipment_provider_as_participant"();



CREATE OR REPLACE TRIGGER "add_invited_user_as_participant_trigger" AFTER UPDATE ON "public"."collab_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."add_invited_user_as_participant"();



CREATE OR REPLACE TRIGGER "add_project_creator_as_participant_trigger" AFTER INSERT ON "public"."collab_projects" FOR EACH ROW EXECUTE FUNCTION "public"."add_project_creator_as_participant"();



CREATE OR REPLACE TRIGGER "application_milestone_trigger" AFTER INSERT ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_application_milestone"();



CREATE OR REPLACE TRIGGER "application_status_trigger" AFTER UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_application_status_email"();



CREATE OR REPLACE TRIGGER "applications_closed_trigger" AFTER UPDATE ON "public"."gigs" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_applications_closed_email"();



CREATE OR REPLACE TRIGGER "auto_escalate_report_trigger" BEFORE INSERT ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."auto_escalate_report_priority"();



CREATE OR REPLACE TRIGGER "auto_refund_on_failure" AFTER UPDATE ON "public"."enhancement_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."auto_refund_trigger"();



CREATE OR REPLACE TRIGGER "cleanup_old_profile_photos_trigger" BEFORE UPDATE OF "avatar_url" ON "public"."users_profile" FOR EACH ROW WHEN (("old"."avatar_url" IS DISTINCT FROM "new"."avatar_url")) EXECUTE FUNCTION "public"."cleanup_old_profile_photos"();



CREATE OR REPLACE TRIGGER "create_user_settings_profile_trigger" AFTER INSERT ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_user_settings"();



CREATE OR REPLACE TRIGGER "generate_invitation_token_trigger" BEFORE INSERT ON "public"."collab_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."generate_invitation_token"();



CREATE OR REPLACE TRIGGER "gig_cancelled_trigger" AFTER UPDATE ON "public"."gigs" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_gig_cancelled_email"();



CREATE OR REPLACE TRIGGER "gig_completed_trigger" AFTER UPDATE ON "public"."gigs" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_gig_completed_email"();



CREATE OR REPLACE TRIGGER "gig_published_trigger" AFTER INSERT OR UPDATE ON "public"."gigs" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_gig_published_email"();



CREATE OR REPLACE TRIGGER "handle_change_redirect" AFTER UPDATE OF "handle" ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."create_handle_redirect"();



CREATE OR REPLACE TRIGGER "message_received_email_trigger" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_message_received_email"();



CREATE OR REPLACE TRIGGER "new_application_trigger" AFTER INSERT ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_new_application_email"();



CREATE OR REPLACE TRIGGER "preset_listing_status_trigger" AFTER UPDATE ON "public"."preset_marketplace_listings" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_preset_listing_status_email"();



CREATE OR REPLACE TRIGGER "preset_purchase_confirmation_trigger" AFTER INSERT ON "public"."preset_purchases" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_preset_purchase_confirmation_email"();



CREATE OR REPLACE TRIGGER "preset_review_received_trigger" AFTER INSERT ON "public"."preset_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_preset_review_received_email"();



CREATE OR REPLACE TRIGGER "preset_sold_email_trigger" AFTER INSERT OR UPDATE ON "public"."preset_purchases" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_preset_sold_email"();



CREATE OR REPLACE TRIGGER "reports_updated_at_trigger" BEFORE UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_reports_updated_at"();



CREATE OR REPLACE TRIGGER "subscription_change_trigger" AFTER UPDATE ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_subscription_change_email"();



CREATE OR REPLACE TRIGGER "trg_validate_contributor_roles" BEFORE INSERT OR UPDATE ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."validate_contributor_roles_trigger"();



CREATE OR REPLACE TRIGGER "trg_validate_professional_skills" BEFORE INSERT OR UPDATE ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."validate_professional_skills_trigger"();



CREATE OR REPLACE TRIGGER "trigger_auto_increment_preset_usage_count" AFTER INSERT ON "public"."preset_usage" FOR EACH ROW EXECUTE FUNCTION "public"."auto_increment_preset_usage_count"();



COMMENT ON TRIGGER "trigger_auto_increment_preset_usage_count" ON "public"."preset_usage" IS 'Automatically increments the usage_count on presets table when a new usage record is inserted';



CREATE OR REPLACE TRIGGER "trigger_auto_update_profile_completion" BEFORE INSERT OR UPDATE ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."auto_update_profile_completion"();



CREATE OR REPLACE TRIGGER "trigger_handle_gig_invitation_acceptance" BEFORE UPDATE ON "public"."gig_invitations" FOR EACH ROW WHEN (("new"."status" <> "old"."status")) EXECUTE FUNCTION "public"."handle_gig_invitation_acceptance"();



CREATE OR REPLACE TRIGGER "trigger_notify_application_status_changed" AFTER UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."notify_application_status_changed"();



COMMENT ON TRIGGER "trigger_notify_application_status_changed" ON "public"."applications" IS 'Triggers notification when application status is updated';



CREATE OR REPLACE TRIGGER "trigger_notify_collab_invitation_response" AFTER UPDATE ON "public"."collab_invitations" FOR EACH ROW WHEN ((("old"."status" = 'pending'::"text") AND ("new"."status" = ANY (ARRAY['accepted'::"text", 'declined'::"text"])))) EXECUTE FUNCTION "public"."notify_collab_invitation_response"();



CREATE OR REPLACE TRIGGER "trigger_notify_collab_invitation_sent" AFTER INSERT ON "public"."collab_invitations" FOR EACH ROW WHEN ((("new"."status" = 'pending'::"text") AND ("new"."invitee_id" IS NOT NULL))) EXECUTE FUNCTION "public"."notify_collab_invitation_sent"();



CREATE OR REPLACE TRIGGER "trigger_notify_credits_added" AFTER UPDATE OF "current_balance" ON "public"."user_credits" FOR EACH ROW WHEN (("pg_trigger_depth"() = 0)) EXECUTE FUNCTION "public"."notify_credits_added"();



COMMENT ON TRIGGER "trigger_notify_credits_added" ON "public"."user_credits" IS 'Triggers notification when credits are added to account';



CREATE OR REPLACE TRIGGER "trigger_notify_gig_application_received" AFTER INSERT ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."notify_gig_application_received"();



COMMENT ON TRIGGER "trigger_notify_gig_application_received" ON "public"."applications" IS 'Triggers notification when new gig application is created';



CREATE OR REPLACE TRIGGER "trigger_notify_gig_invitation_response" AFTER UPDATE ON "public"."gig_invitations" FOR EACH ROW WHEN ((("old"."status" = 'pending'::"text") AND ("new"."status" = ANY (ARRAY['accepted'::"text", 'declined'::"text"])))) EXECUTE FUNCTION "public"."notify_gig_invitation_response"();



CREATE OR REPLACE TRIGGER "trigger_notify_gig_invitation_sent" AFTER INSERT ON "public"."gig_invitations" FOR EACH ROW WHEN (("new"."status" = 'pending'::"text")) EXECUTE FUNCTION "public"."notify_gig_invitation_sent"();



CREATE OR REPLACE TRIGGER "trigger_notify_listing_status" AFTER UPDATE OF "status" ON "public"."preset_marketplace_listings" FOR EACH ROW EXECUTE FUNCTION "public"."notify_listing_status"();



CREATE OR REPLACE TRIGGER "trigger_notify_low_credit" AFTER UPDATE OF "current_balance" ON "public"."user_credits" FOR EACH ROW WHEN (("pg_trigger_depth"() = 0)) EXECUTE FUNCTION "public"."notify_low_credit"();



COMMENT ON TRIGGER "trigger_notify_low_credit" ON "public"."user_credits" IS 'Triggers notification when credit balance falls below thresholds';



CREATE OR REPLACE TRIGGER "trigger_notify_new_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_message"();



COMMENT ON TRIGGER "trigger_notify_new_message" ON "public"."messages" IS 'Triggers notification when a new message is sent';



CREATE OR REPLACE TRIGGER "trigger_notify_preset_liked" AFTER INSERT ON "public"."preset_likes" FOR EACH ROW EXECUTE FUNCTION "public"."notify_preset_liked"();



COMMENT ON TRIGGER "trigger_notify_preset_liked" ON "public"."preset_likes" IS 'Triggers notification when a preset is liked';



CREATE OR REPLACE TRIGGER "trigger_notify_preset_milestone" AFTER UPDATE OF "usage_count" ON "public"."presets" FOR EACH ROW EXECUTE FUNCTION "public"."notify_preset_milestone"();



COMMENT ON TRIGGER "trigger_notify_preset_milestone" ON "public"."presets" IS 'Triggers milestone notification when usage count increases';



CREATE OR REPLACE TRIGGER "trigger_notify_preset_purchased" AFTER INSERT ON "public"."preset_purchases" FOR EACH ROW EXECUTE FUNCTION "public"."notify_preset_purchased"();



CREATE OR REPLACE TRIGGER "trigger_notify_preset_review" AFTER INSERT ON "public"."preset_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."notify_preset_review"();



CREATE OR REPLACE TRIGGER "trigger_notify_preset_usage" AFTER INSERT ON "public"."preset_usage" FOR EACH ROW EXECUTE FUNCTION "public"."notify_preset_usage"();



COMMENT ON TRIGGER "trigger_notify_preset_usage" ON "public"."preset_usage" IS 'Triggers notification when a preset is used';



CREATE OR REPLACE TRIGGER "trigger_notify_showcase_comment" AFTER INSERT ON "public"."showcase_comments" FOR EACH ROW EXECUTE FUNCTION "public"."notify_showcase_comment"();



CREATE OR REPLACE TRIGGER "trigger_notify_showcase_liked" AFTER INSERT ON "public"."showcase_likes" FOR EACH ROW EXECUTE FUNCTION "public"."notify_showcase_liked"();



CREATE OR REPLACE TRIGGER "trigger_notify_verification_status" AFTER UPDATE OF "verified_id" ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."notify_verification_status"();



COMMENT ON TRIGGER "trigger_notify_verification_status" ON "public"."users_profile" IS 'Triggers notification when user verification status changes';



CREATE OR REPLACE TRIGGER "trigger_update_featured_requests_updated_at" BEFORE UPDATE ON "public"."featured_preset_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_featured_requests_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_listing_comment_count" AFTER INSERT OR DELETE ON "public"."listing_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_listing_comment_count"();



CREATE OR REPLACE TRIGGER "trigger_update_listing_images_updated_at" BEFORE UPDATE ON "public"."listing_images" FOR EACH ROW EXECUTE FUNCTION "public"."update_listing_images_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_message_status" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_message_status"();



CREATE OR REPLACE TRIGGER "trigger_update_preset_images_updated_at" BEFORE UPDATE ON "public"."preset_images" FOR EACH ROW EXECUTE FUNCTION "public"."update_preset_images_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_preset_latest_promoted_image" AFTER UPDATE OF "is_verified" ON "public"."playground_gallery" FOR EACH ROW EXECUTE FUNCTION "public"."update_preset_latest_promoted_image"();



CREATE OR REPLACE TRIGGER "trigger_update_preset_likes_count_delete" AFTER DELETE ON "public"."preset_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_preset_likes_count"();



CREATE OR REPLACE TRIGGER "trigger_update_preset_likes_count_insert" AFTER INSERT ON "public"."preset_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_preset_likes_count"();



CREATE OR REPLACE TRIGGER "trigger_update_preset_likes_updated_at" BEFORE UPDATE ON "public"."preset_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_preset_likes_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_preset_usage_updated_at" BEFORE INSERT ON "public"."preset_usage" FOR EACH ROW EXECUTE FUNCTION "public"."update_preset_usage_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_presets_updated_at" BEFORE UPDATE ON "public"."presets" FOR EACH ROW EXECUTE FUNCTION "public"."update_presets_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_showcase_comments_count_delete" AFTER DELETE ON "public"."showcase_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_showcase_comments_count"();



CREATE OR REPLACE TRIGGER "trigger_update_showcase_comments_count_insert" AFTER INSERT ON "public"."showcase_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_showcase_comments_count"();



CREATE OR REPLACE TRIGGER "trigger_update_showcase_likes_count_delete" AFTER DELETE ON "public"."showcase_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_showcase_likes_count"();



CREATE OR REPLACE TRIGGER "trigger_update_showcase_likes_count_insert" AFTER INSERT ON "public"."showcase_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_showcase_likes_count"();



CREATE OR REPLACE TRIGGER "trigger_update_treatment_updated_at" BEFORE UPDATE ON "public"."treatments" FOR EACH ROW EXECUTE FUNCTION "public"."update_treatment_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_user_vibe_analytics" AFTER INSERT OR UPDATE OF "vibe_ids" ON "public"."moodboards" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_vibe_analytics"();



CREATE OR REPLACE TRIGGER "trigger_validate_message" BEFORE INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."validate_message_before_insert"();



CREATE OR REPLACE TRIGGER "update_applications_updated_at" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_cinematic_presets_updated_at" BEFORE UPDATE ON "public"."cinematic_presets" FOR EACH ROW EXECUTE FUNCTION "public"."update_cinematic_presets_updated_at"();



CREATE OR REPLACE TRIGGER "update_collab_applications_updated_at" BEFORE UPDATE ON "public"."collab_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_collab_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_collab_gear_offers_updated_at" BEFORE UPDATE ON "public"."collab_gear_offers" FOR EACH ROW EXECUTE FUNCTION "public"."update_collab_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_collab_gear_requests_updated_at" BEFORE UPDATE ON "public"."collab_gear_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_collab_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_collab_projects_updated_at" BEFORE UPDATE ON "public"."collab_projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_collab_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_collab_roles_updated_at" BEFORE UPDATE ON "public"."collab_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_collab_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_conversation_on_new_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_last_message"();



CREATE OR REPLACE TRIGGER "update_conversation_participants_updated_at" BEFORE UPDATE ON "public"."conversation_participants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_conversations_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_equipment_brands_updated_at" BEFORE UPDATE ON "public"."equipment_brands" FOR EACH ROW EXECUTE FUNCTION "public"."update_equipment_updated_at"();



CREATE OR REPLACE TRIGGER "update_equipment_models_updated_at" BEFORE UPDATE ON "public"."equipment_models" FOR EACH ROW EXECUTE FUNCTION "public"."update_equipment_updated_at"();



CREATE OR REPLACE TRIGGER "update_equipment_predefined_models_updated_at" BEFORE UPDATE ON "public"."equipment_predefined_models" FOR EACH ROW EXECUTE FUNCTION "public"."update_equipment_updated_at"();



CREATE OR REPLACE TRIGGER "update_equipment_requests_updated_at" BEFORE UPDATE ON "public"."equipment_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_equipment_types_updated_at" BEFORE UPDATE ON "public"."equipment_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_equipment_updated_at"();



CREATE OR REPLACE TRIGGER "update_gigs_updated_at" BEFORE UPDATE ON "public"."gigs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_invitation_responded_at_trigger" BEFORE UPDATE ON "public"."collab_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."update_invitation_responded_at"();



CREATE OR REPLACE TRIGGER "update_listing_images_updated_at" BEFORE UPDATE ON "public"."listing_images" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_listings_updated_at" BEFORE UPDATE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_messages_updated_at" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_moodboards_updated_at" BEFORE UPDATE ON "public"."moodboards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_notification_preferences_updated_at" BEFORE UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_notification_preferences_updated_at"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_notifications_updated_at"();



CREATE OR REPLACE TRIGGER "update_offers_updated_at" BEFORE UPDATE ON "public"."offers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_playground_gallery_updated_at" BEFORE UPDATE ON "public"."playground_gallery" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_availability_statuses_updated_at" BEFORE UPDATE ON "public"."predefined_availability_statuses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_body_types_updated_at" BEFORE UPDATE ON "public"."predefined_body_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_clothing_size_systems_updated_at" BEFORE UPDATE ON "public"."predefined_clothing_size_systems" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_clothing_sizes_updated_at" BEFORE UPDATE ON "public"."predefined_clothing_sizes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_equipment_options_updated_at" BEFORE UPDATE ON "public"."predefined_equipment_options" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_ethnicities_updated_at" BEFORE UPDATE ON "public"."predefined_ethnicities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_experience_levels_updated_at" BEFORE UPDATE ON "public"."predefined_experience_levels" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_eye_colors_updated_at" BEFORE UPDATE ON "public"."predefined_eye_colors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_gear_categories_updated_at" BEFORE UPDATE ON "public"."predefined_gear_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_predefined_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_gender_identities_updated_at" BEFORE UPDATE ON "public"."predefined_gender_identities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_hair_colors_updated_at" BEFORE UPDATE ON "public"."predefined_hair_colors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_hair_lengths_updated_at" BEFORE UPDATE ON "public"."predefined_hair_lengths" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_nationalities_updated_at" BEFORE UPDATE ON "public"."predefined_nationalities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_roles_updated_at" BEFORE UPDATE ON "public"."predefined_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_predefined_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_shoe_size_systems_updated_at" BEFORE UPDATE ON "public"."predefined_shoe_size_systems" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_shoe_sizes_updated_at" BEFORE UPDATE ON "public"."predefined_shoe_sizes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_skills_updated_at" BEFORE UPDATE ON "public"."predefined_skills" FOR EACH ROW EXECUTE FUNCTION "public"."update_predefined_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_predefined_skin_tones_updated_at" BEFORE UPDATE ON "public"."predefined_skin_tones" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_preset_notifications_updated_at" BEFORE UPDATE ON "public"."preset_notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_preset_notifications_updated_at"();



CREATE OR REPLACE TRIGGER "update_profile_completion_trigger" BEFORE INSERT OR UPDATE ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."update_profile_completion"();



CREATE OR REPLACE TRIGGER "update_rate_limits_updated_at_trigger" BEFORE UPDATE ON "public"."rate_limits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_rental_orders_updated_at" BEFORE UPDATE ON "public"."rental_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rental_requests_updated_at" BEFORE UPDATE ON "public"."rental_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_request_conversations_updated_at" BEFORE UPDATE ON "public"."request_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_request_responses_updated_at" BEFORE UPDATE ON "public"."request_responses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_role_status_on_acceptance_trigger" AFTER UPDATE ON "public"."collab_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_role_status_on_acceptance"();



CREATE OR REPLACE TRIGGER "update_sale_orders_updated_at" BEFORE UPDATE ON "public"."sale_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_showcases_updated_at" BEFORE UPDATE ON "public"."showcases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_style_prompts_updated_at" BEFORE UPDATE ON "public"."style_prompts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_typing_indicators_updated_at" BEFORE UPDATE ON "public"."typing_indicators" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_blocks_updated_at_trigger" BEFORE UPDATE ON "public"."user_blocks" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_blocks_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_clothing_sizes_updated_at" BEFORE UPDATE ON "public"."user_clothing_sizes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_equipment_updated_at" BEFORE UPDATE ON "public"."user_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."update_equipment_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_measurements_updated_at" BEFORE UPDATE ON "public"."user_measurements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_rate_limits_updated_at_trigger" BEFORE UPDATE ON "public"."user_rate_limits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_skills_updated_at" BEFORE UPDATE ON "public"."user_skills" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_skills_updated_at"();



CREATE OR REPLACE TRIGGER "update_users_profile_updated_at" BEFORE UPDATE ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "verification_updated_at_trigger" BEFORE UPDATE ON "public"."verification_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_verification_updated_at"();



CREATE OR REPLACE TRIGGER "welcome_email_trigger" AFTER INSERT ON "public"."users_profile" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_welcome_email"();



ALTER TABLE ONLY "public"."age_verification_logs"
    ADD CONSTRAINT "age_verification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."age_verification_logs"
    ADD CONSTRAINT "age_verification_logs_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."application_attachments"
    ADD CONSTRAINT "application_attachments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_attachments"
    ADD CONSTRAINT "application_attachments_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_feedback"
    ADD CONSTRAINT "application_feedback_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_feedback"
    ADD CONSTRAINT "application_feedback_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_feedback"
    ADD CONSTRAINT "application_feedback_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_messages"
    ADD CONSTRAINT "application_messages_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_messages"
    ADD CONSTRAINT "application_messages_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_messages"
    ADD CONSTRAINT "application_messages_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_status_history"
    ADD CONSTRAINT "application_status_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_status_history"
    ADD CONSTRAINT "application_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users_profile"("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_applicant_user_id_fkey" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cinematic_presets"
    ADD CONSTRAINT "cinematic_presets_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cinematic_presets"
    ADD CONSTRAINT "cinematic_presets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_applications"
    ADD CONSTRAINT "collab_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_applications"
    ADD CONSTRAINT "collab_applications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."collab_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_applications"
    ADD CONSTRAINT "collab_applications_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."collab_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_gear_offers"
    ADD CONSTRAINT "collab_gear_offers_gear_request_id_fkey" FOREIGN KEY ("gear_request_id") REFERENCES "public"."collab_gear_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_gear_offers"
    ADD CONSTRAINT "collab_gear_offers_offerer_id_fkey" FOREIGN KEY ("offerer_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_gear_offers"
    ADD CONSTRAINT "collab_gear_offers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."collab_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_gear_requests"
    ADD CONSTRAINT "collab_gear_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."collab_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_invitations"
    ADD CONSTRAINT "collab_invitations_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_invitations"
    ADD CONSTRAINT "collab_invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_invitations"
    ADD CONSTRAINT "collab_invitations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."collab_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collab_invitations"
    ADD CONSTRAINT "collab_invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."collab_roles"("id") ON DELETE SET NULL;



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



ALTER TABLE ONLY "public"."contact_sharing"
    ADD CONSTRAINT "contact_sharing_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_sharing"
    ADD CONSTRAINT "contact_sharing_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_sharing"
    ADD CONSTRAINT "contact_sharing_sharer_id_fkey" FOREIGN KEY ("sharer_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_moderation_queue"
    ADD CONSTRAINT "content_moderation_queue_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."content_moderation_queue"
    ADD CONSTRAINT "content_moderation_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_purchase_requests"
    ADD CONSTRAINT "credit_purchase_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_moodboard_id_fkey" FOREIGN KEY ("moodboard_id") REFERENCES "public"."moodboards"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."enhancement_tasks"
    ADD CONSTRAINT "enhancement_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."equipment_models"
    ADD CONSTRAINT "equipment_models_equipment_type_id_fkey" FOREIGN KEY ("equipment_type_id") REFERENCES "public"."equipment_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."equipment_predefined_models"
    ADD CONSTRAINT "equipment_predefined_models_equipment_type_id_fkey" FOREIGN KEY ("equipment_type_id") REFERENCES "public"."equipment_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."equipment_requests"
    ADD CONSTRAINT "equipment_requests_purpose_id_fkey" FOREIGN KEY ("purpose_id") REFERENCES "public"."equipment_request_purposes"("id");



ALTER TABLE ONLY "public"."equipment_requests"
    ADD CONSTRAINT "equipment_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."featured_preset_requests"
    ADD CONSTRAINT "featured_preset_requests_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "public"."presets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."featured_preset_requests"
    ADD CONSTRAINT "featured_preset_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."featured_preset_requests"
    ADD CONSTRAINT "featured_preset_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."gig_invitations"
    ADD CONSTRAINT "gig_invitations_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id");



ALTER TABLE ONLY "public"."gig_invitations"
    ADD CONSTRAINT "gig_invitations_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "public"."users_profile"("id");



ALTER TABLE ONLY "public"."gig_invitations"
    ADD CONSTRAINT "gig_invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "public"."users_profile"("id");



ALTER TABLE ONLY "public"."gigs"
    ADD CONSTRAINT "gigs_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_comments"
    ADD CONSTRAINT "listing_comments_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_comments"
    ADD CONSTRAINT "listing_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."listing_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_comments"
    ADD CONSTRAINT "listing_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_images"
    ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_equipment_brand_id_fkey" FOREIGN KEY ("equipment_brand_id") REFERENCES "public"."equipment_brands"("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_equipment_model_id_fkey" FOREIGN KEY ("equipment_model_id") REFERENCES "public"."equipment_models"("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_equipment_type_id_fkey" FOREIGN KEY ("equipment_type_id") REFERENCES "public"."equipment_types"("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lootbox_events"
    ADD CONSTRAINT "lootbox_events_purchased_by_fkey" FOREIGN KEY ("purchased_by") REFERENCES "auth"."users"("id");



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
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."oauth_logs"
    ADD CONSTRAINT "oauth_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_offerer_id_fkey" FOREIGN KEY ("offerer_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."platform_credit_consumption"
    ADD CONSTRAINT "platform_credit_consumption_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."playground_gallery"
    ADD CONSTRAINT "playground_gallery_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."playground_projects"
    ADD CONSTRAINT "playground_projects_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "public"."presets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."playground_projects"
    ADD CONSTRAINT "playground_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."predefined_clothing_sizes"
    ADD CONSTRAINT "predefined_clothing_sizes_size_system_id_fkey" FOREIGN KEY ("size_system_id") REFERENCES "public"."predefined_clothing_size_systems"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."predefined_shoe_sizes"
    ADD CONSTRAINT "predefined_shoe_sizes_size_system_id_fkey" FOREIGN KEY ("size_system_id") REFERENCES "public"."predefined_shoe_size_systems"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_images"
    ADD CONSTRAINT "preset_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_likes"
    ADD CONSTRAINT "preset_likes_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "public"."presets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_likes"
    ADD CONSTRAINT "preset_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_marketplace_listings"
    ADD CONSTRAINT "preset_marketplace_listings_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."preset_marketplace_listings"
    ADD CONSTRAINT "preset_marketplace_listings_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "public"."presets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_marketplace_listings"
    ADD CONSTRAINT "preset_marketplace_listings_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_notifications"
    ADD CONSTRAINT "preset_notifications_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_purchases"
    ADD CONSTRAINT "preset_purchases_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_purchases"
    ADD CONSTRAINT "preset_purchases_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."preset_marketplace_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_purchases"
    ADD CONSTRAINT "preset_purchases_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "public"."presets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_purchases"
    ADD CONSTRAINT "preset_purchases_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_reviews"
    ADD CONSTRAINT "preset_reviews_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "public"."presets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_reviews"
    ADD CONSTRAINT "preset_reviews_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."preset_purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_reviews"
    ADD CONSTRAINT "preset_reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_usage"
    ADD CONSTRAINT "preset_usage_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "public"."presets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_usage"
    ADD CONSTRAINT "preset_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preset_visual_aids"
    ADD CONSTRAINT "preset_visual_aids_platform_image_id_fkey" FOREIGN KEY ("platform_image_id") REFERENCES "public"."platform_images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."presets"
    ADD CONSTRAINT "presets_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."presets"
    ADD CONSTRAINT "presets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."refund_audit_log"
    ADD CONSTRAINT "refund_audit_log_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."enhancement_tasks"("id");



ALTER TABLE ONLY "public"."refund_audit_log"
    ADD CONSTRAINT "refund_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."rental_orders"
    ADD CONSTRAINT "rental_orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rental_orders"
    ADD CONSTRAINT "rental_orders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rental_orders"
    ADD CONSTRAINT "rental_orders_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rental_requests"
    ADD CONSTRAINT "rental_requests_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rental_requests"
    ADD CONSTRAINT "rental_requests_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rental_requests"
    ADD CONSTRAINT "rental_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."request_conversation_messages"
    ADD CONSTRAINT "request_conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."request_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_conversation_messages"
    ADD CONSTRAINT "request_conversation_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."showcase_comments"
    ADD CONSTRAINT "showcase_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."showcase_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcase_comments"
    ADD CONSTRAINT "showcase_comments_showcase_id_fkey" FOREIGN KEY ("showcase_id") REFERENCES "public"."showcases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcase_comments"
    ADD CONSTRAINT "showcase_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcase_likes"
    ADD CONSTRAINT "showcase_likes_showcase_id_fkey" FOREIGN KEY ("showcase_id") REFERENCES "public"."showcases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcase_likes"
    ADD CONSTRAINT "showcase_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcases"
    ADD CONSTRAINT "showcases_creator_user_id_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcases"
    ADD CONSTRAINT "showcases_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcases"
    ADD CONSTRAINT "showcases_talent_user_id_fkey" FOREIGN KEY ("talent_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_analytics"
    ADD CONSTRAINT "treatment_analytics_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_analytics"
    ADD CONSTRAINT "treatment_analytics_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."treatment_assets"
    ADD CONSTRAINT "treatment_assets_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_sharing"
    ADD CONSTRAINT "treatment_sharing_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."treatment_sharing"
    ADD CONSTRAINT "treatment_sharing_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_sharing"
    ADD CONSTRAINT "treatment_sharing_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_versions"
    ADD CONSTRAINT "treatment_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."treatment_versions"
    ADD CONSTRAINT "treatment_versions_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatments"
    ADD CONSTRAINT "treatments_moodboard_id_fkey" FOREIGN KEY ("moodboard_id") REFERENCES "public"."moodboards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."treatments"
    ADD CONSTRAINT "treatments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatments"
    ADD CONSTRAINT "treatments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."gigs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_availability"
    ADD CONSTRAINT "user_availability_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_blocker_user_id_fkey" FOREIGN KEY ("blocker_user_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_clothing_sizes"
    ADD CONSTRAINT "user_clothing_sizes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_clothing_sizes"
    ADD CONSTRAINT "user_clothing_sizes_size_system_id_fkey" FOREIGN KEY ("size_system_id") REFERENCES "public"."predefined_clothing_size_systems"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_credit_purchases"
    ADD CONSTRAINT "user_credit_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_equipment"
    ADD CONSTRAINT "user_equipment_equipment_model_id_fkey" FOREIGN KEY ("equipment_model_id") REFERENCES "public"."equipment_models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_equipment"
    ADD CONSTRAINT "user_equipment_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_handle_redirects"
    ADD CONSTRAINT "user_handle_redirects_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_measurements"
    ADD CONSTRAINT "user_measurements_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_provider_preferences"
    ADD CONSTRAINT "user_provider_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_rate_limits"
    ADD CONSTRAINT "user_rate_limits_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."users_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."users_profile"("id");



ALTER TABLE ONLY "public"."user_vibe_analytics"
    ADD CONSTRAINT "user_vibe_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_vibe_analytics"
    ADD CONSTRAINT "user_vibe_analytics_vibe_id_fkey" FOREIGN KEY ("vibe_id") REFERENCES "public"."vibes_master"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_violations"
    ADD CONSTRAINT "user_violations_moderation_action_id_fkey" FOREIGN KEY ("moderation_action_id") REFERENCES "public"."moderation_actions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_violations"
    ADD CONSTRAINT "user_violations_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_violations"
    ADD CONSTRAINT "user_violations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



CREATE POLICY "Admin can view all analytics" ON "public"."platform_credit_consumption" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admin can view all purchases" ON "public"."user_credit_purchases" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admin can view all tasks" ON "public"."enhancement_tasks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admin only access to system logs" ON "public"."system_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admin users can update all applications" ON "public"."applications" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admin users can view all applications" ON "public"."applications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admins can manage all cinematic presets" ON "public"."cinematic_presets" USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admins can manage all preset images" ON "public"."preset_images" USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admins can update featured request status" ON "public"."featured_preset_requests" FOR UPDATE USING (true);



CREATE POLICY "Admins can update moderation queue items" ON "public"."content_moderation_queue" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admins can view all featured requests" ON "public"."featured_preset_requests" FOR SELECT USING (true);



CREATE POLICY "Admins can view all moderation queue items" ON "public"."content_moderation_queue" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Admins can view provider performance" ON "public"."provider_performance" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



CREATE POLICY "Allow auth admin full access" ON "public"."users_profile" TO "supabase_auth_admin" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public read access to predefined_availability_statuses" ON "public"."predefined_availability_statuses" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to predefined_body_types" ON "public"."predefined_body_types" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to predefined_equipment_options" ON "public"."predefined_equipment_options" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to predefined_ethnicities" ON "public"."predefined_ethnicities" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to predefined_experience_levels" ON "public"."predefined_experience_levels" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to predefined_eye_colors" ON "public"."predefined_eye_colors" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to predefined_gender_identities" ON "public"."predefined_gender_identities" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to predefined_hair_colors" ON "public"."predefined_hair_colors" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to predefined_hair_lengths" ON "public"."predefined_hair_lengths" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to predefined_skin_tones" ON "public"."predefined_skin_tones" FOR SELECT USING (true);



CREATE POLICY "Allow service role full access" ON "public"."users_profile" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Allow user access during signup" ON "public"."users_profile" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow user creation during signup" ON "public"."users_profile" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can create treatment analytics" ON "public"."treatment_analytics" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can read active languages" ON "public"."languages_master" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can read active professional skills" ON "public"."predefined_professional_skills" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can read active specializations" ON "public"."specializations" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can read listing comments" ON "public"."listing_comments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view approved listings" ON "public"."preset_marketplace_listings" FOR SELECT USING ((("status")::"text" = 'approved'::"text"));



CREATE POLICY "Anyone can view aspect ratios" ON "public"."aspect_ratios" FOR SELECT USING (true);



CREATE POLICY "Anyone can view camera angles" ON "public"."camera_angles" FOR SELECT USING (true);



CREATE POLICY "Anyone can view camera movements" ON "public"."camera_movements" FOR SELECT USING (true);



CREATE POLICY "Anyone can view clothing size systems" ON "public"."predefined_clothing_size_systems" FOR SELECT USING (true);



CREATE POLICY "Anyone can view clothing sizes" ON "public"."predefined_clothing_sizes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view color palettes" ON "public"."color_palettes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view composition techniques" ON "public"."composition_techniques" FOR SELECT USING (true);



CREATE POLICY "Anyone can view depth of field" ON "public"."depth_of_field" FOR SELECT USING (true);



CREATE POLICY "Anyone can view director styles" ON "public"."director_styles" FOR SELECT USING (true);



CREATE POLICY "Anyone can view era emulations" ON "public"."era_emulations" FOR SELECT USING (true);



CREATE POLICY "Anyone can view eye contacts" ON "public"."eye_contacts" FOR SELECT USING (true);



CREATE POLICY "Anyone can view foreground elements" ON "public"."foreground_elements" FOR SELECT USING (true);



CREATE POLICY "Anyone can view images for active listings" ON "public"."listing_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_images"."listing_id") AND ("listings"."status" = 'active'::"text")))));



CREATE POLICY "Anyone can view lens types" ON "public"."lens_types" FOR SELECT USING (true);



CREATE POLICY "Anyone can view lighting styles" ON "public"."lighting_styles" FOR SELECT USING (true);



CREATE POLICY "Anyone can view location types" ON "public"."location_types" FOR SELECT USING (true);



CREATE POLICY "Anyone can view moodboards for published gigs" ON "public"."moodboards" FOR SELECT USING ((("gig_id" IN ( SELECT "gigs"."id"
   FROM "public"."gigs"
  WHERE ("gigs"."status" = 'PUBLISHED'::"public"."gig_status"))) OR ("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Anyone can view predefined nationalities" ON "public"."predefined_nationalities" FOR SELECT USING (true);



CREATE POLICY "Anyone can view public showcases" ON "public"."showcases" FOR SELECT USING ((("visibility" = 'PUBLIC'::"public"."showcase_visibility") OR ("creator_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("talent_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Anyone can view published gigs" ON "public"."gigs" FOR SELECT USING ((("status" = 'PUBLISHED'::"public"."gig_status") OR ("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Anyone can view rate limits" ON "public"."rate_limits" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view reviews" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Anyone can view scene moods" ON "public"."scene_moods" FOR SELECT USING (true);



CREATE POLICY "Anyone can view shoe size systems" ON "public"."predefined_shoe_size_systems" FOR SELECT USING (true);



CREATE POLICY "Anyone can view shoe sizes" ON "public"."predefined_shoe_sizes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view shot sizes" ON "public"."shot_sizes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view showcase comments" ON "public"."showcase_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."showcases"
  WHERE (("showcases"."id" = "showcase_comments"."showcase_id") AND ("showcases"."visibility" = 'PUBLIC'::"public"."showcase_visibility")))));



CREATE POLICY "Anyone can view showcase likes" ON "public"."showcase_likes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."showcases"
  WHERE (("showcases"."id" = "showcase_likes"."showcase_id") AND ("showcases"."visibility" = 'PUBLIC'::"public"."showcase_visibility")))));



CREATE POLICY "Anyone can view subject counts" ON "public"."subject_counts" FOR SELECT USING (true);



CREATE POLICY "Anyone can view subscription tiers" ON "public"."subscription_tiers" FOR SELECT USING (true);



CREATE POLICY "Anyone can view time settings" ON "public"."time_settings" FOR SELECT USING (true);



CREATE POLICY "Anyone can view user skills" ON "public"."user_skills" FOR SELECT USING (true);



CREATE POLICY "Anyone can view visible reviews" ON "public"."preset_reviews" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Anyone can view weather conditions" ON "public"."weather_conditions" FOR SELECT USING (true);



CREATE POLICY "Applicants can update own applications" ON "public"."applications" FOR UPDATE USING (("applicant_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Authenticated users can create comments" ON "public"."listing_comments" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Authors can update their own reviews" ON "public"."marketplace_reviews" FOR UPDATE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Contributors can create gigs" ON "public"."gigs" FOR INSERT WITH CHECK ((("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('CONTRIBUTOR'::"public"."user_role" = ANY ("users_profile"."role_flags")))))));



CREATE POLICY "Enhanced message sending policy" ON "public"."messages" FOR INSERT WITH CHECK ((("from_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) AND ("to_user_id" IN ( SELECT "users_profile"."id"
   FROM "public"."users_profile")) AND (EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ("users_profile"."subscription_tier" = ANY (ARRAY['FREE'::"public"."subscription_tier", 'PLUS'::"public"."subscription_tier", 'PRO'::"public"."subscription_tier"])))))));



CREATE POLICY "Enhanced message update policy" ON "public"."messages" FOR UPDATE USING ((("to_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("from_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Enhanced message viewing policy with blocks" ON "public"."messages" FOR SELECT USING (((("from_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("to_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))) AND "public"."can_users_message"("from_user_id", "to_user_id")));



CREATE POLICY "Equipment brands are publicly readable" ON "public"."equipment_brands" FOR SELECT USING (true);



CREATE POLICY "Equipment models are publicly readable" ON "public"."equipment_models" FOR SELECT USING (true);



CREATE POLICY "Equipment types are publicly readable" ON "public"."equipment_types" FOR SELECT USING (true);



CREATE POLICY "Gear requests are viewable by everyone" ON "public"."collab_gear_requests" FOR SELECT USING (true);



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



CREATE POLICY "Gig owners can send invitations" ON "public"."gig_invitations" FOR INSERT WITH CHECK ((("inviter_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."gigs"
  WHERE (("gigs"."id" = "gig_invitations"."gig_id") AND ("gigs"."owner_user_id" = "gig_invitations"."inviter_id")))) AND ("inviter_id" <> "invitee_id") AND (EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."id" = "gig_invitations"."invitee_id") AND (("users_profile"."allow_gig_invites" = true) OR ("users_profile"."allow_gig_invites" IS NULL)))))));



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



CREATE POLICY "Invitees can respond to invitations" ON "public"."gig_invitations" FOR UPDATE USING (("invitee_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))) WITH CHECK (("invitee_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Inviters can cancel invitations" ON "public"."gig_invitations" FOR UPDATE USING (("inviter_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))) WITH CHECK (("inviter_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Listing owners can manage their own images" ON "public"."listing_images" USING ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_images"."listing_id") AND ("listings"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Moodboard owners can delete own moodboards" ON "public"."moodboards" FOR DELETE USING (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Moodboard owners can update own moodboards" ON "public"."moodboards" FOR UPDATE USING (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Offerers can withdraw their offers" ON "public"."offers" FOR UPDATE USING (((("auth"."uid"())::"text" = ("offerer_id")::"text") AND ("status" = 'pending'::"text")));



CREATE POLICY "Owners can delete their own listings" ON "public"."listings" FOR DELETE USING ((("auth"."uid"())::"text" = ("owner_id")::"text"));



CREATE POLICY "Owners can insert their own listings" ON "public"."listings" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("owner_id")::"text"));



CREATE POLICY "Owners can update offer status" ON "public"."offers" FOR UPDATE USING ((("auth"."uid"())::"text" = ("owner_id")::"text"));



CREATE POLICY "Owners can update rental request status" ON "public"."rental_requests" FOR UPDATE USING ((("auth"."uid"())::"text" = ("owner_id")::"text"));



CREATE POLICY "Owners can update their own listings" ON "public"."listings" FOR UPDATE USING ((("auth"."uid"())::"text" = ("owner_id")::"text"));



CREATE POLICY "Owners can view their own listings" ON "public"."listings" FOR SELECT USING ((("auth"."uid"())::"text" = ("owner_id")::"text"));



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



CREATE POLICY "Predefined models are publicly readable" ON "public"."equipment_predefined_models" FOR SELECT USING (true);



CREATE POLICY "Project creators can manage gear requests" ON "public"."collab_gear_requests" USING (("project_id" IN ( SELECT "collab_projects"."id"
   FROM "public"."collab_projects"
  WHERE ("collab_projects"."creator_id" IN ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Project creators can manage participants" ON "public"."collab_participants" USING (("project_id" IN ( SELECT "collab_projects"."id"
   FROM "public"."collab_projects"
  WHERE ("collab_projects"."creator_id" IN ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Project creators can manage roles" ON "public"."collab_roles" USING (("project_id" IN ( SELECT "collab_projects"."id"
   FROM "public"."collab_projects"
  WHERE ("collab_projects"."creator_id" IN ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Project roles are viewable by everyone" ON "public"."collab_roles" FOR SELECT USING (true);



CREATE POLICY "Public can read handle redirects" ON "public"."user_handle_redirects" FOR SELECT USING (true);



CREATE POLICY "Public can read timezones" ON "public"."timezones" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can read working time preferences" ON "public"."working_time_preferences" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can view active platform images" ON "public"."platform_images" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can view marketplace preview" ON "public"."presets" FOR SELECT USING ((("is_public" = true) AND ("is_for_sale" = true) AND (("marketplace_status")::"text" = 'approved'::"text")));



CREATE POLICY "Public can view preset visual aids" ON "public"."preset_visual_aids" FOR SELECT USING (true);



CREATE POLICY "Public moodboards are viewable by everyone" ON "public"."moodboards" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public projects are viewable by everyone" ON "public"."collab_projects" FOR SELECT USING ((("visibility" = 'public'::"text") OR ("creator_id" IN ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Request owners can update responses to their requests" ON "public"."request_responses" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."equipment_requests"
  WHERE (("equipment_requests"."id" = "request_responses"."request_id") AND (("equipment_requests"."requester_id")::"text" = ("auth"."uid"())::"text")))));



CREATE POLICY "Requesters can cancel their rental requests" ON "public"."rental_requests" FOR UPDATE USING (((("auth"."uid"())::"text" = ("requester_id")::"text") AND ("status" = 'pending'::"text")));



CREATE POLICY "Reviewers can view own reviews" ON "public"."preset_reviews" FOR SELECT USING (("auth"."uid"() = "reviewer_user_id"));



CREATE POLICY "Sellers can view own listings" ON "public"."preset_marketplace_listings" FOR SELECT USING (("auth"."uid"() = "seller_user_id"));



CREATE POLICY "Service role can insert domain events" ON "public"."domain_events" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can manage browser cache config" ON "public"."browser_cache_config" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage lootbox events" ON "public"."lootbox_events" USING (true);



CREATE POLICY "Service role can manage lootbox packages" ON "public"."lootbox_packages" USING (true);



CREATE POLICY "Service role can manage oauth_health_check" ON "public"."oauth_health_check" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage oauth_logs" ON "public"."oauth_logs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage platform images" ON "public"."platform_images" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage preset visual aids" ON "public"."preset_visual_aids" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can read domain events" ON "public"."domain_events" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Service role full access" ON "public"."notification_preferences" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access" ON "public"."notifications" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access" ON "public"."preset_notifications" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "System can create transactions" ON "public"."credit_transactions" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert logs" ON "public"."age_verification_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert moderation queue items" ON "public"."content_moderation_queue" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can manage credits" ON "public"."user_credits" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage rate limit data" ON "public"."user_rate_limits" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage subscriptions" ON "public"."subscriptions" USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "users_profile"."user_id"))));



CREATE POLICY "System can manage vibe analytics" ON "public"."user_vibe_analytics" USING (true);



CREATE POLICY "Talent can apply to gigs" ON "public"."applications" FOR INSERT WITH CHECK ((("applicant_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('TALENT'::"public"."user_role" = ANY ("users_profile"."role_flags")))))));



CREATE POLICY "Users can comment on showcases" ON "public"."showcase_comments" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."showcases"
  WHERE (("showcases"."id" = "showcase_comments"."showcase_id") AND ("showcases"."visibility" = 'PUBLIC'::"public"."showcase_visibility"))))));



CREATE POLICY "Users can create applications" ON "public"."collab_applications" FOR INSERT WITH CHECK (("applicant_id" IN ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create blocks" ON "public"."user_blocks" FOR INSERT WITH CHECK (("blocker_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create cinematic presets" ON "public"."cinematic_presets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create contact sharing" ON "public"."contact_sharing" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("sharer_id")::"text"));



CREATE POLICY "Users can create conversations" ON "public"."conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create conversations for their requests" ON "public"."request_conversations" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("requester_id")::"text"));



CREATE POLICY "Users can create equipment requests" ON "public"."equipment_requests" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("requester_id")::"text"));



CREATE POLICY "Users can create featured requests for their presets" ON "public"."featured_preset_requests" FOR INSERT WITH CHECK ((("auth"."uid"() = "requester_id") AND (EXISTS ( SELECT 1
   FROM "public"."presets"
  WHERE (("presets"."id" = "featured_preset_requests"."preset_id") AND ("presets"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create gear offers" ON "public"."collab_gear_offers" FOR INSERT WITH CHECK (("offerer_id" IN ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create messages in conversations they're part of" ON "public"."request_conversation_messages" FOR INSERT WITH CHECK (((("auth"."uid"())::"text" = ("sender_id")::"text") AND (EXISTS ( SELECT 1
   FROM "public"."request_conversations" "rc"
  WHERE (("rc"."id" = "request_conversation_messages"."conversation_id") AND ((("rc"."requester_id")::"text" = ("auth"."uid"())::"text") OR (("rc"."responder_id")::"text" = ("auth"."uid"())::"text")))))));



CREATE POLICY "Users can create offers" ON "public"."offers" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("offerer_id")::"text"));



CREATE POLICY "Users can create rental requests" ON "public"."rental_requests" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("requester_id")::"text"));



CREATE POLICY "Users can create responses to requests" ON "public"."request_responses" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("responder_id")::"text"));



CREATE POLICY "Users can create reviews as authors" ON "public"."marketplace_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can create sale orders as buyers" ON "public"."sale_orders" FOR INSERT WITH CHECK (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Users can create their own gallery items" ON "public"."playground_gallery" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own handle redirects" ON "public"."user_handle_redirects" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."id" = "user_handle_redirects"."user_profile_id") AND ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create their own moodboards" ON "public"."moodboards" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can create their own playground projects" ON "public"."playground_projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own presets" ON "public"."presets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own projects" ON "public"."collab_projects" FOR INSERT WITH CHECK (("creator_id" IN ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create treatment versions" ON "public"."treatment_versions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."treatments"
  WHERE (("treatments"."id" = "treatment_versions"."treatment_id") AND ("treatments"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can create treatments" ON "public"."treatments" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can delete listing images" ON "public"."listing_images" FOR DELETE USING ((("auth"."uid"())::"text" IN ( SELECT ("up"."user_id")::"text" AS "user_id"
   FROM ("public"."users_profile" "up"
     JOIN "public"."listings" "l" ON (("l"."owner_id" = "up"."id")))
  WHERE ("l"."id" = "listing_images"."listing_id"))));



CREATE POLICY "Users can delete own comments" ON "public"."showcase_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own media" ON "public"."media" FOR DELETE USING (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their blocks (unblock)" ON "public"."user_blocks" FOR DELETE USING (("blocker_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their own cinematic presets" ON "public"."cinematic_presets" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own clothing sizes" ON "public"."user_clothing_sizes" FOR DELETE USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_clothing_sizes"."profile_id"))));



CREATE POLICY "Users can delete their own comments" ON "public"."listing_comments" FOR DELETE USING (("user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their own equipment" ON "public"."user_equipment" FOR DELETE USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_equipment"."profile_id"))));



CREATE POLICY "Users can delete their own equipment requests" ON "public"."equipment_requests" FOR DELETE USING ((("auth"."uid"())::"text" = ("requester_id")::"text"));



CREATE POLICY "Users can delete their own gallery items" ON "public"."playground_gallery" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own measurements" ON "public"."user_measurements" FOR DELETE USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_measurements"."profile_id"))));



CREATE POLICY "Users can delete their own moodboards" ON "public"."moodboards" FOR DELETE USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can delete their own notification preferences" ON "public"."notification_preferences" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can delete their own playground projects" ON "public"."playground_projects" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own preset images" ON "public"."preset_images" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own preset notifications" ON "public"."preset_notifications" FOR DELETE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can delete their own presets" ON "public"."presets" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own projects" ON "public"."collab_projects" FOR DELETE USING (("creator_id" IN ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their own treatments" ON "public"."treatments" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can insert listing images" ON "public"."listing_images" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" IN ( SELECT ("up"."user_id")::"text" AS "user_id"
   FROM ("public"."users_profile" "up"
     JOIN "public"."listings" "l" ON (("l"."owner_id" = "up"."id")))
  WHERE ("l"."id" = "listing_images"."listing_id"))));



CREATE POLICY "Users can insert messages" ON "public"."messages" FOR INSERT WITH CHECK (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Users can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "recipient_id")));



CREATE POLICY "Users can insert own notification preferences" ON "public"."notification_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."users_profile" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert preset notifications" ON "public"."preset_notifications" FOR INSERT WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can insert their own clothing sizes" ON "public"."user_clothing_sizes" FOR INSERT WITH CHECK (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_clothing_sizes"."profile_id"))));



CREATE POLICY "Users can insert their own equipment" ON "public"."user_equipment" FOR INSERT WITH CHECK (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_equipment"."profile_id"))));



CREATE POLICY "Users can insert their own gallery items" ON "public"."playground_gallery" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own measurements" ON "public"."user_measurements" FOR INSERT WITH CHECK (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_measurements"."profile_id"))));



CREATE POLICY "Users can insert their own notification preferences" ON "public"."notification_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own preset images" ON "public"."preset_images" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own provider preferences" ON "public"."user_provider_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can join conversations" ON "public"."conversation_participants" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can like presets" ON "public"."preset_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can like showcases" ON "public"."showcase_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own availability" ON "public"."user_availability" USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "up"."user_id") AND ("up"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own moodboard items" ON "public"."moodboard_items" USING ((EXISTS ( SELECT 1
   FROM "public"."moodboards"
  WHERE (("moodboards"."id" = "moodboard_items"."moodboard_id") AND ("moodboards"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own skills" ON "public"."user_skills" USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "user_skills"."profile_id") AND ("up"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own typing indicators" ON "public"."typing_indicators" USING (("user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage treatment assets" ON "public"."treatment_assets" USING ((EXISTS ( SELECT 1
   FROM "public"."treatments"
  WHERE (("treatments"."id" = "treatment_assets"."treatment_id") AND ("treatments"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage treatment sharing" ON "public"."treatment_sharing" USING ((EXISTS ( SELECT 1
   FROM "public"."treatments"
  WHERE (("treatments"."id" = "treatment_sharing"."treatment_id") AND ("treatments"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can read lootbox packages" ON "public"."lootbox_packages" FOR SELECT USING (true);



CREATE POLICY "Users can read oauth_health_check" ON "public"."oauth_health_check" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can read own credits" ON "public"."user_credits" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read own oauth_logs" ON "public"."oauth_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own transactions" ON "public"."credit_transactions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read reviews they wrote or received" ON "public"."marketplace_reviews" FOR SELECT USING ((("auth"."uid"() = "author_id") OR ("auth"."uid"() = "subject_user_id")));



CREATE POLICY "Users can read their own domain events" ON "public"."domain_events" FOR SELECT TO "authenticated" USING (((("metadata" ->> 'userId'::"text") = ("auth"."uid"())::"text") OR (("aggregate_id")::"text" IN ( SELECT ("moodboards"."id")::"text" AS "id"
   FROM "public"."moodboards"
  WHERE ("moodboards"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read their own lootbox events" ON "public"."lootbox_events" FOR SELECT USING (("auth"."uid"() = "purchased_by"));



CREATE POLICY "Users can read their own sale orders" ON "public"."sale_orders" FOR SELECT USING ((("auth"."uid"() = "owner_id") OR ("auth"."uid"() = "buyer_id")));



CREATE POLICY "Users can track their own preset usage" ON "public"."preset_usage" FOR INSERT WITH CHECK (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "preset_usage"."user_id"))));



CREATE POLICY "Users can unlike their own likes" ON "public"."preset_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can unlike their own likes" ON "public"."showcase_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update conversations they're part of" ON "public"."request_conversations" FOR UPDATE USING (((("auth"."uid"())::"text" = ("requester_id")::"text") OR (("auth"."uid"())::"text" = ("responder_id")::"text")));



CREATE POLICY "Users can update listing images" ON "public"."listing_images" FOR UPDATE USING ((("auth"."uid"())::"text" IN ( SELECT ("up"."user_id")::"text" AS "user_id"
   FROM ("public"."users_profile" "up"
     JOIN "public"."listings" "l" ON (("l"."owner_id" = "up"."id")))
  WHERE ("l"."id" = "listing_images"."listing_id"))));



CREATE POLICY "Users can update own comments" ON "public"."showcase_comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own credits" ON "public"."user_credits" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own media" ON "public"."media" FOR UPDATE USING (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own notification preferences" ON "public"."notification_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can update own profile" ON "public"."users_profile" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own cinematic presets" ON "public"."cinematic_presets" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own clothing sizes" ON "public"."user_clothing_sizes" FOR UPDATE USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_clothing_sizes"."profile_id"))));



CREATE POLICY "Users can update their own comments" ON "public"."listing_comments" FOR UPDATE USING (("user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own equipment" ON "public"."user_equipment" FOR UPDATE USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_equipment"."profile_id"))));



CREATE POLICY "Users can update their own equipment requests" ON "public"."equipment_requests" FOR UPDATE USING ((("auth"."uid"())::"text" = ("requester_id")::"text"));



CREATE POLICY "Users can update their own gallery items" ON "public"."playground_gallery" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own measurements" ON "public"."user_measurements" FOR UPDATE USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_measurements"."profile_id"))));



CREATE POLICY "Users can update their own messages" ON "public"."messages" FOR UPDATE USING (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Users can update their own moodboards" ON "public"."moodboards" FOR UPDATE USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can update their own notification preferences" ON "public"."notification_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can update their own playground projects" ON "public"."playground_projects" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own preset images" ON "public"."preset_images" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own preset notifications" ON "public"."preset_notifications" FOR UPDATE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can update their own presets" ON "public"."presets" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own projects" ON "public"."collab_projects" FOR UPDATE USING (("creator_id" IN ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own provider preferences" ON "public"."user_provider_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own responses" ON "public"."request_responses" FOR UPDATE USING ((("auth"."uid"())::"text" = ("responder_id")::"text"));



CREATE POLICY "Users can update their own sale orders" ON "public"."sale_orders" FOR UPDATE USING ((("auth"."uid"() = "owner_id") OR ("auth"."uid"() = "buyer_id")));



CREATE POLICY "Users can update their own treatments" ON "public"."treatments" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can upload own media" ON "public"."media" FOR INSERT WITH CHECK (("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view active equipment requests" ON "public"."equipment_requests" FOR SELECT USING (("status" = 'active'::"text"));



CREATE POLICY "Users can view active listings" ON "public"."listings" FOR SELECT USING (("status" = 'active'::"text"));



CREATE POLICY "Users can view all preset likes" ON "public"."preset_likes" FOR SELECT USING (true);



CREATE POLICY "Users can view all profiles" ON "public"."users_profile" FOR SELECT USING (true);



CREATE POLICY "Users can view applications to their projects" ON "public"."collab_applications" FOR SELECT USING ((("project_id" IN ( SELECT "collab_projects"."id"
   FROM "public"."collab_projects"
  WHERE ("collab_projects"."creator_id" IN ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))))) OR ("applicant_id" IN ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view blocks they created" ON "public"."user_blocks" FOR SELECT USING (("blocker_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view contact sharing they are involved in" ON "public"."contact_sharing" FOR SELECT USING (((("auth"."uid"())::"text" = ("sharer_id")::"text") OR (("auth"."uid"())::"text" = ("recipient_id")::"text")));



CREATE POLICY "Users can view conversation participants" ON "public"."conversation_participants" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("conversation_id" IN ( SELECT "conversations"."id"
   FROM "public"."conversations"
  WHERE ("conversations"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view conversations they participate in" ON "public"."conversations" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can view conversations they're part of" ON "public"."request_conversations" FOR SELECT USING (((("auth"."uid"())::"text" = ("requester_id")::"text") OR (("auth"."uid"())::"text" = ("responder_id")::"text")));



CREATE POLICY "Users can view gear offers to their projects" ON "public"."collab_gear_offers" FOR SELECT USING ((("project_id" IN ( SELECT "collab_projects"."id"
   FROM "public"."collab_projects"
  WHERE ("collab_projects"."creator_id" IN ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))))) OR ("offerer_id" IN ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view listing images" ON "public"."listing_images" FOR SELECT USING (true);



CREATE POLICY "Users can view messages in conversations they're part of" ON "public"."request_conversation_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."request_conversations" "rc"
  WHERE (("rc"."id" = "request_conversation_messages"."conversation_id") AND ((("rc"."requester_id")::"text" = ("auth"."uid"())::"text") OR (("rc"."responder_id")::"text" = ("auth"."uid"())::"text"))))));



CREATE POLICY "Users can view messages in their conversations" ON "public"."messages" FOR SELECT USING ((("auth"."uid"() = "from_user_id") OR ("auth"."uid"() = "to_user_id")));



CREATE POLICY "Users can view messages they participate in" ON "public"."messages" FOR SELECT USING ((("auth"."uid"() = "from_user_id") OR ("auth"."uid"() = "to_user_id")));



CREATE POLICY "Users can view moodboard items" ON "public"."moodboard_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moodboards"
  WHERE (("moodboards"."id" = "moodboard_items"."moodboard_id") AND (("moodboards"."is_public" = true) OR ("moodboards"."owner_user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view offers for their listings" ON "public"."offers" FOR SELECT USING (((("auth"."uid"())::"text" = ("owner_id")::"text") OR (("auth"."uid"())::"text" = ("offerer_id")::"text")));



CREATE POLICY "Users can view own logs" ON "public"."age_verification_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own media" ON "public"."media" FOR SELECT USING ((("owner_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("visibility" = 'PUBLIC'::"public"."showcase_visibility")));



CREATE POLICY "Users can view own notification preferences" ON "public"."notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can view own purchases" ON "public"."user_credit_purchases" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own subscription" ON "public"."subscriptions" FOR SELECT USING (("user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own tasks" ON "public"."enhancement_tasks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view participants in their projects" ON "public"."collab_participants" FOR SELECT USING ((("project_id" IN ( SELECT "collab_projects"."id"
   FROM "public"."collab_projects"
  WHERE ("collab_projects"."visibility" = 'public'::"text"))) OR ("project_id" IN ( SELECT "collab_projects"."id"
   FROM "public"."collab_projects"
  WHERE ("collab_projects"."creator_id" IN ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))))) OR ("user_id" IN ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view public cinematic presets" ON "public"."cinematic_presets" FOR SELECT USING ((("is_public" = true) AND ("is_active" = true)));



CREATE POLICY "Users can view public profiles" ON "public"."users_profile" FOR SELECT USING (true);



CREATE POLICY "Users can view public treatments" ON "public"."treatments" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Users can view purchased preset details" ON "public"."presets" FOR SELECT USING ((("is_public" = true) AND (("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."preset_purchases"
  WHERE (("preset_purchases"."preset_id" = "presets"."id") AND ("preset_purchases"."buyer_user_id" = "auth"."uid"())))))));



CREATE POLICY "Users can view rental requests for their listings" ON "public"."rental_requests" FOR SELECT USING (((("auth"."uid"())::"text" = ("owner_id")::"text") OR (("auth"."uid"())::"text" = ("requester_id")::"text")));



CREATE POLICY "Users can view responses to their requests" ON "public"."request_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."equipment_requests"
  WHERE (("equipment_requests"."id" = "request_responses"."request_id") AND (("equipment_requests"."requester_id")::"text" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can view their gig invitations" ON "public"."gig_invitations" FOR SELECT USING ((("inviter_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("invitee_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own application attachments" ON "public"."application_attachments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."applications" "a"
     JOIN "public"."users_profile" "up" ON (("a"."applicant_user_id" = "up"."id")))
  WHERE (("a"."id" = "application_attachments"."application_id") AND ("up"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own cinematic presets" ON "public"."cinematic_presets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own clothing sizes" ON "public"."user_clothing_sizes" FOR SELECT USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_clothing_sizes"."profile_id"))));



CREATE POLICY "Users can view their own credits" ON "public"."user_credits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own equipment" ON "public"."user_equipment" FOR SELECT USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_equipment"."profile_id"))));



CREATE POLICY "Users can view their own equipment requests" ON "public"."equipment_requests" USING ((("auth"."uid"())::"text" = ("requester_id")::"text"));



CREATE POLICY "Users can view their own featured requests" ON "public"."featured_preset_requests" FOR SELECT USING (("auth"."uid"() = "requester_id"));



CREATE POLICY "Users can view their own gallery items" ON "public"."playground_gallery" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own measurements" ON "public"."user_measurements" FOR SELECT USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "user_measurements"."profile_id"))));



CREATE POLICY "Users can view their own moodboards" ON "public"."moodboards" FOR SELECT USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can view their own notification preferences" ON "public"."notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can view their own playground projects" ON "public"."playground_projects" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own preset images" ON "public"."preset_images" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own preset notifications" ON "public"."preset_notifications" FOR SELECT USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can view their own preset usage" ON "public"."preset_usage" FOR SELECT USING (("auth"."uid"() = ( SELECT "users_profile"."user_id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."id" = "preset_usage"."user_id"))));



CREATE POLICY "Users can view their own presets" ON "public"."presets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own provider preferences" ON "public"."user_provider_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own responses" ON "public"."request_responses" FOR SELECT USING ((("auth"."uid"())::"text" = ("responder_id")::"text"));



CREATE POLICY "Users can view their own transactions" ON "public"."credit_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own treatments" ON "public"."treatments" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can view their own vibe analytics" ON "public"."user_vibe_analytics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their purchases" ON "public"."preset_purchases" FOR SELECT USING ((("auth"."uid"() = "buyer_user_id") OR ("auth"."uid"() = "seller_user_id")));



CREATE POLICY "Users can view their rate limit data" ON "public"."user_rate_limits" FOR SELECT USING (("user_profile_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their treatment analytics" ON "public"."treatment_analytics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."treatments"
  WHERE (("treatments"."id" = "treatment_analytics"."treatment_id") AND ("treatments"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can view treatment assets" ON "public"."treatment_assets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."treatments"
  WHERE (("treatments"."id" = "treatment_assets"."treatment_id") AND (("treatments"."owner_id" = "auth"."uid"()) OR ("treatments"."is_public" = true))))));



CREATE POLICY "Users can view treatment sharing" ON "public"."treatment_sharing" FOR SELECT USING ((("shared_with_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."treatments"
  WHERE (("treatments"."id" = "treatment_sharing"."treatment_id") AND ("treatments"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view treatment versions" ON "public"."treatment_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."treatments"
  WHERE (("treatments"."id" = "treatment_versions"."treatment_id") AND (("treatments"."owner_id" = "auth"."uid"()) OR ("treatments"."is_public" = true))))));



CREATE POLICY "Users can view typing indicators for their conversations" ON "public"."typing_indicators" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view typing indicators in their conversations" ON "public"."typing_indicators" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."messages" "m"
  WHERE (("m"."conversation_id" = "typing_indicators"."conversation_id") AND (("m"."from_user_id" = ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("m"."to_user_id" = ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Users can view typing indicators with block check" ON "public"."typing_indicators" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."messages" "m"
  WHERE (("m"."conversation_id" = "typing_indicators"."conversation_id") AND (("m"."from_user_id" = ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("m"."to_user_id" = ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"())))) AND "public"."can_users_message"("m"."from_user_id", "m"."to_user_id")))));



CREATE POLICY "Users can view verified cinematic preset images" ON "public"."preset_images" FOR SELECT USING ((("is_verified" = true) AND (EXISTS ( SELECT 1
   FROM "public"."cinematic_presets"
  WHERE (("cinematic_presets"."id" = "preset_images"."preset_id") AND ("cinematic_presets"."is_public" = true))))));



CREATE POLICY "Users can view verified preset images" ON "public"."preset_images" FOR SELECT USING ((("is_verified" = true) AND (EXISTS ( SELECT 1
   FROM "public"."presets"
  WHERE (("presets"."id" = "preset_images"."preset_id") AND ("presets"."is_public" = true))))));



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


ALTER TABLE "public"."application_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."application_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."application_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."application_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."aspect_ratios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."browser_cache_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."camera_angles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."camera_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cinematic_presets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collab_applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_applications_insert_as_applicant" ON "public"."collab_applications" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "collab_applications"."applicant_id") AND ("up"."user_id" = "auth"."uid"())))));



CREATE POLICY "collab_applications_read_own" ON "public"."collab_applications" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "collab_applications"."applicant_id") AND ("up"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."collab_projects" "cp"
     JOIN "public"."users_profile" "up" ON (("cp"."creator_id" = "up"."id")))
  WHERE (("cp"."id" = "collab_applications"."project_id") AND ("up"."user_id" = "auth"."uid"()))))));



CREATE POLICY "collab_applications_update_own" ON "public"."collab_applications" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "collab_applications"."applicant_id") AND ("up"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."collab_projects" "cp"
     JOIN "public"."users_profile" "up" ON (("cp"."creator_id" = "up"."id")))
  WHERE (("cp"."id" = "collab_applications"."project_id") AND ("up"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."collab_gear_offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_gear_offers_insert_as_offerer" ON "public"."collab_gear_offers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "collab_gear_offers"."offerer_id") AND ("up"."user_id" = "auth"."uid"())))));



CREATE POLICY "collab_gear_offers_read_own" ON "public"."collab_gear_offers" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "collab_gear_offers"."offerer_id") AND ("up"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."collab_projects" "cp"
     JOIN "public"."users_profile" "up" ON (("cp"."creator_id" = "up"."id")))
  WHERE (("cp"."id" = "collab_gear_offers"."project_id") AND ("up"."user_id" = "auth"."uid"()))))));



CREATE POLICY "collab_gear_offers_update_own" ON "public"."collab_gear_offers" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "collab_gear_offers"."offerer_id") AND ("up"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."collab_projects" "cp"
     JOIN "public"."users_profile" "up" ON (("cp"."creator_id" = "up"."id")))
  WHERE (("cp"."id" = "collab_gear_offers"."project_id") AND ("up"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."collab_gear_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_gear_requests_manage_own" ON "public"."collab_gear_requests" USING ((EXISTS ( SELECT 1
   FROM ("public"."collab_projects" "cp"
     JOIN "public"."users_profile" "up" ON (("cp"."creator_id" = "up"."id")))
  WHERE (("cp"."id" = "collab_gear_requests"."project_id") AND ("up"."user_id" = "auth"."uid"())))));



CREATE POLICY "collab_gear_requests_read" ON "public"."collab_gear_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_gear_requests"."project_id") AND (("cp"."visibility" = 'public'::"text") OR (EXISTS ( SELECT 1
           FROM "public"."users_profile" "up"
          WHERE (("up"."id" = "cp"."creator_id") AND ("up"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
           FROM ("public"."collab_participants" "cpp"
             JOIN "public"."users_profile" "up" ON (("cpp"."user_id" = "up"."id")))
          WHERE (("cpp"."project_id" = "cp"."id") AND ("up"."user_id" = "auth"."uid"())))))))));



ALTER TABLE "public"."collab_invitations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_invitations_delete_own" ON "public"."collab_invitations" FOR DELETE USING ((("auth"."uid"() = "inviter_id") OR (EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_invitations"."project_id") AND ("cp"."creator_id" = "auth"."uid"()))))));



CREATE POLICY "collab_invitations_insert_own" ON "public"."collab_invitations" FOR INSERT WITH CHECK ((("auth"."uid"() = "inviter_id") AND (EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_invitations"."project_id") AND (("cp"."creator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."collab_participants" "cpp"
          WHERE (("cpp"."project_id" = "cp"."id") AND ("cpp"."user_id" = "auth"."uid"()) AND ("cpp"."role_type" = 'creator'::"text"))))))))));



CREATE POLICY "collab_invitations_read_own" ON "public"."collab_invitations" FOR SELECT USING ((("auth"."uid"() = "inviter_id") OR ("auth"."uid"() = "invitee_id") OR (EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_invitations"."project_id") AND ("cp"."creator_id" = "auth"."uid"()))))));



CREATE POLICY "collab_invitations_update_own" ON "public"."collab_invitations" FOR UPDATE USING ((("auth"."uid"() = "inviter_id") OR ("auth"."uid"() = "invitee_id") OR (EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_invitations"."project_id") AND ("cp"."creator_id" = "auth"."uid"()))))));



ALTER TABLE "public"."collab_participants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_participants_manage_own" ON "public"."collab_participants" USING ((EXISTS ( SELECT 1
   FROM ("public"."collab_projects" "cp"
     JOIN "public"."users_profile" "up" ON (("cp"."creator_id" = "up"."id")))
  WHERE (("cp"."id" = "collab_participants"."project_id") AND ("up"."user_id" = "auth"."uid"())))));



CREATE POLICY "collab_participants_read_own" ON "public"."collab_participants" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "up"."user_id") AND ("up"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."collab_projects" "cp"
     JOIN "public"."users_profile" "up" ON (("cp"."creator_id" = "up"."id")))
  WHERE (("cp"."id" = "collab_participants"."project_id") AND ("up"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."collab_projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_projects_delete_own" ON "public"."collab_projects" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "collab_projects"."creator_id") AND ("up"."user_id" = "auth"."uid"())))));



CREATE POLICY "collab_projects_insert_own" ON "public"."collab_projects" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "collab_projects"."creator_id") AND ("up"."user_id" = "auth"."uid"())))));



CREATE POLICY "collab_projects_read" ON "public"."collab_projects" FOR SELECT USING ((("visibility" = 'public'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "collab_projects"."creator_id") AND ("up"."user_id" = "auth"."uid"()))))));



CREATE POLICY "collab_projects_update_own" ON "public"."collab_projects" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile" "up"
  WHERE (("up"."id" = "collab_projects"."creator_id") AND ("up"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."collab_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collab_roles_manage_own" ON "public"."collab_roles" USING ((EXISTS ( SELECT 1
   FROM ("public"."collab_projects" "cp"
     JOIN "public"."users_profile" "up" ON (("cp"."creator_id" = "up"."id")))
  WHERE (("cp"."id" = "collab_roles"."project_id") AND ("up"."user_id" = "auth"."uid"())))));



CREATE POLICY "collab_roles_read" ON "public"."collab_roles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."collab_projects" "cp"
  WHERE (("cp"."id" = "collab_roles"."project_id") AND (("cp"."visibility" = 'public'::"text") OR (EXISTS ( SELECT 1
           FROM "public"."users_profile" "up"
          WHERE (("up"."id" = "cp"."creator_id") AND ("up"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
           FROM ("public"."collab_participants" "cpp"
             JOIN "public"."users_profile" "up" ON (("cpp"."user_id" = "up"."id")))
          WHERE (("cpp"."project_id" = "cp"."id") AND ("up"."user_id" = "auth"."uid"())))))))));



ALTER TABLE "public"."color_palettes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."composition_techniques" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_sharing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_moderation_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."depth_of_field" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."director_styles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."domain_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "email_logs_admin_access" ON "public"."email_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."users_profile"
  WHERE (("users_profile"."user_id" = "auth"."uid"()) AND ('ADMIN'::"public"."user_role" = ANY ("users_profile"."role_flags"))))));



ALTER TABLE "public"."enhancement_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment_brands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment_models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment_predefined_models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."era_emulations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eye_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."featured_preset_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."foreground_elements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gig_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gigs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."languages_master" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lens_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lighting_styles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."location_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lootbox_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lootbox_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_marketplace_insert" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (("context_type" = 'marketplace'::"text") AND ("listing_id" IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "messages"."listing_id") AND ("listings"."owner_id" = ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"())))))) OR (EXISTS ( SELECT 1
   FROM "public"."offers"
  WHERE (("offers"."listing_id" = "messages"."listing_id") AND ("offers"."status" = 'accepted'::"text") AND (("offers"."offerer_id" = ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("offers"."owner_id" = ( SELECT "users_profile"."id"
           FROM "public"."users_profile"
          WHERE ("users_profile"."user_id" = "auth"."uid"())))))))))));



CREATE POLICY "messages_marketplace_read" ON "public"."messages" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR (("context_type" = 'marketplace'::"text") AND (("from_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"()))) OR ("to_user_id" = ( SELECT "users_profile"."id"
   FROM "public"."users_profile"
  WHERE ("users_profile"."user_id" = "auth"."uid"())))))));



ALTER TABLE "public"."moderation_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moodboard_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moodboards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."oauth_health_check" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."oauth_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "offers_insert_as_sender" ON "public"."offers" FOR INSERT WITH CHECK (("auth"."uid"() = "offerer_id"));



COMMENT ON POLICY "offers_insert_as_sender" ON "public"."offers" IS 'Users can create offers as the offerer';



CREATE POLICY "offers_read_own" ON "public"."offers" FOR SELECT USING ((("auth"."uid"() = "offerer_id") OR ("auth"."uid"() = "owner_id")));



COMMENT ON POLICY "offers_read_own" ON "public"."offers" IS 'Users can read their own offers';



CREATE POLICY "offers_update_as_owner" ON "public"."offers" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



COMMENT ON POLICY "offers_update_as_owner" ON "public"."offers" IS 'Listing owners can update offers (accept/decline)';



ALTER TABLE "public"."platform_credit_consumption" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."platform_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playground_gallery" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playground_projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_availability_statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_body_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_clothing_size_systems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_clothing_sizes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_equipment_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_ethnicities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_experience_levels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_eye_colors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_gear_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "predefined_gear_categories_read_all" ON "public"."predefined_gear_categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "predefined_gear_categories_read_authenticated" ON "public"."predefined_gear_categories" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."predefined_gender_identities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_hair_colors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_hair_lengths" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_nationalities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_professional_skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "predefined_roles_read_all" ON "public"."predefined_roles" FOR SELECT USING (("is_active" = true));



CREATE POLICY "predefined_roles_read_authenticated" ON "public"."predefined_roles" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."predefined_shoe_size_systems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_shoe_sizes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_skills" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "predefined_skills_read_all" ON "public"."predefined_skills" FOR SELECT USING (("is_active" = true));



CREATE POLICY "predefined_skills_read_authenticated" ON "public"."predefined_skills" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."predefined_skin_tones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predefined_talent_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "predefined_talent_categories_read_all" ON "public"."predefined_talent_categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "predefined_talent_categories_read_authenticated" ON "public"."predefined_talent_categories" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."preset_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preset_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preset_marketplace_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preset_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preset_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preset_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preset_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preset_visual_aids" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."presets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_performance" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_view_badges" ON "public"."verification_badges" FOR SELECT USING (true);



ALTER TABLE "public"."rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."refund_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "refund_audit_log_admin_all" ON "public"."refund_audit_log" TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "refund_audit_log_own_read" ON "public"."refund_audit_log" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."refund_policies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "refund_policies_admin_all" ON "public"."refund_policies" TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



ALTER TABLE "public"."rental_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rental_orders_insert_as_renter" ON "public"."rental_orders" FOR INSERT WITH CHECK (("auth"."uid"() = "renter_id"));



CREATE POLICY "rental_orders_read_own" ON "public"."rental_orders" FOR SELECT USING ((("auth"."uid"() = "owner_id") OR ("auth"."uid"() = "renter_id")));



CREATE POLICY "rental_orders_update_own" ON "public"."rental_orders" FOR UPDATE USING ((("auth"."uid"() = "owner_id") OR ("auth"."uid"() = "renter_id")));



ALTER TABLE "public"."rental_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."request_conversation_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."request_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."request_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sale_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scene_moods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shot_sizes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."showcase_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."showcase_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."showcases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."specializations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subject_counts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "system_insert_logs" ON "public"."age_verification_logs" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."system_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."time_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."timezones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treatment_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treatment_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treatment_sharing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treatment_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treatments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."typing_indicators" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_clothing_sizes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_create_reports" ON "public"."reports" FOR INSERT WITH CHECK (("reporter_user_id" = "auth"."uid"()));



CREATE POLICY "user_create_verification_requests" ON "public"."verification_requests" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_credit_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_credits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_equipment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_handle_redirects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_measurements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_provider_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_vibe_analytics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_view_own_actions" ON "public"."moderation_actions" FOR SELECT USING (("target_user_id" = "auth"."uid"()));



CREATE POLICY "user_view_own_logs" ON "public"."age_verification_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_view_own_reports" ON "public"."reports" FOR SELECT USING (("reporter_user_id" = "auth"."uid"()));



CREATE POLICY "user_view_own_verification_requests" ON "public"."verification_requests" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_view_own_violations" ON "public"."user_violations" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_violations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users_profile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vibes_master" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."violation_thresholds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weather_conditions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."working_time_preferences" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_equipment_provider_as_participant"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_equipment_provider_as_participant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_equipment_provider_as_participant"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_invited_user_as_participant"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_invited_user_as_participant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_invited_user_as_participant"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_project_creator_as_participant"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_project_creator_as_participant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_project_creator_as_participant"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_purchased_credits"("p_user_id" "uuid", "p_credits" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_purchased_credits"("p_user_id" "uuid", "p_credits" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_purchased_credits"("p_user_id" "uuid", "p_credits" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_user_violation"("p_user_id" "uuid", "p_violation_type" "text", "p_severity" "text", "p_description" "text", "p_report_id" "uuid", "p_evidence_urls" "text"[], "p_expires_in_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_user_violation"("p_user_id" "uuid", "p_violation_type" "text", "p_severity" "text", "p_description" "text", "p_report_id" "uuid", "p_evidence_urls" "text"[], "p_expires_in_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_user_violation"("p_user_id" "uuid", "p_violation_type" "text", "p_severity" "text", "p_description" "text", "p_report_id" "uuid", "p_evidence_urls" "text"[], "p_expires_in_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_verified_preset_sample"("preset_uuid" "uuid", "result_image_url_param" "text", "prompt_param" "text", "generation_id_param" "text", "source_image_url_param" "text", "source_image_hash_param" "text", "result_image_hash_param" "text", "generation_provider_param" "text", "generation_model_param" "text", "generation_credits_param" integer, "negative_prompt_param" "text", "generation_settings_param" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_verified_preset_sample"("preset_uuid" "uuid", "result_image_url_param" "text", "prompt_param" "text", "generation_id_param" "text", "source_image_url_param" "text", "source_image_hash_param" "text", "result_image_hash_param" "text", "generation_provider_param" "text", "generation_model_param" "text", "generation_credits_param" integer, "negative_prompt_param" "text", "generation_settings_param" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_verified_preset_sample"("preset_uuid" "uuid", "result_image_url_param" "text", "prompt_param" "text", "generation_id_param" "text", "source_image_url_param" "text", "source_image_hash_param" "text", "result_image_hash_param" "text", "generation_provider_param" "text", "generation_model_param" "text", "generation_credits_param" integer, "negative_prompt_param" "text", "generation_settings_param" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_moderation_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_user_id" "uuid", "p_reason" "text", "p_duration_hours" integer, "p_report_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_moderation_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_user_id" "uuid", "p_reason" "text", "p_duration_hours" integer, "p_report_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_moderation_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_user_id" "uuid", "p_reason" "text", "p_duration_hours" integer, "p_report_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_progressive_enforcement"("p_user_id" "uuid", "p_admin_id" "uuid", "p_violation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_progressive_enforcement"("p_user_id" "uuid", "p_admin_id" "uuid", "p_violation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_progressive_enforcement"("p_user_id" "uuid", "p_admin_id" "uuid", "p_violation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_featured_preset_request"("request_id" "uuid", "admin_user_id" "uuid", "admin_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_featured_preset_request"("request_id" "uuid", "admin_user_id" "uuid", "admin_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_featured_preset_request"("request_id" "uuid", "admin_user_id" "uuid", "admin_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_review_notes" "text", "p_badge_expires_in_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."approve_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_review_notes" "text", "p_badge_expires_in_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_review_notes" "text", "p_badge_expires_in_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_escalate_report_priority"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_escalate_report_priority"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_escalate_report_priority"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_increment_preset_usage_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_increment_preset_usage_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_increment_preset_usage_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_refund_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_refund_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_refund_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_update_profile_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_update_profile_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_update_profile_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."block_user"("blocked_profile_id" "uuid", "block_reason" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."block_user"("blocked_profile_id" "uuid", "block_reason" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."block_user"("blocked_profile_id" "uuid", "block_reason" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_age"("birth_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_age"("birth_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_age"("birth_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_collaboration_skill_match"("p_profile_id" "uuid", "p_role_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_collaboration_skill_match"("p_profile_id" "uuid", "p_role_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_collaboration_skill_match"("p_profile_id" "uuid", "p_role_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_complete_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid", "p_physical_requirements" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_complete_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid", "p_physical_requirements" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_complete_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid", "p_physical_requirements" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_enhanced_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_enhanced_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_enhanced_collaboration_compatibility"("p_profile_id" "uuid", "p_role_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_enhanced_compatibility_with_skills"("p_profile_id" "uuid", "p_gig_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_enhanced_compatibility_with_skills"("p_profile_id" "uuid", "p_gig_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_enhanced_compatibility_with_skills"("p_profile_id" "uuid", "p_gig_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_gig_compatibility_with_preferences"("p_profile_id" "uuid", "p_gig_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_gig_compatibility_with_preferences"("p_profile_id" "uuid", "p_gig_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_gig_compatibility_with_preferences"("p_profile_id" "uuid", "p_gig_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_physical_attribute_match"("p_profile_id" "uuid", "p_gig_requirements" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_physical_attribute_match"("p_profile_id" "uuid", "p_gig_requirements" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_physical_attribute_match"("p_profile_id" "uuid", "p_gig_requirements" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_profile_completion"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_profile_completion"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_profile_completion"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_social_handle"("handle" "text", "platform" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_social_handle"("handle" "text", "platform" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_social_handle"("handle" "text", "platform" "text") TO "service_role";



GRANT ALL ON TABLE "public"."users_profile" TO "anon";
GRANT ALL ON TABLE "public"."users_profile" TO "authenticated";
GRANT ALL ON TABLE "public"."users_profile" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_profile_completion"("profile_record" "public"."users_profile") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_profile_completion"("profile_record" "public"."users_profile") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_profile_completion"("profile_record" "public"."users_profile") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_skill_experience_score"("p_profile_id" "uuid", "p_required_skills" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_skill_experience_score"("p_profile_id" "uuid", "p_required_skills" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_skill_experience_score"("p_profile_id" "uuid", "p_required_skills" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_user_risk_score"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_user_risk_score"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_user_risk_score"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."call_email_api"("endpoint" "text", "payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."call_email_api"("endpoint" "text", "payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."call_email_api"("endpoint" "text", "payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_conversation"("conversation_uuid" "uuid", "requesting_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_conversation"("conversation_uuid" "uuid", "requesting_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_conversation"("conversation_uuid" "uuid", "requesting_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_submit_generation_as_sample"("preset_uuid" "uuid", "generation_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_submit_generation_as_sample"("preset_uuid" "uuid", "generation_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_submit_generation_as_sample"("preset_uuid" "uuid", "generation_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_users_message"("sender_profile_id" "uuid", "recipient_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_users_message"("sender_profile_id" "uuid", "recipient_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_users_message"("sender_profile_id" "uuid", "recipient_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_duplicate_request"("p_user_id" "uuid", "p_listing_id" "uuid", "p_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_duplicate_request"("p_user_id" "uuid", "p_listing_id" "uuid", "p_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_duplicate_request"("p_user_id" "uuid", "p_listing_id" "uuid", "p_table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_message_rate_limit"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_message_rate_limit"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_message_rate_limit"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_payments_table_exists"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_payments_table_exists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_payments_table_exists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_table_name" "text", "p_limit_count" integer, "p_limit_hours" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_table_name" "text", "p_limit_count" integer, "p_limit_hours" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_table_name" "text", "p_limit_count" integer, "p_limit_hours" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_refund_eligibility"("p_task_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_refund_eligibility"("p_task_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_refund_eligibility"("p_task_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_connection"("sender_user_id" "uuid", "recipient_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_connection"("sender_user_id" "uuid", "recipient_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_connection"("sender_user_id" "uuid", "recipient_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_rate_limit"("checking_user_profile_id" "uuid", "resource" character varying, "action_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_rate_limit"("checking_user_profile_id" "uuid", "resource" character varying, "action_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_rate_limit"("checking_user_profile_id" "uuid", "resource" character varying, "action_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_domain_events"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_domain_events"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_domain_events"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_profile_photos"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_profile_photos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_profile_photos"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_rate_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_rate_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_rate_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_typing_indicators"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_typing_indicators"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_typing_indicators"() TO "service_role";



GRANT ALL ON FUNCTION "public"."consume_platform_credits"("p_provider" character varying, "p_credits" integer, "p_cost" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."consume_platform_credits"("p_provider" character varying, "p_credits" integer, "p_cost" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."consume_platform_credits"("p_provider" character varying, "p_credits" integer, "p_cost" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."consume_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_enhancement_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_user_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_user_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_user_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_user_settings_safe"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_user_settings_safe"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_user_settings_safe"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_handle_redirect"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_handle_redirect"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_handle_redirect"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_treatment_version"("p_treatment_id" "uuid", "p_change_summary" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_treatment_version"("p_treatment_id" "uuid", "p_change_summary" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_treatment_version"("p_treatment_id" "uuid", "p_change_summary" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_profile_minimal"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profile_minimal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profile_minimal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_settings_system"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_settings_system"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_settings_system"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_user_skill"("p_profile_id" "uuid", "p_skill_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_skill"("p_profile_id" "uuid", "p_skill_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_skill"("p_profile_id" "uuid", "p_skill_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."diagnose_oauth_system"() TO "anon";
GRANT ALL ON FUNCTION "public"."diagnose_oauth_system"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."diagnose_oauth_system"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_equipment_requests"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_equipment_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_equipment_requests"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_old_gig_invitations"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_old_gig_invitations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_old_gig_invitations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_old_invitations"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_old_invitations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_old_invitations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_old_violations"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_old_violations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_old_violations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_suspensions"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_suspensions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_suspensions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_verifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_verifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_verifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."find_compatible_gigs_for_user"("p_profile_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_compatible_gigs_for_user"("p_profile_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_compatible_gigs_for_user"("p_profile_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_demographic_compatible_users"("p_user_id" "uuid", "p_filters" "jsonb", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_demographic_compatible_users"("p_user_id" "uuid", "p_filters" "jsonb", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_demographic_compatible_users"("p_user_id" "uuid", "p_filters" "jsonb", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_users_by_vibe_similarity"("target_user_id" "uuid", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_users_by_vibe_similarity"("target_user_id" "uuid", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_users_by_vibe_similarity"("target_user_id" "uuid", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."format_gig_location"("p_city" "text", "p_country" "text", "p_location_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."format_gig_location"("p_city" "text", "p_country" "text", "p_location_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."format_gig_location"("p_city" "text", "p_country" "text", "p_location_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_conversation_id"("gig_uuid" "uuid", "user1_uuid" "uuid", "user2_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invitation_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invitation_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invitation_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_profile_photo_path"("user_id" "uuid", "file_extension" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_profile_photo_path"("user_id" "uuid", "file_extension" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_profile_photo_path"("user_id" "uuid", "file_extension" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_average_resolution_time"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_average_resolution_time"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_average_resolution_time"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_average_severity"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_average_severity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_average_severity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_blocked_users"("requesting_user_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_blocked_users"("requesting_user_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_blocked_users"("requesting_user_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_collaboration_role_recommendations"("p_role_id" "uuid", "p_min_compatibility" numeric, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_collaboration_role_recommendations"("p_role_id" "uuid", "p_min_compatibility" numeric, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_collaboration_role_recommendations"("p_role_id" "uuid", "p_min_compatibility" numeric, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversation_participants"("conversation_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversation_participants"("conversation_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversation_participants"("conversation_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_gear_categories_by_category"("gear_category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_gear_categories_by_category"("gear_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_gear_categories_by_category"("gear_category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_oauth_metrics"("hours_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_oauth_metrics"("hours_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_oauth_metrics"("hours_back" integer) TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_notification_preferences"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_notification_preferences"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_notification_preferences"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_preset_by_id"("preset_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_preset_by_id"("preset_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_preset_by_id"("preset_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_preset_usage_stats"("preset_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_preset_usage_stats"("preset_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_preset_usage_stats"("preset_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_oauth_errors"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_oauth_errors"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_oauth_errors"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_request_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_request_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_request_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_roles_by_category"("role_category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_roles_by_category"("role_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_roles_by_category"("role_category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shared_contacts"("p_conversation_id" "uuid", "p_conversation_type" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_shared_contacts"("p_conversation_id" "uuid", "p_conversation_type" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shared_contacts"("p_conversation_id" "uuid", "p_conversation_type" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_skills_by_category"("skill_category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_skills_by_category"("skill_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_skills_by_category"("skill_category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_violation_flags"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_violation_flags"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_violation_flags"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_treatment_with_versions"("p_treatment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_treatment_with_versions"("p_treatment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_treatment_with_versions"("p_treatment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_trending_presets_by_usage"("days_back" integer, "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_trending_presets_by_usage"("days_back" integer, "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_trending_presets_by_usage"("days_back" integer, "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_average_rating"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_average_rating"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_average_rating"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_invitation_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_invitation_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_invitation_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_notifications"("limit_count" integer, "offset_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_notifications"("limit_count" integer, "offset_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_notifications"("limit_count" integer, "offset_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_oauth_journey"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_oauth_journey"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_oauth_journey"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_preferred_provider"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_preferred_provider"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_preferred_provider"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_profile_image_url"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_profile_image_url"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_profile_image_url"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_rate_limit_status"("requesting_user_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_rate_limit_status"("requesting_user_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_rate_limit_status"("requesting_user_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_rating_info"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_rating_info"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_rating_info"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_settings"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_settings"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_settings"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_settings_safe"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_settings_safe"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_settings_safe"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_skills"("p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_skills"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_skills"("p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_top_skills"("p_profile_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_top_skills"("p_profile_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_top_skills"("p_profile_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_violation_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_violation_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_violation_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_violation_summary"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_violation_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_violation_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_blocking_user"("blocked_user_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_blocking_user"("blocked_user_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_blocking_user"("blocked_user_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."gig_is_looking_for"("gig_types" "text"[], "search_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."gig_is_looking_for"("gig_types" "text"[], "search_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gig_is_looking_for"("gig_types" "text"[], "search_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_gig_invitation_acceptance"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_gig_invitation_acceptance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_gig_invitation_acceptance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_simple"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_simple"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_simple"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_preset_usage"("preset_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_preset_usage"("preset_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_preset_usage"("preset_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_preset_usage"("preset_id" "uuid", "preset_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_preset_usage"("preset_id" "uuid", "preset_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_preset_usage"("preset_id" "uuid", "preset_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_spam_message"("content" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_spam_message"("content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_spam_message"("content" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_blocked"("blocker_profile_id" "uuid", "blocked_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_blocked"("blocker_profile_id" "uuid", "blocked_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_blocked"("blocker_profile_id" "uuid", "blocked_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_suspended_or_banned"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_suspended_or_banned"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_suspended_or_banned"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_provider_performance"("p_provider" character varying, "p_success" boolean, "p_processing_time_ms" integer, "p_quality_score" numeric, "p_cost" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."log_provider_performance"("p_provider" character varying, "p_success" boolean, "p_processing_time_ms" integer, "p_quality_score" numeric, "p_cost" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_provider_performance"("p_provider" character varying, "p_success" boolean, "p_processing_time_ms" integer, "p_quality_score" numeric, "p_cost" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "user_id" "uuid", "details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "user_id" "uuid", "details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "user_id" "uuid", "details" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_conversation_delivered"("conversation_uuid" "uuid", "user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_conversation_delivered"("conversation_uuid" "uuid", "user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_conversation_delivered"("conversation_uuid" "uuid", "user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_id" "uuid", "user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_id" "uuid", "user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_id" "uuid", "user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_specializations_to_user_skills"() TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_specializations_to_user_skills"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_specializations_to_user_skills"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_application_status_changed"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_application_status_changed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_application_status_changed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_collab_invitation_response"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_collab_invitation_response"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_collab_invitation_response"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_collab_invitation_sent"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_collab_invitation_sent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_collab_invitation_sent"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_credits_added"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_credits_added"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_credits_added"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_gig_application_received"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_gig_application_received"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_gig_application_received"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_gig_invitation_response"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_gig_invitation_response"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_gig_invitation_response"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_gig_invitation_sent"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_gig_invitation_sent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_gig_invitation_sent"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_listing_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_listing_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_listing_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_low_credit"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_low_credit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_low_credit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_preset_liked"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_preset_liked"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_preset_liked"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_preset_milestone"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_preset_milestone"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_preset_milestone"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_preset_purchased"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_preset_purchased"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_preset_purchased"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_preset_review"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_preset_review"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_preset_review"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_preset_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_preset_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_preset_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_showcase_comment"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_showcase_comment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_showcase_comment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_showcase_liked"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_showcase_liked"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_showcase_liked"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_verification_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_verification_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_verification_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_credit_refund"("p_task_id" "uuid", "p_user_id" "uuid", "p_credits" integer, "p_reason" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."process_credit_refund"("p_task_id" "uuid", "p_user_id" "uuid", "p_credits" integer, "p_reason" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_credit_refund"("p_task_id" "uuid", "p_user_id" "uuid", "p_credits" integer, "p_reason" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."purchase_preset_with_credits"("p_preset_id" "uuid", "p_buyer_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."purchase_preset_with_credits"("p_preset_id" "uuid", "p_buyer_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."purchase_preset_with_credits"("p_preset_id" "uuid", "p_buyer_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."recommend_vibes_for_user"("target_user_id" "uuid", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."recommend_vibes_for_user"("target_user_id" "uuid", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recommend_vibes_for_user"("target_user_id" "uuid", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."record_rate_limit_usage"("using_user_profile_id" "uuid", "resource" character varying, "action_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."record_rate_limit_usage"("using_user_profile_id" "uuid", "resource" character varying, "action_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_rate_limit_usage"("using_user_profile_id" "uuid", "resource" character varying, "action_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_featured_preset_request"("request_id" "uuid", "admin_user_id" "uuid", "admin_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_featured_preset_request"("request_id" "uuid", "admin_user_id" "uuid", "admin_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_featured_preset_request"("request_id" "uuid", "admin_user_id" "uuid", "admin_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_rejection_reason" "text", "p_review_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_rejection_reason" "text", "p_review_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_verification_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_rejection_reason" "text", "p_review_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_monthly_subscription_benefits"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_monthly_subscription_benefits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_monthly_subscription_benefits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_current_handle"("input_handle" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_current_handle"("input_handle" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_current_handle"("input_handle" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_username_to_email"("username_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_username_to_email"("username_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_username_to_email"("username_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sanitize_message_content"("content" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."sanitize_message_content"("content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sanitize_message_content"("content" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_purposes"("p_search_term" "text", "p_category" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_purposes"("p_search_term" "text", "p_category" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_purposes"("p_search_term" "text", "p_category" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_roles_and_skills"("search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_roles_and_skills"("search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_roles_and_skills"("search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_deadline_reminders"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_deadline_reminders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_deadline_reminders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_gig_match_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_gig_match_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_gig_match_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_marketplace_milestones"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_marketplace_milestones"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_marketplace_milestones"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_platform_announcement"("p_title" "text", "p_message" "text", "p_action_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."send_platform_announcement"("p_title" "text", "p_message" "text", "p_action_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_platform_announcement"("p_title" "text", "p_message" "text", "p_action_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_profile_completion_reminders"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_profile_completion_reminders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_profile_completion_reminders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_shoot_reminders"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_shoot_reminders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_shoot_reminders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_subscription_expiring_reminders"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_subscription_expiring_reminders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_subscription_expiring_reminders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_targeted_announcement"("p_title" "text", "p_message" "text", "p_role_filter" "text"[], "p_city_filter" "text", "p_action_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."send_targeted_announcement"("p_title" "text", "p_message" "text", "p_role_filter" "text"[], "p_city_filter" "text", "p_action_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_targeted_announcement"("p_title" "text", "p_message" "text", "p_role_filter" "text"[], "p_city_filter" "text", "p_action_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_unread_messages_digest"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_unread_messages_digest"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_unread_messages_digest"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_weekly_digest"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_weekly_digest"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_weekly_digest"() TO "service_role";



GRANT ALL ON FUNCTION "public"."share_contact_details"("p_conversation_id" "uuid", "p_conversation_type" "text", "p_offer_id" "uuid", "p_sharer_id" "uuid", "p_recipient_id" "uuid", "p_contact_type" "text", "p_contact_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."share_contact_details"("p_conversation_id" "uuid", "p_conversation_type" "text", "p_offer_id" "uuid", "p_sharer_id" "uuid", "p_recipient_id" "uuid", "p_contact_type" "text", "p_contact_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."share_contact_details"("p_conversation_id" "uuid", "p_conversation_type" "text", "p_offer_id" "uuid", "p_sharer_id" "uuid", "p_recipient_id" "uuid", "p_contact_type" "text", "p_contact_value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_analytics_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_analytics_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_analytics_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."table_exists"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."table_exists"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."table_exists"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."table_exists_marketplace"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."table_exists_marketplace"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."table_exists_marketplace"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."test_user_settings_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_user_settings_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_user_settings_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_preset_usage"("preset_uuid" "uuid", "usage_type_param" "text", "usage_data_param" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."track_preset_usage"("preset_uuid" "uuid", "usage_type_param" "text", "usage_data_param" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_preset_usage"("preset_uuid" "uuid", "usage_type_param" "text", "usage_data_param" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_treatment_view"("p_treatment_id" "uuid", "p_session_id" "text", "p_referrer" "text", "p_user_agent" "text", "p_ip_address" "inet") TO "anon";
GRANT ALL ON FUNCTION "public"."track_treatment_view"("p_treatment_id" "uuid", "p_session_id" "text", "p_referrer" "text", "p_user_agent" "text", "p_ip_address" "inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_treatment_view"("p_treatment_id" "uuid", "p_session_id" "text", "p_referrer" "text", "p_user_agent" "text", "p_ip_address" "inet") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_application_milestone"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_application_milestone"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_application_milestone"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_application_status_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_application_status_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_application_status_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_application_withdrawn_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_application_withdrawn_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_application_withdrawn_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_applications_closed_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_applications_closed_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_applications_closed_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_credits_low_warning"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_credits_low_warning"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_credits_low_warning"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_gig_cancelled_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_gig_cancelled_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_gig_cancelled_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_gig_completed_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_gig_completed_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_gig_completed_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_gig_published_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_gig_published_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_gig_published_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_message_received_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_message_received_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_message_received_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_new_application_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_new_application_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_new_application_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_preset_listing_status_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_preset_listing_status_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_preset_listing_status_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_preset_purchase_confirmation_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_preset_purchase_confirmation_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_preset_purchase_confirmation_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_preset_review_received_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_preset_review_received_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_preset_review_received_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_preset_sold_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_preset_sold_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_preset_sold_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_subscription_change_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_subscription_change_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_subscription_change_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_welcome_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_welcome_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_welcome_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unblock_user"("blocked_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."unblock_user"("blocked_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unblock_user"("blocked_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_cinematic_presets_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_cinematic_presets_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_cinematic_presets_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_collab_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_collab_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_collab_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_equipment_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_equipment_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_equipment_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_featured_requests_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_featured_requests_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_featured_requests_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_invitation_responded_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_invitation_responded_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_invitation_responded_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_listing_comment_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_listing_comment_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_listing_comment_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_listing_images_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_listing_images_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_listing_images_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_message_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_message_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_message_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notification_preferences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notification_preferences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notification_preferences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_predefined_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_predefined_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_predefined_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_preset_images_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_preset_images_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_preset_images_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_preset_latest_promoted_image"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_preset_latest_promoted_image"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_preset_latest_promoted_image"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_preset_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_preset_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_preset_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_preset_likes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_preset_likes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_preset_likes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_preset_notifications_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_preset_notifications_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_preset_notifications_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_preset_usage_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_preset_usage_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_preset_usage_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_presets_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_presets_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_presets_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_role_status_on_acceptance"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_role_status_on_acceptance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_role_status_on_acceptance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_showcase_comments_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_showcase_comments_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_showcase_comments_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_showcase_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_showcase_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_showcase_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_treatment_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_treatment_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_treatment_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_blocks_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_blocks_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_blocks_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."user_credits" TO "anon";
GRANT ALL ON TABLE "public"."user_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credits" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_skills_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_skills_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_skills_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_vibe_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_vibe_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_vibe_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_verification_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_verification_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_verification_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_user_settings"("user_uuid" "uuid", "settings_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_user_settings"("user_uuid" "uuid", "settings_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_user_settings"("user_uuid" "uuid", "settings_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_user_settings_safe"("user_uuid" "uuid", "settings_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_user_settings_safe"("user_uuid" "uuid", "settings_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_user_settings_safe"("user_uuid" "uuid", "settings_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_user_skill"("p_profile_id" "uuid", "p_skill_name" "text", "p_skill_type" "public"."skill_type", "p_proficiency_level" "public"."proficiency_level", "p_years_experience" integer, "p_description" "text", "p_is_featured" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_user_skill"("p_profile_id" "uuid", "p_skill_name" "text", "p_skill_type" "public"."skill_type", "p_proficiency_level" "public"."proficiency_level", "p_years_experience" integer, "p_description" "text", "p_is_featured" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_user_skill"("p_profile_id" "uuid", "p_skill_name" "text", "p_skill_type" "public"."skill_type", "p_proficiency_level" "public"."proficiency_level", "p_years_experience" integer, "p_description" "text", "p_is_featured" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_project_access"("p_user_id" "uuid", "p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_project_access"("p_user_id" "uuid", "p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_project_access"("p_user_id" "uuid", "p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_matches_gig_types"("user_primary_role" "text", "user_categories" "text"[], "gig_looking_for" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."user_matches_gig_types"("user_primary_role" "text", "user_categories" "text"[], "gig_looking_for" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_matches_gig_types"("user_primary_role" "text", "user_categories" "text"[], "gig_looking_for" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."user_owns_preset"("preset_id" "uuid", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_owns_preset"("preset_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_owns_preset"("preset_id" "uuid", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_and_create_custom_purpose"("p_custom_name" "text", "p_custom_display_name" "text", "p_custom_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_and_create_custom_purpose"("p_custom_name" "text", "p_custom_display_name" "text", "p_custom_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_and_create_custom_purpose"("p_custom_name" "text", "p_custom_display_name" "text", "p_custom_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_contributor_roles"("user_roles" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_contributor_roles"("user_roles" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_contributor_roles"("user_roles" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_contributor_roles_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_contributor_roles_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_contributor_roles_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_instant_film_style"("style_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_instant_film_style"("style_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_instant_film_style"("style_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_message_before_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_message_before_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_message_before_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_message_permission"("sender_user_id" "uuid", "recipient_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_message_permission"("sender_user_id" "uuid", "recipient_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_message_permission"("sender_user_id" "uuid", "recipient_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_preset_style"("style_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_preset_style"("style_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_preset_style"("style_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_professional_skills"("user_skills" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_professional_skills"("user_skills" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_professional_skills"("user_skills" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_professional_skills_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_professional_skills_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_professional_skills_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_reference_data"("p_reference_type" "text", "p_reference_title" "text", "p_reference_url" "text", "p_reference_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_reference_data"("p_reference_type" "text", "p_reference_title" "text", "p_reference_url" "text", "p_reference_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_reference_data"("p_reference_type" "text", "p_reference_title" "text", "p_reference_url" "text", "p_reference_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_reference_url"("p_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_reference_url"("p_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_reference_url"("p_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_preset_image"("image_id" "uuid", "verification_method_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_preset_image"("image_id" "uuid", "verification_method_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_preset_image"("image_id" "uuid", "verification_method_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_user_age"("p_user_id" "uuid", "p_date_of_birth" "date", "p_method" "text", "p_verified_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_user_age"("p_user_id" "uuid", "p_date_of_birth" "date", "p_method" "text", "p_verified_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_user_age"("p_user_id" "uuid", "p_date_of_birth" "date", "p_method" "text", "p_verified_by" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."age_verification_logs" TO "anon";
GRANT ALL ON TABLE "public"."age_verification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."age_verification_logs" TO "service_role";



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



GRANT ALL ON TABLE "public"."application_attachments" TO "anon";
GRANT ALL ON TABLE "public"."application_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."application_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."application_feedback" TO "anon";
GRANT ALL ON TABLE "public"."application_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."application_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."application_messages" TO "anon";
GRANT ALL ON TABLE "public"."application_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."application_messages" TO "service_role";



GRANT ALL ON TABLE "public"."application_status_history" TO "anon";
GRANT ALL ON TABLE "public"."application_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."application_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."aspect_ratios" TO "anon";
GRANT ALL ON TABLE "public"."aspect_ratios" TO "authenticated";
GRANT ALL ON TABLE "public"."aspect_ratios" TO "service_role";



GRANT ALL ON TABLE "public"."browser_cache_config" TO "anon";
GRANT ALL ON TABLE "public"."browser_cache_config" TO "authenticated";
GRANT ALL ON TABLE "public"."browser_cache_config" TO "service_role";



GRANT ALL ON TABLE "public"."camera_angles" TO "anon";
GRANT ALL ON TABLE "public"."camera_angles" TO "authenticated";
GRANT ALL ON TABLE "public"."camera_angles" TO "service_role";



GRANT ALL ON TABLE "public"."camera_movements" TO "anon";
GRANT ALL ON TABLE "public"."camera_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."camera_movements" TO "service_role";



GRANT ALL ON TABLE "public"."cinematic_presets" TO "anon";
GRANT ALL ON TABLE "public"."cinematic_presets" TO "authenticated";
GRANT ALL ON TABLE "public"."cinematic_presets" TO "service_role";



GRANT ALL ON TABLE "public"."collab_applications" TO "anon";
GRANT ALL ON TABLE "public"."collab_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_applications" TO "service_role";



GRANT ALL ON TABLE "public"."collab_gear_offers" TO "anon";
GRANT ALL ON TABLE "public"."collab_gear_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_gear_offers" TO "service_role";



GRANT ALL ON TABLE "public"."collab_gear_requests" TO "anon";
GRANT ALL ON TABLE "public"."collab_gear_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_gear_requests" TO "service_role";



GRANT ALL ON TABLE "public"."collab_invitations" TO "anon";
GRANT ALL ON TABLE "public"."collab_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."collab_participants" TO "anon";
GRANT ALL ON TABLE "public"."collab_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_participants" TO "service_role";



GRANT ALL ON TABLE "public"."collab_projects" TO "anon";
GRANT ALL ON TABLE "public"."collab_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_projects" TO "service_role";



GRANT ALL ON TABLE "public"."collab_roles" TO "anon";
GRANT ALL ON TABLE "public"."collab_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."collab_roles" TO "service_role";



GRANT ALL ON TABLE "public"."color_palettes" TO "anon";
GRANT ALL ON TABLE "public"."color_palettes" TO "authenticated";
GRANT ALL ON TABLE "public"."color_palettes" TO "service_role";



GRANT ALL ON TABLE "public"."composition_techniques" TO "anon";
GRANT ALL ON TABLE "public"."composition_techniques" TO "authenticated";
GRANT ALL ON TABLE "public"."composition_techniques" TO "service_role";



GRANT ALL ON TABLE "public"."contact_sharing" TO "anon";
GRANT ALL ON TABLE "public"."contact_sharing" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_sharing" TO "service_role";



GRANT ALL ON TABLE "public"."content_moderation_queue" TO "anon";
GRANT ALL ON TABLE "public"."content_moderation_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."content_moderation_queue" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_participants" TO "anon";
GRANT ALL ON TABLE "public"."conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



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



GRANT ALL ON TABLE "public"."depth_of_field" TO "anon";
GRANT ALL ON TABLE "public"."depth_of_field" TO "authenticated";
GRANT ALL ON TABLE "public"."depth_of_field" TO "service_role";



GRANT ALL ON TABLE "public"."director_styles" TO "anon";
GRANT ALL ON TABLE "public"."director_styles" TO "authenticated";
GRANT ALL ON TABLE "public"."director_styles" TO "service_role";



GRANT ALL ON TABLE "public"."directory_profiles" TO "anon";
GRANT ALL ON TABLE "public"."directory_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."directory_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."domain_events" TO "anon";
GRANT ALL ON TABLE "public"."domain_events" TO "authenticated";
GRANT ALL ON TABLE "public"."domain_events" TO "service_role";



GRANT ALL ON TABLE "public"."email_logs" TO "anon";
GRANT ALL ON TABLE "public"."email_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."email_logs" TO "service_role";



GRANT ALL ON TABLE "public"."enhancement_tasks" TO "anon";
GRANT ALL ON TABLE "public"."enhancement_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."enhancement_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_brands" TO "anon";
GRANT ALL ON TABLE "public"."equipment_brands" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_brands" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_models" TO "anon";
GRANT ALL ON TABLE "public"."equipment_models" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_models" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_predefined_models" TO "anon";
GRANT ALL ON TABLE "public"."equipment_predefined_models" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_predefined_models" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_request_purposes" TO "anon";
GRANT ALL ON TABLE "public"."equipment_request_purposes" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_request_purposes" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_requests" TO "anon";
GRANT ALL ON TABLE "public"."equipment_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_requests" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_reviews" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_requests_with_ratings" TO "anon";
GRANT ALL ON TABLE "public"."equipment_requests_with_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_requests_with_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_types" TO "anon";
GRANT ALL ON TABLE "public"."equipment_types" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_types" TO "service_role";



GRANT ALL ON TABLE "public"."era_emulations" TO "anon";
GRANT ALL ON TABLE "public"."era_emulations" TO "authenticated";
GRANT ALL ON TABLE "public"."era_emulations" TO "service_role";



GRANT ALL ON TABLE "public"."eye_contacts" TO "anon";
GRANT ALL ON TABLE "public"."eye_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."eye_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."featured_preset_requests" TO "anon";
GRANT ALL ON TABLE "public"."featured_preset_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."featured_preset_requests" TO "service_role";



GRANT ALL ON TABLE "public"."foreground_elements" TO "anon";
GRANT ALL ON TABLE "public"."foreground_elements" TO "authenticated";
GRANT ALL ON TABLE "public"."foreground_elements" TO "service_role";



GRANT ALL ON TABLE "public"."gig_invitations" TO "anon";
GRANT ALL ON TABLE "public"."gig_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."gig_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."gigs" TO "anon";
GRANT ALL ON TABLE "public"."gigs" TO "authenticated";
GRANT ALL ON TABLE "public"."gigs" TO "service_role";



GRANT ALL ON TABLE "public"."languages_master" TO "anon";
GRANT ALL ON TABLE "public"."languages_master" TO "authenticated";
GRANT ALL ON TABLE "public"."languages_master" TO "service_role";



GRANT ALL ON TABLE "public"."lens_types" TO "anon";
GRANT ALL ON TABLE "public"."lens_types" TO "authenticated";
GRANT ALL ON TABLE "public"."lens_types" TO "service_role";



GRANT ALL ON TABLE "public"."lighting_styles" TO "anon";
GRANT ALL ON TABLE "public"."lighting_styles" TO "authenticated";
GRANT ALL ON TABLE "public"."lighting_styles" TO "service_role";



GRANT ALL ON TABLE "public"."listing_comments" TO "anon";
GRANT ALL ON TABLE "public"."listing_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_comments" TO "service_role";



GRANT ALL ON TABLE "public"."listing_images" TO "anon";
GRANT ALL ON TABLE "public"."listing_images" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_images" TO "service_role";



GRANT ALL ON TABLE "public"."listings" TO "anon";
GRANT ALL ON TABLE "public"."listings" TO "authenticated";
GRANT ALL ON TABLE "public"."listings" TO "service_role";



GRANT ALL ON TABLE "public"."location_types" TO "anon";
GRANT ALL ON TABLE "public"."location_types" TO "authenticated";
GRANT ALL ON TABLE "public"."location_types" TO "service_role";



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



GRANT ALL ON TABLE "public"."moodboard_items" TO "anon";
GRANT ALL ON TABLE "public"."moodboard_items" TO "authenticated";
GRANT ALL ON TABLE "public"."moodboard_items" TO "service_role";



GRANT ALL ON TABLE "public"."moodboards" TO "anon";
GRANT ALL ON TABLE "public"."moodboards" TO "authenticated";
GRANT ALL ON TABLE "public"."moodboards" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."oauth_health_check" TO "anon";
GRANT ALL ON TABLE "public"."oauth_health_check" TO "authenticated";
GRANT ALL ON TABLE "public"."oauth_health_check" TO "service_role";



GRANT ALL ON TABLE "public"."oauth_logs" TO "anon";
GRANT ALL ON TABLE "public"."oauth_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."oauth_logs" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON TABLE "public"."platform_credit_consumption" TO "anon";
GRANT ALL ON TABLE "public"."platform_credit_consumption" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_credit_consumption" TO "service_role";



GRANT ALL ON TABLE "public"."platform_credits" TO "anon";
GRANT ALL ON TABLE "public"."platform_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_credits" TO "service_role";



GRANT ALL ON TABLE "public"."platform_images" TO "anon";
GRANT ALL ON TABLE "public"."platform_images" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_images" TO "service_role";



GRANT ALL ON TABLE "public"."playground_gallery" TO "anon";
GRANT ALL ON TABLE "public"."playground_gallery" TO "authenticated";
GRANT ALL ON TABLE "public"."playground_gallery" TO "service_role";



GRANT ALL ON TABLE "public"."playground_projects" TO "anon";
GRANT ALL ON TABLE "public"."playground_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."playground_projects" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_availability_statuses" TO "anon";
GRANT ALL ON TABLE "public"."predefined_availability_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_availability_statuses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_availability_statuses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_availability_statuses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_availability_statuses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_body_types" TO "anon";
GRANT ALL ON TABLE "public"."predefined_body_types" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_body_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_body_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_body_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_body_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_clothing_size_systems" TO "anon";
GRANT ALL ON TABLE "public"."predefined_clothing_size_systems" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_clothing_size_systems" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_clothing_size_systems_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_clothing_size_systems_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_clothing_size_systems_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_clothing_sizes" TO "anon";
GRANT ALL ON TABLE "public"."predefined_clothing_sizes" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_clothing_sizes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_clothing_sizes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_clothing_sizes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_clothing_sizes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_equipment_options" TO "anon";
GRANT ALL ON TABLE "public"."predefined_equipment_options" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_equipment_options" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_equipment_options_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_equipment_options_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_equipment_options_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_ethnicities" TO "anon";
GRANT ALL ON TABLE "public"."predefined_ethnicities" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_ethnicities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_ethnicities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_ethnicities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_ethnicities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_experience_levels" TO "anon";
GRANT ALL ON TABLE "public"."predefined_experience_levels" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_experience_levels" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_experience_levels_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_experience_levels_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_experience_levels_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_eye_colors" TO "anon";
GRANT ALL ON TABLE "public"."predefined_eye_colors" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_eye_colors" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_eye_colors_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_eye_colors_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_eye_colors_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_gear_categories" TO "anon";
GRANT ALL ON TABLE "public"."predefined_gear_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_gear_categories" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_gender_identities" TO "anon";
GRANT ALL ON TABLE "public"."predefined_gender_identities" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_gender_identities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_gender_identities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_gender_identities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_gender_identities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_hair_colors" TO "anon";
GRANT ALL ON TABLE "public"."predefined_hair_colors" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_hair_colors" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_hair_colors_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_hair_colors_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_hair_colors_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_hair_lengths" TO "anon";
GRANT ALL ON TABLE "public"."predefined_hair_lengths" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_hair_lengths" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_hair_lengths_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_hair_lengths_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_hair_lengths_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_nationalities" TO "anon";
GRANT ALL ON TABLE "public"."predefined_nationalities" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_nationalities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_nationalities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_nationalities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_nationalities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_professional_skills" TO "anon";
GRANT ALL ON TABLE "public"."predefined_professional_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_professional_skills" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_roles" TO "anon";
GRANT ALL ON TABLE "public"."predefined_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_roles" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_shoe_size_systems" TO "anon";
GRANT ALL ON TABLE "public"."predefined_shoe_size_systems" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_shoe_size_systems" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_shoe_size_systems_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_shoe_size_systems_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_shoe_size_systems_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_shoe_sizes" TO "anon";
GRANT ALL ON TABLE "public"."predefined_shoe_sizes" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_shoe_sizes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_shoe_sizes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_shoe_sizes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_shoe_sizes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_skills" TO "anon";
GRANT ALL ON TABLE "public"."predefined_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_skills" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_skin_tones" TO "anon";
GRANT ALL ON TABLE "public"."predefined_skin_tones" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_skin_tones" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_skin_tones_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_skin_tones_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_skin_tones_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_style_tags" TO "anon";
GRANT ALL ON TABLE "public"."predefined_style_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_style_tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_style_tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_style_tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_style_tags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_talent_categories" TO "anon";
GRANT ALL ON TABLE "public"."predefined_talent_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_talent_categories" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_vibe_tags" TO "anon";
GRANT ALL ON TABLE "public"."predefined_vibe_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_vibe_tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."predefined_vibe_tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."predefined_vibe_tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."predefined_vibe_tags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."presets" TO "anon";
GRANT ALL ON TABLE "public"."presets" TO "authenticated";
GRANT ALL ON TABLE "public"."presets" TO "service_role";



GRANT ALL ON TABLE "public"."preset_full_details" TO "anon";
GRANT ALL ON TABLE "public"."preset_full_details" TO "authenticated";
GRANT ALL ON TABLE "public"."preset_full_details" TO "service_role";



GRANT ALL ON TABLE "public"."preset_images" TO "anon";
GRANT ALL ON TABLE "public"."preset_images" TO "authenticated";
GRANT ALL ON TABLE "public"."preset_images" TO "service_role";



GRANT ALL ON TABLE "public"."preset_likes" TO "anon";
GRANT ALL ON TABLE "public"."preset_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."preset_likes" TO "service_role";



GRANT ALL ON TABLE "public"."preset_marketplace_listings" TO "anon";
GRANT ALL ON TABLE "public"."preset_marketplace_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."preset_marketplace_listings" TO "service_role";



GRANT ALL ON TABLE "public"."preset_marketplace_preview" TO "anon";
GRANT ALL ON TABLE "public"."preset_marketplace_preview" TO "authenticated";
GRANT ALL ON TABLE "public"."preset_marketplace_preview" TO "service_role";



GRANT ALL ON TABLE "public"."preset_notifications" TO "anon";
GRANT ALL ON TABLE "public"."preset_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."preset_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."preset_purchases" TO "anon";
GRANT ALL ON TABLE "public"."preset_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."preset_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."preset_reviews" TO "anon";
GRANT ALL ON TABLE "public"."preset_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."preset_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."preset_usage" TO "anon";
GRANT ALL ON TABLE "public"."preset_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."preset_usage" TO "service_role";



GRANT ALL ON TABLE "public"."preset_visual_aids" TO "anon";
GRANT ALL ON TABLE "public"."preset_visual_aids" TO "authenticated";
GRANT ALL ON TABLE "public"."preset_visual_aids" TO "service_role";



GRANT ALL ON TABLE "public"."provider_performance" TO "anon";
GRANT ALL ON TABLE "public"."provider_performance" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_performance" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."refund_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."refund_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."refund_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."refund_policies" TO "anon";
GRANT ALL ON TABLE "public"."refund_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."refund_policies" TO "service_role";



GRANT ALL ON TABLE "public"."rental_orders" TO "anon";
GRANT ALL ON TABLE "public"."rental_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."rental_orders" TO "service_role";



GRANT ALL ON TABLE "public"."rental_requests" TO "anon";
GRANT ALL ON TABLE "public"."rental_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."rental_requests" TO "service_role";



GRANT ALL ON TABLE "public"."request_conversation_messages" TO "anon";
GRANT ALL ON TABLE "public"."request_conversation_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."request_conversation_messages" TO "service_role";



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



GRANT ALL ON TABLE "public"."scene_moods" TO "anon";
GRANT ALL ON TABLE "public"."scene_moods" TO "authenticated";
GRANT ALL ON TABLE "public"."scene_moods" TO "service_role";



GRANT ALL ON TABLE "public"."shot_sizes" TO "anon";
GRANT ALL ON TABLE "public"."shot_sizes" TO "authenticated";
GRANT ALL ON TABLE "public"."shot_sizes" TO "service_role";



GRANT ALL ON TABLE "public"."showcase_comments" TO "anon";
GRANT ALL ON TABLE "public"."showcase_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."showcase_comments" TO "service_role";



GRANT ALL ON TABLE "public"."showcase_likes" TO "anon";
GRANT ALL ON TABLE "public"."showcase_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."showcase_likes" TO "service_role";



GRANT ALL ON TABLE "public"."showcases" TO "anon";
GRANT ALL ON TABLE "public"."showcases" TO "authenticated";
GRANT ALL ON TABLE "public"."showcases" TO "service_role";



GRANT ALL ON TABLE "public"."specializations" TO "anon";
GRANT ALL ON TABLE "public"."specializations" TO "authenticated";
GRANT ALL ON TABLE "public"."specializations" TO "service_role";



GRANT ALL ON TABLE "public"."style_prompts" TO "anon";
GRANT ALL ON TABLE "public"."style_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."style_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."subject_counts" TO "anon";
GRANT ALL ON TABLE "public"."subject_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."subject_counts" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_tiers" TO "anon";
GRANT ALL ON TABLE "public"."subscription_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_tiers" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."system_alerts" TO "anon";
GRANT ALL ON TABLE "public"."system_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."system_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."system_logs" TO "anon";
GRANT ALL ON TABLE "public"."system_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."system_logs" TO "service_role";



GRANT ALL ON TABLE "public"."time_settings" TO "anon";
GRANT ALL ON TABLE "public"."time_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."time_settings" TO "service_role";



GRANT ALL ON TABLE "public"."timezones" TO "anon";
GRANT ALL ON TABLE "public"."timezones" TO "authenticated";
GRANT ALL ON TABLE "public"."timezones" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_analytics" TO "anon";
GRANT ALL ON TABLE "public"."treatment_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_assets" TO "anon";
GRANT ALL ON TABLE "public"."treatment_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_assets" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_sharing" TO "anon";
GRANT ALL ON TABLE "public"."treatment_sharing" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_sharing" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_versions" TO "anon";
GRANT ALL ON TABLE "public"."treatment_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_versions" TO "service_role";



GRANT ALL ON TABLE "public"."treatments" TO "anon";
GRANT ALL ON TABLE "public"."treatments" TO "authenticated";
GRANT ALL ON TABLE "public"."treatments" TO "service_role";



GRANT ALL ON TABLE "public"."typing_indicators" TO "anon";
GRANT ALL ON TABLE "public"."typing_indicators" TO "authenticated";
GRANT ALL ON TABLE "public"."typing_indicators" TO "service_role";



GRANT ALL ON TABLE "public"."unified_presets" TO "anon";
GRANT ALL ON TABLE "public"."unified_presets" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_presets" TO "service_role";



GRANT ALL ON TABLE "public"."user_availability" TO "anon";
GRANT ALL ON TABLE "public"."user_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."user_availability" TO "service_role";



GRANT ALL ON TABLE "public"."user_blocks" TO "anon";
GRANT ALL ON TABLE "public"."user_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."user_clothing_sizes" TO "anon";
GRANT ALL ON TABLE "public"."user_clothing_sizes" TO "authenticated";
GRANT ALL ON TABLE "public"."user_clothing_sizes" TO "service_role";



GRANT ALL ON TABLE "public"."user_credit_purchases" TO "anon";
GRANT ALL ON TABLE "public"."user_credit_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credit_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."user_equipment" TO "anon";
GRANT ALL ON TABLE "public"."user_equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."user_equipment" TO "service_role";



GRANT ALL ON TABLE "public"."user_equipment_view" TO "anon";
GRANT ALL ON TABLE "public"."user_equipment_view" TO "authenticated";
GRANT ALL ON TABLE "public"."user_equipment_view" TO "service_role";



GRANT ALL ON TABLE "public"."user_handle_redirects" TO "anon";
GRANT ALL ON TABLE "public"."user_handle_redirects" TO "authenticated";
GRANT ALL ON TABLE "public"."user_handle_redirects" TO "service_role";



GRANT ALL ON TABLE "public"."user_measurements" TO "anon";
GRANT ALL ON TABLE "public"."user_measurements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_measurements" TO "service_role";



GRANT ALL ON TABLE "public"."user_provider_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_provider_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_provider_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."user_rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."user_rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_skills" TO "anon";
GRANT ALL ON TABLE "public"."user_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."user_skills" TO "service_role";



GRANT ALL ON TABLE "public"."user_skills_view" TO "anon";
GRANT ALL ON TABLE "public"."user_skills_view" TO "authenticated";
GRANT ALL ON TABLE "public"."user_skills_view" TO "service_role";



GRANT ALL ON TABLE "public"."user_vibe_analytics" TO "anon";
GRANT ALL ON TABLE "public"."user_vibe_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_vibe_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."vibes_master" TO "anon";
GRANT ALL ON TABLE "public"."vibes_master" TO "authenticated";
GRANT ALL ON TABLE "public"."vibes_master" TO "service_role";



GRANT ALL ON TABLE "public"."violation_thresholds" TO "anon";
GRANT ALL ON TABLE "public"."violation_thresholds" TO "authenticated";
GRANT ALL ON TABLE "public"."violation_thresholds" TO "service_role";



GRANT ALL ON TABLE "public"."weather_conditions" TO "anon";
GRANT ALL ON TABLE "public"."weather_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."weather_conditions" TO "service_role";



GRANT ALL ON TABLE "public"."working_time_preferences" TO "anon";
GRANT ALL ON TABLE "public"."working_time_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."working_time_preferences" TO "service_role";



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
