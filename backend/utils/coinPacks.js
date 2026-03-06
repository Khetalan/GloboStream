// Packs de pièces disponibles à l'achat
// Les prix EUR réels sont gérés dans le Dashboard Stripe (via Price IDs)
// Ajouter les env vars STRIPE_PRICE_* dans Render + .env local

const COIN_PACKS = [
  {
    id: 'starter',
    name: 'Starter',
    coins: 100,
    bonus: 0,
    stripePriceId: process.env.STRIPE_PRICE_STARTER
  },
  {
    id: 'popular',
    name: 'Populaire',
    coins: 500,
    bonus: 50,   // +50 pièces offertes
    stripePriceId: process.env.STRIPE_PRICE_POPULAR
  },
  {
    id: 'pro',
    name: 'Pro',
    coins: 1000,
    bonus: 150,  // +150 pièces offertes
    stripePriceId: process.env.STRIPE_PRICE_PRO
  },
  {
    id: 'mega',
    name: 'Méga',
    coins: 5000,
    bonus: 1000, // +1000 pièces offertes
    stripePriceId: process.env.STRIPE_PRICE_MEGA
  }
];

module.exports = COIN_PACKS;
