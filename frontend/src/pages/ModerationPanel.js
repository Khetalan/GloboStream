import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import {
  FiArrowLeft, FiShield, FiUsers, FiAlertTriangle, FiCheck,
  FiEye, FiBarChart2, FiUserX, FiVideo, FiX, FiClock, FiMessageSquare, FiList, FiGift
} from 'react-icons/fi';
import './ModerationPanel.css';

const ModerationPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setSelectedUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportPage, setReportPage] = useState(1);
  const [reportFilterStatus, setReportFilterStatus] = useState('');
  const [reportFilterType, setReportFilterType] = useState('');
  const [expandedNote, setExpandedNote] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);

  // Cadeaux
  const [giftCatalog, setGiftCatalog] = useState([]);
  const [giftsLoading, setGiftsLoading] = useState(false);
  const [giftForm, setGiftForm] = useState({ id: '', name: '', emoji: '', coinCost: '', globoValue: '', order: '' });
  const [editingGift, setEditingGift] = useState(null); // id du cadeau en édition

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
  }, [activeTab, reportPage, reportFilterStatus, reportFilterType, logsPage]);

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
      } else if (activeTab === 'reports') {
        const params = { page: reportPage, limit: 20 };
        if (reportFilterStatus) params.status = reportFilterStatus;
        if (reportFilterType) params.type = reportFilterType;
        const response = await axios.get('/api/reports', { params });
        setReports(response.data.reports);
        setReportsTotal(response.data.total);
      } else if (activeTab === 'logs' && currentUser.privilegeLevel >= 2) {
        const response = await axios.get('/api/moderation/logs', { params: { page: logsPage, limit: 50 } });
        setLogs(response.data.logs);
        setLogsTotal(response.data.total);
      } else if (activeTab === 'gifts' && currentUser.privilegeLevel >= 2) {
        setGiftsLoading(true);
        const response = await axios.get('/api/gifts/catalog/all');
        setGiftCatalog(response.data.gifts || []);
        setGiftsLoading(false);
      }
    } catch (error) {
      toast.error(t('moderation.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReport = async (reportId, status, note) => {
    try {
      const body = { status };
      if (note !== undefined) body.moderatorNote = note;
      await axios.patch(`/api/reports/${reportId}`, body);
      toast.success(t('moderation.updateReportSuccess'));
      setExpandedNote(null);
      setNoteInput('');
      loadData();
    } catch (error) {
      toast.error(t('moderation.updateReportError'));
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending:   { label: t('moderation.statusPending'),   cls: 'status-pending'   },
      reviewed:  { label: t('moderation.statusReviewed'),  cls: 'status-reviewed'  },
      resolved:  { label: t('moderation.statusResolved'),  cls: 'status-resolved'  },
      dismissed: { label: t('moderation.statusDismissed'), cls: 'status-dismissed' }
    };
    const s = map[status] || map.pending;
    return <span className={`report-status-badge ${s.cls}`}>{s.label}</span>;
  };

  const getTypeBadge = (type) => {
    const map = {
      profile: t('moderation.typeProfile'),
      message: t('moderation.typeMessage'),
      live:    t('moderation.typeLive'),
      user:    t('moderation.typeUser')
    };
    return <span className="report-type-badge">{map[type] || type}</span>;
  };

  const getReasonLabel = (reason) => {
    const map = {
      harassment:    t('moderation.reasonHarassment'),
      spam:          t('moderation.reasonSpam'),
      inappropriate: t('moderation.reasonInappropriate'),
      underage:      t('moderation.reasonUnderage'),
      violence:      t('moderation.reasonViolence'),
      other:         t('moderation.reasonOther')
    };
    return map[reason] || reason;
  };

  const getActionLabel = (action) => {
    const map = {
      ban:               '🔨 Ban',
      unban:             '✅ Unban',
      warn:              '⚠️ Avertissement',
      promote_moderator: '⬆️ Promo Modérateur',
      demote_moderator:  '⬇️ Rétrogradation',
      promote_admin:     '⭐ Promo Admin',
      update_permissions:'🔧 Permissions',
      report_reviewed:   '👁 Rapport examiné',
      report_resolved:   '✅ Rapport résolu',
      report_dismissed:  '❌ Rapport rejeté',
      live_kick:         '👢 Kick live',
      live_block:        '🚫 Block live',
      stream_stopped:    '⏹ Stream arrêté'
    };
    return map[action] || action;
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

  const handleGiftSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGift) {
        await axios.patch(`/api/gifts/catalog/${editingGift}`, {
          name: giftForm.name,
          emoji: giftForm.emoji,
          coinCost: parseInt(giftForm.coinCost, 10),
          globoValue: parseInt(giftForm.globoValue, 10),
          order: parseInt(giftForm.order, 10) || 0
        });
        toast.success(t('gifts.updateSuccess'));
      } else {
        await axios.post('/api/gifts/catalog', {
          id: giftForm.id,
          name: giftForm.name,
          emoji: giftForm.emoji,
          coinCost: parseInt(giftForm.coinCost, 10),
          globoValue: parseInt(giftForm.globoValue, 10),
          order: parseInt(giftForm.order, 10) || 0
        });
        toast.success(t('gifts.createSuccess'));
      }
      setGiftForm({ id: '', name: '', emoji: '', coinCost: '', globoValue: '', order: '' });
      setEditingGift(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('gifts.saveError'));
    }
  };

  const handleGiftToggle = async (gift) => {
    try {
      await axios.patch(`/api/gifts/catalog/${gift.id}`, { isActive: !gift.isActive });
      loadData();
    } catch {
      toast.error(t('gifts.saveError'));
    }
  };

  const startEditGift = (gift) => {
    setEditingGift(gift.id);
    setGiftForm({
      id: gift.id,
      name: gift.name,
      emoji: gift.emoji,
      coinCost: gift.coinCost,
      globoValue: gift.globoValue,
      order: gift.order || 0
    });
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
          {currentUser.privilegeLevel >= 2 && (
            <button
              className={`sidebar-btn ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              <FiList /> {t('moderation.logs')}
            </button>
          )}
          {currentUser.privilegeLevel >= 2 && (
            <button
              className={`sidebar-btn ${activeTab === 'gifts' ? 'active' : ''}`}
              onClick={() => setActiveTab('gifts')}
            >
              <FiGift /> {t('gifts.catalog')}
            </button>
          )}
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
              <div className="table-header">
                <h2>{t('moderation.reports')} <span className="reports-count">({reportsTotal})</span></h2>
                <div className="reports-filters">
                  <select
                    value={reportFilterStatus}
                    onChange={e => { setReportFilterStatus(e.target.value); setReportPage(1); }}
                    className="filter-select"
                  >
                    <option value="">{t('moderation.filterAll')} — {t('moderation.status')}</option>
                    <option value="pending">{t('moderation.statusPending')}</option>
                    <option value="reviewed">{t('moderation.statusReviewed')}</option>
                    <option value="resolved">{t('moderation.statusResolved')}</option>
                    <option value="dismissed">{t('moderation.statusDismissed')}</option>
                  </select>
                  <select
                    value={reportFilterType}
                    onChange={e => { setReportFilterType(e.target.value); setReportPage(1); }}
                    className="filter-select"
                  >
                    <option value="">{t('moderation.filterAll')} — {t('moderation.reportType')}</option>
                    <option value="profile">{t('moderation.typeProfile')}</option>
                    <option value="message">{t('moderation.typeMessage')}</option>
                    <option value="live">{t('moderation.typeLive')}</option>
                    <option value="user">{t('moderation.typeUser')}</option>
                  </select>
                </div>
              </div>

              {reports.length === 0 ? (
                <p className="empty-message">{t('moderation.noReports')}</p>
              ) : (
                <>
                  <div className="reports-list">
                    {reports.map(report => (
                      <div key={report._id} className={`report-card ${report.status}`}>
                        <div className="report-card-header">
                          <div className="report-users">
                            <span className="report-reporter">
                              <FiAlertTriangle size={13} />
                              {report.reporterId?.displayName || '—'}
                            </span>
                            <span className="report-arrow">→</span>
                            <span className="report-target">
                              {report.reportedUserId?.displayName || '—'}
                            </span>
                          </div>
                          <div className="report-meta">
                            {getTypeBadge(report.type)}
                            {getStatusBadge(report.status)}
                          </div>
                        </div>

                        <div className="report-card-body">
                          <span className="report-reason">{getReasonLabel(report.reason)}</span>
                          {report.description && (
                            <p className="report-description">{report.description}</p>
                          )}
                          <span className="report-date">
                            <FiClock size={12} />
                            {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {report.moderatorNote && (
                          <div className="report-existing-note">
                            <FiMessageSquare size={12} />
                            <span>{report.moderatorNote}</span>
                          </div>
                        )}

                        <div className="report-card-actions">
                          {report.status !== 'reviewed' && (
                            <button
                              className="btn-report-action reviewed"
                              onClick={() => handleUpdateReport(report._id, 'reviewed')}
                              title={t('moderation.markReviewed')}
                            >
                              <FiEye size={14} /> {t('moderation.markReviewed')}
                            </button>
                          )}
                          {report.status !== 'resolved' && (
                            <button
                              className="btn-report-action resolved"
                              onClick={() => handleUpdateReport(report._id, 'resolved')}
                              title={t('moderation.markResolved')}
                            >
                              <FiCheck size={14} /> {t('moderation.markResolved')}
                            </button>
                          )}
                          {report.status !== 'dismissed' && (
                            <button
                              className="btn-report-action dismissed"
                              onClick={() => handleUpdateReport(report._id, 'dismissed')}
                              title={t('moderation.markDismissed')}
                            >
                              <FiX size={14} /> {t('moderation.markDismissed')}
                            </button>
                          )}
                          <button
                            className="btn-report-action note"
                            onClick={() => {
                              if (expandedNote === report._id) {
                                setExpandedNote(null);
                              } else {
                                setExpandedNote(report._id);
                                setNoteInput(report.moderatorNote || '');
                              }
                            }}
                          >
                            <FiMessageSquare size={14} /> {t('moderation.note')}
                          </button>
                        </div>

                        {expandedNote === report._id && (
                          <div className="report-note-form">
                            <textarea
                              value={noteInput}
                              onChange={e => setNoteInput(e.target.value)}
                              placeholder={t('moderation.notePlaceholder')}
                              rows={2}
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleUpdateReport(report._id, report.status, noteInput)}
                            >
                              <FiCheck size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {reportsTotal > 20 && (
                    <div className="pagination">
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={reportPage === 1}
                        onClick={() => setReportPage(p => p - 1)}
                      >
                        ←
                      </button>
                      <span>{reportPage} / {Math.ceil(reportsTotal / 20)}</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={reportPage >= Math.ceil(reportsTotal / 20)}
                        onClick={() => setReportPage(p => p + 1)}
                      >
                        →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'logs' && currentUser.privilegeLevel >= 2 && (
            <div className="logs-section">
              <div className="table-header">
                <h2>{t('moderation.logs')} <span className="reports-count">({logsTotal})</span></h2>
              </div>

              {logs.length === 0 ? (
                <p className="empty-message">{t('moderation.noLogs')}</p>
              ) : (
                <>
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>{t('moderation.logAction')}</th>
                        <th>{t('moderation.logActor')}</th>
                        <th>{t('moderation.logTarget')}</th>
                        <th>{t('moderation.logDate')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log._id} className={`log-row log-${log.action.split('_')[0]}`}>
                          <td className="log-action">{getActionLabel(log.action)}</td>
                          <td>{log.actorName || '—'}</td>
                          <td>{log.targetName || '—'}</td>
                          <td className="log-date">
                            <FiClock size={12} />
                            {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {logsTotal > 50 && (
                    <div className="pagination">
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={logsPage === 1}
                        onClick={() => setLogsPage(p => p - 1)}
                      >
                        ←
                      </button>
                      <span>{logsPage} / {Math.ceil(logsTotal / 50)}</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={logsPage >= Math.ceil(logsTotal / 50)}
                        onClick={() => setLogsPage(p => p + 1)}
                      >
                        →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'streams' && (
            <div className="streams-section">
              <h2>{t('moderation.activeStreams')}</h2>
              <p className="empty-message">{t('moderation.noActiveStreams')}</p>
            </div>
          )}

          {activeTab === 'gifts' && currentUser.privilegeLevel >= 2 && (
            <div className="gifts-section">
              <div className="table-header">
                <h2>{t('gifts.catalog')}</h2>
              </div>

              {/* Formulaire création / édition */}
              <form className="gift-form" onSubmit={handleGiftSubmit}>
                <h3 className="gift-form-title">
                  {editingGift ? t('gifts.editGift') : t('gifts.addGift')}
                </h3>
                <div className="gift-form-row">
                  {!editingGift && (
                    <input
                      className="gift-input"
                      placeholder="id (ex: rose)"
                      value={giftForm.id}
                      onChange={e => setGiftForm(f => ({ ...f, id: e.target.value }))}
                      required
                    />
                  )}
                  <input
                    className="gift-input"
                    placeholder={t('common.name')}
                    value={giftForm.name}
                    onChange={e => setGiftForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                  <input
                    className="gift-input gift-input--emoji"
                    placeholder="emoji"
                    value={giftForm.emoji}
                    onChange={e => setGiftForm(f => ({ ...f, emoji: e.target.value }))}
                    required
                  />
                  <input
                    className="gift-input gift-input--num"
                    type="number" min="1"
                    placeholder={t('gifts.coinCost')}
                    value={giftForm.coinCost}
                    onChange={e => setGiftForm(f => ({ ...f, coinCost: e.target.value }))}
                    required
                  />
                  <input
                    className="gift-input gift-input--num"
                    type="number" min="1"
                    placeholder={t('gifts.globoValue')}
                    value={giftForm.globoValue}
                    onChange={e => setGiftForm(f => ({ ...f, globoValue: e.target.value }))}
                    required
                  />
                  <input
                    className="gift-input gift-input--num"
                    type="number" min="0"
                    placeholder="order"
                    value={giftForm.order}
                    onChange={e => setGiftForm(f => ({ ...f, order: e.target.value }))}
                  />
                </div>
                <div className="gift-form-actions">
                  <button type="submit" className="btn btn-primary btn-sm">
                    {editingGift ? t('common.save') : t('gifts.addGift')}
                  </button>
                  {editingGift && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditingGift(null); setGiftForm({ id: '', name: '', emoji: '', coinCost: '', globoValue: '', order: '' }); }}>
                      {t('common.cancel')}
                    </button>
                  )}
                </div>
              </form>

              {/* Table */}
              {giftsLoading ? (
                <p className="empty-message">{t('common.loading')}</p>
              ) : giftCatalog.length === 0 ? (
                <p className="empty-message">{t('gifts.noGifts')}</p>
              ) : (
                <table className="gifts-table">
                  <thead>
                    <tr>
                      <th>Emoji</th>
                      <th>{t('common.name')}</th>
                      <th>{t('gifts.coinCost')}</th>
                      <th>{t('gifts.globoValue')}</th>
                      <th>Order</th>
                      <th>{t('common.status')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {giftCatalog.map(gift => (
                      <tr key={gift.id} className={gift.isActive ? '' : 'gift-row--inactive'}>
                        <td className="gift-emoji-cell">{gift.emoji}</td>
                        <td>{gift.name}</td>
                        <td>🪙 {gift.coinCost}</td>
                        <td>🌐 {gift.globoValue}</td>
                        <td>{gift.order}</td>
                        <td>
                          <span className={`report-status-badge ${gift.isActive ? 'status-resolved' : 'status-dismissed'}`}>
                            {gift.isActive ? t('gifts.active') : t('gifts.inactive')}
                          </span>
                        </td>
                        <td className="gift-actions">
                          <button className="btn btn-ghost btn-xs" onClick={() => startEditGift(gift)}>✏️</button>
                          <button className="btn btn-ghost btn-xs" onClick={() => handleGiftToggle(gift)}>
                            {gift.isActive ? '🔕' : '✅'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModerationPanel;
