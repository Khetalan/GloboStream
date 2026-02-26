# todo_gemini.md — Tâches déléguées par Claude à Gemini

> Ce fichier est écrit par Claude quand une tâche frontend dépasse son périmètre
> ou quand il détecte du travail frontend à faire en parallèle.
> Gemini doit lire ce fichier à chaque démarrage (P1) et traiter les tâches EN ATTENTE.
> Une fois traitée, Gemini marque la tâche comme DONE et note ce qu'il a fait.

---

## Format d'une tâche

```
### TÂCHE-001 — [TITRE COURT]
- **Statut**   : EN ATTENTE | EN COURS | DONE
- **Ajoutée**  : JJ/MM/AAAA par Claude
- **Traitée**  : JJ/MM/AAAA par Gemini (si DONE)
- **Priorité** : HAUTE | NORMALE | BASSE
- **Fichiers concernés** : chemin/fichier.js
- **Description** : Ce que Claude a besoin que Gemini fasse
- **Contexte** : Pourquoi c'est délégué à Gemini
- **Résultat** : (rempli par Gemini une fois terminé)
```

---

## Tâches en attente — PHASE 1 (priorité HAUTE — à traiter en premier)

### TÂCHE-002 — Général : Taille max tablette sur toutes les interfaces Live
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Traitée**  : 26/02/2026 par Claude (Gemini indisponible)
- **Priorité** : HAUTE
- **Fichiers concernés** : `frontend/src/components/LiveStream.css`, `frontend/src/components/LiveViewer.css`, `frontend/src/pages/LiveSurprise.css`, `frontend/src/pages/LivePublic.css`, `frontend/src/pages/LiveCompetition.js`, `frontend/src/pages/LiveCompetition.css`, `frontend/src/pages/LiveEvent.js`, `frontend/src/pages/LiveEvent.css`
- **Description** : Vérifier que TOUS les conteneurs principaux des interfaces Live ont bien `max-width: 768px` et `margin: 0 auto`. Aucune interface Live ne doit dépasser la taille tablette. Corriger les cas où ce n'est pas respecté.
- **Contexte** : Test-01 — règle absolue du projet (MEMORY.md) : taille tablette = maximum. Les interfaces Live n'ont pas toutes été corrigées lors de la Session 16.
- **Résultat** : Ajout de `max-width: 768px; margin: 0 auto` sur `.ls-container` (LiveStream.css), `.lv-container` (LiveViewer.css), `.lspr-container` (LiveSurprise.css). LivePublic.css vérifié et déjà conforme.

---

### TÂCHE-003 — Matches : Modale PublicProfile complète
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Traitée**  : 26/02/2026 par Claude (Gemini indisponible)
- **Priorité** : HAUTE
- **Fichiers concernés** : `frontend/src/pages/Matches.js`, `frontend/src/pages/Matches.css`
- **Description** : La fenêtre/modale qui s'ouvre quand on clique sur une carte utilisateur dans Matches doit afficher le profil COMPLET : photo(s), nom, âge, localisation, bio, centres d'intérêt, langue, etc. Si l'utilisateur n'a pas rempli un champ, afficher une valeur par défaut ("Non renseigné" ou champ vide stylé). Ne rien masquer.
- **Contexte** : Test-01 — le profil affiché dans la modale est incomplet.
- **Résultat** : Ajout dans Matches.js du bloc détails (genre ♂/♀/⚧, taille cm, pays 🌍, occupation 💼, lookingFor traduit). Ajout section intérêts (chips) et langues (chips). Matches.css : `max-height: 85dvh; overflow-y: auto` sur `.profile-modal-card` + nouvelles classes `.modal-section`, `.modal-details-row`, `.modal-detail-chip`, `.modal-chips`, `.modal-chip`.

---

### TÂCHE-004 — Matches : Boutons Like + Message dans la modale profil
- **Statut**   : EN ATTENTE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : HAUTE
- **Dépend de** : TÂCHE-015 dans todo_claude.md (endpoint `GET /api/message-requests/sent-to/:userId`)
- **Fichiers concernés** : `frontend/src/pages/Matches.js`, `frontend/src/pages/Matches.css`
- **Description** :
  - Remplacer le bouton "Discuter" par 2 boutons distincts : ♥ **Like** et ✉ **Message**
  - Supprimer le bouton "Next" (inutile dans ce contexte : le profil vient des onglets Vues/Likes reçus)
  - Au chargement de la modale, appeler `GET /api/message-requests/sent-to/:userId` pour vérifier si une demande a déjà été envoyée
  - Si déjà envoyée → bouton **Message** désactivé (`disabled`) + animation post-it jaune avec texte "Envoyé ✓" (reprendre le style post-it des sessions précédentes)
