import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiGift,
  FiX, FiEye, FiSend
} from 'react-icons/fi';
import './LiveStream.css';

/**
 * Composant LiveStream réutilisable
 * Interface de live streaming avec grille vidéo dynamique (1-9 participants),
 * zone de chat et barre de contrôles.
 *
 * Props :
 * - mode : 'public' | 'competition' | 'event' — détermine le style/contexte
 * - onQuit : callback pour quitter le live
 * - streamerName : nom du streamer (défaut: 'Streamer')
 */
const LiveStream = ({ mode = 'public', onQuit, streamerName = 'Streamer' }) => {
  const { t } = useTranslation();

  // États
  const [participants] = useState([]); // eslint-disable-line no-unused-vars
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [giftCount, setGiftCount] = useState(0);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [activeStatsTab, setActiveStatsTab] = useState('viewers');

  // Refs
  const chatRef = useRef(null);
  const localVideoRef = useRef(null);

  // Données démo spectateurs/cadeaux
  const [mockViewers] = useState([
    { name: 'Alexandre_Gaming', joinedAt: '2 min' },
    { name: 'MarieStreamer92', joinedAt: '5 min' },
    { name: 'ProGamer_XxX', joinedAt: '8 min' },
    { name: 'JulienDuWeb', joinedAt: '12 min' },
    { name: 'SophieLive', joinedAt: '15 min' },
    { name: 'MaximeYT', joinedAt: '18 min' },
    { name: 'ClaraStreams', joinedAt: '22 min' },
  ]);

  const [mockGifts] = useState([
    { name: 'Alexandre_Gaming', gifts: 120 },
    { name: 'MarieStreamer92', gifts: 85 },
    { name: 'ProGamer_XxX', gifts: 72 },
    { name: 'JulienDuWeb', gifts: 60 },
    { name: 'SophieLive', gifts: 45 },
  ]);

  // Initialisation
  useEffect(() => {
    setViewerCount(127);
    setGiftCount(450);

    // Message de bienvenue
    setMessages([{
      id: 'welcome',
      username: 'System',
      text: t('liveStream.welcomeMessage'),
      isSystem: true
    }]);
  }, [t]);

  // Simulation de messages chat
  useEffect(() => {
    const demoMessages = [
      { text: 'Super live !', lang: 'FR' },
      { text: 'This stream is amazing!', lang: 'EN' },
      { text: '¡Qué buena transmisión!', lang: 'ES' },
      { text: 'Che bella diretta!', lang: 'IT' },
      { text: 'Toller Stream!', lang: 'DE' },
    ];
    const usernames = [
      'Alexandre_Gaming', 'MarieStreamer92', 'ProGamer_XxX',
      'JulienDuWeb', 'SophieLive', 'MaximeYT', 'Carlos_ES'
    ];

    const interval = setInterval(() => {
      const msg = demoMessages[Math.floor(Math.random() * demoMessages.length)];
      const username = usernames[Math.floor(Math.random() * usernames.length)];

      setMessages(prev => [...prev.slice(-50), {
        id: `msg-${Date.now()}-${Math.random()}`,
        username,
        text: msg.text,
        lang: msg.lang
      }]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  // Nombre de participants (streamer inclus)
  const totalCards = 1 + participants.length;
  const layoutClass = `layout-${Math.min(totalCards, 9)}`;

  // Formater le nombre de viewers
  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  // Construction des cartes participants pour layouts 4-9
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

    // Layouts 4-9 : 2 cartes à droite + rangées en bas
    const rightCards = participants.slice(0, 2);
    const bottomCards = participants.slice(2);

    // Découper les bottom cards en rangées de 3
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
            {/* Slots vides pour compléter la rangée */}
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
      {/* ── Grille vidéo (50% de l'écran) ── */}
      <div className={`ls-video-grid ${layoutClass}`}>
        {/* Carte streamer */}
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
              <FiVideo size={48} />
            </div>
          )}

          {/* Badge stats HUD */}
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

          {/* Indicateur micro coupé */}
          {isMuted && (
            <div className="ls-mic-muted">
              <FiMicOff size={13} />
            </div>
          )}
        </div>

        {/* Cartes participants */}
        {renderParticipantCards()}
      </div>

      {/* ── Overlay stats ── */}
      {showStatsPanel && (
        <div className="ls-stats-overlay" onClick={() => setShowStatsPanel(false)} />
      )}

      {/* ── Panel stats ── */}
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
              {mockViewers.map((v, i) => (
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
              {mockGifts.sort((a, b) => b.gifts - a.gifts).map((g, i) => (
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

      {/* ── Zone de chat ── */}
      <div className="ls-chat-section" ref={chatRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`ls-chat-message ${msg.isSystem ? 'system' : ''} ${msg.isOwn ? 'own' : ''}`}>
            <span className="ls-chat-username">{msg.username} :</span>
            <span className="ls-chat-text">{msg.text}</span>
            {msg.lang && <span className="ls-lang-badge">{msg.lang}</span>}
          </div>
        ))}
      </div>

      {/* ── Barre de contrôles + input chat ── */}
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
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
        </button>

        <button
          className={`ls-control-btn ${isCamOff ? 'muted' : ''}`}
          onClick={() => setIsCamOff(!isCamOff)}
        >
          {isCamOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
        </button>

        <button className="ls-control-btn gift-btn">
          <FiGift size={18} />
        </button>

        <button
          className="ls-control-btn quit-btn"
          onClick={onQuit}
        >
          <FiX size={18} />
        </button>
      </div>
    </div>
  );
};

export default LiveStream;
