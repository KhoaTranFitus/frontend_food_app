import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export default function NotificationScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Nút quay về giống AboutApp */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back-outline" size={26} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Tại đây bạn có thể quản lý thông báo của ứng dụng.</Text>

      {/* Nội dung tương lai (tùy bạn thêm switch, toggle, list thông báo, v.v.) */}
      <View style={styles.placeholderBox}>
        <Text style={{ color: "#777" }}>Notification settings coming soon...</Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },

  backBtn: {
    padding: 5,
    alignSelf: "flex-start",
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },

  placeholderBox: {
    marginTop: 10,
    padding: 20,
    backgroundColor: "#f3f3f3",
    borderRadius: 10,
  },
});
