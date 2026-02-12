import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiLoader } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import './LocationPicker.css';

const COUNTRIES = [
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CH', name: 'Suisse' },
  { code: 'CA', name: 'Canada' },
  { code: 'US', name: 'États-Unis' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'ES', name: 'Espagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MA', name: 'Maroc' },
  { code: 'DZ', name: 'Algérie' },
  { code: 'TN', name: 'Tunisie' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'MX', name: 'Mexique' },
  { code: 'BR', name: 'Brésil' },
  { code: 'AR', name: 'Argentine' },
  { code: 'CL', name: 'Chili' },
  { code: 'CO', name: 'Colombie' },
  { code: 'JP', name: 'Japon' },
  { code: 'CN', name: 'Chine' },
  { code: 'KR', name: 'Corée du Sud' },
  { code: 'IN', name: 'Inde' },
  { code: 'AU', name: 'Australie' },
  { code: 'NZ', name: 'Nouvelle-Zélande' },
  { code: 'ZA', name: 'Afrique du Sud' },
  { code: 'EG', name: 'Égypte' },
  { code: 'AE', name: 'Émirats arabes unis' },
  { code: 'SA', name: 'Arabie saoudite' },
  { code: 'TR', name: 'Turquie' },
  { code: 'RU', name: 'Russie' },
  { code: 'PL', name: 'Pologne' },
  { code: 'SE', name: 'Suède' },
  { code: 'NO', name: 'Norvège' },
  { code: 'DK', name: 'Danemark' },
  { code: 'FI', name: 'Finlande' },
  { code: 'IE', name: 'Irlande' },
  { code: 'AT', name: 'Autriche' },
  { code: 'GR', name: 'Grèce' },
  { code: 'CZ', name: 'République tchèque' },
  { code: 'RO', name: 'Roumanie' },
  { code: 'HU', name: 'Hongrie' },
  { code: 'BG', name: 'Bulgarie' }
].sort((a, b) => a.name.localeCompare(b.name));

const LocationPicker = ({ city, country, coordinates, onChange }) => {
  const [cityInput, setCityInput] = useState(city || '');
  const [selectedCountry, setSelectedCountry] = useState(country || 'France');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const debounceTimer = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    setCityInput(city || '');
    setSelectedCountry(country || 'France');
  }, [city, country]);

  // Rechercher des villes avec Nominatim
  const searchCities = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    
    try {
      // Construire le nom du pays pour la recherche
      const countryObj = COUNTRIES.find(c => c.name === selectedCountry);
      const countryName = countryObj ? countryObj.name : selectedCountry;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)},${encodeURIComponent(countryName)}` +
        `&format=json&limit=10&addressdetails=1&accept-language=fr`
      );
      
      const data = await response.json();
      
      // Filtrer pour ne garder que les villes
      const cities = data.filter(item => 
        item.type === 'city' || 
        item.type === 'town' || 
        item.type === 'village' || 
        item.type === 'municipality' ||
        item.addresstype === 'city' ||
        item.addresstype === 'town' ||
        item.addresstype === 'village'
      ).map(item => ({
        name: item.address.city || item.address.town || item.address.village || item.name,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        country: item.address.country
      }));
      
      setSuggestions(cities);
    } catch (error) {
      console.error('Erreur recherche ville:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce pour la recherche
  const handleCityChange = (value) => {
    setCityInput(value);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      searchCities(value);
    }, 500);
  };

  // Sélectionner une ville dans les suggestions
  const handleSelectCity = (suggestion) => {
    setCityInput(suggestion.name);
    setSelectedCountry(suggestion.country);
    setSuggestions([]);
    
    // Appeler le callback avec les nouvelles données
    onChange({
      city: suggestion.name,
      country: suggestion.country,
      coordinates: [suggestion.lon, suggestion.lat]
    });
  };

  // Géolocalisation automatique
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(t('location.geoNotSupported'));
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Géocodage inversé pour obtenir la ville
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=fr`
          );
          
          const data = await response.json();
          
          const cityName = data.address.city || 
                          data.address.town || 
                          data.address.village || 
                          data.address.municipality ||
                          '';
          const countryName = data.address.country || '';
          
          setCityInput(cityName);
          setSelectedCountry(countryName);
          setSuggestions([]);
          
          // Appeler le callback
          onChange({
            city: cityName,
            country: countryName,
            coordinates: [longitude, latitude]
          });
          
        } catch (error) {
          console.error('Erreur géocodage:', error);
          alert(t('location.cannotGetCity'));
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Erreur géolocalisation:', error);
        alert(t('location.allowAccess'));
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Changement manuel du pays
  const handleCountryChange = (newCountry) => {
    setSelectedCountry(newCountry);
    
    // Si une ville est sélectionnée, chercher ses coordonnées dans le nouveau pays
    if (cityInput) {
      searchCities(cityInput);
    }
    
    // Appeler le callback sans coordonnées (seront mises à jour à la sélection de ville)
    onChange({
      city: cityInput,
      country: newCountry,
      coordinates: coordinates || [0, 0]
    });
  };

  return (
    <div className="location-picker">
      <div className="location-row">
        <div className="location-input-wrapper">
          <label>{t('location.city')}</label>
          <div className="city-input-container">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => handleCityChange(e.target.value)}
              placeholder={t('location.cityPlaceholder')}
              className="city-input"
            />
            {loading && (
              <FiLoader className="loading-icon spinning" />
            )}
            {suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSelectCity(suggestion)}
                  >
                    <FiMapPin />
                    <div>
                      <div className="suggestion-name">{suggestion.name}</div>
                      <div className="suggestion-details">{suggestion.displayName}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="location-input-wrapper">
          <label>{t('location.country')}</label>
          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="country-select"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button 
        type="button"
        className="btn btn-secondary geolocate-btn"
        onClick={handleGetLocation}
        disabled={gettingLocation}
      >
        {gettingLocation ? (
          <>
            <FiLoader className="spinning" />
            {t('location.locating')}
          </>
        ) : (
          <>
            <FiMapPin />
            {t('location.useMyPosition')}
          </>
        )}
      </button>
    </div>
  );
};

export default LocationPicker;
