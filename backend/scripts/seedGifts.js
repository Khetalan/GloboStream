/**
 * Script de seed — Catalogue de cadeaux initial
 * Usage : node backend/scripts/seedGifts.js
 *
 * Insère les 6 cadeaux de base dans la collection GiftCatalog.
 * Ne fait rien si des cadeaux existent déjà.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const GiftCatalog = require('../models/GiftCatalog');

const INITIAL_GIFTS = [
  { id: 'rose',    emoji: '🌹', name: 'Rose',     coinCost: 1,   globoValue: 1,   order: 1 },
  { id: 'kiss',    emoji: '💋', name: 'Bisou',    coinCost: 5,   globoValue: 5,   order: 2 },
  { id: 'heart',   emoji: '❤️', name: 'Cœur',     coinCost: 10,  globoValue: 10,  order: 3 },
  { id: 'star',    emoji: '⭐', name: 'Étoile',   coinCost: 20,  globoValue: 20,  order: 4 },
  { id: 'crown',   emoji: '👑', name: 'Couronne', coinCost: 50,  globoValue: 50,  order: 5 },
  { id: 'diamond', emoji: '💎', name: 'Diamant',  coinCost: 100, globoValue: 100, order: 6 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');

    const count = await GiftCatalog.countDocuments();
    if (count > 0) {
      console.log(`ℹ️  ${count} cadeau(x) déjà présent(s) dans la collection. Seed ignoré.`);
      process.exit(0);
    }

    const result = await GiftCatalog.insertMany(INITIAL_GIFTS);
    console.log(`✅ ${result.length} cadeaux insérés :`);
    result.forEach(g => console.log(`   ${g.emoji} ${g.name} — ${g.coinCost}🪙 → ${g.globoValue}🌐`));
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur seed:', error);
    process.exit(1);
  }
}

seed();
