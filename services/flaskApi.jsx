import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native'; // Cần import Alert để xử lý lỗi 401

// ============ CONFIG ============
// Auto-detect URL từ environment variable hoặc dùng default
// ⭐️ CẬP NHẬT IP CUỐI CÙNG (192.168.1.22) ⭐️
const DEV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.22:5000/api'; 
const PROD_BASE_URL = 'https://your-production-server.com/api';

const BASE_URL = __DEV__ ? DEV_BASE_URL : PROD_BASE_URL;

console.log('API Base URL:', BASE_URL);

// Tạo instance axios
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token vào header
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Xử lý lỗi chung
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token hết hạn hoặc invalid (Cần xóa token và đăng nhập lại)
      await AsyncStorage.removeItem('authToken');
      // Thường sẽ để AuthContext xử lý việc redirect, nhưng có thể thêm logic cảnh báo.
      Alert.alert("Phiên hết hạn", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    // Xử lý các loại lỗi khác nhau
    if (!error.response) {
      // Network error - Lỗi kết nối
      console.error('❌ Network error:', error.message);
      error.message = 'Lỗi kết nối. Kiểm tra:\n1. Backend có đang chạy không?\n2. IP đúng không? (' + BASE_URL + ')\n3. Device có cùng WiFi không?';
    } else if (status === 500) {
      error.message = 'Lỗi server: ' + (error.response.data?.error || 'Unknown error');
    } else if (error.response.data?.error) {
      // Giữ lỗi từ backend (ví dụ: Sai email/mật khẩu, Email chưa xác thực)
      error.message = error.response.data.error;
    }

    return Promise.reject(error);
  }
);

