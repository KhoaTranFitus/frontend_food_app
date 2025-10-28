import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Location from 'expo-location';

const TOMTOM_API_KEY = 'yyxXlbgc7wMsUKBZY88fGXiCqM0IHspm';

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [query, setQuery] = useState('');
  const mapRef = useRef(null);

  // 📍 Lấy vị trí hiện tại của người dùng
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
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
          )}
        </MapView>
      ) : (
        <View style={styles.loading}>
          <Button title="Đang tải vị trí..." disabled />
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
  input: {
    flex: 1,
    marginRight: 5,
    padding: 5,
  },
});
