import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiMail } from 'react-icons/fi';
import './MessageModal.css';

const MESSAGE_TEMPLATES = [
  "Salut ! Ton profil m'a vraiment plu 😊",
  "Hey ! J'aimerais bien discuter avec toi",
  "Coucou ! Tu as l'air super intéressant(e)",
  "Salut ! On a l'air d'avoir des points communs",
  "Hey ! J'adore ton profil, on se parle ?",
];

const MessageModal = ({ profile, onClose, onSend, alreadySent }) => {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const messageToSend = message.trim() || selectedTemplate;
    
    if (!messageToSend) {
      return;
    }

    setSending(true);
    
    try {
      await onSend(messageToSend);
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setMessage(template);
  };

  const age = profile.age || Math.floor((Date.now() - new Date(profile.birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
  const primaryPhoto = profile.photos?.find(p => p.isPrimary) || profile.photos?.[0];

  return (
    <motion.div 
      className="message-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="message-modal"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <FiX />
        </button>

        <div className="message-modal-header">
          <div className="profile-preview">
            {primaryPhoto ? (
              <img src={primaryPhoto.url} alt={profile.displayName} />
            ) : (
              <div className="placeholder-avatar">
                {(profile.displayName || profile.firstName || '?').charAt(0)}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h3>{profile.displayName || profile.firstName}, {age}</h3>
            <p>Envoyer un message</p>
          </div>
        </div>

        {alreadySent ? (
          <div className="already-sent-notice">
            <FiMail />
            <div>
              <h4>Message déjà envoyé</h4>
              <p>Vous avez déjà envoyé un message à ce profil. Attendez sa réponse !</p>
            </div>
          </div>
        ) : (
          <>
            <div className="message-modal-body">
              <label>Votre message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Écrivez un message sympa..."
                maxLength={500}
                rows={4}
                autoFocus
              />
              <div className="char-counter">
                {message.length}/500
              </div>

              <div className="templates-section">
                <label>Ou utilisez un message rapide</label>
                <div className="templates-grid">
                  {MESSAGE_TEMPLATES.map((template, index) => (
                    <button
                      key={index}
                      className={`template-btn ${selectedTemplate === template ? 'selected' : ''}`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="message-modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Annuler
              </button>
              <button 
                className="btn btn-primary send-btn" 
                onClick={handleSend}
                disabled={(!message.trim() && !selectedTemplate) || sending}
              >
                {sending ? (
                  <>
                    <div className="loading-spinner"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <FiSend />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MessageModal;
