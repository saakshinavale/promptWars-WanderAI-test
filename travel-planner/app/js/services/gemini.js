/* ===== services/gemini.js ===== */
// Simple Gemini API wrapper – expects VITE_GEMINI_API_KEY in .env

// Set to true to test without hitting the API
const USE_MOCK = false;

/**
 * Mock itinerary for testing UI without API calls
 */
function getMockItinerary(tripData) {
  const startDate = new Date(tripData.startDate);
  const days = [];
  for (let i = 0; i < tripData.days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      day: i + 1,
      title: ['Arrival & Exploration', 'Cultural Immersion', 'Adventure Day', 'Local Flavors', 'Hidden Gems', 'Farewell Day'][i % 6],
      date: dateStr,
      activities: [
        { time: 'morning', name: `Morning at ${tripData.destination}`, description: 'Start your day exploring the local area with a guided walking tour of the historic district.', cost: '~$20', lat: 48.8566 + (i * 0.01), lng: 2.3522 + (i * 0.01), tags: ['Culture', 'Walking'] },
        { time: 'afternoon', name: `Afternoon Activity Day ${i + 1}`, description: 'Visit a popular local attraction and enjoy the scenery. Perfect for photos and relaxation.', cost: '~$35', lat: 48.8606 + (i * 0.01), lng: 2.3376 + (i * 0.01), tags: ['Experience', 'Scenic'] },
        { time: 'evening', name: `Dinner Experience Day ${i + 1}`, description: 'Enjoy authentic local cuisine at a highly-rated restaurant recommended by locals.', cost: '~$50', lat: 48.8530 + (i * 0.01), lng: 2.3499 + (i * 0.01), tags: ['Food', 'Local'] }
      ]
    });
  }
  return {
    destination: { name: tripData.destination, lat: 48.8566, lng: 2.3522, country: 'France' },
    days,
    totalEstimatedCost: `~$${tripData.days * 105}`,
    tips: [
      'Book popular attractions in advance to skip the lines',
      'Use public transport — it is efficient and affordable',
      'Learn a few basic phrases in the local language',
      'Keep a copy of your passport separate from the original'
    ]
  };
}

/**
 * Fetch with no retry — shows clear error on rate limit
 */
async function fetchWithRetry(url, options) {
  const response = await fetch(url, options);
  if (response.status === 429) {
    throw new Error('Rate limited by Gemini API. Please wait 1-2 minutes and click Regenerate.');
  }
  return response;
}

export async function generateItinerary(tripData) {
  // Use mock data for testing without API
  if (USE_MOCK) {
    console.log('Using MOCK data (set USE_MOCK = false in gemini.js for real API)');
    await new Promise(r => setTimeout(r, 1500)); // Simulate network delay
    return getMockItinerary(tripData);
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log('Gemini API key loaded:', apiKey ? 'Yes (' + apiKey.substring(0, 8) + '...)' : 'NO - missing!');
  if (!apiKey) throw new Error('Gemini API key not set. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.');

  const prompt = `You are a travel planner AI. Create a detailed day‑by‑day itinerary for a ${tripData.days}-day trip to ${tripData.destination}.
Budget: ${tripData.budget}
Travel style: ${tripData.styles.join(', ') || 'none'}
Group: ${tripData.adults} adult(s), ${tripData.children} child(ren)
Dates: ${tripData.startDate} to ${tripData.endDate}
Special constraints: ${tripData.constraints || 'none'}.

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "destination": {"name": "", "lat": 0, "lng": 0, "country": ""},
  "days": [
    {
      "day": 1,
      "title": "",
      "date": "YYYY-MM-DD",
      "activities": [
        {"time": "morning", "name": "", "description": "", "cost": "", "lat": 0, "lng": 0, "tags": [""]}
      ]
    }
  ],
  "totalEstimatedCost": "",
  "tips": []
}
`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  };

  const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Gemini request failed');

  // Extract the first text part
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  // Strip markdown code fences if present (Gemini often wraps JSON in ```json ... ```)
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Fallback: try removing newlines
    try {
      return JSON.parse(cleaned.replace(/\n/g, ''));
    } catch (e2) {
      console.error('Gemini response:', text);
      throw new Error('Failed to parse itinerary. Please try again.');
    }
  }
}
