// components/HomeHeader.jsx

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Easing
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function HomeHeader({
  initialQuery = "",
  onSubmitSearch,
  onQueryChange,
  onOpenProfile,
  onOpenFilter,
  selectedProvinceName = "Gần tôi",
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState(initialQuery);

  const welcomeOpacity = useRef(new Animated.Value(1)).current;
  const welcomeTranslateY = useRef(new Animated.Value(0)).current;
  const searchScale = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    // Animation Welcome lúc mở app
    Animated.parallel([
      Animated.timing(welcomeOpacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true }),
      Animated.timing(welcomeTranslateY, { toValue: 0, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleSearch = (open) => {
    const to = typeof open === "boolean" ? open : !isExpanded;
    setIsExpanded(to);

    // Animation mở/đóng thanh tìm kiếm
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
      {/* 1. TEXT WELCOME (Ẩn khi mở tìm kiếm) */}
      <Animated.View style={{ flex: 1, opacity: welcomeOpacity, transform: [{ translateY: welcomeTranslateY }] }}>
        <Text style={styles.welcomeText}>Welcome !</Text>
        <Text style={styles.subText}>Hôm nay bạn muốn ăn gì?</Text>
      </Animated.View>

      <View style={styles.rightButtons}>
        {/* Nút Kính Lúp (Hiện khi đóng) */}
        <Pressable onPress={() => toggleSearch(true)} style={styles.circleButton}>
          <Ionicons name="search" size={22} color="#666" />
        </Pressable>

        {/* 2. THANH TÌM KIẾM MỞ RỘNG */}
        <Animated.View
          pointerEvents={isExpanded ? "auto" : "none"}
          style={[
            styles.expandedOverlay,
            {
              transform: [
                // Dịch chuyển nhẹ để hiệu ứng bung ra từ nút kính lúp tự nhiên hơn
                { translateX: searchScale.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                { scaleX: searchScale },
                { scaleY: searchScale } // Scale cả Y để hiệu ứng đẹp hơn
              ],
              opacity: searchScale,
            },
          ]}
        >
          <View style={styles.expandedInner}>
            {/* Nút Đóng (X) */}
            <Pressable onPress={() => toggleSearch(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#888" />
            </Pressable>

            {/* Cụm nhập liệu: [ Món ăn | Tỉnh ] */}
            <View style={styles.inputGroup}>
              {/* Input Tên món */}
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Tìm món..."
                placeholderTextColor="#999"
                value={query}
                onChangeText={(t) => { setQuery(t); onQueryChange && onQueryChange(t); }}
                returnKeyType="search"
                onSubmitEditing={handleSubmit}
              />

              {/* Đường kẻ dọc phân cách */}
              <View style={styles.verticalDivider} />

              {/* Nút Chọn Tỉnh */}
              <Pressable onPress={() => onOpenFilter && onOpenFilter()} style={styles.provinceBtn}>
                <Text style={styles.provinceText} numberOfLines={1}>
                  {selectedProvinceName}
                </Text>
                <Ionicons name="chevron-down" size={12} color="#666" style={{ marginLeft: 2 }} />
              </Pressable>
            </View>

            {/* Nút Thực hiện Tìm kiếm (Search Action) */}
            <Pressable onPress={handleSubmit} style={styles.searchActionBtn}>
              <Ionicons name="search" size={18} color="#fff" />
            </Pressable>

          </View>
        </Animated.View>

        {/* Nút Profile */}
        <Pressable onPress={onOpenProfile} style={[styles.circleButton, { marginLeft: 10 }]}>
          <Ionicons name="person" size={22} color="#666" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 36,
    flexDirection: "row",
    alignItems: "center",
    // Đảm bảo header có chiều cao cố định để không bị nhảy layout
    height: 100,
    zIndex: 10
  },
  welcomeText: { fontSize: 28, fontWeight: "700", color: "#07212A" }, // Giảm size chút cho cân đối
  subText: { color: "#08404A", marginTop: 4, fontSize: 14 },
  rightButtons: { flexDirection: "row", alignItems: "center" },

  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },

  // --- STYLE CHO PHẦN MỞ RỘNG ---
  expandedOverlay: {
    position: "absolute",
    right: 0, // Căn phải đè lên các nút cũ
    height: 54, // Chiều cao thanh tìm kiếm
    width: width - 32, // Full chiều rộng trừ padding màn hình
    borderRadius: 27,
    backgroundColor: "#fff",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 999, // Đảm bảo luôn nổi lên trên
  },
  expandedInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    flex: 1,
    justifyContent: 'space-between'
  },
  closeBtn: {
    padding: 8,
  },

  // Cụm chứa Input và Province (Màu xám nhạt)
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 10,
    marginHorizontal: 4,
  },
  searchInput: {
    flex: 1, // Chiếm phần lớn diện tích
    fontSize: 14,
    color: '#333',
    height: '100%',
  },
  verticalDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#ccc',
    marginHorizontal: 8,
  },
  provinceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 90, // Giới hạn chiều rộng tên tỉnh
    height: '100%',
    justifyContent: 'center',
  },
  provinceText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
    marginRight: 2,
  },

  // Nút search cuối cùng (Màu cam)
  searchActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff6347',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
    elevation: 2,
  },
});