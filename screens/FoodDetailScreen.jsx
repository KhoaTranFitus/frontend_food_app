// FoodDetailScreen.jsx

import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 
// XÓA: import * as Location from 'expo-location'; 
// XÓA: import { getRoute } from '../services/tomtomApi'; 

// Định nghĩa màu sắc cơ bản (đồng bộ với COLORS từ RestaurantDetailScreen)
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

// MẢNG MÀU SẮC AVATAR NGẪU NHIÊN (Placeholder)
const AVATAR_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF6', '#A133FF'];

// HÀM CHỌN MÀU NGẪU NHIÊN 
const getRandomAvatarColor = () => {
  const index = Math.floor(Math.random() * AVATAR_COLORS.length);
  return AVATAR_COLORS[index];
};

// Dữ liệu giả định cho Nhà hàng bán món ăn
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
  
  // XÓA STATE: userLoc, loading, routeCoords

  // Dữ liệu giả định
  const defaultDetails = {
    price: 'Giá: 65.000 VNĐ',
    description: 'Món ăn đặc trưng được chế biến tỉ mỉ từ những nguyên liệu tươi ngon nhất, giữ trọn hương vị truyền thống.',
  };

  // XÓA: useEffect Lấy vị trí

  const handleToggleFavorite = () => {
      setIsFavorite(!isFavorite);
  };

  const handleGoBack = () => {
      navigation.goBack();
  };

  // ⭐️ HÀM CHỈ ĐƯỜNG: CHUYỂN HƯỚNG TRỰC TIẾP ⭐️
  const handleNavigate = () => {
    // Không cần logic vị trí hay loading, chỉ cần chuyển hướng
    navigation.navigate('Map');
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
    let ratingValue = 4;
    if (item?.rating) {
      ratingValue = Math.min(5, Math.max(0, Math.round(parseFloat(item.rating))));
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

  const navigateToRestaurantDetail = () => {
    navigation.navigate('RestaurantDetail', { 
        item: sellingRestaurant 
    });
  };


  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={32} color={COLORS.ACCENT} />
      </TouchableOpacity>

      <ScrollView>
        <Image 
          source={item?.image || require('../assets/amthuc.jpg')} 
          style={styles.foodImage} 
        />
        
        <View style={styles.content}>
          
          <View style={styles.titleRow}>
            <Text style={styles.foodName}>{item?.name || 'Món ăn không tên'}</Text>
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
                <Ionicons 
                    name={isFavorite ? "heart" : "heart-outline"} 
                    size={30} 
                    color={isFavorite ? COLORS.FAV_RED : COLORS.FAV_GRAY} 
                />
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            {renderRating()}
            <Text style={styles.price}>{item?.price || defaultDetails.price}</Text>
          </View>
          
          <Text style={styles.sectionHeader}>Mô tả</Text>
          <Text style={styles.description}>{item?.description || defaultDetails.description}</Text>

          <Text style={styles.sectionHeader}>Nhà hàng bán</Text>
          <TouchableOpacity style={styles.restaurantCard} onPress={navigateToRestaurantDetail}>
            <View style={[styles.restAvatar, { backgroundColor: sellingRestaurant.avatarColor }]}>
                <Text style={styles.restAvatarText}>{sellingRestaurant.name[0]}</Text>
            </View>
            <Text style={styles.restName}>{sellingRestaurant.name}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.ctaButton} onPress={handleNavigate}>
            <Text style={styles.orderText}>Chỉ đường đến nhà hàng</Text>
          </TouchableOpacity>
        </View>

        {/* PHẦN ĐÁNH GIÁ */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewHeader}>Đánh giá của bạn</Text>
          
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
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  backButton: {
    position: 'absolute',
    top: 55,
    left: 20, 
    zIndex: 10,
  },
  foodImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: 20,
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
  foodName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.ACCENT,
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
    borderBottomColor: COLORS.BORDER,
  },
  ratingText: {
    fontSize: 20,
    fontWeight: '600',
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.PRIMARY_TEXT,
  },
  
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 20,
    marginTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
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
    color: COLORS.CARD_BACKGROUND,
    fontWeight: 'bold',
    fontSize: 18,
  },
  restName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.PRIMARY_TEXT,
  },
  
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_TEXT,
    marginTop: 15,
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: COLORS.SECONDARY_TEXT,
    lineHeight: 24,
    marginBottom: 20,
  },

  ctaButton: {
    backgroundColor: COLORS.ACCENT,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  orderText: {
    color: COLORS.CARD_BACKGROUND,
    fontWeight: 'bold',
    fontSize: 18,
  },

  reviewSection: {
    padding: 16,
    backgroundColor: COLORS.CARD_BACKGROUND,
    marginTop: 10,
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
    backgroundColor: '#F7F7F7',
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
  }
});