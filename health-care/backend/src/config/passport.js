const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const logger = require('../utils/logger');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, return user
          logger.info(`[Google OAuth] Existing user logged in: ${user.email}`);
          return done(null, user);
        }

        // Check if user exists with this email (from local registration)
        user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.avatar = profile.photos[0]?.value;
          user.isVerified = true; // Google accounts are verified
          await user.save({ validateBeforeSave: false });
          
          logger.info(`[Google OAuth] Linked Google account to existing user: ${user.email}`);
          return done(null, user);
        }

        // Create new user
        const newUser = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value.toLowerCase(),
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          authProvider: 'google',
          role: 'customer',
          accountType: 'Retail',
          isVerified: true, // Google accounts are verified
          isActive: true
          // Password and phone not required for OAuth users (handled by model validation)
        });

        logger.info(`[Google OAuth] New user created: ${newUser.email} (ID: ${newUser._id})`);
        done(null, newUser);
      } catch (error) {
        logger.error(`[Google OAuth] Error: ${error.message}`);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
