import axios from 'axios';

const TOMTOM_API_KEY = 'yyxXlbgc7wMsUKBZY88fGXiCqM0IHspm';

export async function searchAddress(query) {
  if (!query) return [];
  try {
    const url = 'https://api.tomtom.com/search/2/search/' + encodeURIComponent(query) + '.json?key=' + TOMTOM_API_KEY + '&typeahead=true&limit=10';
    const res = await axios.get(url);
    return res.data.results || [];
  } catch(err) {
    console.warn('TomTom search error', err.message);
    return [];
  }
}

export async function getRoute(start, dest) {
  try {
    const startStr = `${start.longitude},${start.latitude}`;
    const destStr = `${dest.longitude},${dest.latitude}`;
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${startStr}:${destStr}/json?key=${TOMTOM_API_KEY}&routeType=fastest&traffic=false`;
    const res = await axios.get(url);
    const legs = res.data.routes?.[0]?.legs || [];
    const coords = [];
    for (const leg of legs) {
      for (const point of leg.points || []) {
        coords.push({latitude: point.latitude, longitude: point.longitude});
      }
    }
    return coords;
  } catch(err) {
    console.warn('TomTom route error', err.message);
    return [];
  }
}

export async function searchNearbyPlaces({ latitude, longitude }) {
  try {
    const url = `https://api.tomtom.com/search/2/nearbySearch/.json?key=${TOMTOM_API_KEY}&lat=${latitude}&lon=${longitude}&limit=20&categorySet=7315`; 
    // categorySet=7315 là nhà hàng, có thể đổi hoặc bỏ nếu muốn nhiều loại
    const res = await axios.get(url);

    return res.data.results.map((place) => ({
      id: place.id,
      name: place.poi?.name || "Unknown",
      address: place.address?.freeformAddress || "",
      position: place.position,
      category: place.poi?.categories?.[0] || "",
      rating: place.poi?.rating || null,
    }));
  } catch (err) {
    console.warn("TomTom nearby search error", err.message);
    return [];
  }
}