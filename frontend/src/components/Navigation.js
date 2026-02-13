import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiHome, FiHeart, FiMessageSquare, FiUsers, FiVideo,
  FiUser, FiSettings, FiLogOut, FiLifeBuoy, FiChevronDown,
  FiShield
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Vérifier si l'utilisateur est modérateur ou plus (privilegeLevel >= 1)
  const isModerator = user?.privilegeLevel >= 1;

  const menuItems = [
    { icon: FiHome, label: t('nav.home'), path: '/home' },
    { icon: FiHeart, label: t('nav.swipe'), path: '/swipe' },
    { icon: FiMessageSquare, label: t('nav.messages'), path: '/chat' },
    { icon: FiUsers, label: t('nav.matches'), path: '/matches' },
    { icon: FiVideo, label: t('nav.stream'), path: '/stream' },
    { icon: FiUser, label: t('nav.profile'), path: '/profile' },
    { icon: FiSettings, label: t('nav.settings'), path: '/settings' },
    { icon: FiLifeBuoy, label: t('nav.support'), path: '/support' }
  ];

  // Ajouter Modération si l'utilisateur est modérateur
  if (isModerator) {
    menuItems.splice(7, 0, { 
      icon: FiShield,
      label: t('nav.moderation'),
      path: '/moderation',
      isModeration: true
    });
  }

  return (
    <div className="navigation-container" ref={dropdownRef}>
      <button 
        className="nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="nav-toggle-avatar">
          {user?.photos?.[0] ? (
            <img src={user.photos[0].url} alt={user.displayName} />
          ) : (
            <div className="avatar-placeholder">
              {(user?.displayName || user?.firstName || 'U').charAt(0)}
            </div>
          )}
        </div>
        <span className="nav-toggle-name">
          {user?.displayName || user?.firstName || 'Menu'}
        </span>
        <FiChevronDown className={`nav-toggle-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="nav-dropdown">
          <div className="nav-dropdown-header">
            <div className="nav-dropdown-avatar">
              {user?.photos?.[0] ? (
                <img src={user.photos[0].url} alt={user.displayName} />
              ) : (
                <div className="avatar-placeholder">
                  {(user?.displayName || user?.firstName || 'U').charAt(0)}
                </div>
              )}
            </div>
            <div className="nav-dropdown-info">
              <h4>{user?.displayName || user?.firstName}</h4>
              {user?.email && <p>{user.email}</p>}
              {isModerator && (
                <span className="moderator-badge">
                  {user.privilegeLevel === 3 ? t('nav.superAdmin') :
                   user.privilegeLevel === 2 ? t('nav.admin') :
                   t('nav.moderator')}
                </span>
              )}
            </div>
          </div>

          <div className="nav-dropdown-divider"></div>

          <nav className="nav-dropdown-menu">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`nav-dropdown-item ${item.isModeration ? 'moderation-item' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="nav-item-icon" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="nav-dropdown-divider"></div>

          <button className="nav-dropdown-item logout-item" onClick={handleLogout}>
            <FiLogOut className="nav-item-icon" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Navigation;
