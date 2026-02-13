import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import {
  FiArrowLeft, FiBell, FiLock, FiEye, FiEyeOff, FiShield,
  FiTrash2, FiAlertCircle, FiGlobe
} from 'react-icons/fi';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import './Settings.css';

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' }
];

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation();

  // États Notifications
  const [notifications, setNotifications] = useState({
    newMatches: true,
    messages: true,
    likes: true,
    messageRequests: true,
    emailNotifications: false
  });

  // États Mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // États Confidentialité
  const [privacy, setPrivacy] = useState({
    showDistance: true,
    showAge: true,
    showOnline: true,
    allowMessageRequests: true
  });

  // États généraux
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // TODO: Charger settings depuis API
      // const response = await axios.get('/api/users/settings');
      // setNotifications(response.data.notifications);
      // setPrivacy(response.data.privacy);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key) => {
    const newValue = !notifications[key];
    setNotifications(prev => ({ ...prev, [key]: newValue }));

    try {
      await axios.patch('/api/users/settings/notifications', {
        [key]: newValue
      });
      toast.success(t('settings.settingsUpdated'));
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error(t('settings.settingsUpdateError'));
      // Rollback
      setNotifications(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handlePrivacyChange = async (key) => {
    const newValue = !privacy[key];
    setPrivacy(prev => ({ ...prev, [key]: newValue }));

    try {
      await axios.patch('/api/users/settings/privacy', {
        [key]: newValue
      });
      toast.success(t('settings.settingsUpdated'));
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast.error(t('settings.settingsUpdateError'));
      setPrivacy(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t('settings.passwordTooShort'));
      return;
    }

    setChangingPassword(true);

    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast.success(t('settings.passwordChanged'));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error || t('settings.passwordChangeError'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(t('settings.deleteConfirm'));

    if (!confirmed) return;

    const doubleConfirm = window.confirm(t('settings.deleteLastConfirm'));

    if (!doubleConfirm) return;

    try {
      await axios.delete('/api/users/me');
      toast.success(t('settings.accountDeleted'));
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(t('settings.deleteError'));
    }
  };

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading-state">
          <div className="loading"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <h1>{t('settings.title')}</h1>
        <Navigation />
      </div>

      <div className="settings-content">
        {/* Section Langue */}
        <div className="settings-section">
          <div className="section-header">
            <FiGlobe className="section-icon" />
            <h2>{t('settings.language')}</h2>
          </div>

          <p className="section-description">{t('settings.languageDesc')}</p>

          <div className="language-selector">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                className={`language-btn ${i18n.language === lang.code ? 'active' : ''}`}
                onClick={() => handleLanguageChange(lang.code)}
              >
                <span className="language-flag">{lang.flag}</span>
                <span className="language-label">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section Notifications */}
        <div className="settings-section">
          <div className="section-header">
            <FiBell className="section-icon" />
            <h2>{t('settings.notifications')}</h2>
          </div>

          <div className="settings-list">
            <SettingToggle
              label={t('settings.newMatches')}
              description={t('settings.newMatchesDesc')}
              checked={notifications.newMatches}
              onChange={() => handleNotificationChange('newMatches')}
            />

            <SettingToggle
              label={t('settings.messagesNotif')}
              description={t('settings.messagesNotifDesc')}
              checked={notifications.messages}
              onChange={() => handleNotificationChange('messages')}
            />

            <SettingToggle
              label={t('settings.likesReceived')}
              description={t('settings.likesReceivedDesc')}
              checked={notifications.likes}
              onChange={() => handleNotificationChange('likes')}
            />

            <SettingToggle
              label={t('settings.messageRequests')}
              description={t('settings.messageRequestsDesc')}
              checked={notifications.messageRequests}
              onChange={() => handleNotificationChange('messageRequests')}
            />

            <SettingToggle
              label={t('settings.emailNotif')}
              description={t('settings.emailNotifDesc')}
              checked={notifications.emailNotifications}
              onChange={() => handleNotificationChange('emailNotifications')}
            />
          </div>
        </div>

        {/* Section Mot de passe */}
        <div className="settings-section">
          <div className="section-header">
            <FiLock className="section-icon" />
            <h2>{t('settings.security')}</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="password-form">
            <div className="form-group">
              <label>{t('settings.currentPassword')}</label>
              <div className="password-input">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({
                    ...prev,
                    currentPassword: e.target.value
                  }))}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPasswords(prev => ({
                    ...prev,
                    current: !prev.current
                  }))}
                >
                  {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>{t('settings.newPassword')}</label>
              <div className="password-input">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({
                    ...prev,
                    newPassword: e.target.value
                  }))}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPasswords(prev => ({
                    ...prev,
                    new: !prev.new
                  }))}
                >
                  {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>{t('settings.confirmPassword')}</label>
              <div className="password-input">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPasswords(prev => ({
                    ...prev,
                    confirm: !prev.confirm
                  }))}
                >
                  {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={changingPassword}
            >
              {changingPassword ? t('settings.changingPassword') : t('settings.changePassword')}
            </button>
          </form>
        </div>

        {/* Section Confidentialité */}
        <div className="settings-section">
          <div className="section-header">
            <FiShield className="section-icon" />
            <h2>{t('settings.privacy')}</h2>
          </div>

          <div className="settings-list">
            <SettingToggle
              label={t('settings.showDistance')}
              description={t('settings.showDistanceDesc')}
              checked={privacy.showDistance}
              onChange={() => handlePrivacyChange('showDistance')}
            />

            <SettingToggle
              label={t('settings.showAge')}
              description={t('settings.showAgeDesc')}
              checked={privacy.showAge}
              onChange={() => handlePrivacyChange('showAge')}
            />

            <SettingToggle
              label={t('settings.showOnline')}
              description={t('settings.showOnlineDesc')}
              checked={privacy.showOnline}
              onChange={() => handlePrivacyChange('showOnline')}
            />

            <SettingToggle
              label={t('settings.allowRequests')}
              description={t('settings.allowRequestsDesc')}
              checked={privacy.allowMessageRequests}
              onChange={() => handlePrivacyChange('allowMessageRequests')}
            />
          </div>
        </div>

        {/* Section Danger Zone */}
        <div className="settings-section danger-section">
          <div className="section-header">
            <FiAlertCircle className="section-icon" />
            <h2>{t('settings.dangerZone')}</h2>
          </div>

          <div className="danger-actions">
            <div className="danger-item">
              <div>
                <h3>{t('settings.deleteAccount')}</h3>
                <p>{t('settings.deleteAccountDesc')}</p>
              </div>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
              >
                <FiTrash2 />
                {t('settings.deleteButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingToggle = ({ label, description, checked, onChange }) => {
  return (
    <div className="setting-toggle">
      <div className="setting-info">
        <h4>{label}</h4>
        <p>{description}</p>
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
};

export default Settings;
