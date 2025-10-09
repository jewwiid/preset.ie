-- Comprehensive fix for all foreign key constraints to allow user deletion
-- This migration adds appropriate CASCADE or SET NULL rules to all user-related foreign keys

-- 1. oauth_logs - CASCADE (logs should be deleted with user)
ALTER TABLE oauth_logs
  DROP CONSTRAINT IF EXISTS oauth_logs_user_id_fkey,
  ADD CONSTRAINT oauth_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users_profile(id) ON DELETE CASCADE;

-- 2. lootbox_events - CASCADE (user's lootbox events should be deleted)
ALTER TABLE lootbox_events
  DROP CONSTRAINT IF EXISTS lootbox_events_purchased_by_fkey,
  ADD CONSTRAINT lootbox_events_purchased_by_fkey
    FOREIGN KEY (purchased_by) REFERENCES users_profile(id) ON DELETE CASCADE;

-- 3. treatment_versions - SET NULL (preserve treatment history, just nullify creator)
ALTER TABLE treatment_versions
  DROP CONSTRAINT IF EXISTS treatment_versions_created_by_fkey,
  ADD CONSTRAINT treatment_versions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users_profile(id) ON DELETE SET NULL;

-- 4. treatment_analytics - CASCADE (delete analytics when user is deleted)
ALTER TABLE treatment_analytics
  DROP CONSTRAINT IF EXISTS treatment_analytics_viewer_id_fkey,
  ADD CONSTRAINT treatment_analytics_viewer_id_fkey
    FOREIGN KEY (viewer_id) REFERENCES users_profile(id) ON DELETE CASCADE;

-- 5. treatment_sharing - CASCADE (delete sharing records when user is deleted)
ALTER TABLE treatment_sharing
  DROP CONSTRAINT IF EXISTS treatment_sharing_created_by_fkey,
  ADD CONSTRAINT treatment_sharing_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users_profile(id) ON DELETE CASCADE;

-- 6. featured_preset_requests - SET NULL (preserve request, nullify reviewer)
ALTER TABLE featured_preset_requests
  DROP CONSTRAINT IF EXISTS featured_preset_requests_reviewed_by_fkey,
  ADD CONSTRAINT featured_preset_requests_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES users_profile(id) ON DELETE SET NULL;

-- 7. content_moderation_queue - SET NULL (preserve moderation record, nullify resolver)
ALTER TABLE content_moderation_queue
  DROP CONSTRAINT IF EXISTS content_moderation_queue_resolved_by_fkey,
  ADD CONSTRAINT content_moderation_queue_resolved_by_fkey
    FOREIGN KEY (resolved_by) REFERENCES users_profile(id) ON DELETE SET NULL;

-- 8. credit_transactions - CASCADE (delete user's credit transactions)
ALTER TABLE credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey,
  ADD CONSTRAINT credit_transactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users_profile(id) ON DELETE CASCADE;

-- 9. credit_purchase_requests - SET NULL (preserve request, nullify approver)
ALTER TABLE credit_purchase_requests
  DROP CONSTRAINT IF EXISTS credit_purchase_requests_approved_by_fkey,
  ADD CONSTRAINT credit_purchase_requests_approved_by_fkey
    FOREIGN KEY (approved_by) REFERENCES users_profile(id) ON DELETE SET NULL;

-- 10. verification_badges - SET NULL (preserve badge record, nullify issuer)
ALTER TABLE verification_badges
  DROP CONSTRAINT IF EXISTS verification_badges_issued_by_fkey,
  ADD CONSTRAINT verification_badges_issued_by_fkey
    FOREIGN KEY (issued_by) REFERENCES users_profile(id) ON DELETE SET NULL;

-- 11. age_verification_logs - SET NULL (preserve verification record, nullify verifier)
ALTER TABLE age_verification_logs
  DROP CONSTRAINT IF EXISTS age_verification_logs_verified_by_fkey,
  ADD CONSTRAINT age_verification_logs_verified_by_fkey
    FOREIGN KEY (verified_by) REFERENCES users_profile(id) ON DELETE SET NULL;

-- 12. platform_credit_consumption - CASCADE (delete user's consumption records)
ALTER TABLE platform_credit_consumption
  DROP CONSTRAINT IF EXISTS platform_credit_consumption_user_id_fkey,
  ADD CONSTRAINT platform_credit_consumption_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users_profile(id) ON DELETE CASCADE;

-- 13. user_credit_purchases - CASCADE (delete user's purchase records)
ALTER TABLE user_credit_purchases
  DROP CONSTRAINT IF EXISTS user_credit_purchases_user_id_fkey,
  ADD CONSTRAINT user_credit_purchases_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users_profile(id) ON DELETE CASCADE;

-- 14. enhancement_tasks - CASCADE (delete user's enhancement tasks)
ALTER TABLE enhancement_tasks
  DROP CONSTRAINT IF EXISTS enhancement_tasks_user_id_fkey,
  ADD CONSTRAINT enhancement_tasks_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users_profile(id) ON DELETE CASCADE;

-- 15. refund_audit_log - SET NULL (preserve audit log, nullify user)
ALTER TABLE refund_audit_log
  DROP CONSTRAINT IF EXISTS refund_audit_log_user_id_fkey,
  ADD CONSTRAINT refund_audit_log_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users_profile(id) ON DELETE SET NULL;

-- 16. preset_marketplace_listings - SET NULL (preserve listing, nullify approver)
ALTER TABLE preset_marketplace_listings
  DROP CONSTRAINT IF EXISTS preset_marketplace_listings_approved_by_fkey,
  ADD CONSTRAINT preset_marketplace_listings_approved_by_fkey
    FOREIGN KEY (approved_by) REFERENCES users_profile(id) ON DELETE SET NULL;

-- Verify the changes
DO $$
DECLARE
  user_related_no_action INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_related_no_action
  FROM information_schema.referential_constraints rc
  JOIN information_schema.table_constraints tc
    ON rc.constraint_name = tc.constraint_name
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE rc.delete_rule = 'NO ACTION'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND EXISTS (
      SELECT 1 FROM information_schema.constraint_column_usage ccu
      WHERE ccu.constraint_name = tc.constraint_name
        AND ccu.table_name = 'users_profile'
    );

  IF user_related_no_action > 0 THEN
    RAISE WARNING 'Still % user-related constraints without CASCADE/SET NULL', user_related_no_action;
  ELSE
    RAISE NOTICE '✅ All user deletion constraints fixed';
  END IF;
END $$;
