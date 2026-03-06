# MVP - Minimum Viable Product

> **Fonctionnalités essentielles pour le lancement de GloboStream**

---

## Définition MVP

Le **MVP (Minimum Viable Product)** est la version minimale de GloboStream qui permet de :
- Valider le concept auprès des utilisateurs
- Offrir une expérience complète de rencontre
- Générer des premiers retours utilisateurs
- Tester la viabilité technique et business

**Statut Actuel** : ✅ **MVP fonctionnel + Phase 5 RGPD + Phase 6 Monétisation** — 22 pages, 26 bugs corrigés, build 0 warning

---

## Objectifs MVP

### Objectifs Utilisateur
1. S'inscrire et créer un profil complet
2. Découvrir des profils correspondant à ses critères
3. Matcher avec des personnes intéressantes
4. Communiquer via chat en temps réel
5. Tester la rencontre vidéo

### Objectifs Business
1. Valider l'intérêt pour le concept
2. Mesurer l'engagement utilisateur
3. Identifier les fonctionnalités les plus utilisées
4. Collecter des retours pour améliorer
5. Préparer la monétisation

### Objectifs Techniques
1. Architecture scalable
2. Performance correcte (<2s chargement)
3. Uptime > 99%
4. Sécurité des données
5. Code maintenable

---

## FONCTIONNALITÉS MVP (À TESTER)

### 1. AUTHENTIFICATION

#### Inscription
- [x] Formulaire avec validation (email, mot de passe min 6 chars, confirmation)
- [x] Hash sécurisé (Bcrypt 12 rounds)
- [x] Vérification email unique
- [x] Messages erreur clairs
- [x] Redirection auto après inscription

**Fichiers** : `backend/routes/auth.js`, `frontend/src/pages/Register.js`

#### Connexion
- [x] Formulaire email + password
- [x] Vérification credentials
- [x] Génération JWT (expiration 7 jours)
- [x] Stockage token localStorage
- [x] Redirection tableau de bord

**Fichiers** : `backend/routes/auth.js`, `frontend/src/pages/Login.js`

#### Déconnexion
- [x] Suppression token
- [x] Nettoyage state React
- [x] Redirection page login

**Fichiers** : `frontend/src/contexts/AuthContext.js`

---

### 2. PROFIL UTILISATEUR

#### Création/Édition Profil
**Champs Obligatoires** :
- [x] Nom d'affichage
- [x] Date de naissance
- [x] Genre
- [x] Orientation sexuelle
- [x] Au moins 2 photos

**Champs Optionnels** :
- [x] Bio (500 caractères max)
- [x] Taille, Profession, Langues parlées
- [x] Centres d'intérêt, Enfants, Fumeur
- [x] Logement, Type relation recherchée

**Upload Photos** :
- [x] Maximum 6 photos (JPEG, PNG, WebP, 5MB max)
- [x] Définir photo principale
- [x] Supprimer photos individuellement
- [x] Preview avant upload

**Géolocalisation** :
- [x] Détection GPS automatique
- [x] Autocomplétion ville (Nominatim)
- [x] Sélection pays (47 pays)
- [x] Stockage coordonnées GeoJSON

**Fichiers** : `backend/models/User.js`, `backend/routes/users.js`, `frontend/src/pages/Profile.js`, `frontend/src/components/LocationPicker.js`

#### Visualisation Profil Public
- [x] Galerie photos (carousel)
- [x] Toutes informations affichées
- [x] Distance affichée
- [x] Boutons actions (Like/Message/Bloquer)

**Fichiers** : `frontend/src/pages/PublicProfile.js`

---

### 3. SWIPE & MATCHING

#### Système de Swipe
- [x] Carte profil centrée avec drag & drop
- [x] Rotation -30° à +30° selon direction
- [x] 3 boutons d'action : Like, Message, Pass
- [x] Animations Framer Motion
- [x] Chargement automatique profils suivants
- [x] Modale profil centrée scrollable (carte 480px, border-radius 20px, fade+scale)

**Fichiers** : `frontend/src/pages/Swipe.js`, `backend/routes/swipe.js`

#### Filtres de Recherche (10 filtres)
- [x] Âge, Distance, Genre, Taille
- [x] Langues, Intérêts, Enfants, Fumeur
- [x] Type relation, En ligne maintenant
- [x] Panel latéral avec sliders/toggles

**Fichiers** : `frontend/src/components/FiltersPanel.js`, `backend/routes/swipe.js`

#### Détection Matchs
- [x] Vérification automatique like mutuel
- [x] Création match bidirectionnel
- [x] Toast notification "C'est un match !"

**Fichiers** : `backend/routes/swipe.js`

#### Page Matchs
- [x] Onglets : Matchs confirmés, Likes reçus (flou premium), Vues profil (flou premium)
- [x] Grille responsive avec avatar + nom + distance

**Fichiers** : `frontend/src/pages/Matches.js`

---

### 4. MESSAGERIE

