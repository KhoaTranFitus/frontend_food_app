import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chatbotAPI } from '../services/flaskApi';

export default function ChatBotScreen() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Chào bro! 👨‍🍳 Tôi là Food App AI, sẵn sàng giúp bro tìm nhà hàng tuyệt vời hoặc gợi ý các món ăn ngon!', isBot: true },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null); // Lưu conversation ID
  const [isLoading, setIsLoading] = useState(false);

  const quickSuggestions = [
    { id: 1, emoji: '🍜', text: 'Gợi ý quán phở', query: 'Quán phở tốt nhất' },
    { id: 2, emoji: '🍕', text: 'Pizza ngon ở đâu', query: 'Quán pizza rẻ nhất' },
    { id: 3, emoji: '🍣', text: 'Nhà hàng sushi', query: 'Quán sushi đắt nhất' },
    { id: 4, emoji: '🍚', text: 'Quán cơm gần Hcmus', query: 'Quán cơm ngon nhất' },
  ];

  // Gửi tin nhắn
  const handleSendMessage = async (query = input) => {
    if (!query.trim() || isLoading) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: query,
      isBot: false,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Gọi API với conversation_id để giữ context
      const response = await chatbotAPI.sendMessage(query, conversationId);
      
      // Lưu conversation_id từ lần đầu
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
      }
      
      // Thêm tin nhắn bot vào history
      const botMessage = {
        id: messages.length + 2,
        text: response.bot_response,
        isBot: true,
        timestamp: response.timestamp,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Hiển thị lỗi cho user
      const errorMessage = {
        id: messages.length + 2,
        text: `❌ Lỗi: ${error.error || error.message || 'Không thể kết nối với chatbot'}`,
        isBot: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.isBot ? styles.botMessage : styles.userMessage]}>
      {item.isBot && (
        <View style={styles.botAvatar}>
          <Text style={styles.avatarEmoji}>👨‍🍳</Text>
        </View>
      )}
      <View style={[styles.messageBubble, item.isBot ? styles.botBubble : styles.userBubble]}>
        <Text style={[styles.messageText, item.isBot ? styles.botText : styles.userText]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  const renderQuickSuggestion = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionCard}
      onPress={() => handleSendMessage(item.query)}
    >
      <Text style={styles.suggestionEmoji}>{item.emoji}</Text>
      <Text style={styles.suggestionText}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖🧠🇦🇮👾 Food App AI</Text>
        <Text style={styles.headerSubtitle}>Trợ lý ẩm thực của bạn</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        scrollEnabled={true}
      />

      {messages.length === 1 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>💡 Gợi ý nhanh</Text>
          <FlatList
            data={quickSuggestions}
            renderItem={renderQuickSuggestion}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            numColumns={2}
            columnWrapperStyle={styles.suggestionsGrid}
          />
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Hỏi gì về thứ mày định ăn?..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            multiline
            maxHeight={100}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Text style={{ color: '#fff', fontSize: 12 }}>...</Text>
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#ff6347',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#ffcccc',
    marginTop: 4,
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffe0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  userBubble: {
    backgroundColor: '#ff6347',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: '#fff',
  },
  suggestionsSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  suggestionsGrid: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  suggestionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffe0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  suggestionEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 0,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff6347',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
