import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiArrowLeft, FiSearch, FiX, FiHeart, FiEye, FiPlay,
  FiTrendingUp, FiMapPin, FiClock, FiUsers, FiCalendar, FiInfo
} from 'react-icons/fi';
import { BsFillTrophyFill } from 'react-icons/bs';
import Navigation from '../components/Navigation';
import LiveStream from '../components/LiveStream';
import { useAuth } from '../contexts/AuthContext';
import { getPhotoUrl } from '../utils/photoUrl';
import './LiveCompetition.css';

const LiveCompetition = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Écrans : rules (page explicative) → liveList (liste des lives)
  // Si on revient depuis TeamPage, on atterrit directement sur liveList
  const [screen, setScreen] = useState(location.state?.screen || 'rules');
  const [isStreaming, setIsStreaming] = useState(false);

  // Concours (depuis API)
  const [competitions, setCompetitions] = useState([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(true);
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  // Lives
  const [liveStreams, setLiveStreams] = useState([]);
  const [filteredStreams, setFilteredStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState('trending');

  const tabs = [
    { id: 'trending',  label: t('livePublic.tabTrending'),  icon: FiTrendingUp },
    { id: 'nearby',    label: t('livePublic.tabNearby'),    icon: FiMapPin },
    { id: 'new',       label: t('livePublic.tabNew'),       icon: FiClock },
    { id: 'favorites', label: t('livePublic.tabFavorites'), icon: FiHeart },
  ];

  // Restaurer le live si le streamer recharge la page
  useEffect(() => {
    if (user?.isLive && user?.liveMode === 'competition') {
      setIsStreaming(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger les concours (écran explicatif)
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoadingCompetitions(true);
        const response = await axios.get('/api/competitions');
        setCompetitions(response.data.competitions || []);
      } catch (error) {
        console.error('Error loading competitions:', error);
      } finally {
        setLoadingCompetitions(false);
      }
    };
    fetchCompetitions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLiveStreams = useCallback(async (filter) => {
    try {
      setLoading(true);
      const currentFilter = filter || activeFilter;
      const response = await axios.get('/api/live/public', {
        params: {
          mode: 'competition',
          filter: currentFilter,
          userLat: user?.location?.coordinates?.[1],
          userLon: user?.location?.coordinates?.[0]
        }
      });
      setLiveStreams(response.data.streams || []);
    } catch (error) {
      console.error('Error loading competition streams:', error);
      toast.error(t('liveCompetition.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t, activeFilter, user]);

  // Charger les lives quand on entre dans liveList
  useEffect(() => {
    if (screen === 'liveList') {
      loadLiveStreams(activeFilter);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, activeFilter]);

  // Refresh silencieux 30s sur la liste
  useEffect(() => {
    if (screen !== 'liveList') return;
    const interval = setInterval(async () => {
      try {
        const response = await axios.get('/api/live/public', {
          params: {
            mode: 'competition',
            filter: activeFilter,
            userLat: user?.location?.coordinates?.[1],
            userLon: user?.location?.coordinates?.[0]
          }
        });
        setLiveStreams(response.data.streams || []);
      } catch { /* silencieux */ }
    }, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, activeFilter]);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
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

  // ── Écran explicatif ───────────────────────────────────────
  if (screen === 'rules') {
    const activeCompetitions   = competitions.filter(c => c.status === 'active');
    const upcomingCompetitions = competitions.filter(c => c.status === 'upcoming');

    return (
      <div className="live-comp-container">
        <div className="live-comp-header">
          <button className="btn btn-ghost" onClick={() => navigate('/stream')}>
            <FiArrowLeft />
          </button>
          <h1>{t('liveCompetition.title')}</h1>
          <Navigation />
        </div>

        <div className="live-comp-content lc-rules-content">
          {/* Icône trophée */}
          <div className="lc-rules-hero">
            <div className="lc-trophy-icon">
              <BsFillTrophyFill size={40} />
            </div>
            <h2 className="lc-rules-title">{t('liveCompetition.rulesTitle')}</h2>
            <p className="lc-rules-subtitle">{t('liveCompetition.rulesSubtitle')}</p>
          </div>

          {/* Règlement général */}
          <div className="lc-rules-card">
            <h3 className="lc-section-title">
              <FiInfo /> {t('liveCompetition.rulesSection')}
            </h3>
            <ul className="lc-rules-list">
              <li>{t('liveCompetition.rule1')}</li>
              <li>{t('liveCompetition.rule2')}</li>
              <li>{t('liveCompetition.rule3')}</li>
              <li>{t('liveCompetition.rule4')}</li>
              <li>{t('liveCompetition.rule5')}</li>
            </ul>
          </div>

          {/* Concours en cours */}
          {!loadingCompetitions && activeCompetitions.length > 0 && (
            <div className="lc-competitions-section">
              <h3 className="lc-section-title">
                <span className="lc-status-dot active"></span>
                {t('liveCompetition.inProgress')}
              </h3>
              {activeCompetitions.map(comp => (
                <button
                  key={comp._id}
                  className="lc-competition-card lc-competition-active"
                  onClick={() => setSelectedCompetition(comp)}
                >
                  <span className="lc-comp-name">{comp.name}</span>
                  {comp.endDate && (
                    <span className="lc-comp-date">
                      <FiCalendar /> {t('liveCompetition.until')} {formatDate(comp.endDate)}
                    </span>
                  )}
                  <FiInfo className="lc-comp-info-icon" />
                </button>
              ))}
            </div>
          )}

          {/* Concours à venir */}
          {!loadingCompetitions && upcomingCompetitions.length > 0 && (
            <div className="lc-competitions-section">
              <h3 className="lc-section-title">
                <span className="lc-status-dot upcoming"></span>
                {t('liveCompetition.upcoming')}
              </h3>
              {upcomingCompetitions.map(comp => (
                <button
                  key={comp._id}
                  className="lc-competition-card lc-competition-upcoming"
                  onClick={() => setSelectedCompetition(comp)}
                >
                  <span className="lc-comp-name">{comp.name}</span>
                  {comp.startDate && (
                    <span className="lc-comp-date">
                      <FiCalendar /> {t('liveCompetition.startingOn')} {formatDate(comp.startDate)}
                    </span>
                  )}
                  <FiInfo className="lc-comp-info-icon" />
                </button>
              ))}
            </div>
          )}

          {/* Aucun concours */}
          {!loadingCompetitions && competitions.length === 0 && (
            <p className="lc-no-competitions">{t('liveCompetition.noCompetitions')}</p>
          )}
        </div>

        {/* Bouton Voir les Lives */}
        <button
          className="lc-see-lives-btn"
          onClick={() => setScreen('liveList')}
        >
          <FiEye />
          <span>{t('liveCompetition.seeLives')}</span>
        </button>

        {/* Modal détail concours */}
        <AnimatePresence>
          {selectedCompetition && (
            <motion.div
              className="lc-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCompetition(null)}
            >
              <motion.div
                className="lc-modal-card"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0,  opacity: 1 }}
                exit={{ y: 60,   opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="lc-modal-header">
                  <h3>{selectedCompetition.name}</h3>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setSelectedCompetition(null)}
                  >
                    <FiX />
                  </button>
                </div>
                {selectedCompetition.description && (
                  <p className="lc-modal-desc">{selectedCompetition.description}</p>
                )}
                {selectedCompetition.prize && (
                  <p className="lc-modal-prize">
                    🏆 {selectedCompetition.prize}
                  </p>
                )}
                {(selectedCompetition.startDate || selectedCompetition.endDate) && (
                  <p className="lc-modal-dates">
                    <FiCalendar />
                    {selectedCompetition.startDate && formatDate(selectedCompetition.startDate)}
                    {selectedCompetition.startDate && selectedCompetition.endDate && ' → '}
                    {selectedCompetition.endDate && formatDate(selectedCompetition.endDate)}
                  </p>
                )}
                {selectedCompetition.rules && (
                  <div className="lc-modal-rules">
                    <h4>{t('liveCompetition.rulesSection')}</h4>
                    <p>{selectedCompetition.rules}</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Écran liste des lives ──────────────────────────────────
  return (
    <div className="live-comp-container">
      <div className="live-comp-header">
        <button className="btn btn-ghost" onClick={() => setScreen('rules')}>
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

      {/* Barre de filtres */}
      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeFilter === tab.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.id)}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
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

      {/* Deux boutons fixes en bas : Démarrer + Team */}
      <div className="lc-bottom-actions">
        <button className="lc-fab-start" onClick={() => setIsStreaming(true)}>
          <FiPlay />
          <span>{t('liveCompetition.startBtn')}</span>
        </button>
        <button className="lc-fab-team" onClick={() => navigate('/stream/competition/team')}>
          <FiUsers />
          <span>{t('liveCompetition.teamBtn')}</span>
        </button>
      </div>

      <div className="live-comp-content lc-list-content">
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
            {stream.team?.tag && (
              <span
                className="lc-team-tag-badge"
                style={{ backgroundColor: stream.team.tagColor || '#6366F1' }}
              >
                [{stream.team.tag}]
              </span>
            )}
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
