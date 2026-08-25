# 🔧 Email Troubleshooting Guide

## ✅ Current Status

**Your system is working!** The logs show:
```
📧 Job notification: 6 applicants notified for "junior stack devoloper" (50% threshold)
```

**Issue:** Network timeout connecting to Gmail SMTP server
```
❌ Failed to send email: Error: connect ETIMEDOUT 192.178.211.109:587
```

This means emails are trying to send, but your network/firewall is blocking the connection.

---

## 🚀 Quick Fix: Try Port 465 (SSL)

I've already changed your `.env` file to use port 465 instead of 587.

**Steps:**
1. **Restart your backend server** (stop with Ctrl+C, then run `npm run dev` again)
2. **Post another test job as recruiter**
3. **Check the console logs** for success/failure

**Look for:**
```
✅ Email service initialized successfully
📧 Job notification: X applicants notified
✅ Recruiter confirmation sent to ivipin17@gmail.com
```

If you see these WITHOUT timeout errors, emails are working!

---

## 🔍 Solution Options (Try in Order)

### **Solution 1: Use Port 465 (Already Applied)**

**File:** `backend/.env`
```env
EMAIL_PORT=465  # Changed from 587
```

**Why?** Port 587 might be blocked by firewall, but 465 often works.

**Test:** Restart backend and post a new job.

---

### **Solution 2: Windows Firewall**

Your firewall might be blocking SMTP connections.

**Steps:**
1. Open **Windows Security** → **Firewall & network protection**
2. Click **"Allow an app through firewall"**
3. Click **"Change settings"** → **"Allow another app"**
4. Browse to: `C:\Program Files\nodejs\node.exe`
5. Check both **Private** and **Public** networks
6. Click **OK**

**Alternative - Quick Test:**
- Temporarily disable Windows Firewall
- Try posting a job
- If it works, firewall was the issue
- Re-enable firewall and use Solution 1

---

### **Solution 3: Antivirus Software**

Antivirus might block outgoing SMTP.

**Common culprits:**
- Norton
- McAfee
- Kaspersky
- Avast

**Steps:**
1. Open your antivirus software
2. Go to Settings → Firewall or Network Protection
3. Add exception for:
   - Node.js (`node.exe`)
   - Port 465 and 587 (SMTP)
4. Restart backend

---

### **Solution 4: Use Different Email Service**

If Gmail is still blocked, try alternative SMTP services:

#### **Option A: Outlook/Hotmail**

Update `backend/.env`:
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-outlook-password
```

#### **Option B: SendGrid (Reliable for Development)**

1. Sign up at: https://sendgrid.com (free tier: 100 emails/day)
2. Get API key from dashboard
3. Update `backend/.env`:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-sendgrid-api-key
```

#### **Option C: Mailtrap (Testing Only)**

Perfect for development testing (catches all emails):

1. Sign up at: https://mailtrap.io
2. Get SMTP credentials
3. Update `backend/.env`:
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
```

---

### **Solution 5: Check Gmail Settings**

Make sure your Gmail account allows app access:

1. **Verify 2FA is enabled:**
   - Go to: https://myaccount.google.com/security
   - "2-Step Verification" should be ON

2. **Verify App Password is correct:**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate a NEW app password
   - Copy the 16-character password (no spaces!)
   - Update `backend/.env`:
   ```env
   EMAIL_PASSWORD=abcdefghijklmnop  # Your new 16-char password
   ```

3. **Enable "Less secure app access" (if needed):**
   - Go to: https://myaccount.google.com/lesssecureapps
   - Turn ON (though 2FA + App Password is better)

---

### **Solution 6: VPN/Proxy Issues**

If you're using a VPN or corporate network:

**Try:**
1. Disconnect VPN temporarily
2. Test email sending
3. If it works, VPN was blocking SMTP

**Fix:** Configure VPN to allow SMTP traffic on ports 465 and 587

---

### **Solution 7: ISP Blocking**

Some ISPs (Internet Service Providers) block outgoing SMTP to prevent spam.

**Test:** Try using mobile hotspot instead of WiFi
- If emails work on mobile data, your ISP blocks SMTP
- Contact ISP to unblock, or use SendGrid/alternative service

---

## 🧪 Testing Each Solution

After applying any solution:

1. **Restart Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Check initialization:**
   ```
   ✅ Email service initialized successfully
   ```

3. **Post a test job as recruiter**

4. **Watch console logs:**
   - ✅ **Success:** No timeout errors, see "Email sent" messages
   - ❌ **Still failing:** Try next solution

---

## 📊 Understanding the Logs

### ✅ **Good Logs (Emails Working):**
```bash
✅ Email service initialized successfully
POST /api/jobs 201 219.289 ms - 764
📧 Job notification: 6 applicants notified for "junior stack devoloper" (50% threshold)
✅ Email sent to candidate@email.com: Job Match Notification
✅ Email sent to recruiter@email.com: Job Posted Confirmation
✅ Recruiter confirmation sent to ivipin17@gmail.com
```

### ❌ **Bad Logs (Connection Issues):**
```bash
❌ Failed to send email: Error: connect ETIMEDOUT
```

---

## 🎯 Quick Test: Verify Feature Works

Even without emails, you can verify the feature is working:

### **Test 1: Check Match Threshold**

1. **In Job Creation Form:**
   - Look for "🎯 Candidate Match Threshold: 50%" slider
   - Move the slider (should update percentage)
   - ✅ If slider exists, frontend is working

### **Test 2: Check Database**

```bash
# Connect to MongoDB and check:
db.jobs.findOne({}, { matchThreshold: 1, title: 1 })

# Should see:
{
  "_id": ObjectId("..."),
  "title": "junior stack devoloper",
  "matchThreshold": 50  // ← Should be present
}
```

### **Test 3: Check Notification Logic**

Look at your console logs:
```
📧 Job notification: 6 applicants notified for "junior stack devoloper" (50% threshold)
```

This means:
- ✅ System found 6 candidates with ≥50% skill match
- ✅ Threshold logic is working
- ✅ Notification trigger is working
- ❌ Only email delivery is failing (network issue)

---

## 💡 Recommended Solution

**For Development (Easiest):**
Use **Mailtrap** (Solution 4C) - it's designed for testing and never times out.

**For Production (Best):**
Use **SendGrid** (Solution 4B) - reliable and free tier is generous.

**For Quick Testing:**
Try **Port 465** first (Solution 1) - already applied, just restart backend.

---

## 🆘 Still Not Working?

If none of the above work, you can temporarily test without emails:

### **Option: Skip Email Verification**

Your feature still works! The system:
- ✅ Saves jobs with match threshold
- ✅ Finds matching candidates
- ✅ Logs who should be notified
- ❌ Just can't send actual emails

**To verify it's working:**
- Check the console log: `📧 Job notification: X applicants notified`
- Check MongoDB: Job has `matchThreshold` field
- Check frontend: Slider appears in form

**The feature is complete and functional - it's just the email delivery that needs network access.**

---

## 📝 Next Steps

1. **Try Solution 1** (port 465 - already done, just restart)
2. If still failing, **try Solution 4B** (SendGrid)
3. If working, **test by posting a job**
4. **Check your email inbox** for notifications

---

## ✅ Success Checklist

When emails work, you should see:

- [ ] No timeout errors in console
- [ ] `✅ Email sent to...` messages appear
- [ ] Candidate receives job match email
- [ ] Recruiter receives confirmation email
- [ ] Email contains salary, skills, "Apply Now" button
- [ ] Clicking "Apply Now" opens job page

---

**Need more help? Check the console logs and try the solutions in order!** 🚀
