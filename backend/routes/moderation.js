const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { requireModerator, requireAdmin, requireSuperAdmin, requirePermission } = require('../middleware/privileges');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// ============ ROUTES MODÉRATEUR ============

// Obtenir la liste des rapports (signalements)
router.get('/reports', requireModerator, async (req, res) => {
  try {
    // TODO: Implémenter le modèle Report
    res.json({ reports: [], message: 'Fonctionnalité à venir' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des rapports' });
  }
});

// Avertir un utilisateur
router.post('/warn/:userId', requirePermission('canIssueWarnings'), async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.addWarning(reason, req.user._id);
    await user.save();

    // Mettre à jour les stats du modérateur
    const moderator = await User.findById(req.user._id);
    moderator.moderationStats.actionsPerformed += 1;
    moderator.moderationStats.lastActionDate = new Date();
    await moderator.save();

    res.json({ 
      success: true, 
      message: 'Avertissement envoyé',
      warnings: user.warnings 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de l\'émission de l\'avertissement' });
  }
});

// Bannir un utilisateur
router.post('/ban/:userId', requirePermission('canBanUsers'), async (req, res) => {
  try {
    const { reason, duration } = req.body; // duration en jours
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher de bannir un admin/super admin
    if (user.privilegeLevel >= 2) {
      return res.status(403).json({ 
        error: 'Impossible de bannir un administrateur' 
      });
    }

    user.banUser(reason, duration, req.user._id);
    await user.save();

    // Mettre à jour les stats du modérateur
    const moderator = await User.findById(req.user._id);
    moderator.moderationStats.actionsPerformed += 1;
    moderator.moderationStats.lastActionDate = new Date();
    await moderator.save();

    res.json({ 
      success: true, 
      message: `Utilisateur banni${duration ? ` pour ${duration} jours` : ' définitivement'}`,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du bannissement' });
  }
});

// Débannir un utilisateur
router.post('/unban/:userId', requirePermission('canBanUsers'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.unban();
    await user.save();

    // Mettre à jour les stats du modérateur
    const moderator = await User.findById(req.user._id);
    moderator.moderationStats.actionsPerformed += 1;
    moderator.moderationStats.lastActionDate = new Date();
    await moderator.save();

    res.json({ 
      success: true, 
      message: 'Utilisateur débanni',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du débannissement' });
  }
});

// Arrêter un live stream
router.post('/stream/:streamId/stop', requirePermission('canManageStreams'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    // TODO: Implémenter l'arrêt du stream
    // io.to(streamId).emit('streamStopped', { reason });

    res.json({ 
      success: true, 
      message: 'Stream arrêté' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'arrêt du stream' });
  }
});

// Obtenir les statistiques de modération
router.get('/stats', requireModerator, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      privilegeLevel: user.privilegeLevel,
      permissions: user.moderationPermissions,
      stats: user.moderationStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des stats' });
  }
});

// ============ ROUTES ADMIN ============

// Promouvoir un utilisateur en modérateur
router.post('/promote/:userId', requireAdmin, async (req, res) => {
  try {
    const { permissions } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.privilegeLevel >= 1) {
      return res.status(400).json({ 
        error: 'Utilisateur déjà modérateur ou plus' 
      });
    }

    user.promoteToModerator(permissions);
    await user.save();

    res.json({ 
      success: true, 
      message: 'Utilisateur promu en modérateur',
      user: {
        id: user._id,
        displayName: user.displayName,
        privilegeLevel: user.privilegeLevel,
        permissions: user.moderationPermissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la promotion' });
  }
});

// Révoquer le statut de modérateur
router.post('/demote/:userId', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.privilegeLevel >= 2) {
      return res.status(403).json({ 
        error: 'Impossible de révoquer un administrateur' 
      });
    }

    user.privilegeLevel = 0;
    user.moderationPermissions = {
      canBanUsers: false,
      canDeleteContent: false,
      canManageStreams: false,
      canViewReports: false,
      canIssueWarnings: false
    };
    
    await user.save();

    res.json({ 
      success: true, 
      message: 'Privilèges de modérateur révoqués',
      user: {
        id: user._id,
        displayName: user.displayName,
        privilegeLevel: user.privilegeLevel
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la révocation' });
  }
});

// Modifier les permissions d'un modérateur
router.patch('/permissions/:userId', requireAdmin, async (req, res) => {
  try {
    const { permissions } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.privilegeLevel !== 1) {
      return res.status(400).json({ 
        error: 'Cet utilisateur n\'est pas modérateur' 
      });
    }

    user.moderationPermissions = {
      ...user.moderationPermissions,
      ...permissions
    };
    
    await user.save();

    res.json({ 
      success: true, 
      message: 'Permissions mises à jour',
      permissions: user.moderationPermissions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des permissions' });
  }
});

// Liste de tous les modérateurs
router.get('/moderators', requireAdmin, async (req, res) => {
  try {
    const moderators = await User.find({ 
      privilegeLevel: { $gte: 1 } 
    }).select('displayName email privilegeLevel moderationPermissions moderationStats');

    res.json({ moderators });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des modérateurs' });
  }
});

// Statistiques globales de modération
router.get('/stats/global', requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const moderators = await User.countDocuments({ privilegeLevel: { $gte: 1 } });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const premiumUsers = await User.countDocuments({ isPremium: true });

    res.json({
      totalUsers,
      bannedUsers,
      moderators,
      verifiedUsers,
      premiumUsers
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des stats' });
  }
});

// ============ ROUTES SUPER ADMIN ============

// Promouvoir en administrateur
router.post('/promote-admin/:userId', requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.privilegeLevel = 2;
    user.moderationPermissions = {
      canBanUsers: true,
      canDeleteContent: true,
      canManageStreams: true,
      canViewReports: true,
      canIssueWarnings: true
    };
    
    await user.save();

    res.json({ 
      success: true, 
      message: 'Utilisateur promu en administrateur',
      user: {
        id: user._id,
        displayName: user.displayName,
        privilegeLevel: user.privilegeLevel
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la promotion' });
  }
});

// Liste complète des utilisateurs avec filtres
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      privilegeLevel,
      isBanned 
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { displayName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    
    if (privilegeLevel !== undefined) {
      query.privilegeLevel = parseInt(privilegeLevel);
    }
    
    if (isBanned !== undefined) {
      query.isBanned = isBanned === 'true';
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

module.exports = router;
