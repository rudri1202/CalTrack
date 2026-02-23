# CalTrack

A full-stack personal calorie and nutrition tracker with AI-powered meal analysis, goal automation, and analytics.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI 0.111 |
| Database | PostgreSQL (async via asyncpg) |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Auth | JWT — access tokens (30 min) + refresh tokens (7 days) via python-jose |
| Password hashing | bcrypt |
| AI / LLM | Groq API — Llama 3.3 70B Versatile |
| Image analysis | Pillow |
| PDF parsing | pdfplumber |
| Validation | Pydantic v2 |
| Server | Uvicorn |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS (dark mode — class strategy) |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| HTTP client | Axios (with auto token-refresh interceptor) |
| Icons | Lucide React |

---

## Features

### Authentication
- Email + password registration and login
- JWT access / refresh token pair with silent auto-refresh on 401
- Protected routes — unauthenticated users are redirected to `/login`

### Profile-Based Goal Calculation
- During registration, optionally provide height, weight, age, gender, and goal type (bulking / cutting / maintenance)
- BMR calculated with the **Mifflin-St Jeor formula**, scaled by a moderate activity multiplier (×1.55) to get TDEE
- Calorie targets: TDEE + 300 kcal (bulking), TDEE − 500 kcal (cutting), TDEE (maintenance)
- Macros auto-set: protein 2.0 g/kg (body-comp goals) or 1.6 g/kg (maintenance), 25% calories from fat, remainder from carbs
- Goals marked `is_custom = false` until the user manually edits them — auto-calculation never overwrites custom values
- Goals page shows an **Auto-calculated** or **Custom** badge

### Meal Logging
- Log food entries with meal type (breakfast / lunch / dinner / snack), date, quantity, and unit
- Macros: calories, protein, carbs, fat
- Optional micros: fiber, sugar, sodium
- Arbitrary micronutrients stored as JSONB for flexibility
- `logged_at` is a separate `DATE` field from `created_at`, allowing backfilling of past entries
- Edit and delete existing entries

### AI Nutrition Assistant (Chat)
- Conversational interface powered by Groq (Llama 3.3 70B)
- Last 20 messages sent as context on every request
- AI can take inline actions (log food, update goals) via `<action>JSON</action>` tags embedded in responses
- Chat history persisted per user

### Image Upload & Analysis
- Upload a photo of food or a nutrition label
- Pillow processes the image; AI returns structured nutrition estimates
- Pre-fills the meal entry form with the analysed values

### Bulk Import via PDF
- Upload any exported nutrition diary PDF containing a tabular layout
- `pdfplumber` extracts tables and auto-detects column headers using alias mapping (handles variations like "cal", "kcal", "energy", "carbohydrates", "cho", etc.)
- Supports multiple date formats, meal type normalisation, and per-row validation
- Returns a results summary: entries imported, rows skipped, and per-row error details
- Parsing logic is fully isolated from the database — safe to test independently

### Reports & Analytics
- Date-range selector with 7 / 14 / 30-day quick buttons
- **Daily Calorie Trend** — line chart with goal reference line
- **Daily Macronutrients** — stacked bar chart (protein / carbs / fat)
- **Macro Distribution** — pie chart with period totals
- **Goal vs Actual** — grouped bar chart comparing target vs logged calories
- **Micronutrient Summary** — fiber, sugar, sodium totals + JSONB micronutrients
- All chart tooltips and axes are theme-aware

### Dark / Light Mode
- System preference detected on first load via `prefers-color-scheme`
- Manual toggle (Sun / Moon) persisted to `localStorage`
- Tailwind `dark:` class strategy applied across every page and component

---

## Project Structure