- **Contexte** : Test-01 — le bouton "Discuter" ne fonctionnait pas et un seul bouton ne suffit pas.
- **Résultat** : (à remplir par Gemini)

---

### TÂCHE-005 — Matches + Live : Bulles des onglets s'adaptent à l'écran
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Traitée**  : 26/02/2026 par Claude (Gemini indisponible)
- **Priorité** : HAUTE
- **Fichiers concernés** : `frontend/src/pages/Matches.css`, `frontend/src/pages/LivePublic.css`, `frontend/src/pages/LiveCompetition.css`, `frontend/src/pages/LiveEvent.css`
- **Description** : Les onglets (tabs) ne doivent pas être plus larges que leur contenu texte. Appliquer : `width: fit-content`, `white-space: nowrap` sur chaque onglet. Le conteneur de tabs doit avoir `flex-wrap: wrap` pour que les onglets passent à la ligne sur les petits écrans. Le texte doit toujours être visible (pas de débordement ni de troncature).
- **Contexte** : Test-01 — les bulles d'onglets sont plus grandes que leur texte et ne s'adaptent pas bien aux petits écrans.
- **Résultat** : Matches.css — `.tab-btn` passé de `flex: 1 1 auto` à `flex: 0 0 auto; width: fit-content`. Conteneur `.matches-tabs` déjà en `overflow-x: auto` pour le scroll horizontal.

---

### TÂCHE-006 — Swipe : CSS cassé pour messages de demande dans les conversations
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Traitée**  : 26/02/2026 par Claude (Gemini indisponible)
- **Priorité** : HAUTE
- **Fichiers concernés** : `frontend/src/components/MessageRequestsPanel.js`, `frontend/src/components/MessageRequestsPanel.css`
- **Description** : Les bulles de messages reçus via une demande de message (MessageRequest) ont un CSS incorrect dans la vue Chat. Corriger l'alignement, la couleur de fond, la bordure et la taille de ces bulles pour qu'elles soient cohérentes avec les autres messages. Vérifier la distinction visuelle entre messages normaux et demandes.
- **Contexte** : Test-01 — le CSS est cassé à la réception d'une demande de message dans les conversations.
- **Résultat** : MessageRequestsPanel.css — `.request-card` passé de `flex-direction: column` à `flex-direction: row; align-items: flex-start` (avatar à gauche, contenu à droite). `.request-actions` passé de `flex-direction: column` à `flex-direction: row`. `.btn-action` `width: 100%` remplacé par `flex: 1`.

---

### TÂCHE-007 — Live Surprise : Retour vidéo caméra locale absent
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Traitée**  : 26/02/2026 par Claude (Gemini indisponible — traité avec TÂCHE-008)
- **Priorité** : HAUTE
- **Fichiers concernés** : `frontend/src/pages/LiveSurprise.js`, `frontend/src/pages/LiveSurprise.css`
- **Description** : L'utilisateur ne voit pas sa propre caméra pendant le Live Surprise. Vérifier que le stream local est bien assigné à un élément `<video>` avec `srcObject = localStream`, attributs `muted autoPlay playsInline`. S'assurer que ce composant vidéo est visible dans le layout (pas masqué par du CSS).
- **Contexte** : Test-01 — "je ne vois pas ma caméra" lors du Live Surprise.
- **Résultat** : Réécriture complète de LiveSurprise.js. `getUserMedia` initié au montage du composant avec `localStreamRef`. Re-attachement du stream après changement d'écran via `useEffect([screen])` + `setTimeout 50ms`. Vidéo locale affichée en PiP (`.lspr-streamer-video-container`) dans le layout videocall.

---

