import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  useEffect(() => {
    // Vérifier si l'utilisateur a les droits
    if (!currentUser || currentUser.privilegeLevel < 1) {
      toast.error(t('moderation.accessDenied'));
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
      toast.error(t('moderation.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    const reason = prompt(t('moderation.banReasonPrompt'));
    if (!reason) return;

    const duration = prompt(t('moderation.banDurationPrompt'));

    try {
      await axios.post(`/api/moderation/ban/${userId}`, {
        reason,
        duration: duration ? parseInt(duration) : null
      });
      toast.success(t('moderation.userBanned'));
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || t('moderation.banError'));
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await axios.post(`/api/moderation/unban/${userId}`);
      toast.success(t('moderation.userUnbanned'));
      loadData();
    } catch (error) {
      toast.error(t('moderation.unbanError'));
    }
  };

  const handleWarnUser = async (userId) => {
    const reason = prompt(t('moderation.warnReasonPrompt'));
    if (!reason) return;

    try {
      await axios.post(`/api/moderation/warn/${userId}`, { reason });
      toast.success(t('moderation.warningSent'));
      loadData();
    } catch (error) {
      toast.error(t('moderation.warnError'));
    }
  };

  const handlePromoteModerator = async (userId) => {
    const permissions = {
      canBanUsers: window.confirm(t('moderation.confirmPermBan')),
      canDeleteContent: window.confirm(t('moderation.confirmPermDelete')),
      canManageStreams: window.confirm(t('moderation.confirmPermStreams')),
      canViewReports: window.confirm(t('moderation.confirmPermReports')),
      canIssueWarnings: window.confirm(t('moderation.confirmPermWarn'))
    };

    try {
      await axios.post(`/api/moderation/promote/${userId}`, { permissions });
      toast.success(t('moderation.userPromoted'));
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || t('moderation.promoteError'));
    }
  };

  const handleDemoteModerator = async (userId) => {
    if (!window.confirm(t('moderation.confirmRevoke'))) return;

    try {
      await axios.post(`/api/moderation/demote/${userId}`);
      toast.success(t('moderation.privilegesRevoked'));
      loadData();
    } catch (error) {
      toast.error(t('moderation.revokeError'));
    }
  };

  const handlePromoteAdmin = async (userId) => {
    if (!window.confirm(t('moderation.confirmPromoteAdmin'))) return;

    try {
      await axios.post(`/api/moderation/promote-admin/${userId}`);
      toast.success(t('moderation.promotedToAdmin'));
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || t('moderation.promoteError'));
    }
  };

  const getPrivilegeBadge = (level) => {
    const badges = {
      0: { label: t('moderation.userLabel'), color: 'var(--text-tertiary)' },
      1: { label: t('moderation.modLabel'), color: 'var(--warning)' },
      2: { label: t('moderation.adminLabel'), color: 'var(--error)' },
      3: { label: t('moderation.superAdminLabel'), color: 'var(--primary)' }
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
        <button className="btn btn-ghost" onClick={() => navigate('/home')}>
          <FiArrowLeft />
        </button>
        <div className="logo">
          <FiShield className="logo-icon" />
          <span>{t('moderation.title')}</span>
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
            <FiBarChart2 /> {t('moderation.dashboard')}
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers /> {t('moderation.users')}
          </button>
          {currentUser.privilegeLevel >= 2 && (
            <button
              className={`sidebar-btn ${activeTab === 'moderators' ? 'active' : ''}`}
              onClick={() => setActiveTab('moderators')}
            >
              <FiShield /> {t('moderation.moderators')}
            </button>
          )}
          <button
            className={`sidebar-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FiAlertTriangle /> {t('moderation.reports')}
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'streams' ? 'active' : ''}`}
            onClick={() => setActiveTab('streams')}
          >
            <FiVideo /> {t('moderation.activeStreams')}
          </button>
        </div>

        {/* Content */}
        <div className="moderation-content">
          {activeTab === 'dashboard' && stats && (
            <div className="dashboard">
              <h2>{t('moderation.globalStats')}</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <FiUsers className="stat-icon" />
                  <div className="stat-info">
                    <h3>{stats.totalUsers}</h3>
                    <p>{t('moderation.totalUsers')}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <FiUserX className="stat-icon error" />
                  <div className="stat-info">
                    <h3>{stats.bannedUsers}</h3>
                    <p>{t('moderation.bannedUsers')}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <FiShield className="stat-icon warning" />
                  <div className="stat-info">
                    <h3>{stats.moderators}</h3>
                    <p>{t('moderation.moderators')}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <FiCheck className="stat-icon success" />
                  <div className="stat-info">
                    <h3>{stats.verifiedUsers}</h3>
                    <p>{t('moderation.verifiedProfiles')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-table">
              <div className="table-header">
                <h2>{t('moderation.userManagement')}</h2>
                <input
                  type="text"
                  placeholder={t('moderation.searchUser')}
                  className="search-input"
                />
              </div>
              <table>
                <thead>
                  <tr>
                    <th>{t('moderation.name')}</th>
                    <th>{t('moderation.email')}</th>
                    <th>{t('moderation.level')}</th>
                    <th>{t('moderation.status')}</th>
                    <th>{t('moderation.actions')}</th>
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
                          <span className="status-badge banned">{t('moderation.bannedLabel')}</span>
                        ) : user.isVerified ? (
                          <span className="status-badge verified">{t('moderation.verifiedLabel')}</span>
                        ) : (
                          <span className="status-badge active">{t('moderation.activeLabel')}</span>
                        )}
                      </td>
                      <td className="actions-cell">
                        {user.isBanned ? (
                          <button
                            className="btn-action success"
                            onClick={() => handleUnbanUser(user._id)}
                            title={t('moderation.unban')}
                          >
                            <FiCheck />
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn-action warning"
                              onClick={() => handleWarnUser(user._id)}
                              title={t('moderation.warn')}
                            >
                              <FiAlertTriangle />
                            </button>
                            <button
                              className="btn-action error"
                              onClick={() => handleBanUser(user._id)}
                              title={t('moderation.ban')}
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
                            title={t('moderation.promoteMod')}
                          >
                            <FiShield />
                          </button>
                        )}
                        <button
                          className="btn-action"
                          onClick={() => setSelectedUser(user)}
                          title={t('moderation.viewDetails')}
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
                <h2>{t('moderation.modManagement')}</h2>
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
                      <h4>{t('moderation.permissions')}</h4>
                      <div className="permissions-list">
                        {mod.moderationPermissions.canBanUsers && (
                          <span className="permission-badge">{t('moderation.permBan')}</span>
                        )}
                        {mod.moderationPermissions.canDeleteContent && (
                          <span className="permission-badge">{t('moderation.permDelete')}</span>
                        )}
                        {mod.moderationPermissions.canManageStreams && (
                          <span className="permission-badge">{t('moderation.permStreams')}</span>
                        )}
                        {mod.moderationPermissions.canViewReports && (
                          <span className="permission-badge">{t('moderation.permReports')}</span>
                        )}
                        {mod.moderationPermissions.canIssueWarnings && (
                          <span className="permission-badge">{t('moderation.permWarn')}</span>
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
                          <span>{t('moderation.reportsHandled')}</span>
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
                            {t('moderation.revoke')}
                          </button>
                          {currentUser.privilegeLevel === 3 && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handlePromoteAdmin(mod._id)}
                            >
                              {t('moderation.promoteAdmin')}
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
              <h2>{t('moderation.reports')}</h2>
              <p className="empty-message">{t('moderation.noReports')}</p>
            </div>
          )}

          {activeTab === 'streams' && (
            <div className="streams-section">
              <h2>{t('moderation.activeStreams')}</h2>
              <p className="empty-message">{t('moderation.noActiveStreams')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModerationPanel;
