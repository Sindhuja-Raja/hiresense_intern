# HireSense Backend API

Backend server for HireSense AI - GCC Hiring Automation Platform

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **AI Integration**: OpenAI API, GitHub API

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Fill in the required environment variables:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://your_connection_string
JWT_SECRET=your_super_secret_key
OPENAI_API_KEY=sk-your-openai-key
```

### 3. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and add it to `.env`

### 4. Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### 5. Test the API

```bash
# Health check
curl http://localhost:5000/health
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user

### Recruiter
- `GET /api/recruiter/profile` - Get recruiter profile
- `PUT /api/recruiter/profile` - Update recruiter profile

### Applicant
- `GET /api/applicant/profile` - Get applicant profile
- `PUT /api/applicant/profile` - Update applicant profile
- `POST /api/applicant/upload-resume` - Upload resume (Phase 5)

### Jobs
- `POST /api/jobs` - Create job (recruiter only)
- `GET /api/jobs` - List jobs
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job (recruiter only)
- `DELETE /api/jobs/:id` - Delete job (recruiter only)

### Applications
- `POST /api/applications` - Apply for job (applicant only)
- `GET /api/applications/my-applications` - Get my applications (applicant)
- `GET /api/applications/job/:jobId` - Get applications for job (recruiter)
- `PUT /api/applications/:id/status` - Update application status (recruiter)
- `POST /api/applications/:id/schedule-interview` - Schedule interview (recruiter)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts         # MongoDB connection
│   ├── models/
│   │   ├── User.model.ts       # User schema
│   │   ├── RecruiterProfile.model.ts
│   │   ├── ApplicantProfile.model.ts
│   │   ├── Job.model.ts
│   │   ├── Application.model.ts
│   │   └── Interview.model.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── recruiter.controller.ts
│   │   ├── applicant.controller.ts
│   │   ├── job.controller.ts
│   │   └── application.controller.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── recruiter.routes.ts
│   │   ├── applicant.routes.ts
│   │   ├── job.routes.ts
│   │   └── application.routes.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT authentication
│   │   └── errorHandler.ts      # Global error handler
│   └── server.ts                # Express app setup
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Development Workflow

1. Make changes to TypeScript files in `src/`
2. Server auto-reloads with nodemon
3. Test endpoints using Postman/Thunder Client
4. Check MongoDB Atlas for data persistence

## Next Steps (Phase 2-5)

- [ ] Test authentication flow
- [ ] Implement resume upload with Cloudinary
- [ ] Add AI evaluation service (Phase 5)
- [ ] Integrate GitHub API for activity analysis
- [ ] Add email notifications (Phase 6)

## Deployment

Backend can be deployed to:
- Railway
- Render
- Heroku
- Vercel (with serverless functions)

Frontend deployment on Vercel will connect to this API.