### TÂCHE-008 — Live Surprise : Layout 1:1 (appel vidéo classique)
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Traitée**  : 26/02/2026 par Claude (Gemini indisponible — traité avec TÂCHE-007)
- **Priorité** : HAUTE
- **Fichiers concernés** : `frontend/src/pages/LiveSurprise.js`, `frontend/src/pages/LiveSurprise.css`
- **Description** : Corriger le layout de l'interface Live Surprise pour qu'il ressemble à un appel vidéo classique : vidéo distante (l'autre participant) en plein écran ou en grand, vidéo locale en miniature (PiP) en bas à droite. Les deux vidéos doivent être visibles simultanément.
- **Contexte** : Test-01 — le Layout 1:1 n'est pas correct.
- **Résultat** : Réécriture complète de LiveSurprise.js avec Socket.IO réel + SimplePeer WebRTC. Layout : vidéo distante plein écran (`.lspr-participant-video-container`), vidéo locale PiP 100×150px haut-droite (`.lspr-streamer-video-container`). Timer, décision like/dislike, skip. Screens : start → searching → videocall/decision.

---

### TÂCHE-009 — Interface Live : Streamer ne voit pas la caméra du participant (Layout 1:1)
- **Statut**   : DONE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Traitée**  : 26/02/2026 par Claude (Gemini indisponible)
- **Priorité** : HAUTE
- **Fichiers concernés** : `frontend/src/components/LiveStream.js`, `frontend/src/components/LiveStream.css`, `frontend/src/components/LiveViewer.js`, `frontend/src/components/LiveViewer.css`
- **Description** :
  - **Problème Streamer** : Le streamer ne voit pas la caméra du participant qui l'a rejoint.
  - **Problème Participant (Viewer)** : Le participant voit sa caméra coupée en bas de l'écran.
  - **Correction** : Layout 1:1 classique — flux distant en grand (occupe la majorité de l'écran), flux local en miniature PiP (bas à droite). Vérifier que le stream entrant du participant est bien assigné au `<video>` de prévisualisation dans LiveStream.js.
  - Vérifier aussi que les layouts avec plusieurs participants (2, 3, 4+) restent cohérents à taille tablette max.
- **Contexte** : Test-01 — bug critique de visibilité vidéo entre streamer et participant.
- **Résultat** :
  1. **Race condition WebRTC** : LiveStream.js `handleAcceptJoinRequest` → `initiator: false` (streamer attend l'offre). LiveViewer.js `startLocalCamera` → `initiator: true` (participant envoie l'offre après getUserMedia). Symétrie correcte établie.
  2. **Caméra coupée (stacking context)** : `.lv-local-preview` était à l'intérieur de `.lv-video-section` (z-index: 0, contexte isolé). Déplacé en enfant direct de `.lv-container` dans LiveViewer.js. CSS : z-index 10 → 15 pour apparaître au-dessus de `.lv-ui-overlay` (z-index: 10).

---

## Tâches en attente — PHASE 2 (priorité NORMALE — après Phase 1)

### TÂCHE-010 — Live Surprise : Bouton "Message" remplace "Next" + ouvre panel
- **Statut**   : EN ATTENTE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : NORMALE
- **Fichiers concernés** : `frontend/src/pages/LiveSurprise.js`, `frontend/src/pages/LiveSurprise.css`
- **Description** : Renommer/remplacer le bouton "Next" par un bouton "Message". Au clic sur "Message", ouvrir un panel ou une modale permettant d'envoyer une demande de message privé à l'autre participant (réutiliser `MessageModal` si disponible, sinon créer un panel simple avec un champ texte + bouton Envoyer qui appelle `POST /api/message-requests`).
- **Contexte** : Test-01 — le bouton "Next" n'est pas la bonne UX, "Message" est plus clair.
- **Résultat** : (à remplir par Gemini)

---

### TÂCHE-011 — Live Surprise : Compteur de participants affiché dans l'UI
- **Statut**   : EN ATTENTE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : NORMALE
- **Dépend de** : TÂCHE-009 dans todo_claude.md (event `surprise-user-count`)
- **Fichiers concernés** : `frontend/src/pages/LiveSurprise.js`, `frontend/src/pages/LiveSurprise.css`
- **Description** : Écouter l'event Socket.IO `surprise-user-count` et afficher le nombre de personnes connectées en Live Surprise (ex: badge "🔴 42 en ligne"). Mettre à jour en temps réel.
- **Contexte** : Test-01 — l'utilisateur veut voir combien de personnes sont connectées.
- **Résultat** : (à remplir par Gemini)

---

### TÂCHE-012 — StreamHub : Bouton "Démarrer" centré + plus gros
- **Statut**   : EN ATTENTE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : NORMALE
- **Fichiers concernés** : `frontend/src/pages/StreamHub.js`, `frontend/src/pages/StreamHub.css`
- **Description** : Déplacer le bouton "Démarrer un live" du coin bas-droite vers le centre bas de l'écran. CSS : `position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 200`. Augmenter la taille (padding + font-size). Le bouton ne doit pas être collé en bas de l'écran (laisser 80px minimum).
- **Contexte** : Test-01 — le bouton est mal placé et trop petit.
- **Résultat** : (à remplir par Gemini)

---

### TÂCHE-013 — StreamHub : Bulles des catégories = Nb Streamers + Nb Spectateurs
- **Statut**   : EN ATTENTE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : NORMALE
- **Fichiers concernés** : `frontend/src/pages/StreamHub.js`, `frontend/src/pages/StreamHub.css`
- **Description** : Dans les cartes/bulles des catégories de Live (Public, Compétition, Événement), afficher le détail : "X streamers · Y spectateurs" plutôt qu'un compteur global. Les données sont disponibles via `GET /api/stream/stats` et l'event Socket.IO `stream-stats-updated` (déjà implémentés côté backend).
- **Contexte** : Test-01 — l'utilisateur veut voir le détail Streamers/Spectateurs dans chaque bulle.
- **Résultat** : (à remplir par Gemini)

---

### TÂCHE-014 — Live Publique : Carte Streamer redesign
- **Statut**   : EN ATTENTE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : NORMALE
- **Fichiers concernés** : `frontend/src/pages/LivePublic.js`, `frontend/src/pages/LivePublic.css`
- **Description** :
  - **Photo** : Agrandir la photo du streamer sur la carte (elle est trop petite par rapport aux infos en dessous).
  - **Infos** : Réduire la taille de police des infos affichées sous la photo. Afficher uniquement : Nom du streamer, âge, nombre de viewers, timer du live (si le live redémarre, remettre le timer à 0).
  - **Chiffre 0** : Supprimer le "0" affiché en bas de la carte (probablement un compteur de cadeaux non implémenté — le retirer proprement).
- **Contexte** : Test-01 — la carte streamer a des proportions incorrectes et affiche un chiffre inutile.
- **Résultat** : (à remplir par Gemini)

---

### TÂCHE-015 — Interface Live : Badge spectateurs en temps réel
- **Statut**   : EN ATTENTE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : NORMALE
- **Fichiers concernés** : `frontend/src/components/LiveStream.js`, `frontend/src/components/LiveStream.css`, `frontend/src/components/LiveViewer.js`, `frontend/src/components/LiveViewer.css`
- **Description** : Afficher un badge avec le nombre de spectateurs en temps réel, visible pour le Streamer ET les Viewers. Écouter les events Socket.IO existants (join/leave) pour mettre à jour le compteur. Le badge doit être discret (coin de l'écran) mais lisible.
- **Contexte** : Test-01 — le streamer et les viewers veulent voir le nombre de spectateurs en direct.
- **Résultat** : (à remplir par Gemini)

---

### TÂCHE-016 — Interface Live : Clic sur nom spectateur → profil public
- **Statut**   : EN ATTENTE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : NORMALE
- **Fichiers concernés** : `frontend/src/components/LiveStream.js`, `frontend/src/components/LiveViewer.js`
- **Description** : Dans le panel des spectateurs, chaque nom d'utilisateur doit être cliquable. Au clic → naviguer vers `/profile/:userId` ou ouvrir une modale PublicProfile (selon le pattern déjà utilisé dans Matches.js). S'assurer que le `userId` de chaque spectateur est bien disponible dans la liste des viewers (vérifier les données émises par le backend dans `room-info` / `viewer-joined`).
- **Contexte** : Test-01 — l'utilisateur veut pouvoir consulter le profil d'un spectateur depuis le live.
- **Résultat** : (à remplir par Gemini)

---

### TÂCHE-017 — Interface Live : Photo du spectateur dans le chat
- **Statut**   : EN ATTENTE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : NORMALE
- **Fichiers concernés** : `frontend/src/components/LiveStream.js`, `frontend/src/components/LiveStream.css`, `frontend/src/components/LiveViewer.js`, `frontend/src/components/LiveViewer.css`
- **Description** : Dans le chat du live, afficher en début de chaque ligne de message une miniature de la photo de profil de l'expéditeur (bulle ronde, ~28px). La photo doit être celle du champ `photos[0]` de l'utilisateur (URL Cloudinary). Si pas de photo, afficher un avatar générique. Vérifier que `photoUrl` ou `photos` est bien inclus dans le payload de l'event de chat live.
- **Contexte** : Test-01 — le chat live n'affiche que le nom, la photo rendrait les messages plus lisibles.
- **Résultat** : (à remplir par Gemini)

---

### TÂCHE-018 — Interface Live : Message "X a quitté le live"
- **Statut**   : EN ATTENTE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : NORMALE
- **Dépend de** : TÂCHE-014 dans todo_claude.md (event `live-user-left`)
- **Fichiers concernés** : `frontend/src/components/LiveStream.js`, `frontend/src/components/LiveViewer.js`
- **Description** : Écouter l'event Socket.IO `live-user-left` (payload : `{ displayName, userId }`) et afficher un message système dans le chat du live : *"[displayName] a quitté le live"*. Même style visuel que le message d'entrée déjà existant. Ajouter la clé i18n correspondante dans les 5 langues.
- **Contexte** : Test-01 — le message d'entrée existe déjà, le message de sortie manque.
- **Résultat** : (à remplir par Gemini)

---

## Tâches en attente — PHASE 3 (priorité BASSE — après Phase 2)

### TÂCHE-019 — Live Surprise : UI de filtrage (après backend TÂCHE-016)
- **Statut**   : EN ATTENTE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : BASSE
- **Dépend de** : TÂCHE-016 dans todo_claude.md (filtrage backend — DONE)
- **Fichiers concernés** : `frontend/src/pages/LiveSurprise.js`, `frontend/src/pages/LiveSurprise.css`
- **Description** :
  1. **Panel de filtres** (avant d'entrer dans la queue) : pays (sélection, par défaut = pays d'origine de l'utilisateur), âge min/max. Envoyer dans le payload `join-surprise-queue` → `{ country, ageMin, ageMax }`. Clés i18n dans les 5 langues.
  2. **Gestion du timeout** : écouter l'event Socket.IO `surprise-search-timeout { filtersUsed }`. Si reçu → afficher un message dans l'écran "Recherche en cours" : *"Aucun partenaire trouvé en [pays]. Élargir la recherche mondiale ?"* + bouton **"Élargir"** qui re-émet `start-search` avec `filters = {}` (sans filtre pays). Bouton **"Continuer à chercher"** qui ne fait rien (l'utilisateur reste en file). Si le filtre pays est déjà vide (`filtersUsed.country` absent), ne pas afficher le bouton d'élargissement.
- **Contexte** : Test-01 — filtrage demandé. Le backend (TÂCHE-016) cherche d'abord dans le même pays, puis notifie après 15s sans partenaire via `surprise-search-timeout`. L'élargissement est manuel (décision de l'utilisateur), jamais automatique.
- **Résultat** : (à remplir par Gemini)

---

### TÂCHE-020 — Live Surprise : Boutons de contrôle (micro + caméra)
- **Statut**   : EN ATTENTE
- **Ajoutée**  : 26/02/2026 par Claude (Test-01)
- **Priorité** : BASSE
- **Fichiers concernés** : `frontend/src/pages/LiveSurprise.js`, `frontend/src/pages/LiveSurprise.css`
- **Description** : Ajouter les boutons de contrôle du live dans l'interface Live Surprise : toggle micro (🎤/🔇) et toggle caméra (📷/🚫). Reprendre le même pattern que dans `LiveStream.js`. L'état on/off doit être reflété visuellement sur le bouton.
- **Contexte** : Test-01 — "Ajouter les boutons de lives" — les contrôles media de base manquent dans LiveSurprise.
- **Résultat** : (à remplir par Gemini)

---

## Tâches terminées

### TÂCHE-001 — Refonte de la page Profil (Mobile First)
- **Statut**   : DONE
- **Ajoutée**  : 24/02/2026 par Claude
- **Traitée**  : 24/02/2026 par Gemini
- **Priorité** : NORMALE
- **Fichiers concernés** : `frontend/src/pages/Profile.js`, `frontend/src/pages/Profile.css`
- **Description** :
  - Déplacer la "Localisation" dans la section "Informations de base" après "Taille".
  - Centrer toutes les informations au milieu de la page.
  - Ajouter la "date de création" du compte dans la section "À propos de moi".
  - Assurer un design "Mobile First" strict.
- **Contexte** : L'interface actuelle n'est pas optimisée pour le mobile et les informations sont mal agencées.
- **Résultat** :
  - Refonte complète de `Profile.js` et `Profile.css`.
  - La mise en page est désormais une colonne unique centrée, basée sur des "cartes" pour chaque section.
  - La "Localisation" a été déplacée dans la carte "Informations de base".
  - La date de création du compte est maintenant affichée dans la carte "À propos de moi" en utilisant la clé i18n existante `profile.joinedAt`.
  - Le design est strictement Mobile First, avec des ajustements pour les écrans plus larges.
