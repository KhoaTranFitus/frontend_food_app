import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, Circle, Callout } from "react-native-maps";

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
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={false}
          showsScale={false}
          showsBuildings={false}
          showsTraffic={false}
          showsPointsOfInterest={false}
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
              ⭐️ THÊM CALLOUT VỚI THÔNG TIN CHI TIẾT
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
              >
                {/* ⭐️ CALLOUT: Hiển thị thông tin chi tiết khi nhấn marker */}
                <Callout tooltip={true} onPress={() => onMarkerPress && onMarkerPress(p)}>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutName} numberOfLines={2}>{p.name}</Text>

                    <Text style={styles.calloutAddress} numberOfLines={2}>
                      📍 {p.address}
                    </Text>

                    <View style={styles.calloutRow}>
                      {p.rating && (
                        <Text style={styles.calloutRating}>
                          ⭐ {p.rating.toFixed(1)}
                        </Text>
                      )}
                      {p.distance && (
                        <Text style={styles.calloutDistance}>
                          📏 {p.distance.toFixed(1)} km
                        </Text>
                      )}
                    </View>

                    <Text style={styles.calloutHint}>Nhấn để xem chi tiết</Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {/* Hiển thị số quán trên map */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {shownPlaces?.length || 0} quán ăn gần {selectedProvinceName || "bạn"}
          </Text>
        </View>
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
    color: "#ffffffff",
    fontWeight: "700",
    marginBottom: 5,
  },

  infoBox: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  infoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // ⭐️ STYLES CHO CALLOUT (Thông tin marker) ⭐️
  calloutContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    minWidth: 220,
    maxWidth: 280,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  calloutName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  calloutAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    lineHeight: 16,
  },
  calloutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calloutRating: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF9500",
  },
  calloutDistance: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2ecc71",
  },
  calloutHint: {
    fontSize: 11,
    color: "#2196F3",
    fontStyle: "italic",
    fontWeight: "500",
    textAlign: "center",
  },
});
