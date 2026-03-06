# 🚀 Roadmap Notion – Conformité GloboStream

## 🧱 Structure recommandée dans Notion
Créer une base de données avec :
- Statut (À faire / En cours / Fait)
- Priorité (Haute / Moyenne / Basse)
- Responsable
- Catégorie (RGPD / Modération / Sécurité / Legal)

---

# 🔥 PHASE 1 — CRITIQUE (à faire en premier)

## 🔐 RGPD Backend
- [ ] Ajouter champ consent dans User
- [ ] Stocker consentement (date, version, IP)
- [ ] Créer versioning consentement

## 👤 Droits utilisateur
- [ ] Route DELETE /delete-account
- [ ] Suppression complète (DB + Cloudinary)
- [ ] Route GET /export-data

## 🚨 Signalement
- [ ] Créer modèle Report
- [ ] Route POST /reports
- [ ] Route GET /reports
- [ ] Route PATCH /reports

## 🎯 Frontend signalement
- [ ] Bouton signaler profil
- [ ] Bouton signaler message
- [ ] Bouton signaler live

---

# ⚡ PHASE 2 — SÉCURITÉ & MODÉRATION

## 🛡️ Sécurité
- [ ] Logs accès admin
- [ ] Audit accès base de données
- [ ] Vérification chiffrement

## 🧑‍⚖️ Modération
- [ ] Connecter reports au panel admin
- [ ] Historique actions modération
- [ ] Associer modérateur à action

## 🔴 Live streaming
- [ ] Signalement en live
- [ ] Logs des actions live
- [ ] Kick / block optimisé

---

# 🧾 PHASE 3 — LÉGAL

## Documents
- [ ] Rédiger CGU
- [ ] Politique de confidentialité
- [ ] Mentions légales
- [ ] Politique de modération

## RGPD
- [ ] Créer registre de traitement
- [ ] Définir durée conservation

---

# 🔞 PHASE 4 — PROTECTION UTILISATEUR

- [ ] Bloquer -18 ans
- [ ] Vérification âge inscription
- [ ] Système anti-abus (basique)

---

# ☁️ PHASE 5 — INFRASTRUCTURE

- [ ] Vérifier localisation serveurs (UE)
- [ ] Vérifier MongoDB Atlas
- [ ] Vérifier Cloudinary
- [ ] Signer DPA prestataires

---

# 💸 PHASE 6 — MONÉTISATION (T-052)

- [ ] Intégration Stripe
- [ ] Création wallet backend
- [ ] Gestion transactions
- [ ] TVA & facturation
- [ ] Préparer KYC (si retrait)

---

# ✅ CHECK FINAL (GO LIVE)

- [ ] Consentement conforme
- [ ] Suppression compte OK
- [ ] Signalement fonctionnel
- [ ] Modération active
- [ ] Documents légaux publiés

---

# 🧠 CONSEIL

Toujours prioriser :
1. RGPD
2. Signalement
3. Sécurité

Le reste peut évoluer après lancement.
