import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiRefreshCw, FiMic, FiMicOff, FiVideo, FiVideoOff, FiX, FiHeart, FiThumbsDown } from 'react-icons/fi';
import './LiveSurprise.css';

const LiveSurprise = () => {
  const { t } = useTranslation();
  const [screen, setScreen] = useState('start'); // 'start', 'searching', 'videocall', 'decision'
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [timer, setTimer] = useState(180); // 3 minutes

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const startTimer = useCallback(() => {
    setTimer(180);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setScreen('decision');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  }, []);

  useEffect(() => {
    // Cleanup timer on component unmount
    return () => stopTimer();
  }, [stopTimer]);

  const toggleUiVisibility = useCallback(() => {
    if (screen === 'videocall') {
      setIsUiVisible(prev => !prev);
    }
  }, [screen]);

  const handleStart = () => {
    setScreen('searching');
    // Simulate finding a partner
    setTimeout(() => {
      setScreen('videocall');
      startTimer();
    }, 3000);
  };

  const handleSkip = useCallback(() => {
    stopTimer();
    setScreen('searching');
    setTimeout(() => {
      setScreen('videocall');
      startTimer();
    }, 3000);
  }, [startTimer, stopTimer]);

  const handleDecision = (decision) => {
    console.log(`Decision: ${decision}`);
    handleSkip(); // Move to the next partner after decision
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const uiAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  };

  const renderStartScreen = () => (
    <div className="lspr-start-screen">
      <div className="lspr-start-screen-content">
        <div className="lspr-start-icon-wrapper">
          <FiVideo size={40} />
        </div>
        <h2>{t('liveSurprise.title') || 'Live Surprise'}</h2>
        <p>{t('liveSurprise.description') || 'Rencontrez des inconnus aléatoirement.'}</p>
        <button className="lspr-start-btn" onClick={handleStart}>
          <FiPlay />
          <span>{t('liveSurprise.startBtn') || 'Démarrer'}</span>
        </button>
        <span className="lspr-start-timer-hint">{t('liveSurprise.timerHint') || '3 min par appel'}</span>
      </div>
    </div>
  );

  const renderSearchingScreen = () => (
    <div className="lspr-searching-screen">
      <div className="lspr-searching-animation">
        <FiRefreshCw size={48} />
      </div>
      <p>{t('liveSurprise.searching') || 'Recherche en cours...'}</p>
      <div className="lspr-streamer-video-container searching-pip">
        <video ref={localVideoRef} autoPlay playsInline muted className="lspr-streamer-video" />
      </div>
    </div>
  );

  const renderVideoCallScreen = () => (
    <div className="lspr-videocall-layout" onClick={toggleUiVisibility}>
      <div className="lspr-participant-video-container">
        <video ref={remoteVideoRef} autoPlay playsInline className="lspr-participant-video" />
      </div>
      <div className="lspr-streamer-video-container">
        <video ref={localVideoRef} autoPlay playsInline muted className="lspr-streamer-video" />
      </div>

      <AnimatePresence>
        {isUiVisible && (
          <motion.div className="lspr-ui-overlay" {...uiAnimation}>
            <div className="lspr-top-bar">
              <div className="lspr-timer">{formatTime(timer)}</div>
            </div>
            <div className="lspr-bottom-bar">
              <button className={`lspr-control-btn ${isMuted ? 'off' : ''}`} onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}>
                {isMuted ? <FiMicOff size={22} /> : <FiMic size={22} />}
              </button>
              <button className={`lspr-control-btn ${isCamOff ? 'off' : ''}`} onClick={(e) => { e.stopPropagation(); setIsCamOff(!isCamOff); }}>
                {isCamOff ? <FiVideoOff size={22} /> : <FiVideo size={22} />}
              </button>
              <button className="lspr-control-btn skip" onClick={(e) => { e.stopPropagation(); handleSkip(); }}>
                <FiX size={22} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screen === 'decision' && (
          <div className="lspr-decision-overlay">
            <motion.div
              className="lspr-decision-panel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h3>{t('liveSurprise.sessionEnded') || 'Session terminée'}</h3>
              <p>{t('liveSurprise.doYouLike') || 'Ce profil vous a plu ?'}</p>
              <div className="lspr-decision-actions">
                <button className="decision-btn dislike" onClick={() => handleDecision('dislike')}>
                  <FiThumbsDown size={28} />
                </button>
                <button className="decision-btn like" onClick={() => handleDecision('like')}>
                  <FiHeart size={28} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  if (screen === 'start') return renderStartScreen();
  if (screen === 'searching') return renderSearchingScreen();
  return renderVideoCallScreen();
};

export default LiveSurprise;