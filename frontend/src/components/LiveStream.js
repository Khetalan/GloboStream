import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiGift, FiUsers,
  FiX, FiEye, FiSend, FiPlay, FiArrowLeft,
  FiUserPlus, FiCheck, FiSlash, FiEdit2, FiAlertTriangle
} from 'react-icons/fi';
import { translateMessage } from '../utils/translateChat';
import { getPhotoUrl } from '../utils/photoUrl';
import './LiveStream.css';

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

// Thèmes disponibles pour le mode event (partagé avec LiveEvent.js)
const EVENT_THEMES = [
  { id: 'music',      label: 'Musique',    emoji: '🎵', color: '#8b5cf6' },
  { id: 'gaming',     label: 'Gaming',     emoji: '🎮', color: '#3b82f6' },
  { id: 'sport',      label: 'Sport',      emoji: '🏋️', color: '#10b981' },
  { id: 'cuisine',    label: 'Cuisine',    emoji: '🍳', color: '#f59e0b' },
  { id: 'beauty',     label: 'Beauté',     emoji: '💄', color: '#ec4899' },
  { id: 'travel',     label: 'Voyage',     emoji: '✈️', color: '#06b6d4' },
  { id: 'art',        label: 'Art',        emoji: '🎨', color: '#f97316' },
  { id: 'discussion', label: 'Discussion', emoji: '💬', color: '#6b7280' },
];

/**
 * Composant LiveStream (côté streamer)
 * Flow : montage → getUserMedia → preview → "Go Live" → crée salon Socket.IO → WebRTC peers
 */
