// FoodDetailScreen.jsx

import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// ⭐️ IMPORT ĐẦY ĐỦ edges ⭐️
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 

// Định nghĩa màu sắc cơ bản
const COLORS = {
  BACKGROUND: '#9a0e0eff',
  CARD_BACKGROUND: '#FFFFFF',
  PRIMARY_TEXT: '#111111',
  SECONDARY_TEXT: '#333333',
  ACCENT: '#ff6347',
  BORDER: '#EEEEEE',
};

export default function FoodDetailScreen({ route, navigation }) {
  const { item } = route.params || {};

  // Dữ liệu giả định
  const defaultDetails = {
    price: 'Giá: 65.000 VNĐ',
    description: 'Món ăn đặc trưng được chế biến tỉ mỉ từ những nguyên liệu tươi ngon nhất, giữ trọn hương vị truyền thống.',
  };

  const handleGoBack = () => {
      navigation.goBack();
  };

  const handleNavigate = () => {
    // Điều hướng sang màn hình Map
    navigation.navigate('Map'); 
  };


  return (
    // ⭐️ [SỬA] Chỉ áp dụng SafeArea cho cạnh 'top' để ScrollView có thể lấn xuống dưới ⭐️
    <SafeAreaView edges={['top']} style={styles.container}>
      <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={32} color={COLORS.ACCENT} />
      </TouchableOpacity>

      <ScrollView 
        // ⭐️ [SỬA] Dùng contentContainerStyle để ép ScrollView chiếm hết không gian ⭐️
        contentContainerStyle={styles.scrollContent} 
      >
        <Image 
          source={item?.image || require('../assets/amthuc.jpg')} 
          style={styles.foodImage} 
        />
        
        {/* ⭐️ [SỬA] Đảm bảo nội dung màu trắng che phủ hoàn toàn ⭐️ */}
        <View style={styles.content}>
          
          <View style={styles.titleRow}>
            <Text style={styles.foodName}>{item?.name || 'Món ăn không tên'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.price}>{item?.price || defaultDetails.price}</Text>
          </View>
          
          <Text style={styles.sectionHeader}>Mô tả</Text>
          <Text style={styles.description}>{item?.description || defaultDetails.description}</Text>
          
          <TouchableOpacity style={styles.ctaButton} onPress={handleNavigate}>
            <Text style={styles.orderText}>Chỉ đường</Text> 
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND, // Nền đỏ (chỉ hiển thị khi content không lấp đầy)
  },
  // ⭐️ [MỚI] Ép nội dung ScrollView phát triển (grow) ⭐️
  scrollContent: {
      flexGrow: 1,
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
    flex: 1, // Đảm bảo phần trắng chiếm hết phần còn lại
    // ⭐️ [SỬA] Thêm paddingBottom lớn hơn để lấp đầy khu vực safe area và footer ⭐️
    paddingBottom: 80, 
  },
  
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', 
    alignItems: 'center',
    marginBottom: 5,
  },
  foodName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.ACCENT,
    flexShrink: 1,
  },
  
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', 
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    marginTop: 5, 
  },
  price: {
    fontSize: 20,
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
});