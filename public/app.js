// GuardianAI Standalone Client-Side Mobile Logic (100% Offline Compatible)

const STATE = {
  currentRole: 'CIVILIAN',
  activeTab: 'SOS',
  userLocation: { lat: 13.0575, lng: 80.2420 },
  audioBeaconActive: false,
  visualBeaconActive: false,
  audioCtx: null,
  audioInterval: null,
  visualInterval: null,
  map: null,
  victims: [],
  hazards: [],
  shelters: []
};

// Web Audio API Acoustic Siren
function toggleAudioBeacon() {
  STATE.audioBeaconActive = !STATE.audioBeaconActive;
  const btn = document.getElementById('btn-siren');

  if (STATE.audioBeaconActive) {
    if (!STATE.audioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      STATE.audioCtx = new AudioClass();
    }
    if (STATE.audioCtx.state === 'suspended') {
      STATE.audioCtx.resume();
    }

    let toggle = false;
    STATE.audioInterval = setInterval(() => {
      if (!STATE.audioBeaconActive) return;
      const osc = STATE.audioCtx.createOscillator();
      const gain = STATE.audioCtx.createGain();
      osc.type = 'sawtooth';
      const freq = toggle ? 1800 : 1200;
      toggle = !toggle;
      osc.frequency.setValueAtTime(freq, STATE.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.5, STATE.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, STATE.audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(STATE.audioCtx.destination);
      osc.start();
      osc.stop(STATE.audioCtx.currentTime + 0.35);
    }, 400);

    if (btn) btn.innerText = 'SIREN ACTIVE';
  } else {
    if (STATE.audioInterval) clearInterval(STATE.audioInterval);
    if (btn) btn.innerText = 'SIREN BEACON';
  }
}

// Visual SOS Strobe
function toggleVisualBeacon() {
  STATE.visualBeaconActive = !STATE.visualBeaconActive;
  const overlay = document.getElementById('strobe-overlay');
  const btn = document.getElementById('btn-strobe');

  if (STATE.visualBeaconActive) {
    let on = false;
    STATE.visualInterval = setInterval(() => {
      on = !on;
      if (overlay) overlay.style.display = on ? 'block' : 'none';
    }, 150);
    if (btn) btn.innerText = 'STROBE ACTIVE';
  } else {
    if (STATE.visualInterval) clearInterval(STATE.visualInterval);
    if (overlay) overlay.style.display = 'none';
    if (btn) btn.innerText = 'SOS STROBE';
  }
}

// Navigation Tab Switcher
function switchTab(tabId) {
  STATE.activeTab = tabId;
  document.querySelectorAll('.screen-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(`screen-${tabId.toLowerCase()}`);
  if (target) target.classList.add('active');

  const tabBtn = document.getElementById(`tab-btn-${tabId.toLowerCase()}`);
  if (tabBtn) tabBtn.classList.add('active');

  if (tabId === 'MAP' && STATE.map) {
    setTimeout(() => STATE.map.invalidateSize(), 150);
  }
}

// Initialize Offline Map with OSM / Vector fallback
function initMap() {
  const container = document.getElementById('map-viewport');
  if (!container || STATE.map) return;

  STATE.map = L.map('map-viewport', {
    center: [STATE.userLocation.lat, STATE.userLocation.lng],
    zoom: 14,
    zoomControl: false,
    attributionControl: false
  });

  // Offline Canvas Grid fallback
  const OfflineGrid = L.GridLayer.extend({
    createTile: function (coords) {
      const tile = document.createElement('canvas');
      tile.width = 256;
      tile.height = 256;
      const ctx = tile.getContext('2d');
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(0, 0, 256, 256);
      return tile;
    }
  });
  new OfflineGrid().addTo(STATE.map);

  // Keyless Free OSM Tiles
  try {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'osm-dark-tiles'
    }).addTo(STATE.map);
  } catch (e) {
    // Canvas fallback active
  }

  // User Marker
  L.circleMarker([STATE.userLocation.lat, STATE.userLocation.lng], {
    radius: 8,
    color: '#06b6d4',
    fillColor: '#06b6d4',
    fillOpacity: 0.9
  }).addTo(STATE.map).bindPopup('Your Offline GPS Position');
}

// Fetch Initial State
async function loadState() {
  try {
    const res = await fetch('/api/state');
    const data = await res.json();
    STATE.victims = data.victims || [];
    STATE.hazards = data.hazards || [];
    STATE.shelters = data.shelters || [];
  } catch {
    console.log('Running in local offline client mode');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initMap();
});
