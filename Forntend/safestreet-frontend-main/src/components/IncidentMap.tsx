import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Fix for default Leaflet marker icon issues in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Helper function to create colored marker icons for different categories
const createColoredIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Colors associated with each incident category
const categoryIcons: { [key: string]: L.Icon } = {
  road_damage: createColoredIcon('blue'),
  flooding: createColoredIcon('red'),
  power_outage: createColoredIcon('gold'),
  water_issue: createColoredIcon('violet'),
  garbage: createColoredIcon('orange'),
  street_light: createColoredIcon('yellow'),
  other: createColoredIcon('grey'),
};

interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  latitude: number;
  longitude: number;
  status?: string;
  address?: string;
}

interface IncidentMapProps {
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  incidents?: Incident[]; // Receives existing incidents from the database
  onIncidentSelect?: (incident: Incident) => void; // Notifies parent component when a pin is clicked
}

// Helper component to draw the heatmap
function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    const heatLayer = (L as any).heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 15,
      max: 1.0,
      gradient: { 
        0.4: 'blue', 
        0.6: 'cyan', 
        0.7: 'lime', 
        0.8: 'yellow', 
        1.0: 'red' 
      }
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

// Helper component to handle clicking on the map to drop a pin
function LocationMarker({ onLocationSelect, activeCoords, setActiveCoords }: {
  onLocationSelect?: (lat: number, lng: number) => void;
  activeCoords: [number, number] | null;
  setActiveCoords: (coords: [number, number] | null) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setActiveCoords([lat, lng]);
      if (onLocationSelect) {
        onLocationSelect(lat, lng);
      }
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return activeCoords === null ? null : (
    <Marker position={activeCoords} icon={createColoredIcon('green')} />
  );
}

// Helper component to transition the map smoothly
function MapRecenter({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 14);
    }
  }, [coords, map]);
  return null;
}

export function IncidentMap({ interactive = true, onLocationSelect, incidents = [], onIncidentSelect }: IncidentMapProps) {
  const [activeCoords, setActiveCoords] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([24.8607, 67.0011]); // Defaults to Karachi
  const [isLocating, setIsLocating] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const heatPoints: [number, number, number][] = incidents.map((inc) => [
    inc.latitude,
    inc.longitude,
    inc.priority === 'critical' ? 1.0 : inc.priority === 'high' ? 0.7 : 0.4,
  ]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser!");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        setActiveCoords([latitude, longitude]);
        if (onLocationSelect) {
          onLocationSelect(latitude, longitude);
        }
        setIsLocating(false);
      },
      () => {
        alert("Unable to retrieve location. Please grant browser permissions.");
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-slate-200">
      {/* Control Actions Panel */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        <button
          type="button"
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`font-bold py-2 px-3 rounded-lg shadow-md transition text-xs flex items-center gap-1 cursor-pointer ${
            showHeatmap ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-white hover:bg-slate-100 text-slate-800'
          }`}
        >
          🔥 {showHeatmap ? 'Show Pins' : 'Heatmap'}
        </button>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg shadow-md transition text-xs flex items-center gap-1 cursor-pointer"
        >
          📍 {isLocating ? 'Locating...' : 'Locate Me'}
        </button>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter coords={activeCoords || mapCenter} />

        {interactive && !showHeatmap && (
          <LocationMarker 
            onLocationSelect={onLocationSelect} 
            activeCoords={activeCoords} 
            setActiveCoords={setActiveCoords} 
          />
        )}

        {/* Render markers OR render the Heatmap */}
        {showHeatmap ? (
          <HeatmapLayer points={heatPoints} />
        ) : (
          incidents.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={categoryIcons[incident.category] || categoryIcons['other']}
              eventHandlers={{
                click: () => {
                  // Trigger the drawer selection handler when a marker is clicked!
                  if (onIncidentSelect) {
                    onIncidentSelect(incident);
                  }
                },
              }}
            />
          ))
        )}
      </MapContainer>
    </div>
  );
}