import React, { useState, useEffect, useCallback } from 'react'; 
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { getRoute } from '../services/tomtomApi.jsx';
import { Ionicons } from '@expo/vector-icons';
// BỔ SUNG IMPORTS: useAuth, foodAPI, favoriteAPI VÀ reviewAPI
import { useAuth } from '../context/AuthContext'; 
import { foodAPI, favoriteAPI, reviewAPI } from '../services/flaskApi';


// ⭐️ ĐỊNH NGHĨA MÀU SẮC ⭐️
const COLORS = {
  BACKGROUND: '#9a0e0eff',      
  CARD_BACKGROUND: '#FFFFFF', 
  PRIMARY_TEXT: '#111111',    
  SECONDARY_TEXT: '#333333',  
  ACCENT: '#ff6347',          
  BORDER: '#EEEEEE',          
  STAR: '#FFC300',            
  FAV_RED: '#FF3B30',         
  FAV_GRAY: '#CCCCCC',        
};

const AVATAR_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF6', '#A133FF'];

const getDeterministicAvatarColor = (userId) => {
    if (!userId) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};

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

const BackButton = ({ onGoBack }) => (
    <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={32} color={COLORS.ACCENT} />
    </TouchableOpacity>
);


export default function RestaurantDetailScreen({ route, navigation }) {
  const { user, updateUser } = useAuth();
  const { item } = route.params || {};
  
  const [userLoc, setUserLoc] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const restaurantId = String(item?.id || ''); 
  
  const isFavoritedInitial = user?.favorites?.includes(restaurantId);
  const [isFavorite, setIsFavorite] = useState(isFavoritedInitial || false); 
  const [loadingFavorite, setLoadingFavorite] = useState(false); 
  
  const [reviews, setReviews] = useState([]); 
  const [userRating, setUserRating] = useState(0); 
  const [userComment, setUserComment] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [currentRating, setCurrentRating] = useState(parseFloat(item?.rating) || 0);

  const [menu, setMenu] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // ⭐️ FIX MAP: HÀM CHUẨN HÓA TỌA ĐỘ ⭐️
  const getCoords = useCallback((data) => {
    if (data?.lat && data?.lon) {
        return { lat: data.lat, lon: data.lon };
    }
    if (data?.position?.lat && data?.position?.lon) {
        return { lat: data.position.lat, lon: data.position.lon };
    }
    return { lat: null, lon: null };
  }, []);
  const restaurantCoords = getCoords(item);

  // ⭐️ LOGIC FETCH REVIEWS ⭐️
  const fetchReviews = useCallback(async () => {
      try {
          const result = await reviewAPI.getByRestaurant(restaurantId); 
          const loadedReviews = result.reviews || [];
          
          const reviewsWithColors = loadedReviews.map(r => ({
              ...r,
              avatarColor: getDeterministicAvatarColor(r.user_id), 
              avatarUrl: r.avatar_url,
              rating: parseInt(r.rating) 
          }));
          
          reviewsWithColors.sort((a, b) => b.timestamp - a.timestamp);
          setReviews(reviewsWithColors);

          if (result.current_rating !== undefined && result.current_rating !== null) {
              const fetchedRating = parseFloat(result.current_rating);
              setCurrentRating(fetchedRating);
              console.log("✅ RATING TỪ SERVER:", fetchedRating); 
          }
          
      } catch (e) {
          console.error("Failed to fetch reviews:", e);
      }
  }, [restaurantId]);


  useEffect(() => {
    (async () => {
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
      if (restaurantId) {
          fetchReviews();
      }
    })();
  }, [restaurantId, fetchReviews]); 

  // ⭐️ LOGIC LOAD MENU (Đã Fix tên trường dữ liệu) ⭐️
  useEffect(() => {
    const loadMenu = async () => {
      if (!restaurantId) return;
      setLoadingMenu(true);
      try {
        const res = await foodAPI.getByRestaurant(restaurantId); 
        let fetchedMenu = [];
        if (res.menu && Array.isArray(res.menu)) fetchedMenu = res.menu;
        else if (res.foods && Array.isArray(res.foods)) fetchedMenu = res.foods;
        else if (res.data && res.data.menu) fetchedMenu = res.data.menu;
        else if (Array.isArray(res)) fetchedMenu = res;
        
        setMenu(fetchedMenu || []);
      } catch (err) {
        console.error("Error loading menu:", err);
        setMenu([]);
      } finally {
        setLoadingMenu(false);
      }
    };
    loadMenu();
  }, [restaurantId]);
  
  useEffect(() => {
    const currentStatus = user?.favorites?.includes(restaurantId);
    setIsFavorite(currentStatus || false);
  }, [user?.favorites, restaurantId]);


  const handleToggleFavorite = async () => {
      if (!user) {
          Alert.alert("Lỗi", "Vui lòng đăng nhập để sử dụng tính năng này.");
          return;
      }
      if (loadingFavorite) return;

      setLoadingFavorite(true);
      try {
          const result = await favoriteAPI.toggleRestaurantFavorite(restaurantId);
          updateUser({ ...user, favorites: result.favorites }); 
          Alert.alert("Thành công", result.message);
      } catch (e) {
          Alert.alert("Lỗi", e.error || "Không thể cập nhật yêu thích.");
      } finally {
          setLoadingFavorite(false);
      }
  };


  const handleGoBack = () => {
      navigation.goBack();
  };


  const handleNavigate = () => {
    if (!restaurantCoords.lat || !restaurantCoords.lon) {
      Alert.alert('Lỗi', 'Không có tọa độ nhà hàng');
      return;
    }
    navigation.navigate('Map', {
      destination: {
        latitude: restaurantCoords.lat,
        longitude: restaurantCoords.lon,
      },
    });
  };
  
  // ⭐️ FIX TRIỆT ĐỂ LỖI RATING: Gọi API bằng tham số rời rạc ⭐️
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
        // --- CHUYỂN TỪ OBJECT VỀ THAM SỐ RỜI RẠC (Dạng phổ biến trong code cũ) ---
        const result = await reviewAPI.create(
            restaurantId,    // target_id
            userRating,      // rating
            userComment,     // comment
            'restaurant'     // type
        ); 
        // -----------------------------------------------------------------------
        
        const newReview = {
            id: result.review.id,
            user_id: result.review.user_id, 
            username: result.review.username,
            rating: result.review.rating,
            comment: result.review.comment || 'Không có bình luận',
            date: result.review.date,
            avatarColor: result.review.avatar_url ? null : getDeterministicAvatarColor(result.review.user_id), 
            avatarUrl: result.review.avatar_url,
            timestamp: result.review.timestamp,
        };

        setReviews([newReview, ...reviews]);
        
        const newRating = result.review.new_restaurant_rating;
        if (newRating !== undefined && newRating !== null) {
            const finalNewRating = parseFloat(newRating);
            setCurrentRating(finalNewRating);
            console.log("✅ RATING TỪ POST (CẬP NHẬT LOCAL):", finalNewRating);
        }
        
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
  
  // ⭐️ LOGIC DELETE REVIEW ⭐️
  const handleDeleteReview = (reviewId) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa đánh giá này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setLoading(true); 
            try {
              const result = await reviewAPI.delete(reviewId); 
              setReviews(reviews.filter(r => r.id !== reviewId));
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
  
  // ⭐️ KHÔI PHỤC RENDER MENU DẠNG LIST (Theo yêu cầu mới nhất) ⭐️
  const renderMenuItem = ({ item }) => (
    <TouchableOpacity 
        key={item.id} 
        style={styles.menuItem} 
        onPress={() => Alert.alert("Chi tiết món ăn", `${item.dish_name || item.name} - Giá: ${item.price.toLocaleString()} đ`)} 
    >
        <Text style={styles.menuFoodName}>{item.dish_name || item.name}</Text>
        <Text style={styles.menuPrice}>{item.price ? item.price.toLocaleString() : 0} đ</Text>
        <Text style={styles.menuDesc}>{item.description}</Text>
    </TouchableOpacity>
  );

  const renderRating = () => {
    const finalRating = parseFloat(currentRating) || 0; 
    let ratingValue;
    if (finalRating >= 4.8) ratingValue = 5;
    else if (finalRating >= 4.0) ratingValue = 4;
    else if (finalRating >= 3.0) ratingValue = 3;
    else if (finalRating >= 2.0) ratingValue = 2;
    else if (finalRating >= 1.0) ratingValue = 1;
    else ratingValue = 0;
     
    return (
      <Text style={styles.ratingText}>
        <Text style={{ color: COLORS.STAR }}>{Array(ratingValue).fill('★').join('')}</Text>
        <Text style={{ color: COLORS.SECONDARY_TEXT }}>{Array(5 - ratingValue).fill('★').join('')}</Text>
        <Text style={{ color: COLORS.PRIMARY_TEXT, fontWeight: 'bold' }}> ({finalRating.toFixed(1)})</Text> 
      </Text>
    );
  };
  
  const renderReviewItem = (review) => {
      const isOwner = user?.uid === review.user_id; 
      
      const avatarSource = review.avatarUrl ? { uri: review.avatarUrl } : null;

      return (
          <View key={review.id} style={styles.reviewItem}>
              <View style={styles.userHeader}>
                  {avatarSource ? (
                      <Image source={avatarSource} style={styles.avatarImage} />
                  ) : (
                      <View style={[
                          styles.avatar, 
                          { backgroundColor: review.avatarColor || '#CCCCCC' } 
                      ]}>
                          <Text style={styles.avatarText}>{review.username[0]}</Text>
                      </View>
                  )}
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.reviewUser}>
                          {review.username} - {review.date}
                      </Text>
                      {isOwner && (
                          <TouchableOpacity onPress={() => handleDeleteReview(review.id)} style={styles.deleteButton}>
                              <Ionicons name="trash-outline" size={20} color={COLORS.FAV_RED} />
                          </TouchableOpacity>
                      )}
                  </View>
              </View>
              <Text style={styles.reviewRatingStars}>
                  <Text style={{ color: COLORS.STAR }}>{Array(review.rating).fill('★').join('')}</Text>
                  <Text style={{ color: COLORS.SECONDARY_TEXT }}>{Array(5 - review.rating).fill('★').join('')}</Text>
              </Text>
              <Text style={styles.reviewComment}>{review.comment}</Text>
          </View>
      );
  };

  const initialRegion = restaurantCoords.lat && restaurantCoords.lon
    ? {
        latitude: restaurantCoords.lat,
        longitude: restaurantCoords.lon,
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
    <SafeAreaView style={styles.container}>
        <BackButton onGoBack={handleGoBack} />
        <FavoriteButton 
            isFavorited={isFavorite} 
            onToggle={handleToggleFavorite} 
            loading={loadingFavorite}
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
            <Image source={{ uri: item.image || item.image_url || item.photo || item.photos?.[0] }} style={styles.headerImage} />

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{item?.name || 'Tên Nhà Hàng'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                    {renderRating()}
                    <Text style={styles.sub}> • Giờ mở cửa: {item?.open_hours || '09:00 - 22:00'}</Text>
                </View>

                <Text style={styles.sub}>Địa chỉ: {item?.address || 'Địa chỉ không có'}</Text>

                <TouchableOpacity style={styles.cta} onPress={handleNavigate}>
                    <Text style={styles.ctaText}>Chỉ đường</Text>
                </TouchableOpacity>

                {/* MENU - Khôi phục giao diện List Item */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuHeader}>Menu</Text>
                    {loadingMenu ? (
                      <ActivityIndicator size="large" color={COLORS.ACCENT} style={{marginTop: 10}} />
                    ) : menu.length === 0 ? (
                        <Text style={styles.noReviews}>Menu đang được cập nhật.</Text>
                    ) : (
                      <FlatList
                        data={menu}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        renderItem={renderMenuItem} 
                      />
                    )}
                </View>
                
                {/* BẢN ĐỒ - Đã sửa lỗi tọa độ */}
                <View style={styles.mapSection}>
                    <Text style={styles.mapHeader}>Vị trí Nhà hàng</Text>
                    {initialRegion ? (
                        <MapView
                            style={styles.map}
                            provider="google"
                            initialRegion={initialRegion}
                            showsUserLocation={true}
                        >
                            <Marker coordinate={{ latitude: restaurantCoords.lat, longitude: restaurantCoords.lon }} title={item.name} />
                            
                            {routeCoordinates.length > 0 && (
                                <Polyline 
                                    coordinates={routeCoordinates} 
                                    strokeColor={COLORS.ACCENT} 
                                    strokeWidth={5} 
                                    lineCap="round"
                                />
                            )}
                        </MapView>
                    ) : (
                        <Text style={{color: COLORS.SECONDARY_TEXT}}>Không tìm thấy vị trí bản đồ.</Text>
                    )}
                </View>

                {/* ĐÁNH GIÁ - Giữ nguyên */}
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
                        reviews.map(renderReviewItem)
                    )}
                </View>

            </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ⭐️ STYLE MENU DẠNG LIST (KHÔI PHỤC) ⭐️
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  menuFoodName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY_TEXT,
    marginBottom: 4,
  },
  menuPrice: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    marginBottom: 6,
  },
  menuDesc: {
    fontSize: 14,
    color: COLORS.SECONDARY_TEXT,
    lineHeight: 20,
  },
  // Style Card giữ lại cho an toàn (không dùng)
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
  
  container: {
    flex: 1,
    backgroundColor: COLORS.CARD_BACKGROUND,
  },
  scrollContent: {
    paddingBottom: 50, 
  },
  backButton: {
    position: 'absolute',
    top: 60, 
    left: 15, 
    borderRadius: 20,
    padding: 5,
    zIndex: 100,
  },
  favoriteButton: {
    position: 'absolute', 
    top: 60, 
    right: 5, 
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
    justifyContent: 'flex-start',
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
  avatarImage: { 
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
  reviewRatingStars: { 
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