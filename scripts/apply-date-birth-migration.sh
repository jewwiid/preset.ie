#!/bin/bash

# Load environment variables
source .env.local

# Construct the database URL
DB_HOST="db.zbsmgymyfhnwjdnmlelr.supabase.co"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="$SUPABASE_DB_PASSWORD"
DB_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/$DB_NAME"

echo "🔧 Adding date_of_birth column to users_profile table..."

# Execute the SQL to add the column
SQL="
DO \$\$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'date_of_birth'
        AND table_schema = 'public'
    ) THEN
        -- Add the column
        ALTER TABLE public.users_profile 
        ADD COLUMN date_of_birth date;
        
        RAISE NOTICE 'Successfully added date_of_birth column to users_profile table';
    ELSE
        RAISE NOTICE 'date_of_birth column already exists in users_profile table';
    END IF;
END \$\$;
"

# Execute the SQL
echo "$SQL" | psql "$DB_URL"

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi