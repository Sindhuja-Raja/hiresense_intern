# Phase 10: Git Best Practices & Professional History

## Status: ⬜ PENDING

## Objective
Maintain professional git history with clear commit messages, proper branching, and clean code organization.

## Why Professional Git Matters

**Judge Line:** *"Our git history tells the story of systematic engineering."*

**What Judges See:**
1. Commit messages show engineering thought process
2. Branch strategy shows organization
3. Clean history shows professionalism
4. Proper attribution shows teamwork

## Commit Message Strategy

### Format (Conventional Commits)
```
<type>(<scope>): <description>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (no behavior change)
- `perf`: Performance improvement
- `docs`: Documentation
- `test`: Tests
- `chore`: Build, dependencies, tooling
- `style`: Formatting (not CSS)
- `ci`: CI/CD changes

### Examples

#### ✅ Good Commits
```bash
# Feature addition
git commit -m "feat(auth): add JWT authentication with role-based access control

- Implement JWT token generation with 7-day expiry
- Add middleware for token verification
- Add role-based authorization (recruiter/applicant)
- Add refresh token support

Closes #42"

# Refactoring
git commit -m "refactor(database): migrate from MongoDB to PostgreSQL

- Replace Mongoose with Prisma ORM
- Implement repository pattern for data access
- Add transaction support for critical operations
- Migrate all 10 models to SQL schema

BREAKING CHANGE: Database connection string format changed"

# Bug fix
git commit -m "fix(applications): prevent duplicate applications to same job

- Add unique constraint on (applicantId, jobId)
- Add database-level constraint
- Update application service to handle conflict

Fixes #73"

# Performance improvement
git commit -m "perf(matching): optimize job matching algorithm

- Add composite index on (status, created_at)
- Reduce N+1 queries with Prisma include
- Batch score calculations
- Improve response time from 850ms to 120ms"

# Documentation
git commit -m "docs: add PostgreSQL migration guide

- Document all 10 phases of migration
- Include architecture diagrams
- Add judge talking points
- Provide testing checklists"
```

#### ❌ Bad Commits
```bash
# Too vague
git commit -m "fix bug"
git commit -m "update code"
git commit -m "changes"

# Too detailed (should be in PR description)
git commit -m "fix: changed line 42 in auth.controller.ts from === to == and also updated the error message to say 'Invalid credentials' instead of 'Wrong password' and also fixed a typo in the comment"

# No context
git commit -m "wip"
git commit -m "asdf"
git commit -m "done"
```

## Migration Commit Sequence

### Phase 2: Database Redesign
```bash
git add docs/migration/
git commit -m "docs: add PostgreSQL schema design documentation

- Define 10 normalized tables with 3NF
- Create 9 ENUMs for state machines
- Add CHECK constraints for business logic
- Map all MongoDB collections to PostgreSQL tables"
```

### Phase 3: Schema Implementation
```bash
# Step 1: Add Prisma
git add backend/package.json backend/package-lock.json
git commit -m "chore(database): add Prisma ORM dependencies

- Add prisma and @prisma/client
- Add pg driver for PostgreSQL
- Prepare for database migration"

# Step 2: Add schema
git add backend/prisma/schema.prisma
git commit -m "feat(database): add Prisma schema for PostgreSQL

- Define all 10 models (User, Job, Application, etc.)
- Add ENUMs for status fields
- Define relations and foreign keys
- Add indexes for performance"

# Step 3: Generate migration
git add backend/prisma/migrations/
git commit -m "feat(database): add initial PostgreSQL migration

- Create all tables with constraints
- Add ENUMs for type safety
- Add composite indexes
- Add seed data script"
```

### Phase 4: Backend Refactor
```bash
# Step 1: Add repositories
git add backend/src/repositories/
git commit -m "refactor(backend): implement repository pattern

- Create base repository with common CRUD operations
- Implement repositories for all 10 models
- Abstract database operations from business logic
- Improve testability and maintainability"

# Step 2: Update services
git add backend/src/services/
git commit -m "refactor(services): migrate services to use repositories

- Remove direct Mongoose calls
- Use repository methods for data access
- Add transaction support for critical operations
- Improve error handling"

# Step 3: Update controllers
git add backend/src/controllers/
git commit -m "refactor(controllers): simplify controllers using service layer

- Reduce controller code by 50%
- Delegate business logic to services
- Standardize response format
- Improve error handling"

# Step 4: Remove Mongoose
git add backend/src/ backend/package.json
git commit -m "refactor(database): remove MongoDB and Mongoose dependencies

- Remove all Mongoose models
- Remove MongoDB configuration
- Update package.json dependencies
- Delete deprecated database files

BREAKING CHANGE: MongoDB is no longer supported"
```

### Phase 5: Add Transactions
```bash
git add backend/src/services/
git commit -m "feat(transactions): add transaction support for critical workflows

- Wrap application status updates in transactions
- Add atomic interview scheduling
- Implement bulk reject with rollback
- Add profile update transactions

Ensures data consistency for critical operations"
```

### Phase 6: Security
```bash
git add backend/src/middleware/ backend/src/validators/
git commit -m "feat(security): add validation and rate limiting

- Add Zod schemas for input validation
- Implement rate limiting for auth endpoints
- Add CSRF protection
- Configure Helmet security headers"
```

### Phase 7: Docker
```bash
git add docker-compose.yml backend/Dockerfile backend/.dockerignore
git commit -m "chore(docker): add Docker containerization

- Add docker-compose for local development
- Create multi-stage Dockerfile for production
- Add PostgreSQL and Redis services
- Add health checks for all services"
```

## Branch Strategy

### For Hackathon
```bash
main (production)
├── feature/postgres-migration
├── feature/docker-setup
├── feature/validation
└── fix/auth-bug
```

### Workflow
```bash
# Create feature branch
git checkout -b feature/postgres-migration

