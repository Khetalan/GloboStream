# Claude Context — GloboStream

> **Fichier de mémoire persistante du projet**
>
> ⚠️ **OBLIGATOIRE** : Ce fichier DOIT être lu par Claude Code avant toute action sur le projet.
> Il contient les règles strictes, l'architecture et les conventions du projet.

---

## 1. Présentation du Projet

### Nom
**GloboStream**

### Objectif fonctionnel
Application web de rencontres moderne combinant :
- **Matching intelligent** : Système de swipe avec filtres avancés (10 critères)
- **Chat temps réel** : Messagerie instantanée avec Socket.IO
- **Streaming vidéo** : Live streaming public et speed dating vidéo (Live Surprise)
- **Modération avancée** : Système complet de gestion avec 4 niveaux de privilèges

### Type d'application
- **Monorepo** avec backend API REST et frontend SPA
- Application web fullstack de type **réseau social de rencontres**
- Architecture client-serveur avec communications temps réel (WebSocket + WebRTC)

---

## 2. Stack Technique

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Node.js** | 18+ | Runtime JavaScript serveur |
| **Express** | 4.x | Framework web API REST |
| **MongoDB** | Atlas | Base de données NoSQL |
| **Mongoose** | 8.x | ODM pour MongoDB |
| **Socket.IO** | 4.6+ | Communication temps réel (chat, streaming) |
| **JWT** | 9.x | Authentification token (expiration 7j) |
| **Bcrypt** | 2.x | Hachage mots de passe (12 rounds) |
| **Passport.js** | 0.7+ | Authentification OAuth (Google/Facebook/Apple) |
| **Multer** | 1.4+ | Upload fichiers (photos profil, max 6) |
| **Jest** | 30.x | Tests unitaires et d'intégration |

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **React** | 18.x | Bibliothèque UI (composants fonctionnels uniquement) |
| **React Router** | 6.x | Routing SPA |
| **Socket.IO Client** | 4.6+ | Client WebSocket |
| **Simple-Peer** | 9.x | WebRTC peer-to-peer (vidéo) |
| **Framer Motion** | 10+ | Animations UI |
| **Axios** | 1.x | Client HTTP |
| **i18next** | 23+ | Internationalisation (5 langues) |
| **React Hot Toast** | 2.x | Notifications utilisateur |

### Authentification
- **JWT** avec payload `{ userId }` (pas `id` !)
- **Bcrypt** 12 rounds pour hachage mots de passe
- **Passport.js** pour OAuth (Google, Facebook, Apple)
- Token stocké dans `localStorage` (clé : `token`)

### Base de données
- **MongoDB Atlas** (cloud)
- **Mongoose ODM** avec validation stricte
- **3 modèles principaux** : `User`, `Message`, `MessageRequest`
- **GeoJSON** pour localisation GPS (calcul distance Haversine)

---

## 3. Structure du Projet

