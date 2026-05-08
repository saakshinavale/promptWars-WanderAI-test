/* ===== services/weather.js ===== */
// Open-Meteo API client — no API key required

/**
 * Weather code to emoji + description mapping (WMO codes)
 */
export const WEATHER_CODES = {
  0: { icon: '☀️', desc: 'Clear sky' },
  1: { icon: '🌤️', desc: 'Mainly clear' },
  2: { icon: '⛅', desc: 'Partly cloudy' },
  3: { icon: '☁️', desc: 'Overcast' },
  45: { icon: '🌫️', desc: 'Foggy' },
  48: { icon: '🌫️', desc: 'Depositing rime fog' },
  51: { icon: '🌦️', desc: 'Light drizzle' },
  53: { icon: '🌦️', desc: 'Moderate drizzle' },
  55: { icon: '🌦️', desc: 'Dense drizzle' },
  61: { icon: '🌧️', desc: 'Slight rain' },
  63: { icon: '🌧️', desc: 'Moderate rain' },
  65: { icon: '🌧️', desc: 'Heavy rain' },
  71: { icon: '🌨️', desc: 'Slight snow' },
  73: { icon: '🌨️', desc: 'Moderate snow' },
  75: { icon: '❄️', desc: 'Heavy snow' },
  77: { icon: '🌨️', desc: 'Snow grains' },
  80: { icon: '🌦️', desc: 'Slight rain showers' },
  81: { icon: '🌧️', desc: 'Moderate rain showers' },
  82: { icon: '⛈️', desc: 'Violent rain showers' },
  85: { icon: '🌨️', desc: 'Slight snow showers' },
  86: { icon: '❄️', desc: 'Heavy snow showers' },
  95: { icon: '⛈️', desc: 'Thunderstorm' },
  96: { icon: '⛈️', desc: 'Thunderstorm with slight hail' },
  99: { icon: '⛈️', desc: 'Thunderstorm with heavy hail' }
};

/**
 * Get weather info for a given WMO code
 */
export function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { icon: '🌡️', desc: 'Unknown' };
}

/**
 * Fetch daily weather forecast from Open-Meteo
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} startDate - ISO date string (YYYY-MM-DD)
 * @param {string} endDate - ISO date string (YYYY-MM-DD)
 * @returns {Promise<object>} Parsed weather data
 */
export async function fetchWeather(lat, lng, startDate, endDate) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    start_date: startDate,
    end_date: endDate,
    daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum',
    timezone: 'auto'
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  return parseWeatherResponse(data);
}

/**
 * Parse Open-Meteo response into a friendlier format
 */
export function parseWeatherResponse(data) {
  const daily = data.daily;
  if (!daily || !daily.time) {
    return { days: [], summary: null };
  }

  const days = daily.time.map((date, i) => {
    const code = daily.weathercode[i];
    const info = getWeatherInfo(code);
    return {
      date,
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      weatherCode: code,
      icon: info.icon,
      description: info.desc,
      precipitation: daily.precipitation_sum[i]
    };
  });

  // Compute trip-level summary from the most common weather code
  const avgHigh = Math.round(days.reduce((s, d) => s + d.tempMax, 0) / days.length);
  const avgLow = Math.round(days.reduce((s, d) => s + d.tempMin, 0) / days.length);
  const mostCommonCode = getMostCommonCode(days.map(d => d.weatherCode));
  const summaryInfo = getWeatherInfo(mostCommonCode);

  return {
    days,
    summary: {
      avgHigh,
      avgLow,
      icon: summaryInfo.icon,
      description: summaryInfo.desc
    }
  };
}

/**
 * Find the most frequently occurring weather code
 */
function getMostCommonCode(codes) {
  const freq = {};
  for (const code of codes) {
    freq[code] = (freq[code] || 0) + 1;
  }
  let maxCount = 0;
  let maxCode = 0;
  for (const [code, count] of Object.entries(freq)) {
    if (count > maxCount) {
      maxCount = count;
      maxCode = Number(code);
    }
  }
  return maxCode;
}
