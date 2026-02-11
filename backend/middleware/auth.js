const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'header Authorization
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // IMPORTANT : Charger l'utilisateur COMPLET depuis la base de données
    // Ne PAS utiliser seulement les données du token qui peuvent être obsolètes
    const user = await User.findById(decoded.userId)
      .select('-password -linkedAccounts');

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur est banni
    if (user.isBanned) {
      return res.status(403).json({ 
        error: 'Compte banni',
        bannedUntil: user.bannedUntil,
        banReason: user.banReason
      });
    }

    // Attacher l'utilisateur COMPLET à la requête
    // Avec TOUTES ses propriétés actuelles de la base de données
    req.user = user;

    console.log('Auth Middleware - User ID:', user._id);
    console.log('Auth Middleware - Privilege Level:', user.privilegeLevel);

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }

    return res.status(500).json({ error: 'Erreur d\'authentification' });
  }
};

module.exports = authMiddleware;
