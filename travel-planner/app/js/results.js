/* ===== RESULTS PAGE - results.js ===== */
import { generateItinerary } from './services/gemini.js';
import { fetchWeather, getWeatherInfo } from './services/weather.js';
import { loadGoogleMaps, initMap, addMarkers, drawRoute } from './services/maps.js';

// DOM references
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const mainContent = document.getElementById('main-content');
const errorMessage = document.getElementById('error-message');

const stepAi = document.getElementById('step-ai');
const stepWeather = document.getElementById('step-weather');
const stepMap = document.getElementById('step-map');

const tripTitle = document.getElementById('trip-title');
const tripMeta = document.getElementById('trip-meta');
const weatherIcon = document.getElementById('weather-icon');
const weatherTitle = document.getElementById('weather-title');
const weatherDesc = document.getElementById('weather-desc');
const tempHigh = document.getElementById('temp-high');
const tempRange = document.getElementById('temp-range');
const itineraryContainer = document.getElementById('itinerary-container');
const budgetSummary = document.getElementById('budget-summary');
const budgetAmount = document.getElementById('budget-amount');
const budgetTips = document.getElementById('budget-tips');
const tipsSection = document.getElementById('tips-section');
const tipsList = document.getElementById('tips-list');
const mapLoading = document.getElementById('map-loading');

let currentTripData = null;
let currentItinerary = null;

/**
 * Main initialization
 */
async function init() {
  currentTripData = JSON.parse(sessionStorage.getItem('tripData'));

  if (!currentTripData) {
    window.location.href = 'index.html';
    return;
  }

  try {
    await loadTrip(currentTripData);
  } catch (err) {
    console.error('[Results] CAUGHT ERROR:', err);
    showError(err.message || 'Something went wrong. Please try again.');
  }
}

// Catch any unhandled errors that might show the error state
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Results] Unhandled rejection:', event.reason);
  event.preventDefault(); // Don't let it crash the page
});

/**
 * Load trip: generate itinerary + fetch weather + init map
 */
async function loadTrip(tripData) {
  showLoading();

  // Step 1: Generate itinerary
  markStep(stepAi, 'active');
  const itinerary = await generateItinerary(tripData);
  currentItinerary = itinerary;
  markStep(stepAi, 'done');

  // Step 2: Fetch weather (non-blocking — don't fail the whole page)
  markStep(stepWeather, 'active');
  let weather = null;
  try {
    const dest = itinerary.destination;
    weather = await fetchWeather(dest.lat, dest.lng, tripData.startDate, tripData.endDate);
  } catch (e) {
    console.warn('Weather fetch failed:', e.message);
  }
  markStep(stepWeather, 'done');

  // Step 3: Load map
  markStep(stepMap, 'active');
  let mapReady = false;
  try {
    await loadGoogleMaps();
    mapReady = true;
    console.log('[Results] Map library loaded successfully');
  } catch (e) {
    console.warn('[Results] Maps failed to load:', e.message);
  }
  markStep(stepMap, 'done');

  // Render everything
  renderTripHeader(tripData, itinerary);
  renderWeatherBanner(weather, itinerary.destination);
  renderItinerary(itinerary, weather);
  renderBudget(itinerary);
  renderTips(itinerary);

  // Show main content FIRST
  loadingState.hidden = true;
  loadingState.style.display = 'none';
  errorState.hidden = true;
  errorState.style.display = 'none';
  mainContent.hidden = false;
  mainContent.style.display = 'grid';
  console.log('[Results] ✅ Page render complete');

  // Then render map (non-blocking)
  if (mapReady) {
    console.log('[Results] Calling renderMap...');
    try {
      renderMap(itinerary);
    } catch (e) {
      console.warn('[Results] Map render error (non-fatal):', e.message);
      if (mapLoading) mapLoading.innerHTML = '<p style="color:var(--text-muted);">Map render failed</p>';
    }
  } else {
    console.warn('[Results] Map not ready, showing fallback');
    if (mapLoading) mapLoading.innerHTML = '<p style="color:var(--text-muted);">Map unavailable</p>';
  }
}

/**
 * Render the trip header with destination and meta tags
 */
function renderTripHeader(tripData, itinerary) {
  const dest = itinerary.destination;
  tripTitle.textContent = `${dest.name}, ${dest.country}`;

  const startFormatted = formatDate(tripData.startDate);
  const endFormatted = formatDate(tripData.endDate);
  const styles = tripData.styles.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
  const groupText = tripData.adults + (tripData.children > 0 ? ` + ${tripData.children} kids` : '');

  tripMeta.innerHTML = `
    <span class="meta-tag">📅 ${startFormatted} – ${endFormatted}</span>
    <span class="meta-tag">💎 ${capitalize(tripData.budget)}</span>
    ${styles ? `<span class="meta-tag">🎯 ${styles}</span>` : ''}
    <span class="meta-tag">👥 ${groupText}</span>
  `;
}

/**
 * Render the weather summary banner
 */
