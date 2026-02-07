#!/bin/bash

# Risk Monitor - Database Setup Script
# This script initializes the PostgreSQL database with all required tables

echo "🚀 Risk Monitor - Database Setup"
echo "=================================="
echo ""

# Database configuration
DB_NAME="risk_monitor"
DB_USER=$(whoami)
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Setting up database: ${DB_NAME}${NC}"
echo ""

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL is not running!${NC}"
    echo "Please start PostgreSQL first:"
    echo "  brew services start postgresql@14"
    echo "  or"
    echo "  pg_ctl -D /usr/local/var/postgres start"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Create database if it doesn't exist
echo -e "${BLUE}📦 Creating database...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE ${DB_NAME};"

echo -e "${GREEN}✅ Database ready${NC}"
echo ""

# Run migrations
echo -e "${BLUE}🔄 Running migrations...${NC}"
echo ""

# Migration 1: Initial Schema
echo -e "${BLUE}  → Running 001_initial_schema.sql${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/001_initial_schema.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✅ Initial schema created${NC}"
else
    echo -e "${RED}  ❌ Failed to create initial schema${NC}"
    exit 1
fi

# Migration 2: Add Users
echo -e "${BLUE}  → Running 002_add_users.sql${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/002_add_users.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✅ User tables created${NC}"
else
    echo -e "${RED}  ❌ Failed to create user tables${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Start the backend: cd backend-node && npm start"
echo "  2. Start the desktop app: cd desktop && npm start"
echo "  3. Create your account in the app"
echo ""
echo -e "${BLUE}Happy monitoring! 🚀${NC}"
