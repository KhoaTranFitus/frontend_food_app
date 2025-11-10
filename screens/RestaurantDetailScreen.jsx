import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, FlatList } from 'react-native'; // Thêm FlatList và TextInput
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { getRoute } from '../services/tomtomApi.jsx';

// Định nghĩa các biến màu sắc
const COLORS = {
  BACKGROUND: '#8FD9FB',      // Background: #8FD9FB (Xanh nhạt)
  CARD_BACKGROUND: '#FFFFFF', // Container / Card Background: #FFFFFF (Trắng)
  BUTTON_BG: '#FFFFFF',       // Button: #FFFFFF (Trắng)
  BUTTON_TEXT: '#000000',     // Chữ trên Button: #000000 (Đen)
  PRIMARY_TEXT: '#111111',    // Chữ chính: #111111 (Gần như Đen)
  SECONDARY_TEXT: '#333333',  // Chữ phụ: #333333 (Xám đậm)
  BORDER: '#8FD9FB',          // Viền: #8FD9FB (Chọn màu xanh nhạt)
  ACCENT: '#006B8F',          // Màu nhấn cho Title/Polyline (Tối hơn màu nền)
  STAR: '#FFC300',            // MÀU SAO: Vàng
};

// ⭐️ DỮ LIỆU MENU HÌNH ẢNH GIẢ ĐỊNH (Mô phỏng từ FavoriteScreen) ⭐️
const MENU_IMAGES = [
  { id: "1", name: "Beef Wellington", image: require("../assets/beef.jpg") },
  { id: "2", name: "Cơm Tấm", image: require("../assets/comtam.jpg") },
  { id: "3", name: "Bún Cá Cay", image: require("../assets/buncacay.jpg") }, 
  { id: "4", name: "Capuchino", image: require("../assets/coffee.jpg") },
];

