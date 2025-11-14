import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function FilterDropdown({ visible, onSelect, onClose, style }) {
  if (!visible) return null;

  // provinces list: display label and pass id/key to onSelect
  const provinces = [
    { id: 'hcm', label: 'TP HCM' },
    { id: 'danang', label: 'Đà Nẵng' },
    { id: 'quangngai', label: 'Quảng Ngãi' },
    { id: 'hanoi', label: 'Hà Nội' },
  ];

  return (
    <View style={[styles.dropdown, style]}>
      {provinces.map((p) => (
        <TouchableOpacity key={p.id} onPress={() => onSelect && onSelect(p.id)} style={styles.item}>
          <Text>{p.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={onClose} style={styles.item}>
        <Text style={{ color: 'blue' }}>Đóng</Text>
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
