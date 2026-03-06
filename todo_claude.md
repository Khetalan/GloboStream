# TODO — Tâches Claude (GloboStream)

> Ce fichier trace l'historique complet des tâches traitées par Claude.
> Ajouter les nouvelles tâches dans **En attente** en début de session, dans l'ordre d'exécution souhaité.
> Chaque tâche est rattachée à sa session pour retrouver le contexte dans `claude_session.md`.

---

## En attente


---

## Terminées (session en cours)

#### TÂCHE-072 — Phase 5 : Fix OAuth bypass âge + redirect HashRouter
- **Statut** : DONE — Session 31 | **Modèle** : Sonnet | **Difficulté** : Moyenne
- **Fichiers** : `backend/models/User.js` (profileComplete), `backend/config/passport.js` (suppression birthDate hardcodée), `backend/routes/auth.js` (redirect /#/), `backend/routes/users.js` (complete-profile), `frontend/src/pages/OAuthCallback.js` (nouveau), `frontend/src/pages/CompleteProfile.js` (nouveau), `frontend/src/App.js`, 5 locales
- **Résultat** : OAuth ne bypass plus l'âge. Nouveau flux : OAuth → OAuthCallback → CompleteProfile (si nouveau) → Home.

#### TÂCHE-053 — Phase 6 : Monétisation complète (Pièces / Globos / Stripe)
- **Statut** : DONE — Session 32 | **Modèle** : Sonnet | **Difficulté** : Complexe
- **Fichiers** :
  - `backend/models/GiftCatalog.js` (nouveau), `Transaction.js` (nouveau), `User.js` (wallet)
  - `backend/utils/coinPacks.js` (nouveau)
  - `backend/routes/giftCatalog.js` (nouveau), `wallet.js` (nouveau), `payments.js` (nouveau)
  - `backend/server.js` (webhook raw body + routes)
  - `backend/socketHandlers/liveRoom.js` (send-gift async + wallet)
  - `backend/scripts/seedGifts.js` (nouveau)
  - `frontend/src/components/LiveViewer.js`, `LiveViewer.css`, `LiveStream.js`
  - `frontend/src/pages/WalletPage.js` (nouveau), `WalletPage.css` (nouveau)
  - `frontend/src/pages/ModerationPanel.js`, `ModerationPanel.css`
  - `frontend/src/App.js` (route /wallet)
  - 5 locales (wallet.* + gifts.* + payments.* = 49 clés)
  - `Administratif/env_variables_checklist.md` (nouveau), `backend/.env.example`
- **Résultat** : Système monétaire double (Pièces viewers + Globos streamers). Stripe Checkout intégré. Catalogue DB administrable. 22 pages frontend.
- **Action manuelle requise** : `node backend/scripts/seedGifts.js` + vars `.env` Stripe

#### TÂCHE-051 — Audit Live : Corrections complètes LiveViewer + liveRoom (BUG-1 à BUG-6)
- **Statut** : DONE — Session 30
- **Commit** : `5c33cdd`
- **Modèle** : Sonnet | **Difficulté** : Moyenne
- **Plan** : `Rapport de test/Plan-Live-Verification-01.md`
- **Fichiers** :
  - `backend/socketHandlers/liveRoom.js` — BUG-2 (participants-updated au join initial), BUG-5 (reject-join-request permission + reason)
  - `frontend/src/components/LiveViewer.js` — BUG-1 (panelParticipants + stats panel 2 sections), BUG-3 (liveModerators Set + badges MOD), BUG-4 (kicked-from-room reason)
  - `frontend/src/components/LiveViewer.css` — BUG-6 (.lv-participant-badge + .lv-panel-section-header)
  - `frontend/src/locales/*.json` (5 fichiers) — clé `liveViewer.blockedFromRoom`
- **Résultat** :
  - Viewer/Participant/Mod voient désormais les participants en live dans leur stats panel (section "Participants LIVE" + badges)
  - Mods peuvent Kick/Block les participants depuis leur stats panel
  - Badges MOD visibles sur tous les utilisateurs (via liveModerators Set)
  - Toast différencié : "expulsé" vs "bloqué et expulsé"
  - Permission check sur reject-join-request (streamer seul)
  - CSS .lv-participant-badge (vert) + .lv-panel-section-header alignés sur LiveStream.css

#### TÂCHE-047 — Badge pays activé dans le vrai Live (backend + frontend)
- **Statut** : DONE — Session 29
- **Modèle** : Sonnet | **Difficulté** : Moyenne
- **Fichiers** : `backend/utils/countryFlag.js` (nouveau), `backend/socketHandlers/liveRoom.js`, `frontend/src/components/LiveStream.js`, `frontend/src/components/LiveViewer.js`
- **Résultat** :
  - Utilitaire `countryFlag.js` : 50+ pays (noms FR + EN) → code ISO → emoji drapeau via Regional Indicator Symbols
  - `liveRoom.js` : stockage `countryFlag` dans rooms/viewers/participants à la connexion, inclus dans `live-chat-message`
  - `LiveStream.js` + `LiveViewer.js` : handler `live-chat-message` reçoit et stocke `countryFlag`
  - Commit : `f5846f4`

#### TÂCHE-046 — Correctifs interface Live Viewer (bulle, mobile-first, test page)
- **Statut** : DONE — Session 29
- **Modèle** : Sonnet | **Difficulté** : Facile
- **Fichiers** : `frontend/src/components/LiveViewer.css`, `frontend/src/pages/LiveTestPage.js`
- **Résultat** :
  - `LiveViewer.css` : `.lv-chat-message` → bulle avec fond + border-radius (identique `ls-chat-message` streamer)
  - `LiveViewer.css` : `.lv-chat-message.is-join-event` → fond transparent (pas de bulle sur messages système)
  - `LiveViewer.css` : `.lv-container` → `max-width: 768px; margin: 0 auto` (mobile-first, plus de plein écran desktop)
  - `LiveTestPage.js` : `sendViewerMessage` → `country: msg.country` inclus
  - `LiveTestPage.js` : sidebar viewer → boutons +/- participants + indicateur layout actuel
  - Commit : `dd24a7c`

#### TÂCHE-044 — Refonte Interface Live (AJOUT spec)
- **Statut** : DONE — Sessions 27 + 28
- **Modèle** : Sonnet | **Difficulté** : Complexe
- **Fichiers** : `frontend/src/components/LiveStream.css`, `frontend/src/components/LiveStream.js`, `frontend/src/pages/LiveTestPage.js`, `frontend/src/pages/LiveTestPage.css`
- **Résultat** :
  - Réécriture complète des grilles CSS (layouts 1-8 selon spec AJOUT), suppression layout-9
  - Architecture JSX : `ls-video-zone` + `ls-chat-zone` conditionnelle (`hasDedicatedChat = participants >= 2`)
  - Chat overlay (1-2 participants) vs zone dédiée (3+ participants)
  - Commits : `7846fd8`, `69d287b`, `15b3aef`, `1becf80`, `d7e35aa`

#### TÂCHE-045 — Interface Live : chat inline + badges pays + traduction
- **Statut** : DONE — Session 28
- **Modèle** : Sonnet | **Difficulté** : Moyenne
- **Fichiers** : `frontend/src/components/LiveStream.css`, `frontend/src/components/LiveStream.js`, `frontend/src/components/LiveViewer.css`, `frontend/src/components/LiveViewer.js`, `frontend/src/pages/LiveTestPage.js`
- **Résultat** :
  - Bouton `lv-send-btn` ajouté dans le chat streamer (inline, fond transparent, couleur accent)
  - Remplacement du popup `ls-chat-panel` par un `ls-write-btn` inline (`<div>` + `<input>` + `<button>`)
  - Suppression état `showChatInput` / `showChatPanel` devenus inutiles
  - Badge pays `ls-country-badge` (pill style) + icône `FiGlobe` (bleu) dans chaque bulle de chat
  - Structure `ls-chat-meta` : nouveau wrapper flex à droite de la bulle
  - Centrage vertical complet dans les bulles (`align-items: center` + suppression `align-self: flex-start` sur avatars)
  - Synchronisation complète LiveStream.js ↔ LiveTestPage.js (vérifiée)
  - Commits : `bc190ae`, `69776ae`, `4b1f112`

#### TÂCHE-043 — Corrections ESLint (build warnings)
- **Statut** : DONE
- **Modèle** : Sonnet | **Difficulté** : Facile
- **Fichiers** : `frontend/src/App.js`, `frontend/src/pages/Profile.js`, `frontend/src/pages/Matches.js`, `frontend/src/components/LiveStream.js`
- **Résultat** :
  - `App.js` : supprimé `useTranslation` import + `const { t }` inutilisés
  - `Profile.js` : supprimé `FiMapPin` de l'import react-icons
  - `Matches.js` : ajouté `t` dans les deps du `useCallback` fetchData
  - `LiveStream.js` : supprimé `handleKeyPress` redondant (inline onKeyPress déjà présent sur l'input). Ajouté `liveDescription, selectedEventTheme` dans les deps de `handleGoLive`

#### FIX — Double ligne catégories emoji picker (après TÂCHE-042)
- **Statut** : DONE — commits `e2935d0`, `ce0bcce`
- **Fichiers** : `frontend/src/pages/Chat.css`
- **Résultat** : `overflow: hidden !important` + `height: var(--epr-category-navigation-button-size, 30px) !important` + `min-height: unset !important` sur `.epr-cat-btn` (Chat + TeamPage). `skinTonesDisabled` ajouté sur Chat EmojiPicker.

#### TÂCHE-042 — Corrections Chat : emoji picker dropdown + input mobile
- **Statut** : DONE
- **Modèle** : Sonnet | **Difficulté** : Facile
- **Fichiers** : `frontend/src/pages/Chat.css`, `frontend/src/pages/Chat.js`, `frontend/src/locales/*.json`
- **Résultat** : Retiré `overflow: hidden` du dropdown picker (clipping catégories). Ajout `style={{ borderRadius: '12px' }}` sur EmojiPicker. `min-width: 0` sur input + `.messages-input .btn-ghost` fixe 36px. Placeholder raccourci : "Écrivez..." / "Message..." / "Escribe..." / "Schreiben..." / "Scrivi..."

#### TÂCHE-041 — Emoji picker sur la page Chat (conversations/matches)
- **Statut** : DONE
- **Modèle** : Sonnet | **Difficulté** : Facile
- **Fichiers** : `frontend/src/pages/Chat.js`, `frontend/src/pages/Chat.css`
- **Résultat** : EmojiPicker (toutes catégories) dans dropdown au-dessus de l'input. Bouton FiSmile toggle. Fix font-family emoji sur bulles et input.

#### TÂCHE-040 — Emoji picker dropdown TeamPage (remplace grille 60 emojis)
- **Statut** : DONE
- **Modèle** : Sonnet | **Difficulté** : Facile
- **Fichiers** : `frontend/src/pages/TeamPage.js`, `frontend/src/pages/TeamPage.css`
- **Résultat** : emoji-picker-react v4.18.0, 7 catégories sans faces/persos/mains, skinTonesDisabled, dropdown click-outside.

---

#### TÂCHE-039 — Corrections CSS + Chat + Emoji + maxMembers + Infos Générales
- **Statut** : DONE
- **Modèle** : Sonnet | **Difficulté** : Facile-Moyenne
- **Fichiers** : `backend/models/Team.js`, `backend/routes/teams.js`, `frontend/src/pages/TeamPage.css`, `frontend/src/pages/TeamPage.js`
- **Travail** :
  - **[Team.js]** Ajouter champ `generalInfo: { type: String, maxlength: 500, default: '' }`
  - **[routes/teams.js]** GET `/mine` : si `maxMembers < 30` → forcer 30 + save
  - **[routes/teams.js]** PATCH `/:id` : autoriser `generalInfo` dans les champs modifiables
  - **[TeamPage.css]** `.team-header` : retirer uniquement `position / top / left / right`
  - **[TeamPage.css]** `.team-tabs` : retirer uniquement `position / top / left / right`
  - **[TeamPage.css]** `.team-content` : `padding → 8px` (uniforme)
  - **[TeamPage.css]** `.team-chat-wrapper` : retirer `position: fixed / top / bottom / left / right / max-width / margin` → `flex: 1; overflow: hidden; width: 100%`
  - **[TeamPage.css]** `.team-chat-messages` : ajouter bulle visuelle (background + border-radius)
  - **[TeamPage.css]** Styles `.team-general-info-card` (bulle Infos Générales)
  - **[TeamPage.js]** Emoji picker : 12 → ~60 emojis mobile, grid scrollable 6 colonnes
  - **[TeamPage.js]** Bulle Infos Générales (onglet Infos, entre identité et concours) : lecture + édition inline Captain/Officers → PATCH `{ generalInfo }`

---

## Terminées

> Ordre : plus récent en haut.

---

### ╔══ Session 24 — 27 Fév 2026 ══╗

#### TÂCHE-038 — Phase 6 : Gestion avancée (TAG couleur + Transfert capitaine)
- **Statut** : DONE
- **Modèle** : Sonnet | **Difficulté** : Moyenne
- **Fichiers** : `backend/models/Team.js`, `backend/routes/teams.js`, `frontend/src/pages/TeamPage.js`, `frontend/src/pages/TeamPage.css`, `frontend/src/pages/LiveCompetition.js`, `frontend/src/pages/LiveCompetition.css`, `frontend/src/locales/*.json`
- **Résultat** : `tag` + `tagColor` dans Team.js. Route transfer capitaine. Gestion : carte identité + panel édition (emoji grille, TAG, swatches couleur). Modal transfert capitaine. Badge `[TAG]` avec tagColor sur StreamCards LiveCompetition.

#### TÂCHE-037 — Phase 5 : Chat améliorations
- **Statut** : DONE
- **Modèle** : Sonnet | **Difficulté** : Moyenne
- **Fichiers** : `backend/socketHandlers/teamChat.js`, `frontend/src/pages/TeamPage.js`, `frontend/src/pages/TeamPage.css`, `frontend/src/locales/*.json`
- **Résultat** : Map `teamOnlineUsers` → `team:onlineUsers` temps réel. Barre membres connectés sous tabs. Messages avec avatar + nom (gauche=reçus, droite=envoyés). Input chat ancré en bas.

#### TÂCHE-036 — Phase 4 : Informations Concours (onglet Infos redesign)
- **Statut** : DONE
- **Modèle** : Opus | **Difficulté** : Complexe
- **Fichiers** : `backend/models/Team.js`, `backend/routes/teams.js`, `frontend/src/pages/TeamPage.js`, `frontend/src/pages/TeamPage.css`, `frontend/src/locales/*.json`
- **Résultat** : `competitionEntries [{ competition, participants×5, instructions }]` max 3. Routes POST/PATCH/DELETE entries. Panel bottom sheet : sélect concours + 5 membres + instructions. Bulles concours lisibles par tous. Édition Nom/Desc déménagée dans Gestion.

#### TÂCHE-035 — Phase 3 : Système de grades membres (officer/nouveau)
- **Statut** : DONE
- **Modèle** : Sonnet | **Difficulté** : Moyenne
- **Fichiers** : `backend/models/Team.js`, `backend/routes/teams.js`, `frontend/src/pages/TeamPage.js`, `frontend/src/pages/TeamPage.css`, `frontend/src/locales/*.json`
- **Résultat** : Enum roles `['captain', 'officer', 'member', 'nouveau']`. Route PATCH `/:id/member/:userId/role` avec vérif rang. Boutons dynamiques par rang. Badges colorés.

#### TÂCHE-034 — Phase 2 : Listing équipes + système de candidatures
- **Statut** : DONE
- **Modèle** : Sonnet | **Difficulté** : Moyenne
- **Fichiers** : `frontend/src/pages/TeamPage.js`, `frontend/src/pages/TeamPage.css`, `frontend/src/locales/*.json`
- **Résultat** : Écran sans équipe : 2 boutons (Créer + Rejoindre). Vue listing équipes avec cartes + bouton Postuler. Bulle candidatures dans onglet Membres.

#### TÂCHE-033 — Phase 1 : Corrections UX/CSS TeamPage
- **Statut** : DONE
- **Modèle** : Sonnet | **Difficulté** : Facile
- **Fichiers** : `frontend/src/pages/TeamPage.js`, `frontend/src/pages/TeamPage.css`, `backend/models/Team.js`
- **Résultat** : Retrait `<Navigation />` bas de page. Ajustement barre onglets + padding contenu. `maxMembers` max:30, default:30. Espacement membres et section Gestion.

---

### ╔══ Session 23 — 27 Fév 2026 ══╗

#### TÂCHE-032 — Frontend Team : page complète 4 onglets
- **Statut** : DONE
- **Fichiers** : `frontend/src/pages/TeamPage.js`, `frontend/src/pages/TeamPage.css`, `frontend/src/locales/*.json`
- **Résultat** : Page complète 2 états (no-team + team). Écran no-team : formulaire création inline. Écran team : 4 onglets — Membres (liste avatar/nom/badge capitaine + bouton kick), Infos (emoji/nom/desc + édition in-place), Chat (Socket.IO temps réel room `team-{id}`, bulles gauche/droite), Gestion (demandes accept/reject, toggle ouvert/fermé, dissolution). FAB Quitter (non-capitaines). i18n 5 langues (~40 clés).

#### TÂCHE-031 — Backend Team : modèle + routes + socket
- **Statut** : DONE
- **Fichiers** : `backend/models/Team.js`, `backend/routes/teams.js`, `backend/socketHandlers/teamChat.js`, `backend/server.js`
- **Résultat** : Modèle Team (name/description/color/emoji/captain/members/joinRequests/maxMembers/isOpen/competition). 10 routes CRUD. Socket teamChat : team:join/leave/message/memberOnline/memberOffline. Monté dans server.js.

#### TÂCHE-030 — LiveCompetition : refonte complète
- **Statut** : DONE
- **Fichiers** : `frontend/src/pages/LiveCompetition.js`, `frontend/src/pages/LiveCompetition.css`, `frontend/src/App.js`, `frontend/src/locales/*.json`
- **Résultat** : 2 écrans (rules → liveList). Écran rules : hero trophée, règlement 5 points, sections "En cours"/"À venir" depuis /api/competitions, modal détail AnimatePresence (bottom sheet), bouton "Voir les Lives". Écran liveList : barre filtres, CompStreamCard avec description, 2 boutons fixes (.lc-fab-start ambre + .lc-fab-team). Route /stream/competition/team ajoutée. i18n 5 langues (17 clés).

#### TÂCHE-029 — Backend Compétitions : modèle DB + CRUD
- **Statut** : DONE
- **Fichiers** : `backend/models/Competition.js`, `backend/routes/competitions.js`, `backend/server.js`
- **Résultat** : Modèle Competition (name/description/rules/prize/status/startDate/endDate/maxTeams/createdBy). CRUD complet, requireAdmin pour POST/PATCH/DELETE. Monté sur /api/competitions.

#### TÂCHE-028 — LiveEvent : refonte complète (thèmes + filtres + compteur + description)
- **Statut** : DONE
- **Fichiers** : `frontend/src/pages/LiveEvent.js`, `frontend/src/pages/LiveEvent.css`
- **Résultat** : Rename gaming→Bricolages/discussion→Commerciales, badge compteur par thème (.le-theme-badge depuis tagCounts), barre filtres Tendance/Alentours/Nouveau/Favoris, description dans les cartes.

#### TÂCHE-027 — LiveStream + LivePublic : textarea description + rename thèmes + carte
- **Statut** : DONE
- **Fichiers** : `frontend/src/components/LiveStream.js`, `frontend/src/components/LiveStream.css`
- **Résultat** : maxLength 150→80, compteur /80 (.ls-description-counter), rename EVENT_THEMES (gaming→bricolage, discussion→commerciales). LivePublic.js/css déjà OK depuis commit 135107e.

#### TÂCHE-026 — Backend Live : description dans room + compteur tags
- **Statut** : DONE
- **Fichiers** : `backend/routes/live.js`
- **Résultat** : tagCounts calculé depuis liveRooms.values() et retourné dans GET /api/live/public. Description déjà stockée dans liveRoom.js depuis commit 135107e.

---

### ╔══ Session 22 — 27 Fév 2026 ══╗

#### TÂCHE-025 — LiveSurprise : Timer sélectionnable + filtre genre + résumé paramètres
- **Statut** : DONE
- **Commit** : `60191ef`
- **Fichiers** : `frontend/src/pages/LiveSurprise.js/css`, `backend/socketHandlers/surprise.js`, `frontend/src/locales/*.json`
- **Résultat** : 4 chips timer (3/5/8/10 min), 3 chips genre (Homme/Femme/N'importe). Résumé paramètres actifs. Backend : matching timer égalité stricte + genre bidirectionnel. Timeout → "Recommencer" + "Modifier les filtres". i18n 9 clés (5 locales).

#### TÂCHE-024 — Interface Live : Contrôles participant + bouton Kick + repositionnement Quitter
- **Statut** : DONE
- **Commit** : `2a6147e`
- **Fichiers** : `LiveStream.js/css`, `LiveViewer.js`, `liveRoom.js`, `locales/*.json`
- **Résultat** : Boutons mic (orange si muet) + X (masquage local) sur cartes participant. Kick (FiSlash) dans panel spectateurs. Bouton Quitter déplacé en ls-top-bar (X blanc). i18n 5 clés (5 locales).

---

### ╔══ Session 21 — 27 Fév 2026 ══╗

#### TÂCHE-023 — LiveEvent : Sélection de salon + liste de lives
- **Statut** : DONE
- **Commit** : `5f04cb2`
- **Fichiers** : `LiveEvent.js/css`, `LiveStream.js/css`, `locales/*.json`
- **Résultat** : 2 écrans — picker 8 thèmes colorés + liste lives filtrés client-side par tag. EventStreamCard avec --le-theme-color. Sélecteur chips dans LiveStream.js pré-live (mode='event'). i18n 5 langues + objet themes.

#### TÂCHE-022 — LiveCompetition : Refonte card grid (layout LivePublic)
- **Statut** : DONE
- **Commit** : `5f04cb2`
- **Fichiers** : `LiveCompetition.js/css`, `locales/*.json`
- **Résultat** : Réécriture complète. CompStreamCard (photo, timer, LIVE badge, viewers, avatar, favoris), FAB ambre, search bar toggle, refresh 30s silencieux, restauration isStreaming. i18n 5 langues.

#### Correctifs T1-T7 — 7 bugs UI
- **Statut** : DONE
- **Commit** : `1c95cd1`
- **Fichiers** : `LiveViewer.css/js`, `LiveStream.js`, `LivePublic.js`, `LiveSurprise.js/css`, `surprise.js`
- **Résultat** :
  - **T1** : LiveViewer.css — PiP participant déplacé en top-right
  - **T2** : LiveViewer.js — cam-off PiP affiche photo profil/initiale (`.lv-cam-off-cover`)
  - **T3** : LiveStream.js + LiveViewer.js — message "userLeft" centré sans préfixe System: (`isJoinEvent: true`)
  - **T4** : LiveStream.js + LiveViewer.js — chat `photoUrl` correctement destructuré depuis `live-chat-message`
  - **T5** : LivePublic.js — useEffect mount restaure `isStreaming` si `user.isLive === true`
  - **T6** : LiveSurprise.js/css — header fixe glassmorphism (retour + titre + nav) sur écrans start/searching
  - **T7** : LiveSurprise.js + surprise.js — filtre langues (init depuis i18n+profil, matching backend par intersection)

---

### ╔══ Session 20 — 26 Fév 2026 ══╗

#### LivePublic FAB + StreamHub + Legal/RGPD + Watermark
- **Statut** : DONE
- **Commits** : `6ed44d7`, `4d59566`, `3a950df`, `58294ed`
- **Fichiers** : `LivePublic.js/css`, `StreamHub.js/css`, `Legal.js/css`, `ConsentModal.js/css`, `App.js`, `Settings.js`, `locales/*.json`
- **Résultat** :
  - LivePublic : `.start-live-fab` centré (bottom: 80px, border-radius: 50px), padding-bottom 80→160px
  - StreamHub : retrait bouton FAB fixe, inversion ordre catégories, renommage Événement → Thématiques
  - `Legal.js` : page 3 onglets (CGU/Confidentialité/Mentions légales), route `/legal` publique
  - `ConsentModal.js` : modale bloquante RGPD, persistance `globostream_consent_v1` localStorage
  - Watermark : `.ls-watermark` + `.lv-watermark` (8 derniers chars userId, opacity 0.18, pointer-events none)
  - i18n : objet `legal` (9 clés) dans 5 langues

---

### ╔══ Sessions 17-18 — 26 Fév 2026 ══╗

#### Système cadeaux + description live + timer StreamCard
- **Statut** : DONE
- **Commit** : `135107e`
- **Fichiers** : `liveRoom.js`, `routes/live.js`, `LiveStream.js/css`, `LiveViewer.js/css`, `LivePublic.js`
- **Résultat** : Panel cadeaux côté streamer (→ participants) et viewer (→ streamer). `giftScore` temps réel. Textarea description (maxLength 150) dans pré-live, émise dans `create-live-room`. Routes live.js retournent données réelles depuis liveRooms. Timer elapsed 1s dans StreamCard. `.stream-description` affiché si renseigné.

#### Améliorations UI LiveStream & LiveViewer
- **Statut** : DONE
- **Commit** : `302ef18`
- **Fichiers** : `LiveStream.js/css`, `LiveViewer.js`, `locales/*.json`
- **Résultat** : Modal règles de diffusion (streamer) avec checkbox obligatoire. Modal règles participation (viewer). Panel chat slide-up + bouton "Écrire". Noms participants tronqués. i18n : `liveStream.writeBtn`, `liveStream.rules.*` (9 clés), `liveViewer.joinRulesTitle/Subtitle` (5 langues).

---

### ╔══ Session 19 — 26 Fév 2026 (Frontend ex-Gemini, tâches G-010 → G-020) ══╗

> Ces tâches ont été transférées depuis `todo_gemini.md` le 26/02/2026 quand Gemini a été retiré du projet.
> Le préfixe G- distingue la numérotation Gemini de la numérotation Claude.

#### G-020 — Live Surprise : Toggle micro + caméra
- **Statut** : DONE (déjà implémenté avant transfert)
- **Fichiers** : `LiveSurprise.js/css`
- **Résultat** : toggleMic/toggleCam dans la bottom bar avec classe `off` si désactivé.

#### G-019 — Live Surprise : UI de filtrage
- **Statut** : DONE
- **Fichiers** : `LiveSurprise.js/css`
- **Résultat** : Bouton "Filtres" → panel AnimatePresence (pays + âge min/max). Filtres envoyés à `join-surprise-queue`/`start-search`. Listener `surprise-search-timeout` → banner "Élargir la recherche mondiale". i18n 5 langues.

#### G-018 — Interface Live : Message "X a quitté le live"
- **Statut** : DONE
- **Fichiers** : `LiveStream.js`, `LiveViewer.js`
- **Résultat** : Listener `live-user-left { displayName }` → message système dans le chat. Clé `liveStream.userLeft` (5 langues).

#### G-017 — Interface Live : Photo du spectateur dans le chat
- **Statut** : DONE
- **Fichiers** : `LiveStream.js/css`, `LiveViewer.js/css`
- **Résultat** : `viewersInfoRef` Map (displayName → { userId, photoUrl }). Avatar 28px (`.ls-chat-avatar`) dans chaque message non-système.

#### G-016 — Interface Live : Clic sur nom spectateur → profil public
- **Statut** : DONE
- **Fichiers** : `LiveStream.js`, `LiveViewer.js`
- **Résultat** : Rows spectateurs cliquables → `navigate('/profile/:userId')`. Classe `.clickable` avec hover.

#### G-015 — Interface Live : Badge spectateurs en temps réel
- **Statut** : DONE
- **Fichiers** : `LiveStream.js`, `LiveViewer.js`
- **Résultat** : Listener `viewers-updated { viewerCount, viewers }`. Sync viewerCount + liste viewers en temps réel.

#### G-014 — Live Publique : Carte Streamer redesign
- **Statut** : DONE
- **Fichiers** : `LivePublic.js/css`
- **Résultat** : Avatar 52px, nom/âge + viewers/timer compact. Tags et distance retirés. Calcul âge depuis birthDate.

#### G-013 — StreamHub : Bulles catégories = Streamers + Spectateurs
- **Statut** : DONE
- **Fichiers** : `StreamHub.js/css`
- **Résultat** : Footer cartes "X streamers · Y spectateurs". i18n `streamers/viewers/noOne` (5 langues).

#### G-012 — StreamHub : Bouton Démarrer centré + plus gros
- **Statut** : DONE
- **Fichiers** : `StreamHub.js/css`
- **Résultat** : `.btn-start-live-fixed` (fixed, bottom: 80px, centré, padding 16px 32px, border-radius 50px).

#### G-011 — Live Surprise : Compteur participants en ligne
- **Statut** : DONE
- **Fichiers** : `LiveSurprise.js/css`
- **Résultat** : Listener `surprise-user-count { count }` → badge "🔴 X en ligne" sur écrans start/searching.

#### G-010 — Live Surprise : Bouton Message + panel envoi
- **Statut** : DONE
- **Fichiers** : `LiveSurprise.js/css`
- **Résultat** : FiMessageCircle → panel slide-up (textarea 300 chars). `POST /api/message-requests/send/:userId`. Confirmation verte 2s. i18n 6 clés (5 langues).

---

### ╔══ Sessions 14-18 — 24-26 Fév 2026 (Backend Test-01 + Phase 2) ══╗

#### TÂCHE-016 — Live Surprise : Filtrage par pays d'origine
- **Statut** : DONE
- **Fichiers** : `backend/socketHandlers/surprise.js`
- **Résultat** : `join-surprise-queue` utilise `user.location.country` par défaut. Timeout 15s → `surprise-search-timeout` (pas de fallback auto). `clearTimeout` sur leave/disconnect.

#### TÂCHE-015 — Matches : Endpoint vérification message déjà envoyé
- **Statut** : DONE
- **Fichiers** : `backend/routes/messageRequests.js`
- **Résultat** : Route `GET /sent-to/:userId` → `{ success, alreadySent, status }`.

#### TÂCHE-014 — Interface Live : Message "X a quitté le live" (backend)
- **Statut** : DONE
- **Fichiers** : `backend/socketHandlers/liveRoom.js`
- **Résultat** : `handleLeaveRoom` émet `live-user-left { userId, displayName }` à toute la room.

#### TÂCHE-013 — Interface Live : Panel spectateurs pour les Viewers
- **Statut** : DONE
- **Fichiers** : `backend/socketHandlers/liveRoom.js`
- **Résultat** : `join-live-room` async + lookup photo DB. `room-info` inclut `viewers: [{ socketId, userId, displayName, photoUrl }]`. `viewers-updated` diffusé à chaque join/leave.

#### TÂCHE-012 — Live Surprise : Corriger connexion WebRTC
- **Statut** : DONE
- **Fichiers** : `backend/socketHandlers/surprise.js`
- **Résultat** : Refactoring `createPair()` avec socketId frais. Relay `send-signal → receive-signal`. `cleanupPair()` symétrique.

#### TÂCHE-011 — Live Surprise : Skip = retour en file d'attente
- **Statut** : DONE
- **Fichiers** : `backend/socketHandlers/surprise.js`
- **Résultat** : `surprise-skip { userId }` → notifie partenaire, nettoie paire, skipper remis en file.

#### TÂCHE-010 — Live Surprise : Bouton Like = Like profil réel + match
- **Statut** : DONE
- **Fichiers** : `backend/socketHandlers/surprise.js`
- **Résultat** : `send-decision` avec `like` → ajout `likes[]`, détection match mutuel, émission `surprise-match`.

#### TÂCHE-009 — Live Surprise : Compteur temps réel de participants
- **Statut** : DONE
- **Fichiers** : `backend/socketHandlers/surprise.js`
- **Résultat** : `broadcastSurpriseCount(io)` → `surprise-user-count { count, inQueue, inSession }` après chaque changement.

#### TÂCHE-008 — Bugfixes WebRTC (Streamer/Viewer ne se voyaient pas)
- **Statut** : DONE
- **Fichiers** : `LiveStream.js`, `LiveViewer.js`
- **Résultat** : Suppression `trickle:false`, ajout STUN config, race condition `join-live-room` corrigée, double leave/disconnect corrigés.

#### TÂCHE-007 — Compteur en ligne temps réel (StreamHub)
- **Statut** : DONE
- **Fichiers** : `liveRoom.js`, `routes/stream.js`, `StreamHub.js`
- **Résultat** : `getStreamStats()` + `broadcastStreamStats(io)` + `GET /api/stream/stats` + Socket.IO client StreamHub.

#### TÂCHE-006 — Backend : Vues profil + Likes reçus
- **Statut** : DONE
- **Fichiers** : `backend/routes/users.js`, `backend/routes/swipe.js`
- **Résultat** : `GET /api/users/views` et `GET /api/swipe/likes-received` créés.

#### TÂCHE-005 — Envoyer le nom du streamer dans room-info
- **Statut** : DONE
- **Fichiers** : `backend/socketHandlers/liveRoom.js`
- **Résultat** : `displayName` stocké à `create-live-room`, retourné dans `room-info` comme `streamerName`.

#### TÂCHE-004 — Synchroniser l'état du micro du streamer
- **Statut** : DONE
- **Fichiers** : `backend/socketHandlers/liveRoom.js`
- **Résultat** : Handler `streamer-mic-state` → `socket.to(roomId)` relaie à tous les viewers.

#### TÂCHE-003 — Synchroniser l'état de la caméra des participants
- **Statut** : DONE
- **Fichiers** : `backend/socketHandlers/liveRoom.js`
- **Résultat** : Handler `participant-cam-state` → relaie au streamer avec `participantSocketId: socket.id`.

#### TÂCHE-002 — Relais de sourdine (mute)
- **Statut** : DONE
- **Fichiers** : `backend/socketHandlers/liveRoom.js`
- **Résultat** : Handler `streamer-toggle-mute-participant` → émet `force-mute-toggle` vers le `participantSocketId`.

#### TÂCHE-001 — Debug erreur 500 sur GET /api/matches
- **Statut** : DONE
- **Fichiers** : `backend/routes/matches.js`, `backend/routes/chat.js`
- **Résultat** : Crash `null.getPublicProfile()` quand user matché supprimé. Filtres null ajoutés dans matches.js et chat.js.

---

### ╔══ Sessions 1-13 — Fév 2026 (Fondations) ══╗

#### Sessions 1-3 — Tests + ESLint + i18n
- **Statut** : DONE
- **Résultat** : 84 fonctionnalités backend testées, 9 bugs auth/users corrigés, 36 warnings ESLint supprimés, i18n configuré (react-i18next, 5 langues, ~650 chaînes). Build validé (183 KB JS + 14 KB CSS).

#### Sessions 4-13 — Développement initial (Gemini)
- **Statut** : DONE (archivé dans `todo_gemini.md`)
- **Résultat** : Architecture frontend React, pages Swipe/Matches/Chat/Profile/Settings/Support/Stream/LiveSurprise/LivePublic/LiveStream/LiveViewer, WebRTC, Socket.IO, Passport OAuth, modération, responsive mobile-first 768px.
