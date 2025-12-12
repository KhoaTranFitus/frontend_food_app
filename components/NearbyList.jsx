import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

export default function NearbyList({ shownPlaces = [], onItemPress, hasMore = false, onViewMore }) {
  if (!shownPlaces || shownPlaces.length === 0) {
    return <Text style={{ textAlign: "center", color: "gray", marginVertical: 10 }}>Không tìm thấy quán ăn gần bạn.</Text>;
  }

  return (
    <View>
      {shownPlaces.map((item, index) => (
        <Animated.View key={item.id || index} entering={FadeInUp.delay(index * 120).duration(600)}>
          <TouchableOpacity style={styles.card} onPress={() => onItemPress && onItemPress(item)}>
            <Image source={{ uri: item.image || item.image_url || item.photo || item.photos?.[0] }} style={styles.img} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.details}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
      {hasMore && onViewMore && (
        <TouchableOpacity style={styles.viewMoreButton} onPress={onViewMore}>
          <Text style={styles.viewMoreText}>Xem thêm</Text>
          <Ionicons name="chevron-forward" size={16} color="#ff6347" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    marginHorizontal: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  img: { width: 100, height: 100 },
  info: { flex: 1, padding: 10, justifyContent: "center" },
  name: { fontWeight: "700", fontSize: 16 },
  details: { color: "#666", marginTop: 4 },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ff6347',
    backgroundColor: '#fff',
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6347',
    marginRight: 4,
  },
});