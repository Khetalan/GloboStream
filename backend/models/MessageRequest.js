const mongoose = require('mongoose');

const messageRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour recherche rapide
messageRequestSchema.index({ sender: 1, recipient: 1 });
messageRequestSchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model('MessageRequest', messageRequestSchema);
