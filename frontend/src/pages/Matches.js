import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiMessageCircle, FiUser, FiX, FiHeart, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Navigation from '../components/Navigation';
import './Matches.css';

const Matches = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // États
  const [activeTab, setActiveTab] = useState('matches'); // matches, likes, views
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null); // Pour la modale

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
        default:
          endpoint = '/api/matches';
      }

      const response = await axios.get(endpoint, { headers });
      // Adaptation selon la structure de réponse
      if (activeTab === 'matches') {
        // /api/matches retourne { matches: [...] }
        setData(response.data.matches || []);
      } else {
        // Les autres endpoints retourneront probablement un tableau direct ou { users: [...] }
        setData(response.data.users || response.data || []);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
      toast.error(t('matches.loadError'));
      setData([]); // Fallback vide en cas d'erreur (ex: endpoint pas encore créé)
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

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
  };

  // Rendu du contenu vide
  const renderEmptyState = () => {
    let message = t('matches.noMatches');
    if (activeTab === 'likes') message = t('matches.noLikes');
    if (activeTab === 'views') message = t('matches.noViews');

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
              const user = item.user || item; // Gérer structure {match: {...}} ou {user: {...}}
              const photoUrl = user.photos?.find(p => p.isPrimary)?.url || user.photos?.[0]?.url || '/default-avatar.png';
              
              return (
                <motion.div
                  key={user.id || user._id}
                  className="match-card"
                  layoutId={`card-${user.id || user._id}`}
                  onClick={() => handleOpenProfile(user)}
                  whileHover={{ y: -5 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div 
                    className="match-image" 
                    style={{ backgroundImage: `url(${photoUrl})` }}
                  >
                    {/* Badge si c'est un match */}
                    {activeTab === 'matches' && (
                      <div className="match-badge">
                        <FiHeart className="filled-heart" />
                      </div>
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
                <div className="modal-section">
                  <h4>{t('profile.about')}</h4>
                  <p>{selectedProfile.bio || t('profile.noBio')}</p>
                </div>

                <div className="modal-actions">
                  <button 
                    className="modal-action-btn primary"
                    onClick={() => {
                      handleStartChat(selectedProfile.id || selectedProfile._id);
                      handleCloseModal();
                    }}
                  >
                    <FiMessageCircle /> {t('matches.startChat')}
                  </button>
                  <button 
                    className="modal-action-btn secondary"
                    onClick={() => navigate(`/profile/${selectedProfile.id || selectedProfile._id}`)}
                  >
                    <FiUser /> {t('matches.viewProfile')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Matches;
