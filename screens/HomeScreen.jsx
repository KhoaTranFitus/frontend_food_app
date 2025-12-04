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
  { id: '', label: 'Gần tôi' },
  // ===== THÀNH PHỐ LỚN =====
  { id: 'hcm', label: 'TP Hồ Chí Minh' },
  { id: 'hanoi', label: 'Hà Nội' },
  { id: 'danang', label: 'Đà Nẵng' },
  { id: 'haiPhong', label: 'Hải Phòng' },
  { id: 'cantho', label: 'Cần Thơ' },

  // ===== ĐIỂM DU LỊCH NỔI BẬT =====
  { id: 'lamDong', label: 'Lâm Đồng' },
  { id: 'khanhhoa', label: 'Khánh Hòa' },
  { id: 'binhDinh', label: 'Bình Định' },
  { id: 'quangNinh', label: 'Quảng Ninh' },
  { id: 'thuaThienHue', label: 'Thừa Thiên Huế' },
  { id: 'quangBinh', label: 'Quảng Bình' },
  { id: 'ninhBinh', label: 'Ninh Bình' },
  { id: 'phuYen', label: 'Phú Yên' },
  { id: 'baRiaVungTau', label: 'Bà Rịa - Vũng Tàu' },
  { id: 'kienGiang', label: 'Kiên Giang' },
  { id: 'quangNam', label: 'Quảng Nam' },

  // ===== DANH SÁCH CÒN LẠI (A → Z) =====
  { id: 'anGiang', label: 'An Giang' },
  { id: 'bacGiang', label: 'Bắc Giang' },
  { id: 'bacKan', label: 'Bắc Kạn' },
  { id: 'bacLieu', label: 'Bạc Liêu' },
  { id: 'bacNinh', label: 'Bắc Ninh' },
  { id: 'benTre', label: 'Bến Tre' },
  { id: 'binhDuong', label: 'Bình Dương' },
  { id: 'binhPhuoc', label: 'Bình Phước' },
  { id: 'binhThuan', label: 'Bình Thuận' },
  { id: 'caMau', label: 'Cà Mau' },
  { id: 'caoBang', label: 'Cao Bằng' },
  { id: 'dakLak', label: 'Đắk Lắk' },
  { id: 'dakNong', label: 'Đắk Nông' },
  { id: 'dienBien', label: 'Điện Biên' },
  { id: 'dongNai', label: 'Đồng Nai' },
  { id: 'dongThap', label: 'Đồng Tháp' },
  { id: 'giaLai', label: 'Gia Lai' },
  { id: 'haGiang', label: 'Hà Giang' },
  { id: 'haNam', label: 'Hà Nam' },
  { id: 'haTinh', label: 'Hà Tĩnh' },
  { id: 'hauGiang', label: 'Hậu Giang' },
  { id: 'hoaBinh', label: 'Hòa Bình' },
  { id: 'hungYen', label: 'Hưng Yên' },
  { id: 'konTum', label: 'Kon Tum' },
  { id: 'langSon', label: 'Lạng Sơn' },
  { id: 'laoCai', label: 'Lào Cai' },
  { id: 'longAn', label: 'Long An' },
  { id: 'namDinh', label: 'Nam Định' },
  { id: 'nghean', label: 'Nghệ An' },
  { id: 'ninhThuan', label: 'Ninh Thuận' },
  { id: 'phuTho', label: 'Phú Thọ' },
  { id: 'quangNgai', label: 'Quảng Ngãi' },
  { id: 'quangTri', label: 'Quảng Trị' },
  { id: 'socTrang', label: 'Sóc Trăng' },
  { id: 'sonLa', label: 'Sơn La' },
  { id: 'taylor', label: 'Tây Ninh' },
  { id: 'thaiBinh', label: 'Thái Bình' },
  { id: 'thaiNguyen', label: 'Thái Nguyên' },
  { id: 'tienGiang', label: 'Tiền Giang' },
  { id: 'traVinh', label: 'Trà Vinh' },
  { id: 'tuyenQuang', label: 'Tuyên Quang' },
  { id: 'vinhLong', label: 'Vĩnh Long' },
  { id: 'vinhPhuc', label: 'Vĩnh Phúc' },
  { id: 'yenBai', label: 'Yên Bái' },
];

const PROVINCE_MAP = ALL_PROVINCES.reduce((acc, p) => {
  acc[p.id] = p.label;
  return acc;
}, {});

