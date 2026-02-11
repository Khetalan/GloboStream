const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Route pour obtenir un profil public (authentifié)
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -linkedAccounts -moderationPermissions -moderationStats -warnings');

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Calculer l'âge
    let age = null;
    if (user.birthDate) {
      const today = new Date();
      const birthDate = new Date(user.birthDate);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Calculer la distance si possible
    let distance = null;
    const currentUser = await User.findById(req.user._id);
    
    if (currentUser.location?.coordinates && user.location?.coordinates) {
      const [userLon, userLat] = currentUser.location.coordinates;
      const [profileLon, profileLat] = user.location.coordinates;
      
      // Formule de Haversine
      const R = 6371; // Rayon de la Terre en km
      const dLat = (profileLat - userLat) * Math.PI / 180;
      const dLon = (profileLon - userLon) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(userLat * Math.PI / 180) * Math.cos(profileLat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance = Math.round(R * c);
    }

    // Vérifier si déjà liké/matché
    const hasLiked = currentUser.likes.includes(user._id);
    const isMatch = currentUser.matches.some(m => m.user.toString() === user._id.toString());

    res.json({
      success: true,
      profile: {
        id: user._id,
        displayName: user.displayName || user.firstName,
        firstName: user.firstName,
        age: age,
        gender: user.gender,
        bio: user.bio,
        photos: user.photos,
        location: user.location,
        interests: user.interests,
        languages: user.languages,
        occupation: user.occupation,
        height: user.height,
        hasChildren: user.hasChildren,
        smoker: user.smoker,
        lookingFor: user.lookingFor,
        isVerified: user.isVerified,
        isPremium: user.isPremium,
        isLive: user.isLive,
        distance: distance,
        hasLiked: hasLiked,
        isMatch: isMatch
      }
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

module.exports = router;
