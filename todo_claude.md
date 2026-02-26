# TODO - Tâches pour Claude (Backend)

> Ce fichier liste les tâches backend nécessaires pour compléter les fonctionnalités implémentées côté frontend par Gemini.
> Claude doit lire ce fichier à chaque démarrage et traiter les tâches EN ATTENTE.

---

## Tâches en attente

### TÂCHE-021 — LiveCompetition + LiveEvent : Bouton Démarrer centré (style Live Publique)
- **Statut**   : EN ATTENTE (pages pas encore créées)
- **Ajoutée**  : 26/02/2026
- **Priorité** : BASSE
- **Fichiers concernés** : `frontend/src/pages/LiveCompetition.js`, `frontend/src/pages/LiveEvent.js` (à créer)
- **Description** : Quand les pages LiveCompetition et LiveEvent seront créées, leur ajouter un bouton "Démarrer" avec le même style que le FAB de LivePublic (centré, position fixed, bottom 80px, padding 16px/32px, font 1.05rem, border-radius 50px). Utiliser la couleur propre à chaque mode (pas le rouge #e4405f). Ne pas mettre de bouton fixe dans le StreamHub.

---

## Tâches terminées

### TÂCHE-001 — Debug erreur 500 sur GET /api/matches
- **Statut**   : DONE
- **Ajoutée**  : 24/02/2026 par Gemini
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/routes/matches.js`, `backend/routes/chat.js`
- **Description** : L'appel à `GET /api/matches` renvoie une erreur 500 Internal Server Error.
- **Contexte** : Signalé par l'utilisateur lors de la navigation sur la page Matches.js.
- **Résultat** : Double-fetch + crash sur `null.getPublicProfile()` quand un user matché est supprimé. Corrigé dans matches.js (filtre null + suppression double-fetch) et chat.js (même filtre sur GET /conversations).

### TÂCHE-002 — Implémenter le relais de sourdine (mute)
- **Statut**   : DONE
- **Ajoutée**  : 24/02/2026 par Gemini
- **Priorité** : NORMALE
- **Fichiers concernés** : `backend/socketHandlers/liveRoom.js`
- **Description** : Écouter l'événement `streamer-toggle-mute-participant` et émettre un événement `force-mute-toggle` vers le `participantSocketId` ciblé.
- **Résultat** : Handler ajouté ligne 194. Vérification que l'émetteur est bien le streamer.

### TÂCHE-003 — Synchroniser l'état de la caméra des participants
- **Statut**   : DONE
- **Ajoutée**  : 24/02/2026 par Gemini
- **Priorité** : NORMALE
- **Fichiers concernés** : `backend/socketHandlers/liveRoom.js`
- **Description** : Écouter l'événement `participant-cam-state` émis par un participant et le relayer au streamer.
- **Résultat** : Handler ajouté ligne 206. Relaie au streamer avec `participantSocketId: socket.id`.

### TÂCHE-004 — Synchroniser l'état du micro du streamer
- **Statut**   : DONE
- **Ajoutée**  : 24/02/2026 par Gemini
- **Priorité** : NORMALE
- **Fichiers concernés** : `backend/socketHandlers/liveRoom.js`
- **Description** : Écouter l'événement `streamer-mic-state` émis par le streamer et le relayer aux spectateurs.
- **Résultat** : Handler ajouté ligne 221. `socket.to(roomId)` relaie à tous sauf le streamer.

### TÂCHE-005 — Envoyer le nom du streamer dans room-info
- **Statut**   : DONE
- **Ajoutée**  : 24/02/2026 par Gemini
- **Priorité** : NORMALE
- **Fichiers concernés** : `backend/socketHandlers/liveRoom.js`
- **Description** : Dans l'événement `join-live-room`, ajouter `streamerName` au payload de `room-info`.
- **Résultat** : `displayName` stocké dans la room à `create-live-room`. Ajouté dans `room-info` comme `streamerName: room.displayName`.

### TÂCHE-006 — Implémentation Backend des "Vues" et "Likes reçus"
- **Statut**   : DONE
- **Ajoutée**  : 24/02/2026 par Gemini
- **Priorité** : NORMALE
- **Fichiers concernés** : `backend/routes/users.js`, `backend/routes/swipe.js`
- **Description** : Créer `GET /api/users/views` et vérifier/créer `GET /api/swipe/likes-received`.
- **Résultat** : Les deux endpoints créés. `views` retourne `[]` (tracking non implémenté en DB). `likes-received` cherche les users dont `likes[]` contient l'ID courant.

### TÂCHE-007 — Compteur en ligne temps réel (StreamHub)
- **Statut**   : DONE
- **Ajoutée**  : 25/02/2026
- **Priorité** : NORMALE
- **Fichiers** : `backend/socketHandlers/liveRoom.js`, `backend/routes/stream.js`, `frontend/src/pages/StreamHub.js`
- **Résultat** : `getStreamStats()` + `broadcastStreamStats(io)` + `GET /api/stream/stats` + Socket.IO client dans StreamHub.

### TÂCHE-008 — Bugfixes WebRTC (Streamer/Viewer ne se voyaient pas)
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026
- **Priorité** : HAUTE
- **Fichiers** : `frontend/src/components/LiveStream.js`, `frontend/src/components/LiveViewer.js`
- **Résultat** : Suppression `trickle:false`, ajout `PEER_CONFIG` STUN, race condition `join-live-room` corrigée, double leave et double disconnect corrigés.

### TÂCHE-009 — Live Surprise : Compteur temps réel de participants
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/socketHandlers/surprise.js`
- **Description** : Émettre un event `surprise-user-count` avec le nombre de participants actifs à chaque connexion/déconnexion dans la queue Surprise.
- **Résultat** : Ajout de `broadcastSurpriseCount(io)` dans `surprise.js`. Émet `surprise-user-count { count, inQueue, inSession }` à tous les clients après chaque changement d'état (join, start, skip, decision, disconnect).

### TÂCHE-010 — Live Surprise : Bouton Like = Like profil réel
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/socketHandlers/surprise.js`, `backend/routes/swipe.js`
- **Description** : Vérifier que la route `POST /api/swipe/like/:userId` est bien accessible depuis le contexte Live Surprise et qu'elle gère la création de match si Like mutuel.
- **Résultat** : Dans `send-decision`, quand `decision === 'like'`, logique de like complète : ajout dans `likes[]`, détection match mutuel, création match pour les deux users, émission `surprise-match` si match. Payload attendu : `{ partnerUserId, decision, myUserId }`.

### TÂCHE-011 — Live Surprise : Bouton Skip = retour en file d'attente
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/socketHandlers/surprise.js`
- **Description** : Écouter l'event `surprise-skip` émis par le client. Mettre fin à la session en cours entre les 2 participants et remettre l'initiateur du Skip dans la queue de matchmaking.
- **Résultat** : Nouvel event `surprise-skip { userId }`. Notifie le partenaire (`partner-skipped`), nettoie la paire, remet le skipper en file `isSearching: true`, cherche immédiatement un nouveau partenaire.

### TÂCHE-012 — Live Surprise : Corriger connexion WebRTC entre participants
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/socketHandlers/surprise.js`
- **Description** : Revoir le signaling WebRTC (offer/answer/ICE candidate). Vérifier que trickle ICE est activé côté signal, que les events de signaling sont bien relayés entre les 2 sockets des participants.
- **Résultat** : Refactoring en `createPair()` : socketId garanti frais à `start-search` (mis à jour avec `socket.id` courant), relay WebRTC `send-signal → receive-signal` inchangé (correct). Ajout `cleanupPair()` symétrique.

### TÂCHE-013 — Interface Live : Panel spectateurs vide pour les Viewers
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/socketHandlers/liveRoom.js`
- **Description** : S'assurer que la liste complète des viewers actifs est bien émise au Viewer qui rejoint, et mise à jour à chaque entrée/sortie.
- **Résultat** : `join-live-room` rendu async + lookup photo DB. `room-info` inclut maintenant `viewers: [{ socketId, userId, displayName, photoUrl }]`. Nouvel event `get-viewers → viewers-list`. Event `viewers-updated` diffusé à toute la room à chaque join/leave.

### TÂCHE-014 — Interface Live : Message "X a quitté le live"
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/socketHandlers/liveRoom.js`
- **Description** : Sur les events `leave-live-room` et `disconnect`, émettre un event `live-user-left` avec `{ displayName, userId }` à tous les membres de la room.
- **Résultat** : Dans `handleLeaveRoom`, émission de `live-user-left { userId, displayName }` à toute la room avant suppression de la map. Symétrique du message d'entrée existant.

### TÂCHE-015 — Matches : Endpoint vérification message déjà envoyé
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Traitée**  : 26/02/2026 par Claude (Phase 2)
- **Priorité** : NORMALE
- **Fichiers concernés** : `backend/routes/messageRequests.js`
- **Description** : Créer `GET /api/message-requests/sent-to/:userId` → vérifie si l'utilisateur courant a déjà envoyé une MessageRequest au `userId` ciblé. Retourne `{ alreadySent: true/false, status: 'pending'|'accepted'|'rejected'|null }`.
- **Résultat** : Route `GET /sent-to/:userId` ajoutée avant `/check/:recipientId`. Cherche toute MessageRequest (tout statut) entre l'utilisateur courant et le destinataire cible. Retourne `{ success, alreadySent, status }` — status = null si aucune demande.

### TÂCHE-016 — Live Surprise : Filtrage par pays d'origine (par défaut)
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Traitée**  : 26/02/2026 par Claude (Phase 2)
- **Priorité** : NORMALE
- **Fichiers concernés** : `backend/socketHandlers/surprise.js`
- **Description** : Prioriser le matching avec un utilisateur du même pays. Si aucun utilisateur compatible après 15s, notifier le client pour qu'il élargisse manuellement.
- **Résultat** :
  - `join-surprise-queue` : si `filters.country` absent, utilise `user.location?.country` comme filtre par défaut.
  - `start-search` : si aucun partenaire compatible trouvé, programme un `setTimeout` 15s qui émet `surprise-search-timeout { filtersUsed }` au client — PAS de fallback mondial automatique. L'utilisateur doit élargir lui-même via les filtres du frontend (TÂCHE-019 Gemini).
  - `createPair`, `leave-surprise-queue`, `disconnect` : `clearTimeout(entry.timeoutTimer)` pour éviter les memory leaks.
  - `findPartner` : logique de filtre pays activée automatiquement via les filtres par défaut.
  - **Event frontend attendu** : `surprise-search-timeout` → afficher bouton "Élargir la recherche mondiale" → re-émettre `start-search` avec `filters = {}`.

---

## Tâches transférées depuis Gemini (26/02/2026)

Ces tâches ont été transférées depuis `todo_gemini.md` le 26/02/2026 quand Gemini a été retiré du projet. Claude prend maintenant en charge le frontend complètement.

### TÂCHE-010 — Live Surprise : Bouton "Message" remplace "Next" + ouvre panel
- **Statut**   : DONE
- **Transférée** : 26/02/2026 depuis todo_gemini.md
- **Traitée**  : 26/02/2026 par Claude
- **Priorité** : NORMALE
- **Fichiers** : frontend/src/pages/LiveSurprise.js, frontend/src/pages/LiveSurprise.css
- **Résultat** : Bouton FiMessageCircle ajouté dans la bottom bar (entre cam et skip). Click → panel slide-up (AnimatePresence) avec textarea 300 chars, compteur, bouton Envoyer → POST /api/message-requests/send/:userId. Confirmation verte 2s puis fermeture auto. Clés i18n : liveSurprise.sendMessage, messageTo, messagePlaceholder, send, sending, messageSent.

### TÂCHE-011 — Live Surprise : Compteur de participants affiché dans l'UI
- **Statut**   : DONE
- **Transférée** : 26/02/2026 depuis todo_gemini.md
- **Traitée**  : 26/02/2026 par Claude
- **Priorité** : NORMALE
- **Fichiers** : frontend/src/pages/LiveSurprise.js, frontend/src/pages/LiveSurprise.css
- **Résultat** : Écoute de l'event surprise-user-count { count }. Badge "🔴 X en ligne" affiché en haut (position absolute, centré) sur les écrans start et searching. Se met à jour en temps réel.

### TÂCHE-012 — StreamHub : Bouton "Démarrer" centré + plus gros
- **Statut**   : DONE
- **Transférée** : 26/02/2026 depuis todo_gemini.md
- **Traitée**  : 26/02/2026 par Claude
- **Priorité** : NORMALE
- **Fichiers** : frontend/src/pages/StreamHub.js, frontend/src/pages/StreamHub.css
- **Résultat** : Bouton `.btn-start-live-fixed` ajouté (position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 200). Padding 16px 32px, font 1.05rem, border-radius 50px. Navigue vers /stream/surprise.

### TÂCHE-013 — StreamHub : Bulles des catégories = Nb Streamers + Nb Spectateurs
- **Statut**   : DONE
- **Transférée** : 26/02/2026 depuis todo_gemini.md
- **Traitée**  : 26/02/2026 par Claude
- **Priorité** : NORMALE
- **Fichiers** : frontend/src/pages/StreamHub.js, frontend/src/pages/StreamHub.css
- **Résultat** : liveStats initialisé avec `{ streamers:0, viewers:0, total:0 }` par catégorie. footer affiche "X streamers · Y spectateurs" si actifs, sinon "Personne en ligne". Clés i18n streamers/viewers/noOne ajoutées dans 5 langues.

### TÂCHE-014 — Live Publique : Carte Streamer redesign
- **Statut**   : DONE
- **Transférée** : 26/02/2026 depuis todo_gemini.md
- **Traitée**  : 26/02/2026 par Claude
- **Priorité** : NORMALE
- **Fichiers** : frontend/src/pages/LivePublic.js, frontend/src/pages/LivePublic.css
- **Résultat** : StreamCard redesigné — avatar 36px→52px. Affiche uniquement Nom/âge et viewers/timer sous format compact (.stream-meta). Viewers masqués si 0. Tags et distance retirés du rendu. Calcul âge depuis birthDate.

### TÂCHE-015 — Interface Live : Badge spectateurs en temps réel
- **Statut**   : DONE
- **Transférée** : 26/02/2026 depuis todo_gemini.md
- **Traitée**  : 26/02/2026 par Claude
- **Priorité** : NORMALE
- **Fichiers** : frontend/src/components/LiveStream.js, LiveStream.css, LiveViewer.js, LiveViewer.css
- **Résultat** : Listener `viewers-updated { viewerCount, viewers }` ajouté dans les deux composants. Sync viewerCount + liste viewers en temps réel.

### TÂCHE-016 — Interface Live : Clic sur nom spectateur → profil public
- **Statut**   : DONE
- **Transférée** : 26/02/2026 depuis todo_gemini.md
- **Traitée**  : 26/02/2026 par Claude
- **Priorité** : NORMALE
- **Fichiers** : frontend/src/components/LiveStream.js, LiveViewer.js
- **Résultat** : useNavigate ajouté dans les deux composants. Viewer rows dans le panel stats cliquables → navigate(`/profile/${v.userId}`). Classe `.clickable` avec hover. Affichage photo viewer dans le panel si photoUrl disponible.

### TÂCHE-017 — Interface Live : Photo du spectateur dans le chat
- **Statut**   : DONE
- **Transférée** : 26/02/2026 depuis todo_gemini.md
- **Traitée**  : 26/02/2026 par Claude
- **Priorité** : NORMALE
- **Fichiers** : frontend/src/components/LiveStream.js, LiveStream.css, LiveViewer.js, LiveViewer.css
- **Résultat** : `viewersInfoRef` Map (displayName → { userId, photoUrl }) mise à jour via viewers-updated/viewer-joined. Chat messages incluent photoUrl + userId. Avatar 28px dans chaque message non-système. CSS `.ls-chat-avatar`, `.ls-chat-content` ajoutés.

### TÂCHE-018 — Interface Live : Message "X a quitté le live"
- **Statut**   : DONE
- **Transférée** : 26/02/2026 depuis todo_gemini.md
- **Traitée**  : 26/02/2026 par Claude
- **Priorité** : NORMALE
- **Fichiers** : frontend/src/components/LiveStream.js, LiveViewer.js
- **Résultat** : Listener `live-user-left { displayName }` dans les deux composants. Message système ajouté dans le chat. Clé i18n `liveStream.userLeft` ajoutée dans 5 langues.

### TÂCHE-019 — Live Surprise : UI de filtrage
- **Statut**   : DONE
- **Transférée** : 26/02/2026 depuis todo_gemini.md
- **Traitée**  : 26/02/2026 par Claude
- **Priorité** : BASSE
- **Fichiers** : frontend/src/pages/LiveSurprise.js, frontend/src/pages/LiveSurprise.css
- **Résultat** : Bouton "Filtres" toggle sur écran start → AnimatePresence panel (pays + âge min/max). handleStart passe les filtres actifs à join-surprise-queue et start-search. Listener `surprise-search-timeout` → banner avec bouton "Élargir la recherche mondiale" → re-émet sans filtres. Clés i18n complètes dans 5 langues.

### TÂCHE-020 — Live Surprise : Boutons de contrôle (micro + caméra)
- **Statut**   : DONE (déjà implémenté)
- **Transférée** : 26/02/2026 depuis todo_gemini.md
- **Traitée**  : 26/02/2026 par Claude
- **Priorité** : BASSE
- **Fichiers** : frontend/src/pages/LiveSurprise.js, frontend/src/pages/LiveSurprise.css
- **Résultat** : toggleMic et toggleCam déjà présents dans LiveSurprise.js. Boutons FiMic/FiMicOff et FiVideo/FiVideoOff dans la bottom bar avec classe `off` si désactivé.
