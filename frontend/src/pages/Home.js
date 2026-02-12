import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiHeart, FiMessageSquare, FiUsers, FiVideo, FiSettings, FiLifeBuoy
} from 'react-icons/fi';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const actions = [
    {
      icon: FiHeart,
      title: t('home.swipe'),
      description: t('home.swipeDesc'),
      color: 'var(--primary)',
      path: '/swipe'
    },
    {
      icon: FiMessageSquare,
      title: t('home.messages'),
      description: t('home.messagesDesc'),
      color: 'var(--secondary)',
      path: '/chat'
    },
    {
      icon: FiUsers,
      title: t('home.matches'),
      description: t('home.matchesDesc'),
      color: 'var(--success)',
      path: '/matches'
    },
    {
      icon: FiVideo,
      title: t('home.stream'),
      description: t('home.streamDesc'),
      color: 'var(--error)',
      path: '/stream',
      badge: t('home.new')
    },
    {
      icon: FiSettings,
      title: t('home.profile'),
      description: t('home.profileDesc'),
      color: 'var(--warning)',
      path: '/profile'
    },
    {
      icon: FiLifeBuoy,
      title: t('home.support'),
      description: t('home.supportDesc'),
      color: '#6366F1',
      path: '/support'
    }
  ];

  return (
    <div className="home-container">
      {/* Header avec Navigation en haut à droite */}
      <div className="home-header-bar">
        <div className="home-logo">
          <FiHeart className="logo-icon" />
          <span>Globostream</span>
        </div>
        <Navigation />
      </div>

      <div className="home-content">
        <div className="home-header">
          <h1>{t('home.welcome', { name: user?.displayName || user?.firstName })}</h1>
          <p className="home-subtitle">{t('home.subtitle')}</p>
        </div>

        <div className="actions-grid">
          {actions.map((action, index) => (
            <ActionCard
              key={index}
              action={action}
              onClick={() => navigate(action.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ action, onClick }) => {
  const Icon = action.icon;

  return (
    <div 
      className="action-card"
      onClick={onClick}
      style={{ '--card-color': action.color }}
    >
      {action.badge && (
        <div className="action-badge">{action.badge}</div>
      )}
      
      <div className="action-icon">
        <Icon />
      </div>
      
      <h3>{action.title}</h3>
      <p>{action.description}</p>
      
      <div className="action-arrow">→</div>
    </div>
  );
};

export default Home;
