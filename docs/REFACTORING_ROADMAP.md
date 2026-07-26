# Entrenar App - Refactoring Roadmap

This document outlines the proposed sequence of refactorings to decompose the largest React components in the `frontend` into maintainable, modular files. The changes are grouped into logical Pull Requests (PRs).

## Current Codebase Bottlenecks

The following components are currently monolithic and exceed recommended line limits (some > 1000 lines), mixing UI, business logic, API calls, and state management:

1. `AuthenticatedApp.tsx` (1130 lines)
2. `RoutineList.tsx` (994 lines)
3. `RoutineDetail.tsx` (818 lines)

---

## Proposed PRs & Branches

### PR 5: `refactor/authenticated-app`
**Goal:** Decompose the main application shell and global state management.
- **Extract Data Fetching:** Move `workouts`, `exercises`, and `notifications` polling logic into custom hooks (e.g., `useGlobalData`, `useNotificationsPoller`).
- **Extract Modals:** Ensure `SettingsModal`, `NotificationsModal`, and `AdminPanel` are fully lazy-loaded or decoupled from the main shell.
- **Routing/Layout:** Extract the tab-switching rendering logic into a pure `AppRouter` or `AppLayout` component.
- **Estimated Size:** Medium.

### PR 6: `refactor/routine-list`
**Goal:** Break down the `RoutineList.tsx` component (994 lines).
- **Components:** Extract `RoutineCard`, `RoutineEmptyState`, and `RoutineHeader` into standalone components.
- **Forms/Modals:** Move routine creation dialogs (`CreateRoutineModal`) to separate files.
- **Hooks:** Extract routines list fetching, deleting, and local filtering into a `useRoutineList` hook.
- **Estimated Size:** Medium.

### PR 7: `refactor/routine-detail`
**Goal:** Break down the `RoutineDetail.tsx` component (818 lines).
- **Components:** Extract `ExerciseItem`, `ReorderableExerciseList`, and `RoutineInfoEditor`.
- **Forms/Modals:** Move exercise editing and replacing dialogs (`EditExerciseModal`, `AddExerciseModal`) out of the main detail view.
- **Hooks:** Extract update/save API logic and exercise manipulation logic (reorder, remove) into `useRoutineDetail`.
- **Estimated Size:** Medium.

---

## Execution Rules

1. **One PR = One Scope:** Keep PRs atomic to ensure safe, reviewable changes.
2. **No Behaviour Change:** Refactoring PRs must not alter existing functionality or UX unless explicitly agreed upon.
3. **Types Extraction:** Any shared types discovered during refactoring should be moved to `types/workout.ts` or `types/admin.ts`.
4. **Follow PR Standards:** Each PR must follow the guidelines in `PR_STANDARDS.md` and generate a PR draft.
