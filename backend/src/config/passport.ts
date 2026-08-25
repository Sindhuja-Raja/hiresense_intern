/**
 * Passport.js - OAuth disabled
 * OAuth strategies removed from this simplified version
 */

import passport from 'passport';

// No OAuth strategies configured - using email/password auth only
export const initializePassport = () => {
  console.log('✅ Auth initialized (OAuth disabled)');
};

export default passport;
