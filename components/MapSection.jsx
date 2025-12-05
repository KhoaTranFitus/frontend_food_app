import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";

export default function MapSection({
  centerLocation,
  shownPlaces = [],
  mapRef,
  searchMode = "nearby",        // "nearby" hoặc "full"
  selectedProvinceId,
  selectedProvinceName,
  onMarkerPress
}) {

  // =====================================
  // 1. Tự động animate map khi vị trí thay đổi
  // =====================================
  useEffect(() => {
    if (mapRef?.current && centerLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: centerLocation.latitude,
          longitude: centerLocation.longitude,
          latitudeDelta: searchMode === "full" ? 0.2 : 0.04,
          longitudeDelta: searchMode === "full" ? 0.2 : 0.04,
        },
        900
      );
    }
  }, [centerLocation, searchMode]);

  // =====================================
  // 2. Xác định tiêu đề marker trung tâm
  // =====================================
  const isNearMe = !selectedProvinceId || selectedProvinceId === "near_me";
  const centerTitle = isNearMe
    ? "Vị trí của bạn"
    : `Trung tâm ${selectedProvinceName ?? ""}`;

  return (
    <View>
      <Text style={[styles.sectionTitle, { paddingHorizontal: 16 }]}>
        Bản đồ khu vực tìm kiếm
      </Text>

      <View style={styles.mapWrap}>
        <MapView
          style={{ flex: 1 }}
          ref={mapRef}
          initialRegion={{
            latitude: centerLocation?.latitude || 10.7765,
            longitude: centerLocation?.longitude || 106.70098,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >

          {/* =====================================
              3. Marker trung tâm tìm kiếm
          ===================================== */}
          {centerLocation && (
            <>
              <Marker
                coordinate={centerLocation}
                title={centerTitle}
                description={
                  isNearMe
                    ? "Đang tìm quán ăn quanh vị trí của bạn"
                    : "Vị trí trung tâm tỉnh/thành phố"
                }
                pinColor="blue"
                zIndex={999}
              />

              {/* =====================================
                  4. Vẽ bán kính nếu đang ở chế độ near_me
                 ===================================== */}
              {searchMode === "nearby" && (
                <Circle
                  center={centerLocation}
                  radius={2000} // 2km
                  strokeColor="rgba(0, 112, 255, 0.3)"
                  fillColor="rgba(0, 112, 255, 0.05)"
                />
              )}
            </>
          )}

          {/* =====================================
              5. Render các quán ăn (markers kết quả)
          ===================================== */}
          {shownPlaces.map((p) => {
            const lat = p.position?.lat;
            const lon = p.position?.lon;
            if (!lat || !lon) return null;

            return (
              <Marker
                key={p.id}
                coordinate={{ latitude: lat, longitude: lon }}
                title={p.name}
                description={p.address}
                pinColor="red"
                onPress={() => onMarkerPress && onMarkerPress(p)}
              />
            );
          })}
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    height: 300,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 5,
  },
});
