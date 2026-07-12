# Entrenar App - Refactoring Backlog

This document contains proposed refactorings that are currently lower priority or on hold. If the team decides to tackle them in the future, they can be moved back to the main roadmap.

## Backlog Bottlenecks

1. `AdminNotifications.tsx` (804 lines)
2. `WorkoutHistoryDialogs.tsx` (784 lines)
3. `WorkoutHistory.tsx` (778 lines)

---

### `refactor/workout-history`
**Goal:** Modularize the history screen (`WorkoutHistory.tsx` and `WorkoutHistoryDialogs.tsx`).
- **Calendar/List UI:** Separate the calendar view from the list view into distinct components (`HistoryCalendarView`, `HistoryListView`).
- **Dialogs:** Split `WorkoutHistoryDialogs.tsx` into smaller, atomic modal components (`EditWorkoutModal`, `DeleteConfirmModal`).
- **Hooks:** Extract grouping, filtering, and sorting logic into a `useWorkoutHistory` hook.
- **Estimated Size:** Medium.

### `refactor/admin-panel`
**Goal:** Clean up the admin dashboard components (`AdminNotifications.tsx`).
- **Hooks:** Extract user fetching and notification broadcasting API logic into custom hooks.
- **Components:** Extract data tables (`NotificationHistoryTable`) and forms (`SendNotificationForm`) into standalone UI components.
- **Estimated Size:** Medium.
