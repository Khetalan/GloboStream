import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCheck } from 'react-icons/fi';
import './FiltersPanel.css';

const COMMON_LANGUAGES = [
  'Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien',
  'Portugais', 'Arabe', 'Chinois', 'Japonais', 'Russe'
];

const COMMON_INTERESTS = [
  'Voyages', 'Sport', 'Musique', 'Cinéma', 'Lecture',
  'Cuisine', 'Art', 'Technologie', 'Nature', 'Danse',
  'Photographie', 'Fitness', 'Gaming', 'Mode', 'Yoga'
];

const FiltersPanel = ({ filters, onClose, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field, value) => {
    setLocalFilters(prev => {
      const array = prev[field] || [];
      const newArray = array.includes(value)
        ? array.filter(item => item !== value)
        : [...array, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleReset = () => {
    setLocalFilters({
      ageMin: 18,
      ageMax: 99,
      distance: 50,
      gender: ['homme', 'femme'],
      heightMin: null,
      heightMax: null,
      languages: [],
      interests: [],
      hasChildren: null,
      smoker: null,
      occupation: null,
      lookingFor: null
    });
  };

  return (
    <motion.div 
      className="filters-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="filters-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filters-header">
          <h2>Filtres de recherche</h2>
          <button className="btn-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="filters-content">
          {/* Âge */}
          <div className="filter-section">
            <h3>Tranche d'âge</h3>
            <div className="range-inputs">
              <div className="range-input-group">
                <label>Min</label>
                <input
                  type="number"
                  value={localFilters.ageMin}
                  onChange={(e) => handleChange('ageMin', parseInt(e.target.value))}
                  min="18"
                  max="99"
                />
              </div>
              <span className="range-separator">-</span>
              <div className="range-input-group">
                <label>Max</label>
                <input
                  type="number"
                  value={localFilters.ageMax}
                  onChange={(e) => handleChange('ageMax', parseInt(e.target.value))}
                  min="18"
                  max="99"
                />
              </div>
            </div>
            <p className="filter-hint">Entre {localFilters.ageMin} et {localFilters.ageMax} ans</p>
          </div>

          {/* Distance */}
          <div className="filter-section">
            <h3>Distance maximale</h3>
            <input
              type="range"
              value={localFilters.distance}
              onChange={(e) => handleChange('distance', parseInt(e.target.value))}
              min="1"
              max="500"
              className="distance-slider"
            />
            <p className="filter-hint">{localFilters.distance} km autour de vous</p>
          </div>

          {/* Genre */}
          <div className="filter-section">
            <h3>Genre</h3>
            <div className="filter-checkboxes">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={localFilters.gender.includes('homme')}
                  onChange={() => handleArrayToggle('gender', 'homme')}
                />
                <span>Hommes</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={localFilters.gender.includes('femme')}
                  onChange={() => handleArrayToggle('gender', 'femme')}
                />
                <span>Femmes</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={localFilters.gender.includes('autre')}
                  onChange={() => handleArrayToggle('gender', 'autre')}
                />
                <span>Autres</span>
              </label>
            </div>
          </div>

          {/* Taille */}
          <div className="filter-section">
            <h3>Taille (cm)</h3>
            <div className="range-inputs">
              <div className="range-input-group">
                <label>Min</label>
                <input
                  type="number"
                  value={localFilters.heightMin || ''}
                  onChange={(e) => handleChange('heightMin', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="150"
                  min="100"
                  max="250"
                />
              </div>
              <span className="range-separator">-</span>
              <div className="range-input-group">
                <label>Max</label>
                <input
                  type="number"
                  value={localFilters.heightMax || ''}
                  onChange={(e) => handleChange('heightMax', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="200"
                  min="100"
                  max="250"
                />
              </div>
            </div>
          </div>

          {/* Langues */}
          <div className="filter-section">
            <h3>Langues parlées</h3>
            <div className="filter-tags">
              {COMMON_LANGUAGES.map(lang => (
                <button
                  key={lang}
                  className={`filter-tag ${localFilters.languages?.includes(lang) ? 'active' : ''}`}
                  onClick={() => handleArrayToggle('languages', lang)}
                >
                  {localFilters.languages?.includes(lang) && <FiCheck />}
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Centres d'intérêt */}
          <div className="filter-section">
            <h3>Centres d'intérêt</h3>
            <div className="filter-tags">
              {COMMON_INTERESTS.map(interest => (
                <button
                  key={interest}
                  className={`filter-tag ${localFilters.interests?.includes(interest) ? 'active' : ''}`}
                  onClick={() => handleArrayToggle('interests', interest)}
                >
                  {localFilters.interests?.includes(interest) && <FiCheck />}
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Enfants */}
          <div className="filter-section">
            <h3>Enfants</h3>
            <div className="filter-checkboxes">
              <label className="filter-checkbox">
                <input
                  type="radio"
                  name="hasChildren"
                  checked={localFilters.hasChildren === null}
                  onChange={() => handleChange('hasChildren', null)}
                />
                <span>Peu importe</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="radio"
                  name="hasChildren"
                  checked={localFilters.hasChildren === 'non'}
                  onChange={() => handleChange('hasChildren', 'non')}
                />
                <span>Sans enfants</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="radio"
                  name="hasChildren"
                  checked={localFilters.hasChildren === 'oui'}
                  onChange={() => handleChange('hasChildren', 'oui')}
                />
                <span>Avec enfants</span>
              </label>
            </div>
          </div>

          {/* Fumeur */}
          <div className="filter-section">
            <h3>Fumeur</h3>
            <div className="filter-checkboxes">
              <label className="filter-checkbox">
                <input
                  type="radio"
                  name="smoker"
                  checked={localFilters.smoker === null}
                  onChange={() => handleChange('smoker', null)}
                />
                <span>Peu importe</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="radio"
                  name="smoker"
                  checked={localFilters.smoker === 'non'}
                  onChange={() => handleChange('smoker', 'non')}
                />
                <span>Non-fumeur</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="radio"
                  name="smoker"
                  checked={localFilters.smoker === 'rarement'}
                  onChange={() => handleChange('smoker', 'rarement')}
                />
                <span>Occasionnel</span>
              </label>
            </div>
          </div>

          {/* Type de relation */}
          <div className="filter-section">
            <h3>Recherche</h3>
            <div className="filter-checkboxes">
              <label className="filter-checkbox">
                <input
                  type="radio"
                  name="lookingFor"
                  checked={localFilters.lookingFor === null}
                  onChange={() => handleChange('lookingFor', null)}
                />
                <span>Peu importe</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="radio"
                  name="lookingFor"
                  checked={localFilters.lookingFor === 'relation-serieuse'}
                  onChange={() => handleChange('lookingFor', 'relation-serieuse')}
                />
                <span>Relation sérieuse</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="radio"
                  name="lookingFor"
                  checked={localFilters.lookingFor === 'rencontre-casual'}
                  onChange={() => handleChange('lookingFor', 'rencontre-casual')}
                />
                <span>Rencontre décontractée</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="radio"
                  name="lookingFor"
                  checked={localFilters.lookingFor === 'amitie'}
                  onChange={() => handleChange('lookingFor', 'amitie')}
                />
                <span>Amitié</span>
              </label>
            </div>
          </div>
        </div>

        <div className="filters-footer">
          <button className="btn btn-secondary" onClick={handleReset}>
            Réinitialiser
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => onApply(localFilters)}
            disabled={localFilters.gender.length === 0}
          >
            Appliquer les filtres
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FiltersPanel;
