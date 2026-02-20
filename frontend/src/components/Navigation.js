import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPhotoUrl } from '../utils/photoUrl';
import {
  FiHome, FiHeart, FiMessageSquare, FiUsers, FiVideo,
  FiUser, FiSettings, FiLogOut, FiLifeBuoy, FiChevronDown,
  FiShield, FiMenu, FiX
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bloquer le scroll body quand le menu est ouvert sur mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const closeMenu = () => setIsOpen(false);

  const isModerator = user?.privilegeLevel >= 1;

  const menuItems = [
    { icon: FiHome,          label: t('nav.home'),     path: '/home' },
    { icon: FiHeart,         label: t('nav.swipe'),    path: '/swipe' },
    { icon: FiMessageSquare, label: t('nav.messages'), path: '/chat' },
    { icon: FiUsers,         label: t('nav.matches'),  path: '/matches' },
    { icon: FiVideo,         label: t('nav.stream'),   path: '/stream' },
    { icon: FiUser,          label: t('nav.profile'),  path: '/profile' },
    { icon: FiSettings,      label: t('nav.settings'), path: '/settings' },
    { icon: FiLifeBuoy,      label: t('nav.support'),  path: '/support' }
  ];

  if (isModerator) {
    menuItems.splice(7, 0, {
      icon: FiShield,
      label: t('nav.moderation'),
      path: '/moderation',
      isModeration: true
    });
  }

  const avatarContent = user?.photos?.[0] ? (
    <img src={getPhotoUrl(user.photos[0].url)} alt={user.displayName || user.firstName} />
  ) : (
    <div className="avatar-placeholder">
      {(user?.displayName || user?.firstName || 'U').charAt(0)}
    </div>
  );

  return (
    <div className="navigation-container" ref={navRef}>

      {/* Bouton hamburger — visible sur mobile */}
      <button
        className="hamburger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('accessibility.menu')}
        aria-expanded={isOpen}
      >
        <div className="hamburger-avatar">{avatarContent}</div>
        {isOpen ? <FiX className="hamburger-icon" /> : <FiMenu className="hamburger-icon" />}
      </button>

      {/* Bouton dropdown — visible sur desktop */}
      <button
        className="nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="nav-toggle-avatar">{avatarContent}</div>
        <span className="nav-toggle-name">
          {user?.displayName || user?.firstName || 'Menu'}
        </span>
        <FiChevronDown className={`nav-toggle-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {/* Overlay backdrop — mobile uniquement */}
      {isOpen && (
        <div
          className="nav-overlay"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Panneau de navigation (slide depuis la droite sur mobile, dropdown sur desktop) */}
      <div className={`nav-panel ${isOpen ? 'open' : ''}`} role="dialog" aria-label={t('accessibility.navigation')}>

        {/* Bouton fermer (mobile) */}
        <button className="nav-panel-close" onClick={closeMenu} aria-label={t('accessibility.close')}>
          <FiX />
        </button>

        {/* En-tête profil */}
        <div className="nav-dropdown-header">
          <div className="nav-dropdown-avatar">{avatarContent}</div>
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

        <div className="nav-dropdown-divider" />

        {/* Items de navigation */}
        <nav className="nav-dropdown-menu">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`nav-dropdown-item ${item.isModeration ? 'moderation-item' : ''}`}
              onClick={closeMenu}
            >
              <item.icon className="nav-item-icon" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="nav-dropdown-divider" />

        {/* Déconnexion */}
        <button className="nav-dropdown-item logout-item" onClick={handleLogout}>
          <FiLogOut className="nav-item-icon" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Navigation;
