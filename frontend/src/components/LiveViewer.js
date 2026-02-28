import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiEye, FiSend, FiArrowLeft, FiUserPlus,
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiGift, FiAlertTriangle, FiGlobe,
  FiUserX, FiSlash
} from 'react-icons/fi';
import { translateMessage } from '../utils/translateChat';
import { getPhotoUrl } from '../utils/photoUrl';
import './LiveViewer.css';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Catalogue des cadeaux disponibles
const GIFTS = [
  { id: 'rose',    emoji: '🌹', name: 'Rose',     value: 1   },
  { id: 'kiss',    emoji: '💋', name: 'Bisou',    value: 5   },
  { id: 'heart',   emoji: '❤️', name: 'Cœur',     value: 10  },
  { id: 'star',    emoji: '⭐', name: 'Étoile',   value: 20  },
  { id: 'crown',   emoji: '👑', name: 'Couronne', value: 50  },
  { id: 'diamond', emoji: '💎', name: 'Diamant',  value: 100 },
];

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
  const navigate = useNavigate();
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
  const [giftScore, setGiftScore] = useState(0);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showJoinRulesModal, setShowJoinRulesModal] = useState(false);
  const [joinRulesAccepted, setJoinRulesAccepted] = useState(false);
  const [isLiveMod, setIsLiveMod] = useState(false);
  const [kickConfirmTarget, setKickConfirmTarget] = useState(null);
  const [blockConfirmTarget, setBlockConfirmTarget] = useState(null);

  const [otherParticipants, setOtherParticipants] = useState([]); // TÂCHE-048: grille P2P

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const chatRef = useRef(null);
  const hasLeftRef = useRef(false);
  const viewersInfoRef = useRef(new Map()); // displayName → { userId, photoUrl }
  const participantPeersRef = useRef(new Map()); // socketId → { peer } — TÂCHE-048
  const streamerSocketIdRef = useRef(null); // TÂCHE-048

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
    socket.on('room-info', ({ viewerCount: vc, streamerName: sn, viewers: initialViewers }) => {
      setViewerCount(vc);
      if (sn) setStreamerName(sn);
      if (initialViewers) {
        setViewers(initialViewers.map(v => ({
          socketId: v.socketId,
          userId: v.userId,
          name: v.displayName,
          photoUrl: v.photoUrl || null,
          joinedAt: new Date().toLocaleTimeString()
        })));
        initialViewers.forEach(v => {
          viewersInfoRef.current.set(v.displayName, { userId: v.userId, photoUrl: v.photoUrl });
        });
      }
      setConnected(true);
    });

    // Sync temps réel spectateurs — TÂCHE-015
    socket.on('viewers-updated', ({ viewerCount: vc, viewers: viewersList }) => {
      setViewerCount(vc);
      setViewers(viewersList.map(v => ({
        socketId: v.socketId,
        userId: v.userId,
        name: v.displayName,
        photoUrl: v.photoUrl || null,
        joinedAt: new Date().toLocaleTimeString()
      })));
      viewersList.forEach(v => {
        viewersInfoRef.current.set(v.displayName, { userId: v.userId, photoUrl: v.photoUrl });
      });
    });

    // Message "X a quitté le live" — TÂCHE-018
    socket.on('live-user-left', ({ displayName }) => {
      setMessages(prev => [...prev, {
        id: `sys-left-${displayName}-${Date.now()}`,
        username: 'System',
        text: t('liveStream.userLeft', { name: displayName }),
        isSystem: true,
        isJoinEvent: true,
        isOwn: false,
        photoUrl: null
      }]);
    });

    // Erreur (room introuvable)
    socket.on('error', ({ message }) => {
      console.error('Room error:', message);
      setRoomError(true);
      toast.error(message || t('liveViewer.roomNotFound'));
    });

    // Signaling WebRTC — TÂCHE-048 : route selon l'émetteur (streamer vs participant)
    socket.on('live-signal', ({ from, signal }) => {
      // Si non-participant ou signal du streamer → peer principal
      if (!streamerSocketIdRef.current || from === streamerSocketIdRef.current) {
        if (peerRef.current) {
          peerRef.current.signal(signal);
        } else {
          // Viewer non-participant : créer un peer non-initiator pour recevoir le stream
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
      } else {
        // Signal d'un autre participant — TÂCHE-048
        const pData = participantPeersRef.current.get(from);
        if (pData) pData.peer.signal(signal);
      }
    });

    // Un nouveau viewer rejoint
    socket.on('viewer-joined', ({ viewerSocketId, viewerInfo }) => {
      setMessages(prev => [...prev, {
        id: `sys-join-${viewerSocketId}-${Date.now()}`,
        username: 'System',
        text: t('liveStream.viewerJoined', { name: viewerInfo.displayName }),
        isSystem: true,
        isJoinEvent: true,
        lang: null,
        translatedText: null,
        showTranslation: false,
        translating: false,
        isOwn: false,
        photoUrl: null
      }]);
      // Stocker pour le chat
      if (viewerInfo.userId) {
        viewersInfoRef.current.set(viewerInfo.displayName, {
          userId: viewerInfo.userId,
          photoUrl: viewerInfo.photoUrl || null
        });
      }
    });

    // Message chat — TÂCHE-017 : photoUrl + countryFlag
    socket.on('live-chat-message', ({ username, text, lang, timestamp, photoUrl: msgPhotoUrl, countryFlag }) => {
      const info = viewersInfoRef.current.get(username);
      const photoUrl = msgPhotoUrl || info?.photoUrl || null;
      const userId = info?.userId || null;
      // BUG-7 : Limiter à 200 messages pour éviter la croissance mémoire infinie
      setMessages(prev => {
        const newMsg = {
          id: `msg-${timestamp}-${Math.random()}`,
          username,
          text,
          lang: lang || null,
          translatedText: null,
          showTranslation: false,
          translating: false,
          isOwn: false,
          photoUrl,
          userId,
          countryFlag: countryFlag || null
        };
        const updated = [...prev, newMsg];
        return updated.length > 200 ? updated.slice(-200) : updated;
      });
    });

    // Un viewer quitte (pour mettre à jour la liste)
    socket.on('viewer-left', ({ viewerSocketId }) => {
      setViewers(prev => prev.filter(v => v.socketId !== viewerSocketId));
    });

    // Demande de participation acceptée — TÂCHE-048 : + existingParticipants
    socket.on('join-accepted', ({ streamerSocketId, existingParticipants = [] }) => {
      streamerSocketIdRef.current = streamerSocketId;
      setJoinRequestStatus('accepted');
      setIsParticipant(true);
      toast.success(t('liveViewer.joinedLive'));

      // Démarrer la caméra pour participer (+ créer peers inter-participants)
      startLocalCamera(streamerSocketId, existingParticipants);
    });

    // Demande refusée (participation streamer) ou accès room refusé (kicked/blacklisted) — TÂCHE-049C
    socket.on('join-rejected', ({ reason } = {}) => {
      if (reason === 'blacklisted') {
        toast.error(t('liveViewer.joinRejectedBlacklisted'), { duration: 5000 });
        setTimeout(() => onLeave(), 2000);
      } else if (reason === 'kicked') {
        toast.error(t('liveViewer.joinRejectedKicked'), { duration: 4000 });
      } else {
        setJoinRequestStatus('rejected');
        toast.error(t('liveViewer.requestRejected'));
        setTimeout(() => setJoinRequestStatus('idle'), 3000);
      }
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

    // Expulsé du live par le streamer — TÂCHE-024
    socket.on('kicked-from-room', () => {
      toast.error(t('liveViewer.kickedFromRoom'));
      hasLeftRef.current = true;
      cleanup();
      socket.emit('leave-live-room', { roomId });
      setTimeout(() => onLeave(), 1200);
    });

    // Cadeau envoyé/reçu dans le salon
    socket.on('gift-received', ({ senderName, recipientName, recipientType, giftEmoji }) => {
      if (recipientType === 'streamer') {
        setGiftScore(prev => prev + 1);
      }
      toast(`${giftEmoji} ${senderName} → ${recipientName}`, { duration: 2500 });
    });

    // Nouveau participant dans la room — TÂCHE-048 : créer peer non-initiateur vers lui
    socket.on('new-participant', ({ participantSocketId, participantInfo }) => {
      if (!localStreamRef.current) return;
      const peer = new Peer({
        initiator: false,
        trickle: true,
        config: PEER_CONFIG,
        stream: localStreamRef.current
      });
      peer.on('signal', sig => socket.emit('live-signal', { to: participantSocketId, signal: sig }));
      peer.on('stream', stream => {
        setOtherParticipants(prev => {
          if (prev.some(p => p.socketId === participantSocketId)) return prev;
          return [...prev, { socketId: participantSocketId, stream, name: participantInfo.displayName, photoUrl: participantInfo.photoUrl }];
        });
      });
      peer.on('close', () => {
        participantPeersRef.current.delete(participantSocketId);
        setOtherParticipants(prev => prev.filter(p => p.socketId !== participantSocketId));
      });
      peer.on('error', () => {
        participantPeersRef.current.delete(participantSocketId);
        setOtherParticipants(prev => prev.filter(p => p.socketId !== participantSocketId));
      });
      participantPeersRef.current.set(participantSocketId, { peer });
    });

    // Participant a quitté — TÂCHE-048
    socket.on('participant-left', ({ participantSocketId }) => {
      const pData = participantPeersRef.current.get(participantSocketId);
      if (pData) { pData.peer.destroy(); participantPeersRef.current.delete(participantSocketId); }
      setOtherParticipants(prev => prev.filter(p => p.socketId !== participantSocketId));
    });

    // Promu modérateur live — TÂCHE-049C
    socket.on('live-mod-promoted', ({ targetSocketId, displayName }) => {
      if (targetSocketId === socket.id) {
        setIsLiveMod(true);
        toast.success(t('liveViewer.modPromoted'));
      }
      setViewers(prev => prev.map(v =>
        v.socketId === targetSocketId ? { ...v, isMod: true } : v
      ));
    });

    // Rétrogradé modérateur live — TÂCHE-049C
    socket.on('live-mod-demoted', ({ targetSocketId }) => {
      if (targetSocketId === socket.id) {
        setIsLiveMod(false);
        toast(t('liveViewer.modDemoted'));
      }
      setViewers(prev => prev.map(v =>
        v.socketId === targetSocketId ? { ...v, isMod: false } : v
      ));
    });

    // Viewer expulsé — message système dans chat — TÂCHE-049C
    socket.on('viewer-kicked', ({ displayName }) => {
      setViewers(prev => prev.filter(v => v.name !== displayName));
      setMessages(prev => {
        const msg = {
          id: `sys-kicked-${Date.now()}`,
          username: 'System',
          text: t('liveStream.viewerKickedMsg', { name: displayName }),
          isSystem: true,
          isOwn: false,
          photoUrl: null
        };
        const updated = [...prev, msg];
        return updated.length > 200 ? updated.slice(-200) : updated;
      });
    });

    // Viewer bloqué — message système dans chat — TÂCHE-049C
    socket.on('viewer-blocked', ({ displayName }) => {
      setViewers(prev => prev.filter(v => v.name !== displayName));
      setMessages(prev => {
        const msg = {
          id: `sys-blocked-${Date.now()}`,
          username: 'System',
          text: t('liveStream.viewerBlockedMsg', { name: displayName }),
          isSystem: true,
          isOwn: false,
          photoUrl: null
        };
        const updated = [...prev, msg];
        return updated.length > 200 ? updated.slice(-200) : updated;
      });
    });

    return () => {
      // N'émettre leave que si handleLeave ne l'a pas déjà fait (évite le double emit)
      if (!hasLeftRef.current) {
        cleanup();
        socket.emit('leave-live-room', { roomId });
      }
      // BUG-8 : Supprimer tous les listeners avant déconnexion
      socket.removeAllListeners();
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

  // Démarrer caméra quand promu participant — TÂCHE-048 : + existingParticipants
  const startLocalCamera = async (streamerSocketId, existingParticipants = []) => {
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

      // Créer peers initiateurs vers les participants existants — TÂCHE-048
      existingParticipants.forEach(({ socketId, displayName, photoUrl }) => {
        const peerP = new Peer({
          initiator: true,
          trickle: true,
          config: PEER_CONFIG,
          stream
        });
        peerP.on('signal', sig => socketRef.current?.emit('live-signal', { to: socketId, signal: sig }));
        peerP.on('stream', remStr => {
          setOtherParticipants(prev => {
            if (prev.some(p => p.socketId === socketId)) return prev;
            return [...prev, { socketId, stream: remStr, name: displayName, photoUrl }];
          });
        });
        peerP.on('close', () => {
          participantPeersRef.current.delete(socketId);
          setOtherParticipants(prev => prev.filter(p => p.socketId !== socketId));
        });
        peerP.on('error', () => {
          participantPeersRef.current.delete(socketId);
          setOtherParticipants(prev => prev.filter(p => p.socketId !== socketId));
        });
        participantPeersRef.current.set(socketId, { peer: peerP });
      });

      // Créer un nouveau peer bidirectionnel — participant est l'initiateur
      // (caméra prête ici, on peut envoyer l'offre immédiatement au streamer)
      const peer = new Peer({
        initiator: true,
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
    // Détruire tous les peers participants — TÂCHE-048
    for (const { peer } of participantPeersRef.current.values()) {
      peer.destroy();
    }
    participantPeersRef.current.clear();
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

  // Envoyer un cadeau au streamer (viewer/participant)
  const handleSendGift = useCallback((gift) => {
    if (!socketRef.current) return;
    socketRef.current.emit('send-gift', {
      roomId,
      giftId: gift.id,
      giftEmoji: gift.emoji,
      giftName: gift.name,
      giftValue: gift.value
    });
    setShowGiftPanel(false);
    toast.success(t('liveGifts.sent'));
  }, [roomId, t]);

  const toggleUiVisibility = useCallback(() => {
    setIsUiVisible(prev => !prev);
  }, []);

  // Kick depuis le live (modérateur live uniquement) — TÂCHE-049C
  const handleKickFromLive = useCallback((viewer) => {
    setKickConfirmTarget(viewer);
  }, []);

  const confirmKickFromLive = useCallback(() => {
    if (!kickConfirmTarget || !socketRef.current) return;
    socketRef.current.emit('kick-from-live', {
      roomId,
      targetSocketId: kickConfirmTarget.socketId,
      targetUserId: kickConfirmTarget.userId
    });
    setKickConfirmTarget(null);
  }, [kickConfirmTarget, roomId]);

  // Blocage depuis le live (modérateur live uniquement) — TÂCHE-049C
  const handleBlockFromLive = useCallback((viewer) => {
    setBlockConfirmTarget(viewer);
  }, []);

  const confirmBlockFromLive = useCallback(() => {
    if (!blockConfirmTarget || !socketRef.current) return;
    socketRef.current.emit('block-user-from-live', {
      roomId,
      targetUserId: blockConfirmTarget.userId,
      targetSocketId: blockConfirmTarget.socketId
    });
    setBlockConfirmTarget(null);
  }, [blockConfirmTarget, roomId]);

  // Bloquer un utilisateur pour soi-même (tous les viewers) — TÂCHE-049C
  const handleBlockUser = useCallback(async (viewer) => {
    if (!viewer.userId) return;
    try {
      await axios.post(`/api/users/block/${viewer.userId}`);
      toast.success(t('liveStream.blockSelfSuccess', { name: viewer.name }));
    } catch {
      toast.error(t('common.error'));
    }
  }, [t]);

  // Composant vignette participant — TÂCHE-048
  const ParticipantThumb = ({ stream, name }) => {
    const videoRef = useRef(null);
    useEffect(() => {
      const video = videoRef.current;
      if (video && stream) video.srcObject = stream;
      return () => { if (video) video.srcObject = null; };
    }, [stream]);
    return (
      <div className="lv-participant-thumb">
        <video ref={videoRef} autoPlay playsInline className="lv-thumb-video" />
        <span className="lv-participant-thumb-name">{name}</span>
      </div>
    );
  };

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

        {remoteStream && user?._id && (
          <div className="lv-watermark">{String(user._id).slice(-8)}</div>
        )}

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

      </div>

      {/* Grille des autres participants — TÂCHE-048 */}
      {isParticipant && otherParticipants.length > 0 && (
        <div className="lv-participants-grid">
          {otherParticipants.map(p => (
            <ParticipantThumb key={p.socketId} stream={p.stream} name={p.name} />
          ))}
        </div>
      )}

      {/* Preview locale si participant — en dehors de lv-video-section pour z-index correct */}
      {isParticipant && localStream && (
        <div className="lv-local-preview">
          {isCamOff ? (
            <div className="lv-cam-off-cover">
              {(() => {
                const primaryPhoto = user?.photos?.find(p => p.isPrimary) || user?.photos?.[0];
                return primaryPhoto?.url ? (
                  <img src={getPhotoUrl(primaryPhoto.url)} alt="" />
                ) : (
                  <span>{(user?.displayName || user?.firstName || '?').charAt(0).toUpperCase()}</span>
                );
              })()}
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="lv-local-video"
            />
          )}
        </div>
      )}

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
                    <FiGift /> {giftScore}
                  </button>
                </div>
              </div>
              <div className="lv-header-right">
                <button className="lv-close-btn" onClick={handleLeave}>
                  <FiX size={24} />
                </button>
              </div>
            </div>

            {/* Chat — TÂCHE-017 : photo spectateur */}
            <div className="lv-chat-section" ref={chatRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`lv-chat-message ${msg.isSystem ? 'system' : ''} ${msg.isJoinEvent ? 'is-join-event' : ''}`}>
                  {!msg.isSystem && (
                    <div className="lv-chat-avatar">
                      {msg.photoUrl ? (
                        <img src={getPhotoUrl(msg.photoUrl)} alt={msg.username} />
                      ) : (
                        <div className="lv-chat-avatar-initials">{(msg.username || '?').charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                  )}
                  <div className="lv-chat-content">
                    <div className="lv-chat-body">
                      <span className="lv-chat-username">{msg.username} :</span>
                      <span className="lv-chat-text">{msg.text}</span>
                    </div>
                    {msg.showTranslation && msg.translatedText && (
                      <div className="lv-translated-text">🌐 {msg.translatedText}</div>
                    )}
                    {msg.showTranslation && !msg.translatedText && !msg.translating && (
                      <div className="lv-translated-text">✓ {t('liveViewer.alreadyYourLang')}</div>
                    )}
                  </div>
                  {!msg.isSystem && (
                    <div className="ls-chat-meta">
                      {msg.countryFlag && <span className="ls-country-badge">{msg.countryFlag}</span>}
                      <button
                        className={`ls-translate-btn ${msg.translating ? 'loading' : ''}`}
                        onClick={() => handleTranslateMsg(msg.id)}
                        title={t('liveViewer.translate')}
                      >
                        <FiGlobe size={14} />
                      </button>
                    </div>
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
                {/* Bouton demander à rejoindre — ouvre la modale de règles */}
                {!isParticipant && (
                  <button
                    className={`lv-join-btn ${joinRequestStatus}`}
                    onClick={() => joinRequestStatus === 'idle' && setShowJoinRulesModal(true)}
                    disabled={joinRequestStatus !== 'idle'}
                  >
                    <FiUserPlus size={20} />
                  </button>
                )}
                <button className="lv-control-btn gift-btn" onClick={(e) => { e.stopPropagation(); setShowGiftPanel(true); }}>
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

      {/* Modale — Règles de participation */}
      <AnimatePresence>
        {showJoinRulesModal && (
          <motion.div
            className="lv-rules-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="lv-rules-modal"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* En-tête */}
              <div className="lv-rules-header">
                <FiAlertTriangle size={22} className="lv-rules-header-icon" />
                <h3>{t('liveViewer.joinRulesTitle')}</h3>
              </div>
              <p className="lv-rules-subtitle">{t('liveViewer.joinRulesSubtitle')}</p>

              {/* Liste des règles */}
              <ul className="lv-rules-list">
                <li className="lv-rule-item">
                  <span className="lv-rule-icon">🔞</span>
                  <span>{t('liveStream.rules.nudity')}</span>
                </li>
                <li className="lv-rule-item">
                  <span className="lv-rule-icon">🚫</span>
                  <span>{t('liveStream.rules.racism')}</span>
                </li>
                <li className="lv-rule-item">
                  <span className="lv-rule-icon">🚫</span>
                  <span>{t('liveStream.rules.politics')}</span>
                </li>
                <li className="lv-rule-item">
                  <span className="lv-rule-icon">🚫</span>
                  <span>{t('liveStream.rules.religion')}</span>
                </li>
                <li className="lv-rule-item">
                  <span className="lv-rule-icon">⚠️</span>
                  <span>{t('liveStream.rules.violence')}</span>
                </li>
              </ul>

              {/* Case à cocher */}
              <label className="lv-rules-accept">
                <input
                  type="checkbox"
                  checked={joinRulesAccepted}
                  onChange={(e) => setJoinRulesAccepted(e.target.checked)}
                />
                <span>{t('liveStream.rules.accept')}</span>
              </label>

              {/* Boutons */}
              <div className="lv-rules-actions">
                <button
                  className="lv-rules-cancel-btn"
                  onClick={() => { setShowJoinRulesModal(false); setJoinRulesAccepted(false); }}
                >
                  {t('liveStream.rules.cancel')}
                </button>
                <button
                  className="lv-rules-confirm-btn"
                  disabled={!joinRulesAccepted}
                  onClick={() => { setShowJoinRulesModal(false); handleRequestJoin(); }}
                >
                  <FiUserPlus size={16} />
                  {t('liveViewer.join')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel Cadeaux — Viewer/Participant → Streamer */}
      <AnimatePresence>
        {showGiftPanel && (
          <motion.div
            className="lv-gift-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowGiftPanel(false)}
          >
            <motion.div
              className="lv-gift-panel"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="lv-gift-panel-header">
                <FiGift size={20} className="lv-gift-panel-icon" />
                <h3>{t('liveGifts.panelTitle')}</h3>
                <button className="lv-gift-panel-close" onClick={() => setShowGiftPanel(false)}>
                  <FiX size={16} />
                </button>
              </div>
              <p className="lv-gift-recipient">{t('liveGifts.toStreamer', { name: streamerName })}</p>
              <div className="lv-gift-grid">
                {GIFTS.map(gift => (
                  <button key={gift.id} className="lv-gift-item" onClick={() => handleSendGift(gift)}>
                    <span className="lv-gift-emoji">{gift.emoji}</span>
                    <span className="lv-gift-name">{gift.name}</span>
                    <span className="lv-gift-value">{gift.value}pts</span>
                  </button>
                ))}
              </div>
            </motion.div>
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
                <div
                  key={i}
                  className={`lv-stats-row ${v.userId ? 'clickable' : ''}`}
                  onClick={() => v.userId && navigate(`/profile/${v.userId}`)}
                >
                  <div className="lv-stats-row-left">
                    {v.photoUrl ? (
                      <img src={getPhotoUrl(v.photoUrl)} alt={v.name} className="lv-stats-avatar-img" />
                    ) : (
                      <div className="lv-stats-avatar">{v.name.charAt(0)}</div>
                    )}
                    <div>
                      <div className="lv-stats-name">
                        {v.name}
                        {v.isMod && <span className="lv-mod-badge">{t('liveStream.modBadge')}</span>}
                      </div>
                      <div className="lv-stats-badge">{v.joinedAt}</div>
                    </div>
                  </div>
                  {/* Actions — masquées pour soi-même */}
                  {v.userId && v.userId !== user?._id?.toString() && (
                    <div className="lv-viewer-actions" onClick={e => e.stopPropagation()}>
                      {isLiveMod ? (
                        <>
                          <button
                            className="lv-action-btn kick-btn"
                            onClick={() => handleKickFromLive(v)}
                            title={t('liveStream.kickParticipant')}
                          >
                            <FiUserX size={13} />
                          </button>
                          <button
                            className="lv-action-btn block-btn"
                            onClick={() => handleBlockFromLive(v)}
                            title={t('liveStream.blockViewer')}
                          >
                            <FiSlash size={13} />
                          </button>
                        </>
                      ) : (
                        <button
                          className="lv-action-btn block-self-btn"
                          onClick={() => handleBlockUser(v)}
                          title={t('liveStream.blockSelf')}
                        >
                          <FiSlash size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeStatsTab === 'gifts' && (
          <div className="lv-tab-content">
            <div className="lv-stats-total">
              <span className="lv-stats-total-label">{t('liveStream.totalGifts')}</span>
              <span className="lv-stats-total-value">{giftScore}</span>
            </div>
            <div className="lv-stats-list">
              {/* Liste des cadeaux vide pour l'instant */}
            </div>
          </div>
        )}
      </div>

      {/* Modal confirmation Kick — modérateur live — TÂCHE-049C */}
      {kickConfirmTarget && (
        <div className="lv-confirm-overlay" onClick={() => setKickConfirmTarget(null)}>
          <div className="lv-confirm-modal" onClick={e => e.stopPropagation()}>
            <h4>{t('liveStream.kickParticipant')}</h4>
            <p>{t('liveStream.kickViewerConfirm', { name: kickConfirmTarget.name })}</p>
            <div className="lv-confirm-actions">
              <button className="lv-confirm-cancel" onClick={() => setKickConfirmTarget(null)}>
                {t('common.cancel')}
              </button>
              <button className="lv-confirm-danger" onClick={confirmKickFromLive}>
                <FiUserX size={14} /> {t('liveStream.kickParticipant')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation Block — modérateur live — TÂCHE-049C */}
      {blockConfirmTarget && (
        <div className="lv-confirm-overlay" onClick={() => setBlockConfirmTarget(null)}>
          <div className="lv-confirm-modal" onClick={e => e.stopPropagation()}>
            <h4>{t('liveStream.blockViewer')}</h4>
            <p>{t('liveStream.blockViewerConfirm', { name: blockConfirmTarget.name })}</p>
            <div className="lv-confirm-actions">
              <button className="lv-confirm-cancel" onClick={() => setBlockConfirmTarget(null)}>
                {t('common.cancel')}
              </button>
              <button className="lv-confirm-danger" onClick={confirmBlockFromLive}>
                <FiSlash size={14} /> {t('liveStream.blockViewer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveViewer;
