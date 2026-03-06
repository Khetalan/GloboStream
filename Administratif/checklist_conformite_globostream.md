# ✅ Checklist Conformité – GloboStream

## 🔐 1. RGPD – Système complet

### Consentement utilisateur
- [ ] Stocker le consentement en base de données (PAS localStorage)
- [ ] Ajouter : accepted, version, date, IP
- [ ] Versionner le consentement (ex: v1.0 - 2026-03)
- [ ] Forcer revalidation si mise à jour

### Données & traitement
- [ ] Créer un registre de traitement (document externe)
- [ ] Justifier chaque donnée collectée
- [ ] Supprimer les données inutiles
- [ ] Définir durée de conservation

### Droit des utilisateurs
- [ ] Route DELETE /delete-account (suppression complète)
- [ ] Supprimer : profil, messages, photos cloud
- [ ] Anonymiser les logs
- [ ] Route GET /export-data (JSON complet utilisateur)

### Sécurité
- [ ] Restreindre accès base de données
- [ ] Logger accès admin
- [ ] Vérifier chiffrement données sensibles
- [ ] Sécuriser tokens (httpOnly recommandé)
- [ ] Vérifier WebRTC (pas de fuite IP)

---

## 🚨 2. Système de signalement

### Fonctionnalités
- [ ] Bouton “Signaler” sur profils
- [ ] Bouton “Signaler” sur messages
- [ ] Bouton “Signaler” en live
- [ ] Bouton “Signaler” utilisateurs

### Backend
- [ ] Créer modèle Report
- [ ] Champs : reporterId, reportedUserId, type, reason, description, status, createdAt
- [ ] Route POST /reports
- [ ] Route GET /reports (admin)
- [ ] Route PATCH /reports/:id

### Modération
- [ ] Connecter reports au panel admin
- [ ] Historique des décisions
- [ ] Associer action à modérateur

### Process interne
- [ ] Définir SLA (24h urgent / 72h standard)
- [ ] Définir sanctions (warn, ban temporaire, ban définitif)

---

## 🔴 3. Live streaming (critique)

- [ ] Bouton signalement en live
- [ ] Système kick immédiat
- [ ] Système block utilisateur
- [ ] Logs des actions live
- [ ] (Option recommandé) délai stream 5–10 secondes

---

## 🔞 4. Gestion des mineurs

- [ ] Interdire -18 ans (recommandé)
- [ ] Vérification âge à l’inscription
- [ ] Bloquer accès si doute

---

## 🧾 5. Documents légaux

- [ ] CGU complètes
- [ ] Politique de confidentialité
- [ ] Mentions légales
- [ ] Politique de modération écrite

---

## ☁️ 6. Hébergement & données

- [ ] Vérifier localisation des serveurs (UE recommandé)
- [ ] Vérifier MongoDB Atlas région
- [ ] Vérifier Cloudinary stockage
- [ ] Signer DPA avec prestataires

---

## 💸 7. (Futur) Monnaie virtuelle

- [ ] Définir modèle économique clair
- [ ] Intégrer Stripe proprement
- [ ] Gérer facturation
- [ ] Gérer TVA
- [ ] Prévoir KYC si retrait utilisateurs

---

## 🚀 Priorité absolue avant lancement

- [ ] Consentement backend
- [ ] Suppression compte complète
- [ ] Système de signalement
- [ ] Modération opérationnelle
- [ ] Documents légaux propres

---

## 🧠 Rappel

Si ces points ne sont pas faits :
➡️ Risque juridique élevé
➡️ Refus App Store / Google Play
➡️ Perte de crédibilité

Si ces points sont faits :
➡️ Base solide
➡️ App publiable
➡️ Projet scalable
