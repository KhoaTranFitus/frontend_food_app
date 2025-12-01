import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============ CONFIG ============
// Auto-detect URL từ environment variable hoặc dùng default
const DEV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
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
    if (error.response?.status === 401) {
      // Token hết hạn hoặc invalid
      await AsyncStorage.removeItem('authToken');
      // TODO: Navigate về LoginScreen
    }

    // Xử lý các loại lỗi khác nhau
    if (!error.response) {
      // Network error - in ra chi tiết
      console.error('❌ Network error:', error.message);
      console.error('🔗 API URL:', BASE_URL);
      error.message = 'Lỗi kết nối. Kiểm tra:\n1. Backend có đang chạy không?\n2. IP đúng không? (' + BASE_URL + ')\n3. Device có cùng WiFi không?';
    } else if (error.response.status === 500) {
      error.message = 'Lỗi server: ' + (error.response.data?.error || 'Unknown error');
    } else if (error.response.data?.error) {
      // Giữ lỗi từ backend
      error.message = error.response.data.error;
    }

    return Promise.reject(error);
  }
);

// ============ AUTHENTICATION ENDPOINTS ============
export const authAPI = {
  register: async (email, password, name) => {
    try {
      const response = await apiClient.post('/register', {
        email,
        password,
        name,
      });
      
      // Lưu token - backend có thể trả token, idToken, hoặc không trả
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
      const response = await apiClient.post('/login', {
        email,
        password,
      });
      
      // Lưu token - backend có thể trả token, idToken, hoặc không trả
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

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await AsyncStorage.removeItem('authToken');
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await apiClient.put('/auth/change-password', {
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
      const response = await apiClient.post('/auth/reset-password', {
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
      const response = await apiClient.post('/verify', {
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
      const response = await apiClient.post('/auth/refresh');
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
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/users/profile', userData);
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

      const response = await apiClient.post('/users/avatar', formData, {
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
      const response = await apiClient.delete('/users/account');
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
      const response = await apiClient.get('/restaurants', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Get restaurants error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/restaurants/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get restaurant error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  search: async (query) => {
    try {
      const response = await apiClient.get('/restaurants/search', {
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
      const response = await apiClient.get('/restaurants/nearby', {
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
      const response = await apiClient.get(`/restaurants/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Get restaurants by category error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
};

// ============ FOOD/DISH ENDPOINTS ============
export const foodAPI = {
  getAll: async (filters = {}) => {
    try {
      const response = await apiClient.get('/foods', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Get foods error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/foods/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get food error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  search: async (query) => {
    try {
      const response = await apiClient.get('/foods/search', {
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
      const response = await apiClient.get(`/foods/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Get foods by category error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getByRestaurant: async (restaurantId) => {
    try {
      const response = await apiClient.get(`/foods/restaurant/${restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Get foods by restaurant error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
};

// ============ FAVORITES ENDPOINTS ============
export const favoriteAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/favorites');
      return response.data;
    } catch (error) {
      console.error('Get favorites error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

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
      const response = await apiClient.get(`/reviews/restaurant/${restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Get restaurant reviews error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getByFood: async (foodId) => {
    try {
      const response = await apiClient.get(`/reviews/food/${foodId}`);
      return response.data;
    } catch (error) {
      console.error('Get food reviews error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  create: async (reviewData) => {
    try {
      const response = await apiClient.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Create review error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  update: async (id, reviewData) => {
    try {
      const response = await apiClient.put(`/reviews/${id}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Update review error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/reviews/${id}`);
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