# ROADMAP COMPLETE - Détails Techniques

> **Guide détaillé de toutes les fonctionnalités passées, présentes et futures**

---

## Table des Matières

1. [Fonctionnalités MVP (à tester)](#fonctionnalités-mvp-à-tester)
2. [Phase 2 - Détails](#phase-2---amélioration--croissance)
3. [Phase 3 - Détails](#phase-3---premium)
4. [Phase 4 - Détails](#phase-4---expansion)
5. [Backlog Long Terme](#backlog-long-terme)

---

## FONCTIONNALITÉS MVP (À TESTER)

> Le code de ces fonctionnalités existe dans le repo mais aucune n'a été testée de manière complète.

### 1. AUTHENTIFICATION & COMPTE

**Inscription/Connexion** (code écrit)
- [ ] Email + mot de passe (validation format)
- [ ] Hash bcrypt (12 rounds)
- [ ] JWT avec expiration 7 jours
- [ ] Token stocké localStorage
- [ ] Refresh automatique token

**OAuth Google** (structure en place)
- [ ] Passport.js configuré
- [ ] Routes callback
- [ ] Liaison compte existant
- [ ] Création compte auto

**Changement Mot de Passe** (code écrit)
- [ ] Vérification ancien mot de passe
- [ ] Validation nouveau (min 6 chars)
- [ ] Vérification différence ancien/nouveau
- [ ] Hash bcrypt + sauvegarde

### 2. PROFIL UTILISATEUR

**Informations Basiques** (code écrit)
- [ ] Nom, prénom, âge
- [ ] Genre (homme/femme/autre)
- [ ] Orientation (hétéro/homo/bi)
- [ ] Date de naissance
- [ ] Bio (500 caractères)

**Photos** (code écrit)
- [ ] Upload 6 photos maximum
- [ ] Limite 5MB par photo
- [ ] Formats : JPEG, PNG, WebP
- [ ] Photo principale définissable
- [ ] Suppression individuelle
- [ ] Preview avant upload

**Localisation** (code écrit)
- [ ] GPS automatique (navigator.geolocation)
- [ ] Autocomplétion ville (Nominatim API)
- [ ] Sélection pays (47 pays)
- [ ] Stockage coordonnées (GeoJSON)
- [ ] Calcul distance (Haversine)

**Détails Profil** (code écrit)
- [ ] Taille (cm)
- [ ] Profession
- [ ] Langues parlées (15 langues)
- [ ] Centres d'intérêt (tags)
- [ ] Enfants (oui/non/peu importe)
- [ ] Fumeur (oui/non/occasionnel/souvent)
- [ ] Logement (propriétaire/locataire/autre)
- [ ] Type relation recherchée

**Badges** (code écrit)
- [ ] Badge vérifié
- [ ] Badge premium
- [ ] Badge en ligne
- [ ] Badge en direct (LIVE)

### 3. SWIPE & MATCHING

**Système de Swipe** (code écrit)
- [ ] Carte profil centrée
- [ ] Drag & drop fluide
- [ ] Rotation -30° à +30°
- [ ] 3 actions : Like / Message / Pass
- [ ] Animations Framer Motion
- [ ] Indicateurs visuels LIKE/NOPE

**Filtres Avancés** (code écrit)
1. [ ] Âge (min-max)
2. [ ] Distance (1-500 km)
3. [ ] Genre (multiples)
4. [ ] Taille (min-max cm)
5. [ ] Langues (au moins une commune)
6. [ ] Intérêts (au moins un commun)
7. [ ] Enfants
8. [ ] Fumeur
9. [ ] Type relation
10. [ ] En ligne maintenant

**Algorithme Matching** (code écrit)
- [ ] Exclusion profils déjà swipés
- [ ] Application filtres
- [ ] Calcul distance GPS
- [ ] Tri par proximité
- [ ] Limite 20 profils par chargement
- [ ] Détection match mutuel auto

**Page Matchs** (code écrit)
- [ ] Onglets : Matchs confirmés, Likes reçus, Vues profil
- [ ] Grille responsive
- [ ] Avatar + nom + distance
- [ ] Bouton chat rapide
- [ ] Compteurs dans onglets

### 4. MESSAGERIE

**Demandes de Messages** (code écrit)
- [ ] Modal envoi avec profil
- [ ] 5 messages prédéfinis
- [ ] 500 caractères max
- [ ] Post-it animé après envoi
- [ ] Panel notifications dans chat
- [ ] Acceptation/Refus par destinataire
- [ ] Match auto si accepté

**Chat Temps Réel** (code écrit)
- [ ] Socket.IO WebSocket
- [ ] Liste conversations
- [ ] Avatar + dernier message
- [ ] Heure relative (date-fns)
- [ ] Badge non lu avec compteur
- [ ] Indicateur en ligne
- [ ] Bulles messages stylées
- [ ] Indicateur "en train d'écrire..."
- [ ] Auto-scroll vers bas
- [ ] Timestamps messages
- [ ] Interface responsive mobile

### 5. LIVE STREAMING

**Live Surprise** (code écrit)
- [ ] Type Chatroulette + Speed Dating
- [ ] Connexion aléatoire
- [ ] Timer 3/5/8/10 minutes
- [ ] Skip après 30 secondes
- [ ] Décision Like/Dislike/Skip
- [ ] Match si mutuel
- [ ] WebRTC P2P (Simple-Peer)
- [ ] Contrôles caméra/micro

**Live Publique** (code écrit)
- [ ] Liste lives actifs
- [ ] 4 onglets filtres (Tendance, Alentours, Nouveau, Favoris)
- [ ] Recherche par nom/titre
- [ ] Cartes avec badge LIVE, compteur viewers, durée, tags, distance

**Chat Live** (code écrit)
- [ ] Messages temps réel
- [ ] Avatar + nom + badge
- [ ] Messages système
- [ ] Scroll auto
- [ ] 300 caractères max

### 6. MODÉRATION

**Niveaux de Privilèges** (code écrit)
- [ ] Niveau 0 : Utilisateur
- [ ] Niveau 1 : Modérateur
- [ ] Niveau 2 : Administrateur
- [ ] Niveau 3 : Super Admin

**Permissions Modérateur** (code écrit)
- [ ] Bannir utilisateurs
- [ ] Supprimer contenu
- [ ] Gérer streams
- [ ] Voir signalements
- [ ] Émettre avertissements
- [ ] Configurable par permission

**Panel Modération** (code écrit)
- [ ] Dashboard statistiques
- [ ] Liste utilisateurs (recherche/filtres)
- [ ] Gestion modérateurs
- [ ] Promouvoir/Révoquer
- [ ] Historique actions

**Navigation Conditionnelle** (code écrit)
- [ ] Bouton "Modération" si level >= 1
- [ ] Badge niveau dans menu
- [ ] Style distinct item modération

### 7. INTERFACE & UX

**Design System** (code écrit)
- [ ] Dark mode élégant
- [ ] Variables CSS cohérentes
- [ ] Gradients rose-violet
- [ ] Animations fluides
- [ ] Toasts notifications
- [ ] Loading states

**Navigation** (code écrit)
- [ ] Menu déroulant avatar
- [ ] Pages accessibles
- [ ] Responsive mobile
- [ ] Fermeture auto clic extérieur
- [ ] Badge modération conditionnel

**Pages** (code écrit)
- [ ] Landing (marketing)
- [ ] Login/Register
- [ ] Home (dashboard)
- [ ] Profile (complet)
- [ ] PublicProfile
- [ ] Swipe
- [ ] Matches
- [ ] Chat
- [ ] Settings
- [ ] Support
- [ ] ModerationPanel
- [ ] StreamHub
- [ ] LiveSurprise
- [ ] LivePublic

**Responsive** (code écrit)
- [ ] Mobile first
- [ ] Breakpoints : 480px, 768px, 968px
- [ ] Grids adaptatives
- [ ] Touch-friendly
- [ ] Swipe mobile optimisé

---

## PHASE 2 - AMÉLIORATION & CROISSANCE (Détails)

### AVRIL 2026

#### Onboarding Interactif

**Tutoriel Premier Lancement**
- [ ] Modal bienvenue
- [ ] 5 étapes guidées
- [ ] Progress bar
- [ ] Skip possible
- [ ] Sauvegarde progression

**Tour Guidé**
- [ ] Tooltips interactifs
- [ ] Spotlight sur éléments
- [ ] Navigation Suivant/Précédent
- [ ] Fermeture possible
- [ ] Ne plus afficher checkbox

**Suggestions Profil**
- [ ] Analyse complétude (%)
- [ ] Conseils personnalisés
- [ ] Badge profil complété

#### Notifications Push

**Configuration Firebase/OneSignal**
- [ ] Compte service créé
- [ ] SDK intégré frontend
- [ ] Service worker configuré
- [ ] Demande permission utilisateur

**Types Notifications**
- [ ] Nouveau match
- [ ] Message reçu
- [ ] Like reçu
- [ ] Demande message reçue
- [ ] Quelqu'un a vu votre profil
- [ ] Invitation live reçue

**Paramètres Granulaires**
- [ ] Toggle par type
- [ ] Heures silencieuses
- [ ] Fréquence (instant/résumé)

#### Analytics

**Google Analytics 4**
- [ ] Compte GA4 créé
- [ ] Tag manager installé
- [ ] Événements de base
- [ ] Événements personnalisés
- [ ] Funnel conversion

### MAI 2026

#### Optimisation Performance

**Images**
- [ ] Lazy loading
- [ ] Format WebP auto
- [ ] Responsive images (srcset)
- [ ] Compression optimale
- [ ] Placeholder blur

**Code Splitting**
- [ ] React.lazy sur pages
- [ ] Dynamic imports routes
- [ ] Vendor bundle séparé
- [ ] Suspense boundaries

**Cache**
- [ ] Service worker
- [ ] Cache API
- [ ] Stratégie cache-first photos
- [ ] Network-first données

**CDN**
- [ ] Cloudflare/CloudFront
- [ ] Assets statiques sur CDN
- [ ] Images sur CDN
- [ ] Cache headers optimaux

#### Améliorations Chat

**Réactions Emoji**
- [ ] Double-tap message -> Emoji
- [ ] 6 émojis rapides
- [ ] Affichage réaction sous message

**Réponses Rapides**
- [ ] Swipe message -> Répondre
- [ ] Citation message original

**Messages Vocaux**
- [ ] Enregistrement audio
- [ ] Max 60 secondes
- [ ] Waveform visualisation
- [ ] Lecture intégrée

**Partage Localisation**
- [ ] Bouton partager position
- [ ] Carte interactive
- [ ] Durée partage

**GIFs**
- [ ] Intégration Tenor/Giphy
- [ ] Recherche GIF
- [ ] Catégories populaires

### JUIN 2026

#### Vérification Utilisateurs

**Vérification Email**
- [ ] Envoi email avec lien
- [ ] Token expiration 24h
- [ ] Badge email vérifié

**Vérification Téléphone**
- [ ] SMS avec code (Twilio)
- [ ] Code 6 chiffres
- [ ] Expiration 10 minutes

**Vérification Photo**
- [ ] Upload selfie avec pose
- [ ] Comparaison IA avec photos profil
- [ ] Badge photo vérifiée
- [ ] Boost visibilité +50%

#### Signalement & Blocage

**Signaler Utilisateur**
- [ ] Bouton "Signaler" sur profil
- [ ] 6 raisons prédéfinies
- [ ] Optionnel : Bloquer aussi
- [ ] Confirmation envoi

**Bloquer Utilisateur**
- [ ] Bouton "Bloquer" sur profil
- [ ] Confirmation avec raison
- [ ] Invisible l'un pour l'autre
- [ ] Liste bloqués dans Settings

**Dashboard Signalements (Mods)**
- [ ] Liste tous signalements
- [ ] Filtres : statut, type, date
- [ ] Actions : Approuver, Rejeter, Bannir
- [ ] Statistiques

---

## PHASE 3 - PREMIUM (Détails)

### JUILLET 2026

#### Système Premium

**Implémentation Stripe**
- [ ] Compte Stripe créé
- [ ] Produits créés
- [ ] Prix configurés
- [ ] Webhooks configurés
- [ ] SDK intégré frontend
- [ ] Page paiement sécurisée
- [ ] Gestion abonnement (pause/cancel)

#### Fonctionnalités Premium

**Voir Likes Reçus**
- [ ] Onglet "Likes" déverrouillé
- [ ] Photos nettes (non floutées)

**Rewind**
- [ ] Bouton annuler dernier swipe
- [ ] Historique 10 derniers

**Boost**
- [ ] Boost 30 minutes
- [ ] Profil x10 visible
- [ ] Statistiques boost

**Passeport**
- [ ] Changer localisation
- [ ] Recherche ville
- [ ] Retour position réelle

**Mode Incognito**
- [ ] Invisible sauf matchs
- [ ] Toggle on/off

### AOÛT 2026

#### Stories 24h

- [ ] Upload photo/vidéo (max 15s)
- [ ] Filtres, texte, stickers
- [ ] Expiration 24h auto
- [ ] Compteur vues
- [ ] Réactions emoji
- [ ] Réponse message privé

#### Événements

- [ ] Formulaire création
- [ ] Liste événements avec filtres
- [ ] Inscription + paiement
- [ ] Speed dating virtuel
- [ ] Check-in QR code

### SEPTEMBRE 2026

#### Gamification

**Ice Breakers**
- [ ] 100 questions prédéfinies
- [ ] Catégories : fun, profond, coquin

**Quizz Compatibilité**
- [ ] 20 questions personnalité
- [ ] Calcul % compatibilité

**Badges Récompenses**
- [ ] 50 badges différents
- [ ] Affichage profil

**Classements**
- [ ] Top profils ville
- [ ] Top matchs semaine
- [ ] Top streamers

#### Cadeaux Virtuels

- [ ] 20 cadeaux virtuels
- [ ] Achat crédits
- [ ] Animation envoi
- [ ] Historique cadeaux

---

## PHASE 4 - EXPANSION (Détails)

### OCTOBRE 2026

#### Internationalisation
- [ ] 4 langues : FR, EN, ES, DE (react-i18next)
- [ ] Formats dates/heures localisés
- [ ] Devises et unités

#### API Publique
- [ ] OpenAPI/Swagger
- [ ] Clés API développeurs
- [ ] Rate Limiting
- [ ] SDK JavaScript

### NOVEMBRE 2026

#### Applications Mobiles
- [ ] React Native (iOS + Android)
- [ ] Fonctionnalités natives (push, géoloc, caméra)
- [ ] Publication App Store & Play Store

#### Intégrations Sociales
- [ ] Partage réseaux sociaux
- [ ] Import contacts
- [ ] Parrainage récompensé

### DÉCEMBRE 2026

#### Intelligence Artificielle
- [ ] Recommandations IA (TensorFlow)
- [ ] Modération auto images (AWS Rekognition)
- [ ] Modération auto texte (OpenAI Moderation)
- [ ] Suggestions conversations

#### Analytics Avancés
- [ ] Dashboard personnel
- [ ] Insights profil
- [ ] Rapports mensuels

---

## BACKLOG LONG TERME (Post-2026)

### Réalité Augmentée
- Filtres AR pour lives
- Essayage virtuel looks/maquillage
- Rendez-vous virtuels AR

### Matchmaking IA Poussé
- Analyse patterns comportementaux
- Prédiction compatibilité long terme
- Apprentissage continu

### Communauté
- Groupes d'intérêts
- Forums par thèmes
- Blogs utilisateurs
- Événements IRL réguliers

### Expansion Business
- Offre B2B entreprises (team building)
- Partenariats marques
- Coaching rencontres

### Features Innovantes
- Voice dating (appels audio anonymes)
- Slow dating (1 match/jour max)
- Double dates (matchs groupés)
- Travel buddy (rencontres voyage)

---

**Document maintenu par** : Équipe Produit GloboStream
**Dernière mise à jour** : Février 2026
**Statut** : Aucune fonctionnalité testée
