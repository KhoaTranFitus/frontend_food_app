import React, { useState, useEffect, useCallback } from 'react'; 
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { getRoute } from '../services/tomtomApi.jsx';
import { Ionicons } from '@expo/vector-icons';
// BỔ SUNG IMPORTS: useAuth, favoriteAPI VÀ reviewAPI
import { useAuth } from '../context/AuthContext'; 
import { favoriteAPI, reviewAPI } from '../services/flaskApi'; 


// ⭐️ ĐỊNH NGHĨA MÀU SẮC (Đồng bộ) ⭐️
const COLORS = {
  BACKGROUND: '#9a0e0eff',      // Màu nền đỏ sẫm (giống Home Header)
  CARD_BACKGROUND: '#FFFFFF', // Nền nội dung (Trắng)
  PRIMARY_TEXT: '#111111',    
  SECONDARY_TEXT: '#333333',  
  ACCENT: '#ff6347',          // Màu nhấn: Cam đỏ (giống Home/Favorite)
  BORDER: '#EEEEEE',          // Viền nhạt
  STAR: '#FFC300',            
  FAV_RED: '#FF3B30',         
  FAV_GRAY: '#CCCCCC',        
};

const AVATAR_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF6', '#A133FF'];

// ⭐️ [SỬA] HÀM TẠO MÀU CỐ ĐỊNH DỰA TRÊN USER ID (Deterministic Hashing) ⭐️
const getDeterministicAvatarColor = (userId) => {
    if (!userId) return AVATAR_COLORS[0];
    // Tạo mã hash đơn giản bằng cách tính tổng mã ASCII và lấy modulo
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};


const MENU_IMAGES = [
  { id: "1", name: "Beef Wellington", image: require("../assets/beef.jpg") },
  { id: "2", name: "Cơm Tấm", image: require("../assets/comtam.jpg") },
  { id: "3", name: "Bún Cá Cay", image: require("../assets/buncacay.jpg") }, 
  { id: "4", name: "Capuchino", image: require("../assets/coffee.jpg") },
];

// ⭐️ COMPONENT NÚT TIM NỔI (OVERLAY) ⭐️
const FavoriteButton = ({ isFavorited, onToggle, loading }) => (
  <TouchableOpacity 
      style={styles.favoriteButton}
      onPress={onToggle}
      disabled={loading}
  >
    {loading ? (
      <ActivityIndicator size="small" color={isFavorited ? COLORS.FAV_RED : COLORS.FAV_GRAY} />
    ) : (
      <Ionicons
        name={isFavorited ? "heart" : "heart-outline"}
        size={30}
        color={isFavorited ? COLORS.FAV_RED : COLORS.FAV_GRAY}
      />
    )}
  </TouchableOpacity>
);

// COMPONENT NÚT BACK NỔI (OVERLAY)
const BackButton = ({ onGoBack }) => (
    <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={32} color={COLORS.ACCENT} />
    </TouchableOpacity>
);


