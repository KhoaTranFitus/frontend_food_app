import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { getRoute } from '../services/tomtomApi.jsx';
import { Ionicons } from '@expo/vector-icons';

// Định nghĩa các biến màu sắc (Đồng bộ)
const COLORS = {
  BACKGROUND: '#8FD9FB',      
  CARD_BACKGROUND: '#FFFFFF', 
  BUTTON_BG: '#FFFFFF',       
  BUTTON_TEXT: '#000000',     
  PRIMARY_TEXT: '#111111',    
  SECONDARY_TEXT: '#333333',  
  BORDER: '#8FD9FB',          
  ACCENT: '#006B8F',          
  STAR: '#FFC300',            
  FAV_RED: '#FF3B30',         
  FAV_GRAY: '#CCCCCC',        
};

// ⭐️ MẢNG MÀU SẮC AVATAR NGẪU NHIÊN (Placeholder) ⭐️
const AVATAR_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF6', '#A133FF'];

// ⭐️ HÀM CHỌN MÀU NGẪU NHIÊN ⭐️
const getRandomAvatarColor = () => {
  const index = Math.floor(Math.random() * AVATAR_COLORS.length);
  return AVATAR_COLORS[index];
};

// ⭐️ DỮ LIỆU MENU HÌNH ẢNH CHÍNH XÁC ⭐️
const MENU_IMAGES = [
  { id: "1", name: "Beef Wellington", image: require("../assets/beef.jpg") },
  { id: "2", name: "Cơm Tấm", image: require("../assets/comtam.jpg") },
  { id: "3", name: "Bún Cá Cay", image: require("../assets/buncacay.jpg") }, 
  { id: "4", name: "Capuchino", image: require("../assets/coffee.jpg") },
];


