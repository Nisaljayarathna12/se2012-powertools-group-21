# Contributing to PowerTools

Thank you for contributing to PowerTools! This guide covers how to contribute effectively to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Code Style](#code-style)
- [Testing](#testing)
- [Review Process](#review-process)

## Code of Conduct

- Be respectful and inclusive of all contributors.
- Focus on constructive feedback, not personal criticism.
- Assume good intent in discussions.

## Project Structure

```
se2012-powertools-group-21/
├── api/                          # Spring Boot backend
│   ├── src/main/java/            # Java source files
│   ├── src/main/resources/       # Configuration (application.yaml, Flyway migrations)
│   ├── src/test/                 # Test files
│   └── pom.xml                   # Maven dependencies
├── web/                          # Next.js frontend
│   ├── app/                      # Next.js app directory
│   ├── components/               # React components
│   ├── lib/                      # Utility functions
│   └── package.json              # Node.js dependencies
├── .github/                      # GitHub templates and workflows
└── README.md
```

## Environment Setup

### Backend (`api/`)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your database credentials in `.env` (MySQL is the default; Aiven MySQL is used in production).
3. Build and run:
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

The API runs at `http://localhost:8080` with Swagger UI at `http://localhost:8080/swagger-ui.html`.

### Frontend (`web/`)

1. Copy `.env.example` (if present) and set any required values.
2. Install dependencies and run:
   ```bash
   pnpm install
   pnpm dev
   ```

The frontend runs at `http://localhost:3000`.

## Development Workflow

1. Pick an issue or feature to work on, or create one first.
2. Create a feature branch from the latest `main` (see [Branching Strategy](#branching-strategy)).
3. Make focused, small changes with clear commit messages (see [Commit Guidelines](#commit-guidelines)).
4. Run the relevant tests and linting for the part you changed.
5. Push your branch and open a Pull Request (see [Pull Request Guidelines](#pull-request-guidelines)).
6. Respond to review feedback and keep the branch up to date with `main`.

## Branching Strategy

- `main` — the stable branch. Always deployable.
- Feature branches: `feature/<short-description>`
- Bug fixes: `fix/<short-description>`
- Chores/code quality: `chore/<short-description>`
- Docs: `docs/<short-description>`

Name branches with lowercase, hyphenated words:

```bash
# Good
git checkout -b feature/user-authentication
git checkout -b fix/login-validation
git checkout -b docs/setup-instructions

# Bad
git checkout -b mychanges
git checkout -b feature/My_Changes_Here
```

Always branch from the latest `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) with the following format:

```
<type>(<optional scope>): <description>
```

### Types

| Type    | Purpose                                             | Example                                   |
|---------|-----------------------------------------------------|-------------------------------------------|
| `feat`  | A new feature or significant addition               | `feat: add user authentication endpoints` |
| `fix`   | A bug fix                                           | `fix: correct checkout total calculation` |
| `docs`  | Documentation only changes                          | `docs: update API setup instructions`    |
| `style` | Formatting, whitespace, no code/logic changes       | `style: format application.yaml`          |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor: extract jwt utils`       |
| `perf`  | Performance improvement                            | `perf: cache product lists`               |
| `test`  | Adding or updating tests                           | `test: add case for empty cart`           |
| `build` | Build/config change (Maven, CI, etc.)              | `build: pin spring boot version`          |
| `ci`    | CI configuration changes                           | `ci: add lint job`                        |
| `chore` | Routine tasks, tooling, dependency bumps            | `chore: update prettier config`           |
| `config`| Project/config file changes                        | `config: add maven wrapper properties`    |

### Rules

- Put the whole commit under 50 characters when possible; keep the subject under 72.
- Use imperative mood in the description ("add", "fix", "update"), not past tense.
- Do not include a period at the end of the subject line.
- Add a body (blank line + details) for anything non-obvious, wrapped at 72 columns.
- Reference related issues in the body, e.g. `Closes #42`.

### Examples

```bash
git commit -m "feat: add user authentication endpoints" -m "Adds register, login and token refresh routes for the API module."
git commit -m "fix(web): correct checkout total calculation" -m "Closes #12"
git commit -m "docs: update API setup instructions"
```

## Pull Request Guidelines

### Opening a PR

1. Ensure the branch is up to date with `main`.
2. Open a PR against `main` from your feature branch.
3. Use the PR template if one exists (`.github/pull_request_template.md`).
4. Write a clear title following the commit conventions, e.g. `feat: add user authentication`.
5. Describe in the body:
   - **What** changed and why.
   - **How** it was tested (manual + automated commands run).
   - Any **screenshots** for UI changes.
   - Any **breaking changes** or migration notes.

### PR Checklist

Before requesting review, confirm:

- [ ] Branch is up to date with `main` and has no merge conflicts.
- [ ] Code follows the project's [Code Style](#code-style).
- [ ] Relevant tests pass (see [Testing](#testing)).
- [ ] Lint/typecheck passes for the changed module.
- [ ] No secrets or credentials are committed (`.env` files must never be pushed).
- [ ] New dependencies were added intentionally and are justified.
- [ ] Database migrations are additive and reversible (if changed).

### Keeping a PR Reviewable

- Keep PRs small and focused — one logical change per PR.
- If a PR grows too large, split it into multiple PRs.
- Resolve conflicts by merging `main` into your branch, not the reverse.

## Code Style

### Backend (Java / Spring Boot)

- Follow existing conventions in `com.jayarathna.powertools`.
- Use the provided formatter/config; keep to standard Java conventions.
- Do not add comments that merely restate code.
- Prefer constructor injection and immutable fields.
- Use Flyway migrations over `ddl-auto` for schema changes.

### Frontend (Next.js / TypeScript)

- Read `web/AGENTS.md` — this project uses a specific Next.js version with breaking changes; consult `node_modules/next/dist/docs/` when unsure.
- Run formatters and lint before committing:
  ```bash
  pnpm format
  pnpm lint
  pnpm typecheck
  ```
- Follow the shadcn/ui component conventions already in the repo.

## Testing

### Backend

```bash
cd api
./mvnw test          # run unit/integration tests
./mvnw clean package # full build with tests
```

### Frontend

```bash
cd web
pnpm lint
pnpm typecheck
pnpm build
```

Add tests alongside code changes where feasible, and keep the existing suite green.

## Review Process

- At least one approval is required before merging.
- Address all review comments; request re-review when done.
- Keep the discussion focused on code, not individuals.
- Once approved and CI passes, the PR can be merged (squash merge recommended to keep history clean).