# Make commits
git add .
git commit -m "feat(database): implement repository pattern"

# Push to remote
git push origin feature/postgres-migration

# Merge to main (after testing)
git checkout main
git merge --no-ff feature/postgres-migration
git push origin main

# Delete feature branch
git branch -d feature/postgres-migration
git push origin --delete feature/postgres-migration
```

## Clean Up History (Before Judging)

### Interactive Rebase
```bash
# Combine last 5 commits
git rebase -i HEAD~5

# Squash commits
pick abc123 feat(database): add Prisma schema
squash def456 fix: correct foreign key
squash ghi789 fix: add missing index
# Result: One clean commit
```

### Amend Last Commit
```bash
# Fix last commit message
git commit --amend -m "feat(database): add Prisma schema with relations"

# Add forgotten files to last commit
git add forgotten-file.ts
git commit --amend --no-edit
```

### Remove Sensitive Data
```bash
# Remove accidentally committed .env
git filter-branch --tree-filter 'rm -f .env' HEAD
# Better: Use BFG Repo-Cleaner
java -jar bfg.jar --delete-files .env
```

## Git Ignore Configuration

**File:** `.gitignore`
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment
.env
.env.local
.env*.local
*.env

# Build outputs
dist/
build/
.next/
out/

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Prisma
node_modules/.prisma/

# Docker
*.pid
```

## Pre-commit Hooks (Optional)

**File:** `.husky/pre-commit`
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linter
npm run lint

# Run tests
npm run test

# Check commit message format
npx commitlint --edit $1
```

**Install:**
```bash
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional
npx husky-init
```

## GitHub Best Practices

### README.md
```markdown
# HireSense - AI-Assisted Hiring Platform

## 🚀 Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Prisma + PostgreSQL
- **AI:** Custom evaluation engine with NLP processing
- **Infrastructure:** Docker + Vercel

## ✨ Key Features
- AI-assisted candidate evaluation
- Automated interview system
- Real-time notifications
- Virtual interview platform
- Blockchain audit logs

## 📊 Architecture
[Architecture diagram here]

## 🔧 Local Development
```bash
# Clone repository
git clone https://github.com/yourusername/hiresense.git
cd hiresense

# Start with Docker
docker-compose up -d

# Open http://localhost:5173
```

## 📈 Migration Story
We started with MongoDB for rapid development, then migrated to PostgreSQL for:
- Transaction support for critical operations
- Better data integrity with constraints
- 3NF normalization for consistency
- 40% performance improvement

Read our [migration guide](docs/MIGRATION_PLAN.md).

## 🏆 Achievements
- [x] End-to-end hiring workflow
- [x] AI-powered candidate screening
- [x] PostgreSQL with transaction support
- [x] Docker containerization
- [x] Production deployment

## 📝 License
MIT
```

### Pull Request Template
**File:** `.github/pull_request_template.md`
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation
- [ ] Performance improvement

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] TypeScript types added
```

## Git Aliases (Speed Up Workflow)

**File:** `~/.gitconfig`
```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    ca = commit --amend
    cm = commit -m
    pl = pull
    ps = push
    lg = log --oneline --graph --decorate --all
    undo = reset --soft HEAD^
    unstage = reset HEAD --
    aliases = config --get-regexp alias
```

**Usage:**
```bash
git st              # git status
git co main         # git checkout main
git cm "feat: ..."  # git commit -m "feat: ..."
git lg              # pretty log graph
git undo            # undo last commit (keep changes)
```

## Commit Message Quality Checklist

- [ ] Uses conventional commit format
- [ ] Type is appropriate (feat/fix/refactor/etc)
- [ ] Subject line < 72 characters
- [ ] Imperative mood ("add feature" not "added feature")
- [ ] Body explains WHY, not WHAT
- [ ] References issue number if applicable
- [ ] No sensitive data in message or diff

## Professional History Example

```bash
$ git log --oneline --graph

* a1b2c3d (HEAD -> main) docs: add complete PostgreSQL migration plan
* b2c3d4e feat(transactions): add atomic operations for critical workflows
* c3d4e5f refactor(controllers): simplify using service layer (50% reduction)
* d4e5f6g refactor(services): migrate to repository pattern
* e5f6g7h feat(database): add Prisma schema with relations
* f6g7h8i chore(database): add Prisma ORM dependencies
* g7h8i9j docs: add PostgreSQL schema design documentation
* h8i9j0k feat(auth): add JWT authentication with RBAC
* i9j0k1l feat(jobs): add job posting and application system
* j0k1l2m chore: initial project setup
```

## Judge Talking Points

> **"Our git history shows systematic engineering, not random hacking."**

**Show:**
- `git log --oneline --graph` (clean history)
- Commit message showing refactoring thought process
- Branch strategy (feature branches)
- Professional README

**Explain:**
- "We use conventional commits to categorize changes"
- "Each commit tells a story - what changed and why"
- "Feature branches keep main stable"
- "We documented the migration process for future reference"

## Final Cleanup Checklist (Before Judging)

- [ ] Remove `console.log` statements
- [ ] Remove commented-out code
- [ ] Remove unused imports
- [ ] Remove `.env` files from git
- [ ] Squash messy commits
- [ ] Update README with latest features
- [ ] Add LICENSE file
- [ ] Add CONTRIBUTING.md (optional)
- [ ] Check all files have proper headers
- [ ] Remove TODO comments or track in issues

## Summary

Professional git practices demonstrate:
1. **Organization:** Clear commit history
2. **Thoughtfulness:** Well-written messages
3. **Discipline:** Consistent workflow
4. **Transparency:** Readable history for judges

**Remember:** Judges look at your git history. Make it professional.
