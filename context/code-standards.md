# Code Standards

Implementation rules and conventions for the entire project. Follow these in every session without exception.

## Engineering Mindset

- **Think before implementing** — understand what is being built and why before writing code.
- **Read context files first** — never assume, always verify against `architecture.md` and `project-overview.md`.
- **Scope is sacred** — only build what the current feature requires. Never go beyond scope.
- **Every feature must be testable** — if it cannot be verified after implementation, it is incomplete.
- **Clean over clever** — simple readable code is always preferred over clever abstractions.
- **One thing at a time** — complete one feature fully before touching the next.

## Git & CodeRabbit Workflow

1. **Feature Branches:** Create a branch for each feature or fix. Branch naming: `<type>/<short-kebab-description>`.
2. **Commit & Push:** Use Conventional Commits. Push the branch to GitHub.
3. **Pull Request:** Open a PR against `main`. CodeRabbit reviews automatically.
4. **Review & Fix:** Address CodeRabbit feedback, push updates.
5. **Merge:** Only merge when CI passes and review is addressed.

## TypeScript (Frontend)

- Strict mode enabled — no exceptions.
- Avoid `any` — use proper types or `unknown` with narrowing.
- All function parameters and return types should be explicitly typed.
- Use `type` for object shapes — use `interface` only for extendable component props.
- All async functions must have proper error handling.
- Use `const` by default — only use `let` when reassignment is necessary.

## React Conventions

- All components are functional components using hooks.
- Separate business logic from UI using custom hooks or lib functions.
- Never fetch data directly inside components — use `apiClient` from `lib/api.ts`.
- All text visible to users must use the `useLanguage()` hook and `translations` object.
- Wrap components that need context in the appropriate Provider (Language, Auth, UserSettings).

## Go (Backend)

- All handlers follow the pattern: validate input → authenticate → business logic → respond.
- Always extract `user_id` from request context (set by auth middleware).
- Return structured JSON errors with appropriate HTTP status codes.
- Use `fmt.Printf` for debug logging with handler name prefix.
- All DB queries must include `user_id` filter (even with RLS enabled).
- Never expose internal error details to the client.

## File and Folder Naming

- Frontend component files: PascalCase — `WorkoutForm.tsx`, `ExerciseList.tsx`
- Frontend utility/lib files: camelCase — `api.ts`, `supabase.ts`
- Frontend test files: same name as source with `.test.tsx` suffix
- Backend files: snake_case — `workout.go`, `supabase_auth.go`
- One component per file (frontend).

## Testing Standards

- Frontend tests use Vitest + React Testing Library.
- Always wrap components in `LanguageProvider` via the `test-utils.tsx` helper.
- Mock external dependencies (API client, Supabase, contexts).
- Backend tests use Go's built-in testing package.
- Integration tests that require DB are skipped with `-short` flag.
- Run frontend tests: `yarn test` (from frontend/).
- Run backend tests: `go test -short ./...` (from backend/).
