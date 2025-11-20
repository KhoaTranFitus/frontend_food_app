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
import { searchNearbyPlaces } from "../services/tomtomApi";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "../components/HomeHeader";
import FilterDropdown from "../components/FilterDropdown";
import CategorySection from "../components/CategorySection";
import MapSection from "../components/MapSection";
import NearbyList from "../components/NearbyList";
import { normalizeResults, PROVINCES, searchByProvince, searchByQuery } from "../services/homeService";
import { useHeaderAnimation } from "../hooks/useHeaderAnimation";

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [filteredPlaces, setFilteredPlaces] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const { handleScroll, headerAnimatedStyle } = useHeaderAnimation();

  const categories = [
    { name: "Món mặn", icon: require("../assets/amthuc.jpg") },
    { name: "Món nước", icon: require("../assets/amthuc.jpg") },
    { name: "Món chay", icon: require("../assets/amthuc.jpg") },
    { name: "Tráng miệng", icon: require("../assets/amthuc.jpg") },
    { name: "Đặc sản", icon: require("../assets/amthuc.jpg") },
    { name: "Ăn nhẹ", icon: require("../assets/amthuc.jpg") },
    { name: "xem thêm..." },
  ];

  const shownPlaces = (filteredPlaces !== null ? filteredPlaces : places).slice(0, 10);

  const handleFilterSelect = async (provinceId) => {
    setDropdownVisible(false);
    setLoading(true);
    try {
      const normalized = await searchByProvince(provinceId);
      setPlaces(normalized);
    } catch (err) {
      console.warn('Filter search error', err);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const data = await searchNearbyPlaces({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setPlaces(data || []);
      setLoading(false);
    })();
  }, []);

  const doSearch = async (text) => {
    if (!text) return;
    setQuery(text);
    setLoading(true);
    try {
      const mapped = await searchByQuery(text, userLoc);
      setPlaces(mapped);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#9a0e0eff" }}>
      <Animated.View style={headerAnimatedStyle}>
        <HomeHeader
          initialQuery={query}
          onSubmitSearch={(q) => doSearch(q)}
          onQueryChange={(t) => setQuery(t)}
          onOpenProfile={() => navigation.navigate("ProfileStack")}
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
              <CategorySection categories={categories} onCategoryPress={handleCategoryPress} onViewAllPress={() => navigation.navigate('AllCategories', { categories, onCategoryPress: handleCategoryPress })} />

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
