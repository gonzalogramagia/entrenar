# Architecture

## Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Frontend Framework | React + Vite + TypeScript | Fast SPA with hot reload |
| UI Library | Material UI (MUI) | Component system, theming, responsive design |
| State Management | TanStack Query (React Query) | Server state, caching, background refetch |
| Forms | React Hook Form + Zod | Form handling with schema validation |
| Auth & Database | Supabase | PostgreSQL, Google OAuth, Row Level Security |
| Backend | Go (net/http + gorilla/mux) | High-performance REST API |
| Package Manager | Yarn (frontend), Go Modules (backend) |
| Testing | Vitest + React Testing Library (frontend), Go testing (backend) |
| CI/CD | GitHub Actions | Tests, coverage reports |
| Code Review | CodeRabbit | Automated AI PR reviews |
| Hosting | Vercel (frontend), Railway (backend) |

---

## Folder Structure

```text
/
├── AGENTS.md
├── CLAUDE.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── code-standards.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── docs/
│   └── project-report.md
├── frontend/
│   ├── src/
│   │   ├── components/       → UI components (grouped by domain)
│   │   ├── contexts/         → React Context providers (Auth, Language, UserSettings)
│   │   ├── hooks/            → Custom React hooks
│   │   ├── i18n/             → Translation strings (ES/EN)
│   │   ├── lib/              → API client, Supabase client, utilities
│   │   ├── constants/        → App-wide constants (tabs, etc.)
│   │   ├── types/            → TypeScript type definitions
│   │   ├── pages/            → Standalone page components
│   │   ├── test/             → Test utilities and setup
│   │   ├── App.tsx           → Root component
│   │   └── main.tsx          → Entry point
│   ├── vite.config.ts        → Vite + Vitest configuration
│   └── package.json
├── backend/
│   ├── main.go               → Server entry point, route registration
│   ├── handlers/             → HTTP handlers (workouts, exercises, auth, admin, etc.)
│   ├── middleware/           → Auth middleware (Supabase JWT, JWKS, logging)
│   ├── models/               → Data models / request types
│   ├── database/             → DB connection management
│   ├── testutils/            → Test helpers and DB setup
│   ├── go.mod
│   └── Makefile
├── .github/workflows/ci.yml  → CI pipeline
├── .coderabbit.yaml          → CodeRabbit configuration
├── PR_STANDARDS.md           → PR format guidelines
└── README.md
```

---

## System Boundaries

| Folder | Owns |
|--------|------|
| `frontend/src/components/` | UI rendering only. No direct API calls (use hooks/lib). |
| `frontend/src/contexts/` | Global state providers (auth, language, settings). |
| `frontend/src/lib/` | API client, Supabase initialization, shared utilities. |
| `frontend/src/hooks/` | Custom hooks for data fetching and state logic. |
| `backend/handlers/` | HTTP handlers — parse request, validate, call DB, return response. |
| `backend/middleware/` | Cross-cutting concerns (auth, logging). |
| `backend/models/` | Struct definitions for requests and DB rows. |

---

## Data Flow: Workout Logging

```
User fills WorkoutForm → selects exercise, enters weight/reps/set
  ↓
Form submits to apiClient.createWorkout()
  ↓
POST /api/workouts (with JWT in Authorization header)
  ↓
Backend middleware validates Supabase JWT → extracts user_id
  ↓
CreateWorkoutHandler validates input, finds/creates workout_day
  ↓
INSERT into workouts table (scoped to user_id)
  ↓
Response with created workout JSON
  ↓
Frontend updates UI (success toast, form persists for next set)
```

---

## Data Flow: Authentication

```
User clicks "Login with Google"
  ↓
Supabase Auth redirects to Google OAuth
  ↓
On success, Supabase returns session + JWT
  ↓
Frontend stores session via Supabase client
  ↓
All API requests include JWT in Authorization header
  ↓
Backend middleware validates JWT via JWKS endpoint
  ↓
user_id extracted from JWT claims and injected into request context
```

---

## Invariants

Rules that must never be violated:

- Frontend components never make direct Supabase DB queries — always go through the Go backend API.
- Backend handlers always validate user_id from JWT context — never trust client-provided user IDs.
- All DB queries are scoped to the authenticated user_id (defense in depth alongside RLS).
- No hardcoded API URLs — always use environment variables.
- Guest mode uses mock data exclusively — never writes to the real database.
- Translations always use the `useLanguage()` hook — never hardcode Spanish or English strings in components.
- Forms always validate with Zod schemas before submission.
