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

## Tâches en attente

*(Aucune tâche en attente)*

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
