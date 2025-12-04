// src/WebPages/SiteComps/MapView.jsx
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from '../../lib/leafletFix';

// listings: [{ id, address, price, imageUrls?, bedrooms, bathrooms, lat?, lng? }]
// onMarkerClick?: (id) => void
export default function MapView({ listings = [], onMarkerClick }) {
  const coords = useMemo(
    () => listings.filter(x => typeof x.lat === 'number' && typeof x.lng === 'number'),
    [listings]
  );

  // Fit bounds to markers (or center on Hartford-ish if none)
  function FitBounds() {
    const map = useMap();
    useEffect(() => {
      if (coords.length) {
        const b = L.latLngBounds(coords.map(x => [x.lat, x.lng]));
        map.fitBounds(b, { padding: [30, 30] });
      } else {
        map.setView([41.7658, -72.6734], 11); // CT center-ish fallback
      }
    }, [coords, map]);
    return null;
  }

  return (
    <MapContainer
      className="h-[360px] w-full rounded-2xl border"
      scrollWheelZoom={false}
      attributionControl={true}
    >
      <TileLayer
        // OpenStreetMap tiles (free). Swap later if you add MapTiler/Mapbox.
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <FitBounds />

      {coords.map((x) => (
        <Marker
          key={x.id}
          position={[x.lat, x.lng]}
          eventHandlers={{
            click: () => onMarkerClick?.(x.id),
          }}
        >
          <Popup className="text-sm">
            <div className="max-w-[220px]">
              {x.imageUrls?.[0] ? (
                <img
                  src={x.imageUrls[0]}
                  alt="thumbnail"
                  className="mb-2 h-28 w-full rounded object-cover"
                />
              ) : null}
              <div className="font-medium">{x.address || 'Property'}</div>
              {x.price ? <div className="mt-1 font-semibold">${x.price}</div> : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
