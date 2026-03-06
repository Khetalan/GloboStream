# GloboStream - Application de Rencontres avec Live Streaming

> **Application web de rencontres moderne combinant matching intelligent, chat en temps réel et streaming vidéo**

---

## Vue d'Ensemble

GloboStream est une plateforme de rencontres complète qui va au-delà du simple swipe. Elle combine :

- **Rencontres classiques** : Système de swipe intelligent avec filtres avancés
- **Communication instantanée** : Chat en temps réel avec Socket.IO
- **Vidéo en direct** : Live streaming public et speed dating vidéo
- **Modération avancée** : Système complet de gestion et sécurité

---

## Technologies

### Backend
```
Node.js 18+
Express.js
MongoDB Atlas
Socket.IO (temps réel)
WebRTC (vidéo P2P)
JWT (authentification)
Bcrypt (sécurité)
```

### Frontend
```
React 18
React Router v6
Socket.IO Client
Simple-Peer (WebRTC)
Framer Motion (animations)
Axios (API)
React Hot Toast (notifications)
```

### Services Tiers
```
MongoDB Atlas (base de données cloud)
Cloudinary (stockage photos)
Nominatim/OpenStreetMap (géolocalisation)
Google OAuth (connexion sociale)
Stripe (paiements en ligne)
```

---

## Structure du Projet

```
globostream/
├── backend/                    # Serveur Node.js
│   ├── models/                # Modèles MongoDB
│   │   ├── User.js           # Utilisateurs (wallet intégré)
│   │   ├── Message.js        # Messages chat
│   │   ├── MessageRequest.js # Demandes de messages
│   │   ├── GiftCatalog.js    # Catalogue cadeaux (Phase 6)
│   │   └── Transaction.js    # Audit log monétaire (Phase 6)
│   ├── routes/               # Routes API
│   │   ├── auth.js          # Authentification
│   │   ├── users.js         # Profils
│   │   ├── swipe.js         # Swipe & matchs
│   │   ├── chat.js          # Messagerie
│   │   ├── messageRequests.js
│   │   ├── matches.js       # Matchs
│   │   ├── stream.js        # Streams
│   │   ├── live.js          # Lives publics
│   │   ├── surprise.js      # Live Surprise
│   │   ├── moderation.js    # Modération
│   │   ├── publicProfile.js # Profils publics
│   │   ├── changePassword.js
│   │   ├── giftCatalog.js   # Catalogue cadeaux (Phase 6)
│   │   ├── wallet.js        # Portefeuille virtuel (Phase 6)
│   │   └── payments.js      # Stripe Checkout + webhook (Phase 6)
│   ├── middleware/           # Middlewares
│   │   ├── auth.js          # Vérification JWT
│   │   └── privileges.js    # Vérification droits
│   ├── socketHandlers/       # Gestionnaires Socket.IO
│   │   ├── liveRoom.js      # Gestion rooms live (cadeaux async)
│   │   └── surprise.js
│   ├── config/               # Configuration
│   │   └── passport.js      # OAuth
│   ├── utils/               # Utilitaires
│   │   └── coinPacks.js     # Config packs pièces Stripe (Phase 6)
│   ├── scripts/              # Utilitaires DB
│   │   ├── generateFakeProfiles.js
│   │   ├── cleanFakeProfiles.js
│   │   └── seedGifts.js     # Seed catalogue cadeaux (Phase 6)
│   ├── server.js            # Point d'entrée
│   └── package.json
│
├── frontend/                  # Application React
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   │   ├── Navigation.js
│   │   │   ├── LiveStream.js       # Interface live réutilisable (flux caméra réel)
│   │   │   ├── LanguageSwitcher.js # Sélecteur de langue (5 langues)
│   │   │   ├── LocationPicker.js
│   │   │   ├── FiltersPanel.js
│   │   │   ├── MessageModal.js
│   │   │   └── MessageRequestsPanel.js
│   │   ├── pages/           # 22 pages principales
│   │   │   ├── Landing.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Home.js
│   │   │   ├── Profile.js
│   │   │   ├── PublicProfile.js
│   │   │   ├── Swipe.js
│   │   │   ├── Matches.js
│   │   │   ├── Chat.js
│   │   │   ├── Settings.js
│   │   │   ├── Support.js
│   │   │   ├── ModerationPanel.js
│   │   │   ├── StreamHub.js
│   │   │   ├── LiveSurprise.js
│   │   │   ├── LivePublic.js
│   │   │   ├── LiveCompetition.js
│   │   │   ├── LiveEvent.js
│   │   │   ├── TeamPage.js
│   │   │   ├── Legal.js
│   │   │   ├── OAuthCallback.js    # Phase 5 — callback OAuth
│   │   │   ├── CompleteProfile.js  # Phase 5 — completion profil OAuth
│   │   │   └── WalletPage.js       # Phase 6 — portefeuille virtuel
│   │   ├── contexts/        # Contextes React
│   │   │   └── AuthContext.js
│   │   ├── locales/         # Traductions i18n (5 langues)
│   │   ├── App.js           # Router principal
│   │   ├── i18n.js          # Configuration i18next
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
├── docs/                      # Documentation
│   ├── MVP.md
│   ├── POST_MVP.md
│   └── RAPPORT.md            # Rapport fonctionnalités & tests
│
├── ROADMAP.md
├── ROADMAP_COMPLETE.md
├── CLAUDE.md
└── README.md                  # Ce fichier
```

