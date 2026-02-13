/**
 * Script de Load Testing pour Socket.IO + WebRTC
 *
 * Tests :
 * - Connexions Socket.IO simultanées
 * - Envoi/réception de messages en masse
 * - Signaling WebRTC (offer/answer/ice-candidate)
 * - Typing indicators
 * - Match notifications
 * - Latence et stabilité des connexions
 *
 * Usage :
 *   node backend/scripts/loadTest.js [options]
 *
 * Options :
 *   --users <n>        Nombre d'utilisateurs simultanés (défaut: 50)
 *   --messages <n>     Nombre de messages par utilisateur (défaut: 10)
 *   --duration <s>     Durée du test en secondes (défaut: 60)
 *   --url <url>        URL du serveur (défaut: http://localhost:5000)
 */

const io = require('socket.io-client');
const axios = require('axios');

// Configuration par défaut
const config = {
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  numUsers: parseInt(process.argv.find(arg => arg.startsWith('--users='))?.split('=')[1]) || 50,
  messagesPerUser: parseInt(process.argv.find(arg => arg.startsWith('--messages='))?.split('=')[1]) || 10,
  testDuration: parseInt(process.argv.find(arg => arg.startsWith('--duration='))?.split('=')[1]) || 60,
};

// Métriques
const metrics = {
  connectionsSucceeded: 0,
  connectionsFailed: 0,
  messagesSent: 0,
  messagesReceived: 0,
  webrtcOffersSucceeded: 0,
  webrtcAnswersSucceeded: 0,
  iceCandidatesExchanged: 0,
  typingEventsReceived: 0,
  matchNotificationsReceived: 0,
  totalLatency: 0,
  latencyCount: 0,
  errors: [],
  startTime: null,
  endTime: null,
};

// Stocker les sockets et utilisateurs
const sockets = [];
const testUsers = [];

/**
 * Créer un utilisateur de test
 */
async function createTestUser(index) {
  try {
    const email = `loadtest${index}@test.com`;
    const password = 'LoadTest123';

    // Tenter de s'inscrire (ou se connecter si déjà existant)
    try {
      const response = await axios.post(`${config.serverUrl}/api/auth/register`, {
        email,
        password,
        firstName: `LoadTest${index}`,
        lastName: 'User',
        birthDate: '1990-01-01',
        gender: index % 2 === 0 ? 'homme' : 'femme'
      });

      return {
        id: response.data.user.id,
        token: response.data.token,
        email,
        index
      };
    } catch (registerError) {
      // Si l'utilisateur existe déjà, se connecter
      if (registerError.response?.status === 400) {
        const loginResponse = await axios.post(`${config.serverUrl}/api/auth/login`, {
          email,
          password
        });

        return {
          id: loginResponse.data.user.id,
          token: loginResponse.data.token,
          email,
          index
        };
      }
      throw registerError;
    }
  } catch (error) {
    console.error(`❌ Erreur création utilisateur ${index}:`, error.message);
    metrics.errors.push({ type: 'user_creation', index, error: error.message });
    return null;
  }
}

/**
 * Créer une connexion Socket.IO
 */
function createSocketConnection(user) {
  return new Promise((resolve, reject) => {
    const socket = io(config.serverUrl, {
      transports: ['websocket'],
      auth: {
        token: user.token
      },
      reconnection: false
    });

    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error('Connection timeout'));
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      metrics.connectionsSucceeded++;

      // Enregistrer l'utilisateur
      socket.emit('register', user.id);

      console.log(`✅ [${user.index}] Connecté (${metrics.connectionsSucceeded}/${config.numUsers})`);
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      metrics.connectionsFailed++;
      metrics.errors.push({ type: 'connection', user: user.index, error: error.message });
      reject(error);
    });

    // Événements reçus
    socket.on('newMessage', (data) => {
      metrics.messagesReceived++;
      const latency = Date.now() - data.timestamp;
      metrics.totalLatency += latency;
      metrics.latencyCount++;
    });

    socket.on('userTyping', () => {
      metrics.typingEventsReceived++;
    });

    socket.on('matchNotification', () => {
      metrics.matchNotificationsReceived++;
    });

    socket.on('offer', () => {
      metrics.webrtcOffersSucceeded++;
    });

    socket.on('answer', () => {
      metrics.webrtcAnswersSucceeded++;
    });

    socket.on('ice-candidate', () => {
      metrics.iceCandidatesExchanged++;
    });

    socket.on('error', (error) => {
      metrics.errors.push({ type: 'socket_error', user: user.index, error });
    });
  });
}

