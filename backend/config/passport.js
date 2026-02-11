const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
  // Sérialisation de l'utilisateur
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

  // Stratégie Google
  if (process.env.GOOGLE_CLIENT_ID) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Vérifier si l'utilisateur existe déjà
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Mettre à jour les infos
          user.lastActive = Date.now();
          await user.save();
          return done(null, user);
        }

        // Vérifier si un utilisateur existe avec cet email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Lier le compte Google
          user.googleId = profile.id;
          user.linkedAccounts.google = true;
          user.lastActive = Date.now();
          await user.save();
          return done(null, user);
        }

        // Créer un nouvel utilisateur
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          displayName: profile.displayName,
          photos: profile.photos && profile.photos.length > 0 ? [{
            url: profile.photos[0].value,
            isPrimary: true
          }] : [],
          linkedAccounts: { google: true },
          // Valeurs par défaut - à compléter lors du premier usage
          birthDate: new Date(2000, 0, 1),
          gender: 'autre'
        });

        await user.save();
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }));
  }

  // Stratégie Facebook
  if (process.env.FACEBOOK_APP_ID) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'emails', 'name', 'photos']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ facebookId: profile.id });

        if (user) {
          user.lastActive = Date.now();
          await user.save();
          return done(null, user);
        }

        user = await User.findOne({ email: profile.emails?.[0]?.value });

        if (user) {
          user.facebookId = profile.id;
          user.linkedAccounts.facebook = true;
          user.lastActive = Date.now();
          await user.save();
          return done(null, user);
        }

        user = new User({
          facebookId: profile.id,
          email: profile.emails?.[0]?.value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          displayName: `${profile.name.givenName} ${profile.name.familyName}`,
          photos: profile.photos && profile.photos.length > 0 ? [{
            url: profile.photos[0].value,
            isPrimary: true
          }] : [],
          linkedAccounts: { facebook: true },
          birthDate: new Date(2000, 0, 1),
          gender: 'autre'
        });

        await user.save();
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }));
  }

  // Stratégie Apple
  if (process.env.APPLE_CLIENT_ID) {
    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      callbackURL: process.env.APPLE_CALLBACK_URL,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, idToken, profile, done) => {
      try {
        let user = await User.findOne({ appleId: profile.id });

        if (user) {
          user.lastActive = Date.now();
          await user.save();
          return done(null, user);
        }

        user = new User({
          appleId: profile.id,
          email: profile.email,
          firstName: profile.name?.firstName || 'User',
          lastName: profile.name?.lastName || '',
          displayName: profile.name?.firstName || 'User',
          linkedAccounts: { apple: true },
          birthDate: new Date(2000, 0, 1),
          gender: 'autre'
        });

        await user.save();
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }));
  }
};