#### Demandes de Messages
- [x] Modal envoi avec 5 messages prédéfinis
- [x] Post-it animé après envoi
- [x] Panel notifications dans chat
- [x] Acceptation/Refus par destinataire
- [x] Match auto si accepté

**Fichiers** : `frontend/src/components/MessageModal.js`, `frontend/src/components/MessageRequestsPanel.js`, `backend/routes/messageRequests.js`

#### Chat Temps Réel
- [x] Socket.IO WebSocket
- [x] Liste conversations avec avatar, dernier message, badge non lu
- [x] Bulles messages avec timestamps + emoji picker
- [x] Indicateur "en train d'écrire..."
- [x] Auto-scroll, responsive mobile

**Fichiers** : `frontend/src/pages/Chat.js`, `backend/routes/chat.js`

---

### 5. LIVE STREAMING

#### Live Surprise (Speed Dating)
- [x] Connexion aléatoire WebRTC P2P
- [x] Timer configurable (3/5/8/10 min)
- [x] Skip après 30 secondes
- [x] Décision Like/Dislike/Skip
- [x] Match si like mutuel
- [x] Contrôles caméra/micro
- [x] Filtres genre + langues + pays/âge
- [x] Timeout 15s + élargissement recherche

**Fichiers** : `frontend/src/pages/LiveSurprise.js`, `backend/routes/surprise.js`, `backend/socketHandlers/surprise.js`

#### Live Publique
- [x] Liste lives actifs avec 4 onglets filtres
- [x] Recherche par nom/titre/tags
- [x] Cartes avec badge LIVE, compteur viewers, durée
- [x] FAB Démarrer, StreamHub hub central

**Fichiers** : `frontend/src/pages/LivePublic.js`, `backend/routes/live.js`

#### Live Compétition & Événementiel (Thématiques)
- [x] LiveCompetition : règlement + liste lives + CompStreamCard + FAB équipe
- [x] LiveEvent : sélection 8 thèmes + filtres + compteur par thème
- [x] TeamPage : gestion équipes, candidatures, chat Socket.IO, grades, TAG
- [x] Backend Competition + Team (modèles + CRUD + socket teamChat)

**Fichiers** : `LiveCompetition.js`, `LiveEvent.js`, `TeamPage.js`, `backend/models/Competition.js`, `backend/models/Team.js`

---

### 6. MODÉRATION

#### Niveaux de Privilèges
- [x] 4 niveaux : Utilisateur, Modérateur, Admin, Super Admin
- [x] Permissions configurables par modérateur
- [x] Navigation conditionnelle (bouton modération si level >= 1)

#### Panel Modération
- [x] Dashboard statistiques
- [x] Liste utilisateurs (recherche/filtres)
- [x] Actions : Avertir, Bannir, Débannir, Promouvoir, Révoquer
- [x] Gestion modérateurs
- [x] Onglet Cadeaux (admin ≥2) — CRUD catalogue GiftCatalog (Phase 6)

**Fichiers** : `frontend/src/pages/ModerationPanel.js`, `backend/routes/moderation.js`

---

### 7. PHASE 5 — RGPD & SÉCURITÉ OAUTH

#### Fix OAuth bypass âge (TÂCHE-072)
- [x] `profileComplete` flag sur User (false pour OAuth, true pour email/phone)
- [x] Suppression `birthDate` hardcodée dans Passport.js (Google/Facebook/Apple)
- [x] Redirect OAuth corrigé → `/#/auth/callback` (HashRouter)
- [x] Route `POST /api/users/complete-profile` (validates birthDate ≥18, gender)
- [x] `OAuthCallback.js` — page callback OAuth
- [x] `CompleteProfile.js` — formulaire completion profil post-OAuth
- [x] `PrivateRoute` → redirect `/complete-profile` si `profileComplete === false`

**Fichiers** : `backend/config/passport.js`, `backend/routes/auth.js`, `backend/routes/users.js`, `frontend/src/pages/OAuthCallback.js`, `frontend/src/pages/CompleteProfile.js`, `frontend/src/App.js`

---

### 8. PHASE 6 — MONÉTISATION (Pièces / Globos / Stripe)

#### Système de Monnaie Virtuelle
- [x] **Pièces** : achetées par les viewers, dépensées pour envoyer des cadeaux en live
- [x] **Globos** : reçus par les streamers (1 pt cadeau = 1 Globo)
- [x] Wallet utilisateur (`coins`, `globos`, `totalCoinsSpent`, `totalGlobosEarned`)
- [x] Balance affichée dans le panel cadeaux du viewer
- [x] Déduction atomique pièces au send-gift (MongoDB `$inc`)

#### Catalogue Cadeaux (DB)
- [x] `GiftCatalog` model (id, name, emoji, coinCost, globoValue, isActive, order)
- [x] 6 cadeaux initiaux (seed script) : 🌹1🪙 💋5🪙 ❤️10🪙 ⭐20🪙 👑50🪙 💎100🪙
- [x] Chargement dynamique depuis API (remplace GIFTS hardcodé)
- [x] Soft delete (`isActive: false`)

