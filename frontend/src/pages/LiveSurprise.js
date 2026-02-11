import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, FiHeart, FiX, FiSkipForward, FiClock, 
  FiSettings, FiVideo, FiVideoOff, FiMic, FiMicOff,
  FiRefreshCw
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import './LiveSurprise.css';

const LiveSurprise = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [, setSocket] = useState(null);
  const [, setPeer] = useState(null);
  
  // États de connexion
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [partner, setPartner] = useState(null);
  
  // États médias
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // États timer et configuration
  const [timerDuration, setTimerDuration] = useState(3); // minutes
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);
  const [showDecision, setShowDecision] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  
  // États UI
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const socketRef = useRef();
  const peerRef = useRef();

  useEffect(() => {
    // Initialiser Socket.IO
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join-surprise-queue', { userId: user._id });
    });

    newSocket.on('partner-found', handlePartnerFound);
    newSocket.on('partner-disconnected', handlePartnerDisconnect);
    newSocket.on('receive-signal', handleReceiveSignal);
    newSocket.on('decision-received', handleDecisionReceived);

    return () => {
      cleanup();
      newSocket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Impossible d\'accéder à la caméra/micro');
      return null;
    }
  };

  const startSearch = async () => {
    const stream = await startLocalStream();
    if (!stream) return;

    setIsSearching(true);
    socketRef.current.emit('start-search', { 
      userId: user._id,
      timerDuration: timerDuration 
    });
  };

  const handlePartnerFound = async ({ partner: partnerData, initiator }) => {
    setPartner(partnerData);
    setIsSearching(false);
    setIsConnected(true);
    
    // Créer connexion WebRTC
    const newPeer = new Peer({
      initiator: initiator,
      trickle: false,
      stream: localStream
    });

    newPeer.on('signal', (signal) => {
      socketRef.current.emit('send-signal', {
        to: partnerData.userId,
        signal: signal
      });
    });

    newPeer.on('stream', (stream) => {
      setRemoteStream(stream);
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
      toast.error('Erreur de connexion');
    });

    setPeer(newPeer);
    peerRef.current = newPeer;

    // Démarrer le timer
    startTimer();
  };

  const handleReceiveSignal = ({ from, signal }) => {
    if (peerRef.current) {
      peerRef.current.signal(signal);
    }
  };

  const startTimer = () => {
    const duration = timerDuration * 60; // en secondes
    setTimeRemaining(duration);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimerEnd();
          return 0;
        }
        
        // Permettre skip après 0 secondes
        if (prev === (duration - 180)) {
          setCanSkip(true);
        }
        
        return prev - 1;
      });
    }, 1000);

    setTimerInterval(interval);
  };

  const handleTimerEnd = () => {
    setShowDecision(true);
    setCanSkip(false);
  };

  const handleDecision = async (decision) => {
    // decision: 'like', 'dislike', 'skip'
    
    try {
      socketRef.current.emit('send-decision', {
        partnerId: partner.userId,
        decision: decision
      });

      if (decision === 'like') {
        await axios.post(`/api/swipe/like/${partner.userId}`);
        toast.success('Like envoyé ! 💕');
      }

      setShowDecision(false);
      cleanup();
      
      if (decision === 'skip') {
        startSearch(); // Nouvelle recherche
      } else {
        setIsConnected(false);
      }
      
    } catch (error) {
      console.error('Error sending decision:', error);
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const handleDecisionReceived = async ({ decision }) => {
    if (decision === 'like') {
      // Vérifier si match mutuel
      try {
        const response = await axios.get(`/api/surprise/check-mutual/${partner.userId}`);
        if (response.data.mutual) {
          toast.success('🎉 C\'est un match ! Vous pouvez continuer en privé');
          navigate(`/chat/${partner.userId}`);
        }
      } catch (error) {
        console.error('Error checking mutual:', error);
      }
    }
  };

  const handleSkip = () => {
    if (!canSkip) {
      toast.error('Attendez au moins 30 secondes avant de skip');
      return;
    }
    
    handleDecision('skip');
  };

  const handlePartnerDisconnect = () => {
    toast('Votre partenaire s\'est déconnecté', { icon: '👋' });
    cleanup();
    setIsConnected(false);
  };

  const cleanup = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
      setPeer(null);
    }
    
    setRemoteStream(null);
    setPartner(null);
    setTimeRemaining(null);
    setShowDecision(false);
    setCanSkip(false);
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  const stopAndExit = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    cleanup();
    navigate('/live');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="live-surprise-container">
      <div className="live-surprise-header">
        <button className="btn btn-ghost" onClick={stopAndExit}>
          <FiArrowLeft />
          Quitter
        </button>
        
        <div className="header-center">
          <FiVideo className="header-icon" />
          <span>Live Surprise</span>
        </div>
        
        <button 
          className="btn btn-ghost"
          onClick={() => setShowSettings(true)}
        >
          <FiSettings />
        </button>

      </div>

      <div className="live-surprise-main">
        {/* Vidéo du partenaire (grande) */}
        <div className="remote-video-container">
          {isConnected && remoteStream ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="remote-video"
              />
              
              {partner && (
                <div className="partner-info">
                  <div className="partner-name">
                    {partner.displayName}, {partner.age}
                  </div>
                  {partner.location && (
                    <div className="partner-location">
                      📍 {partner.location.city}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : isSearching ? (
            <div className="searching-state">
              <div className="searching-animation">
                <FiRefreshCw className="spinning" size={60} />
              </div>
              <h2>Recherche en cours...</h2>
              <p>Nous cherchons quelqu'un pour vous</p>
            </div>
          ) : (
            <div className="waiting-state">
              <FiVideo size={80} />
              <h2>Live Surprise</h2>
              <p>Rencontrez des personnes aléatoirement en vidéo</p>
              <button 
                className="btn btn-primary btn-large"
                onClick={startSearch}
              >
                <FiVideo />
                Commencer
              </button>
            </div>
          )}
        </div>

        {/* Vidéo locale (petite, coin) */}
        <div className="local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="local-video"
          />
          {!videoEnabled && (
            <div className="video-disabled-overlay">
              <FiVideoOff size={32} />
            </div>
          )}
        </div>

        {/* Timer */}
        {isConnected && timeRemaining !== null && !showDecision && (
          <div className="timer-display">
            <FiClock />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        )}

        {/* Contrôles */}
        {isConnected && (
          <div className="controls-bar">
            <button 
              className={`control-btn ${!audioEnabled ? 'disabled' : ''}`}
              onClick={toggleAudio}
            >
              {audioEnabled ? <FiMic /> : <FiMicOff />}
            </button>
            
            <button 
              className={`control-btn ${!videoEnabled ? 'disabled' : ''}`}
              onClick={toggleVideo}
            >
              {videoEnabled ? <FiVideo /> : <FiVideoOff />}
            </button>
            
            {canSkip && !showDecision && (
              <button 
                className="control-btn skip-btn"
                onClick={handleSkip}
              >
                <FiSkipForward />
                Skip
              </button>
            )}
          </div>
        )}

        {/* Panel de décision */}
        {showDecision && (
          <div className="decision-panel">
            <h3>Temps écoulé !</h3>
            <p>Que souhaitez-vous faire ?</p>
            
            <div className="decision-buttons">
              <button 
                className="decision-btn dislike-btn"
                onClick={() => handleDecision('dislike')}
              >
                <FiX />
                <span>Passer</span>
              </button>
              
              <button 
                className="decision-btn like-btn"
                onClick={() => handleDecision('like')}
              >
                <FiHeart />
                <span>J'aime</span>
              </button>
              
              <button 
                className="decision-btn skip-btn"
                onClick={() => handleDecision('skip')}
              >
                <FiSkipForward />
                <span>Suivant</span>
              </button>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="settings-modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Paramètres</h3>
              
              <div className="setting-group">
                <label>Durée du timer</label>
                <div className="timer-options">
                  {[3, 5, 8, 10].map((minutes) => (
                    <button
                      key={minutes}
                      className={`timer-option ${timerDuration === minutes ? 'active' : ''}`}
                      onClick={() => setTimerDuration(minutes)}
                      disabled={isConnected}
                    >
                      {minutes} min
                    </button>
                  ))}
                </div>
                <p className="setting-hint">
                  {isConnected ? 'Vous ne pouvez pas changer pendant une session' : 'Temps minimum avant décision'}
                </p>
              </div>
              
              <button 
                className="btn btn-primary"
                onClick={() => setShowSettings(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSurprise;
