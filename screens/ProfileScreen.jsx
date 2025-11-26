import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal, // Thêm Modal
  TextInput, // Thêm TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native"; // Thêm useNavigation

// -------------------------------------------------------------------
// ✅ API SERVICE GIẢ LẬP (Tạm thời)
// Đây là nơi bạn sẽ thay thế bằng logic gọi API Backend thực tế
const apiService = {
  fetchUserProfile: async () => {
    // API GET /api/users/profile
    // Giả lập dữ liệu trả về từ Backend
    return {
      name: "Bung bu", 
      email: "bitch24c02@gmail.com",
      
    };
  },
  changePassword: async (oldPassword, newPassword) => {
    // API PUT/PATCH /api/users/profile (hoặc /api/users/password)
    console.log("Calling Backend to change password...");
    // Giả lập độ trễ API
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    return { success: true };
  },
};
// -------------------------------------------------------------------


export default function ProfileScreen() {
  const navigation = useNavigation();
  const { logout } = useContext(AuthContext); 

  // 📦 STATE DỮ LIỆU
  const [profile, setProfile] = useState({
    name: 'Loading...',
    email: 'loading@app.com',
    

  });
  const [showSettingsModal, setShowSettingsModal] = useState(false); // Quản lý popup1
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 🔄 HIỆU ỨNG: TẢI DỮ LIỆU PROFILE
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiService.fetchUserProfile();
        setProfile(data); // Cập nhật State với dữ liệu từ API giả lập
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    loadProfile();
  }, []);

  // 🔒 HÀM: LOGOUT
  const handleLogout = async () => {
    try {
      await logout();
      // Thêm điều hướng về màn hình đăng nhập nếu cần
      // navigation.navigate('Login'); 
    } catch (error) {
      console.log("Logout error:", error);
    }
  };
  
  // ⚙️ HÀM: CHANGE PASSWORD (Xử lý popup1)
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      alert("Vui lòng điền đầy đủ mật khẩu cũ và mật khẩu mới.");
      return;
    }
    
    try {
        const result = await apiService.changePassword(oldPassword, newPassword);
        if (result.success) {
            alert("Mật khẩu đã được thay đổi thành công!");
            setShowSettingsModal(false); // Đóng popup
            setOldPassword('');
            setNewPassword('');
        }
    } catch (error) {
        alert("Thay đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.");
    }
  };


  return (
    <SafeAreaView style={styles.container}> 
      {/* 🧑 HEADER MỚI (Thêm nút Quay lại và Settings) */}
      <View style={styles.header}>
        {/* Nút Quay lại (Yêu cầu của bạn) */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        
        {/* Nút Settings (Bánh răng) */}
        <TouchableOpacity onPress={() => setShowSettingsModal(true)} style={styles.headerButton}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 🖼️ AVATAR & INFO (Sử dụng dữ liệu State) */}
        <View style={styles.avatarSection}>
          <Image
            source={require("../assets/avatar.png")}
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          
          {/* Nút Edit Profile (Giữ nguyên vị trí) */}
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil-outline" size={16} color="#000" />
            <Text style={styles.editButtonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* TIÊU ĐỀ "More options" */}
        <Text style={styles.moreOptionsTitle}>More options</Text>

        {/* 📦 OPTION BOX */}
        <View style={styles.optionBox}>
          {/* Saved Dishes */}
        
          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionLeft}>
              <Feather name="bookmark" size={22} color="#000" />
              <Text style={styles.optionText}>Saved Dishes</Text>
            </View>
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionLeft}>
              <Ionicons name="help-circle-outline" size={22} color="#000" />
              <Text style={styles.optionText}>Help & Support</Text>
            </View>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={styles.optionCard} onPress={handleLogout}>
            <View style={styles.optionLeft}>
              <Ionicons name="log-out-outline" size={22} color="red" />
              <Text style={[styles.optionText, { color: "red" }]}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ⚙️ MODAL SETTINGS (popup1) */}
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSettingsModal}
      onRequestClose={() => setShowSettingsModal(false)}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Ionicons name="close-circle-outline" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Danh sách các mục trong Settings */}
          <View style={modalStyles.settingsList}>
            <TouchableOpacity style={modalStyles.settingItem}>
              <View style={modalStyles.settingLeft}>
                <Ionicons name="lock-closed-outline" size={22} color="#000" />
                <Text style={modalStyles.settingText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity style={modalStyles.settingItem}>
              <View style={modalStyles.settingLeft}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#000" />
                <Text style={modalStyles.settingText}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity style={modalStyles.settingItem}>
              <View style={modalStyles.settingLeft}>
                <Ionicons name="notifications-outline" size={22} color="#000" />
                <Text style={modalStyles.settingText}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[modalStyles.settingItem, modalStyles.lastItem]}
              onPress={() => {
                setShowSettingsModal(false);      
                navigation.navigate("AboutApp");  
              }}
            >
              <View style={modalStyles.settingLeft}>
                <Ionicons name="information-circle-outline" size={22} color="#000" />
                <Text style={modalStyles.settingText}>About App</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F7BE27",
    
  },
  

  topBackground: {
    height: '30%', 
    backgroundColor: '#815D0D',
    position: 'absolute', 
    width: '100%',
    top: 0,
    left: 0,
  },
  
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20, 
    paddingHorizontal: 20, 
    position: 'relative', 
    zIndex: 10, 
  },
  headerButton: {
    padding: 5,
  },

  scrollViewContent: {
    flexGrow: 1, 
    alignItems: 'center',
    paddingTop: 80, 
    paddingHorizontal: 20, 
    zIndex: 5, 
  },


  avatarSection: {
    alignItems: "center",
    backgroundColor: "white",   
    paddingVertical: 20,
    borderRadius: 20,
    marginBottom: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
  },
  email: {
    color: "#111",
    fontSize: 14,
    marginBottom: 10,
  },
  editButton: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#FFE08C",   // màu vàng nhẹ
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 25,

  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 3,
},

  editButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: 'black',
    fontWeight: '600',
  },
 
  moreOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    alignSelf: 'flex-start',
    marginBottom: 15, 
    marginTop: 8,
    paddingHorizontal: 0,
  },

 optionCard: {
  backgroundColor: "white",
  paddingVertical: 15,
  paddingHorizontal: 15,
  borderRadius: 15,
  marginBottom: 12,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",

  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
},
optionLeft: {
  flexDirection: "row",
  alignItems: "center",
},
optionText: {
  marginLeft: 10,
  fontSize: 16,
  fontWeight: "500",
  color: "#000",
},

optionText: {
    marginLeft: 5,
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
},
});

// Styles cho Modal (popup1)
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    backgroundColor: '#6f6f6bff', 
    borderRadius: 20,
    padding: 20,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
  },
  content: {
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#E3A721',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsList: {
  marginTop: 10,
},
settingItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#eeeddeff', 
  paddingVertical: 14,
  paddingHorizontal: 15,
  borderRadius: 10,
  marginBottom: 10,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 2,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
},
settingLeft: {
  flexDirection: 'row',
  alignItems: 'center',
},
settingText: {
  marginLeft: 10,
  fontSize: 16,
  color: '#000',
  fontWeight: '500',
},
lastItem: {
  marginBottom: 0,
},

});