# AGENTS.md

## Read Before Anything Else

Read in this exact order before any implementation:

1. context/project-overview.md
2. context/architecture.md
3. context/code-standards.md
4. context/build-plan.md
5. context/progress-tracker.md

## Rules That Never Change

- If the same problem persists after one corrective prompt, stop and reassess the approach.
- Always use `yarn` as the package manager (frontend).
- Always use `go mod` for backend dependencies.
- Never push directly to `main` — always use feature branches and PRs.

## Available Skills

- `/architect` — before any complex feature. Think before building.
- `/review` — before demo or when something feels off.
- `/recover` — when something breaks after one failed correction.
