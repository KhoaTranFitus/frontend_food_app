import React from "react";
import { Pressable, View, Image, Text, StyleSheet } from "react-native";

export default function CategoryItem({ cat, index, onPress }) {
  return (
    <Pressable
      onPress={() => onPress && onPress(cat.name)}
      style={styles.container}
      android_ripple={{ color: "#eee" }}
      accessibilityLabel={`Category ${cat.name}`}
    >
      <View style={styles.iconWrap}>
        <Image source={cat.icon} style={styles.icon} />
      </View>
      <Text style={styles.label}>{cat.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    alignItems: "center",
    marginRight: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    marginBottom: 6,
  },
  icon: {
    width: 48,
    height: 48,
    resizeMode: "cover",
    borderRadius: 24,
  },
  label: {
    fontSize: 13,
    textAlign: "center",
  },
});
