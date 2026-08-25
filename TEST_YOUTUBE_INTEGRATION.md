# YouTube Integration Test Guide

## ✅ Build Status
- **Backend**: Compiled successfully ✅
- **Frontend**: Built successfully ✅

---

## 🧪 Testing Steps

### Prerequisites
```bash
# Make sure MongoDB is running
# Make sure you have at least one recruiter and one applicant account
```

### Step 1: Start Development Servers

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

**Expected output:**
```
Server is running on port 5000
MongoDB connected successfully
```

#### Terminal 2 - Frontend
```bash
# From project root
npm run dev
```

**Expected output:**
```
VITE v5.4.19  ready in XXX ms
➜  Local:   http://localhost:8081/
```

---

### Step 2: Clear Existing Data (Optional - Fresh Test)

Open MongoDB Compass or mongo shell:

```javascript
// Connect to: mongodb://localhost:27017/hiresense

// Clear cached skill modules
db.skillmodules.deleteMany({})

// Clear learning paths
db.learningpaths.deleteMany({})

// Result: You should see deleted count
```

**Why?** This ensures you're testing the YouTube scraper from scratch.

---

### Step 3: Create Test Application (if needed)

1. Login as **applicant** → http://localhost:8081/login
2. Go to **Jobs** → Apply to any job with cover letter
3. Wait for AI to process application (~10 seconds)
4. Logout

---

### Step 4: Trigger Learning Path Generation

1. Login as **recruiter** → http://localhost:8081/login
2. Go to **Applications**
3. Find the test application you created
4. Click "**View Details**"
5. Change status to "**Rejected**"
6. Confirm rejection

**⏱️ Expected timing:** 15-30 seconds (first time with no cache)

---

### Step 5: Monitor Backend Logs

Watch Terminal 1 (backend) for these logs:

```
📚 Identified 2 skills to learn: [ 'react', 'nodejs' ]
❌ Cache MISS for skill: react
❌ Cache MISS for skill: nodejs
🚀 Calling Gemini to generate modules for 2 skills...
🎬 Fetching YouTube videos for "react"...
🔍 Searching YouTube for: "react tutorial for beginners 2024"
✅ Found 6 videos for "react"
✅ Created skill module for "react" with 6 real YouTube videos
🎬 Fetching YouTube videos for "nodejs"...
🔍 Searching YouTube for: "nodejs tutorial for beginners 2024"
✅ Found 5 videos for "nodejs"
✅ Created skill module for "nodejs" with 5 real YouTube videos
✅ Learning path generated/updated for user 507f...
```

**✅ Success indicators:**
- ✅ `🎬 Fetching YouTube videos...` appears
- ✅ `✅ Found X videos` (not 0)
- ✅ No errors about scraping failures

**❌ Failure indicators:**
- ❌ `❌ YouTube search failed for "react"`
- ❌ `⚠️ No videos found for query`
- ❌ `⚠️ Fallback: Fetching YouTube videos...`

---

### Step 6: Verify Database

Open MongoDB Compass → Collection: `skillmodules`

**Check a document:**
```json
{
  "_id": "...",
  "skillName": "react",
  "difficulty": "intermediate",
  "estimatedWeeks": 4,
  "resources": [
    {
      "title": "React Tutorial for Beginners",
      "url": "https://www.youtube.com/watch?v=SqcY0GlETPk",
      "platform": "youtube",
      "type": "video",
      "estimatedHours": 1.5,
      "order": 1,
      // ✅ Check these exist:
      "videoId": "SqcY0GlETPk",
      "thumbnail": "https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg",
      "duration": "1:30:45",
      "viewCount": "2.1M views",
      "channelName": "Programming with Mosh"
    }
  ],
  "usageCount": 1,
  "expiresAt": "2026-03-10T..." // ~30 days from now
}
```

**✅ Must have:**
- `videoId` field (not empty)
- `thumbnail` URL (starts with `https://i.ytimg.com/`)
- `duration` (format: `MM:SS` or `HH:MM:SS`)
- `viewCount` (e.g., "1.2M views")
- `channelName` (not empty)

---

### Step 7: View in Frontend

1. Logout from recruiter account
2. Login as the **rejected applicant**
3. Click "**Learning Path**" in sidebar (graduation cap icon)

