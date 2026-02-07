#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  Setting up PostgreSQL for Nalyse${NC}\n"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo -e "${YELLOW}Installing PostgreSQL...${NC}"
    brew install postgresql@14
    brew services start postgresql@14
else
    echo -e "${GREEN}✅ PostgreSQL is already installed${NC}"
fi

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    brew services start postgresql@14
    sleep 2
fi

# Create databases
echo -e "\n${YELLOW}Creating databases...${NC}"

createdb nalyse_dev 2>/dev/null && echo -e "${GREEN}✅ Created nalyse_dev database${NC}" || echo -e "${YELLOW}⚠️  nalyse_dev database already exists${NC}"
createdb nalyse_test 2>/dev/null && echo -e "${GREEN}✅ Created nalyse_test database${NC}" || echo -e "${YELLOW}⚠️  nalyse_test database already exists${NC}"
createdb nalyse_prod 2>/dev/null && echo -e "${GREEN}✅ Created nalyse_prod database${NC}" || echo -e "${YELLOW}⚠️  nalyse_prod database already exists${NC}"

echo -e "\n${GREEN}✅ Database setup complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Update .env file with your database credentials"
echo -e "2. Run: npm run dev"
echo -e "3. The tables will be auto-created on first run (development mode)\n"
