# GSTPrep AI

A web-based AI learning and assessment system for GST (General Studies) courses.
Lecturers upload PDF course materials; the system extracts the text, generates
multiple-choice practice questions with an LLM, and lets lecturers review/approve
them before students practice against them. Students get instant scoring,
explanations, and a personal performance history. Lecturers get class-wide analytics.

Stack: **React (Vite) + Tailwind** frontend · **Node.js/Express** backend · **MongoDB** database · **OpenAI API** for question generation.

## Project structure

```
gstprep-ai/
├── backend/     Express API, MongoDB models, AI integration
└── frontend/    React SPA (Vite)
```

## Quick start

See the full PDF guide for step-by-step setup including MongoDB Atlas,
OpenAI API keys, and deployment. Short version:

```bash
# 1. Backend
cd backend
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, OPENAI_API_KEY
npm install
npm run dev                # http://localhost:5000

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Register as a lecturer, create a course, upload a PDF, generate questions,
approve them, then register a second account as a student to enroll and
take a practice test.
