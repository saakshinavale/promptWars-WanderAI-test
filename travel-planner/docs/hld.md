# 🏗️ WanderAI — High Level Design (HLD)

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Landing   │  │ Results  │  │  Shared          │  │
│  │ Page      │→ │ Page     │  │  Components      │  │
│  │ (Form)    │  │ (Itin.)  │  │  (Nav, Map, etc) │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│         │              │              │              │
│         └──────────────┼──────────────┘              │
│                        ▼                             │
│              ┌─────────────────┐                     │
│              │  Service Layer  │                     │
│              │  (API Clients)  │                     │
│              └────┬────┬───┬──┘                     │
└───────────────────┼────┼───┼────────────────────────┘
                    │    │   │
          ┌─────────┘    │   └─────────┐
          ▼              ▼             ▼
   ┌────────────┐ ┌────────────┐ ┌──────────┐
   │ Google     │ │ Google     │ │ Open     │
   │ Gemini API │ │ Maps API   │ │ Meteo   │
   │ (AI Plan)  │ │ (Map View) │ │ (Weather)│
   └────────────┘ └────────────┘ └──────────┘
```

## 2. Tech Stack Decision

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | Vite + Vanilla JS | Fastest setup, no framework overhead, great DX |
| **Styling** | Vanilla CSS (design tokens) | Full control, matches mockup exactly |
| **AI** | Google Gemini API (`gemini-2.0-flash`) | Free tier, fast, Google Services criteria |
| **Maps** | Google Maps JavaScript API | Interactive markers, routes, Google Services |
| **Weather** | Open-Meteo API | 100% free, no API key, reliable |
| **Bundler** | Vite | HMR, fast builds, ES modules |
| **Testing** | Vitest | Vite-native, fast, zero-config |
| **Linting** | ESLint | Code quality criteria |

## 3. Project Structure

```
travel-planner/
├── docs/                    # Documentation
│   ├── requirements.md
│   └── hld.md
├── mockups/                 # UI Mockups (reference)
│   ├── landing.html
│   └── results.html
├── src/                     # Source Code
│   ├── index.html           # Landing page (form)
│   ├── results.html         # Results page (itinerary)
│   ├── css/
│   │   └── styles.css       # Global styles + design tokens
│   ├── js/
│   │   ├── main.js          # Landing page logic
│   │   ├── results.js       # Results page logic
│   │   ├── services/
│   │   │   ├── gemini.js    # Gemini API client
│   │   │   ├── maps.js      # Google Maps integration
│   │   │   └── weather.js   # Open-Meteo API client
│   │   └── utils/
│   │       ├── dom.js       # DOM helpers
│   │       └── validation.js # Input validation
│   └── assets/              # Static assets
├── tests/                   # Tests
│   ├── validation.test.js
│   ├── weather.test.js
│   └── gemini.test.js
├── .env                     # API keys (gitignored)
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

## 4. Data Flow

### User Journey
```
1. User fills form (destination, dates, budget, style, group)
         │
         ▼
2. Form validation (client-side)
         │
         ▼
3. Parallel API calls:
   ├─→ Gemini API: Generate itinerary (structured JSON)
   └─→ Open-Meteo: Fetch weather for destination + dates
         │
         ▼
4. Redirect to results page with data (URL params + sessionStorage)
         │
         ▼
5. Render itinerary cards + weather data
         │
         ▼
6. Initialize Google Maps with markers from itinerary
```

### Gemini Prompt Strategy
```
System: You are a travel planning AI. Generate structured itineraries.

User: Plan a {duration}-day trip to {destination} for {group_size}.
      Budget: {budget_level}
      Travel style: {styles}
      Constraints: {constraints}
      
      Return JSON with this structure:
      {
        "destination": { "name", "lat", "lng", "country" },
        "days": [
          {
            "day": 1,
            "title": "...",
            "date": "...",
            "activities": [
              {
                "time": "morning|afternoon|evening",
                "name": "...",
                "description": "...",
                "cost": "...",
                "lat": ...,
                "lng": ...,
                "tags": [...]
              }
            ]
          }
        ],
        "totalEstimatedCost": "...",
        "tips": [...]
      }
```

## 5. API Integration Details

### Google Gemini API
- **Model**: `gemini-2.0-flash` (fast, free tier: 15 RPM)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Auth**: API key in query param (client-side for hackathon, `.env` handled by Vite)
- **Response**: Structured JSON for itinerary

### Google Maps JavaScript API
- **Load**: Via script tag with API key
- **Features used**:
  - Map initialization with custom dark theme
  - Markers for each activity
  - InfoWindows for activity details
  - Geocoding for destination search
- **Note**: Can use Maps Embed API (free, no billing) as fallback

### Open-Meteo API
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Params**: latitude, longitude, daily forecast
- **No auth required**
- **Returns**: Temperature, weather codes, precipitation

## 6. Security Considerations

| Concern | Solution |
|---|---|
| API key exposure | `.env` file + Vite env variable prefix (`VITE_`) |
| Input validation | Sanitize all user inputs before API calls |
| XSS prevention | Use `textContent` not `innerHTML` for user data |
| Rate limiting | Debounce API calls, loading states to prevent spam |
| Error handling | Graceful fallbacks, user-friendly error messages |

## 7. Accessibility (WCAG 2.1 AA)

| Feature | Implementation |
|---|---|
| Keyboard navigation | All interactive elements focusable + navigable |
| Screen readers | ARIA labels, roles, live regions for dynamic content |
| Color contrast | 4.5:1 minimum ratio for text |
| Focus indicators | Visible focus rings on all interactive elements |
| Semantic HTML | Proper heading hierarchy, landmarks, form labels |
| Responsive | Works on mobile, tablet, desktop |

## 8. Testing Strategy

| Type | Tool | What to Test |
|---|---|---|
| Unit | Vitest | Input validation, data transformations, API response parsing |
| Integration | Vitest | Service layer API calls (mocked) |
| Accessibility | Manual + axe | ARIA, keyboard nav, contrast |
| E2E | Manual | Full user flow in browser |

## 9. Phase 1 Scope (1 Hour Build)

### Must Have ✅
- [x] Trip input form with all fields
- [x] Gemini AI itinerary generation
- [x] Display day-by-day itinerary cards
- [x] Google Maps with activity markers
- [x] Weather forecast display
- [x] Responsive design
- [x] Basic accessibility
- [x] Input validation
- [x] At least 3 unit tests

### Nice to Have (if time permits)
- [ ] Loading animation during AI generation
- [ ] Export itinerary as PDF
- [ ] Regenerate button
- [ ] Dark/light mode toggle

## 10. Performance

| Optimization | How |
|---|---|
| Lazy loading | Maps API loaded only on results page |
| Caching | Store itinerary in sessionStorage |
| Minimal dependencies | No heavy frameworks, vanilla JS |
| Async loading | Non-blocking API calls with Promise.all |
| Image optimization | Emoji icons instead of image files |
