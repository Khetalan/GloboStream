# CLAUDE.md

## Protocole de Demarrage (OBLIGATOIRE)

**A chaque nouvelle session ou reprise de conversation, Claude Code DOIT executer ce protocole AVANT toute action :**

### Etape 1 — Lecture obligatoire (P1)
Lire ces 3 fichiers dans cet ordre EXACT :

| # | Fichier | Quoi chercher | Priorite |
|---|---------|---------------|----------|
| 1 | `claude_context.md` | Architecture, regles Git, conventions, zones sensibles | **P1 — SOURCE DE VERITE** |
| 2 | `claude_session.md` | Derniere session, etat actuel, prochaines etapes | **P1 — MEMOIRE** |
| 3 | `CLAUDE.md` (ce fichier) | Instructions generales, statut projet | **P1 — INSTRUCTIONS** |

### Etape 2 — Lecture selon la tache (P2)
Lire SI la tache concerne des fonctionnalites ou des tests :

| # | Fichier | Quand le lire |
|---|---------|---------------|
| 4 | `docs/RAPPORT.md` | Avant de travailler sur une feature ou un test |

### Etape 3 — Reference (P3)
Consulter SI besoin d'informations complementaires :

| # | Fichier | Contenu |
|---|---------|---------|
| 5 | `README.md` | Vue d'ensemble publique du projet |
| 6 | `ROADMAP.md` | Roadmap par phases |
| 7 | `ROADMAP_COMPLETE.md` | Details techniques de chaque phase |
| 8 | `docs/MVP.md` | Checklist fonctionnalites MVP |
| 9 | `docs/POST_MVP.md` | Fonctionnalites futures |

### Etape 4 — Confirmation
Apres lecture, confirmer a l'utilisateur :
- L'etat actuel du projet (derniere session)
- Ce qui etait en cours / les prochaines etapes
- Que le protocole de demarrage a ete execute

### Prompt de demarrage rapide
> L'utilisateur peut coller ce prompt pour forcer le protocole :
>
> **"Lis les fichiers obligatoires (claude_context.md, claude_session.md, CLAUDE.md) et donne-moi le point de situation avant de commencer."**

---

## Instructions

- **Toujours repondre en francais.** L'utilisateur est francophone.
- Consulter `docs/RAPPORT.md` pour connaitre l'etat des fonctionnalites et des tests avant de travailler sur une feature.
- Mettre a jour `docs/RAPPORT.md` apres chaque fonctionnalite testee ou corrigee.
- Aucune fonctionnalite n'est consideree comme terminee tant qu'elle n'a pas ete testee.
- **OBLIGATOIRE** : Mettre a jour `claude_session.md` a la fin de chaque session et/ou etape. Ce fichier sert de memoire persistante entre les sessions Claude Code. Y noter : ce qui a ete fait, les bugs trouves/corriges, l'etat actuel, et les prochaines etapes.

## Statut du projet

- **Phase** : MVP en cours — architecture live complete
- **95+ fonctionnalites codees, 210 tests Jest (100%)** — voir `docs/RAPPORT.md`
- **17+ pages frontend** (15 originales + LiveCompetition + LiveEvent)
- **i18n complet** : 5 langues (FR, EN, IT, DE, ES) — 22/22 fichiers integres
- **20+ bugs corriges** + 36 warnings ESLint elimines
- **Architecture live complete** : LiveStream (streamer) + LiveViewer (spectateur) + Socket.IO rooms + WebRTC
- **Traduction chat live** : bouton 🌐 par message, API MyMemory (autodetect)
- **Photos Cloudinary** : stockage persistant (plus de 404 apres redemarrage Render)
- **CSS mobile-first** : refonte complete (22 fichiers)

## Stack Technique

- **Backend** : Node.js 18+, Express 4, MongoDB (Mongoose), Socket.IO, JWT + Passport.js (Google/Facebook/Apple OAuth)
- **Frontend** : React 18, React Router v6, Socket.IO Client, Simple-Peer (WebRTC), Framer Motion, Axios
- **Base de donnees** : MongoDB Atlas avec Mongoose ODM

## Structure

```
backend/
  server.js          # Point d'entree (Express + Socket.IO)
  config/            # Configuration Passport.js
  middleware/        # auth.js, privileges.js
  models/            # User.js, Message.js, MessageRequest.js
  routes/            # 12 fichiers de routes API
  socketHandlers/    # Gestionnaires Socket.IO
  scripts/           # Utilitaires DB

frontend/
  src/
    App.js           # Router & routes
    pages/           # 17+ pages (dont LiveCompetition, LiveEvent)
    components/      # Composants reutilisables (dont LiveStream)
    contexts/        # AuthContext.js
    index.js

docs/
  MVP.md             # Fonctionnalites MVP (checklist)
  POST_MVP.md        # Fonctionnalites futures
  RAPPORT.md         # Rapport fonctionnalites & tests (a maintenir)
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
- 4 niveaux de privileges : User (0), Mod (1), Admin (2), SuperAdmin (3)
- Temps reel : Socket.IO pour chat/streaming, WebRTC via Simple-Peer pour video
- Localisation : GeoJSON + calcul distance Haversine

## Conventions de code

- Commentaires en **francais**
- **camelCase** pour variables/fonctions, **PascalCase** pour composants React
- Backend : async/await avec try/catch
- Frontend : composants fonctionnels uniquement, React Hooks
- Tests automatises : Jest (210 tests, 100% passent)
- ESLint `react-app` (frontend uniquement)

## Fichiers de documentation

| Fichier | Contenu | Priorite |
|---------|---------|----------|
| `claude_context.md` | **SOURCE DE VERITE** — Architecture, regles, conventions | P1 |
| `claude_session.md` | **MEMOIRE** — Journal de session, etat actuel | P1 |
| `CLAUDE.md` | **INSTRUCTIONS** — Ce fichier, protocole demarrage | P1 |
| `docs/RAPPORT.md` | **RAPPORT** — Suivi fonctionnalites et tests | P2 |
| `README.md` | Vue d'ensemble du projet | P3 |
| `ROADMAP.md` | Roadmap par phases | P3 |
| `ROADMAP_COMPLETE.md` | Details techniques de chaque phase | P3 |
| `docs/MVP.md` | Checklist fonctionnalites MVP | P3 |
| `docs/POST_MVP.md` | Fonctionnalites post-MVP | P3 |

## Environnement

Backend necessite un fichier `.env` — voir `backend/.env.example`.
