import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiHeart, FiEye, FiMessageCircle } from 'react-icons/fi';
import './Matches.css';

const Matches = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [likes, setLikes] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [views, setViews] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const matchesRes = await axios.get('/api/matches');
      setMatches(matchesRes.data.matches || []);
      
      // Pour l'instant, simulons des likes et vues
      //setLikes([
        //{ id: 1, name: 'Sophie', age: 26, photo: null, isBlurred: true },
        //{ id: 2, name: 'Marie', age: 24, photo: null, isBlurred: true },
      //]);
      
      //setViews([
        //{ id: 3, name: 'Julie', age: 28, photo: null, isBlurred: true },
      //]);
    } catch (error) {
      toast.error(t('matches.loadError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="matches-container">
      <div className="matches-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <div className="logo">
          <FiHeart className="logo-icon" />
          <span>{t('matches.title')}</span>
        </div>
        <div style={{ width: 40 }}></div>
      </div>

      <div className="matches-tabs">
        <button 
          className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <FiHeart />
          {t('matches.tabMatches')} ({matches.length})
        </button>
        <button
          className={`tab ${activeTab === 'likes' ? 'active' : ''}`}
          onClick={() => setActiveTab('likes')}
        >
          <FiHeart />
          {t('matches.tabLikes')} ({likes.length})
        </button>
        <button
          className={`tab ${activeTab === 'views' ? 'active' : ''}`}
          onClick={() => setActiveTab('views')}
        >
          <FiEye />
          {t('matches.tabViews')} ({views.length})
        </button>
      </div>

      <div className="matches-content">
        {activeTab === 'matches' && (
          <div className="matches-grid">
            {matches.length === 0 ? (
              <div className="empty-message">
                <FiHeart size={60} />
                <p>{t('matches.noMatches')}</p>
                <button className="btn btn-primary" onClick={() => navigate('/swipe')}>
                  {t('matches.startSwiping')}
                </button>
              </div>
            ) : (
              matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => navigate(`/chat/${match.user.id}`)}
                  t={t}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'likes' && (
          <div className="matches-grid">
            {likes.length === 0 ? (
              <div className="empty-message">
                <FiHeart size={60} />
                <p>{t('matches.noLikes')}</p>
              </div>
            ) : (
              likes.map((like) => (
                <LikeCard
                  key={like.id}
                  like={like}
                  onClick={() => toast(t('matches.premiumRequired'))}
                  t={t}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'views' && (
          <div className="matches-grid">
            {views.length === 0 ? (
              <div className="empty-message">
                <FiEye size={60} />
                <p>{t('matches.noViews')}</p>
              </div>
            ) : (
              views.map((view) => (
                <ViewCard
                  key={view.id}
                  view={view}
                  onClick={() => toast(t('matches.premiumRequired'))}
                  t={t}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MatchCard = ({ match, onClick, t }) => {
  const primaryPhoto = match.user.photos?.find(p => p.isPrimary) || match.user.photos?.[0];

  return (
    <div className="match-card" onClick={onClick}>
      <div className="match-photo">
        {primaryPhoto ? (
          <img src={primaryPhoto.url} alt={match.user.displayName} />
        ) : (
          <div className="placeholder">
            <FiHeart size={40} />
          </div>
        )}
      </div>
      <div className="match-info">
        <h3>{match.user.displayName}, {match.user.age}</h3>
        <p>{match.user.location?.city || t('matches.unknownCity')}</p>
      </div>
      <button className="chat-btn">
        <FiMessageCircle />
      </button>
    </div>
  );
};

const LikeCard = ({ like, onClick, t }) => {
  return (
    <div className="match-card blurred" onClick={onClick}>
      <div className="match-photo">
        <div className="placeholder blurred-placeholder">
          <FiHeart size={40} />
        </div>
      </div>
      <div className="match-info">
        <h3>{like.name}, {like.age}</h3>
        <div className="premium-badge">
          {t('matches.premium')}
        </div>
      </div>
    </div>
  );
};

const ViewCard = ({ view, onClick, t }) => {
  return (
    <div className="match-card blurred" onClick={onClick}>
      <div className="match-photo">
        <div className="placeholder blurred-placeholder">
          <FiEye size={40} />
        </div>
      </div>
      <div className="match-info">
        <h3>{view.name}, {view.age}</h3>
        <div className="premium-badge">
          {t('matches.premium')}
        </div>
      </div>
    </div>
  );
};

export default Matches;
