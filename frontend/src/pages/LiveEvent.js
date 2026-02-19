import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiArrowLeft, FiPlay, FiUsers, FiClock
} from 'react-icons/fi';
import { BsCalendarEvent } from 'react-icons/bs';
import Navigation from '../components/Navigation';
import LiveStream from '../components/LiveStream';
import { useAuth } from '../contexts/AuthContext';
import './LiveEvent.css';

const LiveEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [isStreaming, setIsStreaming] = useState(false);

  // Si l'utilisateur est en streaming, afficher l'interface de live
  if (isStreaming) {
    return (
      <LiveStream
        mode="event"
        onQuit={() => setIsStreaming(false)}
        streamerName={user?.displayName || user?.firstName || 'Streamer'}
      />
    );
  }

  return (
    <div className="live-event-container">
      <div className="live-event-header">
        <button className="btn btn-ghost" onClick={() => navigate('/stream')}>
          <FiArrowLeft />
        </button>
        <h1>{t('streamHub.eventTitle')}</h1>
        <Navigation />
      </div>

      <div className="live-event-content">
        {/* Écran d'accueil avec bouton Démarrer */}
        <div className="live-event-start-screen">
          <div className="live-event-icon-wrapper">
            <BsCalendarEvent size={48} />
          </div>

          <h2>{t('streamHub.eventTitle')}</h2>
          <p className="live-event-description">
            {t('streamHub.eventDesc')}
          </p>

          <div className="live-event-features">
            <div className="live-event-feature">
              <FiUsers size={18} />
              <span>{t('streamHub.eventFeature1')}</span>
            </div>
            <div className="live-event-feature">
              <BsCalendarEvent size={18} />
              <span>{t('streamHub.eventFeature2')}</span>
            </div>
            <div className="live-event-feature">
              <FiClock size={18} />
              <span>{t('streamHub.eventFeature3')}</span>
            </div>
          </div>

          <button className="live-event-start-btn" onClick={() => setIsStreaming(true)}>
            <FiPlay />
            <span>{t('liveStream.startLive')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveEvent;
