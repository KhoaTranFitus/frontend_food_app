import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import CategoryItem from "./CategoryItem";

export default function CategorySection({ categories, onCategoryPress }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh mục</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list}>
        {categories.map((cat, index) => (
          <CategoryItem key={index} cat={cat} index={index} onPress={onCategoryPress} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 8, paddingBottom: 8 },
  header: { paddingHorizontal: 16, marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "700" },
  list: { paddingLeft: 16, marginBottom: 8 },
});