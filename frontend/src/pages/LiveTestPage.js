import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiUsers, FiGift,
  FiEye, FiX, FiPlus, FiMinus, FiSend, FiUserPlus,
  FiGlobe, FiAlertCircle, FiArrowLeft
} from 'react-icons/fi';
import '../components/LiveStream.css';
import '../components/LiveViewer.css';
import './LiveTestPage.css';

/* ── Données de simulation ──────────────────────────────────── */
const FAKE_PARTICIPANTS = [
  { id: 'p1', name: 'Alice',   color: '#e4405f', initials: 'A' },
  { id: 'p2', name: 'Bob',     color: '#6366f1', initials: 'B' },
  { id: 'p3', name: 'Charlie', color: '#22c55e', initials: 'C' },
  { id: 'p4', name: 'Diana',   color: '#f59e0b', initials: 'D' },
  { id: 'p5', name: 'Evan',    color: '#ef4444', initials: 'E' },
  { id: 'p6', name: 'Fiona',   color: '#8b5cf6', initials: 'F' },
  { id: 'p7', name: 'George',  color: '#06b6d4', initials: 'G' },
  { id: 'p8', name: 'Hannah',  color: '#ec4899', initials: 'H' },
];

const FAKE_MESSAGES_POOL = [
  { user: 'Alice',   color: '#e4405f', text: 'Super stream ! 🔥', country: '🇫🇷' },
  { user: 'Bob',     color: '#6366f1', text: 'Bonjour tout le monde !', country: '🇬🇧' },
  { user: 'Charlie', color: '#22c55e', text: 'Quand est-ce qu\'on commence ?', country: '🇪🇸' },
  { user: 'Diana',   color: '#f59e0b', text: 'J\'adore cette ambiance 💜', country: '🇺🇸' },
  { user: 'Evan',    color: '#ef4444', text: 'Première fois ici, c\'est top !', country: '🇩🇪' },
  { user: 'Fiona',   color: '#8b5cf6', text: 'Quelqu\'un peut me rejoindre ?', country: '🇧🇷' },
  { user: 'Alice',   color: '#e4405f', text: 'Les layouts sont trop bien 👌', country: '🇫🇷' },
  { user: 'Bob',     color: '#6366f1', text: 'On est combien en direct ?', country: '🇬🇧' },
  { user: 'George',  color: '#06b6d4', text: 'Test de message long pour voir le retour à la ligne automatique dans le chat', country: '🇯🇵' },
  { user: 'Hannah',  color: '#ec4899', text: 'Hellooo ! 👋', country: '🇰🇷' },
];

/* ── Composant canvas animé (faux flux vidéo) ───────────────── */
const FakeVideoCanvas = ({ color, initials, style = {} }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let raf;

    const draw = () => {
      // Fond coloré
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 320, 240);

      // Dégradé subtil
      const grad = ctx.createRadialGradient(160, 120, 0, 160, 120, 160);
      grad.addColorStop(0, 'rgba(255,255,255,0.08)');
      grad.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 320, 240);

      // Cercle pulsant
      const r = 28 + Math.sin(frame * 0.04) * 7;
      ctx.beginPath();
      ctx.arc(160, 110, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();

      // Initiale
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = 'bold 52px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, 160, 108);

      // Barre audio simulée en bas
      for (let i = 0; i < 12; i++) {
        const h = 4 + Math.abs(Math.sin((frame * 0.1) + i * 0.5)) * 10;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(110 + i * 9, 200 - h, 6, h);
      }

      frame++;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [color, initials]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={240}
      className="ltp-fake-canvas"
      style={style}
    />
  );
};

