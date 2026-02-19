const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Préfixe une URL de photo avec l'URL du backend.
 * Les photos sont stockées avec un chemin relatif (/uploads/photos/...)
 * mais les <img src> doivent pointer vers le backend (pas le frontend GitHub Pages).
 */
export const getPhotoUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
};
