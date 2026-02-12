import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiHeart } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaApple } from 'react-icons/fa';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      toast.success(t('login.success'));
      navigate('/home');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="auth-header">
            <div className="logo">
              <FiHeart className="logo-icon" />
              <span>Globostream</span>
            </div>
            <h1>{t('login.title')}</h1>
            <p>{t('login.subtitle')}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>
                <FiMail />
                {t('login.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FiLock />
                {t('login.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? <div className="loading"></div> : t('login.submit')}
            </button>
          </form>

          <div className="auth-divider">
            <span>{t('login.orContinueWith')}</span>
          </div>

          <div className="social-buttons">
            <button 
              className="social-btn google"
              onClick={() => handleSocialLogin('google')}
            >
              <FcGoogle size={20} />
              Google
            </button>
            
            <button 
              className="social-btn facebook"
              onClick={() => handleSocialLogin('facebook')}
            >
              <FaFacebook size={20} />
              Facebook
            </button>
            
            <button 
              className="social-btn apple"
              onClick={() => handleSocialLogin('apple')}
            >
              <FaApple size={20} />
              Apple
            </button>
          </div>

          <div className="auth-footer">
            <p>
              {t('login.noAccount')}{' '}
              <Link to="/register">{t('login.signupLink')}</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
