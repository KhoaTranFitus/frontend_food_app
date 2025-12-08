import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
// ⭐️ BỔ SUNG: Import Auth API và User API ⭐️
import { authAPI, userAPI } from "../services/flaskApi"; 

export const AuthContext = createContext({
  isLoggedIn: false,
  user: null, // ⭐️ BỔ SUNG: Biến user ⭐️
  login: async () => {},
  logout: async () => {},
  updateUser: () => {}, // ⭐️ BỔ SUNG: Hàm cập nhật user (dùng cho favorites) ⭐️
  isLoading: true, // ⭐️ BỔ SUNG: Trạng thái loading ⭐️
});

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); // ⭐️ Khởi tạo user là null ⭐️
  const [isLoading, setIsLoading] = useState(true);

  // Hàm TẢI PROFILE: Được gọi khi app khởi động và sau khi đăng nhập
  const loadUserProfile = async () => {
    try {
      const userProfile = await userAPI.getProfile();
      setUser(userProfile); // Cập nhật state user
      setIsLoggedIn(true);
      await AsyncStorage.setItem("isLoggedIn", "true");
    } catch (error) {
      console.log("Không tải được profile (Chưa đăng nhập hoặc token hết hạn):", error);
      // Xóa token cũ và đặt lại state
      await AsyncStorage.removeItem("authToken");
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ⭐️ LOGIC MỚI: Chỉ cần check authToken và tải profile ⭐️
    const checkAuthAndLoadProfile = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        // Nếu có token, cố gắng tải profile
        await loadUserProfile();
      } else {
        setIsLoggedIn(false);
        setIsLoading(false);
      }
    };
    checkAuthAndLoadProfile();
  }, []);

  // Hàm login (Được gọi từ LoginScreen sau khi API login thành công)
  const login = async () => {
    // ⭐️ LOGIC MỚI: Chạy loadUserProfile để lấy thông tin user ⭐️
    setIsLoading(true);
    await loadUserProfile();
    // setIsLoading(false) đã nằm trong loadUserProfile
  };

  // Hàm logout
  const logout = async () => {
    await AsyncStorage.removeItem("authToken"); // Xóa token
    await AsyncStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    setUser(null); // Xóa user state
  };
  
  // Hàm cập nhật user state (dùng cho favorites, v.v.)
  const updateUser = (newUserData) => {
      setUser(newUserData);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);