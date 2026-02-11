// =========================================
// SOCKET.IO - LIVE SURPRISE HANDLER
// À ajouter dans server.js
// =========================================

// File de recherche globale
const surpriseQueue = new Map(); // userId -> { socketId, userInfo, timestamp, timerDuration }

// Paires actives
const activePairs = new Map(); // socketId -> partnerId

function setupSurpriseHandlers(io, socket) {
  
  // Rejoindre la file d'attente
  socket.on('join-surprise-queue', async ({ userId }) => {
    try {
      // Récupérer info utilisateur
      const User = require('./models/User');
      const user = await User.findById(userId)
        .select('displayName firstName age gender photos location birthDate');

      if (!user) {
        socket.emit('error', { message: 'Utilisateur non trouvé' });
        return;
      }

      const age = user.age || Math.floor(
        (Date.now() - new Date(user.birthDate)) / (365.25 * 24 * 60 * 60 * 1000)
      );

      const userInfo = {
        userId: user._id.toString(),
        displayName: user.displayName || user.firstName,
        age: age,
        gender: user.gender,
        photos: user.photos,
        location: user.location,
        socketId: socket.id
      };

      // Ajouter à la file
      surpriseQueue.set(userId, {
        socketId: socket.id,
        userInfo: userInfo,
        timestamp: Date.now(),
        timerDuration: 3
      });

      console.log(`User ${userId} joined surprise queue. Queue size: ${surpriseQueue.size}`);

    } catch (error) {
      console.error('Error joining queue:', error);
      socket.emit('error', { message: 'Erreur lors de la connexion' });
    }
  });

  // Démarrer la recherche
  socket.on('start-search', ({ userId, timerDuration }) => {
    try {
      // Mettre à jour timer duration
      const queueEntry = surpriseQueue.get(userId);
      if (queueEntry) {
        queueEntry.timerDuration = timerDuration || 3;
        surpriseQueue.set(userId, queueEntry);
      }

      // Chercher un partenaire compatible
      const partner = findPartner(userId);

      if (partner) {
        // Retirer les deux de la file
        const user1 = surpriseQueue.get(userId);
        const user2 = surpriseQueue.get(partner);

        surpriseQueue.delete(userId);
        surpriseQueue.delete(partner);

        // Ajouter aux paires actives
        activePairs.set(user1.socketId, user2.socketId);
        activePairs.set(user2.socketId, user1.socketId);

        // Notifier les deux utilisateurs
        io.to(user1.socketId).emit('partner-found', {
          partner: user2.userInfo,
          initiator: true,
          timerDuration: user1.timerDuration
        });

        io.to(user2.socketId).emit('partner-found', {
          partner: user1.userInfo,
          initiator: false,
          timerDuration: user2.timerDuration
        });

        console.log(`Match found: ${userId} <-> ${partner}`);
      } else {
        console.log(`No partner found for ${userId}, waiting...`);
      }

    } catch (error) {
      console.error('Error starting search:', error);
      socket.emit('error', { message: 'Erreur lors de la recherche' });
    }
  });

  // Envoyer signal WebRTC
  socket.on('send-signal', ({ to, signal }) => {
    io.to(to).emit('receive-signal', {
      from: socket.id,
      signal: signal
    });
  });

  // Envoyer décision (like/dislike/skip)
  socket.on('send-decision', ({ partnerId, decision }) => {
    const partnerSocketId = activePairs.get(socket.id);
    
    if (partnerSocketId) {
      io.to(partnerSocketId).emit('decision-received', {
        decision: decision
      });
    }

    // Retirer de la paire active
    if (activePairs.has(socket.id)) {
      const partner = activePairs.get(socket.id);
      activePairs.delete(socket.id);
      activePairs.delete(partner);
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Retirer de la file
    for (const [userId, entry] of surpriseQueue.entries()) {
      if (entry.socketId === socket.id) {
        surpriseQueue.delete(userId);
        break;
      }
    }

    // Notifier le partenaire si en paire active
    if (activePairs.has(socket.id)) {
      const partnerSocketId = activePairs.get(socket.id);
      io.to(partnerSocketId).emit('partner-disconnected');
      
      activePairs.delete(socket.id);
      activePairs.delete(partnerSocketId);
    }
  });
}

// Fonction pour trouver un partenaire compatible
function findPartner(userId) {
  // Logique simple : premier dans la file qui n'est pas soi-même
  for (const [candidateId, entry] of surpriseQueue.entries()) {
    if (candidateId !== userId) {
      return candidateId;
    }
  }
  return null;
}

// Fonction améliorée avec filtres (optionnel)
function findPartnerAdvanced(userId, userGender, userPreferences) {
  for (const [candidateId, entry] of surpriseQueue.entries()) {
    if (candidateId === userId) continue;

    // Vérifier compatibilité genre si défini
    if (userPreferences && userPreferences.showMe) {
      if (!userPreferences.showMe.includes(entry.userInfo.gender)) {
        continue;
      }
    }

    // Premier compatible trouvé
    return candidateId;
  }
  return null;
}

module.exports = { setupSurpriseHandlers };
