const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Auteur du signalement
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Utilisateur signalé
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Type de contenu signalé
  type: {
    type: String,
    enum: ['profile', 'message', 'live', 'user'],
    required: true
  },

  // ID de l'élément spécifique signalé (messageId, roomId, etc.)
  targetId: {
    type: String,
    default: null
  },

  // Raison du signalement
  reason: {
    type: String,
    enum: ['harassment', 'spam', 'inappropriate', 'underage', 'violence', 'other'],
    required: true
  },

  // Description optionnelle (max 500 caractères)
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },

  // Statut du traitement
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },

  // Modérateur ayant traité le signalement
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Note interne du modérateur
  moderatorNote: {
    type: String,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true
});

// Index pour éviter les doublons rapides (même reporter, même cible, même type dans les 24h)
reportSchema.index({ reporterId: 1, reportedUserId: 1, type: 1, createdAt: 1 });

// Index pour la liste admin (statut + date)
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
