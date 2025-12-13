import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ImageBackground,
    Image,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { authAPI } from '../services/flaskApi';

export default function LoginScreen() {
    const navigation = useNavigation();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // 1. Thêm state để lưu thông báo lỗi
    const [errorMessage, setErrorMessage] = useState("");

    const handleLogin = async () => {
        // Reset lỗi mỗi khi bấm đăng nhập
        setErrorMessage("");

        if (!email || !password) {
            // Thay alert bằng setErrorMessage
            setErrorMessage("Vui lòng nhập email và password");
            return;
        }

        setLoading(true);
        try {
            const result = await authAPI.login(email, password);
            console.log('Login success:', result);

            if (login) {
                await login();
            }
        } catch (error) {
            console.error('Login error:', error);

            const msg = error.error || error.message || 'Đăng nhập thất bại';

            // Kiểm tra nếu lỗi là email chưa được xác thực
            if (msg.includes('chưa được xác thực') || msg.includes('not verified')) {
                // Hiển thị lỗi lên màn hình trước
                setErrorMessage("Email chưa được xác thực. Đang chuyển hướng...");

                // Chờ 1.5s rồi chuyển trang để user kịp đọc
                setTimeout(() => {
                    navigation.navigate('Verify', {
                        mode: 'verify_email',
                        email: email,
                    });
                }, 1500);
            } else {
                // 2. Hiển thị lỗi từ backend lên màn hình (ví dụ: Sai email hoặc mật khẩu)
                setErrorMessage(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ImageBackground
                source={require("../assets/login_signup.png")}
                style={styles.bg}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>LOGIN</Text>

                    <View style={styles.inputRow}>
                        <Ionicons name="mail-outline" size={18} color="#555" />
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={email}
                            // Khi user gõ lại, có thể muốn ẩn lỗi đi
                            onChangeText={(text) => { setEmail(text); setErrorMessage(""); }}
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <Ionicons name="lock-closed-outline" size={18} color="#555" />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#999"
                            secureTextEntry={!passwordVisible}
                            style={styles.input}
                            value={password}
                            onChangeText={(text) => { setPassword(text); setErrorMessage(""); }}
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
                                setErrorMessage("Vui lòng nhập email để reset password");
                                return;
                            }
                            setErrorMessage("");
                            navigation.navigate("Verify", {
                                mode: "reset_password",
                                email: email,
                            });
                        }}
                    >
                        <Text style={styles.forgot}>Forgot password?</Text>
                    </TouchableOpacity>

                    {/* 3. Hiển thị thông báo lỗi tại đây */}
                    {errorMessage ? (
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.loginBtn, loading && { opacity: 0.6 }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginText}>LOGIN</Text>
                        )}
                    </TouchableOpacity>

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

            {/* ... Phần Social Bar giữ nguyên ... */}
            <View style={styles.socialBar}>
                {/* Giữ nguyên code cũ */}
                <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/300/300221.png" }} style={styles.socialIcon} />
                <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/733/733547.png" }} style={styles.socialIcon} />
                <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/2111/2111463.png" }} style={styles.socialIcon} />
                <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/733/733579.png" }} style={styles.socialIcon} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // ... Các style cũ giữ nguyên ...
    bg: { flex: 1, width: "100%", height: "100%", justifyContent: "flex-start" },
    card: { marginTop: 180, marginHorizontal: 20, backgroundColor: "#fff", padding: 25, borderRadius: 25, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
    title: { fontSize: 26, fontWeight: "bold", marginBottom: 25, color: "#222" },
    inputRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: "#ddd", paddingVertical: 12, marginBottom: 15 },
    input: { flex: 1, marginLeft: 10, fontSize: 15, color: "#333" },
    forgot: { color: "#444", fontSize: 13, textAlign: "right", textDecorationLine: "underline" },
    loginBtn: { backgroundColor: "#F9A825", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 25 },
    loginText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
    bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 15 },
    smallText: { fontSize: 13, color: "#444" },
    socialBar: { backgroundColor: "#F78A1F", height: 80, borderTopLeftRadius: 40, borderTopRightRadius: 40, flexDirection: "row", justifyContent: "space-evenly", alignItems: "center", position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingBottom: 20, elevation: 10, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: -3 } },
    socialIcon: { width: 30, height: 30 },

    // 4. Thêm style cho dòng báo lỗi
    errorText: {
        color: "red",
        fontSize: 14,
        textAlign: "center",
        marginTop: 10,
        marginBottom: 5,
        fontWeight: "500",
    },
});