/**
 * Envoyer des messages de test
 */
function sendMessages(socket, user, recipientUser) {
  const interval = (config.testDuration * 1000) / config.messagesPerUser;
  let messageCount = 0;

  const sendMessage = () => {
    if (messageCount >= config.messagesPerUser) {
      return;
    }

    const message = {
      recipientId: recipientUser.id,
      senderId: user.id,
      message: `Test message ${messageCount} from user ${user.index}`,
      timestamp: Date.now()
    };

    socket.emit('sendMessage', message);
    metrics.messagesSent++;
    messageCount++;

    setTimeout(sendMessage, interval + Math.random() * 1000); // Ajouter un peu de jitter
  };

  // Commencer à envoyer des messages
  setTimeout(sendMessage, Math.random() * 2000); // Décalage aléatoire
}

/**
 * Envoyer des typing indicators
 */
function sendTypingIndicators(socket, user, recipientUser) {
  const interval = 3000 + Math.random() * 2000; // Entre 3 et 5 secondes

  const sendTyping = () => {
    socket.emit('typing', {
      recipientId: recipientUser.id,
      isTyping: Math.random() > 0.5
    });

    setTimeout(sendTyping, interval);
  };

  setTimeout(sendTyping, Math.random() * 3000);
}

/**
 * Simuler un échange WebRTC
 */
function simulateWebRTC(socket, user, recipientUser) {
  const interval = 10000 + Math.random() * 5000; // Entre 10 et 15 secondes

  const sendWebRTCSignal = () => {
    // Simuler un offer
    const fakeOffer = {
      type: 'offer',
      sdp: 'v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n...'
    };

    socket.emit('offer', {
      recipientId: recipientUser.id,
      offer: fakeOffer
    });

    // Simuler des ICE candidates
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        socket.emit('ice-candidate', {
          recipientId: recipientUser.id,
          candidate: {
            candidate: `candidate:${i} 1 udp 2122260223 192.168.1.${i} 54321 typ host`,
            sdpMLineIndex: 0,
            sdpMid: '0'
          }
        });
      }
    }, 500);

    setTimeout(sendWebRTCSignal, interval);
  };

  setTimeout(sendWebRTCSignal, Math.random() * 5000);
}

/**
 * Afficher les métriques
 */
