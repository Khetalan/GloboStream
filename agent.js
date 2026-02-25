#!/usr/bin/env node

/**
 * ============================================================
 *  GloboStream — Agent Orchestrateur IA v2.0
 * ============================================================
 *
 *  Délègue automatiquement chaque tâche au bon modèle IA :
 *
 *  🟢 Haiku        → Lire / résumer / mettre à jour des fichiers MD
 *  🔵 Sonnet       → Code backend courant (routes, middleware, utils)
 *  🟣 Opus         → Code complexe (WebRTC, architecture, refactor)
 *  🔶 Gemini Flash → CSS, composants React simples, i18n, nouvelles pages
 *  🔷 Gemini Pro   → Refonte visuelle complexe, pages multi-fichiers
 *
 *  ─── Usage CLI ───────────────────────────────────────────────
 *
 *  node agent.js read claude_session.md
 *  node agent.js update ROADMAP.md "Marque WebRTC multi-participants comme en cours"
 *  node agent.js session "Correction bug Apple OAuth + tests LiveCompetition"
 *
 *  node agent.js code "Crée une route Express pour les notifications" simple
 *  node agent.js code "Refactor WebRTC multi-participants" complex claude_context.md
 *
 *  node agent.js css "Modernise Navigation avec un effet glassmorphism" frontend/src/components/Navigation.js
 *  node agent.js react "Crée un composant NotificationBell avec animation Framer Motion"
 *  node agent.js page "Crée la page Notifications complète (JS + CSS + i18n)" complex
 *  node agent.js i18n "Ajoute les clés pour la page Notifications" frontend/src/pages/Notifications.js
 *
 *  node agent.js list
 *
 * ============================================================
 */

'use strict';

// Chargement automatique depuis backend/.env
try {
  require('dotenv').config({ path: require('path').resolve(__dirname, 'backend/.env') });
} catch { /* dotenv optionnel */ }

const Anthropic              = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs                     = require('fs');
const path                   = require('path');

// ─── Vérification des clés API ────────────────────────────────────────────────

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('\x1b[31m[ERREUR]\x1b[0m ANTHROPIC_API_KEY manquante dans backend/.env');
  process.exit(1);
}
if (!process.env.GOOGLE_GEMINI_API_KEY) {
  console.error('\x1b[31m[ERREUR]\x1b[0m GOOGLE_GEMINI_API_KEY manquante dans backend/.env');
  console.error('Obtenez une clé sur https://aistudio.google.com/app/apikey');
  process.exit(1);
}

const claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// ─── Modèles ──────────────────────────────────────────────────────────────────

const MODELS = {
  haiku:            'claude-haiku-4-5-20251001',
  sonnet:           'claude-sonnet-4-6',
  opus:             'claude-opus-4-6',
  // Gemini — compatibles free tier (Google AI Studio)
  // gemini-2.5-flash     : free tier 10 RPM / 250 requêtes/jour — tâches CSS, React, i18n
  // gemini-2.5-flash-lite: free tier 15 RPM / 1000 requêtes/jour — tâches simples et répétitives
  // Pour passer au payant : remplacer par 'gemini-2.5-pro' (meilleur raisonnement)
  geminiFlash:      'gemini-2.5-flash',
  geminiFlashLite:  'gemini-2.5-flash-lite',
};

// ⚠️  LIMITES FREE TIER GEMINI (réinitialisées chaque jour à minuit heure Pacifique)
// gemini-2.5-flash      → 10 req/min,  250 req/jour
// gemini-2.5-flash-lite → 15 req/min, 1000 req/jour
// Si tu vois une erreur 429, tu as atteint la limite — réessaie le lendemain ou passe au payant.

const PRIX = {
  haiku:           { input: 1.00,  output: 5.00  },
  sonnet:          { input: 3.00,  output: 15.00 },
  opus:            { input: 5.00,  output: 25.00 },
  geminiFlash:     { input: 0.30,  output: 2.50  }, // Gemini 2.5 Flash payant (free = $0)
  geminiFlashLite: { input: 0.10,  output: 0.40  }, // Gemini 2.5 Flash-Lite payant (free = $0)
};

// ─── Fichiers MD gérés ────────────────────────────────────────────────────────

