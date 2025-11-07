import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import FilterDropdown from "../components/FilterDropdown";
import * as Location from "expo-location";
import { searchNearbyPlaces } from "../services/tomtomApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";

export default function HomeScreen({ navigation }) {
  const [dropdownVisible, setDropdownVisible] = React.useState(false);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState(null);

  const categories = [
    { name: "Pizza", icon: require("../assets/pizza.png") },
    { name: "Sushi", icon: require("../assets/sushi.png") },
    { name: "Drink", icon: require("../assets/drink.png") },
    { name: "Dessert", icon: require("../assets/dessert.png") },
    { name: "Burger", icon: require("../assets/burger.png") },
  ];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission denied for location access.");
        setLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setUserLoc({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const data = await searchNearbyPlaces({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      setPlaces(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ff6347" />
        <Text>Đang tải các quán ăn gần bạn...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback
        onPress={() => dropdownVisible && setDropdownVisible(false)}
      >
        <View style={{ flex: 1 }}>
          {/* Header + Search */}
          <View style={styles.header}>
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                  placeholder="Tìm món ăn, địa điểm..."
                  style={styles.searchInput}
                  placeholderTextColor="#eee"
                />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => setDropdownVisible(!dropdownVisible)}
                >
                  <Ionicons
                    name="options-outline"
                    size={24}
                    color="#333"
                    style={{ marginLeft: 10 }}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate("Profile")}
                >
                  <Image
                    source={require("../assets/avatar.png")}
                    style={styles.avatar}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Dropdown */}
          <FilterDropdown
            visible={dropdownVisible}
            onSelect={(filter) => {
              alert("Filter: " + filter);
              setDropdownVisible(false);
            }}
            onClose={() => setDropdownVisible(false)}
            style={{ top: 60, right: 16 }}
          />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Banner */}
            <Image
              source={require("../assets/banner.jpg")}
              style={styles.banner}
            />

            {/* Categories */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh mục</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryList}
            >
              {categories.map((cat, index) => (
                <TouchableOpacity key={index} style={styles.categoryCard}>
                  <Image source={cat.icon} style={styles.categoryIcon} />
                  <Text style={styles.categoryText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 📍 Bản đồ hiển thị các quán ăn gần đây */}
            <Text style={[styles.sectionTitle, { paddingHorizontal: 16 }]}>
              Bản đồ quán ăn gần bạn
            </Text>
            <View
              style={{
                height: 300,
                marginHorizontal: 16,
                marginTop: 8,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: userLoc?.latitude || 10.77653,
                  longitude: userLoc?.longitude || 106.700981,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                {/* Marker vị trí người dùng */}
                {userLoc && (
                  <Marker
                    coordinate={userLoc}
                    title="Vị trí của bạn"
                    pinColor="blue"
                  />
                )}

                {/* Marker các quán ăn */}
                {places.map((p) => (
                  <Marker
                    key={p.id}
                    coordinate={{
                      latitude: p.position.lat,
                      longitude: p.position.lon,
                    }}
                    title={p.name}
                    description={p.address}
                    pinColor="red"
                    onPress={() =>
                      navigation.navigate("RestaurantDetail", { item: p })
                    }
                  />
                ))}
              </MapView>
            </View>

            {/* Nearby Restaurants List */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gần bạn</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            {places.length > 0 ? (
              places.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.restaurantCard}
                  onPress={() =>
                    navigation.navigate("RestaurantDetail", { item })
                  }
                >
                  <Image
                    source={require("../assets/amthuc.jpg")}
                    style={styles.restaurantImg}
                  />
                  <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName}>{item.name}</Text>
                    <Text style={styles.restaurantDetails}>{item.address}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text
                style={{
                  textAlign: "center",
                  color: "gray",
                  marginVertical: 10,
                }}
              >
                Không tìm thấy quán ăn gần bạn.
              </Text>
            )}

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3A721" },
  header: { paddingHorizontal: 16, paddingTop: 10 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#C79100",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  searchInput: { marginLeft: 8, flex: 1, color: "#fff" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginLeft: 10 },
  banner: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginVertical: 16,
    alignSelf: "center",
  },
  categoryList: { paddingLeft: 16, marginBottom: 16 },
  categoryCard: { alignItems: "center", marginRight: 16 },
  categoryIcon: { width: 60, height: 60, borderRadius: 30 },
  categoryText: { marginTop: 6, fontSize: 13, fontWeight: "600" },
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
});