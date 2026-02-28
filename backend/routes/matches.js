const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const MessageRequest = require('../models/MessageRequest');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Obtenir tous les matchs
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('matches.user');

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Filtrer les matchs dont l'utilisateur a été supprimé (populate → null)
    const matches = user.matches
      .filter(match => match.user != null)
      .map(match => ({
        id: match._id,
        user: match.user.getPublicProfile(),
        matchedAt: match.matchedAt
      }))
      .sort((a, b) => b.matchedAt - a.matchedAt);

    res.json({
      success: true,
      matches
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

    // Suppression hard : tous les messages entre les deux utilisateurs
    const currentUserId = req.user._id;
    await Message.deleteMany({
      $or: [
        { sender: currentUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: currentUserId }
      ]
    });

    // Suppression hard : toutes les demandes de message entre les deux utilisateurs
    await MessageRequest.deleteMany({
      $or: [
        { sender: currentUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: currentUserId }
      ]
    });

    res.json({
      success: true,
      message: 'Match et conversation supprimés définitivement'
    });
  } catch (error) {
    console.error('Erreur unmatch:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du match' });
  }
});

module.exports = router;
