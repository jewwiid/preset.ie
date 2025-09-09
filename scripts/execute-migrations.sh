#!/bin/bash

# Load environment variables
source .env

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Running Phase 1 & 2 Database Migrations${NC}"
echo ""

# Check if required env vars are set
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo -e "${RED}❌ Missing SUPABASE_DB_PASSWORD in .env${NC}"
    exit 1
fi

# Database connection details from Supabase
DB_HOST="aws-0-us-west-1.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.zbsmgymyfhnwjdnmlelr"
DB_NAME="postgres"

echo -e "${YELLOW}📊 Checking database connection...${NC}"
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to connect to database${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database connection successful${NC}"
echo ""

# Run migrations
echo -e "${YELLOW}📋 Running migration: Domain Events Table (Phase 1)${NC}"
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f supabase/migrations/010_domain_events_table.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Domain Events table created${NC}"
else
    echo -e "${RED}❌ Failed to create Domain Events table${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Running migration: Users & Profiles Tables (Phase 2)${NC}"
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f supabase/migrations/011_users_and_profiles_tables.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Users & Profiles tables created${NC}"
else
    echo -e "${RED}❌ Failed to create Users & Profiles tables${NC}"
fi

echo ""
echo -e "${YELLOW}🔍 Verifying tables...${NC}"

# Check if tables exist
TABLES=("domain_events" "users" "profiles")
for table in "${TABLES[@]}"; do
    RESULT=$(PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');")
    
    if [[ $RESULT == *"t"* ]]; then
        echo -e "${GREEN}✅ Table '$table' exists${NC}"
    else
        echo -e "${RED}❌ Table '$table' not found${NC}"
    fi
done

echo ""
echo -e "${GREEN}✨ Migration process complete!${NC}"