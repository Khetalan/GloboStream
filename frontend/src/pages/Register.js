import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiUser, FiCalendar, FiHeart } from 'react-icons/fi';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'homme'
  });
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await register(formData);
    
    if (result.success) {
      toast.success(t('register.success'));
      navigate('/home');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
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
            <h1>{t('register.title')}</h1>
            <p>{t('register.subtitle')}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>
                  <FiUser />
                  {t('register.firstName')}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder={t('register.firstNamePlaceholder')}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('register.lastName')}</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder={t('register.lastNamePlaceholder')}
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <FiMail />
                {t('register.email')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('register.emailPlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FiLock />
                {t('register.password')}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('register.passwordPlaceholder')}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>
                <FiCalendar />
                {t('register.birthDate')}
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
                max={new Date(Date.now() - 567648000000).toISOString().split('T')[0]}
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
                    checked={formData.gender === 'homme'}
                    onChange={handleChange}
                  />
                  <span>{t('register.male')}</span>
                </label>
                
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="femme"
                    checked={formData.gender === 'femme'}
                    onChange={handleChange}
                  />
                  <span>{t('register.female')}</span>
                </label>
                
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="autre"
                    checked={formData.gender === 'autre'}
                    onChange={handleChange}
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
              {loading ? <div className="loading"></div> : t('register.submit')}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {t('register.hasAccount')}{' '}
              <Link to="/login">{t('register.loginLink')}</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
