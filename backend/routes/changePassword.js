const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

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

module.exports = router;
