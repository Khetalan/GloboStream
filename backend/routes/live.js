const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { liveRooms } = require('../socketHandlers/liveRoom');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// Modèle temporaire pour les lives (à créer plus tard)
// Pour l'instant, on simule avec des utilisateurs qui ont isLive: true

// GET /api/live/public - Obtenir tous les lives publics
router.get('/public', async (req, res) => {
  try {
    const { filter, userLat, userLon, mode } = req.query;

    // Récupérer les favoris de l'utilisateur courant
    const currentUser = await User.findById(req.user._id).select('favoriteStreamers');
    const favoriteSet = new Set((currentUser?.favoriteStreamers || []).map(id => id.toString()));

    // Trouver tous les utilisateurs en live, filtrer par mode si spécifié
    let query = { isLive: true };
    if (mode) {
      query.liveMode = mode;
    }

    const liveUsers = await User.find(query)
      .select('displayName firstName photos isVerified location')
      .limit(50);

    // Calculer distance si coordonnées fournies
    const streams = liveUsers.map(user => {
      let distance = null;

      if (userLat && userLon && user.location?.coordinates) {
        const [userLon2, userLat2] = user.location.coordinates;

        // Formule Haversine
        const R = 6371; // Rayon Terre en km
        const dLat = (userLat2 - parseFloat(userLat)) * Math.PI / 180;
        const dLon = (userLon2 - parseFloat(userLon)) * Math.PI / 180;
        const a =
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(parseFloat(userLat) * Math.PI / 180) *
          Math.cos(userLat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }

      // Lire les vraies données depuis liveRooms (Socket.IO in-memory)
      const roomId = `live-${user._id}`;
      const room = liveRooms.get(roomId);
      const viewersCount = room ? (room.viewers.size + room.participants.size) : 0;
      const durationSeconds = room ? Math.floor((Date.now() - room.createdAt) / 1000) : 0;
      const liveDescription = room?.description || '';
      const roomTitle = room?.title || `Live de ${user.displayName || user.firstName}`;

      return {
        _id: user._id,
        streamer: {
          _id: user._id,
          displayName: user.displayName,
          firstName: user.firstName,
          photos: user.photos,
          isVerified: user.isVerified
        },
        title: roomTitle,
        description: liveDescription,
        thumbnail: user.photos?.[0]?.url || null,
        viewersCount,
        duration: durationSeconds,
        tags: room?.tags || ['Rencontres', 'Discussion'],
        distance: distance,
        isFavorite: favoriteSet.has(user._id.toString()),
        startedAt: room ? new Date(room.createdAt) : new Date()
      };
    });

    // Calculer le nombre de lives actifs par tag (pour les bulles de thème LiveEvent)
    const tagCounts = {};
    for (const room of liveRooms.values()) {
      if (!mode || room.mode === mode) {
        for (const tag of (room.tags || [])) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }

    // Filtrer selon l'onglet actif
    let filteredStreams = streams;

    switch (filter) {
      case 'trending':
        // Trier par nombre de spectateurs
        filteredStreams.sort((a, b) => b.viewersCount - a.viewersCount);
        break;

      case 'nearby':
        // Trier par distance
        filteredStreams = filteredStreams
          .filter(s => s.distance !== null && s.distance <= 50)
          .sort((a, b) => a.distance - b.distance);
        break;

      case 'new':
        // Trier par date de début (plus récent d'abord)
        filteredStreams.sort((a, b) => 
          new Date(b.startedAt) - new Date(a.startedAt)
        );
        break;

      case 'favorites':
        // TODO: Filtrer selon favoris utilisateur
        filteredStreams = filteredStreams.filter(s => s.isFavorite);
        break;

      default:
        // Tendance par défaut
        filteredStreams.sort((a, b) => b.viewersCount - a.viewersCount);
    }

    res.json({
      success: true,
      streams: filteredStreams,
      tagCounts
    });

  } catch (error) {
    console.error('Error fetching live streams:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des lives' });
  }
});

// POST /api/live/favorite/:streamerId - Ajouter/retirer un streamer des favoris
router.post('/favorite/:streamerId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const streamerId = req.params.streamerId;

    const user = await User.findById(userId).select('favoriteStreamers');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const isFavorite = user.favoriteStreamers.some(id => id.toString() === streamerId);

    if (isFavorite) {
      await User.findByIdAndUpdate(userId, { $pull: { favoriteStreamers: streamerId } });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { favoriteStreamers: streamerId } });
    }

    res.json({ success: true, isFavorite: !isFavorite });

  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// POST /api/live/start - Démarrer un live
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { title, tags, mode } = req.body;

    // Mettre à jour isLive et liveMode de l'utilisateur
    await User.findByIdAndUpdate(req.user._id, {
      isLive: true,
      liveMode: mode || 'public'
    });

    res.json({
      success: true,
      message: 'Live démarré',
      streamId: req.user._id
    });

  } catch (error) {
    console.error('Error starting live:', error);
    res.status(500).json({ error: 'Erreur lors du démarrage' });
  }
});

// POST /api/live/stop - Arrêter le live
router.post('/stop', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isLive: false,
      liveMode: null
    });

    res.json({
      success: true,
      message: 'Live arrêté'
    });

  } catch (error) {
    console.error('Error stopping live:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

module.exports = router;