---

## Démarrage Rapide

### Prérequis
- Node.js 18+
- MongoDB Atlas (compte gratuit)
- npm ou yarn

### Installation

```bash
# 1. Cloner le projet
git clone https://github.com/votre-repo/GloboStream.git
cd GloboStream

# 2. Installer backend
cd backend
npm install

# Créer .env (voir .env.example)
cp .env.example .env

# Démarrer backend
npm run dev

# 3. Installer frontend (nouveau terminal)
cd ../frontend
npm install

# Démarrer frontend
npm start
```

### Accès local
- Frontend : http://localhost:3000
- Backend : http://localhost:5000

### Déploiement en ligne
- **Frontend** : https://khetalan.github.io/GloboStream/
- **Backend** : https://globostream.onrender.com

---

## État Actuel du Projet

**Statut** : ✅ MVP + Phase 5 RGPD + Phase 6 Monétisation — 22 pages — Déployé (Render + GitHub Pages)

Backend déployé sur Render.com, frontend sur GitHub Pages. 210 tests Jest passent (100%). Build 0 warning (348 KB JS / 26 KB CSS). Voir `docs/RAPPORT.md` pour le détail complet.

### Fonctionnalités

**Authentification & Profils**
- [x] Inscription/Connexion email/password (JWT 7j, Bcrypt 12 rounds)
- [x] OAuth Google/Facebook/Apple (fix bypass âge — Phase 5)
- [x] Profil complet (20+ champs)
- [x] Upload 6 photos max (Cloudinary persistant)
- [x] Géolocalisation GPS automatique
- [x] Autocomplétion ville (OpenStreetMap/Nominatim)

**Phase 5 — RGPD & Sécurité OAuth**
- [x] Flag `profileComplete` sur User (false pour nouveaux OAuth)
- [x] `OAuthCallback.js` + `CompleteProfile.js` — flux post-OAuth
- [x] `PrivateRoute` → redirect `/complete-profile` si profil incomplet
- [x] ConsentModal RGPD + page Legal (CGU/Confidentialité/Mentions)
- [x] Watermark anti-capture vidéo en live

**Phase 6 — Monétisation (Pièces / Globos / Stripe)**
- [x] Deux monnaies : Pièces (viewers) + Globos (streamers)
- [x] Wallet utilisateur (coins, globos, historique transactions)
- [x] Catalogue cadeaux en DB (GiftCatalog), gérable depuis ModerationPanel
- [x] 6 cadeaux initiaux (🌹💋❤️⭐👑💎 — seed script)
- [x] Stripe Checkout — 4 packs de pièces
- [x] Webhook Stripe `checkout.session.completed` (idempotent)
- [x] Conversion Globos → Pièces + demande retrait PayPal
- [x] WalletPage — 4 onglets (Acheter / Convertir / Retirer / Historique)
- [x] Audit log complet (Transaction model)

**Swipe & Matching**
- [x] Système de swipe avec animations (Framer Motion drag & drop)
- [x] 10 filtres avancés (âge, distance, genre, taille, langues, etc.)
- [x] Calcul distance GPS (Haversine)
- [x] Détection matchs automatique
- [x] Modale profil centrée scrollable (480px, border-radius 20px)

**Messagerie**
- [x] Chat temps réel (Socket.IO)
- [x] Demandes de messages avec acceptation/refus
- [x] Emoji picker (emoji-picker-react)
- [x] Indicateur "en train d'écrire..."

