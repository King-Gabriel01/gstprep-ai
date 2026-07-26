# GSTPrep AI

An AI-powered MCQ generation and practice-testing platform for General Studies (GST) courses
at Nigerian tertiary institutions. Lecturers upload their existing course material (PDF);
Gemini reads it and drafts multiple-choice questions; the lecturer reviews and approves them;
students practice against the approved bank and get instant feedback, topic-level analytics,
and can sit formal timed assessments the lecturer schedules.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Node.js + Express
- **Database:** MongoDB (Atlas recommended for deployment)
- **Auth:** JWT + bcrypt, role-based (student / lecturer)
- **AI:** Google Gemini API (free tier) for question generation from extracted PDF text
- **PDF parsing:** pdf-parse

## Project structure

```
gstprep-ai/
  backend/
    src/
      config/        # DB connection
      controllers/    # route handlers
      middleware/    # auth, file upload
      models/        # Mongoose schemas
      routes/        # Express routers
      services/      # PDF extraction, Gemini integration
      utils/         # seed script
      app.js
      server.js
    render.yaml       # Render deployment config
    .env.example
  frontend/
    src/
      components/
      context/        # auth state
      pages/
      services/       # API client
    vercel.json        # Vercel deployment config
    .env.example
```

## 1. Local setup

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local `mongod`, or a free MongoDB Atlas cluster)
- A Google Gemini API key from https://aistudio.google.com/apikey

### Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run seed     # optional: creates a demo lecturer, student, and course
npm run dev      # starts on http://localhost:5000
```

Demo accounts created by `npm run seed`:
- Lecturer: `lecturer@gstprep.demo` / `password123`
- Student: `student@gstprep.demo` / `password123`

### Frontend

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173, proxies /api to localhost:5000
```

Open http://localhost:5173. Log in as the lecturer, upload a PDF under a course's
**Materials** tab, wait for question generation to finish, approve questions in the
**Questions** tab, then log in as the student to practice.

## 2. Getting a MongoDB Atlas connection string (free)

1. Create a free account at https://www.mongodb.com/cloud/atlas/register
2. Create a free (M0) cluster
3. Under **Database Access**, create a user with a password
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) so your deployed
   backend can reach it
5. Click **Connect → Drivers**, copy the connection string, and replace `<password>` with
   your database user's password. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/gstprep?retryWrites=true&w=majority
   ```

## 3. Deployment

### Backend → Render

1. Push this repo to GitHub
2. In Render, **New → Web Service**, connect the repo, set root directory to `backend`
3. Render will detect `render.yaml`. Alternatively set manually:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variables (Render dashboard → Environment):
   - `MONGO_URI` — your Atlas connection string
   - `JWT_SECRET` — any long random string (Render can auto-generate)
   - `GEMINI_API_KEY` — your Google Gemini API key
   - `CLIENT_URL` — your deployed frontend URL (set after step below, then redeploy)
5. Deploy. Confirm `https://<your-service>.onrender.com/api/health` returns `{"status":"ok"}`

### Frontend → Vercel

1. In Vercel, **New Project**, import the repo, set root directory to `frontend`
2. Framework preset: Vite (auto-detected via `vercel.json`)
3. Add environment variable:
   - `VITE_API_URL` = `https://<your-backend>.onrender.com/api`
4. Deploy
5. Go back to Render and set `CLIENT_URL` to your Vercel URL, then redeploy the backend
   (this is required for CORS to allow requests from your frontend)

### Alternative: Railway

Both backend and frontend can also be deployed as two Railway services using the same
build/start commands as above and the same environment variables. Railway auto-detects
Node projects; no extra config file is required.

## 4. How the AI pipeline works

1. Lecturer uploads a PDF via `POST /api/materials/upload`
2. The file is saved and `pdf-parse` extracts raw text (`services/pdfService.js`)
3. Text is cleaned and split into ~3000-character paragraph-aware chunks
4. Each chunk is sent to Gemini with a strict system prompt requiring valid JSON output:
   4 options, one correct answer, an explanation, a topic label, difficulty, and Bloom's
   level (`services/aiService.js`)
5. Responses are validated and de-duplicated, then stored as `Question` documents with
   `approvalStatus: 'pending'`
6. This all happens in the background after the upload request returns, so the UI polls
   `GET /api/materials/:id/status` to show progress
7. Lecturer reviews each question in the **Questions** tab: edit, approve, reject, or bulk
   approve all pending
8. Only `approved` questions are ever served to students, in practice sessions or formal
   assessments

## 5. Core features implemented

**Lecturer**
- Create/manage courses with auto-generated enrolment codes
- Upload PDF course material → automatic AI question generation
- Review workflow: edit, approve, reject, bulk-approve
- Schedule formal timed CBT-style assessments from the approved bank
- Class-wide analytics: average score, active vs inactive students, topic difficulty,
  most-missed questions

**Student**
- Join courses via enrolment code
- Practice mode: pick question count, timed, instant per-question feedback with
  explanations after submission
- Formal assessments: fixed window, no answer review during the attempt, one attempt only
- Personal analytics: score trend, topic-by-topic accuracy, attempt history

**Platform-wide**
- JWT authentication, bcrypt password hashing, role-based route protection
- Rate limiting, Helmet security headers, CORS restricted to the configured frontend origin
- Server-side grading only — correct answers are never sent to the client before submission

## 6. Known limitations / suggested future work

- Question generation runs synchronously in the Node process rather than a dedicated job
  queue (e.g. BullMQ + Redis) — fine for a final-year project demo, but a real production
  system with many concurrent uploads would benefit from a proper queue
- No email verification or password reset flow
- No image/diagram extraction from PDFs — text only
- Assessments currently support one attempt per student with no proctoring features
