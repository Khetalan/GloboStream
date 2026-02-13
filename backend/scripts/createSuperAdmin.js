const mongoose = require('mongoose');
const User = require('../models/User');

// Connexion MongoDB - utilise la même URI que generateFakeProfiles
const MONGODB_URI = 'mongodb+srv://khetalan-serveur:Pzktd9a26240@dating-app.ytbai86.mongodb.net/dating-app?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connecté');

    const email = process.argv[2] || 'superadmin@test.com';

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ Utilisateur ${email} non trouvé`);
      process.exit(1);
    }

    // Promouvoir en SuperAdmin
    user.privilegeLevel = 3;
    user.moderationPermissions = {
      canBanUsers: true,
      canDeleteContent: true,
      canManageStreams: true,
      canViewReports: true,
      canIssueWarnings: true
    };

    await user.save();
    console.log(`✅ ${user.displayName} (${email}) promu SuperAdmin (level 3)`);
    console.log('   Permissions:', JSON.stringify(user.moderationPermissions));

    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  });
