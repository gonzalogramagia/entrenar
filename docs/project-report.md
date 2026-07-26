# Project Report

**Project Name:** Entrenate App
**Author:** Gonza

---

## 1. Executive Summary

Entrenate App is a multi-language workout logging and tracking application built with a Go backend and React frontend. It provides detailed exercise tracking (weight, reps, sets, time), custom routine management, workout history with calendar visualization, and a complete admin panel. The app supports Guest Mode for exploration and Google OAuth for full access, delivering a premium mobile-optimized web experience.

---

## 2. Project Overview

### 2a. Why we're building this

Tracking workouts consistently requires a tool that's fast, intuitive, and doesn't get in the way. Most existing apps are bloated with features that slow down the core workflow: logging a set. Entrenate App focuses on speed of entry, smart defaults (auto-increment sets, persist exercise/weight between sets), and a clean UI that works perfectly on mobile browsers.

### 2b. Target Audience

Fitness enthusiasts who:
- Want detailed per-set tracking (weight, reps, time) without friction.
- Train with structured routines and want progress visibility.
- Prefer a web app accessible from any device without installing anything.
- Value multi-language support (Spanish primary, English secondary).

---

## 3. Key Features

- **Advanced Workout Logging** — Per-set tracking with weight, reps, timer, observations, and retroactive date support.
- **Custom Routines** — Create templates with prescribed exercises, sets, reps, and rest times. Track completion in real-time.
- **Workout History** — Calendar view with expandable daily sessions, inline editing, search/filter, and delete functionality.
- **Exercise Library** — Full catalog with muscle group filtering, YouTube tutorials, and admin-managed favorites.
- **Guest Mode** — Full app preview with mock data, no account required.
- **Multi-language** — Complete Spanish and English support with URL-based language detection.
- **Admin Panel** — Exercise CRUD, user management, notifications, and app settings.
- **Timer System** — Auto-starting rest/series timers with captured time logging.
- **Social Feed** — Optional activity sharing (toggleable per user).

---

## 4. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| UI Library | Material UI (MUI) 7 |
| State Management | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Auth & Database | Supabase (PostgreSQL + Google OAuth + RLS) |
| Backend | Go (net/http + gorilla/mux) |
| Package Manager | Yarn (frontend), Go Modules (backend) |
| Testing | Vitest + React Testing Library (frontend), Go testing (backend) |
| CI/CD | GitHub Actions |
| Code Review | CodeRabbit (assertive auto-review) |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |

---

## 5. Technical Architecture

```
┌──────────────────────────────────────────────┐
│           Frontend (Vercel)                    │
│  React + Vite + TypeScript                    │
│  Material UI + React Hook Form + Zod          │
│  Supabase Client (Auth sessions only)         │
└──────────────────┬───────────────────────────┘
                   │ REST API (JWT auth)
                   ▼
┌──────────────────────────────────────────────┐
│           Backend (Railway)                    │
│  Go (net/http + gorilla/mux)                  │
│  ├── /api/workouts (CRUD)                     │
│  ├── /api/workout-days (CRUD)                 │
│  ├── /api/exercises (CRUD)                    │
│  ├── /api/routines (CRUD)                     │
│  ├── /api/users (management)                  │
│  ├── /api/notifications (broadcast)           │
│  └── /api/health (status check)              │
│  Middleware: JWT validation via JWKS           │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│        Supabase (Managed)                     │
│  PostgreSQL + Row Level Security              │
│  Google OAuth Provider                        │
│  Realtime (optional)                          │
└──────────────────────────────────────────────┘
```

**Data Flow:** User interaction → Frontend form → API client (JWT in header) → Go backend validates JWT via JWKS → Handler validates input → DB query (user-scoped) → JSON response → Frontend updates UI.

---

## 6. Testing

### Frontend (29/29 tests passing)

| Test File | Tests | Status |
|-----------|-------|--------|
| AuthContext.test.tsx | 2 | ✅ |
| TimerComponent.test.tsx | 7 | ✅ |
| Navigation.test.tsx | 4 | ✅ |
| ExerciseList.test.tsx | 6 | ✅ |
| AppLayout.test.tsx | 3 | ✅ |
| WorkoutForm.test.tsx | 4 | ✅ |
| WorkoutHistory.test.tsx | 3 | ✅ |

### Backend (all passing with `-short`)

| Test File | Tests | Status |
|-----------|-------|--------|
| health_test.go | 1 | ✅ |
| workouts_test.go | 6 | ✅ |
| integration_test.go | 3 (skipped) | ✅ |
| supabase_integration_test.go | 4 (skipped) | ✅ |

---

## 7. Security

- **Supabase Auth** — Google OAuth with secure session management.
- **JWT Validation** — Backend validates every request via Supabase JWKS endpoint.
- **Row Level Security** — Database-level access control on all tables.
- **User-scoped Queries** — All handlers enforce user_id filtering (defense in depth).
- **Input Validation** — Request bodies validated before processing (weight limits, reps limits, etc.).
- **No Exposed Secrets** — API keys in environment variables only.
- **CORS** — Configured for known frontend origins only.
- **Persist-credentials: false** — CI checkout doesn't persist GitHub tokens.

---

## 8. Future Improvements

- **Push notifications** for routine reminders.
- **Progressive Web App (PWA)** for offline access and install prompt.
- **Exercise progression tracking** (weight/volume over time charts).
- **Workout templates** shared between users.
- **AI-powered** exercise recommendations based on history.
- **Export** workout data as CSV/PDF.

---

## 9. Tools Used

| Tool | Purpose |
|------|---------|
| Kiro | Primary development environment |
| CodeRabbit | Automated AI code review on every PR |
| Supabase | Managed PostgreSQL + Auth + RLS |
| Vercel | Frontend hosting (static export) |
| Railway | Backend hosting (Go server) |
| GitHub Actions | CI pipeline (tests + coverage) |

---

## 10. Learnings & Takeaways

- **Go + gorilla/mux** provides excellent performance for REST APIs with minimal boilerplate — handler functions are straightforward and easy to test.
- **Material UI** accelerates frontend development significantly but requires careful theming to avoid generic-looking UIs.
- **Vitest + React Testing Library** is the ideal modern testing stack — fast, with good DX and excellent TypeScript support.
- **CodeRabbit** catches real issues (security, test quality, code style) that manual review might miss in a solo project.
- **Guest Mode** is invaluable for demos and onboarding — users can evaluate the full experience before committing to an account.
- **Multi-language from day one** is much easier than retrofitting — the `useLanguage()` + translations pattern scales well.
