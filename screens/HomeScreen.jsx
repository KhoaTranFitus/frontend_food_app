// screens/HomeScreen.jsx
import React, { useEffect, useState, useRef } from "react";
import Animated from "react-native-reanimated";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import BannerCarousel from "../components/BannerCarousel";
import * as Location from "expo-location";
import restaurants from "../data/restaurants.json";

// ⭐️ SỬA IMPORT ⭐️
import { restaurantAPI } from "../services/flaskApi"; // ⬅️ THÊM IMPORT NÀY
// XÓA: import { searchNearbyPlaces } from "../services/tomtomApi"; 
// XÓA: import { normalizeResults, PROVINCES, searchByProvince, searchByQuery } from "../services/homeService"; 
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "../components/HomeHeader";
import FilterDropdown from "../components/FilterDropdown";
import CategorySection from "../components/CategorySection";
import MapSection from "../components/MapSection";
import NearbyList from "../components/NearbyList";
// Giữ import này để sử dụng nếu cần
// ⭐️ UPDATED IMPORTS ⭐️
import {
  searchRestaurants,
  getSearchLocation,
} from "../services/homeService";
import { useHeaderAnimation } from "../hooks/useHeaderAnimation";

// NEW: Define province constants for state management (from FilterDropdown)
const ALL_PROVINCES = [
  { id: 'near_me', label: 'Gần tôi' },
  // ===== THÀNH PHỐ LỚN =====
  { id: 'Ho Chi Minh', label: 'TP Hồ Chí Minh' },
  { id: 'Ha Noi', label: 'Hà Nội' },
  { id: 'Da Nang', label: 'Đà Nẵng' },
  { id: 'Hai Phong', label: 'Hải Phòng' },
  { id: 'Can Tho', label: 'Cần Thơ' },

  // ===== ĐIỂM DU LỊCH NỔI BẬT =====
  { id: 'Lam Dong', label: 'Lâm Đồng' },
  { id: 'Khanh Hoa', label: 'Khánh Hòa' },
  { id: 'Binh Dinh', label: 'Bình Định' },
  { id: 'Quang Ninh', label: 'Quảng Ninh' },
  { id: 'Thua Thien Hue', label: 'Thừa Thiên Huế' },
  { id: 'Quang Binh', label: 'Quảng Bình' },
  { id: 'Ninh Binh', label: 'Ninh Bình' },
  { id: 'Phu Yen', label: 'Phú Yên' },
  { id: 'Ba Ria Vung Tau', label: 'Bà Rịa - Vũng Tàu' },
  { id: 'Kien Giang', label: 'Kiên Giang' },
  { id: 'Quang Nam', label: 'Quảng Nam' },

  // ===== DANH SÁCH CÒN LẠI (A → Z) =====
  { id: 'An Giang', label: 'An Giang' },
  { id: 'Bac Giang', label: 'Bắc Giang' },
  { id: 'Bac Kan', label: 'Bắc Kạn' },
  { id: 'Bac Lieu', label: 'Bạc Liêu' },
  { id: 'Bac Ninh', label: 'Bắc Ninh' },
  { id: 'Ben Tre', label: 'Bến Tre' },
  { id: 'Binh Duong', label: 'Bình Dương' },
  { id: 'Binh Phuoc', label: 'Bình Phước' },
  { id: 'Binh Thuan', label: 'Bình Thuận' },
  { id: 'Ca Mau', label: 'Cà Mau' },
  { id: 'Cao Bang', label: 'Cao Bằng' },
  { id: 'Dak Lak', label: 'Đắk Lắk' },
  { id: 'Dak Nong', label: 'Đắk Nông' },
  { id: 'Dien Bien', label: 'Điện Biên' },
  { id: 'Dong Nai', label: 'Đồng Nai' },
  { id: 'Dong Thap', label: 'Đồng Tháp' },
  { id: 'Gia Lai', label: 'Gia Lai' },
  { id: 'Ha Giang', label: 'Hà Giang' },
  { id: 'Ha Nam', label: 'Hà Nam' },
  { id: 'Ha Tinh', label: 'Hà Tĩnh' },
  { id: 'Hau Giang', label: 'Hậu Giang' },
  { id: 'Hoa Binh', label: 'Hòa Bình' },
  { id: 'Hung Yen', label: 'Hưng Yên' },
  { id: 'Kon Tum', label: 'Kon Tum' },
  { id: 'Lang Son', label: 'Lạng Sơn' },
  { id: 'Lao Cai', label: 'Lào Cai' },
  { id: 'Long An', label: 'Long An' },
  { id: 'Nam Dinh', label: 'Nam Định' },
  { id: 'Nghe An', label: 'Nghệ An' },
  { id: 'Ninh Thuan', label: 'Ninh Thuận' },
  { id: 'Phu Tho', label: 'Phú Thọ' },
  { id: 'Quang Ngai', label: 'Quảng Ngãi' },
  { id: 'Quang Tri', label: 'Quảng Trị' },
  { id: 'Soc Trang', label: 'Sóc Trăng' },
  { id: 'Son La', label: 'Sơn La' },
  { id: 'Tay Ninh', label: 'Tây Ninh' },
  { id: 'Thai Binh', label: 'Thái Bình' },
  { id: 'Thai Nguyen', label: 'Thái Nguyên' },
  { id: 'Tien Giang', label: 'Tiền Giang' },
  { id: 'Tra Vinh', label: 'Trà Vinh' },
  { id: 'Tuyen Quang', label: 'Tuyên Quang' },
  { id: 'Vinh Long', label: 'Vĩnh Long' },
  { id: 'Vinh Phuc', label: 'Vĩnh Phúc' },
  { id: 'Yen Bai', label: 'Yên Bái' },
  { id: 'Thanh Hoa', label: 'Thanh Hóa' },
];

