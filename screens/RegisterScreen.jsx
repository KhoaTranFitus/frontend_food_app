import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={{
          uri: "https://i.pinimg.com/564x/3b/45/60/3b45609faeeb6ebbaad233eb3dc734f4.jpg",
        }}
        style={styles.bg}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create Account ✨</Text>

          <View style={styles.formBox}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="Enter email" placeholderTextColor="#ddd" />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor="#ddd" secureTextEntry={!passwordVisible} />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput style={styles.input} placeholder="Confirm password" placeholderTextColor="#ddd" secureTextEntry={!passwordVisible} />

            <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginText}>Sign up</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 10 }}>
              <Text style={{ color: "#fff" }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={{ color: "#E3A721", fontWeight: "bold" }}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, justifyContent: "center" },
  container: { alignItems: "center", padding: 20 },
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
  label: { color: "#fff", marginBottom: 5 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#fff",
    color: "#fff",
    marginBottom: 15,
    paddingVertical: 5,
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
