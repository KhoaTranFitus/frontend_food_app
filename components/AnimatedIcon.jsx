import React, { useRef, useEffect } from "react";
import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AnimatedIcon({ name, focused, size, color }) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? 1.3 : 1, 
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleValue }],
        top: focused ? -10 : 0,
      }}
    >
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}