// ============ AUTHENTICATION ENDPOINTS ============
export const authAPI = {
  register: async (email, password, name) => {
    try {
      const response = await apiClient.post('/user/register', {
        email, password, name,
      });
      const token = response.data?.token || response.data?.idToken;
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  login: async (email, password) => {
    try {
      const response = await apiClient.post('/user/login', {
        email,
        password,
      });
      
      const token = response.data?.token || response.data?.idToken;
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // ⭐️ BỔ SUNG CHO AuthContext: Lấy Profile ⭐️
  getProfile: async () => {
    try {
      // AuthContext gọi hàm này, dùng endpoint /user/profile
      const response = await apiClient.get('/user/profile'); 
      return response.data.user; // Trả về đối tượng user
    } catch (error) {
      console.error('Get profile error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/user/auth/logout');
    } finally {
      await AsyncStorage.removeItem('authToken');
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await apiClient.put('/user/auth/change-password', {
        oldPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  resetPassword: async (email, newPassword) => {
    try {
      const response = await apiClient.post('/user/auth/reset-password', {
        email,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  verifyEmail: async (email, code) => {
    try {
      const response = await apiClient.post('/user/verify', {
        email,
        code,
      });
      return response.data;
    } catch (error) {
      console.error('Verify email error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  refreshToken: async () => {
    try {
      const response = await apiClient.post('/user/auth/refresh');
      if (response.data?.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },
};

// ============ USER PROFILE ENDPOINTS ============
export const userAPI = {
  // Lấy Profile (Dùng cùng endpoint với authAPI.getProfile())
  getProfile: async () => {
    try {
      const response = await apiClient.get('/user/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
  
  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/user/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error.response?.data || { error: error.message };
    }
    
  },

  uploadAvatar: async (imageUri) => {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `avatar_${Date.now()}.jpg`,
      });

      const response = await apiClient.post('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  deleteAccount: async () => {
    try {
      const response = await apiClient.delete('/user/account');
      await AsyncStorage.removeItem('authToken');
      return response.data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
};

// ============ RESTAURANT ENDPOINTS ============
export const restaurantAPI = {
  getAll: async (filters = {}) => {
    try {
      const response = await apiClient.get('/food/restaurants', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Get restaurants error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/food/restaurants/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get restaurant error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  search: async (query) => {
    try {
      const response = await apiClient.get('/food/restaurants/search', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      console.error('Search restaurants error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getNearby: async (latitude, longitude, radius = 5000) => {
    try {
      const response = await apiClient.get('/food/restaurants/nearby', {
        params: { latitude, longitude, radius },
      });
      return response.data;
    } catch (error) {
      console.error('Get nearby restaurants error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getByCategory: async (categoryId) => {
    try {
      const response = await apiClient.get(`/food/restaurants/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Get restaurants by category error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // ⭐️ HÀM MỚI: Lấy tất cả nhà hàng (thay thế cho TomTom) ⭐️
  getAllRestaurants: async (query = '') => {
    try {
      // Gọi endpoint /food/restaurants hoặc /food/restaurants/search?q=...
      const endpoint = query ? `/food/restaurants/search?q=${query}` : '/food/restaurants';
      const response = await apiClient.get(endpoint);
      
      // Trả về mảng restaurants
      return response.data.restaurants; 
      
    } catch (error) {
      console.error('Get all restaurants error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
      // ⭐️ HÀM MỚI: Lấy chi tiết nhà hàng dựa trên ID ⭐️
    getDetailsByIds: async (ids) => {
        try {
            const response = await apiClient.post('/food/restaurants/details-by-ids', { ids });
            return response.data.restaurants; 
        } catch (error) {
            console.error('Get details by IDs error:', error);
            throw error.response?.data || { error: error.message };
        }
    },
};

// ============ FOOD/DISH ENDPOINTS ============
export const foodAPI = {
  getAll: async (filters = {}) => {
    try {
      const response = await apiClient.get('/food/foods', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Get foods error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/food/foods/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get food error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  search: async (query) => {
    try {
      const response = await apiClient.get('/food/foods/search', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      console.error('Search foods error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getByCategory: async (categoryId) => {
    try {
      const response = await apiClient.get(`/food/foods/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Get foods by category error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getByRestaurant: async (restaurantId) => {
    try {
      const response = await apiClient.get(`/food/foods/restaurant/${restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Get foods by restaurant error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
};

// ============ FAVORITES ENDPOINTS ============
export const favoriteAPI = {
  // ⭐️ HÀM ĐÃ SỬA: toggleRestaurantFavorite ⭐️
  toggleRestaurantFavorite: async (restaurant_id) => {
    try {
      const response = await apiClient.post('/user/favorite/toggle-restaurant', {
        // Gửi ID dưới dạng string để đồng bộ với Backend
        restaurant_id: String(restaurant_id), 
      });
      return response.data;
    } catch (error) {
      console.error('Toggle favorite restaurant error:', error.response?.data || error.message);
      // Ném lỗi để UI có thể bắt được và hiển thị
      throw error.response?.data || { error: error.message };
    }
  },
    
  getAll: async () => {
    try {
      const response = await apiClient.get('/user/favorite/view');
      return response.data;
    } catch (error) {
      console.error('Get favorites error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
  
  // Hàm add cũ (dành cho foodId, giữ lại cho tính đầy đủ)
  add: async (foodId) => {
    try {
      const response = await apiClient.post('/favorites', { foodId });
      return response.data;
    } catch (error) {
      console.error('Add favorite error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  remove: async (foodId) => {
    try {
      const response = await apiClient.delete(`/favorites/${foodId}`);
      return response.data;
    } catch (error) {
      console.error('Remove favorite error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  isFavorite: async (foodId) => {
    try {
      const response = await apiClient.get(`/favorites/${foodId}/check`);
      return response.data;
    } catch (error) {
      console.error('Check favorite error:', error);
      return false;
    }
  },
};

// ============ REVIEWS/RATINGS ENDPOINTS ============
export const reviewAPI = {
  getByRestaurant: async (restaurantId) => {
    try {
      // ⭐️ SỬA LỖI: THÊM TIỀN TỐ /food ⭐️
      const response = await apiClient.get(`/food/reviews/restaurant/${restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Get restaurant reviews error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getByFood: async (foodId) => {
    try {
      // ⭐️ SỬA LỖI: THÊM TIỀN TỐ /food ⭐️
      const response = await apiClient.get(`/food/reviews/food/${foodId}`);
      return response.data;
    } catch (error) {
      console.error('Get food reviews error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  create: async (reviewData) => {
    try {
      // ⭐️ SỬA LỖI: THÊM TIỀN TỐ /food ⭐️
      const response = await apiClient.post('/food/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Create review error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  update: async (id, reviewData) => {
    try {
      // ⭐️ SỬA LỖI: THÊM TIỀN TỐ /food ⭐️
      const response = await apiClient.put(`/food/reviews/${id}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Update review error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  delete: async (id) => {
    try {
      // ⭐️ SỬA LỖI: THÊM TIỀN TỐ /food ⭐️
      const response = await apiClient.delete(`/food/reviews/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete review error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
};

// ============ CATEGORIES ENDPOINTS ============
export const categoryAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get category error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
};

// ============ CHATBOT ENDPOINTS ============
export const chatbotAPI = {
  // Gửi tin nhắn và nhận phản hồi từ chatbot
  sendMessage: async (message) => {
    try {
      const response = await apiClient.post('/chatbot', {
        message,
      });
      return response.data;
    } catch (error) {
      console.error('Send chatbot message error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // Lấy lịch sử chat của user
  getChatHistory: async (limit = 50) => {
    try {
      const response = await apiClient.get('/chatbot/history', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Get chat history error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // Xóa lịch sử chat
  clearChatHistory: async () => {
    try {
      const response = await apiClient.delete('/chatbot/history');
      return response.data;
    } catch (error) {
      console.error('Clear chat history error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // Lấy gợi ý từ chatbot (ví dụ: phở, pizza, sushi, cà phê)
  getSuggestions: async () => {
    try {
      const response = await apiClient.get('/chatbot/suggestions');
      return response.data;
    } catch (error) {
      console.error('Get chatbot suggestions error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // Tìm nhà hàng dựa trên query từ chatbot
  searchByQuery: async (query) => {
    try {
      const response = await apiClient.post('/chatbot/search', {
        query,
      });
      return response.data;
    } catch (error) {
      console.error('Chatbot search error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
};

export default apiClient;