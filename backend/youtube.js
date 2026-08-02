/**
 * YouTube link ellenőrzés a Media Share funkcióhoz.
 *
 * Két szintje van:
 * 1. Formátum-ellenőrzés (regex) — ez mindig fut, API kulcs nélkül is.
 * 2. Hossz-ellenőrzés a YouTube Data API v3-mal — csak akkor fut, ha van
 *    YOUTUBE_API_KEY beállítva. Enélkül a link átmegy, csak a hosszt nem tudjuk
 *    leellenőrizni (ezt logoljuk is, hogy ne legyen néma a viselkedés).
 *
 * API kulcs szerzése: https://console.cloud.google.com/apis/credentials
 * (YouTube Data API v3 engedélyezése egy projektben, aztán "API key" létrehozása —
 * ingyenes napi kvótával jár, egy donate oldalhoz bőven elég.)
 */

const axios = require('axios');

const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function extractVideoId(url) {
  const match = url.match(YOUTUBE_URL_REGEX);
  return match ? match[5] : null;
}

function isYoutubeUrl(url) {
  return YOUTUBE_URL_REGEX.test(url);
}

/**
 * ISO 8601 időtartam (pl. "PT2M35S") átalakítása másodpercre.
 */
function parseIsoDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const [, h, m, s] = match;
  return (parseInt(h || 0, 10) * 3600) + (parseInt(m || 0, 10) * 60) + parseInt(s || 0, 10);
}

/**
 * @param {string} url - a donor által beküldött YouTube link
 * @param {number} maxSeconds - megengedett maximális hossz másodpercben
 * @returns {Promise<{ok: boolean, error?: string, videoId?: string, durationSeconds?: number}>}
 */
async function validateYoutubeLink(url, maxSeconds) {
  if (!url) {
    return { ok: true }; // opcionális mező, üres érték rendben van
  }

  if (!isYoutubeUrl(url)) {
    return { ok: false, error: 'Ez nem tűnik érvényes YouTube linknek.' };
  }

  const videoId = extractVideoId(url);

  if (!process.env.YOUTUBE_API_KEY) {
    console.log('[youtube] Nincs YOUTUBE_API_KEY beállítva — hossz-ellenőrzés kihagyva.', { videoId });
    return { ok: true, videoId, durationSeconds: null };
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        id: videoId,
        part: 'contentDetails,status',
        key: process.env.YOUTUBE_API_KEY,
      },
    });

    const video = response.data.items && response.data.items[0];
    if (!video) {
      return { ok: false, error: 'Nem található ez a YouTube videó (lehet privát vagy törölt).' };
    }

    if (video.status && video.status.embeddable === false) {
      return { ok: false, error: 'Ez a videó nem engedélyezi a beágyazást, így nem játszható le az overlayen.' };
    }

    const durationSeconds = parseIsoDuration(video.contentDetails.duration);

    if (durationSeconds !== null && durationSeconds > maxSeconds) {
      const maxMin = Math.floor(maxSeconds / 60);
      const maxSec = maxSeconds % 60;
      return {
        ok: false,
        error: `A videó túl hosszú (max. ${maxMin}:${String(maxSec).padStart(2, '0')} perc engedélyezett).`,
      };
    }

    return { ok: true, videoId, durationSeconds };
  } catch (err) {
    // A Google API a hiba OKÁT a válasz body-jában adja vissza (pl. "API key not valid",
    // "requests from referer <empty> are blocked", "YouTube Data API v3 has not been used...").
    // Az err.message önmagában csak annyit mond, hogy "403" — ez itt a tényleges indoklás.
    const details = err.response?.data?.error?.message || err.message;
    console.error('[youtube] API hiba:', details);
    // Az API hibája miatt nem szabad elutasítani a donort — inkább átengedjük,
    // és logoljuk, hogy utólag ellenőrizhető legyen.
    return { ok: true, videoId, durationSeconds: null, apiError: details };
  }
}

module.exports = { validateYoutubeLink, isYoutubeUrl, extractVideoId, parseIsoDuration };