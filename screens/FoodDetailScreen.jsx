// FoodDetailScreen.jsx

import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 

// Định nghĩa màu sắc cơ bản (đồng bộ với COLORS từ RestaurantDetailScreen)
const DETAIL_COLORS = {
  BACKGROUND: '#8FD9FB',
  CARD_BACKGROUND: '#FFFFFF',
  PRIMARY_TEXT: '#111111',
  SECONDARY_TEXT: '#333333',
  ACCENT: '#006B8F',
  BORDER: '#8FD9FB',
  STAR: '#FFC300',
  FAV_RED: '#FF3B30',
  FAV_GRAY: '#CCCCCC',
};

// MẢNG MÀU SẮC AVATAR NGẪU NHIÊN (Placeholder)
const AVATAR_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF6', '#A133FF'];

// HÀM CHỌN MÀU NGẪU NHIÊN 
const getRandomAvatarColor = () => {
  const index = Math.floor(Math.random() * AVATAR_COLORS.length);
  return AVATAR_COLORS[index];
};

// Dữ liệu giả định cho Nhà hàng bán món ăn (Đã thêm image và rating đầy đủ)
const sellingRestaurant = {
    id: 'rest101',
    name: 'Phố Cũ Quán',
    avatarColor: getRandomAvatarColor(), 
    position: { lat: 10.77653, lon: 106.700981 }, 
    address: '123 Đường Nguyễn Huệ, Quận 1',
    rating: '4.5',
    image: require('../assets/amthuc.jpg'), 
    category: 'Ẩm thực Việt', 
};


