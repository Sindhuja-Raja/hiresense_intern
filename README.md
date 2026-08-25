# HireSense AI

[![CI](https://github.com/cubeaisolutionstech/Hiring-Automation/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/cubeaisolutionstech/Hiring-Automation/actions/workflows/ci.yml)

An AI-powered recruitment platform that streamlines hiring for recruiters and job searching for applicants.

## 🚀 Live Demo

- **Frontend**: https://hiresense-gcc.vercel.app
- **Backend API**: https://hire-sense-xi.vercel.app

## ✨ Features

### For Recruiters
- 📝 Post and manage job listings
- 🤖 AI-powered candidate screening
- 📊 Application tracking dashboard
- 📅 Interview scheduling
- 💼 Talent pool management

### For Applicants
- 🔍 Browse and search job listings
- 📄 One-click job applications
- 📈 Application status tracking
- 🎯 AI-powered job recommendations
- 👤 Profile management

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router

### Backend
- Node.js + Express
- MongoDB Atlas
- Google Gemini AI
- Passport.js (OAuth)

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Google Cloud Console account (for OAuth)

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/ivipin7/HireSense.git
cd HireSense

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your VITE_API_URL

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file with required variables:
# - MONGODB_URI
# - JWT_SECRET
# - GEMINI_API_KEY
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - FRONTEND_URL

# Start development server
npm run dev
```

## 🌐 Deployment

Both frontend and backend are deployed on Vercel.

## ✅ Testing And Quality Checks

### Local Commands

Frontend:

- `npm run lint`
- `npm run build`

Backend:

- `npm run lint`
- `npm run build`
- `npm run test:resume-flow`
- `npm run test:auth-profile`

### CI Pipeline

The GitHub Actions workflow in `.github/workflows/ci.yml` runs:

- Backend lint
- Frontend lint
- Backend build
- Backend API integration tests (resume flow + auth/profile flow)
- Frontend build

## 🔒 Branch Protection Recommendations

For `main`, configure a branch protection rule in GitHub with:

- Require a pull request before merging
- Require status checks to pass before merging
- Required checks:
	- Backend Lint
	- Frontend Lint
	- Backend Build and API Tests
	- Frontend Build
- Require branches to be up to date before merging
- Restrict force pushes

This ensures CI is green before merge and prevents broken code from reaching `main`.

## 🚀 Main-Only Deployment Stage (Why It Is Useful)

The `deploy-main` job in CI runs only for `push` events on `main` and only after all quality checks pass.

Benefits:

- Prevents deployments from failing/untested pull request branches
- Guarantees production deploys come from validated code
- Keeps preview/feature branch activity separate from production releases

The job is configured for Vercel and will run when these repository secrets are set:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

If the secrets are not configured, the deploy step is skipped safely.

## 📄 License

MIT License

## 👨‍💻 Author

**Vipin** - [GitHub](https://github.com/ivipin7)
