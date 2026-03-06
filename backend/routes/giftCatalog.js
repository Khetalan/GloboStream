const express = require('express');
const router = express.Router();
const GiftCatalog = require('../models/GiftCatalog');
const authMiddleware = require('../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.privilegeLevel < 2) {
    return res.status(403).json({ error: 'Accès administrateur requis' });
  }
  next();
};

// GET /api/gifts/catalog — public, liste cadeaux actifs
router.get('/catalog', async (req, res) => {
  try {
    const gifts = await GiftCatalog.find({ isActive: true })
      .sort({ order: 1, coinCost: 1 })
      .select('-__v');
    res.json({ success: true, gifts });
  } catch (error) {
    console.error('Error fetching gift catalog:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du catalogue' });
  }
});

// GET /api/gifts/catalog/all — admin: tous les cadeaux (actifs + inactifs)
router.get('/catalog/all', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const gifts = await GiftCatalog.find().sort({ order: 1, coinCost: 1 }).select('-__v');
    res.json({ success: true, gifts });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du catalogue' });
  }
});

// POST /api/gifts/catalog — admin: créer un cadeau
router.post('/catalog', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id, name, emoji, coinCost, globoValue, order } = req.body;

    if (!id || !name || !emoji || !coinCost || !globoValue) {
      return res.status(400).json({ error: 'Champs requis : id, name, emoji, coinCost, globoValue' });
    }

    const existing = await GiftCatalog.findOne({ id });
    if (existing) {
      return res.status(400).json({ error: 'Un cadeau avec cet ID existe déjà' });
    }

    const gift = await GiftCatalog.create({
      id, name, emoji,
      coinCost: Number(coinCost),
      globoValue: Number(globoValue),
      order: Number(order) || 0,
      isActive: true
    });

    res.status(201).json({ success: true, gift });
  } catch (error) {
    console.error('Error creating gift:', error);
    res.status(500).json({ error: 'Erreur lors de la création du cadeau' });
  }
});

// PATCH /api/gifts/catalog/:id — admin: modifier un cadeau
router.patch('/catalog/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { name, emoji, coinCost, globoValue, order, isActive } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (emoji !== undefined) updates.emoji = emoji;
    if (coinCost !== undefined) updates.coinCost = Number(coinCost);
    if (globoValue !== undefined) updates.globoValue = Number(globoValue);
    if (order !== undefined) updates.order = Number(order);
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const gift = await GiftCatalog.findOneAndUpdate(
      { id: req.params.id },
      updates,
      { new: true }
    );

    if (!gift) {
      return res.status(404).json({ error: 'Cadeau introuvable' });
    }

    res.json({ success: true, gift });
  } catch (error) {
    console.error('Error updating gift:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du cadeau' });
  }
});

// DELETE /api/gifts/catalog/:id — admin: désactiver un cadeau (soft delete)
router.delete('/catalog/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const gift = await GiftCatalog.findOneAndUpdate(
      { id: req.params.id },
      { isActive: false },
      { new: true }
    );

    if (!gift) {
      return res.status(404).json({ error: 'Cadeau introuvable' });
    }

    res.json({ success: true, message: 'Cadeau désactivé' });
  } catch (error) {
    console.error('Error deleting gift:', error);
    res.status(500).json({ error: 'Erreur lors de la désactivation' });
  }
});

module.exports = router;