export default function RestaurantDetailScreen({ route, navigation }) {
  const { item } = route.params || {};
  const [userLoc, setUserLoc] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isFavorite, setIsFavorite] = useState(false); 
  const [reviews, setReviews] = useState([]); 
  const [userRating, setUserRating] = useState(0); 
  const [userComment, setUserComment] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // Lấy vị trí người dùng
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setUserLoc({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  const handleToggleFavorite = () => {
      setIsFavorite(!isFavorite);
  };


  // Hàm chỉ đường
  const handleNavigate = async () => {
    if (!userLoc) {
      Alert.alert('Đang lấy vị trí...');
      return;
    }
    if (!item?.position?.lat || !item?.position?.lon) {
      Alert.alert('Không có tọa độ điểm đến');
      return;
    }

    setLoading(true);
    const dest = {
      latitude: item.position.lat,
      longitude: item.position.lon,
    };

    try {
      const coords = await getRoute(userLoc, dest);
      setRouteCoords(coords);
    } catch (error) {
      console.error('Lỗi khi lấy route:', error);
      Alert.alert('Lỗi', 'Không thể tìm đường đi.');
    } finally {
      setLoading(false);
    }
  };
  
  // ⭐️ HÀM XỬ LÝ GỬI ĐÁNH GIÁ ⭐️
  const handleSubmitReview = async () => {
    if (userRating === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn số sao đánh giá.');
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    const newReview = {
      id: Date.now(),
      username: 'Người dùng hiện tại',
      rating: userRating,
      comment: userComment || 'Không có bình luận',
      date: new Date().toLocaleDateString('vi-VN'),
      avatarColor: getRandomAvatarColor(), 
    };

    setReviews([newReview, ...reviews]);
    setUserRating(0);
    setUserComment('');
    setIsSubmitting(false);
    Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi.');
  };

  // Render Item cho Menu
  const renderMenuItem = ({ item }) => (
    <TouchableOpacity 
        style={styles.menuCard} 
        onPress={() => navigation.navigate('FoodDetail', { item })} 
    >
        <Image source={item.image} style={styles.menuImage} />
        <Text style={styles.menuFoodName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // ⭐️ HÀM RENDER RATING ĐÃ ĐỒNG NHẤT ⭐️
  const renderRating = () => {
    // Chuyển rating về dạng số (giả định max là 5 sao)
    let ratingValue = 4; // Giá trị mặc định (placeholder 4 sao)
    
    if (item?.rating) {
        // Chuyển rating từ string/float sang số nguyên gần nhất (tối đa 5)
        ratingValue = Math.min(5, Math.max(0, Math.round(parseFloat(item.rating))));
    } else {
        // Nếu không có rating, dùng giá trị mặc định 4
        ratingValue = 4;
    }

    return (
      <Text style={styles.ratingText}>
        <Text style={{ color: COLORS.STAR }}>
          {Array(ratingValue).fill('★').join('')}
        </Text>
        <Text style={{ color: COLORS.SECONDARY_TEXT }}>
          {Array(5 - ratingValue).fill('★').join('')}
        </Text>
      </Text>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header Image */}
        <Image source={item?.image || require('../assets/amthuc.jpg')} style={styles.headerImage} />

        {/* Content */}
        <View style={styles.content}>
          
          {/* TÊN VÀ YÊU THÍCH */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item?.name || 'Tên Nhà Hàng'}</Text>
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
                <Ionicons 
                    name={isFavorite ? "heart" : "heart-outline"} 
                    size={30} 
                    color={isFavorite ? COLORS.FAV_RED : COLORS.FAV_GRAY} 
                />
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            {/* ⭐️ SỬ DỤNG HÀM RENDER RATING ĐÃ ĐỒNG NHẤT ⭐️ */}
            {renderRating()}
            <Text style={styles.sub}> • Giờ mở cửa: 09:00 - 22:00</Text>
          </View>

          <Text style={styles.sub}>Địa chỉ: {item?.address || 'Địa chỉ không có'}</Text>

          {/* Nút chỉ đường */}
          <TouchableOpacity style={styles.cta} onPress={handleNavigate} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.CARD_BACKGROUND} />
            ) : (
              <Text style={styles.ctaText}>Chỉ đường</Text>
            )}
          </TouchableOpacity>

          {/* 🍽️ 1. PHẦN MENU MÓN ĂN */}
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
          
          {/* 2. BẢN ĐỒ VỊ TRÍ */}
          <View style={styles.mapSection}>
            <Text style={styles.mapHeader}>Vị trí Nhà hàng</Text>
            <MapView
              style={styles.map}
              provider="google"
              initialRegion={{
                latitude: item?.position?.lat || 10.77653,
                longitude: item?.position?.lon || 106.700981,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {/* Marker vị trí người dùng */}
              {userLoc && (
                <Marker
                  coordinate={userLoc}
                  title="Vị trí của bạn"
                  pinColor="blue"
                />
              )}

              {/* Marker nhà hàng */}
              {item?.position && (
                <Marker
                  coordinate={{
                    latitude: item.position.lat,
                    longitude: item.position.lon,
                  }}
                  title={item?.name}
                  description={item?.address}
                  pinColor="red"
                />
              )}

              {/* Đường đi */}
              {routeCoords.length > 0 && (
                <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor={COLORS.ACCENT} />
              )}
            </MapView>
          </View>

          {/* 3. PHẦN ĐÁNH GIÁ (REVIEW) */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewHeader}>Đánh giá của khách hàng</Text>
            
            {/* Form Đánh giá */}
            <View style={styles.ratingForm}>
              <Text style={styles.formLabel}>Số sao:</Text>
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

            {/* Danh sách Đánh giá */}
            <Text style={styles.reviewHeader}>Tất cả Đánh giá ({reviews.length})</Text>
            {reviews.length === 0 ? (
              <Text style={styles.noReviews}>Chưa có đánh giá nào. Hãy là người đầu tiên!</Text>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  
                  {/* KHU VỰC AVATAR VÀ TÊN NGƯỜI DÙNG */}
                  <View style={styles.userHeader}>
                      {/* AVATAR PLACEHOLDER */}
                      <View style={[
                          styles.avatar, 
                          { backgroundColor: review.avatarColor || '#CCCCCC' } 
                      ]}>
                          <Text style={styles.avatarText}>{review.username[0]}</Text>
                      </View>
                      
                      {/* TÊN VÀ NGÀY */}
                      <Text style={styles.reviewUser}>
                          {review.username} - {review.date}
                      </Text>
                  </View>
                  
                  <Text style={styles.reviewRating}>
                    <Text style={{ color: COLORS.STAR }}>
                      {Array(review.rating).fill('★').join('')}
                    </Text>
                    <Text style={{ color: COLORS.SECONDARY_TEXT }}>
                      {Array(5 - review.rating).fill('★').join('')}
                    </Text>
                  </Text>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))
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
    backgroundColor: COLORS.BACKGROUND,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.ACCENT },
  favoriteButton: {
    padding: 5,
  },
  
  // SỬA CẤU TRÚC VÀO INFO ROW
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap', // Cho phép xuống dòng nếu quá dài
  },
  ratingText: {
    // Để rating ở đây, không có margin bottom
  },
  sub: { 
    color: COLORS.SECONDARY_TEXT, 
    marginTop: 6,
    marginLeft: 5, // Khoảng cách giữa rating và giờ mở cửa
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
  
  // Menu styles
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

  // Map styles
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

  // STYLES ĐÁNH GIÁ 
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
    marginTop: 10,
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
    alignItems: 'center',
    borderRadius: 12,
  },
  submitText: {
    color: COLORS.CARD_BACKGROUND,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  reviewItem: {
    paddingVertical: 12, 
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE', 
  },
  
  // STYLES CHO AVATAR VÀ USER HEADER
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
  avatarText: {
    color: COLORS.CARD_BACKGROUND, 
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewUser: {
    fontWeight: '700',
    color: COLORS.ACCENT,
  },

  // SỬA REVIEW ITEM ALIGNMENT
  reviewRating: {
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
});