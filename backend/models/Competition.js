const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  // Informations générales
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, maxlength: 300 },
  rules: { type: String, maxlength: 5000 },
  prize: { type: String, maxlength: 200 },

  // Statut et dates
  status: {
    type: String,
    enum: ['active', 'upcoming', 'finished'],
    default: 'upcoming'
  },
  startDate: { type: Date },
  endDate:   { type: Date },

  // Contraintes
  maxTeams: { type: Number, default: 0 }, // 0 = illimité

  // Métadonnées
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Mettre à jour updatedAt avant chaque save
competitionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Competition', competitionSchema);
