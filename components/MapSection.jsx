import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function MapSection({ userLoc, shownPlaces, mapRef, onMarkerPress }) {
  return (
    <View>
      <Text style={[styles.sectionTitle, { paddingHorizontal: 16 }]}>Bản đồ quán ăn gần bạn</Text>
      <View style={styles.mapWrap}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: userLoc?.latitude || 10.77653,
            longitude: userLoc?.longitude || 106.700981,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          ref={mapRef}
        >
          {userLoc && <Marker coordinate={userLoc} title="Vị trí của bạn" pinColor="blue" />}
          {shownPlaces.map((p) => {
            const lat = p.position?.lat;
            const lon = p.position?.lon;
            if (!lat || !lon) return null;
            return (
              <Marker
                key={p.id || `${lat}-${lon}`}
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
  sectionTitle: { fontSize: 18, fontWeight: "700" },
});