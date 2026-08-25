import { Request, Response, NextFunction } from 'express';
import { parseSearchQuery } from '../services/ai-search.service';
import { User } from '../models/User.model';
import { AppError } from '../middleware/errorHandler';

export const searchCandidates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body;

    if (!query) {
      throw new AppError('Search query is required', 400);
    }

    // Parse natural language query to a direct MongoDB query object via AI
    const generatedQuery = await parseSearchQuery(query);

    // Build strict NoSQL-safe MongoDB query manually
    // We enforce the role: 'applicant' so the AI cannot fetch recruiter data
    const filter: any = { role: 'applicant', ...generatedQuery };

    let candidates = await User.find(filter).select('-password');

    res.status(200).json({
      status: 'success',
      data: {
        criteria: generatedQuery, // Return the parsed criteria for transparency
        candidates
      }
    });

  } catch (error) {
    next(error);
  }
};
