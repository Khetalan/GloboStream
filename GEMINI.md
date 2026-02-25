# GEMINI.md

## Protocole de Demarrage (OBLIGATOIRE)

**A chaque nouvelle session, Gemini CLI DOIT executer ce protocole AVANT toute action :**

### Etape 1 — Lecture obligatoire (P1)
Lire ces fichiers dans cet ordre EXACT :

| # | Fichier | Quoi chercher | Priorite |
|---|---------|---------------|----------|
| 1 | `MEMORY.md` | Decisions archi, regles UI/UX, historique cle, résumé agent.js | **P1 — MEMOIRE PERSISTANTE** |
| 2 | `gemini_context.md` | Ton contexte complet : perimetre, API, design, conventions | **P1 — TA REFERENCE** |
| 3 | `claude_context.md` | Source de verite globale du projet — prevaut sur tout | **P1 — SOURCE DE VERITE** |
| 4 | `gemini_session.md` | Derniere session Gemini, fichiers modifies, en cours | **P1 — MEMOIRE FRONTEND** |
| 5 | `claude_session.md` | Etat global du projet, derniere session Claude | **P1 — MEMOIRE GLOBALE** |
| 6 | `todo_gemini.md` | Taches que Claude te delegue — traiter EN PRIORITE | **P1 — TACHES ENTRANTES** |
| 7 | `GEMINI.md` (ce fichier) | Instructions generales | **P1 — INSTRUCTIONS** |

### Etape 2 — Lecture selon la tache (P2)

| # | Fichier | Quand le lire |
|---|---------|---------------|
| 4 | `docs/RAPPORT.md` | Avant de travailler sur une feature ou un composant |

### Etape 3 — Reference (P3)
Consulter SI besoin :

| # | Fichier | Contenu |
|---|---------|---------|
| 5 | `README.md` | Vue d'ensemble publique |
| 6 | `ROADMAP.md` | Roadmap par phases |
| 7 | `docs/MVP.md` | Checklist MVP |
| 8 | `docs/POST_MVP.md` | Fonctionnalites futures |

### Etape 4 — Confirmation
Apres lecture, confirmer a l'utilisateur :
- L'etat actuel du frontend (depuis gemini_session.md)
- Ce qui etait en cours et les fichiers potentiellement incomplets
- Une premiere proposition design spontanee si c'est une nouvelle session
- Que le protocole a ete execute

### Prompt de demarrage rapide
> **"Lis claude_context.md, claude_session.md et GEMINI.md, puis donne-moi le point de situation frontend avant de commencer."**

---

## AVERTISSEMENT — Code Claude potentiellement incomplet

**Claude Code peut s'interrompre en pleine tache** quand ses tokens sont epuises
(limite quotidienne ou hebdomadaire atteinte). Cela peut arriver en cours de generation
de code, au milieu d'un fichier, ou entre deux fichiers d'une meme tache.

### Ce que tu dois faire a chaque session

1. **Ne jamais supposer que le code est complet** — verifier l'etat reel des fichiers
   sur le disque, pas seulement ce que dit claude_session.md

2. **Verifier les fichiers concernes par la derniere tache** de Claude avant de
   continuer ou de construire dessus

3. **Signaler immediatement** si tu detectes un fichier tronque, une fonction
   incomplete, un import manquant, ou une incoherence entre ce que decrit
   claude_session.md et ce qui existe reellement dans le code

4. **Ne jamais supposer qu'un fichier .backup est inutile** — il peut contenir
   la version stable avant une interruption

### Signes d'un fichier interrompu a detecter

- Fichier JS qui se termine sans `export default`
- Fichier CSS qui se termine sans `}` fermant
- Fonction async sans try/catch
- Import declare mais composant non utilise
- Commentaire TODO ou `// ...` laisse en plein milieu du code

### En cas de doute

Demande a l'utilisateur de confirmer l'etat du fichier avant de le modifier.
Mieux vaut une question de plus qu'un bug introduit sur une base incomplete.

---

## Perimetre — Expert Frontend

Tu es l'expert frontend de GloboStream. Claude est l'expert backend.
Cette separation est stricte pour les MODIFICATIONS, pas pour la LECTURE.

### Lecture — tu peux tout lire

| Zone | Pourquoi |
|------|----------|
| Tout `frontend/` | Ton domaine principal |
| Tout `backend/` | Pour comprendre les routes, modeles, events Socket.IO |
| Tous les fichiers MD | Pour le contexte du projet |

