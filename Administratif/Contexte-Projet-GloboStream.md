# Contexte Projet — GloboStream
**À fournir à Claude (web) pour obtenir le contexte complet du projet**
**Date de génération** : 1 Mars 2026

---

## 1. Présentation Générale

**GloboStream** est une application de rencontres moderne qui combine matching intelligent, chat temps réel et live streaming vidéo. C'est une application web full-stack, **mobile-first** (max 768px), sans version desktop.

**Objectif** : Permettre aux utilisateurs de se rencontrer via le swipe classique ET via des lives vidéo (streaming public, speed dating, compétitions en équipe, événements thématiques).

**URLs de production :**
- Frontend : https://khetalan.github.io/GloboStream/
- Backend : https://globostream.onrender.com (Render.com, free tier ~30s cold start)

---

## 2. Stack Technique

### Backend
| Technologie | Usage |
|-------------|-------|
| Node.js 18+ / Express 4.x | Serveur REST API |
| MongoDB Atlas + Mongoose | Base de données NoSQL |
| Socket.IO 4.6+ | WebSocket (chat, lives, équipes) |
| Simple-Peer 9.x (WebRTC) | Vidéo P2P (trickle=true, STUN Google) |
| JWT (7j) + Bcrypt (12 rounds) | Authentification |
| Passport.js | OAuth Google / Facebook / Apple |
| Multer + Cloudinary | Upload photos (6 max/user, cloud) |
| Jest | 210 tests (100% passing) |
| **Langage** | JavaScript CommonJS (`require`/`module.exports`) |

### Frontend
| Technologie | Usage |
|-------------|-------|
| React 18 (hooks only) | UI |
| React Router v6 | Navigation (19 pages) |
| Socket.IO Client 4.6+ | Temps réel |
| Simple-Peer 9.x | WebRTC côté viewer |
| Framer Motion 10+ | Animations (swipe cards) |
| Axios | Requêtes HTTP |
| i18next | 5 langues : FR, EN, IT, DE, ES (~700 clés) |
| React Hot Toast | Notifications |
| **Langage** | JavaScript ES modules (`import`/`export`) |

### Infrastructure
- **Branche stable** : `main`
- **Branche développement** : `claude-work` (tout le travail ici)
- **Règle absolue** : JAMAIS de commit direct sur `main`, JAMAIS de force-push

---

## 3. Architecture Base de Données (Modèles Mongoose)

### User (modèle principal)
```javascript
{
  // Auth
  email, passwordHash, googleId, facebookId,

  // Profil
  name, bio, age, gender, orientation, profession,
  languages: [String],     // tableau de langues parlées
  interests: [String],     // centres d'intérêt

  // Localisation
  location: { type: 'Point', coordinates: [lng, lat] },
  country, city,

  // Photos
  photos: [String],        // URLs Cloudinary (6 max)

  // Préférences matching
  height, childrenPlans, smoker, housing, relationshipType,

  // Social
  likes: [ObjectId],
  viewers: [ObjectId],
  favoriteStreamers: [ObjectId],
  blockedUsers: [ObjectId],

  // Modération
  privilege: Number,       // 0=User, 1=Mod, 2=Admin, 3=SuperAdmin

  // Live
  isLive: Boolean,

  // === À AJOUTER (T-052 — pas encore implémenté) ===
  balance: Number,         // monnaie virtuelle [MONNAIE]
  streamerBalance: Number, // gains cadeaux streamers (70%)
  totalSpent: Number,
  totalEarned: Number,
  quests: {
    lastLogin: Date, lastMessage: Date, lastSwipe: Date,
    lastLiveWatch: Date, lastWeeklyLive: Date, profileDone: Boolean
  }
}
```

### Message
```javascript
{ senderId, receiverId, content, photoUrl, isRead, timestamp }
```

### MessageRequest
```javascript
{ senderId, receiverId, status: ['pending','accepted','rejected'], createdAt }
```

