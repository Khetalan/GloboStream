const LANG_FLAGS = {
  fr: '🇫🇷',
  en: '🇬🇧',
  it: '🇮🇹',
  de: '🇩🇪',
  es: '🇪🇸',
  pt: '🇵🇹',
  ar: '🇸🇦',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ru: '🇷🇺'
};

export const getLangFlag = (langCode) => {
  if (!langCode) return '';
  return LANG_FLAGS[langCode] || langCode.toUpperCase();
};

/**
 * Traduit un texte via l'API gratuite MyMemory.
 * Limite : ~5000 chars/jour en anonyme, largement suffisant pour un chat live.
 */
export async function translateText(text, fromLang, toLang) {
  if (!text || !fromLang || !toLang || fromLang === toLang) return null;

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
    );
    const data = await res.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      // MyMemory renvoie parfois le même texte en majuscules si pas de traduction
      if (translated.toLowerCase() === text.toLowerCase()) return null;
      return translated;
    }
    return null;
  } catch {
    return null;
  }
}
