import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiVideo, FiShuffle, FiGlobe, FiCalendar, FiArrowLeft, FiUsers, FiClock } from 'react-icons/fi';
import { BsFillTrophyFill } from "react-icons/bs";
import Navigation from '../components/Navigation';
import './StreamHub.css';

const StreamHub = () => {
  const navigate = useNavigate();
  const [liveStats, setLiveStats] = useState({
    surprise: 0,
    public: 0,
    competition: 0,
    event: 0
  });

  useEffect(() => {
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
      title: 'Live Surprise',
      icon: FiShuffle,
      description: 'Rencontre aléatoire en vidéo - Type Chatroulette + Speed Dating',
      gradient: 'linear-gradient(135deg, #FF3366, #FF6B9D)',
      features: [
        'Connexion aléatoire instantanée',
        'Timer 3-10 minutes réglable',
        'Like/Dislike après le temps',
        'Changement rapide si souhaité'
      ],
      path: '/stream/surprise',
      badge: 'HOT',
      activeUsers: liveStats.surprise
    },
    {
      id: 'public',
      title: 'Live Publique',
      icon: FiGlobe,
      description: 'Streams publics visibles par tous',
      gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      features: [
        'Diffusion publique',
        'Chat en direct',
        'Dons et cadeaux virtuels',
        'Enregistrements possibles'
      ],
      path: '/stream/live',
      badge: 'NOUVEAU',
      activeUsers: liveStats.public
    },
    {
      id: 'competition',
      title: 'Live de Compétition',
      icon: BsFillTrophyFill,
      description: 'Compétitions et défis en direct',
      gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
      features: [
        'Défis en temps réel',
        'Classements live',
        'Prix et récompenses',
        'Votes du public'
      ],
      path: '/stream/competition',
      badge: 'SOON',
      activeUsers: liveStats.competition
    },
    {
      id: 'event',
      title: 'Live Événementiel',
      icon: FiCalendar,
      description: 'Événements spéciaux et soirées thématiques',
      gradient: 'linear-gradient(135deg, #22C55E, #10B981)',
      features: [
        'Soirées à thème',
        'Speed dating collectif',
        'Événements exclusifs',
        'Animations spéciales'
      ],
      path: '/stream/event',
      badge: 'PREMIUM',
      activeUsers: liveStats.event
    }
  ];

  return (
    <div className="stream-hub-container">
      <div className="stream-hub-header">
        <button className="btn btn-ghost" onClick={() => navigate('/home')}>
          <FiArrowLeft />
        </button>
        <div className="logo">
          <FiVideo className="logo-icon" />
          <span>Live Streaming</span>
        </div>
        <Navigation />
      </div>

      <div className="stream-hub-content">
        <div className="hero-section">
          <h1>Rencontres en Live</h1>
          <p className="hero-subtitle">
            Connectez-vous instantanément avec des personnes réelles en vidéo
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <FiUsers className="stat-icon" />
              <div className="stat-info">
                <strong>{Object.values(liveStats).reduce((a, b) => a + b, 0)}</strong>
                <span>En ligne maintenant</span>
              </div>
            </div>
            <div className="stat-item">
              <FiVideo className="stat-icon" />
              <div className="stat-info">
                <strong>4</strong>
                <span>Modes disponibles</span>
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
            />
          ))}
        </div>

        <div className="info-banner">
          <FiClock />
          <div>
            <h3>Comment ça marche ?</h3>
            <p>Choisissez un mode de rencontre, activez votre caméra et commencez à vous connecter !</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ section, onSelect }) => {
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
          <span>{section.activeUsers} en ligne</span>
        </div>
        <button className="btn-card-action">
          Rejoindre
          <Icon size={18} />
        </button>
      </div>
    </div>
  );
};

export default StreamHub;
