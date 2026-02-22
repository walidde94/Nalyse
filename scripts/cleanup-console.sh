#!/bin/bash

# Nalyse Code Cleanup Script
# This script removes debug console.log statements while preserving console.error

echo "🧹 Starting Nalyse Code Cleanup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to clean console.log from a file
clean_file() {
    local file=$1
    local temp_file="${file}.tmp"
    
    # Remove console.log, console.warn, console.info, console.debug
    # Keep console.error for production debugging
    sed -E \
        -e '/console\.(log|warn|info|debug)\(/d' \
        -e '/^\s*\/\/.*console\./d' \
        "$file" > "$temp_file"
    
    # Only replace if the file changed
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        echo -e "${GREEN}✓${NC} Cleaned: $file"
        return 0
    else
        rm "$temp_file"
        return 1
    fi
}

# Counter for cleaned files
cleaned_count=0

echo "Cleaning Frontend Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Find and clean all TypeScript/TSX files in frontend
while IFS= read -r file; do
    if grep -q 'console\.\(log\|warn\|info\|debug\)' "$file" 2>/dev/null; then
        if clean_file "$file"; then
            ((cleaned_count++))
        fi
    fi
done < <(find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null)

echo ""
echo "Cleaning Backend Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Find and clean all TypeScript files in backend
while IFS= read -r file; do
    if grep -q 'console\.\(log\|warn\|info\|debug\)' "$file" 2>/dev/null; then
        if clean_file "$file"; then
            ((cleaned_count++))
        fi
    fi
done < <(find backend/src -type f -name "*.ts" 2>/dev/null)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ Cleanup Complete!${NC}"
echo ""
echo "Summary:"
echo "  • Files cleaned: $cleaned_count"
echo "  • Console.error statements preserved for production debugging"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test the application: npm run dev"
echo "  3. Commit changes: git add . && git commit -m 'chore: remove debug console statements'"
echo ""
