// config/api.js
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Tự động detect backend URL dựa trên môi trường
 */
const getBackendUrl = () => {
  // 1. Ưu tiên dùng ENV variable nếu có
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    // Loại bỏ /api nếu có trong env
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/api$/, '');
  }

  // 2. Nếu có manifest.debuggerHost (đang dev với Expo)
  const debuggerHost = Constants.expoConfig?.hostUri
    ? Constants.expoConfig.hostUri.split(':').shift()
    : null;

  if (debuggerHost) {
    return `http://${debuggerHost}:5000`;
  }

  // 3. Fallback cho các trường hợp khác
  if (Platform.OS === 'android') {
    // Android emulator
    return 'http://10.0.2.2:5000';
  }

  if (Platform.OS === 'ios') {
    // iOS simulator
    return 'http://localhost:5000';
  }

  // 4. Default fallback (máy thật trong cùng mạng)
  return 'http://172.20.10.7:5000'; // IP backend hiện tại
};

export const BACKEND_API = getBackendUrl();

console.log('🔗 Backend API URL:', BACKEND_API);
