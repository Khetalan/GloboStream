# TODO - Tâches pour Claude (Backend)

> Ce fichier liste les tâches backend nécessaires pour compléter les fonctionnalités implémentées côté frontend par Gemini.
> Claude doit lire ce fichier à chaque démarrage et traiter les tâches EN ATTENTE.

---

## Tâches en attente

### TÂCHE-009 — Live Surprise : Compteur temps réel de participants
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/socketHandlers/surprise.js`
- **Description** : Émettre un event `surprise-user-count` avec le nombre de participants actifs à chaque connexion/déconnexion dans la queue Surprise. Le frontend (GEMINI-017) affichera ce compteur en temps réel.
- **Contexte** : Test-01 — l'utilisateur ne voit pas combien de personnes sont connectées en Live Surprise.
- **Résultat** : Ajout de `broadcastSurpriseCount(io)` dans `surprise.js`. Émet `surprise-user-count { count, inQueue, inSession }` à tous les clients après chaque changement d'état (join, start, skip, decision, disconnect).

---

### TÂCHE-010 — Live Surprise : Bouton Like = Like profil réel
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/socketHandlers/surprise.js`, `backend/routes/swipe.js`
- **Description** : Vérifier que la route `POST /api/swipe/like/:userId` est bien accessible depuis le contexte Live Surprise et qu'elle gère la création de match si Like mutuel. Documenter l'endpoint pour que Gemini puisse l'appeler depuis LiveSurprise.js.
- **Contexte** : Test-01 — cliquer sur "Like" en Live Surprise doit fonctionner comme un Like dans les Swipe normaux.
- **Résultat** : Dans `send-decision`, quand `decision === 'like'`, logique de like complète : ajout dans `likes[]`, détection match mutuel, création match pour les deux users, émission `surprise-match` si match. Payload attendu : `{ partnerUserId, decision, myUserId }`.

---

### TÂCHE-011 — Live Surprise : Bouton Skip = retour en file d'attente
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/socketHandlers/surprise.js`
- **Description** : Écouter l'event `surprise-skip` émis par le client. Mettre fin à la session en cours entre les 2 participants et remettre l'initiateur du Skip dans la queue de matchmaking. L'autre participant doit aussi être renvoyé en file d'attente.
- **Contexte** : Test-01 — le bouton Skip doit renvoyer directement dans la file d'attente.
- **Résultat** : Nouvel event `surprise-skip { userId }`. Notifie le partenaire (`partner-skipped`), nettoie la paire, remet le skipper en file `isSearching: true`, cherche immédiatement un nouveau partenaire.

---

### TÂCHE-012 — Live Surprise : Corriger connexion WebRTC entre participants
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/socketHandlers/surprise.js`
- **Description** : Revoir le signaling WebRTC (offer/answer/ICE candidate). Appliquer les mêmes corrections que Session 16 : vérifier que trickle ICE est activé côté signal, que les events de signaling sont bien relayés entre les 2 sockets des participants. Vérifier aussi que le cleanup (destroy peer) est bien géré au Skip/déconnexion.
- **Contexte** : Test-01 — les 2 participants ne se voient pas lors du Live Surprise.
- **Résultat** : Refactoring en `createPair()` : socketId garanti frais à `start-search` (mis à jour avec `socket.id` courant), relay WebRTC `send-signal → receive-signal` inchangé (correct). Ajout `cleanupPair()` symétrique. Fix principal attendu côté frontend (SimplePeer config, trickle ICE, STUN).

---

