// components/FilterDropdown.jsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';

export default function FilterDropdown({ visible, onSelect, onClose, style, provinces }) {
  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Sử dụng Pressable thay vì TouchableOpacity để tránh phản ứng nhấp nháy */}
        <Pressable style={[styles.dropdown, style]}>
          <ScrollView showsVerticalScrollIndicator={true}>
            {provinces.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => onSelect(p.id)}
                style={styles.item}
              >
                <Text style={styles.itemText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)', // Màu mờ nhẹ khi mở dropdown
  },
  dropdown: {
    position: 'absolute',
    // Căn theo style prop được truyền từ HomeHeader
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 150,
    maxHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
});