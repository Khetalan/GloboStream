# Plan — Système de Monnaie Virtuelle & Cadeaux (T-052)

**Date** : 1 Mars 2026 | **Branche** : `claude-work`
**Commit précédent** : 5c33cdd (T-051 — Corrections interface live)
**Statut** : En attente — TÂCHE-0 (choix du nom) obligatoire avant implémentation

---

## ⚠️ TÂCHE-0 OBLIGATOIRE AVANT TOUTE IMPLÉMENTATION

**Choisir le nom définitif de la monnaie virtuelle.**

Ce nom sera utilisé dans :
- Le modèle DB (`User.balance`)
- Les routes API (`/api/wallet/`)
- Le frontend (labels, i18n, CSS classes)
- Stripe (description des packs)

**Propositions :**
- Sparks ✨ (éclats, romantique)
- Petals 🌸 (pétales, thème dating)
- Gems 💎 (gemmes, premium)
- Ou tout autre nom choisi par l'utilisateur

Dans ce document, la monnaie est notée `[MONNAIE]` jusqu'à validation.

---

## Contexte

**État actuel :** Les cadeaux sont 100% cosmétiques. Le handler `send-gift` dans `liveRoom.js` relaie l'événement sans aucune vérification de solde. Aucun champ de monnaie dans `User.js`. Aucune route de paiement.

**Objectif :** Implanter une monnaie unique `[MONNAIE]` :
- Gagnée **gratuitement** via activité + quêtes quotidiennes (gamification)
- Achetée avec de **l'argent réel** via Stripe (style TikTok)
- Dépensée pour envoyer des **cadeaux** en live
- **Streamer reçoit 70%** → peut retirer en cash (seuil min 1 000 [MONNAIE])
- **Plateforme garde 30%**

---

## Taux de Conversion & Catalogue

### Achat (€ → [MONNAIE])

| Pack | [MONNAIE] | Prix |
|------|-----------|------|
| Starter | 100 | 0.99 € |
| Standard | 600 | 4.99 € (+20 bonus) |
| Pro | 1 300 | 9.99 € (+30 bonus) |
| Premium | 3 500 | 24.99 € (+50 bonus) |

→ **Taux de base : 100 [MONNAIE] = 0.99 €** (≈ 1 € = 101 [MONNAIE])

### Catalogue Cadeaux (coût en [MONNAIE])

| Cadeau | [MONNAIE] | ≈ Valeur € |
|--------|-----------|------------|
| 🌹 Rose | 5 | ~0.05 € |
| 💋 Bisou | 20 | ~0.20 € |
| ❤️ Cœur | 50 | ~0.50 € |
| ⭐ Étoile | 100 | ~1.00 € |
| 👑 Couronne | 200 | ~2.00 € |
| 💎 Diamant | 250 | ~2.50 € |

### Gains Gratuits — Quêtes & Activité

| Action | [MONNAIE] | Fréquence |
|--------|-----------|-----------|
| Login quotidien | 5 | 1×/jour (automatique) |
| Quête : Envoyer 3 messages | 10 | 1×/jour |
| Quête : Regarder un live 10 min | 15 | 1×/jour |
| Quête : Faire 5 swipes | 10 | 1×/jour |
| Quête hebdo : Participer à 3 lives | 50 | 1×/semaine |
| Compléter son profil à 100% | 20 | 1× (one-time) |

→ **Maximum gratuit ≈ 50 [MONNAIE]/jour** (≈ 0.50 €/jour ≈ 15 €/mois)

### Retrait Streamer

- Streamer reçoit **70%** de la valeur [MONNAIE] des cadeaux reçus (stocké dans `streamerBalance`)
- Plateforme garde **30%**
- Seuil minimum de retrait : **1 000 [MONNAIE]** (≈ 6.93 € net)
- Méthode : PayPal ou virement (manuel dans un premier temps)

---

## Architecture Backend

### 1. `backend/models/User.js` — Nouveaux champs à ajouter

