import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { authAPI } from "../services/flaskApi";

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { email } = route.params ?? {};
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ mật khẩu");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu không khớp!");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      // Dùng resetPassword khi quên mật khẩu (có email)
      const result = await authAPI.resetPassword(email, newPassword);
      Alert.alert("Thành công", "Đổi mật khẩu thành công!", [
        { text: "Đăng nhập", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      Alert.alert("Lỗi", error.error || "Không thể đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Đặt lại mật khẩu</Text>

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu mới"
        placeholderTextColor="#999"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Xác nhận mật khẩu"
        placeholderTextColor="#999"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.6 }]}
        onPress={handleChange}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>LƯU MẬT KHẨU</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 25 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  email: { textAlign: "center", marginBottom: 20, color: "#555" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  btn: {
    backgroundColor: "#F9A825",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});