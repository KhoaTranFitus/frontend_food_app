import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

export default function NearbyList({ shownPlaces = [], onItemPress }) {
  if (!shownPlaces || shownPlaces.length === 0) {
    return <Text style={{ textAlign: "center", color: "gray", marginVertical: 10 }}>Không tìm thấy quán ăn gần bạn.</Text>;
  }

  return (
    <View>
      {shownPlaces.map((item, index) => (
        <Animated.View key={item.id || index} entering={FadeInUp.delay(index * 120).duration(600)}>
          <TouchableOpacity style={styles.card} onPress={() => onItemPress && onItemPress(item)}>
            <Image source={require("../assets/amthuc.jpg")} style={styles.img} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.details}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
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
  },
  img: { width: 100, height: 100 },
  info: { flex: 1, padding: 10, justifyContent: "center" },
  name: { fontWeight: "700", fontSize: 16 },
  details: { color: "#666", marginTop: 4 },
});