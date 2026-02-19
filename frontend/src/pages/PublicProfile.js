import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, FiHeart, FiMail, FiMapPin, FiUser, 
  FiCheck,
  FiHexagon
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import Navigation from '../components/Navigation';
import { getPhotoUrl } from '../utils/photoUrl';
import './PublicProfile.css';

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/public-profile/${userId}`);
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      toast.error(t('publicProfile.loadError'));
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await axios.post(`/api/swipe/like/${userId}`);
      if (response.data.match) {
        toast.success(t('publicProfile.itsAMatch'), { duration: 5000 });
      } else {
        toast.success(t('publicProfile.likeSent'));
      }
      setProfile(prev => ({ ...prev, hasLiked: true }));
    } catch (error) {
      toast.error(t('publicProfile.likeError'));
    }
  };

  const handleMessage = () => {
    if (profile.isMatch) {
      navigate(`/chat/${userId}`);
    } else {
      navigate('/swipe'); // Retour au swipe pour envoyer une demande
      toast(t('publicProfile.goToSwipe'), {
        icon: '💬'
      });
    }
  };

  if (loading) {
    return (
      <div className="public-profile-container">
        <div className="loading-state">
          <div className="loading" style={{ width: 60, height: 60 }}></div>
          <p>{t('publicProfile.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const photos = profile.photos || [];
  const currentPhoto = photos[currentPhotoIndex];

  return (
    <div className="public-profile-container">
      <div className="public-profile-header">
        <button className="btn btn-ghost" onClick={() => navigate('/home')}>
          <FiArrowLeft />
        </button>
        <h2>{t('publicProfile.title')}</h2>
        <Navigation />
      </div>

      <div className="public-profile-content">
        {/* Photos */}
        <div className="profile-photos-section">
          <div className="main-photo">
            {currentPhoto ? (
              <img src={getPhotoUrl(currentPhoto.url)} alt={profile.displayName} />
            ) : (
              <div className="placeholder-photo">
                <FiUser size={80} />
              </div>
            )}

            {profile.isLive && (
              <div className="live-badge">
                <span className="live-dot"></span>
                {t('publicProfile.live')}
              </div>
            )}

            {photos.length > 1 && (
              <>
                <button 
                  className="photo-nav prev"
                  onClick={() => setCurrentPhotoIndex(prev => 
                    prev === 0 ? photos.length - 1 : prev - 1
                  )}
                >
                  ‹
                </button>
                <button 
                  className="photo-nav next"
                  onClick={() => setCurrentPhotoIndex(prev => 
                    prev === photos.length - 1 ? 0 : prev + 1
                  )}
                >
                  ›
                </button>
                <div className="photo-indicators">
                  {photos.map((_, index) => (
                    <div 
                      key={index}
                      className={`indicator ${index === currentPhotoIndex ? 'active' : ''}`}
                      onClick={() => setCurrentPhotoIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="photo-thumbnails">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className={`thumbnail ${index === currentPhotoIndex ? 'active' : ''}`}
                  onClick={() => setCurrentPhotoIndex(index)}
                >
                  <img src={getPhotoUrl(photo.url)} alt={`${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informations */}
        <div className="profile-info-section">
          <div className="profile-header-info">
            <div className="name-line">
              <h1>
                {profile.displayName || profile.firstName}, {profile.age}
                {profile.isVerified && (
                  <FiCheck className="verified-badge" title={t('publicProfile.verified')} />
                )}
                {profile.isPremium && (
                  <FiHexagon className="premium-badge" title={t('publicProfile.premium')} />
                )}
              </h1>
            </div>

            {profile.location?.city && (
              <p className="location-info">
                <FiMapPin />
                {profile.location.city}
                {profile.location.country && `, ${profile.location.country}`}
                {profile.distance && ` • ${profile.distance}km`}
              </p>
            )}
          </div>

          {profile.bio && (
            <div className="info-card">
              <h3>{t('publicProfile.about')}</h3>
              <p>{profile.bio}</p>
            </div>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div className="info-card">
              <h3>{t('publicProfile.interests')}</h3>
              <div className="interests-grid">
                {profile.interests.map((interest, i) => (
                  <span key={i} className="interest-tag">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="info-card">
            <h3>{t('publicProfile.info')}</h3>
            <div className="info-grid">
              {profile.occupation && (
                <div className="info-item">
                  <span className="info-label">{t('publicProfile.profession')}</span>
                  <span className="info-value">{profile.occupation}</span>
                </div>
              )}
              {profile.height && (
                <div className="info-item">
                  <span className="info-label">{t('publicProfile.height')}</span>
                  <span className="info-value">{profile.height} cm</span>
                </div>
              )}
              {profile.hasChildren && (
                <div className="info-item">
                  <span className="info-label">{t('publicProfile.children')}</span>
                  <span className="info-value">
                    {profile.hasChildren === 'oui' ? t('common.yes') :
                     profile.hasChildren === 'non' ? t('common.no') : t('common.notSpecified')}
                  </span>
                </div>
              )}
              {profile.smoker && (
                <div className="info-item">
                  <span className="info-label">{t('publicProfile.smoker')}</span>
                  <span className="info-value">
                    {profile.smoker === 'oui' ? t('common.yes') :
                     profile.smoker === 'non' ? t('common.no') :
                     profile.smoker === 'rarement' ? t('publicProfile.smokerOccasional') : t('publicProfile.smokerOften')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {profile.languages && profile.languages.length > 0 && (
            <div className="info-card">
              <h3>{t('publicProfile.languages')}</h3>
              <div className="languages-list">
                {profile.languages.map((lang, i) => (
                  <span key={i} className="language-tag">{lang}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="profile-actions">
          {!profile.hasLiked && !profile.isMatch && (
            <button className="btn btn-primary action-btn" onClick={handleLike}>
              <FiHeart />
              {t('publicProfile.like')}
            </button>
          )}
          
          {profile.isMatch ? (
            <button className="btn btn-secondary action-btn" onClick={handleMessage}>
              <FiMail />
              {t('publicProfile.sendMessage')}
            </button>
          ) : profile.hasLiked ? (
            <div className="liked-notice">
              <FiCheck />
              <span>{t('publicProfile.alreadyLiked')}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
