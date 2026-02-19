import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiArrowLeft, FiPlay, FiUsers, FiClock
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

  // Si l'utilisateur est en streaming, afficher l'interface de live
  if (isStreaming) {
    return (
      <LiveStream
        mode="competition"
        onQuit={() => setIsStreaming(false)}
        streamerName={user?.displayName || user?.firstName || 'Streamer'}
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
