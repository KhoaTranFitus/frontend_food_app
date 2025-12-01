import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// const API_BASE_URL = 'http://192.168.1.12:5000/api';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // const handleLogin = async () => {
  //   try {
  //     await login();
  //   } catch (error) {
  //     console.log("Login error:", error);
  //   }
  // };

  const handleLogin = async () => {
    setError(""); // Reset lỗi trước khi thử đăng nhập

    if (!email || !password) {
      setError("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    try {
      // ⭐️ GỌI API LOGIN ĐẾN BACKEND ⭐️
      console.log("Calling API at:", `${API_BASE_URL}/login`);
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: email,
        password: password,
      });

      // Nếu API trả về thành công (status 200)
      if (response.data && response.data.idToken) {
        // Lưu ID Token vào AsyncStorage hoặc Context nếu cần
        await AsyncStorage.setItem("userToken", response.data.idToken);
        // Gọi hàm login từ AuthContext để cập nhật trạng thái
        await login();
        // Ứng dụng sẽ tự động chuyển hướng qua MainTabs
      }
    } catch (apiError) {
      // Xử lý lỗi từ Backend (ví dụ: 400, 401, 403, 404)
      const errorMessage = apiError.response?.data?.error || "Đăng nhập thất bại. Lỗi kết nối.";
      setError(errorMessage);
      console.log("Login API Error:", errorMessage);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* TOP CURVE BG */}
      <ImageBackground
        source={require("../assets/login_signup.png")}
        style={styles.bg}
      >
        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.title}>LOGIN</Text>

          {/* EMAIL */}
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#555" />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#999"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* PASSWORD */}
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#555" />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={!passwordVisible}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              <Ionicons
                name={passwordVisible ? "eye-off" : "eye"}
                size={18}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              if (!email) {
                alert("Please enter your email before resetting password");
                return;
              }

              navigation.navigate("Verify", {
                email: email,
                mode: "reset_password",
              });
            }}
          >
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>
          {/* LOGIN BUTTON */}
          {error ? <Text style={{ color: 'red', textAlign: 'center', marginBottom: 5, marginTop: 15 }}>{error}</Text> : null}
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginText}>LOGIN</Text>
          </TouchableOpacity>

          {/* REGISTER LINK */}
          <View style={styles.bottomRow}>
            <Text style={styles.smallText}>Don’t have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text
                style={[
                  styles.smallText,
                  { fontWeight: "bold", textDecorationLine: "underline" },
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      {/* SOCIAL BAR */}
      <View style={styles.socialBar}>
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/300/300221.png",
          }}
          style={styles.socialIcon}
        />
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/733/733547.png",
          }}
          style={styles.socialIcon}
        />
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/2111/2111463.png",
          }}
          style={styles.socialIcon}
        />
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/733/733579.png",
          }}
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
    marginTop: 180,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },

  title: {
    fontSize: 26,
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
    marginBottom: 15,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },

  forgot: {
    color: "#444",
    fontSize: 13,
    textAlign: "right",
    textDecorationLine: "underline",
  },

  loginBtn: {
    backgroundColor: "#F9A825",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
  },

  loginText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },

  smallText: {
    fontSize: 13,
    color: "#444",
  },

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
});