**Live Streaming**
- [x] Live Surprise (Speed Dating vidéo WebRTC P2P)
- [x] Live Publique avec filtres et recherche
- [x] Live Compétition (CompStreamCard, FAB équipe, badge TAG)
- [x] Live Événementiel — 8 thèmes colorés
- [x] Contrôles streamer (mic/cam/kick) + watermark anti-capture
- [x] Système cadeaux avec déduction pièces atomique (MongoDB $inc)
- [ ] WebRTC multi-participants (Phase 2 — actuellement 1-on-1)

**Équipes & Compétitions**
- [x] Modèle Team (captain/members/joinRequests/grades/TAG/chat)
- [x] TeamPage — 4 onglets, candidatures, chat Socket.IO, grades
- [x] Modèle Competition (CRUD admin)

**Modération**
- [x] 4 niveaux de privilèges (User/Mod/Admin/SuperAdmin)
- [x] Panel modération complet (18 tests passés)
- [x] Actions : bannir, débannir, promouvoir, révoquer
- [x] Onglet Cadeaux admin (CRUD catalogue GiftCatalog)

**Interface & UX**
- [x] Design dark mode
- [x] Navigation avec menu hamburger (mobile) / dropdown (desktop)
- [x] CSS mobile-first responsive (22 fichiers)
- [x] Animations (Framer Motion)
- [x] Internationalisation i18n (5 langues : FR, EN, IT, DE, ES — ~700 clés)

**Tests & Qualité**
- [x] 210 tests Jest backend (100% passent)
- [x] 19 pages testées visuellement
- [x] Responsive testé (3 tailles : 375px, 768px, 968px)
- [x] 0 warning ESLint (37 corrigés)

### À développer (Phase 2+)
- [ ] WebRTC multi-participants
- [ ] Notifications push (Firebase/OneSignal)
- [ ] Emails transactionnels
- [ ] Système de signalement & blocage
- [ ] Vérification téléphone/selfie

---

## Rôles & Permissions

### Utilisateur (Niveau 0)
- Utilisation normale de l'app
- Aucun accès modération

### Modérateur (Niveau 1)
- Permissions configurables :
  - Bannir utilisateurs
  - Supprimer contenu
  - Gérer streams
  - Voir signalements
  - Émettre avertissements

### Administrateur (Niveau 2)
- Toutes permissions modérateur
- Gérer autres modérateurs
- Dashboard stats avancées

### Super Admin (Niveau 3)
- Tous les pouvoirs
- Promouvoir/révoquer admins
- Configuration système

---

## Sécurité

### Authentification
- JWT avec expiration 7 jours
- Bcrypt (12 rounds) pour mots de passe

### Données
- Validation côté serveur (Mongoose)
- Index MongoDB pour performance

### Upload Fichiers
- Limite 5MB par photo
- Types autorisés : JPEG, PNG, WebP
- Validation serveur (Multer)

---

## Pour Claude Code

⚠️ **IMPORTANT** : Si vous êtes Claude Code (ou un autre assistant IA), vous **DEVEZ** lire [`claude_context.md`](claude_context.md) avant toute action sur ce projet.

Ce fichier contient :
- Les règles strictes du workflow Git (branches `main` + `claude-work` uniquement)
- L'architecture complète du projet
- Les zones sensibles à ne pas casser
- Les conventions de code et bonnes pratiques
- L'état actuel du projet

**Workflow Git imposé** :
- `main` : branche stable, ne jamais travailler directement dessus
- `claude-work` : UNIQUE branche de développement autorisée
- Interdiction de créer d'autres branches sans autorisation

📖 **Fichiers à lire en priorité** :
1. [`claude_context.md`](claude_context.md) — Contexte projet (ce fichier est LA référence)
2. [`claude_session.md`](claude_session.md) — Journal de session (mémoire persistante)
3. [`CLAUDE.md`](CLAUDE.md) — Instructions générales
4. [`docs/RAPPORT.md`](docs/RAPPORT.md) — État des fonctionnalités

---

## Contribution

### Standards Code

- **Backend** : ES6+, async/await, try/catch, CommonJS
- **Frontend** : Functional components, hooks, ES Modules
- **Commentaires** : En français
- **Commits** : Format conventional commits

---

## Licence

Projet privé - Tous droits réservés © 2026

---

**Version** : 5.0
**Dernière mise à jour** : 2 Mars 2026
**Statut** : ✅ MVP + Phase 5 RGPD + Phase 6 Monétisation — Déployé (Render + GitHub Pages)