#### Stripe Checkout
- [x] 4 packs de pièces : Starter(100), Populaire(550), Pro(1150), Méga(6000)
- [x] `POST /api/payments/checkout` → session Stripe Checkout
- [x] Webhook `checkout.session.completed` (raw body, idempotent via stripeSessionId)
- [x] Transaction `coin_purchase` créée à la confirmation

#### WalletPage
- [x] 4 onglets : Acheter des pièces / Convertir Globos / Retirer / Historique
- [x] Feedback URL `?success=1` / `?cancelled=1` après Stripe
- [x] Pagination historique transactions

#### Transactions & Audit
- [x] `Transaction` model — audit log complet de toutes les opérations monétaires
- [x] Conversion Globos → Pièces (rate configurable `GLOBO_TO_COIN_RATE`)
- [x] Demande de retrait PayPal (min configurable `MIN_WITHDRAWAL_GLOBOS`)
- [x] Gestion retraits admin (paid/rejected)

**Fichiers** : `backend/models/GiftCatalog.js`, `backend/models/Transaction.js`, `backend/utils/coinPacks.js`, `backend/routes/giftCatalog.js`, `backend/routes/wallet.js`, `backend/routes/payments.js`, `backend/scripts/seedGifts.js`, `frontend/src/pages/WalletPage.js`, `frontend/src/components/LiveViewer.js`, `frontend/src/components/LiveStream.js`

---

### 7. INTERFACE & NAVIGATION

#### Pages (22 pages)
- [x] Landing, Login, Register
- [x] Home, Profile, PublicProfile
- [x] Swipe, Matches, Chat
- [x] Settings, Support
- [x] ModerationPanel, StreamHub
- [x] LiveSurprise, LivePublic
- [x] LiveCompetition, LiveEvent (Thématiques)
- [x] TeamPage (Équipes & Compétitions)
- [x] Legal (CGU / Confidentialité / Mentions)
- [x] OAuthCallback (Phase 5 — callback OAuth)
- [x] CompleteProfile (Phase 5 — completion profil OAuth)
- [x] WalletPage (Phase 6 — portefeuille virtuel)

#### Design
- [x] Dark mode
- [x] Responsive (480px, 768px, 968px)
- [x] Menu déroulant avatar
- [x] Animations Framer Motion
- [x] Routes protégées (redirection si non connecté)
- [x] i18n 5 langues (~700 clés)

**Fichiers** : `frontend/src/App.js`, `frontend/src/components/Navigation.js`

---

## MÉTRIQUES DE SUCCÈS MVP

### Critères Techniques
- [x] 0 bug critique (26 bugs corrigés)
- [x] Temps chargement < 2s (348 KB JS gzippé)
- [x] Responsive 100%
- [x] Sécurité JWT

### Critères Fonctionnels
- [x] Inscription fonctionne
- [x] Profil complet créable
- [x] Swipe fluide + modale profil centrée
- [x] Matchs détectés
- [x] Chat temps réel + emoji picker
- [x] Lives opérationnels (Public, Compétition, Event, Surprise)

### Critères UX
- [x] Interface intuitive
- [x] Animations fluides
- [x] Notifications claires (react-hot-toast)
- [x] Navigation simple + i18n 5 langues

---

## CHECKLIST LANCEMENT MVP

### Infrastructure
- [x] MongoDB Atlas configuré
- [x] Backend déployé (Render — globostream.onrender.com)
- [x] Frontend déployé (GitHub Pages — khetalan.github.io/GloboStream)
- [x] HTTPS activé
- [x] Variables env configurées

### Fonctionnalités
- [x] Inscription/Connexion OK
- [x] Profils créables
- [x] Upload photos fonctionne (Cloudinary)
- [x] Swipe opérationnel
- [x] Matchs détectés
- [x] Chat temps réel
- [x] Lives fonctionnels (Public, Compétition, Event, Surprise)
- [x] Modération accessible (18 tests passés)
- [x] Équipes & Compétitions (TeamPage + backend complet)

### Tests
- [x] Tests manuels complets (19 pages)
- [x] Test sur mobile (375×667)
- [x] Test sur tablette (768×1024)
- [ ] Test différents navigateurs (Chrome uniquement testé)
- [ ] Test avec 2+ utilisateurs (WebSocket/WebRTC en live)
- [x] Test parcours principaux (auth, swipe, chat, modération)

### Documentation
- [x] README complet
- [x] RAPPORT.md (v10.0 — 148 fonctionnalités)
- [x] ROADMAP.md + POST_MVP.md

### Légal
- [x] CGU rédigées (placeholders à remplacer)
- [x] Politique confidentialité (placeholders à remplacer)
- [x] Mentions légales (placeholders à remplacer)
- [x] RGPD conforme (ConsentModal + watermark vidéo)

---

**Document** : MVP GloboStream
**Version** : 4.0
**Statut** : ✅ MVP + Phase 5 RGPD + Phase 6 Monétisation — 22 pages — Déployé (Render + GitHub Pages)
**Date** : 2 Mars 2026
