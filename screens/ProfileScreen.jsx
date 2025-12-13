import React, { useState, useCallback, useContext } from "react"; // 1. Thêm useContext
import {
    View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from "../context/AuthContext"; // 2. Import AuthContext
export default function ProfileScreen() {
    const navigation = useNavigation();

    // 3. Lấy hàm logout từ Context (QUAN TRỌNG)
    const { logout } = useContext(AuthContext);

    const [profile, setProfile] = useState({
        name: 'Đang tải...',
        email: '...',
        avatar_url: null
    });
    const [showSettings, setShowSettings] = useState(false);

    // Load lại dữ liệu mỗi khi màn hình được hiển thị
    useFocusEffect(
        useCallback(() => {
            const loadProfile = async () => {
                try {
                    const jsonValue = await AsyncStorage.getItem('user_data');
                    if (jsonValue) {
                        setProfile(JSON.parse(jsonValue));
                    }
                } catch (error) {
                    console.error("Lỗi load profile:", error);
                }
            };
            loadProfile();
        }, [])
    );

    // 4. SỬA LẠI HÀM LOGOUT NÀY
    const handleLogout = async () => {
        try {
            // Chỉ cần gọi logout() từ context.
            // Context sẽ xóa token và AppNavigator sẽ tự động chuyển về màn hình Login.
            await logout();

            // KHÔNG DÙNG navigation.reset(...) Ở ĐÂY NỮA
        } catch (error) {
            console.log("Lỗi logout:", error);
        }
    };
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back-outline" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
                <TouchableOpacity onPress={() => setShowSettings(true)}>
                  <Ionicons name="settings-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* INFO CARD */}
                <View style={styles.card}>
                    <Image
                        source={
                            (profile.avatar_url && profile.avatar_url !== "")
                                ? { uri: profile.avatar_url }
                                : require("../assets/default_avatar.jpg") // <-- Thay tên file ảnh mặc định của bạn vào đây
                        }
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{profile.name}</Text>
                    <Text style={styles.email}>{profile.email}</Text>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate("EditProfile")}>
                        <Ionicons name="pencil" size={16} color="black" />
                        <Text style={styles.editButtonText}> Edit profile</Text>
                    </TouchableOpacity>
                </View>

                {/* OPTIONS */}
                <Text style={styles.sectionTitle}>Tùy chọn khác</Text>

                <View style={styles.optionContainer}>
                    <OptionItem
                        icon="bookmark" title="Món đã lưu"
                        onPress={() => navigation.navigate("SavedDishes")}
                    />
                    <OptionItem
                        icon="help-circle" title="Trợ giúp & Hỗ trợ"
                        onPress={() => navigation.navigate("HelpSupport")}
                    />

                    {/* Logout */}
                    <TouchableOpacity style={styles.optionItem} onPress={handleLogout}>
                        <View style={styles.row}>
                            <Ionicons name="log-out-outline" size={22} color="red" />
                            <Text style={[styles.optionText, { color: "red" }]}>Đăng xuất</Text>
                        </View>
                    </TouchableOpacity>

                </View>
            </ScrollView>
            {/* SETTINGS POPUP */}
            <Modal
            visible={showSettings}
            transparent
            animationType="fade"
            onRequestClose={() => setShowSettings(false)}
            >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={() => setShowSettings(false)}
            >
                <View style={styles.settingsPopup}>

                <Text style={styles.popupTitle}>Settings</Text>

                {/* ABOUT APP */}
                <PopupItem
                    icon="information-circle-outline"
                    title="About App"
                    onPress={() => {
                    setShowSettings(false);
                    navigation.navigate("AboutApp");
                    }}
                />

                {/* NOTIFICATIONS */}
                <PopupItem
                    icon="notifications-outline"
                    title="Notifications"
                    onPress={() => {
                    setShowSettings(false);
                    navigation.navigate("Notifications");
                    }}
                />

                </View>
            </TouchableOpacity>
            </Modal>

        </SafeAreaView>
    );
}

// Component con giữ nguyên
const OptionItem = ({ icon, title, onPress }) => (
    <TouchableOpacity style={styles.optionItem} onPress={onPress}>
        <View style={styles.row}>
            <Feather name={icon} size={22} color="#333" />
            <Text style={styles.optionText}>{title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
);
const PopupItem = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.popupItem} onPress={onPress}>
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color="#333" />
      <Text style={styles.popupText}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#aaa" />
  </TouchableOpacity>
);


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#9a0e0e" },
    header: { flexDirection: "row", justifyContent: "space-between", padding: 20, alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },

    card: {
        backgroundColor: "white", margin: 20, borderRadius: 20,
        alignItems: "center", padding: 25, elevation: 5
    },
    avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 10, borderWidth: 3, borderColor: '#f0f0f0' },
    name: { fontSize: 22, fontWeight: "bold", color: "#333" },
    email: { color: "#666", marginBottom: 15 },

    editButton: {
        backgroundColor: "#FFE08C", flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25, elevation: 3
    },
    editButtonText: { fontWeight: 'bold', color: 'black' },

    sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 25, marginBottom: 10 },
    optionContainer: { backgroundColor: 'white', marginHorizontal: 20, borderRadius: 15, padding: 10 },

    optionItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    optionText: { marginLeft: 15, fontSize: 16, fontWeight: '500' },
    
    overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center"
    },

    settingsPopup: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 10
    },

    popupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center"
    },

    popupItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
    },

    popupText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333"
    },

});