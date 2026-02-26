import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiShield, FiFileText, FiInfo } from 'react-icons/fi';
import Navigation from '../components/Navigation';
import './Legal.css';

const Legal = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('cgu');

  const tabs = [
    { id: 'cgu',      label: t('legal.tabCgu'),      icon: FiFileText },
    { id: 'privacy',  label: t('legal.tabPrivacy'),  icon: FiShield   },
    { id: 'mentions', label: t('legal.tabMentions'), icon: FiInfo     },
  ];

  return (
    <div className="legal-container">
      {/* Header */}
      <div className="legal-header">
        <button className="legal-back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft size={20} />
        </button>
        <h1>{t('legal.title')}</h1>
      </div>

      {/* Onglets */}
      <div className="legal-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`legal-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="legal-content">

        {/* ─── CGU ─────────────────────────────────────────── */}
        {activeTab === 'cgu' && (
          <div className="legal-body">
            <h2>Conditions Générales d'Utilisation</h2>
            <p className="legal-updated">Dernière mise à jour : 26 février 2026</p>

            <h3>Article 1 – Objet</h3>
            <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application GloboStream, plateforme de rencontres intégrant des fonctionnalités de streaming vidéo en direct.</p>

            <h3>Article 2 – Accès au service</h3>
            <p>L'application GloboStream est accessible via navigateur web. Une version mobile native est en cours de développement. L'accès au service est réservé aux personnes majeures (18 ans et plus).</p>

            <h3>Article 3 – Création de compte</h3>
            <p>L'inscription nécessite la fourniture d'une adresse email valide, d'un mot de passe sécurisé, d'un prénom et d'une date de naissance. L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion. Tout accès au service via son compte est présumé effectué par l'utilisateur.</p>

            <h3>Article 4 – Comportements interdits</h3>
            <p>Il est strictement interdit de :</p>
            <ul>
              <li>Publier des contenus illégaux, haineux, discriminatoires, diffamatoires ou à caractère pornographique non sollicité</li>
              <li>Harceler, menacer ou usurper l'identité d'un autre utilisateur</li>
              <li>Tenter d'enregistrer, de capturer ou de rediffuser les flux vidéo/audio des sessions live (des mesures techniques de protection sont actives)</li>
              <li>Utiliser des bots, scripts automatisés ou tout système de collecte de données automatisée</li>
              <li>Contourner les systèmes de sécurité ou d'authentification de la plateforme</li>
            </ul>

            <h3>Article 5 – Propriété intellectuelle</h3>
            <p>L'application GloboStream, ses algorithmes de matching, filtres de traitement vidéo, logo, charte graphique et code source sont la propriété exclusive de [NOM_ÉDITEUR] et sont protégés par le droit d'auteur (Code de la propriété intellectuelle, art. L.335-3). Toute reproduction ou représentation, même partielle, est strictement interdite sans autorisation écrite préalable.</p>

            <h3>Article 6 – Protection des flux live</h3>
            <p>Conformément à l'article L.335-3 du Code de la propriété intellectuelle, l'enregistrement, la capture ou la redistribution des flux live constitue une contrefaçon passible de 3 ans d'emprisonnement et 300 000 € d'amende. Un watermark numérique (identifiant utilisateur) est superposé sur chaque flux vidéo pour identifier toute fuite éventuelle.</p>

            <h3>Article 7 – Sanctions</h3>
            <p>Tout manquement aux présentes CGU entraîne la suspension ou la suppression immédiate du compte, sans préavis ni remboursement. Les infractions graves feront l'objet de poursuites judiciaires.</p>

            <h3>Article 8 – Limitation de responsabilité</h3>
            <p>[NOM_ÉDITEUR] ne peut être tenu responsable des contenus publiés par les utilisateurs, des interruptions de service liées à des tiers (hébergeur, opérateur réseau), ni des pertes de connexion survenant durant les sessions live.</p>

            <h3>Article 9 – Modification des CGU</h3>
            <p>[NOM_ÉDITEUR] se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email ou notification in-app. La poursuite de l'utilisation du service vaut acceptation des nouvelles conditions.</p>

            <h3>Article 10 – Droit applicable</h3>
            <p>Les présentes CGU sont régies par le droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, les tribunaux français compétents seront saisis.</p>
          </div>
        )}

        {/* ─── Politique de Confidentialité (RGPD) ─────────── */}
        {activeTab === 'privacy' && (
          <div className="legal-body">
            <h2>Politique de Confidentialité</h2>
            <p className="legal-updated">Dernière mise à jour : 26 février 2026 — Conforme au RGPD (Règlement UE 2016/679)</p>

            <h3>1. Responsable du traitement</h3>
            <p>[NOM_ÉDITEUR], personne physique — développeur indépendant.<br />Contact : <a href="mailto:[EMAIL_CONTACT]">[EMAIL_CONTACT]</a></p>

            <h3>2. Données collectées</h3>
            <p><strong>Données d'identification :</strong> adresse email, prénom, date de naissance.</p>
            <p><strong>Données de profil :</strong> photos de profil, description personnelle, préférences de recherche, localisation géographique (optionnelle et avec votre consentement explicite).</p>
            <p><strong>Données techniques :</strong> identifiants de session (token JWT), adresse IP (journaux serveur uniquement), préférence de langue.</p>
            <p><strong>Flux audiovisuels :</strong> audio et vidéo transmis en temps réel lors des sessions live. Ces flux ne sont pas enregistrés ni stockés, sauf action explicite d'un modérateur suite à un signalement.</p>

            <h3>3. Finalités du traitement</h3>
            <ul>
              <li>Fourniture du service de mise en relation et des fonctionnalités de matching</li>
              <li>Gestion des comptes utilisateurs et authentification</li>
              <li>Transmission en temps réel des flux live (WebRTC)</li>
              <li>Modération et prévention des abus</li>
              <li>Amélioration du service (données agrégées et anonymisées)</li>
            </ul>

            <h3>4. Base légale du traitement</h3>
            <p>Le traitement de vos données repose sur votre consentement (art. 6.1.a RGPD) donné lors de l'inscription, ainsi que sur l'exécution du contrat (art. 6.1.b RGPD) constitué par les présentes CGU.</p>

            <h3>5. Durée de conservation</h3>
            <ul>
              <li><strong>Données de compte :</strong> pendant toute la durée d'activité du compte, puis 30 jours après suppression du compte</li>
              <li><strong>Flux live :</strong> non stockés — transmission uniquement en temps réel</li>
              <li><strong>Journaux serveur (logs) :</strong> 30 jours maximum</li>
            </ul>

            <h3>6. Sécurité des données</h3>
            <p>Les mots de passe sont stockés sous forme hachée (bcrypt). Les flux live sont chiffrés de bout en bout via le protocole WebRTC (DTLS/SRTP). Un watermark numérique discret est superposé sur les flux vidéo pour décourager les captures non autorisées.</p>

            <h3>7. Sous-traitants et transferts</h3>
            <p>Vos données peuvent être traitées par nos sous-traitants techniques :</p>
            <ul>
              <li><strong>Render Inc.</strong> (San Francisco, USA) — Hébergement du serveur API. Conforme au Data Privacy Framework UE-USA.</li>
              <li><strong>GitHub Inc.</strong> (San Francisco, USA) — Hébergement de l'interface web (GitHub Pages).</li>
              <li><strong>MongoDB Atlas</strong> — Base de données hébergée en Europe.</li>
            </ul>

            <h3>8. Vos droits (RGPD art. 15-22)</h3>
            <p>Vous disposez des droits suivants sur vos données personnelles :</p>
            <ul>
              <li><strong>Droit d'accès</strong> — obtenir une copie de vos données</li>
              <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
              <li><strong>Droit à l'effacement</strong> — demander la suppression de votre compte et de vos données</li>
              <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format lisible par machine</li>
              <li><strong>Droit d'opposition</strong> — vous opposer à certains traitements</li>
            </ul>
            <p>Pour exercer ces droits : <a href="mailto:[EMAIL_CONTACT]">[EMAIL_CONTACT]</a>. Délai de réponse : 30 jours maximum.</p>
            <p>Vous pouvez également introduire une réclamation auprès de la <strong>CNIL</strong> : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a></p>

            <h3>9. Cookies</h3>
            <p>L'application utilise uniquement des cookies strictement nécessaires au fonctionnement : token d'authentification (localStorage) et préférence de langue. Aucun cookie publicitaire ni de tracking tiers n'est utilisé.</p>
          </div>
        )}

        {/* ─── Mentions Légales ─────────────────────────────── */}
        {activeTab === 'mentions' && (
          <div className="legal-body">
            <h2>Mentions Légales</h2>
            <p className="legal-updated">Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN)</p>

            <h3>Éditeur de l'application</h3>
            <p>
              <strong>Nom :</strong> [NOM_ÉDITEUR]<br />
              <strong>Statut :</strong> Personne physique — développeur indépendant<br />
              <strong>Email :</strong> <a href="mailto:[EMAIL_CONTACT]">[EMAIL_CONTACT]</a>
            </p>

            <h3>Hébergement</h3>
            <p>
              <strong>Interface web (frontend) :</strong><br />
              GitHub Pages — GitHub Inc.<br />
              88 Colin P Kelly Jr St, San Francisco, CA 94107, États-Unis<br />
              <a href="https://pages.github.com" target="_blank" rel="noopener noreferrer">pages.github.com</a>
            </p>
            <p>
              <strong>Serveur API (backend) :</strong><br />
              Render — Render Inc.<br />
              525 Brannan St Suite 300, San Francisco, CA 94107, États-Unis<br />
              <a href="https://render.com" target="_blank" rel="noopener noreferrer">render.com</a>
            </p>

            <h3>Propriété intellectuelle</h3>
            <p>L'ensemble du contenu de GloboStream — code source, logo, design, algorithmes de matching, filtres de traitement vidéo — est protégé par le droit d'auteur et appartient à [NOM_ÉDITEUR].</p>
            <p>Toute reproduction ou représentation, même partielle, est strictement interdite sans autorisation écrite préalable de [NOM_ÉDITEUR].</p>

            <h3>Protection des flux live</h3>
            <p>Conformément aux articles L.335-3 et L.335-4 du Code de la propriété intellectuelle, l'enregistrement, la capture d'écran ou la redistribution des flux live sans autorisation explicite constitue une contrefaçon passible de :</p>
            <ul>
              <li>3 ans d'emprisonnement et 300 000 € d'amende (personnes physiques)</li>
              <li>1 500 000 € d'amende (personnes morales)</li>
            </ul>

            <h3>Limitation de responsabilité</h3>
            <p>[NOM_ÉDITEUR] s'efforce d'assurer la disponibilité du service mais ne peut garantir une accessibilité permanente. La responsabilité de [NOM_ÉDITEUR] ne pourra être engagée en cas d'interruption, de perte de données ou de dommages résultant de l'utilisation du service.</p>

            <h3>Contact</h3>
            <p>Pour toute question relative à l'application : <a href="mailto:[EMAIL_CONTACT]">[EMAIL_CONTACT]</a></p>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Legal;
