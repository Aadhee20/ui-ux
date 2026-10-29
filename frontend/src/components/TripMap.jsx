import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { coordsFor } from "../places.js";

const dotIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.35)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

export default function TripMap({ pickup, drop }) {
  const el = useRef(null);

  useEffect(() => {
    const from = coordsFor(pickup);
    const to = coordsFor(drop);
    const map = L.map(el.current, { zoomControl: true, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.marker(from, { icon: dotIcon("#17b26a") }).addTo(map).bindTooltip(`Pickup: ${pickup}`);
    L.marker(to, { icon: dotIcon("#f04438") }).addTo(map).bindTooltip(`Drop: ${drop}`);

    // Start with a straight dashed line, then swap in the real road route if OSRM answers.
    let line = L.polyline([from, to], { color: "#0b5fff", weight: 4, dashArray: "8 8" }).addTo(map);
    map.fitBounds(L.latLngBounds([from, to]), { padding: [40, 40] });

    const ctrl = new AbortController();
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`,
      { signal: ctrl.signal }
    )
      .then((r) => r.json())
      .then((d) => {
        const coords = d.routes?.[0]?.geometry?.coordinates;
        if (!coords) return;
        const pts = coords.map(([lng, lat]) => [lat, lng]);
        map.removeLayer(line);
        line = L.polyline(pts, { color: "#0b5fff", weight: 5 }).addTo(map);
        map.fitBounds(line.getBounds(), { padding: [40, 40] });
      })
      .catch(() => {}); // offline / rate-limited: keep the straight line

    return () => {
      ctrl.abort();
      map.remove();
    };
  }, [pickup, drop]);

  return <div ref={el} className="trip-map" />;
}
