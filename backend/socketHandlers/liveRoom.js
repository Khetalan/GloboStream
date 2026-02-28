// =========================================
// SOCKET.IO - LIVE ROOM HANDLER
// Gestion des salons pour Public/Competition/Event
// =========================================

const { getCountryFlag } = require('../utils/countryFlag');

const liveRooms = new Map();
// roomId → {
//   streamerId, streamerSocketId, displayName, mode, title, tags,
//   viewers: Map<socketId, { userId, displayName, photoUrl }>,
//   participants: Map<socketId, { userId, displayName, photoUrl }>,
//   createdAt
// }

function setupLiveRoomHandlers(io, socket) {

  // ── Créer un salon ──
  socket.on('create-live-room', async ({ mode, title, tags, userId, displayName, description }) => {
    try {
      const roomId = `live-${userId}`;

      // BUG-2 : Nettoyer la room zombie du même streamer avant d'en créer une nouvelle
      if (liveRooms.has(roomId)) {
        const oldRoom = liveRooms.get(roomId);
        io.to(roomId).emit('room-closed');
        oldRoom.viewers.clear();
        oldRoom.participants.clear();
        liveRooms.delete(roomId);
        console.log(`Room zombie nettoyée : ${roomId}`);
      }

      // BUG-1 : Récupérer la photo + pays du streamer pour l'afficher dans le chat
      let streamerPhotoUrl = null;
      let streamerCountryFlag = null;
      try {
        const User = require('../models/User');
        const streamer = await User.findById(userId).select('photos location');
        if (streamer?.photos?.length > 0) {
          const primary = streamer.photos.find(p => p.isPrimary) || streamer.photos[0];
          streamerPhotoUrl = primary.url;
        }
        streamerCountryFlag = getCountryFlag(streamer?.location?.country);
      } catch (e) { /* non-bloquant */ }

      liveRooms.set(roomId, {
        streamerId: userId,
        streamerSocketId: socket.id,
        streamerPhotoUrl,
        streamerCountryFlag,
        displayName: displayName || 'Streamer',
        mode: mode || 'public',
        title: title || 'Live',
        tags: tags || [],
        description: description || '',
        viewers: new Map(),
        participants: new Map(),
        moderators: new Map(),   // socketId → { userId, displayName } — Modérateurs live (promus par le streamer)
        kickedViewers: new Set(), // Set<userId> — Bannis temporaires jusqu'à la fin du live
        maxParticipants: 7,
        createdAt: Date.now()
      });

      socket.join(roomId);
      socket.liveRoomId = roomId;
      socket.liveRole = 'streamer';

      socket.emit('room-created', { roomId });
      broadcastStreamStats(io);

      console.log(`Room created: ${roomId} by ${userId} (mode: ${mode})`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Erreur lors de la création du salon' });
    }
  });

  // ── Rejoindre un salon (viewer) ── TÂCHE-013
  socket.on('join-live-room', async ({ roomId, userId, displayName }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Salon introuvable' });
        return;
      }

      // Vérifier le kick temporaire (mémoire, expire à la fin du live)
      if (room.kickedViewers.has(userId)) {
        socket.emit('join-rejected', { reason: 'kicked' });
        return;
      }

      // Récupérer la photo + pays de profil + vérifier la blacklist live
      let photoUrl = null;
      let countryFlag = null;
      try {
        const User = require('../models/User');
        const user = await User.findById(userId).select('photos location');
        if (user && user.photos && user.photos.length > 0) {
          const primary = user.photos.find(p => p.isPrimary) || user.photos[0];
          photoUrl = primary.url;
        }
        countryFlag = getCountryFlag(user?.location?.country);

        // Vérifier la blacklist permanente du streamer
        const streamer = await User.findById(room.streamerId).select('liveBlacklist');
        if (streamer && streamer.liveBlacklist) {
          const blacklisted = streamer.liveBlacklist.some(id => id.toString() === userId);
          if (blacklisted) {
            socket.emit('join-rejected', { reason: 'blacklisted' });
            return;
          }
        }
      } catch (e) { /* non-bloquant */ }

      room.viewers.set(socket.id, { userId, displayName, photoUrl, countryFlag });
      socket.join(roomId);
      socket.liveRoomId = roomId;
      socket.liveRole   = 'viewer';

      // Notifier le streamer du nouveau viewer (avec photoUrl)
      io.to(room.streamerSocketId).emit('viewer-joined', {
        viewerSocketId: socket.id,
        viewerInfo:     { userId, displayName, photoUrl }
      });

      // Construire la liste complète des viewers pour le panel spectateurs (TÂCHE-013)
      const viewersList = buildViewersList(room);

      // Envoyer au viewer les infos complètes de la room (liste incluse)
      socket.emit('room-info', {
        roomId,
        streamerSocketId: room.streamerSocketId,
        streamerName:     room.displayName,
        viewerCount:      room.viewers.size,
        participantCount: room.participants.size,
        viewers:          viewersList
      });

      // Diffuser la liste mise à jour à tous dans la room (streamer inclus)
      io.to(roomId).emit('viewers-updated', {
        viewerCount: room.viewers.size + room.participants.size,
        viewers:     viewersList
      });

      broadcastStreamStats(io);
      console.log(`Viewer ${userId} joined room ${roomId}. Viewers: ${room.viewers.size}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Erreur pour rejoindre le salon' });
    }
  });

  // ── Obtenir la liste des spectateurs (TÂCHE-013) ──
  socket.on('get-viewers', ({ roomId }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room) return;

      socket.emit('viewers-list', {
        viewerCount: room.viewers.size,
        viewers:     buildViewersList(room)
      });
    } catch (error) {
      console.error('Error get-viewers:', error);
    }
  });

  // ── Quitter un salon ──
  socket.on('leave-live-room', ({ roomId }) => {
    handleLeaveRoom(io, socket, roomId);
  });

  // ── Fermer un salon (streamer) ──
  socket.on('close-live-room', ({ roomId }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room) return;

      // Vérifier que c'est bien le streamer
      if (room.streamerSocketId !== socket.id) return;

      // Notifier tous les viewers et participants
      io.to(roomId).emit('room-closed');

      // Retirer tout le monde de la room Socket.IO
      const sockets = io.sockets.adapter.rooms.get(roomId);
      if (sockets) {
        for (const sid of sockets) {
          const s = io.sockets.sockets.get(sid);
          if (s) {
            s.leave(roomId);
            s.liveRoomId = null;
            s.liveRole = null;
          }
        }
      }

      liveRooms.delete(roomId);
      broadcastStreamStats(io);
      console.log(`Room closed: ${roomId}`);
    } catch (error) {
      console.error('Error closing room:', error);
    }
  });

  // ── Signaling WebRTC (streamer ↔ viewer/participant) ──
  // BUG-3 : Vérifier que sender et destinataire sont dans la même room avant de relayer
  socket.on('live-signal', ({ to, signal }) => {
    const senderRoomId = socket.liveRoomId;
    if (!senderRoomId) return;
    const room = liveRooms.get(senderRoomId);
    if (!room) return;
    const toAllowed = room.streamerSocketId === to
      || room.viewers.has(to)
      || room.participants.has(to);
    if (!toAllowed) return;
    io.to(to).emit('live-signal', {
      from: socket.id,
      signal: signal
    });
  });

  // ── Chat dans le salon ── TÂCHE-017 prep (ajout userId + photoUrl + countryFlag depuis la map)
  socket.on('live-chat', ({ roomId, text, username, lang }) => {
    if (!roomId || !text) return;

    const room = liveRooms.get(roomId);
    let userId      = null;
    let photoUrl    = null;
    let countryFlag = null;

    if (room) {
      // Récupérer userId, photoUrl et countryFlag depuis les maps viewers/participants/streamer
      const viewerInfo      = room.viewers.get(socket.id);
      const participantInfo = room.participants.get(socket.id);

      if (viewerInfo) {
        userId      = viewerInfo.userId;
        photoUrl    = viewerInfo.photoUrl;
        countryFlag = viewerInfo.countryFlag || null;
      } else if (participantInfo) {
        userId      = participantInfo.userId;
        photoUrl    = participantInfo.photoUrl;
        countryFlag = participantInfo.countryFlag || null;
      } else if (room.streamerSocketId === socket.id) {
        userId      = room.streamerId;
        photoUrl    = room.streamerPhotoUrl || null; // BUG-1 fix
        countryFlag = room.streamerCountryFlag || null;
      }
    }

    io.to(roomId).emit('live-chat-message', {
      username:    username || 'Anonyme',
      userId:      userId,
      photoUrl:    photoUrl,
      countryFlag: countryFlag,
      text:        text,
      lang:        lang || 'fr',
      timestamp:   Date.now()
    });
  });

  // ── Demande de participation ──
  socket.on('request-join-live', ({ roomId, userId, displayName }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room) return;

      // BUG-4 : Récupérer photoUrl depuis la map viewers (déjà peuplée lors du join)
      const viewerEntry = room.viewers.get(socket.id);
      const photoUrl = viewerEntry?.photoUrl || null;

      // Envoyer la demande au streamer
      io.to(room.streamerSocketId).emit('join-request-received', {
        viewerSocketId: socket.id,
        viewerInfo: { userId, displayName, photoUrl }
      });

      console.log(`Join request from ${userId} for room ${roomId}`);
    } catch (error) {
      console.error('Error requesting join:', error);
    }
  });

  // ── Accepter une demande de participation ── TÂCHE-048 : limite + P2P mesh
  socket.on('accept-join-request', ({ roomId, viewerSocketId }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room || room.streamerSocketId !== socket.id) return;

      // Vérification limite participants — TÂCHE-048
      if (room.participants.size >= room.maxParticipants) {
        socket.emit('room-full', { max: room.maxParticipants });
        return;
      }

      // Récupérer les infos du viewer
      const viewerInfo = room.viewers.get(viewerSocketId);
      if (!viewerInfo) return;

      // Promouvoir de viewer à participant
      room.viewers.delete(viewerSocketId);
      room.participants.set(viewerSocketId, viewerInfo);

      // Envoyer la liste des participants existants au nouveau — TÂCHE-048
      const existingParticipants = [...room.participants.entries()]
        .filter(([sid]) => sid !== viewerSocketId)
        .map(([sid, info]) => ({ socketId: sid, ...info }));

      // Notifier le viewer promu (avec liste des participants existants)
      io.to(viewerSocketId).emit('join-accepted', {
        streamerSocketId: room.streamerSocketId,
        existingParticipants
      });

      // Notifier chaque participant existant du nouveau venu — TÂCHE-048
      room.participants.forEach((info, sid) => {
        if (sid !== viewerSocketId) {
          io.to(sid).emit('new-participant', {
            participantSocketId: viewerSocketId,
            participantInfo: viewerInfo
          });
        }
      });

      // Notifier toute la room
      io.to(roomId).emit('participant-joined', {
        participantSocketId: viewerSocketId,
        participantInfo: viewerInfo,
        participantCount: room.participants.size
      });

      // Audit fix : mettre à jour la liste viewers (promoted user retiré) + participants
      const updatedViewersList = buildViewersList(room);
      io.to(roomId).emit('viewers-updated', {
        viewerCount: room.viewers.size + room.participants.size,
        viewers:     updatedViewersList
      });
      io.to(roomId).emit('participants-updated', {
        participantCount: room.participants.size,
        participants:     buildParticipantsList(room)
      });

      console.log(`Viewer ${viewerInfo.userId} promoted to participant in room ${roomId}`);
    } catch (error) {
      console.error('Error accepting join:', error);
    }
  });

  // ── Refuser une demande de participation ──
  socket.on('reject-join-request', ({ viewerSocketId }) => {
    io.to(viewerSocketId).emit('join-rejected');
  });

  // ── Couper/rétablir le micro d'un participant (streamer uniquement) ── TÂCHE-002
  socket.on('streamer-toggle-mute-participant', ({ roomId, participantSocketId, mute }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room || room.streamerSocketId !== socket.id) return;

      io.to(participantSocketId).emit('force-mute-toggle', { mute });
    } catch (error) {
      console.error('Error toggling mute participant:', error);
    }
  });

  // ── Expulser un spectateur ou participant (streamer uniquement) — TÂCHE-024 (legacy)
  socket.on('streamer-kick-participant', ({ roomId, participantSocketId }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room || room.streamerSocketId !== socket.id) return;
      io.to(participantSocketId).emit('kicked-from-room', {});
    } catch (error) {
      console.error('Error kicking participant:', error);
    }
  });

  // ── Promouvoir un viewer en Modérateur Live (streamer uniquement) ──
  socket.on('promote-to-live-mod', ({ roomId, targetSocketId }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room || room.streamerSocketId !== socket.id) return;

      const viewerInfo = room.viewers.get(targetSocketId) || room.participants.get(targetSocketId);
      if (!viewerInfo) return;

      room.moderators.set(targetSocketId, { userId: viewerInfo.userId, displayName: viewerInfo.displayName });

      // Notifier toute la room
      io.to(roomId).emit('live-mod-promoted', {
        targetSocketId,
        userId:      viewerInfo.userId,
        displayName: viewerInfo.displayName
      });
      console.log(`Live mod promoted: ${viewerInfo.displayName} in room ${roomId}`);
    } catch (error) {
      console.error('Error promoting mod:', error);
    }
  });

  // ── Rétrograder un Modérateur Live (streamer uniquement) ──
  socket.on('demote-live-mod', ({ roomId, targetSocketId }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room || room.streamerSocketId !== socket.id) return;

      const modInfo = room.moderators.get(targetSocketId);
      if (!modInfo) return;

      room.moderators.delete(targetSocketId);
      io.to(roomId).emit('live-mod-demoted', { targetSocketId, displayName: modInfo.displayName });
    } catch (error) {
      console.error('Error demoting mod:', error);
    }
  });

  // ── Kick temporaire (streamer ou modérateur live) ──
  // Interdit de rejoindre ce live jusqu'à sa fermeture
  socket.on('kick-from-live', ({ roomId, targetSocketId, targetUserId }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room) return;

      const isStreamer = room.streamerSocketId === socket.id;
      const isMod     = room.moderators.has(socket.id);
      if (!isStreamer && !isMod) return;

      // Récupérer le displayName de la cible
      const targetInfo = room.viewers.get(targetSocketId) || room.participants.get(targetSocketId);
      const displayName = targetInfo?.displayName || 'Utilisateur';

      // Enregistrer le kick temporaire
      if (targetUserId) room.kickedViewers.add(targetUserId);

      // Retirer le modérateur live si c'était un mod
      room.moderators.delete(targetSocketId);

      // Notifier la cible
      io.to(targetSocketId).emit('kicked-from-room', { reason: 'kick' });

      // Message système dans le chat
      io.to(roomId).emit('viewer-kicked', { displayName });

      console.log(`Kick: ${displayName} kicked from room ${roomId}`);
    } catch (error) {
      console.error('Error kick-from-live:', error);
    }
  });

  // ── Blocage global depuis un live (streamer ou modérateur) ──
  socket.on('block-user-from-live', async ({ roomId, targetSocketId, targetUserId }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room) return;

      const isStreamer = room.streamerSocketId === socket.id;
      const isMod     = room.moderators.has(socket.id);
      if (!isStreamer && !isMod) return;

      const targetInfo = room.viewers.get(targetSocketId) || room.participants.get(targetSocketId);
      const displayName = targetInfo?.displayName || 'Utilisateur';

      const User = require('../models/User');

      if (isStreamer) {
        // Streamer : blocage personnel + blacklist live permanente
        await User.findByIdAndUpdate(room.streamerId, {
          $addToSet: { blockedUsers: targetUserId, liveBlacklist: targetUserId }
        });
      } else {
        // Modérateur : blocage personnel uniquement (pour lui-même)
        const modInfo = room.moderators.get(socket.id);
        if (modInfo) {
          await User.findByIdAndUpdate(modInfo.userId, {
            $addToSet: { blockedUsers: targetUserId }
          });
        }
      }

      // Kick immédiat de la room + inscription au kickedViewers
      if (targetUserId) room.kickedViewers.add(targetUserId);
      room.moderators.delete(targetSocketId);

      io.to(targetSocketId).emit('kicked-from-room', { reason: 'block' });
      io.to(roomId).emit('viewer-blocked', { displayName });

      console.log(`Block: ${displayName} (${targetUserId}) blocked from room ${roomId}`);
    } catch (error) {
      console.error('Error block-user-from-live:', error);
    }
  });

  // ── État caméra d'un participant → relayer au streamer ── TÂCHE-003
  socket.on('participant-cam-state', ({ roomId, isCamOff }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room) return;

      io.to(room.streamerSocketId).emit('participant-cam-state', {
        participantSocketId: socket.id,
        isCamOff
      });
    } catch (error) {
      console.error('Error relaying cam state:', error);
    }
  });

  // ── État micro du streamer → relayer aux membres du salon ── TÂCHE-004
  socket.on('streamer-mic-state', ({ roomId, isMuted }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room || room.streamerSocketId !== socket.id) return;

      socket.to(roomId).emit('streamer-mic-state', { isMuted });
    } catch (error) {
      console.error('Error relaying mic state:', error);
    }
  });

  // ── Envoyer un cadeau ──
  socket.on('send-gift', ({ roomId, giftId, giftEmoji, giftName, giftValue, recipientSocketId }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room) return;

      const isStreamer = room.streamerSocketId === socket.id;
      const viewerInfo = room.viewers.get(socket.id);
      const participantInfo = room.participants.get(socket.id);
      const senderInfo = viewerInfo || participantInfo;
      const senderName = isStreamer ? room.displayName : (senderInfo?.displayName || 'Anonyme');

      let finalRecipientSocketId;
      let recipientName;
      let recipientType;

      if (isStreamer) {
        // Le streamer peut offrir uniquement à un participant (protection anti-triche : pas à lui-même)
        const participant = room.participants.get(recipientSocketId);
        if (!participant) return;
        finalRecipientSocketId = recipientSocketId;
        recipientName = participant.displayName;
        recipientType = 'participant';
      } else {
        // Viewer/Participant offre toujours au streamer
        finalRecipientSocketId = room.streamerSocketId;
        recipientName = room.displayName;
        recipientType = 'streamer';
      }

      io.to(roomId).emit('gift-received', {
        senderName,
        recipientName,
        recipientSocketId: finalRecipientSocketId,
        giftId,
        giftEmoji,
        giftName,
        giftValue: giftValue || 1,
        recipientType,
        timestamp: Date.now()
      });

      console.log(`Gift ${giftId} (×${giftValue}) : ${senderName} → ${recipientName} [${roomId}]`);
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  });

  // ── Déconnexion ──
  socket.on('disconnect', () => {
    const roomId = socket.liveRoomId;
    if (!roomId) return;

    const room = liveRooms.get(roomId);
    if (!room) return;

    if (socket.liveRole === 'streamer') {
      // Le streamer s'est déconnecté — fermer la room
      io.to(roomId).emit('room-closed');
      liveRooms.delete(roomId);
      broadcastStreamStats(io);
      console.log(`Room ${roomId} closed (streamer disconnected)`);
    } else {
      handleLeaveRoom(io, socket, roomId);
    }
  });
}

function handleLeaveRoom(io, socket, roomId) {
  try {
    const room = liveRooms.get(roomId);
    if (!room) return;

    const wasParticipant = room.participants.has(socket.id);

    // Récupérer les infos avant suppression pour le message de sortie (TÂCHE-014)
    const viewerInfo      = room.viewers.get(socket.id);
    const participantInfo = room.participants.get(socket.id);
    const leavingInfo     = viewerInfo || participantInfo;

    // Retirer des viewers, participants et éventuellement des modérateurs live
    room.viewers.delete(socket.id);
    room.participants.delete(socket.id);
    room.moderators.delete(socket.id);

    socket.leave(roomId);
    socket.liveRoomId = null;
    socket.liveRole   = null;

    // TÂCHE-014 — message "X a quitté le live" à toute la room
    if (leavingInfo) {
      io.to(roomId).emit('live-user-left', {
        userId:      leavingInfo.userId,
        displayName: leavingInfo.displayName
      });
    }

    // Notifier le streamer uniquement si c'était un viewer pur (audit fix : pas de double event)
    if (!wasParticipant) {
      io.to(room.streamerSocketId).emit('viewer-left', {
        viewerSocketId: socket.id
      });
    }

    if (wasParticipant) {
      io.to(roomId).emit('participant-left', {
        participantSocketId: socket.id,
        participantCount:    room.participants.size
      });
      // Mettre à jour la liste des participants après départ
      io.to(roomId).emit('participants-updated', {
        participantCount: room.participants.size,
        participants:     buildParticipantsList(room)
      });
    }

    // TÂCHE-013 — diffuser la liste mise à jour après départ
    const viewersList = buildViewersList(room);
    io.to(roomId).emit('viewers-updated', {
      viewerCount: room.viewers.size + room.participants.size,
      viewers:     viewersList
    });

    broadcastStreamStats(io);
  } catch (error) {
    console.error('Error leaving room:', error);
  }
}

// ── Construire la liste des viewers pour le panel spectateurs ── TÂCHE-013
function buildViewersList(room) {
  const list = [];
  for (const [socketId, info] of room.viewers.entries()) {
    list.push({ socketId, userId: info.userId, displayName: info.displayName, photoUrl: info.photoUrl });
  }
  return list;
}

// ── Construire la liste des participants pour le panel streamer ── audit fix
function buildParticipantsList(room) {
  const list = [];
  for (const [socketId, info] of room.participants.entries()) {
    list.push({ socketId, userId: info.userId, displayName: info.displayName, photoUrl: info.photoUrl });
  }
  return list;
}

// Calculer le nombre de personnes par mode (format détaillé pour TÂCHE-013 Gemini)
function getStreamStats() {
  const stats = {
    surprise:    { streamers: 0, viewers: 0, total: 0 },
    public:      { streamers: 0, viewers: 0, total: 0 },
    competition: { streamers: 0, viewers: 0, total: 0 },
    event:       { streamers: 0, viewers: 0, total: 0 }
  };
  for (const room of liveRooms.values()) {
    const mode = room.mode;
    if (stats[mode]) {
      const viewersCount        = room.viewers.size + room.participants.size;
      stats[mode].streamers    += 1;
      stats[mode].viewers      += viewersCount;
      stats[mode].total        += 1 + viewersCount;
    }
  }
  return stats;
}

// Diffuser les stats à tous les clients connectés
function broadcastStreamStats(io) {
  io.emit('stream-stats-updated', getStreamStats());
}

// Utilitaire : obtenir les rooms actives par mode
function getActiveRooms(mode) {
  const rooms = [];
  for (const [roomId, room] of liveRooms.entries()) {
    if (!mode || room.mode === mode) {
      rooms.push({
        roomId,
        streamerId: room.streamerId,
        mode: room.mode,
        title: room.title,
        tags: room.tags,
        description: room.description || '',
        viewerCount: room.viewers.size,
        participantCount: room.participants.size,
        createdAt: room.createdAt
      });
    }
  }
  return rooms;
}

module.exports = { setupLiveRoomHandlers, getActiveRooms, getStreamStats, liveRooms };
