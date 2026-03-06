const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require('../models/User');
const Message = require('../models/Message');
const MessageRequest = require('../models/MessageRequest');
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

// Obtenir les utilisateurs ayant visité son profil
router.get('/views', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('profileViews.viewer', 'displayName firstName photos location birthDate gender isVerified isPremium isLive lastActive bio interests occupation height hasChildren smoker lookingFor');

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    // Trier du plus récent au plus ancien, ignorer les viewers supprimés
    const viewers = user.profileViews
      .filter(v => v.viewer != null)
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .map(v => v.viewer.getPublicProfile());

    res.json({ success: true, users: viewers });
  } catch (error) {
    console.error('Erreur vues profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des vues' });
  }
});

// ── RGPD — Export données utilisateur ────────────────────────────────────────

// GET /api/users/export-data — Télécharger toutes les données personnelles (droit RGPD)
router.get('/export-data', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }]
    }).sort({ createdAt: -1 }).limit(500);

    const messageRequests = await MessageRequest.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }]
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      profile: user.toObject(),
      messages: messages.map(m => m.toObject()),
      messageRequests: messageRequests.map(m => m.toObject())
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="globostream-data.json"');
    res.json(exportData);
  } catch (error) {
    console.error('Erreur export données:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des données' });
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

// ── Blocage utilisateur ───────────────────────────────────────────────────────

// POST /api/users/block/:userId — Bloquer un utilisateur
router.post('/block/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Impossible de se bloquer soi-même' });
    }
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: targetUserId }
    });
    res.json({ success: true, message: 'Utilisateur bloqué' });
  } catch (error) {
    console.error('Erreur blocage:', error);
    res.status(500).json({ error: 'Erreur lors du blocage' });
  }
});

// DELETE /api/users/block/:userId — Débloquer un utilisateur
router.delete('/block/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: targetUserId }
    });
    res.json({ success: true, message: 'Utilisateur débloqué' });
  } catch (error) {
    console.error('Erreur déblocage:', error);
    res.status(500).json({ error: 'Erreur lors du déblocage' });
  }
});

// GET /api/users/blocked — Liste des utilisateurs bloqués
router.get('/blocked', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('blockedUsers', 'displayName firstName photos location');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const blocked = (user.blockedUsers || []).map(u => u.getPublicProfile());
    res.json({ success: true, blocked });
  } catch (error) {
    console.error('Erreur liste bloqués:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// ── RGPD — Consentement ───────────────────────────────────────────────────────

// POST /api/users/consent — Enregistrer le consentement RGPD en base de données
router.post('/consent', async (req, res) => {
  try {
    const { version } = req.body;
    // Récupérer l'IP réelle (derrière un proxy éventuel)
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection.remoteAddress;

    await User.findByIdAndUpdate(req.user._id, {
      consent: {
        accepted: true,
        version: version || '1.0',
        date: new Date(),
        ip
      }
    });

    res.json({ success: true, message: 'Consentement enregistré' });
  } catch (error) {
    console.error('Erreur enregistrement consentement:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du consentement' });
  }
});

// ── RGPD — Suppression de compte ─────────────────────────────────────────────

// DELETE /api/users/delete-account — Suppression complète et irréversible du compte
router.delete('/delete-account', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    // Vérification mot de passe (sauf si compte OAuth uniquement)
    if (user.password) {
      if (!password) return res.status(400).json({ error: 'Mot de passe requis pour confirmer la suppression' });
      const isValid = await user.comparePassword(password);
      if (!isValid) return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // 1. Supprimer toutes les photos Cloudinary
    for (const photo of user.photos) {
      if (photo.url && photo.url.includes('cloudinary')) {
        const urlParts = photo.url.split('/');
        const folderAndFile = urlParts.slice(-2).join('/');
        const publicId = folderAndFile.replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId).catch(err => {
          console.error('Cloudinary delete error:', err);
        });
      }
    }

    // 2. Supprimer les messages envoyés et reçus
    await Message.deleteMany({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }]
    });

    // 3. Supprimer les demandes de message
    await MessageRequest.deleteMany({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }]
    });

    // 4. Retirer l'utilisateur des listes de matches des autres
    await User.updateMany(
      { 'matches.user': req.user._id },
      { $pull: { matches: { user: req.user._id } } }
    );

    // 5. Supprimer le compte
    await User.findByIdAndDelete(req.user._id);

    res.json({ success: true, message: 'Compte supprimé définitivement' });
  } catch (error) {
    console.error('Erreur suppression compte:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
  }
});

// POST /api/users/complete-profile — Finaliser le profil OAuth (birthDate + gender)
router.post('/complete-profile', authMiddleware, async (req, res) => {
  try {
    const { birthDate, gender } = req.body;

    if (!birthDate) {
      return res.status(400).json({ error: 'La date de naissance est requise' });
    }

    const validGenders = ['homme', 'femme', 'autre'];
    if (!gender || !validGenders.includes(gender)) {
      return res.status(400).json({ error: 'Le genre est requis' });
    }

    // Vérification âge minimum 18 ans
    const age = Math.floor((Date.now() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      return res.status(403).json({ error: 'underage' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { birthDate, gender, profileComplete: true },
      { new: true }
    );

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    console.error('Erreur complete-profile:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

module.exports = router;