```
GloboStream/
├── backend/                     # API REST Node.js + Socket.IO
│   ├── server.js               # Point d'entrée (Express + Socket.IO)
│   ├── config/                 # Configuration
│   │   └── passport.js        # OAuth strategies (Google/Facebook/Apple)
│   ├── middleware/             # Middlewares
│   │   ├── auth.js            # Vérification JWT (authMiddleware)
│   │   └── privileges.js      # Vérification privilèges modération
│   ├── models/                 # Modèles Mongoose
│   │   ├── User.js            # Utilisateurs (20+ champs, 4 niveaux)
│   │   ├── Message.js         # Messages chat
│   │   └── MessageRequest.js  # Demandes de messages
│   ├── routes/                 # 12 fichiers de routes API
│   │   ├── auth.js            # Authentification (/api/auth/*)
│   │   ├── users.js           # Profils (/api/users/*)
│   │   ├── swipe.js           # Swipe & matchs (/api/swipe/*)
│   │   ├── chat.js            # Chat temps réel (/api/chat/*)
│   │   ├── messageRequests.js # Demandes messages (/api/message-requests/*)
│   │   ├── matches.js         # Matchs (/api/matches/*)
│   │   ├── stream.js          # Streams (/api/stream/*)
│   │   ├── live.js            # Lives publics (/api/live/*)
│   │   ├── surprise.js        # Live Surprise (/api/surprise/*)
│   │   ├── moderation.js      # Modération (/api/moderation/*)
│   │   ├── publicProfile.js   # Profils publics (/api/public-profile/*)
│   │   └── changePassword.js  # Changement mot de passe (/api/change-password/*)
│   ├── socketHandlers/         # Gestionnaires Socket.IO
│   │   ├── surprise.js        # Live Surprise handlers
│   │   └── liveRoom.js        # Rooms live (Public/Competition/Event) — WebRTC signaling, chat, join requests
│   ├── scripts/                # Utilitaires DB
│   │   ├── createSuperAdmin.js
│   │   ├── testSetPrimary.js
│   │   └── testUpload.js
│   ├── tests/                  # Tests Jest (en cours)
│   │   ├── setup.js
│   │   └── auth.test.js
│   ├── uploads/                # Fichiers uploadés
│   │   └── photos/
│   ├── jest.config.js          # Configuration Jest
│   ├── package.json            # Dépendances backend
│   └── .env                    # Variables d'environnement (non versionné)
│
├── frontend/                    # Application React SPA
│   ├── public/                 # Fichiers statiques
│   ├── src/
│   │   ├── App.js             # Router principal (React Router v6)
│   │   ├── index.js           # Point d'entrée React
│   │   ├── i18n.js            # Configuration i18next (5 langues)
│   │   ├── components/         # Composants réutilisables
│   │   │   ├── Navigation.js
│   │   │   ├── LocationPicker.js
│   │   │   ├── FiltersPanel.js
│   │   │   ├── MessageModal.js
│   │   │   ├── MessageRequestsPanel.js
│   │   │   ├── LanguageSwitcher.js  # Dropdown langues (🌐 FR)
│   │   │   ├── LiveStream.js      # Interface live streamer (WebRTC, chat avec traduction, stats)
│   │   │   ├── LiveStream.css     # Styles LiveStream (9 layouts, preview, stats, chat, traduction)
│   │   │   ├── LiveViewer.js      # Interface live spectateur (reception WebRTC, chat, rejoindre)
│   │   │   └── LiveViewer.css     # Styles LiveViewer
│   │   ├── pages/              # 17+ pages principales
│   │   │   ├── Landing.js     # Page d'accueil publique
│   │   │   ├── Login.js       # Connexion
│   │   │   ├── Register.js    # Inscription
│   │   │   ├── Home.js        # Dashboard utilisateur
│   │   │   ├── Profile.js     # Profil personnel
│   │   │   ├── PublicProfile.js # Profil public (/profile/:userId)
│   │   │   ├── Swipe.js       # Système de swipe
│   │   │   ├── Matches.js     # Liste des matchs
│   │   │   ├── Chat.js        # Messagerie temps réel
│   │   │   ├── Settings.js    # Paramètres utilisateur
│   │   │   ├── Support.js     # Support & aide
│   │   │   ├── ModerationPanel.js # Panel modération
│   │   │   ├── StreamHub.js   # Hub streaming
│   │   │   ├── LiveSurprise.js # Live Surprise (speed dating — interface appel vidéo)
│   │   │   ├── LivePublic.js  # Lives publics (bannière Démarrer + LiveStream)
│   │   │   ├── LiveCompetition.js # Live Compétition (écran accueil + LiveStream)
│   │   │   └── LiveEvent.js   # Live Événementiel (écran accueil + LiveStream)
│   │   ├── contexts/           # Contextes React
│   │   │   └── AuthContext.js # Gestion authentification globale
│   │   └── locales/            # Traductions i18n (5 langues)
│   │       ├── fr.json        # Français (~665 clés)
│   │       ├── en.json        # Anglais
│   │       ├── it.json        # Italien
│   │       ├── de.json        # Allemand
│   │       └── es.json        # Espagnol
│   ├── package.json            # Dépendances frontend
│   └── build/                  # Build production (ignoré)
│
├── docs/                        # Documentation projet
│   ├── MVP.md                  # Checklist fonctionnalités MVP
│   ├── POST_MVP.md             # Fonctionnalités futures
│   └── RAPPORT.md              # Rapport détaillé (90 fonctionnalités)
│
├── .claude/                     # Dossier Claude Code (ignoré)
├── README.md                    # Vue d'ensemble projet
├── ROADMAP.md                   # Roadmap par phases
├── ROADMAP_COMPLETE.md          # Roadmap détaillée technique
├── CLAUDE.md                    # Instructions pour Claude Code
├── claude_session.md            # Journal de session (mémoire persistante)
├── claude_context.md            # CE FICHIER (contexte projet)
└── .gitignore
```

