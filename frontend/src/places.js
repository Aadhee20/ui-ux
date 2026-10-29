// Approximate [lat, lng] for every pickup/drop name the app uses (Chennai).
// Rides only carry place names, so the map looks coordinates up here.
export const PLACES = {
  "T. Nagar Bus Terminus": [13.0418, 80.2341],
  "Chennai Airport": [12.9941, 80.1709],
  "Anna Nagar West": [13.0900, 80.2000],
  "Marina Beach": [13.0500, 80.2824],
  "Velachery MRTS": [12.9815, 80.2180],
  "OMR Tidel Park": [12.9885, 80.2485],
  "Adyar Signal": [13.0067, 80.2570],
  "Guindy Station": [13.0067, 80.2206],
  "Nungambakkam": [13.0569, 80.2425],
  "Besant Nagar": [13.0002, 80.2668],
  "Porur Junction": [13.0382, 80.1565],
  "Tambaram": [12.9249, 80.1000],
  "Egmore Station": [13.0732, 80.2609],
  "Mylapore Tank": [13.0339, 80.2697],
};

export const CHENNAI_CENTER = [13.0827, 80.2707];

// Unknown names fall back to a stable spot near the city centre so the map never breaks.
export function coordsFor(name) {
  if (PLACES[name]) return PLACES[name];
  let h = 0;
  for (const c of name || "") h = (h * 31 + c.charCodeAt(0)) % 1000;
  return [CHENNAI_CENTER[0] + (h % 40) / 1000 - 0.02, CHENNAI_CENTER[1] + ((h * 7) % 40) / 1000 - 0.02];
}
