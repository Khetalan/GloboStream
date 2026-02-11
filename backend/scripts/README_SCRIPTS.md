# 🎭 Scripts de Génération de Profils de Test

## 📋 Scripts Disponibles

### 1. `generateFakeProfiles.js` - Générer 20 profils
Crée 20 profils aléatoires avec toutes les informations nécessaires pour tester l'application.

### 2. `cleanFakeProfiles.js` - Nettoyer les profils de test
Supprime tous les profils de test (email @test.com) de la base de données.

---

## 🚀 Utilisation

### Générer les Profils

```bash
cd backend/scripts
node generateFakeProfiles.js
```

**Sortie attendue :**
```
✅ MongoDB connecté
🚀 Génération de 20 profils...

✅ Profil 1/20: Lucas M. (homme, 28 ans, Paris)
✅ Profil 2/20: Thomas D. (homme, 32 ans, Lyon)
...
✅ Profil 20/20: Inès G. (femme, 25 ans, Montpellier)

🎉 20 profils générés avec succès !

📊 Répartition:
   - 10 hommes
   - 10 femmes
   - Âges: 22-45 ans
   - 10 villes différentes
   - 2-4 photos par profil
   - Intérêts, langues, et préférences variés
   - ~15% en live streaming
   - ~30% profils vérifiés
   - ~20% premium

🔐 Identifiants de connexion:
   Email: [prenom].[nom][numero]@test.com
   Password: password123

   Exemples:
   - lucas.martin0@test.com (Lucas M.)
   - emma.dubois10@test.com (Emma D.)
   - thomas.robert1@test.com (Thomas R.)
```

### Nettoyer les Profils de Test

```bash
cd backend/scripts
node cleanFakeProfiles.js
```

**Sortie attendue :**
```
⚠️  ATTENTION: Cette action va supprimer TOUS les profils avec @test.com
Appuyez sur Ctrl+C pour annuler, ou attendez 3 secondes...

✅ MongoDB connecté
🗑️  Suppression des profils de test...

✅ 20 profils de test supprimés
👋 Connexion MongoDB fermée
```

---

## 📊 Caractéristiques des Profils Générés

### Données Aléatoires

**Informations de base :**
- 10 hommes, 10 femmes
- Âges : 22-45 ans
- Taille : 165-195cm (H), 155-180cm (F)

**Localisation :**
- 10 villes françaises : Paris, Lyon, Marseille, Toulouse, Nice, Nantes, Strasbourg, Bordeaux, Lille, Montpellier
- Coordonnées GPS réelles
- Pays : France