const LiveStream = ({ mode = 'public', onQuit, streamerName = 'Streamer', user, theme = null }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // États flow
  const [isLive, setIsLive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // États live
  const [participants, setParticipants] = useState([]);
  const [hiddenParticipants, setHiddenParticipants] = useState(new Set());
  const [, setLocalStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [giftCount, setGiftCount] = useState(0);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [activeStatsTab, setActiveStatsTab] = useState('viewers');
  const [viewers, setViewers] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [selectedParticipantForGift, setSelectedParticipantForGift] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [showJoinRequestsPanel, setShowJoinRequestsPanel] = useState(false); // New state
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [liveDescription, setLiveDescription] = useState('');
  const [selectedEventTheme, setSelectedEventTheme] = useState(theme);

  // Refs
  const chatRef = useRef(null);
  const localVideoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const roomIdRef = useRef(null);
  const viewerPeersRef = useRef(new Map()); // socketId → Peer (send-only)
  const participantPeersRef = useRef(new Map()); // socketId → { peer, stream }
  const viewersInfoRef = useRef(new Map()); // displayName → { userId, photoUrl }

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

      // Fermer le salon (le socket se déconnecte dans son propre useEffect)
      if (socketRef.current && roomIdRef.current) {
        socketRef.current.emit('close-live-room', { roomId: roomIdRef.current });
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

    // Sync temps réel de la liste spectateurs (TÂCHE-015)
    socket.on('viewers-updated', ({ viewerCount: vc, viewers: viewersList }) => {
      setViewerCount(vc);
      setViewers(viewersList.map(v => ({
        socketId: v.socketId,
        userId: v.userId,
        name: v.displayName,
        photoUrl: v.photoUrl || null,
        joinedAt: new Date().toLocaleTimeString()
      })));
      // Mettre à jour la map nom → { userId, photoUrl }
      viewersList.forEach(v => {
        viewersInfoRef.current.set(v.displayName, { userId: v.userId, photoUrl: v.photoUrl });
      });
    });

    // Message "X a quitté le live" (TÂCHE-018)
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

    // Un nouveau viewer rejoint
    socket.on('viewer-joined', ({ viewerSocketId, viewerInfo }) => {
      console.log('Viewer joined:', viewerInfo.displayName);

      setViewerCount(prev => prev + 1);
      setViewers(prev => [...prev, {
        socketId: viewerSocketId,
        userId: viewerInfo.userId || null,
        name: viewerInfo.displayName,
        photoUrl: viewerInfo.photoUrl || null,
        joinedAt: new Date().toLocaleTimeString()
      }]);
      // Stocker pour le chat
      if (viewerInfo.userId) {
        viewersInfoRef.current.set(viewerInfo.displayName, {
          userId: viewerInfo.userId,
          photoUrl: viewerInfo.photoUrl || null
        });
      }

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
        config: PEER_CONFIG,
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

    // Message chat reçu — TÂCHE-017 : photoUrl
    socket.on('live-chat-message', ({ username, text, lang, timestamp, photoUrl: msgPhotoUrl }) => {
      const info = viewersInfoRef.current.get(username);
      const photoUrl = msgPhotoUrl || info?.photoUrl || null;
      const userId = info?.userId || null;
      setMessages(prev => [...prev, {
        id: `msg-${timestamp}-${Math.random()}`,
        username,
        text,
        lang: lang || null,
        translatedText: null,
        showTranslation: false,
        translating: false,
        isOwn: false,
        photoUrl,
        userId
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

    // NOUVEAU: Un participant active/désactive sa caméra
    // Note: Nécessite que LiveViewer.js émette cet événement
    socket.on('participant-cam-state', ({ from, isCamOff }) => {
      setParticipants(prev => prev.map(p =>
        p.socketId === from ? { ...p, isCamOff } : p
      ));
    });

    // NOUVEAU: Un participant est mis en sourdine par le streamer
    // Note: Le backend doit relayer cet événement au participant concerné
    // pour qu'il coupe réellement son micro.

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

    // Cadeau reçu par le streamer ou un participant
    socket.on('gift-received', ({ senderName, recipientName, recipientType, giftEmoji, giftValue }) => {
      if (recipientType === 'streamer') {
        setGiftCount(prev => prev + 1);
        setGifts(prev => {
          const idx = prev.findIndex(g => g.name === senderName);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], gifts: updated[idx].gifts + giftValue };
            return [...updated].sort((a, b) => b.gifts - a.gifts);
          }
          return [...prev, { name: senderName, gifts: giftValue }].sort((a, b) => b.gifts - a.gifts);
        });
      }
      toast(`${giftEmoji} ${senderName} → ${recipientName}`, { duration: 2500 });
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
    // Émettre l'état du micro aux spectateurs
    if (socketRef.current && roomIdRef.current) {
      socketRef.current.emit('streamer-mic-state', { roomId: roomIdRef.current, isMuted: !isMuted });
    }
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
        tags: [
          ...(mode === 'event' && selectedEventTheme ? [selectedEventTheme.id] : []),
        ],
        userId: user?._id,
        displayName: streamerName,
        description: liveDescription
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
  const handleAcceptJoinRequest = useCallback(async (request) => {
    if (!socketRef.current || !roomIdRef.current) return;

    // NOUVEAU: Récupérer la photo de profil du participant
    let photoUrl = null;
    try {
      // L'API pour les profils publics est utilisée ici
      const response = await axios.get(`/api/public-profile/${request.userId}`);
      const profile = response.data;
      // On cherche la photo principale, sinon on prend la première
      photoUrl = profile.photos?.find(p => p.isPrimary)?.url || profile.photos?.[0]?.url;
    } catch (error) {
      console.error("Impossible de récupérer le profil du participant:", error);
      // On continue sans photo, l'avatar avec l'initiale sera affiché
    }

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
    // Le participant sera l'initiateur (après getUserMedia) — streamer attend son offre
    const stream = localStreamRef.current;
    if (!stream) return;

    const peer = new Peer({
      initiator: false,
      config: PEER_CONFIG,
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
        stream: remoteStream,
        photoUrl: photoUrl, // Photo récupérée
        isCamOff: false,    // État initial de la caméra
        isMutedByStreamer: false // État initial de la sourdine
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

  const toggleUiVisibility = useCallback(() => {
    setIsUiVisible(prev => !prev);
  }, []);

  // NOUVEAU: Mettre en sourdine / réactiver le micro d'un participant
  const handleToggleMuteParticipant = useCallback((participant) => {
    if (!socketRef.current || !roomIdRef.current) return;

    const newMuteState = !participant.isMutedByStreamer;

    // Événement à créer côté backend pour relayer l'ordre au participant
    socketRef.current.emit('streamer-toggle-mute-participant', {
      roomId: roomIdRef.current,
      participantSocketId: participant.socketId,
      mute: newMuteState,
    });

    // Mise à jour de l'état local pour un retour visuel immédiat
    setParticipants(prev => prev.map(p =>
      p.socketId === participant.socketId ? { ...p, isMutedByStreamer: newMuteState } : p
    ));
    toast.success(newMuteState ? t('liveStream.participantMuted', { name: participant.name }) : t('liveStream.participantUnmuted', { name: participant.name }));
  }, [t]);

  // Expulser un spectateur du live (streamer uniquement) — TÂCHE-024
  const handleKickViewer = useCallback((viewer) => {
    if (!socketRef.current || !roomIdRef.current) return;
    socketRef.current.emit('streamer-kick-participant', {
      roomId: roomIdRef.current,
      participantSocketId: viewer.socketId,
    });
    setViewers(prev => prev.filter(v => v.socketId !== viewer.socketId));
    toast.success(t('liveStream.participantKicked', { name: viewer.name }));
  }, [t]);

  // Envoyer un cadeau à un participant (streamer uniquement)
  const handleSendGift = useCallback((gift, participant) => {
    if (!socketRef.current || !roomIdRef.current || !participant) return;
    socketRef.current.emit('send-gift', {
      roomId: roomIdRef.current,
      giftId: gift.id,
      giftEmoji: gift.emoji,
      giftName: gift.name,
      giftValue: gift.value,
      recipientSocketId: participant.socketId
    });
    setShowGiftPanel(false);
    setSelectedParticipantForGift(null);
    toast.success(t('liveGifts.sent'));
  }, [t]);

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
          <textarea
            className="ls-description-input"
            placeholder={t('liveStream.descriptionPlaceholder')}
            value={liveDescription}
            onChange={(e) => setLiveDescription(e.target.value)}
            maxLength={150}
            rows={2}
          />
          {mode === 'event' && (
            <div className="ls-theme-selector">
              <label className="ls-theme-selector-label">
                {t('liveEvent.chooseTheme')}
              </label>
              <div className="ls-theme-chips">
                {EVENT_THEMES.map(th => (
                  <button
                    key={th.id}
                    type="button"
                    className={`ls-theme-chip ${selectedEventTheme?.id === th.id ? 'active' : ''}`}
                    style={{ '--theme-color': th.color }}
                    onClick={() => setSelectedEventTheme(th)}
                  >
                    {th.emoji} {th.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {user?.photos?.length > 0 ? (
            <button className="ls-go-live-btn" onClick={() => setShowRulesModal(true)}>
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

        {/* Modale — Règles de diffusion */}
        <AnimatePresence>
          {showRulesModal && (
            <motion.div
              className="ls-rules-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="ls-rules-modal"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {/* En-tête */}
                <div className="ls-rules-header">
                  <FiAlertTriangle size={22} className="ls-rules-header-icon" />
                  <h3>{t('liveStream.rules.title')}</h3>
                </div>
                <p className="ls-rules-subtitle">{t('liveStream.rules.subtitle')}</p>

                {/* Liste des règles */}
                <ul className="ls-rules-list">
                  <li className="ls-rule-item">
                    <span className="ls-rule-icon">🔞</span>
                    <span>{t('liveStream.rules.nudity')}</span>
                  </li>
                  <li className="ls-rule-item">
                    <span className="ls-rule-icon">🚫</span>
                    <span>{t('liveStream.rules.racism')}</span>
                  </li>
                  <li className="ls-rule-item">
                    <span className="ls-rule-icon">🚫</span>
                    <span>{t('liveStream.rules.politics')}</span>
                  </li>
                  <li className="ls-rule-item">
                    <span className="ls-rule-icon">🚫</span>
                    <span>{t('liveStream.rules.religion')}</span>
                  </li>
                  <li className="ls-rule-item">
                    <span className="ls-rule-icon">⚠️</span>
                    <span>{t('liveStream.rules.violence')}</span>
                  </li>
                </ul>

                {/* Case à cocher */}
                <label className="ls-rules-accept">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(e) => setRulesAccepted(e.target.checked)}
                  />
                  <span>{t('liveStream.rules.accept')}</span>
                </label>

                {/* Boutons */}
                <div className="ls-rules-actions">
                  <button
                    className="ls-rules-cancel-btn"
                    onClick={() => { setShowRulesModal(false); setRulesAccepted(false); }}
                  >
                    {t('liveStream.rules.cancel')}
                  </button>
                  <button
                    className="ls-rules-start-btn"
                    disabled={!rulesAccepted}
                    onClick={() => { setShowRulesModal(false); handleGoLive(); }}
                  >
                    <FiPlay size={16} />
                    {t('liveStream.rules.start')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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

  const streamerPhoto = user.photos?.find(p => p.isPrimary)?.url || user.photos?.[0]?.url;

  const renderParticipantCards = () => {
    return participants.map((p, i) => {
      // Carte masquée localement par le streamer
      if (hiddenParticipants.has(p.socketId)) return null;

      return (
        <div key={p.socketId || i} className="ls-video-card user">
          <div className="ls-video-placeholder">
            {p.isCamOff ? (
              <div className="ls-video-placeholder cam-off">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.name} className="ls-cam-off-photo" />
                ) : (
                  <div className="ls-cam-off-avatar">{p.name.charAt(0)}</div>
                )}
                <div className="ls-cam-off-name">{p.name}</div>
              </div>
            ) : (
              p.stream ? <ParticipantVideo stream={p.stream} /> : <FiVideo size={32} />
            )}
          </div>
          <div className="ls-video-label">{p.name || `User ${i + 1}`}</div>
          <div className="ls-participant-controls">
            {/* Micro : icône dynamique selon état muté */}
            <button
              className={`ls-participant-ctrl-btn mic-btn ${p.isMutedByStreamer ? 'muted' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleToggleMuteParticipant(p); }}
              title={p.isMutedByStreamer ? t('liveStream.unmuteParticipant') : t('liveStream.muteParticipant')}
            >
              {p.isMutedByStreamer ? <FiMicOff size={14} /> : <FiMic size={14} />}
            </button>
            {/* X : masquer la carte localement (le participant reste dans le live) */}
            <button
              className="ls-participant-ctrl-btn hide-btn"
              onClick={(e) => {
                e.stopPropagation();
                setHiddenParticipants(prev => new Set([...prev, p.socketId]));
              }}
              title={t('liveStream.hideParticipant')}
            >
              <FiX size={14} />
            </button>
          </div>
          {p.isMutedByStreamer && (
            <div className="ls-mic-muted"><FiMicOff size={13} /></div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={`ls-container ls-mode-${mode}`}>
      {/* Grille vidéo en arrière-plan, cliquable pour toggle l'UI */}
      <div className={`ls-video-grid ${layoutClass}`} onClick={toggleUiVisibility}>
        <div className="ls-video-card streamer">
          <div className="ls-video-placeholder">
            {/* Le <video> est toujours monté pour éviter de perdre le stream. On le cache simplement. */}
            <video
              ref={localVideoRef}
              autoPlay
              muted={true}
              playsInline
              className="ls-local-video"
              style={{ display: isCamOff ? 'none' : 'block' }}
            />
            {/* Watermark protection contre la capture */}
            {!isCamOff && user?._id && (
              <div className="ls-watermark">{String(user._id).slice(-8)}</div>
            )}
            {isCamOff && (
              <div className="ls-video-placeholder cam-off">
                {streamerPhoto ? (
                  <img src={streamerPhoto} alt={streamerName} className="ls-cam-off-photo" />
                ) : (
                  <div className="ls-cam-off-avatar">{streamerName.charAt(0).toUpperCase()}</div>
                )}
                <div className="ls-cam-off-name">{streamerName}</div>
              </div>
            )}
          </div>

          {isMuted && (
            <div className="ls-mic-muted">
              <FiMicOff size={13} />
            </div>
          )}
        </div>

        {renderParticipantCards()}
      </div>

      {/* Interface Utilisateur (Overlay) */}
      <AnimatePresence>
        {isUiVisible && (
          <motion.div
            className="ls-ui-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Barre du haut */}
            <div className="ls-top-bar">
              <div className="ls-streamer-info">
                <span className="ls-streamer-name">{streamerName}</span>
                <div className="ls-stats-indicators">
                  <div className="ls-live-badge">
                    <span>LIVE</span>
                  </div>
                  <button className="ls-viewer-count" onClick={(e) => { e.stopPropagation(); setShowStatsPanel(true); }}>
                    <FiEye /> {formatNumber(viewerCount)}
                  </button>
                  <button className="ls-gift-count" onClick={(e) => { e.stopPropagation(); setActiveStatsTab('gifts'); setShowStatsPanel(true); }}>
                    <FiGift /> {formatNumber(giftCount)}
                  </button>
                </div>
              </div>
              {/* Bouton quitter — déplacé depuis la barre du bas — TÂCHE-024 */}
              <button
                className="ls-top-quit"
                onClick={(e) => { e.stopPropagation(); handleQuit(); }}
                title={t('liveStream.stopStream')}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Chat — TÂCHE-017 : photo spectateur */}
            <div className="ls-chat-section" ref={chatRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`ls-chat-message ${msg.isSystem ? 'system' : ''} ${msg.isJoinEvent ? 'is-join-event' : ''} ${msg.isOwn ? 'own' : ''}`}>
                  {!msg.isSystem && (
                    <div className="ls-chat-avatar">
                      {msg.photoUrl ? (
                        <img src={getPhotoUrl(msg.photoUrl)} alt={msg.username} />
                      ) : (
                        <div className="ls-chat-avatar-initials">{(msg.username || '?').charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                  )}
                  <div className="ls-chat-content">
                    <div className="ls-chat-body">
                      <span className="ls-chat-username">{msg.username} :</span>
                      <span className="ls-chat-text">{msg.text}</span>
                      <div className="ls-chat-icons">
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
                    </div>
                    {msg.showTranslation && msg.translatedText && (
                      <div className="ls-translated-text">🌐 {msg.translatedText}</div>
                    )}
                    {msg.showTranslation && !msg.translatedText && !msg.translating && (
                      <div className="ls-translated-text">✓ {t('liveStream.alreadyYourLang')}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Panel de saisie du chat (slide-up au-dessus de la barre) */}
            <AnimatePresence>
              {showChatPanel && (
                <motion.div
                  className="ls-chat-panel"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <input
                    type="text"
                    className="ls-chat-panel-input"
                    placeholder={t('liveStream.chatPlaceholder')}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') { handleSendMessage(); setShowChatPanel(false); }
                    }}
                    autoFocus
                  />
                  <button
                    className="ls-chat-panel-send"
                    onClick={() => { handleSendMessage(); setShowChatPanel(false); }}
                  >
                    <FiSend size={16} />
                  </button>
                  <button
                    className="ls-chat-panel-close"
                    onClick={() => { setChatInput(''); setShowChatPanel(false); }}
                  >
                    <FiX size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Barre du bas */}
            <div className="ls-bottom-bar">
              <button
                className="ls-write-btn"
                onClick={() => setShowChatPanel(prev => !prev)}
              >
                <FiEdit2 size={16} />
                <span>{t('liveStream.writeBtn')}</span>
              </button>

              <div className="ls-controls-left">
                <button className="ls-control-btn requests-btn" onClick={(e) => { e.stopPropagation(); setShowJoinRequestsPanel(true); }}>
                  <FiUsers size={20} />
                  {joinRequests.length > 0 && <span className="ls-requests-count">{joinRequests.length}</span>}
                </button>
                <button className="ls-control-btn gift-btn" onClick={(e) => { e.stopPropagation(); setShowGiftPanel(true); }}>
                  <FiGift size={20} />
                </button>
              </div>

              <div className="ls-controls-right">
                <button className={`ls-control-btn ${isMuted ? 'off' : ''}`} onClick={toggleMic}>
                  {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
                </button>
                <button className={`ls-control-btn ${isCamOff ? 'off' : ''}`} onClick={toggleCam}>
                  {isCamOff ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
                </button>
                {/* stop-stream déplacé dans ls-top-bar — TÂCHE-024 */}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panels (Stats & Requests) - Restent en dehors de l'overlay UI pour être gérés indépendamment */}
      {showStatsPanel && (
        <div className="ls-stats-overlay" onClick={() => setShowStatsPanel(false)} />
      )}

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
                <div
                  key={i}
                  className={`ls-stats-row ${v.userId ? 'clickable' : ''}`}
                  onClick={() => v.userId && navigate(`/profile/${v.userId}`)}
                >
                  <div className="ls-stats-row-left">
                    {v.photoUrl ? (
                      <img src={getPhotoUrl(v.photoUrl)} alt={v.name} className="ls-stats-avatar-img" />
                    ) : (
                      <div className="ls-stats-avatar">{v.name.charAt(0)}</div>
                    )}
                    <div>
                      <div className="ls-stats-name">{v.name}</div>
                      <div className="ls-stats-badge">{v.joinedAt}</div>
                    </div>
                  </div>
                  {/* Bouton Kick — streamer uniquement */}
                  <button
                    className="ls-kick-btn"
                    onClick={(e) => { e.stopPropagation(); handleKickViewer(v); }}
                    title={t('liveStream.kickParticipant')}
                  >
                    <FiSlash size={14} />
                  </button>
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
      {/* Panel Cadeaux — Streamer → Participant */}
      <AnimatePresence>
        {showGiftPanel && (
          <motion.div
            className="ls-gift-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => { setShowGiftPanel(false); setSelectedParticipantForGift(null); }}
          >
            <motion.div
              className="ls-gift-panel"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="ls-gift-panel-header">
                <FiGift size={20} className="ls-gift-panel-icon" />
                <h3>{t('liveGifts.panelTitle')}</h3>
                <button className="ls-gift-panel-close" onClick={() => { setShowGiftPanel(false); setSelectedParticipantForGift(null); }}>
                  <FiX size={16} />
                </button>
              </div>

              {participants.length === 0 ? (
                <p className="ls-gift-no-participants">{t('liveGifts.noParticipants')}</p>
              ) : (
                <>
                  <p className="ls-gift-subtitle">{t('liveGifts.selectParticipant')}</p>
                  <div className="ls-gift-participants-scroll">
                    {participants.map(p => (
                      <button
                        key={p.socketId}
                        className={`ls-gift-participant-btn${selectedParticipantForGift?.socketId === p.socketId ? ' selected' : ''}`}
                        onClick={() => setSelectedParticipantForGift(p)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>

                  {selectedParticipantForGift && (
                    <>
                      <p className="ls-gift-subtitle">{t('liveGifts.toParticipant', { name: selectedParticipantForGift.name })}</p>
                      <div className="ls-gift-grid">
                        {GIFTS.map(gift => (
                          <button key={gift.id} className="ls-gift-item" onClick={() => handleSendGift(gift, selectedParticipantForGift)}>
                            <span className="ls-gift-emoji">{gift.emoji}</span>
                            <span className="ls-gift-name">{gift.name}</span>
                            <span className="ls-gift-value">{gift.value}pts</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveStream;
