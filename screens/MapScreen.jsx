import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Text, Animated, Dimensions, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Location from 'expo-location';

const TOMTOM_API_KEY = 'yyxXlbgc7wMsUKBZY88fGXiCqM0IHspm';
const BACKEND_BASE_URL = 'http://192.168.1.2:5000/api';

export default function MapScreen({ navigation }) {
  // ===== LOCATION & MAP STATE =====
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [query, setQuery] = useState('');

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
      Alert.alert('Lỗi kết nối', `Không thể kết nối đến server: ${error.message}\n\nKiểm tra:\n- Backend đang chạy tại http://192.168.1.2:5000\n- Firewall cho phép kết nối`);
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

  // ===== TOMTOM API FUNCTIONS =====
  // 🔍 Search for locations using TomTom Search API
  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const res = await axios.get(
        `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(query)}.json?key=${TOMTOM_API_KEY}`
      );

      const result = res.data.results[0];
      if (!result) {
        Alert.alert('Không tìm thấy địa điểm');
        return;
      }

      const { lat, lon } = result.position;
      const dest = { latitude: lat, longitude: lon };
      setDestination(dest);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1500);
      }
    } catch (err) {
      console.error('TomTom search error:', err.response?.data || err.message);
      Alert.alert('Lỗi khi tìm kiếm địa điểm');
    }
  };

  // 🧭 Get directions using TomTom Routing API
  const handleRoute = async () => {
    if (!userLocation || !destination) {
      Alert.alert('Vui lòng bật định vị và chọn điểm đến trước');
      return;
    }

    // Check if coordinates are too close
    if (Math.abs(userLocation.latitude - destination.latitude) < 0.0001 &&
        Math.abs(userLocation.longitude - destination.longitude) < 0.0001) {
      Alert.alert('Vị trí hiện tại và điểm đến quá gần — không thể tạo tuyến đường.');
      return;
    }

    try {
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${userLocation.longitude},${userLocation.latitude}:${destination.longitude},${destination.latitude}/json?key=${TOMTOM_API_KEY}`;

      const res = await axios.get(url);

      if (!res.data.routes || res.data.routes.length === 0) {
        Alert.alert('Không tìm thấy đường đi.');
        return;
      }

      const points = res.data.routes[0].legs[0].points.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
      }));

      setRouteCoords(points);
    } catch (err) {
      console.error('TomTom route error:', err.message);
      Alert.alert('Không thể lấy chỉ đường', err.message);
    }
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
          <Marker coordinate={userLocation} title="Vị trí của bạn" />
          {destination && <Marker coordinate={destination} title="Điểm đến" pinColor="red" />}

          {/* Display filtered restaurants from backend */}
          {restaurants && restaurants.length > 0 && restaurants.map(restaurant => (
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
          ))}

          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
          )}
        </MapView>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#ff6347" />
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tên quán ăn..."
          value={query}
          onChangeText={setQuery}
        />
        <Button title="Tìm" onPress={handleSearch} />
        <Button title="Chỉ đường" onPress={handleRoute} />
      </View>

      {loadingRestaurants && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Đang tải nhà hàng...</Text>
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
   searchContainer: {
     position: 'absolute',
     top: 40,
     width: '90%',
     alignSelf: 'center',
     flexDirection: 'row',
     backgroundColor: 'white',
     borderRadius: 10,
     padding: 5,
     elevation: 5,
     justifyContent: 'space-between',
   },
   // Container cho nút filter, nằm ngay dưới searchContainer và cùng căn lề
   filterContainer: {
     position: 'absolute',
     top: 40 + 60, // dưới searchContainer (searchContainer khoảng 48px cao)
     width: '90%',
     alignSelf: 'center',
     flexDirection: 'row',
     justifyContent: 'flex-start',
     paddingHorizontal: 5,
     zIndex: 10,
   },
   input: {
     flex: 1,
     marginRight: 5,
     padding: 5,
   },
   modeButton: {
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 8,
     elevation: 6,
   },
   modeButtonText: {
     color: '#000',
     fontWeight: '700',
   },
   modeButtonInline: {
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 8,
     elevation: 6,
   },
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
 });
