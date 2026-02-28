import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiMessageCircle, FiUser, FiX, FiHeart, FiMail, FiUserX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Navigation from '../components/Navigation';
import './Matches.css';

const Matches = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // États
  const [activeTab, setActiveTab] = useState('matches'); // matches, likes, views, likesGiven, messagesSent
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null); // Pour la modale

  // États modale — boutons Like + Message
  const [modalMessageStatus, setModalMessageStatus] = useState(null); // null | 'pending' | 'accepted' | 'rejected'
  const [modalLiking, setModalLiking] = useState(false);
  const [modalShowMessageForm, setModalShowMessageForm] = useState(false);
  const [modalMessageText, setModalMessageText] = useState('');
  const [modalSendingMessage, setModalSendingMessage] = useState(false);

  // État modal Unmatch
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);

  // Fonction de récupération des données selon l'onglet
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      let endpoint = '';

      switch (activeTab) {
        case 'matches':
          endpoint = '/api/matches';
          break;
        case 'likes':
          endpoint = '/api/swipe/likes-received';
          break;
        case 'views':
          endpoint = '/api/users/views';
          break;
        case 'likesGiven':
          endpoint = '/api/swipe/likes-given';
          break;
        case 'messagesSent':
          endpoint = '/api/message-requests/sent';
          break;
        default:
          endpoint = '/api/matches';
      }

      const response = await axios.get(endpoint, { headers });
      if (activeTab === 'matches') {
        setData(response.data.matches || []);
      } else if (activeTab === 'messagesSent') {
        // Exclure les demandes acceptées (devenues des matchs)
        setData((response.data.requests || []).filter(r => r.status !== 'accepted'));
      } else {
        setData(response.data.users || response.data || []);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
      toast.error(t('matches.loadError'));
      setData([]); // Fallback vide en cas d'erreur (ex: endpoint pas encore créé)
    } finally {
      setLoading(false);
    }
  }, [activeTab, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Gestion de l'ouverture du chat
  const handleStartChat = (userId, e) => {
    if (e) e.stopPropagation();
    navigate(`/chat/${userId}`);
  };

  // Gestion de l'ouverture de la modale profil
  const handleOpenProfile = (profile) => {
    // Normalisation de l'objet profil (parfois imbriqué dans 'user')
    const user = profile.user || profile;
    setSelectedProfile(user);
  };

  // Fermeture modale
  const handleCloseModal = () => {
    setSelectedProfile(null);
    setModalMessageStatus(null);
    setModalShowMessageForm(false);
    setModalMessageText('');
    setShowUnmatchConfirm(false);
  };

  // Unmatch définitif
  const handleUnmatch = async () => {
    const userId = selectedProfile?.id || selectedProfile?._id;
    if (!userId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/matches/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('matches.unmatchSuccess'));
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  // Vérifier si une demande de message a déjà été envoyée au profil ouvert
  useEffect(() => {
    if (!selectedProfile) return;
    const userId = selectedProfile.id || selectedProfile._id;
    const token = localStorage.getItem('token');
    axios.get(`/api/message-requests/sent-to/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setModalMessageStatus(res.data.alreadySent ? res.data.status : null);
    }).catch(() => setModalMessageStatus(null));
  }, [selectedProfile]);

  // Like le profil ouvert dans la modale
  const handleModalLike = async (userId) => {
    if (modalLiking) return;
    setModalLiking(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/swipe/like/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('matches.likeSuccess'));
    } catch (error) {
      toast.error(t('matches.likeError'));
    } finally {
      setModalLiking(false);
    }
  };

  // Envoyer une demande de message au profil ouvert dans la modale
  const handleModalSendMessage = async (userId) => {
    if (!modalMessageText.trim() || modalSendingMessage) return;
    setModalSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/message-requests/send/${userId}`,
        { message: modalMessageText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalMessageStatus('pending');
      setModalShowMessageForm(false);
      setModalMessageText('');
      toast.success(t('matches.messageSent'));
    } catch (error) {
      toast.error(error.response?.data?.error || t('matches.messageError'));
    } finally {
      setModalSendingMessage(false);
    }
  };

  // Rendu du contenu vide
  const renderEmptyState = () => {
    let message = t('matches.noMatches');
    if (activeTab === 'likes') message = t('matches.noLikes');
    if (activeTab === 'views') message = t('matches.noViews');
    if (activeTab === 'likesGiven') message = t('matches.noLikesGiven');
    if (activeTab === 'messagesSent') message = t('matches.noMessagesSent');

    return (
      <div className="no-matches">
        <p>{message}</p>
      </div>
    );
  };

  return (
    <div className="matches-page">
      <div className="matches-header-bar">
        <div className="matches-logo">
          <FiHeart className="logo-icon" />
          <span>Globostream</span>
        </div>
        <Navigation />
      </div>
      {/* Onglets sticky */}
      <div className="matches-tabs-container">
        <div className="matches-tabs">
          <button 
            className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            {t('matches.tabMatches')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'likes' ? 'active' : ''}`}
            onClick={() => setActiveTab('likes')}
          >
            {t('matches.tabLikes')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'views' ? 'active' : ''}`}
            onClick={() => setActiveTab('views')}
          >
            {t('matches.tabViews')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'likesGiven' ? 'active' : ''}`}
            onClick={() => setActiveTab('likesGiven')}
          >
            {t('matches.tabLikesGiven')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'messagesSent' ? 'active' : ''}`}
            onClick={() => setActiveTab('messagesSent')}
          >
            {t('matches.tabMessagesSent')}
          </button>
        </div>
      </div>

      {/* Contenu Principal */}
      <div className="matches-content">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : data.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="matches-grid">
            {data.map((item) => {
              // Pour messagesSent, item = { _id, recipient, message, status }
              // Pour les autres onglets, item = profile ou { user: profile, matchedAt }
              const user = activeTab === 'messagesSent'
                ? (item.recipient || item)
                : (item.user || item);
              const photoUrl = user.photos?.find(p => p.isPrimary)?.url || user.photos?.[0]?.url || '/default-avatar.png';

              return (
                <motion.div
                  key={activeTab === 'messagesSent' ? item._id : (user.id || user._id)}
                  className="match-card"
                  layoutId={`card-${activeTab === 'messagesSent' ? item._id : (user.id || user._id)}`}
                  onClick={() => handleOpenProfile(user)}
                  whileHover={{ y: -5 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div
                    className="match-image"
                    style={{ backgroundImage: `url(${photoUrl})` }}
                  >
                    {/* Badge match */}
                    {activeTab === 'matches' && (
                      <div className="match-badge">
                        <FiHeart className="filled-heart" />
                      </div>
                    )}

                    {/* Post-it demande de message (pending) */}
                    {activeTab === 'messagesSent' && (
                      <motion.div
                        className="match-postit"
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: -8 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        <FiMail />
                        <span>{t('matches.pendingPostit')}</span>
                      </motion.div>
                    )}

                    {/* Post-it "Demande refusée" superposé */}
                    {activeTab === 'messagesSent' && item.status === 'rejected' && (
                      <motion.div
                        className="match-postit rejected"
                        initial={{ scale: 0, rotate: 10 }}
                        animate={{ scale: 1, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                      >
                        <FiX />
                        <span>{t('matches.rejectedPostit')}</span>
                      </motion.div>
                    )}
                  </div>

                  <div className="match-info">
                    <h3>{user.displayName || user.firstName}, {user.age}</h3>
                    <p>{user.location?.city || t('matches.unknownCity')}</p>

                    {activeTab === 'matches' && (
                      <button
                        className="quick-chat-btn"
                        onClick={(e) => handleStartChat(user.id || user._id, e)}
                      >
                        <FiMessageCircle /> {t('matches.startChat')}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale Profil */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div 
            className="profile-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div 
              className="profile-modal-card"
              layoutId={`card-${selectedProfile.id || selectedProfile._id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-modal-btn" onClick={handleCloseModal}>
                <FiX />
              </button>

              <div 
                className="modal-image-header"
                style={{ backgroundImage: `url(${selectedProfile.photos?.find(p => p.isPrimary)?.url || selectedProfile.photos?.[0]?.url || '/default-avatar.png'})` }}
              >
                <div className="modal-gradient"></div>
                <div className="modal-title-info">
                  <h2>{selectedProfile.displayName || selectedProfile.firstName}, {selectedProfile.age}</h2>
                  <span className="modal-location">{selectedProfile.location?.city}</span>
                </div>
              </div>

              <div className="modal-body">

                {/* Détails : genre, taille, pays, occupation */}
                <div className="modal-section">
                  <div className="modal-details-row">
                    {selectedProfile.gender && (
                      <span className="modal-detail-chip">
                        {selectedProfile.gender === 'homme' ? '♂' : selectedProfile.gender === 'femme' ? '♀' : '⚧'} {selectedProfile.gender}
                      </span>
                    )}
                    {selectedProfile.height && (
                      <span className="modal-detail-chip">📏 {selectedProfile.height} cm</span>
                    )}
                    {selectedProfile.location?.country && (
                      <span className="modal-detail-chip">🌍 {selectedProfile.location.country}</span>
                    )}
                    {selectedProfile.occupation && (
                      <span className="modal-detail-chip">💼 {selectedProfile.occupation}</span>
                    )}
                    {selectedProfile.lookingFor && (
                      <span className="modal-detail-chip">
                        {selectedProfile.lookingFor === 'relation-serieuse' ? '💍 Relation sérieuse'
                          : selectedProfile.lookingFor === 'rencontre-casual' ? '😊 Rencontres'
                          : selectedProfile.lookingFor === 'amitie' ? '🤝 Amitié'
                          : '🤷 Pas encore sûr'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="modal-section">
                  <h4>{t('profile.about')}</h4>
                  <p className="modal-bio">{selectedProfile.bio || t('profile.noBio')}</p>
                </div>

                {/* Centres d'intérêt */}
                {selectedProfile.interests?.length > 0 && (
                  <div className="modal-section">
                    <h4>{t('profile.interests') || 'Centres d\'intérêt'}</h4>
                    <div className="modal-chips">
                      {selectedProfile.interests.map((interest, i) => (
                        <span key={i} className="modal-chip">{interest}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Langues */}
                {selectedProfile.languages?.length > 0 && (
                  <div className="modal-section">
                    <h4>{t('profile.languages') || 'Langues'}</h4>
                    <div className="modal-chips">
                      {selectedProfile.languages.map((lang, i) => (
                        <span key={i} className="modal-chip">🗣 {lang}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Boutons Like + Message */}
                <div className="modal-actions">
                  <button
                    className="modal-action-btn like"
                    onClick={() => handleModalLike(selectedProfile.id || selectedProfile._id)}
                    disabled={modalLiking}
                  >
                    <FiHeart /> {t('matches.likeProfile')}
                  </button>
                  <div className="modal-message-btn-wrap">
                    <button
                      className="modal-action-btn primary"
                      onClick={() => modalMessageStatus === null && setModalShowMessageForm(f => !f)}
                      disabled={modalMessageStatus !== null}
                    >
                      <FiMail /> {t('matches.messageRequest')}
                    </button>
                    {modalMessageStatus !== null && (
                      <motion.div
                        className="modal-postit-sent"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: -5 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        <FiMail /><span>{t('matches.sentPostit')}</span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Formulaire d'envoi de message (affiché au clic sur Message) */}
                {modalShowMessageForm && (
                  <div className="modal-message-form">
                    <textarea
                      className="modal-message-textarea"
                      placeholder={t('matches.messagePlaceholder')}
                      value={modalMessageText}
                      onChange={(e) => setModalMessageText(e.target.value)}
                      maxLength={500}
                      rows={3}
                    />
                    <div className="modal-form-btns">
                      <button
                        className="modal-action-btn secondary"
                        onClick={() => { setModalShowMessageForm(false); setModalMessageText(''); }}
                      >
                        {t('matches.cancelBtn')}
                      </button>
                      <button
                        className="modal-action-btn primary"
                        onClick={() => handleModalSendMessage(selectedProfile.id || selectedProfile._id)}
                        disabled={!modalMessageText.trim() || modalSendingMessage}
                      >
                        {modalSendingMessage ? '…' : t('matches.sendRequest')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Voir le profil complet */}
                <div className="modal-view-profile">
                  <button
                    className="modal-action-btn secondary"
                    onClick={() => navigate(`/profile/${selectedProfile.id || selectedProfile._id}`)}
                  >
                    <FiUser /> {t('matches.viewProfile')}
                  </button>
                </div>

                {/* Bouton Unmatch — uniquement sur l'onglet Matchs */}
                {activeTab === 'matches' && !showUnmatchConfirm && (
                  <div className="modal-unmatch-row">
                    <button
                      className="modal-action-btn unmatch"
                      onClick={() => setShowUnmatchConfirm(true)}
                    >
                      <FiUserX /> {t('matches.unmatch')}
                    </button>
                  </div>
                )}

                {/* Confirmation Unmatch */}
                {showUnmatchConfirm && (
                  <div className="modal-unmatch-confirm">
                    <p>{t('matches.unmatchConfirmText')}</p>
                    <div className="modal-unmatch-confirm-btns">
                      <button
                        className="modal-action-btn secondary"
                        onClick={() => setShowUnmatchConfirm(false)}
                      >
                        {t('matches.unmatchCancel')}
                      </button>
                      <button
                        className="modal-action-btn unmatch"
                        onClick={handleUnmatch}
                      >
                        <FiUserX /> {t('matches.unmatchConfirmBtn')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Matches;
