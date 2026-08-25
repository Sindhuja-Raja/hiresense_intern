import { Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { parseResumeBuffer } from '../services/resume-parser.service';
import { saveResumeToLocalUploads } from '../services/resume-storage.service';

// Get current user's full profile
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          location: user.location,
          bio: user.bio,
          skills: user.skills || [],
          resumeUrl: user.resumeUrl,
          linkedinUrl: user.linkedinUrl,
          portfolioUrl: user.portfolioUrl,
          experience: user.experience,
          education: user.education,
          certifications: user.certifications || [],
          languages: user.languages || [],
          summary: user.summary,
          companyName: user.companyName,
          companyWebsite: user.companyWebsite,
          companyLinkedinUrl: user.companyLinkedinUrl,
          companyLogoUrl: user.companyLogoUrl,
          companyIndustry: user.companyIndustry,
          companySize: user.companySize,
          companyFoundedYear: user.companyFoundedYear,
          companyHeadquarters: user.companyHeadquarters,
          companyDescription: user.companyDescription,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      fullName,
      phone,
      location,
      bio,
      skills,
      resumeUrl,
      linkedinUrl,
      portfolioUrl,
      experience,
      education,
      certifications,
      languages,
      summary,
      companyName,
      companyWebsite,
      companyLinkedinUrl,
      companyLogoUrl,
      companyIndustry,
      companySize,
      companyFoundedYear,
      companyHeadquarters,
      companyDescription,
    } = req.body;

    const recruiterOnlyUpdateRequested = [
      companyName,
      companyWebsite,
      companyLinkedinUrl,
      companyLogoUrl,
      companyIndustry,
      companySize,
      companyFoundedYear,
      companyHeadquarters,
      companyDescription,
    ].some((value) => value !== undefined);

    if (recruiterOnlyUpdateRequested && req.user?.role !== 'recruiter') {
      throw new AppError('Only recruiters can update company profile fields', 403);
    }

    // Build update object - only include fields that were provided
    const updateFields: Record<string, any> = {};
    
    if (fullName !== undefined) updateFields.fullName = fullName;
    if (phone !== undefined) updateFields.phone = phone;
    if (location !== undefined) updateFields.location = location;
    if (bio !== undefined) updateFields.bio = bio;
    if (skills !== undefined) updateFields.skills = skills;
    if (resumeUrl !== undefined) updateFields.resumeUrl = resumeUrl;
    if (linkedinUrl !== undefined) updateFields.linkedinUrl = linkedinUrl;
    if (portfolioUrl !== undefined) updateFields.portfolioUrl = portfolioUrl;
    if (experience !== undefined) updateFields.experience = experience;
    if (education !== undefined) updateFields.education = education;
    if (certifications !== undefined) updateFields.certifications = certifications;
    if (languages !== undefined) updateFields.languages = languages;
    if (summary !== undefined) updateFields.summary = summary;
    if (companyName !== undefined) updateFields.companyName = companyName;
    if (companyWebsite !== undefined) updateFields.companyWebsite = companyWebsite;
    if (companyLinkedinUrl !== undefined) updateFields.companyLinkedinUrl = companyLinkedinUrl;
    if (companyLogoUrl !== undefined) updateFields.companyLogoUrl = companyLogoUrl;
    if (companyIndustry !== undefined) updateFields.companyIndustry = companyIndustry;
    if (companySize !== undefined) updateFields.companySize = companySize;
    if (companyFoundedYear !== undefined) updateFields.companyFoundedYear = companyFoundedYear;
    if (companyHeadquarters !== undefined) updateFields.companyHeadquarters = companyHeadquarters;
    if (companyDescription !== undefined) updateFields.companyDescription = companyDescription;

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          location: user.location,
          bio: user.bio,
          skills: user.skills || [],
          resumeUrl: user.resumeUrl,
          linkedinUrl: user.linkedinUrl,
          portfolioUrl: user.portfolioUrl,
          experience: user.experience,
          education: user.education,
          certifications: user.certifications || [],
          languages: user.languages || [],
          summary: user.summary,
          companyName: user.companyName,
          companyWebsite: user.companyWebsite,
          companyLinkedinUrl: user.companyLinkedinUrl,
          companyLogoUrl: user.companyLogoUrl,
          companyIndustry: user.companyIndustry,
          companySize: user.companySize,
          companyFoundedYear: user.companyFoundedYear,
          companyHeadquarters: user.companyHeadquarters,
          companyDescription: user.companyDescription,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add a skill to user's profile
export const addSkill = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skill } = req.body;

    if (!skill || typeof skill !== 'string') {
      throw new AppError('Skill is required', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $addToSet: { skills: skill.trim() } },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Skill added successfully',
      data: { skills: user.skills }
    });
  } catch (error) {
    next(error);
  }
};

// Remove a skill from user's profile
export const removeSkill = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skill } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $pull: { skills: skill } },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Skill removed successfully',
      data: { skills: user.skills }
    });
  } catch (error) {
    next(error);
  }
};

