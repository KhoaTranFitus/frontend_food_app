import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Share, 
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { favoriteAPI, restaurantAPI } from "../services/flaskApi"; 

const COLORS = {
  BACKGROUND: '#9a0e0eff', PRIMARY_TEXT: '#111111', SECONDARY_TEXT: '#333333',  
  ACCENT: '#ff6347', BORDER: '#EEEEEE', STAR: '#FFC300', FAV_RED: '#FF3B30', FAV_GRAY: '#CCCCCC',
};

// ⭐️ KHAI BÁO ẢNH PLACEHOLDER CỤC BỘ (Fix lỗi ảnh) ⭐️
const PLACEHOLDER_IMAGE = require("../assets/amthuc.jpg"); 

// KHỐI CODE GIẢ ĐỊNH ĐỂ TEST LỌC (Cần thiết cho quá trình dev/test)
const FULL_RESTAURANT_DETAILS_MOCK = [
    // Giữ lại mock data
    { id: "ChIJEzXHbEcvdTERYJU-jigOumI", name: "Haidilao Van Hanh Mall", image_url: "URL:", price_range: "100,000đ", rating: 5.0, address: "Tầng4 Vạn Hạnh Mall", current_rating: 4.8 }, 
    { id: "ChIJqSUY9d8udTER3gWPfy0eMms", name: "Quán Ốc Như", image_url: "URL:", price_range: "80,000đ", rating: 4.2, address: "650/4/29D Điện Biên Phủ", current_rating: 4.2 },
    { id: "ChIJxQUjKtsudTERO_KVgjmipAk", name: "Làng Nướng Nam Bộ", image_url: "URL:", price_range: "150,000đ", rating: 4.2, address: "302A Tô Hiến Thành", current_rating: 4.1 },
    { id: "ChIJVcppq_MvdTER0YBMRQb1kMQ", name: "The Gangs Urban", image_url: "URL:", price_range: "110,000đ", rating: 4.3, address: "212 Lý Thái Tổ", current_rating: 4.35 }, 
    { id: "ChIJEdqbuz0vdTERee2glMx18r0", name: "Mì Cay Xíu", image_url: "URL:", price_range: "65,000đ", rating: 3.0, address: "92/41/1, Tôn Thất Thuyết", current_rating: 3.7 },
];

// ⭐️ [ĐÃ LOẠI BỎ] Component StarRating ⭐️


