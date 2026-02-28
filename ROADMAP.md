# ROADMAP - GloboStream

> **Vision et évolution du projet sur 12 mois**

---

## Vision du Projet

**GloboStream** vise à révolutionner les rencontres en ligne en combinant :
- L'authenticité du face-à-face vidéo
- L'efficacité du matching intelligent
- La sécurité d'une modération active
- L'engagement d'expériences interactives

---

## Timeline Globale

```
Q1 2026 (Jan-Mar)  │ En cours - MVP (code écrit, à tester)
Q2 2026 (Avr-Juin) │ Amélioration & Croissance
Q3 2026 (Juil-Sep) │ Fonctionnalités Premium
Q4 2026 (Oct-Déc)  │ Expansion & Scale
```

---

## PHASE 1 : MVP ✅ FONCTIONNEL
**Janvier - Mars 2026**

### Objectif
Créer une application fonctionnelle avec les fonctionnalités essentielles pour valider le concept.

### Fonctionnalités ✅ Complétées

**Authentification**
- [x] Inscription/Connexion email (9 bugs corrigés)
- [x] OAuth Google/Facebook (structure) + Apple (email duplicate check corrigé)
- [x] JWT sécurisé (payload `{ userId }`)

**Profil Utilisateur**
- [x] Upload 6 photos (Cloudinary persistant)
- [x] 20+ champs de profil
- [x] Géolocalisation GPS
- [x] Autocomplétion ville

**Swipe & Matching**
- [x] Système de swipe fluide (drag & drop Framer Motion)
- [x] 10 filtres avancés (FiltersPanel)
- [x] Calcul distance GPS Haversine
- [x] Détection matchs auto
- [x] Modale profil → carte centrée scrollable (480px, border-radius 20px)

**Messagerie**
- [x] Chat temps réel (Socket.IO)
- [x] Demandes de messages
- [x] Emoji picker (emoji-picker-react)
- [ ] Notifications push (Phase 2)

**Live Streaming**
- [x] Live Surprise : WebRTC P2P, timer 3/5/8/10 min, filtres genre/langues/âge/pays
- [x] Live Publique : StreamCard redesignée, FAB, filtres onglets
- [x] LiveCompetition : règlement + CompStreamCard + FAB équipe + badge TAG
- [x] LiveEvent / Thématiques : 8 thèmes colorés, compteur par thème
- [x] LiveStream streamer : contrôles mic/cam, kick, watermark anti-capture
- [x] LiveViewer spectateur : WebRTC, chat, panel viewers, PiP cam-off
- [x] StreamHub : stats temps réel Socket.IO
- [ ] WebRTC multi-participants (Phase 2 — actuellement 1-on-1)

**Équipes & Compétitions** *(réalisé en avance — Phase MVP)*
- [x] Modèle Team (captain/members/joinRequests/grades/TAG/chat)
- [x] Modèle Competition (CRUD admin)
- [x] TeamPage : 4 onglets, candidatures, chat temps réel, grades, emoji picker
- [x] Système de candidatures (bug populate corrigé)

**Modération**
- [x] 4 niveaux privilèges (User/Mod/Admin/SuperAdmin)
- [x] Panel complet (18 tests passés ✅)
- [x] Actions modération (avertir, bannir, débannir, promouvoir)

**Interface & UX**
- [x] 19 pages frontend (testées visuellement)
- [x] Dark mode (thème sombre par défaut)
- [x] Responsive CSS mobile-first (3 tailles testées)
- [x] Animations Framer Motion
- [x] RGPD : ConsentModal + page Legal (CGU/Confidentialité/Mentions) + watermark

**Infrastructure**
- [x] Architecture scalable (Express + MongoDB Atlas)
- [x] Socket.IO temps réel
- [x] Design responsive (CSS mobile-first)
- [x] i18n 5 langues (FR/EN/IT/DE/ES — ~700 clés)
- [x] Déploiement (Render backend + GitHub Pages frontend)
- [x] 210 tests Jest backend (100% passent)
- [x] Build 0 warning — 348 KB JS / 26 KB CSS

### Métriques de Succès
- [x] Application fonctionnelle (148 fonctionnalités)
- [x] 0 warning ESLint (37 corrigés)
- [x] 26 bugs corrigés
- [x] Code maintenable
- [x] Déployé et accessible publiquement

---

## PHASE 2 : AMÉLIORATION & CROISSANCE
**Avril - Juin 2026**

### Objectif
Améliorer l'expérience utilisateur, corriger les bugs, et préparer le lancement public.

### Fonctionnalités Prévues

**Q2.1 - Avril 2026**

**Améliorations UX**
- [ ] Onboarding interactif (tutoriel)
- [ ] Tour guidé des fonctionnalités
- [ ] Conseils profil (complétion)
- [ ] Suggestions amélioration profil

**Notifications Push**
- [ ] Intégration Firebase/OneSignal
- [ ] Notifications navigateur
- [ ] Notifications mobiles (PWA)
- [ ] Paramètres notifications granulaires

**Analytics & Tracking**
- [ ] Google Analytics
- [ ] Événements personnalisés
- [ ] Funnel conversion
- [ ] Heatmaps utilisateur

**Q2.2 - Mai 2026**

**Optimisation Performance**
- [ ] Lazy loading images
- [ ] Code splitting React
- [ ] Cache intelligent
- [ ] Compression assets
- [ ] CDN pour médias

**Améliorations Chat**
- [ ] Réactions emoji sur messages
- [ ] Réponses rapides
- [ ] Messages vocaux
- [ ] Partage localisation
- [ ] GIFs intégrés

**Q2.3 - Juin 2026**

