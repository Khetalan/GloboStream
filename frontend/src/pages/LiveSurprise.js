import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  FiArrowLeft, FiHeart, FiX, FiSkipForward, FiClock,
  FiSettings, FiVideo, FiVideoOff, FiMic, FiMicOff,
  FiRefreshCw, FiPlay
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import './LiveSurprise.css';

const LiveSurprise = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
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
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
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
      toast.error(t('liveSurprise.cameraError'));
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
      toast.error(t('liveSurprise.connectionError'));
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
        toast.success(t('liveSurprise.likeSent'));
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
      toast.error(t('liveSurprise.likeError'));
    }
  };

  const handleDecisionReceived = async ({ decision }) => {
    if (decision === 'like') {
      // Vérifier si match mutuel
      try {
        const response = await axios.get(`/api/surprise/check-mutual/${partner.userId}`);
        if (response.data.mutual) {
          toast.success(t('liveSurprise.itsAMatch'));
          navigate(`/chat/${partner.userId}`);
        }
      } catch (error) {
        console.error('Error checking mutual:', error);
      }
    }
  };

  const handleSkip = () => {
    if (!canSkip) {
      toast.error(t('liveSurprise.waitBeforeSkip'));
      return;
    }
    
    handleDecision('skip');
  };

  const handlePartnerDisconnect = () => {
    toast(t('liveSurprise.partnerDisconnected'), { icon: '👋' });
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
      {/* Header */}
      <div className="live-surprise-header">
        <button className="btn btn-ghost" onClick={stopAndExit}>
          <FiArrowLeft />
          {t('liveSurprise.quit')}
        </button>

        <div className="header-center">
          <FiVideo className="header-icon" />
          <span>{t('liveSurprise.title')}</span>
        </div>

        <button
          className="btn btn-ghost"
          onClick={() => setShowSettings(true)}
        >
          <FiSettings />
        </button>
      </div>

      <div className="live-surprise-main">

        {/* ── ÉCRAN D'ACCUEIL : bouton Démarrer ──────────────── */}
        {!isSearching && !isConnected && (
          <div className="start-screen">
            <div className="start-screen-content">
              <div className="start-icon-wrapper">
                <FiVideo size={48} />
              </div>
              <h2>{t('liveSurprise.introTitle')}</h2>
              <p>{t('liveSurprise.introDesc')}</p>

              <button className="start-btn" onClick={startSearch}>
                <FiPlay />
                <span>{t('liveSurprise.start')}</span>
              </button>

              <div className="start-timer-hint">
                <FiClock size={14} />
                <span>{timerDuration} {t('common.min')} par session</span>
              </div>
            </div>
          </div>
        )}

        {/* ── RECHERCHE EN COURS ─────────────────────────────── */}
        {isSearching && !isConnected && (
          <div className="searching-screen">
            <div className="searching-animation">
              <FiRefreshCw className="spinning" size={60} />
            </div>
            <h2>{t('liveSurprise.searching')}</h2>
            <p>{t('liveSurprise.searchingDesc')}</p>

            {/* PiP locale pendant la recherche */}
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
          </div>
        )}

        {/* ── APPEL VIDÉO : Streamer (PiP) + Participant (plein écran) ── */}
        {isConnected && (
          <div className="videocall-layout">
            {/* Vidéo du participant aléatoire — plein écran */}
            <div className="participant-video-container">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="participant-video"
                />
              ) : (
                <div className="participant-loading">
                  <FiRefreshCw className="spinning" size={40} />
                  <span>Connexion en cours...</span>
                </div>
              )}

              {partner && (
                <div className="partner-info">
                  <div className="partner-name">
                    {partner.displayName}, {partner.age}
                  </div>
                  {partner.location && (
                    <div className="partner-location">
                      {partner.location.city}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vidéo du streamer — petit cadre en haut à droite */}
            <div className="streamer-video-container">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="streamer-video"
              />
              {!videoEnabled && (
                <div className="video-disabled-overlay">
                  <FiVideoOff size={24} />
                </div>
              )}
            </div>

            {/* Timer */}
            {timeRemaining !== null && !showDecision && (
              <div className="timer-display">
                <FiClock />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            )}

            {/* Barre de contrôles */}
            {!showDecision && (
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

                {canSkip && (
                  <button
                    className="control-btn skip-btn"
                    onClick={handleSkip}
                  >
                    <FiSkipForward />
                    {t('liveSurprise.skip')}
                  </button>
                )}
              </div>
            )}

            {/* Panel de décision */}
            {showDecision && (
              <div className="decision-panel">
                <h3>{t('liveSurprise.timeUp')}</h3>
                <p>{t('liveSurprise.whatToDo')}</p>

                <div className="decision-buttons">
                  <button
                    className="decision-btn dislike-btn"
                    onClick={() => handleDecision('dislike')}
                  >
                    <FiX />
                    <span>{t('liveSurprise.pass')}</span>
                  </button>

                  <button
                    className="decision-btn like-btn"
                    onClick={() => handleDecision('like')}
                  >
                    <FiHeart />
                    <span>{t('liveSurprise.iLike')}</span>
                  </button>

                  <button
                    className="decision-btn skip-btn"
                    onClick={() => handleDecision('skip')}
                  >
                    <FiSkipForward />
                    <span>{t('common.next')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Vidéo locale sur l'écran d'accueil (hors recherche/appel) ── */}
        {!isSearching && !isConnected && localStream && (
          <div className="local-video-container">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="local-video"
            />
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="settings-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('liveSurprise.settingsTitle')}</h3>

            <div className="setting-group">
              <label>{t('liveSurprise.timerDuration')}</label>
              <div className="timer-options">
                {[3, 5, 8, 10].map((minutes) => (
                  <button
                    key={minutes}
                    className={`timer-option ${timerDuration === minutes ? 'active' : ''}`}
                    onClick={() => setTimerDuration(minutes)}
                    disabled={isConnected}
                  >
                    {minutes} {t('common.min')}
                  </button>
                ))}
              </div>
              <p className="setting-hint">
                {isConnected
                  ? t('liveSurprise.cannotChangeDuring')
                  : t('liveSurprise.minTimeBeforeDecision')}
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowSettings(false)}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSurprise;
