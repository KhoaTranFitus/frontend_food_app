import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert
} from "react-native";
import axios from "axios";
import { useRoute, useNavigation } from "@react-navigation/native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function ChangePasswordScreen() {
    const route = useRoute();
    const navigation = useNavigation();

    const { email } = route.params;
    const [newPass, setNewPass] = useState("");

    const handleSave = async () => {
        if (!newPass) {
            Alert.alert("Lỗi", "Vui lòng nhập mật khẩu mới");
            return;
        }

        try {
            await axios.post(`${API_BASE_URL}/change-password`, {
                email,
                new_password: newPass
            });

            Alert.alert("Thành công", "Đổi mật khẩu thành công!", [
                { text: "Đăng nhập", onPress: () => navigation.navigate("Login") }
            ]);
        } catch (error) {
            Alert.alert("Lỗi", error.response?.data?.error || "Không thể đổi mật khẩu");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Đặt lại mật khẩu</Text>
            <TextInput
                placeholder="Mật khẩu mới"
                secureTextEntry
                style={styles.input}
                value={newPass}
                onChangeText={setNewPass}
            />
            <TouchableOpacity style={styles.btn} onPress={handleSave}>
                <Text style={styles.btnText}>LƯU MẬT KHẨU</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 25, justifyContent: "center" },
    title: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
    input: {
        borderWidth: 1, borderColor: "#ccc",
        padding: 12, borderRadius: 8, marginTop: 20
    },
    btn: {
        backgroundColor: "#F9A825", padding: 15,
        borderRadius: 10, marginTop: 20, alignItems: "center"
    },
    btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 }
});
