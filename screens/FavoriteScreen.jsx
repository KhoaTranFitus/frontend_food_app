import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Share, 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";

// Dữ liệu giả định
const dishes = [
  { id: "1", name: "Beef Wellington", image: require("../assets/beef.jpg"), price: "350.000đ", rating: 4.8 },
  { id: "2", name: "Cơm Tấm Sài Gòn", image: require("../assets/comtam.jpg"), price: "55.000đ", rating: 4.5 },
  { id: "3", name: "Bún Cá Cay", image: require("../assets/buncacay.jpg"), price: "45.000đ", rating: 4.2 },
  { id: "4", name: "Capuchino Đá", image: require("../assets/coffee.jpg"), price: "35.000đ", rating: 4.7 },
  { id: "5", name: "Phở Bò Tái Nạm", image: require("../assets/beef.jpg"), price: "60.000đ", rating: 4.6 },
  { id: "6", name: "Bánh Mì Đặc Biệt", image: require("../assets/comtam.jpg"), price: "25.000đ", rating: 4.9 },
];

const FavoriteItem = ({ item, navigation }) => {
  const [isLiked, setIsLiked] = useState(true);
  const toggleLike = () => setIsLiked(!isLiked);

  return (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => navigation.navigate('FoodDetail', { item })} 
    >
      <Image source={item.image} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.row}>
          <Ionicons name="star" size={14} color="#FFC300" />
          <Text style={styles.itemRating}>{item.rating}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.itemPrice}>{item.price}</Text>
        </View>
        <Text style={styles.itemDistance}>Cách bạn 1.5km</Text>
      </View>
      <TouchableOpacity style={styles.heartIcon} onPress={toggleLike}>
        <Ionicons 
          name={isLiked ? "heart" : "heart-outline"} 
          size={24} 
          color={isLiked ? "#ff6347" : "#CCCCCC"} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function FavoriteScreen({ navigation }) {
  const insets = useSafeAreaInsets();

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
          <Text style={styles.title}>6 Saved Dishes</Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('HomeStack', { screen: 'Home' })}>
              <Ionicons name="cloud-upload-outline" size={22} color="#333" />
              <Text style={styles.actionText}>Add more</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Feather name="share-2" size={22} color="#333" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={dishes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FavoriteItem item={item} navigation={navigation} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />

        {/* ⭐️ VỊ TRÍ EXPLORE NOW ĐƯỢC CỐ ĐỊNH ⭐️ */}
        <TouchableOpacity 
          style={[styles.exploreBtn, { bottom: 3 }]} // Sử dụng insets để cố định
          onPress={() => navigation.navigate('HomeStack', { screen: 'Home' })}
        > 
          <Text style={styles.exploreText}>Explore Now</Text>
        </TouchableOpacity>

      </View>
      {/* View lấp đầy đáy màn hình bằng màu trắng */}
      <View style={{ height: insets.bottom, backgroundColor: '#fff' }} /> 

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#9a0e0eff", 
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
  itemRating: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginLeft: 4,
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
    left: 20,
    right: 20,
    backgroundColor: "#ff6347",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#ff6347",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  exploreText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});