# Checklist — Variables d'environnement `.env` GloboStream

Fichier à compléter : `GloboStream/backend/.env`
Fichier de référence : `GloboStream/backend/.env.example`

Légende : ✅ Configurée | ⚠️ Présente mais vide | ❌ Absente (à ajouter) | 🔒 Déjà OK

---

## 1. SERVEUR (déjà configuré)

| Variable | Statut | Valeur attendue |
|----------|--------|-----------------|
| `PORT` | 🔒 OK | `5000` |
| `NODE_ENV` | 🔒 OK | `development` (local) / `production` (Render) |
| `FRONTEND_URL` | 🔒 OK | `http://localhost:3000` (local) / URL Render (prod) |
| `MONGODB_URI` | 🔒 OK | URI MongoDB Atlas (déjà renseignée) |
| `JWT_SECRET` | 🔒 OK | Déjà renseignée |
| `SESSION_SECRET` | 🔒 OK | Déjà renseignée |

---

## 2. CLOUDINARY (uploads photos) ❌ ABSENT — À AJOUTER

> Cloudinary est utilisé dans `routes/users.js` pour les uploads de photos de profil.
> Si les uploads ne fonctionnent pas en local, c'est probablement la raison.

| Variable | Statut | Comment l'obtenir |
|----------|--------|-------------------|
| `CLOUDINARY_CLOUD_NAME` | ❌ Absent | Voir étapes ci-dessous |
| `CLOUDINARY_API_KEY` | ❌ Absent | Voir étapes ci-dessous |
| `CLOUDINARY_API_SECRET` | ❌ Absent | Voir étapes ci-dessous |

### Étapes pour obtenir les clés Cloudinary :
1. Va sur https://cloudinary.com → connecte-toi (ou crée un compte gratuit)
2. Dashboard → colonne de gauche → **Settings** → **API Keys**
3. Tu vois directement :
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → cliquer sur l'œil pour révéler → `CLOUDINARY_API_SECRET`
4. Copie les trois valeurs dans le `.env`

