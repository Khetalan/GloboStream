const Team = require('../models/Team');

/**
 * Gestion du chat d'équipe et des événements temps-réel Team
 * Room Socket.IO : "team-{teamId}"
 */
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
      console.log(`👥 Utilisateur ${socket.userId} rejoint team-${teamId}`);
    } catch (err) {
      console.error('team:join error', err);
    }
  });

  // Quitter la salle de l'équipe
  socket.on('team:leave', ({ teamId }) => {
    socket.leave(`team-${teamId}`);
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

  // Notification quand un membre rejoint/quitte en live
  socket.on('team:memberOnline', ({ teamId }) => {
    if (!teamId) return;
    io.to(`team-${teamId}`).emit('team:memberOnline', {
      userId: socket.userId
    });
  });

  socket.on('disconnect', () => {
    if (socket.teamId) {
      io.to(`team-${socket.teamId}`).emit('team:memberOffline', {
        userId: socket.userId
      });
    }
  });
};

module.exports = { setupTeamChatHandlers };
