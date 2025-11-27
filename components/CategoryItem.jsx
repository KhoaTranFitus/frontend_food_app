import React from "react";
import { Pressable, View, Image, Text, StyleSheet } from "react-native";

export default function CategoryItem({ cat, index, onPress, isSelected }) {
  const handlePress = () => {
    if (onPress) {
      onPress(cat.name);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.container}
      android_ripple={{ color: "#eee" }}
      accessibilityLabel={`Category ${cat.name}`}
    >
      <View style={[styles.iconWrap, isSelected && styles.iconWrapPressed]}>
        <Image source={cat.icon} style={styles.icon} />
      </View>
      <Text style={[styles.label, isSelected && styles.labelPressed]}>{cat.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    alignItems: "center",
    marginRight: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  iconWrapPressed: {
    backgroundColor: "#ff6347",
  },
  icon: {
    width: 60,
    height: 60,
    resizeMode: "cover",
    borderRadius: 15,
  },
  label: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
    color: "#333",
  },
  labelPressed: {
    color: "#ff6347",
    fontWeight: "700",
  },
});
