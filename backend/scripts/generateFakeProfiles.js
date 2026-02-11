const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connexion MongoDB
const MONGODB_URI = 'mongodb+srv://khetalan-serveur:Pzktd9a26240@dating-app.ytbai86.mongodb.net/dating-app?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// Données pour génération aléatoire
const firstNamesMale = [
  'Lucas', 'Thomas', 'Hugo', 'Alexandre', 'Maxime', 'Antoine', 'Julien', 'Pierre', 
  'Nicolas', 'Léo', 'Arthur', 'Nathan', 'Louis', 'Gabriel', 'Raphaël'
];

const firstNamesFemale = [
  'Emma', 'Léa', 'Clara', 'Chloé', 'Camille', 'Sarah', 'Julie', 'Marie', 
  'Laura', 'Manon', 'Alice', 'Lola', 'Charlotte', 'Zoé', 'Inès'
];

const lastNames = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand',
  'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David',
  'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Lefevre'
];

const cities = [
  { city: 'Paris', country: 'France', coordinates: [2.3522, 48.8566] },
  { city: 'Lyon', country: 'France', coordinates: [4.8357, 45.7640] },
  { city: 'Marseille', country: 'France', coordinates: [5.3698, 43.2965] },
  { city: 'Toulouse', country: 'France', coordinates: [1.4442, 43.6047] },
  { city: 'Nice', country: 'France', coordinates: [7.2619, 43.7102] },
  { city: 'Nantes', country: 'France', coordinates: [-1.5534, 47.2184] },
  { city: 'Strasbourg', country: 'France', coordinates: [7.7521, 48.5734] },
  { city: 'Bordeaux', country: 'France', coordinates: [-0.5792, 44.8378] },
  { city: 'Lille', country: 'France', coordinates: [3.0573, 50.6292] },
  { city: 'Montpellier', country: 'France', coordinates: [3.8767, 43.6108] }
];

const occupations = [
  'Développeur', 'Designer', 'Marketing Manager', 'Entrepreneur', 'Architecte',
  'Médecin', 'Avocat', 'Professeur', 'Ingénieur', 'Commercial', 'Consultant',
  'Chef de projet', 'Photographe', 'Infirmier', 'Comptable', 'Journaliste'
];

const interestsList = [
  'Voyages', 'Sport', 'Musique', 'Cinéma', 'Lecture', 'Cuisine', 'Art',
  'Technologie', 'Nature', 'Danse', 'Photographie', 'Fitness', 'Gaming',
  'Mode', 'Yoga', 'Randonnée', 'Vélo', 'Tennis', 'Natation', 'Théâtre'
];

const languagesList = [
  'Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Portugais',
  'Arabe', 'Chinois', 'Japonais', 'Russe'
];

const bioTemplates = [
  "Passionné(e) par la vie, toujours prêt(e) pour de nouvelles aventures ! J'adore voyager et découvrir de nouvelles cultures.",
  "À la recherche de quelqu'un avec qui partager de bons moments. Fan de musique et de cinéma.",
  "Sportif(ve) dans l'âme, j'aime rester actif(ve). Le week-end, tu me trouveras en train de faire du sport ou d'explorer la ville.",
  "Développeur le jour, cuisinier passionné le soir. J'adore tester de nouvelles recettes !",
  "Créatif(ve) et rêveur(se), je crois aux belles rencontres et aux histoires qui durent.",
  "Amoureux(se) de la nature et des randonnées. Toujours partant(e) pour un road trip !",
  "Entrepreneur passionné, j'aime les défis et les projets ambitieux. Mais je sais aussi profiter des moments simples.",
  "Grande amatrice de yoga et de bien-être. Je recherche quelqu'un qui partage ces valeurs.",
  "Cinéphile invétéré(e), j'ai toujours une recommandation de film à partager !",
  "Foodie assumé(e) ! J'adore découvrir de nouveaux restaurants et cuisines du monde.",
  "Passionné(e) de photographie, je capture les petits moments de bonheur du quotidien.",
  "Lecteur(rice) compulsif(ve), toujours un livre à la main. Et toi, quelles sont tes dernières lectures ?",
  "Fan de musique live et de concerts. Rien de mieux qu'un bon festival entre amis !",
  "Accro au fitness mais aussi aux séries Netflix. L'équilibre, c'est important non ?",
  "Voyageur(se) dans l'âme, 30 pays visités et ce n'est qu'un début !"
];

