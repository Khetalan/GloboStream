# CLAUDE.md

## Protocole de Demarrage (OBLIGATOIRE)

**A chaque nouvelle session ou reprise de conversation, Claude Code DOIT executer ce protocole AVANT toute action :**

### Etape 1 — Lecture obligatoire (P1)
Lire ces fichiers dans cet ordre EXACT :

| # | Fichier | Quoi chercher | Priorite |
|---|---------|---------------|----------|
| 1 | `MEMORY.md` | Decisions architecture, regles UI, historique cle, résumé agent.js | **P1 — MEMOIRE PERSISTANTE** |
| 2 | `claude_context.md` | Architecture, regles Git, conventions, zones sensibles | **P1 — SOURCE DE VERITE** |
| 3 | `claude_session.md` | Derniere session, etat actuel, prochaines etapes | **P1 — MEMOIRE SESSION** |
| 4 | `CLAUDE.md` (ce fichier) | Instructions generales, statut projet | **P1 — INSTRUCTIONS** |

### Etape 2 — Lecture selon la tache (P2)
Lire SI la tache concerne des fonctionnalites ou des tests :

| # | Fichier | Quand le lire |
|---|---------|---------------|
| 5 | `docs/RAPPORT.md` | Avant de travailler sur une feature ou un test |
| 6 | `todo_claude.md` | Au demarrage — traiter les taches EN ATTENTE en priorite |

### Etape 3 — Reference (P3)
Consulter SI besoin d'informations complementaires :

| # | Fichier | Contenu |
|---|---------|---------|
| 7 | `README.md` | Vue d'ensemble publique du projet |
| 8 | `ROADMAP.md` | Roadmap par phases |
| 9 | `ROADMAP_COMPLETE.md` | Details techniques de chaque phase |
| 10 | `docs/MVP.md` | Checklist fonctionnalites MVP |
| 11 | `docs/POST_MVP.md` | Fonctionnalites futures |

### Etape 4 — Confirmation
Apres lecture, confirmer a l'utilisateur :
- L'etat actuel du projet (derniere session)
- Ce qui etait en cours / les prochaines etapes
- Que le protocole de demarrage a ete execute

### Prompt de demarrage rapide
> **"Lis les fichiers obligatoires (claude_context.md, claude_session.md, CLAUDE.md) et donne-moi le point de situation avant de commencer."**

---

## Instructions

