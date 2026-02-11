import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiHeart, FiX, FiMail, FiMapPin, FiSliders, FiArrowLeft, FiFilter } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import FiltersPanel from '../components/FiltersPanel';
import MessageModal from '../components/MessageModal';
import './Swipe.css';

const Swipe = () => {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showProfile, setShowProfile] = useState(null);
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 99,
    distance: 500, // Augmenté à 500km par défaut
    gender: ['homme', 'femme'],
    heightMin: null,
    heightMax: null,
    languages: [],
    interests: [],
    hasChildren: null,
    smoker: null,
    lookingFor: null
  });
  const [showMessageModal, setShowMessageModal] = useState(null);
  const [sentRequests, setSentRequests] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    loadProfiles();
  }, []);
  useEffect(() => {
  loadSentRequests();
  }, []);

  const loadSentRequests = async () => {
    try {
        const response = await axios.get('/api/message-requests/sent');
        const requestIds = response.data.requests
        .filter(r => r.status === 'pending')
        .map(r => r.recipient._id || r.recipient);
        setSentRequests(new Set(requestIds));
      } catch (error) {
        console.error('Erreur chargement demandes:', error);
      }
    };

  const loadProfiles = async (newFilters = null) => {
    try {
      setLoading(true);
      const filtersToUse = newFilters || filters;
      
      console.log('Chargement profils avec filtres:', filtersToUse);
      
      const response = await axios.post('/api/swipe/profiles', {
        ...filtersToUse,
        limit: 50 // Augmenter la limite
      });
      
      console.log('Profils reçus:', response.data);
      
      setProfiles(response.data.profiles || []);
      setCurrentIndex(0);
      
      if (!response.data.profiles || response.data.profiles.length === 0) {
        toast.error('Aucun profil trouvé. Essayez d\'élargir vos filtres.');
      }
    } catch (error) {
      console.error('Erreur chargement profils:', error);
      toast.error('Erreur lors du chargement des profils');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction, userId) => {
    try {
      if (direction === 'right') {
        const response = await axios.post(`/api/swipe/like/${userId}`);
        if (response.data.match) {
          toast.success(`🎉 C'est un match !`, { duration: 5000 });
        }
      } else if (direction === 'left') {
        await axios.post(`/api/swipe/dislike/${userId}`);
      }
      
      setCurrentIndex(prev => prev + 1);
      
      if (currentIndex >= profiles.length - 3) {
        loadProfiles();
      }
    } catch (error) {
      console.error('Erreur swipe:', error);
      toast.error('Erreur lors du swipe');
    }
  };

  const handleMessage = (userId) => {
    const profile = profiles.find(p => (p._id || p.id) === userId);
    setShowMessageModal(profile);
    };
    const handleSendMessage = async (message) => {
    try {
    const userId = showMessageModal._id || showMessageModal.id;
    
    await axios.post(`/api/message-requests/send/${userId}`, {
      message: message
    });
    
    setSentRequests(prev => new Set([...prev, userId]));
    setShowMessageModal(null);
    
    toast.success('Message envoyé ! En attente de réponse...', {
      icon: '📬',
      duration: 4000
    });
    
    } catch (error) {
    console.error('Erreur envoi message:', error);
    toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi');
    throw error;
    }
    };

    const handleApplyFilters = (newFilters) => {
    console.log('Application nouveaux filtres:', newFilters);
    setFilters(newFilters);
    setShowFilters(false);
    loadProfiles(newFilters);
    toast.success('Filtres appliqués !');
  };

  const currentProfile = profiles[currentIndex];

  if (loading && profiles.length === 0) {
    return (
      <div className="swipe-container">
        <div className="swipe-header">
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <div className="logo">
            <FiHeart className="logo-icon" />
            <span>Globostream</span>
          </div>
          <Navigation />
        </div>
        <div className="loading-state">
          <div className="loading" style={{ width: 60, height: 60 }}></div>
          <p>Chargement des profils...</p>
        </div>
      </div>
    );
  }

  if (!currentProfile && profiles.length === 0) {
    return (
      <div className="swipe-container">
        <div className="swipe-header">
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <div className="logo">
            <FiHeart className="logo-icon" />
            <span>Globostream</span>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary filter-btn"
              onClick={() => setShowFilters(true)}
            >
              <FiSliders />
              <span className="desktop-only">Filtres</span>
            </button>
            <Navigation />
          </div>
        </div>
        <div className="empty-state">
          <FiHeart size={80} />
          <h2>Plus de profils disponibles</h2>
          <p>Essayez d'ajuster vos filtres pour voir plus de profils</p>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowFilters(true)}
          >
            <FiFilter /> Modifier les filtres
          </button>
        </div>
        
        {showFilters && (
          <FiltersPanel
            filters={filters}
            onClose={() => setShowFilters(false)}
            onApply={handleApplyFilters}
          />
        )}
      </div>
    );
  }

  return (
    <div className="swipe-container">
      <div className="swipe-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <div className="logo">
          <FiHeart className="logo-icon" />
          <span>Globostream</span>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary filter-btn"
            onClick={() => setShowFilters(true)}
          >
            <FiSliders />
            <span className="desktop-only">Filtres</span>
          </button>
          <Navigation />
        </div>
      </div>

      <div className="swipe-main">
        <div className="swipe-card-container">
          <AnimatePresence mode="wait">
            {currentProfile && (
              <ProfileCard
                key={currentProfile._id || currentProfile.id}
                profile={currentProfile}
                onSwipe={handleSwipe}
                onMessage={handleMessage}
                onShowProfile={() => setShowProfile(currentProfile)}
                sentRequests={sentRequests}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="swipe-actions">
          <button
            className="action-btn dislike"
            onClick={() => handleSwipe('left', currentProfile._id || currentProfile.id)}
            title="Passer"
          >
            <FiX />
          </button>
          
          <button
            className="action-btn message"
            onClick={() => handleMessage(currentProfile._id || currentProfile.id)}
            title="Envoyer un message"
          >
            <FiMail />
          </button>
          
          <button
            className="action-btn like"
            onClick={() => handleSwipe('right', currentProfile._id || currentProfile.id)}
            title="J'aime"
          >
            <FiHeart />
          </button>
        </div>

        <div className="profiles-counter">
          {profiles.length - currentIndex} profil{profiles.length - currentIndex > 1 ? 's' : ''} restant{profiles.length - currentIndex > 1 ? 's' : ''}
        </div>
      </div>

      {showFilters && (
        <FiltersPanel
          filters={filters}
          onClose={() => setShowFilters(false)}
          onApply={handleApplyFilters}
        />
      )}

      <AnimatePresence>
        {showProfile && (
          <ProfileModal
            profile={showProfile}
            onClose={() => setShowProfile(null)}
            onLike={() => {
              handleSwipe('right', showProfile._id || showProfile.id);
              setShowProfile(null);
            }}
            onPass={() => {
              handleSwipe('left', showProfile._id || showProfile.id);
              setShowProfile(null);
            }}
            onMessage={() => {
              handleMessage(showProfile._id || showProfile.id);
              setShowProfile(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMessageModal && (
          <MessageModal
            profile={showMessageModal}
            onClose={() => setShowMessageModal(null)}
            onSend={handleSendMessage}
            alreadySent={sentRequests.has(showMessageModal._id || showMessageModal.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ProfileCard = ({ profile, onSwipe, onMessage, onShowProfile, sentRequests }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-30, 30]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event, info) => {
    const threshold = 150;
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      onSwipe(direction, profile._id || profile.id);
    }
  };

  const primaryPhoto = profile.photos?.find(p => p.isPrimary) || profile.photos?.[0];
  const age = profile.age || Math.floor((Date.now() - new Date(profile.birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
  const genderIcon = profile.gender === 'homme' ? 'M' : profile.gender === 'femme' ? 'F' : '-';

  return (
    <motion.div
      className="swipe-card"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-image" onClick={onShowProfile}>
        {primaryPhoto ? (
          <img src={primaryPhoto.url} alt={profile.displayName} />
        ) : (
          <div className="placeholder-image">
            <FiHeart size={80} />
          </div>
        )}
        
        {profile.isLive && (
          <div className="live-badge">
            <span className="live-dot"></span>
            EN DIRECT
          </div>
        )}

        <motion.div
          className="swipe-indicator like"
          style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
        >
          <FiHeart size={48} />
          <span>LIKE</span>
        </motion.div>
        
        <motion.div
          className="swipe-indicator nope"
          style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
        >
          <FiX size={48} />
          <span>NOPE</span>
        </motion.div>
      </div>

      <div className="card-info" onClick={onShowProfile}>
        <div className="card-main-info">
          <h2>
            {profile.displayName || profile.firstName}, {age}
            <span className="gender-badge">{genderIcon}</span>
          </h2>
          {profile.location?.city && (
            <p className="location">
              <FiMapPin size={16} />
              {profile.location.city}
              {profile.location.country && `, ${profile.location.country}`}
              {profile.distance && ` • ${profile.distance}km`}
            </p>
          )}
          {profile.bio && (
            <p className="bio-preview">{profile.bio.substring(0, 80)}...</p>
          )}
        </div>
      </div>

      {sentRequests.has(profile._id || profile.id) && (
        <motion.div
          className="message-sent-postit"
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: -8 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <FiMail />
          <span>Message envoyé</span>
        </motion.div>
      )}
    </motion.div>
  );
};

const ProfileModal = ({ profile, onClose, onLike, onPass, onMessage }) => {
  const age = profile.age || Math.floor((Date.now() - new Date(profile.birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
  const primaryPhoto = profile.photos?.find(p => p.isPrimary) || profile.photos?.[0];

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="profile-modal"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <FiX />
        </button>

        <div className="modal-photo">
          {primaryPhoto ? (
            <img src={primaryPhoto.url} alt={profile.displayName} />
          ) : (
            <div className="placeholder-modal">
              <FiHeart size={80} />
            </div>
          )}
        </div>

        <div className="modal-content">
          <div className="modal-header-info">
            <h2>{profile.displayName || profile.firstName}, {age}</h2>
            <p className="location">
              <FiMapPin /> 
              {profile.location?.city && profile.location?.country
                ? `${profile.location.city}, ${profile.location.country}`
                : profile.location?.city || 'Ville non renseignée'}
              {profile.distance && ` • ${profile.distance}km`}
            </p>
          </div>

          {profile.bio && (
            <div className="modal-section">
              <h3>À propos</h3>
              <p>{profile.bio}</p>
            </div>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div className="modal-section">
              <h3>Centres d'intérêt</h3>
              <div className="interests-tags">
                {profile.interests.map((interest, i) => (
                  <span key={i} className="interest-tag">{interest}</span>
                ))}
              </div>
            </div>
          )}

          <div className="modal-section">
            <h3>Informations</h3>
            <div className="info-list">
              {profile.occupation && (
                <div className="info-item">
                  <span className="info-label">Profession</span>
                  <span className="info-value">{profile.occupation}</span>
                </div>
              )}
              {profile.height && (
                <div className="info-item">
                  <span className="info-label">Taille</span>
                  <span className="info-value">{profile.height} cm</span>
                </div>
              )}
              {profile.languages && profile.languages.length > 0 && (
                <div className="info-item">
                  <span className="info-label">Langues</span>
                  <span className="info-value">{profile.languages.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn btn-outline-danger" onClick={onPass}>
              <FiX /> Passer
            </button>
            <button className="btn btn-secondary" onClick={onMessage}>
              <FiMail /> Message
            </button>
            <button className="btn btn-primary" onClick={onLike}>
              <FiHeart /> J'aime
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Swipe;
