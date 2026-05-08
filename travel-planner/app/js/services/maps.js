/* ===== services/maps.js ===== */
// Interactive map using Leaflet + Google Maps tiles (free, no API key)

let mapInstance = null;
let markers = [];
let routeLine = null;

/**
 * Load map — Leaflet is already loaded via script tag in HTML
 */
export function loadGoogleMaps() {
  return new Promise((resolve, reject) => {
    console.log('[Maps] Checking Leaflet:', window.L ? 'LOADED' : 'NOT FOUND');
    if (window.L) {
      resolve();
    } else {
      reject(new Error('Map library not loaded'));
    }
  });
}

/**
 * Initialize the map
 */
export function initMap(elementId, center, zoom = 13) {
  const mapEl = document.getElementById(elementId);
  console.log('[Maps] initMap called, element:', mapEl ? 'FOUND' : 'NOT FOUND');
  console.log('[Maps] Center:', center, 'Zoom:', zoom);
  if (!mapEl) throw new Error(`Map element #${elementId} not found`);

  mapInstance = L.map(mapEl).setView([center.lat, center.lng], zoom);
  console.log('[Maps] Map instance created');

  // Google Maps tiles (free, shows Google branding)
  L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: 'Map data &copy; <a href="https://www.google.com/maps">Google Maps</a>',
    maxZoom: 20
  }).addTo(mapInstance);
  console.log('[Maps] Tile layer added');

  return mapInstance;
}

/**
 * Add activity markers to the map
 */
export function addMarkers(activities) {
  if (!mapInstance) return;
  clearMarkers();

  const bounds = [];

  activities.forEach((activity, index) => {
    const latlng = [activity.lat, activity.lng];
    bounds.push(latlng);

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width:28px;height:28px;
        background:linear-gradient(135deg,#f97316,#ef4444);
        border-radius:50%;
        border:2px solid white;
        display:flex;align-items:center;justify-content:center;
        font-size:12px;font-weight:700;color:white;
        box-shadow:0 2px 8px rgba(249,115,22,0.5);
      ">${index + 1}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker(latlng, { icon }).addTo(mapInstance);

    const timeLabel = activity.time ? activity.time.charAt(0).toUpperCase() + activity.time.slice(1) : '';
    marker.bindPopup(`
      <div style="font-family:Inter,sans-serif;min-width:180px;">
        <div style="font-size:11px;color:#f97316;font-weight:600;text-transform:uppercase;margin-bottom:4px;">
          Day ${activity.day || ''} · ${timeLabel}
        </div>
        <div style="font-size:14px;font-weight:700;margin-bottom:4px;">${activity.name}</div>
        <div style="font-size:12px;color:#555;line-height:1.4;">${activity.description || ''}</div>
        ${activity.cost ? `<div style="font-size:12px;color:#14b8a6;font-weight:600;margin-top:6px;">${activity.cost}</div>` : ''}
      </div>
    `);

    markers.push(marker);
  });

  if (bounds.length > 1) {
    mapInstance.fitBounds(bounds, { padding: [40, 40] });
  }
}

/**
 * Draw a route line connecting activities
 */
export function drawRoute(activities) {
  if (!mapInstance || activities.length < 2) return;

  const path = activities.map(a => [a.lat, a.lng]);

  routeLine = L.polyline(path, {
    color: '#4285F4',
    weight: 3,
    opacity: 0.7,
    dashArray: '8, 8'
  }).addTo(mapInstance);
}

/**
 * Remove all markers
 */
export function clearMarkers() {
  if (!mapInstance) return;
  markers.forEach(m => mapInstance.removeLayer(m));
  markers = [];
  if (routeLine) {
    mapInstance.removeLayer(routeLine);
    routeLine = null;
  }
}

export function getMap() {
  return mapInstance;
}
