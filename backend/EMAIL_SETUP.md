# Email Notification System

## Overview
HireSense includes an automated email notification system that keeps candidates informed throughout their application journey.

## Features

### Automated Email Triggers
- ✅ **Application Received** - Confirmation email when candidate applies
- ✅ **Status Updates** - Notifications for all status changes (Under Review, Shortlisted, Interview, Selected, Rejected)
- ✅ **Interview Scheduled** - Details and meeting link when interview is scheduled
- ✅ **Interview Rescheduled** - Updated details when interview time changes
- ✅ **Interview Cancelled** - Notification when interview is cancelled

### Email Templates
Professional HTML templates with:
- Branded design with gradient headers
- Clear call-to-action buttons
- Detailed interview information
- Preparation tips for candidates
- Ethical footer: "This is an automated message from HireSense AI"

## Setup Instructions

### Option 1: Gmail SMTP (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security

2. **Generate App-Specific Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update `.env` file**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

### Option 2: Other SMTP Services

**SendGrid:**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Option 3: Disable Emails (Testing)

Leave email fields empty in `.env`:
```env
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
```

The system will gracefully disable emails without breaking functionality.

## Architecture

### Centralized Email Service
```
backend/src/services/email.service.ts
```
- Single source of truth for all email logic
- Template-based system
- Non-blocking email sending
- Graceful failure handling

### Integration Points

**Application Controller:**
- Sends "Application Received" on submission
- Sends "Status Updated" on status change

**Interview Controller:**
- Sends "Interview Scheduled" when created
- Sends "Interview Rescheduled" when updated
- Sends "Interview Cancelled" when cancelled

## Email Flow Example

```
Recruiter updates status to "Shortlisted"
        ↓
Application saved in MongoDB
        ↓
Status history updated
        ↓
Email service triggered (non-blocking)
        ↓
Email sent to candidate
        ↓
UI shows: "📨 Candidate notified successfully"
```

## Testing

1. **Start backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Test email sending**:
   - Apply for a job as an applicant
   - Update application status as a recruiter
   - Schedule an interview
   - Check your email inbox

3. **Monitor console logs**:
   ```
   ✅ Email service initialized successfully
   📧 Email sent to john@example.com: Application Received - Software Engineer
   📨 Email sent to jane@example.com: Interview Scheduled - Product Manager
   ```

## Error Handling

### Silent Failures
Emails fail gracefully without breaking the UI:
- If email service is not configured: Warning logged
- If email sending fails: Error logged, but API returns success
- Users still see confirmation messages in the UI

### Debug Mode
Check terminal logs for email status:
```bash
⚠️  Email service not configured. Emails will not be sent.
❌ Failed to send email: Connection timeout
✅ Email sent to user@example.com: Status Updated
```

## Security & Ethics

### Data Protection
- Emails sent via secure SMTP (TLS/SSL)
- No sensitive data in email bodies
- App passwords used (not plain passwords)

### Transparency
Every email includes footer:
> "This is an automated message from HireSense AI.  
> Please do not reply to this email."

### Privacy
- Candidates only receive emails for their own applications
- Meeting links are private and unique
- No spam or promotional content

## Customization

### Modify Templates
Edit `backend/src/services/email.service.ts`:
- Change HTML structure
- Update colors and branding
- Add more email types
- Customize content

### Add New Email Type
1. Create interface for data
2. Add method in `EmailService` class
3. Call from appropriate controller
4. Test thoroughly

## Production Considerations

### Use Professional Email Service
- **SendGrid**: Free tier (100 emails/day)
- **Mailgun**: Free tier (10,000 emails/month)
- **AWS SES**: Pay-as-you-go pricing

### Environment Variables
Never commit email credentials:
```bash
# Add to .gitignore
.env
.env.local
```

### Rate Limiting
Implement rate limits to prevent abuse:
- Max 10 emails per minute per user
- Queue system for bulk operations
- Retry logic with exponential backoff

### Monitoring
Track email metrics:
- Delivery rate
- Open rate
- Bounce rate
- Failed sends

## Troubleshooting

### Issue: "Email service not configured"
**Solution**: Add EMAIL_* variables to `.env`

### Issue: "Authentication failed"
**Solution**: 
- Use app-specific password (not account password)
- Enable 2FA for Gmail
- Check SMTP settings

### Issue: "Connection timeout"
**Solution**:
- Check firewall settings
- Verify SMTP port (587 for TLS, 465 for SSL)
- Try different SMTP server

### Issue: Emails not received
**Solution**:
- Check spam/junk folder
- Verify recipient email address
- Check email service logs
- Test with different email provider

## Support

For issues or questions:
1. Check console logs for errors
2. Verify `.env` configuration
3. Test SMTP connection separately
4. Review email service documentation

---

**Built with ❤️ for HireSense AI Recruiting Platform**
