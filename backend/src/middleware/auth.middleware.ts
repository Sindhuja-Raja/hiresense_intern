import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

// Extend Express User to include JWT payload properties
declare global {
  namespace Express {
    interface User {
      id: string;
      _id?: any;
      role: 'recruiter' | 'applicant';
      email?: string;
      fullName?: string;
    }
  }
}

// Keep AuthRequest as an alias for backward compatibility
export type AuthRequest = Request;

export const authenticate: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new AppError('JWT secret not configured', 500));
    }

    const decoded = jwt.verify(token, secret) as {
      id: string;
      role: 'recruiter' | 'applicant';
    };

    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const authorizeRole = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Access denied', 403));
    }
    next();
  };
};
