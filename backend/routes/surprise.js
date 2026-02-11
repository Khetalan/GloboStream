const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// Vérifier si match mutuel après like dans surprise
router.get('/check-mutual/:partnerId', async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const partner = await User.findById(req.params.partnerId);

    if (!partner) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }

    // Vérifier si les deux se sont likés
    const currentLikedPartner = currentUser.likes.includes(partner._id);
    const partnerLikedCurrent = partner.likes.includes(currentUser._id);

    const mutual = currentLikedPartner && partnerLikedCurrent;

    // Si mutuel et pas encore match, créer le match
    if (mutual) {
      const currentHasMatch = currentUser.matches.some(m => 
        m.user.toString() === partner._id.toString()
      );

      if (!currentHasMatch) {
        currentUser.matches.push({
          user: partner._id,
          matchedAt: new Date()
        });
        await currentUser.save();

        partner.matches.push({
          user: currentUser._id,
          matchedAt: new Date()
        });
        await partner.save();
      }
    }

    res.json({
      success: true,
      mutual: mutual
    });

  } catch (error) {
    console.error('Error checking mutual:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

// Enregistrer une session surprise (pour stats)
router.post('/session', async (req, res) => {
  try {
    const { partnerId, duration, outcome } = req.body;
    // outcome: 'like', 'dislike', 'skip', 'disconnected'

    // TODO: Créer modèle SurpriseSession pour stats
    // Enregistrer : user, partner, duration, outcome, timestamp

    res.json({
      success: true,
      message: 'Session enregistrée'
    });

  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
});

// Obtenir statistiques surprise de l'utilisateur
router.get('/stats', async (req, res) => {
  try {
    // TODO: Récupérer depuis SurpriseSession
    const stats = {
      totalSessions: 0,
      totalLikes: 0,
      totalDislikes: 0,
      totalSkips: 0,
      totalMatches: 0,
      averageDuration: 0
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des stats' });
  }
});

module.exports = router;
