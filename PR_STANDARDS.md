# Pull Request Standards

This document defines the standard PR format for every pull request in the Entrenar App project.
Follow this template exactly so every PR is consistent, professional, and easy to review.

---

## Title Format

Follows Conventional Commits. Must be under 50 characters to avoid GitHub truncation.

```
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
- `ci(coverage): enforce 80% unit test threshold`
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
- [ ] Frontend tests pass with ≥80% coverage (`yarn test:coverage`)
- [ ] Backend tests pass with ≥80% coverage (`make test-coverage`)
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
- Coverage: 80% threshold enforced on frontend (Vitest) and backend (Go).
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

```
<type>/<short-kebab-description>
```

**Examples:**
- `feat/workout-templates`
- `fix/auth-token-refresh`
- `ci/coderabbit-and-coverage`
- `refactor/exercise-handlers`

---

## PR History Reference

| PR | Branch | Description | Status |
|----|--------|-------------|--------|
| #1 | `feat/coderabbit-and-coverage` | CodeRabbit config & 80% coverage enforcement | 🟡 Open |

*(Update this table every time a PR is opened or merged.)*
