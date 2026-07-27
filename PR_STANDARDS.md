# Pull Request Standards

This document defines the standard PR format for every pull request in the Entrenate.net project.
Follow this template exactly so every PR is consistent, professional, and easy to review.

---

## Title Format

Follows Conventional Commits. Must be under 50 characters to avoid GitHub truncation.

```text
<type>(<scope>): <short description>
```

| Type | When to use |
|------|-------------|
| `feat` | New feature or screen |
| `fix` | Bug fix |
| `chore` | Tooling, config, dependencies |
| `refactor` | Code restructure without behaviour change |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `ci` | CI/CD pipeline changes |
| `perf` | Performance improvements |

**Examples:**
- `feat(workouts): add workout history filtering`
- `fix(auth): resolve Google OAuth redirect loop`
- `ci(coverage): add coverage reporting to CI`
- `refactor(handlers): extract validation logic`
- `docs(readme): update technology stack section`

---

## Description Template

Copy and paste this into the GitHub PR description box every time.

```markdown
## 🚀 What is this PR?

[One paragraph. State what it accomplishes at a high level.]

## 🛠️ Key Changes

- **[Area]:** [What was built or changed and why it matters.]
- **[Area]:** [What was built or changed and why it matters.]
- **[Area]:** [What was built or changed and why it matters.]

## 📸 Screenshot / Output

[Drag and drop a screenshot of the UI here. For non-UI changes (testing, config, backend), paste the terminal output or test results instead.]

## ✅ Checklist

- [ ] Frontend builds successfully (`yarn build`)
- [ ] Frontend tests pass with coverage report (`yarn test:coverage`)
- [ ] Backend tests pass with coverage report (`go test -short -coverprofile=coverage.out ./...`)
- [ ] Conventional Commits applied
- [ ] CodeRabbit review addressed (if applicable)
```

---

## Extended Description (Merge Commit)

When GitHub asks for the Extended Description during the merge, use this bullet format:

```text
- [Area]: [What was done — one line.]
- [Area]: [What was done — one line.]
- [Area]: [What was done — one line.]
```

**Example:**
```text
- CI: GitHub Actions workflow with lint, test, and coverage checks.
- CodeRabbit: Assertive auto-review config on PRs to main.
- Coverage: Coverage reports generated for frontend (Vitest) and backend (Go).
```

---

## Screenshot / Output Guidelines

- For **UI changes** (components, pages, layouts): screenshot of the actual screen running in the browser.
- For **backend/API changes**: relevant curl output or API response.
- For **non-UI changes** (testing, config, CI): paste the terminal output (e.g. test results, coverage report).
- Always drag the image directly into the GitHub description box — no external hosting needed.
- Delete the placeholder text `[Drag and drop...]` before submitting.

---

## Branch Naming

Branches follow the pattern:

```text
<type>/<short-kebab-description>
```

**Examples:**
- `feat/workout-templates`
- `fix/auth-token-refresh`
- `ci/coderabbit-and-coverage`
- `refactor/exercise-handlers`

---


## PR Draft Generation

Whenever a PR is prepared, the AI assistant must generate a local markdown file containing both the **Description Template** and the **Extended Description** for the user to review or copy.
- **Path:** `docs/prs/pr-[number]-[slug].md`
- **Note:** The `docs/prs/` directory is git-ignored, so these drafts won't be pushed.


## PR History Reference

| PR | Branch | Description | Status |
|----|--------|-------------|--------|
| #1 | `feat/coderabbit-and-coverage` | CodeRabbit config, CI pipeline & coverage reporting | ✅ Merged |
| #2 | `docs/project-documentation` | Initial project documentation structure | ✅ Merged |
| #3 | `refactor/workout-history` | Extracted utilities, mock data, and sub-components | ✅ Merged |
| #4 | `refactor/workout-form` | Extract routine box, form schema, subcomponents and hooks | ✅ Merged |
| #5 | `refactor/authenticated-app` | Decompose AuthenticatedApp into hooks and router | ✅ Merged |
| #6 | `feat/update-domain-and-name` | Update domain to entrenate.net and rename project | ✅ Merged |
| #7 | `feat/ui-improvements-and-rebranding` | Improve dashboard layout, finalize rebranding and translate docs | 🔄 Open |

*(Update this table every time a PR is opened or merged.)*
