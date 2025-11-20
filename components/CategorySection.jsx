import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import CategoryItem from "./CategoryItem";

export default function CategorySection({ categories, onCategoryPress, onViewAllPress }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh mục</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list}>
        {categories.map((cat, index) => (
          cat.name === 'xem thêm...' ? (
            <TouchableOpacity key={index} onPress={onViewAllPress} style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>Xem thêm...</Text>
            </TouchableOpacity>
          ) : (
            <CategoryItem key={index} cat={cat} index={index} onPress={onCategoryPress} />
          )
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    paddingTop: 12, 
    paddingBottom: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fafafa',
  },
  header: { paddingHorizontal: 8, marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "700" },
  list: { paddingLeft: 8, marginBottom: 8 },
  viewAllButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#ff6347',
    borderStyle: 'dashed',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff6347',
    textAlign: 'center',
  },
});