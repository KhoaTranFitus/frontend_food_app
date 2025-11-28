import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export default function HelpSupportScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Nút quay về giống AboutApp */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back-outline" size={26} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.subtitle}>Nếu bạn cần hỗ trợ, vui lòng liên hệ nhóm phát triển Food App.</Text>

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
  },
});
