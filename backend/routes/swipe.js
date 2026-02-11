const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// Obtenir des profils à swiper avec filtres
router.post('/profiles', async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const {
      ageMin = 18,
      ageMax = 99,
      distance = 50,
      gender = ['homme', 'femme'],
      heightMin = null,
      heightMax = null,
      languages = [],
      interests = [],
      hasChildren = null,
      smoker = null,
      lookingFor = null
    } = req.body;

    const limit = parseInt(req.body.limit) || 10;

    // Construire la requête de filtre
    const query = {
      _id: { 
        $ne: currentUser._id,
        $nin: [...currentUser.likes, ...currentUser.dislikes]
      },
      isActive: true,
      isBanned: false
    };

    // Filtre genre
    if (gender && gender.length > 0) {
      query.gender = { $in: gender };
    }

    // Filtre taille
    if (heightMin || heightMax) {
      query.height = {};
      if (heightMin) query.height.$gte = heightMin;
      if (heightMax) query.height.$lte = heightMax;
    }

    // Filtre langues (au moins une langue en commun)
    if (languages && languages.length > 0) {
      query.languages = { $in: languages };
    }

    // Filtre intérêts (au moins un intérêt en commun)
    if (interests && interests.length > 0) {
      query.interests = { $in: interests };
    }

    // Filtre enfants
    if (hasChildren) {
      query.hasChildren = hasChildren;
    }

    // Filtre fumeur
    if (smoker) {
      query.smoker = smoker;
    }

    // Filtre type de relation
    if (lookingFor) {
      query.lookingFor = lookingFor;
    }

    // Trouver les utilisateurs
    let profiles = await User.find(query).limit(limit * 3); // Charger plus pour filtrer par distance

    // Calculer l'âge et filtrer
    const today = new Date();
    profiles = profiles.filter(profile => {
      if (!profile.birthDate) return false;
      
      const birthDate = new Date(profile.birthDate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age >= ageMin && age <= ageMax;
    });

    // Filtrer par distance si l'utilisateur a une localisation
    if (currentUser.location && currentUser.location.coordinates) {
      const [userLon, userLat] = currentUser.location.coordinates;
      
      profiles = profiles.map(profile => {
        if (profile.location && profile.location.coordinates) {
          const [profileLon, profileLat] = profile.location.coordinates;
          
          // Formule de Haversine pour calculer la distance
          const R = 6371; // Rayon de la Terre en km
          const dLat = (profileLat - userLat) * Math.PI / 180;
          const dLon = (profileLon - userLon) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(profileLat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const dist = R * c;
          
          return { ...profile.toObject(), distance: Math.round(dist) };
        }
        return { ...profile.toObject(), distance: null };
      });

      // Filtrer par distance maximale
      profiles = profiles.filter(p => p.distance === null || p.distance <= distance);
      
      // Trier par distance
      profiles.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    // Limiter au nombre demandé
    profiles = profiles.slice(0, limit);

    // Retourner les profils publics
    const publicProfiles = profiles.map(profile => {
      const age = profile.age || (() => {
        if (!profile.birthDate) return null;
        const birthDate = new Date(profile.birthDate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      })();

      return {
        id: profile._id,
        displayName: profile.displayName || profile.firstName,
        firstName: profile.firstName,
        age: age,
        gender: profile.gender,
        bio: profile.bio,
        photos: profile.photos,
        location: profile.location,
        interests: profile.interests,
        languages: profile.languages,
        occupation: profile.occupation,
        height: profile.height,
        hasChildren: profile.hasChildren,
        smoker: profile.smoker,
        lookingFor: profile.lookingFor,
        isVerified: profile.isVerified,
        isPremium: profile.isPremium,
        isLive: profile.isLive,
        distance: profile.distance
      };
    });

    res.json({ 
      success: true,
      profiles: publicProfiles,
      total: publicProfiles.length
    });

  } catch (error) {
    console.error('Erreur chargement profils:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des profils' });
  }
});

// Liker un profil
router.post('/like/:userId', async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si déjà liké
    if (currentUser.likes.includes(targetUser._id)) {
      return res.json({ success: true, match: false, message: 'Déjà liké' });
    }

    // Ajouter aux likes
    currentUser.likes.push(targetUser._id);
    await currentUser.save();

    // Vérifier si c'est un match (l'autre a aussi liké)
    const isMatch = targetUser.likes.includes(currentUser._id);

    if (isMatch) {
      // Créer le match pour les deux utilisateurs
      if (!currentUser.matches.some(m => m.user.toString() === targetUser._id.toString())) {
        currentUser.matches.push({
          user: targetUser._id,
          matchedAt: new Date()
        });
        await currentUser.save();
      }

      if (!targetUser.matches.some(m => m.user.toString() === currentUser._id.toString())) {
        targetUser.matches.push({
          user: currentUser._id,
          matchedAt: new Date()
        });
        await targetUser.save();
      }

      // TODO: Envoyer une notification de match
    }

    res.json({ 
      success: true, 
      match: isMatch,
      message: isMatch ? 'C\'est un match !' : 'Like enregistré'
    });

  } catch (error) {
    console.error('Erreur like:', error);
    res.status(500).json({ error: 'Erreur lors du like' });
  }
});

// Disliker un profil (passer)
router.post('/dislike/:userId', async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si déjà disliké
    if (currentUser.dislikes.includes(targetUser._id)) {
      return res.json({ success: true, message: 'Déjà passé' });
    }

    // Ajouter aux dislikes
    currentUser.dislikes.push(targetUser._id);
    await currentUser.save();

    res.json({ 
      success: true, 
      message: 'Profil passé'
    });

  } catch (error) {
    console.error('Erreur dislike:', error);
    res.status(500).json({ error: 'Erreur lors du dislike' });
  }
});

// Superliker un profil (premium)
router.post('/superlike/:userId', async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    if (!currentUser.isPremium) {
      return res.status(403).json({ error: 'Fonctionnalité premium requise' });
    }

    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Ajouter aux likes avec flag superlike
    if (!currentUser.likes.includes(targetUser._id)) {
      currentUser.likes.push(targetUser._id);
      await currentUser.save();
    }

    // TODO: Notifier l'utilisateur qu'il a reçu un superlike

    res.json({ 
      success: true, 
      message: 'Superlike envoyé !'
    });

  } catch (error) {
    console.error('Erreur superlike:', error);
    res.status(500).json({ error: 'Erreur lors du superlike' });
  }
});

// Annuler le dernier swipe (rewind - premium)
router.post('/rewind', async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    if (!currentUser.isPremium) {
      return res.status(403).json({ error: 'Fonctionnalité premium requise' });
    }

    // Récupérer le dernier dislike
    if (currentUser.dislikes.length === 0) {
      return res.status(400).json({ error: 'Aucun swipe à annuler' });
    }

    const lastDislike = currentUser.dislikes.pop();
    await currentUser.save();

    res.json({ 
      success: true, 
      message: 'Dernier swipe annulé',
      userId: lastDislike
    });

  } catch (error) {
    console.error('Erreur rewind:', error);
    res.status(500).json({ error: 'Erreur lors du rewind' });
  }
});

module.exports = router;