const FICHIERS_MD = [
  'claude_context.md',
  'claude_session.md',
  'CLAUDE.md',
  'ROADMAP.md',
  'ROADMAP_COMPLETE.md',
  'docs/RAPPORT.md',
  'docs/MVP.md',
  'docs/POST_MVP.md',
  'README.md',
];

const LANGUES_I18N = ['fr', 'en', 'it', 'de', 'es'];

// ─── Couleurs console ─────────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  gras:   '\x1b[1m',
  vert:   '\x1b[32m',
  bleu:   '\x1b[34m',
  violet: '\x1b[35m',
  jaune:  '\x1b[33m',
  rouge:  '\x1b[31m',
  gris:   '\x1b[90m',
  cyan:   '\x1b[36m',
};

const log = (couleur, prefix, msg) =>
  console.log(`${couleur}${C.gras}[${prefix}]${C.reset}${couleur} ${msg}${C.reset}`);

function logTokensClaude(modele, usage) {
  const p     = PRIX[modele];
  const cout  = (usage.input_tokens / 1e6) * p.input + (usage.output_tokens / 1e6) * p.output;
  log(C.gris, 'TOKENS', `Input: ${usage.input_tokens} | Output: ${usage.output_tokens} | ~$${cout.toFixed(6)} USD`);
}

function logCoutGemini(modele, inputChars, outputChars) {
  const p    = PRIX[modele];
  const cout = (inputChars / 4 / 1e6) * p.input + (outputChars / 4 / 1e6) * p.output;
  log(C.gris, 'TOKENS', `Input: ~${Math.round(inputChars/4)} | Output: ~${Math.round(outputChars/4)} | ~$${cout.toFixed(6)} USD`);
}

// ─── Helpers fichiers ─────────────────────────────────────────────────────────

const resoudreChemin = (f) => path.isAbsolute(f) ? f : path.resolve(__dirname, f);

function lireFichier(chemin) {
  try { return fs.readFileSync(chemin, 'utf-8'); }
  catch { throw new Error(`Fichier introuvable : ${chemin}`); }
}

function ecrireFichier(chemin, contenu) {
  fs.mkdirSync(path.dirname(chemin), { recursive: true });
  fs.writeFileSync(chemin, contenu, 'utf-8');
}

const dateAujourdhui = () =>
  new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

// Extrait le code depuis des balises ```...``` si présentes
function extraireCode(texte) {
  const match = texte.match(/```(?:jsx?|css|json|javascript)?\n?([\s\S]*?)```/);
  return match ? match[1].trim() : texte.trim();
}

// ─── Contextes projet ─────────────────────────────────────────────────────────

const CONTEXTE_PROJET = `
Projet : GloboStream — Application de rencontres avec live streaming.
Backend  : Node.js 18+, Express 4, MongoDB Atlas, Mongoose 8, Socket.IO 4.6+, JWT ({userId}), Bcrypt, Multer, Cloudinary, Passport.js.
Frontend : React 18, React Router v6, Socket.IO Client, Simple-Peer (WebRTC), Framer Motion, i18next (5 langues), Axios, React Hot Toast.
Conventions : CommonJS backend, ES Modules frontend. Commentaires en français. camelCase vars, PascalCase composants.
Git : Branches main + claude-work uniquement.
`.trim();

const CONTEXTE_FRONTEND = `
${CONTEXTE_PROJET}

Architecture frontend :
- Composants : frontend/src/components/ (Navigation, LiveStream, LiveViewer, FiltersPanel, etc.)
- Pages : frontend/src/pages/ (17+ pages : Landing, Login, Home, Profile, Swipe, Matches, Chat, etc.)
- Auth : frontend/src/contexts/AuthContext.js (user, login(), logout())
- i18n : frontend/src/locales/{fr,en,it,de,es}.json — usage : const { t } = useTranslation()
- CSS séparé par composant/page, variables globales dans index.css

Design system dark mode :
- Fonds : #0a0a0a (principal), #111111 (secondaire), #1a1a1a (cartes)
- Accent : #e4405f (hover: #c73652)
- Texte : #ffffff (principal), #888888 (secondaire)
- Bordures : #2a2a2a | Border-radius : 8/12/20px | Transitions : 0.2-0.3s ease
- Effets modernes autorisés : glassmorphism, gradients subtils, box-shadow

⚠️ RÈGLES ABSOLUES pour ne pas casser le code existant :
1. Ne JAMAIS supprimer ou renommer des props, classes CSS ou clés i18n existantes
2. Ne JAMAIS modifier la logique métier (auth, sockets, WebRTC, API calls)
3. Conserver TOUS les imports existants — uniquement en ajouter
4. Mobile-first : styles base mobile, media queries min-width 768px et 1024px
5. Tout texte visible → useTranslation() + t('clé') — jamais hardcodé
`.trim();

