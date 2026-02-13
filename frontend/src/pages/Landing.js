import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiHeart, FiVideo, FiMessageCircle, FiUsers } from 'react-icons/fi';
import './Landing.css';

const Landing = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <FiHeart />,
      title: 'Swipe & Match',
      description: t('landing.feature1')
    },
    {
      icon: <FiVideo />,
      title: 'Live Streaming',
      description: t('landing.feature2')
    },
    {
      icon: <FiMessageCircle />,
      title: 'Chat Instantané',
      description: t('landing.feature3')
    },
    {
      icon: <FiUsers />,
      title: 'Communauté Active',
      description: t('landing.feature4')
    }
  ];

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="container">
          <motion.div 
            className="logo"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiHeart className="logo-icon" />
            <span className="logo-text">Globostream</span>
          </motion.div>
          
          <motion.nav 
            className="nav"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link to="/login" className="nav-link">{t('landing.login')}</Link>
            <Link to="/register" className="btn btn-primary">{t('landing.signup')}</Link>
          </motion.nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="hero-title">
              {t('landing.heroTitle1')}
              <br />
              <span className="gradient-text">{t('landing.heroTitle2')}</span>
            </h1>
            <p className="hero-subtitle">
              {t('landing.heroDescription')}
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-large">
                {t('landing.ctaStart')}
              </Link>
              <button className="btn btn-outline btn-large">
                {t('landing.ctaLearnMore')}
              </button>
            </div>
          </motion.div>

          <motion.div 
            className="hero-image"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="swipe-demo">
                  <div className="profile-card-demo">
                    <div className="profile-image-demo"></div>
                    <div className="profile-info-demo">
                      <h3>{t('landing.mockupName')}</h3>
                      <p>{t('landing.mockupCity')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>{t('landing.featuresTitle')}</h2>
            <p>{t('landing.featuresSubtitle')}</p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2>{t('landing.ctaTitle')}</h2>
            <p>{t('landing.ctaSubtitle')}</p>
            <Link to="/register" className="btn btn-primary btn-large">
              {t('landing.ctaButton')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <FiHeart />
              <span>Globostream</span>
            </div>
            <p className="footer-text">
              {t('landing.footer')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