**Expected UI:**

#### Overall Progress Card ✅
```
┌──────────────────────────────────────┐
│ Overall Progress                     │
│ [████░░░░░░] 0%                      │
│                                      │
│  2 Skills │ 0 In Progress │ 0 Done  │
└──────────────────────────────────────┘
```

#### Skill Card (Collapsed) ✅
```
┌──────────────────────────────────────┐
│ ▶ React                    [Priority] [Difficulty] [0%]│
│   Estimated: 4 weeks                 │
│   [████░░░░░░░░] 0/8 resources       │
└──────────────────────────────────────┘
```

#### Click to Expand ✅
Should show resources with:

**YouTube Video Card:**
```
┌─────────────────────────────────────────────┐
│ ☐ [THUMBNAIL IMAGE]  React Tutorial         │
│   🎬 Duration Badge   ~1.5h • 2.1M views   │
│                       by Programming with Mosh│
│                            [▶️] [🔗]         │
└─────────────────────────────────────────────┘
```

**✅ Check:**
- [ ] Thumbnail image loads (480x360px, YouTube thumbnail)
- [ ] Duration badge visible on thumbnail (bottom-right)
- [ ] View count displays (e.g., "2.1M views")
- [ ] Channel name displays (e.g., "by Programming with Mosh")
- [ ] Play button (▶️) visible
- [ ] External link button (🔗) visible

---

### Step 8: Test Embedded Player

1. **Click the thumbnail** or **Play button**
2. Video should embed inline below the card
3. Thumbnail should change Play to X (close)

**Expected:**
```
┌─────────────────────────────────────────────┐
│ ☐ [THUMBNAIL]  React Tutorial     [❌] [🔗] │
│   Duration     ~1.5h • 2.1M views          │
└─────────────────────────────────────────────┘
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │                                     │  │
│  │     [YOUTUBE EMBEDDED PLAYER]      │  │
│  │                                     │  │
│  └─────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

**✅ Check:**
- [ ] Video embeds correctly (16:9 aspect ratio)
- [ ] Video autoplays
- [ ] Can pause/play video
- [ ] YouTube controls work (fullscreen, quality, etc.)
- [ ] Click X button → video closes

---

### Step 9: Test External Links

1. Click the **External Link (🔗)** button
2. Should open video in new tab on YouTube.com
3. Verify the video is correct and plays

---

### Step 10: Test Progress Tracking

1. Click the checkbox (☐) next to a resource
2. **Expected:**
   - Checkbox becomes ✓ (green)
   - Resource background turns green
   - Title gets strikethrough
   - Progress bar updates (e.g., 0% → 12.5% for 1/8 resources)
   - Toast notification: "Resource marked as complete"

3. Refresh page
4. **Expected:**
   - Progress persists
   - Checkbox still checked ✓
   - Progress bar same percentage

---

### Step 11: Test Cache (Second Rejection)

**This tests the 99% API reduction claim!**

1. Login as recruiter
2. Reject another application with **the same skill gaps** (e.g., React)
3. Check backend logs

**Expected logs:**
```
📚 Identified 1 skills to learn: [ 'react' ]
✅ Cache HIT for skill: react
✅ Learning path generated/updated for user 507f...
```

**✅ Success:**
- ✅ `Cache HIT` appears
- ✅ No `🎬 Fetching YouTube videos...`
- ✅ Generation completes in <2 seconds (vs 15-30 seconds first time)
- ✅ Frontend shows same videos as before

---

### Step 12: Test Milestone Completion

1. In Learning Path, scroll to "**Learning Milestones**" section
2. Click checkbox next to a milestone
3. **Expected:**
   - Checkbox becomes ✓ (purple)
   - Milestone background turns purple
   - Toast notification appears

---

## 📊 Expected Results Summary

| Test | Expected Behavior | Status |
|------|------------------|--------|
| Backend builds | No TypeScript errors | ✅ |
| Frontend builds | Vite builds successfully | ✅ |
| Rejection triggers generation | Backend logs show video fetching | ⏳ |
| Videos scraped | Logs show "Found X videos" | ⏳ |
| Database has metadata | videoId, thumbnail, duration, viewCount exist | ⏳ |
| Thumbnails display | Images load in frontend | ⏳ |
| Duration badges | Show MM:SS format on thumbnails | ⏳ |
| View counts | Display (e.g., "1.2M views") | ⏳ |
| Channel names | Display (e.g., "by Channel") | ⏳ |
| Embed works | Click thumbnail → video embeds | ⏳ |
| External link works | Opens video on YouTube.com | ⏳ |
| Progress tracking | Checkbox updates and persists | ⏳ |
| Cache works | Second rejection uses cache | ⏳ |

---

## 🐛 Troubleshooting

### Issue: "No videos found for query"

**Possible causes:**
1. YouTube changed HTML structure (scraping broke)
2. Network/firewall blocking YouTube.com
3. YouTube rate limiting

**Fix:**
```bash
# Check backend logs for exact error
# Try manually accessing: https://www.youtube.com/results?search_query=react+tutorial

