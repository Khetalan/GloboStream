import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiSearch, FiX, FiHeart, FiEye, FiPlay
} from 'react-icons/fi';
import Navigation from '../components/Navigation';
import LiveStream from '../components/LiveStream';
import { useAuth } from '../contexts/AuthContext';
import { getPhotoUrl } from '../utils/photoUrl';
import './LiveEvent.css';

export const EVENT_THEMES = [
  { id: 'music',      label: 'Musique',    emoji: '🎵', color: '#8b5cf6' },
  { id: 'gaming',     label: 'Gaming',     emoji: '🎮', color: '#3b82f6' },
  { id: 'sport',      label: 'Sport',      emoji: '🏋️', color: '#10b981' },
  { id: 'cuisine',    label: 'Cuisine',    emoji: '🍳', color: '#f59e0b' },
  { id: 'beauty',     label: 'Beauté',     emoji: '💄', color: '#ec4899' },
  { id: 'travel',     label: 'Voyage',     emoji: '✈️', color: '#06b6d4' },
  { id: 'art',        label: 'Art',        emoji: '🎨', color: '#f97316' },
  { id: 'discussion', label: 'Discussion', emoji: '💬', color: '#6b7280' },
];

const LiveEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [screen, setScreen] = useState('themeSelection');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveStreams, setLiveStreams] = useState([]);
  const [filteredStreams, setFilteredStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Restaurer le live si le streamer recharge la page
  useEffect(() => {
    if (user?.isLive && user?.liveMode === 'event') {
      setIsStreaming(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLiveStreams = useCallback(async (theme) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/live/public', {
        params: { mode: 'event' }
      });
      const all = response.data.streams || [];
      const filtered = theme
        ? all.filter(s => s.tags?.includes(theme.id))
        : all;
      setLiveStreams(all);
      setFilteredStreams(filtered);
    } catch (error) {
      console.error('Error loading event streams:', error);
      toast.error(t('liveEvent.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Refresh silencieux 30s quand on est sur la liste
  useEffect(() => {
    if (screen !== 'liveList' || !selectedTheme) return;
    const interval = setInterval(async () => {
      try {
        const response = await axios.get('/api/live/public', {
          params: { mode: 'event' }
        });
        const all = response.data.streams || [];
        setLiveStreams(all);
      } catch { /* silencieux */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [screen, selectedTheme]);

  // Filtre search sur la liste courante
  useEffect(() => {
    if (!selectedTheme) return;
    const base = selectedTheme
      ? liveStreams.filter(s => s.tags?.includes(selectedTheme.id))
      : liveStreams;

    if (!searchQuery.trim()) {
      setFilteredStreams(base);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredStreams(base.filter(stream =>
      stream.streamer.displayName?.toLowerCase().includes(query) ||
      stream.streamer.firstName?.toLowerCase().includes(query) ||
      stream.title?.toLowerCase().includes(query)
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, liveStreams, selectedTheme]);

  const handleSelectTheme = (theme) => {
    setSelectedTheme(theme);
    setSearchQuery('');
    setShowSearch(false);
    setScreen('liveList');
    loadLiveStreams(theme);
  };

  const handleBackToThemes = () => {
    setScreen('themeSelection');
    setSelectedTheme(null);
    setSearchQuery('');
    setShowSearch(false);
    setLiveStreams([]);
    setFilteredStreams([]);
  };

  const handleJoinStream = (streamId) => {
    navigate(`/stream/watch/live-${streamId}`);
  };

  const handleToggleFavorite = async (streamId) => {
    try {
      const currentStream = liveStreams.find(s => s._id === streamId);
      const wasAlreadyFavorite = currentStream?.isFavorite;

      await axios.post(`/api/live/favorite/${streamId}`);

      setLiveStreams(prev => prev.map(stream =>
        stream._id === streamId
          ? { ...stream, isFavorite: !stream.isFavorite }
          : stream
      ));

      toast.success(
        wasAlreadyFavorite
          ? t('liveEvent.removedFavorite')
          : t('liveEvent.addedFavorite')
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(t('liveEvent.favoriteError'));
    }
  };

  // Interface streamer
  if (isStreaming) {
    return (
      <LiveStream
        mode="event"
        onQuit={() => setIsStreaming(false)}
        streamerName={user?.displayName || user?.firstName || 'Streamer'}
        user={user}
        theme={selectedTheme}
      />
    );
  }

  // ── Écran sélection de thème ───────────────────────────────
  if (screen === 'themeSelection') {
    return (
      <div className="live-event-container">
        <div className="live-event-header">
          <button className="btn btn-ghost" onClick={() => navigate('/stream')}>
            <FiArrowLeft />
          </button>
          <h1>{t('liveEvent.title')}</h1>
          <Navigation />
        </div>

        <div className="live-event-content">
          <div className="le-pick-header">
            <p className="le-pick-title">{t('liveEvent.pickTheme')}</p>
            <p className="le-pick-desc">{t('liveEvent.pickThemeDesc')}</p>
          </div>

          <div className="le-theme-grid">
            {EVENT_THEMES.map(theme => (
              <button
                key={theme.id}
                className="le-theme-card"
                style={{ '--le-theme-color': theme.color }}
                onClick={() => handleSelectTheme(theme)}
              >
                <span className="le-theme-emoji">{theme.emoji}</span>
                <span className="le-theme-label">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Écran liste des lives ──────────────────────────────────
  return (
    <div className="live-event-container">
      <div className="live-event-header">
        <button className="btn btn-ghost" onClick={handleBackToThemes}>
          <FiArrowLeft />
        </button>
        <h1>
          {selectedTheme?.emoji} {selectedTheme?.label}
        </h1>
        <div className="header-actions">
          <button
            className="btn btn-ghost"
            onClick={() => setShowSearch(!showSearch)}
          >
            {showSearch ? <FiX /> : <FiSearch />}
          </button>
          <Navigation />
        </div>
      </div>

      {/* FAB Démarrer */}
      <button
        className="start-live-fab-event"
        style={{ background: selectedTheme?.color }}
        onClick={() => setIsStreaming(true)}
      >
        <FiPlay />
        <span>{t('liveEvent.startBtn', { theme: selectedTheme?.label })}</span>
      </button>

      {showSearch && (
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('liveEvent.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              <FiX />
            </button>
          )}
        </div>
      )}

      <div className="live-event-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading"></div>
            <p>{t('liveEvent.loadingLives')}</p>
          </div>
        ) : filteredStreams.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <FiSearch size={60} />
                <h2>{t('liveEvent.noResults')}</h2>
                <p>{t('liveEvent.noResultsFor', { query: searchQuery })}</p>
                <button className="btn btn-primary" onClick={() => setSearchQuery('')}>
                  {t('liveEvent.clearSearch')}
                </button>
              </>
            ) : (
              <>
                <span className="le-empty-emoji">{selectedTheme?.emoji}</span>
                <h2>{t('liveEvent.noLives', { theme: selectedTheme?.label })}</h2>
                <p>{t('liveEvent.noLivesDesc')}</p>
              </>
            )}
          </div>
        ) : (
          <div className="streams-grid">
            {filteredStreams.map(stream => (
              <EventStreamCard
                key={stream._id}
                stream={stream}
                themeColor={selectedTheme?.color}
                onJoin={handleJoinStream}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EventStreamCard = ({ stream, themeColor, onJoin, onToggleFavorite }) => {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(stream.duration || 0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const primaryPhoto = stream.streamer.photos?.find(p => p.isPrimary) || stream.streamer.photos?.[0];

  const age = stream.streamer.birthDate
    ? Math.floor((Date.now() - new Date(stream.streamer.birthDate)) / 31557600000)
    : null;

  const displayName = stream.streamer.displayName || stream.streamer.firstName || '?';
  const nameAge = age ? `${displayName}, ${age}` : displayName;

  return (
    <div
      className="stream-card le-stream-card"
      style={{ '--le-theme-color': themeColor }}
      onClick={() => onJoin(stream._id)}
    >
      <div className="stream-thumbnail">
        {stream.thumbnail ? (
          <img src={getPhotoUrl(stream.thumbnail)} alt={stream.title} />
        ) : primaryPhoto ? (
          <img src={getPhotoUrl(primaryPhoto.url)} alt={displayName} />
        ) : (
          <div className="placeholder-thumbnail">
            <FiPlay size={48} />
          </div>
        )}

        <div className="live-badge">
          <span className="live-dot"></span>
          {t('liveEvent.live')}
        </div>

        {stream.viewersCount > 0 && (
          <div className="viewers-count">
            <FiEye />
            <span>{stream.viewersCount}</span>
          </div>
        )}

        {elapsed > 0 && (
          <div className="stream-duration">
            {formatDuration(elapsed)}
          </div>
        )}
      </div>

      <div className="stream-info">
        <div className="streamer-row">
          <div className="streamer-avatar le-streamer-avatar">
            {primaryPhoto ? (
              <img src={getPhotoUrl(primaryPhoto.url)} alt={displayName} />
            ) : (
              <div className="avatar-placeholder">
                {displayName.charAt(0)}
              </div>
            )}
          </div>

          <div className="streamer-details">
            <p className="streamer-name">
              {nameAge}
              {stream.streamer.isVerified && (
                <span className="verified-badge">✓</span>
              )}
            </p>
          </div>

          <button
            className={`favorite-btn ${stream.isFavorite ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(stream._id);
            }}
          >
            <FiHeart />
          </button>
        </div>
        {stream.description && (
          <p className="stream-description">{stream.description}</p>
        )}
      </div>
    </div>
  );
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default LiveEvent;
