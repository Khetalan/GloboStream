import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiEye, FiSend, FiArrowLeft, FiUserPlus,
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiGift
} from 'react-icons/fi';
import { translateMessage } from '../utils/translateChat';
import './LiveViewer.css';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Serveurs STUN pour la collecte ICE (nécessaire hors réseau local)
const PEER_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

/**
 * Composant LiveViewer (côté spectateur)
 * Flow : connecter Socket.IO → join room → recevoir WebRTC stream → afficher vidéo
 *
 * Props :
 * - roomId : ID du salon à rejoindre
 * - onLeave : callback pour quitter
 * - user : utilisateur courant
 */
const LiveViewer = ({ roomId, onLeave, user }) => {
  const { t, i18n } = useTranslation();

  const [remoteStream, setRemoteStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [streamerName, setStreamerName] = useState('Streamer'); // État pour le nom
  const [joinRequestStatus, setJoinRequestStatus] = useState('idle'); // idle | pending | accepted | rejected
  const [isParticipant, setIsParticipant] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [connected, setConnected] = useState(false);
  const [roomError, setRoomError] = useState(false);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [isStreamerMuted, setIsStreamerMuted] = useState(false); // Nouvel état
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [activeStatsTab, setActiveStatsTab] = useState('viewers');
  const [viewers, setViewers] = useState([]);
  const [gifts] = useState([]);

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const chatRef = useRef(null);
  const hasLeftRef = useRef(false);

  // Connecter Socket.IO et rejoindre le salon
  useEffect(() => {
    setStreamerName('Streamer');
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    // Rejoindre le salon seulement après que la connexion socket est confirmée
    // (évite la race condition où live-signal arrive avant l'enregistrement du listener)
    socket.on('connect', () => {
      if (user?._id) {
        socket.emit('register', user._id);
      }
      socket.emit('join-live-room', {
        roomId,
        userId: user?._id,
        displayName: user?.displayName || user?.firstName || 'Viewer'
      });
    });

    // Infos de la room reçues
    socket.on('room-info', ({ viewerCount: vc, streamerName: sn }) => {
      setViewerCount(vc);
      if (sn) setStreamerName(sn);
      setConnected(true);
    });

    // Erreur (room introuvable)
    socket.on('error', ({ message }) => {
      console.error('Room error:', message);
      setRoomError(true);
      toast.error(message || t('liveViewer.roomNotFound'));
    });

    // Signaling WebRTC (offer du streamer)
    socket.on('live-signal', ({ from, signal }) => {
      if (peerRef.current) {
        peerRef.current.signal(signal);
      } else {
        // Créer un peer non-initiator pour recevoir le stream
        const peer = new Peer({
          initiator: false,
          config: PEER_CONFIG,
          stream: localStreamRef.current || undefined
        });

        peer.on('signal', (answer) => {
          socket.emit('live-signal', { to: from, signal: answer });
        });

        peer.on('stream', (stream) => {
          setRemoteStream(stream);
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          peerRef.current = null;
        });

        peer.signal(signal);
        peerRef.current = peer;
      }
    });

    // Un nouveau viewer rejoint (pour l'affichage du chat des messages système)
    socket.on('viewer-joined', ({ viewerSocketId, viewerInfo }) => {
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
      // Ajouter à la liste des viewers
      setViewers(prev => [...prev, {
        socketId: viewerSocketId,
        name: viewerInfo.displayName,
        joinedAt: new Date().toLocaleTimeString()
      }]);
    });

    // Message chat
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

    // Un viewer quitte (pour mettre à jour la liste)
    socket.on('viewer-left', ({ viewerSocketId }) => {
      setViewers(prev => prev.filter(v => v.socketId !== viewerSocketId));
    });

    // Demande de participation acceptée
    socket.on('join-accepted', ({ streamerSocketId }) => {
      setJoinRequestStatus('accepted');
      setIsParticipant(true);
      toast.success(t('liveViewer.joinedLive'));

      // Démarrer la caméra pour participer
      startLocalCamera(streamerSocketId);
    });

    // Demande refusée
    socket.on('join-rejected', () => {
      setJoinRequestStatus('rejected');
      toast.error(t('liveViewer.requestRejected'));
      setTimeout(() => setJoinRequestStatus('idle'), 3000);
    });

    // Room fermée par le streamer
    socket.on('room-closed', () => {
      toast(t('liveViewer.liveEnded'));
      cleanup();
      onLeave();
    });

    // NOUVEAU: Le streamer nous met en sourdine ou réactive notre micro
    socket.on('force-mute-toggle', ({ mute }) => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !mute;
        }
      }
      // On met à jour notre propre état pour que l'icône corresponde
      setIsMuted(mute);
      toast(mute ? t('liveViewer.youWereMuted') : t('liveViewer.youWereUnmuted'));
    });

    // NOUVEAU: Le streamer coupe son propre micro
    socket.on('streamer-mic-state', ({ isMuted }) => {
      setIsStreamerMuted(isMuted);
    });

    return () => {
      // N'émettre leave que si handleLeave ne l'a pas déjà fait (évite le double emit)
      if (!hasLeftRef.current) {
        cleanup();
        socket.emit('leave-live-room', { roomId });
      }
      socket.disconnect();
    };
  }, [roomId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Attacher le stream distant à la vidéo
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Attacher le stream local à la preview si participant
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Auto-scroll du chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Démarrer caméra quand promu participant
  const startLocalCamera = async (streamerSocketId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;

      // Détruire l'ancien peer (receive-only)
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }

      // Créer un nouveau peer bidirectionnel (envoyer + recevoir)
      const peer = new Peer({
        initiator: false,
        config: PEER_CONFIG,
        stream: stream
      });

      peer.on('signal', (signal) => {
        socketRef.current.emit('live-signal', { to: streamerSocketId, signal });
      });

      peer.on('stream', (remoteStr) => {
        setRemoteStream(remoteStr);
      });

      peer.on('error', (err) => {
        console.error('Participant peer error:', err);
      });

      peerRef.current = peer;

      // Le streamer va initier la connexion via live-signal
    } catch (error) {
      console.error('Camera error:', error);
      toast.error(t('liveViewer.cameraError'));
    }
  };

  const cleanup = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  };

  // Traduire un message à la demande (clic sur 🌐)
  const handleTranslateMsg = useCallback(async (msgId) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      if (m.translatedText) return { ...m, showTranslation: !m.showTranslation };
      return { ...m, translating: true };
    }));

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

  // Envoyer un message chat
  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || !socketRef.current) return;

    socketRef.current.emit('live-chat', {
      roomId,
      text: chatInput,
      username: user?.displayName || user?.firstName || 'Viewer',
      lang: (i18n.language || 'fr').split('-')[0]
    });
    setChatInput('');
  }, [chatInput, roomId, user, i18n.language]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') handleSendMessage();
  }, [handleSendMessage]);

  // Demander à rejoindre le live
  const handleRequestJoin = useCallback(() => {
    if (!socketRef.current || joinRequestStatus !== 'idle') return;

    socketRef.current.emit('request-join-live', {
      roomId,
      userId: user?._id,
      displayName: user?.displayName || user?.firstName || 'Viewer'
    });
    setJoinRequestStatus('pending');
  }, [roomId, user, joinRequestStatus]);

  // Toggle micro (participant seulement)
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = isMuted;
    }
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    // On ne notifie pas le streamer, car c'est une action locale.
    // Le streamer a son propre bouton pour nous forcer en sourdine.
  }, [isMuted]);

  // Toggle caméra (participant seulement)
  const toggleCam = useCallback(() => {
    const newCamOffState = !isCamOff;
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !newCamOffState;
    }
    setIsCamOff(newCamOffState);

    // NOUVEAU: Informer le streamer de notre changement d'état de caméra
    if (socketRef.current) {
      socketRef.current.emit('participant-cam-state', {
        roomId,
        isCamOff: newCamOffState
      });
    }
  }, [isCamOff, roomId]);

  // Quitter
  const handleLeave = useCallback(() => {
    hasLeftRef.current = true;
    cleanup();
    if (socketRef.current) {
      socketRef.current.emit('leave-live-room', { roomId });
    }
    onLeave();
  }, [roomId, onLeave]);

  const toggleUiVisibility = useCallback(() => {
    setIsUiVisible(prev => !prev);
  }, []);

  // ── Erreur room ──
  if (roomError) {
    return (
      <div className="lv-container">
        <div className="lv-error-screen">
          <FiX size={48} />
          <h3>{t('liveViewer.roomNotFound')}</h3>
          <p>{t('liveViewer.roomClosed')}</p>
          <button className="lv-back-btn" onClick={onLeave}>
            <FiArrowLeft size={16} />
            <span>{t('common.back')}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Chargement ──
  if (!connected && !roomError) {
    return (
      <div className="lv-container">
        <div className="lv-loading-screen">
          <div className="lv-loading-spinner" />
          <p>{t('liveViewer.connecting')}</p>
        </div>
      </div>
    );
  }

  // ── Interface viewer ──
  return (
    <div className="lv-container">
      {/* Vidéo du streamer (plein écran) */}
      <div className="lv-video-section" onClick={toggleUiVisibility}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="lv-remote-video"
        />

        {!remoteStream && (
          <div className="lv-waiting-overlay">
            <div className="lv-loading-spinner" />
            <p>{t('liveViewer.waitingStream')}</p>
          </div>
        )}

        {/* Indicateur micro coupé du streamer */}
        {isStreamerMuted && (
          <div className="lv-mic-muted">
            <FiMicOff />
          </div>
        )}

        {/* Preview locale si participant */}
        {isParticipant && localStream && (
          <div className="lv-local-preview">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="lv-local-video"
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isUiVisible && (
          <motion.div
            className="lv-ui-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Top Bar */}
            <div className="lv-top-bar">
              <div className="lv-header-left">
                <div className="lv-streamer-name">{streamerName}</div>
                <div className="lv-stats-indicators">
                  <div className="lv-live-badge" onClick={(e) => { e.stopPropagation(); setShowStatsPanel(true); }}>
                    <span>LIVE</span>
                  </div>
                  <button className="lv-viewer-count" onClick={(e) => { e.stopPropagation(); setActiveStatsTab('viewers'); setShowStatsPanel(true); }}>
                    <FiEye /> {viewerCount}
                  </button>
                  <button className="lv-gift-count" onClick={(e) => { e.stopPropagation(); setActiveStatsTab('gifts'); setShowStatsPanel(true); }}>
                    <FiGift /> {gifts.length}
                  </button>
                </div>
              </div>
              <div className="lv-header-right">
                <button className="lv-close-btn" onClick={handleLeave}>
                  <FiX size={24} />
                </button>
              </div>
            </div>

            {/* Chat */}
            <div className="lv-chat-section" ref={chatRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`lv-chat-message ${msg.isSystem ? 'system' : ''} ${msg.isJoinEvent ? 'is-join-event' : ''}`}>
                  <div className="lv-chat-body">
                    <span className="lv-chat-username">{msg.username} :</span>
                    <span className="lv-chat-text">{msg.text}</span>
                    <div className="lv-chat-icons">
                      {msg.lang && <span className="lv-lang-badge">{msg.lang.toUpperCase()}</span>}
                      {!msg.isSystem && (
                        <button
                          className={`lv-translate-btn ${msg.translating ? 'loading' : ''}`}
                          onClick={() => handleTranslateMsg(msg.id)}
                          title={t('liveViewer.translate')}
                        >
                          🌐
                        </button>
                      )}
                    </div>
                  </div>
                  {msg.showTranslation && msg.translatedText && (
                    <div className="lv-translated-text">🌐 {msg.translatedText}</div>
                  )}
                  {msg.showTranslation && !msg.translatedText && !msg.translating && (
                    <div className="lv-translated-text">✓ {t('liveViewer.alreadyYourLang')}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Barre du bas */}
            <div className="lv-bottom-bar">
              <div className="lv-input-container">
                <input
                  type="text"
                  placeholder={t('liveViewer.chatPlaceholder')}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                {chatInput.trim() && (
                  <button className="lv-send-btn" onClick={handleSendMessage}>
                    <FiSend size={16} />
                  </button>
                )}
              </div>

              <div className="lv-actions-group">
                {/* Bouton demander à rejoindre */}
                {!isParticipant && (
                  <button
                    className={`lv-join-btn ${joinRequestStatus}`}
                    onClick={handleRequestJoin}
                    disabled={joinRequestStatus !== 'idle'}
                  >
                    <FiUserPlus size={20} />
                  </button>
                )}
                <button className="lv-control-btn gift-btn">
                  <FiGift size={20} />
                </button>
              </div>

              {/* Contrôles participant */}
              {isParticipant && (
                <>
                  <button
                    className={`lv-control-btn ${isMuted ? 'off' : ''}`}
                    onClick={toggleMic}
                  >
                    {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
                  </button>
                  <button
                    className={`lv-control-btn ${isCamOff ? 'off' : ''}`}
                    onClick={toggleCam}
                  >
                    {isCamOff ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel Stats (Viewers/Gifts) */}
      {showStatsPanel && (
        <div className="lv-stats-overlay" onClick={() => setShowStatsPanel(false)} />
      )}

      <div className={`lv-stats-panel ${showStatsPanel ? 'visible' : ''}`}>
        <div className="lv-stats-header">
          <button
            className={`lv-tab-btn ${activeStatsTab === 'viewers' ? 'active' : ''}`}
            onClick={() => setActiveStatsTab('viewers')}
          >
            <FiEye size={14} />
            {t('liveStream.viewers')}
          </button>
          <button
            className={`lv-tab-btn ${activeStatsTab === 'gifts' ? 'active' : ''}`}
            onClick={() => setActiveStatsTab('gifts')}
          >
            <FiGift size={14} />
            {t('liveStream.gifts')}
          </button>
          <button className="lv-stats-close" onClick={() => setShowStatsPanel(false)}>
            <FiX size={14} />
          </button>
        </div>

        {activeStatsTab === 'viewers' && (
          <div className="lv-tab-content">
            <div className="lv-stats-total">
              <span className="lv-stats-total-label">{t('liveStream.totalViewers')}</span>
              <span className="lv-stats-total-value">{viewerCount}</span>
            </div>
            <div className="lv-stats-list">
              {viewers.map((v, i) => (
                <div key={i} className="lv-stats-row">
                  <div className="lv-stats-row-left">
                    <div className="lv-stats-avatar">{v.name.charAt(0)}</div>
                    <div>
                      <div className="lv-stats-name">{v.name}</div>
                      <div className="lv-stats-badge">{v.joinedAt}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeStatsTab === 'gifts' && (
          <div className="lv-tab-content">
            <div className="lv-stats-total">
              <span className="lv-stats-total-label">{t('liveStream.totalGifts')}</span>
              <span className="lv-stats-total-value">0</span>
            </div>
            <div className="lv-stats-list">
              {/* Liste des cadeaux vide pour l'instant */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveViewer;