const FavoriteItem = ({ item, navigation, onToggleLike }) => {
  const handlePress = () => {
    // Truyền item, bao gồm cả điểm rating gốc và điểm current_rating (nếu backend cung cấp)
    navigation.navigate('RestaurantDetail', { item }); 
  };
  
  // LOGIC FIX LỖI ẢNH 
  const imageSource = (item.image_url && item.image_url !== "URL:") 
    ? { uri: item.image_url } 
    : PLACEHOLDER_IMAGE; 

  return (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={handlePress} 
    >
      {/* SỬ DỤNG LOGIC FIX LỖI ẢNH */}
      <Image source={imageSource} style={styles.itemImage} />
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.row}>
          
          {/* ⭐️ [ĐÃ LOẠI BỎ] Hiển thị Rating/Sao ⭐️
          <Text style={styles.itemRating}>{displayRating.toFixed(1)}</Text>
          <Text style={styles.dot}>•</Text> 
          */}

          <Text style={styles.itemPrice}>{item.price_range}</Text> 
        </View>
        <Text style={styles.itemDistance}>{item.address}</Text> 
      </View>
      <TouchableOpacity 
        style={styles.heartIcon} 
        onPress={() => onToggleLike(item.id)}
      >
        <Ionicons 
          name={"heart"} 
          size={24} 
          color={COLORS.FAV_RED} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function FavoriteScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isLoading, updateUser } = useAuth(); 
  
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [error, setError] = useState(null);

  // HÀM TẢI VÀ LỌC CHI TIẾT FAVORITES
  const fetchDetailedFavorites = useCallback(async () => {
    if (!user || !user.favorites) { 
      setFavoriteItems([]);
      setLoadingDetails(false);
      return;
    }
    
    setLoadingDetails(true);
    setError(null);
    
    const favoriteIds = user.favorites.map(String) || [];

    try {
        // ⭐️ GỌI API THẬT SỰ ĐỂ LẤY CHI TIẾT DỰA TRÊN IDS ⭐️
        const detailedList = await restaurantAPI.getDetailsByIds(favoriteIds); 
        
        setFavoriteItems(detailedList);
        
    } catch (e) {
        // Nếu API thất bại (ví dụ: lỗi 500 hoặc Network Error), ta sẽ fallback dùng Mock Data
        console.error("Lỗi tải chi tiết Favorites từ API:", e);
        
        // ⭐️ FALLBACK KHI API THẤT BẠI ⭐️
        const fallbackList = FULL_RESTAURANT_DETAILS_MOCK.filter(r => favoriteIds.includes(r.id));
        setFavoriteItems(fallbackList);
        setError("Lỗi kết nối Backend, đang hiển thị dữ liệu cục bộ.");

    } finally {
        setLoadingDetails(false);
    }
  }, [user?.favorites]);

  useEffect(() => {
    fetchDetailedFavorites();
  }, [fetchDetailedFavorites]);


  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Tôi đã tìm thấy những món ăn yêu thích này! Xem ngay ứng dụng của tôi: [Link App giả định]',
        url: 'https://your-app-link.com/favorites',
        title: 'Món ăn yêu thích',
      });
    } catch (error) {
      console.warn('Lỗi chia sẻ:', error.message);
    }
  };
  
  // HÀM XỬ LÝ XÓA YÊU THÍCH (Chạy API toggle)
  const handleToggleFavorite = async (restaurantId) => {
      try {
          const result = await favoriteAPI.toggleRestaurantFavorite(restaurantId);
          
          updateUser({ ...user, favorites: result.favorites }); 
          
          Alert.alert("Cập nhật", result.message);
      } catch (e) {
          Alert.alert("Lỗi", e.error || "Không thể xóa yêu thích.");
      }
  };


  // --- RENDERING LIST ---
  
  const renderList = () => {
      if (loadingDetails || isLoading) {
          return (
              <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.ACCENT} />
                  <Text style={styles.loadingText}>Đang tải danh sách...</Text>
              </View>
          );
      }
      
      if (error) {
          return <Text style={styles.errorText}>Đã xảy ra lỗi: {error}</Text>;
      }

      if (favoriteItems.length === 0) {
          return (
              <View style={styles.emptyContainer}>
                  <Ionicons name="sad-outline" size={50} color={COLORS.SECONDARY_TEXT} />
                  <Text style={styles.emptyText}>Chưa có nhà hàng nào trong danh sách yêu thích.</Text>
                  <TouchableOpacity 
                    style={[styles.exploreBtn, styles.emptyExploreBtn]} 
                    onPress={() => navigation.navigate('HomeStack', { screen: 'Home' })}
                  > 
                    <Text style={styles.exploreText}>Khám phá ngay</Text>
                  </TouchableOpacity>
              </View>
          );
      }

      return (
        <FlatList
          data={favoriteItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FavoriteItem item={item} navigation={navigation} onToggleLike={handleToggleFavorite} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      <View style={styles.redHeader}>
        <Text style={styles.screenTitle}>Món Yêu Thích</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            placeholder="Tìm trong danh sách..."
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.whiteSection}>
        
        <View style={styles.headerRow}>
          <Text style={styles.title}>{favoriteItems.length} Nhà hàng đã lưu</Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('HomeStack', { screen: 'Home' })}>
              <Ionicons name="cloud-upload-outline" size={22} color="#333" />
              <Text style={styles.actionText}>Thêm</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Feather name="share-2" size={22} color="#333" />
              <Text style={styles.actionText}>Chia sẻ</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {renderList()}
        
      </View>
      <View style={{ height: insets.bottom, backgroundColor: '#fff' }} /> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND, 
  },
  
  redHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },
  whiteSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    overflow: 'hidden', 
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#111",
  },
  actionRow: {
    flexDirection: "row",
    gap: 15,
  },
  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 100, 
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  // ⭐️ [ĐÃ SỬA] Loại bỏ marginleft vì không còn sao/điểm số bên trái
  itemRating: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    // marginLeft: 4, <-- Đã loại bỏ
  },
  dot: {
    marginHorizontal: 6,
    color: "#999",
  },
  itemPrice: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  itemDistance: {
    fontSize: 12,
    color: "#888",
  },
  heartIcon: {
    padding: 5,
  },
  exploreBtn: {
    position: "absolute",
    backgroundColor: COLORS.ACCENT,
    borderRadius: 12,
    paddingVertical: 14,   //Chỉnh chữ khám phá
    alignItems: "center",
    elevation: 5,
    shadowColor: COLORS.ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  exploreText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.SECONDARY_TEXT,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 250,
    paddingHorizontal: 30,
    paddingTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.SECONDARY_TEXT,
    marginTop: 15,
    marginBottom: 20,
  },
  emptyExploreBtn: {
    position: 'relative',
    bottom: 0,
    width: '100%',
    marginTop: 20,
  },
  errorText: {
      textAlign: 'center',
      color: COLORS.FAV_RED,
      marginTop: 20,
      fontSize: 16,
  },
});