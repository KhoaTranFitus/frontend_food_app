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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { authAPI } from '../services/flaskApi';

export default function RegisterScreen() {
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ các trường.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.register(email, password, name);
      Alert.alert("Thành công", "Đăng ký thành công! Vui lòng xác thực email.", [
        {
          text: "Xác thực",
          onPress: () => navigation.navigate("Verify", { email, mode: "register" }),
        },
      ]);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      Alert.alert("Lỗi", error.error || "Đăng ký thất bại");
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
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
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
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={18}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          {/* SIGN UP BUTTON */}
          <TouchableOpacity
            style={[styles.signUpBtn, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
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
});