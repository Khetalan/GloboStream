import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import './ConsentModal.css';

const CONSENT_KEY = 'globostream_consent_v1';
const CONSENT_VERSION = '1.0';
const API_URL = process.env.REACT_APP_API_URL || 'https://globostream.onrender.com';

const ConsentModal = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Afficher la modale uniquement si le consentement n'a pas encore été donné
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    // 1. Sauvegarder localement (cache UX)
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      accepted: true,
      date: new Date().toISOString(),
      version: CONSENT_VERSION
    }));

    // 2. Enregistrer en base de données si l'utilisateur est connecté
    const token = localStorage.getItem('token');
    if (token) {
      axios.post(
        `${API_URL}/api/users/consent`,
        { version: CONSENT_VERSION },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => {}); // Silencieux — le localStorage reste la référence locale
    }

    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="consent-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="consent-card"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* Logo */}
            <div className="consent-logo">
              <FiHeart size={32} />
            </div>
            <h2 className="consent-title">Bienvenue sur GloboStream</h2>
            <p className="consent-subtitle">
              Avant de commencer, merci de lire et d'accepter nos conditions d'utilisation.
            </p>

            {/* Points clés */}
            <ul className="consent-points">
              <li>
                <FiCheck size={16} />
                <span>Je confirme avoir au moins <strong>18 ans</strong></span>
              </li>
              <li>
                <FiCheck size={16} />
                <span>J'accepte les <Link to="/legal" onClick={handleAccept}>Conditions d'Utilisation (CGU)</Link></span>
              </li>
              <li>
                <FiCheck size={16} />
                <span>J'accepte la <Link to="/legal" onClick={handleAccept}>Politique de Confidentialité</Link> (RGPD)</span>
              </li>
              <li>
                <FiCheck size={16} />
                <span>Je comprends que les sessions live sont <strong>chiffrées</strong> et protégées contre la capture</span>
              </li>
            </ul>

            {/* Lien documents */}
            <p className="consent-link-hint">
              <Link to="/legal" onClick={handleAccept}>
                Lire les documents légaux complets →
              </Link>
            </p>

            {/* Bouton accepter */}
            <button className="consent-btn" onClick={handleAccept}>
              J'accepte et je continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConsentModal;
