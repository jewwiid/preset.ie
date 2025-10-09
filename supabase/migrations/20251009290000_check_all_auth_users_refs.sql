-- Check ALL foreign keys referencing auth.users to find any remaining blockers

SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE ccu.table_schema = 'auth'
  AND ccu.table_name = 'users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND rc.delete_rule != 'CASCADE'
ORDER BY tc.table_schema, tc.table_name;
