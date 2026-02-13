const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

// Configuration Passport
require('../config/passport')(passport);

// Génération du token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Inscription avec email
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, birthDate, gender } = req.body;

    // Validations
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Calculer l'âge si birthDate fourni
    if (birthDate) {
      const age = Math.floor((Date.now() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        return res.status(400).json({ error: 'Vous devez avoir au moins 18 ans' });
      }
    }

    // Construire le displayName
    const displayName = firstName
      ? `${firstName} ${lastName || ''}`.trim()
      : email.split('@')[0];

    // Créer l'utilisateur
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      displayName,
      birthDate,
      gender
    });

    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Connexion avec email
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trouver l'utilisateur avec le mot de passe
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier si banni
    if (user.isBanned) {
      return res.status(403).json({ 
        error: 'Compte banni',
        bannedUntil: user.bannedUntil,
        banReason: user.banReason
      });
    }

    // Mettre à jour lastActive
    user.lastActive = Date.now();
    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    // Retourner les données utilisateur COMPLÈTES
    const userData = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      displayName: user.displayName,
      photos: user.photos,
      privilegeLevel: user.privilegeLevel || 0,  // ✅ Inclure dans la réponse
      moderationPermissions: user.moderationPermissions,
      isPremium: user.isPremium,
      isVerified: user.isVerified
    };

    console.log('Login successful - User ID:', user._id);
    console.log('Login successful - Privilege Level:', user.privilegeLevel);

    res.json({
      success: true,
      token: token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// POST /api/auth/change-password - Changer le mot de passe
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Mot de passe actuel et nouveau requis' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Charger l'utilisateur avec le mot de passe
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword, 
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        error: 'Mot de passe actuel incorrect' 
      });
    }

    // Vérifier que le nouveau mot de passe est différent
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    
    if (isSamePassword) {
      return res.status(400).json({ 
        error: 'Le nouveau mot de passe doit être différent de l\'ancien' 
      });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    user.password = hashedPassword;
    await user.save();

    console.log('Password changed successfully for user:', user._id);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ 
      error: 'Erreur lors du changement de mot de passe' 
    });
  }
});

// Inscription/Connexion avec numéro de téléphone
router.post('/phone', async (req, res) => {
  try {
    const { phoneNumber, code, firstName, lastName, birthDate, gender, isNewUser } = req.body;

    // TODO: Implémenter la vérification du code SMS (Twilio, etc.)
    // Pour l'instant, nous acceptons tous les codes

    if (isNewUser) {
      // Inscription
      const age = Math.floor((Date.now() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        return res.status(400).json({ error: 'Vous devez avoir au moins 18 ans' });
      }

      const user = new User({
        phoneNumber,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName || ''}`.trim(),
        birthDate,
        gender
      });

      await user.save();

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: user.getPublicProfile()
      });
    } else {
      // Connexion
      const user = await User.findOne({ phoneNumber });
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      user.lastActive = Date.now();
      await user.save();

      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user: user.getPublicProfile()
      });
    }
  } catch (error) {
    console.error('Erreur authentification téléphone:', error);
    res.status(500).json({ error: 'Erreur lors de l\'authentification' });
  }
});



// OAuth Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// OAuth Facebook
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// OAuth Apple
router.get('/apple',
  passport.authenticate('apple')
);

router.get('/apple/callback',
  passport.authenticate('apple', { session: false }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// Vérification du token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
});

module.exports = router;