### Dossiers importants

| Dossier | Responsabilité | ⚠️ Zone sensible |
|---------|----------------|------------------|
| `backend/models/` | Schémas MongoDB (validation stricte) | **OUI** — Ne jamais casser la compatibilité DB |
| `backend/middleware/` | Auth JWT + privilèges modération | **OUI** — Sécurité critique |
| `backend/routes/` | Logique métier API REST | **OUI** — Ne pas introduire de bugs |
| `frontend/src/pages/` | 15 pages React (UI principale) | Moyennement — Tests visuels à refaire si changements |
| `frontend/src/locales/` | Traductions i18n (5 langues × 663 clés) | **OUI** — Ne jamais supprimer de clés sans vérifier |
| `docs/` | Documentation projet | Non — Mais maintenir à jour |

### Zones sensibles à ne pas casser

1. **Authentification JWT** (`backend/middleware/auth.js`) :
   - Le payload JWT est `{ userId }` (PAS `{ id }` !)
   - Ne jamais changer la structure du token sans migration
   - Token valide 7 jours

2. **Modèle User** (`backend/models/User.js`) :
   - 20+ champs (dont GeoJSON pour localisation)
   - 4 niveaux de privilèges : `0` (User), `1` (Mod), `2` (Admin), `3` (SuperAdmin)
   - Ne jamais supprimer un champ sans migration DB

3. **Routes protégées** (`backend/middleware/auth.js` + `privileges.js`) :
   - Toutes les routes `/api/*` (sauf `/auth/register` et `/auth/login`) nécessitent JWT
   - Routes modération nécessitent privilège minimum selon la fonction

4. **i18n** (`frontend/src/locales/*.json`) :
   - ~700 clés de traduction en 5 langues
   - Ne jamais supprimer une clé sans vérifier TOUS les fichiers qui l'utilisent
   - Utiliser `t('key')` dans les composants React

5. **Socket.IO** (`backend/server.js` + `socketHandlers/`) :
   - Namespace `/` pour chat + live rooms
   - Chat prive : `join-room`, `send-message`, `typing`
   - Live rooms : `create-live-room`, `join-live-room`, `live-signal`, `live-chat`, `request-join-live`
   - Ne pas changer les noms d'events sans synchroniser client/serveur

---

## 4. Workflow Git (SECTION CRITIQUE)

### ⚠️ RÈGLES ABSOLUES — À RESPECTER IMPÉRATIVEMENT

#### Branches autorisées
**UNIQUEMENT 2 BRANCHES** doivent exister en permanence :

1. **`main`** : Branche stable et propre
   - Code testé et validé uniquement
   - Toujours synchronisée avec `claude-work`
   - Ne JAMAIS travailler directement dessus

2. **`claude-work`** : Branche de développement active
   - UNIQUE branche de développement
   - Tout le travail expérimental se fait ici
   - Synchronisée régulièrement avec `main`

#### Interdictions strictes

🚫 **INTERDIT** de créer d'autres branches sans autorisation explicite de l'utilisateur
🚫 **INTERDIT** de travailler directement sur `main`
🚫 **INTERDIT** de supprimer une branche sans vérifier qu'elle est fusionnée ou inutile
🚫 **INTERDIT** d'utiliser `git reset --hard` (destructif)
🚫 **INTERDIT** de réécrire l'historique Git (`rebase -i`, `commit --amend` sur commits pushés)
🚫 **INTERDIT** de force push sur `main` (`git push --force`)

#### Workflow standard