/* ── Composant principal ─────────────────────────────────────── */
const LiveTestPage = () => {
  const navigate = useNavigate();

  // ── État Streamer ──────────────────────────────────────────
  const [activeParticipants, setActiveParticipants] = useState([]);
  const [streamerCamOff, setStreamerCamOff] = useState(false);
  const [streamerMuted, setStreamerMuted] = useState(false);
  const [messages, setMessages] = useState([
    { id: 'm0', user: 'Alice', color: '#e4405f', text: 'Salut ! C\'est quoi ce test ? 😄', isOwn: false, country: '🇫🇷' },
    { id: 'm1', user: 'Bob',   color: '#6366f1', text: 'Bonjour tout le monde 👋', isOwn: false, country: '🇬🇧' },
  ]);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [viewerCount] = useState(42);
  const [activeStatsTab, setActiveStatsTab] = useState('viewers');
  const chatRef = useRef(null);

  // ── État Viewer Modal ──────────────────────────────────────
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [viewerIsParticipant, setViewerIsParticipant] = useState(false);
  const [viewerCamOff, setViewerCamOff] = useState(false);
  const [viewerMuted, setViewerMuted] = useState(false);
  const [viewerMessages, setViewerMessages] = useState([
    { id: 'v0', user: 'Streamer Test', color: '#e4405f', text: 'Bienvenue tout le monde !', isSystem: false, country: '🇫🇷' },
    { id: 'v1', user: 'Alice', color: '#e4405f', text: 'Super live ! 🔥', isSystem: false, country: '🇬🇧' },
  ]);
  const viewerChatRef = useRef(null);

  // ── Computed ───────────────────────────────────────────────
  const totalCards = 1 + activeParticipants.length;
  const layoutClass = `layout-${Math.min(totalCards, 8)}`;
  const hasDedicatedChat = activeParticipants.length >= 2;

  // ── Scroll chat vers le bas ────────────────────────────────
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (viewerChatRef.current) {
      viewerChatRef.current.scrollTop = viewerChatRef.current.scrollHeight;
    }
  }, [viewerMessages]);

  // ── Fermer panneaux quand on clique ailleurs ───────────────
  useEffect(() => {
    if (showStatsPanel || showRequestsPanel) {
      const close = (e) => {
        if (!e.target.closest('.ls-stats-panel') && !e.target.closest('.ls-requests-panel') &&
            !e.target.closest('.ls-viewer-count') && !e.target.closest('.ls-gift-count') &&
            !e.target.closest('.requests-btn')) {
          setShowStatsPanel(false);
          setShowRequestsPanel(false);
        }
      };
      document.addEventListener('mousedown', close);
      return () => document.removeEventListener('mousedown', close);
    }
  }, [showStatsPanel, showRequestsPanel]);

  // ── Actions ────────────────────────────────────────────────
  const addParticipant = useCallback(() => {
    if (activeParticipants.length >= 8) return;
    const next = FAKE_PARTICIPANTS[activeParticipants.length];
    setActiveParticipants(prev => [...prev, next]);
    setMessages(prev => [
      ...prev,
      { id: `join-${Date.now()}`, user: next.name, color: next.color,
        text: `${next.name} a rejoint le live 🎉`, isSystem: true, isJoin: true }
    ]);
  }, [activeParticipants]);

  const removeParticipant = useCallback(() => {
    if (activeParticipants.length === 0) return;
    const removed = activeParticipants[activeParticipants.length - 1];
    setActiveParticipants(prev => prev.slice(0, -1));
    setMessages(prev => [
      ...prev,
      { id: `left-${Date.now()}`, user: removed.name, color: removed.color,
        text: `${removed.name} a quitté le live`, isSystem: true, isJoin: false }
    ]);
  }, [activeParticipants]);

  const jumpToLayout = useCallback((n) => {
    const target = n - 1; // n participants = layout-n
    const current = activeParticipants.length;
    if (target > current) {
      // Ajouter des participants
      const toAdd = FAKE_PARTICIPANTS.slice(current, target);
      setActiveParticipants(FAKE_PARTICIPANTS.slice(0, target));
      toAdd.forEach(p => {
        setMessages(prev => [...prev, {
          id: `join-${p.id}-${Date.now()}`, user: p.name, color: p.color,
          text: `${p.name} a rejoint le live 🎉`, isSystem: true, isJoin: true
        }]);
      });
    } else {
      setActiveParticipants(FAKE_PARTICIPANTS.slice(0, target));
    }
  }, [activeParticipants]);

  const sendFakeMessage = useCallback(() => {
    const text = chatInput.trim();
    if (!text) {
      // Message aléatoire depuis le pool
      const pool = FAKE_MESSAGES_POOL;
      const msg = pool[Math.floor(Math.random() * pool.length)];
      setMessages(prev => [
        ...prev,
        { id: `msg-${Date.now()}`, user: msg.user, color: msg.color, text: msg.text, isSystem: false, country: msg.country }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        { id: `msg-${Date.now()}`, user: 'Streamer Test', color: '#e4405f', text, isSystem: false, isOwn: true, country: '🇫🇷' }
      ]);
      setChatInput('');
    }
  }, [chatInput]);

  const sendViewerMessage = useCallback(() => {
    const pool = FAKE_MESSAGES_POOL;
    const msg = pool[Math.floor(Math.random() * pool.length)];
    setViewerMessages(prev => [
      ...prev,
      { id: `vm-${Date.now()}`, user: msg.user, color: msg.color, text: msg.text, isSystem: false }
    ]);
  }, []);

  // ── Render participants pour la grille ─────────────────────
  const renderParticipantCards = (slice) =>
    slice.map(p => (
      <div key={p.id} className="ls-video-card user">
        <div className="ls-video-placeholder" style={{ padding: 0 }}>
          <FakeVideoCanvas color={p.color} initials={p.initials} />
        </div>
        <div className="ls-video-label">{p.name}</div>
        <div className="ls-participant-controls">
          <button className="ls-participant-ctrl-btn mic-btn" title={`Micro ${p.name}`}>
            <FiMic size={12} />
          </button>
          <button className="ls-participant-ctrl-btn hide-btn" title={`Masquer ${p.name}`}
            onClick={() => removeParticipant()}>
            <FiX size={12} />
          </button>
        </div>
      </div>
    ));

  // ── Rendu du panneau stats ─────────────────────────────────
  const fakeViewers = FAKE_PARTICIPANTS.slice(0, 7).concat(
    [{ id: 'v9', name: 'Viewer42', color: '#888', initials: 'V' }]
  );

  return (
    <div className="ltp-root">

      {/* ── Barre de contrôle header ──────────────────────── */}
      <div className="ltp-header">
        <button className="ltp-btn" onClick={() => navigate(-1)} title="Retour">
          <FiArrowLeft size={14} />
        </button>
        <span className="ltp-header-title">🧪 Live Test</span>
        <span className="ltp-layout-badge">
          {layoutClass} · {activeParticipants.length}/7 invités
          {hasDedicatedChat ? ' · chat dédié' : ' · chat overlay'}
        </span>

        <div className="ltp-header-actions">
          <button className="ltp-btn primary" onClick={addParticipant}
            disabled={activeParticipants.length >= 8}
            title="Ajouter un participant (simule l'acceptation d'une demande)">
            <FiPlus size={13} /> Participant
          </button>
          <button className="ltp-btn danger" onClick={removeParticipant}
            disabled={activeParticipants.length === 0}
            title="Retirer le dernier participant">
            <FiMinus size={13} /> Retirer
          </button>
          <button className="ltp-btn success" onClick={() => setShowViewerModal(true)}
            title="Ouvrir la vue Spectateur">
            <FiEye size={13} /> Viewer
          </button>
        </div>
      </div>

      {/* ── Corps ──────────────────────────────────────────── */}
      <div className="ltp-body">

        {/* ── Panneau Streamer ──────────────────────────────── */}
        <div className="ltp-streamer-panel">
          <div className={`ls-container ls-mode-public${hasDedicatedChat ? ' has-chat' : ''}`} style={{ maxWidth: '480px', height: '100%' }}>

            {/* ── Header permanent — uniquement has-chat (3+ participants) ── */}
            {hasDedicatedChat && (
              <div className="ls-top-bar">
                <div className="ls-streamer-info">
                  <span className="ls-streamer-name">Streamer Test</span>
                  <div className="ls-stats-indicators">
                    <div className="ls-live-badge">LIVE</div>
                    <button className="ls-viewer-count"
                      onClick={() => { setShowStatsPanel(!showStatsPanel); setShowRequestsPanel(false); }}>
                      <FiEye size={11} /> {viewerCount}
                    </button>
                    <button className="ls-gift-count"
                      onClick={() => { setShowStatsPanel(!showStatsPanel); setActiveStatsTab('gifts'); setShowRequestsPanel(false); }}>
                      <FiGift size={11} /> 7
                    </button>
                  </div>
                </div>
                <button className="ls-top-quit" onClick={() => navigate(-1)} title="Quitter">
                  <FiX size={22} />
                </button>
              </div>
            )}

            {/* ── Zone vidéo ── */}
            <div className="ls-video-zone">

              {/* Grille vidéo (flat, CSS auto-placement) */}
              <div className={`ls-video-grid ${layoutClass}`}>

                {/* Carte streamer */}
                <div className="ls-video-card streamer">
                  <div className="ls-video-placeholder" style={{ padding: 0 }}>
                    {streamerCamOff ? (
                      <div className="ls-video-placeholder cam-off">
                        <div className="ls-cam-off-avatar">S</div>
                        <span className="ls-cam-off-name">Streamer Test</span>
                      </div>
                    ) : (
                      <FakeVideoCanvas color="#c0392b" initials="S" />
                    )}
                    <div className="ls-watermark">TEST-MODE</div>
                  </div>
                  {streamerMuted && (
                    <div className="ls-mic-muted">
                      <FiMicOff size={40} />
                    </div>
                  )}
                </div>

                {/* Tous les participants — flat, CSS positionne selon layout */}
                {renderParticipantCards(activeParticipants)}
              </div>

              {/* UI Overlay — uniquement pour layouts 1-2 (tap to hide) */}
              {!hasDedicatedChat && (
              <div className="ls-ui-overlay" onClick={(e) => e.stopPropagation()}>

                {/* Top bar */}
                <div className="ls-top-bar">
                  <div className="ls-streamer-info">
                    <span className="ls-streamer-name">Streamer Test</span>
                    <div className="ls-stats-indicators">
                      <div className="ls-live-badge">LIVE</div>
                      <button className="ls-viewer-count"
                        onClick={() => { setShowStatsPanel(!showStatsPanel); setShowRequestsPanel(false); }}>
                        <FiEye size={11} /> {viewerCount}
                      </button>
                      <button className="ls-gift-count"
                        onClick={() => { setShowStatsPanel(!showStatsPanel); setActiveStatsTab('gifts'); setShowRequestsPanel(false); }}>
                        <FiGift size={11} /> 7
                      </button>
                    </div>
                  </div>
                  <button className="ls-top-quit" onClick={() => navigate(-1)} title="Quitter">
                    <FiX size={18} />
                  </button>
                </div>

                {/* Chat overlay — uniquement layouts 1-2 (sans chat dédié) */}
                {!hasDedicatedChat && (
                  <div className="ls-chat-section" ref={chatRef}>
                    {messages.map(msg => (
                      msg.isJoin !== undefined ? (
                        <div key={msg.id} className="ls-chat-message is-join-event">
                          <div className="ls-chat-body">{msg.text}</div>
                        </div>
                      ) : (
                        <div key={msg.id} className={`ls-chat-message${msg.isOwn ? ' own' : ''}`}>
                          <div className="ls-chat-avatar">
                            <div className="ls-chat-avatar-initials"
                              style={{ background: `linear-gradient(135deg, ${msg.color}88, ${msg.color})` }}>
                              {msg.user[0]}
                            </div>
                          </div>
                          <div className="ls-chat-content">
                            <div className="ls-chat-body">
                              <span className="ls-chat-username"
                                style={{ color: msg.isOwn ? '#e4405f' : '#ff9500' }}>
                                {msg.user}
                              </span>
                              <span className="ls-chat-text">{msg.text}</span>
                              {msg.country && <span className="ls-country-badge">{msg.country}</span>}
                              <button className="ls-translate-btn" title="Traduire"><FiGlobe size={11} /></button>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}

              {/* Bottom bar */}
              <div className="ls-bottom-bar">
                <div className="ls-write-btn">
                  <input
                    placeholder="Écrivez"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendFakeMessage(); }}
                  />
                  <button className="lv-send-btn" onClick={sendFakeMessage} title="Envoyer">
                    <FiSend size={16} />
                  </button>
                </div>
                <div className="ls-controls-left">
                  <button className="ls-control-btn requests-btn"
                    onClick={() => { setShowRequestsPanel(!showRequestsPanel); setShowStatsPanel(false); }}
                    title="Demandes de participation">
                    <FiUsers size={18} />
                    {activeParticipants.length < 8 && (
                      <span className="ls-requests-count">1</span>
                    )}
                  </button>
                  <button className="ls-control-btn gift-btn" title="Cadeaux">
                    <FiGift size={18} />
                  </button>
                </div>
                <div className="ls-controls-right">
                  <button
                    className={`ls-control-btn${streamerMuted ? ' off' : ''}`}
                    onClick={() => setStreamerMuted(!streamerMuted)}
                    title="Micro">
                    {streamerMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
                  </button>
                  <button
                    className={`ls-control-btn${streamerCamOff ? ' off' : ''}`}
                    onClick={() => setStreamerCamOff(!streamerCamOff)}
                    title="Caméra">
                    {streamerCamOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
                  </button>
                </div>
              </div>
              </div>
              )}
            </div>{/* /ls-video-zone */}

            {/* Zone chat dédiée (3+ participants) */}
            {hasDedicatedChat && (
              <div className="ls-chat-zone">
                <div className="ls-chat-section" ref={chatRef}>
                  {messages.map(msg => (
                    msg.isJoin !== undefined ? (
                      <div key={msg.id} className="ls-chat-message is-join-event">
                        <div className="ls-chat-body">{msg.text}</div>
                      </div>
                    ) : (
                      <div key={msg.id} className={`ls-chat-message${msg.isOwn ? ' own' : ''}`}>
                        <div className="ls-chat-avatar">
                          <div className="ls-chat-avatar-initials"
                            style={{ background: `linear-gradient(135deg, ${msg.color}88, ${msg.color})` }}>
                            {msg.user[0]}
                          </div>
                        </div>
                        <div className="ls-chat-content">
                          <div className="ls-chat-body">
                            <span className="ls-chat-username"
                              style={{ color: msg.isOwn ? '#e4405f' : '#ff9500' }}>
                              {msg.user}
                            </span>
                            <span className="ls-chat-text">{msg.text}</span>
                            {msg.country && <span className="ls-country-badge">{msg.country}</span>}
                            <button className="ls-translate-btn" title="Traduire"><FiGlobe size={11} /></button>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Bottom bar permanent — uniquement has-chat (3+ participants) */}
            {hasDedicatedChat && (
              <div className="ls-bottom-bar">
                <div className="ls-write-btn">
                  <input
                    placeholder="Écrivez"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendFakeMessage(); }}
                  />
                  <button className="lv-send-btn" onClick={sendFakeMessage} title="Envoyer">
                    <FiSend size={16} />
                  </button>
                </div>
                <div className="ls-controls-left">
                  <button className="ls-control-btn requests-btn"
                    onClick={() => { setShowRequestsPanel(!showRequestsPanel); setShowStatsPanel(false); }}
                    title="Demandes de participation">
                    <FiUsers size={18} />
                    {activeParticipants.length < 8 && (
                      <span className="ls-requests-count">1</span>
                    )}
                  </button>
                  <button className="ls-control-btn gift-btn" title="Cadeaux">
                    <FiGift size={18} />
                  </button>
                </div>
                <div className="ls-controls-right">
                  <button
                    className={`ls-control-btn${streamerMuted ? ' off' : ''}`}
                    onClick={() => setStreamerMuted(!streamerMuted)}
                    title="Micro">
                    {streamerMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
                  </button>
                  <button
                    className={`ls-control-btn${streamerCamOff ? ' off' : ''}`}
                    onClick={() => setStreamerCamOff(!streamerCamOff)}
                    title="Caméra">
                    {streamerCamOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Stats Panel */}
            <div className={`ls-stats-panel${showStatsPanel ? ' visible' : ''}`}>
              <div className="ls-stats-header">
                <button
                  className={`ls-tab-btn${activeStatsTab === 'viewers' ? ' active' : ''}`}
                  onClick={() => setActiveStatsTab('viewers')}>
                  <FiEye size={13} /> Viewers ({viewerCount})
                </button>
                <button
                  className={`ls-tab-btn${activeStatsTab === 'gifts' ? ' active' : ''}`}
                  onClick={() => setActiveStatsTab('gifts')}>
                  <FiGift size={13} /> Cadeaux (7)
                </button>
                <button className="ls-stats-close" onClick={() => setShowStatsPanel(false)}>
                  <FiX size={14} />
                </button>
              </div>
              <div className="ls-tab-content">
                <div className="ls-stats-total">
                  <span className="ls-stats-total-label">
                    {activeStatsTab === 'viewers' ? 'Total spectateurs' : 'Total cadeaux'}
                  </span>
                  <span className="ls-stats-total-value">
                    {activeStatsTab === 'viewers' ? viewerCount : '7'}
                  </span>
                </div>
                <div className="ls-stats-list">
                  {activeStatsTab === 'viewers'
                    ? fakeViewers.map((v, i) => (
                        <div key={v.id} className="ls-stats-row">
                          <div className="ls-stats-row-left">
                            <div className={`ls-stats-avatar rank-${i < 3 ? i + 1 : ''}`}
                              style={i >= 3 ? { background: `linear-gradient(135deg, ${v.color}, ${v.color}88)` } : {}}>
                              {v.initials}
                            </div>
                            <div>
                              <div className="ls-stats-name">{v.name}</div>
                              <div className="ls-stats-badge">Rejoint il y a {i + 1}min</div>
                            </div>
                          </div>
                          <button className="ls-kick-btn" title="Expulser">
                            <FiX size={14} />
                          </button>
                        </div>
                      ))
                    : ['Rose 🌹', 'Feu 🔥', 'Couronne 👑', 'Diamant 💎', 'Coeur 💕', 'Étoile ⭐', 'Arc-en-ciel 🌈'].map((g, i) => (
                        <div key={i} className="ls-stats-row">
                          <div className="ls-stats-row-left">
                            <div className="ls-stats-avatar" style={{ fontSize: '18px', background: 'rgba(255,149,0,0.2)' }}>🎁</div>
                            <div>
                              <div className="ls-stats-name">{g}</div>
                              <div className="ls-stats-badge">De Alice · il y a {i + 1}min</div>
                            </div>
                          </div>
                          <span className="ls-stats-value">+{(i + 1) * 10}</span>
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>

            {/* Requests Panel */}
            <div className={`ls-requests-panel${showRequestsPanel ? ' visible' : ''}`}>
              <div className="ls-requests-header">
                <h3><FiUsers size={16} style={{ marginRight: 6 }} />Demandes ({activeParticipants.length < 8 ? 1 : 0})</h3>
                <button className="ls-requests-close" onClick={() => setShowRequestsPanel(false)}>
                  <FiX size={14} />
                </button>
              </div>
              <div className="ls-requests-list">
                {activeParticipants.length < 8 ? (
                  <div className="ls-request-item">
                    <FiUserPlus size={18} color="#ff9500" />
                    <span className="ls-request-name">
                      {FAKE_PARTICIPANTS[activeParticipants.length]?.name || 'Inconnu'}
                    </span>
                    <div className="ls-request-actions">
                      <button className="ls-request-accept-btn"
                        onClick={() => { addParticipant(); setShowRequestsPanel(false); }}>
                        ✓ Accepter
                      </button>
                      <button className="ls-request-reject-btn">
                        ✗ Refuser
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ls-no-requests">Live complet (8/8) — aucune demande en attente</div>
                )}
              </div>
            </div>

          </div>{/* /ls-container */}
        </div>{/* /ltp-streamer-panel */}

        {/* ── Sidebar contrôles ────────────────────────────── */}
        <div className="ltp-sidebar">

          {/* Layouts rapides */}
          <div className="ltp-section">
            <div className="ltp-section-title">Layouts rapides</div>
            <div className="ltp-layout-grid">
              {[1,2,3,4,5,6,7,8].map(n => (
                <button
                  key={n}
                  className={`ltp-layout-btn${totalCards === n ? ' active' : ''}`}
                  onClick={() => jumpToLayout(n)}
                  title={`Passer à layout-${n} (${n - 1} participant${n > 2 ? 's' : ''})`}>
                  {n}
                </button>
              ))}
            </div>
            <div className="ltp-info" style={{ marginTop: 8 }}>
              Actuel : <strong>{layoutClass}</strong>
              <br />{activeParticipants.length} participant{activeParticipants.length !== 1 ? 's' : ''} actif{activeParticipants.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Participants */}
          <div className="ltp-section">
            <div className="ltp-section-title">
              Participants <span className="ltp-count">{activeParticipants.length}/8</span>
            </div>
            <div className="ltp-section-row">
              <button className="ltp-btn primary" onClick={addParticipant}
                disabled={activeParticipants.length >= 8}>
                <FiPlus size={12} /> Ajouter
              </button>
              <button className="ltp-btn danger" onClick={removeParticipant}
                disabled={activeParticipants.length === 0}>
                <FiMinus size={12} /> Retirer
              </button>
            </div>
            {activeParticipants.length > 0 && (
              <div className="ltp-info" style={{ marginTop: 8 }}>
                {activeParticipants.map(p => (
                  <span key={p.id} style={{
                    display: 'inline-block', marginRight: 4, marginBottom: 4,
                    padding: '2px 8px', borderRadius: 50,
                    fontSize: '0.75rem', fontWeight: 600,
                    background: `${p.color}22`, color: p.color,
                    border: `1px solid ${p.color}44`
                  }}>{p.name}</span>
                ))}
              </div>
            )}
          </div>

          {/* Streamer */}
          <div className="ltp-section">
            <div className="ltp-section-title">Streamer</div>
            <div className="ltp-section-row">
              <button
                className={`ltp-btn${streamerCamOff ? ' active' : ''}`}
                onClick={() => setStreamerCamOff(!streamerCamOff)}>
                {streamerCamOff ? <FiVideoOff size={12} /> : <FiVideo size={12} />}
                Cam {streamerCamOff ? 'OFF' : 'ON'}
              </button>
              <button
                className={`ltp-btn${streamerMuted ? ' active' : ''}`}
                onClick={() => setStreamerMuted(!streamerMuted)}>
                {streamerMuted ? <FiMicOff size={12} /> : <FiMic size={12} />}
                Mic {streamerMuted ? 'OFF' : 'ON'}
              </button>
            </div>
          </div>

          {/* Chat */}
          <div className="ltp-section">
            <div className="ltp-section-title">Chat simulation</div>
            <div className="ltp-chat-input-row">
              <input
                className="ltp-chat-input"
                placeholder="Message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendFakeMessage(); }}
              />
              <button className="ltp-btn" onClick={sendFakeMessage}>
                <FiSend size={12} />
              </button>
            </div>
            <div style={{ marginTop: 6 }}>
              <button className="ltp-btn" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  const msg = FAKE_MESSAGES_POOL[Math.floor(Math.random() * FAKE_MESSAGES_POOL.length)];
                  setMessages(prev => [...prev, { id: `r-${Date.now()}`, ...msg, isSystem: false }]);
                }}>
                Message aléatoire
              </button>
            </div>
          </div>

          {/* Panneaux */}
          <div className="ltp-section">
            <div className="ltp-section-title">Panneaux</div>
            <div className="ltp-section-row">
              <button className={`ltp-btn${showStatsPanel ? ' active' : ''}`}
                onClick={() => { setShowStatsPanel(!showStatsPanel); setShowRequestsPanel(false); }}>
                <FiEye size={12} /> Stats
              </button>
              <button className={`ltp-btn${showRequestsPanel ? ' active' : ''}`}
                onClick={() => { setShowRequestsPanel(!showRequestsPanel); setShowStatsPanel(false); }}>
                <FiUsers size={12} /> Demandes
              </button>
            </div>
          </div>

          {/* Viewer */}
          <div className="ltp-section">
            <div className="ltp-section-title">Vue Spectateur</div>
            <button className="ltp-btn success" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { setShowViewerModal(true); setViewerIsParticipant(false); }}>
              <FiEye size={12} /> Ouvrir vue Viewer
            </button>
            <div className="ltp-info" style={{ marginTop: 6 }}>
              Teste l'interface spectateur et la transition vers Participant (PiP).
            </div>
          </div>

          {/* Info */}
          <div className="ltp-section">
            <div className="ltp-section-title">À propos</div>
            <div className="ltp-info">
              <FiAlertCircle size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Test visuel uniquement. Utilise les mêmes classes CSS que la vraie interface live.
              <br /><br />
              Pour tester WebRTC, lance le backend et ouvre deux onglets.
            </div>
          </div>

        </div>{/* /ltp-sidebar */}
      </div>{/* /ltp-body */}

      {/* ── Modal Viewer ─────────────────────────────────────── */}
      {showViewerModal && (
        <div className="ltp-viewer-overlay">
          <div className="ltp-viewer-wrapper">

            {/* Interface lv-* (fidèle à LiveViewer) */}
            <div className="ltp-viewer-live">
              <div className="lv-container">

                {/* Vidéo streamer simulée */}
                <div className="lv-video-section" style={{ border: 'none', borderRadius: 0 }}>
                  <FakeVideoCanvas
                    color="#c0392b"
                    initials="S"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  />
                  <div className="lv-watermark">TEST-MODE</div>
                </div>

                {/* PiP participant (si isParticipant) */}
                {viewerIsParticipant && (
                  <div className="lv-local-preview">
                    {viewerCamOff ? (
                      <div className="lv-cam-off-cover">
                        <span>V</span>
                      </div>
                    ) : (
                      <FakeVideoCanvas color="#6366f1" initials="V" />
                    )}
                  </div>
                )}

                {/* UI Overlay */}
                <div className="lv-ui-overlay">

                  {/* Top bar */}
                  <div className="lv-top-bar">
                    <div className="lv-header-left">
                      <span className="lv-streamer-name">Streamer Test</span>
                      <div className="lv-stats-indicators">
                        <div className="lv-live-badge">LIVE</div>
                        <button className="lv-viewer-count">
                          <FiEye size={11} /> {viewerCount}
                        </button>
                        <button className="lv-gift-count">
                          <FiGift size={11} /> 7
                        </button>
                      </div>
                    </div>
                    <div className="lv-header-right">
                      <button className="lv-close-btn" onClick={() => setShowViewerModal(false)}>
                        <FiX size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Chat viewer */}
                  <div className="lv-chat-section" ref={viewerChatRef}>
                    {viewerMessages.map(msg => (
                      <div key={msg.id} className="lv-chat-message">
                        <div className="lv-chat-avatar">
                          <div className="lv-chat-avatar-initials"
                            style={{ background: `linear-gradient(135deg, ${msg.color}88, ${msg.color})` }}>
                            {msg.user[0]}
                          </div>
                        </div>
                        <div className="lv-chat-content">
                          <div className="lv-chat-body">
                            <span className="lv-chat-username" style={{ color: '#ff9500' }}>
                              {msg.user}
                            </span>
                            <span className="lv-chat-text">{msg.text}</span>
                            {msg.country && <span className="ls-country-badge">{msg.country}</span>}
                            <button className="ls-translate-btn" title="Traduire"><FiGlobe size={11} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom bar */}
                  <div className="lv-bottom-bar">
                    <div className="lv-input-container">
                      <input placeholder="Écrivez" />
                      <button className="lv-send-btn" onClick={sendViewerMessage}>
                        <FiSend size={16} />
                      </button>
                    </div>
                    <div className="lv-actions-group">
                      {!viewerIsParticipant && (
                        <button className="lv-join-btn"
                          title="Demander à rejoindre le live"
                          onClick={() => setViewerIsParticipant(true)}>
                          <FiUserPlus size={18} />
                        </button>
                      )}
                      <button className="lv-control-btn gift-btn" title="Envoyer un cadeau">
                        <FiGift size={18} />
                      </button>
                    </div>
                    {viewerIsParticipant && (
                      <>
                        <button
                          className={`lv-control-btn${viewerMuted ? ' off' : ''}`}
                          onClick={() => setViewerMuted(!viewerMuted)}
                          title="Micro">
                          {viewerMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
                        </button>
                        <button
                          className={`lv-control-btn${viewerCamOff ? ' off' : ''}`}
                          onClick={() => setViewerCamOff(!viewerCamOff)}
                          title="Caméra">
                          {viewerCamOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar contrôles viewer */}
            <div className="ltp-viewer-controls">
              <h3>Vue Spectateur</h3>

              <div className="ltp-viewer-state">
                Rôle actuel : <strong>
                  {viewerIsParticipant ? '🎥 Participant' : '👁 Spectateur'}
                </strong>
              </div>

              <div className="ltp-section-title">Transition</div>
              {!viewerIsParticipant ? (
                <button className="ltp-btn success" onClick={() => setViewerIsParticipant(true)}>
                  <FiUserPlus size={12} /> Rejoindre (Participant)
                </button>
              ) : (
                <button className="ltp-btn danger" onClick={() => {
                  setViewerIsParticipant(false);
                  setViewerCamOff(false);
                  setViewerMuted(false);
                }}>
                  <FiX size={12} /> Quitter (→ Viewer)
                </button>
              )}

              {viewerIsParticipant && (
                <>
                  <div className="ltp-section-title">Contrôles Participant</div>
                  <button
                    className={`ltp-btn${viewerCamOff ? ' active' : ''}`}
                    onClick={() => setViewerCamOff(!viewerCamOff)}>
                    {viewerCamOff ? <FiVideoOff size={12} /> : <FiVideo size={12} />}
                    Cam {viewerCamOff ? 'OFF' : 'ON'}
                  </button>
                  <button
                    className={`ltp-btn${viewerMuted ? ' active' : ''}`}
                    onClick={() => setViewerMuted(!viewerMuted)}>
                    {viewerMuted ? <FiMicOff size={12} /> : <FiMic size={12} />}
                    Mic {viewerMuted ? 'OFF' : 'ON'}
                  </button>
                  <div className="ltp-viewer-state" style={{ marginTop: 4 }}>
                    PiP : {viewerCamOff ? '📷 Avatar affiché' : '🎥 Flux simulé'}
                    <br />Mic : {viewerMuted ? '🔇 Coupé' : '🎤 Actif'}
                  </div>
                </>
              )}

              <div className="ltp-section-title">Chat</div>
              <button className="ltp-btn" onClick={sendViewerMessage}>
                Message aléatoire
              </button>

              <div className="ltp-section-title" style={{ marginTop: 8 }}>Note</div>
              <div className="ltp-info">
                Le PiP apparaît sous la top bar (corrigé).
                <br />La bottom bar s'adapte : Join → Mic+Cam.
              </div>

              <button className="ltp-btn danger" style={{ marginTop: 8 }}
                onClick={() => { setShowViewerModal(false); setViewerIsParticipant(false); }}>
                <FiX size={12} /> Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default LiveTestPage;
