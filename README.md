# AI Powered Habit Tracker (MERN + Google Gemini)

> A production-quality, intelligent full-stack MERN application that helps users build consistent habits, maintain streaks, analyze behavioral patterns with a 90-day consistency heatmap, and receive personalized coaching and 3-day recovery pathways powered by Google Gemini AI.

---

## 🚀 Key Features

### 1. Habit Monitoring & Streak Preservation Engine
- **Flexible Frequencies**: Full support for daily routines or specific weekly schedules (e.g. Mon/Wed/Fri).
- **Streak Logic**:
  - Consecutive scheduled completions preserve streaks.
  - Missed scheduled days break active streaks.
  - Incomplete current day is never penalized prematurely.
  - Automatically recalculates on historical edits, undos, or habit frequency changes.
- **Data Isolation**: Multi-tenant database security where user data is isolated via verified server sessions and indexed compound keys.

### 2. 90-Day Consistency Heatmap & Analytics
- **GitHub-Style Heatmap**: Visualizes the last 90 days with intensity levels (0 to 4), highlighting completed routines, missed days, and overall daily success rates.
- **Performance Reports**: 7-day completion trends, week-over-week momentum delta (+/- %), and automated identification of top performing habits vs habits needing attention.

### 3. Google Gemini AI Behavioral Intelligence
- **AI Habit Suggestions**: Transforms high-level goals (e.g. *"Prepare for marathon"*, *"Reduce procrastination"*) into calibrated habit suggestions with difficulty ratings and science-backed rationales. Requires explicit user approval before saving.
- **Weekly Behavioral Audit**: Combines authoritative server-side metrics with Gemini's qualitative insights (executive summary, behavioral strengths, friction areas, actionable tips).
- **3-Day Streak Recovery Plan**: Designed for setbacks. Generates an achievable 3-step restart runway (Day 1 micro-start, Day 2 ramp-up, Day 3 return to routine) with friction reduction tweaks and non-judgmental support.
- **Natural Language Habit Q&A**: Allows users to ask conversational questions about their actual habit history (*"Which habit am I struggling with most?"*, *"How consistent was I this week?"*).
- **Graceful Resilience Engine**: If `GEMINI_API_KEY` is not provided or quota limits occur, the system automatically falls back to deterministic rule-based algorithms with zero application downtime.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React, date-fns |
| **Backend** | Node.js, Express.js, JWT, bcryptjs, Zod, cors, dotenv |
| **Database** | MongoDB (Atlas / Local) with Mongoose + embedded `mongodb-memory-server` out-of-the-box fallback |
| **AI Integration** | Google Gemini API (`@google/generative-ai` SDK) with backend prompt engineering and fallback engine |
| **Testing** | Node.js Test Runner with strict assertions (17 passing unit & integration tests) |

---

## 📂 Project Architecture

```
ai-habit-tracker/
├── package.json               # Root workspace scripts
├── README.md                  # Comprehensive documentation
├── backend/
│   ├── package.json           # Backend dependencies and test scripts
│   ├── .env.example           # Environment template
│   ├── .env                   # Configuration
│   └── src/
│       ├── server.js          # Express entrypoint & static build server
│       ├── config/
│       │   └── db.js          # Mongoose connection with embedded fallback
│       ├── models/
│       │   ├── User.js        # User model with bcrypt hashing
│       │   ├── Habit.js       # Habit definition with scheduling validation
│       │   ├── HabitCompletion.js # Compound unique index (user, habit, date)
│       │   └── AIInsight.js   # Audit logs & AI reports storage
│       ├── services/
│       │   ├── streakEngine.js      # Streak & consistency calculations
│       │   ├── streakEngine.test.js # Unit test suite (8 cases)
│       │   ├── analyticsService.js  # Dashboard, weekly & heatmap aggregations
│       │   └── geminiService.js     # Gemini AI integration & fallback engine
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── habitController.js
│       │   ├── analyticsController.js
│       │   └── aiController.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── habitRoutes.js
│       │   ├── analyticsRoutes.js
│       │   └── aiRoutes.js
│       ├── middleware/
│       │   ├── auth.js        # JWT verification & request scoping
│       │   ├── validate.js    # Zod schemas for request validation
│       │   └── errorHandler.js# Centralized error handler
│       └── integration.test.js# End-to-end integration tests (9 cases)
└── frontend/
    ├── package.json           # Frontend dependencies
    ├── vite.config.js         # Vite configuration with API proxy
    ├── tailwind.config.js     # Design tokens and custom theme
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx            # Router and auth protection guards
        ├── index.css          # Tailwind directives & styles
        ├── context/
        │   └── AuthContext.jsx# Session management & user state
        ├── services/
        │   └── api.js         # Centralized Axios client with JWT interceptor
        ├── components/
        │   ├── layout/        # Navbar, Sidebar, Layout wrapper
        │   ├── habits/        # HabitFormModal (create/edit)
        │   └── analytics/     # 90-Day interactive Heatmap
        └── pages/
            ├── LandingPage.jsx # Hero, features & CTAs
            ├── LoginPage.jsx   # Auth with quick demo fill
            ├── RegisterPage.jsx# Account creation
            ├── DashboardPage.jsx # Overview, 7-day trend, AI insight
            ├── HabitsPage.jsx  # Management, filters, search, CRUD
            ├── TrackingPage.jsx# Daily checklist & date navigator
            ├── AnalyticsPage.jsx # Metrics, leaderboard & heatmap
            └── AICoachPage.jsx # Suggestions, Weekly report, Recovery, Q&A
```

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Install Dependencies
Run the following from the root directory:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup
In `backend/.env`:
```env
PORT=5000
MONGODB_URI=
JWT_SECRET=super-secure-jwt-secret-at-least-32-chars
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-flash
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```
> **Note on MongoDB**: If `MONGODB_URI` is left blank, the backend automatically uses an embedded `mongodb-memory-server` instance. Zero database setup or cloud account is required to test and evaluate the application out of the box! To persist data to MongoDB Atlas, simply provide your connection string.
>
> **Note on Gemini AI**: If `GEMINI_API_KEY` is not provided, the intelligent fallback engine automatically provides scientifically sound recommendations and calculated analytics so all AI pages remain functional.

