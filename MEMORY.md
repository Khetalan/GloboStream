# MEMORY.md — Mémoire Persistante de Claude Code

> Ce fichier doit être lu en **PRIORITÉ ABSOLUE** au démarrage de chaque session.
> Il contient les apprentissages clés, conventions et décisions architecturales
> qui ne sont pas dans les autres fichiers.
>
> ⚠️ Gemini CLI a été retiré du projet le **26/02/2026**. Claude = unique agent IA.

---

## agent.js — Orchestrateur IA du projet (v3.0 — Claude-only)

**Emplacement** : `GloboStream/agent.js` (racine du projet)

**Nature** : Script Node.js CLI (`node agent.js <commande>`) qui délègue les tâches
au bon modèle Claude selon la nature de la tâche.

**Modèles utilisés** :
| Modèle | ID | Cas d'usage |
|--------|-----|-------------|
| Claude Haiku | `claude-haiku-4-5-20251001` | Lecture / résumé / mise à jour de fichiers MD, i18n |
| Claude Sonnet | `claude-sonnet-4-6` | Code backend courant, CSS, React simple |
| Claude Opus | `claude-opus-4-6` | Code complexe (WebRTC, architecture, refactor, pages multi-fichiers) |

**Commandes disponibles** :
```bash
# Fichiers MD (Haiku)
node agent.js read   <fichier.md>
node agent.js update <fichier.md> "<instructions>"
node agent.js session "<description de session>"

# Backend (Sonnet/Opus)
node agent.js code "<tâche>" [simple|complex] [fichier-contexte.md]

# Frontend (Sonnet/Opus)
node agent.js css   "<description>" [fichier.js|css]
node agent.js react "<description>" [complex] [fichier.js]
node agent.js page  "<description>" [simple|complex]
node agent.js i18n  "<description>" [fichier.js]

node agent.js list   # liste les fichiers MD gérés
```

**Config requise** : `backend/.env` doit contenir `ANTHROPIC_API_KEY`.

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
| 26/02/2026 | Gemini retiré — Claude agent unique | Gemini free tier trop limité, Claude couvre backend+frontend |
| 02/03/2026 | profileComplete=false pour OAuth (Phase 5) | Empêche bypass vérification âge via OAuth |
| 02/03/2026 | Webhook Stripe : raw body AVANT express.json() | Stripe exige body non parsé pour vérifier la signature |
| 02/03/2026 | Wallet : MongoDB $inc atomique | Évite race conditions sur les balances pièces/globos |
| 02/03/2026 | GiftCatalog en DB (soft delete isActive) | Catalogue administrable sans redéploiement |
| 02/03/2026 | Transaction model — audit log complet | Traçabilité obligatoire pour toute opération monétaire |

---

## Fichiers Critiques à Connaître

| Fichier | Rôle |
|---------|------|
| `MEMORY.md` | **CE FICHIER** — mémoire persistante, lire en P1 |
| `agent.js` | Script orchestrateur IA — lire pour comprendre les outils disponibles |
| `CLAUDE.md` | Instructions Claude — protocole démarrage |
| `claude_context.md` | Source de vérité architecture |
| `claude_session.md` | Journal de session Claude |
| `todo_claude.md` | Tâches pour Claude |
| `docs/RAPPORT.md` | Rapport complet — 148+ fonctionnalités |
| `Administratif/env_variables_checklist.md` | Checklist variables .env à configurer |

---

**Créé** : 25/02/2026
**Maintenu par** : Claude Code (agent unique depuis 26/02/2026)