### TÂCHE-013 — Interface Live : Panel spectateurs vide pour les Viewers
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/socketHandlers/liveRoom.js`
- **Description** : Identifier l'event qui retourne la liste des spectateurs au Viewer (probablement `get-viewers` ou via `room-info`). S'assurer que la liste complète des viewers actifs est bien émise au Viewer qui rejoint, et mise à jour à chaque entrée/sortie.
- **Contexte** : Test-01 — les Viewers ouvrent le panel spectateurs mais il est vide.
- **Résultat** : `join-live-room` rendu async + lookup photo DB. `room-info` inclut maintenant `viewers: [{ socketId, userId, displayName, photoUrl }]`. Nouvel event `get-viewers → viewers-list`. Event `viewers-updated` diffusé à toute la room à chaque join/leave.

---

### TÂCHE-014 — Interface Live : Message "X a quitté le live"
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/socketHandlers/liveRoom.js`
- **Description** : Sur les events `leave-live-room` et `disconnect` (dans le contexte d'une room live), émettre un event `live-user-left` avec `{ displayName, userId }` à tous les membres de la room. Symétrique à l'event d'entrée déjà existant.
- **Contexte** : Test-01 — le message d'entrée existe, mais pas celui de sortie.
- **Résultat** : Dans `handleLeaveRoom`, émission de `live-user-left { userId, displayName }` à toute la room avant suppression de la map. Symétrique du message d'entrée existant.

---

### TÂCHE-015 — Matches : Endpoint vérification message déjà envoyé
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Traitée**  : 26/02/2026 par Claude (Phase 2)
- **Priorité** : NORMALE
- **Fichiers concernés** : `backend/routes/messageRequests.js`
- **Description** : Créer `GET /api/message-requests/sent-to/:userId` → vérifie si l'utilisateur courant a déjà envoyé une MessageRequest au `userId` ciblé. Retourne `{ alreadySent: true/false, status: 'pending'|'accepted'|'rejected'|null }`. Placer la route AVANT les routes avec paramètre générique pour éviter les conflits.
- **Contexte** : Test-01 — le bouton "Message" dans la modale de profil (Matches) doit être désactivé si une demande a déjà été envoyée.
- **Résultat** : Route `GET /sent-to/:userId` ajoutée avant `/check/:recipientId`. Cherche toute MessageRequest (tout statut) entre l'utilisateur courant et le destinataire cible. Retourne `{ success, alreadySent, status }` — status = null si aucune demande.

---

### TÂCHE-016 — Live Surprise : Filtrage par pays d'origine (par défaut)
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Traitée**  : 26/02/2026 par Claude (Phase 2)
- **Priorité** : NORMALE
- **Fichiers concernés** : `backend/socketHandlers/surprise.js`
- **Description** : Dans la logique de matchmaking de la queue Surprise, prioriser le matching avec un utilisateur du même `country` (champ User). Si aucun utilisateur compatible n'est disponible après un délai raisonnable (ex: 15s), élargir à tous les utilisateurs en attente. Prévoir un champ `filters` dans le payload d'entrée en queue pour les extensions futures (âge, etc.).
- **Contexte** : Test-01 — filtrage demandé, pays d'origine par défaut.
- **Résultat** :
  - `join-surprise-queue` : si `filters.country` absent, utilise `user.location?.country` comme filtre par défaut.
  - `start-search` : si aucun partenaire compatible trouvé, programme un `setTimeout` 15s qui émet `surprise-search-timeout { filtersUsed }` au client — PAS de fallback mondial automatique. L'utilisateur doit élargir lui-même via les filtres du frontend (TÂCHE-019 Gemini).
  - `createPair`, `leave-surprise-queue`, `disconnect` : `clearTimeout(entry.timeoutTimer)` pour éviter les memory leaks.
  - `findPartner` : logique de filtre pays déjà présente, maintenant activée automatiquement via les filtres par défaut.
  - **Event frontend attendu** : `surprise-search-timeout` → afficher bouton "Élargir la recherche mondiale" → re-émettre `start-search` avec `filters = {}`.

---

## Tâches terminées

### TÂCHE-001 — Debug erreur 500 sur GET /api/matches
- **Statut**   : DONE
- **Ajoutée**  : 24/02/2026 par Gemini
- **Priorité** : HAUTE
- **Fichiers concernés** : `backend/routes/matches.js`, `backend/routes/chat.js`
- **Description** : L'appel à `GET /api/matches` renvoie une erreur 500 Internal Server Error.
- **Contexte** : Signalé par l'utilisateur lors de la navigation sur la page Matches.js.
- **Résultat** : Double-fetch + crash sur `null.getPublicProfile()` quand un user matché est supprimé. Corrigé dans matches.js (filtre null + suppression double-fetch) et chat.js (même filtre sur GET /conversations). Commit à faire.

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