```env
CLOUDINARY_CLOUD_NAME=ton_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- [ ] `CLOUDINARY_CLOUD_NAME` ajouté dans `.env` local
- [ ] `CLOUDINARY_API_KEY` ajouté dans `.env` local
- [ ] `CLOUDINARY_API_SECRET` ajouté dans `.env` local
- [ ] Les trois variables ajoutées dans les **env vars Render**

---

## 3. STRIPE (paiements) ❌ ABSENT — À AJOUTER (Phase 6)

### 3a. Clé secrète API

| Variable | Statut | Comment l'obtenir |
|----------|--------|-------------------|
| `STRIPE_SECRET_KEY` | ❌ Absent | Voir étapes ci-dessous |

**Étapes :**
1. Va sur https://dashboard.stripe.com
2. Menu gauche → **Développeurs** → **Clés API**
3. Section "Clés secrètes" → **Afficher la clé de test** → copie `sk_test_xxx`
4. ⚠️ Pour la production : utiliser `sk_live_xxx` (uniquement après activation du compte Stripe)

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- [ ] Clé de test ajoutée dans `.env` local
- [ ] Clé de **production** (`sk_live_xxx`) ajoutée dans Render **après les tests**

---

### 3b. Secret webhook (développement local)

| Variable | Statut | Comment l'obtenir |
|----------|--------|-------------------|
| `STRIPE_WEBHOOK_SECRET` | ❌ Absent | Via Stripe CLI (local) |

**Étapes pour le développement local :**
1. Télécharge Stripe CLI : https://stripe.com/docs/stripe-cli
   - Windows : télécharge le `.zip` sur la page GitHub, extrait `stripe.exe`, place-le dans un dossier accessible
   - Ou via Scoop : `scoop install stripe`
2. Dans un terminal : `stripe login` → ouvre le navigateur → autorise
3. Dans un **second terminal** (laisser tourner) :
   ```
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
4. La CLI affiche :
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxx
   ```
5. Copie ce `whsec_xxx` dans le `.env`

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- [ ] Stripe CLI installée
- [ ] `stripe login` effectué
- [ ] `stripe listen` lancé lors des tests locaux
- [ ] `STRIPE_WEBHOOK_SECRET` (local) ajouté dans `.env`

---

### 3c. Price IDs (4 packs de pièces)

| Variable | Statut | Comment l'obtenir |
|----------|--------|-------------------|
| `STRIPE_PRICE_STARTER` | ❌ Absent | Créer dans Dashboard Stripe |
| `STRIPE_PRICE_POPULAR` | ❌ Absent | Créer dans Dashboard Stripe |
| `STRIPE_PRICE_PRO` | ❌ Absent | Créer dans Dashboard Stripe |
| `STRIPE_PRICE_MEGA` | ❌ Absent | Créer dans Dashboard Stripe |

**Étapes pour créer les 4 produits dans Stripe :**
1. Dashboard Stripe → **Catalogue de produits** → **+ Ajouter un produit**
2. Créer les 4 produits ci-dessous (en mode Test d'abord) :

| Pack | Nom produit | Prix suggéré | Coins inclus |
|------|-------------|-------------|-------------|
| Starter | Pack Starter — 100 pièces | 0,99 € | 100 (pas de bonus) |
| Populaire | Pack Populaire — 550 pièces | 3,99 € | 500 + 50 bonus |
| Pro | Pack Pro — 1150 pièces | 7,99 € | 1000 + 150 bonus |
| Méga | Pack Méga — 6000 pièces | 29,99 € | 5000 + 1000 bonus |

3. Pour chaque produit : Type de prix = **Ponctuel (one-time)** → Enregistrer
4. Clique sur chaque produit créé → copie l'**ID du prix** (`price_xxx`)

```env
STRIPE_PRICE_STARTER=price_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_POPULAR=price_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PRO=price_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_MEGA=price_xxxxxxxxxxxxxxxxxxxxxxxx
```

- [ ] Produit Starter créé + `STRIPE_PRICE_STARTER` ajouté
- [ ] Produit Populaire créé + `STRIPE_PRICE_POPULAR` ajouté
- [ ] Produit Pro créé + `STRIPE_PRICE_PRO` ajouté
- [ ] Produit Méga créé + `STRIPE_PRICE_MEGA` ajouté

---

## 4. TAUX DE CONVERSION ❌ ABSENT — À AJOUTER (Phase 6)

| Variable | Statut | Valeur | Explication |
|----------|--------|--------|-------------|
| `GLOBO_TO_COIN_RATE` | ❌ Absent | `1` (recommandé pour commencer) | 1 Globo = N Pièces lors d'une conversion |
| `MIN_WITHDRAWAL_GLOBOS` | ❌ Absent | `1000` | Minimum de Globos pour demander un retrait en argent réel |

> Ces deux valeurs sont librement définies par toi. Pas besoin d'un service externe.
> Tu peux les changer à tout moment (redémarrage du backend requis).

```env
GLOBO_TO_COIN_RATE=1
MIN_WITHDRAWAL_GLOBOS=1000
```

- [ ] `GLOBO_TO_COIN_RATE` ajouté dans `.env` local
- [ ] `MIN_WITHDRAWAL_GLOBOS` ajouté dans `.env` local
- [ ] Les deux variables ajoutées dans Render

---

## 5. OAUTH SOCIAL (déjà présent mais vide) ⚠️

> Ces variables sont déjà dans le `.env` mais non renseignées.
> À configurer uniquement quand tu veux activer la connexion via Google / Facebook / Apple.

| Variable | Statut |
|----------|--------|
| `GOOGLE_CLIENT_ID` | ⚠️ Vide |
| `GOOGLE_CLIENT_SECRET` | ⚠️ Vide |
| `FACEBOOK_APP_ID` | ⚠️ Vide |
| `FACEBOOK_APP_SECRET` | ⚠️ Vide |
| `APPLE_CLIENT_ID` | ⚠️ Vide |
| `APPLE_TEAM_ID` | ⚠️ Vide |
| `APPLE_KEY_ID` | ⚠️ Vide |

> ℹ️ Google OAuth : https://console.developers.google.com
> ℹ️ Facebook OAuth : https://developers.facebook.com
> ℹ️ Apple OAuth : https://developer.apple.com

---

## 6. EMAIL (déjà présent mais vide) ⚠️

> Utilisé pour l'envoi d'emails de vérification / reset de mot de passe.

| Variable | Statut |
|----------|--------|
| `EMAIL_USER` | ⚠️ Vide |
| `EMAIL_PASSWORD` | ⚠️ Vide |

> Pour Gmail : activer "Mot de passe d'application" dans les paramètres de sécurité du compte Google.

---

## 7. WEBHOOK STRIPE PRODUCTION ⏳ À FAIRE APRÈS LES TESTS

> **Ne pas faire maintenant.** À créer uniquement après avoir testé les paiements
> en mode test (avec `sk_test_xxx`) et validé que tout fonctionne correctement.

**Étapes (après validation des tests) :**
1. Passer le compte Stripe en mode Live (activer les paiements réels sur stripe.com)
2. Dashboard Stripe → **Développeurs** → **Webhooks** → **Ajouter un endpoint**
3. URL de l'endpoint : `https://[ton-app].onrender.com/api/payments/webhook`
4. Événement à sélectionner : `checkout.session.completed`
5. Clique sur **Ajouter l'endpoint**
6. Dans la page de l'endpoint créé → **Afficher le secret de signature** → copie `whsec_xxx`
7. Remplacer `STRIPE_WEBHOOK_SECRET` dans Render par ce nouveau secret de production
8. Remplacer `STRIPE_SECRET_KEY` dans Render par la clé `sk_live_xxx`
9. Redémarrer le service Render

