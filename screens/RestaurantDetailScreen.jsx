import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { getRoute } from '../services/tomtomApi.jsx';

export default function RestaurantDetailScreen({ route }) {
  const { item } = route.params || {};
  const [userLoc, setUserLoc] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy vị trí người dùng
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Không thể lấy vị trí người dùng');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setUserLoc({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  // Hàm chỉ đường
  const handleNavigate = async () => {
    if (!userLoc) {
      Alert.alert('Đang lấy vị trí...');
      return;
    }
    if (!item?.position?.lat || !item?.position?.lon) {
      Alert.alert('Không có tọa độ điểm đến');
      return;
    }

    setLoading(true);
    const dest = {
      latitude: item.position.lat,
      longitude: item.position.lon,
    };
    const coords = await getRoute(userLoc, dest);
    setRouteCoords(coords);
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView>
        <Image source={require('../assets/amthuc.jpg')} style={styles.headerImage} />

        <View style={{ padding: 16 }}>
          <Text style={styles.title}>{item?.name || 'Tên Nhà hàng'}</Text>
          <Text style={styles.sub}>
            {item?.rating ? `${item.rating} ⭐` : 'Chưa có đánh giá'} • Loại: {item?.category || 'Không rõ'}
          </Text>
          <Text style={{ marginTop: 8, color: '#555' }}>
            Địa chỉ: {item?.address || 'Không có thông tin'}
          </Text>

          <TouchableOpacity style={styles.cta} onPress={handleNavigate}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Chỉ đường đến đây</Text>
          </TouchableOpacity>

          {loading && (
            <ActivityIndicator size="large" color="#d32f2f" style={{ marginTop: 12 }} />
          )}

          <Text style={{ fontWeight: '800', marginTop: 16 }}>Bản đồ</Text>

          <View style={{ height: 300, marginTop: 8, borderRadius: 12, overflow: 'hidden' }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: item?.position?.lat || 10.77653,
                longitude: item?.position?.lon || 106.700981,
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

              {/* Marker nhà hàng */}
              {item?.position && (
                <Marker
                  coordinate={{
                    latitude: item.position.lat,
                    longitude: item.position.lon,
                  }}
                  title={item?.name}
                  description={item?.address}
                  pinColor="red"
                />
              )}

              {/* Đường đi */}
              {routeCoords.length > 0 && (
                <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#d32f2f" />
              )}
            </MapView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerImage: { width: '100%', height: 220 },
  title: { fontSize: 22, fontWeight: '800', color: '#d3412a' },
  sub: { color: '#666', marginTop: 6 },
  cta: {
    marginTop: 16,
    backgroundColor: '#d32f2f',
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
});
