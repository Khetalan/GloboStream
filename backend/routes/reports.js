const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const AdminLog = require('../models/AdminLog');
const authMiddleware = require('../middleware/auth');
const { requireModerator } = require('../middleware/privileges');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// ── POST /api/reports — Créer un signalement ─────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { reportedUserId, type, targetId, reason, description } = req.body;

    // Validation des champs requis
    if (!reportedUserId || !type || !reason) {
      return res.status(400).json({ error: 'reportedUserId, type et reason sont obligatoires' });
    }

    // Empêcher de se signaler soi-même
    if (reportedUserId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Impossible de se signaler soi-même' });
    }

    // Anti-doublon : même reporter + même cible + même type dans les 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await Report.findOne({
      reporterId: req.user._id,
      reportedUserId,
      type,
      createdAt: { $gte: oneDayAgo }
    });

    if (existing) {
      return res.status(429).json({ error: 'Vous avez déjà signalé cet utilisateur récemment' });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      reportedUserId,
      type,
      targetId: targetId || null,
      reason,
      description: description || ''
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('Erreur création signalement:', error);
    res.status(500).json({ error: 'Erreur lors de la création du signalement' });
  }
});

// ── GET /api/reports — Liste des signalements (modérateurs uniquement) ───────

router.get('/', requireModerator, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporterId', 'displayName firstName photos')
        .populate('reportedUserId', 'displayName firstName photos')
        .populate('moderatorId', 'displayName firstName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Report.countDocuments(filter)
    ]);

    res.json({
      success: true,
      reports,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Erreur récupération signalements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des signalements' });
  }
});

// ── PATCH /api/reports/:id — Mettre à jour un signalement (modérateurs) ──────

router.patch('/:id', requireModerator, async (req, res) => {
  try {
    const { status, moderatorNote } = req.body;

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const update = {
      moderatorId: req.user._id
    };
    if (status) update.status = status;
    if (moderatorNote !== undefined) update.moderatorNote = moderatorNote;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    ).populate('reporterId', 'displayName firstName photos')
     .populate('reportedUserId', 'displayName firstName photos');

    if (!report) return res.status(404).json({ error: 'Signalement non trouvé' });

    // Incrémenter le compteur reportsHandled du modérateur
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'moderationStats.reportsHandled': 1 },
      $set: { 'moderationStats.lastActionDate': new Date() }
    });

    // Log de l'action modération
    if (status) {
      const actionMap = {
        reviewed:  'report_reviewed',
        resolved:  'report_resolved',
        dismissed: 'report_dismissed'
      };
      const logAction = actionMap[status];
      if (logAction) {
        const actor = await User.findById(req.user._id);
        AdminLog.create({
          actorId:    actor._id,
          actorName:  actor.displayName || actor.email,
          action:     logAction,
          targetId:   report._id,
          targetName: report.reportedUserId?.displayName || String(report.reportedUserId),
          targetType: 'report',
          details:    { reason: report.reason, type: report.type },
          ip: req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress
        }).catch(() => {});
      }
    }

    res.json({ success: true, report });
  } catch (error) {
    console.error('Erreur mise à jour signalement:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du signalement' });
  }
});

module.exports = router;
