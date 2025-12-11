// homeService.jsx

import * as Location from "expo-location";
import { restaurantAPI } from "./flaskApi";

// ⚠️ Đã xóa import tomTomApi theo yêu cầu
// import { searchNearbyPlaces } from "./tomtomApi";

// -----------------------------
// 1. Lấy vị trí hiện tại của user
// -----------------------------
export const getUserLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const loc = await Location.getCurrentPositionAsync({});
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  } catch (e) {
    console.warn("getUserLocation error:", e);
    return null;
  }
};

// -----------------------------
// 2. Tọa độ trung tâm các tỉnh
// -----------------------------
// ⭐️ UPDATED: Tọa độ trung tâm các tỉnh (match với id mới - không dấu, không khoảng trắng) ⭐️
export const PROVINCE_COORDS = {
  'Ho Chi Minh': { latitude: 10.772357, longitude: 106.697882 },
  'Ha Noi': { latitude: 21.036810, longitude: 105.834709 },
  'Da Nang': { latitude: 16.061242, longitude: 108.224176 },
  'Lam Dong': { latitude: 11.938080, longitude: 108.444818 },
  'Ha Giang': { latitude: 22.8233, longitude: 104.9836 },
  'Cao Bang': { latitude: 22.6657, longitude: 106.2550 },
  'Lang Son': { latitude: 21.8562, longitude: 106.7615 },
  'Lao Cai': { latitude: 22.4800, longitude: 103.9790 },
  'Yen Bai': { latitude: 21.7050, longitude: 104.8720 },
  'Tuyen Quang': { latitude: 21.8236, longitude: 105.2140 },
  'Thai Nguyen': { latitude: 21.5672, longitude: 105.8252 },
  'Phu Tho': { latitude: 21.3227, longitude: 105.4010 },
  'Bac Kan': { latitude: 22.1457, longitude: 105.8348 },
  'Quang Ninh': { latitude: 20.9713, longitude: 107.0448 },
  'Bac Giang': { latitude: 21.2810, longitude: 106.1973 },
  'Bac Ninh': { latitude: 21.1861, longitude: 106.0763 },
  'Vinh Phuc': { latitude: 21.3609, longitude: 105.5474 },
  'Hai Duong': { latitude: 20.9393, longitude: 106.3305 },
  'Hai Phong': { latitude: 20.8449, longitude: 106.6881 },
  'Hung Yen': { latitude: 20.6463, longitude: 106.0511 },
  'Thai Binh': { latitude: 20.4470, longitude: 106.3366 },
  'Nam Dinh': { latitude: 20.4200, longitude: 106.1680 },
  'Ninh Binh': { latitude: 20.2500, longitude: 105.9740 },
  'Thanh Hoa': { latitude: 20.1290, longitude: 105.3130 },
  'Nghe An': { latitude: 18.6756, longitude: 105.6983 },
  'Ha Tinh': { latitude: 18.3420, longitude: 105.9057 },
  'Quang Binh': { latitude: 17.4688, longitude: 106.6223 },
  'Quang Tri': { latitude: 16.8190, longitude: 107.1050 },
  'Thua Thien Hue': { latitude: 16.4637, longitude: 107.5909 },
  'Quang Nam': { latitude: 15.5730, longitude: 108.4800 },
  'Quang Ngai': { latitude: 15.120029, longitude: 108.792743 },
  'Binh Dinh': { latitude: 13.7797, longitude: 109.2196 },
  'Phu Yen': { latitude: 13.0955, longitude: 109.3209 },
  'Khanh Hoa': { latitude: 12.2388, longitude: 109.1967 },
  'Ninh Thuan': { latitude: 11.5670, longitude: 108.9886 },
  'Binh Thuan': { latitude: 10.9804, longitude: 108.2615 },
  'Kon Tum': { latitude: 14.3498, longitude: 108.0000 },
  'Gia Lai': { latitude: 13.8070, longitude: 108.1098 },
  'Dak Lak': { latitude: 12.6675, longitude: 108.0383 },
  'Dak Nong': { latitude: 12.0086, longitude: 107.6903 },
  'Binh Duong': { latitude: 10.9719, longitude: 106.6661 },
  'Binh Phuoc': { latitude: 11.7512, longitude: 106.7230 },
  'Dong Nai': { latitude: 10.9453, longitude: 106.8240 },
  'Ba Ria Vung Tau': { latitude: 10.4114, longitude: 107.1362 },
  'Tay Ninh': { latitude: 11.3227, longitude: 106.1473 },
  'Long An': { latitude: 10.5960, longitude: 106.3683 },
  'Tien Giang': { latitude: 10.3934, longitude: 106.3439 },
  'Ben Tre': { latitude: 10.2360, longitude: 106.3740 },
  'Tra Vinh': { latitude: 9.9477, longitude: 106.3420 },
  'Vinh Long': { latitude: 10.2443, longitude: 105.9646 },
  'Dong Thap': { latitude: 10.4574, longitude: 105.6325 },
  'An Giang': { latitude: 10.5020, longitude: 105.1259 },
  'Can Tho': { latitude: 10.0452, longitude: 105.7469 },
  'Hau Giang': { latitude: 9.7846, longitude: 105.4700 },
  'Soc Trang': { latitude: 9.6030, longitude: 105.9800 },
  'Bac Lieu': { latitude: 9.2940, longitude: 105.7217 },
  'Ca Mau': { latitude: 9.1766, longitude: 105.1500 },
  'Ha Nam': { latitude: 20.5410, longitude: 105.9220 },
  'Hoa Binh': { latitude: 20.8172, longitude: 105.3380 },
  'Son La': { latitude: 21.3280, longitude: 103.9140 },
  'Dien Bien': { latitude: 21.3860, longitude: 103.0190 },
};