# If needed, update scraper in:
backend/src/services/youtube-scraper.service.ts
```

**Fallback:** System will create search URLs instead (still works!)

---

### Issue: Thumbnails not loading

**Possible causes:**
1. CORS issue (unlikely - YouTube CDN is public)
2. `videoId` missing in database
3. Network issue

**Fix:**
```bash
# Check browser console for errors
# Verify database has videoId field
# Check: https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg loads
```

---

### Issue: Embedded player not working

**Possible causes:**
1. YouTube embed restrictions
2. CSP (Content Security Policy) blocking iframe
3. Missing `videoId`

**Fix:**
```bash
# Check browser console for CSP errors
# Try manually: https://www.youtube.com/embed/VIDEO_ID
```

---

### Issue: Scraping very slow (>30 seconds)

**Expected:** First scraping takes 10-20 seconds per skill

**If slower:**
1. Check network speed
2. YouTube might be throttling
3. Too many skills at once

**Fix:**
- Use cache (subsequent generations are instant!)
- Reduce `maxResults` in `searchLearningContent()` (currently 6)

---

## 🎯 Success Criteria

**Minimum viable (must work):**
- [x] Backend builds without errors ✅
- [x] Frontend builds without errors ✅
- [ ] Videos are fetched (logs show success)
- [ ] Database stores video metadata
- [ ] Thumbnails display in UI
- [ ] External links work

**Full feature set (nice to have):**
- [ ] Duration badges display
- [ ] View counts display
- [ ] Channel names display
- [ ] Embedded player works
- [ ] Cache reduces API calls

**If scraping fails entirely:**
- System falls back to search URLs (original behavior)
- Still functional, just less rich UI

---

## 📸 Screenshots to Capture (for documentation)

1. Backend logs showing video fetching
2. MongoDB document with video metadata
3. Learning Path page with thumbnails
4. Embedded video player in action
5. Progress tracking (before/after check)
6. Cache HIT logs on second rejection

---

## 🚀 Next Steps After Testing

If all tests pass:
1. ✅ Mark todo as complete
2. 📝 Document any issues found
3. 🎨 Consider UI enhancements (lazy loading, etc.)
4. 🔄 Test with various skills (Python, JavaScript, SQL, etc.)
5. 📊 Monitor MongoDB size (thumbnails are URLs, not stored data)

If tests fail:
1. 🐛 Debug specific failure (use troubleshooting guide)
2. 🔄 Fallback mechanisms should still work
3. 📝 Report issue with logs

---

## 💡 Performance Tips

1. **First rejection**: 15-30 seconds (scraping + Gemini)
2. **Cached skills**: <2 seconds (database only)
3. **100 users, same skill**: 1 scraping session, 99 cache hits

**Estimated cost savings:**
- No API keys needed (free scraping)
- Cache reduces compute by 80-99%
- Bandwidth: ~50KB per skill (thumbnails are hotlinked)

---

## ✅ Mark Test Complete

After successful testing, update the todo:

```bash
# All tests passed!
Status: ✅ COMPLETE

Backend: ✅ Compiles, runs, fetches videos
Frontend: ✅ Displays thumbnails, embeds, tracks progress
Cache: ✅ Reduces subsequent calls to near-zero
```

---

**Ready to test!** Follow steps 1-12 above and report results. 🚀
