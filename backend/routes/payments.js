const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const COIN_PACKS = require('../utils/coinPacks');
const authMiddleware = require('../middleware/auth');

// GET /api/payments/packs — liste des packs (public)
router.get('/packs', (req, res) => {
  const packs = COIN_PACKS.map(({ id, name, coins, bonus }) => ({
    id, name, coins, bonus, totalCoins: coins + bonus
  }));
  res.json({ success: true, packs });
});

// POST /api/payments/checkout — créer session Stripe Checkout
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const { packId } = req.body;
    const pack = COIN_PACKS.find(p => p.id === packId);

    if (!pack) {
      return res.status(400).json({ error: 'Pack introuvable' });
    }

    if (!pack.stripePriceId) {
      return res.status(503).json({ error: 'Paiement non configuré pour ce pack. Contactez l\'administrateur.' });
    }

    const totalCoins = pack.coins + pack.bonus;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price: pack.stripePriceId,
        quantity: 1
      }],
      metadata: {
        userId: req.user._id.toString(),
        packId: pack.id,
        coins: totalCoins.toString()
      },
      success_url: `${process.env.FRONTEND_URL}/#/wallet?success=1&pack=${pack.id}`,
      cancel_url:  `${process.env.FRONTEND_URL}/#/wallet?cancelled=1`
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' });
  }
});

// Webhook Stripe — handler exporté séparément (raw body requis)
const webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, packId, coins } = session.metadata;
    const coinsToAdd = parseInt(coins);

    try {
      // Vérifier si cette session a déjà été traitée (idempotence)
      const existing = await Transaction.findOne({ stripeSessionId: session.id });
      if (existing) {
        return res.json({ received: true });
      }

      await User.findByIdAndUpdate(userId, {
        $inc: { 'wallet.coins': coinsToAdd }
      });

      await Transaction.create({
        toUserId: userId,
        type: 'coin_purchase',
        coinsAmount: coinsToAdd,
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent,
        status: 'completed',
        metadata: { packId }
      });

      console.log(`✅ Stripe: ${coinsToAdd} pièces ajoutées pour user ${userId} (pack: ${packId})`);
    } catch (error) {
      console.error('Error processing Stripe webhook:', error);
      return res.status(500).send('Webhook processing error');
    }
  }

  res.json({ received: true });
};

module.exports = { router, webhook };
