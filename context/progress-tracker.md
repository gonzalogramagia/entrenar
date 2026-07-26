# Progress Tracker

Living document tracking the completion of Entrenate App's phases as defined in `build-plan.md`.

## Phase 1 — Foundation & Auth

- [x] **01 Project Setup**
  - [x] React + Vite + TypeScript initialized
  - [x] Go backend with net/http + gorilla/mux
  - [x] Supabase project configured (PostgreSQL + Auth)
  - [x] Material UI theming applied
  - [x] Multi-language support (ES/EN) via LanguageContext
  - [x] Responsive mobile-first layout (AppLayout)

- [x] **02 Authentication**
  - [x] Google OAuth via Supabase Auth
  - [x] Guest Mode with mock data (localStorage flag)
  - [x] JWT validation middleware (JWKS)
  - [x] AuthContext with session persistence
  - [x] Auto-redirect and role detection (admin/user)

## Phase 2 — Core Features

- [x] **03 Exercise Library**
  - [x] Exercise list with search and muscle group filter
  - [x] Exercise detail dialog with YouTube embed
  - [x] Admin exercise CRUD
  - [x] Favorite exercise configuration (per-user)

- [x] **04 Workout Logging**
  - [x] WorkoutForm with Autocomplete exercise selector
  - [x] Weight, reps, set number inputs with validation
  - [x] TimerComponent (rest/series modes, auto-start)
  - [x] Date selector (current day + previous month)
  - [x] Auto-create workout day sessions
  - [x] Auto-increment set number

- [x] **05 Workout History**
  - [x] DateCalendar with training day highlights
  - [x] Expandable session cards grouped by date
  - [x] Exercise groups with series detail modal
  - [x] Inline editing (weight, reps, seconds, observations)
  - [x] Delete with confirmation modal
  - [x] Search/filter by date, exercise name, observations

## Phase 3 — Advanced Features

- [x] **06 Custom Routines**
  - [x] Routine CRUD (create, edit, delete)
  - [x] Exercise list with sets/reps/weight/rest configuration
  - [x] Active routine with progress bar
  - [x] Set completion tracking (per exercise, per day)
  - [x] Pre-load exercise into workout form

- [x] **07 Admin Panel**
  - [x] Exercise management (add, edit, delete)
  - [x] User role management
  - [x] Notification broadcasting
  - [x] App settings (favorites configuration)

- [x] **08 Social Features**
  - [x] Social feed (toggleable via user settings)
  - [x] Activity sharing on workout completion

## Phase 4 — Quality & Documentation

- [x] **09 Testing & CI**
  - [x] Fixed all broken frontend unit tests (29/29 passing)
  - [x] Created test-utils.tsx with LanguageProvider wrapper
  - [x] Fixed backend test compilation errors
  - [x] GitHub Actions CI (tests + coverage reports)
  - [x] CodeRabbit integration (.coderabbit.yaml)
  - [x] PR Standards document

- [x] **10 Documentation**
  - [x] README with tech stack, features, and setup
  - [x] AGENTS.md and CLAUDE.md
  - [x] Context folder (project-overview, architecture, code-standards, build-plan, progress-tracker)
  - [x] docs/project-report.md
