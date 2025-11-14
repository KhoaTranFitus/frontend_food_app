import React, { useEffect, useState, useRef } from "react";
import Animated, { FadeInUp } from "react-native-reanimated";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Easing,
  Animated as RNAnimated,
} from "react-native";
import { MotiView } from 'moti';
import CategoryItem from "../components/CategoryItem";
import BannerCarousel from "../components/BannerCarousel";
import * as Location from "expo-location";
import { searchNearbyPlaces } from "../services/tomtomApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import HomeHeader from "../components/HomeHeader";
import FilterDropdown from "../components/FilterDropdown";
import CategorySection from "../components/CategorySection";
import MapSection from "../components/MapSection";
import NearbyList from "../components/NearbyList";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  // chỉ giữ state/data/handlers ở đây
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [filteredPlaces, setFilteredPlaces] = useState(null);
  const mapRef = useRef(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10000); // 10km mặc định

  // simple fallback categories (use an existing asset as icon to avoid missing file errors)
  const categories = [
    { name: "Món mặn", icon: require("../assets/amthuc.jpg") },
    { name: "Món nước", icon: require("../assets/amthuc.jpg") },
    { name: "Món chay", icon: require("../assets/amthuc.jpg") },
    { name: "Tráng miệng", icon: require("../assets/amthuc.jpg") },
    { name: "Đặc sản", icon: require("../assets/amthuc.jpg") },
    { name: "Ăn nhẹ", icon: require("../assets/amthuc.jpg") },
    {name: "xem thêm..."},
  ];
  // shownPlaces picks filtered if set, otherwise all places
  const shownPlaces = filteredPlaces !== null ? filteredPlaces : places;

  // province -> center coordinates mapping (add or adjust coordinates as needed)
  const PROVINCES = {
    hcm: { latitude: 10.77653, longitude: 106.700981 },
    danang: { latitude: 16.054406, longitude: 108.202164 },
    quangngai: { latitude: 15.120029, longitude: 108.792743 },
    hanoi: { latitude: 21.027764, longitude: 105.834160 },
  };

  // when user selects a province from FilterDropdown
  const handleFilterSelect = async (provinceId) => {
    if (!provinceId || !PROVINCES[provinceId]) return;
    const center = PROVINCES[provinceId];

    // close dropdown & start loading
    setDropdownVisible(false);
    setLoading(true);

    try {
      // search nearby places around province center
      const results = await searchNearbyPlaces({
        latitude: center.latitude,
        longitude: center.longitude,
        radius: searchRadius, // 10km
      });

      // normalize results if needed (ensure position.lat / position.lon)
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

      setPlaces(normalized);
    } catch (err) {
      console.warn('Filter search error', err);
      setPlaces([]); // clear or keep previous results as you prefer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const data = await searchNearbyPlaces({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setPlaces(data || []);
      setLoading(false);
    })();
  }, []);

  // helper: normalize API results -> { id, name, address, position }
  const normalizeResults = (results, idPrefix = "r") => {
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

  // central search function used by categories and header
  const doSearch = async (text) => {
    if (!text) return;
    setQuery(text);
    setLoading(true);
    try {
      // Prefer using existing searchNearbyPlaces service (safer than missing searchAddress)
      const params = {
        latitude: userLoc?.latitude ?? PROVINCES.hcm.latitude,
        longitude: userLoc?.longitude ?? PROVINCES.hcm.longitude,
        query: text,
        // radius: 20000, // add if your service supports it
      };
      const res = await searchNearbyPlaces(params);
      const mapped = normalizeResults(res, text);
      setPlaces(mapped);

      // zoom to first result if available
      if (mapped && mapped.length > 0) {
        const first = mapped[0].position;
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
        } else {
          setUserLoc({ latitude: first.lat, longitude: first.lon });
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#8FD9FB" }}>
      <HomeHeader
        initialQuery={query}
        onSubmitSearch={(q) => doSearch(q)}
        onQueryChange={(t) => setQuery(t)}
        onOpenProfile={() => navigation.navigate("ProfileStack")}
        onOpenFilter={() => setDropdownVisible(true)} // <- HomeScreen manages dropdownVisible
      />

      {/* only one FilterDropdown here */}
      <FilterDropdown
        visible={dropdownVisible}
        onSelect={(prov) => { handleFilterSelect(prov); setDropdownVisible(false); }}
        onClose={() => setDropdownVisible(false)}
        style={{ top: 80, right: 16 }}
      />

      <Pressable onPress={() => dropdownVisible && setDropdownVisible(false)} style={{ flex: 1 }} accessibilityLabel="Dismiss dropdown">
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={async () => {
                setLoading(true);
                const data = await searchNearbyPlaces({
                  latitude: userLoc.latitude,
                  longitude: userLoc.longitude,
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
              <CategorySection categories={categories} onCategoryPress={handleCategoryPress} />

              {/* Map */}
              <MapSection userLoc={userLoc} shownPlaces={shownPlaces} mapRef={mapRef} onMarkerPress={(p) => navigation.navigate("RestaurantDetail", { item: p })} />

              {/* Nearby */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Gần bạn</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>

              <NearbyList shownPlaces={shownPlaces} onItemPress={(item) => navigation.navigate("RestaurantDetail", { item })} />

              <View style={{ height: 60 }} />
            </View>
          </ScrollView>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#8FD9FB" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#07212A",
    letterSpacing: 0.5,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 10,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
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
  categoryList: { paddingLeft: 16, marginBottom: 16 },
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
  restaurantCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    marginHorizontal: 16,
    elevation: 2,
  },
  restaurantImg: { width: 100, height: 100 },
  restaurantInfo: { flex: 1, padding: 10, justifyContent: "center" },
  restaurantName: { fontWeight: "700", fontSize: 16 },
  restaurantDetails: { color: "#666", marginTop: 4 },
  suggestionsWrapper: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    zIndex: 100,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  expandedOverlay: {
    position: "absolute",
    right: 70, // đặt sát bên trái của avatar button / căn chỉnh theo circleButton
    height: 50,
    width: width * 0.82, // rộng đủ để che phần lớn header
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    transform: [{ scaleX: 0 }], // initial
  },
  expandedInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
});
