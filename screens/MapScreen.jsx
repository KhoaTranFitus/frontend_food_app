import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Text, Animated, Dimensions, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Location from 'expo-location';

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function MapScreen({ navigation, route }) {
  // ===== LOCATION & MAP STATE =====
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);

  // ===== ROUTE PLANNER STATE =====
  const [routePlan, setRoutePlan] = useState(null); // Data from Route Planner
  const [routePlanMarkers, setRoutePlanMarkers] = useState([]); // Optimized route markers

  // ===== BACKEND DATA STATE =====
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  // ===== FILTER STATE (sent to backend) =====
  const [filterRadius, setFilterRadius] = useState(2); // km - default 2km radius
  const [filterCategories, setFilterCategories] = useState([]); // Category IDs: [1,2,3,4,5]
  const [filterMinPrice, setFilterMinPrice] = useState(null);
  const [filterMaxPrice, setFilterMaxPrice] = useState(null);
  const [filterMinRating, setFilterMinRating] = useState(0);
  const [filterMaxRating, setFilterMaxRating] = useState(5);
  const [filterTags, setFilterTags] = useState([]);
  const [filterLimit, setFilterLimit] = useState(100);

  // ===== UI STATE =====
  const screenWidth = Dimensions.get('window').width;
  const panelWidth = Math.round(screenWidth / 2);
  const animX = useRef(new Animated.Value(-panelWidth)).current;
  const [menuVisible, setMenuVisible] = useState(false);

  // Checkbox states for category filtering (maps to category_id)
  const [chkAll, setChkAll] = useState(true);
  const [chkDry, setChkDry] = useState(true);        // category_id: 1
  const [chkSoup, setChkSoup] = useState(true);      // category_id: 2
  const [chkVegetarian, setChkVegetarian] = useState(true); // category_id: 3
  const [chkSalty, setChkSalty] = useState(true);    // category_id: 4
  const [chkSeafood, setChkSeafood] = useState(true); // category_id: 5

  const searchTop = 40;
  const searchHeight = 56;
  const searchLeft = Math.round(screenWidth * 0.05);
  const hamburgerTop = searchTop + searchHeight + 6;
  const mapRef = useRef(null);

  // ===== BACKEND API: FETCH FILTERED LOCATIONS =====
  /**
   * Posts filter parameters to backend /api/map/filter
   * Backend returns filtered list with distance calculated server-side
   */
  const fetchFilteredLocations = async () => {
    if (!userLocation) {
      Alert.alert('Lỗi', 'Vui lòng bật định vị trước');
      return;
    }

    setLoadingRestaurants(true);
    try {
      // Map checkbox states to category IDs
      // IMPORTANT: Always send the categories array (even if empty) for strict filtering
      // - Empty array [] = filter strictly (no categories match → return 0 results)
      // - Non-empty array [1,2,3] = filter strictly (return only these categories)
      // - Sending undefined would make backend treat it as "no filter" and return all
      const selectedCategories = [];
      if (chkDry) selectedCategories.push(1);
      if (chkSoup) selectedCategories.push(2);
      if (chkVegetarian) selectedCategories.push(3);
      if (chkSalty) selectedCategories.push(4);
      if (chkSeafood) selectedCategories.push(5);

      const requestBody = {
        lat: userLocation.latitude,
        lon: userLocation.longitude,
        radius: filterRadius,
        categories: selectedCategories, // ALWAYS send array (even if empty)
        min_price: filterMinPrice,
        max_price: filterMaxPrice,
        min_rating: filterMinRating,
        max_rating: filterMaxRating,
        tags: filterTags.length > 0 ? filterTags : undefined,
        limit: filterLimit,
      };

      console.log('📤 Sending filter request to backend:', requestBody);

      const response = await axios.post(`${BACKEND_BASE_URL}/map/filter`, requestBody, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        console.log(`✅ Received ${response.data.total} restaurants from backend`);
        setRestaurants(response.data.places || []);
      } else {
        Alert.alert('Lỗi', response.data.message || 'Không thể lấy danh sách nhà hàng');
        setRestaurants([]);
      }
    } catch (error) {
      console.error('❌ Backend filter error:', error.message);
      Alert.alert('Lỗi kết nối', `Không thể kết nối đến server: ${error.message}`);
      setRestaurants([]);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  // ===== MENU & CHECKBOX HANDLERS =====
  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(animX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };

  const closeMenu = () => {
    Animated.timing(animX, { toValue: -panelWidth, duration: 200, useNativeDriver: true }).start(() => {
      setMenuVisible(false);
    });
  };

  // Checkbox handlers - update categories and trigger re-fetch
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

  // ===== LIFECYCLE: Initialize location + fetch restaurants =====
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Quyền truy cập vị trí bị từ chối');
        return;
      }

      let { coords } = await Location.getCurrentPositionAsync({});
      const userRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setUserLocation(userRegion);
    })();
  }, []);

  // Fetch restaurants whenever any filter changes
  useEffect(() => {
    if (userLocation) {
      fetchFilteredLocations();
    }
  }, [filterRadius, filterMinPrice, filterMaxPrice, filterMinRating, filterMaxRating, filterTags, chkDry, chkSoup, chkVegetarian, chkSalty, chkSeafood]);

  // ===== LISTEN FOR DESTINATION FROM RESTAURANT DETAIL =====
  /**
   * When user taps "Chỉ đường" button in RestaurantDetail,
   * route.params contains destination: { latitude, longitude }
   * This useEffect automatically fetches route when both destination and userLocation exist
   */
  useEffect(() => {
    if (route.params?.destination && userLocation) {
      console.log('📍 Received destination from RestaurantDetail:', route.params.destination);
      setDestination(route.params.destination);
      // Clear route.params to prevent re-triggering
      navigation.setParams({ destination: undefined });
    }
  }, [route.params?.destination, userLocation, navigation]);

  // ===== LISTEN FOR ROUTE PLAN FROM CHAT ROUTE PLANNER =====
  /**
   * When user creates route plan from ChatScreen,
   * route.params contains routePlan with optimized route data
   */
  useEffect(() => {
    console.log('🔍 MapScreen useEffect - route.params:', route.params);
    
    if (route.params?.routePlan) {
      console.log('🗺️ Received route plan from Chat:', JSON.stringify(route.params.routePlan, null, 2));
      const plan = route.params.routePlan;
      
      // Check if route has valid data
      if (!plan.route || plan.route.length === 0) {
        Alert.alert('Lỗi', 'Lộ trình không có dữ liệu');
        return;
      }
      
      console.log(`📊 Processing ${plan.route.length} stops...`);
      setRoutePlan(plan);
      
      // Backend returns: { id, latitude, longitude, ... } NOT { coordinates: {lat, lon} }
      const markers = plan.route.map((stop, index) => {
        const lat = stop.latitude || stop.coordinates?.lat;
        const lon = stop.longitude || stop.coordinates?.lon;
        
        console.log(`Stop ${index + 1}: ${stop.name} - lat: ${lat}, lon: ${lon}`);
        
        if (!lat || !lon) {
          console.warn(`⚠️ Stop ${stop.name} has null coordinates:`, stop);
        }
        
        return {
          id: stop.id || stop.restaurant_id,
          name: stop.name,
          latitude: lat,
          longitude: lon,
          order: stop.order || index + 1,
          distance: stop.distance_from_previous || 0,
        };
      });
      
      // Filter out markers with null coordinates
      const validMarkers = markers.filter(m => m.latitude && m.longitude);
      
      console.log(`✅ Valid markers: ${validMarkers.length}/${markers.length}`);
      
      if (validMarkers.length === 0) {
        Alert.alert(
          'Lỗi Tọa Độ',
          'Backend không trả về tọa độ hợp lệ cho các quán.\n\nCần fix backend để lấy lat/lon từ database.'
        );
        return;
      }
      
      setRoutePlanMarkers(validMarkers);

      // ✅ Use route_coordinates from backend if available
      if (plan.route_coordinates && plan.route_coordinates.length > 0) {
        console.log(`🗺️ Received route_coordinates from backend (length: ${plan.route_coordinates.length})`);
        
        // Check if it's nested array (array of segments) or flat array
        let routeCoordinates = plan.route_coordinates;
        
        // If first element is an array, it's nested - need to flatten
        if (Array.isArray(routeCoordinates[0])) {
          console.log('⚠️ Detected nested array, flattening...');
          routeCoordinates = routeCoordinates.flat();
          console.log(`✅ Flattened to ${routeCoordinates.length} points`);
        }
        
        // Ensure format is {latitude, longitude}
        const formattedCoords = routeCoordinates.map(coord => {
          if (coord.latitude && coord.longitude) {
            return coord; // Already correct format
          } else if (coord.lat && coord.lon) {
            return { latitude: coord.lat, longitude: coord.lon }; // Convert from lat/lon
          }
          return coord;
        });
        
        console.log('🔍 First 3 coords:', JSON.stringify(formattedCoords.slice(0, 3)));
        console.log('🔍 Last 3 coords:', JSON.stringify(formattedCoords.slice(-3)));
        console.log(`📏 Total route points: ${formattedCoords.length}`);
        
        setRouteCoords(formattedCoords);

        // Fit map to show entire route
        if (mapRef.current) {
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.fitToCoordinates(plan.route_coordinates, {
                edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                animated: true,
              });
            }
          }, 500);
        }
      } else {
        console.warn('⚠️ No route_coordinates from backend, displaying markers only');
        // Fallback: just fit to markers
        if (mapRef.current && validMarkers.length > 0) {
          const markerCoords = validMarkers.map(m => ({
            latitude: m.latitude,
            longitude: m.longitude,
          }));
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.fitToCoordinates(markerCoords, {
                edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                animated: true,
              });
            }
          }, 500);
        }
      }

      // Clear params
      navigation.setParams({ routePlan: undefined });
    }
  }, [route.params?.routePlan, navigation]);

  // ===== AUTO-FETCH ROUTE WHEN DESTINATION CHANGES =====
  /**
   * When destination state updates, automatically call backend to get route
   */
  useEffect(() => {
    if (destination && userLocation) {
      console.log('🗺️ Fetching route for destination:', destination);
      fetchRouteFromBackend();
    }
  }, [destination]);

  // ===== LIFECYCLE: Initialize location + fetch restaurants =====
  const fetchRouteFromBackend = async () => {
    if (!userLocation || !destination) {
      Alert.alert('Lỗi', 'Vui lòng chọn điểm đến');
      return;
    }

    // Check if coordinates are too close
    if (Math.abs(userLocation.latitude - destination.latitude) < 0.0001 &&
        Math.abs(userLocation.longitude - destination.longitude) < 0.0001) {
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

      console.log('📤 Requesting route from backend:', requestBody);

      const response = await axios.post(`${BACKEND_BASE_URL}/get-route`, requestBody, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        console.log(`✅ Received route with ${response.data.total_points} points`);
        setRouteCoords(response.data.coordinates || []);
      } else {
        Alert.alert('Lỗi', response.data.message || 'Không thể tính toán tuyến đường');
        setRouteCoords([]);
      }
    } catch (error) {
      console.error('❌ Route calculation error:', error.message);
      Alert.alert('Lỗi kết nối', `Không thể lấy chỉ đường: ${error.message}`);
      setRouteCoords([]);
    }
  };

  // ===== CLEAR NAVIGATION =====
  /**
   * Cancel navigation mode: clear route and destination
   * Removes Polyline from map
   */
  const cancelNavigation = () => {
    console.log('🛑 Canceling navigation');
    setRouteCoords([]);
    setDestination(null);
    setRoutePlan(null);
    setRoutePlanMarkers([]);
  };

  // Navigate to restaurant detail screen
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
      params: { item }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {userLocation ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={userLocation}
          showsUserLocation={true}
        >
          {destination && <Marker coordinate={destination} title="Điểm đến" pinColor="red" />}

          {/* Display Route Planner markers with numbered pins */}
          {routePlanMarkers && routePlanMarkers.length > 0 ? (
            routePlanMarkers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                pinColor="#FF6347"
              >
                <View style={{ alignItems: 'center' }}>
                  <View style={styles.markerLabelContainer}>
                    <Text style={styles.markerLabelText}>{marker.order}. {marker.name}</Text>
                  </View>
                  <View style={styles.routeMarker}>
                    <Text style={styles.routeMarkerText}>{marker.order}</Text>
                  </View>
                </View>
                <Callout tooltip={true}>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>
                      {marker.order}. {marker.name}
                    </Text>
                    {marker.distance && (
                      <Text style={styles.calloutDistance}>
                        Khoảng cách: {marker.distance.toFixed(2)} km
                      </Text>
                    )}
                  </View>
                </Callout>
              </Marker>
            ))
          ) : (
            restaurants && restaurants.length > 0 && restaurants.map(restaurant => (
              <Marker
                key={restaurant.id}
                coordinate={{
                  latitude: restaurant.position.lat,
                  longitude: restaurant.position.lon,
                }}
                title={restaurant.name}
                description={restaurant.address}
                pinColor={restaurant.pinColor}
              >
                <Callout onPress={() => handleRestaurantPress(restaurant)} tooltip={true}>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{restaurant.name}</Text>
                    <Text style={styles.calloutAddress}>{restaurant.address}</Text>
                    {restaurant.distance && <Text style={styles.calloutDistance}>Khoảng cách: {restaurant.distance} km</Text>}
                    {restaurant.rating && <Text style={styles.calloutRating}>Rating: {restaurant.rating} ⭐</Text>}
                    <Text style={styles.calloutTapHint}>Nhấn để xem chi tiết</Text>
                  </View>
                </Callout>
              </Marker>
            ))
          )}

          {/* Polyline connecting all route stops */}
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

      {/* Cancel Navigation Button - appears when route is active */}
      {routeCoords.length > 0 && !routePlan && (
        <TouchableOpacity 
          style={styles.cancelNavButton} 
          onPress={cancelNavigation}
        >
          <Text style={styles.cancelNavButtonText}>✕ Hủy Chỉ Đường</Text>
        </TouchableOpacity>
      )}

      {/* Route Info Panel - shows route plan statistics */}
      {routePlan && (
        <View style={styles.routeInfoPanel}>
          <Text style={styles.routeInfoTitle}>📍 Lộ trình tối ưu</Text>
          <Text style={styles.routeInfoText}>
            Số điểm: {routePlan.route.length} quán
          </Text>
          {routePlan.total_distance_km !== undefined && (
            <Text style={styles.routeInfoText}>
              Tổng khoảng cách: {routePlan.total_distance_km.toFixed(2)} km
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

      {/* Hamburger menu, giờ nằm dưới search bar và align trái với searchContainer */}
      <TouchableOpacity style={[styles.hamburger, { top: hamburgerTop, left: searchLeft }]} onPress={openMenu}>
         <View style={styles.hbLine} />
         <View style={styles.hbLine} />
         <View style={styles.hbLine} />
       </TouchableOpacity>

      {/* Slide-in menu (animated) + overlay */}
      {menuVisible && (
        <>
          {/* dimming visual - KHÔNG chặn tương tác với map (pointerEvents='none') */}
          <View style={styles.overlay} pointerEvents="none" />
          <Animated.View style={[styles.panel, { transform: [{ translateX: animX }] }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 }}>
              <Text style={styles.panelTitle}>Bộ lọc</Text>
              <TouchableOpacity onPress={closeMenu} style={styles.closeBtn}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
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
   // dimming visual nhưng không chặn touch (pointerEvents set to none in render)
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
     top: 96, // searchTop (40) + searchHeight (56)
     bottom: 0, // Kéo dài xuống tận đáy màn hình
     width: '50%', // Rộng 50% màn hình
     backgroundColor: '#fff',
     paddingVertical: 10,
     paddingHorizontal: 12,
     elevation: 8,
     zIndex: 30,
     borderTopRightRadius: 12,
     overflow: 'hidden',
     flexDirection: 'column', // Để ScrollView có thể flex
   },
   panelTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
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
   closeBtn: {
     paddingHorizontal: 6,
     paddingVertical: 2,
     borderRadius: 6,
     alignItems: 'center',
     justifyContent: 'center',
   },
   closeTxt: { fontSize: 18, color: '#333' },
   calloutContainer: {
     padding: 12,
     backgroundColor: '#fff',
     borderRadius: 8,
     minWidth: 200,
     paddingVertical: 8,
   },
   calloutTitle: {
     fontSize: 14,
     fontWeight: '700',
     marginBottom: 4,
     color: '#333',
   },
   calloutAddress: {
     fontSize: 12,
     color: '#666',
     marginBottom: 6,
   },
   calloutTapHint: {
     fontSize: 11,
     color: '#2196F3',
     fontWeight: '600',
     fontStyle: 'italic',
   },
   calloutDistance: {
     fontSize: 11,
     color: '#2ecc71',
     marginBottom: 4,
     fontWeight: '500',
   },
   calloutRating: {
     fontSize: 11,
     color: '#FF9500',
     marginBottom: 4,
     fontWeight: '500',
   },
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
   loadingText: {
     marginTop: 10,
     fontSize: 14,
     color: '#fff',
     fontWeight: '600',
   },
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
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 3,
   },
   cancelNavButtonText: {
     color: '#fff',
     fontSize: 14,
     fontWeight: '700',
     textAlign: 'center',
   },
   routeMarker: {
     width: 36,
     height: 36,
     borderRadius: 18,
     backgroundColor: '#FF6347',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 3,
     borderColor: '#fff',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 3,
     elevation: 5,
   },
   routeMarkerText: {
     color: '#fff',
     fontSize: 16,
     fontWeight: '700',
   },
   markerLabelContainer: {
     backgroundColor: 'rgba(255, 255, 255, 0.95)',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 6,
     marginBottom: 4,
     borderWidth: 1,
     borderColor: '#FF6347',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.2,
     shadowRadius: 2,
     elevation: 3,
   },
   markerLabelText: {
     color: '#FF6347',
     fontSize: 12,
     fontWeight: '700',
     textAlign: 'center',
   },
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
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.2,
     shadowRadius: 4,
   },
   routeInfoTitle: {
     fontSize: 16,
     fontWeight: '700',
     color: '#333',
     marginBottom: 8,
   },
   routeInfoText: {
     fontSize: 13,
     color: '#666',
     marginBottom: 4,
   },
 });
