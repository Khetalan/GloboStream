import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getPhotoUrl } from '../utils/photoUrl';
import { FiMail, FiCheck, FiX, FiUser } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import './MessageRequestsPanel.css';

const MessageRequestsPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/message-requests/received');
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    setProcessing(requestId);
    
    try {
      await axios.post(`/api/message-requests/accept/${requestId}`);
      
      toast.success(t('messageRequests.acceptSuccess'), {
        duration: 4000
      });
      
      // Retirer la demande de la liste
      setRequests(prev => prev.filter(r => r._id !== requestId));
      
    } catch (error) {
      console.error('Erreur acceptation:', error);
      toast.error(t('messageRequests.acceptError'));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessing(requestId);
    
    try {
      await axios.post(`/api/message-requests/reject/${requestId}`);
      
      toast.success(t('messageRequests.declineSuccess'));
      
      // Retirer la demande de la liste
      setRequests(prev => prev.filter(r => r._id !== requestId));
      
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error(t('messageRequests.declineError'));
    } finally {
      setProcessing(null);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return t('messageRequests.justNow');
    if (seconds < 3600) return t('messageRequests.minutesAgo', { count: Math.floor(seconds / 60) });
    if (seconds < 86400) return t('messageRequests.hoursAgo', { count: Math.floor(seconds / 3600) });
    if (seconds < 604800) return t('messageRequests.daysAgo', { count: Math.floor(seconds / 86400) });
    return t('messageRequests.weeksAgo', { count: Math.floor(seconds / 604800) });
  };

  if (loading) {
    return (
      <div className="message-requests-panel loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas de demandes
  }

  return (
    <div className="message-requests-panel">
      <div className="requests-header">
        <FiMail className="header-icon" />
        <div className="header-text">
          <h3>{t('messageRequests.title')}</h3>
          <p>{t('messageRequests.newRequests', { count: requests.length })}</p>
        </div>
      </div>

      <div className="requests-list">
        <AnimatePresence>
          {requests.map((request) => (
            <MessageRequestCard
              key={request._id}
              request={request}
              onAccept={handleAccept}
              onReject={handleReject}
              onViewProfile={handleViewProfile}
              processing={processing === request._id}
              getTimeAgo={getTimeAgo}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const MessageRequestCard = ({ 
  request, 
  onAccept, 
  onReject, 
  onViewProfile, 
  processing,
  getTimeAgo 
}) => {
  const { t } = useTranslation();
  const sender = request.sender;
  const primaryPhoto = sender.photos?.find(p => p.isPrimary) || sender.photos?.[0];

  return (
    <motion.div
      className="request-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className="request-avatar"
        onClick={() => onViewProfile(sender._id)}
      >
        {primaryPhoto ? (
          <img src={getPhotoUrl(primaryPhoto.url)} alt={sender.displayName} />
        ) : (
          <div className="avatar-placeholder">
            {(sender.displayName || sender.firstName || '?').charAt(0)}
          </div>
        )}
        <div className="avatar-overlay">
          <FiUser />
        </div>
      </div>

      <div className="request-content">
        <div className="request-info">
          <h4 
            className="sender-name"
            onClick={() => onViewProfile(sender._id)}
          >
            {sender.displayName || sender.firstName}
          </h4>
          <span className="request-time">{getTimeAgo(request.createdAt)}</span>
        </div>
        
        <div className="request-message">
          <FiMail className="message-icon" />
          <p>{request.message}</p>
        </div>

        <div className="request-actions">
          <button
            className="btn-action btn-reject"
            onClick={() => onReject(request._id)}
            disabled={processing}
          >
            <FiX />
            <span>{t('messageRequests.decline')}</span>
          </button>
          
          <button
            className="btn-action btn-accept"
            onClick={() => onAccept(request._id)}
            disabled={processing}
          >
            {processing ? (
              <>
                <div className="loading-spinner-small"></div>
                <span>{t('messageRequests.processing')}</span>
              </>
            ) : (
              <>
                <FiCheck />
                <span>{t('messageRequests.accept')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="notification-badge">
        <FiMail />
      </div>
    </motion.div>
  );
};

export default MessageRequestsPanel;
