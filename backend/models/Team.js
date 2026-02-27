const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200,
    default: ''
  },
  // Couleur/emoji de l'équipe pour la distinguer visuellement
  color: {
    type: String,
    default: '#F59E0B'
  },
  emoji: {
    type: String,
    default: '🏆'
  },
  // Compétition à laquelle l'équipe participe (optionnel)
  competition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    default: null
  },
  // Capitaine (créateur de l'équipe)
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Membres (incluant le capitaine)
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['captain', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Demandes en attente
  joinRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxMembers: {
    type: Number,
    default: 5,
    min: 2,
    max: 5
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Mise à jour automatique de updatedAt
teamSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Team', teamSchema);
