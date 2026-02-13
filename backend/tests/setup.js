// Configuration globale pour les tests
const mongoose = require('mongoose');
require('dotenv').config();

// Utiliser une base de test séparée
const TEST_DB_URI = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/dating-app-test$1');

beforeAll(async () => {
  // Connexion à la base de test
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  // Nettoyer et fermer la connexion
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  await mongoose.connection.close();
});
