const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration multer avec Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'globostream/photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Middleware d'authentification
router.use(authMiddleware);

// Obtenir son propre profil complet
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -linkedAccounts'); // Exclure uniquement password et linkedAccounts

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // S'assurer que privilegeLevel est bien présent
    const userData = {
      ...user.toObject(),
      privilegeLevel: user.privilegeLevel || 0,
      moderationPermissions: user.moderationPermissions || {},
      moderationStats: user.moderationStats || {}
    };

    console.log('GET /me - User ID:', user._id); // Debug
    console.log('GET /me - Privilege Level:', userData.privilegeLevel); // Debug

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// Obtenir un profil public par ID
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

// Mettre à jour son profil - TOUS LES CHAMPS
router.patch('/me', async (req, res) => {
  try {
    const updates = req.body;

    // Empêcher la modification directe de certains champs sensibles
    delete updates.privilegeLevel;
    delete updates.moderationPermissions;
    delete updates.password;
    delete updates.email;
    delete updates._id;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -linkedAccounts');

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Mettre à jour les préférences
router.patch('/preferences', async (req, res) => {
  try {
    const { ageRange, distance, showMe } = req.body;

    const user = await User.findById(req.user._id);

    if (ageRange) {
      user.preferences.ageRange = ageRange;
    }
    if (distance) {
      user.preferences.distance = distance;
    }
    if (showMe) {
      user.preferences.showMe = showMe;
    }

    await user.save();

    res.json({
      success: true,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Erreur mise à jour préférences:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des préférences' });
  }
});

// Upload de photo
router.post('/photos', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune photo fournie' });
    }

    const user = await User.findById(req.user._id);

    // Vérifier le nombre de photos
    if (user.photos.length >= 6) {
      // Supprimer le fichier uploadé sur Cloudinary
      if (req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(400).json({ error: 'Maximum 6 photos autorisées' });
    }

    // Ajouter la photo (req.file.path = URL Cloudinary complète)
    const photo = {
      url: req.file.path,
      isPrimary: user.photos.length === 0,
      uploadedAt: new Date()
    };

    user.photos.push(photo);
    await user.save();

    // Récupérer la photo sauvegardée avec son _id MongoDB
    const savedPhoto = user.photos[user.photos.length - 1];

    res.json({
      success: true,
      photo: savedPhoto,
      message: 'Photo ajoutée avec succès'
    });
  } catch (error) {
    console.error('Erreur upload photo:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload de la photo' });
  }
});

// Supprimer une photo
router.delete('/photos/:photoId', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const photoIndex = user.photos.findIndex(p => p._id.toString() === req.params.photoId);

    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    const photo = user.photos[photoIndex];

    // Supprimer le fichier sur Cloudinary
    if (photo.url && photo.url.includes('cloudinary')) {
      const urlParts = photo.url.split('/');
      const folderAndFile = urlParts.slice(-2).join('/');
      const publicId = folderAndFile.replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy(publicId).catch(err => {
        console.error('Cloudinary delete error:', err);
      });
    }

    user.photos.splice(photoIndex, 1);

    // Si c'était la photo principale et qu'il reste des photos, définir une nouvelle principale
    if (user.photos.length > 0 && !user.photos.some(p => p.isPrimary)) {
      user.photos[0].isPrimary = true;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Photo supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression photo:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la photo' });
  }
});

// Définir la photo principale
router.patch('/photos/:photoId/primary', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Retirer le statut principal de toutes les photos
    user.photos.forEach(p => p.isPrimary = false);

    // Définir la nouvelle photo principale
    const photo = user.photos.find(p => p._id.toString() === req.params.photoId);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    photo.isPrimary = true;
    await user.save();

    res.json({
      success: true,
      photos: user.photos,
      message: 'Photo principale mise à jour'
    });
  } catch (error) {
    console.error('Erreur mise à jour photo principale:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Lier un compte social
router.post('/link/:provider', async (req, res) => {
  try {
    const provider = req.params.provider;
    const { providerId } = req.body;

    const validProviders = ['google', 'facebook', 'apple', 'spotify', 'instagram'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: 'Fournisseur invalide' });
    }

    const user = await User.findById(req.user._id);

    // Mettre à jour l'ID du fournisseur et marquer comme lié
    user[`${provider}Id`] = providerId;
    user.linkedAccounts[provider] = true;

    await user.save();

    res.json({
      success: true,
      message: `Compte ${provider} lié avec succès`,
      linkedAccounts: user.linkedAccounts
    });
  } catch (error) {
    console.error('Erreur liaison compte:', error);
    res.status(500).json({ error: 'Erreur lors de la liaison du compte' });
  }
});

// Délier un compte social
router.delete('/link/:provider', async (req, res) => {
  try {
    const provider = req.params.provider;
    const user = await User.findById(req.user._id);

    user[`${provider}Id`] = undefined;
    user.linkedAccounts[provider] = false;

    await user.save();

    res.json({
      success: true,
      message: `Compte ${provider} délié avec succès`,
      linkedAccounts: user.linkedAccounts
    });
  } catch (error) {
    console.error('Erreur déliaison compte:', error);
    res.status(500).json({ error: 'Erreur lors de la déliaison du compte' });
  }
});

// Mettre à jour la localisation
router.post('/location', async (req, res) => {
  try {
    const { latitude, longitude, city, country } = req.body;

    const user = await User.findById(req.user._id);

    user.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
      city,
      country
    };

    await user.save();

    res.json({
      success: true,
      message: 'Localisation mise à jour',
      location: user.location
    });
  } catch (error) {
    console.error('Erreur mise à jour localisation:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la localisation' });
  }
});

module.exports = router;
