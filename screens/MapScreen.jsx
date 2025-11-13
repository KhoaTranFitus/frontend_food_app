import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Location from 'expo-location';
import { searchNearbyPlaces } from '../services/tomtomApi';

const TOMTOM_API_KEY = 'yyxXlbgc7wMsUKBZY88fGXiCqM0IHspm';

// Dữ liệu mẫu để test khi không có kết quả thực tế
const SAMPLE_PLACES = [
  { id: 's1', name: 'Quán Ăn Mẫu 1', address: 'Đường A', position: { lat: 10.7760, lon: 106.7000 }, isCheckedIn: false },
  { id: 's2', name: 'Quán Ăn Mẫu 2 (checked)', address: 'Đường B', position: { lat: 10.7770, lon: 106.7010 }, isCheckedIn: true },
  { id: 's3', name: 'Quán Ăn Mẫu 3', address: 'Đường C', position: { lat: 10.7750, lon: 106.6990 }, isCheckedIn: false },
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
          
          {/* 🏪 Hiển thị các quán ăn từ TomTom Nearby API
              - Mỗi marker là một quán ăn lấy từ API
              - Marker màu đỏ cho quán ăn
              - Nếu `showOnlyRestaurants` = true, chỉ hiện quán ăn
          */}
          {places && places.length > 0 && places.map(place => {
            const checked = !!place.isCheckedIn;

            // filter theo chế độ
            if (filterMode === 'checkedin' && !checked) return null;
            if (filterMode === 'notcheckedin' && checked) return null;

            // chọn màu marker theo chế độ
            let pin = 'red';
            if (filterMode === 'checkedin') pin = 'yellow';
            else if (filterMode === 'notcheckedin') pin = '#98FB98'; // pale green

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
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.modeButtonInline, filterMode === 'all' ? { backgroundColor: '#ff4d4d' } : filterMode === 'checkedin' ? { backgroundColor: '#ffd54f' } : { backgroundColor: '#c8f7c5' }]}
          onPress={() => setFilterMode(prev => (prev === 'all' ? 'checkedin' : prev === 'checkedin' ? 'notcheckedin' : 'all'))}
        >
          <Text style={styles.modeButtonText}>{filterMode === 'all' ? 'Tất cả' : filterMode === 'checkedin' ? 'Đã check-in' : 'Chưa check-in'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
