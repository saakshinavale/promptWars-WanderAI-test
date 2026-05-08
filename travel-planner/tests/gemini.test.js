import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Gemini response parsing logic (extracted for testability)
 */
function parseGeminiResponse(text) {
  if (!text) throw new Error('Empty response from Gemini');

  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try removing newlines as fallback
    try {
      return JSON.parse(cleaned.replace(/\n/g, ''));
    } catch (e2) {
      throw new Error('Failed to parse Gemini response as JSON');
    }
  }
}

function buildPrompt(tripData) {
  return `You are a travel planner AI. Create a detailed day‑by‑day itinerary for a ${tripData.days}-day trip to ${tripData.destination}.
Budget: ${tripData.budget}
Travel style: ${tripData.styles.join(', ') || 'none'}
Group: ${tripData.adults} adult(s), ${tripData.children} child(ren)
Dates: ${tripData.startDate} to ${tripData.endDate}
Special constraints: ${tripData.constraints || 'none'}.`;
}

describe('Gemini Service', () => {
  describe('parseGeminiResponse', () => {
    it('parses clean JSON', () => {
      const json = '{"destination":{"name":"Paris","lat":48.85,"lng":2.35,"country":"France"},"days":[],"totalEstimatedCost":"€500","tips":[]}';
      const result = parseGeminiResponse(json);
      expect(result.destination.name).toBe('Paris');
      expect(result.days).toEqual([]);
    });

    it('strips markdown code fences', () => {
      const wrapped = '```json\n{"destination":{"name":"Tokyo"},"days":[]}\n```';
      const result = parseGeminiResponse(wrapped);
      expect(result.destination.name).toBe('Tokyo');
    });

    it('strips code fences without language tag', () => {
      const wrapped = '```\n{"destination":{"name":"London"},"days":[]}\n```';
      const result = parseGeminiResponse(wrapped);
      expect(result.destination.name).toBe('London');
    });

    it('throws on empty response', () => {
      expect(() => parseGeminiResponse('')).toThrow('Empty response from Gemini');
      expect(() => parseGeminiResponse(null)).toThrow('Empty response from Gemini');
    });

    it('throws on invalid JSON', () => {
      expect(() => parseGeminiResponse('not json at all')).toThrow('Failed to parse Gemini response as JSON');
    });

    it('parses response with activities', () => {
      const json = JSON.stringify({
        destination: { name: 'Rome', lat: 41.9, lng: 12.5, country: 'Italy' },
        days: [{
          day: 1,
          title: 'Ancient Rome',
          date: '2026-06-01',
          activities: [{
            time: 'morning',
            name: 'Colosseum',
            description: 'Visit the ancient amphitheater',
            cost: '~€16',
            lat: 41.89,
            lng: 12.49,
            tags: ['Culture', 'History']
          }]
        }],
        totalEstimatedCost: '€200',
        tips: ['Wear comfortable shoes']
      });
      const result = parseGeminiResponse(json);
      expect(result.days).toHaveLength(1);
      expect(result.days[0].activities[0].name).toBe('Colosseum');
      expect(result.tips).toContain('Wear comfortable shoes');
    });
  });

  describe('buildPrompt', () => {
    const tripData = {
      destination: 'Paris, France',
      days: 5,
      budget: 'mid-range',
      styles: ['culture', 'food'],
      adults: 2,
      children: 0,
      startDate: '2026-05-15',
      endDate: '2026-05-20',
      constraints: 'vegetarian food'
    };

    it('includes destination', () => {
      const prompt = buildPrompt(tripData);
      expect(prompt).toContain('Paris, France');
    });

    it('includes day count', () => {
      const prompt = buildPrompt(tripData);
      expect(prompt).toContain('5-day trip');
    });

    it('includes budget level', () => {
      const prompt = buildPrompt(tripData);
      expect(prompt).toContain('mid-range');
    });

    it('includes travel styles', () => {
      const prompt = buildPrompt(tripData);
      expect(prompt).toContain('culture, food');
    });

    it('includes group size', () => {
      const prompt = buildPrompt(tripData);
      expect(prompt).toContain('2 adult(s), 0 child(ren)');
    });

    it('includes constraints', () => {
      const prompt = buildPrompt(tripData);
      expect(prompt).toContain('vegetarian food');
    });

    it('handles empty styles', () => {
      const noStyles = { ...tripData, styles: [] };
      const prompt = buildPrompt(noStyles);
      expect(prompt).toContain('none');
    });

    it('handles empty constraints', () => {
      const noConstraints = { ...tripData, constraints: '' };
      const prompt = buildPrompt(noConstraints);
      expect(prompt).toContain('Special constraints: none');
    });
  });
});
