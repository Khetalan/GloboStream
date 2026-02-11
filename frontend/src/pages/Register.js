import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      toast.success('Compte créé avec succès !');
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
            <h1>Créer un compte</h1>
            <p>Commencez votre aventure</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>
                  <FiUser />
                  Prénom
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Prénom"
                  required
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Nom (optionnel)"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <FiMail />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FiLock />
                Mot de passe
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>
                <FiCalendar />
                Date de naissance
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
              <label>Genre</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="homme"
                    checked={formData.gender === 'homme'}
                    onChange={handleChange}
                  />
                  <span>Homme</span>
                </label>
                
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="femme"
                    checked={formData.gender === 'femme'}
                    onChange={handleChange}
                  />
                  <span>Femme</span>
                </label>
                
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="autre"
                    checked={formData.gender === 'autre'}
                    onChange={handleChange}
                  />
                  <span>Autre</span>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? <div className="loading"></div> : 'Créer mon compte'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Déjà un compte ?{' '}
              <Link to="/login">Se connecter</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
