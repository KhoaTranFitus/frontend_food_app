//flaskApi.jsx

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native'; // Cần import Alert để xử lý lỗi 401

// ============ CONFIG ============
// Auto-detect URL từ environment variable hoặc dùng default
const DEV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://172.20.10.5:5000/api'; 

const PROD_BASE_URL = 'https://your-production-server.com/api';

const BASE_URL = __DEV__ ? DEV_BASE_URL : PROD_BASE_URL;

console.log('API Base URL:', BASE_URL);

// Tạo instance axios
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 120s cho ngrok tunnel (map/routing cần nhiều thời gian)
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
      const token = response.data?.idToken || response.data?.token;
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }

      // LƯU THÔNG TIN USER (QUAN TRỌNG ĐỂ PROFILE HIỂN THỊ)
      if (response.data?.user) {
        console.log("Đang lưu user data:", response.data.user);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  logout: async () => {
    // Backend không có /auth/logout endpoint - chỉ xóa local storage
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user_data');
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

  googleLogin: async (idToken) => {
    try {
      const response = await apiClient.post('/google-login', {
        idToken,
      });
      
      const token = response.data?.user?.uid;
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }
      
      if (response.data?.user) {
        await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/forgot-password', {
        email,
      });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
};

// ============ USER PROFILE ENDPOINTS ============
export const userAPI = {
  // 1. Lấy thông tin User
  getProfile: async (userId) => {
    // Backend mình dùng route /favorite/view để lấy info user kèm danh sách yêu thích
    // Hoặc nếu bạn đã login, ta có thể lấy từ AsyncStorage.
    // Để chắc ăn, ta dùng dữ liệu lưu trong AsyncStorage khi Login thành công.
    try {
      const jsonValue = await AsyncStorage.getItem('user_data');
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      throw error;
    }
  },

  // 2. Cập nhật Tên và Avatar
  updateProfile: async (name, avatar_url) => {
    const uid = await getUserId();
    if (!uid) throw new Error("Không tìm thấy User ID");

    try {
      const response = await apiClient.post('/user/update-profile', {
        uid,
        name,
        avatar_url // Gửi chuỗi base64 hoặc link ảnh
      });

      // Cập nhật lại AsyncStorage để app hiển thị đúng ngay lập tức
      const currentUser = await userAPI.getProfile();
      const newUser = { ...currentUser, ...response.data.user };
      await AsyncStorage.setItem('user_data', JSON.stringify(newUser));

      return response.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },

  // 3. Đổi mật khẩu (Cần mật khẩu cũ)
  changePassword: async (oldPassword, newPassword) => {
    const uid = await getUserId();
    if (!uid) throw new Error("Không tìm thấy User ID");

    try {
      const response = await apiClient.post('/user/update-password', {
        uid,
        old_password: oldPassword,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },

  // 4. Đổi Email (Cần mật khẩu xác nhận)
  changeEmail: async (password, newEmail) => {
    const uid = await getUserId();
    if (!uid) throw new Error("Không tìm thấy User ID");

    try {
      const response = await apiClient.post('/user/update-email', {
        uid,
        password: password,
        new_email: newEmail
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },
};

// ============ RESTAURANT ENDPOINTS ============
export const restaurantAPI = {
  // GET /api/restaurants - Lấy tất cả nhà hàng
  getAll: async () => {
    try {
      const response = await apiClient.get('/restaurants');
      return response.data.restaurants || [];
    } catch (error) {
      console.error('Get all restaurants error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // GET /api/restaurants/search?q=<query> - Tìm kiếm đơn giản
  searchSimple: async (query) => {
    try {
      const response = await apiClient.get('/restaurants/search', {
        params: { q: query },
      });
      return response.data.restaurants || [];
    } catch (error) {
      console.error('Search restaurants error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // GET /api/restaurants/<id> - Lấy chi tiết nhà hàng (bao gồm menu)
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/restaurants/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get restaurant detail error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // POST /api/search - Tìm kiếm nâng cao với filters
  searchAdvanced: async (filters) => {
    try {
      const response = await apiClient.post('/search', filters);
      return response.data.places || [];
    } catch (error) {
      console.error('Advanced search error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // POST /api/restaurants/details-by-ids - Lấy nhiều nhà hàng theo IDs
  getDetailsByIds: async (ids) => {
    try {
      const response = await apiClient.post('/restaurants/details-by-ids', { ids });
      return response.data.restaurants || [];
    } catch (error) {
      console.error('Get details by IDs error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // GET /api/restaurants/nearby - Tìm nhà hàng gần
  getNearby: async (latitude, longitude, radius = 5000) => {
    try {
      const response = await apiClient.get('/restaurants/nearby', {
        params: { latitude, longitude, radius },
      });
      return response.data.restaurants || [];
    } catch (error) {
      console.error('Get nearby restaurants error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // GET /api/restaurants/category/<id> - Lấy theo category
  getByCategory: async (categoryId) => {
    try {
      const response = await apiClient.get(`/restaurants/category/${categoryId}`);
      return response.data.restaurants || [];
    } catch (error) {
      console.error('Get restaurants by category error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // POST /api/direction - Lấy hướng dẫn
  getDirections: async (origin, destination, mode = 'driving') => {
    try {
      const response = await apiClient.post('/direction', {
        origin,
        destination,
        mode,
      });
      return response.data;
    } catch (error) {
      console.error('Get directions error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // Alias cho tiện dụng - dùng cho home screen
  getAllRestaurants: async (query = '') => {
    try {
      if (query) {
        return await restaurantAPI.searchSimple(query);
      }
      return await restaurantAPI.getAll();
    } catch (error) {
      console.error('Get all restaurants alias error:', error);
      throw error;
    }
  },
};

// ============ FOOD/DISH ENDPOINTS ============
export const foodAPI = {
  // GET /api/foods?limit=<limit>
  getAll: async (limit = 50) => {
    try {
      const response = await apiClient.get('/foods', {
        params: { limit },
      });
      return response.data.foods || [];
    } catch (error) {
      console.error('Get foods error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // GET /api/foods/<id>
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/foods/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get food error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // GET /api/foods/search?q=<query>
  search: async (query) => {
    try {
      const response = await apiClient.get('/foods/search', {
        params: { q: query },
      });
      return response.data.foods || [];
    } catch (error) {
      console.error('Search foods error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // GET /api/foods/category/<id>
  getByCategory: async (categoryId) => {
    try {
      const response = await apiClient.get(`/foods/category/${categoryId}`);
      return response.data.foods || [];
    } catch (error) {
      console.error('Get foods by category error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // GET /api/foods/restaurant/<id>
  getByRestaurant: async (restaurantId) => {
    try {
      const response = await apiClient.get(`/foods/restaurant/${restaurantId}`);
      return response.data.foods || [];
    } catch (error) {
      console.error('Get foods by restaurant error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
};

// ============ FAVORITES ENDPOINTS ============
export const favoriteAPI = {
  // POST /api/favorite/toggle-restaurant (Authentication required)
  toggleRestaurantFavorite: async (restaurant_id) => {
    try {
      const response = await apiClient.post('/favorite/toggle-restaurant', {
        restaurant_id: String(restaurant_id), 
      });
      return response.data;
    } catch (error) {
      console.error('Toggle favorite restaurant error:', error.response?.data || error.message);
      throw error.response?.data || { error: error.message };
    }
  },
    
  // GET /api/favorite/view (Authentication required)
  getAll: async () => {
    try {
      const response = await apiClient.get('/favorite/view');
      return response.data;
    } catch (error) {
      console.error('Get favorites error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
};

// ============ REVIEWS/RATINGS ENDPOINTS ============
export const reviewAPI = {
  // POST /api/reviews (Authentication required)
  create: async (target_id, rating, comment, type = 'restaurant') => {
    try {
      const response = await apiClient.post('/reviews', {
        target_id: String(target_id),
        rating: Number(rating),
        comment,
        type,
      });
      return response.data;
    } catch (error) {
      console.error('Create review error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // GET /api/reviews/restaurant/<id>
  getByRestaurant: async (restaurantId) => {
    try {
      const response = await apiClient.get(`/reviews/restaurant/${restaurantId}`);
      return response.data.reviews || [];
    } catch (error) {
      console.error('Get restaurant reviews error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // GET /api/rating/<id>
  getRating: async (restaurantId) => {
    try {
      const response = await apiClient.get(`/rating/${restaurantId}`);
      return response.data.rating || 0;
    } catch (error) {
      console.error('Get rating error:', error);
      throw error.response?.data || { error: error.message };
    }
  },
};

// ============ CATEGORIES ENDPOINTS ============
export const categoryAPI = {
  // GET /api/categories
  getAll: async () => {
    try {
      const response = await apiClient.get('/categories');
      return response.data.categories || [];
    } catch (error) {
      console.error('Get categories error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // GET /api/categories/<id>
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

// ============ MAP & ROUTING ENDPOINTS ============
export const mapAPI = {
  // POST /api/map/filter
  filterMarkers: async (filters) => {
    try {
      const response = await apiClient.post('/map/filter', filters);
      return response.data.places || [];
    } catch (error) {
      console.error('Filter markers error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  // POST /api/get-route
  getRoute: async (start_lat, start_lon, end_lat, end_lon) => {
    try {
      const response = await apiClient.post('/get-route', {
        start_lat,
        start_lon,
        end_lat,
        end_lon,
      });
      return response.data.coordinates || [];
    } catch (error) {
      console.error('Get route error:', error);
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
      const response = await apiClient.delete('/chat/history');
      return response.data;
    } catch (error) {
      console.error('Clear chat history error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  getSuggestions: async () => {
    try {
      const response = await apiClient.get('/chat/suggestions');
      return response.data;
    } catch (error) {
      console.error('Get chatbot suggestions error:', error);
      throw error.response?.data || { error: error.message };
    }
  },

  searchByQuery: async (query) => {
    try {
      const response = await apiClient.post('/chat/search', {
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
