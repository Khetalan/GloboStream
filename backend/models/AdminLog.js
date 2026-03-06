const mongoose = require('mongoose');

/**
 * AdminLog — Historique des actions de modération
 * Chaque action (ban, warn, promote, kick, etc.) crée une entrée.
 */
const adminLogSchema = new mongoose.Schema({
  // Qui a effectué l'action
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actorName: {
    type: String,
    required: true
  },

  // Type d'action
  action: {
    type: String,
    required: true,
    enum: [
      'ban', 'unban', 'warn',
      'promote_moderator', 'demote_moderator', 'promote_admin',
      'update_permissions',
      'report_reviewed', 'report_resolved', 'report_dismissed',
      'live_kick', 'live_block',
      'stream_stopped'
    ]
  },

  // Cible de l'action (utilisateur, rapport, etc.)
  targetId:   { type: mongoose.Schema.Types.ObjectId },
  targetName: { type: String },
  targetType: {
    type: String,
    enum: ['user', 'report', 'stream', 'room'],
    default: 'user'
  },

  // Détails supplémentaires (raison, durée, etc.)
  details: { type: mongoose.Schema.Types.Mixed },

  // IP du modérateur au moment de l'action
  ip: { type: String }
}, {
  timestamps: true
});

// Index pour pagination rapide et filtres
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ actorId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);