```bash
# 1. Toujours travailler sur claude-work
git checkout claude-work

# 2. Faire les modifications
# ... édition de fichiers ...

# 3. Committer régulièrement
git add .
git commit -m "Description claire du changement"

# 4. Quand le travail est stable, synchroniser main
git checkout main
git merge claude-work --no-edit

# 5. Pousser les deux branches
git push origin main
git push origin claude-work
```

#### En cas de doute
- **STOP**
- Expliquer la situation à l'utilisateur
- Demander confirmation avant toute action Git risquée

---

## 5. Règles Strictes pour Claude

### 📖 Avant toute action

1. **Lire `claude_context.md`** (ce fichier) — OBLIGATOIRE
2. **Lire `claude_session.md`** pour connaître l'historique récent
3. **Lire `docs/RAPPORT.md`** pour l'état des fonctionnalités et des tests

### 🎯 Modifier uniquement ce qui est demandé

- **Ne JAMAIS faire de refactor global** sans validation explicite de l'utilisateur
- **Ne PAS "améliorer" du code** qui n'est pas concerné par la demande
- **Ne PAS ajouter de fonctionnalités** non demandées
- **Ne PAS supprimer de code** sans être certain qu'il est inutile

### 🔒 Sécurité avant tout

- **Toujours valider les entrées utilisateur** côté backend
- **Ne jamais stocker de mots de passe en clair**
- **Ne jamais exposer de secrets** dans le code (.env uniquement)
- **Vérifier l'authentification JWT** sur toutes les routes protégées
- **Respecter les niveaux de privilèges** pour les actions de modération

### 📝 Lisibilité et bon sens

- **Commentaires en français** uniquement
- **Variables et fonctions en camelCase** (backend + frontend)
- **Composants React en PascalCase**
- **Pas de code mort** (supprimer les imports/variables non utilisés)
- **Pas de console.log** dans le code final (sauf debug explicite)

### 🚨 Aucune modification de la stratégie Git sans autorisation

- **Ne JAMAIS créer de nouvelle branche** sans autorisation
- **Ne JAMAIS changer le workflow Git** décrit dans ce fichier
- **Toujours expliquer les actions Git** avant de les exécuter
- **En cas de doute, DEMANDER** avant d'agir

### 📊 Maintenir la documentation

- **Mettre à jour `claude_session.md`** à la fin de chaque session
- **Mettre à jour `docs/RAPPORT.md`** après chaque fonctionnalité testée
- **Ne PAS créer de fichiers README/CONTRIBUTING** non demandés

---

## 6. Bonnes Pratiques Spécifiques au Projet

### Conventions JavaScript

#### Backend (CommonJS)
```javascript
// Modules
const express = require('express');
const { authMiddleware } = require('../middleware/auth');

// Fonctions asynchrones avec try/catch
router.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toujours utiliser req.userId (pas req.id)
```

#### Frontend (ES Modules)
```javascript
// Modules
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Composants fonctionnels uniquement
const MaPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);

  return <div>{t('key')}</div>;
};

export default MaPage;
```

### Patterns existants

