import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiVideo, FiShuffle, FiGlobe, FiTrophy, FiCalendar, FiArrowLeft, FiUsers, FiClock } from 'react-icons/fi';
import Navigation from '../components/Navigation';
import './LiveStream.css';

const LiveStream = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState(null);
  const [liveStats, setLiveStats] = useState({
    surprise: 0,
    public: 0,
    competition: 0,
    event: 0
  });

  useEffect(() => {
    // Charger les statistiques de streams actifs
    loadLiveStats();
  }, []);

  const loadLiveStats = async () => {
    // TODO: Appel API pour stats réelles
    setLiveStats({
      surprise: 127,
      public: 45,
      competition: 8,
      event: 3
    });
  };

  const sections = [
    {
      id: 'surprise',
      title: t('streamHub.surpriseTitle'),
      icon: FiShuffle,
      description: t('streamHub.surpriseDesc'),
      gradient: 'linear-gradient(135deg, #FF3366, #FF6B9D)',
      features: [
        t('streamHub.surpriseFeature1'),
        t('streamHub.surpriseFeature2'),
        t('streamHub.surpriseFeature3'),
        t('streamHub.surpriseFeature4')
      ],
      path: '/live/surprise',
      badge: t('streamHub.hot'),
      activeUsers: liveStats.surprise
    },
    {
      id: 'public',
      title: t('streamHub.publicTitle'),
      icon: FiGlobe,
      description: t('streamHub.publicDesc'),
      gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      features: [
        t('streamHub.publicFeature1'),
        t('streamHub.publicFeature2'),
        t('streamHub.publicFeature3'),
        t('streamHub.publicFeature4')
      ],
      path: '/live/public',
      badge: t('streamHub.new'),
      activeUsers: liveStats.public
    },
    {
      id: 'competition',
      title: t('streamHub.competitionTitle'),
      icon: FiGlobe,
      description: t('streamHub.competitionDesc'),
      gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
      features: [
        t('streamHub.competitionFeature1'),
        t('streamHub.competitionFeature2'),
        t('streamHub.competitionFeature3'),
        t('streamHub.competitionFeature4')
      ],
      path: '/live/competition',
      badge: t('streamHub.soon'),
      activeUsers: liveStats.competition
    },
    {
      id: 'event',
      title: t('streamHub.eventTitle'),
      icon: FiCalendar,
      description: t('streamHub.eventDesc'),
      gradient: 'linear-gradient(135deg, #22C55E, #10B981)',
      features: [
        t('streamHub.eventFeature1'),
        t('streamHub.eventFeature2'),
        t('streamHub.eventFeature3'),
        t('streamHub.eventFeature4')
      ],
      path: '/live/event',
      badge: t('streamHub.premiumBadge'),
      activeUsers: liveStats.event
    }
  ];

  return (
    <div className="livestream-container">
      <div className="livestream-header">
        <button className="btn btn-ghost" onClick={() => navigate('/stream')}>
          <FiArrowLeft />
        </button>
        <div className="logo">
          <FiVideo className="logo-icon" />
          <span>{t('streamHub.title')}</span>
        </div>
        <Navigation />
      </div>

      <div className="livestream-content">
        <div className="hero-section">
          <h1>{t('streamHub.heroTitle')}</h1>
          <p className="hero-subtitle">
            {t('streamHub.heroSubtitle')}
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <FiUsers className="stat-icon" />
              <div className="stat-info">
                <strong>{Object.values(liveStats).reduce((a, b) => a + b, 0)}</strong>
                <span>{t('streamHub.onlineNow')}</span>
              </div>
            </div>
            <div className="stat-item">
              <FiVideo className="stat-icon" />
              <div className="stat-info">
                <strong>4</strong>
                <span>{t('streamHub.modesAvailable')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sections-grid">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onSelect={() => navigate(section.path)}
              t={t}
            />
          ))}
        </div>

        <div className="info-banner">
          <FiClock />
          <div>
            <h3>{t('streamHub.howItWorks')}</h3>
            <p>{t('streamHub.howItWorksDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ section, onSelect, t }) => {
  const Icon = section.icon;

  return (
    <div 
      className="section-card"
      onClick={onSelect}
      style={{ '--gradient': section.gradient }}
    >
      <div className="card-gradient"></div>
      
      {section.badge && (
        <div className={`section-badge ${section.badge.toLowerCase()}`}>
          {section.badge}
        </div>
      )}

      <div className="card-icon">
        <Icon />
      </div>

      <h2>{section.title}</h2>
      <p className="card-description">{section.description}</p>

      <ul className="card-features">
        {section.features.map((feature, index) => (
          <li key={index}>
            <span className="feature-bullet">•</span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="card-footer">
        <div className="active-users">
          <FiUsers />
          <span>{section.activeUsers} {t('streamHub.online')}</span>
        </div>
        <button className="btn-card-action">
          {t('streamHub.join')}
          <Icon size={18} />
        </button>
      </div>
    </div>
  );
};

export default LiveStream;
