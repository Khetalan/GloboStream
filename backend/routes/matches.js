const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Obtenir tous les matchs
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('matches.user');

    const matches = await Promise.all(
      user.matches.map(async (match) => {
        const matchedUser = await User.findById(match.user);
        return {
          id: match._id,
          user: matchedUser.getPublicProfile(),
          matchedAt: match.matchedAt
        };
      })
    );

    res.json({
      success: true,
      matches: matches.sort((a, b) => b.matchedAt - a.matchedAt)
    });
  } catch (error) {
    console.error('Erreur récupération matchs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des matchs' });
  }
});

// Unmatch (retirer un match)
router.delete('/:userId', async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const targetUserId = req.params.userId;

    // Retirer le match pour l'utilisateur actuel
    currentUser.matches = currentUser.matches.filter(
      m => m.user.toString() !== targetUserId
    );

    // Retirer aussi des likes
    currentUser.likes = currentUser.likes.filter(
      id => id.toString() !== targetUserId
    );

    await currentUser.save();

    // Retirer le match pour l'autre utilisateur
    const targetUser = await User.findById(targetUserId);
    if (targetUser) {
      targetUser.matches = targetUser.matches.filter(
        m => m.user.toString() !== req.user._id.toString()
      );
      targetUser.likes = targetUser.likes.filter(
        id => id.toString() !== req.user._id.toString()
      );
      await targetUser.save();
    }

    res.json({
      success: true,
      message: 'Match retiré avec succès'
    });
  } catch (error) {
    console.error('Erreur unmatch:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du match' });
  }
});

module.exports = router;
