const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// GET /api/teams - Lister toutes les équipes (optionnel: ?competition=id)
router.get('/', async (req, res) => {
  try {
    const { competition } = req.query;
    const query = competition ? { competition } : {};

    const teams = await Team.find(query)
      .populate('captain', 'displayName firstName photos isVerified')
      .populate('members.user', 'displayName firstName photos isVerified')
      .sort({ createdAt: -1 });

    res.json({ success: true, teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des équipes' });
  }
});

// GET /api/teams/mine - L'équipe de l'utilisateur connecté
router.get('/mine', async (req, res) => {
  try {
    const userId = req.user._id;

    const team = await Team.findOne({ 'members.user': userId })
      .populate('captain', 'displayName firstName photos isVerified')
      .populate('members.user', 'displayName firstName photos isVerified')
      .populate('competition', 'name status')
      .populate('competitionEntries.competition', 'name status startDate endDate')
      .populate('competitionEntries.participants', 'displayName firstName photos');

    res.json({ success: true, team: team || null });
  } catch (error) {
    console.error('Error fetching my team:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// GET /api/teams/:id - Détail d'une équipe
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('captain', 'displayName firstName photos isVerified')
      .populate('members.user', 'displayName firstName photos isVerified')
      .populate('joinRequests.user', 'displayName firstName photos isVerified')
      .populate('competition', 'name status')
      .populate('competitionEntries.competition', 'name status startDate endDate')
      .populate('competitionEntries.participants', 'displayName firstName photos');

    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

    res.json({ success: true, team });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// POST /api/teams - Créer une équipe
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, description, color, emoji, competition } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Le nom est requis' });
    }

    // Vérifier que l'utilisateur n'est pas déjà dans une équipe
    const existing = await Team.findOne({ 'members.user': userId });
    if (existing) {
      return res.status(400).json({ error: 'Vous êtes déjà dans une équipe' });
    }

    const team = new Team({
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#F59E0B',
      emoji: emoji || '🏆',
      competition: competition || null,
      captain: userId,
      members: [{ user: userId, role: 'captain' }]
    });

    await team.save();
    await team.populate('captain', 'displayName firstName photos isVerified');
    await team.populate('members.user', 'displayName firstName photos isVerified');

    res.status(201).json({ success: true, team });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// PATCH /api/teams/:id - Modifier une équipe (capitaine seulement)
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });
    if (team.captain.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Réservé au capitaine' });
    }

    const { name, description, color, emoji, isOpen, tag, tagColor } = req.body;
    if (name !== undefined) team.name = name.trim();
    if (description !== undefined) team.description = description.trim();
    if (color !== undefined) team.color = color;
    if (emoji !== undefined) team.emoji = emoji;
    if (isOpen !== undefined) team.isOpen = isOpen;
    if (tag !== undefined) team.tag = tag.toUpperCase().trim().slice(0, 5);
    if (tagColor !== undefined) team.tagColor = tagColor;

    await team.save();
    res.json({ success: true, team });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// DELETE /api/teams/:id - Dissoudre une équipe (capitaine seulement)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });
    if (team.captain.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Réservé au capitaine' });
    }

    await team.deleteOne();
    res.json({ success: true, message: 'Équipe dissoute' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// POST /api/teams/:id/join - Demander à rejoindre une équipe
router.post('/:id/join', async (req, res) => {
  try {
    const userId = req.user._id;
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });
    if (!team.isOpen) return res.status(400).json({ error: 'Cette équipe n\'accepte plus de membres' });
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ error: 'L\'équipe est complète' });
    }

    // Vérifier si déjà membre ou déjà en demande
    const isMember = team.members.some(m => m.user.toString() === userId.toString());
    if (isMember) return res.status(400).json({ error: 'Déjà membre de cette équipe' });

    const alreadyRequested = team.joinRequests.some(r => r.user.toString() === userId.toString());
    if (alreadyRequested) return res.status(400).json({ error: 'Demande déjà envoyée' });

    // Vérifier l'utilisateur n'est pas dans une autre équipe
    const existing = await Team.findOne({ 'members.user': userId });
    if (existing) return res.status(400).json({ error: 'Vous êtes déjà dans une équipe' });

    team.joinRequests.push({ user: userId });
    await team.save();

    // Notifier le capitaine via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`team-${team._id}`).emit('team:joinRequest', {
        teamId: team._id,
        userId
      });
    }

    res.json({ success: true, message: 'Demande envoyée' });
  } catch (error) {
    console.error('Error joining team:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// POST /api/teams/:id/accept/:userId - Accepter un membre (capitaine)
router.post('/:id/accept/:userId', async (req, res) => {
  try {
    const captainId = req.user._id;
    const { userId } = req.params;
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });
    if (team.captain.toString() !== captainId.toString()) {
      return res.status(403).json({ error: 'Réservé au capitaine' });
    }

    const reqIndex = team.joinRequests.findIndex(r => r.user.toString() === userId);
    if (reqIndex === -1) return res.status(404).json({ error: 'Demande non trouvée' });

    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ error: 'L\'équipe est complète' });
    }

    team.joinRequests.splice(reqIndex, 1);
    team.members.push({ user: userId, role: 'member' });
    await team.save();

    res.json({ success: true, message: 'Membre accepté' });
  } catch (error) {
    console.error('Error accepting member:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// DELETE /api/teams/:id/reject/:userId - Refuser/exclure un membre (capitaine)
router.delete('/:id/reject/:userId', async (req, res) => {
  try {
    const captainId = req.user._id;
    const { userId } = req.params;
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });
    if (team.captain.toString() !== captainId.toString()) {
      return res.status(403).json({ error: 'Réservé au capitaine' });
    }

    // Retirer de joinRequests ou de members
    team.joinRequests = team.joinRequests.filter(r => r.user.toString() !== userId);
    team.members = team.members.filter(m => m.user.toString() !== userId);

    await team.save();
    res.json({ success: true, message: 'Utilisateur retiré' });
  } catch (error) {
    console.error('Error rejecting member:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// POST /api/teams/:id/leave - Quitter une équipe
router.post('/:id/leave', async (req, res) => {
  try {
    const userId = req.user._id;
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

    if (team.captain.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Le capitaine ne peut pas quitter. Dissolvez l\'équipe ou transférez le rôle.' });
    }

    team.members = team.members.filter(m => m.user.toString() !== userId.toString());
    await team.save();

    res.json({ success: true, message: 'Vous avez quitté l\'équipe' });
  } catch (error) {
    console.error('Error leaving team:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// PATCH /api/teams/:id/member/:userId/role - Changer le grade d'un membre
router.patch('/:id/member/:userId/role', async (req, res) => {
  try {
    const callerId = req.user._id;
    const { userId } = req.params;
    const { newRole } = req.body;

    const VALID_ROLES = ['officer', 'member', 'nouveau'];
    if (!VALID_ROLES.includes(newRole)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

    const callerMember = team.members.find(m => m.user.toString() === callerId.toString());
    if (!callerMember) return res.status(403).json({ error: 'Non membre' });

    const targetMember = team.members.find(m => m.user.toString() === userId);
    if (!targetMember) return res.status(404).json({ error: 'Membre non trouvé' });

    // Règles de hiérarchie
    const isCaptain = callerMember.role === 'captain';
    const isOfficer = callerMember.role === 'officer';

    if (targetMember.role === 'captain') {
      return res.status(403).json({ error: 'Impossible de modifier le rôle du capitaine' });
    }

    if (isCaptain) {
      // Captain peut assigner officer, member ou nouveau
      targetMember.role = newRole;
    } else if (isOfficer) {
      // Officer peut seulement promouvoir nouveau → member
      if (targetMember.role === 'nouveau' && newRole === 'member') {
        targetMember.role = 'member';
      } else {
        return res.status(403).json({ error: 'Réservé au capitaine' });
      }
    } else {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    await team.save();
    res.json({ success: true, message: 'Rôle mis à jour' });
  } catch (error) {
    console.error('Error changing role:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// POST /api/teams/:id/entries - Ajouter une inscription concours (captain/officer)
router.post('/:id/entries', async (req, res) => {
  try {
    const userId = req.user._id;
    const { competition, participants, instructions } = req.body;

    if (!competition) return res.status(400).json({ error: 'Concours requis' });

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

    const callerMember = team.members.find(m => m.user.toString() === userId.toString());
    if (!callerMember) return res.status(403).json({ error: 'Non membre' });
    if (!['captain', 'officer'].includes(callerMember.role)) {
      return res.status(403).json({ error: 'Réservé au capitaine ou officier' });
    }

    if (team.competitionEntries.length >= 3) {
      return res.status(400).json({ error: 'Maximum 3 inscriptions simultanées' });
    }

    const alreadyEntered = team.competitionEntries.some(
      e => e.competition.toString() === competition
    );
    if (alreadyEntered) {
      return res.status(400).json({ error: 'Déjà inscrit à ce concours' });
    }

    const validParticipants = (participants || []).slice(0, 5);

    team.competitionEntries.push({
      competition,
      participants: validParticipants,
      instructions: instructions?.trim().slice(0, 500) || ''
    });

    await team.save();
    await team.populate('competitionEntries.competition', 'name status startDate endDate');
    await team.populate('competitionEntries.participants', 'displayName firstName photos');

    res.status(201).json({ success: true, entries: team.competitionEntries });
  } catch (error) {
    console.error('Error adding entry:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// PATCH /api/teams/:id/entries/:entryId - Modifier une inscription
router.patch('/:id/entries/:entryId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { participants, instructions } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

    const callerMember = team.members.find(m => m.user.toString() === userId.toString());
    if (!callerMember || !['captain', 'officer'].includes(callerMember.role)) {
      return res.status(403).json({ error: 'Réservé au capitaine ou officier' });
    }

    const entry = team.competitionEntries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: 'Inscription non trouvée' });

    if (participants !== undefined) entry.participants = participants.slice(0, 5);
    if (instructions !== undefined) entry.instructions = instructions.trim().slice(0, 500);

    await team.save();
    await team.populate('competitionEntries.competition', 'name status startDate endDate');
    await team.populate('competitionEntries.participants', 'displayName firstName photos');

    res.json({ success: true, entries: team.competitionEntries });
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// DELETE /api/teams/:id/entries/:entryId - Supprimer une inscription
router.delete('/:id/entries/:entryId', async (req, res) => {
  try {
    const userId = req.user._id;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

    const callerMember = team.members.find(m => m.user.toString() === userId.toString());
    if (!callerMember || !['captain', 'officer'].includes(callerMember.role)) {
      return res.status(403).json({ error: 'Réservé au capitaine ou officier' });
    }

    team.competitionEntries = team.competitionEntries.filter(
      e => e._id.toString() !== req.params.entryId
    );
    await team.save();

    res.json({ success: true, message: 'Inscription retirée' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// POST /api/teams/:id/transfer/:userId - Transférer le capitanat
router.post('/:id/transfer/:userId', async (req, res) => {
  try {
    const captainId = req.user._id;
    const { userId } = req.params;

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });
    if (team.captain.toString() !== captainId.toString()) {
      return res.status(403).json({ error: 'Réservé au capitaine actuel' });
    }

    const targetMember = team.members.find(m => m.user.toString() === userId);
    if (!targetMember) return res.status(404).json({ error: 'Membre non trouvé' });

    // Rétrograder l'ancien capitaine en officer
    const oldCaptain = team.members.find(m => m.user.toString() === captainId.toString());
    if (oldCaptain) oldCaptain.role = 'officer';

    // Promouvoir le nouveau capitaine
    targetMember.role = 'captain';
    team.captain = userId;

    await team.save();
    res.json({ success: true, message: 'Capitanat transféré' });
  } catch (error) {
    console.error('Error transferring captain:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

module.exports = router;
