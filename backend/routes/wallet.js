const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.privilegeLevel < 2) {
    return res.status(403).json({ error: 'Accès administrateur requis' });
  }
  next();
};

// GET /api/wallet/me — balance + 10 dernières transactions
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet displayName firstName');
    const recentTx = await Transaction.find({
      $or: [{ fromUserId: req.user._id }, { toUserId: req.user._id }]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-__v');

    res.json({
      success: true,
      wallet: user.wallet || { coins: 0, globos: 0, totalCoinsSpent: 0, totalGlobosEarned: 0 },
      recentTransactions: recentTx
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du portefeuille' });
  }
});

// GET /api/wallet/history — historique paginé
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter = { $or: [{ fromUserId: req.user._id }, { toUserId: req.user._id }] };

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      success: true,
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

// POST /api/wallet/convert — Globos → Pièces
router.post('/convert', authMiddleware, async (req, res) => {
  try {
    const { globos } = req.body;
    const amount = parseInt(globos);

    if (!amount || amount < 10) {
      return res.status(400).json({ error: 'Minimum 10 Globos à convertir' });
    }

    const rate = parseFloat(process.env.GLOBO_TO_COIN_RATE) || 1;
    const coinsGained = Math.floor(amount * rate);

    const user = await User.findById(req.user._id);
    if (!user.wallet || user.wallet.globos < amount) {
      return res.status(400).json({ error: 'Globos insuffisants' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        'wallet.globos': -amount,
        'wallet.coins': coinsGained
      }
    });

    await Transaction.create({
      fromUserId: req.user._id,
      toUserId: req.user._id,
      type: 'globo_to_coin',
      coinsAmount: coinsGained,
      globosAmount: -amount,
      status: 'completed'
    });

    const updated = await User.findById(req.user._id).select('wallet');

    res.json({
      success: true,
      converted: { globos: amount, coins: coinsGained },
      wallet: updated.wallet
    });
  } catch (error) {
    console.error('Error converting globos:', error);
    res.status(500).json({ error: 'Erreur lors de la conversion' });
  }
});

// POST /api/wallet/withdraw — demande retrait Globos → cash
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const { globos, paypalEmail } = req.body;
    const amount = parseInt(globos);
    const minWithdrawal = parseInt(process.env.MIN_WITHDRAWAL_GLOBOS) || 1000;

    if (!amount || amount < minWithdrawal) {
      return res.status(400).json({ error: `Minimum ${minWithdrawal} Globos pour un retrait` });
    }

    if (!paypalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
      return res.status(400).json({ error: 'Email PayPal invalide' });
    }

    const user = await User.findById(req.user._id);
    if (!user.wallet || user.wallet.globos < amount) {
      return res.status(400).json({ error: 'Globos insuffisants' });
    }

    // Déduire les globos immédiatement (réservés)
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'wallet.globos': -amount }
    });

    const tx = await Transaction.create({
      fromUserId: req.user._id,
      type: 'withdrawal_request',
      globosAmount: -amount,
      status: 'pending',
      metadata: { paypalEmail, requestedAt: new Date() }
    });

    res.json({
      success: true,
      message: 'Demande de retrait enregistrée. Traitement sous 3-5 jours ouvrés.',
      transactionId: tx._id
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: 'Erreur lors de la demande de retrait' });
  }
});

// GET /api/wallet/withdrawals — admin: liste demandes pending
router.get('/withdrawals', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const statusFilter = req.query.status || 'pending';

    const [withdrawals, total] = await Promise.all([
      Transaction.find({ type: 'withdrawal_request', status: statusFilter })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('fromUserId', 'displayName email'),
      Transaction.countDocuments({ type: 'withdrawal_request', status: statusFilter })
    ]);

    res.json({ success: true, withdrawals, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des retraits' });
  }
});

// PATCH /api/wallet/withdrawals/:id — admin: marquer paid ou rejected
router.patch('/withdrawals/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!['withdrawal_paid', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide. Valeurs: withdrawal_paid, rejected' });
    }

    const tx = await Transaction.findOne({
      _id: req.params.id,
      type: 'withdrawal_request',
      status: 'pending'
    });

    if (!tx) {
      return res.status(404).json({ error: 'Demande introuvable ou déjà traitée' });
    }

    tx.type = status === 'withdrawal_paid' ? 'withdrawal_paid' : 'withdrawal_request';
    tx.status = status === 'withdrawal_paid' ? 'completed' : 'rejected';
    tx.note = note || '';
    await tx.save();

    // Si rejeté : rembourser les Globos
    if (status === 'rejected') {
      const globosToRefund = Math.abs(tx.globosAmount);
      await User.findByIdAndUpdate(tx.fromUserId, {
        $inc: { 'wallet.globos': globosToRefund }
      });
    }

    res.json({ success: true, transaction: tx });
  } catch (error) {
    console.error('Error updating withdrawal:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du retrait' });
  }
});

module.exports = router;
