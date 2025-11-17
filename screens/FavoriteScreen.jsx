import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
// Thêm import cho useNavigation nếu bạn chưa có, cần thiết cho việc điều hướng đến FoodDetail
import { useNavigation } from "@react-navigation/native"; 

// ⭐️ ĐỊNH NGHĨA MÀU SẮC ĐỒNG BỘ ⭐️
const COLORS = {
  BACKGROUND: '#8FD9FB',      // Background: Xanh nhạt
  CARD_BACKGROUND: '#FFFFFF', // Container / Card Background: Trắng
  PRIMARY_TEXT: '#111111',    // Chữ chính: Gần như Đen
  SECONDARY_TEXT: '#333333',  // Chữ phụ: Xám đậm
  ACCENT: '#006B8F',          // Màu nhấn: Xanh đậm
  BORDER: '#8FD9FB',          // Viền: Xanh nhạt
  STAR: '#FFC300',            // Sao: Vàng
  NAV_BACKGROUND: '#7EC2E8'   // Màu nền Search Bar/Tab Bar nhẹ hơn
};

const dishes = [
  { id: "1", name: "Beef wellington", image: require("../assets/beef.jpg") },
  { id: "2", name: "Cơm Tấm", image: require("../assets/comtam.jpg") },
  { id: "3", name: "Beef wellington", image: require("../assets/beef.jpg") },
  { id: "4", name: "Cơm Tấm", image: require("../assets/comtam.jpg") },
  { id: "5", name: "Beef wellington", image: require("../assets/beef.jpg") },
  { id: "6", "name": "Cơm Tấm", image: require("../assets/comtam.jpg") },
];

// ⭐️ NHẬN navigation PROP ⭐️
export default function FavoriteScreen({ navigation }) {
  // Lấy navigation nếu component này không phải là màn hình Stack trực tiếp (nhưng nó là màn hình Tab, nên navigation prop đã được truyền vào)
  // const navigation = useNavigation(); 

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔍 Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.PRIMARY_TEXT} />
        <TextInput
          placeholder="Search in your favourites"
          placeholderTextColor={COLORS.SECONDARY_TEXT}
          style={styles.searchInput}
        />
      </View>

      {/* 📦 Title + Actions */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>6 Saved Dishes</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="cloud-upload-outline" size={22} color={COLORS.ACCENT} />
            <Text style={styles.actionText}>Add more</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Feather name="share-2" size={22} color={COLORS.ACCENT} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🍽️ Grid of dishes */}
      <FlatList
        data={dishes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('HomeStack', { 
                screen: 'FoodDetail', 
                params: { item } 
            })}
          >
            <Image source={item.image} style={styles.image} />
            <Text style={styles.foodName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {/* 🔘 Explore Now */}
      <TouchableOpacity style={styles.exploreBtn}>
        <Text style={styles.exploreText}>Explore Now</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND, // ⭐️ BACKGROUND MỚI ⭐️
    paddingHorizontal: 16, // Giảm padding Horizontal để đồng bộ
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD_BACKGROUND, // Nền search bar trắng
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    marginTop: 10, // Thêm margin trên
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  searchInput: {
    flex: 1,
    color: COLORS.PRIMARY_TEXT,
    marginLeft: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 4, // Bù lại phần padding bị giảm
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    color: COLORS.PRIMARY_TEXT, // ⭐️ MÀU CHỮ CHÍNH ⭐️
  },
  actionRow: {
    flexDirection: "row",
    gap: 20,
  },
  actionBtn: {
    alignItems: "center",
  },
  actionText: {
    fontSize: 12,
    color: COLORS.SECONDARY_TEXT, // ⭐️ MÀU CHỮ PHỤ ⭐️
  },
  columnWrapper: {
    justifyContent: "space-between"
  },
  listContent: { 
    paddingBottom: 80,
    paddingHorizontal: 4, // Bù lại phần padding bị giảm
  },
  card: {
    alignItems: "center",
    marginBottom: 20,
    width: '48%', // Đảm bảo đúng kích thước lưới 2 cột
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    resizeMode: "cover",
  },
  foodName: {
    position: "absolute",
    bottom: 5,
    color: COLORS.CARD_BACKGROUND, // Chữ trắng trên nền đen mờ
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: "hidden",
  },
  exploreBtn: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: COLORS.ACCENT, // ⭐️ MÀU NHẤN ⭐️
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  exploreText: {
    color: COLORS.CARD_BACKGROUND, // Chữ trắng
    fontWeight: "bold",
    fontSize: 16,
  },
});
