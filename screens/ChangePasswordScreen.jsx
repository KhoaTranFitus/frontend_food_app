import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function ChangePassWordScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    const { email } = route.params ?? {};

    const [pass, setPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");

    const handleChange = () => {
        if (pass !== confirmPass) {
            alert("Passwords do not match!");
            return;
        }

        console.log("Email:", email);
        console.log("New Password:", pass);

        alert("Password changed successfully!");
        navigation.navigate("Login");
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.email}>{email}</Text>

            <TextInput
                style={styles.input}
                placeholder="New password"
                secureTextEntry
                value={pass}
                onChangeText={setPass}
            />

            <TextInput
                style={styles.input}
                placeholder="Confirm password"
                secureTextEntry
                value={confirmPass}
                onChangeText={setConfirmPass}
            />

            <TouchableOpacity style={styles.btn} onPress={handleChange}>
                <Text style={styles.btnText}>CHANGE PASSWORD</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 25 },
    title: { fontSize: 26, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
    email: { textAlign: "center", marginBottom: 20, color: "#555" },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
    },
    btn: {
        backgroundColor: "#F9A825",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
