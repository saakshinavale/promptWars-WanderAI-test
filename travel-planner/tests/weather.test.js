import { describe, it, expect } from 'vitest';
import { getWeatherInfo, parseWeatherResponse, WEATHER_CODES } from '../app/js/services/weather.js';

describe('Weather Service', () => {
  describe('getWeatherInfo', () => {
    it('returns clear sky for code 0', () => {
      const info = getWeatherInfo(0);
      expect(info.icon).toBe('☀️');
      expect(info.desc).toBe('Clear sky');
    });

    it('returns thunderstorm for code 95', () => {
      const info = getWeatherInfo(95);
      expect(info.icon).toBe('⛈️');
      expect(info.desc).toBe('Thunderstorm');
    });

    it('returns fallback for unknown code', () => {
      const info = getWeatherInfo(999);
      expect(info.icon).toBe('🌡️');
      expect(info.desc).toBe('Unknown');
    });

    it('handles all defined WMO codes', () => {
      for (const code of Object.keys(WEATHER_CODES)) {
        const info = getWeatherInfo(Number(code));
        expect(info.icon).toBeTruthy();
        expect(info.desc).toBeTruthy();
      }
    });
  });

  describe('parseWeatherResponse', () => {
    const mockResponse = {
      daily: {
        time: ['2026-05-15', '2026-05-16', '2026-05-17'],
        temperature_2m_max: [22.5, 24.1, 19.8],
        temperature_2m_min: [14.2, 15.6, 12.3],
        weathercode: [0, 2, 61],
        precipitation_sum: [0, 0, 5.2]
      }
    };

    it('parses daily forecasts correctly', () => {
      const result = parseWeatherResponse(mockResponse);
      expect(result.days).toHaveLength(3);
      expect(result.days[0].date).toBe('2026-05-15');
      expect(result.days[0].tempMax).toBe(23); // rounded
      expect(result.days[0].tempMin).toBe(14);
      expect(result.days[0].icon).toBe('☀️');
    });

    it('computes trip summary with averages', () => {
      const result = parseWeatherResponse(mockResponse);
      expect(result.summary).toBeDefined();
      expect(result.summary.avgHigh).toBe(22); // avg of 23, 24, 20
      expect(result.summary.avgLow).toBe(14);  // avg of 14, 16, 12
    });

    it('picks most common weather code for summary', () => {
      const repeatedClear = {
        daily: {
          time: ['2026-05-15', '2026-05-16', '2026-05-17'],
          temperature_2m_max: [20, 21, 22],
          temperature_2m_min: [10, 11, 12],
          weathercode: [0, 0, 61],
          precipitation_sum: [0, 0, 3]
        }
      };
      const result = parseWeatherResponse(repeatedClear);
      expect(result.summary.icon).toBe('☀️');
    });

    it('handles empty response gracefully', () => {
      const result = parseWeatherResponse({});
      expect(result.days).toEqual([]);
      expect(result.summary).toBeNull();
    });

    it('handles missing daily data', () => {
      const result = parseWeatherResponse({ daily: {} });
      expect(result.days).toEqual([]);
      expect(result.summary).toBeNull();
    });
  });
});
