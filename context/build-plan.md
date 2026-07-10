# Build Plan

## Core Principle

Features are built incrementally: UI first with mock data, then wired to the backend. Every feature must be visible and testable before moving to the next.

## Testing Principle

- **Frontend components** → unit tests with Vitest + React Testing Library
- **Backend handlers** → Go unit tests (validation logic) + integration tests (with real DB)
- **Coverage reports** generated in CI for visibility

---

## Phase 1 — Foundation & Auth

### 01 Project Setup
- React + Vite + TypeScript frontend
- Go backend with Fiber/net-http
- Supabase project (PostgreSQL + Auth)
- Material UI theming
- Multi-language support (ES/EN)

### 02 Authentication
- Google OAuth via Supabase
- Guest Mode with mock data
- JWT-based API authentication
- Auth middleware (backend)

## Phase 2 — Core Features

### 03 Exercise Library
- Exercise CRUD (admin)
- Search and filter by muscle group
- Exercise detail modal with video
- Favorite exercise configuration

### 04 Workout Logging
- WorkoutForm with exercise selector
- Weight, reps, set tracking
- Timer (rest/series modes)
- Retroactive date selection
- Auto-create workout day sessions

### 05 Workout History
- Calendar view with training day highlights
- Expandable session cards
- Grouped exercises with set details
- Inline editing (weight, reps, observations)
- Delete with confirmation

## Phase 3 — Advanced Features

### 06 Custom Routines
- Routine CRUD
- Exercise list with prescribed sets/reps/weight/rest
- Active routine progress tracking
- Pre-load exercises into workout form

### 07 Admin Panel
- Exercise management
- User role management
- Notification broadcasting
- App settings

### 08 Social Features
- Social feed (optional, toggleable)
- Activity sharing

## Phase 4 — Quality & Documentation

### 09 Testing & CI
- Fix broken unit tests
- Add test utilities (providers, mocks)
- GitHub Actions CI pipeline
- Coverage reporting
- CodeRabbit integration

### 10 Documentation
- README with tech stack and setup
- PR Standards document
- Context files (this folder)
- Project report
