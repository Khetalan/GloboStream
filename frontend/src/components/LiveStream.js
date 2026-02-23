import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiGift, FiUsers,
  FiX, FiEye, FiSend, FiPlay, FiArrowLeft,
  FiUserPlus, FiCheck, FiSlash
} from 'react-icons/fi';
import { translateMessage } from '../utils/translateChat';
import './LiveStream.css';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Composant LiveStream (côté streamer)
 * Flow : montage → getUserMedia → preview → "Go Live" → crée salon Socket.IO → WebRTC peers
 */
const LiveStream = ({ mode = 'public', onQuit, streamerName = 'Streamer', user }) => {
  const { t, i18n } = useTranslation();

  // États flow
  const [isLive, setIsLive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // États live
  const [participants, setParticipants] = useState([]);
  const [, setLocalStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [giftCount] = useState(0);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [activeStatsTab, setActiveStatsTab] = useState('viewers');
  const [viewers, setViewers] = useState([]);
  const [gifts] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [showJoinRequestsPanel, setShowJoinRequestsPanel] = useState(false); // New state

  // Refs
  const chatRef = useRef(null);
  const localVideoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const roomIdRef = useRef(null);
  const viewerPeersRef = useRef(new Map()); // socketId → Peer (send-only)
  const participantPeersRef = useRef(new Map()); // socketId → { peer, stream }
  // participantVideosRef removed — unused

  // Demander la permission caméra au montage (preview)
  useEffect(() => {
    let stream = null;

    const requestCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
        setPermissionGranted(true);
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Camera access error:', error);
        setCameraError(true);
      }
    };

    requestCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Attacher le stream au preview vidéo après que permissionGranted provoque le re-render
  useEffect(() => {
    if (permissionGranted && !isLive && previewVideoRef.current && localStreamRef.current) {
      previewVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [permissionGranted, isLive]);

  // Quand isLive passe à true, rattacher le stream à la vidéo principale
  useEffect(() => {
    if (isLive && localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isLive]);

  // Sécurité : stopper les tracks et arrêter le live au démontage
  useEffect(() => {
    const viewerPeers = viewerPeersRef.current;
    const participantPeers = participantPeersRef.current;
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      axios.post('/api/live/stop').catch(() => {});

      // Détruire tous les peers
      for (const peer of viewerPeers.values()) {
        peer.destroy();
      }
      for (const { peer } of participantPeers.values()) {
        peer.destroy();
      }

      // Fermer le salon et déconnecter le socket
      if (socketRef.current) {
        if (roomIdRef.current) {
          socketRef.current.emit('close-live-room', { roomId: roomIdRef.current });
        }
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Connecter Socket.IO et enregistrer les listeners
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    // Quand le salon est créé
    socket.on('room-created', ({ roomId }) => {
      roomIdRef.current = roomId;
      console.log('Room created:', roomId);
      setIsLive(true);
    });

    // Un nouveau viewer rejoint
    socket.on('viewer-joined', ({ viewerSocketId, viewerInfo }) => {
      console.log('Viewer joined:', viewerInfo.displayName);

      setViewerCount(prev => prev + 1);
      setViewers(prev => [...prev, {
        socketId: viewerSocketId,
        name: viewerInfo.displayName,
        joinedAt: new Date().toLocaleTimeString()
      }]);

      // Ajouter un message système pour l'entrée du spectateur
      setMessages(prev => [...prev, {
        id: `sys-join-${viewerSocketId}-${Date.now()}`,
        username: 'System',
        text: t('liveStream.viewerJoined', { name: viewerInfo.displayName }),
        isSystem: true,
        isJoinEvent: true, // Nouveau flag
        lang: null,
        translatedText: null,
        showTranslation: false,
        translating: false,
        isOwn: false
      }]);

      // Créer un peer pour envoyer le stream au viewer
      const stream = localStreamRef.current;
      if (!stream) return;

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream
      });

      peer.on('signal', (signal) => {
        socket.emit('live-signal', { to: viewerSocketId, signal });
      });

      peer.on('error', (err) => {
        console.error('Peer error (viewer):', err);
        viewerPeersRef.current.delete(viewerSocketId);
      });

      viewerPeersRef.current.set(viewerSocketId, peer);
    });

    // Un viewer quitte
    socket.on('viewer-left', ({ viewerSocketId }) => {
      setViewerCount(prev => Math.max(0, prev - 1));
      setViewers(prev => prev.filter(v => v.socketId !== viewerSocketId));

      const peer = viewerPeersRef.current.get(viewerSocketId);
      if (peer) {
        peer.destroy();
        viewerPeersRef.current.delete(viewerSocketId);
      }

      // Aussi vérifier si c'était un participant
      const pData = participantPeersRef.current.get(viewerSocketId);
      if (pData) {
        pData.peer.destroy();
        participantPeersRef.current.delete(viewerSocketId);
        setParticipants(prev => prev.filter(p => p.socketId !== viewerSocketId));
      }
    });

    // Signaling WebRTC (answer du viewer ou du participant)
    socket.on('live-signal', ({ from, signal }) => {
      // Vérifier d'abord dans les viewer peers
      const viewerPeer = viewerPeersRef.current.get(from);
      if (viewerPeer) {
        viewerPeer.signal(signal);
        return;
      }
      // Sinon dans les participant peers
      const pData = participantPeersRef.current.get(from);
      if (pData) {
        pData.peer.signal(signal);
      }
    });

    // Message chat reçu
    socket.on('live-chat-message', ({ username, text, lang, timestamp }) => {
      setMessages(prev => [...prev, {
        id: `msg-${timestamp}-${Math.random()}`,
        username,
        text,
        lang: lang || null,
        translatedText: null,
        showTranslation: false,
        translating: false,
        isOwn: false
      }]);
    });

    // Demande de participation reçue
    socket.on('join-request-received', ({ viewerSocketId, viewerInfo }) => {
      console.log('Join request from:', viewerInfo.displayName);
      setJoinRequests(prev => [...prev, {
        socketId: viewerSocketId,
        displayName: viewerInfo.displayName,
        userId: viewerInfo.userId
      }]);
      toast(t('liveStream.wantsToJoin', { name: viewerInfo.displayName }), { icon: '🙋' });
    });

    // Un participant rejoint (après acceptation)
    socket.on('participant-joined', ({ participantSocketId, participantInfo, participantCount }) => {
      console.log('Participant joined:', participantInfo.displayName);
    });

    // Un participant quitte
    socket.on('participant-left', ({ participantSocketId }) => {
      const pData = participantPeersRef.current.get(participantSocketId);
      if (pData) {
        pData.peer.destroy();
        participantPeersRef.current.delete(participantSocketId);
      }
      setParticipants(prev => prev.filter(p => p.socketId !== participantSocketId));
    });

    // Enregistrer l'utilisateur
    if (user?._id) {
      socket.emit('register', user._id);
    }

    return () => {
      socket.disconnect();
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll du chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Traduire un message à la demande (clic sur 🌐)
  const handleTranslateMsg = useCallback(async (msgId) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      // Si déjà traduit, toggle l'affichage
      if (m.translatedText) return { ...m, showTranslation: !m.showTranslation };
      return { ...m, translating: true };
    }));

    // Chercher le message
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.translatedText) return;

    const userLang = (i18n.language || navigator.language || 'fr').split('-')[0];
    const translated = await translateMessage(msg.text, userLang);

    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      return {
        ...m,
        translatedText: translated || null,
        showTranslation: true,
        translating: false
      };
    }));
  }, [messages, i18n.language]);

  // Envoi message chat via Socket.IO
  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || !socketRef.current || !roomIdRef.current) return;

    socketRef.current.emit('live-chat', {
      roomId: roomIdRef.current,
      text: chatInput,
      username: streamerName,
      lang: (i18n.language || 'fr').split('-')[0]
    });
    setChatInput('');
  }, [chatInput, streamerName, i18n.language]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Toggle micro
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = isMuted;
    }
    setIsMuted(prev => !prev);
  }, [isMuted]);

  // Toggle caméra
  const toggleCam = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = isCamOff;
    }
    setIsCamOff(prev => !prev);
  }, [isCamOff]);

  // Démarrer le live : API + créer salon Socket.IO
  const handleGoLive = useCallback(async () => {
    try {
      await axios.post('/api/live/start', {
        title: `Live de ${streamerName}`,
        tags: ['Rencontres', 'Discussion'],
        mode: mode
      });

      // Créer le salon Socket.IO
      socketRef.current.emit('create-live-room', {
        mode: mode,
        title: `Live de ${streamerName}`,
        tags: ['Rencontres', 'Discussion'],
        userId: user?._id,
        displayName: streamerName
      });

      // Le passage à isLive se fait dans le listener 'room-created'
      setMessages([{
        id: 'welcome',
        username: 'System',
        text: t('liveStream.welcomeMessage'),
        isSystem: true
      }]);
    } catch (error) {
      console.error('Error starting live:', error);
      toast.error(t('liveStream.startError'));
    }
  }, [streamerName, mode, user, t]);

  // Quitter le live
  const handleQuit = useCallback(async () => {
    try {
      await axios.post('/api/live/stop');
    } catch (error) {
      console.error('Error stopping live:', error);
    }

    // Fermer le salon
    if (socketRef.current && roomIdRef.current) {
      socketRef.current.emit('close-live-room', { roomId: roomIdRef.current });
    }

    // Détruire tous les peers
    for (const peer of viewerPeersRef.current.values()) {
      peer.destroy();
    }
    for (const { peer } of participantPeersRef.current.values()) {
      peer.destroy();
    }
    viewerPeersRef.current.clear();
    participantPeersRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    onQuit();
  }, [onQuit]);

  // Accepter une demande de participation
  const handleAcceptJoinRequest = useCallback((request) => {
    if (!socketRef.current || !roomIdRef.current) return;

    socketRef.current.emit('accept-join-request', {
      roomId: roomIdRef.current,
      viewerSocketId: request.socketId
    });

    // Retirer de la liste des demandes
    setJoinRequests(prev => prev.filter(r => r.socketId !== request.socketId));

    // Détruire l'ancien peer viewer (send-only) pour ce socket
    const oldPeer = viewerPeersRef.current.get(request.socketId);
    if (oldPeer) {
      oldPeer.destroy();
      viewerPeersRef.current.delete(request.socketId);
    }

    // Créer un peer bidirectionnel avec le participant
    const stream = localStreamRef.current;
    if (!stream) return;

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });

    peer.on('signal', (signal) => {
      socketRef.current.emit('live-signal', { to: request.socketId, signal });
    });

    peer.on('stream', (remoteStream) => {
      // Stocker le stream du participant
      participantPeersRef.current.set(request.socketId, {
        peer,
        stream: remoteStream
      });

      // Ajouter le participant à l'affichage
      setParticipants(prev => [...prev, {
        socketId: request.socketId,
        name: request.displayName,
        id: request.userId,
        stream: remoteStream
      }]);
    });

    peer.on('error', (err) => {
      console.error('Peer error (participant):', err);
      participantPeersRef.current.delete(request.socketId);
      setParticipants(prev => prev.filter(p => p.socketId !== request.socketId));
    });

    // Stocker temporairement sans stream (sera mis à jour quand on reçoit le stream)
    participantPeersRef.current.set(request.socketId, { peer, stream: null });

  }, []);

  // Refuser une demande de participation
  const handleRejectJoinRequest = useCallback((request) => {
    if (!socketRef.current) return;

    socketRef.current.emit('reject-join-request', {
      viewerSocketId: request.socketId
    });

    setJoinRequests(prev => prev.filter(r => r.socketId !== request.socketId));
  }, []);

  // Composant vidéo participant avec ref callback
  const ParticipantVideo = ({ stream }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="ls-participant-video"
      />
    );
  };

  // ── ÉCRAN ERREUR PERMISSION ──
  if (cameraError) {
    return (
      <div className={`ls-container ls-mode-${mode}`}>
        <div className="ls-permission-error">
          <FiVideoOff size={48} />
          <h3>{t('liveStream.cameraError')}</h3>
          <p>{t('liveStream.permissionDenied')}</p>
          <button className="ls-back-btn" onClick={onQuit}>
            <FiArrowLeft size={16} />
            <span>{t('common.back')}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── ÉCRAN PREVIEW (permission OK, pas encore live) ──
  if (permissionGranted && !isLive) {
    return (
      <div className={`ls-container ls-mode-${mode}`}>
        <div className="ls-preview-screen">
          <div className="ls-preview-video-wrapper">
            <video
              ref={previewVideoRef}
              autoPlay
              muted
              playsInline
              className="ls-preview-video"
            />
          </div>
          <h3 className="ls-preview-title">{t('liveStream.previewTitle')}</h3>
          <p className="ls-preview-desc">{t('liveStream.previewDesc')}</p>
          {user?.photos?.length > 0 ? (
            <button className="ls-go-live-btn" onClick={handleGoLive}>
              <FiPlay size={20} />
              <span>{t('liveStream.goLive')}</span>
            </button>
          ) : (
            <div className="ls-no-photo-warning">
              <p>{t('liveStream.noPhotoWarning')}</p>
            </div>
          )}
          <button className="ls-back-btn" onClick={handleQuit}>
            <FiArrowLeft size={16} />
            <span>{t('common.back')}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── ÉCRAN CHARGEMENT (en attente de permission) ──
  if (!permissionGranted && !cameraError) {
    return (
      <div className={`ls-container ls-mode-${mode}`}>
        <div className="ls-permission-error">
          <FiVideo size={48} />
          <h3>{t('liveStream.previewTitle')}</h3>
          <p>{t('liveStream.previewDesc')}</p>
          <div className="ls-loading-spinner" />
        </div>
      </div>
    );
  }

  // ── INTERFACE LIVE COMPLÈTE ──
  const totalCards = 1 + participants.length;
  const layoutClass = `layout-${Math.min(totalCards, 9)}`;

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  const renderParticipantCards = () => {
    return participants.map((p, i) => (
      <div key={p.socketId || i} className="ls-video-card user">
        <div className="ls-video-placeholder">
          {p.stream ? (
            <ParticipantVideo stream={p.stream} />
          ) : (
            <FiVideo size={32} />
          )}
        </div>
        <div className="ls-video-label">{p.name || `User ${i + 1}`}</div>
      </div>
    ));
  };

  return (
    <div className={`ls-container ls-mode-${mode}`}>
      <div className={`ls-video-grid ${layoutClass}`}>
        <div className="ls-video-card streamer">
          {isCamOff ? (
            <div className="ls-video-placeholder cam-off">
              <div className="ls-cam-off-avatar">
                {streamerName.charAt(0).toUpperCase()}
              </div>
              <div className="ls-cam-off-name">{streamerName}</div>
            </div>
          ) : (
            <div className="ls-video-placeholder">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="ls-local-video"
              />
            </div>
          )}

          <div className="ls-streamer-stats" onClick={() => setShowStatsPanel(true)}>
            <div className="ls-stat-row">
              <FiEye size={10} />
              <span>{formatNumber(viewerCount)}</span>
            </div>
            <span className="ls-stat-divider">·</span>
            <div className="ls-stat-row">
              <FiGift size={10} />
              <span>{giftCount}</span>
            </div>
          </div>

          <div className="ls-video-label streamer-label">
            {streamerName}
          </div>

          {isMuted && (
            <div className="ls-mic-muted">
              <FiMicOff size={13} />
            </div>
          )}
        </div>

                {renderParticipantCards()}
              </div>
        
              {showStatsPanel && (
                <div className="ls-stats-overlay" onClick={() => setShowStatsPanel(false)} />
              )}
        
              {/* Panel des statistiques */}
              <div className={`ls-stats-panel ${showStatsPanel ? 'visible' : ''}`}>
                <div className="ls-stats-header">
                  <button
                    className={`ls-tab-btn ${activeStatsTab === 'viewers' ? 'active' : ''}`}
                    onClick={() => setActiveStatsTab('viewers')}
                  >
                    <FiEye size={14} />
                    {t('liveStream.viewers')}
                  </button>
                  <button
                    className={`ls-tab-btn ${activeStatsTab === 'gifts' ? 'active' : ''}`}
                    onClick={() => setActiveStatsTab('gifts')}
                  >
                    <FiGift size={14} />
                    {t('liveStream.gifts')}
                  </button>
                  <button className="ls-stats-close" onClick={() => setShowStatsPanel(false)}>
                    <FiX size={14} />
                  </button>
                </div>
        
                {activeStatsTab === 'viewers' && (
                  <div className="ls-tab-content">
                    <div className="ls-stats-total">
                      <span className="ls-stats-total-label">{t('liveStream.totalViewers')}</span>
                      <span className="ls-stats-total-value">{formatNumber(viewerCount)}</span>
                    </div>
                    <div className="ls-stats-list">
                      {viewers.map((v, i) => (
                        <div key={i} className="ls-stats-row">
                          <div className="ls-stats-row-left">
                            <div className="ls-stats-avatar">{v.name.charAt(0)}</div>
                            <div>
                              <div className="ls-stats-name">{v.name}</div>
                              <div className="ls-stats-badge">{v.joinedAt}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
        
                {activeStatsTab === 'gifts' && (
                  <div className="ls-tab-content">
                    <div className="ls-stats-total">
                      <span className="ls-stats-total-label">{t('liveStream.totalGifts')}</span>
                      <span className="ls-stats-total-value">{giftCount}</span>
                    </div>
                    <div className="ls-stats-list">
                      {gifts.sort((a, b) => b.gifts - a.gifts).map((g, i) => (
                        <div key={i} className="ls-stats-row">
                          <div className="ls-stats-row-left">
                            <div className={`ls-stats-avatar ${i < 3 ? `rank-${i + 1}` : ''}`}>
                              {i < 3 ? ['1', '2', '3'][i] : g.name.charAt(0)}
                            </div>
                            <div>
                              <div className="ls-stats-name">{g.name}</div>
                              <div className="ls-stats-badge">#{i + 1}</div>
                            </div>
                          </div>
                          <span className="ls-stats-value">{g.gifts}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
        
              {/* Overlay et panneau des demandes de participation */}
              {showJoinRequestsPanel && (
                <div className="ls-stats-overlay" onClick={() => setShowJoinRequestsPanel(false)} />
              )}
              <div className={`ls-requests-panel ${showJoinRequestsPanel ? 'visible' : ''}`}>
                <div className="ls-requests-header">
                  <h3>{t('liveStream.joinRequestsTitle')} ({joinRequests.length})</h3>
                  <button className="ls-requests-close" onClick={() => setShowJoinRequestsPanel(false)}>
                    <FiX size={14} />
                  </button>
                </div>
                <div className="ls-requests-list">
                  {joinRequests.length === 0 ? (
                    <p className="ls-no-requests">{t('liveStream.noJoinRequests')}</p>
                  ) : (
                    joinRequests.map((req) => (
                      <div key={req.socketId} className="ls-request-item">
                        <FiUserPlus size={18} />
                        <span className="ls-request-name">{req.displayName}</span>
                        <div className="ls-request-actions">
                          <button
                            className="ls-request-accept-btn"
                            onClick={() => handleAcceptJoinRequest(req)}
                          >
                            <FiCheck size={16} />
                            <span>{t('liveStream.accept')}</span>
                          </button>
                          <button
                            className="ls-request-reject-btn"
                            onClick={() => handleRejectJoinRequest(req)}
                          >
                            <FiSlash size={16} />
                            <span>{t('liveStream.reject')}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
        
              <div className="ls-chat-section" ref={chatRef}>
                {messages.map((msg) => (
                  <div key={msg.id} className={`ls-chat-message ${msg.isSystem ? 'system' : ''} ${msg.isJoinEvent ? 'is-join-event' : ''} ${msg.isOwn ? 'own' : ''}`}>
                    <div className="ls-chat-message-top">
                      <span className="ls-chat-username">{msg.username} :</span>
                      <span className="ls-chat-text">{msg.text}</span>
                      {msg.lang && <span className="ls-lang-badge">{msg.lang.toUpperCase()}</span>}
                      {!msg.isSystem && (
                        <button
                          className={`ls-translate-btn ${msg.translating ? 'loading' : ''}`}
                          onClick={() => handleTranslateMsg(msg.id)}
                          title={t('liveStream.translate')}
                        >
                          🌐
                        </button>
                      )}
                    </div>
                    {msg.showTranslation && msg.translatedText && (
                      <div className="ls-translated-text">🌐 {msg.translatedText}</div>
                    )}
                    {msg.showTranslation && !msg.translatedText && !msg.translating && (
                      <div className="ls-translated-text">✓ {t('liveStream.alreadyYourLang')}</div>
                    )}
                  </div>
                ))}
              </div>
        
              <div className="ls-bottom-bar">
                <div className="ls-input-container">
                  <input
                    type="text"
                    placeholder={t('liveStream.chatPlaceholder')}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  {chatInput.trim() && (
                    <button className="ls-send-btn" onClick={handleSendMessage}>
                      <FiSend size={16} />
                    </button>
                  )}
                </div>
        
                <button
                  className={`ls-control-btn ${isMuted ? 'muted' : ''}`}
                  onClick={toggleMic}
                >
                  {isMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
                </button>
        
                <button
                  className={`ls-control-btn ${isCamOff ? 'muted' : ''}`}
                  onClick={toggleCam}
                >
                  {isCamOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
                </button>
        
                <button className="ls-control-btn gift-btn">
                  <FiGift size={18} />
                </button>
        
                <button
                  className="ls-control-btn requests-btn"
                  onClick={() => setShowJoinRequestsPanel(true)}
                >
                  <FiUsers size={18} />
                  {joinRequests.length > 0 && <span className="ls-requests-count">{joinRequests.length}</span>}
                </button>
        
                <button
                  className="ls-control-btn quit-btn"
                  onClick={handleQuit}
                >
                  <FiX size={18} />
                </button>
              </div>
    </div>
  );
};

export default LiveStream;