### Team
```javascript
{
  captain: ObjectId,
  members: [{ userId, role: ['captain','officer','member','nouveau'] }],
  joinRequests: [ObjectId],
  name, description, emoji, tagColor,
  generalInfo: String,          // 500 chars
  competitionEntries: [{ competitionId, participants: [ObjectId], instructions }],
  maxMembers: 30
}
```

### Competition
```javascript
{ name, description, rules, prize, status, startDate, endDate, maxTeams }
```

### Transaction (à créer — T-052)
```javascript
{
  userId: ObjectId,
  type: ['purchase','gift_sent','gift_received','quest','activity','withdrawal'],
  amount: Number,
  balance: Number,             // solde après transaction
  meta: { giftId, roomId, recipientId, packId, questType, stripeId },
  createdAt: Date
}
```

---

## 4. Routes API

| Préfixe | Fichier | Fonctions |
|---------|---------|-----------|
| `/api/auth/` | `routes/auth.js` | register, login, logout, refresh-token, OAuth |
| `/api/users/` | `routes/users.js` | GET/PATCH profil, photos, vues, block |
| `/api/swipe/` | `routes/swipe.js` | GET candidats, POST like/pass, likes reçus |
| `/api/chat/` | `routes/chat.js` | GET conversations, POST message |
| `/api/message-requests/` | `routes/messageRequests.js` | Pending, accept, reject |
| `/api/matches/` | `routes/matches.js` | GET matches, interactions |
| `/api/live/` | `routes/live.js` | GET lives publics, stats, countTags |
| `/api/moderation/` | `routes/moderation.js` | Panel admin (users, ban, privilege) |
| `/api/public-profile/` | `routes/publicProfile.js` | Profil public par userId |
| `/api/teams/` | `routes/teams.js` | CRUD équipes, membres, rôles |
| `/api/competitions/` | `routes/competitions.js` | CRUD compétitions |
| `/api/wallet/` | **À créer (T-052)** | balance, history, quests, purchase, withdraw |
| `/api/stripe/` | **À créer (T-052)** | Checkout session, webhook |

---

## 5. Socket.IO — Événements Principaux

### Chat Privé
```
join-room / leave-room / send-message / typing / message-received
```

### Live Streaming (liveRoom.js)
```
Streamer → Serveur :
  create-live-room { mode, description, theme }
  close-live-room
  accept-join-request { viewerSocketId }
  reject-join-request { viewerSocketId }
  streamer-toggle-mute-participant { targetSocketId }
  promote-to-live-mod { targetSocketId, targetUserId }
  demote-live-mod { targetSocketId, targetUserId }
  kick-from-live { roomId, targetSocketId, targetUserId }
  block-user-from-live { roomId, targetSocketId, targetUserId }
  send-gift { roomId, giftId, giftEmoji, giftValue, recipientSocketId }

Viewer → Serveur :
  join-live-room { roomId }
  leave-live-room { roomId }
  request-join-live { roomId }
  live-chat { roomId, message }

Serveur → Clients :
  room-info { streamerId, streamerName, description, mode }
  participants-updated { participants: [...] }
  viewers-updated { viewers: [...], viewerCount }
  gift-received { giftId, giftEmoji, senderName, giftValue }
  gift-error { reason: 'insufficient_balance' }     ← à implémenter (T-052)
  kicked-from-room { reason: 'kick'|'block' }
  join-rejected { reason: 'rejected' }
  live-mod-promoted { targetSocketId, displayName }
  live-mod-demoted { targetSocketId }
```

### Live Surprise (Speed Dating)
```
join-surprise-queue / start-search / surprise-match
receive-signal / send-signal / surprise-skip
surprise-user-count / surprise-search-timeout
```

### Équipes
```
team:join / team:leave / team:message / team:onlineUsers
```

---

## 6. Structure Frontend (19 pages)

