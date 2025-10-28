import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function FilterDropdown({ visible, onSelect, onClose, style }) {
  if (!visible) return null;

  return (
    <View style={[styles.dropdown, style]}>
      <TouchableOpacity onPress={() => onSelect('Pizza')} style={styles.item}>
        <Text>Món mặn</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onSelect('Sushi')} style={styles.item}>
        <Text>Món nước</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onSelect('Drink')} style={styles.item}>
        <Text>Món chay</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose} style={styles.item}>
        <Text style={{ color: 'blue' }}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    width: 150,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
