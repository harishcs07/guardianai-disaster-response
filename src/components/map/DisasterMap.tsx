import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Hazard, MeshNode, Role, SafeRoute, Shelter, SOSRequest, WeatherCondition } from '../../types/disaster';
import { Layers, Wind, AlertTriangle, Compass, MapPin, Shield, Droplets } from 'lucide-react';

interface DisasterMapProps {
  currentRole: Role;
  shelters: Shelter[];
  hazards: Hazard[];
  victims: SOSRequest[];
  meshNodes: MeshNode[];
  selectedVictimId?: string | null;
  onSelectVictim?: (id: string) => void;
  safeRoute?: SafeRoute | null;
  userLocation?: { lat: number; lng: number };
  weather: WeatherCondition;
  isPinningLocation?: boolean;
  onPinLocationSelected?: (lat: number, lng: number) => void;
  heightClass?: string;
}

export const DisasterMap: React.FC<DisasterMapProps> = ({
  currentRole,
  shelters,
  hazards,
  victims,
  meshNodes,
  selectedVictimId,
  onSelectVictim,
  safeRoute,
  userLocation,
  weather,
  isPinningLocation,
  onPinLocationSelected,
  heightClass = 'h-full'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapMode, setMapMode] = useState<'POST_DISASTER' | 'PRE_DISASTER'>('POST_DISASTER');
  const [showShelters, setShowShelters] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [showVictims, setShowVictims] = useState(true);
  const [showMeshNodes, setShowMeshNodes] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = userLocation 
      ? [userLocation.lat, userLocation.lng]
      : [13.0640, 80.2450];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // 1. High-Performance Tactical Offline Canvas Grid Layer (Works 100% without Internet)
    const OfflineGridLayer = L.GridLayer.extend({
      createTile: function (coords: { x: number; y: number; z: number }) {
        const tile = document.createElement('canvas');
        tile.width = 256;
        tile.height = 256;
        const ctx = tile.getContext('2d');
        if (!ctx) return tile;

        ctx.fillStyle = '#060913';
        ctx.fillRect(0, 0, 256, 256);

        // Tactical grid lines
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 256; i += 64) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 256);
          ctx.moveTo(0, i);
          ctx.lineTo(256, i);
        }
        ctx.stroke();

        // Elevation / terrain contour lines
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(128, 128, 100, 50, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = '8px monospace';
        ctx.fillText(`GEO-GRID [${coords.x},${coords.y}]`, 8, 16);

        return tile;
      }
    });

    const offlineGrid = new (OfflineGridLayer as any)();
    offlineGrid.addTo(map);

    // 2. Free Standard Keyless OpenStreetMap Tile Layer with dark filter (no API keys, no watermarks)
    try {
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        className: 'osm-dark-tiles',
        errorTileUrl: ''
      });
      osmLayer.addTo(map);
    } catch {
      // Offline fallback handles it
    }

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;
    mapRef.current = map;

    // Trigger resize after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle click for location pinning
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isPinningLocation && onPinLocationSelected) {
        onPinLocationSelected(
          Math.round(e.latlng.lat * 10000) / 10000,
          Math.round(e.latlng.lng * 10000) / 10000
        );
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isPinningLocation, onPinLocationSelected]);

  // Redraw layers when data or mode changes
  useEffect(() => {
    const map = mapRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. PRE-DISASTER METEOROLOGICAL OVERLAY
    if (mapMode === 'PRE_DISASTER') {
      const stormCenter: [number, number] = [13.0640, 80.2550];
      const stormCircle = L.circle(stormCenter, {
        radius: 3800,
        color: '#f59e0b',
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#f59e0b',
        fillOpacity: 0.12
      });
      stormCircle.bindTooltip(
        `🌀 <b>Severe Storm Surge Prediction</b><br>Wind: ${weather.windSpeedKmh} km/h ${weather.windDirection}<br>Precipitation: ${weather.rainfallMmPerHour} mm/hr<br>Barometer: ${weather.barometricHpa} hPa`,
        { sticky: true, className: 'tactical-tooltip' }
      );
      group.addLayer(stormCircle);

      const windCoords = [[13.075, 80.23], [13.08, 80.26], [13.05, 80.23], [13.06, 80.26]];
      windCoords.forEach(([lat, lng]) => {
        const arrowHtml = `
          <div style="transform: rotate(55deg);" class="text-amber-400 font-bold text-xs flex items-center space-x-1">
            <span>➤➤</span>
            <span class="text-[9px] bg-slate-900/90 text-amber-300 px-1 rounded font-mono">${weather.windSpeedKmh}kph</span>
          </div>
        `;
        const icon = L.divIcon({ html: arrowHtml, className: 'wind-arrow', iconSize: [50, 20] });
        group.addLayer(L.marker([lat, lng], { icon }));
      });
    }

    // 2. DYNAMIC HAZARD ZONES (Post-Disaster)
    if (mapMode === 'POST_DISASTER' && showHazards) {
      hazards.filter(h => h.active).forEach(h => {
        let color = '#ef4444';
        let fillColor = '#ef4444';
        if (h.type === 'FLOOD') {
          color = '#0284c7';
          fillColor = '#0369a1';
        } else if (h.type === 'LIVE_WIRE') {
          color = '#eab308';
          fillColor = '#ca8a04';
        } else if (h.type === 'COLLAPSE') {
          color = '#ea580c';
          fillColor = '#c2410c';
        }

        if (h.polygonCoordinates && h.polygonCoordinates.length > 2) {
          const poly = L.polygon(h.polygonCoordinates, {
            color,
            weight: 2,
            fillColor,
            fillOpacity: 0.28
          });
          poly.bindPopup(`
            <div class="p-1 font-sans">
              <div class="font-bold text-red-400 text-xs uppercase mb-0.5">⚠️ ${h.type.replace('_', ' ')} ZONE</div>
              <div class="font-bold text-white text-sm mb-1">${h.title}</div>
              <div class="text-xs text-slate-300 mb-1 leading-tight">${h.description}</div>
              <div class="text-[9px] text-slate-400 font-mono">Reported: ${new Date(h.timestamp).toLocaleTimeString()}</div>
            </div>
          `);
          group.addLayer(poly);
        } else {
          const circle = L.circle([h.lat, h.lng], {
            radius: h.radiusMeters,
            color,
            weight: 2,
            fillColor,
            fillOpacity: 0.24
          });
          circle.bindPopup(`
            <div class="p-1 font-sans">
              <div class="font-bold text-red-400 text-xs uppercase">⚠️ ${h.type}</div>
              <div class="font-bold text-white text-sm">${h.title}</div>
              <p class="text-xs text-slate-300 mt-1">${h.description}</p>
            </div>
          `);
          group.addLayer(circle);
        }
      });
    }

    // 3. EVACUATION SHELTERS
    if (showShelters) {
      shelters.forEach(s => {
        const isFull = s.currentOccupancy >= s.capacity;
        const shelterHtml = `
          <div class="relative group cursor-pointer">
            <div class="w-7 h-7 rounded-full ${isFull ? 'bg-amber-600' : 'bg-emerald-600'} border-2 border-white text-white flex items-center justify-center shadow-lg font-bold text-xs ring-4 ring-emerald-500/20">
              ⌂
            </div>
            <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/90 text-[9px] px-1 rounded border border-emerald-500/30 text-emerald-300 font-mono">
              ${s.currentOccupancy}/${s.capacity}
            </div>
          </div>
        `;
        const icon = L.divIcon({ html: shelterHtml, className: 'shelter-marker', iconSize: [28, 28], iconAnchor: [14, 14] });
        const marker = L.marker([s.lat, s.lng], { icon });

        marker.bindPopup(`
          <div class="font-sans text-slate-100 p-1">
            <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-1 mb-1">
              <span class="font-bold text-emerald-400 text-xs">SAFE REFUGE</span>
              <span class="text-[9px] px-1 py-0.2 rounded ${isFull ? 'bg-amber-900 text-amber-200' : 'bg-emerald-950 text-emerald-200'}">${s.status}</span>
            </div>
            <h4 class="font-bold text-sm text-white">${s.name}</h4>
            <div class="grid grid-cols-2 gap-1 text-[10px] my-1.5 text-slate-300 font-mono">
              <div>Capacity: <b class="text-white">${s.currentOccupancy}/${s.capacity}</b></div>
              <div>Water: <b class="text-cyan-300">${s.waterRationsDays}d</b></div>
              <div>Food: <b class="text-white">${s.foodRationsDays}d</b></div>
              <div>Fuel: <b class="text-amber-300">${s.generatorFuelPercent}%</b></div>
            </div>
            <div class="text-[9px] text-amber-400 font-mono bg-slate-900 p-1 rounded">Radio: ${s.contactRadio}</div>
          </div>
        `);
        group.addLayer(marker);
      });
    }

    // 4. VICTIMS / SOS SIGNALS
    if (showVictims) {
      victims.forEach(v => {
        let markerColor = 'bg-red-600 animate-pulse ring-red-500/50';
        if (v.status === 'EN_ROUTE') markerColor = 'bg-amber-500 ring-amber-400/40';
        if (v.status === 'RESCUED') markerColor = 'bg-blue-600 ring-blue-400/30 opacity-70';
        if (v.status === 'TRANSFERRED') markerColor = 'bg-emerald-600 ring-emerald-400/30 opacity-60';

        const isSelected = selectedVictimId === v.id;
        const victimHtml = `
          <div class="relative cursor-pointer transition-transform ${isSelected ? 'scale-125 z-50' : ''}">
            <div class="w-6 h-6 rounded-full ${markerColor} border-2 border-white flex items-center justify-center text-white shadow-xl ring-2 font-black text-[10px]">
              !
            </div>
            <div class="absolute -top-3 -right-2 bg-slate-900 text-[8px] font-mono font-bold text-amber-300 px-1 rounded border border-amber-500/50">
              #${Math.round(v.priorityScore)}
            </div>
          </div>
        `;

        const icon = L.divIcon({ html: victimHtml, className: 'victim-marker', iconSize: [24, 24], iconAnchor: [12, 12] });
        const marker = L.marker([v.lat, v.lng], { icon });

        marker.on('click', () => {
          if (onSelectVictim) onSelectVictim(v.id);
        });

        marker.bindPopup(`
          <div class="font-sans text-slate-100 p-1">
            <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-1 mb-1">
              <span class="font-bold text-red-400 text-xs">SOS • SEV ${v.severity}/4</span>
              <span class="text-[9px] bg-red-950 text-red-300 px-1 rounded font-mono font-bold">SCORE: ${v.priorityScore}</span>
            </div>
            <div class="font-bold text-sm text-white">${v.senderName}</div>
            <div class="text-[10px] text-slate-300 mt-0.5">${v.addressDescription}</div>
            <div class="mt-1.5 text-[10px] bg-slate-900 p-1 rounded font-mono space-y-0.5">
              <div>Trapped: <b class="text-amber-300">${v.trappedCount} ppl</b></div>
              <div>Water: <b class="text-blue-300">${v.waterDepthCm}cm</b></div>
              <div>Battery: <b class="${v.batteryLevel < 20 ? 'text-red-400' : 'text-emerald-400'}">${v.batteryLevel}%</b></div>
              <div>Status: <b class="text-white">${v.status}</b></div>
            </div>
          </div>
        `);

        group.addLayer(marker);
      });
    }

    // 5. MESH RELAYS (Optional Toggle)
    if (showMeshNodes) {
      meshNodes.filter(n => n.active).forEach(n => {
        const nodeHtml = `
          <div class="w-5 h-5 rounded bg-slate-900 border border-cyan-400 text-[10px] flex items-center justify-center text-cyan-300 shadow">
            📡
          </div>
        `;
        const icon = L.divIcon({ html: nodeHtml, className: 'mesh-marker', iconSize: [20, 20], iconAnchor: [10, 10] });
        const marker = L.marker([n.lat, n.lng], { icon });
        marker.bindTooltip(`<b>${n.name}</b><br>RSSI: ${n.rssiDbm} dBm`, { className: 'tactical-tooltip' });
        group.addLayer(marker);
      });
    }

    // 6. SAFE EVACUATION NAVIGATION PATH
    if (safeRoute && safeRoute.waypoints.length > 1) {
      const routeLine = L.polyline(safeRoute.waypoints, {
        color: '#10b981',
        weight: 4,
        dashArray: '6, 6',
        opacity: 0.95
      });
      routeLine.bindTooltip(
        `🏃 <b>Safe Evacuation Corridor</b><br>${safeRoute.distanceKm} km (~${safeRoute.estimatedWalkingMins} mins)<br>Avoided: ${safeRoute.hazardsAvoided.length} hazard zones`,
        { sticky: true, className: 'tactical-tooltip' }
      );
      group.addLayer(routeLine);
    }

    // 7. CURRENT USER POSITION
    if (userLocation) {
      const userHtml = `
        <div class="relative">
          <div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg animate-ping absolute"></div>
          <div class="w-4 h-4 rounded-full bg-cyan-500 border-2 border-white shadow-lg relative"></div>
        </div>
      `;
      const icon = L.divIcon({ html: userHtml, className: 'user-marker', iconSize: [16, 16], iconAnchor: [8, 8] });
      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon });
      userMarker.bindTooltip('Your Offline Sensor Position', { permanent: false });
      group.addLayer(userMarker);
    }
  }, [
    mapMode,
    shelters,
    hazards,
    victims,
    meshNodes,
    selectedVictimId,
    safeRoute,
    userLocation,
    weather,
    showShelters,
    showHazards,
    showVictims,
    showMeshNodes
  ]);

  const recenterMap = () => {
    if (mapRef.current) {
      const target = userLocation ? [userLocation.lat, userLocation.lng] : [13.0640, 80.2450];
      mapRef.current.setView(target as [number, number], 14, { animate: true });
    }
  };

  return (
    <div className={`relative w-full ${heightClass} bg-slate-950 overflow-hidden select-none`}>
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Pinning Overlay Banner */}
      {isPinningLocation && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-slate-950 px-3 py-1.5 rounded-full font-bold text-xs shadow-xl flex items-center space-x-1.5 animate-bounce">
          <MapPin className="w-3.5 h-3.5" />
          <span>TAP MAP TO SET SOS PINPOINT</span>
        </div>
      )}

      {/* Mode Controls Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 text-xs shadow-xl">
        <button
          onClick={() => setMapMode('POST_DISASTER')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono flex items-center space-x-1 transition-all ${
            mapMode === 'POST_DISASTER'
              ? 'bg-red-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>POST-DISASTER</span>
        </button>

        <button
          onClick={() => setMapMode('PRE_DISASTER')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono flex items-center space-x-1 transition-all ${
            mapMode === 'PRE_DISASTER'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wind className="w-3 h-3" />
          <span>PRE-DISASTER</span>
        </button>

        <div className="flex items-center space-x-1 pl-1 border-l border-slate-800">
          <button
            onClick={() => setShowHazards(!showHazards)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
              showHazards ? 'bg-red-950/80 border-red-500 text-red-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            HAZARDS
          </button>
          <button
            onClick={() => setShowShelters(!showShelters)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
              showShelters ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            SHELTERS
          </button>
        </div>
      </div>

      {/* Recenter Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={recenterMap}
          className="w-9 h-9 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-cyan-400 hover:text-cyan-300 flex items-center justify-center shadow-lg active:scale-95"
          title="Recenter"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
