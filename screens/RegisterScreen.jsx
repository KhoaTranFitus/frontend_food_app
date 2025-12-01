import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";

// lấy URL API từ biến môi trường
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
console.log("API_BASE_URL:", API_BASE_URL);

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [visiblePassword, setVisiblePassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [passwordSecure, setPasswordSecure] = useState(true);

  const handleRegister = async () => {
    setError("");
    setLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ các trường.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      setLoading(false);
      return;
    }
    if (password.length < 6) { // Logic kiểm tra tối thiểu 6 ký tự
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      setLoading(false);
      return;
    }
    try {
      // ⭐️ GỌI API ĐĂNG KÝ ĐẾN BACKEND ⭐️
      const response = await axios.post(`${API_BASE_URL}/register`, {
        name: name,
        email: email,
        password: password,
      });

      // Nếu đăng ký thành công (status 200)
      Alert.alert(
        "Thành công",
        response.data.message || "Đăng ký thành công! Vui lòng kiểm tra email để xác thực.",
        [{
          text: "Xác thực ngay",
          onPress: () => {
            // CHUYỂN HƯỚNG TỚI MÀN HÌNH XÁC THỰC EMAIL (Cần tạo)
            // Giả định màn hình xác thực có tên là 'Verify'
            navigation.navigate('Verify', { email: email, mode: 'register' });
          }
        }]
      );

      // Xóa form sau khi đăng ký
      setName(''); setEmail(''); setPassword(''); setConfirmPassword('');

    } catch (apiError) {
      // Xử lý lỗi từ Backend (ví dụ: Email đã tồn tại, mật khẩu quá ngắn,...)
      const errorMessage = apiError.response?.data?.error || "Lỗi đăng ký. Vui lòng thử lại.";
      setError(errorMessage);
      console.log("Register API Error:", errorMessage);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* BACKGROUND IMAGE (top curve + gradient) */}
      <ImageBackground
        source={require("../assets/login_signup.png")}
        style={styles.bg}
      >
        {/* FORM CARD */}
        <View style={styles.card}>
          <Text style={styles.title}>Create an account</Text>

          {/* NAME */}
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color="#555" />
            <TextInput
              placeholder="Name"
              placeholderTextColor="#999"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* EMAIL */}
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#555" />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#999"
              style={styles.input}
              value={email}        // luu gia tri nguoi dung nhap vao email
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none" // muc dich khong viet hoa ky tu dau
            />
          </View>

          {/* PASSWORD */}
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#555" />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={!visiblePassword}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setVisiblePassword(!visiblePassword)}
            >
              <Ionicons
                name={visiblePassword ? "eye-off" : "eye"}
                size={18}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          {/* CONFIRM PASSWORD */}
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#555" />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              secureTextEntry={!passwordSecure}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              onPress={() =>
                setPasswordSecure(!passwordSecure)
              }
            >
              <Ionicons
                name={passwordSecure ? "eye-off" : "eye"}
                size={18}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          {/* HIỂN THỊ LỖI */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* SIGN UP BUTTON */}
          {/* <TouchableOpacity
            style={[styles.signUpBtn, loading && { opacity: 0.7 }]}
            onPress={() => navigation.navigate("Verify", {
              email,
              mode: "register"
            })}
          >
            <Text style={styles.signUpText}>SIGN UP</Text>
          </TouchableOpacity> */}

          {/* new login button */}
          <TouchableOpacity
            style={[styles.signUpBtn, loading && { opacity: 0.6 }]}
            onPress={handleRegister} // Gọi hàm API
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpText}>SIGN UP</Text>
            )}
          </TouchableOpacity>

          {/* LOGIN LINK */}
          <View style={styles.bottomRow}>
            <Text style={styles.smallText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={[styles.smallText, { fontWeight: "bold", textDecorationLine: "underline" }]}>
                Login Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      {/* BOTTOM SOCIAL BAR */}
      <View style={styles.socialBar}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/300/300221.png" }}
          style={styles.socialIcon}
        />
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/733/733547.png" }}
          style={styles.socialIcon}
        />
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/2111/2111463.png" }}
          style={styles.socialIcon}
        />
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/733/733579.png" }}
          style={styles.socialIcon}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
  },

  card: {
    marginTop: 130,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 25,
    // do bong cho khung
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },

  title: {
    fontSize: 23,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#222",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 12,
    marginBottom: 12,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: "#E98B20",
    marginRight: 4,
  },

  smallText: {
    color: "#444",
    fontSize: 13,
  },

  forgot: {
    color: "#444",
    fontSize: 13,
    textDecorationLine: "underline",
  },

  signUpBtn: {
    backgroundColor: "#F9A825",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 25,
    alignItems: "center",
  },

  signUpText: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 16,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },

  /* SOCIAL BAR */
  socialBar: {
    backgroundColor: "#F78A1F",
    height: 80,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
  },

  socialIcon: {
    width: 30,
    height: 30,
  },
  errorText: {
    color: 'white',
    backgroundColor: 'red',
    textAlign: 'center',
    padding: 8,
    borderRadius: 5,
    marginTop: 10,
    fontWeight: '600',
  },
});
