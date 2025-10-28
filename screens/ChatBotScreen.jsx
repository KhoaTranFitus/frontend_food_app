import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';

export default function ChatBotScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 ChatBot Du Lịch</Text>
      <Text style={styles.subtitle}>
        Đây là nơi bạn có thể hỏi gợi ý món ăn, địa điểm, hoặc lên kế hoạch du lịch!
      </Text>
      <TextInput 
      placeholder="Nhập câu hỏi của bạn..." 
      style={styles.searchInput} 
      placeholderTextColor="#999" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ff6347', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#444', textAlign: 'center', paddingHorizontal: 20 },
  searchInput: { marginTop: 20, width: '90%', height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10 },
});
