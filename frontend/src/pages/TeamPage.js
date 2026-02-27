import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io as socketIO } from 'socket.io-client';
import {
  FiArrowLeft, FiUsers, FiInfo, FiMessageCircle, FiSettings,
  FiPlus, FiSend, FiLogOut, FiTrash2, FiCheck, FiX, FiEdit2,
  FiUserCheck, FiUserX
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

  // Édition infos équipe
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Chat
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const chatBottomRef = useRef(null);
  const socketRef = useRef(null);

  const isCaptain = myTeam && user &&
    myTeam.captain._id === (user._id || user.id);

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

    socket.emit('register', user?._id || user?.id);
    socket.emit('team:join', { teamId: myTeam._id });

    socket.on('team:message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('team:joinRequest', () => {
      fetchMyTeam();
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
        description: editDesc.trim()
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
        <TeamHeader onBack={() => navigate('/stream/competition')} />
        <div className="team-loading">
          <div className="loading"></div>
        </div>
      </div>
    );
  }

  // ── Pas d'équipe : rejoindre ou créer ─────────────────────
  if (!myTeam) {
    return (
      <div className="team-page">
        <TeamHeader onBack={() => navigate('/stream/competition')} />

        <div className="team-no-team">
          <span className="team-no-team-emoji">🏆</span>
          <h2>{t('team.noTeamTitle')}</h2>
          <p>{t('team.noTeamDesc')}</p>

          {!showCreate ? (
            <button className="btn btn-primary team-create-btn" onClick={() => setShowCreate(true)}>
              <FiPlus /> {t('team.createTeam')}
            </button>
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
        <Navigation />
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
      <TeamHeader onBack={() => navigate('/stream/competition')} teamName={myTeam.name} />

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
                    {m.role === 'captain' && (
                      <span className="team-captain-badge">{t('team.captain')}</span>
                    )}
                  </div>
                  {isCaptain && m.role !== 'captain' && (
                    <button
                      className="btn btn-ghost team-kick-btn"
                      onClick={() => handleKick(u._id)}
                      title={t('team.kick')}
                    >
                      <FiUserX />
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
          {!editMode ? (
            <>
              <div className="team-info-card">
                <div className="team-info-emoji">{myTeam.emoji}</div>
                <h2 className="team-info-name">{myTeam.name}</h2>
                {myTeam.description ? (
                  <p className="team-info-desc">{myTeam.description}</p>
                ) : (
                  <p className="team-info-desc team-info-empty">{t('team.noDesc')}</p>
                )}
                {myTeam.competition && (
                  <p className="team-info-competition">
                    🏆 {myTeam.competition.name}
                  </p>
                )}
              </div>
              {isCaptain && (
                <button
                  className="btn btn-secondary team-edit-btn"
                  onClick={() => setEditMode(true)}
                >
                  <FiEdit2 /> {t('team.editInfo')}
                </button>
              )}
            </>
          ) : (
            <div className="team-edit-form">
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
                rows={4}
                onChange={(e) => setEditDesc(e.target.value)}
              />
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
      )}

      {/* ── Onglet Chat ─────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <div className="team-chat-wrapper">
          <div className="team-chat-messages">
            {messages.length === 0 && (
              <p className="team-chat-empty">{t('team.chatEmpty')}</p>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.senderId === (user?._id || user?.id);
              const sender = myTeam.members.find(
                m => m.user._id === msg.senderId
              )?.user;
              return (
                <div key={i} className={`team-msg ${isMe ? 'team-msg-me' : 'team-msg-other'}`}>
                  {!isMe && (
                    <span className="team-msg-author">{getUserName(sender)}</span>
                  )}
                  <div className="team-msg-bubble">{msg.text}</div>
                  <span className="team-msg-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
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
            <button className="btn team-danger-btn" onClick={handleDissolve}>
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

      <Navigation />
    </div>
  );
};

const TeamHeader = ({ onBack, teamName }) => (
  <div className="team-header">
    <button className="btn btn-ghost" onClick={onBack}>
      <FiArrowLeft />
    </button>
    <h1>{teamName || 'Team'}</h1>
    <Navigation />
  </div>
);

export default TeamPage;