```
CalTrack/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration
│   │   ├── config.py            # Pydantic settings from .env
│   │   ├── database.py          # Async engine, session factory, Base
│   │   ├── dependencies.py      # JWT bearer dependency
│   │   ├── models/
│   │   │   ├── user.py          # User — email, password hash, profile fields
│   │   │   ├── goal.py          # Goal — calorie/macro targets, is_custom flag
│   │   │   ├── food_entry.py    # FoodEntry — meal logs with macros + JSONB micros
│   │   │   └── chat_message.py  # ChatMessage — AI conversation history
│   │   ├── routers/
│   │   │   ├── auth.py          # POST /register /login /refresh  GET /me
│   │   │   ├── goals.py         # GET PUT /goals
│   │   │   ├── entries.py       # CRUD /entries
│   │   │   ├── reports.py       # GET /reports/*
│   │   │   ├── ai.py            # POST /ai/chat  POST /ai/analyze-image
│   │   │   └── import_router.py # POST /import/pdf
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── auth_service.py  # Register, login, token refresh
│   │   │   ├── ai_service.py    # Groq chat, action parsing, image analysis
│   │   │   ├── entry_service.py # Food entry business logic
│   │   │   ├── report_service.py
│   │   │   └── pdf_import_service.py  # Isolated PDF parse → (entries, errors)
│   │   └── utils/
│   │       ├── security.py      # JWT encode/decode, password hashing
│   │       ├── nutrition.py     # Mifflin-St Jeor BMR/TDEE/macro calculator
│   │       └── pagination.py
│   ├── alembic/
│   │   └── versions/
│   │       ├── 001_initial_schema.py
│   │       └── 002_add_profile_and_custom_goal.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/                 # Axios wrappers (auth, goals, entries, reports, ai, import)
        ├── components/          # Layout, Navbar, FoodEntryCard, MealEntryForm, GoalForm
        ├── context/             # AuthContext, ThemeContext
        ├── pages/               # Dashboard, MealLog, Goals, Reports, Chat, ImageUpload, ImportPage
        └── types/               # Shared TypeScript interfaces
```

---

## Data Model

```
users
  id, email, password_hash, name
  height_cm, weight_kg, age, gender, goal_type   ← profile fields
  created_at, updated_at

goals  (1:1 with users)
  id, user_id
  daily_calories, protein_g, carbs_g, fat_g, weight_goal_kg
  is_custom                                       ← false = auto-calculated
  created_at, updated_at

food_entries  (N:1 with users)
  id, user_id, meal_type, food_name
  quantity, quantity_unit
  calories, protein_g, carbs_g, fat_g
  fiber_g, sugar_g, sodium_mg                     ← optional micros
  micronutrients (JSONB)                          ← flexible extra nutrients
  image_url, logged_at (DATE), created_at

chat_messages  (N:1 with users)
  id, user_id, role (user|assistant), content, created_at
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account, returns token pair |
| POST | `/api/auth/login` | — | Authenticate, returns token pair |
| POST | `/api/auth/refresh` | — | Exchange refresh token |
| GET | `/api/auth/me` | ✓ | Current user profile |
| GET | `/api/goals/` | ✓ | Fetch goals |
| PUT | `/api/goals/` | ✓ | Upsert goals (sets is_custom=true) |
| GET | `/api/entries/` | ✓ | List food entries (paginated) |
| POST | `/api/entries/` | ✓ | Log a food entry |
| PUT | `/api/entries/{id}` | ✓ | Update entry |
| DELETE | `/api/entries/{id}` | ✓ | Delete entry |
| GET | `/api/reports/weekly-calories` | ✓ | Daily calorie trend |
| GET | `/api/reports/macro-breakdown` | ✓ | Daily macro breakdown |
| GET | `/api/reports/micro-summary` | ✓ | Micronutrient totals |
| GET | `/api/reports/goal-comparison` | ✓ | Goal vs actual |
| POST | `/api/ai/chat` | ✓ | Send message to AI assistant |
| POST | `/api/ai/analyze-image` | ✓ | Analyse food photo |
| POST | `/api/import/pdf` | ✓ | Bulk import from PDF |
| GET | `/health` | — | Liveness probe |

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env          # then edit .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                   # starts on http://localhost:5173
```

### Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/caltrack
SECRET_KEY=your-secret-key-here
GROQ_API_KEY=your-groq-api-key        # required for AI chat and image analysis
GROQ_MODEL=llama-3.3-70b-versatile    # optional, this is the default
```

---

## PDF Import Format

The import feature expects a PDF with a table containing at minimum:

| Column | Accepted header variants |
|---|---|
| Food name | food, food name, item, name, description |
| Calories | calories, cal, kcal, energy |
| Date *(optional)* | date, day, logged_at |
| Meal type *(optional)* | meal, meal type, type |
| Protein *(optional)* | protein, protein (g), prot |
| Carbs *(optional)* | carbs, carbohydrates, cho |
| Fat *(optional)* | fat, fat (g), lipids |

Rows with missing food name or unparseable calories are skipped and reported in the error list. All other rows are imported.
