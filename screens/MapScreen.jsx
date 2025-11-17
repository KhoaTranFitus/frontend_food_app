import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Text, Animated, Dimensions, Pressable } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Location from 'expo-location';
import { searchNearbyPlaces } from '../services/tomtomApi';

const TOMTOM_API_KEY = 'yyxXlbgc7wMsUKBZY88fGXiCqM0IHspm';

// Dữ liệu mẫu để test khi không có kết quả thực tế
const SAMPLE_PLACES = [
  { id: 's1', name: 'Quán Ăn Mẫu 1 chưa checkin', address: 'Đường A', position: { lat: 10.7760, lon: 106.7000 }, isCheckedIn: false },
  { id: 's2', name: 'Quán Ăn Mẫu 2 (checked)', address: 'Đường B', position: { lat: 10.7770, lon: 106.7010 }, isCheckedIn: true },
  { id: 's3', name: 'Quán Ăn Mẫu 3 chưa checkin', address: 'Đường C', position: { lat: 10.7750, lon: 106.6990 }, isCheckedIn: false },
];

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [query, setQuery] = useState('');
  // 🏪 Danh sách các quán ăn lấy từ TomTom Nearby API
  const [places, setPlaces] = useState([]);
  const [showOnlyRestaurants, setShowOnlyRestaurants] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  // filterMode: 'all' | 'checkedin' | 'notcheckedin'
  const [filterMode, setFilterMode] = useState('all');
  const mapRef = useRef(null);

  // --- MENU SLIDE-IN + CHECKBOX STATES ---
  const screenWidth = Dimensions.get('window').width;
  // <-- mở rộng rộng popup lên ~1/3 màn hình (tránh wrap text)
  const panelWidth = Math.round(screenWidth / 3);
  const animX = useRef(new Animated.Value(-panelWidth)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  // checkbox states: default all selected
  const [chkAll, setChkAll] = useState(true);
  const [chkCheckedIn, setChkCheckedIn] = useState(true);
  const [chkNotCheckedIn, setChkNotCheckedIn] = useState(true);
  // tính vị trí panel để nằm dưới thanh tìm kiếm (searchContainer top + approx height)
  const searchTop = 40;
  const searchHeight = 56; // nếu searchContainer thay đổi height, điều chỉnh ở đây
  const panelTop = searchTop + searchHeight;

  // <-- ADDED: vị trí căn trái và top cho hamburger để align với search bar và nằm dưới nó
  const searchLeft = Math.round(screenWidth * 0.05); // searchContainer width = 90%, nên left = 5%
  const hamburgerTop = searchTop + searchHeight + 6; // đặt hamburger nằm dưới search bar (cách 6px)

  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(animX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };
  const closeMenu = () => {
    Animated.timing(animX, { toValue: -panelWidth, duration: 200, useNativeDriver: true }).start(() => {
      setMenuVisible(false);
    });
  };

  // checkbox logic
  const toggleAll = () => {
    const newVal = !chkAll;
    setChkAll(newVal);
    setChkCheckedIn(newVal);
    setChkNotCheckedIn(newVal);
  };
  const toggleCheckedIn = () => {
    const next = !chkCheckedIn;
    setChkCheckedIn(next);
    // update 'all' depending on both children
    setChkAll(next && chkNotCheckedIn);
  };
  const toggleNotCheckedIn = () => {
    const next = !chkNotCheckedIn;
    setChkNotCheckedIn(next);
    setChkAll(chkCheckedIn && next);
  };
  // helper to decide visibility of a place
  const shouldShowPlace = (place) => {
    // if neither selected, show none
    if (!chkCheckedIn && !chkNotCheckedIn) return false;
    if (place.isCheckedIn) return chkCheckedIn;
    return chkNotCheckedIn;
  };
  // --- end menu/check logic ---

  // tạo mảng hiển thị chung (API + SAMPLE), đánh dấu sample và đảm bảo id không trùng
  const combinedPlaces = React.useMemo(() => {
    const samples = SAMPLE_PLACES.map(s => ({
      ...s,
      id: 'sample-' + s.id, // đảm bảo không trùng với id API
      _isSample: true,
    }));
    // giữ nguyên thứ tự: hiện API trước, sample bổ sung
    return [...places, ...samples];
  }, [places]);

  // 📍 Lấy vị trí hiện tại của người dùng + lấy danh sách quán ăn gần đó từ TomTom
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập vị trí bị từ chối');
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

      // 🏪 Gọi TomTom Nearby API để lấy danh sách quán ăn xung quanh vị trí người dùng
      setLoadingPlaces(true);
      const nearbyPlaces = await searchNearbyPlaces({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      // Nếu TomTom không trả về kết quả (ví dụ dev trên máy local), dùng dữ liệu mẫu để test
      if (!nearbyPlaces || nearbyPlaces.length === 0) {
        setPlaces(SAMPLE_PLACES);
      } else {
        setPlaces(nearbyPlaces);
      }
      setLoadingPlaces(false);
    })();
  }, []);

  // 🔍 Tìm kiếm địa điểm bằng TomTom Search API
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

  // 🧭 Lấy chỉ đường bằng TomTom Routing API
  const handleRoute = async () => {
    if (!userLocation || !destination) {
      Alert.alert('Vui lòng bật định vị và chọn điểm đến trước');
      return;
    }

    // Kiểm tra trùng tọa độ
    if (Math.abs(userLocation.latitude - destination.latitude) < 0.0001 &&
        Math.abs(userLocation.longitude - destination.longitude) < 0.0001) {
      Alert.alert('Vị trí hiện tại và điểm đến quá gần — không thể tạo tuyến đường.');
      return;
    }

    try {
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${userLocation.longitude},${userLocation.latitude}:${destination.longitude},${destination.latitude}/json?key=${TOMTOM_API_KEY}`;

      console.log('TomTom route URL:', url);

      const res = await axios.get(url);

      if (!res.data.routes || res.data.routes.length === 0) {
        console.error('Không có route:', res.data);
        Alert.alert('Không tìm thấy đường đi.');
        return;
      }

      const points = res.data.routes[0].legs[0].points.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
      }));

      setRouteCoords(points);
    } catch (err) {
      console.error('TomTom route error:', err.response?.data || err.message);
      Alert.alert(
        'Không thể lấy chỉ đường',
        err.response?.data?.error?.description || err.message
      );
    }
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

          {/* Hiển thị chung: API + SAMPLE_PLACES, TUÂN THEO 3 CHECKBOX */}
          {combinedPlaces && combinedPlaces.length > 0 && combinedPlaces.map(place => {
            // quyết định hiển thị theo checkbox
            if (!shouldShowPlace(place)) return null;
            const checked = !!place.isCheckedIn;

            // màu marker:
            let pin = 'red';
            if (checked) pin = 'green'; // đã check-in
            else if (place._isSample) pin = 'red'; // sample chưa checkin(red)
            else pin = 'red'; // API chưa checkin

            return (
              <Marker
                key={place.id}
                coordinate={{ latitude: place.position.lat, longitude: place.position.lon }}
                title={place.name}
                description={place.address}
                pinColor={pin}
              />
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
          <Animated.View style={[styles.panel, { width: panelWidth, top: panelTop, transform: [{ translateX: animX }] }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.panelTitle}>Bộ lọc</Text>
              <TouchableOpacity onPress={closeMenu} style={styles.closeBtn}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
             <TouchableOpacity style={styles.row} onPress={toggleAll}>
               <View style={[styles.checkbox, chkAll && styles.checkboxChecked]}>
                 {chkAll && <Text style={styles.checkMark}>✓</Text>}
               </View>
               <Text style={styles.rowText}>Tất cả</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.row} onPress={toggleCheckedIn}>
               <View style={[styles.checkbox, chkCheckedIn && styles.checkboxChecked]}>
                 {chkCheckedIn && <Text style={styles.checkMark}>✓</Text>}
               </View>
               <Text style={styles.rowText}>Đã check-in</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.row} onPress={toggleNotCheckedIn}>
               <View style={[styles.checkbox, chkNotCheckedIn && styles.checkboxChecked]}>
                 {chkNotCheckedIn && <Text style={styles.checkMark}>✓</Text>}
               </View>
               <Text style={styles.rowText}>Chưa check-in</Text>
             </TouchableOpacity>
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
    // top được set động (panelTop) khi render để hạ xuống dưới thanh tìm kiếm
     backgroundColor: '#fff',
     paddingVertical: 12,
     paddingHorizontal: 14,
     elevation: 8,
     zIndex: 30,
     borderTopRightRadius: 12,
     borderBottomRightRadius: 12,
     // bo góc tổng quát để tránh cạnh sắc (nếu muốn bo cả trái, thay bằng borderRadius)
     overflow: 'hidden',
   },
   panelTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
   row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
   rowText: { marginLeft: 10, fontSize: 15, flexShrink: 1 },
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
 });