```javascript
// Wallet
balance:         { type: Number, default: 0, min: 0 },
streamerBalance: { type: Number, default: 0, min: 0 }, // gains cadeaux (70%)
totalSpent:      { type: Number, default: 0 },         // cumul dépenses
totalEarned:     { type: Number, default: 0 },         // cumul gains (streamers)

// Quêtes (reset quotidien/hebdo côté backend)
quests: {
  lastLogin:      { type: Date, default: null },
  lastMessage:    { type: Date, default: null },
  lastSwipe:      { type: Date, default: null },
  lastLiveWatch:  { type: Date, default: null },
  lastWeeklyLive: { type: Date, default: null },
  profileDone:    { type: Boolean, default: false }
}
```

### 2. Nouveau modèle `backend/models/Transaction.js`

```javascript
{
  userId:    { type: ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['purchase', 'gift_sent', 'gift_received', 'quest', 'activity', 'withdrawal'] },
  amount:    { type: Number, required: true },  // + pour gain, - pour dépense
  balance:   { type: Number },                  // solde après transaction (snapshot)
  meta: {
    giftId:      String,
    roomId:      String,
    recipientId: ObjectId,
    packId:      String,
    questType:   String,
    stripeId:    String
  },
  createdAt: { type: Date, default: Date.now }
}
```

### 3. Nouvelles routes `backend/routes/wallet.js`

| Method | Route | Action |
|--------|-------|--------|
| GET | `/api/wallet/balance` | Retourne `balance` + `streamerBalance` |
| GET | `/api/wallet/history` | Dernières 50 transactions |
| GET | `/api/wallet/quests` | État des quêtes du jour |
| POST | `/api/wallet/purchase` | Créer session Stripe Checkout |
| POST | `/api/wallet/withdraw` | Demande de retrait (streamer) |
| POST | `/api/wallet/quest/:type/claim` | Réclamer récompense d'une quête |

### 4. Stripe — `backend/routes/stripe.js`

```
POST /api/stripe/create-checkout-session  → créer session paiement
POST /api/stripe/webhook                  → Stripe confirme → balance += montant
```

Package requis : `npm install stripe`

### 5. `backend/socketHandlers/liveRoom.js` — `send-gift` avec validation solde

```javascript
socket.on('send-gift', async ({ roomId, giftId, giftEmoji, giftName, giftValue, recipientSocketId }) => {
  const room = liveRooms.get(roomId);
  if (!room) return;

  const GIFT_COSTS = { rose: 5, kiss: 20, heart: 50, star: 100, crown: 200, diamond: 250 };
  const cost = GIFT_COSTS[giftId];
  if (!cost) return;

  const sender = await User.findById(senderId);
  if (!sender || sender.balance < cost) {
    socket.emit('gift-error', { reason: 'insufficient_balance' });
    return;
  }

  // Déduire du sender
  await User.findByIdAndUpdate(senderId, { $inc: { balance: -cost, totalSpent: cost } });

  // Créditer le streamer (70%)
  const streamerGain = Math.floor(cost * 0.7);
  await User.findByIdAndUpdate(room.streamerId, { $inc: { streamerBalance: streamerGain, totalEarned: streamerGain } });

  // Transactions ×2 (gift_sent + gift_received)
  // Relayer le cadeau à la room (comportement actuel préservé)
  io.to(roomId).emit('gift-received', { ... });
});
```

### 6. Triggers Quêtes automatiques

- `backend/routes/chat.js` — POST message → check `lastMessage`
- `backend/routes/swipe.js` — swipe → check `lastSwipe`
- `backend/socketHandlers/liveRoom.js` — `join-live-room` → check `lastLiveWatch`

---

## Architecture Frontend

### 1. Nouveau composant `frontend/src/pages/Wallet.js` + `Wallet.css`

Route : `/wallet`

**Sections de la page :**
- **Header** : solde actuel `balance` + badge [MONNAIE] animé
- **Quêtes du jour** : liste 4 quêtes + barre de progression + bouton "Réclamer"
- **Acheter des [MONNAIE]** : grille 4 packs avec bouton Stripe Checkout
- **Historique** : liste 50 dernières transactions (type, montant, date)
- **Section Streamer** : `streamerBalance` + bouton "Demander un retrait"

