# 🚀 CalTrack

> A full-stack, AI-powered calorie and nutrition tracking platform with automated goal calculation, smart imports, and rich analytics.

CalTrack combines structured nutrition tracking with AI assistance, automated goal setting, and flexible data ingestion — built with a modern async Python backend and a strongly typed React frontend.

---

# ✨ Core Highlights

- 🔐 JWT Authentication with silent refresh
- 🤖 AI Nutrition Assistant (Groq — Llama 3.3 70B)
- 📊 Advanced analytics & goal comparison
- 📷 Image-based nutrition estimation
- 📄 Bulk PDF nutrition diary import
- 🌗 Persistent dark / light mode
- 🧮 Automatic BMR / TDEE goal calculation
- ⚙️ Fully async backend (FastAPI + SQLAlchemy 2.0)

---

# 🏗 Tech Stack

## Backend

| Layer            | Technology                     |
| ---------------- | ------------------------------ |
| Framework        | FastAPI 0.111                  |
| ORM              | SQLAlchemy 2.0 (async)         |
| Database         | PostgreSQL (asyncpg)           |
| Migrations       | Alembic                        |
| Auth             | JWT (access 30m + refresh 7d)  |
| Security         | bcrypt + python-jose           |
| AI               | Groq — Llama 3.3 70B Versatile |
| PDF Parsing      | pdfplumber                     |
| Image Processing | Pillow                         |
| Validation       | Pydantic v2                    |
| Server           | Uvicorn                        |

---

## Frontend

| Layer      | Technology                             |
| ---------- | -------------------------------------- |
| Framework  | React 18 + TypeScript                  |
| Build Tool | Vite                                   |
| Styling    | Tailwind CSS (class-based dark mode)   |
| Routing    | React Router v6                        |
| Forms      | React Hook Form + Zod                  |
| Charts     | Recharts                               |
| HTTP       | Axios (auto token refresh interceptor) |
| Icons      | Lucide React                           |

---

# 🔐 Authentication

- Email/password registration & login
- JWT access + refresh tokens
- Silent refresh on 401
- Protected routes
- `/me` endpoint for session hydration

---

# 🧮 Profile-Based Goal Automation

During registration, users can optionally provide:

- Height
- Weight
- Age
- Gender
- Goal type (bulking / cutting / maintenance)

### Calculation Logic

- **BMR** → Mifflin-St Jeor formula
- **TDEE** → BMR × 1.55 (moderate activity)
- **Calorie Targets**
  - Bulking → TDEE + 300 kcal
  - Cutting → TDEE − 500 kcal
  - Maintenance → TDEE

### Macro Distribution

- Protein:
  - 2.0 g/kg (body-composition goals)
  - 1.6 g/kg (maintenance)

- Fat → 25% of calories
- Carbs → Remaining calories

Goals are flagged with:

```text
is_custom = false  → Auto-calculated
is_custom = true   → User modified
```

Auto-calculated values never overwrite manual edits.

---

# 🍽 Meal Logging

- Meal types: breakfast / lunch / dinner / snack
- Custom quantity + unit
- Macros: calories, protein, carbs, fat
- Optional micros: fiber, sugar, sodium
- Flexible JSONB micronutrient storage
- Separate `logged_at` date for backfilling
- Full CRUD support

---

# 🤖 AI Nutrition Assistant

- Powered by Groq (Llama 3.3 70B)
- Last 20 messages included as conversational context
- Supports structured action execution:

  ```html
  <action>{ JSON }</action>
  ```

- Can:
  - Log food entries
  - Update goals

- Chat history persisted per user

---

# 📷 Image Analysis

- Upload food image or nutrition label
- Processed via Pillow
- AI returns structured macro estimation
- Form pre-filled automatically

---

# 📄 Bulk Import via PDF

Import exported nutrition diaries (tabular PDFs).

### Features

- Table extraction via `pdfplumber`
- Flexible header alias mapping:
  - calories / kcal / energy
  - carbs / cho / carbohydrates

- Date format detection
- Meal type normalization
- Per-row validation
- Error reporting
- Safe parser isolation (no DB coupling)

Returns:

```json
{
  "imported": 32,
  "failed": 3,
  "errors": [...]
}
```

---

# 📊 Reports & Analytics

- 7 / 14 / 30 day quick selectors
- Daily calorie trend (goal reference line)
- Daily macro breakdown (stacked bars)
- Macro distribution (pie chart)
- Goal vs actual comparison
- Micronutrient summaries
- Fully theme-aware charts

---

# 🌗 Dark / Light Mode

- System preference detection
- Manual toggle (persisted in localStorage)
- Tailwind class-based strategy
- No hydration flash
- Global ThemeContext

---

# 🗂 Project Structure

```
CalTrack/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.py
│   ├── alembic/
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── context/
        ├── pages/
        └── types/
```

---

# 🧱 Data Model Overview

```
users
  height_cm, weight_kg, age, gender, goal_type

goals
  daily_calories, protein_g, carbs_g, fat_g
  is_custom

food_entries
  macros + JSONB micronutrients
  logged_at (DATE)

chat_messages
  role, content
```

---

# 🔌 API Surface

Authentication, Goals, Entries, Reports, AI, Import endpoints fully RESTful and JWT protected.

Health check available at:

```
GET /health
```

---

# ⚙️ Setup

## Prerequisites

- Python 3.11+
- Node 18+
- PostgreSQL 14+

---

## Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 🔐 Environment Variables

```
DATABASE_URL=
SECRET_KEY=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

---

# 🎯 Architectural Principles

- Strict separation of concerns
- Async-first backend
- Service-layer business logic
- Isolated PDF parsing
- Type-safe frontend
- No AI coupling inside database layer
- Clear domain boundaries

---

# 📌 Why CalTrack?

CalTrack is not just a calorie tracker — it is:

- A demonstration of clean async backend architecture
- AI-integrated structured data processing
- A robust import pipeline
- A full JWT-authenticated production-style app
- A strongly typed React + FastAPI stack
