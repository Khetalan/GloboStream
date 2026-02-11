import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { 
  FiArrowLeft, FiShield, FiUsers, FiAlertTriangle, FiCheck,
  FiEye, FiBarChart2, FiUserX, FiVideo
} from 'react-icons/fi';
import './ModerationPanel.css';

const ModerationPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    // Vérifier si l'utilisateur a les droits
    if (!currentUser || currentUser.privilegeLevel < 1) {
      toast.error('Accès refusé');
      navigate('/');
      return;
    }

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'dashboard') {
        const response = await axios.get('/api/moderation/stats/global');
        setStats(response.data);
      } else if (activeTab === 'users') {
        const response = await axios.get('/api/moderation/users');
        setUsers(response.data.users);
      } else if (activeTab === 'moderators' && currentUser.privilegeLevel >= 2) {
        const response = await axios.get('/api/moderation/moderators');
        setModerators(response.data.moderators);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    const reason = prompt('Raison du bannissement :');
    if (!reason) return;

    const duration = prompt('Durée en jours (vide = permanent) :');

    try {
      await axios.post(`/api/moderation/ban/${userId}`, {
        reason,
        duration: duration ? parseInt(duration) : null
      });
      toast.success('Utilisateur banni');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du bannissement');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await axios.post(`/api/moderation/unban/${userId}`);
      toast.success('Utilisateur débanni');
      loadData();
    } catch (error) {
      toast.error('Erreur lors du débannissement');
    }
  };

  const handleWarnUser = async (userId) => {
    const reason = prompt('Raison de l\'avertissement :');
    if (!reason) return;

    try {
      await axios.post(`/api/moderation/warn/${userId}`, { reason });
      toast.success('Avertissement envoyé');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'avertissement');
    }
  };

  const handlePromoteModerator = async (userId) => {
    const permissions = {
      canBanUsers: window.confirm('Autoriser à bannir des utilisateurs ?'),
      canDeleteContent: window.confirm('Autoriser à supprimer du contenu ?'),
      canManageStreams: window.confirm('Autoriser à gérer les streams ?'),
      canViewReports: window.confirm('Autoriser à voir les signalements ?'),
      canIssueWarnings: window.confirm('Autoriser à émettre des avertissements ?')
    };

    try {
      await axios.post(`/api/moderation/promote/${userId}`, { permissions });
      toast.success('Utilisateur promu en modérateur');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la promotion');
    }
  };

  const handleDemoteModerator = async (userId) => {
    if (!window.confirm('Révoquer les privilèges de modérateur ?')) return;

    try {
      await axios.post(`/api/moderation/demote/${userId}`);
      toast.success('Privilèges révoqués');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la révocation');
    }
  };

  const handlePromoteAdmin = async (userId) => {
    if (!window.confirm('Promouvoir cet utilisateur en ADMINISTRATEUR ? Cette action ne peut être effectuée que par un Super Admin.')) return;

    try {
      await axios.post(`/api/moderation/promote-admin/${userId}`);
      toast.success('Utilisateur promu en administrateur');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la promotion');
    }
  };

  const getPrivilegeBadge = (level) => {
    const badges = {
      0: { label: 'Utilisateur', color: 'var(--text-tertiary)' },
      1: { label: 'Modérateur', color: 'var(--warning)' },
      2: { label: 'Admin', color: 'var(--error)' },
      3: { label: 'Super Admin', color: 'var(--primary)' }
    };
    const badge = badges[level] || badges[0];
    return <span className="privilege-badge" style={{ background: badge.color }}>{badge.label}</span>;
  };

  if (loading && !stats && users.length === 0) {
    return (
      <div className="moderation-container">
        <div className="loading-state">
          <div className="loading" style={{ width: 60, height: 60 }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="moderation-container">
      <div className="moderation-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <div className="logo">
          <FiShield className="logo-icon" />
          <span>Panel de Modération</span>
        </div>
        <Navigation />
      </div>

      <div className="moderation-main">
        {/* Sidebar */}
        <div className="moderation-sidebar">
          <button
            className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FiBarChart2 /> Dashboard
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers /> Utilisateurs
          </button>
          {currentUser.privilegeLevel >= 2 && (
            <button
              className={`sidebar-btn ${activeTab === 'moderators' ? 'active' : ''}`}
              onClick={() => setActiveTab('moderators')}
            >
              <FiShield /> Modérateurs
            </button>
          )}
          <button
            className={`sidebar-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FiAlertTriangle /> Signalements
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'streams' ? 'active' : ''}`}
            onClick={() => setActiveTab('streams')}
          >
            <FiVideo /> Streams Actifs
          </button>
        </div>

        {/* Content */}
        <div className="moderation-content">
          {activeTab === 'dashboard' && stats && (
            <div className="dashboard">
              <h2>Statistiques Globales</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <FiUsers className="stat-icon" />
                  <div className="stat-info">
                    <h3>{stats.totalUsers}</h3>
                    <p>Utilisateurs totaux</p>
                  </div>
                </div>
                <div className="stat-card">
                  <FiUserX className="stat-icon error" />
                  <div className="stat-info">
                    <h3>{stats.bannedUsers}</h3>
                    <p>Utilisateurs bannis</p>
                  </div>
                </div>
                <div className="stat-card">
                  <FiShield className="stat-icon warning" />
                  <div className="stat-info">
                    <h3>{stats.moderators}</h3>
                    <p>Modérateurs</p>
                  </div>
                </div>
                <div className="stat-card">
                  <FiCheck className="stat-icon success" />
                  <div className="stat-info">
                    <h3>{stats.verifiedUsers}</h3>
                    <p>Profils vérifiés</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-table">
              <div className="table-header">
                <h2>Gestion des Utilisateurs</h2>
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  className="search-input"
                />
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Niveau</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.displayName || user.firstName}</td>
                      <td>{user.email}</td>
                      <td>{getPrivilegeBadge(user.privilegeLevel)}</td>
                      <td>
                        {user.isBanned ? (
                          <span className="status-badge banned">Banni</span>
                        ) : user.isVerified ? (
                          <span className="status-badge verified">Vérifié</span>
                        ) : (
                          <span className="status-badge active">Actif</span>
                        )}
                      </td>
                      <td className="actions-cell">
                        {user.isBanned ? (
                          <button
                            className="btn-action success"
                            onClick={() => handleUnbanUser(user._id)}
                            title="Débannir"
                          >
                            <FiCheck />
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn-action warning"
                              onClick={() => handleWarnUser(user._id)}
                              title="Avertir"
                            >
                              <FiAlertTriangle />
                            </button>
                            <button
                              className="btn-action error"
                              onClick={() => handleBanUser(user._id)}
                              title="Bannir"
                              disabled={user.privilegeLevel >= 2}
                            >
                              <FiUserX />
                            </button>
                          </>
                        )}
                        {currentUser.privilegeLevel >= 2 && user.privilegeLevel === 0 && (
                          <button
                            className="btn-action primary"
                            onClick={() => handlePromoteModerator(user._id)}
                            title="Promouvoir modérateur"
                          >
                            <FiShield />
                          </button>
                        )}
                        <button
                          className="btn-action"
                          onClick={() => setSelectedUser(user)}
                          title="Voir détails"
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'moderators' && currentUser.privilegeLevel >= 2 && (
            <div className="moderators-table">
              <div className="table-header">
                <h2>Gestion des Modérateurs</h2>
              </div>
              <div className="moderators-grid">
                {moderators.map(mod => (
                  <div key={mod._id} className="moderator-card">
                    <div className="moderator-header">
                      <h3>{mod.displayName}</h3>
                      {getPrivilegeBadge(mod.privilegeLevel)}
                    </div>
                    <p className="moderator-email">{mod.email}</p>
                    
                    <div className="moderator-permissions">
                      <h4>Permissions</h4>
                      <div className="permissions-list">
                        {mod.moderationPermissions.canBanUsers && (
                          <span className="permission-badge">Bannir</span>
                        )}
                        {mod.moderationPermissions.canDeleteContent && (
                          <span className="permission-badge">Supprimer</span>
                        )}
                        {mod.moderationPermissions.canManageStreams && (
                          <span className="permission-badge">Gérer Streams</span>
                        )}
                        {mod.moderationPermissions.canViewReports && (
                          <span className="permission-badge">Voir Signalements</span>
                        )}
                        {mod.moderationPermissions.canIssueWarnings && (
                          <span className="permission-badge">Avertir</span>
                        )}
                      </div>
                    </div>

                    {mod.moderationStats && (
                      <div className="moderator-stats">
                        <div className="stat-item">
                          <span>Actions</span>
                          <strong>{mod.moderationStats.actionsPerformed}</strong>
                        </div>
                        <div className="stat-item">
                          <span>Signalements traités</span>
                          <strong>{mod.moderationStats.reportsHandled}</strong>
                        </div>
                      </div>
                    )}

                    <div className="moderator-actions">
                      {mod.privilegeLevel === 1 && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDemoteModerator(mod._id)}
                          >
                            Révoquer
                          </button>
                          {currentUser.privilegeLevel === 3 && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handlePromoteAdmin(mod._id)}
                            >
                              Promouvoir Admin
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="reports-section">
              <h2>Signalements</h2>
              <p className="empty-message">Aucun signalement pour le moment</p>
            </div>
          )}

          {activeTab === 'streams' && (
            <div className="streams-section">
              <h2>Streams Actifs</h2>
              <p className="empty-message">Aucun stream actif</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModerationPanel;
