import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AllCategoriesScreen({ navigation, route }) {
  const { categories, onCategoryPress } = route.params || {
    categories: [],
    onCategoryPress: () => {},
  };

  const handleCategoryPress = (categoryName) => {
    onCategoryPress(categoryName);
    navigation.goBack();
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item.name)}
    >
      {item.icon ? (
        <Image source={item.icon} style={styles.categoryIcon} />
      ) : (
        <View style={styles.categoryIconPlaceholder}>
          <Ionicons name="restaurant" size={40} color="#ff6347" />
        </View>
      )}
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh mục</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={categories.filter((c) => c.name !== 'xem thêm...')}
        renderItem={renderCategoryItem}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#9a0e0eff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryIcon: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryIconPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
