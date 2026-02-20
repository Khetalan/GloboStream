// =========================================
// SOCKET.IO - LIVE ROOM HANDLER
// Gestion des salons pour Public/Competition/Event
// =========================================

const liveRooms = new Map();
// roomId → {
//   streamerId, streamerSocketId, mode, title, tags,
//   viewers: Map<socketId, { userId, displayName }>,
//   participants: Map<socketId, { userId, displayName }>,
//   createdAt
// }

function setupLiveRoomHandlers(io, socket) {

  // ── Créer un salon ──
  socket.on('create-live-room', ({ mode, title, tags, userId, displayName }) => {
    try {
      const roomId = `live-${userId}-${Date.now()}`;

      liveRooms.set(roomId, {
        streamerId: userId,
        streamerSocketId: socket.id,
        mode: mode || 'public',
        title: title || 'Live',
        tags: tags || [],
        viewers: new Map(),
        participants: new Map(),
        createdAt: Date.now()
      });

      socket.join(roomId);
      socket.liveRoomId = roomId;
      socket.liveRole = 'streamer';

      socket.emit('room-created', { roomId });

      console.log(`Room created: ${roomId} by ${userId} (mode: ${mode})`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Erreur lors de la création du salon' });
    }
  });

  // ── Rejoindre un salon (viewer) ──
  socket.on('join-live-room', ({ roomId, userId, displayName }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Salon introuvable' });
        return;
      }

      room.viewers.set(socket.id, { userId, displayName });
      socket.join(roomId);
      socket.liveRoomId = roomId;
      socket.liveRole = 'viewer';

      // Notifier le streamer du nouveau viewer
      io.to(room.streamerSocketId).emit('viewer-joined', {
        viewerSocketId: socket.id,
        viewerInfo: { userId, displayName }
      });

      // Envoyer au viewer les infos de la room
      socket.emit('room-info', {
        roomId,
        streamerSocketId: room.streamerSocketId,
        viewerCount: room.viewers.size,
        participantCount: room.participants.size
      });

      console.log(`Viewer ${userId} joined room ${roomId}. Viewers: ${room.viewers.size}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Erreur pour rejoindre le salon' });
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
      console.log(`Room closed: ${roomId}`);
    } catch (error) {
      console.error('Error closing room:', error);
    }
  });

  // ── Signaling WebRTC (streamer ↔ viewer/participant) ──
  socket.on('live-signal', ({ to, signal }) => {
    io.to(to).emit('live-signal', {
      from: socket.id,
      signal: signal
    });
  });

  // ── Chat dans le salon ──
  socket.on('live-chat', ({ roomId, text, username, lang }) => {
    if (!roomId || !text) return;

    io.to(roomId).emit('live-chat-message', {
      username: username || 'Anonyme',
      text: text,
      lang: lang || 'fr',
      timestamp: Date.now()
    });
  });

  // ── Demande de participation ──
  socket.on('request-join-live', ({ roomId, userId, displayName }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room) return;

      // Envoyer la demande au streamer
      io.to(room.streamerSocketId).emit('join-request-received', {
        viewerSocketId: socket.id,
        viewerInfo: { userId, displayName }
      });

      console.log(`Join request from ${userId} for room ${roomId}`);
    } catch (error) {
      console.error('Error requesting join:', error);
    }
  });

  // ── Accepter une demande de participation ──
  socket.on('accept-join-request', ({ roomId, viewerSocketId }) => {
    try {
      const room = liveRooms.get(roomId);
      if (!room || room.streamerSocketId !== socket.id) return;

      // Récupérer les infos du viewer
      const viewerInfo = room.viewers.get(viewerSocketId);
      if (!viewerInfo) return;

      // Promouvoir de viewer à participant
      room.viewers.delete(viewerSocketId);
      room.participants.set(viewerSocketId, viewerInfo);

      // Notifier le viewer promu
      io.to(viewerSocketId).emit('join-accepted', {
        streamerSocketId: room.streamerSocketId
      });

      // Notifier toute la room
      io.to(roomId).emit('participant-joined', {
        participantSocketId: viewerSocketId,
        participantInfo: viewerInfo,
        participantCount: room.participants.size
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

    // Retirer des viewers ou participants
    room.viewers.delete(socket.id);
    room.participants.delete(socket.id);

    socket.leave(roomId);
    socket.liveRoomId = null;
    socket.liveRole = null;

    // Notifier le streamer
    io.to(room.streamerSocketId).emit('viewer-left', {
      viewerSocketId: socket.id
    });

    if (wasParticipant) {
      io.to(roomId).emit('participant-left', {
        participantSocketId: socket.id,
        participantCount: room.participants.size
      });
    }
  } catch (error) {
    console.error('Error leaving room:', error);
  }
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
        viewerCount: room.viewers.size,
        participantCount: room.participants.size,
        createdAt: room.createdAt
      });
    }
  }
  return rooms;
}

module.exports = { setupLiveRoomHandlers, getActiveRooms, liveRooms };
