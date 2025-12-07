import React from "react";
import { Pressable, View, Image, Text, StyleSheet } from "react-native";

export default function CategoryItem({ cat, index, onPress, isSelected }) {
  const handlePress = () => {
    if (onPress) onPress(cat.name);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.container}
      android_ripple={{ color: "#e9e9e9" }}
    >
      <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
        <Image source={cat.icon} style={styles.icon} />
      </View>

      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {cat.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    alignItems: "center",
    marginRight: 10,
  },

  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",

    // shadow
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,

    marginBottom: 5,
  },

  iconWrapSelected: {
    backgroundColor: "#f7c065",
    elevation: 4,
    shadowOpacity: 0.22,
  },

  icon: {
    width: 56,   // gần sát viền
    height: 56,
    resizeMode: "cover",
    borderRadius: 14,  // bo theo khuôn
  },

  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#444",
    marginTop: 2,
    textAlign: "center",
  },

  labelSelected: {
    color: "#e08b1f",
    fontWeight: "700",
  },
});
