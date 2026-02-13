# MVP - Minimum Viable Product

> **Fonctionnalités essentielles pour le lancement de GloboStream**

---

## Définition MVP

Le **MVP (Minimum Viable Product)** est la version minimale de GloboStream qui permet de :
- Valider le concept auprès des utilisateurs
- Offrir une expérience complète de rencontre
- Générer des premiers retours utilisateurs
- Tester la viabilité technique et business

**Statut Actuel** : Code écrit - **Aucune fonctionnalité testée**

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
- [ ] Formulaire avec validation (email, mot de passe min 6 chars, confirmation)
- [ ] Hash sécurisé (Bcrypt 12 rounds)
- [ ] Vérification email unique
- [ ] Messages erreur clairs
- [ ] Redirection auto après inscription

**Fichiers** : `backend/routes/auth.js`, `frontend/src/pages/Register.js`

#### Connexion
- [ ] Formulaire email + password
- [ ] Vérification credentials
- [ ] Génération JWT (expiration 7 jours)
- [ ] Stockage token localStorage
- [ ] Redirection tableau de bord

**Fichiers** : `backend/routes/auth.js`, `frontend/src/pages/Login.js`

#### Déconnexion
- [ ] Suppression token
- [ ] Nettoyage state React
- [ ] Redirection page login

**Fichiers** : `frontend/src/contexts/AuthContext.js`

---

### 2. PROFIL UTILISATEUR

#### Création/Édition Profil
**Champs Obligatoires** :
- [ ] Nom d'affichage
- [ ] Date de naissance
- [ ] Genre
- [ ] Orientation sexuelle
- [ ] Au moins 2 photos

**Champs Optionnels** :
- [ ] Bio (500 caractères max)
- [ ] Taille, Profession, Langues parlées
- [ ] Centres d'intérêt, Enfants, Fumeur
- [ ] Logement, Type relation recherchée

**Upload Photos** :
- [ ] Maximum 6 photos (JPEG, PNG, WebP, 5MB max)
- [ ] Définir photo principale
- [ ] Supprimer photos individuellement
- [ ] Preview avant upload

**Géolocalisation** :
- [ ] Détection GPS automatique
- [ ] Autocomplétion ville (Nominatim)
- [ ] Sélection pays (47 pays)
- [ ] Stockage coordonnées GeoJSON

**Fichiers** : `backend/models/User.js`, `backend/routes/users.js`, `frontend/src/pages/Profile.js`, `frontend/src/components/LocationPicker.js`

#### Visualisation Profil Public
- [ ] Galerie photos (carousel)
- [ ] Toutes informations affichées
- [ ] Distance affichée
- [ ] Boutons actions (Like/Message/Bloquer)

**Fichiers** : `frontend/src/pages/PublicProfile.js`

---

### 3. SWIPE & MATCHING

#### Système de Swipe
- [ ] Carte profil centrée avec drag & drop
- [ ] Rotation -30° à +30° selon direction
- [ ] 3 boutons d'action : Like, Message, Pass
- [ ] Animations Framer Motion
- [ ] Chargement automatique profils suivants

**Fichiers** : `frontend/src/pages/Swipe.js`, `backend/routes/swipe.js`

#### Filtres de Recherche (10 filtres)
- [ ] Âge, Distance, Genre, Taille
- [ ] Langues, Intérêts, Enfants, Fumeur
- [ ] Type relation, En ligne maintenant
- [ ] Panel latéral avec sliders/toggles

**Fichiers** : `frontend/src/components/FiltersPanel.js`, `backend/routes/swipe.js`

#### Détection Matchs
- [ ] Vérification automatique like mutuel
- [ ] Création match bidirectionnel
- [ ] Toast notification "C'est un match !"

**Fichiers** : `backend/routes/swipe.js`

#### Page Matchs
- [ ] Onglets : Matchs confirmés, Likes reçus (flou premium), Vues profil (flou premium)
- [ ] Grille responsive avec avatar + nom + distance

**Fichiers** : `frontend/src/pages/Matches.js`

---

### 4. MESSAGERIE

#### Demandes de Messages
- [ ] Modal envoi avec 5 messages prédéfinis
- [ ] Post-it animé après envoi
- [ ] Panel notifications dans chat
- [ ] Acceptation/Refus par destinataire
- [ ] Match auto si accepté