```
frontend/src/
├── App.js                    # Routes React Router v6
├── i18n.js                   # Config i18next
├── contexts/AuthContext.js   # État auth global
├── components/
│   ├── Navigation.js         # Bottom nav mobile
│   ├── LiveStream.js         # Interface streameur (WebRTC, 9 layouts)
│   ├── LiveViewer.js         # Interface viewer (WebRTC receive, panel stats)
│   ├── LiveStream.css        # 9 layouts (1 à 8 participants)
│   ├── LiveViewer.css        # Badges, panels, animations
│   ├── LocationPicker.js     # Sélecteur GPS + autocomplete ville
│   ├── FiltersPanel.js       # 10 filtres matching
│   ├── MessageModal.js       # Modal message rapide
│   └── LanguageSwitcher.js   # Sélecteur 5 langues
└── pages/
    ├── Landing.js            # Page marketing
    ├── Login.js, Register.js # Auth
    ├── Home.js               # Dashboard utilisateur
    ├── Profile.js            # Mon profil + édition
    ├── PublicProfile.js      # Profil public autre user
    ├── Swipe.js              # Cards swipe (Framer Motion)
    ├── Matches.js            # Grille matchs (3 onglets)
    ├── Chat.js               # Conversations + emoji picker
    ├── Settings.js           # Paramètres + consentement RGPD
    ├── Support.js            # Page support
    ├── ModerationPanel.js    # Dashboard admin (18 Jest tests)
    ├── StreamHub.js          # Hub streaming (accès aux modes)
    ├── LiveSurprise.js       # Speed dating (timers 3/5/8/10 min)
    ├── LivePublic.js         # Lives publics (liste + FAB)
    ├── LiveCompetition.js    # Compétitions d'équipes
    ├── LiveEvent.js          # Événements thématiques (8 thèmes)
    ├── TeamPage.js           # Gestion équipe (4 onglets)
    ├── Legal.js              # CGU / Confidentialité / Mentions
    └── Wallet.js             # ← À CRÉER (T-052)
```

---

## 7. Fonctionnalités Implémentées (148 au total)

### Auth & Profils ✅
- Inscription / connexion email + bcrypt
- OAuth Google / Facebook / Apple (Passport.js)
- JWT 7 jours + refresh token
- Profil : 20+ champs (photos, bio, localisation, préférences, langues, intérêts)
- Upload 6 photos via Cloudinary
- Géolocalisation GPS + autocomplete ville (47 pays supportés)

### Swipe & Matching ✅
- UI swipe drag-and-drop (Framer Motion, rotation -30° à +30°)
- 10 filtres avancés (âge, distance, genre, taille, langues, enfants, fumeur, logement, relation)
- Distance Haversine (GPS-based)
- Détection mutual match automatique

### Messagerie ✅
- Chat temps réel (Socket.IO)
- Système de demandes de messages (pending/accepted/rejected)
- Indicateur de frappe
- Emoji picker (7 catégories)
- Avatar + horodatage + statut lu

### Live Streaming ✅
**Surprise (Speed Dating) :**
- P2P WebRTC (Simple-Peer, trickle ICE, STUN Google)
- Timers sélectionnables : 3, 5, 8, 10 minutes
- Filtres : genre, âge, langue, pays
- Like / Dislike / Skip + match mutuel
- Compteur participants temps réel

**Public (Open Streaming) :**
- Liste lives avec 4 onglets (Tendances/Proches/Nouveaux/Favoris)
- Recherche par nom/titre
- Stats temps réel

**Interface Streameur (LiveStream.js) :**
- 9 layouts CSS (1 à 8 participants, responsive 2-col mobile / 3-col tablet)
- Toggle cam/micro
- Boutons kick/mute par participant
- Chat (overlay si 1-2 participants, zone dédiée si 3+)
- Flags pays sur les messages
- Panel cadeaux (send-gift → giftScore cosmétique actuellement)
- Description 80 chars
- Watermark anti-screenshot (8 derniers chars user ID, opacity 0.18)
- Modal règles avant diffusion
- Panel Stats (onglets Spectateurs + Cadeaux)
- Modération : kick, block, promote/demote modérateurs live
- Mute participants depuis grille vidéo

