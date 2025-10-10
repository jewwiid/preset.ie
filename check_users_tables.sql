-- Find all tables related to users
SELECT 
    schemaname,
    tablename
FROM pg_tables
WHERE tablename LIKE '%user%'
ORDER BY schemaname, tablename;
