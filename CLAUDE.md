# CLAUDE.md

## ⚠️ LECTURE OBLIGATOIRE AVANT TOUTE ACTION

**Avant de commencer à travailler sur ce projet, vous DEVEZ lire [`claude_context.md`](claude_context.md).**

Ce fichier contient :
- **Le workflow Git strict** : `main` (stable) + `claude-work` (développement) uniquement
- **L'architecture complète** du projet (backend + frontend)
- **Les règles de sécurité** et zones sensibles à ne pas casser
- **Les conventions de code** et bonnes pratiques spécifiques
- **L'état actuel du projet** et prochaines étapes

📖 **Ordre de lecture recommandé** :
1. [`claude_context.md`](claude_context.md) ← **LIRE EN PREMIER** (source de vérité)
2. [`claude_session.md`](claude_session.md) ← Historique récent des sessions
3. [`docs/RAPPORT.md`](docs/RAPPORT.md) ← État détaillé des fonctionnalités
4. Ce fichier (CLAUDE.md) ← Instructions générales

---

## Instructions

- **Toujours répondre en français.** L'utilisateur est francophone.
- Consulter `docs/RAPPORT.md` pour connaître l'état des fonctionnalités et des tests avant de travailler sur une feature.
- Mettre à jour `docs/RAPPORT.md` après chaque fonctionnalité testée ou corrigée.
- Aucune fonctionnalité n'est considérée comme terminée tant qu'elle n'a pas été testée.
- **OBLIGATOIRE** : Mettre à jour `claude_session.md` à la fin de chaque session et/ou étape. Ce fichier sert de mémoire persistante entre les sessions Claude Code. Y noter : ce qui a été fait, les bugs trouvés/corrigés, l'état actuel, et les prochaines étapes.

## Statut du projet

- **Phase** : MVP en cours — tests en progression
- **84 fonctionnalités codées, 48 testées** (30 API + 18 modération) — voir `docs/RAPPORT.md`
- **15/15 pages frontend testées visuellement** + responsive 3 tailles
- **i18n en cours** : 5 langues (FR, EN, IT, DE, ES) — intégration dans les composants en cours
- **10 bugs corrigés** + 36 warnings ESLint éliminés
- Pas de tests automatisés, pas de CI/CD

## Stack Technique

- **Backend** : Node.js 18+, Express 4, MongoDB (Mongoose), Socket.IO, JWT + Passport.js (Google/Facebook/Apple OAuth)
- **Frontend** : React 18, React Router v6, Socket.IO Client, Simple-Peer (WebRTC), Framer Motion, Axios
- **Base de données** : MongoDB Atlas avec Mongoose ODM

## Structure

```
backend/
  server.js          # Point d'entrée (Express + Socket.IO)
  config/            # Configuration Passport.js
  middleware/        # auth.js, privileges.js
  models/            # User.js, Message.js, MessageRequest.js
  routes/            # 12 fichiers de routes API
  socketHandlers/    # Gestionnaires Socket.IO
  scripts/           # Utilitaires DB

frontend/
  src/
    App.js           # Router & routes
    pages/           # 15 pages
    components/      # Composants réutilisables
    contexts/        # AuthContext.js
    index.js

docs/
  MVP.md             # Fonctionnalités MVP (checklist)
  POST_MVP.md        # Fonctionnalités futures
  RAPPORT.md         # Rapport fonctionnalités & tests (à maintenir)
```

## Commandes

```bash
# Backend
cd backend && npm install
npm run dev          # nodemon server.js

# Frontend
cd frontend && npm install
npm start            # react-scripts start (port 3000)
npm run build        # build production
```

## Architecture

- Backend : **CommonJS** (`require`/`module.exports`) ; Frontend : **ES modules** (`import`/`export`)
- Pure **JavaScript** — pas de TypeScript
- Auth : JWT (7 jours) + bcrypt (12 rounds) + Passport.js
- 4 niveaux de privilèges : User (0), Mod (1), Admin (2), SuperAdmin (3)
- Temps réel : Socket.IO pour chat/streaming, WebRTC via Simple-Peer pour vidéo
- Localisation : GeoJSON + calcul distance Haversine

## Conventions de code

- Commentaires en **français**
- **camelCase** pour variables/fonctions, **PascalCase** pour composants React
- Backend : async/await avec try/catch
- Frontend : composants fonctionnels uniquement, React Hooks
- Pas de framework de test configuré
- ESLint `react-app` (frontend uniquement)

## Fichiers de documentation

| Fichier | Contenu |
|---------|---------|
| `README.md` | Vue d'ensemble du projet |
| `ROADMAP.md` | Roadmap par phases |
| `ROADMAP_COMPLETE.md` | Détails techniques de chaque phase |
| `docs/MVP.md` | Checklist fonctionnalités MVP |
| `docs/POST_MVP.md` | Fonctionnalités post-MVP |
| `docs/RAPPORT.md` | **Rapport de suivi** — à mettre à jour après chaque test |
| `claude_session.md` | **Journal de session** — mémoire persistante entre sessions Claude Code (obligatoire) |

## Environnement

Backend nécessite un fichier `.env` — voir `backend/.env.example`.
