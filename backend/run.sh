#!/bin/bash
# ─── Construction Suite — Backend Setup & Run ────────────────────────────────
# Run from the backend/ directory: bash run.sh

set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Construction Management Suite — Backend        ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# 1. Copy .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓  Created .env from .env.example"
    echo "   ⚠  Edit .env and set DATABASE_URL and SECRET_KEY before running!"
    echo ""
fi

# 2. Virtual environment
if [ ! -d "venv" ]; then
    echo "▸  Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "✓  Virtual environment active"

# 3. Install dependencies
echo "▸  Installing dependencies..."
pip install -r requirements.txt -q
echo "✓  Dependencies installed"

# 4. Run migrations
echo "▸  Running database migrations..."
alembic upgrade head
echo "✓  Migrations applied"

# 5. Seed database
echo "▸  Seeding database..."
python seed.py

# 6. Start server
echo ""
echo "▸  Starting FastAPI server on http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
