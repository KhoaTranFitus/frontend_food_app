import React from 'react';
import { View, Text, Image, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { MotiView, MotiImage } from 'moti';

export default function RestaurantCard({ item, index }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        delay: index * 120, // hiệu ứng lần lượt từng card
        type: 'timing',
        duration: 600,
      }}
    >
      <TouchableWithoutFeedback onPress={() => console.log('Pressed:', item.name)}>
        <MotiView
          from={{ scale: 1 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.95 }} // nhún nhẹ khi bấm
          style={styles.card}
        >
          <MotiImage
            source={require('../assets/amthuc.jpg')}
            style={styles.img}
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'timing', duration: 500 }}
          />
          <View style={{ padding: 8 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.rating} ⭐  •  {item.price}</Text>
          </View>
        </MotiView>
      </TouchableWithoutFeedback>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ccb3b3ff',
    width: 170,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  img: {
    width: '100%',
    height: 110,
  },
  name: {
    fontWeight: '800',
    paddingBottom: 4,
    color: '#222',
    fontSize: 15,
  },
  meta: {
    color: '#666',
    fontSize: 13,
  },
});
