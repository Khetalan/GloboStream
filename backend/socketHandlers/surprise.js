// =========================================
// SOCKET.IO - LIVE SURPRISE HANDLER
// =========================================

const surpriseQueue = new Map(); // userId -> { socketId, userInfo, timestamp, timerDuration, isSearching, filters }
const activePairs   = new Map(); // socketId -> partnerSocketId

function setupSurpriseHandlers(io, socket) {

  // ── Rejoindre la file d'attente ──
  socket.on('join-surprise-queue', async ({ userId, filters = {} }) => {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId)
        .select('displayName firstName age gender photos location birthDate');

      if (!user) {
        socket.emit('error', { message: 'Utilisateur non trouvé' });
        return;
      }

      const age = user.age || Math.floor(
        (Date.now() - new Date(user.birthDate)) / (365.25 * 24 * 60 * 60 * 1000)
      );

      // Récupérer la photo principale pour le chat live (TÂCHE-017 prep)
      const photoUrl = user.photos && user.photos.length > 0
        ? (user.photos.find(p => p.isPrimary) || user.photos[0]).url
        : null;

      const userInfo = {
        userId:      user._id.toString(),
        displayName: user.displayName || user.firstName,
        age:         age,
        gender:      user.gender,
        photos:      user.photos,
        photoUrl:    photoUrl,
        location:    user.location,
        country:     user.location?.country || null,
        socketId:    socket.id
      };

      // TÂCHE-016 — pays par défaut = pays d'origine de l'utilisateur
      const defaultFilters = { ...filters };
      if (!defaultFilters.country && user.location?.country) {
        defaultFilters.country = user.location.country;
      }

      surpriseQueue.set(userId, {
        socketId:      socket.id,
        userInfo:      userInfo,
        timestamp:     Date.now(),
        timerDuration: 3,
        isSearching:   false,
        filters:       defaultFilters, // { country, ageMin, ageMax }
        timeoutTimer: null             // TÂCHE-016 : timer 15s → notifie le client (pas de fallback auto)
      });

      // TÂCHE-009 — diffuser le nouveau compteur
      broadcastSurpriseCount(io);
      console.log(`[Surprise] User ${userId} rejoint la file. Taille: ${surpriseQueue.size}`);

    } catch (error) {
      console.error('[Surprise] Erreur join-surprise-queue:', error);
      socket.emit('error', { message: 'Erreur lors de la connexion' });
    }
  });

  // ── Quitter la file d'attente volontairement ──
  socket.on('leave-surprise-queue', ({ userId }) => {
    const entry = surpriseQueue.get(userId);
    if (entry) {
      if (entry.timeoutTimer) clearTimeout(entry.timeoutTimer); // TÂCHE-016
      surpriseQueue.delete(userId);
      broadcastSurpriseCount(io);
      console.log(`[Surprise] User ${userId} a quitté la file.`);
    }
  });

  // ── Démarrer la recherche ──
  socket.on('start-search', ({ userId, timerDuration }) => {
    try {
      const queueEntry = surpriseQueue.get(userId);
      if (!queueEntry) return;

      // TÂCHE-012 — garantir un socketId frais au moment de la recherche
      queueEntry.socketId          = socket.id;
      queueEntry.userInfo.socketId = socket.id;
      queueEntry.timerDuration     = timerDuration || 3;
      queueEntry.isSearching       = true;
      surpriseQueue.set(userId, queueEntry);

      const partnerId = findPartner(userId, queueEntry.filters);
      if (partnerId) {
        createPair(io, userId, partnerId);
      } else {
        // TÂCHE-016 — après 15s sans partenaire, notifier le client pour qu'il propose
        // d'élargir la recherche manuellement. PAS de fallback mondial automatique.
        if (queueEntry.timeoutTimer) clearTimeout(queueEntry.timeoutTimer);
        queueEntry.timeoutTimer = setTimeout(() => {
          const entry = surpriseQueue.get(userId);
          if (!entry || !entry.isSearching) return;
          socket.emit('surprise-search-timeout', {
            filtersUsed: entry.filters // le frontend peut afficher "Aucun partenaire en [pays]"
          });
          console.log(`[Surprise] Timeout 15s pour ${userId} — notification envoyée au client.`);
        }, 15000);
        surpriseQueue.set(userId, queueEntry);
        console.log(`[Surprise] Aucun partenaire (${queueEntry.filters.country || 'tous pays'}) pour ${userId}, notification dans 15s...`);
      }

      broadcastSurpriseCount(io);
    } catch (error) {
      console.error('[Surprise] Erreur start-search:', error);
      socket.emit('error', { message: 'Erreur lors de la recherche' });
    }
  });

  // ── Signal WebRTC (relay pur) ── TÂCHE-012
  socket.on('send-signal', ({ to, signal }) => {
    io.to(to).emit('receive-signal', {
      from: socket.id,
      signal: signal
    });
  });

  // ── Décision de l'utilisateur : like / dislike ── TÂCHE-010
  socket.on('send-decision', async ({ partnerUserId, decision, myUserId }) => {
    try {
      const partnerSocketId = activePairs.get(socket.id);

      // Notifier le partenaire de la décision
      if (partnerSocketId) {
        io.to(partnerSocketId).emit('decision-received', { decision });
      }

      // Retirer de la paire active
      cleanupPair(socket.id);

      // Traitement du Like en base de données (même logique que POST /api/swipe/like/:userId)
      if (decision === 'like' && myUserId && partnerUserId) {
        const User = require('../models/User');
        const currentUser = await User.findById(myUserId);
        const targetUser  = await User.findById(partnerUserId);

        if (currentUser && targetUser) {
          // Ajouter aux likes si pas déjà fait
          if (!currentUser.likes.map(String).includes(String(partnerUserId))) {
            currentUser.likes.push(targetUser._id);
            await currentUser.save();
          }

          // Vérifier match mutuel
          const isMatch = targetUser.likes.map(String).includes(String(myUserId));

          if (isMatch) {
            if (!currentUser.matches.some(m => m.user.toString() === String(partnerUserId))) {
              currentUser.matches.push({ user: targetUser._id, matchedAt: new Date() });
              await currentUser.save();
            }
            if (!targetUser.matches.some(m => m.user.toString() === String(myUserId))) {
              targetUser.matches.push({ user: currentUser._id, matchedAt: new Date() });
              await targetUser.save();
            }

            // Notifier les deux qu'un match a été créé
            socket.emit('surprise-match', { userId: partnerUserId });
            if (partnerSocketId) io.to(partnerSocketId).emit('surprise-match', { userId: myUserId });
            console.log(`[Surprise] Match créé : ${myUserId} <-> ${partnerUserId}`);
          }
        }
      }

      broadcastSurpriseCount(io);
    } catch (error) {
      console.error('[Surprise] Erreur send-decision:', error);
    }
  });

  // ── Skip : les deux retournent en file d'attente ── TÂCHE-011
  socket.on('surprise-skip', ({ userId }) => {
    try {
      const partnerSocketId = activePairs.get(socket.id);

      // Notifier le partenaire (il retournera en file côté frontend)
      if (partnerSocketId) {
        io.to(partnerSocketId).emit('partner-skipped');
      }

      // Nettoyer la paire
      cleanupPair(socket.id);

      // Remettre le skipper en file avec isSearching = true
      const queueEntry = surpriseQueue.get(userId);
      if (queueEntry) {
        queueEntry.socketId          = socket.id;
        queueEntry.userInfo.socketId = socket.id;
        queueEntry.isSearching       = true;
        surpriseQueue.set(userId, queueEntry);
      }

      // Essayer immédiatement de trouver un nouveau partenaire
      const newPartnerId = findPartner(userId, queueEntry?.filters);
      if (newPartnerId) {
        createPair(io, userId, newPartnerId);
      }

      broadcastSurpriseCount(io);
      console.log(`[Surprise] User ${userId} a skipé — remis en file.`);
    } catch (error) {
      console.error('[Surprise] Erreur surprise-skip:', error);
    }
  });

  // ── Déconnexion ──
  socket.on('disconnect', () => {
    // Retirer de la file si présent
    for (const [userId, entry] of surpriseQueue.entries()) {
      if (entry.socketId === socket.id) {
        if (entry.timeoutTimer) clearTimeout(entry.timeoutTimer); // TÂCHE-016
        surpriseQueue.delete(userId);
        break;
      }
    }

    // Notifier le partenaire si en session active
    if (activePairs.has(socket.id)) {
      const partnerSocketId = activePairs.get(socket.id);
      io.to(partnerSocketId).emit('partner-disconnected');
      cleanupPair(socket.id);
    }

    broadcastSurpriseCount(io);
    console.log(`[Surprise] Socket déconnecté: ${socket.id}`);
  });
}