const lookingForOptions = ['relation-serieuse', 'rencontre-casual', 'amitie', 'ne-sais-pas'];
const hasChildrenOptions = ['oui', 'non', 'non-precise'];
const smokerOptions = ['oui', 'non', 'rarement', 'souvent'];
const housingOptions = ['seul', 'colocation', 'parents', 'etudiant', 'autre'];

// Fonction helper
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomElements(array, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomAge(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHeight(gender) {
  if (gender === 'homme') {
    return Math.floor(Math.random() * (195 - 165 + 1)) + 165; // 165-195cm
  } else {
    return Math.floor(Math.random() * (180 - 155 + 1)) + 155; // 155-180cm
  }
}

function getBirthDateFromAge(age) {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, birthMonth, birthDay);
}

// Photos placeholder (URLs d'avatars génériques)
function getPhotoUrl(gender, index) {
  const seed = Math.random().toString(36).substring(7);
  return `https://i.pravatar.cc/400?img=${Math.floor(Math.random() * 70) + 1}`;
}

async function generateFakeProfiles() {
  console.log('🚀 Génération de 20 profils...\n');

  const profiles = [];

  for (let i = 0; i < 60; i++) {
    const gender = i < 10 ? 'homme' : 'femme';
    const firstName = gender === 'homme' 
      ? randomElement(firstNamesMale) 
      : randomElement(firstNamesFemale);
    const lastName = randomElement(lastNames);
    const age = randomAge(22, 45);
    const location = randomElement(cities);

    // Générer 2-4 photos
    const photoCount = Math.floor(Math.random() * 3) + 2; // 2-4 photos
    const photos = [];
    for (let j = 0; j < photoCount; j++) {
      photos.push({
        url: getPhotoUrl(gender, j),
        isPrimary: j === 0,
        uploadedAt: new Date()
      });
    }

    const profile = {
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@test.com`,
      password: await bcrypt.hash('password123', 12),
      firstName: firstName,
      lastName: lastName,
      displayName: `${firstName} ${lastName.charAt(0)}.`,
      birthDate: getBirthDateFromAge(age),
      gender: gender,
      bio: randomElement(bioTemplates),
      
      photos: photos,
      
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        city: location.city,
        country: location.country
      },
      
      interests: randomElements(interestsList, 3, 6),
      languages: randomElements(languagesList, 2, 4),
      occupation: randomElement(occupations),
      height: randomHeight(gender),
      hasChildren: randomElement(hasChildrenOptions),
      sexualOrientation: 'heterosexuel',
      housing: randomElement(housingOptions),
      smoker: randomElement(smokerOptions),
      lookingFor: randomElement(lookingForOptions),
      interestedIn: gender === 'homme' ? 'femme' : 'homme',
      
      preferences: {
        ageRange: {
          min: age - 5,
          max: age + 10
        },
        distance: Math.floor(Math.random() * 50) + 20, // 20-70km
        showMe: [gender === 'homme' ? 'femme' : 'homme']
      },
      
      isLive: Math.random() > 0.85, // 15% en live
      isVerified: Math.random() > 0.7, // 30% vérifiés
      isPremium: Math.random() > 0.8, // 20% premium
      isActive: true,
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Actif dans les 7 derniers jours
      
      privilegeLevel: 0,
      moderationPermissions: {
        canBanUsers: false,
        canDeleteContent: false,
        canManageStreams: false,
        canViewReports: false,
        canIssueWarnings: false
      }
    };

    profiles.push(profile);

    console.log(`✅ Profil ${i + 1}/20: ${profile.displayName} (${profile.gender}, ${age} ans, ${location.city})`);
  }

  try {
    await User.insertMany(profiles);
    console.log('\n🎉 20 profils générés avec succès !');
    console.log('\n📊 Répartition:');
    console.log(`   - 10 hommes`);
    console.log(`   - 10 femmes`);
    console.log(`   - Âges: 22-45 ans`);
    console.log(`   - 10 villes différentes`);
    console.log(`   - 2-4 photos par profil`);
    console.log(`   - Intérêts, langues, et préférences variés`);
    console.log(`   - ~15% en live streaming`);
    console.log(`   - ~30% profils vérifiés`);
    console.log(`   - ~20% premium`);
    
    console.log('\n🔐 Identifiants de connexion:');
    console.log('   Email: [prenom].[nom][numero]@test.com');
    console.log('   Password: password123');
    console.log('\n   Exemples:');
    profiles.slice(0, 3).forEach(p => {
      console.log(`   - ${p.email} (${p.displayName})`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n👋 Connexion MongoDB fermée');
  }
}

// Exécution
generateFakeProfiles();