// ─── CLAUDE : Fichiers MD ─────────────────────────────────────────────────────

async function lireFichierMd(nomFichier) {
  log(C.vert, 'HAIKU', `Lecture de ${nomFichier}...`);
  const contenu = lireFichier(resoudreChemin(nomFichier));
  const reponse = await claudeClient.messages.create({
    model: MODELS.haiku, max_tokens: 600,
    system: `${CONTEXTE_PROJET}\n\nAssistant technique GloboStream. Réponds en français, concis et structuré.`,
    messages: [{ role: 'user', content:
      `Fichier "${nomFichier}" :\n\n${contenu}\n\n` +
      `Résume en 3 à 5 points clés. Indique la date de dernière mise à jour. ` +
      `Liste 1 à 2 actions prioritaires si détectées.`
    }],
  });
  const resume = reponse.content[0].text;
  console.log(`\n${C.vert}${resume}${C.reset}\n`);
  logTokensClaude('haiku', reponse.usage);
  return resume;
}

async function mettreAJourFichierMd(nomFichier, instructions) {
  log(C.vert, 'HAIKU', `Mise à jour de ${nomFichier}...`);
  const chemin        = resoudreChemin(nomFichier);
  const contenuActuel = lireFichier(chemin);
  const reponse = await claudeClient.messages.create({
    model: MODELS.haiku, max_tokens: 8000,
    system: `${CONTEXTE_PROJET}\n\nTu mets à jour des fichiers Markdown en respectant EXACTEMENT leur format. Retourne UNIQUEMENT le Markdown mis à jour, sans explication ni balises de code.`,
    messages: [{ role: 'user', content:
      `Fichier (${nomFichier}) :\n\n${contenuActuel}\n\nInstructions : ${instructions}\n\nRetourne le fichier complet.`
    }],
  });
  const nouveauContenu = reponse.content[0].text;
  ecrireFichier(chemin + '.backup', contenuActuel);
  ecrireFichier(chemin, nouveauContenu);
  log(C.vert, 'HAIKU', `✅ ${nomFichier} mis à jour. Backup sauvegardé.`);
  logTokensClaude('haiku', reponse.usage);
  return nouveauContenu;
}

