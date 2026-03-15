# CLAUDE.md — AI Assistant Guide for train-ovations_crm

This file provides context and conventions for AI assistants (e.g., Claude Code) working in this repository.

---

## Project Overview

**train-ovations_crm** is a Customer Relationship Management (CRM) system. The project is in its initial setup phase — no framework, language, or architecture has been committed yet.

> When the tech stack is chosen and initial code is added, update this file to reflect the actual implementation details.

---

## Repository State (as of initial commit)

- Single commit: `de179e4 Initial commit` by Jamil Kareem (2026-03-13)
- Only file: `README.md` with the project title
- No dependencies, source files, tests, or configuration yet

---

## Git Workflow

### Branch Naming

- Feature branches for Claude: `claude/<description>-<session-id>`
- Push always with: `git push -u origin <branch-name>`
- Never push to `main` or `master` directly

### Commit Style

Use short, imperative commit messages:

```
Add user authentication module
Fix pagination bug in contacts list
Update CLAUDE.md with API conventions
```

### Development Flow

1. Work on the designated feature branch
2. Commit incrementally with descriptive messages
3. Push to the remote feature branch when done
4. Open a pull request targeting `main`

---

## Project Conventions (to be filled in once tech stack is decided)

### Tech Stack

> To be determined. Update this section once a framework and language are chosen.

Common choices for a CRM project include:
- **Backend**: Python (Django/FastAPI), Node.js (Express/NestJS), Ruby on Rails
- **Frontend**: React, Vue, or server-rendered templates
- **Database**: PostgreSQL, MySQL, or SQLite for development
- **ORM**: SQLAlchemy, Prisma, ActiveRecord, etc.

### Directory Structure

> To be defined. Update once the project structure is established.

### Environment Variables

> Document required env vars here when they are added. Provide a `.env.example` file listing all variables with placeholder values (never commit real secrets).

### Running the Project Locally

> Add setup and run instructions here when the stack is defined.

```bash
# Example — replace with actual commands
cp .env.example .env
# fill in .env values
npm install       # or pip install -r requirements.txt
npm run dev       # or python manage.py runserver
```

### Running Tests

> Add test commands here when a test framework is configured.

```bash
# Example — replace with actual commands
npm test          # or pytest
```

### Linting and Formatting

> Add lint/format commands when tooling is configured.

```bash
# Example — replace with actual commands
npm run lint
npm run format
```

---

## Key Patterns and Conventions

> Populate this section as the codebase grows. Include:
> - How models/entities are structured
> - How API routes/controllers are organized
> - How authentication/authorization is handled
> - Error handling conventions
> - Logging conventions
> - Database migration workflow

---

## Important Notes for AI Assistants

1. **Read before editing** — always read a file before modifying it.
2. **Minimal changes** — only change what is required by the task; avoid refactoring unrelated code.
3. **No secrets** — never commit API keys, passwords, or tokens. Use environment variables.
4. **Update this file** — when the tech stack, structure, or conventions are established, update CLAUDE.md to reflect reality.
5. **Test your changes** — run the test suite before committing if tests exist.
6. **Confirm destructive actions** — ask the user before deleting files, dropping database tables, or force-pushing.
