// Intercepteur Axios pour le mode démo (GitHub Pages)
// Intercepte les appels API et retourne des données fictives
import axios from 'axios';
import {
  DEMO_TOKEN,
  demoUser,
  demoProfiles,
  demoMatches,
  demoConversations,
  demoMessages,
  demoStreams,
  demoMessageRequests,
  demoModerationStats
} from './demoData';

// Vérifie si on est en mode démo
export const isDemoMode = () => {
  return process.env.REACT_APP_DEMO_MODE === 'true';
};

// Simule un délai réseau
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Crée une réponse simulée
const mockResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {}
});

// État local mutable pour simuler les interactions
let localLikedProfiles = [];
let localDislikedProfiles = [];

// Table de routage des endpoints mockés
const routeHandlers = {
  // === AUTH ===
  'POST /api/auth/login': async () => {
    return mockResponse({ token: DEMO_TOKEN, user: demoUser });
  },
  'POST /api/auth/register': async () => {
    return mockResponse({ token: DEMO_TOKEN, user: demoUser });
  },
  'POST /api/auth/change-password': async () => {
    return mockResponse({ message: 'Mot de passe modifié avec succès' });
  },

  // === USER ===
  'GET /api/users/me': async () => {
    return mockResponse({ user: demoUser });
  },
  'PATCH /api/users/me': async (config) => {
    const updates = config.data ? JSON.parse(config.data) : {};
    Object.assign(demoUser, updates);
    return mockResponse({ user: demoUser });
  },
  'DELETE /api/users/me': async () => {
    return mockResponse({ message: 'Compte supprimé' });
  },

  // === PHOTOS ===
  'POST /api/users/photos': async () => {
    const newPhoto = {
      _id: `photo-new-${Date.now()}`,
      url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=500&fit=crop',
      isPrimary: false
    };
    demoUser.photos.push(newPhoto);
    return mockResponse({ photo: newPhoto, user: demoUser });
  },

  // === SWIPE ===
  'POST /api/swipe/profiles': async () => {
    // Retourne les profils non encore swipés
    const available = demoProfiles.filter(
      p => !localLikedProfiles.includes(p._id) && !localDislikedProfiles.includes(p._id)
    );
    return mockResponse({ profiles: available, total: available.length });
  },

  // === MATCHES ===
  'GET /api/matches': async () => {
    return mockResponse({ matches: demoMatches });
  },

  // === CHAT ===
  'GET /api/chat/conversations': async () => {
    return mockResponse({ conversations: demoConversations });
  },

  // === STREAMS ===
  'GET /api/live/public': async () => {
    return mockResponse({ streams: demoStreams });
  },

  // === MESSAGE REQUESTS ===
  'GET /api/message-requests/received': async () => {
    return mockResponse({ requests: demoMessageRequests });
  },
  'GET /api/message-requests/sent': async () => {
    return mockResponse({ requests: [] });
  },

  // === SETTINGS ===
  'PATCH /api/users/settings/notifications': async () => {
    return mockResponse({ message: 'Paramètres de notification mis à jour' });
  },
  'PATCH /api/users/settings/privacy': async () => {
    return mockResponse({ message: 'Paramètres de confidentialité mis à jour' });
  },

  // === SUPPORT ===
  'POST /api/support': async () => {
    return mockResponse({ message: 'Ticket de support créé', ticketId: 'DEMO-001' });
  },

  // === MODERATION ===
  'GET /api/moderation/stats': async () => {
    return mockResponse(demoModerationStats);
  },
  'GET /api/moderation/users': async () => {
    return mockResponse({
      users: demoProfiles.map(p => ({
        ...p,
        email: `${p.firstName.toLowerCase()}@demo.com`,
        privilegeLevel: 0,
        isBanned: false,
        createdAt: '2024-01-15T10:00:00.000Z'
      })),
      total: demoProfiles.length
    });
  },
  'GET /api/moderation/reports': async () => {
    return mockResponse({ reports: [], total: 0 });
  }
};

