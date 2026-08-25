import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const sanitizeFileName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');

const extensionForMime = (mimetype: string, originalName: string): string => {
  if (mimetype === 'application/pdf') return '.pdf';
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    return '.docx';
  }

  const ext = path.extname(originalName || '').toLowerCase();
  return ext || '.bin';
};

export const saveResumeToLocalUploads = async (
  fileBuffer: Buffer,
  originalName: string,
  mimetype: string
): Promise<string> => {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeBase = sanitizeFileName(path.basename(originalName || 'resume'))
    .replace(path.extname(originalName || ''), '')
    .slice(0, 60) || 'resume';
  const ext = extensionForMime(mimetype, originalName);
  const uniquePart = crypto.randomBytes(6).toString('hex');
  const fileName = `${Date.now()}-${uniquePart}-${safeBase}${ext}`;
  const targetPath = path.join(uploadsDir, fileName);

  await fs.writeFile(targetPath, fileBuffer);

  return `/uploads/resumes/${fileName}`;
};
