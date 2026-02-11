import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { 
  FiArrowLeft, FiHeart, FiEdit2, FiCamera, FiX, FiCheck, 
  FiMapPin, FiStar, FiAward, FiGlobe 
} from 'react-icons/fi';
import LocationPicker from '../components/LocationPicker';
import './Profile.css';

const COMMON_LANGUAGES = [
  'Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien',
  'Portugais', 'Arabe', 'Chinois', 'Japonais', 'Russe',
  'Néerlandais', 'Turc', 'Polonais', 'Suédois', 'Norvégien'
];

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const endpoint = isOwnProfile ? '/api/users/me' : `/api/users/${userId}`;
      const response = await axios.get(endpoint);
      setProfile(response.data.user);
      setFormData(response.data.user);
    } catch (error) {
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLanguageToggle = (language) => {
    setFormData(prev => {
      const currentLanguages = prev.languages || [];
      const newLanguages = currentLanguages.includes(language)
        ? currentLanguages.filter(l => l !== language)
        : [...currentLanguages, language];
      return {
        ...prev,
        languages: newLanguages
      };
    });
  };

  const handleArrayChange = (e, fieldName) => {
    const value = e.target.value;
    const array = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      [fieldName]: array
    }));
  };

  const handleSave = async () => {
    try {
      const response = await axios.patch('/api/users/me', formData);
      setProfile(response.data.user);
      updateUser(response.data.user);
      setIsEditing(false);
      toast.success('✅ Profil mis à jour avec succès !');
    } catch (error) {
      toast.error('❌ Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La photo ne doit pas dépasser 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setUploadingPhoto(true);
      const response = await axios.post('/api/users/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('📷 Photo ajoutée !');
      loadProfile();
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
      console.error(error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Supprimer cette photo ?')) return;
    
    try {
      await axios.delete(`/api/users/photos/${photoId}`);
      toast.success('Photo supprimée');
      loadProfile();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSetPrimaryPhoto = async (photoId) => {
    try {
      await axios.patch(`/api/users/photos/${photoId}/primary`);
      toast.success('Photo principale mise à jour');
      loadProfile();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée');
      return;
    }

    toast.loading('Récupération de votre position...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const city = data.address.city || data.address.town || data.address.village || '';
          const country = data.address.country || '';
          
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              city: city,
              country: country,
              coordinates: [longitude, latitude]
            }
          }));
          
          toast.dismiss();
          toast.success('📍 Position récupérée !');
        } catch (error) {
          toast.dismiss();
          toast.error('Erreur lors de la récupération de la position');
        }
      },
      (error) => {
        toast.dismiss();
        toast.error('Impossible de récupérer votre position');
      }
    );
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="loading" style={{ width: 60, height: 60 }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <div className="logo">
          <FiHeart className="logo-icon" />
          <span>Mon Profil</span>
        </div>
        <div className="header-actions">
          <Navigation />
        </div>
      </div>

      <div className="profile-content">
        {/* Photos Section */}
        <div className="profile-photos-section">
          <h3>Mes Photos</h3>
          <div className="photos-grid">
            {profile?.photos?.map((photo, index) => (
              <div key={photo._id} className="photo-item">
                <img src={photo.url} alt={`Photo ${index + 1}`} />
                {photo.isPrimary && (
                  <span className="primary-badge">
                    <FiStar /> Principal
                  </span>
                )}
                {isOwnProfile && isEditing && (
                  <div className="photo-actions">
                    {!photo.isPrimary && (
                      <button 
                        className="photo-btn primary"
                        onClick={() => handleSetPrimaryPhoto(photo._id)}
                        title="Définir comme principale"
                      >
                        <FiStar />
                      </button>
                    )}
                    <button 
                      className="photo-btn delete"
                      onClick={() => handleDeletePhoto(photo._id)}
                      title="Supprimer"
                    >
                      <FiX />
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {isOwnProfile && isEditing && profile?.photos?.length < 6 && (
              <label className="photo-upload">
                {uploadingPhoto ? (
                  <div className="loading"></div>
                ) : (
                  <>
                    <FiCamera size={32} />
                    <span>Ajouter une photo</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  hidden
                />
              </label>
            )}
          </div>
          <p className="photos-hint">Maximum 6 photos • 5MB par photo</p>
        </div>

        {/* Main Info */}
        <div className="profile-main-info">
          <div className="name-section">
            {isEditing ? (
              <div className="form-row">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName || ''}
                  onChange={handleChange}
                  placeholder="Prénom"
                />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={handleChange}
                  placeholder="Nom"
                />
              </div>
            ) : (
              <h1>
                {profile?.firstName} {profile?.lastName}, {profile?.age}
                {profile?.isVerified && (
                  <span className="verified-badge" title="Profil vérifié">
                    <FiCheck />
                  </span>
                )}
                {profile?.isPremium && (
                  <span className="premium-badge" title="Membre Premium">
                    <FiAward />
                  </span>
                )}
              </h1>
            )}
          </div>

          {isOwnProfile && (
            <div className="edit-actions">
              {isEditing ? (
                <>
                  <button className="btn btn-primary" onClick={handleSave}>
                    <FiCheck /> Sauvegarder
                  </button>
                  <button className="btn btn-secondary" onClick={() => {
                    setIsEditing(false);
                    setFormData(profile);
                  }}>
                    <FiX /> Annuler
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  <FiEdit2 /> Modifier le profil
                </button>
              )}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="profile-details">
          {/* Bio */}
          <div className="detail-card">
            <h3>À propos de moi</h3>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                placeholder="Parlez de vous... (500 caractères max)"
                maxLength={500}
                rows={4}
              />
            ) : (
              <p>{profile?.bio || 'Pas de biographie'}</p>
            )}
          </div>

          {/* Basic Info */}
          <div className="detail-card">
            <h3>Informations de base</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Genre</label>
                {isEditing ? (
                  <select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                    <option value="autre">Autre</option>
                  </select>
                ) : (
                  <span>{profile?.gender === 'homme' ? 'M' : profile?.gender === 'femme' ? 'F' : 'Autre'}</span>
                )}
              </div>

              <div className="info-item">
                <label>Taille (cm)</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="height"
                    value={formData.height || ''}
                    onChange={handleChange}
                    placeholder="175"
                  />
                ) : (
                  <span>{profile?.height ? `${profile.height} cm` : 'Non renseigné'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Location with Country */}
          <div className="form-group">
            <label>
              <FiMapPin />
              Localisation
            </label>
            {isEditing ? (
              <LocationPicker
                city={formData.location?.city || ''}
                country={formData.location?.country || ''}
                coordinates={formData.location?.coordinates || [0, 0]}
                onChange={(location) => {
                  setFormData(prev => ({
                    ...prev,
                    location: {
                      type: 'Point',
                      coordinates: location.coordinates,
                      city: location.city,
                      country: location.country
                    }
                  }));
                }}
              />
            ) : (
              <div className="info-display">
                <FiMapPin />
                <span>
                  {profile?.location?.city && profile?.location?.country
                    ? `${profile.location.city}, ${profile.location.country}`
                    : profile?.location?.city || 'Non renseigné'}
                </span>
              </div>
            )}
          </div>

          {/* Languages with Checkboxes */}
          <div className="detail-card">
            <h3>Langues parlées</h3>
            {isEditing ? (
              <div className="languages-grid">
                {COMMON_LANGUAGES.map((lang) => (
                  <label key={lang} className="language-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.languages?.includes(lang) || false}
                      onChange={() => handleLanguageToggle(lang)}
                    />
                    <span>{lang}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="tags">
                {profile?.languages?.length > 0 ? (
                  profile.languages.map((lang, i) => (
                    <span key={i} className="tag">{lang}</span>
                  ))
                ) : (
                  <span>Non renseigné</span>
                )}
              </div>
            )}
          </div>

          {/* Personal Life */}
          <div className="detail-card">
            <h3>Vie personnelle</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Enfants</label>
                {isEditing ? (
                  <select name="hasChildren" value={formData.hasChildren || 'non-precise'} onChange={handleChange}>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                    <option value="non-precise">Préfère ne pas dire</option>
                  </select>
                ) : (
                  <span>{profile?.hasChildren || 'Non précisé'}</span>
                )}
              </div>

              <div className="info-item">
                <label>Fumeur</label>
                {isEditing ? (
                  <select name="smoker" value={formData.smoker || 'non'} onChange={handleChange}>
                    <option value="non">Non</option>
                    <option value="oui">Oui</option>
                    <option value="rarement">Rarement</option>
                    <option value="souvent">Souvent</option>
                  </select>
                ) : (
                  <span>{profile?.smoker || 'Non'}</span>
                )}
              </div>

              <div className="info-item">
                <label>Logement</label>
                {isEditing ? (
                  <select name="housing" value={formData.housing || 'autre'} onChange={handleChange}>
                    <option value="seul">Seul(e)</option>
                    <option value="colocation">Colocation</option>
                    <option value="parents">Parents</option>
                    <option value="etudiant">Étudiant</option>
                    <option value="autre">Autre</option>
                  </select>
                ) : (
                  <span>{profile?.housing || 'Non renseigné'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Orientation */}
          <div className="detail-card">
            <h3>Orientation sexuelle</h3>
            {isEditing ? (
              <select name="sexualOrientation" value={formData.sexualOrientation || 'non-precise'} onChange={handleChange}>
                <option value="heterosexuel">Hétérosexuel(le)</option>
                <option value="homosexuel">Homosexuel(le)</option>
                <option value="bisexuel">Bisexuel(le)</option>
                <option value="autre">Autre</option>
                <option value="non-precise">Préfère ne pas dire</option>
              </select>
            ) : (
              <p>{profile?.sexualOrientation || 'Non renseigné'}</p>
            )}
          </div>

          {/* Profession */}
          <div className="detail-card">
            <h3>Profession</h3>
            {isEditing ? (
              <input
                type="text"
                name="occupation"
                value={formData.occupation || ''}
                onChange={handleChange}
                placeholder="Designer, Développeur..."
              />
            ) : (
              <p>{profile?.occupation || 'Non renseigné'}</p>
            )}
          </div>

          {/* Interests */}
          <div className="detail-card">
            <h3>Centres d'intérêt</h3>
            {isEditing ? (
              <input
                type="text"
                value={formData.interests?.join(', ') || ''}
                onChange={(e) => handleArrayChange(e, 'interests')}
                placeholder="Voyages, Sport, Musique"
              />
            ) : (
              <div className="tags">
                {profile?.interests?.length > 0 ? (
                  profile.interests.map((interest, i) => (
                    <span key={i} className="tag interest-tag">{interest}</span>
                  ))
                ) : (
                  <span>Non renseigné</span>
                )}
              </div>
            )}
          </div>

          {/* Looking for */}
          <div className="detail-card">
            <h3>Je recherche</h3>
            {isEditing ? (
              <select name="lookingFor" value={formData.lookingFor || 'ne-sais-pas'} onChange={handleChange}>
                <option value="relation-serieuse">Une relation sérieuse</option>
                <option value="rencontre-casual">Rencontres décontractées</option>
                <option value="amitie">De nouveaux amis</option>
                <option value="ne-sais-pas">Je ne sais pas encore</option>
              </select>
            ) : (
              <p>{profile?.lookingFor || 'Non précisé'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
