# 💕 GloboStream - Application de Rencontres avec Live Streaming

> **Application web de rencontres moderne combinant matching intelligent, chat en temps réel et streaming vidéo**

---

## 📋 Vue d'Ensemble

GloboStream est une plateforme de rencontres complète qui va au-delà du simple swipe. Elle combine :

- **Rencontres classiques** : Système de swipe intelligent avec filtres avancés
- **Communication instantanée** : Chat en temps réel avec Socket.IO
- **Vidéo en direct** : Live streaming public et speed dating vidéo
- **Modération avancée** : Système complet de gestion et sécurité

---

## 🎯 Proposition de Valeur

### Pour les Utilisateurs
- ✅ Rencontres authentiques par vidéo avant le match
- ✅ Filtres intelligents pour trouver la bonne personne
- ✅ Communication sécurisée et modérée
- ✅ Expérience interactive et ludique

### Pour les Modérateurs
- ✅ Outils complets de gestion
- ✅ Système de privilèges à 4 niveaux
- ✅ Dashboard de statistiques
- ✅ Actions de modération en temps réel

---

## 🛠️ Technologies

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

## 📁 Structure du Projet

```
globostream/
├── backend/                    # Serveur Node.js
│   ├── models/                # Modèles MongoDB
│   │   ├── User.js           # Utilisateurs
│   │   ├── Message.js        # Messages chat
│   │   ├── MessageRequest.js # Demandes de messages
│   │   └── LiveStream.js     # Lives publics
│   ├── routes/               # Routes API
│   │   ├── auth.js          # Authentification
│   │   ├── users.js         # Profils
│   │   ├── swipe.js         # Swipe & matchs
│   │   ├── chat.js          # Messagerie
│   │   ├── messageRequests.js
│   │   ├── liveStream.js    # Lives
│   │   ├── moderation.js    # Modération
│   │   └── publicProfile.js
│   ├── middleware/           # Middlewares
│   │   ├── auth.js          # Vérification JWT
│   │   └── privileges.js    # Vérification droits
│   ├── socketHandlers/       # Gestionnaires Socket.IO
│   │   ├── chat.js
│   │   ├── surprise.js
│   │   └── liveStream.js
│   ├── config/               # Configuration
│   │   └── passport.js      # OAuth
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
│   │   │   ├── Landing.js   # Page marketing
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Home.js      # Dashboard
│   │   │   ├── Profile.js   # Profil personnel
│   │   │   ├── PublicProfile.js
│   │   │   ├── Swipe.js
│   │   │   ├── Matches.js
│   │   │   ├── Chat.js
│   │   │   ├── Settings.js
│   │   │   ├── Support.js
│   │   │   ├── ModerationPanel.js
│   │   │   ├── StreamHub.js  # Hub lives
│   │   │   ├── LiveSurprise.js
│   │   │   ├── LivePublic.js
│   │   │   └── LiveStreamViewer.js
│   │   ├── contexts/        # Contextes React
│   │   │   └── AuthContext.js
│   │   ├── App.js           # Router principal
│   │   ├── index.js
│   │   └── index.css        # Styles globaux
│   └── package.json
│
├── docs/                      # Documentation (ce dossier)
│   ├── README.md             # Ce fichier
│   ├── ROADMAP.md            # Roadmap projet
│   ├── ROADMAP_COMPLETE.md   # Roadmap détaillée
│   ├── MVP.md                # Fonctionnalités MVP
│   ├── POST_MVP.md           # Fonctionnalités futures
│   ├── TECHNICAL.md          # Documentation technique
│   └── FEATURES.md           # Guide des fonctionnalités
│
└── README.md                  # Ce fichier (racine)
```

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- MongoDB Atlas (compte gratuit)
- npm ou yarn

### Installation

