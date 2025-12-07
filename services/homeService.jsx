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
export const PROVINCE_COORDS = {
  hcm: { latitude: 10.772357, longitude: 106.697882 }, // Chợ Bến Thành
  hanoi: { latitude: 21.036810, longitude: 105.834709 }, // Lăng Bác
  danang: { latitude: 16.061242, longitude: 108.224176 }, // Cầu Rồng
  lamDong: { latitude: 11.938080, longitude: 108.444818 }, // Đà Lạt

  // ... (Giữ nguyên danh sách tỉnh của bạn, không thay đổi gì ở đây)
  // Tây Bắc - Đông Bắc
  haGiang: { latitude: 22.8233, longitude: 104.9836 },
  caoBang: { latitude: 22.6657, longitude: 106.2550 },
  langSon: { latitude: 21.8562, longitude: 106.7615 },
  laoCai: { latitude: 22.4800, longitude: 103.9790 },
  yenBai: { latitude: 21.7050, longitude: 104.8720 },
  tuyenQuang: { latitude: 21.8236, longitude: 105.2140 },
  thaiNguyen: { latitude: 21.5672, longitude: 105.8252 },
  phuTho: { latitude: 21.3227, longitude: 105.4010 },
  bacKan: { latitude: 22.1457, longitude: 105.8348 },
  quangNinh: { latitude: 20.9713, longitude: 107.0448 },
  bacGiang: { latitude: 21.2810, longitude: 106.1973 },
  bacNinh: { latitude: 21.1861, longitude: 106.0763 },
  vinhPhuc: { latitude: 21.3609, longitude: 105.5474 },
  haiDuong: { latitude: 20.9393, longitude: 106.3305 },
  haiPhong: { latitude: 20.8449, longitude: 106.6881 },
  hungYen: { latitude: 20.6463, longitude: 106.0511 },
  thaiBinh: { latitude: 20.4470, longitude: 106.3366 },
  namDinh: { latitude: 20.4200, longitude: 106.1680 },
  ninhBinh: { latitude: 20.2500, longitude: 105.9740 },
  thanhHoa: { latitude: 20.1290, longitude: 105.3130 },
  ngheAn: { latitude: 18.6756, longitude: 105.6983 },
  haTinh: { latitude: 18.3420, longitude: 105.9057 },

  // Trung Bộ
  quangBinh: { latitude: 17.4688, longitude: 106.6223 },
  quangTri: { latitude: 16.8190, longitude: 107.1050 },
  thuaThienHue: { latitude: 16.4637, longitude: 107.5909 },
  quangNam: { latitude: 15.5730, longitude: 108.4800 },
  quangNgai: { latitude: 15.120029, longitude: 108.792743 },
  binhDinh: { latitude: 13.7797, longitude: 109.2196 },
  phuYen: { latitude: 13.0955, longitude: 109.3209 },
  khanhHoa: { latitude: 12.2388, longitude: 109.1967 },
  ninhThuan: { latitude: 11.5670, longitude: 108.9886 },
  binhThuan: { latitude: 10.9804, longitude: 108.2615 },

  // Tây Nguyên
  konTum: { latitude: 14.3498, longitude: 108.0000 },
  giaLai: { latitude: 13.8070, longitude: 108.1098 },
  dakLak: { latitude: 12.6675, longitude: 108.0383 },
  dakNong: { latitude: 12.0086, longitude: 107.6903 },

  // Đông Nam Bộ
  binhDuong: { latitude: 10.9719, longitude: 106.6661 },
  binhPhuoc: { latitude: 11.7512, longitude: 106.7230 },
  dongNai: { latitude: 10.9453, longitude: 106.8240 },
  baRiaVungTau: { latitude: 10.4114, longitude: 107.1362 },
  tayNinh: { latitude: 11.3227, longitude: 106.1473 },
  longAn: { latitude: 10.5960, longitude: 106.3683 },

  // Đồng bằng Sông Cửu Long
  tienGiang: { latitude: 10.3934, longitude: 106.3439 },
  benTre: { latitude: 10.2360, longitude: 106.3740 },
  traVinh: { latitude: 9.9477, longitude: 106.3420 },
  vinhLong: { latitude: 10.2443, longitude: 105.9646 },
  dongThap: { latitude: 10.4574, longitude: 105.6325 },
  anGiang: { latitude: 10.5020, longitude: 105.1259 },
  canTho: { latitude: 10.0452, longitude: 105.7469 },
  hauGiang: { latitude: 9.7846, longitude: 105.4700 },
  socTrang: { latitude: 9.6030, longitude: 105.9800 },
  bacLieu: { latitude: 9.2940, longitude: 105.7217 },
  caMau: { latitude: 9.1766, longitude: 105.1500 },

  // Hà Nam - Hòa Bình - Sơn La, Điện Biên
  haNam: { latitude: 20.5410, longitude: 105.9220 },
  hoaBinh: { latitude: 20.8172, longitude: 105.3380 },
  sonLa: { latitude: 21.3280, longitude: 103.9140 },
  dienBien: { latitude: 21.3860, longitude: 103.0190 },
};

// -----------------------------
// 3. Tự động chọn vị trí tìm kiếm
// -----------------------------
export const getSearchLocation = async (provinceId, userLoc) => {
  // TH1: Chọn "Gần tôi" (provinceId rỗng hoặc 'near_me')
  // Nếu có GPS userLoc -> dùng userLoc
  if ((!provinceId || provinceId === "" || provinceId === "near_me") && userLoc) {
    return userLoc;
  }

  // TH2: Chọn Tỉnh cụ thể -> Lấy tọa độ từ PROVINCE_COORDS
  if (provinceId && PROVINCE_COORDS[provinceId]) {
    return PROVINCE_COORDS[provinceId];
  }

  // TH3: Fallback (Nếu không có GPS và không chọn tỉnh) -> Mặc định HCM
  return PROVINCE_COORDS.hcm;
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
export const searchRestaurants = async ({ query, provinceId, provinceName = '', userLoc, radius = 2000 }) => {
  // 1. Xác định tọa độ tâm (User hoặc Tỉnh)
  const loc = await getSearchLocation(provinceId, userLoc);

  // LOG để kiểm tra xem tọa độ này có gần dữ liệu trong DB của bạn không
  console.log(`🔍 Searching at: [${loc.latitude}, ${loc.longitude}] (Province: ${provinceId || 'Near Me'})`);

  try {
    // 2. Gửi request lên Backend
    const response = await restaurantAPI.getAll({
      query: query || "", // Text tìm kiếm (phở, cơm...)

      // QUAN TRỌNG: Luôn gửi province rỗng để Backend kích hoạt chế độ "Tìm theo bán kính"
      // Thay vì chế độ "Tìm theo tên tỉnh" (vốn đang bị lỗi text mismatch)
      province: "",

      provinceName: provinceName || provinceId || "", // Chỉ để log bên server nếu cần
      lat: loc.latitude,
      lon: loc.longitude,

      // LƯU Ý: Backend của bạn đang hardcode bán kính 2km (if d > 2 continue).
      // Tham số radius gửi ở đây có thể không có tác dụng nếu backend không dùng biến này.
      radius: radius,
    });

    return normalizeResults(response);

  } catch (error) {
    console.warn("Backend search failed:", error.message);
    return [];
  }
};

export const searchByProvince = (provinceId) => searchRestaurants({ query: "", provinceId });
export const searchByQuery = ({ query, provinceId, userLoc }) => searchRestaurants({ query, provinceId, userLoc });