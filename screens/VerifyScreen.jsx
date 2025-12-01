// VerifyScreen.jsx
import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function VerifyScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    const { email, mode } = route.params;  // "register" | "reset_password"
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!code) {
            Alert.alert("Lỗi", "Vui lòng nhập mã OTP!");
            return;
        }

        try {
            setLoading(true);

            const res = await axios.post(`${API_BASE_URL}/verify`, {
                email,
                code,
                mode
            });

            if (mode === "register") {
                Alert.alert("Thành công", "Xác thực email thành công!", [
                    { text: "Đăng nhập", onPress: () => navigation.navigate("Login") }
                ]);
            }

            if (mode === "reset_password") {
                navigation.navigate("ChangePassword", { email });
            }
        } catch (err) {
            Alert.alert("Lỗi", err.response?.data?.error || "OTP không đúng");
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
                placeholder="Nhập mã OTP"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
            />

            <TouchableOpacity
                style={styles.btn}
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
    container: { flex: 1, padding: 25, justifyContent: "center" },
    title: { fontSize: 26, textAlign: "center", fontWeight: "bold" },
    subtitle: { fontSize: 14, textAlign: "center", marginVertical: 10 },
    input: {
        borderWidth: 1, borderColor: "#ccc", borderRadius: 10,
        padding: 12, fontSize: 18, marginTop: 20
    },
    btn: {
        backgroundColor: "#F9A825", padding: 15,
        borderRadius: 10, marginTop: 20, alignItems: "center"
    },
    btnText: { color: "#fff", fontSize: 18, fontWeight: "bold" }
});
