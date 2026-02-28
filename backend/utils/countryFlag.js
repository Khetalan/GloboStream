// =========================================
// UTILITAIRE — Conversion pays → emoji drapeau
// Utilisé pour afficher le badge pays dans le chat live
// =========================================

/**
 * Convertit un code ISO 3166-1 alpha-2 (ex: "FR") en emoji drapeau (ex: "🇫🇷")
 * @param {string} code — code à 2 lettres
 * @returns {string|null}
 */
function codeToFlag(code) {
  if (!code || code.length !== 2) return null;
  const upper = code.toUpperCase();
  const c1 = upper.charCodeAt(0);
  const c2 = upper.charCodeAt(1);
  if (c1 < 65 || c1 > 90 || c2 < 65 || c2 > 90) return null;
  const offset = 0x1F1E6 - 65;
  return String.fromCodePoint(c1 + offset) + String.fromCodePoint(c2 + offset);
}

// Mapping nom de pays → code ISO (noms français de LocationPicker + noms anglais Nominatim)
const NAME_TO_CODE = {
  // Noms français (depuis LocationPicker.js)
  'France': 'FR',
  'Belgique': 'BE',
  'Suisse': 'CH',
  'Canada': 'CA',
  'États-Unis': 'US',
  'Royaume-Uni': 'GB',
  'Allemagne': 'DE',
  'Espagne': 'ES',
  'Italie': 'IT',
  'Portugal': 'PT',
  'Pays-Bas': 'NL',
  'Luxembourg': 'LU',
  'Monaco': 'MC',
  'Maroc': 'MA',
  'Algérie': 'DZ',
  'Tunisie': 'TN',
  'Sénégal': 'SN',
  "Côte d'Ivoire": 'CI',
  'Cameroun': 'CM',
  'Mexique': 'MX',
  'Brésil': 'BR',
  'Argentine': 'AR',
  'Chili': 'CL',
  'Colombie': 'CO',
  'Japon': 'JP',
  'Chine': 'CN',
  'Corée du Sud': 'KR',
  'Inde': 'IN',
  'Australie': 'AU',
  'Nouvelle-Zélande': 'NZ',
  'Afrique du Sud': 'ZA',
  'Égypte': 'EG',
  'Émirats arabes unis': 'AE',
  'Arabie saoudite': 'SA',
  'Turquie': 'TR',
  'Russie': 'RU',
  'Pologne': 'PL',
  'Suède': 'SE',
  'Norvège': 'NO',
  'Danemark': 'DK',
  'Finlande': 'FI',
  'Irlande': 'IE',
  'Autriche': 'AT',
  'Grèce': 'GR',
  'République tchèque': 'CZ',
  'Roumanie': 'RO',
  'Hongrie': 'HU',
  'Bulgarie': 'BG',
  // Noms anglais (Nominatim sans locale explicite)
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'United States': 'US',
  'United Kingdom': 'GB',
  'Germany': 'DE',
  'Spain': 'ES',
  'Italy': 'IT',
  'Netherlands': 'NL',
  'Morocco': 'MA',
  'Algeria': 'DZ',
  'Tunisia': 'TN',
  'Senegal': 'SN',
  "Ivory Coast": 'CI',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Japan': 'JP',
  'China': 'CN',
  'South Korea': 'KR',
  'India': 'IN',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'South Africa': 'ZA',
  'Egypt': 'EG',
  'United Arab Emirates': 'AE',
  'Saudi Arabia': 'SA',
  'Turkey': 'TR',
  'Russia': 'RU',
  'Poland': 'PL',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Ireland': 'IE',
  'Austria': 'AT',
  'Greece': 'GR',
  'Czech Republic': 'CZ',
  'Czechia': 'CZ',
  'Romania': 'RO',
  'Hungary': 'HU',
  'Bulgaria': 'BG',
};

/**
 * Retourne l'emoji drapeau à partir d'un nom de pays ou d'un code ISO 2 lettres
 * @param {string} countryName — nom de pays (FR ou EN) ou code ISO 2 lettres
 * @returns {string|null} — emoji drapeau ou null si inconnu
 */
function getCountryFlag(countryName) {
  if (!countryName || typeof countryName !== 'string') return null;
  const trimmed = countryName.trim();

  // Déjà un code ISO 2 lettres (ex: "FR", "fr")
  if (trimmed.length === 2) {
    return codeToFlag(trimmed);
  }

  // Recherche exacte dans la map
  const code = NAME_TO_CODE[trimmed];
  if (code) return codeToFlag(code);

  // Recherche insensible à la casse en dernier recours
  const lower = trimmed.toLowerCase();
  for (const [name, iso] of Object.entries(NAME_TO_CODE)) {
    if (name.toLowerCase() === lower) return codeToFlag(iso);
  }

  return null;
}

module.exports = { getCountryFlag };
