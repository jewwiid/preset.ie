-- Fix credit_transactions foreign key to allow user deletion
-- This was referencing auth.users without CASCADE

ALTER TABLE credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey,
  ADD CONSTRAINT credit_transactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the fix
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.referential_constraints
    WHERE constraint_name = 'credit_transactions_user_id_fkey'
      AND delete_rule = 'CASCADE'
  ) THEN
    RAISE NOTICE '✅ credit_transactions CASCADE constraint fixed';
  ELSE
    RAISE WARNING '❌ credit_transactions CASCADE constraint not applied';
  END IF;
END $$;
