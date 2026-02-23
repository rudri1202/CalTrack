#!/bin/bash
# Start the CalTrack backend server
set -e

echo "Starting CalTrack backend..."
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  source venv/bin/activate
fi

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Start the server
echo "Starting FastAPI server on port 8000..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
