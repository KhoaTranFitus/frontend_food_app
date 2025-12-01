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

export default function VerifyScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { email, mode } = route.params ?? {}; // "register" | "reset_password"

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      Alert.alert("Lỗi", "Vui lòng nhập mã OTP 6 chữ số");
      return;
    }

    setLoading(true);
    try {
      // Gọi API verify email
      const result = await authAPI.verifyEmail(email, code);

      if (mode === "register") {
        // Sau khi verify đăng ký thành công -> Login
        Alert.alert("Thành công", "Email xác thực thành công!", [
          { text: "Đăng nhập", onPress: () => navigation.navigate("Login") },
        ]);
      } else if (mode === "reset_password") {
        // Sau khi verify reset password -> ChangePassword
        navigation.navigate("ChangePassword", { email });
      }
    } catch (error) {
      Alert.alert("Lỗi", error.error || "OTP không đúng hoặc hết hạn");
      console.error("Verify error:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Xác thực OTP</Text>
      <Text style={styles.subtitle}>Mã OTP đã gửi tới email: {email}</Text>

      <TextInput
        style={styles.input}
        placeholder="Nhập mã OTP 6 chữ số"
        placeholderTextColor="#999"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        maxLength={6}
      />

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.6 }]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>XÁC THỰC</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#F9A825",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
});
