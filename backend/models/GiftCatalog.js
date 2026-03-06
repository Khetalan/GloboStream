const mongoose = require('mongoose');

const giftCatalogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },     // 'rose', 'diamond', etc.
  name: { type: String, required: true },                  // 'Rose', 'Diamant'
  emoji: { type: String, required: true },                 // '🌹', '💎'
  coinCost: { type: Number, required: true, min: 1 },     // pièces débitées au viewer
  globoValue: { type: Number, required: true, min: 1 },   // globos crédités au streamer
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

giftCatalogSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('GiftCatalog', giftCatalogSchema);
