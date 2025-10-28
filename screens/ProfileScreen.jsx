import React, { useContext} from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

export default function ProfileScreen() {

  const { logout } = useContext(AuthContext); // dùng logout từ context

  const handleLogout = async () => {
    try {
      await logout(); // gọi hàm logout() trong context
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}> 
      {/* 🧑 Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity>
          <Feather name="edit-3" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 🖼️ Avatar */}
        <View style={styles.avatarSection}>
          <Image
            source={{
              uri: "https://i.pinimg.com/564x/0c/7c/42/0c7c42856e59f7db5e9d08b5f83b09eb.jpg",
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>Lio Doan</Text>
          <Text style={styles.email}>lio.Doan@sport.com</Text>
        </View>

        {/* 📦 Options */}
        <View style={styles.optionBox}>
          <TouchableOpacity style={styles.optionRow}>
            <Ionicons name="person-outline" size={22} color="#000" />
            <Text style={styles.optionText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow}>
            <Feather name="bookmark" size={22} color="#000" />
            <Text style={styles.optionText}>Saved Dishes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow}>
            <Ionicons name="settings-outline" size={22} color="#000" />
            <Text style={styles.optionText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow}>
            <Ionicons name="help-circle-outline" size={22} color="#000" />
            <Text style={styles.optionText}>Help & Support</Text>
          </TouchableOpacity>

          {/* ✅ Nút Log Out */}
          <TouchableOpacity style={styles.optionRow} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="red" />
            <Text style={[styles.optionText, { color: "red" }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3A721",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontWeight: "bold",
    fontSize: 22,
    color: "#000",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 25,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#fff",
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  email: {
    color: "#333",
    fontSize: 14,
  },
  optionBox: {
    backgroundColor: "#F9D56E",
    borderRadius: 20,
    padding: 15,
    marginBottom: 30,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomColor: "#fff",
    borderBottomWidth: 1,
  },
  optionText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
});
