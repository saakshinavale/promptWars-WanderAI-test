# 🧳 Travel Planning & Experience Engine — Requirements

## Challenge Statement
> Plan trips dynamically with preferences, constraints, and real-time updates.

---

## Evaluation Criteria
| Criteria | Weight | Notes |
|---|---|---|
| Code Quality | ⭐ | Clean, well-structured, readable code |
| Security | ⭐ | Input validation, safe API key handling |
| Efficiency | ⭐ | Fast load times, optimized API calls |
| Testing | ⭐ | Unit tests, integration tests |
| Accessibility | ⭐ | ARIA labels, keyboard nav, contrast |
| Google Services | ⭐ | Gemini AI, Google Maps integration |

---

## Hackathon Timeline
| Phase | Duration | Goal |
|---|---|---|
| Phase 1 (Test) | ~1 hour | Basic working solution — core features |
| Break | — | — |
| Phase 2 (Final) | TBD | Enhanced features, polish, final submission |

---

## Phase 1 — Core Requirements (MVP)

### 1. Trip Input Form
- **Destination**: Text input with suggestions
- **Travel Dates**: Start and end date pickers
- **Budget**: Range selector (Budget / Mid-range / Luxury)
- **Travel Style**: Multi-select (Adventure, Relaxation, Culture, Food, Nature)
- **Group Size**: Number input (solo, couple, family, group)
- **Constraints**: Free text (dietary needs, mobility, etc.)

### 2. AI Itinerary Generator
- **API**: Google Gemini API (free tier via AI Studio)
- **Input**: User preferences from the form
- **Output**: Day-by-day itinerary with:
  - Morning / Afternoon / Evening activities
  - Estimated costs
  - Brief descriptions
  - Location coordinates for map plotting

### 3. Map Visualization
- **API**: Google Maps Embed or JavaScript API (free tier)
- **Features**:
  - Show all itinerary stops as markers
  - Click markers for activity details
  - Visual route between stops

### 4. Real-Time Weather
- **API**: Open-Meteo (free, no API key required)
- **Features**:
  - Show weather forecast for destination during travel dates
  - Weather icons on itinerary days
  - Suggest indoor alternatives on rainy days (via Gemini)

### 5. UI/UX
- Modern, responsive design
- Mobile-friendly
- Dark/light mode (if time permits)
- Accessible (WCAG 2.1 AA)
- Loading states and error handling

---

## Phase 2 — Enhanced Features (Stretch Goals)

| Feature | Description |
|---|---|
| Multi-city trips | Plan trips across multiple destinations |
| Save & share | Export itinerary as PDF or shareable link |
| User accounts | Firebase Auth for saving trip history |
| Places details | Google Places API for reviews, photos, ratings |
| Budget tracker | Track spending vs. budget in real-time |
| Drag & drop | Reorder itinerary items |
| Collaborative | Multiple users editing same trip |
| Notifications | Alerts for weather changes, price drops |

---

## Tech Stack (Proposed)

| Layer | Technology | Reason |
|---|---|---|
| Frontend | **Vite + Vanilla JS** or **Next.js** | Fast setup, modern tooling |
| Styling | **Vanilla CSS** | Full control, no dependencies |
| AI | **Google Gemini API** | Free tier, Google Services criteria |
| Maps | **Google Maps JS API** | Google Services criteria |
| Weather | **Open-Meteo API** | Free, no key required |
| Hosting | **Local dev** (Phase 1) | Speed |
| Testing | **Vitest** | Fast, Vite-native |

---

## Free APIs — No Keys Required

| API | URL | Purpose |
|---|---|---|
| Open-Meteo | https://open-meteo.com/ | Weather forecasts |
| Gemini | https://aistudio.google.com | AI itinerary (free API key) |
| Google Maps | Console | Maps embed (free tier) |

---

## Constraints & Assumptions
1. No backend server for Phase 1 — everything runs client-side
2. Gemini API key will be available (user obtaining it)
3. No user authentication in Phase 1
4. Single-city trips only in Phase 1
5. English language only