```bash
# 1. Cloner le projet
git clone https://github.com/votre-repo/Globostream.git
cd Globostream

# 2. Installer backend
cd backend
npm install

# Créer .env
echo "MONGODB_URI=votre_uri_mongodb
JWT_SECRET=votre_secret_jwt
PORT=5000
FRONTEND_URL=http://localhost:3000" > .env

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

## 📊 État Actuel du Projet

### ✅ Fonctionnalités Complètes (Production Ready)

**Authentification & Profils**
- [x] Inscription/Connexion email/password
- [x] OAuth Google (structure prête)
- [x] Profil complet (20+ champs)
- [x] Upload 6 photos max
- [x] Géolocalisation GPS automatique
- [x] Autocomplétion ville (OpenStreetMap)
- [x] Badges vérifié/premium

**Swipe & Matching**
- [x] Système de swipe avec animations
- [x] 10 filtres avancés (âge, distance, genre, taille, etc.)
- [x] Calcul distance GPS (Haversine)
- [x] Détection matchs automatique
- [x] Page matchs avec 3 onglets

**Messagerie**
- [x] Chat temps réel (Socket.IO)
- [x] Demandes de messages avec acceptation/refus
- [x] Post-it animé sur cartes swipe
- [x] Panel notifications dans chat
- [x] Indicateurs en ligne
- [x] Indicateur "en train d'écrire..."

**Live Streaming**
- [x] Live Surprise (Chatroulette + Speed Dating)
- [x] Live Publique avec multi-participants (max 10)
- [x] Chat en direct
- [x] Système d'invitations participants
- [x] Compteurs viewers/participants temps réel

**Modération**
- [x] 4 niveaux de privilèges (User/Mod/Admin/SuperAdmin)
- [x] Permissions configurables
- [x] Panel modération complet
- [x] Actions : bannir, débannir, promouvoir, révoquer
- [x] Dashboard statistiques

**Interface & UX**
- [x] Design dark mode moderne
- [x] Navigation avec menu déroulant
- [x] 100% responsive (mobile/tablette/desktop)
- [x] Animations fluides (Framer Motion)
- [x] Page Settings complète
- [x] Page Support avec FAQ

### 🚧 En Développement

**Live Streaming Avancé**
- [ ] WebRTC complet pour multi-participants
- [ ] Enregistrement des lives
- [ ] Replays

**Notifications**
- [ ] Notifications push
- [ ] Emails transactionnels
- [ ] Notifications in-app

### 📋 Prochaines Étapes (Post-MVP)

Voir `POST_MVP.md` pour la liste complète

---

## 👥 Rôles & Permissions

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

## 🔐 Sécurité

### Authentification
- JWT avec expiration 7 jours
- Bcrypt (12 rounds) pour mots de passe
- Token rafraîchi à chaque requête

### Données
- Validation côté serveur (Mongoose)
- Sanitization des entrées
- Index MongoDB pour performance
- Pas de données sensibles dans JWT

### Upload Fichiers
- Limite 5MB par photo
- Types autorisés : JPEG, PNG, WebP
- Validation serveur (Multer)

### Modération
- Système de bannissement
- Avertissements enregistrés
- Logs des actions modération

---

## 📈 Métriques & KPIs

### Utilisateurs
- Utilisateurs actifs quotidiens/mensuels
- Taux de rétention
- Temps moyen sur l'app

### Engagement
- Nombre de swipes/jour
- Taux de match
- Messages envoyés
- Lives créés/regardés

### Modération
- Signalements traités
- Temps de réponse
- Utilisateurs bannis

---

## 🤝 Contribution

### Pour Développer

```bash
# Créer une branche
git checkout -b feature/nom-feature

# Développer et tester
npm test

# Commiter
git commit -m "feat: description"

# Push
git push origin feature/nom-feature

# Créer Pull Request
```

### Standards Code

- **Backend** : ES6+, async/await, try/catch
- **Frontend** : Functional components, hooks
- **Style** : Suivre les conventions existantes
- **Commits** : Format conventional commits

---

## 📞 Support

### Documentation
- `docs/TECHNICAL.md` - Documentation technique
- `docs/FEATURES.md` - Guide des fonctionnalités
- Code commenté en français

### Contact
- Email : votre@email.com
- Issues : GitHub Issues

---

## 📜 Licence

Projet privé - Tous droits réservés © 2026

---

## 🎉 Remerciements

- Anthropic Claude pour l'assistance développement
- MongoDB Atlas pour l'hébergement gratuit
- OpenStreetMap pour la géolocalisation
- React & Framer Motion pour l'UX

---

## 🗺️ Prochaines Étapes

1. Consulter `ROADMAP.md` pour la vision globale
2. Lire `MVP.md` pour les fonctionnalités MVP
3. Voir `TECHNICAL.md` pour les détails techniques
4. Explorer `FEATURES.md` pour l'utilisation

---

**Version** : 3.0  
**Dernière mise à jour** : Février 2026  
**Statut** : ✅ MVP Complet - En développement actif
