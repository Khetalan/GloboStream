const mongoose = require('mongoose');
const User = require('./models/User');

// Connexion MongoDB
const MONGODB_URI = 'mongodb+srv://khetalan-serveur:Pzktd9a26240@dating-app.ytbai86.mongodb.net/dating-app?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

async function cleanFakeProfiles() {
  try {
    console.log('🗑️  Suppression des profils de test...\n');

    // Supprimer tous les profils avec email contenant @test.com
    const result = await User.deleteMany({ 
      email: { $regex: /@test\.com$/i } 
    });

    console.log(`✅ ${result.deletedCount} profils de test supprimés`);

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  } finally {
    mongoose.connection.close();
    console.log('👋 Connexion MongoDB fermée');
  }
}

// Demander confirmation
console.log('⚠️  ATTENTION: Cette action va supprimer TOUS les profils avec @test.com');
console.log('Appuyez sur Ctrl+C pour annuler, ou attendez 3 secondes...\n');

setTimeout(() => {
  cleanFakeProfiles();
}, 3000);