// ── Créer une paire entre deux utilisateurs ── TÂCHE-012
function createPair(io, userId1, userId2) {
  const user1 = surpriseQueue.get(userId1);
  const user2 = surpriseQueue.get(userId2);

  if (!user1 || !user2) return;

  // TÂCHE-016 — annuler les timers de notification avant de retirer de la file
  if (user1.timeoutTimer) clearTimeout(user1.timeoutTimer);
  if (user2.timeoutTimer) clearTimeout(user2.timeoutTimer);

  surpriseQueue.delete(userId1);
  surpriseQueue.delete(userId2);

  activePairs.set(user1.socketId, user2.socketId);
  activePairs.set(user2.socketId, user1.socketId);

  // TÂCHE-012 — le socketId dans le payload est toujours celui de l'entrée queue (frais)
  io.to(user1.socketId).emit('partner-found', {
    partner:       { ...user2.userInfo, socketId: user2.socketId },
    initiator:     true,
    timerDuration: user1.timerDuration
  });

  io.to(user2.socketId).emit('partner-found', {
    partner:       { ...user1.userInfo, socketId: user1.socketId },
    initiator:     false,
    timerDuration: user2.timerDuration
  });

  console.log(`[Surprise] Paire créée : ${userId1} <-> ${userId2}`);
}

// ── Nettoyer une paire active (symétrique) ──
function cleanupPair(socketId) {
  const partnerSocketId = activePairs.get(socketId);
  activePairs.delete(socketId);
  if (partnerSocketId) activePairs.delete(partnerSocketId);
}

// ── Trouver un partenaire compatible dans la file ── TÂCHE-016
// filters.country : filtre pays (par défaut = pays d'origine de l'utilisateur)
// Appelé sans filtre (filters = {}) pour le fallback après 15s
function findPartner(userId, filters = {}) {
  for (const [candidateId, entry] of surpriseQueue.entries()) {
    if (candidateId === userId) continue;
    if (!entry.isSearching) continue;

    // Filtrage par pays si précisé (TÂCHE-016)
    if (filters.country && entry.userInfo.country &&
        filters.country !== entry.userInfo.country) {
      continue;
    }

    return candidateId;
  }
  return null;
}

// ── Diffuser le nombre de personnes actives en Live Surprise ── TÂCHE-009
function broadcastSurpriseCount(io) {
  const inQueue   = [...surpriseQueue.values()].filter(e => e.isSearching).length;
  const inSession = activePairs.size; // chaque socket = 1 personne en session
  io.emit('surprise-user-count', { count: inQueue + inSession, inQueue, inSession });
}

module.exports = { setupSurpriseHandlers };
