import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, FiHeart, FiMail, FiMapPin, FiUser, 
  FiCheck, FiStar, FiCrown, 
  FiHexagon
} from 'react-icons/fi';
import Navigation from '../components/Navigation';
import './PublicProfile.css';

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/public-profile/${userId}`);
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      toast.error('Impossible de charger ce profil');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await axios.post(`/api/swipe/like/${userId}`);
      if (response.data.match) {
        toast.success('🎉 C\'est un match !', { duration: 5000 });
      } else {
        toast.success('Like envoyé !');
      }
      setProfile(prev => ({ ...prev, hasLiked: true }));
    } catch (error) {
      toast.error('Erreur lors du like');
    }
  };

  const handleMessage = () => {
    if (profile.isMatch) {
      navigate(`/chat/${userId}`);
    } else {
      navigate('/swipe'); // Retour au swipe pour envoyer une demande
      toast('Retournez sur le swipe pour envoyer un message', {
        icon: '💬'
      });
    }
  };

  if (loading) {
    return (
      <div className="public-profile-container">
        <div className="loading-state">
          <div className="loading" style={{ width: 60, height: 60 }}></div>
          <p>Chargement du profil...</p>
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
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <h2>Profil</h2>
        <Navigation />
      </div>

      <div className="public-profile-content">
        {/* Photos */}
        <div className="profile-photos-section">
          <div className="main-photo">
            {currentPhoto ? (
              <img src={currentPhoto.url} alt={profile.displayName} />
            ) : (
              <div className="placeholder-photo">
                <FiUser size={80} />
              </div>
            )}

            {profile.isLive && (
              <div className="live-badge">
                <span className="live-dot"></span>
                EN DIRECT
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
                  <img src={photo.url} alt={`Photo ${index + 1}`} />
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
                  <FiCheck className="verified-badge" title="Profil vérifié" />
                )}
                {profile.isPremium && (
                  <FiHexagon className="premium-badge" title="Membre Premium" />
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
              <h3>À propos</h3>
              <p>{profile.bio}</p>
            </div>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div className="info-card">
              <h3>Centres d'intérêt</h3>
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
            <h3>Informations</h3>
            <div className="info-grid">
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
              {profile.hasChildren && (
                <div className="info-item">
                  <span className="info-label">Enfants</span>
                  <span className="info-value">
                    {profile.hasChildren === 'oui' ? 'Oui' : 
                     profile.hasChildren === 'non' ? 'Non' : 'Non précisé'}
                  </span>
                </div>
              )}
              {profile.smoker && (
                <div className="info-item">
                  <span className="info-label">Fumeur</span>
                  <span className="info-value">
                    {profile.smoker === 'oui' ? 'Oui' : 
                     profile.smoker === 'non' ? 'Non' : 
                     profile.smoker === 'rarement' ? 'Occasionnel' : 'Souvent'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {profile.languages && profile.languages.length > 0 && (
            <div className="info-card">
              <h3>Langues parlées</h3>
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
              J'aime
            </button>
          )}
          
          {profile.isMatch ? (
            <button className="btn btn-secondary action-btn" onClick={handleMessage}>
              <FiMail />
              Envoyer un message
            </button>
          ) : profile.hasLiked ? (
            <div className="liked-notice">
              <FiCheck />
              <span>Vous avez liké ce profil</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
