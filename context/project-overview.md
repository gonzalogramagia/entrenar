# Project Overview: Entrenar App

## About the Project

Entrenar App is a comprehensive, multi-language workout logging and tracking application designed for a premium training experience. It serves as a digital partner for tracking progress and managing routines, providing a professional trial through Guest Mode and full interactive features for registered users.

---

## Core User Flow

### 1. Authentication
- User logs in via Google OAuth (powered by Supabase).
- Alternatively, user explores the app in Guest Mode with mock data before committing to an account.

### 2. Workout Logging (Main Feature)
- User selects an exercise from their personalized library (filtered by favorites).
- User enters weight, reps, set number, and optional observations.
- Timer runs automatically for rest/series tracking.
- Workout is saved to the user's daily session with date selection support.

### 3. Workout History & Tracking
- Calendar view highlights training days.
- Expandable cards show grouped exercises per session.
- Inline editing of weight, reps, seconds, and observations.
- Delete confirmation with safety modal.

### 4. Custom Routines
- Users create personalized routines with exercise lists, sets, reps, weight, and rest times.
- Active routine displays progress bar and completed sets tracker.
- Pre-loads exercise data into the workout form.

### 5. Exercise Library
- Full exercise catalog with search and muscle group filtering.
- Exercise detail modal with YouTube video embed.
- Admin-configurable favorite exercise lists.

### 6. Admin Panel
- Manage exercises (CRUD).
- Manage user roles and permissions.
- Broadcast notifications to all users.
- Configure app settings.

---

## Data Architecture

### Users & Auth
- Managed by Supabase Auth with Google OAuth.
- User roles (user, admin) stored server-side.

### Workout Days
- Groups workouts by date.
- Contains session name, effort (1-10), and mood (1-10).

### Workouts
- Individual exercise entries linked to a workout day.
- Tracks: exercise_id, weight, reps, set, seconds, observations.

### Exercises
- Master exercise catalog managed by admins.
- Contains: name, muscle_group, primary/secondary muscles, video_url.

### Routines
- User-created workout templates.
- Contains ordered exercise list with prescribed sets, reps, weight, and rest times.

---

## Features In Scope

- Multi-language support (Spanish & English).
- Guest Mode with mock data.
- Advanced workout logging with retroactive date support.
- Custom routines with progress tracking.
- Exercise library with filtering and video tutorials.
- Admin panel for exercise/user/notification management.
- Social feed (optional, toggleable).
- Google OAuth authentication.
- Timer with rest/series modes.

## Features Out of Scope

- Native mobile app (web-first approach).
- Payment or subscription systems.
- AI-powered features.
- Push notifications (web only, uses in-app notifications).
- Real-time collaboration.

---

## Target User

A fitness enthusiast who:
- Wants detailed tracking of their workout sessions (weight, reps, sets, time).
- Prefers a clean, mobile-optimized web interface.
- Wants to organize their training with custom routines.
- Values multi-language support (Spanish primary, English secondary).
- Appreciates a premium UI/UX experience.

---

## Success Criteria

- User can log a complete workout session in under 2 minutes.
- Guest mode provides a full preview of app capabilities with mock data.
- Workout history is searchable and filterable by date, exercise, and observations.
- Custom routines track progress visually with set completion indicators.
- Admin can manage exercises and users without direct DB access.
- App is fully responsive and optimized for mobile viewports.