// -----------------------------
// 3. Tự động chọn vị trí tìm kiếm
// -----------------------------
export const getSearchLocation = async (provinceId, userLoc) => {
  // TH1: Chọn "Gần tôi" (provinceId rỗng hoặc 'near_me')
  // Nếu có GPS userLoc -> dùng userLoc
  if ((!provinceId || provinceId === "near_me") && userLoc) {
    return userLoc;
  }

  // TH2: Chọn Tỉnh cụ thể -> Lấy tọa độ từ PROVINCE_COORDS (match chính xác key)
  if (provinceId && PROVINCE_COORDS[provinceId]) {
    console.log(`📍 Found province coords for "${provinceId}"`);
    return PROVINCE_COORDS[provinceId];
  }

  // TH3: Nếu không tìm thấy, in warning và fallback
  console.warn(`⚠️ Province "${provinceId}" not found in PROVINCE_COORDS, using Ha Noi as fallback`);
  return PROVINCE_COORDS['Ha Noi'];
};

// -----------------------------
// 4. Normalize kết quả API
// -----------------------------
export const normalizeResults = (results) => {
  if (!Array.isArray(results)) return [];

  return results.map((r, i) => {
    const lat = parseFloat(r.lat ?? r.position?.lat ?? r.coord?.lat);
    const lon = parseFloat(r.lon ?? r.position?.lon ?? r.coord?.lon);

    return {
      id: r.id ? String(r.id) : `res-${i}`,
      name: r.name ?? r.poi?.name ?? "Tên quán",
      address: r.address ?? r.address?.freeformAddress ?? "Đang cập nhật",
      position: { lat, lon },
      rating: r.rating ?? 4.0,
      raw: r,
    };
  }).filter(r => !isNaN(r.position.lat) && !isNaN(r.position.lon));
};

// -----------------------------
// 5. Hàm tìm kiếm chung (ĐÃ SỬA)
// -----------------------------
// ⭐️ MODIFIED: searchRestaurants - Gửi provinceId chính xác ⭐️
export const searchRestaurants = async ({ query, provinceId, provinceName = 'Gần tôi', userLoc, radius = 2000 }) => {
  // 1. Xác định tọa độ tâm (User hoặc Tỉnh)
  const loc = await getSearchLocation(provinceId, userLoc);

  const hasQuery = query && query.trim().length > 0;
  const isNearMe = provinceId === "near_me" || !provinceId;

  // ⭐️ LOGIC RADIUS (CHỈ 2 TRƯỜNG HỢP):
  // - Có query → radius 5000m (5km)
  // - Query rỗng → radius 2000m (2km)
  let finalRadius = hasQuery ? 5000 : 2000;

  console.log(`🔍 searchRestaurants called:
    - query: "${query}"
    - provinceId: "${provinceId}"
    - provinceName: "${provinceName}"
    - location: [${loc.latitude}, ${loc.longitude}]
    - hasQuery: ${hasQuery}
    - isNearMe: ${isNearMe}
    - finalRadius: ${finalRadius}m`);

  try {
    // 2. Gọi /api/search
    // ⭐️ IMPORTANT: Gửi provinceId chính xác (không chuyển đổi)
    const response = await restaurantAPI.search({
      query: query || "",
      province: isNearMe ? "" : (provinceId || ""),
      lat: loc.latitude,
      lon: loc.longitude,
      radius: finalRadius,
    });

    console.log(`✅ Backend /api/search returned ${response?.length || 0} results`);
    return normalizeResults(response);

  } catch (error) {
    console.warn("Backend /api/search failed:", error.message);
    return [];
  }
};

export const searchByProvince = (provinceId) => searchRestaurants({ query: "", provinceId });
export const searchByQuery = ({ query, provinceId, userLoc }) => searchRestaurants({ query, provinceId, userLoc });