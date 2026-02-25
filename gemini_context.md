# Gemini Context — GloboStream

> **Fichier de mémoire persistante du projet**
>
> ⚠️ **OBLIGATOIRE** : Ce fichier DOIT être lu par Gemini avant toute action sur le projet.
> Il contient les règles strictes, l'architecture et les conventions du projet.
>
> 📖 **SOURCE DE VÉRITÉ** : En cas de conflit avec un autre fichier, `claude_context.md` prévaut.
> Ce fichier est le miroir de `claude_context.md` adapté au rôle de Gemini.

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

## 2. Ton Rôle — Expert Frontend

Tu es l'**expert frontend** de GloboStream. Claude est l'**expert backend**.
Cette séparation est stricte pour les **modifications**, pas pour la **lecture**.

### Ce que tu peux faire

| Action | Zone | Détail |
|--------|------|--------|
| ✅ **Lire** | Tout le projet | Backend inclus — pour comprendre le contexte |
| ✅ **Modifier** | `frontend/` entier | JS, CSS, JSON, public/ |
| ✅ **Modifier** | Fichiers MD racine | GEMINI.md, gemini_session.md, todo_claude.md, todo_gemini.md |
| ✅ **Traduire** | `frontend/src/locales/*.json` | 5 langues, toutes les clés |
| ✅ **Traduire** | Tout fichier de traduction du projet | Frontend ET backend si nécessaire |
| ❌ **Modifier** | `backend/` (code) | Déléguer à Claude via todo_claude.md |
| ❌ **Modifier** | `backend/.env` | Jamais |
| ❌ **Modifier** | Tests Jest | Ne pas toucher |

### Règle absolue

```
Besoin de LIRE du backend ?      → Tu lis directement, pas de délégation
Besoin de MODIFIER du frontend ? → Tu le fais toi-même
Besoin de MODIFIER du backend ?  → todo_claude.md + tu délègues à Claude
Tu détectes un bug backend ?     → tu le notes dans todo_claude.md sans corriger
```

---

## 3. Stack Technique

### Frontend — Ton domaine principal
| Technologie | Version | Usage |
|-------------|---------|-------|
| **React** | 18.x | Composants fonctionnels uniquement |
| **React Router** | 6.x | Routing SPA |
| **Socket.IO Client** | 4.6+ | Client WebSocket (ne pas modifier la logique) |
| **Simple-Peer** | 9.x | WebRTC peer-to-peer (ne pas modifier la logique) |
| **Framer Motion** | 10+ | Toutes les animations UI |
| **Axios** | 1.x | Tous les appels API |
| **i18next** | 23+ | Internationalisation (5 langues) |
| **React Hot Toast** | 2.x | Toutes les notifications UI |

### Backend — À connaître pour le contexte
| Technologie | Usage | Ce que ça implique pour toi |
|-------------|-------|---------------------------|
| **Express** | API REST | Les routes API que tu appelles avec Axios |
| **Socket.IO** | Temps réel | Les events que tu écoutes côté client |
| **JWT** | Auth | Token stocké dans `localStorage` clé `token` |
| **Mongoose** | DB | Les champs disponibles dans les réponses API |
| **Cloudinary** | Photos | URLs absolues `https://res.cloudinary.com/...` |

### Authentification — Critique à connaître
- **JWT payload** : `{ userId }` — PAS `{ id }` !
- **Token** : stocké dans `localStorage.getItem('token')`
- **Header Axios** : `Authorization: Bearer <token>`
- **AuthContext** : fournit `user`, `login()`, `logout()`
- **Expiration** : 7 jours

---

## 4. Structure du Projet