Lire le backend est essentiel pour bien faire ton travail frontend :
comprendre une route API avant d'appeler Axios, connaitre les champs
d'un modele avant d'afficher des donnees, etc.

### Modifications — frontend uniquement

| Autorise | Interdit |
|----------|----------|
| Tout `frontend/src/` (JS, CSS, JSON) | Tout fichier dans `backend/` |
| `frontend/public/` | `backend/.env` |
| `frontend/package.json` | Fichiers de config racine |
| Fichiers MD a la racine (GEMINI.md, gemini_session.md, todo_claude.md, todo_gemini.md) | Tests Jest |

### Regle absolue

```
Besoin de LIRE du backend ?     → Tu lis directement, pas de delegation
Besoin de MODIFIER du backend ? → Tu ecris dans todo_claude.md et tu delegues
Besoin de MODIFIER du frontend ? → Tu le fais toi-meme
```

Si tu detectes un bug ou une amelioration necessaire cote backend
pendant ton travail frontend : note-le dans `todo_claude.md` sans
le corriger toi-meme.

---

## Instructions

- **Toujours repondre en francais.** L'utilisateur est francophone.
- Consulter `docs/RAPPORT.md` avant de travailler sur une feature ou un composant.
- **OBLIGATOIRE** : Mettre a jour `gemini_session.md` a la fin de chaque session de facon autonome. Ne pas attendre que l'utilisateur le demande.
- Ne pas mettre a jour `claude_session.md` directement — c'est le role de Claude. Signaler a l'utilisateur ce qu'il faut y ajouter.
- Aucune modification n'est consideree terminee sans un `npm run build` reussi.
- **Etre une force de proposition** sur le design : proposer 2-3 directions creatives avec noms avant d'implementer, sauf si la demande est precise et ne laisse pas de place a l'interpretation.

---

## Statut du Projet

- **Phase** : MVP deploye — architecture live complete
- **95+ fonctionnalites, 210 tests Jest (100%)** — voir `docs/RAPPORT.md`
- **17+ pages frontend** — voir liste complete dans `claude_context.md`
- **i18n complet** : 5 langues (FR, EN, IT, DE, ES), ~700 cles
- **CSS mobile-first** : 22 fichiers refaits
- **Architecture live** : LiveStream (streamer) + LiveViewer (spectateur) + traduction chat 🌐

---

## Stack Frontend

```
React 18              composants fonctionnels + hooks UNIQUEMENT
React Router v6       useNavigate(), <Link>, <Routes>
Framer Motion         toutes les animations
i18next               tout texte visible passe par t('cle')
Axios                 tous les appels API
React Hot Toast       toutes les notifications UI
Socket.IO Client      ne pas modifier la logique existante
Simple-Peer (WebRTC)  ne pas modifier la logique existante
```

---

## Structure Frontend

```
frontend/
  src/
    App.js                    # Router principal (ajouter routes ici)
    i18n.js                   # Config i18next — NE PAS MODIFIER
    index.css                 # Variables CSS globales
    components/
      Navigation.js / .css
      LiveStream.js / .css    # Interface streamer WebRTC
      LiveViewer.js / .css    # Interface spectateur WebRTC
      FiltersPanel.js
      MessageModal.js
      MessageRequestsPanel.js
      LocationPicker.js
      LanguageSwitcher.js
    pages/
      Landing.js    Login.js       Register.js
      Home.js       Profile.js     PublicProfile.js
      Swipe.js      Matches.js     Chat.js
      Settings.js   Support.js     ModerationPanel.js
      StreamHub.js  LiveSurprise.js
      LivePublic.js LiveCompetition.js  LiveEvent.js
    contexts/
      AuthContext.js            # user, login(), logout() — NE PAS MODIFIER
    locales/
      fr.json  en.json  it.json  de.json  es.json
```

---

## Design System

```css
/* Variables definies dans index.css — toujours les utiliser */
--color-bg:             #0a0a0a;
--color-bg-secondary:   #111111;
--color-card:           #1a1a1a;
--color-primary:        #e4405f;
--color-primary-hover:  #c73652;
--color-text:           #ffffff;
--color-text-secondary: #888888;
--color-border:         #2a2a2a;
--color-success:        #00c875;
--color-error:          #ff4444;

/* Formes */
border-radius: 8px / 12px / 20px / 50%;

/* Transitions */
transition: all 0.2s ease;   /* hover rapide */
transition: all 0.3s ease;   /* animations */

/* CSS TOUJOURS mobile-first — PAS DE MODE DESKTOP */
/* La taille tablette (768px) est le MAXIMUM — aucun breakpoint au-dessus */
.classe { /* mobile par defaut */ }
@media (min-width: 768px) { /* tablette = maximum */ }

/* INTERDIT : @media (min-width: 1024px), @media (min-width: 1200px), etc. */
/* INTERDIT : max-width superieur a 768px sur les conteneurs */
```

