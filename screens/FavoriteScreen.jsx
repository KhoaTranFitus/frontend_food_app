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

const dishes = [
  { id: "1", name: "Beef wellington", image: require("../assets/beef.jpg") },
  { id: "2", name: "Cơm Tấm", image: require("../assets/comtam.jpg") },
  { id: "3", name: "Beef wellington", image: require("../assets/beef.jpg") },
  { id: "4", name: "Cơm Tấm", image: require("../assets/comtam.jpg") },
  { id: "5", name: "Beef wellington", image: require("../assets/beef.jpg") },
  { id: "6", name: "Cơm Tấm", image: require("../assets/comtam.jpg") },
];

export default function FavoriteScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* 🔍 Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#fff" />
        <TextInput
          placeholder="Search in your favourites"
          placeholderTextColor="#fff"
          style={styles.searchInput}
        />
      </View>

      {/* 📦 Title + Actions */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>6 Saved Dishes</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="cloud-upload-outline" size={22} color="#000" />
            <Text style={styles.actionText}>Add more</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Feather name="share-2" size={22} color="#000" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🍽️ Grid of dishes */}
      <FlatList
        data={dishes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={item.image} style={styles.image} />
            <Text style={styles.foodName}>{item.name}</Text>
          </View>
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
    backgroundColor: "#E3A721",
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C79100",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    marginLeft: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#000",
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
    color: "#000",
  },
  card: {
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 20,
    resizeMode: "cover",
  },
  foodName: {
    position: "absolute",
    bottom: 10,
    color: "#fff",
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  exploreBtn: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#7A2E91",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
  },
  exploreText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

