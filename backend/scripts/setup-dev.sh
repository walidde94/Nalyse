#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Nalyse Backend — Developer Setup Script
# Run: npm run setup   (or:  bash scripts/setup-dev.sh)
# ──────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            🧬 Nalyse Backend — Dev Setup                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── 1. Environment file ──────────────────────────────────────────────
if [ ! -f .env ]; then
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
    echo "   ✅ .env created. Edit it if you need custom database settings."
else
    echo "📋 .env already exists — skipping."
fi
echo ""

# ── 2. Install dependencies ─────────────────────────────────────────
echo "📦 Installing dependencies..."
npm install
echo "   ✅ Dependencies installed."
echo ""

# ── 3. Generate Prisma Client ───────────────────────────────────────
echo "🔧 Generating Prisma client..."
npx prisma generate
echo "   ✅ Prisma client generated."
echo ""

# ── 4. Database setup (non-fatal) ───────────────────────────────────
echo "🗄️  Attempting database setup..."
if npx prisma db push --accept-data-loss 2>/dev/null; then
    echo "   ✅ Database schema pushed successfully."
else
    echo ""
    echo "   ⚠️  Database push failed — this is OK for initial setup."
    echo "   The server will still start in degraded mode."
    echo ""
    echo "   To get a full database, either:"
    echo "     • Run: docker-compose up -d db"
    echo "       Then re-run: npx prisma db push"
    echo "     • Or install PostgreSQL locally and update .env"
fi
echo ""

# ── 5. Create uploads directory ─────────────────────────────────────
mkdir -p uploads
echo "📁 uploads/ directory ready."
echo ""

# ── Summary ──────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                                         ║"
echo "║                                                              ║"
echo "║  Start the backend:   npm run dev                            ║"
echo "║  Start PostgreSQL:    docker-compose up -d db                ║"
echo "║  Start everything:    docker-compose up -d                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
