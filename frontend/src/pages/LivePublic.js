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
import { useAuth } from '../contexts/AuthContext';
import './LivePublic.css';

const LivePublic = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

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
    navigate(`/stream/public/${streamId}`);
  };

  const handleToggleFavorite = async (streamId) => {
    try {
      await axios.post(`/api/live/favorite/${streamId}`);
      
      setLiveStreams(prev => prev.map(stream => 
        stream._id === streamId 
          ? { ...stream, isFavorite: !stream.isFavorite }
          : stream
      ));
      
      toast.success(
        liveStreams.find(s => s._id === streamId)?.isFavorite
          ? t('livePublic.removedFavorite')
          : t('livePublic.addedFavorite')
      );
      
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(t('livePublic.favoriteError'));
    }
  };

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

  return (
    <div className="stream-card" onClick={() => onJoin(stream._id)}>
      {/* Thumbnail avec preview live */}
      <div className="stream-thumbnail">
        {stream.thumbnail ? (
          <img src={stream.thumbnail} alt={stream.title} />
        ) : primaryPhoto ? (
          <img src={primaryPhoto.url} alt={stream.streamer.displayName} />
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

        {/* Nombre de spectateurs */}
        <div className="viewers-count">
          <FiEye />
          <span>{stream.viewersCount || 0}</span>
        </div>

        {/* Durée du live */}
        {stream.duration && (
          <div className="stream-duration">
            {formatDuration(stream.duration)}
          </div>
        )}
      </div>

      {/* Informations */}
      <div className="stream-info">
        <div className="streamer-row">
          <div className="streamer-avatar">
            {primaryPhoto ? (
              <img src={primaryPhoto.url} alt={stream.streamer.displayName} />
            ) : (
              <div className="avatar-placeholder">
                {(stream.streamer.displayName || stream.streamer.firstName || '?').charAt(0)}
              </div>
            )}
          </div>

          <div className="streamer-details">
            <h3 className="stream-title">{stream.title || t('livePublic.untitled')}</h3>
            <p className="streamer-name">
              {stream.streamer.displayName || stream.streamer.firstName}
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

        {/* Tags */}
        {stream.tags && stream.tags.length > 0 && (
          <div className="stream-tags">
            {stream.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="stream-tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Distance */}
        {stream.distance && (
          <div className="stream-distance">
            <FiMapPin />
            <span>{stream.distance < 1 ? t('livePublic.lessThan1km') : `${Math.round(stream.distance)} ${t('common.km')}`}</span>
          </div>
        )}
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