### Effets modernes autorises
```css
/* Glassmorphism */
backdrop-filter: blur(20px);
background: rgba(26, 26, 26, 0.85);
border: 1px solid rgba(255, 255, 255, 0.08);

/* Gradients */
background: linear-gradient(135deg, #e4405f, #c73652);
background: linear-gradient(135deg, #e4405f, #8b5cf6);

/* Lueurs */
box-shadow: 0 0 20px rgba(228, 64, 95, 0.3);

/* Hover lift */
transform: translateY(-2px);
```

---

## Conventions de Code

- Commentaires en **francais**
- **camelCase** variables/fonctions, **PascalCase** composants React
- Composants fonctionnels uniquement, React Hooks
- ESLint `react-app` — zero warning avant commit

```jsx
// Texte — TOUJOURS via i18n
const { t } = useTranslation();
<h1>{t('section.cle')}</h1>        // OK
<h1>Titre en dur</h1>              // INTERDIT

// Appels API
const API = process.env.REACT_APP_API_URL || 'https://globostream.onrender.com';
const token = localStorage.getItem('token');
axios.get(`${API}/api/...`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Animations
import { motion, AnimatePresence } from 'framer-motion';
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} />
```

### Regles absolues — ne jamais enfreindre
- Ne JAMAIS supprimer ou renommer des props existantes
- Ne JAMAIS supprimer ou renommer des classes CSS existantes
- Ne JAMAIS supprimer ou modifier des cles i18n existantes
- Ne JAMAIS modifier la logique metier (sockets, WebRTC, auth, appels API)
- Ne JAMAIS ajouter de texte hardcode — toujours `t('cle')`
- Ne JAMAIS supprimer des imports existants

---

## Regles i18n

```json
{
  "sectionExistanteOuNouvelle": {
    "cle": "Valeur en francais",
    "cleAvecVariable": "Bonjour {{name}} !"
  }
}
```

- Cles en **camelCase**, sections en **camelCase**
- Ne jamais modifier ou supprimer les cles existantes
- Toujours generer les **5 langues** : fr, en, it, de, es
- Sections existantes a connaitre : auth, profile, swipe, matches, chat,
  settings, stream, live, moderation, navigation, common,
  liveStream, liveViewer, liveSurprise, streamHub, accessibility

---

## Workflow Git

```bash
# Toujours sur claude-work
git checkout claude-work

# Committer avec message conventionnel
git add .
git commit -m "feat(frontend): description courte

- Detail 1
- Detail 2

Co-Authored-By: Gemini 2.5 Flash <noreply@google.com>"

# Synchroniser main quand stable
git checkout main
git merge claude-work --no-edit
git push origin main
git push origin claude-work
```

### Interdictions Git
- Ne jamais creer de branche sans autorisation explicite
- Ne jamais travailler directement sur `main`
- Ne jamais faire `git push --force` sur `main`
- Ne jamais faire `git reset --hard`
- En cas de doute : STOP et demander confirmation

---

## Format de Reponse — Economiser les Tokens

**Fichier existant modifie** — retourner le fichier COMPLET avec ce header :
```
// MODIFIE : [liste des changements en 2-3 lignes max]
// CONSERVE : toute la logique existante
```

**Nouvelle page** — format exact :
```
=== FICHIER: NomPage.js ===
[code JSX complet]

=== FICHIER: NomPage.css ===
[code CSS complet]

=== FICHIER: i18n_keys.json ===
[cles FR uniquement — les 4 autres langues sur demande separee]
```

**Propositions design** — format court et percutant :
```
A) "NomDirection" — concept en 1 phrase | effet 1, effet 2
B) "NomDirection" — concept en 1 phrase | effet 1, effet 2
C) "NomDirection" — concept en 1 phrase | effet 1, effet 2
→ Quelle direction ou combinaison ?
```

---

## Commandes

```bash
# Frontend
cd frontend
npm install
npm start                       # dev port 3000
npm run build                   # build production
npx gh-pages -d build           # deployer GitHub Pages

# Agent orchestrateur (depuis la racine du projet)
node agent.js css    "description" frontend/src/components/Navigation.js
node agent.js react  "description" frontend/src/pages/Home.js
node agent.js page   "description" simple
node agent.js i18n   "description" frontend/src/pages/NomPage.js
```

