import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  FiArrowLeft, FiPlay, FiUsers, FiClock, FiEye
} from 'react-icons/fi';
import { BsFillTrophyFill } from 'react-icons/bs';
import Navigation from '../components/Navigation';
import LiveStream from '../components/LiveStream';
import { useAuth } from '../contexts/AuthContext';
import './LiveCompetition.css';

const LiveCompetition = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [isStreaming, setIsStreaming] = useState(false);
  const [liveRooms, setLiveRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await axios.get('/api/live/public', {
        params: { mode: 'competition' }
      });
      setLiveRooms(response.data.streams || []);
    } catch (error) {
      console.error('Error loading competition rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Si l'utilisateur est en streaming, afficher l'interface de live
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
        <h1>{t('streamHub.competitionTitle')}</h1>
        <Navigation />
      </div>

      <div className="live-comp-content">
        {/* Liste des lives en cours */}
        {!loadingRooms && liveRooms.length > 0 && (
          <div className="live-rooms-section">
            <h3 className="live-rooms-title">
              <span className="live-rooms-dot" />
              Lives en cours ({liveRooms.length})
            </h3>
            <div className="live-rooms-list">
              {liveRooms.map(room => (
                <div
                  key={room._id}
                  className="live-room-card"
                  onClick={() => navigate(`/stream/watch/live-${room._id}`)}
                >
                  <div className="live-room-avatar">
                    {(room.streamer?.displayName || room.streamer?.firstName || '?').charAt(0)}
                  </div>
                  <div className="live-room-info">
                    <span className="live-room-name">
                      {room.streamer?.displayName || room.streamer?.firstName}
                    </span>
                    <span className="live-room-title">{room.title}</span>
                  </div>
                  <div className="live-room-viewers">
                    <FiEye size={12} />
                    <span>{room.viewersCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Écran d'accueil avec bouton Démarrer */}
        <div className="live-comp-start-screen">
          <div className="live-comp-icon-wrapper">
            <BsFillTrophyFill size={48} />
          </div>

          <h2>{t('streamHub.competitionTitle')}</h2>
          <p className="live-comp-description">
            {t('streamHub.competitionDesc')}
          </p>

          <div className="live-comp-features">
            <div className="live-comp-feature">
              <FiUsers size={18} />
              <span>{t('streamHub.competitionFeature1')}</span>
            </div>
            <div className="live-comp-feature">
              <BsFillTrophyFill size={18} />
              <span>{t('streamHub.competitionFeature2')}</span>
            </div>
            <div className="live-comp-feature">
              <FiClock size={18} />
              <span>{t('streamHub.competitionFeature3')}</span>
            </div>
          </div>

          <button className="live-comp-start-btn" onClick={() => setIsStreaming(true)}>
            <FiPlay />
            <span>{t('liveStream.startLive')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveCompetition;
