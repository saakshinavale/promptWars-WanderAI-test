/* ===== services/gemini.js ===== */
// Simple Gemini API wrapper – expects VITE_GEMINI_API_KEY in .env
export async function generateItinerary(tripData) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not set');

  const prompt = `You are a travel planner AI. Create a detailed day‑by‑day itinerary for a ${tripData.days}-day trip to ${tripData.destination}.
Budget: ${tripData.budget}\nTravel style: ${tripData.styles.join(', ') || 'none'}\nGroup: ${tripData.adults} adult(s), ${tripData.children} child(ren)\nDates: ${tripData.startDate} to ${tripData.endDate}\nSpecial constraints: ${tripData.constraints || 'none'}.
Return JSON with the following shape:
{
  "destination": {"name": "", "lat": 0, "lng": 0, "country": ""},
  "days": [{"day":1,"title":"","date":"","activities":[{"time":"morning|afternoon|evening","name":"","description":"","cost":"","lat":0,"lng":0,"tags":[""]}]},
  "totalEstimatedCost": "",
  "tips": []
}
`; 

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Gemini request failed');

  // Extract the first text part
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  try {
    return JSON.parse(text);
  } catch (e) {
    // If Gemini returns plain text, attempt to eval safely (not recommended in prod)
    console.warn('Gemini response not pure JSON, attempting fallback');
    return JSON.parse(text.replace(/\n/g, ''));
  }
}