**Système de Vérification**
- [ ] Vérification email
- [ ] Vérification téléphone (SMS)
- [ ] Vérification photo (selfie)
- [ ] Badge vérifié visible
- [ ] Boost visibilité profils vérifiés

**Signalement & Blocage**
- [ ] Signaler utilisateur/contenu
- [ ] Bloquer utilisateur
- [ ] Raisons signalement
- [ ] Dashboard signalements (mods)

### Objectifs Utilisateurs
- 1,000 utilisateurs inscrits
- 500 utilisateurs actifs/mois
- Taux rétention 30%+ à J30

---

## PHASE 3 : FONCTIONNALITÉS PREMIUM
**Juillet - Septembre 2026**

### Objectif
Monétisation et fonctionnalités premium pour générer des revenus.

### Fonctionnalités Prévues

**Q3.1 - Juillet 2026**

**Abonnement Premium (Stripe)**
- [ ] 3 plans : Basique, Premium, VIP
- [ ] Paiements sécurisés Stripe
- [ ] Gestion abonnements
- [ ] Essai gratuit 7 jours
- [ ] Annulation facile

**Fonctionnalités Premium**
- [ ] Swipes illimités
- [ ] Voir qui vous a liké
- [ ] Rewind (annuler swipe)
- [ ] Boost profil (visibilité x10)
- [ ] Super likes (5/jour)
- [ ] Passeport (changer localisation)
- [ ] Mode incognito
- [ ] Filtres avancés supplémentaires

**Q3.2 - Août 2026**

**Stories 24h**
- [ ] Upload photo/vidéo story
- [ ] Visible 24h
- [ ] Vues comptabilisées
- [ ] Réactions possibles
- [ ] Swipe up pour profil

**Événements & Soirées**
- [ ] Créer événements
- [ ] Speed dating organisé
- [ ] Soirées thématiques
- [ ] Inscription événements
- [ ] Matching événements

**Q3.3 - Septembre 2026**

**Jeux & Gamification**
- [ ] Ice breakers (questions)
- [ ] Quizz compatibilité
- [ ] Défis couples
- [ ] Badges récompenses
- [ ] Classements

**Cadeaux Virtuels**
- [ ] Boutique cadeaux
- [ ] Envoyer cadeaux
- [ ] Monnaie virtuelle
- [ ] Packs cadeaux

### Objectifs Revenus
- 100 abonnés premium
- 1,000€ MRR (Monthly Recurring Revenue)
- Conversion 10% gratuit -> premium

---

## PHASE 4 : EXPANSION & SCALE
**Octobre - Décembre 2026**

### Objectif
Croissance utilisateurs, expansion internationale, et optimisation à grande échelle.

### Fonctionnalités Prévues

**Q4.1 - Octobre 2026**

**Internationalisation** ✅ (réalisé en avance — Phase 1)
- [x] Support multi-langues (FR, EN, IT, DE, ES)
- [x] Traduction interface (22 fichiers, ~665 clés)
- [ ] Localisation dates/devises
- [x] Détection langue auto (i18next-browser-languagedetector)

**API Publique**
- [ ] API REST documentée
- [ ] Clés API développeurs
- [ ] Rate limiting
- [ ] SDK JavaScript

**Q4.2 - Novembre 2026**

**Applications Mobiles Natives**
- [ ] App iOS (React Native)
- [ ] App Android (React Native)
- [ ] Push notifications natives
- [ ] App Store & Play Store

**Intégrations Sociales**
- [ ] Partage réseaux sociaux
- [ ] Import contacts
- [ ] Invitations amis
- [ ] Parrainage récompensé

**Q4.3 - Décembre 2026**

**Intelligence Artificielle**
- [ ] Recommandations IA
- [ ] Détection photos inappropriées
- [ ] Modération automatique chat
- [ ] Suggestions conversations

**Statistiques Avancées**
- [ ] Dashboard analytics complet
- [ ] Insights profil
- [ ] Conseils personnalisés
- [ ] Rapports mensuels

### Objectifs Croissance
- 10,000 utilisateurs actifs
- 5,000€+ MRR
- Expansion 3 pays
- App mobile lancée

---

## PHASE 5 : VISION LONG TERME
**2027 et au-delà**

### Innovations Futures

**Réalité Augmentée**
- Filtres AR pour lives
- Essai virtuel looks
- Rendez-vous AR

**Matchmaking IA Avancé**
- Analyse comportementale
- Prédiction compatibilité
- Suggestions proactives

**Communauté & Social**
- Groupes d'intérêt
- Forums discussions
- Blogs utilisateurs

**Expansion Business**
- Modèle B2B (entreprises)
- Events IRL organisés
- Partenariats marques

---

## Métriques Clés par Phase

| Phase | Utilisateurs | MRR | Taux Rétention |
|-------|-------------|-----|----------------|
| MVP | 100 | 0€ | - |
| Croissance | 1,000 | 0€ | 30% |
| Premium | 5,000 | 1,000€ | 40% |
| Expansion | 10,000 | 5,000€ | 50% |
| Long Terme | 100,000+ | 50,000€+ | 60%+ |

---

## Processus de Développement

### Méthodologie
- **Agile/Scrum** : Sprints de 2 semaines
- **Release** : Tous les mois
- **Tests** : Avant chaque release
- **Feedback** : Collecte continue

### Priorités
1. **P0** : Critique (bugs bloquants)
2. **P1** : Important (fonctionnalités MVP)
3. **P2** : Utile (améliorations)
4. **P3** : Nice to have (bonus)

---

**Roadmap maintenue par** : Équipe GloboStream
**Dernière mise à jour** : 28 Février 2026
**Prochaine révision** : Mars 2026
