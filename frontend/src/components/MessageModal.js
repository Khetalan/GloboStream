import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiSend, FiMail } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { getPhotoUrl } from '../utils/photoUrl';
import './MessageModal.css';

const MessageModal = ({ profile, onClose, onSend, alreadySent }) => {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [sending, setSending] = useState(false);
  const { t } = useTranslation();

  const MESSAGE_TEMPLATES = [
    t('messageModal.template1'),
    t('messageModal.template2'),
    t('messageModal.template3'),
    t('messageModal.template4'),
    t('messageModal.template5'),
  ];

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
              <img src={getPhotoUrl(primaryPhoto.url)} alt={profile.displayName} />
            ) : (
              <div className="placeholder-avatar">
                {(profile.displayName || profile.firstName || '?').charAt(0)}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h3>{profile.displayName || profile.firstName}, {age}</h3>
            <p>{t('messageModal.title')}</p>
          </div>
        </div>

        {alreadySent ? (
          <div className="already-sent-notice">
            <FiMail />
            <div>
              <h4>{t('messageModal.alreadySent')}</h4>
              <p>{t('messageModal.alreadySentDesc')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="message-modal-body">
              <label>{t('messageModal.yourMessage')}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('messageModal.placeholder')}
                maxLength={500}
                rows={4}
                autoFocus
              />
              <div className="char-counter">
                {message.length}/500
              </div>

              <div className="templates-section">
                <label>{t('messageModal.quickMessages')}</label>
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
                {t('common.cancel')}
              </button>
              <button 
                className="btn btn-primary send-btn" 
                onClick={handleSend}
                disabled={(!message.trim() && !selectedTemplate) || sending}
              >
                {sending ? (
                  <>
                    <div className="loading-spinner"></div>
                    {t('common.sending')}
                  </>
                ) : (
                  <>
                    <FiSend />
                    {t('common.send')}
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
