import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// framer-motion disponible pour animations futures
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { 
  FiArrowLeft, FiHeart, FiEdit2, FiCamera, FiX, FiCheck, 
  FiMapPin, FiStar, FiAward
} from 'react-icons/fi';
import LocationPicker from '../components/LocationPicker';
import { getPhotoUrl } from '../utils/photoUrl';
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
  const { t } = useTranslation();

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const endpoint = isOwnProfile ? '/api/users/me' : `/api/users/${userId}`;
      const response = await axios.get(endpoint);
      setProfile(response.data.user);
      setFormData(response.data.user);
    } catch (error) {
      toast.error(t('profile.loadError'));
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
      toast.success(t('profile.updateSuccess'));
    } catch (error) {
      toast.error(t('profile.updateError'));
      console.error(error);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.photoTooBig'));
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setUploadingPhoto(true);
      await axios.post('/api/users/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('profile.photoAdded'));
      loadProfile();
    } catch (error) {
      toast.error(t('profile.photoUploadError'));
      console.error(error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm(t('profile.confirmDeletePhoto'))) return;
    
    try {
      await axios.delete(`/api/users/photos/${photoId}`);
      toast.success(t('profile.photoDeleted'));
      loadProfile();
    } catch (error) {
      toast.error(t('profile.photoDeleteError'));
    }
  };

  const handleSetPrimaryPhoto = async (photoId) => {
    try {
      await axios.patch(`/api/users/photos/${photoId}/primary`);
      toast.success(t('profile.mainPhotoUpdated'));
      loadProfile();
    } catch (error) {
      toast.error(t('profile.mainPhotoError'));
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t('profile.geoNotSupported'));
      return;
    }

    toast.loading(t('profile.geoFetching'));
    
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
          toast.success(t('profile.geoSuccess'));
        } catch (error) {
          toast.dismiss();
          toast.error(t('profile.geoError'));
        }
      },
      (error) => {
        toast.dismiss();
        toast.error(t('profile.geoImpossible'));
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
        <button className="btn btn-ghost" onClick={() => navigate('/home')}>
          <FiArrowLeft />
        </button>
        <div className="logo">
          <FiHeart className="logo-icon" />
          <span>{t('profile.title')}</span>
        </div>
        <div className="header-actions">
          <Navigation />
        </div>
      </div>

      <div className="profile-content">
        {/* Photos Section */}
        <div className="profile-photos-section">
          <h3>{t('profile.photos')}</h3>
          <div className="photos-grid">
            {profile?.photos?.map((photo, index) => (
              <div key={photo._id} className="photo-item">
                <img src={getPhotoUrl(photo.url)} alt={`${index + 1}`} />
                {photo.isPrimary && (
                  <span className="primary-badge">
                    <FiStar /> {t('profile.mainPhoto')}
                  </span>
                )}
                {isOwnProfile && isEditing && (
                  <div className="photo-actions">
                    {!photo.isPrimary && (
                      <button 
                        className="photo-btn primary"
                        onClick={() => handleSetPrimaryPhoto(photo._id)}
                        title={t('profile.setMain')}
                      >
                        <FiStar />
                      </button>
                    )}
                    <button 
                      className="photo-btn delete"
                      onClick={() => handleDeletePhoto(photo._id)}
                      title={t('profile.deletePhoto')}
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
                    <span>{t('profile.addPhoto')}</span>
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
          <p className="photos-hint">{t('profile.photosInfo')}</p>
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
                  placeholder={t('register.firstName')}
                />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={handleChange}
                  placeholder={t('register.lastName')}
                />
              </div>
            ) : (
              <h1>
                {profile?.firstName} {profile?.lastName}{profile?.age ? `, ${profile.age}` : ''}
                {profile?.isVerified && (
                  <span className="verified-badge" title={t('profile.verified')}>
                    <FiCheck />
                  </span>
                )}
                {profile?.isPremium && (
                  <span className="premium-badge" title={t('profile.premium')}>
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
                    <FiCheck /> {t('common.save')}
                  </button>
                  <button className="btn btn-secondary" onClick={() => {
                    setIsEditing(false);
                    setFormData(profile);
                  }}>
                    <FiX /> {t('common.cancel')}
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  <FiEdit2 /> {t('profile.editProfile')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="profile-details">
          {/* Bio */}
          <div className="detail-card">
            <h3>{t('profile.aboutMe')}</h3>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                placeholder={t('profile.bioPlaceholder')}
                maxLength={500}
                rows={4}
              />
            ) : (
              <p>{profile?.bio || t('profile.noBio')}</p>
            )}
          </div>

          {/* Basic Info */}
          <div className="detail-card">
            <h3>{t('profile.basicInfo')}</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>{t('profile.gender')}</label>
                {isEditing ? (
                  <select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="homme">{t('profile.male')}</option>
                    <option value="femme">{t('profile.female')}</option>
                    <option value="autre">{t('profile.otherGender')}</option>
                  </select>
                ) : (
                  <span>{profile?.gender === 'homme' ? t('profile.male') : profile?.gender === 'femme' ? t('profile.female') : t('profile.otherGender')}</span>
                )}
              </div>

              <div className="info-item">
                <label>{t('profile.height')}</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="height"
                    value={formData.height || ''}
                    onChange={handleChange}
                    placeholder={t('profile.heightPlaceholder')}
                  />
                ) : (
                  <span>{profile?.height ? `${profile.height} cm` : t('common.notProvided')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Location with Country */}
          <div className="form-group">
            <label>
              <FiMapPin />
              {t('profile.location')}
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
                    : profile?.location?.city || t('common.notProvided')}
                </span>
              </div>
            )}
          </div>

          {/* Languages with Checkboxes */}
          <div className="detail-card">
            <h3>{t('profile.languages')}</h3>
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
                  <span>{t('common.notProvided')}</span>
                )}
              </div>
            )}
          </div>

          {/* Personal Life */}
          <div className="detail-card">
            <h3>{t('profile.personalLife')}</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>{t('profile.children')}</label>
                {isEditing ? (
                  <select name="hasChildren" value={formData.hasChildren || 'non-precise'} onChange={handleChange}>
                    <option value="oui">{t('profile.childrenYes')}</option>
                    <option value="non">{t('profile.childrenNo')}</option>
                    <option value="non-precise">{t('profile.childrenPreferNot')}</option>
                  </select>
                ) : (
                  <span>{profile?.hasChildren || t('common.notSpecified')}</span>
                )}
              </div>

              <div className="info-item">
                <label>{t('profile.smoker')}</label>
                {isEditing ? (
                  <select name="smoker" value={formData.smoker || 'non'} onChange={handleChange}>
                    <option value="non">{t('profile.smokerNo')}</option>
                    <option value="oui">{t('profile.smokerYes')}</option>
                    <option value="rarement">{t('profile.smokerRarely')}</option>
                    <option value="souvent">{t('profile.smokerOften')}</option>
                  </select>
                ) : (
                  <span>{profile?.smoker || t('profile.smokerNo')}</span>
                )}
              </div>

              <div className="info-item">
                <label>{t('profile.housing')}</label>
                {isEditing ? (
                  <select name="housing" value={formData.housing || 'autre'} onChange={handleChange}>
                    <option value="seul">{t('profile.housingAlone')}</option>
                    <option value="colocation">{t('profile.housingShared')}</option>
                    <option value="parents">{t('profile.housingParents')}</option>
                    <option value="etudiant">{t('profile.housingStudent')}</option>
                    <option value="autre">{t('profile.housingOther')}</option>
                  </select>
                ) : (
                  <span>{profile?.housing || t('common.notProvided')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Orientation */}
          <div className="detail-card">
            <h3>{t('profile.orientation')}</h3>
            {isEditing ? (
              <select name="sexualOrientation" value={formData.sexualOrientation || 'non-precise'} onChange={handleChange}>
                <option value="heterosexuel">{t('profile.orientationHetero')}</option>
                <option value="homosexuel">{t('profile.orientationHomo')}</option>
                <option value="bisexuel">{t('profile.orientationBi')}</option>
                <option value="autre">{t('profile.orientationOther')}</option>
                <option value="non-precise">{t('profile.orientationPreferNot')}</option>
              </select>
            ) : (
              <p>{profile?.sexualOrientation || t('common.notProvided')}</p>
            )}
          </div>

          {/* Profession */}
          <div className="detail-card">
            <h3>{t('profile.profession')}</h3>
            {isEditing ? (
              <input
                type="text"
                name="occupation"
                value={formData.occupation || ''}
                onChange={handleChange}
                placeholder={t('profile.professionPlaceholder')}
              />
            ) : (
              <p>{profile?.occupation || t('common.notProvided')}</p>
            )}
          </div>

          {/* Interests */}
          <div className="detail-card">
            <h3>{t('profile.interests')}</h3>
            {isEditing ? (
              <input
                type="text"
                value={formData.interests?.join(', ') || ''}
                onChange={(e) => handleArrayChange(e, 'interests')}
                placeholder={t('profile.interestsPlaceholder')}
              />
            ) : (
              <div className="tags">
                {profile?.interests?.length > 0 ? (
                  profile.interests.map((interest, i) => (
                    <span key={i} className="tag interest-tag">{interest}</span>
                  ))
                ) : (
                  <span>{t('common.notProvided')}</span>
                )}
              </div>
            )}
          </div>

          {/* Looking for */}
          <div className="detail-card">
            <h3>{t('profile.lookingFor')}</h3>
            {isEditing ? (
              <select name="lookingFor" value={formData.lookingFor || 'ne-sais-pas'} onChange={handleChange}>
                <option value="relation-serieuse">{t('profile.lookingSerious')}</option>
                <option value="rencontre-casual">{t('profile.lookingCasual')}</option>
                <option value="amitie">{t('profile.lookingFriends')}</option>
                <option value="ne-sais-pas">{t('profile.lookingUnsure')}</option>
              </select>
            ) : (
              <p>{profile?.lookingFor || t('common.notSpecified')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
