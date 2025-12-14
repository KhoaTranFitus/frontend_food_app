import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList, Image, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { chatbotAPI } from '../services/flaskApi';
import RoutePlannerModal from '../components/RoutePlannerModal';

// Component typing indicator với animation
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = animateDot(dot1, 0);
    const animation2 = animateDot(dot2, 150);
    const animation3 = animateDot(dot3, 300);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, []);

  return (
    <View style={styles.typingIndicatorContainer}>
      <Text style={styles.typingText}>Chat Food đang suy nghĩ</Text>
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
      </View>
    </View>
  );
};

export default function ChatBotScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([
    { id: 1, text: 'Chào bro! 👨‍🍳 Tôi là Food App AI, sẵn sàng giúp bro tìm nhà hàng tuyệt vời hoặc gợi ý các món ăn ngon!', isBot: true },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null); // Lưu conversation ID
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState(null); // Controller để cancel request
  const [routePlannerVisible, setRoutePlannerVisible] = useState(false);

  const quickSuggestions = [
    { id: 1, emoji: '🍜', text: 'Gợi ý quán phở', query: 'Quán phở tốt nhất' },
    { id: 2, emoji: '🍕', text: 'Pizza ngon ở đâu', query: 'Quán pizza rẻ nhất' },
    { id: 3, emoji: '🍣', text: 'Nhà hàng sushi', query: 'Quán sushi đắt nhất' },
    { id: 4, emoji: '🍚', text: 'Quán cơm gần Hcmus', query: 'Quán cơm ngon nhất gần HCMUS' },
  ];

  // Dừng tìm kiếm
  const handleStopSearch = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);

    // Xóa loading message
    setMessages(prev => {
      const withoutLoading = prev.filter(msg => !msg.isLoading);
      const cancelMessage = {
        id: Date.now(),
        text: 'Đã dừng tìm kiếm',
        isBot: true,
      };
      return [...withoutLoading, cancelMessage];
    });
  };

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

    // Thêm loading message
    const loadingMessage = {
      id: Date.now(),
      text: '', // Không cần text vì sẽ hiển thị TypingIndicator
      isBot: true,
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    // Tạo AbortController mới
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Gọi API với conversation_id để giữ context
      const response = await chatbotAPI.sendMessage(query, conversationId);

      // Lưu conversation_id từ lần đầu
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      // Xóa loading message và thêm response thực tế
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        const botMessage = {
          id: Date.now(),
          text: response.bot_response,
          isBot: true,
          timestamp: response.timestamp,
        };
        return [...withoutLoading, botMessage];
      });
    } catch (error) {
      console.error('Chatbot error:', error);

      // Xóa loading message và hiển thị lỗi (trừ khi bị abort)
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        setMessages(prev => {
          const withoutLoading = prev.filter(msg => !msg.isLoading);
          const errorMessage = {
            id: Date.now(),
            text: `❌ Lỗi: ${error.error || error.message || 'Không thể kết nối với chatbot'}`,
            isBot: true,
          };
          return [...withoutLoading, errorMessage];
        });
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
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
        {item.isLoading ? (
          <TypingIndicator />
        ) : (
          <Text style={[styles.messageText, item.isBot ? styles.botText : styles.userText]}>
            {item.text}
          </Text>
        )}
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

  // Xóa lịch sử chat
  const handleClearHistory = () => {
    setMessages([
      { id: 1, text: 'Chào bro! 👨‍🍳 Tôi là Food App AI, sẵn sàng giúp bro tìm nhà hàng tuyệt vời hoặc gợi ý các món ăn ngon!', isBot: true },
    ]);
    setConversationId(null);
  };

  // Handler khi route được tạo thành công
  const handleRouteCreated = (routeData) => {
    console.log('📍 Navigating to Map tab with route plan');
    console.log('Route data:', JSON.stringify(routeData, null, 2));

    // Navigate to Map tab (direct screen, not nested)
    navigation.navigate('Map', { routePlan: routeData });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🤖 Food AI</Text>
          <Text style={styles.headerSubtitle}>Trợ lý ẩm thực của bạn</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.routePlannerButton}
            onPress={() => setRoutePlannerVisible(true)}
          >
            <Ionicons name="add-circle" size={28} color="#FF6347" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearHistory}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
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
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              isLoading ? styles.stopButtonStyle : (!input.trim() && styles.sendButtonDisabled)
            ]}
            onPress={isLoading ? handleStopSearch : () => handleSendMessage()}
            disabled={!isLoading && !input.trim()}
          >
            {isLoading ? (
              <Ionicons name="stop-circle" size={20} color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Route Planner Modal */}
      <RoutePlannerModal
        visible={routePlannerVisible}
        onClose={() => setRoutePlannerVisible(false)}
        onRouteCreated={handleRouteCreated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#b7161bff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routePlannerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  stopButtonStyle: {
    backgroundColor: '#dc3545',
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff6347',
  },
});