- [ ] *(À faire après les tests)* Compte Stripe activé en mode Live
- [ ] *(À faire après les tests)* Endpoint webhook de production créé
- [ ] *(À faire après les tests)* `STRIPE_WEBHOOK_SECRET` (prod) mis à jour dans Render
- [ ] *(À faire après les tests)* `STRIPE_SECRET_KEY` (prod) mis à jour dans Render

---

## RÉCAPITULATIF — Ce qui manque dans le `.env` aujourd'hui

Copie-colle ce bloc dans ton `.env` et remplis les valeurs :

```env
# ── Cloudinary (photos profil) ────────────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ── Stripe ────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_
STRIPE_WEBHOOK_SECRET=whsec_

# Price IDs (créer dans Dashboard Stripe → Catalogue de produits)
STRIPE_PRICE_STARTER=price_
STRIPE_PRICE_POPULAR=price_
STRIPE_PRICE_PRO=price_
STRIPE_PRICE_MEGA=price_

# ── Taux de conversion (définir librement) ────────────────
GLOBO_TO_COIN_RATE=1
MIN_WITHDRAWAL_GLOBOS=1000
```

---

## VARIABLES RENDER — Liste complète des env vars à configurer en production

Toutes les variables ci-dessous doivent être ajoutées dans **Render → Dashboard → ton service → Environment** :

```
PORT=10000
NODE_ENV=production
MONGODB_URI=[URI Atlas production]
JWT_SECRET=[même valeur que local]
SESSION_SECRET=[même valeur que local]
FRONTEND_URL=https://[ton-domaine-github-pages].github.io
CLOUDINARY_CLOUD_NAME=[valeur Cloudinary]
CLOUDINARY_API_KEY=[valeur Cloudinary]
CLOUDINARY_API_SECRET=[valeur Cloudinary]
STRIPE_SECRET_KEY=sk_live_[après activation]
STRIPE_WEBHOOK_SECRET=whsec_[secret endpoint prod]
STRIPE_PRICE_STARTER=price_[id produit live]
STRIPE_PRICE_POPULAR=price_[id produit live]
STRIPE_PRICE_PRO=price_[id produit live]
STRIPE_PRICE_MEGA=price_[id produit live]
GLOBO_TO_COIN_RATE=1
MIN_WITHDRAWAL_GLOBOS=1000
```
