# MEMORY.md — Mémoire Persistante des Agents IA

> Ce fichier doit être lu en **PRIORITÉ ABSOLUE** au démarrage de chaque session,
> par Claude Code ET par Gemini CLI, avant toute autre action.
> Il contient les apprentissages clés, conventions et décisions architecturales
> qui ne sont pas dans les autres fichiers.

---

## agent.js — Orchestrateur IA du projet

**Emplacement** : `GloboStream/agent.js` (racine du projet)

**Nature** : Script Node.js CLI (`node agent.js <commande>`) qui délègue les tâches
au bon modèle IA selon la nature de la tâche.

**Modèles utilisés** :
| Modèle | ID | Cas d'usage |
|--------|-----|-------------|
| Claude Haiku | `claude-haiku-4-5-20251001` | Lecture / résumé / mise à jour de fichiers MD |
| Claude Sonnet | `claude-sonnet-4-6` | Code backend courant (routes, middleware, utils) |
| Claude Opus | `claude-opus-4-6` | Code complexe (WebRTC, architecture, refactor) |
| Gemini 2.5 Flash | `gemini-2.5-flash` | CSS, composants React simples, i18n, nouvelles pages |
| Gemini 2.5 Flash-Lite | `gemini-2.5-flash-lite` | Tâches simples et répétitives |

**Commandes disponibles** :
```bash
# Fichiers MD (Haiku)
node agent.js read   <fichier.md>
node agent.js update <fichier.md> "<instructions>"
node agent.js session "<description de session>"

# Backend (Sonnet/Opus)
node agent.js code "<tâche>" [simple|complex] [fichier-contexte.md]

# Frontend (Gemini Flash)
node agent.js css   "<description>" [fichier.js|css]
node agent.js react "<description>" [fichier.js]
node agent.js page  "<description>" [simple|complex]
node agent.js i18n  "<description>" [fichier.js]

node agent.js list   # liste les fichiers MD gérés
```

**Limites Gemini free tier** :
- `gemini-2.5-flash` : 10 req/min, 250 req/jour
- `gemini-2.5-flash-lite` : 15 req/min, 1000 req/jour
- En cas d'erreur 429 : quota atteint, réessayer le lendemain

**Config requise** : `backend/.env` doit contenir `ANTHROPIC_API_KEY` et `GOOGLE_GEMINI_API_KEY`.

---

## Règles UI/UX — Décisions Architecture Frontend

### Layout : Tablette = Maximum (ajouté 25/02/2026)

**RÈGLE ABSOLUE** : Il n'existe pas de mode desktop sur GloboStream.
- La taille tablette (768px) est le **maximum** de toutes les mises en page
- Tous les `max-width` de conteneurs sont limités à **768px**
- Les seuls breakpoints valides sont : base mobile + `@media (min-width: 768px)`
- **Interdits** : `@media (min-width: 1024px)`, `@media (min-width: 1200px)`, `@media (min-width: 1280px)`, etc.
- Le zoom / pinch-to-zoom est **désactivé** (`user-scalable=no`)

### Mobile-First obligatoire
- Styles base = mobile (375px+)
- Un seul breakpoint responsive : `@media (min-width: 768px)` pour tablette/desktop

---

## Historique des Décisions Importantes

| Date | Décision | Raison |
|------|----------|--------|
| 25/02/2026 | Max layout = 768px, no desktop | Site déjà responsive, pas besoin d'un mode desktop |
| 25/02/2026 | Zoom désactivé | Site mobile-first, responsive sur toutes tailles |
| 26/02/2026 | WebRTC : trickle=true, STUN Google | trickle:false causait des connexions lentes/échouées |
| 26/02/2026 | FAB bouton "Start Live" en bas | Bannière haute trop encombrante sur mobile |
| 26/02/2026 | Grille cartes 2col mobile / 3col tablette | Cartes trop grandes en 1 colonne |
| 26/02/2026 | favoriteStreamers[] sur User | Système de favoris streamers persistant |

---

## Fichiers Critiques à Connaître

| Fichier | Rôle |
|---------|------|
| `MEMORY.md` | **CE FICHIER** — mémoire persistante, lire en P1 |
| `agent.js` | Script orchestrateur IA — lire pour comprendre les outils disponibles |
| `CLAUDE.md` | Instructions Claude — protocole démarrage |
| `GEMINI.md` | Instructions Gemini — protocole démarrage |
| `claude_context.md` | Source de vérité architecture |
| `claude_session.md` | Journal de session Claude |
| `gemini_session.md` | Journal de session Gemini |
| `todo_claude.md` | Tâches pour Claude (venant de Gemini) |
| `todo_gemini.md` | Tâches pour Gemini (venant de Claude) |

---

**Créé** : 25/02/2026
**Maintenu par** : Claude Code + Gemini CLI (les deux agents doivent le mettre à jour)
