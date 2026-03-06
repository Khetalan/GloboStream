import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiFlag, FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './ReportModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://globostream.onrender.com';

// Raisons disponibles avec leur clé i18n
const REASONS = [
  { value: 'harassment', labelKey: 'report.reasonHarassment' },
  { value: 'spam', labelKey: 'report.reasonSpam' },
  { value: 'inappropriate', labelKey: 'report.reasonInappropriate' },
  { value: 'underage', labelKey: 'report.reasonUnderage' },
  { value: 'violence', labelKey: 'report.reasonViolence' },
  { value: 'other', labelKey: 'report.reasonOther' }
];

/**
 * Modale de signalement réutilisable
 *
 * Props :
 *   isOpen        {boolean}  — afficher ou non la modale
 *   onClose       {function} — callback fermeture
 *   targetUserId  {string}   — ID de l'utilisateur signalé
 *   type          {string}   — 'profile' | 'message' | 'live' | 'user'
 *   targetId      {string}   — ID de l'élément spécifique (optionnel)
 */
const ReportModal = ({ isOpen, onClose, targetUserId, type, targetId }) => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason) {
      toast.error(t('report.selectReason'));
      return;
    }

    setSending(true);
    try {
      await axios.post(`${API_URL}/api/reports`, {
        reportedUserId: targetUserId,
        type,
        targetId: targetId || null,
        reason: selectedReason,
        description
      });
      toast.success(t('report.success'));
      handleClose();
    } catch (error) {
      const msg = error.response?.data?.error;
      if (error.response?.status === 429) {
        toast.error(t('report.alreadyReported'));
      } else {
        toast.error(msg || t('report.error'));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="report-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="report-modal"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="report-modal-header">
              <div className="report-modal-icon">
                <FiAlertTriangle size={20} />
              </div>
              <h2>{t('report.title')}</h2>
              <button className="report-modal-close" onClick={handleClose}>
                <FiX size={20} />
              </button>
            </div>

            <p className="report-modal-subtitle">{t('report.subtitle')}</p>

            <form onSubmit={handleSubmit} className="report-form">
              {/* Sélection de la raison */}
              <div className="report-reasons">
                {REASONS.map(({ value, labelKey }) => (
                  <label
                    key={value}
                    className={`report-reason-btn ${selectedReason === value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      checked={selectedReason === value}
                      onChange={() => setSelectedReason(value)}
                    />
                    <FiFlag size={14} />
                    <span>{t(labelKey)}</span>
                  </label>
                ))}
              </div>

              {/* Description optionnelle */}
              <div className="report-description">
                <label>{t('report.descriptionLabel')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('report.descriptionPlaceholder')}
                  maxLength={500}
                  rows={3}
                />
                <span className="report-char-count">{description.length}/500</span>
              </div>

              {/* Boutons */}
              <div className="report-actions">
                <button type="button" className="btn-report-cancel" onClick={handleClose}>
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-report-submit"
                  disabled={sending || !selectedReason}
                >
                  {sending ? t('common.sending') : t('report.submitBtn')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