**Profil complet :**
- ✅ 2-4 photos par profil (URLs d'avatars)
- ✅ Bio personnalisée (15 templates différents)
- ✅ 3-6 centres d'intérêt (20 disponibles)
- ✅ 2-4 langues (10 disponibles)
- ✅ Profession (16 métiers différents)
- ✅ Enfants : Oui/Non/Non précisé
- ✅ Fumeur : Oui/Non/Rarement/Souvent
- ✅ Logement : Seul/Colocation/Parents/Étudiant/Autre
- ✅ Recherche : Relation sérieuse/Casual/Amitié
- ✅ Préférences de recherche configurées

**Statuts spéciaux :**
- ~15% en live streaming
- ~30% profils vérifiés (badge bleu)
- ~20% premium (badge or)
- Tous actifs dans les 7 derniers jours

**Photos :**
- 2-4 photos par profil
- Première photo = photo principale
- URLs : https://i.pravatar.cc (avatars génériques)

---

## 🎯 Cas d'Usage

### Test du Système de Swipe
```bash
# 1. Générer les profils
node generateFakeProfiles.js

# 2. Se connecter avec un compte
# 3. Aller sur la page Swipe
# 4. Profils variés s'affichent
# 5. Tester les swipes
```

### Test des Filtres
```bash
# 1. Avoir les 20 profils générés
# 2. Cliquer sur "Filtres" dans Swipe
# 3. Tester différents filtres:
   - Âge : 25-35 ans
   - Distance : 50 km
   - Genre : Femmes seulement
   - Langues : Anglais + Espagnol
   - Intérêts : Sport + Voyages
   - Fumeur : Non-fumeur
   - Enfants : Sans enfants
```

### Test des Matchs
```bash
# 1. Swiper plusieurs profils
# 2. Aller sur la page Matchs
# 3. Voir les profils likés
# 4. Simuler des matchs mutuels
```

---

## 🔐 Connexion aux Profils de Test

**Format email :**
```
[prenom].[nom][numero]@test.com
```

**Exemples :**
```
lucas.martin0@test.com
thomas.dubois1@test.com
hugo.bernard2@test.com
emma.martin10@test.com
lea.dubois11@test.com
clara.bernard12@test.com
```

**Mot de passe universel :**
```
password123
```

---

## 📝 Personnalisation

### Modifier le nombre de profils

Dans `generateFakeProfiles.js`, ligne 79 :
```javascript
for (let i = 0; i < 20; i++) {  // Changer 20 par le nombre souhaité
```

### Changer la répartition H/F

Dans `generateFakeProfiles.js`, ligne 80 :
```javascript
const gender = i < 10 ? 'homme' : 'femme';  // 10 = moitié
```

### Ajouter des villes

Dans `generateFakeProfiles.js`, tableau `cities` (ligne 15) :
```javascript
const cities = [
  { city: 'Paris', country: 'France', coordinates: [2.3522, 48.8566] },
  { city: 'Votre Ville', country: 'Pays', coordinates: [lon, lat] },
  // ...
];
```

### Personnaliser les intérêts

Dans `generateFakeProfiles.js`, tableau `interestsList` (ligne 29) :
```javascript
const interestsList = [
  'Voyages', 'Sport', 'Musique',
  'Votre Intérêt',  // Ajouter ici
  // ...
];
```

---

## ⚠️ Important

### À faire AVANT de générer
1. ✅ Vérifier la connexion MongoDB dans le script
2. ✅ S'assurer que le modèle User est à jour
3. ✅ Backend doit être arrêté (éviter conflits)

### À faire APRÈS la génération
1. ✅ Vérifier dans MongoDB Compass que les profils sont créés
2. ✅ Tester la connexion avec un profil de test
3. ✅ Redémarrer le backend si nécessaire

### Nettoyage
- ⚠️ `cleanFakeProfiles.js` supprime TOUS les emails @test.com
- ⚠️ Pas de retour en arrière possible
- ⚠️ Attendre 3 secondes avant exécution (Ctrl+C pour annuler)

---

## 🐛 Dépannage

### Erreur : "MongoDB connection failed"
```bash
# Vérifier l'URI MongoDB dans le script
# Remplacer par votre URI Atlas
const MONGODB_URI = 'votre-uri-ici';
```

### Erreur : "Cannot find module './models/User'"
```bash
# Exécuter depuis le dossier backend/scripts
cd backend/scripts
node generateFakeProfiles.js

# OU ajuster le chemin dans le script
const User = require('../models/User');  # Remonter d'un niveau
```

### Profils non visibles dans l'app
```bash
# 1. Vérifier dans MongoDB Compass
# 2. Redémarrer le backend
# 3. Vider le cache du navigateur
# 4. Re-login
```

### Photos ne s'affichent pas
```bash
# Les URLs pravatar.cc nécessitent une connexion internet
# Alternative : Utiliser des placeholders locaux
```

---

## 📈 Statistiques Typiques

Après génération, vous devriez avoir :

```
Profils totaux : 20
├── Hommes : 10 (50%)
├── Femmes : 10 (50%)
├── Âge moyen : ~33 ans
├── Vérifiés : ~6 profils (30%)
├── Premium : ~4 profils (20%)
├── En live : ~3 profils (15%)
└── Photos : 50-80 au total
```

---

## 🎉 Résultat Final

Après exécution, vous aurez :
- ✅ 20 profils complets et variés
- ✅ Données réalistes pour tous les champs
- ✅ Photos de profil (avatars génériques)
- ✅ Préférences et filtres configurés
- ✅ Prêts pour test du swipe et des filtres
- ✅ Connexion possible avec password123

**Bon test ! 🚀**
