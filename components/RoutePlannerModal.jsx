import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { chatbotAPI } from '../services/flaskApi';

const RoutePlannerModal = ({ visible, onClose, onRouteCreated }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      console.log('🔄 Modal opened, loading favorites...');
      loadFavorites();
      setSelectedIds([]);
    }
  }, [visible]);

  // Auto-refresh when user favorites change
  useEffect(() => {
    if (visible && user?.favorites) {
      console.log('🔄 User favorites changed, reloading...');
      loadFavorites();
    }
  }, [user?.favorites]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      console.log('📡 Calling chatbot/favorites-for-route...');
      const response = await chatbotAPI.getFavoritesForRoute();
      const restaurantList = response?.favorites || [];
      console.log(`✅ Loaded ${restaurantList.length} favorites`);
      console.log('First favorite:', restaurantList[0]); // Debug: check structure
      setFavorites(restaurantList);
    } catch (error) {
      console.error('Load favorites error:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (restaurantId) => {
    console.log('Toggle for ID:', restaurantId);
    console.log('Current selectedIds:', selectedIds);
    
    setSelectedIds((prev) => {
      const newSelection = prev.includes(restaurantId)
        ? prev.filter((id) => id !== restaurantId)
        : [...prev, restaurantId];
      
      console.log('New selectedIds:', newSelection);
      return newSelection;
    });
  };

  const handleCreateRoute = async () => {
    if (selectedIds.length < 2) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 2 quán để tạo lộ trình');
      return;
    }

    try {
      setCreating(true);
      console.log('📡 Creating route with restaurants:', selectedIds);
      
      // Get user location (if available)
      let userLocation = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const { coords } = await Location.getCurrentPositionAsync({});
          userLocation = {
            lat: coords.latitude,
            lon: coords.longitude,
          };
          console.log('📍 Including user location:', userLocation);
        }
      } catch (locError) {
        console.warn('⚠️ Could not get user location:', locError);
      }
      
      // Gọi chatbot API tạo route với user_location
      const routeData = await chatbotAPI.createRoute(selectedIds, userLocation);
      console.log('✅ Route created:', routeData);
      
      // Truyền dữ liệu route về parent component
      onRouteCreated(routeData);
      onClose();
    } catch (error) {
      console.error('Create route error:', error);
      Alert.alert('Lỗi', error.error || error.message || 'Không thể tạo lộ trình');
    } finally {
      setCreating(false);
    }
  };

  const renderRestaurantItem = ({ item }) => {
    const restaurantId = item.restaurant_id || item.id; // Fallback to item.id
    const isSelected = selectedIds.includes(restaurantId);
    
    console.log('Rendering item:', item.name, 'ID:', restaurantId, 'Selected:', isSelected);
    
    return (
      <TouchableOpacity
        style={[styles.restaurantItem, isSelected && styles.selectedItem]}
        onPress={() => {
          console.log('Toggle clicked for:', restaurantId);
          toggleSelection(restaurantId);
        }}
      >
        <View style={styles.checkboxContainer}>
          <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </View>

        <Image
          source={{ uri: item.image_url }}
          style={styles.restaurantImage}
        />

        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.restaurantAddress} numberOfLines={1}>
            {item.address}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating || '0.0'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tạo Lộ Trình</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                onPress={loadFavorites} 
                style={styles.refreshButton}
                disabled={loading}
              >
                <Ionicons name="refresh" size={24} color={loading ? "#ccc" : "#FF6347"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Chọn ít nhất 2 quán để tạo lộ trình tối ưu
          </Text>

          {/* Selection Counter */}
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              Đã chọn: {selectedIds.length} quán
            </Text>
          </View>

          {/* Restaurant List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6347" />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : favorites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-dislike-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có quán yêu thích</Text>
              <Text style={styles.emptySubtext}>
                Hãy thêm quán vào danh sách yêu thích để tạo lộ trình
              </Text>
            </View>
          ) : (
            <FlatList
              data={favorites}
              renderItem={renderRestaurantItem}
              keyExtractor={(item, index) => item.restaurant_id || item.id || `restaurant-${index}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              extraData={selectedIds}
            />
          )}

          {/* Create Route Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              (selectedIds.length < 2 || creating) && styles.createButtonDisabled,
            ]}
            onPress={handleCreateRoute}
            disabled={selectedIds.length < 2 || creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Tạo Lộ Trình</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  counterContainer: {
    backgroundColor: '#FFF4F4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  counterText: {
    fontSize: 14,
    color: '#FF6347',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  listContent: {
    paddingBottom: 10,
  },
  restaurantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedItem: {
    backgroundColor: '#FFF4F4',
    borderColor: '#FF6347',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#FF6347',
    borderColor: '#FF6347',
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  createButton: {
    backgroundColor: '#FF6347',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 15,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default RoutePlannerModal;