// Get applicant profile by ID (for recruiters viewing candidates)
export const getApplicantProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Only recruiters can view other applicant profiles
    if (req.user?.role !== 'recruiter') {
      throw new AppError('Not authorized to view this profile', 403);
    }

    const user = await User.findById(id);

    if (!user || user.role !== 'applicant') {
      throw new AppError('Applicant not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        applicant: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          location: user.location,
          bio: user.bio,
          skills: user.skills || [],
          resumeUrl: user.resumeUrl,
          linkedinUrl: user.linkedinUrl,
          portfolioUrl: user.portfolioUrl,
          experience: user.experience,
          education: user.education,
          certifications: user.certifications || [],
          languages: user.languages || [],
          summary: user.summary,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Parse uploaded resume and return profile suggestions (applicant)
export const parseResumeForProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'applicant') {
      throw new AppError('Only applicants can parse resume for profile', 403);
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      throw new AppError('Resume file is required', 400);
    }

    let parsed;
    try {
      parsed = await parseResumeBuffer(file.buffer, file.mimetype);
    } catch (err: any) {
      if (err?.message?.includes('Unsupported file type')) {
        throw new AppError(err.message, 400);
      }
      throw new AppError('Unable to parse resume. Please upload a valid PDF or DOCX file.', 400);
    }

    res.status(200).json({
      status: 'success',
      message: 'Resume parsed successfully',
      data: {
        suggestions: {
          skills: parsed.suggestedSkills,
          education: parsed.suggestedEducation,
          experience: parsed.suggestedExperience,
          certifications: parsed.suggestedCertifications,
          languages: parsed.suggestedLanguages,
          name: parsed.suggestedName,
          email: parsed.suggestedEmail,
          phone: parsed.suggestedPhone,
          location: parsed.suggestedLocation,
          summary: parsed.suggestedSummary,
          extractedYears: parsed.extractedYears,
          textPreview: parsed.textPreview,
          parsedViaAI: parsed.parsedViaAI,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Parse uploaded resume, save file, and persist resume URL on applicant profile
export const parseAndSaveResumeForProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'applicant') {
      throw new AppError('Only applicants can parse resume for profile', 403);
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      throw new AppError('Resume file is required', 400);
    }

    let parsed;
    try {
      parsed = await parseResumeBuffer(file.buffer, file.mimetype);
    } catch (err: any) {
      if (err?.message?.includes('Unsupported file type')) {
        throw new AppError(err.message, 400);
      }
      throw new AppError('Unable to parse resume. Please upload a valid PDF or DOCX file.', 400);
    }

    const autoFill = String((req.body?.autoFill ?? 'true')).toLowerCase() === 'true';
    const resumeUrl = await saveResumeToLocalUploads(file.buffer, file.originalname, file.mimetype);

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      throw new AppError('User not found', 404);
    }

    const updateFields: Record<string, any> = { resumeUrl };

    if (autoFill) {
      const existingSkills = Array.isArray(currentUser.skills) ? currentUser.skills : [];
      const existingMap = new Map(existingSkills.map((skill) => [skill.toLowerCase(), skill]));
      parsed.suggestedSkills.forEach((skill) => {
        if (!existingMap.has(skill.toLowerCase())) existingMap.set(skill.toLowerCase(), skill);
      });
      updateFields.skills = Array.from(existingMap.values());

      if (parsed.suggestedEducation) updateFields.education = parsed.suggestedEducation;
      if (parsed.suggestedExperience) updateFields.experience = parsed.suggestedExperience;

      // New AI-parsed fields
      if (parsed.suggestedCertifications.length > 0) updateFields.certifications = parsed.suggestedCertifications;
      if (parsed.suggestedLanguages.length > 0) updateFields.languages = parsed.suggestedLanguages;
      if (parsed.suggestedSummary) updateFields.summary = parsed.suggestedSummary;
      // Only fill contact fields if they are currently empty
      if (parsed.suggestedName && !currentUser.fullName) updateFields.fullName = parsed.suggestedName;
      if (parsed.suggestedPhone && !currentUser.phone) updateFields.phone = parsed.suggestedPhone;
      if (parsed.suggestedLocation && !currentUser.location) updateFields.location = parsed.suggestedLocation;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Resume parsed and saved successfully',
      data: {
        resumeUrl,
        autoFilled: autoFill,
        parsedViaAI: parsed.parsedViaAI,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          location: user.location,
          bio: user.bio,
          skills: user.skills || [],
          resumeUrl: user.resumeUrl,
          linkedinUrl: user.linkedinUrl,
          portfolioUrl: user.portfolioUrl,
          experience: user.experience,
          education: user.education,
          certifications: user.certifications || [],
          languages: user.languages || [],
          summary: user.summary,
        },
        suggestions: {
          skills: parsed.suggestedSkills,
          education: parsed.suggestedEducation,
          experience: parsed.suggestedExperience,
          certifications: parsed.suggestedCertifications,
          languages: parsed.suggestedLanguages,
          name: parsed.suggestedName,
          email: parsed.suggestedEmail,
          phone: parsed.suggestedPhone,
          location: parsed.suggestedLocation,
          summary: parsed.suggestedSummary,
          extractedYears: parsed.extractedYears,
          textPreview: parsed.textPreview,
          parsedViaAI: parsed.parsedViaAI,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
