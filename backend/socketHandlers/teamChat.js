const Team = require('../models/Team');

/**
 * Gestion du chat d'équipe et des événements temps-réel Team
 * Room Socket.IO : "team-{teamId}"
 */

// Map teamId → Set(userId) pour tracker les membres connectés
const teamOnlineUsers = new Map();

const broadcastOnlineUsers = (io, teamId) => {
  const users = teamOnlineUsers.get(teamId) || new Set();
  io.to(`team-${teamId}`).emit('team:onlineUsers', {
    teamId,
    userIds: Array.from(users)
  });
};

const setupTeamChatHandlers = (io, socket) => {

  // Rejoindre la salle de l'équipe
  socket.on('team:join', async ({ teamId }) => {
    try {
      const team = await Team.findById(teamId).select('members');
      if (!team) return;

      const isMember = team.members.some(
        m => m.user.toString() === socket.userId?.toString()
      );
      if (!isMember) return;

      socket.join(`team-${teamId}`);
      socket.teamId = teamId;

      // Ajouter à la liste des connectés
      if (!teamOnlineUsers.has(teamId)) {
        teamOnlineUsers.set(teamId, new Set());
      }
      teamOnlineUsers.get(teamId).add(socket.userId?.toString());
      broadcastOnlineUsers(io, teamId);

      console.log(`👥 Utilisateur ${socket.userId} rejoint team-${teamId}`);
    } catch (err) {
      console.error('team:join error', err);
    }
  });

  // Quitter la salle de l'équipe
  socket.on('team:leave', ({ teamId }) => {
    socket.leave(`team-${teamId}`);

    if (teamOnlineUsers.has(teamId)) {
      teamOnlineUsers.get(teamId).delete(socket.userId?.toString());
      if (teamOnlineUsers.get(teamId).size === 0) {
        teamOnlineUsers.delete(teamId);
      } else {
        broadcastOnlineUsers(io, teamId);
      }
    }

    socket.teamId = null;
  });

  // Envoyer un message dans le chat d'équipe
  socket.on('team:message', async ({ teamId, text }) => {
    if (!text?.trim() || !teamId) return;

    try {
      const team = await Team.findById(teamId).select('members');
      if (!team) return;

      const isMember = team.members.some(
        m => m.user.toString() === socket.userId?.toString()
      );
      if (!isMember) return;

      const message = {
        senderId: socket.userId,
        text: text.trim().slice(0, 500),
        timestamp: new Date()
      };

      io.to(`team-${teamId}`).emit('team:message', message);
    } catch (err) {
      console.error('team:message error', err);
    }
  });

  socket.on('disconnect', () => {
    if (socket.teamId) {
      const teamId = socket.teamId;

      if (teamOnlineUsers.has(teamId)) {
        teamOnlineUsers.get(teamId).delete(socket.userId?.toString());
        if (teamOnlineUsers.get(teamId).size === 0) {
          teamOnlineUsers.delete(teamId);
        } else {
          broadcastOnlineUsers(io, teamId);
        }
      }

      io.to(`team-${teamId}`).emit('team:memberOffline', {
        userId: socket.userId
      });
    }
  });
};

module.exports = { setupTeamChatHandlers };
