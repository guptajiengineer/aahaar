import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Use DivIcons to avoid the Vite/Leaflet default-icon asset issue
const makeCircleIcon = (color, size = 18) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  });

const myLocationIcon = makeCircleIcon('#3D6B4F', 20);  // primary green
const listingIcon = makeCircleIcon('#E8943A', 16);  // accent orange

const containerStyle = { width: '100%', height: '400px' };

export default function MapComponent({ center, markers = [], onMarkerClick }) {
  // center = { lat, lng }
  const position = useMemo(() => [center.lat, center.lng], [center.lat, center.lng]);

  if (!center?.lat || !center?.lng) {
    return (
      <div
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--text-muted)',
        }}
      >
        <p className="text-sm">Waiting for location…</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={containerStyle}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Current location marker */}
      <Marker position={position} icon={myLocationIcon}>
        <Popup>
          <strong>Your location</strong>
        </Popup>
      </Marker>

      {/* Listing markers */}
      {markers.map((m) => {
        const [lng, lat] = m.location?.coordinates || [];
        if (lat == null || lng == null) return null;
        return (
          <Marker
            key={m._id}
            position={[lat, lng]}
            icon={listingIcon}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(m),
            }}
          >
            <Popup>
              <strong style={{ display: 'block', marginBottom: 4 }}>{m.foodName}</strong>
              <span style={{ fontSize: 12, color: '#555' }}>
                {m.quantity} {m.unit}
              </span>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