const PROVINCE_MAP = ALL_PROVINCES.reduce((acc, p) => {
  acc[p.id] = p.label;
  return acc;
}, {});

export default function HomeScreen({ navigation, route }) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const mapRef = useRef(null);
  const { handleScroll, headerAnimatedStyle } = useHeaderAnimation();

  // ⭐️ UPDATED: Mặc định là "Gần tôi" (near_me) ⭐️
  const [selectedProvinceId, setSelectedProvinceId] = useState("near_me");
  const [selectedProvinceName, setSelectedProvinceName] = useState("Gần tôi");
  const [searchLocation, setSearchLocation] = useState(null);
  const [searchMode, setSearchMode] = useState("nearby");
  const categories = [
    { name: "Món mặn", icon: require("../assets/beef.jpg") },
    { name: "Món nước", icon: require("../assets/monnuoc.png") },
    { name: "Món chay", icon: require("../assets/dochay.jpg") },
    { name: "Tráng miệng", icon: require("../assets/coffee.jpg") },
    { name: "Đặc sản", icon: require("../assets/dacsan.png") },
    { name: "Ăn nhẹ", icon: require("../assets/pizza.png") },
    { name: "xem thêm..." },
  ];
  const findImageFromRestaurants = (place) => {
    if (!place?.name) return null;

    const placeName = place.name.toLowerCase();

    const found = restaurants.find(r => {
      const rName = r.name.toLowerCase();
      return (
        rName.includes(placeName) ||
        placeName.includes(rName)
      );
    });

    return found?.image_url || null;
  };


  const MAX_NEARBY = 10; // Số lượng mặc định hiển thị trong danh sách "Gần bạn"
  const shownPlaces = places;
  const displayedNearby = Array.isArray(places) ? places.slice(0, MAX_NEARBY) : [];

  // XÓA: handleFilterSelect cũ vì không còn dùng searchByProvince
  // const handleFilterSelect = async (provinceId) => {
  //   setDropdownVisible(false);
  //   setLoading(true);
  //   try {
  //     const normalized = await searchByProvince(provinceId);
  //     setPlaces(normalized);
  //   } catch (err) {
  //     console.warn('Filter search error', err);
  //     setPlaces([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // ⭐️ THAY THẾ LOGIC TẢI DỮ LIỆU BAN ĐẦU ⭐️
  // ⭐️ MODIFIED: Centralized location and search logic + Map animation ⭐️
  const handleFilterSelect = async (provinceId) => {
    // 1. KHÔNG CHUẨN HÓA: Giữ nguyên provinceId (bao gồm cả 'near_me')
    const isNearMe = provinceId === 'near_me';
    const normalizedId = provinceId; // Giữ nguyên 'near_me' hoặc ID tỉnh
    // Xác định tên/nhãn hiển thị trên UI
    const provinceLabel = isNearMe
      ? 'Gần tôi'
      : (PROVINCE_MAP[normalizedId] || ALL_PROVINCES[0].label);

    // Cập nhật State UI
    setSelectedProvinceId(normalizedId);
    setSelectedProvinceName(provinceLabel);
    setDropdownVisible(false);
    setLoading(true);

    // Chế độ tìm kiếm: 'nearby' nếu là 'near_me' VÀ không có query,
    // hoặc 'full' nếu có query tìm kiếm.
    const nextMode = (isNearMe && !query?.trim()) ? "nearby" : "full";
    setSearchMode(nextMode);

    try {
      // 2. Lấy tọa độ trung tâm MỚI 
      // (Hàm getSearchLocation cần được chỉnh sửa để chấp nhận 'near_me'
      // hoặc kiểm tra nếu provinceId không phải ID tỉnh, thì dùng userLoc)
      const newSearchLoc = await getSearchLocation(normalizedId, userLoc);
      setSearchLocation(newSearchLoc);

      // 3. Tìm kiếm nhà hàng xung quanh tọa độ MỚI đó
      const results = await searchRestaurants({
        query: query || "",
        provinceId: isNearMe ? null : normalizedId, // Truyền NULL/undefined nếu là 'near_me'
        provinceName: provinceLabel,
        userLoc: userLoc,
        radius: nextMode === "nearby" ? 2000 : null,
      });

      setPlaces(results);
    } catch (err) {
      console.warn('Filter search error:', err);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // ⭐️ MODIFIED: Initial data fetching and location setup ⭐️
  useEffect(() => {
    (async () => {
      setLoading(true);

      // Lấy vị trí người dùng
      const { status } = await Location.requestForegroundPermissionsAsync();
      let userLocation = null;

      if (status === "granted") {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          userLocation = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          };
          setUserLoc(userLocation);
          console.log('✅ Got user location:', userLocation);
        } catch (e) {
          console.warn('⚠️ Error getting location:', e);
        }
      }

      // ⭐️ TỰ ĐỘNG LOAD "GẦN TÔI" (2km) ⭐️
      try {
        console.log('🔍 Loading initial "Gần tôi" results...');

        const searchLoc = await getSearchLocation("near_me", userLocation);
        setSearchLocation(searchLoc);

        // Gọi search với radius 2km
        const results = await searchRestaurants({
          query: "", // Query trống
          provinceId: "near_me",
          provinceName: "Gần tôi",
          userLoc: userLocation,
          radius: 2000, // 2km mặc định
        });

        console.log(`✅ Loaded ${results?.length || 0} restaurants near you`);
        setPlaces(results || []);
        setSearchMode("nearby");

      } catch (e) {
        console.error("❌ Initial load error:", e);
        setPlaces([]);
      }

      setLoading(false);
    })();
  }, []);


  // Handle category selection from AllCategoriesScreen
  useEffect(() => {
    // Trigger search when category is selected and location is ready
    if (route.params?.selectedCategory && searchLocation) {
      doSearch(route.params.selectedCategory);
    }
  }, [route.params?.selectedCategory, searchLocation]);


  // ⭐️ THAY THẾ LOGIC TÌM KIẾM ⭐️
  // ⭐️ MODIFIED: doSearch - Luôn tính radius dựa vào query ⭐️
  const doSearch = async (text, fromCategory = false) => {
    setQuery(text);
    setLoading(true);

    try {
      const hasQuery = text && text.trim().length > 0;

      // ⭐️ LOGIC RADIUS (CHỈ 2 TRƯỜNG HỢP):
      // - Có query → 5000m
      // - Query rỗng → 2000m
      const finalRadius = hasQuery ? 5000 : 2000;

      console.log(`🔎 doSearch: text="${text}", hasQuery=${hasQuery}, finalRadius=${finalRadius}m`);

      // Gọi searchRestaurants
      const mapped = await searchRestaurants({
        query: text || "",
        provinceId: selectedProvinceId || "near_me",
        provinceName: selectedProvinceName,
        userLoc: userLoc,
        radius: finalRadius,
      });

      console.log(`✅ doSearch got ${mapped?.length || 0} results`);
      setPlaces(mapped);

      // ⭐️ ANIMATE MAP LOGIC ⭐️
      if (mapRef.current && mapped && mapped.length > 0) {
        const centerLat = searchLocation?.latitude;
        const centerLon = searchLocation?.longitude;

        if (centerLat && centerLon) {
          console.log(`🗺️ Animating map to center: [${centerLat}, ${centerLon}]`);
          mapRef.current.animateToRegion(
            {
              latitude: centerLat,
              longitude: centerLon,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            500
          );
        }
      } else if (mapRef.current && (!mapped || mapped.length === 0)) {
        console.warn("⚠️ Không có kết quả tìm kiếm để hiển thị trên map");
      }
    } catch (e) {
      console.warn("doSearch error:", e);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // xử lí cái danh mục
  const handleCategoryPress = (name) => {
    setSelectedCategory(name);
    doSearch(name);
  };

  // ⭐️ THÊM HÀM REFRESH MỚI ⭐️
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Tải lại toàn bộ danh sách (không query, không lọc)
      const data = await restaurantAPI.getAllRestaurants();
      setPlaces(data);
    } catch (e) {
      console.error("Refresh error:", e);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ff6347" />
        <Text>Đợi xíu nhoo...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: "#9a0e0eff" }}>
      <Animated.View style={headerAnimatedStyle}>
        <HomeHeader
          initialQuery={query}
          onSubmitSearch={(q) => doSearch(q)}
          onQueryChange={(t) => setQuery(t)}
          onOpenProfile={() => navigation.navigate("ProfileStack")}
          onOpenFilter={() => setDropdownVisible(true)}
          selectedProvinceName={selectedProvinceName}
        />
      </Animated.View>

      <FilterDropdown
        visible={dropdownVisible}
        onSelect={handleFilterSelect}
        onClose={() => setDropdownVisible(false)}
        style={{ top: 80, right: 16 }}
        provinces={ALL_PROVINCES} // Pass ALL_PROVINCES
      />

      <Pressable onPress={() => dropdownVisible && setDropdownVisible(false)} style={{ flex: 1 }} accessibilityLabel="Dismiss dropdown">
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16} refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh} // ⭐️ SỬ DỤNG HÀM REFRESH MỚI ⭐️
              //               onRefresh={async () => {
              //                 setLoading(true);
              //                 const mode = query?.trim() ? "full" : "nearby";
              //                 setSearchMode(mode);
              //                 // Use current selected province ID and userLoc for refresh
              //                 const data = await searchRestaurants({
              //                   query: query || "",
              //                   provinceId: selectedProvinceId,
              //                   provinceName: selectedProvinceName,
              //                   userLoc: userLoc,
              //                   radius: mode === "nearby" ? 2000 : null,
              //                 });
              //                 setPlaces(data);
              //                 setLoading(false);
              //               }}

              colors={["#ff6347"]}
            />
          }>
            <View style={styles.bannerWrapper}>
              <BannerCarousel />
            </View>

            <View style={styles.whiteSection}>
              {/* Category */}
              <CategorySection
                categories={categories}
                onCategoryPress={handleCategoryPress}
                selectedCategory={selectedCategory}
                onViewAllPress={() => navigation.navigate('AllCategories', { categories })}
              />

              {/* Map ⭐️ MODIFIED PROP: Pass searchLocation as centerLocation ⭐️ */}
              <MapSection
                centerLocation={searchLocation} // Tọa độ trung tâm (User hoặc Tỉnh)
                shownPlaces={shownPlaces}       // Danh sách quán ăn xung quanh
                mapRef={mapRef}
                searchMode={searchMode}
                onMarkerPress={(p) => {
                  const image_url = findImageFromRestaurants(p);

                  navigation.navigate("RestaurantDetail", {
                    item: {
                      ...p,
                      image_url,
                    },
                  });
                }}
                // Truyền thêm 2 props này để hiển thị tiêu đề marker đúng
                selectedProvinceId={selectedProvinceId}
                selectedProvinceName={selectedProvinceName}
              />

              {/* Nearby */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Gần bạn</Text>
              </View>

              <NearbyList
                shownPlaces={displayedNearby}
                onItemPress={(item) => navigation.navigate("RestaurantDetail", { item })}
                hasMore={Array.isArray(places) && places.length > MAX_NEARBY}
                onViewMore={() => navigation.navigate('AllRestaurants', { places, userLoc })}
              />

              <View style={{ height: 60 }} />
            </View>
          </ScrollView>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 60,        // nhỏ lại (từ 80–100 → 60)
    height: 60,
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 12,
  },
  sectionTitle: { fontSize: 18, color: "#ffffffff", fontWeight: "700" },
  seeAll: { fontSize: 14, color: "#ff6347" },
});

