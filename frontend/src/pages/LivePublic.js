import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  FiArrowLeft, FiSearch, FiTrendingUp, FiMapPin, FiClock,
  FiHeart, FiEye, FiPlay, FiX
} from 'react-icons/fi';
import Navigation from '../components/Navigation';
import LiveStream from '../components/LiveStream';
import { useAuth } from '../contexts/AuthContext';
import { getPhotoUrl } from '../utils/photoUrl';
import './LivePublic.css';

const LivePublic = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // État : navigation entre liste et interface live
  const [isStreaming, setIsStreaming] = useState(false);

  const [activeTab, setActiveTab] = useState('trending');
  const [liveStreams, setLiveStreams] = useState([]);
  const [filteredStreams, setFilteredStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const tabs = [
    { id: 'trending', label: t('livePublic.tabTrending'), icon: FiTrendingUp },
    { id: 'nearby', label: t('livePublic.tabNearby'), icon: FiMapPin },
    { id: 'new', label: t('livePublic.tabNew'), icon: FiClock },
    { id: 'favorites', label: t('livePublic.tabFavorites'), icon: FiHeart }
  ];

  useEffect(() => {
    loadLiveStreams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    filterStreams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, liveStreams]);

  const loadLiveStreams = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('/api/live/public', {
        params: {
          filter: activeTab,
          mode: 'public',
          userLat: user?.location?.coordinates?.[1],
          userLon: user?.location?.coordinates?.[0]
        }
      });

      setLiveStreams(response.data.streams || []);
      
    } catch (error) {
      console.error('Error loading live streams:', error);
      toast.error(t('livePublic.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const filterStreams = () => {
    if (!searchQuery.trim()) {
      setFilteredStreams(liveStreams);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = liveStreams.filter(stream => 
      stream.streamer.displayName?.toLowerCase().includes(query) ||
      stream.streamer.firstName?.toLowerCase().includes(query) ||
      stream.title?.toLowerCase().includes(query) ||
      stream.tags?.some(tag => tag.toLowerCase().includes(query))
    );

    setFilteredStreams(filtered);
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
          ? t('livePublic.removedFavorite')
          : t('livePublic.addedFavorite')
      );

      // Si on est dans l'onglet favoris et qu'on retire, recharger la liste
      if (activeTab === 'favorites') {
        loadLiveStreams();
      }

    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(t('livePublic.favoriteError'));
    }
  };

  // Si l'utilisateur est en streaming, afficher l'interface de live
  if (isStreaming) {
    return (
      <LiveStream
        mode="public"
        onQuit={() => setIsStreaming(false)}
        streamerName={user?.displayName || user?.firstName || 'Streamer'}
        user={user}
      />
    );
  }

  return (
    <div className="live-public-container">
      <div className="live-public-header">
        <button className="btn btn-ghost" onClick={() => navigate('/stream')}>
          <FiArrowLeft />
        </button>

        <h1>{t('livePublic.title')}</h1>

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

      {/* Bouton flottant Démarrer un live */}
      <button className="start-live-fab" onClick={() => setIsStreaming(true)}>
        <FiPlay />
        <span>{t('livePublic.startBtn')}</span>
      </button>

      {showSearch && (
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('livePublic.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              <FiX />
            </button>
          )}
        </div>
      )}

      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="live-public-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading"></div>
            <p>{t('livePublic.loadingLives')}</p>
          </div>
        ) : filteredStreams.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <FiSearch size={60} />
                <h2>{t('livePublic.noResults')}</h2>
                <p>{t('livePublic.noResultsFor', { query: searchQuery })}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setSearchQuery('')}
                >
                  {t('livePublic.clearSearch')}
                </button>
              </>
            ) : activeTab === 'nearby' ? (
              <>
                <FiMapPin size={60} />
                <h2>{t('livePublic.noNearby')}</h2>
                <p>{t('livePublic.noNearbyDesc')}</p>
              </>
            ) : activeTab === 'favorites' ? (
              <>
                <FiHeart size={60} />
                <h2>{t('livePublic.noFavorites')}</h2>
                <p>{t('livePublic.noFavoritesDesc')}</p>
              </>
            ) : (
              <>
                <FiPlay size={60} />
                <h2>{t('livePublic.noLives')}</h2>
                <p>{t('livePublic.noLivesDesc')}</p>
              </>
            )}
          </div>
        ) : (
          <div className="streams-grid">
            {filteredStreams.map(stream => (
              <StreamCard
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

const StreamCard = ({ stream, onJoin, onToggleFavorite }) => {
  const { t } = useTranslation();
  const primaryPhoto = stream.streamer.photos?.find(p => p.isPrimary) || stream.streamer.photos?.[0];

  // Calcul de l'âge si birthDate disponible
  const age = stream.streamer.birthDate
    ? Math.floor((Date.now() - new Date(stream.streamer.birthDate)) / 31557600000)
    : null;

  const displayName = stream.streamer.displayName || stream.streamer.firstName || '?';
  const nameAge = age ? `${displayName}, ${age}` : displayName;

  return (
    <div className="stream-card" onClick={() => onJoin(stream._id)}>
      {/* Thumbnail avec preview live */}
      <div className="stream-thumbnail">
        {stream.thumbnail ? (
          <img src={getPhotoUrl(stream.thumbnail)} alt={stream.title} />
        ) : primaryPhoto ? (
          <img src={getPhotoUrl(primaryPhoto.url)} alt={displayName} />
        ) : (
          <div className="placeholder-thumbnail">
            <FiPlay size={60} />
          </div>
        )}

        {/* Badge LIVE */}
        <div className="live-badge">
          <span className="live-dot"></span>
          {t('livePublic.live')}
        </div>

        {/* Spectateurs — masqué si 0 */}
        {stream.viewersCount > 0 && (
          <div className="viewers-count">
            <FiEye />
            <span>{stream.viewersCount}</span>
          </div>
        )}

        {/* Durée du live */}
        {stream.duration && (
          <div className="stream-duration">
            {formatDuration(stream.duration)}
          </div>
        )}
      </div>

      {/* Informations compactes : photo agrandie + nom/âge/viewers/timer */}
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
            <div className="stream-meta">
              {stream.viewersCount > 0 && (
                <span className="meta-viewers">
                  <FiEye size={11} /> {stream.viewersCount}
                </span>
              )}
              {stream.duration && (
                <span className="meta-timer">
                  {formatDuration(stream.duration)}
                </span>
              )}
            </div>
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
      </div>
    </div>
  );
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export default LivePublic;