function displayMetrics() {
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const avgLatency = metrics.latencyCount > 0 ? (metrics.totalLatency / metrics.latencyCount).toFixed(2) : 0;
  const messageRate = (metrics.messagesSent / duration).toFixed(2);
  const successRate = ((metrics.connectionsSucceeded / config.numUsers) * 100).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTATS DU LOAD TEST');
  console.log('='.repeat(60));
  console.log(`⏱️  Durée totale: ${duration.toFixed(2)}s`);
  console.log(`👥 Utilisateurs: ${config.numUsers}`);
  console.log(`💬 Messages par utilisateur: ${config.messagesPerUser}`);
  console.log('');
  console.log('🔌 CONNEXIONS:');
  console.log(`   ✅ Réussies: ${metrics.connectionsSucceeded}/${config.numUsers} (${successRate}%)`);
  console.log(`   ❌ Échouées: ${metrics.connectionsFailed}`);
  console.log('');
  console.log('💬 MESSAGES:');
  console.log(`   📤 Envoyés: ${metrics.messagesSent}`);
  console.log(`   📥 Reçus: ${metrics.messagesReceived}`);
  console.log(`   📈 Taux: ${messageRate} msg/s`);
  console.log(`   ⏱️  Latence moyenne: ${avgLatency}ms`);
  console.log('');
  console.log('⌨️  TYPING INDICATORS:');
  console.log(`   Reçus: ${metrics.typingEventsReceived}`);
  console.log('');
  console.log('🎥 WEBRTC SIGNALING:');
  console.log(`   Offers: ${metrics.webrtcOffersSucceeded}`);
  console.log(`   Answers: ${metrics.webrtcAnswersSucceeded}`);
  console.log(`   ICE Candidates: ${metrics.iceCandidatesExchanged}`);
  console.log('');
  console.log('💝 NOTIFICATIONS:');
  console.log(`   Match notifications: ${metrics.matchNotificationsReceived}`);
  console.log('');

  if (metrics.errors.length > 0) {
    console.log('❌ ERREURS:');
    const errorsByType = metrics.errors.reduce((acc, err) => {
      acc[err.type] = (acc[err.type] || 0) + 1;
      return acc;
    }, {});

    Object.entries(errorsByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    if (metrics.errors.length <= 5) {
      console.log('\n   Détails:');
      metrics.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. [${err.type}] ${err.error}`);
      });
    }
  }

  console.log('='.repeat(60));

  // Verdict
  const isSuccess = successRate >= 95 && metrics.errors.length < config.numUsers * 0.1;
  console.log(isSuccess ? '\n✅ TEST RÉUSSI' : '\n⚠️  TEST AVEC AVERTISSEMENTS');
}

/**
 * Nettoyer les connexions
 */
function cleanup() {
  console.log('\n🧹 Nettoyage des connexions...');
  sockets.forEach(socket => {
    if (socket && socket.connected) {
      socket.close();
    }
  });
  sockets.length = 0;
}

/**
 * Fonction principale
 */
async function runLoadTest() {
  console.log('🚀 Démarrage du Load Test Socket.IO + WebRTC');
  console.log('='.repeat(60));
  console.log(`Serveur: ${config.serverUrl}`);
  console.log(`Utilisateurs: ${config.numUsers}`);
  console.log(`Messages par utilisateur: ${config.messagesPerUser}`);
  console.log(`Durée du test: ${config.testDuration}s`);
  console.log('='.repeat(60));

  // Vérifier la santé du serveur
  try {
    const healthCheck = await axios.get(`${config.serverUrl}/api/health`);
    console.log('✅ Serveur accessible:', healthCheck.data.message);
  } catch (error) {
    console.error('❌ Serveur inaccessible:', error.message);
    process.exit(1);
  }

  metrics.startTime = Date.now();

  // Étape 1: Créer les utilisateurs de test
  console.log('\n📝 Création des utilisateurs de test...');
  for (let i = 0; i < config.numUsers; i++) {
    const user = await createTestUser(i);
    if (user) {
      testUsers.push(user);
    }
  }

  if (testUsers.length === 0) {
    console.error('❌ Aucun utilisateur créé. Abandon du test.');
    process.exit(1);
  }

  console.log(`✅ ${testUsers.length} utilisateurs créés`);

  // Étape 2: Créer les connexions Socket.IO
  console.log('\n🔌 Connexion des utilisateurs...');
  const connectionPromises = testUsers.map(async (user) => {
    try {
      const socket = await createSocketConnection(user);
      sockets.push(socket);
      return socket;
    } catch (error) {
      console.error(`❌ [${user.index}] Échec connexion:`, error.message);
      return null;
    }
  });

  await Promise.all(connectionPromises);

  if (sockets.length === 0) {
    console.error('❌ Aucune connexion Socket.IO établie. Abandon du test.');
    cleanup();
    process.exit(1);
  }

  console.log(`✅ ${sockets.length} connexions Socket.IO établies`);

  // Étape 3: Lancer les tests de charge
  console.log('\n🔥 Lancement des tests de charge...');

  sockets.forEach((socket, index) => {
    if (!socket) return;

    const user = testUsers[index];
    // Choisir un destinataire aléatoire (différent de soi-même)
    const recipientIndex = (index + 1 + Math.floor(Math.random() * (testUsers.length - 1))) % testUsers.length;
    const recipient = testUsers[recipientIndex];

    // Lancer les différents types de tests
    sendMessages(socket, user, recipient);
    sendTypingIndicators(socket, user, recipient);

    // Seulement 20% des utilisateurs font du WebRTC pour ne pas surcharger
    if (Math.random() < 0.2) {
      simulateWebRTC(socket, user, recipient);
    }
  });

  // Étape 4: Attendre la fin du test
  console.log(`⏳ Test en cours pendant ${config.testDuration} secondes...\n`);

  await new Promise(resolve => setTimeout(resolve, config.testDuration * 1000));

  metrics.endTime = Date.now();

  // Étape 5: Afficher les résultats
  displayMetrics();

  // Étape 6: Nettoyer
  cleanup();

  console.log('\n✅ Load test terminé\n');
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
  cleanup();
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  Test interrompu par l\'utilisateur');
  metrics.endTime = Date.now();
  displayMetrics();
  cleanup();
  process.exit(0);
});

// Lancer le test
runLoadTest().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  cleanup();
  process.exit(1);
});
