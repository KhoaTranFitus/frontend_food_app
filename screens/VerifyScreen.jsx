import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";


export default function VerifyScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    const [code, setCode] = useState("");

    const { email, mode } = route.params ?? {}; // email từ Register chuyển qua

    const handleVerify = async () => {
        try {
            console.log("OTP:", code);
            console.log("Email:", email);
            console.log("Mode:", mode);

            // Nếu là quên mật khẩu -> chuyển sang ChangePassword
            if (mode === "reset_password" && email) {
                navigation.navigate("ChangePassword", { email, mode });
                return;
            }

            // Nếu là đăng ký tài khoản -> quay lại Login
            navigation.navigate("Login");

        } catch (err) {
            console.log("Verify Error:", err);
        }
    };
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Email Verification</Text>
            <Text style={styles.sub}>
                We sent a verification code to:
            </Text>
            <Text style={styles.email}>{email}</Text>

            <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                keyboardType="numeric"
                value={code}
                onChangeText={setCode}
                maxLength={6}
            />

            <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
                <Text style={styles.verifyText}>VERIFY</Text>
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
    sub: {
        textAlign: "center",
        color: "#555",
    },
    email: {
        textAlign: "center",
        fontWeight: "bold",
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
    verifyBtn: {
        backgroundColor: "#F9A825",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    verifyText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "bold",
    },
});