- **Toujours repondre en francais.** L'utilisateur est francophone.
- Claude est responsable du **backend ET du frontend** (Gemini n'est plus utilise).
- Consulter `docs/RAPPORT.md` pour connaitre l'etat des fonctionnalites et des tests avant de travailler sur une feature.
- Mettre a jour `docs/RAPPORT.md` apres chaque fonctionnalite testee ou corrigee.
- Aucune fonctionnalite n'est consideree comme terminee tant qu'elle n'a pas ete testee.
- **OBLIGATOIRE** : Mettre a jour `claude_session.md` a la fin de chaque session et/ou etape.
- **OBLIGATOIRE** : Lire `todo_claude.md` au demarrage et traiter les taches EN ATTENTE en priorite.

---

## Perimetre de Claude — Backend ET Frontend

Claude prend en charge l'integralite du projet :

| Zone | Action |
|------|--------|
| `backend/` | Lecture + Modification (routes, models, middleware, sockets) |
| `frontend/src/` | Lecture + Modification (pages, composants, CSS, i18n) |
| Fichiers MD racine | Lecture + Modification |

### Regle de decision — modele a utiliser

Via `agent.js` (node agent.js <commande>) :
- **Haiku** → Fichiers MD, i18n, taches simples ($0.000001/req)
- **Sonnet** → Code backend courant, CSS, composants React simples ($0.01/req)
- **Opus** → Code complexe, WebRTC, refactor, pages multi-fichiers ($0.05/req)

---

## Statut du projet

- **Phase** : MVP en cours — architecture live complete
- **95+ fonctionnalites codees, 210 tests Jest (100%)** — voir `docs/RAPPORT.md`
- **17+ pages frontend** (15 originales + LiveCompetition + LiveEvent)
- **i18n complet** : 5 langues (FR, EN, IT, DE, ES) — 22/22 fichiers integres
- **20+ bugs corriges** + 36 warnings ESLint elimines
- **Architecture live complete** : LiveStream (streamer) + LiveViewer (spectateur) + Socket.IO rooms + WebRTC

---

## Stack Technique

- **Backend** : Node.js 18+, Express 4, MongoDB (Mongoose), Socket.IO, JWT + Passport.js (Google/Facebook/Apple OAuth)
- **Frontend** : React 18, React Router v6, Socket.IO Client, Simple-Peer (WebRTC), Framer Motion, Axios

---

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
    pages/           # 17+ pages
    components/      # Composants reutilisables (dont LiveStream)
    contexts/        # AuthContext.js
    locales/         # fr.json en.json it.json de.json es.json

docs/
  MVP.md             # Fonctionnalites MVP (checklist)
  POST_MVP.md        # Fonctionnalites futures
  RAPPORT.md         # Rapport fonctionnalites & tests (a maintenir)
```

---

## Commandes

```bash
# Backend
cd backend && npm install
npm run dev          # nodemon server.js

# Frontend
cd frontend && npm install
npm start            # react-scripts start (port 3000)
npm run build        # build production

# Agent IA (depuis la racine)
node agent.js help
node agent.js read claude_session.md
node agent.js code "tache backend" simple
node agent.js css "description" frontend/src/components/Navigation.js
node agent.js react "description" frontend/src/pages/Home.js
node agent.js page "description" complex
node agent.js i18n "description" frontend/src/pages/NomPage.js
```

---

## Architecture

- Backend : **CommonJS** (`require`/`module.exports`) ; Frontend : **ES modules** (`import`/`export`)
- Pure **JavaScript** — pas de TypeScript
- Auth : JWT (7 jours) + bcrypt (12 rounds) + Passport.js
- 4 niveaux de privileges : User (0), Mod (1), Admin (2), SuperAdmin (3)
- Temps reel : Socket.IO pour chat/streaming, WebRTC via Simple-Peer pour video
- Localisation : GeoJSON + calcul distance Haversine

---

## Conventions de code

- Commentaires en **francais**
- **camelCase** pour variables/fonctions, **PascalCase** pour composants React
- Backend : async/await avec try/catch
- Frontend : composants fonctionnels uniquement, React Hooks
- Tests automatises : Jest (210 tests, 100% passent)
- ESLint `react-app` (frontend uniquement)

---

## Fichiers de documentation

| Fichier | Contenu | Priorite |
|---------|---------|----------|
| `MEMORY.md` | **MEMOIRE PERSISTANTE** — Decisions archi, regles, résumé agent.js | P1 |
| `agent.js` | **ORCHESTRATEUR IA** — Script CLI Claude-only (Haiku/Sonnet/Opus) | P1 |
| `claude_context.md` | **SOURCE DE VERITE** — Architecture, regles, conventions | P1 |
| `claude_session.md` | **MEMOIRE SESSION** — Journal de session, etat actuel | P1 |
| `todo_claude.md` | **TACHES** — Backend ET frontend a traiter | P1 |
| `CLAUDE.md` | **INSTRUCTIONS** — Ce fichier, protocole demarrage | P1 |
| `docs/RAPPORT.md` | **RAPPORT** — Suivi fonctionnalites et tests | P2 |
| `README.md` | Vue d'ensemble du projet | P3 |
| `ROADMAP.md` | Roadmap par phases | P3 |
| `ROADMAP_COMPLETE.md` | Details techniques de chaque phase | P3 |
| `docs/MVP.md` | Checklist fonctionnalites MVP | P3 |
| `docs/POST_MVP.md` | Fonctionnalites post-MVP | P3 |

---

## Environnement

Backend necessite un fichier `.env` — voir `backend/.env.example`.
