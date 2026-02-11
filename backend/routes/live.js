const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// Modèle temporaire pour les lives (à créer plus tard)
// Pour l'instant, on simule avec des utilisateurs qui ont isLive: true

// GET /api/live/public - Obtenir tous les lives publics
router.get('/public', async (req, res) => {
  try {
    const { filter, userLat, userLon } = req.query;

    // Trouver tous les utilisateurs en live
    let query = { isLive: true };

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

      return {
        _id: user._id,
        streamer: {
          _id: user._id,
          displayName: user.displayName,
          firstName: user.firstName,
          photos: user.photos,
          isVerified: user.isVerified
        },
        title: `Live de ${user.displayName || user.firstName}`,
        thumbnail: user.photos?.[0]?.url || null,
        viewersCount: Math.floor(Math.random() * 100) + 5, // Simulé
        duration: Math.floor(Math.random() * 3600), // Simulé en secondes
        tags: ['Rencontres', 'Discussion'],
        distance: distance,
        isFavorite: false, // TODO: Vérifier favoris utilisateur
        startedAt: new Date()
      };
    });

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
      streams: filteredStreams
    });

  } catch (error) {
    console.error('Error fetching live streams:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des lives' });
  }
});

// POST /api/live/favorite/:streamId - Ajouter/retirer des favoris
router.post('/favorite/:streamId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const streamId = req.params.streamId;

    // TODO: Implémenter système de favoris
    // Pour l'instant, juste retourner succès

    res.json({
      success: true,
      message: 'Favori modifié'
    });

  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// POST /api/live/start - Démarrer un live public
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { title, tags } = req.body;

    // Mettre à jour isLive de l'utilisateur
    await User.findByIdAndUpdate(req.user._id, {
      isLive: true
    });

    // TODO: Créer entrée LiveStream dans une collection dédiée

    res.json({
      success: true,
      message: 'Live démarré',
      streamId: req.user._id // Temporaire
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
      isLive: false
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
