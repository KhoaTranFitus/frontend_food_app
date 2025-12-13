import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import restaurants from '../data/restaurants.json';


export default function AllRestaurantsScreen({ navigation, route }) {
  const { places, userLoc } = route.params || { places: [], userLoc: null };
  const [loading, setLoading] = useState(false);
  const findImageFromRestaurants = (place) => {
    if (!place?.name) return null;

    const placeName = place.name.toLowerCase();

    const found = restaurants.find(r => {
      const rName = r.name.toLowerCase();
      return (
        rName.includes(placeName) ||
        placeName.includes(rName)
      );
    });

    return found?.image_url || null;
  };

  const renderRestaurantItem = ({ item }) => {
    const imageUri = findImageFromRestaurants(item);
    const itemWithImage = {
      ...item,
      image_url: imageUri,
    };

    return (
      <TouchableOpacity
        style={styles.restaurantCard}
        onPress={() =>
          navigation.navigate('RestaurantDetail', {
            item: itemWithImage,
          })
        }
      >
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.restaurantImg}
          />
        )}

        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.restaurantDetails} numberOfLines={2}>
            {item.address}
          </Text>

          {item.rating && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quán gần bạn</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6347" />
        </View>
      ) : (
        <FlatList
          data={places}
          renderItem={renderRestaurantItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  restaurantImg: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  restaurantInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  restaurantName: {
    fontWeight: '700',
    fontSize: 16,
    color: '#333',
  },
  restaurantDetails: {
    color: '#666',
    marginTop: 4,
    fontSize: 13,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    marginLeft: 4,
    color: '#FFB800',
    fontWeight: '600',
  },
});