function renderWeatherBanner(weather, destination) {
  if (!weather || !weather.summary) {
    weatherTitle.textContent = `Weather in ${destination.name}`;
    weatherDesc.textContent = 'Forecast unavailable';
    return;
  }

  weatherIcon.textContent = weather.summary.icon;
  weatherTitle.textContent = `Weather in ${destination.name}`;
  weatherDesc.textContent = weather.summary.description;
  tempHigh.textContent = `${weather.summary.avgHigh}°C`;
  tempRange.textContent = `Low: ${weather.summary.avgLow}°C`;
}

/**
 * Render day-by-day itinerary cards
 */
function renderItinerary(itinerary, weather) {
  itineraryContainer.innerHTML = '';

  const days = itinerary.days || [];

  days.forEach((day) => {
    const daySection = document.createElement('div');
    daySection.className = 'day-section';

    // Day weather from forecast
    let dayWeatherHtml = '';
    if (weather && weather.days) {
      const dayForecast = weather.days.find(w => w.date === day.date) || weather.days[day.day - 1];
      if (dayForecast) {
        dayWeatherHtml = `<div class="day-weather">${dayForecast.icon} ${dayForecast.tempMax}°C</div>`;
      }
    }

    // Day header
    daySection.innerHTML = `
      <div class="day-header">
        <div class="day-label">
          <div class="day-number">${day.day}</div>
          <div>
            <div class="day-title">${escapeHtml(day.title)}</div>
            <div class="day-date">${day.date ? formatDate(day.date) : `Day ${day.day}`}</div>
          </div>
        </div>
        ${dayWeatherHtml}
      </div>
    `;

    // Activity cards
    const activities = day.activities || [];
    activities.forEach((activity) => {
      const timeClass = `time-${activity.time}`;
      const timeLabel = capitalize(activity.time);
      const tags = (activity.tags || []).map(t => `<span class="activity-tag">${escapeHtml(t)}</span>`).join('');

      const card = document.createElement('div');
      card.className = 'activity-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${timeLabel}: ${activity.name}`);
      card.innerHTML = `
        <div class="activity-top">
          <span class="activity-time ${timeClass}">${getTimeIcon(activity.time)} ${timeLabel}</span>
          <span class="activity-cost">${escapeHtml(activity.cost || '')}</span>
        </div>
        <div class="activity-name">${escapeHtml(activity.name)}</div>
        <div class="activity-desc">${escapeHtml(activity.description || '')}</div>
        ${tags ? `<div class="activity-tags">${tags}</div>` : ''}
      `;

      // Click to highlight on map
      card.addEventListener('click', () => {
        if (activity.lat && activity.lng && window.google) {
          const map = window.google.maps && document.getElementById('map');
          // Scroll map panel into view on mobile
          if (map) map.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      daySection.appendChild(card);
    });

    itineraryContainer.appendChild(daySection);
  });
}

/**
 * Render budget summary
 */
function renderBudget(itinerary) {
  if (!itinerary.totalEstimatedCost) return;

  budgetAmount.textContent = itinerary.totalEstimatedCost;
  budgetTips.textContent = `Estimated for ${itinerary.days?.length || 0} days`;
  budgetSummary.hidden = false;
}

/**
 * Render travel tips
 */
function renderTips(itinerary) {
  const tips = itinerary.tips || [];
  if (tips.length === 0) return;

  tipsList.innerHTML = tips.map(tip => `<li>${escapeHtml(tip)}</li>`).join('');
  tipsSection.hidden = false;
}

/**
 * Initialize map with activity markers
 */
function renderMap(itinerary) {
  console.log('[Results] renderMap called');
  const dest = itinerary.destination;
  console.log('[Results] Destination:', dest);
  const map = initMap('map', { lat: dest.lat, lng: dest.lng });

  // Flatten all activities with day info
  const allActivities = [];
  (itinerary.days || []).forEach((day) => {
    (day.activities || []).forEach((activity) => {
      if (activity.lat && activity.lng) {
        allActivities.push({ ...activity, day: day.day });
      }
    });
  });

  console.log('[Results] Activities for map:', allActivities.length);

  if (allActivities.length > 0) {
    addMarkers(allActivities);
    drawRoute(allActivities);
  }

  // Hide map loading overlay
  if (mapLoading) {
    console.log('[Results] Hiding map loading overlay');
    mapLoading.hidden = true;
  }
}

// === UI Helpers ===

function showLoading() {
  loadingState.hidden = false;
  errorState.hidden = true;
  mainContent.hidden = true;
}

function showError(message) {
  loadingState.hidden = true;
  errorState.hidden = false;
  mainContent.hidden = true;
  errorMessage.textContent = message;
}

function markStep(el, state) {
  if (!el) return;
  el.classList.remove('active', 'done');
  el.classList.add(state);
}

// === Utility Helpers ===

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getTimeIcon(time) {
  switch (time) {
    case 'morning': return '☀';
    case 'afternoon': return '🌤';
    case 'evening': return '🌙';
    default: return '📍';
  }
}

/**
 * Regenerate trip — called from the button in results.html
 */
window.regenerateTrip = async function () {
  if (!currentTripData) return;
  try {
    await loadTrip(currentTripData);
  } catch (err) {
    showError(err.message || 'Failed to regenerate. Please try again.');
  }
};

// Boot
document.addEventListener('DOMContentLoaded', init);
