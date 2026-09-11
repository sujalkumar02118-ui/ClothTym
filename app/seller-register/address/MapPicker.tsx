"use client";

import { useEffect, useMemo } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

type MapPickerProps = {
  position: [number, number];
  accuracy?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
};

function MapController({
  position,
}: {
  position: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, Math.max(map.getZoom(), 17), {
      duration: 0.7,
    });
  }, [map, position]);

  return null;
}

function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event: L.LeafletMouseEvent) {
      onLocationChange(
        event.latlng.lat,
        event.latlng.lng
      );
    },
  });

  return null;
}

export default function MapPicker({
  position,
  accuracy,
  onLocationChange,
}: MapPickerProps) {
  const pickupIcon = useMemo(() => {
    return L.divIcon({
      className: "pickup-marker-wrapper",
      html: `
        <div class="pickup-marker">
          <div class="pickup-marker-pin">
            <div class="pickup-marker-dot"></div>
          </div>
        </div>
      `,
      iconSize: [44, 54],
      iconAnchor: [22, 54],
    });
  }, []);

  return (
    <>
      <style jsx global>{`
        .pickup-marker-wrapper {
          background: transparent !important;
          border: none !important;
        }

        .pickup-marker {
          width: 44px;
          height: 54px;
          position: relative;
        }

        .pickup-marker-pin {
          width: 40px;
          height: 40px;
          background: #111827;
          border: 4px solid white;
          border-radius: 50% 50% 50% 0%;
          transform: rotate(-45deg);
          position: absolute;
          left: 2px;
          top: 0;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
        }

        .pickup-marker-dot {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 10px;
          left: 10px;
        }

        .leaflet-container {
          width: 100%;
          height: 100%;
          font-family: inherit;
          z-index: 0;
        }

        .leaflet-control-attribution {
          font-size: 9px;
        }
      `}</style>

      <MapContainer
        center={position}
        zoom={17}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController position={position} />

        <MapClickHandler
          onLocationChange={onLocationChange}
        />

        {accuracy !== null &&
          accuracy !== undefined &&
          accuracy > 0 && (
            <Circle
              center={position}
              radius={accuracy}
              pathOptions={{
                color: "#2563eb",
                fillColor: "#3b82f6",
                fillOpacity: 0.12,
                weight: 2,
              }}
            />
          )}

        <Marker
          position={position}
          icon={pickupIcon}
          draggable={true}
          eventHandlers={{
            dragend: (event: L.DragEndEvent) => {
              const marker =
                event.target as L.Marker;

              const newPosition =
                marker.getLatLng();

              onLocationChange(
                newPosition.lat,
                newPosition.lng
              );
            },
          }}
        />
      </MapContainer>
    </>
  );
}