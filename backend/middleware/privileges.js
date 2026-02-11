const User = require('../models/User');

// Middleware pour vérifier si l'utilisateur est modérateur ou plus
const requireModerator = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user.isModerator()) {
      return res.status(403).json({ 
        error: 'Accès refusé. Privilèges modérateur requis.' 
      });
    }

    req.moderator = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la vérification des privilèges' });
  }
};

// Middleware pour vérifier si l'utilisateur est admin ou plus
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user.isAdmin()) {
      return res.status(403).json({ 
        error: 'Accès refusé. Privilèges administrateur requis.' 
      });
    }

    req.admin = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la vérification des privilèges' });
  }
};

// Middleware pour vérifier si l'utilisateur est super admin
const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user.isSuperAdmin()) {
      return res.status(403).json({ 
        error: 'Accès refusé. Privilèges super administrateur requis.' 
      });
    }

    req.superAdmin = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la vérification des privilèges' });
  }
};

// Middleware pour vérifier une permission spécifique
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const user = await User.findById(req.user._id);
      
      if (!user.canPerformAction(permission)) {
        return res.status(403).json({ 
          error: `Accès refusé. Permission "${permission}" requise.` 
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la vérification de la permission' });
    }
  };
};

module.exports = {
  requireModerator,
  requireAdmin,
  requireSuperAdmin,
  requirePermission
};
