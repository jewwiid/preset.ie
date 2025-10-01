#!/bin/bash

# Script to add new headshot, product, and instant film presets
# Run this directly against your Supabase database

echo "Adding new presets to database..."
echo "=================================="
echo ""

# Get Supabase connection details
echo "Enter your Supabase database connection details:"
echo ""
read -p "Database Host: " DB_HOST
read -p "Database Name: " DB_NAME
read -p "Database User: " DB_USER
read -sp "Database Password: " DB_PASSWORD
echo ""
echo ""

# Run the additional headshot and product presets
echo "1. Adding additional headshot and product presets..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -d $DB_NAME -U $DB_USER -f additional_headshot_product_presets.sql

if [ $? -eq 0 ]; then
    echo "✅ Additional headshot and product presets added successfully"
else
    echo "❌ Failed to add additional headshot and product presets"
    exit 1
fi

echo ""

# Run the instant film presets
echo "2. Adding instant film presets..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -d $DB_NAME -U $DB_USER -f instant_film_presets.sql

if [ $? -eq 0 ]; then
    echo "✅ Instant film presets added successfully"
else
    echo "❌ Failed to add instant film presets"
    exit 1
fi

echo ""

# Fix visibility for all presets
echo "3. Fixing preset visibility..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -d $DB_NAME -U $DB_USER -f scripts/fix-preset-visibility.sql

if [ $? -eq 0 ]; then
    echo "✅ Preset visibility fixed successfully"
else
    echo "❌ Failed to fix preset visibility"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ All presets added and configured!"
echo "=================================="
echo ""

# Verify
echo "Verifying presets..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -d $DB_NAME -U $DB_USER << EOF
SELECT
    COUNT(*) FILTER (WHERE name ILIKE '%headshot%') as headshot_presets,
    COUNT(*) FILTER (WHERE name ILIKE '%product%') as product_presets,
    COUNT(*) FILTER (WHERE name ILIKE '%instant%' OR name ILIKE '%polaroid%' OR name ILIKE '%instax%') as instant_film_presets,
    COUNT(*) FILTER (WHERE is_public = true) as public_presets,
    COUNT(*) FILTER (WHERE is_featured = true) as featured_presets
FROM presets;
EOF

echo ""
echo "Done!"
