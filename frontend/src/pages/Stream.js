import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiHeart } from 'react-icons/fi';
import './Common.css';

const Stream = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/home')}>
          <FiArrowLeft />
        </button>
        <div className="logo">
          <FiHeart className="logo-icon" />
          <span>Globostream</span>
        </div>
        <div style={{ width: 40 }}></div>
      </div>

      <div className="page-content">
        <h1>{t('stream.title')}</h1>
        <p>{t('stream.underConstruction')}</p>
        <p>{t('stream.comingSoon')}</p>
      </div>
    </div>
  );
};

export default Stream;
