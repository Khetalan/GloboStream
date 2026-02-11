import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, FiBell, FiLock, FiEye, FiEyeOff, FiShield,
  FiGlobe, FiMoon, FiTrash2, FiAlertCircle, FiCheck
} from 'react-icons/fi';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
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
  const [saving, setSaving] = useState(false);

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
      toast.success('Paramètres mis à jour');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Erreur lors de la mise à jour');
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
      toast.success('Paramètres mis à jour');
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast.error('Erreur lors de la mise à jour');
      setPrivacy(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setChangingPassword(true);

    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast.success('Mot de passe modifié avec succès');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error || 'Erreur lors du changement');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ Êtes-vous sûr de vouloir supprimer votre compte ?\n\n' +
      'Cette action est IRRÉVERSIBLE.\n' +
      'Toutes vos données seront définitivement supprimées.'
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'Dernière confirmation : Voulez-vous vraiment supprimer votre compte ?'
    );

    if (!doubleConfirm) return;

    try {
      await axios.delete('/api/users/me');
      toast.success('Compte supprimé');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading-state">
          <div className="loading"></div>
          <p>Chargement...</p>
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
        <h1>Paramètres</h1>
        <Navigation />
      </div>

      <div className="settings-content">
        {/* Section Notifications */}
        <div className="settings-section">
          <div className="section-header">
            <FiBell className="section-icon" />
            <h2>Notifications</h2>
          </div>

          <div className="settings-list">
            <SettingToggle
              label="Nouveaux matchs"
              description="Recevoir une notification lors d'un nouveau match"
              checked={notifications.newMatches}
              onChange={() => handleNotificationChange('newMatches')}
            />

            <SettingToggle
              label="Messages"
              description="Recevoir une notification pour les nouveaux messages"
              checked={notifications.messages}
              onChange={() => handleNotificationChange('messages')}
            />

            <SettingToggle
              label="Likes reçus"
              description="Être notifié quand quelqu'un vous like"
              checked={notifications.likes}
              onChange={() => handleNotificationChange('likes')}
            />

            <SettingToggle
              label="Demandes de messages"
              description="Notifications pour les demandes de messages"
              checked={notifications.messageRequests}
              onChange={() => handleNotificationChange('messageRequests')}
            />

            <SettingToggle
              label="Notifications par email"
              description="Recevoir des notifications sur votre email"
              checked={notifications.emailNotifications}
              onChange={() => handleNotificationChange('emailNotifications')}
            />
          </div>
        </div>

        {/* Section Mot de passe */}
        <div className="settings-section">
          <div className="section-header">
            <FiLock className="section-icon" />
            <h2>Sécurité</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="password-form">
            <div className="form-group">
              <label>Mot de passe actuel</label>
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
              <label>Nouveau mot de passe</label>
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
              <label>Confirmer le nouveau mot de passe</label>
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
              {changingPassword ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>

        {/* Section Confidentialité */}
        <div className="settings-section">
          <div className="section-header">
            <FiShield className="section-icon" />
            <h2>Confidentialité</h2>
          </div>

          <div className="settings-list">
            <SettingToggle
              label="Afficher ma distance"
              description="Les autres peuvent voir ma distance approximative"
              checked={privacy.showDistance}
              onChange={() => handlePrivacyChange('showDistance')}
            />

            <SettingToggle
              label="Afficher mon âge"
              description="Mon âge est visible sur mon profil"
              checked={privacy.showAge}
              onChange={() => handlePrivacyChange('showAge')}
            />

            <SettingToggle
              label="Afficher mon statut en ligne"
              description="Les matchs peuvent voir si je suis en ligne"
              checked={privacy.showOnline}
              onChange={() => handlePrivacyChange('showOnline')}
            />

            <SettingToggle
              label="Autoriser les demandes de messages"
              description="Les non-matchs peuvent m'envoyer des demandes"
              checked={privacy.allowMessageRequests}
              onChange={() => handlePrivacyChange('allowMessageRequests')}
            />
          </div>
        </div>

        {/* Section Danger Zone */}
        <div className="settings-section danger-section">
          <div className="section-header">
            <FiAlertCircle className="section-icon" />
            <h2>Zone de danger</h2>
          </div>

          <div className="danger-actions">
            <div className="danger-item">
              <div>
                <h3>Supprimer mon compte</h3>
                <p>Action irréversible. Toutes vos données seront supprimées.</p>
              </div>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
              >
                <FiTrash2 />
                Supprimer
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
