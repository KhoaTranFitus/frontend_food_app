import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Animated, Dimensions, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function HomeHeader({
  initialQuery = "",
  onSubmitSearch,
  onQueryChange,
  onOpenProfile,
  onOpenFilter, // expect parent to control dropdown visibility
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState(initialQuery);

  const welcomeOpacity = useRef(new Animated.Value(1)).current;
  const welcomeTranslateY = useRef(new Animated.Value(0)).current;
  const searchScale = useRef(new Animated.Value(0)).current; // 0 collapsed, 1 expanded
  const inputRef = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(welcomeOpacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true }),
      Animated.timing(welcomeTranslateY, { toValue: 0, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleSearch = (open) => {
    const to = typeof open === "boolean" ? open : !isExpanded;
    setIsExpanded(to);
    Animated.parallel([
      Animated.timing(welcomeOpacity, { toValue: to ? 0 : 1, duration: 240, useNativeDriver: true }),
      Animated.timing(welcomeTranslateY, { toValue: to ? -18 : 0, duration: 240, useNativeDriver: true }),
      Animated.spring(searchScale, { toValue: to ? 1 : 0, friction: 9, tension: 80, useNativeDriver: true }),
    ]).start(() => {
      if (to) inputRef.current?.focus?.();
    });
  };

  const handleSubmit = () => {
    onSubmitSearch && onSubmitSearch(query);
  };

  return (
    <View style={styles.header}>
      <Animated.View style={{ flex: 1, opacity: welcomeOpacity, transform: [{ translateY: welcomeTranslateY }] }}>
        <Text style={styles.welcomeText}>Welcome !</Text>
        <Text style={styles.subText}>QuocKang say Hi</Text>
      </Animated.View>

      <View style={styles.rightButtons}>
        <Pressable onPress={() => toggleSearch(true)} style={styles.circleButton} accessibilityLabel="Open search">
          <Ionicons name="search" size={22} color="#666" />
        </Pressable>

        <Animated.View
          pointerEvents={isExpanded ? "auto" : "none"}
          style={[
            styles.expandedOverlay,
            {
              transform: [
                { translateX: searchScale.interpolate ? searchScale.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) : 0 },
                { scaleX: searchScale },
              ],
              opacity: searchScale,
            },
          ]}
        >
          <View style={styles.expandedInner}>
            <Ionicons name="search" size={18} color="#666" />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Tìm kiếm món ăn, quán ăn..."
              placeholderTextColor="#888"
              value={query}
              onChangeText={(t) => { setQuery(t); onQueryChange && onQueryChange(t); }}
              returnKeyType="search"
              onSubmitEditing={handleSubmit}
            />
            <Pressable onPress={() => onOpenFilter && onOpenFilter()} style={{ paddingHorizontal: 8 }}>
              <Ionicons name="options" size={20} color="#666" />
            </Pressable>
            <Pressable onPress={() => toggleSearch(false)} style={{ paddingLeft: 6 }}>
              <Ionicons name="close" size={20} color="#666" />
            </Pressable>
          </View>
        </Animated.View>

        <Pressable onPress={onOpenProfile} style={[styles.circleButton, { marginLeft: 8 }]} accessibilityLabel="Open profile">
          <Ionicons name="person" size={22} color="#666" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 36, flexDirection: "row", alignItems: "center" },
  welcomeText: { fontSize: 32, fontWeight: "700", color: "#07212A" },
  subText: { color: "#08404A", marginTop: 6 },
  rightButtons: { flexDirection: "row", alignItems: "center" },
  circleButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 5, marginLeft: 6 },
  expandedOverlay: { position: "absolute", right: 70, height: 50, width: width * 0.82, borderRadius: 25, backgroundColor: "#fff", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 6, transform: [{ scaleX: 0 }] },
  expandedInner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 16, color: "#333", paddingVertical: 4, marginLeft: 8 },
});