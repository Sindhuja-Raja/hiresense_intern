# HireSense - Vercel Deployment Guide

## 🚀 Quick Deploy

This project is optimized for Vercel deployment with separate frontend and backend deployments.

### Prerequisites
- GitHub account with this repository
- Vercel account (free tier works)
- MongoDB Atlas account (free tier works)
- Google Cloud Console account (for OAuth)
- Gemini API keys (free from Google AI Studio)
- Groq API keys (free from Groq Console)

---

## 📦 Deployment Steps

### 1. Backend Deployment

1. **Go to Vercel Dashboard**: https://vercel.com/new
2. **Import Repository**: `ivipin7/HireSense`
3. **Configure**:
   - Root Directory: `backend`
   - Framework: `Other`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables** (copy from backend/.env.example):
   ```
   PORT=5000
   NODE_ENV=production
   VERCEL=1
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=7d
   GEMINI_API_KEY=your_key
   GEMINI_API_KEY_2=your_key
   GEMINI_API_KEY_3=your_key
   GROQ_API_KEY_1=your_key
   GROQ_API_KEY_2=your_key
   GROQ_API_KEY_3=your_key
   GROQ_API_KEY_4=your_key
   GROQ_API_KEY_5=your_key
   GROQ_API_KEY_6=your_key
   GOOGLE_CLIENT_ID=your_id
   GOOGLE_CLIENT_SECRET=your_secret
   GOOGLE_CALLBACK_URL=https://YOUR-BACKEND-URL/api/auth/google/callback
   FRONTEND_URL=https://YOUR-FRONTEND-URL
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=465
   EMAIL_USER=your@email.com
   EMAIL_PASSWORD=your_app_password
   ```

5. **Deploy** and copy your backend URL

### 2. Frontend Deployment

1. **Import Same Repository**: `ivipin7/HireSense`
2. **Configure**:
   - Root Directory: `.` (leave empty)
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables**:
   ```
   VITE_API_URL=https://YOUR-BACKEND-URL
   VITE_GEMINI_API_KEY=your_gemini_key
   ```

4. **Deploy**

### 3. Update Environment Variables

After both deployments, update these in Vercel:

**Backend**:
- `GOOGLE_CALLBACK_URL` = https://your-backend.vercel.app/api/auth/google/callback
- `FRONTEND_URL` = https://your-frontend.vercel.app

Then **redeploy** the backend.

### 4. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add to Authorized redirect URIs:
   ```
   https://your-backend.vercel.app/api/auth/google/callback
   ```

### 5. Configure MongoDB Atlas

1. Go to MongoDB Atlas → Network Access
2. Add Vercel IP ranges or use `0.0.0.0/0` for simplicity

---

## 🔑 Getting API Keys

### MongoDB Atlas (Database)
1. Visit: https://cloud.mongodb.com
2. Create free cluster
3. Create database user
4. Get connection string
5. Replace `<password>` with your password

### Google Gemini (AI)
1. Visit: https://aistudio.google.com/app/apikey
2. Create 3 API keys for rate limiting
3. Copy each key

### Groq API (Virtual Interview)
1. Visit: https://console.groq.com
2. Create 6 API keys
3. Copy each key

### Google OAuth (Social Login)
1. Visit: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add authorized origins and redirect URIs
4. Copy Client ID and Secret

### Gmail (Email Notifications)
1. Enable 2FA: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Copy 16-character password

---

## ✅ Verify Deployment

After deployment, test:
- ✅ Homepage loads
- ✅ Google OAuth login works
- ✅ Job listings load
- ✅ Applications submit successfully
- ✅ Email notifications sent
- ✅ Virtual interview works

---

## 🐛 Troubleshooting

**Build Fails**:
- Check all environment variables are set
- Verify MongoDB connection string
- Check build logs in Vercel

**OAuth Fails**:
- Verify redirect URI in Google Console
- Check GOOGLE_CALLBACK_URL environment variable
- Ensure FRONTEND_URL is correct

**CORS Errors**:
- Update FRONTEND_URL in backend
- Redeploy backend after changing env vars

**Database Connection Fails**:
- Verify MONGODB_URI is correct
- Check Network Access in MongoDB Atlas
- Ensure IP 0.0.0.0/0 is whitelisted

---

## 📝 Local Development

1. Clone repository:
   ```bash
   git clone https://github.com/ivipin7/HireSense.git
   cd HireSense
   ```

2. Setup backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your keys
   npm run dev
   ```

3. Setup frontend (in new terminal):
   ```bash
   cd ..
   npm install
   cp .env.example .env
   # Edit .env with your keys
   npm run dev
   ```

4. Visit: http://localhost:8080

---

## 📚 Documentation

- [Email Setup Guide](backend/EMAIL_SETUP.md)
- [Gemini API Setup](backend/GEMINI_API_SETUP.md)
- [Virtual Interview Guide](VIRTUAL_INTERVIEW_GUIDE.md)

---

## 🎉 Project Features

- ✨ AI-powered resume parsing (Google Gemini)
- 🤖 Virtual AI interviews (Groq API)
- 📧 Automated email notifications
- 🔐 Google OAuth authentication
- 📊 Advanced candidate scoring
- 💼 Talent pool management
- 🔔 Real-time notifications
- 📱 Responsive design

---

**Need help?** Check the troubleshooting guides or create an issue on GitHub.
