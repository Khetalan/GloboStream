const express = require('express');
const router = express.Router();
const Competition = require('../models/Competition');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/privileges');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// GET /api/competitions - Liste tous les concours (actifs + à venir + terminés)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    const query = status ? { status } : {};
    const competitions = await Competition.find(query)
      .sort({ startDate: 1 })
      .select('-rules') // Exclure rules de la liste (disponible sur la fiche détail)
      .lean();

    res.json({ success: true, competitions });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des concours' });
  }
});

// GET /api/competitions/:id - Détail d'un concours (avec rules complètes)
router.get('/:id', async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id).lean();
    if (!competition) {
      return res.status(404).json({ error: 'Concours introuvable' });
    }
    res.json({ success: true, competition });
  } catch (error) {
    console.error('Error fetching competition:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du concours' });
  }
});

// POST /api/competitions - Créer un concours (admin uniquement)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description, rules, prize, status, startDate, endDate, maxTeams } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Le nom du concours est requis' });
    }

    const competition = new Competition({
      name:        name.trim(),
      description: description?.trim(),
      rules:       rules?.trim(),
      prize:       prize?.trim(),
      status:      status || 'upcoming',
      startDate:   startDate ? new Date(startDate) : undefined,
      endDate:     endDate   ? new Date(endDate)   : undefined,
      maxTeams:    maxTeams  || 0,
      createdBy:   req.user._id
    });

    await competition.save();
    res.status(201).json({ success: true, competition });
  } catch (error) {
    console.error('Error creating competition:', error);
    res.status(500).json({ error: 'Erreur lors de la création du concours' });
  }
});

// PATCH /api/competitions/:id - Modifier un concours (admin uniquement)
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, rules, prize, status, startDate, endDate, maxTeams } = req.body;

    const competition = await Competition.findById(req.params.id);
    if (!competition) {
      return res.status(404).json({ error: 'Concours introuvable' });
    }

    if (name !== undefined)        competition.name        = name.trim();
    if (description !== undefined) competition.description = description.trim();
    if (rules !== undefined)       competition.rules       = rules.trim();
    if (prize !== undefined)       competition.prize       = prize.trim();
    if (status !== undefined)      competition.status      = status;
    if (startDate !== undefined)   competition.startDate   = new Date(startDate);
    if (endDate !== undefined)     competition.endDate     = new Date(endDate);
    if (maxTeams !== undefined)    competition.maxTeams    = maxTeams;

    await competition.save();
    res.json({ success: true, competition });
  } catch (error) {
    console.error('Error updating competition:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du concours' });
  }
});

// DELETE /api/competitions/:id - Supprimer un concours (admin uniquement)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const competition = await Competition.findByIdAndDelete(req.params.id);
    if (!competition) {
      return res.status(404).json({ error: 'Concours introuvable' });
    }
    res.json({ success: true, message: 'Concours supprimé' });
  } catch (error) {
    console.error('Error deleting competition:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du concours' });
  }
});

module.exports = router;
