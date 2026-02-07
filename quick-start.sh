#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Nalyse Quick Start Guide            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Check if PostgreSQL is installed
echo -e "${YELLOW}[1/5] Checking PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is installed${NC}"
else
    echo -e "${RED}❌ PostgreSQL not found${NC}"
    echo -e "${YELLOW}Installing PostgreSQL...${NC}"
    brew install postgresql@14
    brew services start postgresql@14
fi

# Check if PostgreSQL is running
echo -e "\n${YELLOW}[2/5] Checking PostgreSQL service...${NC}"
if pg_isready &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    brew services start postgresql@14
    sleep 3
fi

# Create database
echo -e "\n${YELLOW}[3/5] Creating database...${NC}"
if psql -lqt | cut -d \| -f 1 | grep -qw nalyse_dev; then
    echo -e "${GREEN}✅ Database 'nalyse_dev' already exists${NC}"
else
    createdb nalyse_dev && echo -e "${GREEN}✅ Created database 'nalyse_dev'${NC}"
fi

# Check backend dependencies
echo -e "\n${YELLOW}[4/5] Checking backend dependencies...${NC}"
cd backend
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Check frontend dependencies
echo -e "\n${YELLOW}[5/5] Checking frontend dependencies...${NC}"
cd ../frontend
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

cd ..

# Summary
echo -e "\n${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Setup Complete! 🎉                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Start the backend:  ${YELLOW}cd backend && npm run dev${NC}"
echo -e "2. Start the frontend: ${YELLOW}cd frontend && npm run dev${NC}"
echo -e "3. Open your browser:  ${YELLOW}http://localhost:5173${NC}"
echo -e "4. Create an account and start analyzing!\n"

echo -e "${BLUE}Quick Test:${NC}"
echo -e "Register at: http://localhost:5173"
echo -e "Email: test@nalyse.com"
echo -e "Password: TestPass123\n"

echo -e "${GREEN}Documentation:${NC}"
echo -e "- Backend Auth: ${YELLOW}backend/README_AUTH.md${NC}"
echo -e "- Frontend Auth: ${YELLOW}FRONTEND_AUTH_COMPLETE.md${NC}"
echo -e "- Phase 1 Summary: ${YELLOW}PHASE1_COMPLETE.md${NC}"
echo -e "- Production Roadmap: ${YELLOW}.agent/workflows/production-roadmap.md${NC}\n"
