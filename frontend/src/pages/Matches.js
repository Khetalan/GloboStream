import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiHeart, FiEye, FiMessageCircle } from 'react-icons/fi';
import './Matches.css';

const Matches = () => {
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [likes, setLikes] = useState([]);
  const [views, setViews] = useState([]);
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
      toast.error('Erreur lors du chargement');
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
          <span>Mes Matchs</span>
        </div>
        <div style={{ width: 40 }}></div>
      </div>

      <div className="matches-tabs">
        <button 
          className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <FiHeart />
          Matchs ({matches.length})
        </button>
        <button 
          className={`tab ${activeTab === 'likes' ? 'active' : ''}`}
          onClick={() => setActiveTab('likes')}
        >
          <FiHeart />
          Likes ({likes.length})
        </button>
        <button 
          className={`tab ${activeTab === 'views' ? 'active' : ''}`}
          onClick={() => setActiveTab('views')}
        >
          <FiEye />
          Vues ({views.length})
        </button>
      </div>

      <div className="matches-content">
        {activeTab === 'matches' && (
          <div className="matches-grid">
            {matches.length === 0 ? (
              <div className="empty-message">
                <FiHeart size={60} />
                <p>Aucun match pour le moment</p>
                <button className="btn btn-primary" onClick={() => navigate('/swipe')}>
                  Commencer à swiper
                </button>
              </div>
            ) : (
              matches.map((match) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  onClick={() => navigate(`/chat/${match.user.id}`)}
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
                <p>Personne ne vous a encore liké</p>
              </div>
            ) : (
              likes.map((like) => (
                <LikeCard 
                  key={like.id} 
                  like={like}
                  onClick={() => toast('Version premium requise 💎')}
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
                <p>Personne n'a vu votre profil récemment</p>
              </div>
            ) : (
              views.map((view) => (
                <ViewCard 
                  key={view.id} 
                  view={view}
                  onClick={() => toast('Version premium requise 💎')}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MatchCard = ({ match, onClick }) => {
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
        <p>{match.user.location?.city || 'Ville inconnue'}</p>
      </div>
      <button className="chat-btn">
        <FiMessageCircle />
      </button>
    </div>
  );
};

const LikeCard = ({ like, onClick }) => {
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
          💎 Premium
        </div>
      </div>
    </div>
  );
};

const ViewCard = ({ view, onClick }) => {
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
          💎 Premium
        </div>
      </div>
    </div>
  );
};

export default Matches;