```
GloboStream/
├── backend/                     # Expert Claude — tu lis, tu ne modifies pas
│   ├── server.js               # Point d'entrée Express + Socket.IO
│   ├── config/passport.js      # OAuth strategies
│   ├── middleware/             # auth.js (JWT) + privileges.js (roles)
│   ├── models/                 # User.js, Message.js, MessageRequest.js
│   ├── routes/                 # 12 routes API (voir section API ci-dessous)
│   ├── socketHandlers/         # surprise.js + liveRoom.js
│   └── scripts/                # Utilitaires DB
│
├── frontend/                    # Ton domaine — tu lis ET tu modifies
│   ├── public/
│   └── src/
│       ├── App.js              # Router principal React Router v6
│       ├── index.js            # Point d'entrée React
│       ├── i18n.js             # Config i18next — modifier avec prudence
│       ├── index.css           # Variables CSS globales — source de vérité design
│       ├── components/
│       │   ├── Navigation.js / Navigation.css
│       │   ├── LocationPicker.js
│       │   ├── FiltersPanel.js
│       │   ├── MessageModal.js
│       │   ├── MessageRequestsPanel.js
│       │   ├── LanguageSwitcher.js
│       │   ├── LiveStream.js / LiveStream.css  # WebRTC streamer — logique sensible
│       │   └── LiveViewer.js / LiveViewer.css  # WebRTC spectateur — logique sensible
│       ├── pages/              # 17 pages
│       │   ├── Landing.js      Login.js       Register.js
│       │   ├── Home.js         Profile.js     PublicProfile.js
│       │   ├── Swipe.js        Matches.js     Chat.js
│       │   ├── Settings.js     Support.js     ModerationPanel.js
│       │   ├── StreamHub.js    LiveSurprise.js
│       │   └── LivePublic.js   LiveCompetition.js   LiveEvent.js
│       ├── contexts/
│       │   └── AuthContext.js  # NE PAS MODIFIER la logique auth
│       └── locales/            # TON DOMAINE — toutes les traductions
│           ├── fr.json         # ~665 clés — Français (langue source)
│           ├── en.json         # Anglais
│           ├── it.json         # Italien
│           ├── de.json         # Allemand
│           └── es.json         # Espagnol
│
├── docs/
│   ├── RAPPORT.md              # Rapport backend (par Claude)
│   └── rapport_frontend.md     # Rapport frontend (par toi — à maintenir)
│
├── GEMINI.md                   # Tes instructions générales
├── gemini_context.md           # CE FICHIER
├── gemini_session.md           # Ton journal de session
├── CLAUDE.md                   # Instructions Claude (lecture seule)
├── claude_context.md           # Contexte Claude = SOURCE DE VÉRITÉ
├── claude_session.md           # Journal Claude (lecture seule)
├── todo_gemini.md              # Tâches que Claude te délègue (PRIORITÉ)
└── todo_claude.md              # Tâches que tu délègues à Claude
```

---

## 5. Design System — Source de Vérité

### Variables CSS (définies dans `frontend/src/index.css`)

```css
/* Fonds */
--color-bg:              #0a0a0a;   /* fond principal */
--color-bg-secondary:    #111111;   /* fond secondaire */
--color-card:            #1a1a1a;   /* cartes, modales */

/* Accent */
--color-primary:         #e4405f;   /* rose/rouge — couleur principale */
--color-primary-hover:   #c73652;

/* Texte */
--color-text:            #ffffff;
--color-text-secondary:  #888888;

/* Bordures */
--color-border:          #2a2a2a;

/* Statuts */
--color-success:         #00c875;
--color-error:           #ff4444;
```

### Typographie
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
/* Tailles : 12px (xs) / 14px (sm) / 16px (base) / 18px (md) / 24px (lg) / 32px (xl) */
```

### Formes et espacements
```css
border-radius: 8px;    /* inputs, badges */
border-radius: 12px;   /* cartes */
border-radius: 20px;   /* boutons */
border-radius: 50%;    /* avatars */

transition: all 0.2s ease;   /* hover rapide */
transition: all 0.3s ease;   /* animations */
```

### CSS mobile-first — TOUJOURS
```css
.classe { /* mobile par défaut */ }
@media (min-width: 768px)  { /* tablette */ }
@media (min-width: 1024px) { /* desktop  */ }
```

### Effets modernes autorisés
```css
/* Glassmorphism */
backdrop-filter: blur(20px);
background: rgba(26, 26, 26, 0.85);
border: 1px solid rgba(255, 255, 255, 0.08);

/* Gradients accent */
background: linear-gradient(135deg, #e4405f, #c73652);
background: linear-gradient(135deg, #e4405f, #8b5cf6);

/* Lueurs */
box-shadow: 0 0 20px rgba(228, 64, 95, 0.3);
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);

/* Hover lift */
transform: translateY(-2px);
transition: transform 0.2s ease;
```

---

## 6. Conventions de Code Frontend

### Règles absolues React

```jsx
// 1. Composants fonctionnels UNIQUEMENT — jamais de class components
const MonComposant = () => {
  // 2. TOUT texte visible passe par useTranslation
  const { t } = useTranslation();

  // 3. Animations avec Framer Motion
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1>{t('section.cle')}</h1>   {/* ✅ */}
      <h1>Titre en dur</h1>          {/* ❌ INTERDIT */}
    </motion.div>
  );
};

export default MonComposant;
```

### Appels API avec Axios
```javascript
const API = process.env.REACT_APP_API_URL || 'https://globostream.onrender.com';
const token = localStorage.getItem('token');

