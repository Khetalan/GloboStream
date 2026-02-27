import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiSearch, FiX, FiHeart, FiEye, FiPlay
} from 'react-icons/fi';
import { BsFillTrophyFill } from 'react-icons/bs';
import Navigation from '../components/Navigation';
import LiveStream from '../components/LiveStream';
import { useAuth } from '../contexts/AuthContext';
import { getPhotoUrl } from '../utils/photoUrl';
import './LiveCompetition.css';

const LiveCompetition = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [isStreaming, setIsStreaming] = useState(false);
  const [liveStreams, setLiveStreams] = useState([]);
  const [filteredStreams, setFilteredStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Restaurer le live si le streamer recharge la page
  useEffect(() => {
    if (user?.isLive && user?.liveMode === 'competition') {
      setIsStreaming(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLiveStreams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh silencieux 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get('/api/live/public', {
          params: { mode: 'competition' }
        });
        setLiveStreams(response.data.streams || []);
      } catch { /* silencieux */ }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtre search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStreams(liveStreams);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredStreams(liveStreams.filter(stream =>
      stream.streamer.displayName?.toLowerCase().includes(query) ||
      stream.streamer.firstName?.toLowerCase().includes(query) ||
      stream.title?.toLowerCase().includes(query)
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, liveStreams]);

  const loadLiveStreams = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/live/public', {
        params: { mode: 'competition' }
      });
      setLiveStreams(response.data.streams || []);
    } catch (error) {
      console.error('Error loading competition streams:', error);
      toast.error(t('liveCompetition.loadError'));
    } finally {
      setLoading(false);
    }
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
          ? t('liveCompetition.removedFavorite')
          : t('liveCompetition.addedFavorite')
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(t('liveCompetition.favoriteError'));
    }
  };

  // Interface streamer
  if (isStreaming) {
    return (
      <LiveStream
        mode="competition"
        onQuit={() => setIsStreaming(false)}
        streamerName={user?.displayName || user?.firstName || 'Streamer'}
        user={user}
      />
    );
  }

  return (
    <div className="live-comp-container">
      <div className="live-comp-header">
        <button className="btn btn-ghost" onClick={() => navigate('/stream')}>
          <FiArrowLeft />
        </button>
        <h1>{t('liveCompetition.title')}</h1>
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

      {/* Bouton flottant Démarrer */}
      <button className="start-live-fab-comp" onClick={() => setIsStreaming(true)}>
        <FiPlay />
        <span>{t('liveCompetition.startBtn')}</span>
      </button>

      {showSearch && (
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('liveCompetition.searchPlaceholder')}
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

      <div className="live-comp-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading"></div>
            <p>{t('liveCompetition.loadingLives')}</p>
          </div>
        ) : filteredStreams.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <FiSearch size={60} />
                <h2>{t('liveCompetition.noResults')}</h2>
                <p>{t('liveCompetition.noResultsFor', { query: searchQuery })}</p>
                <button className="btn btn-primary" onClick={() => setSearchQuery('')}>
                  {t('liveCompetition.clearSearch')}
                </button>
              </>
            ) : (
              <>
                <BsFillTrophyFill size={60} />
                <h2>{t('liveCompetition.noLives')}</h2>
                <p>{t('liveCompetition.noLivesDesc')}</p>
              </>
            )}
          </div>
        ) : (
          <div className="streams-grid">
            {filteredStreams.map(stream => (
              <CompStreamCard
                key={stream._id}
                stream={stream}
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

const CompStreamCard = ({ stream, onJoin, onToggleFavorite }) => {
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
    <div className="stream-card" onClick={() => onJoin(stream._id)}>
      <div className="stream-thumbnail">
        {stream.thumbnail ? (
          <img src={getPhotoUrl(stream.thumbnail)} alt={stream.title} />
        ) : primaryPhoto ? (
          <img src={getPhotoUrl(primaryPhoto.url)} alt={displayName} />
        ) : (
          <div className="placeholder-thumbnail">
            <BsFillTrophyFill size={48} />
          </div>
        )}

        <div className="live-badge">
          <span className="live-dot"></span>
          {t('liveCompetition.live')}
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
          <div className="streamer-avatar">
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

export default LiveCompetition;
