import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Image, ScrollView, Alert, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- NHỚ IMPORT CÁI NÀY
import { useNavigation } from '@react-navigation/native';
import { userAPI, authAPI } from '../services/flaskApi';

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('info');

    // State dữ liệu
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState(null);

    // State Password
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');

    // State Email
    const [newEmail, setNewEmail] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    // State Verify Email Modal
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyCode, setVerifyCode] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const user = await userAPI.getProfile();
            if (user) {
                setName(user.name);
                setAvatar(user.avatar_url);
            }
        } catch (e) {
            console.log("Chưa load được user", e);
        }
    };

    // --- FIX LỖI AVATAR (Bản an toàn hơn) ---
    const pickImage = async () => {
        try {
            console.log("Đang xin quyền...");
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert("Lỗi", "Cần quyền truy cập ảnh.");
                return;
            }

            console.log("Đang mở thư viện ảnh...");

            // FIX LỖI 1: Dùng string 'Images' thay vì Enum để tránh lỗi undefined
            // FIX LỖI 2: quality = 0.2 (Rất thấp) để ảnh nhẹ, ko bị tràn RAM
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'Images',
                allowsEditing: true, // Cố gắng cho user cắt ảnh vuông
                aspect: [1, 1],
                quality: 0.2, // <--- CHÌA KHÓA ĐỂ KO CRASH: Giảm xuống thấp nhất có thể
                base64: true,
            });

            if (!result.canceled) {
                console.log("Đã chọn ảnh xong!");

                // Kiểm tra xem ảnh có quá to không, nếu chuỗi quá dài thì cảnh báo
                if (result.assets[0].base64.length > 5000000) { // > 5MB text
                    Alert.alert("Ảnh quá lớn", "Vui lòng chọn ảnh khác nhẹ hơn.");
                    return;
                }

                const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setAvatar(base64Img);
            }
        } catch (error) {
            console.log("Lỗi pickImage:", error);
            // Không hiện Alert lỗi nữa để tránh spam popup nếu crash ngầm
        }
    };

    const handleUpdateInfo = async () => {
        setLoading(true);
        try {
            // Update Server
            await userAPI.updateProfile(name, avatar);

            // --- CẬP NHẬT LOCAL STORAGE LUÔN ĐỂ PROFILE SHOW ĐÚNG ---
            const currentUserJSON = await AsyncStorage.getItem('user_data');
            if (currentUserJSON) {
                const currentUser = JSON.parse(currentUserJSON);
                currentUser.name = name;
                currentUser.avatar_url = avatar;
                await AsyncStorage.setItem('user_data', JSON.stringify(currentUser));
            }
            // ---------------------------------------------------------

            Alert.alert("Thành công", "Đã cập nhật hồ sơ!");
        } catch (error) {
            Alert.alert("Lỗi", error.error || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePass = async () => {
        if (newPass.length < 6) return Alert.alert("Lỗi", "Mật khẩu mới phải > 6 ký tự");
        setLoading(true);
        try {
            await userAPI.changePassword(oldPass, newPass);
            Alert.alert("Thành công", "Đổi mật khẩu thành công!");
            setOldPass(''); setNewPass('');
        } catch (error) {
            Alert.alert("Lỗi", error.error || "Mật khẩu cũ không đúng hoặc lỗi hệ thống");
        } finally {
            setLoading(false);
        }
    };

    const handleChangeEmail = async () => {
        if (!newEmail || !confirmPass) return Alert.alert("Thiếu thông tin", "Vui lòng nhập đủ email mới và mật khẩu xác nhận.");
        setLoading(true);
        try {
            await userAPI.changeEmail(confirmPass, newEmail);
            Alert.alert("Đã gửi mã", `Mã xác thực đã gửi tới ${newEmail}`);
            setShowVerifyModal(true);
        } catch (error) {
            Alert.alert("Lỗi", error.error || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    // --- FIX LỖI EMAIL KHÔNG CẬP NHẬT UI ---
    const handleVerifyCode = async () => {
        if (!verifyCode) return Alert.alert("Lỗi", "Vui lòng nhập mã xác thực");

        setLoading(true);
        try {
            // 1. Verify trên Server
            await authAPI.verifyEmail(newEmail, verifyCode);

            // 2. --- QUAN TRỌNG: CẬP NHẬT NGAY VÀO ASYNC STORAGE ---
            const currentUserJSON = await AsyncStorage.getItem('user_data');
            if (currentUserJSON) {
                const currentUser = JSON.parse(currentUserJSON);
                // Cập nhật email mới vào bộ nhớ tạm
                currentUser.email = newEmail;
                // Lưu ngược lại
                await AsyncStorage.setItem('user_data', JSON.stringify(currentUser));
                console.log("Đã cập nhật AsyncStorage với email mới:", newEmail);
            }
            // -------------------------------------------------------

            Alert.alert("Thành công", "Email đã được cập nhật!");
            setShowVerifyModal(false);
            setVerifyCode('');
            setConfirmPass('');
            setNewEmail('');

        } catch (error) {
            Alert.alert("Xác thực thất bại", error.error || "Mã không đúng");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'info' && styles.tabActive]}
                    onPress={() => setActiveTab('info')}>
                    <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>Thông tin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'security' && styles.tabActive]}
                    onPress={() => setActiveTab('security')}>
                    <Text style={[styles.tabText, activeTab === 'security' && styles.tabTextActive]}>Mật khẩu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'email' && styles.tabActive]}
                    onPress={() => setActiveTab('email')}>
                    <Text style={[styles.tabText, activeTab === 'email' && styles.tabTextActive]}>Email</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* TAB 1: INFO */}
                {activeTab === 'info' && (
                    <View style={styles.card}>
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            {/* Thêm log onPress để kiểm tra xem có ăn nút bấm không */}
                            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                                <Image
                                    source={{ uri: avatar || 'https://via.placeholder.com/150' }}
                                    style={styles.avatar}
                                />
                                <View style={styles.cameraIcon}>
                                    <Ionicons name="camera" size={16} color="white" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Tên hiển thị</Text>
                        <TextInput style={styles.input} value={name} onChangeText={setName} />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateInfo} disabled={loading}>
                            {loading ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>Lưu thay đổi</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {/* TAB 2: PASSWORD */}
                {activeTab === 'security' && (
                    <View style={styles.card}>
                        <Text style={styles.label}>Mật khẩu cũ</Text>
                        <TextInput style={styles.input} secureTextEntry value={oldPass} onChangeText={setOldPass} placeholder="Nhập mật khẩu hiện tại" />

                        <Text style={styles.label}>Mật khẩu mới</Text>
                        <TextInput style={styles.input} secureTextEntry value={newPass} onChangeText={setNewPass} placeholder="Nhập mật khẩu mới" />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleChangePass} disabled={loading}>
                            {loading ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>Đổi mật khẩu</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {/* TAB 3: EMAIL */}
                {activeTab === 'email' && (
                    <View style={styles.card}>
                        <Text style={{ color: 'red', marginBottom: 10, fontSize: 13 }}>
                            * Lưu ý: Mã xác thực sẽ được gửi đến email mới.
                        </Text>
                        <Text style={styles.label}>Email mới</Text>
                        <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" placeholder="example@gmail.com" />

                        <Text style={styles.label}>Mật khẩu đăng nhập</Text>
                        <TextInput style={styles.input} secureTextEntry value={confirmPass} onChangeText={setConfirmPass} placeholder="Xác nhận mật khẩu của bạn" />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleChangeEmail} disabled={loading}>
                            {loading ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>Gửi mã xác thực</Text>}
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>

            {/* MODAL VERIFY */}
            <Modal
                visible={showVerifyModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowVerifyModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Xác thực Email mới</Text>
                        <Text style={{ marginBottom: 15, textAlign: 'center' }}>
                            Nhập mã 6 số gửi tới: {newEmail}
                        </Text>

                        <TextInput
                            style={[styles.input, { textAlign: 'center', fontSize: 18, letterSpacing: 5 }]}
                            value={verifyCode}
                            onChangeText={setVerifyCode}
                            keyboardType="number-pad"
                            maxLength={6}
                            placeholder="123456"
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleVerifyCode} disabled={loading}>
                            {loading ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>Xác nhận</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setShowVerifyModal(false)}>
                            <Text style={{ color: 'red' }}>Hủy bỏ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#9a0e0e' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },

    tabContainer: { flexDirection: 'row', backgroundColor: '#810b0b' },
    tabBtn: { flex: 1, padding: 15, alignItems: 'center' },
    tabActive: { borderBottomWidth: 3, borderColor: '#FFE08C' },
    tabText: { color: '#ffaaaa' },
    tabTextActive: { color: 'white', fontWeight: 'bold' },

    content: { padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 20 },

    avatarContainer: { position: 'relative' },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#ddd' },
    cameraIcon: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#9a0e0e', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white'
    },

    label: { fontWeight: 'bold', marginBottom: 5, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 15, backgroundColor: '#f9f9f9' },

    saveBtn: { backgroundColor: '#FFE08C', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    btnText: { fontWeight: 'bold', color: 'black', fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 15, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#9a0e0e' }
});