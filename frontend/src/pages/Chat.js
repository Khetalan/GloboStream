import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import {
  FiArrowLeft, FiHeart, FiSend, FiImage, FiMoreVertical,
  FiPhone, FiVideo, FiSearch
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import './Chat.css';
import MessageRequestsPanel from '../components/MessageRequestsPanel';

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
        <button className="btn btn-ghost " onClick={() => navigate(-1)}>
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
                      <img src={conv.user.photos[0].url} alt={conv.user.displayName} />
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
                      <img src={selectedConversation.user.photos[0].url} alt="" />
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
                <div className="header-actions">
                  <button className="btn btn-ghost" title={t('chat.audioCall')}>
                    <FiPhone />
                  </button>
                  <button className="btn btn-ghost" title={t('chat.videoCall')}>
                    <FiVideo />
                  </button>
                  <button className="btn btn-ghost" title={t('chat.moreOptions')}>
                    <FiMoreVertical />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-content">
                <div className="messages-list">
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender === currentUser.id || msg.sender?._id === currentUser.id;
                    return (
                      <div
                        key={index}
                        className={`message ${isOwn ? 'own' : 'other'}`}
                      >
                        {!isOwn && (
                          <div className="message-avatar">
                            {selectedConversation.user.photos?.[0] ? (
                              <img src={selectedConversation.user.photos[0].url} alt="" />
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
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <form className="messages-input" onSubmit={handleSendMessage}>
                <button type="button" className="btn btn-ghost">
                  <FiImage />
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
    </div>
  );
};

export default Chat;
