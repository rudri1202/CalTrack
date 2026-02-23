# CalTrack

A personal calorie tracking application with AI-powered meal analysis and nutrition chat assistant.

## Stack

- **Backend**: FastAPI, PostgreSQL, SQLAlchemy, Alembic, JWT auth, Groq AI
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts, React Router

## Features

- User registration and authentication
- Meal logging with food entries
- Calorie goals and tracking
- Reports and analytics
- AI nutrition assistant (chat)
- Image upload for food / label analysis

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env    # Edit with your config
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Environment

Copy `backend/.env.example` to `backend/.env` and configure:

- `DATABASE_URL` — PostgreSQL connection string
- `SECRET_KEY` — JWT signing key
- `GROQ_API_KEY` — Optional, for AI features
