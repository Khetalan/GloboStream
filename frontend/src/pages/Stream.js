import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiHeart } from 'react-icons/fi';
import './Common.css';

const Stream = () => {
  const navigate = useNavigate();

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
        <h1>Stream</h1>
        <p>Cette page est en construction...</p>
        <p>Fonctionnalité à venir !</p>
      </div>
    </div>
  );
};

export default Stream;
