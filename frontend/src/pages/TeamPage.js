import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io as socketIO } from 'socket.io-client';
import {
  FiArrowLeft, FiUsers, FiInfo, FiMessageCircle, FiSettings,
  FiPlus, FiSend, FiLogOut, FiTrash2, FiCheck, FiX, FiEdit2,
  FiUserCheck, FiUserX, FiList, FiChevronLeft
} from 'react-icons/fi';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import { getPhotoUrl } from '../utils/photoUrl';
import './TeamPage.css';

const TABS = ['members', 'info', 'chat', 'manage'];

const TeamPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('members');
  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Création d'équipe
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Panel inscription concours
  const [showEntryPanel, setShowEntryPanel] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [entryCompetition, setEntryCompetition] = useState('');
  const [entryParticipants, setEntryParticipants] = useState([]);
  const [entryInstructions, setEntryInstructions] = useState('');
  const [savingEntry, setSavingEntry] = useState(false);

  // Édition identité équipe (dans Gestion)
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editTagColor, setEditTagColor] = useState('#6366F1');
  const [saving, setSaving] = useState(false);

  // Transfert capitaine
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');

  // Édition Infos Générales
  const [editingInfo, setEditingInfo] = useState(false);
  const [editInfoText, setEditInfoText] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Listing équipes (rejoindre)
  const [showTeamList, setShowTeamList] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [requestSentIds, setRequestSentIds] = useState(new Set());

  // Chat
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [onlineMembers, setOnlineMembers] = useState([]);
  const chatBottomRef = useRef(null);
  const socketRef = useRef(null);

  const myUserId = user?._id || user?.id;
  const isCaptain = myTeam && myUserId &&
    myTeam.captain._id === myUserId;
  const myRole = myTeam?.members.find(
    m => m.user._id === myUserId
  )?.role || 'nouveau';
  const isOfficer = myRole === 'officer';

  // Charger mon équipe
  const fetchMyTeam = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/teams/mine');
      setMyTeam(res.data.team);
      if (res.data.team) {
        setEditName(res.data.team.name);
        setEditDesc(res.data.team.description || '');
      }
    } catch (err) {
      console.error('fetchMyTeam error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyTeam(); }, [fetchMyTeam]);

  // Socket.IO pour le chat d'équipe
  useEffect(() => {
    if (!myTeam?._id) return;

    const socket = socketIO(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true
    });
    socketRef.current = socket;

    socket.emit('register', myUserId);
    socket.emit('team:join', { teamId: myTeam._id });

    socket.on('team:message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('team:joinRequest', () => {
      fetchMyTeam();
    });

    socket.on('team:onlineUsers', ({ userIds }) => {
      const online = (myTeam.members || []).filter(
        m => userIds.includes(m.user._id?.toString() || m.user?.toString())
      );
      setOnlineMembers(online);
    });

    return () => {
      socket.emit('team:leave', { teamId: myTeam._id });
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTeam?._id]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCompetitions = useCallback(async () => {
    try {
      const res = await axios.get('/api/competitions');
      const active = (res.data.competitions || []).filter(
        c => c.status === 'active' || c.status === 'upcoming'
      );
      setCompetitions(active);
    } catch { /* silently fail */ }
  }, []);

  const openEntryPanel = (entry = null) => {
    fetchCompetitions();
    if (entry) {
      setEditingEntryId(entry._id);
      setEntryCompetition(entry.competition._id || entry.competition);
      setEntryParticipants(entry.participants.map(p => p._id || p));
      setEntryInstructions(entry.instructions || '');
    } else {
      setEditingEntryId(null);
      setEntryCompetition('');
      setEntryParticipants([]);
      setEntryInstructions('');
    }
    setShowEntryPanel(true);
  };

  const toggleParticipant = (userId) => {
    setEntryParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : prev.length < 5 ? [...prev, userId] : prev
    );
  };

  const handleSaveEntry = async () => {
    if (!entryCompetition) return toast.error(t('team.competitionRequired'));
    try {
      setSavingEntry(true);
      const payload = {
        competition: entryCompetition,
        participants: entryParticipants,
        instructions: entryInstructions
      };
      if (editingEntryId) {
        await axios.patch(`/api/teams/${myTeam._id}/entries/${editingEntryId}`, payload);
      } else {
        await axios.post(`/api/teams/${myTeam._id}/entries`, payload);
      }
      await fetchMyTeam();
      setShowEntryPanel(false);
      toast.success(t('team.entrySaved'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('team.entryError'));
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm(t('team.confirmDeleteEntry'))) return;
    try {
      await axios.delete(`/api/teams/${myTeam._id}/entries/${entryId}`);
      fetchMyTeam();
      toast.success(t('team.entryDeleted'));
    } catch { toast.error(t('team.entryError')); }
  };

  const fetchAvailableTeams = useCallback(async () => {
    try {
      setLoadingTeams(true);
      const res = await axios.get('/api/teams');
      setAvailableTeams(res.data.teams || []);
    } catch (err) {
      toast.error(t('team.loadError'));
    } finally {
      setLoadingTeams(false);
    }
  }, [t]);

  const handleShowTeamList = () => {
    setShowTeamList(true);
    fetchAvailableTeams();
  };

  const handleApply = async (teamId) => {
    try {
      await axios.post(`/api/teams/${teamId}/join`);
      setRequestSentIds(prev => new Set([...prev, teamId]));
      toast.success(t('team.requestSent'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('team.requestError'));
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) return toast.error(t('team.nameRequired'));
    try {
      setCreating(true);
      const res = await axios.post('/api/teams', {
        name: createName.trim(),
        description: createDesc.trim()
      });
      setMyTeam(res.data.team);
      setShowCreate(false);
      setCreateName('');
      setCreateDesc('');
      toast.success(t('team.created'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('team.createError'));
    } finally {
      setCreating(false);
    }
  };

  const handleSaveInfo = async () => {
    try {
      setSaving(true);
      const res = await axios.patch(`/api/teams/${myTeam._id}`, {
        name: editName.trim(),
        description: editDesc.trim(),
        emoji: editEmoji,
        tag: editTag.toUpperCase().slice(0, 5),
        tagColor: editTagColor
      });
      setMyTeam(prev => ({ ...prev, ...res.data.team }));
      setEditMode(false);
      toast.success(t('team.saved'));
    } catch (err) {
      toast.error(t('team.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneralInfo = async () => {
    try {
      setSavingInfo(true);
      const res = await axios.patch(`/api/teams/${myTeam._id}`, { generalInfo: editInfoText });
      setMyTeam(prev => ({ ...prev, generalInfo: res.data.team.generalInfo }));
      setEditingInfo(false);
      toast.success(t('team.saved'));
    } catch (err) {
      toast.error(t('team.saveError'));
    } finally {
      setSavingInfo(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget) return toast.error(t('team.selectMember'));
    if (!window.confirm(t('team.confirmTransfer'))) return;
    try {
      await axios.post(`/api/teams/${myTeam._id}/transfer/${transferTarget}`);
      setShowTransfer(false);
      fetchMyTeam();
      toast.success(t('team.transferred'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('team.transferError'));
    }
  };

  const handleLeave = async () => {
    if (!window.confirm(t('team.confirmLeave'))) return;
    try {
      await axios.post(`/api/teams/${myTeam._id}/leave`);
      setMyTeam(null);
      toast.success(t('team.left'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('team.leaveError'));
    }
  };

  const handleDissolve = async () => {
    if (!window.confirm(t('team.confirmDissolve'))) return;
    try {
      await axios.delete(`/api/teams/${myTeam._id}`);
      setMyTeam(null);
      toast.success(t('team.dissolved'));
    } catch (err) {
      toast.error(t('team.dissolveError'));
    }
  };

  const handleAccept = async (userId) => {
    try {
      await axios.post(`/api/teams/${myTeam._id}/accept/${userId}`);
      fetchMyTeam();
      toast.success(t('team.accepted'));
    } catch (err) {
      toast.error(t('team.acceptError'));
    }
  };

  const handleReject = async (userId) => {
    try {
      await axios.delete(`/api/teams/${myTeam._id}/reject/${userId}`);
      fetchMyTeam();
    } catch (err) {
      toast.error(t('team.rejectError'));
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      await axios.patch(`/api/teams/${myTeam._id}/member/${memberId}/role`, { newRole });
      fetchMyTeam();
      toast.success(t('team.roleChanged'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('team.roleError'));
    }
  };

  const handleKick = async (userId) => {
    if (!window.confirm(t('team.confirmKick'))) return;
    try {
      await axios.delete(`/api/teams/${myTeam._id}/reject/${userId}`);
      fetchMyTeam();
      toast.success(t('team.kicked'));
    } catch (err) {
      toast.error(t('team.kickError'));
    }
  };

  const handleSendMessage = () => {
    const text = msgInput.trim();
    if (!text || !socketRef.current) return;
    socketRef.current.emit('team:message', { teamId: myTeam._id, text });
    setMsgInput('');
  };

  const getUserName = (u) =>
    u?.displayName || u?.firstName || '?';

  const getAvatar = (u) => {
    const photo = u?.photos?.find(p => p.isPrimary) || u?.photos?.[0];
    return photo ? getPhotoUrl(photo.url) : null;
  };

  // ── Chargement ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="team-page">
        <TeamHeader onBack={() => navigate('/stream/competition', { state: { screen: 'liveList' } })} />
        <div className="team-loading">
          <div className="loading"></div>
        </div>
      </div>
    );
  }

  // ── Pas d'équipe : listing des équipes disponibles ────────
  if (!myTeam && showTeamList) {
    return (
      <div className="team-page">
        <TeamHeader
          onBack={() => setShowTeamList(false)}
          teamName={t('team.joinTitle')}
          backIcon={<FiChevronLeft />}
        />
        <div className="team-content">
          {loadingTeams ? (
            <div className="team-loading-inline">
              <div className="loading"></div>
            </div>
          ) : availableTeams.length === 0 ? (
            <div className="team-empty-list">
              <span>🏆</span>
              <p>{t('team.noTeamsAvailable')}</p>
            </div>
          ) : (
            <div className="team-available-list">
              {availableTeams.map((team) => {
                const isFull = team.members.length >= team.maxMembers;
                const alreadySent = requestSentIds.has(team._id);
                return (
                  <div key={team._id} className="team-available-card">
                    <div className="team-available-header">
                      <span className="team-available-emoji">{team.emoji}</span>
                      <div className="team-available-info">
                        <p className="team-available-name">{team.name}</p>
                        <p className="team-available-meta">
                          {team.members.length}/{team.maxMembers} {t('team.members')}
                          {!team.isOpen && (
                            <span className="team-closed-badge">{t('team.closed')}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {team.description ? (
                      <p className="team-available-desc">{team.description}</p>
                    ) : null}
                    <button
                      className={`btn team-apply-btn ${alreadySent ? 'sent' : 'primary'}`}
                      onClick={() => handleApply(team._id)}
                      disabled={isFull || !team.isOpen || alreadySent}
                    >
                      {alreadySent
                        ? `✓ ${t('team.requestSentShort')}`
                        : isFull || !team.isOpen
                        ? t('team.teamFull')
                        : t('team.applyBtn')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Pas d'équipe : rejoindre ou créer ─────────────────────
  if (!myTeam) {
    return (
      <div className="team-page">
        <TeamHeader onBack={() => navigate('/stream/competition', { state: { screen: 'liveList' } })} />

        <div className="team-no-team">
          <span className="team-no-team-emoji">🏆</span>
          <h2>{t('team.noTeamTitle')}</h2>
          <p>{t('team.noTeamDesc')}</p>

          {!showCreate ? (
            <div className="team-no-team-actions">
              <button className="btn btn-primary team-create-btn" onClick={() => setShowCreate(true)}>
                <FiPlus /> {t('team.createTeam')}
              </button>
              <button className="btn btn-secondary team-create-btn" onClick={handleShowTeamList}>
                <FiList /> {t('team.joinTeam')}
              </button>
            </div>
          ) : (
            <div className="team-create-form">
              <h3>{t('team.newTeam')}</h3>
              <input
                className="team-input"
                placeholder={t('team.namePlaceholder')}
                value={createName}
                maxLength={50}
                onChange={(e) => setCreateName(e.target.value)}
              />
              <textarea
                className="team-textarea"
                placeholder={t('team.descPlaceholder')}
                value={createDesc}
                maxLength={200}
                rows={3}
                onChange={(e) => setCreateDesc(e.target.value)}
              />
              <div className="team-create-actions">
                <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                  {t('common.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreate}
                  disabled={creating || !createName.trim()}
                >
                  {creating ? t('common.loading') : t('team.create')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Équipe trouvée : 4 onglets ─────────────────────────────
  const tabIcons = {
    members: FiUsers,
    info: FiInfo,
    chat: FiMessageCircle,
    manage: FiSettings
  };

  return (
    <div className="team-page">
      <TeamHeader onBack={() => navigate('/stream/competition', { state: { screen: 'liveList' } })} teamName={myTeam.name} />

      {/* Barre d'onglets */}
      <div className="team-tabs">
        {TABS.map(tab => {
          const Icon = tabIcons[tab];
          const showManage = tab === 'manage' && !isCaptain;
          if (showManage) return null;
          return (
            <button
              key={tab}
              className={`team-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <Icon />
              <span>{t(`team.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}</span>
              {tab === 'manage' && myTeam.joinRequests?.length > 0 && (
                <span className="team-tab-badge">{myTeam.joinRequests.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Onglet Membres ──────────────────────────────────── */}
      {activeTab === 'members' && (
        <div className="team-content">

          {/* Bulle candidatures (visible par tous) */}
          {myTeam.joinRequests?.length > 0 && (
            <div className="team-requests-bubble">
              <p className="team-requests-title">
                📥 {t('team.pendingRequests', { count: myTeam.joinRequests.length })}
              </p>
              <div className="team-requests-list">
                {myTeam.joinRequests.map((req) => {
                  const u = req.user;
                  const avatarUrl = getAvatar(u);
                  return (
                    <div key={u._id} className="team-request-row">
                      <div className="team-member-avatar small">
                        {avatarUrl
                          ? <img src={avatarUrl} alt={getUserName(u)} />
                          : <div className="team-avatar-placeholder">{getUserName(u).charAt(0)}</div>
                        }
                      </div>
                      <p className="team-member-name flex1">{getUserName(u)}</p>
                      {isCaptain && (
                        <>
                          <button className="btn btn-ghost team-action-btn accept" onClick={() => handleAccept(u._id)}>
                            <FiUserCheck />
                          </button>
                          <button className="btn btn-ghost team-action-btn reject" onClick={() => handleReject(u._id)}>
                            <FiUserX />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="team-member-count">
            {myTeam.members.length} / {myTeam.maxMembers} {t('team.members')}
          </p>
          <div className="team-members-list">
            {myTeam.members.map((m) => {
              const u = m.user;
              const avatarUrl = getAvatar(u);
              return (
                <div key={u._id} className="team-member-row">
                  <div className="team-member-avatar">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={getUserName(u)} />
                      : <div className="team-avatar-placeholder">{getUserName(u).charAt(0)}</div>
                    }
                  </div>
                  <div className="team-member-info">
                    <p className="team-member-name">{getUserName(u)}</p>
                    <span className={`team-role-badge role-${m.role}`}>
                      {t(`team.role_${m.role}`)}
                    </span>
                  </div>
                  {/* Boutons Captain : promo officer / rétro / kick */}
                  {isCaptain && m.role !== 'captain' && (
                    <div className="team-role-actions">
                      {m.role !== 'officer' && (
                        <button
                          className="btn btn-ghost team-action-btn promote"
                          onClick={() => handleChangeRole(u._id, 'officer')}
                          title={t('team.promoteOfficer')}
                        >
                          ⬆
                        </button>
                      )}
                      {m.role === 'officer' && (
                        <button
                          className="btn btn-ghost team-action-btn demote"
                          onClick={() => handleChangeRole(u._id, 'member')}
                          title={t('team.demote')}
                        >
                          ⬇
                        </button>
                      )}
                      <button
                        className="btn btn-ghost team-kick-btn"
                        onClick={() => handleKick(u._id)}
                        title={t('team.kick')}
                      >
                        <FiUserX />
                      </button>
                    </div>
                  )}
                  {/* Bouton Officer : promo nouveau → membre */}
                  {!isCaptain && isOfficer && m.role === 'nouveau' && u._id !== myUserId && (
                    <button
                      className="btn btn-ghost team-action-btn promote"
                      onClick={() => handleChangeRole(u._id, 'member')}
                      title={t('team.promoteToMember')}
                    >
                      ⬆
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Onglet Informations ─────────────────────────────── */}
      {activeTab === 'info' && (
        <div className="team-content">
          {/* Carte identité équipe (lecture seule) */}
          <div className="team-info-card">
            <div className="team-info-emoji">{myTeam.emoji}</div>
            <h2 className="team-info-name">{myTeam.name}</h2>
            {myTeam.description ? (
              <p className="team-info-desc">{myTeam.description}</p>
            ) : (
              <p className="team-info-desc team-info-empty">{t('team.noDesc')}</p>
            )}
          </div>

          {/* Bulle Informations Générales */}
          <div className="team-general-info-card">
            <div className="team-general-info-header">
              <p className="team-general-info-title">{t('team.generalInfo')}</p>
              {(isCaptain || isOfficer) && !editingInfo && (
                <button
                  className="btn btn-ghost team-edit-icon-btn"
                  onClick={() => {
                    setEditInfoText(myTeam.generalInfo || '');
                    setEditingInfo(true);
                  }}
                >
                  <FiEdit2 />
                </button>
              )}
            </div>

            {editingInfo ? (
              <div className="team-general-info-edit">
                <textarea
                  className="team-textarea"
                  value={editInfoText}
                  maxLength={500}
                  rows={4}
                  placeholder={t('team.generalInfoPlaceholder')}
                  onChange={(e) => setEditInfoText(e.target.value)}
                />
                <div className="team-general-info-actions">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setEditingInfo(false)}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveGeneralInfo}
                    disabled={savingInfo}
                  >
                    {savingInfo ? t('common.loading') : t('common.save')}
                  </button>
                </div>
              </div>
            ) : myTeam.generalInfo ? (
              <p className="team-general-info-text">{myTeam.generalInfo}</p>
            ) : (
              <p className="team-general-info-empty">{t('team.generalInfoEmpty')}</p>
            )}
          </div>

          {/* Section concours */}
          <div className="team-entries-section">
            <div className="team-entries-header">
              <h3 className="team-section-label">{t('team.competitionInfo')}</h3>
              {(isCaptain || isOfficer) && myTeam.competitionEntries?.length < 3 && (
                <button
                  className="btn btn-ghost team-add-entry-btn"
                  onClick={() => openEntryPanel()}
                >
                  <FiPlus /> {t('team.addEntry')}
                </button>
              )}
            </div>

            {(!myTeam.competitionEntries || myTeam.competitionEntries.length === 0) ? (
              <p className="team-entries-empty">{t('team.noEntries')}</p>
            ) : (
              myTeam.competitionEntries.map((entry) => (
                <div key={entry._id} className="team-entry-bubble">
                  <div className="team-entry-top">
                    <span className="team-entry-comp-name">
                      🏆 {entry.competition?.name || '—'}
                    </span>
                    {(isCaptain || isOfficer) && (
                      <div className="team-entry-actions">
                        <button
                          className="btn btn-ghost team-entry-edit"
                          onClick={() => openEntryPanel(entry)}
                          title={t('common.edit')}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="btn btn-ghost team-entry-del"
                          onClick={() => handleDeleteEntry(entry._id)}
                          title={t('common.delete')}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    )}
                  </div>

                  {entry.participants?.length > 0 && (
                    <div className="team-entry-participants">
                      <p className="team-entry-label">{t('team.participants')} ({entry.participants.length}/5)</p>
                      <div className="team-entry-avatars">
                        {entry.participants.map((p) => {
                          const avatarUrl = getAvatar(p);
                          return (
                            <div key={p._id} className="team-entry-avatar" title={getUserName(p)}>
                              {avatarUrl
                                ? <img src={avatarUrl} alt={getUserName(p)} />
                                : <div className="team-avatar-placeholder small">{getUserName(p).charAt(0)}</div>
                              }
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {entry.instructions && (
                    <p className="team-entry-instructions">{entry.instructions}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Panel inscription concours (bottom sheet) ───────── */}
      {showEntryPanel && (
        <div className="team-panel-overlay" onClick={() => setShowEntryPanel(false)}>
          <div className="team-panel-card" onClick={(e) => e.stopPropagation()}>
            <div className="team-panel-header">
              <h3>{editingEntryId ? t('team.editEntry') : t('team.newEntry')}</h3>
              <button className="btn btn-ghost" onClick={() => setShowEntryPanel(false)}>
                <FiX />
              </button>
            </div>

            <div className="team-panel-body">
              <label className="team-label">{t('team.selectCompetition')}</label>
              <select
                className="team-input"
                value={entryCompetition}
                onChange={(e) => setEntryCompetition(e.target.value)}
              >
                <option value="">{t('team.chooseCompetition')}</option>
                {competitions.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>

              <label className="team-label" style={{ marginTop: 12 }}>
                {t('team.selectParticipants')} ({entryParticipants.length}/5)
              </label>
              <div className="team-panel-members">
                {myTeam.members.map((m) => {
                  const u = m.user;
                  const selected = entryParticipants.includes(u._id);
                  const disabled = !selected && entryParticipants.length >= 5;
                  return (
                    <button
                      key={u._id}
                      className={`team-panel-member-btn ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                      onClick={() => !disabled && toggleParticipant(u._id)}
                    >
                      <div className="team-member-avatar small">
                        {getAvatar(u)
                          ? <img src={getAvatar(u)} alt={getUserName(u)} />
                          : <div className="team-avatar-placeholder">{getUserName(u).charAt(0)}</div>
                        }
                      </div>
                      <span>{getUserName(u)}</span>
                      {selected && <FiCheck className="team-panel-check" />}
                    </button>
                  );
                })}
              </div>

              <label className="team-label" style={{ marginTop: 12 }}>
                {t('team.instructions')}
              </label>
              <textarea
                className="team-textarea"
                placeholder={t('team.instructionsPlaceholder')}
                value={entryInstructions}
                maxLength={500}
                rows={3}
                onChange={(e) => setEntryInstructions(e.target.value)}
              />
            </div>

            <div className="team-panel-footer">
              <button className="btn btn-ghost" onClick={() => setShowEntryPanel(false)}>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEntry}
                disabled={savingEntry || !entryCompetition}
              >
                {savingEntry ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Onglet Chat ─────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <div className="team-chat-wrapper">

          {/* Barre membres connectés */}
          {onlineMembers.length > 0 && (
            <div className="team-online-bar">
              <span className="team-online-dot" />
              <span className="team-online-label">{t('team.onlineCount', { count: onlineMembers.length })}</span>
              <div className="team-online-avatars">
                {onlineMembers.map((m) => {
                  const u = m.user;
                  const avatarUrl = getAvatar(u);
                  return (
                    <div key={u._id} className="team-online-avatar" title={getUserName(u)}>
                      {avatarUrl
                        ? <img src={avatarUrl} alt={getUserName(u)} />
                        : <div className="team-avatar-placeholder">{getUserName(u).charAt(0)}</div>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="team-chat-messages">
            {messages.length === 0 && (
              <p className="team-chat-empty">{t('team.chatEmpty')}</p>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.senderId === myUserId;
              const sender = isMe
                ? myTeam.members.find(m => m.user._id === myUserId)?.user
                : myTeam.members.find(m => m.user._id === msg.senderId)?.user;
              const avatarUrl = sender ? getAvatar(sender) : null;
              const authorName = isMe ? t('team.me') : getUserName(sender);
              return (
                <div key={i} className={`team-msg ${isMe ? 'team-msg-me' : 'team-msg-other'}`}>
                  {/* Meta : avatar + nom + heure — AU DESSUS du message */}
                  <div className={`team-msg-meta ${isMe ? 'me' : ''}`}>
                    <div className="team-msg-avatar">
                      {avatarUrl
                        ? <img src={avatarUrl} alt={authorName} />
                        : <div className="team-avatar-placeholder">{authorName?.charAt(0)}</div>
                      }
                    </div>
                    <span className="team-msg-author">{authorName}</span>
                    <span className="team-msg-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="team-msg-bubble">{msg.text}</div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          <div className="team-chat-input-row">
            <input
              className="team-chat-input"
              placeholder={t('team.chatPlaceholder')}
              value={msgInput}
              maxLength={500}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            />
            <button
              className="team-send-btn"
              onClick={handleSendMessage}
              disabled={!msgInput.trim()}
            >
              <FiSend />
            </button>
          </div>
        </div>
      )}

      {/* ── Onglet Gestion (capitaine seulement) ────────────── */}
      {activeTab === 'manage' && isCaptain && (
        <div className="team-content">

          {/* Modifier Nom/Description */}
          <div className="team-section">
            <h3 className="team-section-title">{t('team.teamIdentity')}</h3>
            {!editMode ? (
              <div className="team-manage-identity-row">
                <div>
                  <div className="team-manage-name-row">
                    <p className="team-manage-name">{myTeam.emoji} {myTeam.name}</p>
                    {myTeam.tag && (
                      <span className="team-tag-badge" style={{ backgroundColor: myTeam.tagColor || '#6366F1' }}>
                        [{myTeam.tag}]
                      </span>
                    )}
                  </div>
                  {myTeam.description && (
                    <p className="team-manage-desc">{myTeam.description}</p>
                  )}
                </div>
                <button
                  className="btn btn-ghost team-edit-icon-btn"
                  onClick={() => {
                    setEditName(myTeam.name);
                    setEditDesc(myTeam.description || '');
                    setEditEmoji(myTeam.emoji || '🏆');
                    setEditTag(myTeam.tag || '');
                    setEditTagColor(myTeam.tagColor || '#6366F1');
                    setEditMode(true);
                  }}
                >
                  <FiEdit2 />
                </button>
              </div>
            ) : (
              <div className="team-edit-form">
                {/* Emoji picker */}
                <label className="team-label">{t('team.emojiLabel')}</label>
                <div className="team-emoji-picker">
                  {[
                    '🏆','🥇','🎖️','🏅','🎗️','🎪',
                    '⚽','🏀','🎾','🏐','🎱','🏈',
                    '⚡','🔥','💥','✨','🌟','💫',
                    '💎','💍','👑','🎯','🎰','🎲',
                    '🦁','🐯','🦊','🐺','🦅','🦋',
                    '🐉','🦄','🦈','🐻','🦝','🦎',
                    '🚀','⚔️','🛡️','🗡️','🏹','🪃',
                    '🌈','❄️','🌊','🌪️','☄️','🌙',
                    '🎮','🕹️','🎸','🥊','🎯','🧩',
                    '💪','🤜','👊','🤝','✊','🙌'
                  ].map(em => (
                    <button
                      key={em}
                      className={`team-emoji-btn ${editEmoji === em ? 'selected' : ''}`}
                      onClick={() => setEditEmoji(em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                <label className="team-label">{t('team.nameLabel')}</label>
                <input
                  className="team-input"
                  value={editName}
                  maxLength={50}
                  onChange={(e) => setEditName(e.target.value)}
                />

                <label className="team-label">{t('team.descLabel')}</label>
                <textarea
                  className="team-textarea"
                  value={editDesc}
                  maxLength={200}
                  rows={3}
                  onChange={(e) => setEditDesc(e.target.value)}
                />

                {/* TAG + couleur */}
                <label className="team-label">{t('team.tagLabel')}</label>
                <div className="team-tag-row">
                  <input
                    className="team-input team-tag-input"
                    placeholder="TAG"
                    value={editTag}
                    maxLength={5}
                    onChange={(e) => setEditTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  />
                  {editTag && (
                    <span className="team-tag-preview" style={{ backgroundColor: editTagColor }}>
                      [{editTag}]
                    </span>
                  )}
                </div>
                <div className="team-color-swatches">
                  {['#6366F1','#F59E0B','#EF4444','#22C55E','#3B82F6','#EC4899','#8B5CF6','#14B8A6'].map(color => (
                    <button
                      key={color}
                      className={`team-color-swatch ${editTagColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditTagColor(color)}
                    />
                  ))}
                </div>

                <div className="team-create-actions">
                  <button className="btn btn-ghost" onClick={() => setEditMode(false)}>
                    {t('common.cancel')}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveInfo}
                    disabled={saving || !editName.trim()}
                  >
                    {saving ? t('common.loading') : t('common.save')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Demandes en attente */}
          {myTeam.joinRequests?.length > 0 && (
            <div className="team-section">
              <h3 className="team-section-title">{t('team.joinRequests')}</h3>
              {myTeam.joinRequests.map((req) => {
                const u = req.user;
                const avatarUrl = getAvatar(u);
                return (
                  <div key={u._id} className="team-member-row">
                    <div className="team-member-avatar">
                      {avatarUrl
                        ? <img src={avatarUrl} alt={getUserName(u)} />
                        : <div className="team-avatar-placeholder">{getUserName(u).charAt(0)}</div>
                      }
                    </div>
                    <p className="team-member-name" style={{ flex: 1 }}>{getUserName(u)}</p>
                    <button className="btn btn-ghost team-action-btn accept" onClick={() => handleAccept(u._id)}>
                      <FiUserCheck />
                    </button>
                    <button className="btn btn-ghost team-action-btn reject" onClick={() => handleReject(u._id)}>
                      <FiUserX />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ouvrir/fermer les inscriptions */}
          <div className="team-section">
            <h3 className="team-section-title">{t('team.access')}</h3>
            <div className="team-toggle-row">
              <span>{t('team.openTeam')}</span>
              <button
                className={`team-toggle ${myTeam.isOpen ? 'on' : 'off'}`}
                onClick={async () => {
                  try {
                    const res = await axios.patch(`/api/teams/${myTeam._id}`, { isOpen: !myTeam.isOpen });
                    setMyTeam(prev => ({ ...prev, isOpen: res.data.team.isOpen }));
                  } catch { toast.error(t('team.saveError')); }
                }}
              >
                {myTeam.isOpen ? <FiCheck /> : <FiX />}
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="team-section team-danger-zone">
            <h3 className="team-section-title danger">{t('team.dangerZone')}</h3>

            {/* Transfert capitaine */}
            {!showTransfer ? (
              <button className="btn team-danger-btn transfer" onClick={() => setShowTransfer(true)}>
                👑 {t('team.transferCaptain')}
              </button>
            ) : (
              <div className="team-transfer-form">
                <p className="team-transfer-label">{t('team.selectNewCaptain')}</p>
                <select
                  className="team-input"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                >
                  <option value="">{t('team.chooseMember')}</option>
                  {myTeam.members
                    .filter(m => m.role !== 'captain')
                    .map(m => (
                      <option key={m.user._id} value={m.user._id}>
                        {getUserName(m.user)} — {t(`team.role_${m.role}`)}
                      </option>
                    ))
                  }
                </select>
                <div className="team-create-actions" style={{ marginTop: 8 }}>
                  <button className="btn btn-ghost" onClick={() => setShowTransfer(false)}>
                    {t('common.cancel')}
                  </button>
                  <button
                    className="btn team-danger-btn confirm"
                    onClick={handleTransfer}
                    disabled={!transferTarget}
                  >
                    {t('team.confirmTransferBtn')}
                  </button>
                </div>
              </div>
            )}

            <button className="btn team-danger-btn" onClick={handleDissolve} style={{ marginTop: 10 }}>
              <FiTrash2 /> {t('team.dissolve')}
            </button>
          </div>
        </div>
      )}

      {/* Bouton Quitter (non-capitaine) */}
      {myTeam && !isCaptain && activeTab !== 'chat' && (
        <button className="team-leave-fab" onClick={handleLeave}>
          <FiLogOut /> {t('team.leave')}
        </button>
      )}
    </div>
  );
};

const TeamHeader = ({ onBack, teamName, backIcon }) => (
  <div className="team-header">
    <button className="btn btn-ghost" onClick={onBack}>
      {backIcon || <FiArrowLeft />}
    </button>
    <h1>{teamName || 'Team'}</h1>
    <Navigation />
  </div>
);

export default TeamPage;
