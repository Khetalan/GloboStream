const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Démarrer un stream
router.post('/start', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.isLive) {
      return res.status(400).json({ error: 'Vous êtes déjà en live' });
    }

    // Générer un ID de stream unique
    const streamId = `stream_${user._id}_${Date.now()}`;
    
    user.isLive = true;
    user.liveStreamId = streamId;
    await user.save();

    // Notifier les matchs que l'utilisateur est en live
    const io = req.app.get('io');
    user.matches.forEach(match => {
      io.emit('streamStarted', {
        userId: match.user,
        streamer: user.getPublicProfile(),
        streamId
      });
    });

    res.json({
      success: true,
      streamId,
      message: 'Stream démarré'
    });
  } catch (error) {
    console.error('Erreur démarrage stream:', error);
    res.status(500).json({ error: 'Erreur lors du démarrage du stream' });
  }
});

// Arrêter un stream
router.post('/stop', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.isLive) {
      return res.status(400).json({ error: 'Vous n\'êtes pas en live' });
    }

    const streamId = user.liveStreamId;

    user.isLive = false;
    user.liveStreamId = null;
    await user.save();

    // Notifier que le stream est terminé
    const io = req.app.get('io');
    io.emit('streamEnded', {
      streamId,
      userId: user._id
    });

    res.json({
      success: true,
      message: 'Stream arrêté'
    });
  } catch (error) {
    console.error('Erreur arrêt stream:', error);
    res.status(500).json({ error: 'Erreur lors de l\'arrêt du stream' });
  }
});

// Obtenir les streams actifs des matchs
router.get('/active', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('matches.user');

    // Filtrer les matchs qui sont en live
    const activeStreams = user.matches
      .filter(match => {
        const matchedUser = match.user;
        return matchedUser && matchedUser.isLive;
      })
      .map(match => ({
        user: match.user.getPublicProfile(),
        streamId: match.user.liveStreamId,
        startedAt: match.user.updatedAt
      }));

    res.json({
      success: true,
      streams: activeStreams
    });
  } catch (error) {
    console.error('Erreur récupération streams:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des streams' });
  }
});

// Rejoindre un stream
router.post('/join/:streamId', async (req, res) => {
  try {
    const streamId = req.params.streamId;
    
    // Trouver le streamer
    const streamer = await User.findOne({ liveStreamId: streamId });
    
    if (!streamer) {
      return res.status(404).json({ error: 'Stream non trouvé' });
    }

    if (!streamer.isLive) {
      return res.status(400).json({ error: 'Ce stream n\'est plus actif' });
    }

    // Vérifier qu'il y a un match
    const user = await User.findById(req.user._id);
    const hasMatch = user.matches.some(m => m.user.toString() === streamer._id.toString());

    if (!hasMatch) {
      return res.status(403).json({ error: 'Vous devez matcher pour rejoindre ce stream' });
    }

    res.json({
      success: true,
      streamId,
      streamer: streamer.getPublicProfile()
    });
  } catch (error) {
    console.error('Erreur rejoindre stream:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion au stream' });
  }
});

// Obtenir tous les streams publics (optionnel)
router.get('/public', async (req, res) => {
  try {
    const liveUsers = await User.find({ isLive: true })
      .limit(20)
      .select('-password -email -phoneNumber -likes -dislikes -matches');

    const streams = liveUsers.map(user => ({
      user: user.getPublicProfile(),
      streamId: user.liveStreamId
    }));

    res.json({
      success: true,
      streams
    });
  } catch (error) {
    console.error('Erreur récupération streams publics:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des streams' });
  }
});

module.exports = router;
