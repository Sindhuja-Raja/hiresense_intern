# Google Gemini API Setup Guide

## Overview

HireSense uses Google Gemini AI for:
- **Resume parsing** - Extract structured data from resumes
- **Candidate evaluation** - AI-powered skill matching and scoring
- **Feedback generation** - Constructive rejection and improvement suggestions
- **GitHub profile analysis** - Repository and contribution assessment

## Multi-Key Setup (Recommended)

To handle high volumes and avoid rate limits, HireSense supports **multiple API keys with automatic rotation and fallback**.

### Rate Limits (Free Tier)

Each Gemini API key has:
- **15 requests per minute**
- **1,500 requests per day**

### Why Multiple Keys?

With 3 API keys:
- ✅ **4,500 requests per day** instead of 1,500
- ✅ Automatic fallback if one key hits rate limits
- ✅ Better load distribution
- ✅ Higher reliability for production workloads

### Setup Multiple Keys

#### Step 1: Get API Keys

1. Visit **Google AI Studio**: https://makersuite.google.com/app/apikey
2. Create **3 API keys** (click "Create API Key" three times)
3. Copy each key

#### Step 2: Configure Environment Variables

**Local Development (backend/.env):**
```env
GEMINI_API_KEY=AIzaSy...your_first_key
GEMINI_API_KEY_2=AIzaSy...your_second_key
GEMINI_API_KEY_3=AIzaSy...your_third_key
```

**Vercel Production:**
1. Go to Vercel → Settings → Environment Variables
2. Add all three keys with the names above
3. Redeploy the project

### How It Works

**1. Time-Based Rotation (Stateless):**
Keys rotate automatically each minute - perfect for serverless environments like Vercel.

**2. Automatic Fallback:**
If a key hits rate limits (429 error), the system automatically tries the next key.

**3. Resilient Design:**
The system has 3 layers:
1. Gemini AI with multi-key rotation
2. Algorithmic scoring fallback (no API needed)
3. User-friendly error messages

---

## Basic Setup (Single Key)

### 1. Get API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

### 2. Enable the Generative Language API

1. Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. Select your project
3. Click **"Enable"**
4. Wait a few minutes for activation

### 3. Update .env File

```env
GEMINI_API_KEY=AIzaSy...your_key
```

### 4. Restart Server

```bash
cd backend
npm run dev
```

---

## Troubleshooting

### Error: "Method doesn't allow unregistered callers"
- **Cause**: Invalid or unconfigured API key
- **Solution**: Generate a new key from Google AI Studio

### Error: "API key not valid"
- **Cause**: Incorrect or expired key
- **Solution**: Create a new key

### Error: "403 Forbidden"
- **Cause**: API not enabled
- **Solution**: Enable Generative Language API in Cloud Console

### Error: "Quota exceeded" / "429 Too Many Requests"
- **Cause**: Rate limit hit
- **Solution**: 
  - Add more API keys (see Multi-Key Setup above)
  - Wait for quota reset (midnight PST)
  - Upgrade to paid tier

### Error: "All Gemini API keys failed"
- **Cause**: All keys exhausted or invalid
- **Solution**:
  - Check all keys are valid
  - System will use algorithmic fallback scoring
  - Wait for quota reset

---

## Testing

### Test API Key
Visit this URL (replace YOUR_KEY):
```
https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY
```

You should see a list of available models.

### Check Logs
Look for these messages:
```
✅ Gemini Client initialized with 3 API keys
✅ Attempting Gemini API call (key 1/3)
✅ API call successful with key 1
```

---

## Security Notes

⚠️ **Never commit .env files to Git!**
- Use `.gitignore` to exclude `.env`
- Rotate keys if accidentally exposed
- Use different keys for dev/staging/production

---

**Last Updated:** December 2024
