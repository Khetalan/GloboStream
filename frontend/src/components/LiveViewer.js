import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import toast from 'react-hot-toast';
import {
  FiX, FiEye, FiSend, FiArrowLeft, FiUserPlus,
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiGlobe
} from 'react-icons/fi';
import { translateText, getLangFlag } from '../utils/translateChat';
import './LiveViewer.css';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
  const [translateEnabled, setTranslateEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [joinRequestStatus, setJoinRequestStatus] = useState('idle'); // idle | pending | accepted | rejected
  const [isParticipant, setIsParticipant] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [connected, setConnected] = useState(false);
  const [roomError, setRoomError] = useState(false);

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const chatRef = useRef(null);

  // Connecter Socket.IO et rejoindre le salon
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    // Enregistrer l'utilisateur
    if (user?._id) {
      socket.emit('register', user._id);
    }

    // Rejoindre le salon
    socket.emit('join-live-room', {
      roomId,
      userId: user?._id,
      displayName: user?.displayName || user?.firstName || 'Viewer'
    });

    // Infos de la room reçues
    socket.on('room-info', ({ viewerCount: vc }) => {
      setViewerCount(vc);
      setConnected(true);
    });

    // Erreur (room introuvable)
    socket.on('error', ({ message }) => {
      console.error('Room error:', message);
      setRoomError(true);
      toast.error(message || 'Salon introuvable');
    });

    // Signaling WebRTC (offer du streamer)
    socket.on('live-signal', ({ from, signal }) => {
      if (peerRef.current) {
        peerRef.current.signal(signal);
      } else {
        // Créer un peer non-initiator pour recevoir le stream
        const peer = new Peer({
          initiator: false,
          trickle: false,
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
        });

        peer.signal(signal);
        peerRef.current = peer;
      }
    });

    // Message chat
    socket.on('live-chat-message', ({ username, text, lang, timestamp }) => {
      const msgId = `msg-${timestamp}-${Math.random()}`;
      const myLang = i18n.language?.split('-')[0] || 'fr';
      const msgLang = lang || 'fr';

      setMessages(prev => [...prev, {
        id: msgId,
        username,
        text,
        lang: msgLang,
        flag: getLangFlag(msgLang),
        translatedText: null,
        isOwn: false
      }]);

      // Auto-traduction si langue différente
      if (msgLang !== myLang) {
        translateText(text, msgLang, myLang).then(translated => {
          if (translated) {
            setMessages(prev => prev.map(m =>
              m.id === msgId ? { ...m, translatedText: translated } : m
            ));
          }
        });
      }
    });

    // Demande de participation acceptée
    socket.on('join-accepted', ({ streamerSocketId }) => {
      setJoinRequestStatus('accepted');
      setIsParticipant(true);
      toast.success('Vous avez rejoint le live !');

      // Démarrer la caméra pour participer
      startLocalCamera(streamerSocketId);
    });

    // Demande refusée
    socket.on('join-rejected', () => {
      setJoinRequestStatus('rejected');
      toast.error('Demande refusée');
      setTimeout(() => setJoinRequestStatus('idle'), 3000);
    });

    // Room fermée par le streamer
    socket.on('room-closed', () => {
      toast('Le live est terminé');
      cleanup();
      onLeave();
    });

    return () => {
      cleanup();
      socket.emit('leave-live-room', { roomId });
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
        trickle: false,
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
      toast.error('Impossible d\'accéder à la caméra');
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

  // Envoyer un message chat
  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || !socketRef.current) return;

    socketRef.current.emit('live-chat', {
      roomId,
      text: chatInput,
      username: user?.displayName || user?.firstName || 'Viewer',
      lang: i18n.language?.split('-')[0] || 'fr'
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
    setIsMuted(prev => !prev);
  }, [isMuted]);

  // Toggle caméra (participant seulement)
  const toggleCam = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = isCamOff;
    }
    setIsCamOff(prev => !prev);
  }, [isCamOff]);

  // Quitter
  const handleLeave = useCallback(() => {
    cleanup();
    if (socketRef.current) {
      socketRef.current.emit('leave-live-room', { roomId });
    }
    onLeave();
  }, [roomId, onLeave]);

  // ── Erreur room ──
  if (roomError) {
    return (
      <div className="lv-container">
        <div className="lv-error-screen">
          <FiX size={48} />
          <h3>Salon introuvable</h3>
          <p>Ce live n'existe plus ou a été fermé.</p>
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
          <p>Connexion au live...</p>
        </div>
      </div>
    );
  }

  // ── Interface viewer ──
  return (
    <div className="lv-container">
      {/* Vidéo du streamer (plein écran) */}
      <div className="lv-video-section">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="lv-remote-video"
        />

        {!remoteStream && (
          <div className="lv-waiting-overlay">
            <div className="lv-loading-spinner" />
            <p>En attente du flux vidéo...</p>
          </div>
        )}

        {/* Badge LIVE + viewers */}
        <div className="lv-live-badge">
          <span className="lv-live-dot" />
          <span>LIVE</span>
          <span className="lv-viewer-count">
            <FiEye size={12} />
            {viewerCount}
          </span>
        </div>

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

      {/* Chat */}
      <div className="lv-chat-section" ref={chatRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`lv-chat-message ${msg.isSystem ? 'system' : ''}`}>
            <span className="lv-chat-username">{msg.username} :</span>
            <span className="lv-chat-text">
              {translateEnabled && msg.translatedText ? msg.translatedText : msg.text}
            </span>
            {msg.flag && <span className="lv-lang-badge">{msg.flag}</span>}
          </div>
        ))}
      </div>

      {/* Barre du bas */}
      <div className="lv-bottom-bar">
        <div className="lv-input-container">
          <input
            type="text"
            placeholder="Envoyer un message..."
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

        <button
          className={`lv-control-btn translate-btn ${translateEnabled ? 'active' : ''}`}
          onClick={() => setTranslateEnabled(prev => !prev)}
          title={translateEnabled ? 'Traduction activée' : 'Traduction désactivée'}
        >
          <FiGlobe size={16} />
        </button>

        {/* Bouton demander à rejoindre */}
        {!isParticipant && (
          <button
            className={`lv-join-btn ${joinRequestStatus}`}
            onClick={handleRequestJoin}
            disabled={joinRequestStatus !== 'idle'}
          >
            <FiUserPlus size={16} />
            <span>
              {joinRequestStatus === 'idle' && 'Rejoindre'}
              {joinRequestStatus === 'pending' && 'En attente...'}
              {joinRequestStatus === 'accepted' && 'Accepté !'}
              {joinRequestStatus === 'rejected' && 'Refusé'}
            </span>
          </button>
        )}

        {/* Contrôles participant */}
        {isParticipant && (
          <>
            <button
              className={`lv-control-btn ${isMuted ? 'muted' : ''}`}
              onClick={toggleMic}
            >
              {isMuted ? <FiMicOff size={16} /> : <FiMic size={16} />}
            </button>
            <button
              className={`lv-control-btn ${isCamOff ? 'muted' : ''}`}
              onClick={toggleCam}
            >
              {isCamOff ? <FiVideoOff size={16} /> : <FiVideo size={16} />}
            </button>
          </>
        )}

        <button className="lv-control-btn quit-btn" onClick={handleLeave}>
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
};

export default LiveViewer;
