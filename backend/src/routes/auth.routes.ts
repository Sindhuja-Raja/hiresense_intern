import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signup, signin, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { status: 'error', message: 'Too many requests. Try again later.' }
});

// Simplified auth routes - email/password only
router.post('/signup', authLimiter, signup);
router.post('/signin', authLimiter, signin);
router.get('/me', authenticate, getMe as any);

export default router;
