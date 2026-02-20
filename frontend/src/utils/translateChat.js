/**
 * Traduit un texte via l'API gratuite MyMemory (autodetect → langue cible).
 * Utilisé par le bouton 🌐 sur chaque message du chat live.
 */
export async function translateMessage(text, targetLang) {
  if (!text || !targetLang) return null;

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`
    );
    const data = await res.json();
    const translated = data.responseData?.translatedText;

    if (translated && translated.toLowerCase() !== text.toLowerCase()) {
      return translated;
    }
    return null;
  } catch {
    return null;
  }
}