export default function RestaurantDetailScreen({ route, navigation }) {
  // Lấy user và hàm cập nhật từ AuthContext
  const { user, updateUser } = useAuth();
  const { item } = route.params || {};
  
  const [userLoc, setUserLoc] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // KHAI BÁO STATE FAVORITES VÀ LOGIC
  const restaurantId = String(item?.id || ''); 
  
  const isFavoritedInitial = user?.favorites?.includes(restaurantId);
  const [isFavorite, setIsFavorite] = useState(isFavoritedInitial || false); 
  const [loadingFavorite, setLoadingFavorite] = useState(false); 
  
  const [reviews, setReviews] = useState([]); 
  const [userRating, setUserRating] = useState(0); 
  const [userComment, setUserComment] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // ⭐️ [SỬA] State để lưu điểm rating sau khi tính toán (dùng điểm ban đầu) ⭐️
  const [currentRating, setCurrentRating] = useState(parseFloat(item?.rating) || 0);

  // [SỬA] Hàm fetch reviews VÀ rating
  const fetchReviews = useCallback(async () => {
      try {
          // 1. Tải đánh giá
          const result = await reviewAPI.getByRestaurant(restaurantId); 
          const loadedReviews = result.reviews || [];
          
          const reviewsWithColors = loadedReviews.map(r => ({
              ...r,
              // ⭐️ SỬ DỤNG LOGIC MÀU CỐ ĐỊNH ⭐️
              avatarColor: getDeterministicAvatarColor(r.user_id), 
              avatarUrl: r.avatar_url,
              rating: parseInt(r.rating) 
          }));
          
          // Sắp xếp theo timestamp (mới nhất lên đầu)
          reviewsWithColors.sort((a, b) => b.timestamp - a.timestamp);
          setReviews(reviewsWithColors);

          // 2. ⭐️ CẬP NHẬT ĐIỂM RATING TỪ PHẢN HỒI BACKEND (current_rating) ⭐️
          if (result.current_rating !== undefined && result.current_rating !== null) {
              const fetchedRating = parseFloat(result.current_rating);
              setCurrentRating(fetchedRating);
              console.log("✅ RATING TỪ SERVER:", fetchedRating); 
          }
          
      } catch (e) {
          console.error("Failed to fetch reviews:", e);
      }
  }, [restaurantId]);


  // ⭐️ [SỬA] Tải Vị trí người dùng VÀ Tải Đánh giá khi màn hình load ⭐️
  useEffect(() => {
    (async () => {
      // 1. Tải Vị trí người dùng (Giữ nguyên)
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        setUserLoc({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
      
      // 2. Tải Đánh giá
      if (restaurantId) {
          fetchReviews();
      }
    })();
  }, [restaurantId, fetchReviews]); // Thêm fetchReviews làm dependency


  
  // Đồng bộ trạng thái isFavorite với state user khi nó thay đổi
  useEffect(() => {
    const currentStatus = user?.favorites?.includes(restaurantId);
    setIsFavorite(currentStatus || false);
  }, [user?.favorites, restaurantId]);


  // HÀM XỬ LÝ KHI NHẤN NÚT TIM (GỌI API)
  const handleToggleFavorite = async () => {
      if (!user) {
          Alert.alert("Lỗi", "Vui lòng đăng nhập để sử dụng tính năng này.");
          return;
      }
      if (loadingFavorite) return;

      setLoadingFavorite(true);
      try {
          // Gọi API toggle restaurant
          const result = await favoriteAPI.toggleRestaurantFavorite(restaurantId);
          
          // Cập nhật favorites mới vào state user trong AuthContext
          updateUser({ ...user, favorites: result.favorites }); 
          
          Alert.alert("Thành công", result.message);
      } catch (e) {
          Alert.alert("Lỗi", e.error || "Không thể cập nhật yêu thích.");
          console.error("Favorite Toggle Error:", e);
      } finally {
          setLoadingFavorite(false);
      }
  };


  const handleGoBack = () => {
      navigation.goBack();
  };


  // ⭐️ HÀM CHỈ ĐƯỜNG: TRUYỀN TỌA ĐỘ NHÀ HÀNG SANG MAPSCREEN ⭐️
  const handleNavigate = () => {
    if (!item?.position) {
      Alert.alert('Lỗi', 'Không có tọa độ nhà hàng');
      return;
    }
    navigation.navigate('Map', {
      destination: {
        latitude: item.position.lat,
        longitude: item.position.lon,
      },
    });
  };
  
  // ⭐️ LOGIC GỬI REVIEW ĐÃ ĐƯỢC CẬP NHẬT GỌI API THỰC TẾ ⭐️
  const handleSubmitReview = async () => {
    if (!user) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để gửi đánh giá.");
      return;
    }
    if (userRating === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn số sao đánh giá.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
        // Gọi API để gửi đánh giá với đúng thứ tự tham số
        const result = await reviewAPI.create(
            restaurantId,    // target_id
            userRating,      // rating
            userComment,     // comment
            'restaurant'     // type
        ); 
        
        // ⭐️ TẠO ĐỐI TƯỢNG REVIEW VỚI AVATAR VÀO LIST ⭐️
        const newReview = {
            id: result.review.id,
            user_id: result.review.user_id, 
            username: result.review.username,
            rating: result.review.rating,
            comment: result.review.comment || 'Không có bình luận',
            date: result.review.date,
            // ⭐️ Dùng logic màu cố định/url từ response ⭐️
            avatarColor: result.review.avatar_url ? null : getDeterministicAvatarColor(result.review.user_id), 
            avatarUrl: result.review.avatar_url,
            timestamp: result.review.timestamp,
        };

        // Cập nhật reviews List (Thêm đánh giá mới lên đầu)
        setReviews([newReview, ...reviews]);
        
        // CẬP NHẬT ĐIỂM RATING TỪ PHẢN HỒI BACKEND
        const newRating = result.review.new_restaurant_rating;
        if (newRating !== undefined && newRating !== null) {
            const finalNewRating = parseFloat(newRating);
            setCurrentRating(finalNewRating);
            console.log("✅ RATING TỪ POST (CẬP NHẬT LOCAL):", finalNewRating);
        }
        
        // Reset form
        setUserRating(0);
        setUserComment('');
        
        Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi.');

    } catch (e) {
        Alert.alert("Lỗi", e.error || "Không thể gửi đánh giá. Vui lòng thử lại.");
        console.error("Submit Review Error:", e);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  // ⭐️ [MỚI] HÀM XỬ LÝ XÓA REVIEW ⭐️
  const handleDeleteReview = (reviewId) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa đánh giá này không?",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setLoading(true); // Dùng loading chung cho toàn màn hình tạm thời
            try {
              const result = await reviewAPI.delete(reviewId); // Gọi API DELETE
              
              // Cập nhật state: Xóa review khỏi danh sách
              setReviews(reviews.filter(r => r.id !== reviewId));
              
              // Cập nhật điểm rating nếu có
              const newRating = result.new_restaurant_rating;
              if (newRating !== undefined && newRating !== null) {
                setCurrentRating(parseFloat(newRating));
              }

              Alert.alert("Thành công", "Đánh giá đã được xóa.");
            } catch (e) {
              Alert.alert("Lỗi", e.error || "Không thể xóa đánh giá.");
              console.error("Delete Review Error:", e);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // Hàm renderMenuItem giữ nguyên
  const renderMenuItem = ({ item }) => (
    <TouchableOpacity 
        style={styles.menuCard} 
        onPress={() => navigation.navigate('FoodDetail', { item })} 
    >
        <Image source={item.image} style={styles.menuImage} />
        <Text style={styles.menuFoodName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // ⭐️ [SỬA] RENDER RATING: Áp dụng logic làm tròn mới ⭐️
  const renderRating = () => {
    const finalRating = parseFloat(currentRating) || 0; 
    
    let ratingValue;
    // ⭐️ LOGIC LÀM TRÒN TÙY CHỈNH ⭐️
    if (finalRating >= 4.8) {
        ratingValue = 5;
    } else if (finalRating >= 4.0) {
        ratingValue = 4;
    } else if (finalRating >= 3.0) {
        ratingValue = 3;
    } else if (finalRating >= 2.0) {
        ratingValue = 2;
    } else if (finalRating >= 1.0) {
        ratingValue = 1;
    } else {
        ratingValue = 0;
    }
     
    return (
      <Text style={styles.ratingText}>
        <Text style={{ color: COLORS.STAR }}>
          {Array(ratingValue).fill('★').join('')}
        </Text>
        <Text style={{ color: COLORS.SECONDARY_TEXT }}>
          {Array(5 - ratingValue).fill('★').join('')}
        </Text>
        {/* HIỂN THỊ ĐIỂM SỐ CHÍNH XÁC */}
        <Text style={{ color: COLORS.PRIMARY_TEXT, fontWeight: 'bold' }}> ({finalRating.toFixed(1)})</Text> 
      </Text>
    );
  };
  
  // ⭐️ [MỚI] COMPONENT RENDER TỪNG REVIEW ⭐️
  const renderReviewItem = (review) => {
      const isOwner = user?.uid === review.user_id; // Kiểm tra quyền sở hữu
      
      const avatarSource = review.avatarUrl 
        ? { uri: review.avatarUrl } 
        : null;

      return (
          <View key={review.id} style={styles.reviewItem}>
              
              <View style={styles.userHeader}>
                  {/* AVATAR */}
                  {avatarSource ? (
                      <Image source={avatarSource} style={styles.avatarImage} />
                  ) : (
                      <View style={[
                          styles.avatar, 
                          { backgroundColor: review.avatarColor || '#CCCCCC' } // Sử dụng màu cố định
                      ]}>
                          <Text style={styles.avatarText}>{review.username[0]}</Text>
                      </View>
                  )}
                  
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.reviewUser}>
                          {review.username} - {review.date}
                      </Text>
                      
                      {/* NÚT XÓA (CHỈ HIỆN THỊ CHO CHÍNH CHỦ) */}
                      {isOwner && (
                          <TouchableOpacity onPress={() => handleDeleteReview(review.id)} style={styles.deleteButton}>
                              <Ionicons name="trash-outline" size={20} color={COLORS.FAV_RED} />
                          </TouchableOpacity>
                      )}
                  </View>
              </View>
              
              <Text style={styles.reviewRatingStars}>
                  <Text style={{ color: COLORS.STAR }}>
                      {Array(review.rating).fill('★').join('')}
                  </Text>
                  <Text style={{ color: COLORS.SECONDARY_TEXT }}>
                      {Array(5 - review.rating).fill('★').join('')}
                  </Text>
              </Text>
              <Text style={styles.reviewComment}>{review.comment}</Text>
          </View>
      );
  };


  const initialRegion = item?.lat && item?.lon
    ? {
        latitude: item.lat,
        longitude: item.lon,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
    : null;

  if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.ACCENT} />
          <Text>Đang xử lý...</Text>
        </View>
      );
  }

  return (
    // ⭐️ SỬ DỤNG SafeAreaView LÀM CONTAINER GỐC ⭐️
    <SafeAreaView style={styles.container}>
        
        {/* NÚT QUAY LẠI VÀ NÚT TIM ĐỀU DÙNG POSITION: ABSOLUTE NỔI TRÊN UI */}
        <BackButton onGoBack={handleGoBack} />
        <FavoriteButton 
            isFavorited={isFavorite} 
            onToggle={handleToggleFavorite} 
            loading={loadingFavorite}
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
            <Image source={item?.image || require('../assets/amthuc.jpg')} style={styles.headerImage} />

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{item?.name || 'Tên Nhà Hàng'}</Text>
                    {/* Nút tim đã được di chuyển ra ngoài */}
                </View>
                
                <View style={styles.infoRow}>
                    {renderRating()}
                    <Text style={styles.sub}> • Giờ mở cửa: {item?.open_hours || '09:00 - 22:00'}</Text>
                </View>

                <Text style={styles.sub}>Địa chỉ: {item?.address || 'Địa chỉ không có'}</Text>

                <TouchableOpacity style={styles.cta} onPress={handleNavigate}>
                    <Text style={styles.ctaText}>Chỉ đường</Text>
                </TouchableOpacity>

                {/* MENU */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuHeader}>Menu</Text>
                    <FlatList
                      data={MENU_IMAGES} 
                      keyExtractor={(i) => i.id}
                      numColumns={2}
                      columnWrapperStyle={styles.menuRow}
                      showsVerticalScrollIndicator={false}
                      scrollEnabled={false}
                      renderItem={renderMenuItem}
                    />
                </View>
                
                {/* BẢN ĐỒ */}
                <View style={styles.mapSection}>
                    <Text style={styles.mapHeader}>Vị trí Nhà hàng</Text>
                    {initialRegion ? (
                        <MapView
                            style={styles.map}
                            provider="google"
                            initialRegion={initialRegion}
                            showsUserLocation={true}
                        >
                            <Marker coordinate={{ latitude: item.lat, longitude: item.lon }} title={item.name} />
                        </MapView>
                    ) : (
                        <Text style={{color: COLORS.SECONDARY_TEXT}}>Không tìm thấy vị trí bản đồ.</Text>
                    )}
                </View>

                {/* ĐÁNH GIÁ */}
                <View style={styles.reviewSection}>
                    <Text style={styles.reviewHeader}>Đánh giá của khách hàng</Text>
                    
                    <View style={styles.ratingForm}>
                        <View style={styles.starContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity 
                                key={star} 
                                onPress={() => setUserRating(star)}
                                disabled={isSubmitting}
                                >
                                <Text style={[styles.star, { color: star <= userRating ? COLORS.STAR : COLORS.SECONDARY_TEXT }]}>
                                    ★
                                </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                        <Text style={styles.formLabel}>Bình luận (Tùy chọn):</Text>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Chia sẻ trải nghiệm của bạn..."
                            placeholderTextColor={COLORS.SECONDARY_TEXT}
                            multiline
                            value={userComment}
                            onChangeText={setUserComment}
                            editable={!isSubmitting}
                        />

                        <TouchableOpacity 
                            style={[styles.submitButton, isSubmitting || userRating === 0 ? styles.disabledButton : {}]} 
                            onPress={handleSubmitReview}
                            disabled={isSubmitting || userRating === 0}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={COLORS.CARD_BACKGROUND} />
                            ) : (
                                <Text style={styles.submitText}>Gửi Đánh giá</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.reviewHeader}>Tất cả Đánh giá ({reviews.length})</Text>
                    {reviews.length === 0 ? (
                        <Text style={styles.noReviews}>Chưa có đánh giá nào. Hãy là người đầu tiên!</Text>
                    ) : (
                        reviews.map(renderReviewItem) // ⭐️ SỬ DỤNG HÀM RENDER REVIEW MỚI ⭐️
                    )}
                </View>

            </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.CARD_BACKGROUND,
  },
  scrollContent: {
    paddingBottom: 50, 
  },
  // ⭐️ STYLE ĐÃ SỬA: BACK BUTTON ⭐️
  backButton: {
    position: 'absolute',
    top: 60, // Cố định vị trí
    left: 15, 
    borderRadius: 20,
    padding: 5,
    zIndex: 100,
  },
  // ⭐️ STYLE ĐÃ SỬA: FAVORITE BUTTON ⭐️
  favoriteButton: {
    position: 'absolute', 
    top: 60, // Cố định vị trí
    right: 5, // Đặt ở góc phải
    padding: 8,
    borderRadius: 20,
    zIndex: 100,
  },
  headerImage: { width: '100%', height: 220 },
  content: {
    padding: 16,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Chỉ cần flex-start vì nút tim đã ở absolute
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.PRIMARY_TEXT }, 
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {},
  sub: { 
    color: COLORS.SECONDARY_TEXT, 
    marginTop: 6,
    marginLeft: 5, 
  },
  cta: {
    marginTop: 16,
    backgroundColor: COLORS.ACCENT,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  ctaText: {
    color: COLORS.CARD_BACKGROUND,
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuSection: {
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  menuHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.PRIMARY_TEXT,
    marginBottom: 10,
  },
  menuRow: {
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '48%',
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  menuImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginBottom: 5,
  },
  menuFoodName: {
    fontWeight: '600',
    color: COLORS.PRIMARY_TEXT,
  },
  mapSection: {
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  mapHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.PRIMARY_TEXT,
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
  },
  reviewSection: {
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  reviewHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.PRIMARY_TEXT,
    marginBottom: 10,
  },
  ratingForm: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#F0F8FF',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY_TEXT,
    marginTop: 10,
    marginBottom: 5,
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  star: {
    fontSize: 28,
    marginRight: 5,
  },
  commentInput: {
    height: 80,
    borderColor: COLORS.BORDER,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    color: COLORS.PRIMARY_TEXT,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: COLORS.ACCENT, 
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    color: COLORS.CARD_BACKGROUND,
    fontWeight: '700',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  reviewItem: {
    paddingVertical: 12, 
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE', 
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: { // ⭐️ STYLE MỚI CHO AVATAR DÙNG URL ⭐️
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: COLORS.BORDER,
  },
  avatarText: {
    color: COLORS.CARD_BACKGROUND, 
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewUser: {
    fontWeight: '700',
    color: COLORS.PRIMARY_TEXT,
    flexShrink: 1,
  },
  reviewRatingStars: { // Đổi tên style để tránh nhầm với renderRating
    fontSize: 20,
    marginBottom: 4,
    marginLeft: 40, 
  },
  reviewComment: {
    color: COLORS.SECONDARY_TEXT,
    marginLeft: 40, 
  },
  noReviews: {
    fontStyle: 'italic',
    color: COLORS.SECONDARY_TEXT,
    marginBottom: 10,
  },
  deleteButton: {
      padding: 5,
      marginLeft: 10,
  }
});