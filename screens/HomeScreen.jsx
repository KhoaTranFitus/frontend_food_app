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
import { useHeaderAnimation } from "../hooks/useHeaderAnimation";

export default function HomeScreen({ navigation, route }) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [filteredPlaces, setFilteredPlaces] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const mapRef = useRef(null);
  const { handleScroll, headerAnimatedStyle } = useHeaderAnimation();

  const categories = [
    { name: "Món mặn", icon: require("../assets/beef.jpg") },
    { name: "Món nước", icon: require("../assets/burger.png") },
    { name: "Món chay", icon: require("../assets/comtam.jpg") },
    { name: "Tráng miệng", icon: require("../assets/coffee.jpg") },
    { name: "Đặc sản", icon: require("../assets/drink.png") },
    { name: "Ăn nhẹ", icon: require("../assets/pizza.png") },
    { name: "xem thêm..." },
  ];

  const shownPlaces = (filteredPlaces !== null ? filteredPlaces : places).slice(0, 10);

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
  useEffect(() => {
    (async () => {
      setLoading(true);
      // Lấy vị trí người dùng (chỉ để truyền tham số, không còn dùng cho TomTom)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        // Lưu vị trí người dùng
        setUserLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
      
      // ⭐️ GỌI API THẬT ĐỂ LẤY DỮ LIỆU BAN ĐẦU ⭐️
      try {
          const data = await restaurantAPI.getAllRestaurants();
          setPlaces(data || []);
      } catch (e) {
          console.error("Initial load error:", e);
          setPlaces([]);
      }
      setLoading(false);
    })();
  }, []);

  // Handle category selection from AllCategoriesScreen
  useEffect(() => {
    if (route.params?.selectedCategory) {
      doSearch(route.params.selectedCategory);
    }
  }, [route.params?.selectedCategory]);

  // ⭐️ THAY THẾ LOGIC TÌM KIẾM ⭐️
  const doSearch = async (text) => {
    if (!text) return;
    setQuery(text);
    setLoading(true);
    try {
      // ⭐️ DÙNG restaurantAPI.getAllRestaurants(query) ⭐️
      const mapped = await restaurantAPI.getAllRestaurants(text); 
      setPlaces(mapped);

      // Cập nhật Map (Giữ nguyên logic animateToRegion)
      if (mapped && mapped.length > 0) {
        // Giả định đối tượng restaurant (first) từ backend đã có các thuộc tính 'lat' và 'lon'
        const first = mapped[0]; 
        if (mapRef.current && typeof mapRef.current.animateToRegion === "function") {
          try {
            mapRef.current.animateToRegion(
              {
                latitude: first.lat,
                longitude: first.lon,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              },
              450
            );
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      console.warn("doSearch error:", e);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

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

  // Tạm thời vô hiệu hóa lọc tỉnh thành vì đã xóa hàm handleFilterSelect
  const handleFilterSelect = (provinceId) => {
    setDropdownVisible(false);
    console.warn(`Filtering by province ${provinceId} is temporarily disabled.`);
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
          // Giữ lại nút filter nhưng hàm handleFilterSelect bị vô hiệu hóa
          onOpenFilter={() => setDropdownVisible(true)} 
        />
      </Animated.View>

      {/* only one FilterDropdown here */}
      <FilterDropdown
        visible={dropdownVisible}
        onSelect={(prov) => { handleFilterSelect(prov); setDropdownVisible(false); }}
        onClose={() => setDropdownVisible(false)}
        style={{ top: 80, right: 16 }}
      />

      <Pressable onPress={() => dropdownVisible && setDropdownVisible(false)} style={{ flex: 1 }} accessibilityLabel="Dismiss dropdown">
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16} refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh} // ⭐️ SỬ DỤNG HÀM REFRESH MỚI ⭐️
              colors={["#ff6347"]}
            />
          }>
            <View style={styles.bannerWrapper}>
              <BannerCarousel />
            </View>

            <View style={styles.whiteSection}>
              {/* Category */}
              <CategorySection categories={categories} onCategoryPress={handleCategoryPress} selectedCategory={selectedCategory} onViewAllPress={() => navigation.navigate('AllCategories', { categories })} />

              {/* Map */}
              <MapSection userLoc={userLoc} shownPlaces={shownPlaces} mapRef={mapRef} onMarkerPress={(p) => navigation.navigate("RestaurantDetail", { item: p })} />

              {/* Nearby */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Gần bạn</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AllRestaurants', { places, userLoc })}>
                  <Text style={styles.seeAll}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>

              <NearbyList shownPlaces={shownPlaces} onItemPress={(item) => navigation.navigate("RestaurantDetail", { item })} hasMore={places.length > 10} onViewMore={() => navigation.navigate('AllRestaurants', { places, userLoc })} />

              <View style={{ height: 60 }} />
            </View>
          </ScrollView>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bannerWrapper: {
    marginTop: 20,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
    zIndex: 1,
  },
  whiteSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  seeAll: { fontSize: 14, color: "#ff6347" },
});