// Résout les routes dynamiques (avec paramètres :id)
const resolveDynamicRoute = (method, url) => {
  // Swipe like/dislike
  const likeMatch = url.match(/^\/api\/swipe\/like\/(.+)$/);
  if (method === 'POST' && likeMatch) {
    return async () => {
      const userId = likeMatch[1];
      localLikedProfiles.push(userId);
      // Simule un match 1 fois sur 3
      const isMatch = Math.random() < 0.33;
      return mockResponse({ liked: true, isMatch, matchId: isMatch ? `match-new-${Date.now()}` : null });
    };
  }

  const dislikeMatch = url.match(/^\/api\/swipe\/dislike\/(.+)$/);
  if (method === 'POST' && dislikeMatch) {
    return async () => {
      localDislikedProfiles.push(dislikeMatch[1]);
      return mockResponse({ disliked: true });
    };
  }

  // Chat messages par userId
  const chatMatch = url.match(/^\/api\/chat\/([^/]+)$/);
  if (chatMatch) {
    const userId = chatMatch[1];
    if (method === 'GET') {
      return async () => {
        const messages = demoMessages[userId] || [];
        return mockResponse({ messages });
      };
    }
    if (method === 'POST') {
      return async (config) => {
        const body = config.data ? JSON.parse(config.data) : {};
        const newMsg = {
          _id: `msg-new-${Date.now()}`,
          content: body.content || body.message || '',
          sender: 'demo-user-001',
          createdAt: new Date().toISOString(),
          read: false
        };
        if (!demoMessages[userId]) demoMessages[userId] = [];
        demoMessages[userId].push(newMsg);
        return mockResponse({ message: newMsg });
      };
    }
  }

  // Chat read
  const readMatch = url.match(/^\/api\/chat\/([^/]+)\/read$/);
  if (method === 'PATCH' && readMatch) {
    return async () => mockResponse({ success: true });
  }

  // Public profile
  const publicProfileMatch = url.match(/^\/api\/public-profile\/(.+)$/);
  if (method === 'GET' && publicProfileMatch) {
    return async () => {
      const profile = demoProfiles.find(p => p._id === publicProfileMatch[1]) || demoProfiles[0];
      return mockResponse({ user: profile });
    };
  }

  // Message requests accept/reject
  const acceptMatch = url.match(/^\/api\/message-requests\/accept\/(.+)$/);
  if (method === 'POST' && acceptMatch) {
    return async () => mockResponse({ message: 'Demande acceptée' });
  }
  const rejectMatch = url.match(/^\/api\/message-requests\/reject\/(.+)$/);
  if (method === 'POST' && rejectMatch) {
    return async () => mockResponse({ message: 'Demande refusée' });
  }

  // Message request send
  const sendReqMatch = url.match(/^\/api\/message-requests\/send\/(.+)$/);
  if (method === 'POST' && sendReqMatch) {
    return async () => mockResponse({ message: 'Demande envoyée', requestId: `req-new-${Date.now()}` });
  }

  // Photos delete
  const photoDeleteMatch = url.match(/^\/api\/users\/photos\/(.+)$/);
  if (method === 'DELETE' && photoDeleteMatch) {
    return async () => {
      demoUser.photos = demoUser.photos.filter(p => p._id !== photoDeleteMatch[1]);
      return mockResponse({ user: demoUser });
    };
  }

  // Photo set primary
  const photoPrimaryMatch = url.match(/^\/api\/users\/photos\/(.+)\/primary$/);
  if (method === 'PATCH' && photoPrimaryMatch) {
    return async () => {
      demoUser.photos.forEach(p => { p.isPrimary = p._id === photoPrimaryMatch[1]; });
      return mockResponse({ user: demoUser });
    };
  }

  // Live favorite
  const favMatch = url.match(/^\/api\/live\/favorite\/(.+)$/);
  if (method === 'POST' && favMatch) {
    return async () => mockResponse({ favorited: true });
  }

  // Surprise mutual check
  const mutualMatch = url.match(/^\/api\/surprise\/check-mutual\/(.+)$/);
  if (method === 'GET' && mutualMatch) {
    return async () => mockResponse({ isMutual: true });
  }

  // Moderation actions dynamiques
  if (url.startsWith('/api/moderation/')) {
    return async () => mockResponse({ success: true, message: 'Action de modération effectuée' });
  }

  return null;
};

// Installe l'intercepteur axios pour le mode démo
export const setupDemoInterceptor = () => {
  if (!isDemoMode()) return;

  console.log('[DEMO MODE] Intercepteur API activé - données fictives');

  axios.interceptors.request.use(async (config) => {
    const method = (config.method || 'GET').toUpperCase();
    // Normaliser l'URL (enlever le baseURL si présent)
    let url = config.url || '';
    if (url.startsWith('http')) {
      try {
        const parsed = new URL(url);
        url = parsed.pathname;
      } catch (e) {
        // garder l'URL telle quelle
      }
    }

    const routeKey = `${method} ${url}`;

    // Chercher dans les routes statiques
    let handler = routeHandlers[routeKey];

    // Sinon, chercher dans les routes dynamiques
    if (!handler) {
      handler = resolveDynamicRoute(method, url);
    }

    if (handler) {
      await delay(200 + Math.random() * 300);
      const response = await handler(config);

      // On rejette la requête avec une erreur qui contient la réponse mockée
      // L'intercepteur de réponse la captera
      return Promise.reject({
        __demoMock: true,
        response
      });
    }

    // Si aucun handler trouvé, laisser passer (échouera probablement)
    console.warn(`[DEMO MODE] Endpoint non mocké: ${routeKey}`);
    // Retourner une réponse vide plutôt que laisser échouer
    return Promise.reject({
      __demoMock: true,
      response: mockResponse({ message: 'OK' })
    });
  });

  // Intercepteur de réponse pour transformer les "erreurs" mockées en succès
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error && error.__demoMock) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error);
    }
  );
};
