import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
  try {
    await login(); // dùng hàm login từ AuthContext
  } catch (error) {
    console.log("Login error:", error);
  }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={{
          uri: "https://i.pinimg.com/564x/3b/45/60/3b45609faeeb6ebbaad233eb3dc734f4.jpg",
        }}
        style={styles.bg}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Welcome Back 👋</Text>

          <View style={styles.formBox}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#ddd"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                secureTextEntry={!passwordVisible}
                placeholder="Enter your password"
                placeholderTextColor="#ddd"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Ionicons name={passwordVisible ? "eye-off" : "eye"} size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity>
              <Text style={styles.forgot}>Forget Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 10 }}>
              <Text style={{ color: "#fff" }}>Don’t have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={{ color: "#E3A721", fontWeight: "bold" }}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: "center",
  },
  container: {
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#4B2E05",
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginBottom: 20,
  },
  formBox: {
    width: "100%",
    backgroundColor: "#4B2E05",
    borderRadius: 20,
    padding: 20,
  },
  label: {
    color: "#fff",
    marginBottom: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#fff",
    color: "#fff",
    marginBottom: 15,
    paddingVertical: 5,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  forgot: {
    color: "#fff",
    textAlign: "right",
    marginVertical: 10,
  },
  loginBtn: {
    backgroundColor: "#fff8dc",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});