**Fichiers** : `frontend/src/components/MessageModal.js`, `frontend/src/components/MessageRequestsPanel.js`, `backend/routes/messageRequests.js`

#### Chat Temps Réel
- [ ] Socket.IO WebSocket
- [ ] Liste conversations avec avatar, dernier message, badge non lu
- [ ] Bulles messages avec timestamps
- [ ] Indicateur "en train d'écrire..."
- [ ] Auto-scroll, responsive mobile

**Fichiers** : `frontend/src/pages/Chat.js`, `backend/routes/chat.js`

---

### 5. LIVE STREAMING

#### Live Surprise (Speed Dating)
- [ ] Connexion aléatoire WebRTC P2P
- [ ] Timer configurable (3/5/8/10 min)
- [ ] Skip après 30 secondes
- [ ] Décision Like/Dislike/Skip
- [ ] Match si like mutuel
- [ ] Contrôles caméra/micro

**Fichiers** : `frontend/src/pages/LiveSurprise.js`, `backend/routes/surprise.js`, `backend/socketHandlers/surprise.js`

#### Live Publique
- [ ] Liste lives actifs avec 4 onglets filtres
- [ ] Recherche par nom/titre/tags
- [ ] Cartes avec badge LIVE, compteur viewers, durée

**Fichiers** : `frontend/src/pages/LivePublic.js`, `backend/routes/live.js`

---

### 6. MODÉRATION

#### Niveaux de Privilèges
- [ ] 4 niveaux : Utilisateur, Modérateur, Admin, Super Admin
- [ ] Permissions configurables par modérateur
- [ ] Navigation conditionnelle (bouton modération si level >= 1)

#### Panel Modération
- [ ] Dashboard statistiques
- [ ] Liste utilisateurs (recherche/filtres)
- [ ] Actions : Avertir, Bannir, Débannir, Promouvoir, Révoquer
- [ ] Gestion modérateurs

**Fichiers** : `frontend/src/pages/ModerationPanel.js`, `backend/routes/moderation.js`

---

### 7. INTERFACE & NAVIGATION

#### Pages (code écrit)
- [ ] Landing, Login, Register
- [ ] Home, Profile, PublicProfile
- [ ] Swipe, Matches, Chat
- [ ] Settings, Support
- [ ] ModerationPanel, StreamHub
- [ ] LiveSurprise, LivePublic

#### Design
- [ ] Dark mode
- [ ] Responsive (480px, 768px, 968px)
- [ ] Menu déroulant avatar
- [ ] Animations Framer Motion
- [ ] Routes protégées (redirection si non connecté)

**Fichiers** : `frontend/src/App.js`, `frontend/src/components/Navigation.js`

---

## MÉTRIQUES DE SUCCÈS MVP

### Critères Techniques
- [ ] 0 bug critique
- [ ] Temps chargement < 2s
- [ ] Responsive 100%
- [ ] Sécurité JWT

### Critères Fonctionnels
- [ ] Inscription fonctionne
- [ ] Profil complet créable
- [ ] Swipe fluide
- [ ] Matchs détectés
- [ ] Chat temps réel
- [ ] Lives opérationnels

### Critères UX
- [ ] Interface intuitive
- [ ] Animations fluides
- [ ] Notifications claires
- [ ] Navigation simple

---

## CHECKLIST LANCEMENT MVP

### Infrastructure
- [ ] MongoDB Atlas configuré
- [ ] Backend déployé
- [ ] Frontend déployé
- [ ] HTTPS activé
- [ ] Variables env configurées

### Fonctionnalités
- [ ] Inscription/Connexion OK
- [ ] Profils créables
- [ ] Upload photos fonctionne
- [ ] Swipe opérationnel
- [ ] Matchs détectés
- [ ] Chat temps réel
- [ ] Lives fonctionnels
- [ ] Modération accessible

### Tests
- [ ] Tests manuels complets
- [ ] Test sur mobile
- [ ] Test sur tablette
- [ ] Test différents navigateurs
- [ ] Test avec 2+ utilisateurs
- [ ] Test tous parcours utilisateur

### Documentation
- [ ] README complet
- [ ] Guide déploiement
- [ ] Documentation technique

### Légal
- [ ] CGU rédigées
- [ ] Politique confidentialité
- [ ] Mentions légales
- [ ] RGPD conforme

---

**Document** : MVP GloboStream
**Version** : 2.0
**Statut** : Code écrit - Aucune fonctionnalité testée
**Date** : Février 2026
