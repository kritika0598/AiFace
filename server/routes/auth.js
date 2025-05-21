const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Google OAuth2 configuration
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://AiFaceServiceLo-bhszfnwz-1872523994.us-east-1.elb.amazonaws.com/api/auth/google/callback',
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google profile:', profile);
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        // Create new user if doesn't exist
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          profilePicture: profile.photos[0].value
        });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Error in Google strategy:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
router.get('/google',
  (req, res, next) => {
    console.log('Initiating Google OAuth flow');
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      session: false,
      prompt: 'select_account'
    })(req, res, next);
  }
);

router.get('/google/callback',
  (req, res, next) => {
    console.log('Received Google OAuth callback');
    passport.authenticate('google', { 
      failureRedirect: '/login',
      session: false 
    })(req, res, next);
  },
  (req, res) => {
    try {
      console.log('Processing successful Google authentication');
      if (!req.user) {
        console.error('No user object in request');
        return res.redirect('/login');
      }

      // Create JWT token
      const token = jwt.sign(
        { 
          id: req.user._id,
          email: req.user.email,
          name: req.user.name
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );
      
      // Redirect to frontend with token using hash format
      const redirectUrl = `${process.env.CLIENT_URL || 'https://kritika0598.github.io/AiFace'}/#/auth-success?token=${token}`;
      console.log('Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect('/login');
    }
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('-__v');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router; 