export default function RestaurantDetailScreen({ route }) {
  const { item } = route.params || {};
  const [userLoc, setUserLoc] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [menuItems, setMenuItems] = useState(MENU_IMAGES); // Dùng cho Menu Hình ảnh
  const [reviews, setReviews] = useState([]); 
  const [userRating, setUserRating] = useState(0); 
  const [userComment, setUserComment] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // Lấy vị trí người dùng
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Không thể lấy vị trí người dùng');
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
    const coords = await getRoute(userLoc, dest);
    setRouteCoords(coords);
    setLoading(false);
  };
  
  // XỬ LÝ GỬI ĐÁNH GIÁ
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
    };

    setReviews([newReview, ...reviews]);
    setUserRating(0);
    setUserComment('');
    setIsSubmitting(false);
    Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi.');
  };

  const renderRating = () => {
    if (item?.rating) {
      return <Text style={{ color: COLORS.STAR }}>{item.rating} ⭐</Text>;
    }
    
    // Hiển thị placeholder 4 sao 
    const placeholderRating = 4;
    return (
      <Text style={{ color: COLORS.STAR }}>
        {Array(placeholderRating).fill('★').join('')}
        <Text style={{ color: COLORS.SECONDARY_TEXT }}>
          {Array(5 - placeholderRating).fill('★').join('')}
        </Text>
      </Text>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView>
        <Image source={require('../assets/amthuc.jpg')} style={styles.headerImage} />

        {/* PHẦN THÔNG TIN CHÍNH VÀ BẢN ĐỒ */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{item?.name || 'Tên Nhà hàng'}</Text>
          <Text style={styles.sub}>
            {renderRating()} • Giờ mở cửa: {'9am - 10pm'}
          </Text>
          <Text style={styles.addressText}>
            Địa chỉ: {item?.address || 'Không có thông tin'}
          </Text>

          <TouchableOpacity style={styles.cta} onPress={handleNavigate}>
            <Text style={styles.ctaText}>Chỉ đường đến đây</Text>
          </TouchableOpacity>

          {loading && (
            <ActivityIndicator size="large" color={COLORS.ACCENT} style={{ marginTop: 12 }} />
          )}

          <Text style={styles.mapHeader}>Bản đồ</Text>

          <View style={styles.mapContainer}>
            <MapView
              style={{ flex: 1 }}
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
        </View>

        {/* ================================================= */}
        {/* ⭐️ PHẦN MENU HÌNH ẢNH - MỚI ⭐️ */}
        {/* ================================================= */}
        <View style={styles.menuSection}>
          <Text style={styles.menuHeader}>Menu</Text>
          
          <FlatList
            data={menuItems}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.menuRow}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false} // Cho phép ScrollView cha cuộn
            renderItem={({ item }) => (
              <View style={styles.menuCard}>
                <Image source={item.image} style={styles.menuImage} />
                <Text style={styles.menuFoodName}>{item.name}</Text>
              </View>
            )}
          />
        </View>
        
        {/* ================================================= */}
        {/* PHẦN ĐÁNH GIÁ (REVIEW) */}
        {/* ================================================= */}

        <View style={styles.reviewSection}>
          <Text style={styles.reviewHeader}>Đánh giá của bạn</Text>
          
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
                <ActivityIndicator color={COLORS.BUTTON_TEXT} />
              ) : (
                <Text style={styles.ctaText}>Gửi Đánh giá</Text>
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
                <Text style={styles.reviewUser}>{review.username} - {review.date}</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerImage: { width: '100%', height: 220 },
  
  contentContainer: { 
    padding: 16, 
    backgroundColor: COLORS.CARD_BACKGROUND, 
    margin: 8, 
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: COLORS.BORDER, 
    shadowColor: COLORS.PRIMARY_TEXT, 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: COLORS.ACCENT 
  },
  
  sub: { 
    color: COLORS.SECONDARY_TEXT, 
    marginTop: 6 
  },
  
  addressText: { 
    marginTop: 8, 
    color: COLORS.SECONDARY_TEXT 
  },
  
  cta: {
    marginTop: 16,
    backgroundColor: COLORS.BUTTON_BG, 
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2, 
    borderColor: COLORS.ACCENT, 
  },
  
  ctaText: { 
    color: COLORS.BUTTON_TEXT, 
    fontWeight: '700' 
  },
  
  mapHeader: { 
    fontWeight: '800', 
    marginTop: 16, 
    color: COLORS.PRIMARY_TEXT 
  },
  
  mapContainer: { 
    height: 300, 
    marginTop: 8, 
    borderRadius: 12, 
    overflow: 'hidden',
    borderColor: COLORS.BORDER, 
    borderWidth: 1,
  },
  
  // ⭐️ STYLES MỚI CHO MENU HÌNH ẢNH ⭐️
  menuSection: {
    padding: 16,
    marginTop: 8,
    backgroundColor: COLORS.CARD_BACKGROUND,
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    // Không cần margin bottom vì review section sẽ có
  },
  menuHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.PRIMARY_TEXT,
    marginBottom: 10,
    marginTop: 0,
  },
  menuRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  menuCard: {
    alignItems: 'center',
    width: '48%', // Chiếm 48% để có khoảng trống ở giữa
    marginBottom: 15,
  },
  menuImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  menuFoodName: {
    position: 'absolute',
    bottom: 5,
    color: COLORS.CARD_BACKGROUND,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  // STYLES CHO ĐÁNH GIÁ (Giữ nguyên)
  reviewSection: {
    padding: 16,
    marginTop: 8,
    backgroundColor: COLORS.CARD_BACKGROUND,
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 20,
  },
  reviewHeader: {
    fontSize: 18,
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
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  reviewItem: {
    paddingVertical: 12, 
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE', 
  },
  reviewUser: {
    fontWeight: '700',
    color: COLORS.ACCENT,
    marginBottom: 4,
  },
  reviewRating: {
    fontSize: 20,
    marginBottom: 4,
  },
  reviewComment: {
    color: COLORS.SECONDARY_TEXT,
  },
  noReviews: {
    fontStyle: 'italic',
    color: COLORS.SECONDARY_TEXT,
    marginBottom: 10,
  }
});