**Interface Viewer (LiveViewer.js) :**
- Réception stream WebRTC
- Chat avec flags pays
- Système demande de participation (streamer approuve)
- PiP caméra locale (si participant)
- Panel Stats 2 sections (Participants LIVE + Spectateurs)
- Badges MOD + badge LIVE sur participants
- Kick / Block (si modérateur live)
- Blocage personnel (tous utilisateurs)
- Toast différencié kick vs block

**Compétition :** Streams d'équipes, badge TAG couleur, règles, prize
**Événements :** 8 thèmes (colorisés), sélecteur thème pré-live, hashtags

### Équipes & Compétitions ✅
- Modèle Team (captain, membres, rôles : captain/officer/member/nouveau)
- 30 membres max
- Chat temps réel (Socket.IO room `team-{id}`)
- 4 onglets : Membres, Infos, Chat, Gestion
- Candidatures (demande rejoindre, captain accepte/refuse)
- Système de rôles (buttons dynamiques selon rôle)
- Info générale (500 chars)
- Candidatures compétitions (max 3 : sélection compétition + 5 participants)
- Transfert capitanat (modal confirmation)
- Dissolution équipe

### Modération ✅
- 4 niveaux de privilège : User (0), Mod (1), Admin (2), SuperAdmin (3)
- Panel modération (18 Jest tests)
- Actions : ban, unban, promouvoir, révoquer, avertir

### Interface & UX ✅
- 19 pages (toutes implémentées)
- Theme sombre (défaut)
- Mobile-first (max 768px pour tablette)
- Zoom désactivé (`user-scalable=no`)
- Animations Framer Motion
- Toasts (React Hot Toast)

### i18n ✅
- 5 langues : FR (défaut), EN, IT, DE, ES
- ~700 clés de traduction
- Détection automatique langue navigateur
- Sélecteur de langue intégré

### RGPD & Légal ✅
- ConsentModal (popup RGPD, localStorage `globostream_consent_v1`)
- Page Legal (3 onglets : CGU / Confidentialité / Mentions légales)
- Watermark utilisateur (opacity 0.18, pointer-events none)

### Tests & Qualité ✅
- 210 tests Jest (100% passing)
- ESLint : 0 warnings
- Build : 348 KB JS + 26 KB CSS

---

## 8. Tâche en Cours — T-052 (PAS encore implémentée)

### Système de Monnaie Virtuelle & Cadeaux

**Problème actuel** : Les cadeaux sont 100% cosmétiques. `send-gift` ne vérifie aucun solde.

**Objectif** : Implanter une monnaie virtuelle `[MONNAIE]` (nom à décider) :
- Gagnée gratuitement via quêtes quotidiennes
- Achetée via Stripe (packs)
- Dépensée pour envoyer des cadeaux en live
- Streamer reçoit 70%, plateforme garde 30%

**Taux de conversion :**
- 100 [MONNAIE] = 0.99 € (~1 € = 101 [MONNAIE])
- Rose = 5 [MONNAIE], Bisou = 20, Cœur = 50, Étoile = 100, Couronne = 200, Diamant = 250
- Seuil retrait streamer : 1 000 [MONNAIE]

**Fichiers à créer/modifier :**
1. `backend/models/User.js` — champs balance + quests
2. `backend/models/Transaction.js` — nouveau modèle
3. `backend/routes/wallet.js` — routes API portefeuille
4. `backend/routes/stripe.js` — Checkout + Webhook
5. `backend/server.js` — monter nouvelles routes
6. `backend/socketHandlers/liveRoom.js` — send-gift avec validation
7. `backend/routes/chat.js` + `swipe.js` — triggers quêtes auto
8. `frontend/src/pages/Wallet.js` + `Wallet.css` — page portefeuille
9. `frontend/src/components/LiveViewer.js` + `LiveStream.js` — vérif solde
10. `frontend/src/App.js` + `Navigation.js` — route /wallet
11. `frontend/src/locales/*.json` — ~25 nouvelles clés i18n (5 langues)

