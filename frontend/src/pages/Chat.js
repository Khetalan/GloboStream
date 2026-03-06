import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { getPhotoUrl } from '../utils/photoUrl';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import {
  FiArrowLeft, FiHeart, FiSend, FiImage, FiMoreVertical,
  FiPhone, FiVideo, FiSearch, FiSmile, FiUserX, FiFlag
} from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import './Chat.css';
import MessageRequestsPanel from '../components/MessageRequestsPanel';
import ReportModal from '../components/ReportModal';

let socket;

const Chat = () => {
  const { t } = useTranslation();
  const { userId: chatUserId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showConvMenu, setShowConvMenu] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const convMenuRef = useRef(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetMsg, setReportTargetMsg] = useState(null);

  useEffect(() => {
    // Connexion WebSocket
    socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    
    socket.on('connect', () => {
      socket.emit('register', currentUser.id);
    });

    socket.on('newMessage', (data) => {
      if (data.from === selectedConversation?.user.id) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
      // Recharger les conversations pour mettre à jour le dernier message
      loadConversations();
    });

    socket.on('userTyping', (data) => {
      if (data.userId === selectedConversation?.user.id) {
        setIsTyping(data.isTyping);
      }
    });

    loadConversations();

    return () => {
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  useEffect(() => {
    if (chatUserId) {
      const conversation = conversations.find(c => c.user.id === chatUserId);
      if (conversation) {
        handleSelectConversation(conversation);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatUserId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/chat/conversations');
      setConversations(response.data.conversations || []);
    } catch (error) {
      toast.error(t('chat.loadConversationsError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/chat/${conversation.user.id}`);
    
    try {
      const response = await axios.get(`/api/chat/${conversation.user.id}`);
      setMessages(response.data.messages || []);
      
      // Marquer comme lu
      await axios.patch(`/api/chat/${conversation.user.id}/read`);
    } catch (error) {
      toast.error(t('chat.loadMessagesError'));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    
    try {
      const response = await axios.post(`/api/chat/${selectedConversation.user.id}`, {
        content: newMessage,
        type: 'text'
      });

      setMessages(prev => [...prev, response.data.message]);
      setNewMessage('');
      loadConversations();
      scrollToBottom();
    } catch (error) {
      toast.error(t('chat.sendError'));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (!selectedConversation) return;

    socket.emit('typing', {
      recipientId: selectedConversation.user.id,
      isTyping: true
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        recipientId: selectedConversation.user.id,
        isTyping: false
      });
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Suppression définitive du match + conversation
  const handleUnmatch = async () => {
    if (!selectedConversation) return;
    try {
      await axios.delete(`/api/matches/${selectedConversation.user.id}`);
      toast.success(t('matches.unmatchSuccess'));
      setShowUnmatchConfirm(false);
      setShowConvMenu(false);
      setSelectedConversation(null);
      navigate('/chat');
      loadConversations();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  // Fermer le menu conversation au clic en dehors
  useEffect(() => {
    if (!showConvMenu) return;
    const handleClickOutside = (e) => {
      if (convMenuRef.current && !convMenuRef.current.contains(e.target)) {
        setShowConvMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showConvMenu]);

  // Fermer le picker emoji au clic en dehors
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  if (loading) {
    return (
      <div className="chat-container">
        <div className="loading-state">
          <div className="loading" style={{ width: 60, height: 60 }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="btn btn-ghost " onClick={() => navigate('/home')}>
          <FiArrowLeft />
        </button>
        <div className="logo">
          <FiHeart className="logo-icon" />
          <span>{t('chat.title')}</span>
        </div>
        <Navigation />
      </div>

      <div className="chat-main">
        {/* Sidebar - Liste des conversations */}
        <div className={`chat-sidebar ${selectedConversation ? 'hidden-mobile' : ''}`}>
          <div className="sidebar-header">
            <h2>{t('chat.conversations')}</h2>
            <button className="btn btn-ghost">
              <FiSearch />
            </button>
          </div>

          <div className="conversations-list">
            <MessageRequestsPanel />
            {conversations.length === 0 ? (
              <div className="empty-conversations">
                <FiHeart size={48} />
                <p>{t('chat.noConversations')}</p>
                <button className="btn btn-primary" onClick={() => navigate('/matches')}>
                  {t('chat.viewMatches')}
                </button>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.user.id}
                  className={`conversation-item ${selectedConversation?.user.id === conv.user.id ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="conv-avatar">
                    {conv.user.photos?.[0] ? (
                      <img src={getPhotoUrl(conv.user.photos[0].url)} alt={conv.user.displayName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {conv.user.displayName.charAt(0)}
                      </div>
                    )}
                    {conv.user.isOnline && <div className="online-indicator"></div>}
                  </div>
                  <div className="conv-info">
                    <div className="conv-header-row">
                      <h3>{conv.user.displayName}</h3>
                      {conv.lastMessage && (
                        <span className="conv-time">
                          {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </span>
                      )}
                    </div>
                    <div className="conv-last-message">
                      <p>{conv.lastMessage?.content || t('chat.newMatch')}</p>
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone de messages */}
        <div className={`chat-messages ${!selectedConversation ? 'hidden-mobile' : ''}`}>
          {selectedConversation ? (
            <>
              {/* En-tête de conversation */}
              <div className="messages-header">
                <button 
                  className="btn btn-ghost mobile-only"
                  onClick={() => {
                    setSelectedConversation(null);
                    navigate('/chat');
                  }}
                >
                  <FiArrowLeft />
                </button>
                <div className="header-user-info">
                  <div className="user-avatar-small">
                    {selectedConversation.user.photos?.[0] ? (
                      <img src={getPhotoUrl(selectedConversation.user.photos[0].url)} alt="" />
                    ) : (
                      <div className="avatar-placeholder-small">
                        {selectedConversation.user.displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3>{selectedConversation.user.displayName}</h3>
                    {isTyping && <span className="typing-indicator">{t('chat.typing')}</span>}
                  </div>
                </div>
                <div className="header-actions" ref={convMenuRef} style={{ position: 'relative' }}>
                  <button className="btn btn-ghost" title={t('chat.audioCall')}>
                    <FiPhone />
                  </button>
                  <button className="btn btn-ghost" title={t('chat.videoCall')}>
                    <FiVideo />
                  </button>
                  <button
                    className="btn btn-ghost"
                    title={t('chat.moreOptions')}
                    onClick={() => setShowConvMenu(prev => !prev)}
                  >
                    <FiMoreVertical />
                  </button>
                  {showConvMenu && (
                    <div className="conv-menu-dropdown">
                      <button
                        className="conv-menu-item"
                        onClick={() => { setShowConvMenu(false); setReportTargetMsg(null); setShowReportModal(true); }}
                      >
                        <FiFlag /> {t('report.reportUser')}
                      </button>
                      <button
                        className="conv-menu-item danger"
                        onClick={() => { setShowConvMenu(false); setShowUnmatchConfirm(true); }}
                      >
                        <FiUserX /> {t('chat.menuDeleteUnmatch')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="messages-content">
                <div className="messages-list">
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender?.toString() === currentUser._id?.toString()
                      || msg.sender?._id?.toString() === currentUser._id?.toString();
                    return (
                      <div
                        key={index}
                        className={`message ${isOwn ? 'own' : 'other'}`}
                      >
                        {!isOwn && (
                          <div className="message-avatar">
                            {selectedConversation.user.photos?.[0] ? (
                              <img src={getPhotoUrl(selectedConversation.user.photos[0].url)} alt="" />
                            ) : (
                              <div className="avatar-placeholder-tiny">
                                {selectedConversation.user.displayName.charAt(0)}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="message-bubble">
                          <p>{msg.content || msg.message}</p>
                          <span className="message-time">
                            {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {!isOwn && (
                          <button
                            className="message-report-btn"
                            onClick={() => { setReportTargetMsg(msg); setShowReportModal(true); }}
                            title={t('report.reportMessage')}
                          >
                            <FiFlag size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input + Emoji picker */}
              <div className="chat-input-area" ref={emojiPickerRef}>
                {showEmojiPicker && (
                  <div className="chat-emoji-picker-dropdown">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setNewMessage(prev => prev + emojiData.emoji);
                      }}
                      height={380}
                      width="100%"
                      skinTonesDisabled
                      previewConfig={{ showPreview: false }}
                      style={{ borderRadius: '12px' }}
                    />
                  </div>
                )}
                <form className="messages-input" onSubmit={handleSendMessage}>
                  <button type="button" className="btn btn-ghost">
                    <FiImage />
                  </button>
                  <button
                    type="button"
                    className={`btn btn-ghost chat-emoji-toggle ${showEmojiPicker ? 'active' : ''}`}
                    onClick={() => setShowEmojiPicker(prev => !prev)}
                  >
                    <FiSmile />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder={t('chat.messagePlaceholder')}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!newMessage.trim() || sending}
                  >
                    {sending ? <div className="loading"></div> : <FiSend />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <FiHeart size={80} />
              <h2>{t('chat.selectConversation')}</h2>
              <p>{t('chat.selectConversationDesc')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Signalement */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setReportTargetMsg(null); }}
        targetUserId={selectedConversation?.user._id || selectedConversation?.user.id}
        type={reportTargetMsg ? 'message' : 'user'}
        targetId={reportTargetMsg?._id}
      />

      {/* Modal confirmation Unmatch */}
      {showUnmatchConfirm && (
        <div className="unmatch-overlay" onClick={() => setShowUnmatchConfirm(false)}>
          <div className="unmatch-modal" onClick={e => e.stopPropagation()}>
            <h3>{t('matches.unmatchConfirmTitle')}</h3>
            <p>{t('matches.unmatchConfirmText')}</p>
            <div className="unmatch-modal-btns">
              <button
                className="btn btn-ghost"
                onClick={() => setShowUnmatchConfirm(false)}
              >
                {t('matches.unmatchCancel')}
              </button>
              <button
                className="btn btn-danger"
                onClick={handleUnmatch}
              >
                <FiUserX /> {t('matches.unmatchConfirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