async function ajouterSession(descriptionSession) {
  log(C.vert, 'HAIKU', `Ajout d'une nouvelle session dans claude_session.md...`);
  const contenuActuel = lireFichier(resoudreChemin('claude_session.md'));
  const matchSessions = contenuActuel.match(/## Session (\d+)/g);
  const nouveauNumero = matchSessions
    ? Math.max(...matchSessions.map(s => parseInt(s.match(/\d+/)[0]))) + 1 : 1;
  const instructions =
    `Ajoute "## Session ${nouveauNumero} — ${dateAujourdhui()}" AVANT la section "## Etat Actuel du Projet". ` +
    `Structure : ### Objectifs / ### Ce qui a été fait / ### Fichiers créés-modifiés / ### En cours. ` +
    `Contenu : ${descriptionSession}. Mets à jour aussi "## Etat Actuel du Projet" avec la date (${dateAujourdhui()}).`;
  return await mettreAJourFichierMd('claude_session.md', instructions);
}

// ─── CLAUDE : Code backend ────────────────────────────────────────────────────

async function genererCodeBackend(tache, complexite = 'simple', fichierContexte = null) {
  const modele  = complexite === 'complex' ? 'opus' : 'sonnet';
  const couleur = modele === 'opus' ? C.violet : C.bleu;
  log(couleur, modele.toUpperCase(), `Code backend (${complexite}) : ${tache}`);
  let contexteSupp = '';
  if (fichierContexte) {
    contexteSupp = lireFichier(resoudreChemin(fichierContexte));
    log(C.gris, 'CTX', `Contexte : ${fichierContexte}`);
  }
  const reponse = await claudeClient.messages.create({
    model: MODELS[modele],
    max_tokens: complexite === 'complex' ? 8192 : 4096,
    system: `${CONTEXTE_PROJET}\n\nExpert backend Node.js/Express GloboStream. Code production-ready, commentaires en français. Retourne uniquement le code.`,
    messages: [{ role: 'user', content: contexteSupp ? `Contexte :\n${contexteSupp}\n\nTâche : ${tache}` : `Tâche : ${tache}` }],
  });
  const code = reponse.content[0].text;
  console.log(`\n${couleur}${code}${C.reset}\n`);
  logTokensClaude(modele, reponse.usage);
  return code;
}

// ─── GEMINI : CSS ─────────────────────────────────────────────────────────────

async function moderniserCSS(description, fichierSource = null) {
  log(C.jaune, 'GEMINI FLASH', `CSS : ${description}`);
  let contenuSource = '';
  if (fichierSource) {
    contenuSource = lireFichier(resoudreChemin(fichierSource));
    // Charger le CSS associé si on passe un .js
    if (fichierSource.endsWith('.js')) {
      const cheminCss = fichierSource.replace('.js', '.css');
      if (fs.existsSync(resoudreChemin(cheminCss))) {
        const cssActuel  = lireFichier(resoudreChemin(cheminCss));
        contenuSource    = `=== JSX ===\n${contenuSource}\n\n=== CSS actuel ===\n${cssActuel}`;
      }
    }
  }
  const prompt = `${CONTEXTE_FRONTEND}

Tu es un expert CSS/UI pour GloboStream. Modernise le CSS demandé en respectant le design system.
Effets autorisés : glassmorphism (backdrop-filter: blur), gradients, box-shadow, transitions douces.
Ne JAMAIS supprimer ou renommer une classe existante. Améliore les propriétés visuelles uniquement.

${contenuSource ? `Fichier existant :\n\`\`\`\n${contenuSource}\n\`\`\`` : ''}

Tâche : ${description}

Retourne UNIQUEMENT le CSS complet, sans explication, sans balises markdown.`;

  const model   = geminiClient.getGenerativeModel({ model: MODELS.geminiFlash });
  const result  = await model.generateContent(prompt);
  const cssCode = extraireCode(result.response.text());
  console.log(`\n${C.jaune}${cssCode}${C.reset}\n`);
  logCoutGemini('geminiFlash', prompt.length, cssCode.length);
  log(C.gris, 'FREE TIER', 'Quota utilisé : ~1/250 req/jour (gemini-2.5-flash)');
  return cssCode;
}

// ─── GEMINI : Composant React ─────────────────────────────────────────────────

async function genererComposantReact(description, fichierSource = null) {
  log(C.jaune, 'GEMINI FLASH', `Composant React : ${description}`);
  let contenuSource = '';
  if (fichierSource) {
    contenuSource = lireFichier(resoudreChemin(fichierSource));
    const cheminCss = fichierSource.replace('.js', '.css');
    if (fs.existsSync(resoudreChemin(cheminCss)))
      contenuSource += `\n\n=== CSS associé ===\n${lireFichier(resoudreChemin(cheminCss))}`;
  }
  const prompt = `${CONTEXTE_FRONTEND}

Tu es un expert React 18 pour GloboStream.
Règles strictes :
- Composants fonctionnels + hooks uniquement
- useTranslation() pour TOUT texte visible — jamais hardcodé
- Framer Motion pour les animations (motion.div, AnimatePresence)
- Conserver TOUTE la logique métier existante (sockets, auth, API)
- Conserver tous les imports existants, uniquement en ajouter

${contenuSource ? `Composant existant :\n\`\`\`jsx\n${contenuSource}\n\`\`\`` : ''}

Tâche : ${description}

Retourne UNIQUEMENT le JSX complet, sans explication, sans balises markdown.`;

  const model   = geminiClient.getGenerativeModel({ model: MODELS.geminiFlash });
  const result  = await model.generateContent(prompt);
  const jsxCode = extraireCode(result.response.text());
  console.log(`\n${C.jaune}${jsxCode}${C.reset}\n`);
  logCoutGemini('geminiFlash', prompt.length, jsxCode.length);
  return jsxCode;
}

// ─── GEMINI : Nouvelle page complète ─────────────────────────────────────────

async function genererPage(description, complexite = 'simple') {
  const nomModele  = 'geminiFlash'; // Free tier: toujours Flash, prompt plus détaillé si complex
  const labelModel = complexite === 'complex' ? 'GEMINI FLASH (complexe)' : 'GEMINI FLASH';
  log(C.jaune, labelModel, `Nouvelle page (${complexite}) : ${description}`);

  // Charger un exemple de page existante pour le style de référence
  let exempleExistant = '';
  for (const candidat of ['frontend/src/pages/Home.js', 'frontend/src/pages/Settings.js']) {
    const chemin = resoudreChemin(candidat);
    if (fs.existsSync(chemin)) {
      exempleExistant = lireFichier(chemin).substring(0, 2500);
      log(C.gris, 'CTX', `Style de référence chargé depuis ${candidat}`);
      break;
    }
  }

  const prompt = `${CONTEXTE_FRONTEND}

Tu crées une nouvelle page React complète pour GloboStream.
URL API : process.env.REACT_APP_API_URL || 'https://globostream.onrender.com'
Token auth : localStorage.getItem('token')

${exempleExistant ? `Page existante de référence (style et structure) :\n\`\`\`jsx\n${exempleExistant}\n...\n\`\`\`` : ''}

Génère les 3 fichiers suivants dans ce format EXACT :

=== FICHIER: NomPage.js ===
[code JSX complet]

=== FICHIER: NomPage.css ===
[code CSS complet dark mode mobile-first]

=== FICHIER: i18n_keys.json ===
[objet JSON avec les nouvelles clés en français uniquement]

Tâche : ${description}`;

  const model   = geminiClient.getGenerativeModel({ model: MODELS[nomModele] });
  const result  = await model.generateContent(prompt);
  const reponse = result.response.text();

  // Parser les fichiers générés
  const fichiers = {};
  const regex    = /=== FICHIER: (.+?) ===\n([\s\S]*?)(?==== FICHIER:|$)/g;
  let match;
  while ((match = regex.exec(reponse)) !== null) {
    fichiers[match[1].trim()] = extraireCode(match[2].trim());
  }

  if (Object.keys(fichiers).length === 0) {
    console.log(`\n${C.jaune}${reponse}${C.reset}\n`);
  } else {
    log(C.jaune, labelModel, `✅ ${Object.keys(fichiers).length} fichier(s) générés :`);
    Object.entries(fichiers).forEach(([nom, contenu]) => {
      console.log(`\n${C.gras}── ${nom} ──${C.reset}`);
      console.log(`${C.jaune}${contenu.substring(0, 400)}...${C.reset}`);
    });
    log(C.gris, 'CONSEIL', 'Copiez les fichiers dans frontend/src/pages/ et ajoutez la route dans App.js');
  }

  logCoutGemini(nomModele, prompt.length, reponse.length);
  return fichiers;
}

// ─── GEMINI : Clés i18n ───────────────────────────────────────────────────────

async function genererClesI18n(description, fichierSource = null) {
  log(C.jaune, 'GEMINI FLASH', `Clés i18n : ${description}`);
  let contenuSource = '';
  if (fichierSource) contenuSource = lireFichier(resoudreChemin(fichierSource));

  // Charger les sections existantes de fr.json pour éviter les doublons
  let sectionsExistantes = '';
  const cheminFr         = resoudreChemin('frontend/src/locales/fr.json');
  if (fs.existsSync(cheminFr)) {
    sectionsExistantes = Object.keys(JSON.parse(lireFichier(cheminFr))).join(', ');
  }

  const prompt = `${CONTEXTE_FRONTEND}

Tu génères des clés i18n pour GloboStream (5 langues : FR, EN, IT, DE, ES).
Sections existantes : ${sectionsExistantes || 'auth, profile, swipe, matches, chat, settings, stream, live, moderation, navigation, common'}
Règles : Ne JAMAIS modifier les clés existantes. Clés en camelCase. Interpolations : {{variable}}.

${contenuSource ? `Fichier source :\n\`\`\`jsx\n${contenuSource}\n\`\`\`` : ''}

Tâche : ${description}

Retourne dans ce format EXACT (sans balises markdown) :

=== fr.json ===
{ "section": { "clé": "valeur" } }

=== en.json ===
{ "section": { "clé": "value" } }

=== it.json ===
{ ... }

=== de.json ===
{ ... }

=== es.json ===
{ ... }`;

  const model   = geminiClient.getGenerativeModel({ model: MODELS.geminiFlash });
  const result  = await model.generateContent(prompt);
  const reponse = result.response.text();

  const traductions = {};
  LANGUES_I18N.forEach(lang => {
    const regex = new RegExp(`=== ${lang}\\.json ===\\n([\\s\\S]*?)(?==== |$)`);
    const match = reponse.match(regex);
    if (match) {
      try { traductions[lang] = JSON.parse(extraireCode(match[1].trim())); }
      catch { traductions[lang] = match[1].trim(); }
    }
  });

  if (Object.keys(traductions).length > 0) {
    log(C.jaune, 'GEMINI FLASH', `✅ Clés générées pour : ${Object.keys(traductions).join(', ')}`);
    console.log(`\n${C.jaune}${JSON.stringify(traductions['fr'], null, 2)}${C.reset}\n`);
    log(C.gris, 'CONSEIL', 'Fusionnez ces clés dans frontend/src/locales/*.json');
  } else {
    console.log(`\n${C.jaune}${reponse}${C.reset}\n`);
  }

  logCoutGemini('geminiFlash', prompt.length, reponse.length);
  return traductions;
}

// ─── Utilitaire : lister les fichiers MD ─────────────────────────────────────

function listerFichiersMd() {
  log(C.cyan, 'LIST', 'Fichiers MD gérés :');
  FICHIERS_MD.forEach(f => {
    const existe = fs.existsSync(resoudreChemin(f));
    console.log(`  ${existe ? `${C.vert}✅${C.reset}` : `${C.rouge}❌ absent${C.reset}`} ${f}`);
  });
  console.log();
}

// ─── CLI principal ────────────────────────────────────────────────────────────

async function main() {
  const [,, commande, ...reste] = process.argv;

  if (!commande || commande === 'help') {
    console.log(`
${C.cyan}${C.gras}GloboStream — Agent Orchestrateur IA v2.0${C.reset}

${C.gras}📄 Fichiers MD (Claude Haiku) :${C.reset}
  ${C.vert}read${C.reset}    <fichier.md>                              Résume un fichier
  ${C.vert}update${C.reset}  <fichier.md> "<instructions>"             Met à jour un fichier
  ${C.vert}session${C.reset} "<description>"                           Ajoute une session

${C.gras}⚙️  Backend (Claude Sonnet/Opus) :${C.reset}
  ${C.bleu}code${C.reset}    "<tâche>" [simple|complex] [ctx.md]       Génère du code backend

${C.gras}🎨 Frontend (Gemini Flash/Pro) :${C.reset}
  ${C.jaune}css${C.reset}     "<description>" [fichier.js|css]          Modernise du CSS
  ${C.jaune}react${C.reset}   "<description>" [fichier.js]              Composant React
  ${C.jaune}page${C.reset}    "<description>" [simple|complex]          Nouvelle page complète
  ${C.jaune}i18n${C.reset}    "<description>" [fichier.js]              Clés de traduction

${C.gras}🔧 Utilitaires :${C.reset}
  ${C.cyan}list${C.reset}                                               Liste les fichiers MD

${C.gras}💰 Coûts estimés :${C.reset}
  Haiku ~$0.000001 | Sonnet ~$0.01 | Opus ~$0.05 | Gemini Flash ~$0.000005 | Gemini Pro ~$0.01
`);
    return;
  }

  try {
    switch (commande) {
      case 'read':    await lireFichierMd(reste[0]); break;
      case 'update':  await mettreAJourFichierMd(reste[0], reste[1]); break;
      case 'session': await ajouterSession(reste[0]); break;
      case 'code':    await genererCodeBackend(reste[0], reste[1] || 'simple', reste[2] || null); break;
      case 'css':     await moderniserCSS(reste[0], reste[1] || null); break;
      case 'react':   await genererComposantReact(reste[0], reste[1] || null); break;
      case 'page':    await genererPage(reste[0], reste[1] || 'simple'); break;
      case 'i18n':    await genererClesI18n(reste[0], reste[1] || null); break;
      case 'list':    listerFichiersMd(); break;
      default: throw new Error(`Commande inconnue : "${commande}". Tapez "node agent.js help".`);
    }
  } catch (err) {
    log(C.rouge, 'ERREUR', err.message);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