### 2. Modifications `LiveViewer.js` + `LiveStream.js`

- Afficher `balance` [MONNAIE] dans le panel cadeaux
- Avant `handleSendGift` : vérifier `balance >= gift.cost`
- Listener `gift-error` → toast "Solde insuffisant — rechargez vos [MONNAIE]"
- Mise à jour du solde local après envoi réussi

### 3. Navigation

- Ajouter icône portefeuille dans la bottom navigation
- Route `/wallet` dans `App.js`

### 4. i18n — 5 langues (~25 nouvelles clés dans `wallet.*`)

Clés principales : `balance`, `quests`, `daily`, `weekly`, `claim`, `packs`, `purchase`, `history`, `withdraw`, `insufficient`, `streamerBalance`, etc.

---

## Ordre d'Exécution des Tâches

| # | Tâche | Fichiers cibles | Difficulté |
|---|-------|-----------------|------------|
| **0** | **⚠️ Choisir le nom de la monnaie** | — | **OBLIGATOIRE** |
| 1 | Champs wallet + quests dans User | `models/User.js` | Facile |
| 2 | Nouveau modèle Transaction | `models/Transaction.js` | Facile |
| 3 | Routes wallet API | `routes/wallet.js` | Moyenne |
| 4 | Stripe Checkout + Webhook | `routes/stripe.js` | Moyenne |
| 5 | Monter les nouvelles routes | `server.js` | Trivial |
| 6 | send-gift avec validation solde | `socketHandlers/liveRoom.js` | Moyenne |
| 7 | Triggers quêtes automatiques | `routes/chat.js`, `routes/swipe.js` | Facile |
| 8 | Page Wallet complète | `pages/Wallet.js`, `Wallet.css` | Complexe |
| 9 | Vérification solde dans les lives | `LiveViewer.js`, `LiveStream.js` | Facile |
| 10 | Route + navigation /wallet | `App.js`, `Navigation.js` | Trivial |
| 11 | i18n 5 langues | `locales/*.json` | Facile |
| 12 | Build + commit | — | — |

---

## Vérification End-to-End

### Scénario 1 — Achat de pack
1. User ouvre `/wallet` → solde = 0
2. Clique sur pack "Starter 100 [MONNAIE] = 0.99 €"
3. Redirigé vers Stripe Checkout → paiement validé
4. Webhook Stripe → `balance += 100` + Transaction enregistrée
5. User revoit `/wallet` → solde = 100 [MONNAIE]

### Scénario 2 — Envoi d'un cadeau
1. User en live, ouvre panel cadeaux → solde affiché "85 [MONNAIE]"
2. Clique sur 💎 Diamant (250 [MONNAIE]) → toast "Solde insuffisant"
3. Clique sur 🌹 Rose (5 [MONNAIE]) → cadeau envoyé
4. Solde mis à jour : 80 [MONNAIE]
5. Streamer : `streamerBalance` +3 (floor(5 × 0.7) = 3)

### Scénario 3 — Quêtes quotidiennes
1. User se connecte → quête "Login" → +5 [MONNAIE] automatique
2. Envoie 3 messages → bouton "Réclamer" disponible → +10 [MONNAIE]
3. Regarde un live 10 min → "Réclamer" → +15 [MONNAIE]
4. Total journée : 30 [MONNAIE] gratuits

### Scénario 4 — Retrait Streamer
1. Streamer : `streamerBalance` = 1 250 [MONNAIE]
2. Clique "Demander un retrait" → saisit email PayPal
3. POST `/api/wallet/withdraw` → admin notifié
4. `streamerBalance = 0`, Transaction 'withdrawal' enregistrée

---

## Résumé des Rôles

| Rôle | Accès [MONNAIE] |
|------|-----------------|
| **Tout utilisateur** | Balance visible dans `/wallet` + gains quêtes |
| **Viewer** | Achète des packs → envoie cadeaux au streamer |
| **Participant** | Idem Viewer |
| **Streamer** | Reçoit 70% des cadeaux dans `streamerBalance` → retrait cash |
