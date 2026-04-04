import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface PortugalMapProps {
  neop4ByCter?: Record<string, number>;
  cterCoordinates: Record<string, { lat: number; lng: number }>;
}

export default function PortugalMap({ neop4ByCter, cterCoordinates }: PortugalMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Inicializar mapa
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([39.5, -8.0], 7);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map.current);
    }

    // Limpar marcadores antigos
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Adicionar novos marcadores
    if (neop4ByCter) {
      Object.entries(neop4ByCter).forEach(([cterName, count]) => {
        const coords = cterCoordinates[cterName];
        if (!coords) return;

        const size = Math.min(20 + count * 5, 40);
        const icon = L.divIcon({
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background-color: #ef4444;
              border: 2px solid #dc2626;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: white;
              font-size: 12px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              ${count}
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });

        const marker = L.marker([coords.lat, coords.lng], { icon })
          .bindPopup(`<div class="text-sm"><p class="font-bold">${cterName}</p><p class="text-red-600 font-semibold">4º NEOP: ${count}</p></div>`)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }
  }, [neop4ByCter, cterCoordinates]);

  return (
    <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100 mt-8">
      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-3 sm:mb-4" style={{ color: "#1a472a" }}>
        Mapa de 4º NEOP por CTer
      </h3>
      <div
        ref={mapContainer}
        className="w-full h-96 rounded-lg overflow-hidden"
        style={{ minHeight: "400px" }}
      />
      <p className="text-xs text-gray-600 mt-2">
        Pontos vermelhos indicam registos de 4º NEOP. Tamanho do ponto indica quantidade por CTer. Clique para ver detalhes.
      </p>
    </div>
  );
}
