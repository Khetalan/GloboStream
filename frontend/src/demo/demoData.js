// Données fictives pour le mode démo (GitHub Pages)
// Permet de naviguer dans l'app sans backend

const DEMO_TOKEN = 'demo-token-globostream-2024';

// Utilisateur démo connecté
const demoUser = {
  _id: 'demo-user-001',
  id: 'demo-user-001',
  firstName: 'Alex',
  lastName: 'Demo',
  email: 'demo@globostream.app',
  birthDate: '1995-06-15',
  gender: 'homme',
  orientation: 'hétérosexuel',
  bio: 'Passionné de voyages et de nouvelles rencontres. Amateur de cuisine et de randonnée en montagne.',
  profession: 'Développeur Web',
  height: 178,
  children: 'non',
  smoker: 'non',
  housing: 'seul',
  languages: ['Français', 'English', 'Español'],
  interests: ['Voyages', 'Cuisine', 'Randonnée', 'Photographie', 'Musique'],
  lookingFor: 'relation',
  location: {
    type: 'Point',
    coordinates: [2.3522, 48.8566],
    city: 'Paris',
    country: 'France'
  },
  photos: [
    { _id: 'photo-1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', isPrimary: true },
    { _id: 'photo-2', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop', isPrimary: false },
    { _id: 'photo-3', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop', isPrimary: false }
  ],
  privilegeLevel: 2,
  isPremium: true,
  isVerified: true,
  isOnline: true,
  lastActive: new Date().toISOString(),
  createdAt: '2024-01-15T10:00:00.000Z',
  settings: {
    notifications: { matches: true, messages: true, likes: true },
    privacy: { showOnline: true, showDistance: true, showAge: true }
  }
};

// Profils fictifs pour le swipe
const demoProfiles = [
  {
    _id: 'profile-001',
    firstName: 'Sophie',
    lastName: 'M.',
    birthDate: '1997-03-22',
    gender: 'femme',
    bio: 'Architecte le jour, danseuse la nuit. Je cherche quelqu\'un qui aime autant les musées que les soirées improvisées.',
    profession: 'Architecte d\'intérieur',
    height: 168,
    languages: ['Français', 'English'],
    interests: ['Architecture', 'Danse', 'Art', 'Voyages', 'Yoga'],
    lookingFor: 'relation',
    location: { city: 'Paris', country: 'France', coordinates: [2.3522, 48.8566] },
    photos: [
      { _id: 'sp-1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop', isPrimary: true },
      { _id: 'sp-2', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop', isPrimary: false }
    ],
    isVerified: true,
    isPremium: false,
    isOnline: true,
    distance: 3.2
  },
  {
    _id: 'profile-002',
    firstName: 'Emma',
    lastName: 'L.',
    birthDate: '1996-08-10',
    gender: 'femme',
    bio: 'Passionnée de cuisine italienne et de road trips. Mon rêve : faire le tour du monde en van.',
    profession: 'Chef pâtissière',
    height: 165,
    languages: ['Français', 'Italiano'],
    interests: ['Cuisine', 'Voyages', 'Photographie', 'Musique', 'Nature'],
    lookingFor: 'relation',
    location: { city: 'Lyon', country: 'France', coordinates: [4.8357, 45.7640] },
    photos: [
      { _id: 'em-1', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop', isPrimary: true },
      { _id: 'em-2', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop', isPrimary: false }
    ],
    isVerified: true,
    isPremium: true,
    isOnline: false,
    distance: 5.8
  },
  {
    _id: 'profile-003',
    firstName: 'Léa',
    lastName: 'B.',
    birthDate: '1998-12-05',
    gender: 'femme',
    bio: 'Étudiante en médecine, sportive et fan de séries. Toujours partante pour un brunch le dimanche !',
    profession: 'Étudiante en médecine',
    height: 170,
    languages: ['Français', 'English', 'Deutsch'],
    interests: ['Sport', 'Séries', 'Brunch', 'Lecture', 'Running'],
    lookingFor: 'relation',
    location: { city: 'Bordeaux', country: 'France', coordinates: [-0.5792, 44.8378] },
    photos: [
      { _id: 'le-1', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop', isPrimary: true }
    ],
    isVerified: false,
    isPremium: false,
    isOnline: true,
    distance: 8.1
  },
  {
    _id: 'profile-004',
    firstName: 'Camille',
    lastName: 'R.',
    birthDate: '1994-05-18',
    gender: 'femme',
    bio: 'Graphiste freelance et amoureuse des chats. J\'adore les marchés aux puces et le café filtre.',
    profession: 'Graphiste',
    height: 162,
    languages: ['Français', 'Español'],
    interests: ['Design', 'Chats', 'Vintage', 'Café', 'Illustration'],
    lookingFor: 'amitié',
    location: { city: 'Marseille', country: 'France', coordinates: [5.3698, 43.2965] },
    photos: [
      { _id: 'ca-1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop', isPrimary: true },
      { _id: 'ca-2', url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop', isPrimary: false }
    ],
    isVerified: true,
    isPremium: false,
    isOnline: false,
    distance: 12.4
  },
  {
    _id: 'profile-005',
    firstName: 'Chloé',
    lastName: 'D.',
    birthDate: '1999-09-30',
    gender: 'femme',
    bio: 'Musicienne, voyageuse et optimiste. Je joue de la guitare et je chante sous la douche (plutôt bien).',
    profession: 'Musicienne',
    height: 172,
    languages: ['Français', 'English', 'Português'],
    interests: ['Musique', 'Guitare', 'Voyages', 'Cinéma', 'Festivals'],
    lookingFor: 'relation',
    location: { city: 'Toulouse', country: 'France', coordinates: [1.4442, 43.6047] },
    photos: [
      { _id: 'ch-1', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop', isPrimary: true }
    ],
    isVerified: true,
    isPremium: true,
    isOnline: true,
    distance: 15.7
  }
];

// Matches fictifs
const demoMatches = [
  {
    _id: 'match-001',
    user: {
      _id: 'profile-001',
      firstName: 'Sophie',
      lastName: 'M.',
      photos: demoProfiles[0].photos,
      isOnline: true,
      bio: demoProfiles[0].bio
    },
    matchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastMessage: { content: 'Salut ! Comment ça va ?', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() }
  },
  {
    _id: 'match-002',
    user: {
      _id: 'profile-002',
      firstName: 'Emma',
      lastName: 'L.',
      photos: demoProfiles[1].photos,
      isOnline: false,
      bio: demoProfiles[1].bio
    },
    matchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: { content: 'Tu connais un bon resto italien ?', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }
  },
  {
    _id: 'match-003',
    user: {
      _id: 'profile-005',
      firstName: 'Chloé',
      lastName: 'D.',
      photos: demoProfiles[4].photos,
      isOnline: true,
      bio: demoProfiles[4].bio
    },
    matchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    lastMessage: null
  }
];

// Conversations fictives
const demoConversations = [
  {
    _id: 'conv-001',
    otherUser: {
      _id: 'profile-001',
      firstName: 'Sophie',
      lastName: 'M.',
      photos: demoProfiles[0].photos,
      isOnline: true
    },
    lastMessage: {
      content: 'Salut ! Comment ça va ?',
      sender: 'profile-001',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false
    },
    unreadCount: 1
  },
  {
    _id: 'conv-002',
    otherUser: {
      _id: 'profile-002',
      firstName: 'Emma',
      lastName: 'L.',
      photos: demoProfiles[1].photos,
      isOnline: false
    },
    lastMessage: {
      content: 'Tu connais un bon resto italien ?',
      sender: 'demo-user-001',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    unreadCount: 0
  }
];

// Messages fictifs par conversation
const demoMessages = {
  'profile-001': [
    { _id: 'msg-1', content: 'Hey ! J\'ai vu que tu aimais la randonnée aussi !', sender: 'demo-user-001', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), read: true },
    { _id: 'msg-2', content: 'Oui j\'adore ! Tu as déjà fait le GR20 ?', sender: 'profile-001', createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), read: true },
    { _id: 'msg-3', content: 'Pas encore, c\'est sur ma liste ! Tu recommandes ?', sender: 'demo-user-001', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), read: true },
    { _id: 'msg-4', content: 'Salut ! Comment ça va ?', sender: 'profile-001', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), read: false }
  ],
  'profile-002': [
    { _id: 'msg-5', content: 'Coucou Emma ! Ton profil m\'a beaucoup plu', sender: 'demo-user-001', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), read: true },
    { _id: 'msg-6', content: 'Merci ! J\'ai vu que tu aimais la cuisine aussi', sender: 'profile-002', createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), read: true },
    { _id: 'msg-7', content: 'Tu connais un bon resto italien ?', sender: 'demo-user-001', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), read: true }
  ]
};

// Streams fictifs
const demoStreams = [
  {
    _id: 'stream-001',
    streamer: {
      _id: 'profile-003',
      firstName: 'Léa',
      photos: demoProfiles[2].photos
    },
    title: 'Soirée chill & discussion',
    category: 'Discussion',
    viewerCount: 24,
    isLive: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop'
  },
  {
    _id: 'stream-002',
    streamer: {
      _id: 'profile-004',
      firstName: 'Camille',
      photos: demoProfiles[3].photos
    },
    title: 'Cours de dessin en direct',
    category: 'Créatif',
    viewerCount: 12,
    isLive: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop'
  }
];

// Demandes de message
const demoMessageRequests = [
  {
    _id: 'req-001',
    sender: {
      _id: 'profile-003',
      firstName: 'Léa',
      lastName: 'B.',
      photos: demoProfiles[2].photos
    },
    message: 'Salut ! J\'ai vu qu\'on avait plein de centres d\'intérêt en commun. On discute ?',
    status: 'pending',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  }
];

// Stats modération (pour ModerationPanel)
const demoModerationStats = {
  totalUsers: 1247,
  activeToday: 342,
  reportsToReview: 8,
  bannedUsers: 15,
  newUsersThisWeek: 89
};

export {
  DEMO_TOKEN,
  demoUser,
  demoProfiles,
  demoMatches,
  demoConversations,
  demoMessages,
  demoStreams,
  demoMessageRequests,
  demoModerationStats
};
