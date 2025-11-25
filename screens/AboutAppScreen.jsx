import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function AboutAppScreen() {
  const navigation = useNavigation();

  // Danh sách 7 thành viên nhóm
  const members = [
    "Trần Đình Khoa",
    "Trần Nhật Đăng",
    "Thạch Cao Phong",
    "Đoàn Minh Triết",
    "Nguyễn Trung Hiếu",
    "Lương Minh Khôi",
    "Lại Minh Thông",
  ];

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={[styles.backButton, { padding: 10 }]}   
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}   
        >
        <Ionicons name="arrow-back-outline" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About App</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* APP INFORMATION */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Food App</Text>
          <Text style={styles.appDesc}>
            Ứng dụng tìm kiếm món ăn và nhà hàng — được phát triển bởi nhóm sinh viên IT.
          </Text>
        </View>

        {/* TEAM SECTION */}
        <Text style={styles.sectionTitle}>Our Team</Text>

        {members.map((name, index) => (
          <View key={index} style={styles.memberCard}>
            <Text style={styles.memberName}>{name}</Text>
            <Text style={styles.memberPlaceholder}>Vai trò: (Chờ nhóm trưởng bổ sung)</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7BE27",
    paddingTop: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,   
    paddingBottom: 12,
    marginBottom: 10,
  },
  backButton: {
    
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },

  appInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
  },
  appDesc: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 16,
    color: "#333",
    paddingHorizontal: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
    marginBottom: 10,
    color: "#000",
  },

  memberCard: {
    backgroundColor: "#f4f3ee",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 15,
    borderRadius: 15,

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  memberName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000",
  },
  memberPlaceholder: {
    marginTop: 4,
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
  },
});
