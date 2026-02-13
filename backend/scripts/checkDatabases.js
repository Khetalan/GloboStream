const mongoose = require('mongoose');
require('dotenv').config();

async function checkBases() {
  try {
    // Base production
    console.log('Vérification des bases de données MongoDB...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.connection.collection('users');
    const prodCount = await User.countDocuments();
    console.log('✅ Base PRODUCTION (dating-app):', prodCount, 'utilisateurs');
    await mongoose.disconnect();

    // Base test
    const testUri = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/dating-app-test$1');
    await mongoose.connect(testUri);
    const UserTest = mongoose.connection.collection('users');
    const testCount = await UserTest.countDocuments();
    console.log('✅ Base TEST (dating-app-test):', testCount, 'utilisateurs');

    console.log('\n📊 Résumé :');
    if (prodCount === 0) {
      console.log('⚠️  La base de production est VIDE');
      console.log('💡 Les comptes sont peut-être dans la base de test');
    } else {
      console.log('✅ La base de production contient des données');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkBases();
