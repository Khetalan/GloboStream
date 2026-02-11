import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiVideo, FiMessageCircle, FiUsers } from 'react-icons/fi';
import './Landing.css';

const Landing = () => {
  const features = [
    {
      icon: <FiHeart />,
      title: 'Swipe & Match',
      description: 'Faites glisser pour découvrir des profils qui vous correspondent'
    },
    {
      icon: <FiVideo />,
      title: 'Live Streaming',
      description: 'Lancez des streams en direct et connectez-vous en temps réel'
    },
    {
      icon: <FiMessageCircle />,
      title: 'Chat Instantané',
      description: 'Discutez avec vos matchs en temps réel'
    },
    {
      icon: <FiUsers />,
      title: 'Communauté Active',
      description: 'Rejoignez une communauté de personnes qui cherchent l\'amour'
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
            <Link to="/login" className="nav-link">Connexion</Link>
            <Link to="/register" className="btn btn-primary">S'inscrire</Link>
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
              Rencontrez l'amour
              <br />
              <span className="gradient-text">En direct</span>
            </h1>
            <p className="hero-subtitle">
              La première plateforme de rencontres avec streaming en direct.
              Connectez-vous authentiquement, matchez intelligemment.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-large">
                Commencer gratuitement
              </Link>
              <button className="btn btn-outline btn-large">
                En savoir plus
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
                      <h3>Sophie, 26</h3>
                      <p>Paris, France</p>
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
            <h2>Fonctionnalités uniques</h2>
            <p>Tout ce dont vous avez besoin pour trouver l'amour</p>
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
            <h2>Prêt à trouver l'amour ?</h2>
            <p>Rejoignez des milliers de célibataires dès aujourd'hui</p>
            <Link to="/register" className="btn btn-primary btn-large">
              Créer mon compte gratuitement
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
              © 2026 Globostream. Trouvez l'amour en direct.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