export default function HomeScreen({ navigation, route }) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [userLoc, setUserLoc] = useState(null); // User's actual GPS
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const mapRef = useRef(null);
  const { handleScroll, headerAnimatedStyle } = useHeaderAnimation();

  // ⭐️ LOCATION STATE ⭐️
  const [selectedProvinceId, setSelectedProvinceId] = useState(""); // Default: use GPS when available
  const [selectedProvinceName, setSelectedProvinceName] = useState("Gần tôi");
  const [searchLocation, setSearchLocation] = useState(null); // The actual coordinates used for search
  const [searchMode, setSearchMode] = useState("nearby"); // "default" | "category" | "text"
  const categories = [
    { name: "Món mặn", icon: require("../assets/beef.jpg") },
    { name: "Món nước", icon: require("../assets/burger.png") },
    { name: "Món chay", icon: require("../assets/comtam.jpg") },
    { name: "Tráng miệng", icon: require("../assets/coffee.jpg") },
    { name: "Đặc sản", icon: require("../assets/drink.png") },
    { name: "Ăn nhẹ", icon: require("../assets/pizza.png") },
    { name: "xem thêm..." },
  ];

  const MAX_NEARBY = 10; // Số lượng mặc định hiển thị trong danh sách "Gần bạn"
  const shownPlaces = places;
  const displayedNearby = Array.isArray(places) ? places.slice(0, MAX_NEARBY) : [];

  // ⭐️ MODIFIED: Centralized location and search logic + Map animation ⭐️
  const handleFilterSelect = async (provinceId) => {
    // 1. Chuan hoa 'near_me' -> '' (dung GPS), cap nhat UI Dropdown
    const normalizedId = provinceId === 'near_me' ? '' : provinceId;
    const provinceLabel = normalizedId ? (PROVINCE_MAP[normalizedId] || ALL_PROVINCES[0].label) : 'Gần tôi';
    setSelectedProvinceId(normalizedId);
    setSelectedProvinceName(provinceLabel);
    setDropdownVisible(false);
    setLoading(true);
    const nextMode = query?.trim() ? "full" : "nearby";
    setSearchMode(nextMode);

    try {
      // 2. Lấy tọa độ trung tâm MỚI (User GPS hoặc Tỉnh)
      const newSearchLoc = await getSearchLocation(normalizedId, userLoc);
      setSearchLocation(newSearchLoc);

      // 3. Tìm kiếm nhà hàng xung quanh tọa độ MỚI đó
      const results = await searchRestaurants({
        query: query || "", // Giữ query cũ nếu có, hoặc mặc định food
        provinceId: normalizedId,
        provinceName: provinceLabel,
        userLoc: userLoc, // Truyền userLoc để hàm service xử lý logic
        radius: nextMode === "nearby" ? 2000 : null,
      });

      setPlaces(results);

      // Lưu ý: Map sẽ tự animate nhờ useEffect bên trong MapSection
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      let initialUserLoc = null;

      if (status === "granted") {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          initialUserLoc = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserLoc(initialUserLoc);
        } catch (e) {
          console.warn("Failed to get current location:", e);
        }
      }

      // Mặc định ban đầu: '' nếu có GPS, hoặc 'hcm' nếu không có
      const initialProvinceId = initialUserLoc ? '' : 'hcm';
      const initialSearchLoc = await getSearchLocation(initialProvinceId, initialUserLoc);

      // Set initial states
      setSelectedProvinceId(initialProvinceId);
      setSelectedProvinceName(PROVINCE_MAP[initialProvinceId] || "Gần tôi");
      setSearchLocation(initialSearchLoc); // Map animattion

      // Perform initial search using the determined location and default query
      try {
        const data = await searchRestaurants({
          query: "",
          provinceId: initialProvinceId,
          provinceName: PROVINCE_MAP[initialProvinceId] || "Gần tôi",
          userLoc: initialUserLoc,
          radius: 2000,
        });
        setPlaces(data || []);
        setSearchMode("nearby");
      } catch (e) {
        console.warn("Initial search error:", e);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  // Handle category selection from AllCategoriesScreen
  useEffect(() => {
    // Trigger search when category is selected and location is ready
    if (route.params?.selectedCategory && searchLocation) {
      doSearch(route.params.selectedCategory);
    }
  }, [route.params?.selectedCategory, searchLocation]);


  // ⭐️ MODIFIED: Centralized doSearch using searchRestaurants ⭐️
  const doSearch = async (text) => {
    setQuery(text);
    const nextMode = text?.trim() ? "full" : "nearby";
    setSearchMode(nextMode);
    setLoading(true);
    try {
      // Tìm kiếm dựa trên Tỉnh/Vị trí ĐANG CHỌN
      const mapped = await searchRestaurants({
        query: text,
        provinceId: selectedProvinceId,
        provinceName: selectedProvinceName,
        userLoc: userLoc,
        radius: nextMode === "nearby" ? 2000 : null,
      });
      setPlaces(mapped);
      // MapSection sẽ tự động update marker quán ăn
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
              onRefresh={async () => {
                setLoading(true);
                const mode = query?.trim() ? "full" : "nearby";
                setSearchMode(mode);
                // Use current selected province ID and userLoc for refresh
                const data = await searchRestaurants({
                  query: query || "",
                  provinceId: selectedProvinceId,
                  provinceName: selectedProvinceName,
                  userLoc: userLoc,
                  radius: mode === "nearby" ? 2000 : null,
                });
                setPlaces(data);
                setLoading(false);
              }}
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
                onMarkerPress={(p) => navigation.navigate("RestaurantDetail", { item: p })}
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
    marginRight: 8,   // giảm khoảng cách giữa các item
  }
}
);

