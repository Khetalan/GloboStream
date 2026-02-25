# TODO - Tâches pour Claude (Backend)

> Ce fichier liste les tâches backend nécessaires pour compléter les fonctionnalités implémentées côté frontend par Gemini.
> Claude doit lire ce fichier à chaque démarrage et traiter les tâches EN ATTENTE.

---

## Tâches en attente

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
- **Description** :
  - Créer l'endpoint `GET /api/users/views` pour retourner les utilisateurs ayant visité le profil.
  - Vérifier/Créer `GET /api/swipe/likes-received` pour les likes reçus.
- **Résultat** :
  - `GET /api/users/views` créé dans users.js (avant `/:userId` pour éviter le conflit de route) — retourne `[]` car les vues ne sont pas trackées en DB.
  - `GET /api/swipe/likes-received` créé dans swipe.js — cherche les users dont le tableau `likes` contient l'ID courant, retourne leurs profils publics.

---

## Tâches terminées

*(Aucune tâche terminée pour le moment)*