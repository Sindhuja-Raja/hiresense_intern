# Gemini AI Integration - GitHub Profile Analysis

## Overview
HireSense uses **Google Gemini AI** to provide intelligent, context-aware analysis of GitHub developer profiles. Instead of basic metrics, you get AI-generated insights, strengths, and recommendations.

## Why Gemini?
- ✅ **Generous Free Tier**: 15 requests/minute, 1500 requests/day
- ✅ **Fast & Accurate**: Gemini 1.5 Flash optimized for speed
- ✅ **Cost-Effective**: Free tier sufficient for most use cases
- ✅ **Better Insights**: Context-aware analysis vs simple rule-based scoring
- ✅ **Already Integrated**: Same API key used for resume parsing

## Setup

### Your Gemini API Key is Already Configured!
The same API key used for resume parsing now powers GitHub analysis:
```env
GEMINI_API_KEY=AIzaSyBakJnW__De5Bo8eBXWb2jKKQ8FqgT8U_g
```

No additional setup needed! 🎉

## Usage

### With Gemini AI (AI-Powered Analysis)
When `GEMINI_API_KEY` is set:
```
🤖 Generating AI-powered insights with Gemini...
✅ Analysis complete: Activity=75, AI=82, Overall=78

Insights:
- Primary expertise in TypeScript with 15 repositories
- Highly active contributor with consistent commits
- Strong focus on full-stack web development

Strengths:
- Modern JavaScript/TypeScript expert
- Active open-source contributor
- Well-documented code practices

Recommendations:
- Consider contributing to larger open-source projects
- Add more detailed README files to repositories
- Explore emerging technologies like AI/ML
```

### Without Gemini (Basic Analysis)
When key is not set, falls back to rule-based analysis:
```
⚠️  Gemini API not configured. Using basic GitHub analysis.
⚠️  Falling back to basic analysis

Insights:
- Primary expertise in JavaScript
- Active developer with 12 repositories
- Consistently active on GitHub
```

## How It Works

### Architecture
```
1. Fetch GitHub Data (GitHub API)
   ↓
2. Calculate Activity Score (0-100)
   - Repository count
   - Recent commits
   - Stars & followers
   ↓
3. Send to Gemini AI
   - Profile data
   - Top languages
   - Top repositories
   - Recent activity
   ↓
4. Generate AI Insights
   - Overall score (0-100)
   - Key strengths
   - Notable insights
   - Recommendations
   ↓
5. Combine Scores
   Final Score = (Activity Score + AI Score) / 2
```

### Gemini Prompt Structure
```typescript
Analyze this GitHub developer profile:
- Username, name, bio
- Account age, repos, followers
- Top languages with counts
- Top repositories with descriptions
- Recent activity metrics

Provide:
1. Overall Score (0-100)
2. Key Strengths (3-5 points)
3. Key Insights (3-5 points)
4. Recommendations (2-3 points)

Format as JSON: { overallScore, strengths[], insights[], recommendations[] }
```

## API Costs

### Gemini Pricing
- **Free Tier**: 
  - 15 requests per minute (RPM)
  - 1,500 requests per day (RPD)
  - 1 million tokens per minute (TPM)
- **Paid Tier**: Very affordable if you exceed free limits

### Cost Comparison
```
Free tier easily handles:
- 1,500 GitHub analyses per day
- ~45,000 analyses per month
- Perfect for production use!
```

## Model Configuration

Current model: `gemini-1.5-flash`
- Fast responses (optimized for speed)
- High quality analysis
- Large context window
- Free tier available

### Alternative Models
```typescript
// Current (recommended)
model: 'gemini-1.5-flash'

// For highest quality (slower, more expensive)
model: 'gemini-1.5-pro'

// For experimentation
model: 'gemini-1.0-pro'
```

## Testing

### Test GitHub Analysis
1. **Start backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check logs**:
   ```
   ✅ Gemini AI service initialized for GitHub analysis
   ```

3. **Test with frontend**:
   - Go to Applicant Profile
   - Enter GitHub username: `ivipin7` or `octocat`
   - Click "Analyze GitHub Profile"

4. **Watch backend logs**:
   ```
   🔍 Analyzing GitHub profile for: ivipin7
   📡 Fetching GitHub user: ivipin7
   ✅ GitHub user fetched: ivipin7
   📊 Data fetched: 9 repos, 30 events
   🤖 Generating AI-powered insights with Gemini...
   🤖 Requesting Gemini AI analysis for: ivipin7
   ✅ Gemini analysis complete. Score: 82/100
   ✅ Analysis complete: Activity=75, AI=82, Overall=78
   📧 Email sent to user@example.com: GitHub Profile analyzed!
   ```

### Test Without API Key
1. Remove `GEMINI_API_KEY` from .env
2. Analysis will use basic rule-based algorithm
3. Logs: `⚠️  Gemini API not configured. Using basic GitHub analysis.`

## Troubleshooting

### Issue: "Gemini API not configured"
**Solution**: Verify `GEMINI_API_KEY` is set in backend/.env

### Issue: "Gemini API error: 400"
**Solution**: 
- Check API key is correct
- Ensure no extra spaces in .env
- Verify API key is enabled in Google AI Studio

### Issue: "Gemini API error: 429 Too Many Requests"
**Solution**: 
- You've hit the rate limit (15 requests/minute or 1500/day)
- Wait a few minutes
- Free tier limits are generous for most use cases

### Issue: "Empty response from Gemini API"
**Solution**:
- Check internet connection
- Verify Gemini API status
- System automatically falls back to basic analysis

## Security Best Practices

### Protect Your API Key
```bash
# Never commit .env file
echo ".env" >> .gitignore

# Use environment variables in production
export PERPLEXITY_API_KEY=pplx-xxx

# Rotate keys regularly
# Generate new key every 90 days
```

### Rate Limiting (Recommended)
```typescript
// Add to perplexity.service.ts (now gemini service)
private async rateLimit() {
  const key = 'gemini:last_call';
  const minDelay = 4000; // 4 seconds = 15 requests/minute max
  
  const lastCall = await cache.get(key);
  if (lastCall) {
    const elapsed = Date.now() - lastCall;
    if (elapsed < minDelay) {
      await new Promise(r => setTimeout(r, minDelay - elapsed));
    }
  }
  await cache.set(key, Date.now());
}
```

## Production Deployment

### Environment Variables
```bash
# .env.production
GEMINI_API_KEY=your-production-key-here
```

### Monitoring
- Track Gemini AI calls
- Monitor response times
- Log failures for debugging
- Set up alerts for rate limits (15/min, 1500/day)

### Caching Strategy
```typescript
// Cache GitHub analyses for 24 hours
const cacheKey = `github:${username}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const analysis = await analyzeProfile(username);
await cache.set(cacheKey, analysis, 86400); // 24 hours
```

## Support

### Documentation
- Google AI Studio: https://aistudio.google.com/
- Gemini API Docs: https://ai.google.dev/docs
- HireSense Issues: https://github.com/ivipin7/HireSense/issues

---

**Built with 🤖 Google Gemini AI for HireSense Platform**
