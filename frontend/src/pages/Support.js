import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navigation from '../components/Navigation';
import { FiArrowLeft, FiHeart, FiSend, FiAlertCircle, FiMessageCircle, FiFlag } from 'react-icons/fi';
import './Support.css';

const Support = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'bug',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.message) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setSending(true);
    
    try {
      // TODO: Implémenter l'API de support
      await axios.post('/api/support', formData);
      toast.success('✅ Votre message a été envoyé !');
      setFormData({ type: 'bug', subject: '', message: '' });
    } catch (error) {
      toast.error('❌ Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="support-container">
      <div className="support-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <div className="logo">
          <FiHeart className="logo-icon" />
          <span>Support</span>
        </div>
        <Navigation />
      </div>

      <div className="support-content">
        <div className="support-intro">
          <FiAlertCircle size={60} className="intro-icon" />
          <h1>Comment pouvons-nous vous aider ?</h1>
          <p>Signalez un bug, une plainte ou contactez notre équipe</p>
        </div>

        <div className="support-cards">
          <div className="info-card">
            <FiMessageCircle size={32} />
            <h3>Temps de réponse</h3>
            <p>Nous répondons généralement sous 24-48h</p>
          </div>
          
          <div className="info-card">
            <FiFlag size={32} />
            <h3>Signalement</h3>
            <p>Tous les signalements sont traités avec sérieux</p>
          </div>
        </div>

        <form className="support-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type de demande</label>
            <select 
              name="type" 
              value={formData.type} 
              onChange={handleChange}
              required
            >
              <option value="bug">🐛 Signaler un bug</option>
              <option value="complaint">⚠️ Plainte (utilisateur/stream)</option>
              <option value="question">❓ Question générale</option>
              <option value="feedback">💡 Suggestion/Feedback</option>
              <option value="account">👤 Problème de compte</option>
              <option value="other">📝 Autre</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sujet</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Résumez votre demande en quelques mots"
              required
            />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Décrivez votre problème en détail..."
              rows={8}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-submit"
            disabled={sending}
          >
            {sending ? (
              <div className="loading"></div>
            ) : (
              <>
                <FiSend /> Envoyer le message
              </>
            )}
          </button>
        </form>

        <div className="support-faq">
          <h3>Questions fréquentes</h3>
          <div className="faq-item">
            <h4>Comment supprimer mon compte ?</h4>
            <p>Rendez-vous dans Paramètres → Compte → Supprimer mon compte</p>
          </div>
          <div className="faq-item">
            <h4>Comment signaler un utilisateur ?</h4>
            <p>Sur le profil de l'utilisateur, cliquez sur "⋮" puis "Signaler"</p>
          </div>
          <div className="faq-item">
            <h4>Je n'arrive pas à me connecter</h4>
            <p>Vérifiez votre email/mot de passe ou utilisez "Mot de passe oublié"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
