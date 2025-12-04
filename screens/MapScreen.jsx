import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Text, Animated, Dimensions, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Location from 'expo-location';

import { BACKEND_API } from '../config/api';


export default function MapScreen({ navigation }) {
  // ===== LOCATION & MAP STATE =====
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [query, setQuery] = useState('');

  // 🏪 Danh sách các quán ăn từ backend
  const [places, setPlaces] = useState([]);
  const [showOnlyRestaurants, setShowOnlyRestaurants] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const mapRef = useRef(null);


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

  // helper to decide visibility of a place based on dishType
  const shouldShowPlace = (place) => {
    // if all unchecked, show none
    if (!chkDry && !chkSoup && !chkVegetarian && !chkSalty && !chkSeafood) return false;
    // Handle places without dishType (shouldn't happen, but just in case)
    const type = place.dishType || 'dry'; // Default to 'dry' if missing
    if (type === 'dry') return chkDry;
    if (type === 'soup') return chkSoup;
    if (type === 'vegetarian') return chkVegetarian;
    if (type === 'salty') return chkSalty;
    if (type === 'seafood') return chkSeafood;
    return true; // Show unknown types by default
  };
  // Function to determine marker color based on dishType
  const getMarkerStyleByDishType = (dishType) => {
    if (dishType === 'dry') {
      return { 
        pinColor: '#FF9500', // Orange for dry dishes
      };
    } else if (dishType === 'soup') {
      return { 
        pinColor: '#00BCD4', // Cyan/Teal for soup dishes
      };
    } else if (dishType === 'vegetarian') {
      return {
        pinColor: '#4CAF50', // Green for vegetarian dishes
      };
    } else if (dishType === 'salty') {
      return {
        pinColor: '#F44336', // Red for salty dishes
      };
    } else if (dishType === 'seafood') {
      return {
        pinColor: '#2196F3', // Blue for seafood dishes
      };
    }
    return { pinColor: 'red' }; // Default fallback
  };
  // --- end menu/check logic ---

  // 📍 Lấy vị trí hiện tại + load markers từ backend

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


      // 🏪 Gọi backend API để lấy markers
      setLoadingPlaces(true);
      try {
        const url = `${BACKEND_API}/api/search`;
        console.log('🔗 Calling API:', url);
        console.log('📦 Request body:', { lat: coords.latitude, lon: coords.longitude, radius: 50 });
        
        const response = await axios.post(url, {
          lat: coords.latitude,
          lon: coords.longitude,
          radius: 50, // 50km để cover vùng rộng
        });
        
        console.log('✅ Response status:', response.status);
        console.log('📊 Places count:', response.data.places?.length);
        
        if (response.data.success && response.data.places) {
          setPlaces(response.data.places);
        }
      } catch (error) {
        console.error('❌ Error fetching places:', error);
        console.error('🔗 BACKEND_API:', BACKEND_API);
        console.error('📝 Error response:', error.response?.data);
        console.error('🔢 Error status:', error.response?.status);
        Alert.alert('Lỗi', 'Không thể tải danh sách nhà hàng');
      }
      setLoadingPlaces(false);
    })();
  }, []);

  // 🔍 Tìm kiếm nhà hàng theo tên

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      // Tìm trong danh sách places hiện có
      const found = places.find(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
      );

      if (!found) {
        Alert.alert('Không tìm thấy nhà hàng');
        return;
      }

      const dest = { 
        latitude: found.position.lat, 
        longitude: found.position.lon 
      };
      setDestination(dest);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: found.position.lat,
          longitude: found.position.lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1500);
      }
    } catch (err) {
      console.error('Search error:', err.message);
      Alert.alert('Lỗi khi tìm kiếm');
    }
  };


  // 🧭 Lấy chỉ đường bằng backend OSRM API

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

      const response = await axios.post(`${BACKEND_API}/api/food/direction`, {
        origin: {
          lat: userLocation.latitude,
          lon: userLocation.longitude
        },
        destination: {
          lat: destination.latitude,
          lon: destination.longitude
        },
        mode: 'driving'
      });

      if (!response.data.routes || response.data.routes.length === 0) {

        Alert.alert('Không tìm thấy đường đi.');
        return;
      }

      // Backend trả về coordinates dạng [lon, lat]
      const points = response.data.routes[0].geometry.coordinates.map(coord => ({
        latitude: coord[1],
        longitude: coord[0]
      }));

      setRouteCoords(points);
    } catch (err) {

      console.error('Route error:', err.response?.data || err.message);
      Alert.alert(
        'Không thể lấy chỉ đường',
        err.response?.data?.error || err.message
      );

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
          showsPointsOfInterest={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
        >
          <Marker coordinate={userLocation} title="Vị trí của bạn" />
          {destination && <Marker coordinate={destination} title="Điểm đến" pinColor="red" />}

          {/* Hiển thị markers từ backend */}
          {places && places.length > 0 && places.map(place => {
            // quyết định hiển thị theo checkbox
            if (!shouldShowPlace(place)) return null;

            // xác định màu marker dựa trên dishType
            const markerStyle = getMarkerStyleByDishType(place.dishType);

            return (
              <Marker
                key={place.id}
                coordinate={{ latitude: place.position.lat, longitude: place.position.lon }}
                title={place.name}
                description={place.address}
                pinColor={markerStyle.pinColor}
              >
                <Callout onPress={() => handleRestaurantPress(place)} tooltip={true}>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{place.name}</Text>
                    <Text style={styles.calloutAddress}>{place.address}</Text>
                    <Text style={styles.calloutTapHint}>Nhấn để xem chi tiết</Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
           
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