**TASK-0 obligatoire** : Choisir le nom de la monnaie avant toute implémentation.

---

## 9. Conventions de Code

### Backend (CommonJS)
```javascript
const express = require('express');
const { authMiddleware } = require('../middleware/auth');

router.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId); // TOUJOURS req.userId, jamais req.id
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Frontend (ES Modules)
```javascript
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <div>{t('key')}</div>;
};

export default MyComponent;
```

### Règles importantes
- **JWT payload** : `{ userId }` (PAS `{ id }`)
- **Photos** : URLs Cloudinary
- **Passwords** : bcrypt 12 rounds
- **Auth header** : `Authorization: Bearer <token>`
- **Nommage** : camelCase (vars/fonctions), PascalCase (composants React)
- **Commentaires** : en français
- **Async** : async/await avec try/catch (pas de .then/.catch)
- **Mobile-first** : max-width 768px, zoom désactivé

---

## 10. Workflow Git (Règles Strictes)

```
INTERDIT : commit sur main, force push, amend sur commits poussés

Workflow :
1. Travailler sur claude-work
2. Commit régulier avec message clair
3. Quand stable : merge claude-work → main (utilisateur décide)
4. Push des deux branches
```

---

## 11. Fichiers de Référence du Projet

| Fichier | Contenu | Importance |
|---------|---------|------------|
| `claude_context.md` | **SOURCE OF TRUTH** — Architecture, conventions, règles | Critique |
| `CLAUDE.md` | Protocole de démarrage Claude | Critique |
| `claude_session.md` | Journal de sessions (30 sessions) | Important |
| `MEMORY.md` | Mémoire persistante (préférences, décisions) | Important |
| `todo_claude.md` | Suivi des tâches (T-001 à T-052) | Important |
| `ROADMAP.md` | Feuille de route 4 phases (MVP → Premium → Expansion) | Référence |
| `ROADMAP_COMPLETE.md` | Détails techniques toutes phases | Référence |
| `LEGAL_AND_COMPLIANCE.md` | Légal RGPD (placeholders à compléter) | Référence |
| `CLAUDE_MOBILE_MISSION.md` | Plan future app mobile native (Capacitor) | Futur |
| `Administratif/Plan-Monnaie-Virtuelle-T052.md` | Plan détaillé T-052 | En cours |
| `Rapport de test/Plan-Live-Verification-01.md` | Plan T-051 (terminé) | Archivé |

---

## 12. État du Projet — Métriques

| Métrique | Valeur |
|----------|--------|
| Features implémentées | 148 |
| Tests Jest | 210 (100% passing) |
| Pages frontend | 19 |
| Langues | 5 (FR/EN/IT/DE/ES) |
| Bugs corrigés | 26+ |
| ESLint warnings | 0 (37 supprimés) |
| Build JS | 348 KB |
| Build CSS | 26 KB |
| Sessions de développement | 30 |
| Déploiement | ✅ Render.com + GitHub Pages |

---

## 13. Phases du Projet

| Phase | Statut | Contenu |
|-------|--------|---------|
| **Phase 1 — MVP** | ✅ Terminée | Auth, swipe, matching, chat, live streaming, équipes, modération, i18n, RGPD |
| **T-052 — Monnaie** | 🔄 En cours de planification | Système de monnaie virtuelle + Stripe + cadeaux payants |
| **Phase 2 — Croissance** | ⏳ À venir | Notifications push, email verification, analytics, performance |
| **Phase 3 — Mobile** | ⏳ Futur | App native Capacitor, FLAG_SECURE, beauty filter |
| **Phase 4 — Premium** | ⏳ Futur | Abonnements, fonctionnalités avancées |

---

*Ce document a été généré le 1 Mars 2026 pour fournir un contexte complet à un assistant IA (Claude Web) sur le projet GloboStream. Il reflète l'état exact du code à cette date.*