#### Authentification
- **Backend** : `authMiddleware` vérifie le header `Authorization: Bearer <token>`
- **Frontend** : `AuthContext` fournit `user`, `login()`, `logout()`
- **Token JWT** : Payload `{ userId }` (7 jours d'expiration)

#### Modération
- **4 niveaux** : `0` (User), `1` (Mod), `2` (Admin), `3` (SuperAdmin)
- **Middleware** : `requirePrivilege(level)` vérifie le niveau minimum
- **Permissions** : Array d'actions autorisées (ex: `['ban_user', 'delete_content']`)

#### Internationalisation (i18n)
- **5 langues** : FR (défaut), EN, IT, DE, ES
- **~700 clés** de traduction dans `frontend/src/locales/*.json`
- **Usage** : `const { t } = useTranslation();` puis `t('key')`
- **Changement de langue** : `i18n.changeLanguage('en')`
- **Persistance** : `localStorage.getItem('i18nextLng')`

#### Upload de photos
- **Backend** : Multer + Cloudinary (stockage cloud persistant)
- **Frontend** : FormData avec `multipart/form-data`
- **Stockage** : Cloudinary (`globostream/photos/`) — URLs absolues `https://res.cloudinary.com/...`
- **Maximum** : 6 photos par utilisateur
- **Env vars** : `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Erreurs connues à éviter

1. **JWT payload `{id}` au lieu de `{userId}`** → Corrigé, ne plus réintroduire
2. **Double `authMiddleware` sur une route** → Vérifier avant d'ajouter
3. **Validation côté frontend uniquement** → Toujours valider côté backend
4. **Clés i18n manquantes** → Vérifier dans les 5 fichiers JSON
5. **Socket.IO déconnexion non gérée** → Toujours nettoyer les listeners
6. **WebRTC peers non fermés** → Appeler `peer.destroy()` en cleanup

### Structure de commit

```bash
git commit -m "Type: Description concise

- Détail 1
- Détail 2
- Détail 3

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**Types** : `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

---

## 7. État Actuel du Projet (Février 2026)

### Compteurs
| Métrique | Valeur |
|---|---|
| Fonctionnalités codées | 90+ |
| Tests automatisés Jest | 210 tests (100% passent) |
| API backend testées | ~66/90 (~73%) |
| Pages frontend | 17+ (dont LiveCompetition, LiveEvent) |
| Pages frontend testées | 15/15 ✅ (voir `docs/rapport_frontend.md` par Gemini) |
| Responsive testé | 3 tailles ✅ (CSS mobile-first) |
| i18n intégré | 29/29 fichiers ✅ (5 langues, ~700 clés) |
| Interface de live | LiveStream (streamer) + LiveViewer (spectateur) + traduction chat |
| Photos | Cloudinary (persistantes) |
| Bugs corrigés | 20+ |

### Déploiement
| Service | URL | Détails |
|---------|-----|---------|
| **Frontend** | https://khetalan.github.io/GloboStream/ | GitHub Pages (branche `gh-pages`) |
| **Backend** | https://globostream.onrender.com | Render.com (free tier, cold start ~30s) |
| **Repo** | https://github.com/Khetalan/GloboStream | Public |

### Phase actuelle
**MVP en progression** — Backend deploye sur Render, frontend sur GitHub Pages. Architecture live complete (Socket.IO rooms + WebRTC). Photos persistantes via Cloudinary. Traduction chat en temps reel.

### Prochaines etapes prioritaires
1. **Corriger bug Apple OAuth** (passport.js ligne 143)
2. **Tester visuellement** les nouvelles pages (LiveCompetition, LiveEvent)
3. **Ameliorer scaling WebRTC** multi-viewers
4. **Deployer** les derniers changements (favicon, flows live, i18n complet)

---

## 8. Commandes Essentielles

### Backend
```bash
cd backend
npm install                  # Installer dépendances
npm run dev                  # Démarrer en dev (nodemon)
npm start                    # Démarrer en production
npm test                     # Lancer tests Jest
```

### Frontend
```bash
cd frontend
npm install                  # Installer dépendances
npm start                    # Démarrer dev (port 3000)
npm run build                # Build production
npm test                     # Lancer tests (non configuré)
```

### Variables d'environnement (backend/.env)
```bash
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...
APPLE_CLIENT_ID=...
APPLE_CLIENT_SECRET=...
```

---

## ⚠️ RAPPEL FINAL

**Ce fichier est la SOURCE DE VÉRITÉ du projet.**

- Avant toute action : **LIRE ce fichier**
- En cas de conflit avec d'autres docs : **ce fichier prévaut**
- Toute modification de ce fichier : **demander autorisation à l'utilisateur**

**Claude Code doit TOUJOURS** :
1. ✅ Lire `claude_context.md` avant toute action
2. ✅ Respecter le workflow Git (main + claude-work uniquement)
3. ✅ Ne modifier que ce qui est explicitement demandé
4. ✅ Prioriser sécurité, lisibilité et bon sens
5. ✅ Demander confirmation pour toute action risquée

---

**Version** : 1.3
**Dernière mise à jour** : 26 Février 2026
**Statut** : ✅ Déployé (Render + GitHub Pages) — Gemini retiré, Claude seul responsable backend + frontend
