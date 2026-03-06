import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiHeart, FiCalendar, FiAlertOctagon } from 'react-icons/fi';
import './Auth.css';

const getMaxBirthDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
};

const calcAge = (birthDate) => {
  if (!birthDate) return null;
  return Math.floor((Date.now() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
};

const CompleteProfile = () => {
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('homme');
  const [loading, setLoading] = useState(false);
  const [underageBlocked, setUnderageBlocked] = useState(false);
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const age = calcAge(birthDate);
    if (age === null || age < 18) {
      setUnderageBlocked(true);
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/users/complete-profile', { birthDate, gender });
      await refreshUser();
      toast.success(t('completeProfile.success'));
      navigate('/home');
    } catch (error) {
      if (error.response?.data?.error === 'underage') {
        setUnderageBlocked(true);
      } else {
        toast.error(t('completeProfile.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <motion.div
          className="auth-card register-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="auth-header">
            <div className="logo">
              <FiHeart className="logo-icon" />
              <span>Globostream</span>
            </div>
            <h1>{t('completeProfile.title')}</h1>
            <p>{t('completeProfile.subtitle')}</p>
          </div>

          {underageBlocked && (
            <motion.div
              className="underage-block"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <FiAlertOctagon size={40} className="underage-icon" />
              <h2>{t('register.underageTitle')}</h2>
              <p>{t('register.underageDesc')}</p>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setUnderageBlocked(false)}
              >
                ←
              </button>
            </motion.div>
          )}

          {!underageBlocked && (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  <FiCalendar />
                  {t('register.birthDate')}
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  max={getMaxBirthDate()}
                />
              </div>

              <div className="form-group">
                <label>{t('register.gender')}</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="gender"
                      value="homme"
                      checked={gender === 'homme'}
                      onChange={(e) => setGender(e.target.value)}
                    />
                    <span>{t('register.male')}</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="gender"
                      value="femme"
                      checked={gender === 'femme'}
                      onChange={(e) => setGender(e.target.value)}
                    />
                    <span>{t('register.female')}</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="gender"
                      value="autre"
                      checked={gender === 'autre'}
                      onChange={(e) => setGender(e.target.value)}
                    />
                    <span>{t('register.other')}</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? <div className="loading"></div> : t('completeProfile.submit')}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CompleteProfile;
