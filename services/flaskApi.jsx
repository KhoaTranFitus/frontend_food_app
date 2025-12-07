//flaskApi.jsx

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native'; // Cần import Alert để xử lý lỗi 401

// ============ CONFIG ============
// Auto-detect URL từ environment variable hoặc dùng default
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

    // Log outbound request payload without leaking auth header
    const { method, url, params, data } = config;
    console.log('API request ->', method?.toUpperCase(), url, {
      params,
      data,
    });
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
      await AsyncStorage.removeItem('authToken');
      Alert.alert("Phiên hết hạn", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    if (!error.response) {
      // Network error - in ra chi tiết
      console.error('Network error:', error.message);
      console.error('Error details:', error);
      console.error('API URL:', BASE_URL);
      error.message = 'Lỗi kết nối. Kiểm tra:\n1. Backend có đang chạy không?\n2. IP đúng không? (' + BASE_URL + ')\n3. Device có cùng WiFi không?';
    } else if (status === 500) {
      error.message = 'Lỗi server: ' + (error.response.data?.error || 'Unknown error');
    } else if (error.response.data?.error) {
      error.message = error.response.data.error;
    }

    return Promise.reject(error);
  }
);

const getUserId = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem('user_data');
        const user = jsonValue != null ? JSON.parse(jsonValue) : null;
        return user?.uid || null;
    } catch (e) { return null; }
};

// ============ AUTHENTICATION ENDPOINTS ============
export const authAPI = {
  register: async (email, password, name) => {
    try {
      const response = await apiClient.post('/user/register', {
        email, password, name,
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
      const response = await apiClient.post('/user/login', {
        email,
        password,
      });
      
      // Lưu token - backend có thể trả token, idToken, hoặc không trả
            const token = response.data?.idToken || response.data?.token;
            if (token) {
                await AsyncStorage.setItem('authToken', token);
            }

            // 2. LƯU THÔNG TIN USER (QUAN TRỌNG ĐỂ PROFILE HIỂN THỊ)
            if (response.data?.user) {
                console.log("Đang lưu user data:", response.data.user); // Log để kiểm tra
                await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
            }
            // ----------------------------------

            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error.response?.data || { error: error.message };
        }
    },


  getProfile: async () => {
    try {
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
  // ⭐️ MODIFIED: Changed endpoint từ '/restaurants' sang '/restaurants/search' ⭐️
  // Đây là endpoint được sử dụng cho tìm kiếm có lọc (query, lat, lon)
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

  getAllRestaurants: async (query = '') => {
    try {
      const endpoint = query ? `/food/restaurants/search?q=${query}` : '/food/restaurants';
      const response = await apiClient.get(endpoint);
      
      return response.data.restaurants; 
      
    } catch (error) {
      console.error('Get all restaurants error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
      
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
      console.error('Get foods error:`', error);
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
  toggleRestaurantFavorite: async (restaurant_id) => {
    try {
      const response = await apiClient.post('/user/favorite/toggle-restaurant', {
        restaurant_id: String(restaurant_id), 
      });
      return response.data;
    } catch (error) {
      console.error('Toggle favorite restaurant error:', error.response?.data || error.message);
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
  // ⭐️ [MỚI] Hàm GET Rating nhanh ⭐️
  getRating: async (restaurantId) => {
    try {
      const response = await apiClient.get(`/food/rating/${restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Get single rating error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getByRestaurant: async (restaurantId) => {
    try {
      const response = await apiClient.get(`/food/reviews/restaurant/${restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Get restaurant reviews error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getByFood: async (foodId) => {
    try {
      const response = await apiClient.get(`/food/reviews/food/${foodId}`);
      return response.data;
    } catch (error) {
      console.error('Get food reviews error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  create: async (reviewData) => {
    try {
      const response = await apiClient.post('/food/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Create review error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  update: async (id, reviewData) => {
    try {
      const response = await apiClient.put(`/food/reviews/${id}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Update review error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  delete: async (reviewId) => {
    try {
      // Đảm bảo reviewId là chuỗi và đã được làm sạch
      const cleanReviewId = String(reviewId).trim(); 
      const response = await apiClient.delete(`/food/reviews/${cleanReviewId}`);
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
  // Gửi tin nhắn và nhận phản hồi từ chatbot OpenAI
  sendMessage: async (message, conversationId = null) => {
    try {
      const response = await apiClient.post('/chat', {
        message: message,
        conversation_id: conversationId, // Giữ conversation để có context
      });
      
      // Backend trả về: { conversation_id, user_message, bot_response, timestamp }
      return response.data;
    } catch (error) {
      console.error('Send chatbot message error:', error);
      
      // Xử lý lỗi cụ thể
      if (error.response?.status === 500 && error.response?.data?.error?.includes('API key')) {
        throw { error: '⚠️ Backend chatbot chưa cấu hình OpenAI API key. Vui lòng kiểm tra file .env' };
      }
      
      throw error.response?.data || { error: error.message };
    }
  },

  // Kiểm tra trạng thái chatbot
  checkStatus: async () => {
    try {
      const response = await apiClient.get('/chat/status');
      return response.data;
    } catch (error) {
      console.error('Check chatbot status error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // Lấy lịch sử chat của user
  getChatHistory: async (conversationId) => {
    try {
      const response = await apiClient.get(`/chat/history/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Get chat history error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  clearChatHistory: async () => {
    try {
      const response = await apiClient.delete('/chatbot/history');
      return response.data;
    } catch (error) {
      console.error('Clear chat history error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getSuggestions: async () => {
    try {
      const response = await apiClient.get('/chatbot/suggestions');
      return response.data;
    } catch (error) {
      console.error('Get chatbot suggestions error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

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