export default function FoodDetailScreen({ route, navigation }) {
  const { item } = route.params || {};

  const [isFavorite, setIsFavorite] = useState(false); 
  const [reviews, setReviews] = useState([]); 
  const [userRating, setUserRating] = useState(0); 
  const [userComment, setUserComment] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // Dữ liệu giả định
  const defaultDetails = {
    price: 'Giá: 65.000 VNĐ',
    description: 'Món ăn đặc trưng được chế biến tỉ mỉ từ những nguyên liệu tươi ngon nhất, giữ trọn hương vị truyền thống.',
  };

  const handleToggleFavorite = () => {
      setIsFavorite(!isFavorite);
  };
  
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

  const renderRating = () => {
    if (item?.rating) {
      return <Text style={{ color: DETAIL_COLORS.STAR }}>{item.rating} ⭐</Text>;
    }
    
    const placeholderRating = 4;
    return (
      <Text style={{ color: DETAIL_COLORS.STAR }}>
        {Array(placeholderRating).fill('★').join('')}
        <Text style={{ color: DETAIL_COLORS.SECONDARY_TEXT }}>
          {Array(5 - placeholderRating).fill('★').join('')}
        </Text>
      </Text>
    );
  };

  const navigateToRestaurantDetail = () => {
    navigation.navigate('RestaurantDetail', { 
        item: sellingRestaurant 
    });
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image 
          source={item?.image || require('../assets/amthuc.jpg')} 
          style={styles.foodImage} 
        />
        
        <View style={styles.content}>
          
          {/* TÊN MÓN ĂN VÀ YÊU THÍCH */}
          <View style={styles.titleRow}>
            <Text style={styles.foodName}>{item?.name || 'Món ăn không tên'}</Text>
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
                <Ionicons 
                    name={isFavorite ? "heart" : "heart-outline"} 
                    size={30} 
                    color={isFavorite ? DETAIL_COLORS.FAV_RED : DETAIL_COLORS.FAV_GRAY} 
                />
            </TouchableOpacity>
          </View>
          
          {/* RATING VÀ GIÁ */}
          <View style={styles.infoRow}>
            <Text style={styles.ratingText}>
                {renderRating()}
            </Text>
            <Text style={styles.price}>{item?.price || defaultDetails.price}</Text>
          </View>
          
          <Text style={styles.sectionHeader}>Mô tả</Text>
          <Text style={styles.description}>{item?.description || defaultDetails.description}</Text>

          {/* ⭐️ PHẦN NHÀ HÀNG BÁN ĐÃ SỬA ĐỔI ⭐️ */}
          <TouchableOpacity style={styles.restaurantCard} onPress={navigateToRestaurantDetail}>
            <View style={[styles.restAvatar, { backgroundColor: sellingRestaurant.avatarColor }]}>
                <Text style={styles.restAvatarText}>{sellingRestaurant.name[0]}</Text>
            </View>
            <Text style={styles.restName}>{sellingRestaurant.name}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.orderButton}>
            <Text style={styles.orderText}>Đặt món ngay</Text>
          </TouchableOpacity>
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
                  <Text style={[styles.star, { color: star <= userRating ? DETAIL_COLORS.STAR : DETAIL_COLORS.SECONDARY_TEXT }]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.formLabel}>Bình luận (Tùy chọn):</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              placeholderTextColor={DETAIL_COLORS.SECONDARY_TEXT}
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
                <ActivityIndicator color={DETAIL_COLORS.CARD_BACKGROUND} />
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
                
                <View style={styles.userHeader}>
                    <View style={[
                        styles.avatar, 
                        { backgroundColor: review.avatarColor || '#CCCCCC' } 
                    ]}>
                        <Text style={styles.avatarText}>{review.username[0]}</Text>
                    </View>
                    
                    <Text style={styles.reviewUser}>
                        {review.username} - {review.date}
                    </Text>
                </View>
                
                <Text style={styles.reviewRating}>
                  <Text style={{ color: DETAIL_COLORS.STAR }}>
                    {Array(review.rating).fill('★').join('')}
                  </Text>
                  <Text style={{ color: DETAIL_COLORS.SECONDARY_TEXT }}>
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
  container: {
    flex: 1,
    backgroundColor: DETAIL_COLORS.BACKGROUND,
  },
  foodImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    backgroundColor: DETAIL_COLORS.CARD_BACKGROUND,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    marginHorizontal: 8,
  },
  
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  foodName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DETAIL_COLORS.ACCENT,
    flexShrink: 1,
  },
  favoriteButton: {
    padding: 5,
  },
  
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: DETAIL_COLORS.BORDER,
  },
  ratingText: {
    fontSize: 20,
    fontWeight: '600',
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: DETAIL_COLORS.PRIMARY_TEXT,
  },
  
  // ⭐️ STYLES ĐÃ CHỈNH SỬA CHO NHÀ HÀNG BÁN ⭐️
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // Giảm padding dọc
    // ❌ BỎ BACKGROUND MÀU NHẸ VÀ BỎ VIỀN
    marginBottom: 20,
    marginTop: 5,
    borderBottomWidth: 1, // Tạo đường kẻ mỏng phía dưới
    borderBottomColor: DETAIL_COLORS.BORDER,
  },
  restAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restAvatarText: {
    color: DETAIL_COLORS.CARD_BACKGROUND,
    fontWeight: 'bold',
    fontSize: 18,
  },
  restName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: DETAIL_COLORS.PRIMARY_TEXT,
  },
  
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DETAIL_COLORS.PRIMARY_TEXT,
    marginTop: 15,
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: DETAIL_COLORS.SECONDARY_TEXT,
    lineHeight: 24,
    marginBottom: 20,
  },
  orderButton: {
    backgroundColor: DETAIL_COLORS.ACCENT,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  orderText: {
    color: DETAIL_COLORS.CARD_BACKGROUND,
    fontWeight: 'bold',
    fontSize: 18,
  },

  // STYLES ĐÁNH GIÁ (giữ nguyên)
  reviewSection: {
    padding: 16,
    backgroundColor: DETAIL_COLORS.CARD_BACKGROUND,
    marginHorizontal: 8,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DETAIL_COLORS.BORDER,
    marginBottom: 20,
  },
  reviewHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: DETAIL_COLORS.PRIMARY_TEXT,
    marginBottom: 10,
    marginTop: 10,
  },
  ratingForm: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DETAIL_COLORS.BORDER,
    backgroundColor: '#F0F8FF',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DETAIL_COLORS.PRIMARY_TEXT,
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
    borderColor: DETAIL_COLORS.BORDER,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    color: DETAIL_COLORS.PRIMARY_TEXT,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: DETAIL_COLORS.ACCENT, 
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  submitText: {
    color: DETAIL_COLORS.CARD_BACKGROUND,
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
    color: DETAIL_COLORS.CARD_BACKGROUND, 
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewUser: {
    fontWeight: '700',
    color: DETAIL_COLORS.ACCENT,
  },
  reviewRating: {
    fontSize: 20,
    marginBottom: 4,
    marginLeft: 40, 
  },
  reviewComment: {
    color: DETAIL_COLORS.SECONDARY_TEXT,
    marginLeft: 40, 
  },
  noReviews: {
    fontStyle: 'italic',
    color: DETAIL_COLORS.SECONDARY_TEXT,
    marginBottom: 10,
  }
});