// GET
const res = await axios.get(`${API}/api/users/me`, {
  headers: { Authorization: `Bearer ${token}` }
});

// POST
const res = await axios.post(`${API}/api/swipe`, data, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Conventions de nommage
- **camelCase** : variables, fonctions, hooks
- **PascalCase** : composants React, noms de fichiers composants
- **kebab-case** : classes CSS
- **Commentaires en français** uniquement
- **Pas de console.log** dans le code final

### Ce qu'il ne faut JAMAIS faire
```
❌ Supprimer ou renommer des props existantes
❌ Supprimer ou renommer des classes CSS existantes
❌ Supprimer ou modifier des clés i18n existantes
❌ Modifier la logique métier Socket.IO / WebRTC
❌ Modifier AuthContext.js (logique auth)
❌ Hardcoder du texte — toujours t('clé')
❌ Supprimer des imports existants
❌ Utiliser des class components
❌ Modifier directement du code backend
```

---

## 7. Internationalisation (i18n) — Ton Domaine Complet

Tu es **responsable de toutes les traductions** du projet, frontend et signalement backend.

### Structure des fichiers
```
frontend/src/locales/
├── fr.json    # ~665 clés — LANGUE SOURCE (toujours commencer ici)
├── en.json    # Anglais
├── it.json    # Italien
├── de.json    # Allemand
└── es.json    # Espagnol
```

### Règles traductions
```json
{
  "sectionExistante": {
    "cleExistante": "Ne jamais modifier",
    "nouvelleCle": "Nouvelle valeur",
    "cleAvecVariable": "Bonjour {{name}} !"
  }
}
```

- **Langue source** : toujours FR en premier
- **Clés en camelCase**, sections en camelCase
- **Ne jamais supprimer** une clé existante sans vérifier tous les fichiers JSX qui l'utilisent
- **Toujours générer** les 5 langues en une seule fois
- **Interpolations** : `{{variable}}` pour les valeurs dynamiques
- **Sections existantes** : auth, profile, swipe, matches, chat, settings, stream, live, moderation, navigation, common, liveStream, liveViewer, liveSurprise, streamHub, accessibility

### Usage dans les composants
```javascript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
// Utilisation
t('section.cle')
t('section.cleAvecVariable', { name: 'Gaetan' })
// Changement de langue
import i18n from '../i18n';
i18n.changeLanguage('en');
```

### Zones sensibles i18n
- **~665 clés existantes** dans fr.json — ne pas en supprimer
- **Cohérence entre les 5 fichiers** — toujours vérifier que toutes les clés existent dans les 5 langues
- **Clés manquantes** → affichage de la clé brute dans l'UI (bug visible)

---

## 8. API Backend — Ce que tu Dois Connaître

Tu n'écris pas ces routes, mais tu les appelles. Référence rapide :

### Routes disponibles
```
POST   /api/auth/register          Inscription (pas de JWT requis)
POST   /api/auth/login             Connexion (pas de JWT requis)
GET    /api/users/me               Profil utilisateur connecté
PUT    /api/users/me               Modifier profil
GET    /api/users/:id              Profil public
GET    /api/swipe/candidates       Candidats à swiper
POST   /api/swipe                  Swiper un profil
GET    /api/matches                Liste des matchs
GET    /api/chat/:matchId          Messages d'un match
POST   /api/chat/:matchId          Envoyer un message
GET    /api/message-requests       Demandes de messages
POST   /api/message-requests       Envoyer une demande
GET    /api/stream                 Streams actifs
POST   /api/stream                 Créer un stream
GET    /api/live                   Lives publics actifs
GET    /api/moderation/*           Panel modération (Admin+)
```

### Events Socket.IO côté client
```javascript
// Chat privé
socket.emit('join-room', { matchId })
socket.emit('send-message', { matchId, content })
socket.emit('typing', { matchId })
socket.on('new-message', handler)

// Live rooms
socket.emit('create-live-room', { roomId, type })
socket.emit('join-live-room', { roomId })
socket.emit('live-signal', { roomId, signal })
socket.emit('live-chat', { roomId, message })
socket.on('live-signal', handler)
socket.on('live-chat', handler)
```

⚠️ **Ne jamais changer les noms d'events** sans synchroniser avec Claude (backend).

---

## 9. Workflow Git

### Branches
- **`main`** : stable et propre — ne jamais travailler directement dessus
- **`claude-work`** : branche de développement active — tout ton travail ici

### Workflow standard
```bash
# Toujours sur claude-work
git checkout claude-work

# Committer régulièrement
git add .
git commit -m "feat(frontend): description concise

- Détail 1
- Détail 2

Co-Authored-By: Gemini 2.5 Flash <noreply@google.com>"

# Synchroniser main quand stable
git checkout main
git merge claude-work --no-edit
git push origin main
git push origin claude-work
```

### Interdictions Git
```
🚫 Créer une nouvelle branche sans autorisation
🚫 Travailler directement sur main
🚫 git push --force sur main
🚫 git reset --hard
🚫 Réécrire l'historique (rebase -i, commit --amend sur commits pushés)
```

**En cas de doute : STOP — expliquer et demander confirmation.**

---

## 10. Système de Délégation

### Quand écrire dans todo_claude.md

Délègue à Claude dès que tu dois **modifier** du code backend :

```markdown
### TACHE-XXX — [TITRE COURT]
- **Statut**   : EN ATTENTE
- **Ajoutée**  : JJ/MM/AAAA par Gemini
- **Priorité** : HAUTE | NORMALE | BASSE
- **Fichiers concernés** : chemin/fichier.js
- **Description** : Ce dont tu as besoin
- **Contexte** : Pourquoi tu délègues
- **Résultat** : (à remplir par Claude)
```

Signale ensuite à l'utilisateur : *"J'ai ajouté la tâche XXX dans todo_claude.md pour Claude."*

### Quand traiter todo_gemini.md

À chaque démarrage, lire `todo_gemini.md` en priorité.
Si des tâches sont EN ATTENTE : les traiter avant toute autre demande.

### Exemples concrets

```
Tu dois ajouter une clé i18n → tu le fais directement          ✅
Tu dois créer un composant React → tu le fais directement      ✅
Tu vois un bug dans une route Express → todo_claude.md         ✅
Tu dois modifier User.js (modèle) → todo_claude.md             ✅
Tu dois ajouter un event Socket.IO → todo_claude.md            ✅
```

---

## 11. Rapport Frontend

Tu es responsable de `docs/rapport_frontend.md`.
Mets-le à jour après chaque session avec :
- Les composants et pages testés visuellement
- Les bugs détectés et corrigés
- L'état du responsive (mobile / tablette / desktop)
- L'état des traductions (clés manquantes, incohérences)

---

## 12. État Actuel du Projet (Février 2026)

| Métrique | Valeur |
|----------|--------|
| Fonctionnalités codées | 90+ |
| Tests Jest backend | 210 (100% passent) |
| Pages frontend | 17+ |
| Pages frontend testées | 15/15 ✅ |
| Responsive | 3 tailles ✅ mobile-first |
| i18n | 29/29 fichiers ✅ — ~700 clés |
| Photos | Cloudinary (persistantes) |
| Bugs corrigés | 20+ |

### URLs de déploiement
| Service | URL |
|---------|-----|
| **Frontend** | https://khetalan.github.io/GloboStream/ |
| **Backend** | https://globostream.onrender.com |
| **Repo** | https://github.com/Khetalan/GloboStream |

### Prochaines priorités frontend
1. Tester visuellement LiveCompetition et LiveEvent
2. Vérifier cohérence i18n entre les 5 fichiers de langue
3. Améliorer le design des pages live (proposer des directions)
4. Déployer les derniers changements sur GitHub Pages

---

## 13. Commandes

```bash
# Frontend (ton domaine)
cd frontend
npm install
npm start                     # dev port 3000
npm run build                 # build production
npx gh-pages -d build         # déployer sur GitHub Pages

# Vérifier une traduction manquante
grep -r "t('" frontend/src/pages/MaPage.js   # trouver les clés utilisées

# Backend (pour référence — ne pas modifier)
cd backend
npm run dev                   # nodemon server.js (port 5000)
npm test                      # Jest
```

---

## ⚠️ RAPPEL FINAL

**Ce fichier est ta référence frontend.**
**`claude_context.md` reste la SOURCE DE VÉRITÉ globale du projet.**

Gemini doit TOUJOURS :
1. ✅ Lire `gemini_context.md` + `claude_context.md` avant toute action
2. ✅ Lire `todo_gemini.md` en priorité — traiter les tâches EN ATTENTE
3. ✅ Modifier uniquement le frontend
4. ✅ Déléguer toute modification backend à Claude via `todo_claude.md`
5. ✅ Mettre à jour `gemini_session.md` en fin de session
6. ✅ Respecter le workflow Git (claude-work uniquement)
7. ✅ Ne modifier que ce qui est explicitement demandé
8. ✅ Demander confirmation pour toute action risquée

---

**Version** : 1.0
**Créé** : 24 Février 2026
**Basé sur** : claude_context.md v1.2
**Statut** : MVP déployé — Frontend en modernisation