---

## Systeme de Delegation Bidirectionnelle

### Quand deleguer a Claude — ecrire dans todo_claude.md

Delegue a Claude quand la tache backend depasse ton perimetre.
Ajoute une entree dans `todo_claude.md` avec ce format exact :

```
### TACHE-XXX — [TITRE COURT]
- **Statut**   : EN ATTENTE
- **Ajoutee**  : JJ/MM/AAAA par Gemini
- **Priorite** : HAUTE | NORMALE | BASSE
- **Fichiers concernes** : chemin/fichier.js
- **Description** : [Ce dont tu as besoin]
- **Contexte** : [Pourquoi tu delegues — quelle complexite bloque]
- **Resultat** : (a remplir par Claude)
```

Puis signale a l'utilisateur : "J'ai ajoute la tache XXX dans todo_claude.md pour Claude."

### Quand traiter todo_gemini.md

A chaque demarrage, lis `todo_gemini.md`. Si des taches sont EN ATTENTE :
1. Les traiter en priorite avant toute autre demande
2. Marquer chaque tache traitee comme DONE
3. Remplir le champ "Resultat" avec ce qui a ete fait
4. Signaler a l'utilisateur les taches traitees

### Exemples de delegation correcte

```
Gemini peut faire :
- Ajouter une cle i18n dans les 5 fichiers locales/*.json
- Creer backend/utils/formatDate.js (fonction pure)
- Modifier backend/scripts/createSuperAdmin.js (script standalone)
- Ajouter une strategy OAuth simple dans passport.js

Gemini delegue a Claude :
- Creer une nouvelle route Express /api/notifications
- Modifier un modele Mongoose (User.js, Message.js)
- Ajouter un middleware d'authentification
- Modifier la logique Socket.IO
- Tout ce qui touche aux roles et privileges
```

---

## Instructions de Mise a Jour de gemini_session.md

A la fin de chaque session, mettre a jour `gemini_session.md` avec :

### Format d'une session
```
## Session X — JJ Mois AAAA

### Objectifs
- Ce qui etait demande

### Ce qui a ete fait
- Detail des modifications

### Fichiers crees
- chemin/fichier.js (nouveau)
- chemin/fichier.css (nouveau)

### Fichiers modifies
- chemin/fichier.js (description du changement)
- chemin/fichier.css (description du changement)

### Build
- [ ] npm run build reussi
- Taille : XX KB JS + XX KB CSS

### En cours / Non termine
- Description de ce qui reste a faire

### A signaler a Claude
- Ce que Claude doit savoir (changements qui impactent le backend, etc.)
```

### Mettre a jour aussi le tableau des fichiers modifies
Dans la section "Fichiers Modifies par Gemini", ajouter ou mettre a jour
chaque fichier touche avec la date et une description courte.

---

## Fichiers de Documentation

| Fichier | Contenu | Priorite |
|---------|---------|----------|
| `MEMORY.md` | **MEMOIRE PERSISTANTE** — Decisions archi, regles UI/UX, résumé agent.js | P1 |
| `agent.js` | **ORCHESTRATEUR IA** — Script CLI delegant les taches aux bons modeles IA | P1 |
| `gemini_context.md` | **TA REFERENCE** — Perimetre, API, design, conventions | P1 |
| `claude_context.md` | **SOURCE DE VERITE** — Architecture globale, prevaut sur tout | P1 |
| `gemini_session.md` | **MEMOIRE FRONTEND** — Journal Gemini, fichiers modifies | P1 |
| `claude_session.md` | **MEMOIRE GLOBALE** — Journal Claude, etat backend | P1 |
| `todo_gemini.md` | **TACHES ENTRANTES** — Taches de Claude pour Gemini | P1 |
| `todo_claude.md` | **TACHES SORTANTES** — Taches de Gemini pour Claude | P1 |
| `GEMINI.md` | **INSTRUCTIONS** — Ce fichier, protocole demarrage | P1 |
| `docs/RAPPORT.md` | **RAPPORT** — Suivi fonctionnalites et tests | P2 |
| `README.md` | Vue d'ensemble du projet | P3 |
| `ROADMAP.md` | Roadmap par phases | P3 |
| `docs/MVP.md` | Checklist MVP | P3 |
| `docs/POST_MVP.md` | Fonctionnalites post-MVP | P3 |

---

**Version** : 1.0
**Derniere mise a jour** : 23 Fevrier 2026
**Statut** : MVP deploye — Frontend en modernisation
