import { searchNearbyPlaces } from "./tomtomApi";

// Normalize API results -> { id, name, address, position }
export const normalizeResults = (results, idPrefix = "r") => {
  if (!Array.isArray(results)) return [];
  return results
    .map((r, i) => {
      const pos = r.position || r.geometry || r.latLng || r.location || {};
      const lat = pos.lat ?? pos.latitude ?? pos.latitude;
      const lon = pos.lon ?? pos.longitude ?? pos.longitude;
      if (!lat || !lon) return null;
      return {
        id: r.id ?? `${idPrefix}-${i}`,
        name: r.poi?.name ?? r.name ?? r.title ?? r.label ?? "",
        address: r.address?.freeformAddress ?? r.address ?? "",
        position: { lat, lon },
        raw: r,
      };
    })
    .filter(Boolean);
};

// Province -> center coordinates mapping
export const PROVINCES = {
  hcm: { latitude: 10.77653, longitude: 106.700981 },
  danang: { latitude: 16.054406, longitude: 108.202164 },
  quangngai: { latitude: 15.120029, longitude: 108.792743 },
  hanoi: { latitude: 21.027764, longitude: 105.834160 },
};

// Search nearby places by province
export const searchByProvince = async (provinceId, searchRadius = 10000) => {
  if (!provinceId || !PROVINCES[provinceId]) return [];
  
  const center = PROVINCES[provinceId];
  const results = await searchNearbyPlaces({
    latitude: center.latitude,
    longitude: center.longitude,
    radius: searchRadius,
  });

  const normalized = Array.isArray(results)
    ? results
        .map((r, i) => {
          const pos = r.position || r.geometry || {};
          const lat = pos.lat ?? pos.latitude;
          const lon = pos.lon ?? pos.longitude;
          if (!lat || !lon) return null;
          return {
            id: r.id ?? `${provinceId}-${i}`,
            name: r.poi?.name ?? r.name ?? r.title ?? 'Quán ăn',
            address: r.address?.freeformAddress ?? r.address ?? '',
            position: { lat, lon },
            raw: r,
          };
        })
        .filter(Boolean)
    : [];

  return normalized;
};

// Search by text query
export const searchByQuery = async (text, userLocation) => {
  if (!text) return [];
  
  const params = {
    latitude: userLocation?.latitude ?? PROVINCES.hcm.latitude,
    longitude: userLocation?.longitude ?? PROVINCES.hcm.longitude,
    query: text,
  };
  
  const res = await searchNearbyPlaces(params);
  return normalizeResults(res, text);
};
