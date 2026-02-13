import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Navigation from '../components/Navigation';
import { FiArrowLeft, FiHeart, FiSend, FiAlertCircle, FiMessageCircle, FiFlag } from 'react-icons/fi';
import './Support.css';

const Support = () => {
  const { t } = useTranslation();
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
      toast.error(t('support.fillAllFields'));
      return;
    }

    setSending(true);
    
    try {
      // TODO: Implémenter l'API de support
      await axios.post('/api/support', formData);
      toast.success(t('support.sendSuccess'));
      setFormData({ type: 'bug', subject: '', message: '' });
    } catch (error) {
      toast.error(t('support.sendError'));
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
          <span>{t('support.title')}</span>
        </div>
        <Navigation />
      </div>

      <div className="support-content">
        <div className="support-intro">
          <FiAlertCircle size={60} className="intro-icon" />
          <h1>{t('support.intro')}</h1>
          <p>{t('support.introDesc')}</p>
        </div>

        <div className="support-cards">
          <div className="info-card">
            <FiMessageCircle size={32} />
            <h3>{t('support.responseTime')}</h3>
            <p>{t('support.responseTimeDesc')}</p>
          </div>

          <div className="info-card">
            <FiFlag size={32} />
            <h3>{t('support.reporting')}</h3>
            <p>{t('support.reportingDesc')}</p>
          </div>
        </div>

        <form className="support-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('support.requestType')}</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="bug">{t('support.typeBug')}</option>
              <option value="complaint">{t('support.typeComplaint')}</option>
              <option value="question">{t('support.typeQuestion')}</option>
              <option value="feedback">{t('support.typeSuggestion')}</option>
              <option value="account">{t('support.typeAccount')}</option>
              <option value="other">{t('support.typeOther')}</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t('support.subject')}</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder={t('support.subjectPlaceholder')}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('support.message')}</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder={t('support.messagePlaceholder')}
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
                <FiSend /> {t('support.submit')}
              </>
            )}
          </button>
        </form>

        <div className="support-faq">
          <h3>{t('support.faqTitle')}</h3>
          <div className="faq-item">
            <h4>{t('support.faq1Question')}</h4>
            <p>{t('support.faq1Answer')}</p>
          </div>
          <div className="faq-item">
            <h4>{t('support.faq2Question')}</h4>
            <p>{t('support.faq2Answer')}</p>
          </div>
          <div className="faq-item">
            <h4>{t('support.faq3Question')}</h4>
            <p>{t('support.faq3Answer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
