#!/bin/bash

echo "🔒 Removing secrets from git history..."

# Use BFG Repo-Cleaner or git filter-branch
# First, install BFG if not installed
if ! command -v bfg &> /dev/null; then
    echo "Installing BFG Repo Cleaner..."
    brew install bfg
fi

# Create a backup first
echo "Creating backup..."
cp -r .git .git.backup

# Remove the specific file from all commits
echo "Removing deploy-refund-migration.js from history..."
bfg --delete-files deploy-refund-migration.js .

# Alternative using git filter-branch (if BFG not available):
# git filter-branch --force --index-filter \
#   "git rm --cached --ignore-unmatch deploy-refund-migration.js" \
#   --prune-empty --tag-name-filter cat -- --all

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Secrets removed from history"
echo "⚠️  Now force push to update remote:"
echo "git push --force --all origin"
echo "git push --force --tags origin"