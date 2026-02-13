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
MongoDB Atlas (base de données)
Nominatim/OpenStreetMap (géolocalisation)
Google OAuth (connexion sociale)
```

---

## Structure du Projet

```
globostream/
├── backend/                    # Serveur Node.js
│   ├── models/                # Modèles MongoDB
│   │   ├── User.js           # Utilisateurs
│   │   ├── Message.js        # Messages chat
│   │   └── MessageRequest.js # Demandes de messages
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
│   │   └── changePassword.js
│   ├── middleware/           # Middlewares
│   │   ├── auth.js          # Vérification JWT
│   │   └── privileges.js    # Vérification droits
│   ├── socketHandlers/       # Gestionnaires Socket.IO
│   │   └── surprise.js
│   ├── config/               # Configuration
│   │   └── passport.js      # OAuth
│   ├── scripts/              # Utilitaires DB
│   ├── server.js            # Point d'entrée
│   └── package.json
│
├── frontend/                  # Application React
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   │   ├── Navigation.js
│   │   │   ├── LocationPicker.js
│   │   │   ├── FiltersPanel.js
│   │   │   ├── MessageModal.js
│   │   │   └── MessageRequestsPanel.js
│   │   ├── pages/           # Pages principales
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
│   │   │   └── LivePublic.js
│   │   ├── contexts/        # Contextes React
│   │   │   └── AuthContext.js
│   │   ├── App.js           # Router principal
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

### Accès
- Frontend : http://localhost:3000
- Backend : http://localhost:5000

---

## État Actuel du Projet

**Statut** : En développement - Phase MVP

Le code des fonctionnalités de base existe mais **aucune fonctionnalité n'a été testée de manière complète**. Voir `docs/RAPPORT.md` pour le détail de chaque fonctionnalité et son statut de test.

### Fonctionnalités codées (à tester)

**Authentification & Profils**
- [ ] Inscription/Connexion email/password
- [ ] OAuth Google/Facebook/Apple (structure)
- [ ] Profil complet (20+ champs)
- [ ] Upload 6 photos max
- [ ] Géolocalisation GPS automatique
- [ ] Autocomplétion ville (OpenStreetMap)

**Swipe & Matching**
- [ ] Système de swipe avec animations
- [ ] 10 filtres avancés (âge, distance, genre, taille, etc.)
- [ ] Calcul distance GPS (Haversine)
- [ ] Détection matchs automatique

**Messagerie**
- [ ] Chat temps réel (Socket.IO)
- [ ] Demandes de messages avec acceptation/refus
- [ ] Indicateur "en train d'écrire..."

**Live Streaming**
- [ ] Live Surprise (Speed Dating vidéo)
- [ ] Live Publique avec filtres
- [ ] WebRTC P2P (Simple-Peer)

**Modération**
- [ ] 4 niveaux de privilèges (User/Mod/Admin/SuperAdmin)
- [ ] Panel modération
- [ ] Actions : bannir, débannir, promouvoir, révoquer

**Interface & UX**
- [ ] Design dark mode
- [ ] Navigation avec menu déroulant
- [ ] Responsive (mobile/tablette/desktop)
- [ ] Animations (Framer Motion)

### À développer
- [ ] WebRTC complet pour multi-participants
- [ ] Notifications push
- [ ] Emails transactionnels
- [ ] Système de signalement & blocage
- [ ] Tests automatisés

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

**Version** : 3.0
**Dernière mise à jour** : Février 2026
**Statut** : En développement - Aucune fonctionnalité testée
