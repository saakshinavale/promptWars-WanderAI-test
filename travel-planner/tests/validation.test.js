import { describe, it, expect } from 'vitest';

/**
 * Validation logic extracted for testing
 * (mirrors the logic in app/js/main.js)
 */
function validateDestination(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Please enter a destination';
  if (trimmed.length < 2) return 'Destination must be at least 2 characters';
  return null;
}

function validateDates(start, end) {
  if (!start || !end) return 'Please select both start and end dates';
  if (start > end) return 'End date must be after start date';
  return null;
}

function getDayCount(start, end) {
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1);
}

describe('Form Validation', () => {
  describe('validateDestination', () => {
    it('returns error for empty input', () => {
      expect(validateDestination('')).toBe('Please enter a destination');
    });

    it('returns error for whitespace-only input', () => {
      expect(validateDestination('   ')).toBe('Please enter a destination');
    });

    it('returns error for single character', () => {
      expect(validateDestination('A')).toBe('Destination must be at least 2 characters');
    });

    it('returns null for valid destination', () => {
      expect(validateDestination('Paris, France')).toBeNull();
    });

    it('returns null for destination with special characters', () => {
      expect(validateDestination('São Paulo')).toBeNull();
    });
  });

  describe('validateDates', () => {
    it('returns error when start date is missing', () => {
      expect(validateDates('', '2026-05-20')).toBe('Please select both start and end dates');
    });

    it('returns error when end date is missing', () => {
      expect(validateDates('2026-05-15', '')).toBe('Please select both start and end dates');
    });

    it('returns error when end is before start', () => {
      expect(validateDates('2026-05-20', '2026-05-15')).toBe('End date must be after start date');
    });

    it('returns null for valid date range', () => {
      expect(validateDates('2026-05-15', '2026-05-20')).toBeNull();
    });

    it('returns null when start equals end (single day trip)', () => {
      expect(validateDates('2026-05-15', '2026-05-15')).toBeNull();
    });
  });

  describe('getDayCount', () => {
    it('returns 1 for same-day trip', () => {
      expect(getDayCount('2026-05-15', '2026-05-15')).toBe(1);
    });

    it('returns 2 for overnight trip', () => {
      expect(getDayCount('2026-05-15', '2026-05-16')).toBe(2);
    });

    it('returns 6 for a 5-night trip', () => {
      expect(getDayCount('2026-05-15', '2026-05-20')).toBe(6);
    });

    it('handles month boundaries', () => {
      expect(getDayCount('2026-05-30', '2026-06-02')).toBe(4);
    });
  });
});
