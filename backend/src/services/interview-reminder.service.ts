import nodemailer from 'nodemailer';

interface ReminderEmailInput {
  toEmail: string;
  candidateName: string;
  recruiterName: string;
  scheduledAtIso: string;
  timezone: string;
}

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export const sendInterviewReminderEmail = async (input: ReminderEmailInput): Promise<void> => {
  const transporter = createTransporter();

  const subject = 'Interview Reminder - HireSense';
  const text = `Hi ${input.candidateName},\n\nThis is a reminder for your interview with ${input.recruiterName}.\nScheduled time: ${input.scheduledAtIso} (${input.timezone}).\n\nBest,\nHireSense Team`;

  if (!transporter) {
    console.log(`[Reminder Stub] ${subject} -> ${input.toEmail} | ${input.scheduledAtIso} (${input.timezone})`);
    return;
  }

  await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to: input.toEmail,
    subject,
    text,
  });
};
