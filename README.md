# 🧠 CareerAI — AI-Powered Career Intelligence Platform

A full-stack web application that acts as an intelligent career coach — analyzing resumes, detecting skill gaps, predicting career paths, and providing real-time AI guidance.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite |
| Backend | FastAPI (Python) |
| Database | MySQL (SQLAlchemy ORM) |
| AI Engine | OpenRouter API (`meta-llama/llama-3.1-8b-instruct:free`) |

---

## Project Structure

```
Spring Board Project/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   └── utils/
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
│
└── frontend/         # React + Vite SPA
    ├── src/
    │   ├── api/
    │   ├── contexts/
    │   ├── components/
    │   └── pages/
    ├── package.json
    └── vite.config.js
```

---

## Setup & Running

### 1. Backend

```bash
cd backend

# Copy and fill in credentials
copy .env.example .env

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python run.py
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend

# Copy env (optional, defaults to localhost:8000)
copy .env.example .env

# Install dependencies (already done)
npm install

# Start dev server
npm run dev
# App available at http://localhost:5173
```

### 3. Database

Create a MySQL database named `career_platform`:

```sql
CREATE DATABASE career_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then add your MySQL credentials to `backend/.env`. The FastAPI backend auto-creates all tables on first startup.

---

## Environment Variables

### `backend/.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=career_platform
DB_USER=root
DB_PASSWORD=your_password

SECRET_KEY=your-jwt-secret-key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
FRONTEND_URL=http://localhost:5173
```

---

## Features

- 📄 **Resume Upload** — PDF/DOCX parsing with AI-powered NLP extraction
- 🎯 **ATS Scoring** — Industry benchmark comparison with breakdown scores
- 🔍 **Skill Gap Analysis** — Prioritized missing skills with learning reasons
- 🚀 **Career Path Prediction** — AI-generated next-step career trajectories
- 💰 **Salary Intelligence** — Role/skills/location-aware salary estimates
- 💼 **Job Recommendations** — AI-curated personalized job listings
- 📚 **Course Recommendations** — Skill-gap-targeted learning resources
- 🤖 **AI Career Coach** — Conversational chatbot with profile context

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login → JWT token |
| GET | `/users/me` | Current user info |
| PUT | `/users/me/profile` | Update profile |
| POST | `/resumes/upload` | Upload + analyze resume |
| GET | `/resumes/` | List resumes |
| GET | `/jobs/recommendations` | AI job matches |
| GET | `/courses/recommendations` | AI course matches |
| POST | `/ai/chat` | Career chatbot |
| POST | `/ai/salary` | Salary prediction |
| GET | `/ai/analyze/{id}` | Re-run resume analysis |
