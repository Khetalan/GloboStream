import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiHeart, FiMessageSquare, FiUsers, FiVideo, FiSettings, FiLifeBuoy
} from 'react-icons/fi';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const actions = [
    {
      icon: FiHeart,
      title: 'Swipe',
      description: 'Découvrez de nouveaux profils',
      color: 'var(--primary)',
      path: '/swipe'
    },
    {
      icon: FiMessageSquare,
      title: 'Messages',
      description: 'Discutez avec vos matchs',
      color: 'var(--secondary)',
      path: '/chat'
    },
    {
      icon: FiUsers,
      title: 'Matchs',
      description: 'Voir tous vos matchs',
      color: 'var(--success)',
      path: '/matches'
    },
    {
      icon: FiVideo,
      title: 'Stream',
      description: 'Rencontres en live vidéo',
      color: 'var(--error)',
      path: '/stream',
      badge: 'NEW'
    },
    {
      icon: FiSettings,
      title: 'Profil',
      description: 'Gérer votre profil',
      color: 'var(--warning)',
      path: '/profile'
    },
    {
      icon: FiLifeBuoy,
      title: 'Support',
      description: 'Besoin d\'aide ?',
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
          <h1>Bienvenue, {user?.displayName || user?.firstName} ✌️</h1>
          <p className="home-subtitle">Que souhaitez-vous faire aujourd'hui ?</p>
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
