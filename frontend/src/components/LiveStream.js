import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiGift,
  FiX, FiEye, FiSend, FiPlay, FiArrowLeft
} from 'react-icons/fi';
import './LiveStream.css';

/**
 * Composant LiveStream réutilisable
 * Flow : montage → getUserMedia (permission) → preview → "Go Live" → interface live
 *
 * Props :
 * - mode : 'public' | 'competition' | 'event' — détermine le style/contexte
 * - onQuit : callback pour quitter le live
 * - streamerName : nom du streamer (défaut: 'Streamer')
 */
const LiveStream = ({ mode = 'public', onQuit, streamerName = 'Streamer', user }) => {
  const { t } = useTranslation();

  // États flow
  const [isLive, setIsLive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // États live
  const [participants] = useState([]); // eslint-disable-line no-unused-vars
  const [localStream, setLocalStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [viewerCount] = useState(0);
  const [giftCount] = useState(0);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [activeStatsTab, setActiveStatsTab] = useState('viewers');
  const [viewers] = useState([]);
  const [gifts] = useState([]);

  // Refs
  const chatRef = useRef(null);
  const localVideoRef = useRef(null);
  const previewVideoRef = useRef(null);

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
        setPermissionGranted(true);
        // Attacher à la preview vidéo
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

  // Quand isLive passe à true, rattacher le stream à la vidéo principale
  useEffect(() => {
    if (isLive && localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [isLive, localStream]);

  // Sécurité : stopper les tracks et arrêter le live au démontage
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      // Arrêter le live côté backend si le composant est démonté
      axios.post('/api/live/stop').catch(() => {});
    };
  }, [localStream]);

  // Message de bienvenue (seulement quand live démarre)
  useEffect(() => {
    if (isLive) {
      setMessages([{
        id: 'welcome',
        username: 'System',
        text: t('liveStream.welcomeMessage'),
        isSystem: true
      }]);
    }
  }, [isLive, t]);

  // Auto-scroll du chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Envoi message chat
  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim()) return;

    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      username: streamerName,
      text: chatInput,
      isOwn: true
    }]);
    setChatInput('');
  }, [chatInput, streamerName]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Toggle micro
  const toggleMic = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = isMuted;
    }
    setIsMuted(prev => !prev);
  }, [localStream, isMuted]);

  // Toggle caméra
  const toggleCam = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = isCamOff;
    }
    setIsCamOff(prev => !prev);
  }, [localStream, isCamOff]);

  // Démarrer le live (appel API backend)
  const handleGoLive = useCallback(async () => {
    try {
      await axios.post('/api/live/start', {
        title: `Live de ${streamerName}`,
        tags: ['Rencontres', 'Discussion']
      });
      setIsLive(true);
    } catch (error) {
      console.error('Error starting live:', error);
      toast.error('Erreur lors du démarrage du live');
    }
  }, [streamerName]);

  // Quitter le live (appel API backend)
  const handleQuit = useCallback(async () => {
    try {
      await axios.post('/api/live/stop');
    } catch (error) {
      console.error('Error stopping live:', error);
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    onQuit();
  }, [localStream, onQuit]);

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
              <p>Ajoutez au moins une photo pour lancer un live</p>
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
    if (totalCards <= 3) {
      return participants.map((p, i) => (
        <div key={p.id || i} className="ls-video-card user">
          <div className="ls-video-placeholder">
            <FiVideo size={32} />
          </div>
          <div className="ls-video-label">{p.name || `User ${i + 1}`}</div>
        </div>
      ));
    }

    const rightCards = participants.slice(0, 2);
    const bottomCards = participants.slice(2);
    const rows = [];
    for (let i = 0; i < bottomCards.length; i += 3) {
      rows.push(bottomCards.slice(i, i + 3));
    }

    return (
      <>
        {rightCards.map((p, i) => (
          <div key={p.id || i} className="ls-video-card user">
            <div className="ls-video-placeholder">
              <FiVideo size={32} />
            </div>
            <div className="ls-video-label">{p.name || `User ${i + 1}`}</div>
          </div>
        ))}
        {rows.map((row, rowIdx) => (
          <div key={`row-${rowIdx}`} className={rowIdx === 0 ? 'ls-participants-bottom' : 'ls-participants-row2'}>
            {row.map((p, i) => (
              <div key={p.id || `${rowIdx}-${i}`} className="ls-video-card user">
                <div className="ls-video-placeholder">
                  <FiVideo size={24} />
                </div>
                <div className="ls-video-label">{p.name || `User ${rowIdx * 3 + i + 3}`}</div>
              </div>
            ))}
            {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
              <div key={`empty-${rowIdx}-${i}`} className="ls-video-card empty">
                <div className="ls-empty-slot"><FiX size={24} /></div>
              </div>
            ))}
          </div>
        ))}
      </>
    );
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

      <div className="ls-chat-section" ref={chatRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`ls-chat-message ${msg.isSystem ? 'system' : ''} ${msg.isOwn ? 'own' : ''}`}>
            <span className="ls-chat-username">{msg.username} :</span>
            <span className="ls-chat-text">{msg.text}</span>
            {msg.lang && <span className="ls-lang-badge">{msg.lang}</span>}
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
