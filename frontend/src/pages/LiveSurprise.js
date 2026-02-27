import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import axios from 'axios';
import { FiArrowLeft, FiPlay, FiRefreshCw, FiMic, FiMicOff, FiVideo, FiVideoOff, FiX, FiHeart, FiThumbsDown, FiMessageCircle, FiSend, FiSliders, FiGlobe } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import './LiveSurprise.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://globostream.onrender.com';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LANGUAGES = ['FR', 'EN', 'IT', 'ES', 'DE'];

const PEER_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

const LiveSurprise = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // État de navigation
  const [screen, setScreen] = useState('start'); // start | searching | videocall | decision
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [timer, setTimer] = useState(180);
  const [partner, setPartner] = useState(null);
  const [cameraError, setCameraError] = useState(false);

  // TÂCHE-011 — Compteur de participants en ligne
  const [onlineCount, setOnlineCount] = useState(0);

  // TÂCHE-010 — Panel d'envoi de message
  const [showMsgPanel, setShowMsgPanel] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  // TÂCHE-019 — Filtres + timeout
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ country: '', ageMin: 18, ageMax: 99 });
  const [searchTimedOut, setSearchTimedOut] = useState(false);

  // T7 — Filtre langues
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  // Refs
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const socketRef      = useRef(null);
  const peerRef        = useRef(null);
  const localStreamRef = useRef(null);

  // ── Accès caméra au montage ──────────────────────────────────
  useEffect(() => {
    let stream = null;

    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        // Attacher immédiatement si le ref est déjà monté
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('[LiveSurprise] Accès caméra refusé:', err);
        setCameraError(true);
      }
    };

    initCamera();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // T7 — Initialiser les langues sélectionnées : langue du site + langues du profil
  useEffect(() => {
    const siteLang = (i18n.language || 'fr').split('-')[0].toUpperCase();
    const profileLangs = (user?.languages || []).map(l => l.toUpperCase());
    const union = [...new Set([siteLang, ...profileLangs])].filter(l => LANGUAGES.includes(l));
    setSelectedLanguages(union.length > 0 ? union : ['FR']);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Attacher le stream local après chaque changement d'écran ──
  // Délai de 50ms pour laisser le DOM se monter après le changement d'état
  useEffect(() => {
    const attach = setTimeout(() => {
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }, 50);
    return () => clearTimeout(attach);
  }, [screen]);

  // ── Connexion Socket.IO ──────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      if (user?._id) {
        socket.emit('register', user._id);
      }
    });

    // Partenaire trouvé → créer le peer WebRTC
    socket.on('partner-found', ({ partner: partnerInfo, initiator, timerDuration }) => {
      setPartner(partnerInfo);
      setScreen('videocall');
      startTimer((timerDuration || 3) * 60);

      const peer = new Peer({
        initiator,
        config: PEER_CONFIG,
        stream: localStreamRef.current || undefined
      });

      peer.on('signal', (signal) => {
        socket.emit('send-signal', { to: partnerInfo.socketId, signal });
      });

      peer.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on('error', (err) => {
        console.error('[LiveSurprise] Peer error:', err);
      });

      peerRef.current = peer;
    });

    // Relayer le signal WebRTC entrant vers le peer
    socket.on('receive-signal', ({ signal }) => {
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    });

    // TÂCHE-011 — Compteur de participants en temps réel
    socket.on('surprise-user-count', ({ count }) => {
      setOnlineCount(count || 0);
    });

    // Partenaire a skip → retour en recherche
    socket.on('partner-skipped', () => {
      cleanupPeer();
      setPartner(null);
      setScreen('searching');
      stopTimer();
      // Reprendre la recherche automatiquement
      if (user?._id) {
        socket.emit('start-search', { userId: user._id, timerDuration: 3 });
      }
    });

    // Partenaire déconnecté → retour en recherche
    socket.on('partner-disconnected', () => {
      cleanupPeer();
      setPartner(null);
      setScreen('searching');
      stopTimer();
      if (user?._id) {
        socket.emit('start-search', { userId: user._id, timerDuration: 3 });
      }
    });

    // TÂCHE-019 — Timeout de recherche (aucun partenaire avec les filtres actuels)
    socket.on('surprise-search-timeout', () => {
      setSearchTimedOut(true);
    });

    return () => {
      if (user?._id) {
        socket.emit('leave-surprise-queue', { userId: user._id });
      }
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Helpers ──────────────────────────────────────────────────
  const cleanupPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  const startTimer = useCallback((seconds = 180) => {
    setTimer(seconds);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setScreen('decision');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // ── Actions utilisateur ──────────────────────────────────────
  const handleStart = useCallback((overrideFilters) => {
    if (!user?._id) return;
    setScreen('searching');
    setSearchTimedOut(false);
    const socket = socketRef.current;
    if (!socket) return;
    // Filtres actifs (vider les valeurs par défaut)
    const activeFilters = overrideFilters || {
      country: filters.country.trim() || undefined,
      ageMin: filters.ageMin !== 18 ? filters.ageMin : undefined,
      ageMax: filters.ageMax !== 99 ? filters.ageMax : undefined,
      languages: selectedLanguages.length > 0 ? selectedLanguages : undefined
    };
    socket.emit('join-surprise-queue', { userId: user._id, filters: activeFilters });
    socket.emit('start-search', { userId: user._id, timerDuration: 3, filters: activeFilters });
  }, [user, filters, selectedLanguages]);

  // TÂCHE-019 — Élargir la recherche mondiale
  const handleExpandSearch = useCallback(() => {
    setSearchTimedOut(false);
    const socket = socketRef.current;
    if (!socket || !user?._id) return;
    socket.emit('join-surprise-queue', { userId: user._id, filters: {} });
    socket.emit('start-search', { userId: user._id, timerDuration: 3, filters: {} });
  }, [user]);

  const handleSkip = useCallback(() => {
    stopTimer();
    cleanupPeer();
    setPartner(null);
    setScreen('searching');
    if (socketRef.current && user?._id) {
      socketRef.current.emit('surprise-skip', { userId: user._id });
    }
  }, [stopTimer, cleanupPeer, user]);

  const handleDecision = useCallback((decision) => {
    stopTimer();
    if (socketRef.current && user?._id && partner) {
      socketRef.current.emit('send-decision', {
        myUserId:      user._id,
        partnerUserId: partner.userId,
        decision
      });
    }
    cleanupPeer();
    setPartner(null);
    setScreen('searching');
    // Reprendre la recherche automatiquement
    if (socketRef.current && user?._id) {
      socketRef.current.emit('start-search', { userId: user._id, timerDuration: 3 });
    }
  }, [stopTimer, cleanupPeer, user, partner]);

  // TÂCHE-010 — Envoi d'une demande de message au partenaire
  const handleSendMessage = useCallback(async () => {
    if (!msgText.trim() || !partner?.userId) return;
    setSendingMsg(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/message-requests/send/${partner.userId}`,
        { message: msgText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsgSent(true);
      setMsgText('');
      setTimeout(() => {
        setShowMsgPanel(false);
        setMsgSent(false);
      }, 2000);
    } catch (err) {
      console.error('[LiveSurprise] Erreur envoi message:', err);
    } finally {
      setSendingMsg(false);
    }
  }, [msgText, partner]);

  const toggleUiVisibility = useCallback(() => {
    if (screen === 'videocall') setIsUiVisible(prev => !prev);
  }, [screen]);

  const toggleMic = useCallback((e) => {
    e.stopPropagation();
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = isMuted; // isMuted = current state → toggle
    }
    setIsMuted(prev => !prev);
  }, [isMuted]);

  const toggleCam = useCallback((e) => {
    e.stopPropagation();
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = isCamOff;
    }
    setIsCamOff(prev => !prev);
  }, [isCamOff]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const uiAnimation = {
    initial:    { opacity: 0 },
    animate:    { opacity: 1 },
    exit:       { opacity: 0 },
    transition: { duration: 0.3 }
  };

  // ── Rendus ───────────────────────────────────────────────────
  const renderStartScreen = () => (
    <div className="lspr-start-screen">
      {/* TÂCHE-011 — Badge participants en ligne */}
      {onlineCount > 0 && (
        <div className="lspr-online-badge">
          🔴 {onlineCount} {t('liveSurprise.online') || 'en ligne'}
        </div>
      )}
      <div className="lspr-start-screen-content">
        <div className="lspr-start-icon-wrapper">
          <FiVideo size={40} />
        </div>
        <h2>{t('liveSurprise.title') || 'Live Surprise'}</h2>
        <p>{t('liveSurprise.description') || 'Rencontrez des inconnus aléatoirement.'}</p>
        {cameraError && (
          <p className="lspr-camera-error">
            ⚠️ {t('liveSurprise.cameraError') || 'Caméra inaccessible — vérifie les permissions'}
          </p>
        )}
        <button className="lspr-start-btn" onClick={() => handleStart()}>
          <FiPlay />
          <span>{t('liveSurprise.startBtn') || 'Démarrer'}</span>
        </button>

        {/* TÂCHE-019 — Bouton filtres */}
        <button
          className={`lspr-filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(prev => !prev)}
        >
          <FiSliders size={16} />
          {t('liveSurprise.filters') || 'Filtres'}
        </button>

        {/* Panel de filtres */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="lspr-filter-panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="lspr-filter-row">
                <label>{t('liveSurprise.filterCountry') || 'Pays'}</label>
                <input
                  type="text"
                  className="lspr-filter-input"
                  placeholder={t('liveSurprise.filterCountryPlaceholder') || 'ex: France'}
                  value={filters.country}
                  onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                />
              </div>
              <div className="lspr-filter-row">
                <label>{t('liveSurprise.filterAge') || 'Âge'}</label>
                <div className="lspr-filter-age-row">
                  <input
                    type="number"
                    className="lspr-filter-age"
                    min={18} max={99}
                    value={filters.ageMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, ageMin: Number(e.target.value) }))}
                  />
                  <span>—</span>
                  <input
                    type="number"
                    className="lspr-filter-age"
                    min={18} max={99}
                    value={filters.ageMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, ageMax: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* T7 — Filtre langues */}
              <div className="lspr-filter-row">
                <label>{t('liveSurprise.filterLanguages') || 'Langues'}</label>
                <div className="lspr-lang-checkboxes">
                  {LANGUAGES.map(lang => (
                    <label key={lang} className={`lspr-lang-chip ${selectedLanguages.includes(lang) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang)}
                        onChange={() => {
                          setSelectedLanguages(prev => {
                            if (prev.includes(lang)) {
                              // Empêcher de décocher la dernière langue
                              if (prev.length <= 1) return prev;
                              return prev.filter(l => l !== lang);
                            }
                            return [...prev, lang];
                          });
                        }}
                      />
                      {lang}
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <span className="lspr-start-timer-hint">
          {t('liveSurprise.timerHint') || '3 min par appel'}
        </span>
      </div>
    </div>
  );

  const renderSearchingScreen = () => (
    <div className="lspr-searching-screen">
      {/* TÂCHE-011 — Badge participants en ligne */}
      {onlineCount > 0 && (
        <div className="lspr-online-badge">
          🔴 {onlineCount} {t('liveSurprise.online') || 'en ligne'}
        </div>
      )}
      <div className="lspr-searching-animation">
        <FiRefreshCw size={48} />
      </div>
      <p>{t('liveSurprise.searching') || 'Recherche en cours...'}</p>

      {/* TÂCHE-019 — Timeout : bouton Élargir */}
      <AnimatePresence>
        {searchTimedOut && (
          <motion.div
            className="lspr-timeout-banner"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="lspr-timeout-msg">
              {t('liveSurprise.timeoutMsg') || 'Aucun profil compatible trouvé dans votre pays.'}
            </p>
            <button className="lspr-expand-btn" onClick={handleExpandSearch}>
              <FiGlobe size={18} />
              {t('liveSurprise.expandSearch') || 'Élargir la recherche mondiale'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prévisualisation locale pendant la recherche */}
      <div className="lspr-streamer-video-container searching-pip">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="lspr-streamer-video"
        />
      </div>
    </div>
  );

  const renderVideoCallScreen = () => (
    <div className="lspr-videocall-layout" onClick={toggleUiVisibility}>
      {/* Vidéo distante (partenaire) — plein écran */}
      <div className="lspr-participant-video-container">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="lspr-participant-video"
        />
      </div>

      {/* Vidéo locale (moi) — miniature PiP en haut à droite */}
      <div className="lspr-streamer-video-container">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="lspr-streamer-video"
        />
      </div>

      {/* UI Overlay (timer + contrôles) */}
      <AnimatePresence>
        {isUiVisible && (
          <motion.div className="lspr-ui-overlay" {...uiAnimation}>
            <div className="lspr-top-bar">
              <div className="lspr-timer">{formatTime(timer)}</div>
              {partner?.displayName && (
                <div className="lspr-partner-name">{partner.displayName}</div>
              )}
            </div>
            <div className="lspr-bottom-bar">
              <button
                className={`lspr-control-btn ${isMuted ? 'off' : ''}`}
                onClick={toggleMic}
              >
                {isMuted ? <FiMicOff size={22} /> : <FiMic size={22} />}
              </button>
              <button
                className={`lspr-control-btn ${isCamOff ? 'off' : ''}`}
                onClick={toggleCam}
              >
                {isCamOff ? <FiVideoOff size={22} /> : <FiVideo size={22} />}
              </button>
              {/* TÂCHE-010 — Bouton Message */}
              <button
                className="lspr-control-btn message"
                onClick={(e) => { e.stopPropagation(); setShowMsgPanel(true); }}
                title={t('liveSurprise.sendMessage') || 'Envoyer un message'}
              >
                <FiMessageCircle size={22} />
              </button>
              <button
                className="lspr-control-btn skip"
                onClick={(e) => { e.stopPropagation(); handleSkip(); }}
              >
                <FiX size={22} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Décision (like / dislike) — affiché quand le timer atteint 0 */}
      <AnimatePresence>
        {screen === 'decision' && (
          <div className="lspr-decision-overlay">
            <motion.div
              className="lspr-decision-panel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h3>{t('liveSurprise.sessionEnded') || 'Session terminée'}</h3>
              <p>{t('liveSurprise.doYouLike') || 'Ce profil vous a plu ?'}</p>
              <div className="lspr-decision-actions">
                <button className="decision-btn dislike" onClick={() => handleDecision('dislike')}>
                  <FiThumbsDown size={28} />
                </button>
                <button className="decision-btn like" onClick={() => handleDecision('like')}>
                  <FiHeart size={28} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TÂCHE-010 — Panel d'envoi de message privé */}
      <AnimatePresence>
        {showMsgPanel && (
          <motion.div
            className="lspr-msg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); setShowMsgPanel(false); setMsgSent(false); }}
          >
            <motion.div
              className="lspr-msg-panel"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lspr-msg-header">
                <span>
                  {t('liveSurprise.messageTo') || 'Message à'}{' '}
                  <strong>{partner?.displayName || '...'}</strong>
                </span>
                <button
                  className="lspr-msg-close"
                  onClick={() => { setShowMsgPanel(false); setMsgSent(false); }}
                >
                  <FiX size={18} />
                </button>
              </div>
              {msgSent ? (
                <p className="lspr-msg-sent-confirm">
                  ✅ {t('liveSurprise.messageSent') || 'Message envoyé !'}
                </p>
              ) : (
                <>
                  <textarea
                    className="lspr-msg-textarea"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder={t('liveSurprise.messagePlaceholder') || 'Écris ton message...'}
                    rows={3}
                    maxLength={300}
                  />
                  <div className="lspr-msg-footer">
                    <span className="lspr-msg-count">{msgText.length}/300</span>
                    <button
                      className="lspr-msg-send-btn"
                      onClick={handleSendMessage}
                      disabled={sendingMsg || !msgText.trim()}
                    >
                      <FiSend size={16} />
                      {sendingMsg
                        ? (t('liveSurprise.sending') || 'Envoi...')
                        : (t('liveSurprise.send') || 'Envoyer')}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Rendu principal ──────────────────────────────────────────
  return (
    <div className="lspr-container">
      {/* Header fixe — visible sur start et searching uniquement */}
      {(screen === 'start' || screen === 'searching') && (
        <div className="lspr-header">
          <button className="btn btn-ghost lspr-back-btn" onClick={() => navigate('/stream')}>
            <FiArrowLeft size={20} />
          </button>
          <span className="lspr-header-title">GloboStream</span>
          <Navigation />
        </div>
      )}
      {screen === 'start'     && renderStartScreen()}
      {screen === 'searching' && renderSearchingScreen()}
      {(screen === 'videocall' || screen === 'decision') && renderVideoCallScreen()}
    </div>
  );
};

export default LiveSurprise;