### 4. Running the Application

#### Option A: Run Full Stack Simultaneously (Recommended)
You can build the frontend once and run everything from the Express backend:
```bash
# From root
npm run build
npm start
```
The full application will be live at: **http://localhost:5000**

#### Option B: Run in Development Mode with Hot Reloading
Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173 (proxies /api to 5000)
```

---

## 🧪 Testing and Verification

The repository includes 17 automated tests covering streak logic, multi-user isolation, habit management, completion toggling, analytics calculations, and AI endpoints:

```bash
# Run all unit and integration tests from root
npm test
```

### Verified Test Cases:
- ✔ Streak Engine: Empty history, first completion, consecutive days, current-day preservation, missed scheduled day, weekly schedules (Mon/Wed/Fri), longest streak after a gap, undo/correction.
- ✔ Multi-User Data Isolation: Verified that User B cannot read or modify User A's habits or completion logs.
- ✔ Compound Unique Index: Prevents duplicate completion records on the same calendar day.
- ✔ AI Coach Endpoints: Suggestions, Weekly Reports, 3-Day Recovery Plans, and NLP Q&A analysis.

---

## 🔒 Security & Data Integrity
1. **Password Hashing**: Salted bcrypt hashing with 10 rounds prior to database persistence.
2. **Resource Scoping**: Every habit query, completion toggle, and analytics calculation strictly derives `userId` from the verified server-side JWT session (`req.user._id`).
3. **No Duplicate Completions**: Compound unique index `{ user: 1, habit: 1, date: 1 }` prevents race conditions or duplicated completion tallies.
4. **Input Validation**: Schema validation using Zod ensures only permitted fields can be written to the database.
5. **AI Prompt Isolation**: Only anonymized habit titles, completion numbers, and calculated rates are passed to Gemini. No passwords, tokens, or personal credentials are ever exposed.

---

## 🚀 Live Demo Verification Flow
1. Navigate to `http://localhost:5173` (or `http://localhost:5000`).
2. Click **"Sign In"** -> click **"Fill / Quick Demo Account"** (or register a new user).
3. On the **Dashboard**, view active metrics, 7-day trend chart, and today's routines.
4. Click checkmark on any habit to toggle completion -> notice the instant streak increment and heatmap update.
5. Go to **"AI Habit Coach"**:
   - In **Habit Suggestions**: Type *"Improve sleep routine and wake up earlier"* -> click **Generate Habits** -> review recommendations -> click **"Approve & Add Habit"**.
   - In **Weekly Report**: Click **"Run Weekly Report"** to receive an executive behavioral audit.
   - In **3-Day Recovery Plan**: Select a habit to receive an actionable restart runway.
   - In **Ask AI Coach**: Ask *"Which habit am I struggling with most?"* and receive a data-backed response.
6. Open **"Analytics & Heatmap"** to inspect the 90-day activity matrix and habit leaderboard.
