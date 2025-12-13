import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Location from 'expo-location';

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Optional: map backend pinColor -> native pinColor (string/hex)
const PIN_COLORS = {
  red: '#FF3B30',
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  purple: '#AF52DE',
};

export default function MapScreen({ navigation, route }) {
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);

  const [mapRegion, setMapRegion] = useState(null);
  const [showSearchHereButton, setShowSearchHereButton] = useState(false);
  const [searchCenter, setSearchCenter] = useState(null);

  // ===== ROUTE PLANNER STATE =====
  const [routePlan, setRoutePlan] = useState(null);
  const [routePlanMarkers, setRoutePlanMarkers] = useState([]);

  // ===== BACKEND DATA STATE =====
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [searchId, setSearchId] = useState(Date.now()); // force refresh of marker keys

  // Prevent race conditions between rapid fetches
  const fetchSeqRef = useRef(0);

  // ===== FILTER STATE =====
  const [filterRadius] = useState(2);
  const [filterMinPrice] = useState(null);
  const [filterMaxPrice] = useState(null);
  const [filterMinRating] = useState(0);
  const [filterMaxRating] = useState(5);
  const [filterTags] = useState([]);
  const [filterLimit] = useState(100);

  // ===== UI STATE =====
  const screenWidth = Dimensions.get('window').width;
  const panelWidth = Math.round(screenWidth / 2);
  const animX = useRef(new Animated.Value(-panelWidth)).current;
  const [menuVisible, setMenuVisible] = useState(false);

  // Checkbox states (maps to category_id)
  const [chkAll, setChkAll] = useState(true);
  const [chkDry, setChkDry] = useState(true); // 1
  const [chkSoup, setChkSoup] = useState(true); // 2
  const [chkVegetarian, setChkVegetarian] = useState(true); // 3
  const [chkSalty, setChkSalty] = useState(true); // 4
  const [chkSeafood, setChkSeafood] = useState(true); // 5

  const searchTop = 40;
  const searchHeight = 56;
  const searchLeft = Math.round(screenWidth * 0.05);
  const hamburgerTop = searchTop + searchHeight + 6;

  const mapRef = useRef(null);

  // ===== BACKEND API: FETCH FILTERED LOCATIONS =====
  const fetchFilteredLocations = async (customCenter = null) => {
    const seq = ++fetchSeqRef.current;
    const centerToUse = customCenter || searchCenter || userLocation;

    if (!centerToUse) {
      Alert.alert('Lỗi', 'Vui lòng bật định vị trước');
      return;
    }

    setLoadingRestaurants(true);

    try {
      const selectedCategories = [];
      if (chkDry) selectedCategories.push(1);
      if (chkSoup) selectedCategories.push(2);
      if (chkVegetarian) selectedCategories.push(3);
      if (chkSalty) selectedCategories.push(4);
      if (chkSeafood) selectedCategories.push(5);

      const requestBody = {
        lat: centerToUse.latitude,
        lon: centerToUse.longitude,
        radius: filterRadius,
        categories: selectedCategories, // ALWAYS send array
        min_price: filterMinPrice,
        max_price: filterMaxPrice,
        min_rating: filterMinRating,
        max_rating: filterMaxRating,
        tags: filterTags.length > 0 ? filterTags : undefined,
        limit: filterLimit,
      };

      console.log('📤 Sending filter request to backend:', requestBody);

      const response = await axios.post(`${BACKEND_BASE_URL}/map/filter`, requestBody, {
        timeout: 8000,
        headers: { 'Content-Type': 'application/json' },
      });

      // Ignore stale responses
      if (seq !== fetchSeqRef.current) return;

      if (response.data.success) {
        console.log(`✅ Received ${response.data.total} restaurants from backend`);

        // IMPORTANT: setRestaurants FIRST, then setSearchId
        setRestaurants(response.data.places || []);
        setSearchId(Date.now());
      } else {
        Alert.alert('Lỗi', response.data.message || 'Không thể lấy danh sách nhà hàng');
        setRestaurants([]);
        setSearchId(Date.now());
      }
    } catch (error) {
      if (seq !== fetchSeqRef.current) return;
      console.error('❌ Backend filter error:', error.message);
      Alert.alert('Lỗi kết nối', `Không thể kết nối đến server: ${error.message}`);
      setRestaurants([]);
      setSearchId(Date.now());
    } finally {
      if (seq === fetchSeqRef.current) setLoadingRestaurants(false);
    }
  };

  // ===== MENU =====
  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(animX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };

  const closeMenu = () => {
    Animated.timing(animX, { toValue: -panelWidth, duration: 200, useNativeDriver: true }).start(() => {
      setMenuVisible(false);
    });
  };

  // ===== CHECKBOX HANDLERS =====
  const toggleAll = () => {
    const newVal = !chkAll;
    setChkAll(newVal);
    setChkDry(newVal);
    setChkSoup(newVal);
    setChkVegetarian(newVal);
    setChkSalty(newVal);
    setChkSeafood(newVal);
  };

  const toggleDry = () => {
    const next = !chkDry;
    setChkDry(next);
    setChkAll(next && chkSoup && chkVegetarian && chkSalty && chkSeafood);
  };

  const toggleSoup = () => {
    const next = !chkSoup;
    setChkSoup(next);
    setChkAll(chkDry && next && chkVegetarian && chkSalty && chkSeafood);
  };

  const toggleVegetarian = () => {
    const next = !chkVegetarian;
    setChkVegetarian(next);
    setChkAll(chkDry && chkSoup && next && chkSalty && chkSeafood);
  };

  const toggleSalty = () => {
    const next = !chkSalty;
    setChkSalty(next);
    setChkAll(chkDry && chkSoup && chkVegetarian && next && chkSeafood);
  };

  const toggleSeafood = () => {
    const next = !chkSeafood;
    setChkSeafood(next);
    setChkAll(chkDry && chkSoup && chkVegetarian && chkSalty && next);
  };

  // ===== INIT LOCATION =====
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Quyền truy cập vị trí bị từ chối');
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({});
      const userRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setUserLocation(userRegion);
    })();
  }, []);

  // Fetch restaurants when location / filters change
  useEffect(() => {
    if (userLocation) fetchFilteredLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userLocation,
    filterRadius,
    filterMinPrice,
    filterMaxPrice,
    filterMinRating,
    filterMaxRating,
    filterTags,
    chkDry,
    chkSoup,
    chkVegetarian,
    chkSalty,
    chkSeafood,
  ]);

  // ===== DESTINATION FROM DETAIL =====
  useEffect(() => {
    if (route.params?.destination && userLocation) {
      console.log('📍 Received destination from RestaurantDetail:', route.params.destination);
      setDestination(route.params.destination);
      navigation.setParams({ destination: undefined });
    }
  }, [route.params?.destination, userLocation, navigation]);

  // ===== ROUTE PLAN FROM CHAT =====
  useEffect(() => {
    if (route.params?.routePlan) {
      const plan = route.params.routePlan;

      if (!plan.route || plan.route.length === 0) {
        Alert.alert('Lỗi', 'Lộ trình không có dữ liệu');
        return;
      }

      setRoutePlan(plan);

      const markers = plan.route.map((stop, index) => {
        const lat = stop.latitude || stop.coordinates?.lat;
        const lon = stop.longitude || stop.coordinates?.lon;

        return {
          id: stop.id || stop.restaurant_id,
          name: stop.name,
          latitude: lat,
          longitude: lon,
          order: stop.order || index + 1,
          distance: stop.distance_from_previous || 0,
        };
      });

      const validMarkers = markers.filter((m) => m.latitude && m.longitude);
      if (validMarkers.length === 0) {
        Alert.alert('Lỗi Tọa Độ', 'Backend không trả về tọa độ hợp lệ cho các quán.');
        return;
      }

      setRoutePlanMarkers(validMarkers);

      if (plan.route_coordinates && plan.route_coordinates.length > 0) {
        let routeCoordinates = plan.route_coordinates;

        if (Array.isArray(routeCoordinates[0])) routeCoordinates = routeCoordinates.flat();

        const formattedCoords = routeCoordinates.map((coord) => {
          if (coord.latitude && coord.longitude) return coord;
          if (coord.lat && coord.lon) return { latitude: coord.lat, longitude: coord.lon };
          return coord;
        });

        setRouteCoords(formattedCoords);

        if (mapRef.current) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(formattedCoords, {
              edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
              animated: true,
            });
          }, 500);
        }
      } else {
        if (mapRef.current && validMarkers.length > 0) {
          const markerCoords = validMarkers.map((m) => ({
            latitude: m.latitude,
            longitude: m.longitude,
          }));
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(markerCoords, {
              edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
              animated: true,
            });
          }, 500);
        }
      }

      navigation.setParams({ routePlan: undefined });
    }
  }, [route.params?.routePlan, navigation]);

  // ===== AUTO-FETCH ROUTE =====
  useEffect(() => {
    if (destination && userLocation) fetchRouteFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination]);

  const fetchRouteFromBackend = async () => {
    if (!userLocation || !destination) {
      Alert.alert('Lỗi', 'Vui lòng chọn điểm đến');
      return;
    }

    if (
      Math.abs(userLocation.latitude - destination.latitude) < 0.0001 &&
      Math.abs(userLocation.longitude - destination.longitude) < 0.0001
    ) {
      Alert.alert('Lỗi', 'Vị trí hiện tại và điểm đến quá gần');
      return;
    }

    try {
      const requestBody = {
        start_lat: userLocation.latitude,
        start_lon: userLocation.longitude,
        end_lat: destination.latitude,
        end_lon: destination.longitude,
      };

      const response = await axios.post(`${BACKEND_BASE_URL}/get-route`, requestBody, {
        timeout: 12000,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data.success) {
        setRouteCoords(response.data.coordinates || []);
      } else {
        Alert.alert('Lỗi', response.data.message || 'Không thể tính toán tuyến đường');
        setRouteCoords([]);
      }
    } catch (error) {
      Alert.alert('Lỗi kết nối', `Không thể lấy chỉ đường: ${error.message}`);
      setRouteCoords([]);
    }
  };

  // ===== MAP PAN DETECTION =====
  const handleRegionChangeComplete = (region) => {
    setMapRegion(region);

    if (userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        region.latitude,
        region.longitude
      );
      setShowSearchHereButton(distance > 0.5);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ===== SEARCH HERE =====
  const handleSearchHere = () => {
    if (!mapRegion) return;
    setSearchCenter(mapRegion);
    setShowSearchHereButton(false);
    fetchFilteredLocations(mapRegion);
  };

  // ===== RESET TO USER LOCATION =====
  const handleResetToUserLocation = () => {
    if (userLocation && mapRef.current) {
      setSearchCenter(null);
      setShowSearchHereButton(false);

      // IMPORTANT: clear + bump searchId immediately to avoid ghost markers
      setRestaurants([]);
      setSearchId(Date.now());

      mapRef.current.animateToRegion(userLocation, 500);
      fetchFilteredLocations(userLocation);
    }
  };

  // ===== CLEAR NAVIGATION =====
  const cancelNavigation = () => {
    setRouteCoords([]);
    setDestination(null);
    setRoutePlan(null);
    setRoutePlanMarkers([]);
  };

  const handleRestaurantPress = (place) => {
    const item = {
      id: place.id,
      name: place.name,
      address: place.address,
      position: place.position,
      dishType: place.dishType,
      rating: place.rating || 4.5,
      category: place.category || 'Restaurant',
      image: require('../assets/amthuc.jpg'),
    };

    navigation.navigate('HomeStack', {
      screen: 'RestaurantDetail',
      params: { item },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {userLocation ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={userLocation}
          showsUserLocation
          showsPointsOfInterest={false}
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          {destination && <Marker coordinate={destination} title="Điểm đến" pinColor="red" />}

          {searchCenter && (
            <Marker
              key="search-center"
              coordinate={searchCenter}
              title="Đang tìm ở đây"
              pinColor="orange"
              opacity={0.7}
            />
          )}

          {/* Route Planner markers keep as-is (numbered) */}
          {routePlanMarkers && routePlanMarkers.length > 0 ? (
            routePlanMarkers.map((marker) => (
              <Marker
                key={`route-${marker.id}`}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                pinColor="#FF6347"
              >
                <Callout tooltip>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>
                      {marker.order}. {marker.name}
                    </Text>
                    {!!marker.distance && (
                      <Text style={styles.calloutDistance}>
                        Khoảng cách: {Number(marker.distance).toFixed(2)} km
                      </Text>
                    )}
                  </View>
                </Callout>
              </Marker>
            ))
          ) : (
            // Restaurants: NATIVE DEFAULT PINS (no custom marker view, no labels)
            restaurants.map((restaurant) => {
              const lat = Number(restaurant.position?.lat);
              const lon = Number(restaurant.position?.lon);
              if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

              const pinColor = PIN_COLORS[restaurant.pinColor] || undefined;

              return (
                <Marker
                  key={`${restaurant.id}-${searchId}`}
                  coordinate={{ latitude: lat, longitude: lon }}
                  title={restaurant.name}
                  description={restaurant.address}
                  pinColor={pinColor}
                >
                  <Callout onPress={() => handleRestaurantPress(restaurant)}>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{restaurant.name}</Text>
                      <Text style={styles.calloutAddress}>{restaurant.address}</Text>
                      {!!restaurant.distance && (
                        <Text style={styles.calloutDistance}>Khoảng cách: {restaurant.distance} km</Text>
                      )}
                      {!!restaurant.rating && (
                        <Text style={styles.calloutRating}>Rating: {restaurant.rating} ⭐</Text>
                      )}
                      <Text style={styles.calloutTapHint}>Nhấn để xem chi tiết</Text>
                    </View>
                  </Callout>
                </Marker>
              );
            })
          )}

          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={5}
              strokeColor="#FF6347"
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#ff6347" />
        </View>
      )}

      {loadingRestaurants && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Đang tải nhà hàng...</Text>
        </View>
      )}

      {showSearchHereButton && (
        <TouchableOpacity style={styles.searchHereButton} onPress={handleSearchHere}>
          <Text style={styles.searchHereText}>🔍 Tìm ở vị trí này</Text>
        </TouchableOpacity>
      )}

      {searchCenter && (
        <TouchableOpacity style={styles.resetLocationButton} onPress={handleResetToUserLocation}>
          <Text style={styles.resetLocationText}>📍 Về vị trí của tôi</Text>
        </TouchableOpacity>
      )}

      {routeCoords.length > 0 && !routePlan && (
        <TouchableOpacity style={styles.cancelNavButton} onPress={cancelNavigation}>
          <Text style={styles.cancelNavButtonText}>✕ Hủy Chỉ Đường</Text>
        </TouchableOpacity>
      )}

      {routePlan && (
        <View style={styles.routeInfoPanel}>
          <Text style={styles.routeInfoTitle}>📍 Lộ trình tối ưu</Text>
          <Text style={styles.routeInfoText}>Số điểm: {routePlan.route.length} quán</Text>
          {routePlan.total_distance_km !== undefined && (
            <Text style={styles.routeInfoText}>
              Tổng khoảng cách: {Number(routePlan.total_distance_km).toFixed(2)} km
            </Text>
          )}
          <TouchableOpacity
            style={[styles.cancelNavButton, { position: 'relative', marginTop: 12, alignSelf: 'center' }]}
            onPress={cancelNavigation}
          >
            <Text style={styles.cancelNavButtonText}>✕ Hủy Lộ Trình</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={[styles.hamburger, { top: hamburgerTop, left: searchLeft }]} onPress={openMenu}>
        <View style={styles.hbLine} />
        <View style={styles.hbLine} />
        <View style={styles.hbLine} />
      </TouchableOpacity>

      {menuVisible && (
        <>
          <View style={styles.overlay} pointerEvents="none" />
          <Animated.View style={[styles.panel, { transform: [{ translateX: animX }] }]}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Bộ lọc</Text>
              <TouchableOpacity onPress={closeMenu} style={styles.closeBtn}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator>
              <TouchableOpacity style={styles.row} onPress={toggleAll}>
                <View style={[styles.checkbox, chkAll && styles.checkboxChecked]}>
                  {chkAll && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.rowText}>Tất cả</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.row} onPress={toggleDry}>
                <View style={[styles.checkbox, chkDry && styles.checkboxChecked]}>
                  {chkDry && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.rowText}>Món Khô (Dry)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.row} onPress={toggleSoup}>
                <View style={[styles.checkbox, chkSoup && styles.checkboxChecked]}>
                  {chkSoup && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.rowText}>Món Nước (Soup)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.row} onPress={toggleVegetarian}>
                <View style={[styles.checkbox, chkVegetarian && styles.checkboxChecked]}>
                  {chkVegetarian && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.rowText}>Món Chay (Vegetarian)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.row} onPress={toggleSalty}>
                <View style={[styles.checkbox, chkSalty && styles.checkboxChecked]}>
                  {chkSalty && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.rowText}>Món Mặn (Salty)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.row} onPress={toggleSeafood}>
                <View style={[styles.checkbox, chkSeafood && styles.checkboxChecked]}>
                  {chkSeafood && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.rowText}>Hải Sản (Seafood)</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  hamburger: {
    position: 'absolute',
    top: 46,
    left: 12,
    zIndex: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    elevation: 6,
  },
  hbLine: {
    width: 20,
    height: 2,
    backgroundColor: '#333',
    marginVertical: 2,
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 25,
  },

  panel: {
    position: 'absolute',
    left: 0,
    top: 96,
    bottom: 0,
    width: '50%',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 8,
    zIndex: 30,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  panelTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  closeBtn: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  closeTxt: { fontSize: 18, color: '#333' },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rowText: { marginLeft: 10, fontSize: 13, flexShrink: 1 },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: { backgroundColor: '#2ecc71', borderColor: '#2ecc71' },
  checkMark: { color: '#fff', fontWeight: '700' },

  calloutContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 200,
    paddingVertical: 8,
  },
  calloutTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4, color: '#333' },
  calloutAddress: { fontSize: 12, color: '#666', marginBottom: 6 },
  calloutTapHint: { fontSize: 11, color: '#2196F3', fontWeight: '600', fontStyle: 'italic' },
  calloutDistance: { fontSize: 11, color: '#2ecc71', marginBottom: 4, fontWeight: '500' },
  calloutRating: { fontSize: 11, color: '#FF9500', marginBottom: 4, fontWeight: '500' },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: { marginTop: 10, fontSize: 14, color: '#fff', fontWeight: '600' },

  searchHereButton: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    zIndex: 50,
  },
  searchHereText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  resetLocationButton: {
    position: 'absolute',
    top: 170,
    alignSelf: 'center',
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 5,
    zIndex: 50,
  },
  resetLocationText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  cancelNavButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 5,
    zIndex: 50,
  },
  cancelNavButtonText: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },

  routeInfoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    zIndex: 50,
  },
  routeInfoTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  routeInfoText: { fontSize: 13, color: '#666', marginBottom: 4 },
});
