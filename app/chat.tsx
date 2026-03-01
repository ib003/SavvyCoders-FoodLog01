import { Text, View } from '@/components/Themed';
import { getSystemPrompt, sendMessageToChatGPT } from '@/src/lib/chatgpt';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

export default function ChatScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: 'Hello! I\'m your food tracking assistant. How can I help you today?', sender: 'bot' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (message.trim() && !isLoading) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: 'user'
      };
      
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      setIsLoading(true);
      
      try {
        // Build conversation history for ChatGPT
        const conversationHistory = [
          { role: 'system' as const, content: getSystemPrompt() },
          ...messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.text
          })),
          { role: 'user' as const, content: userMessage.text }
        ];

        // Get response from ChatGPT
        const aiResponse = await sendMessageToChatGPT(conversationHistory);
        
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          sender: 'bot'
        };
        
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error('[Chat] Error:', error);
        
        // Show error message in chat
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: error instanceof Error 
            ? `Sorry, I encountered an error: ${error.message}` 
            : 'Sorry, I encountered an error. Please try again.',
          sender: 'bot'
        };
        
        setMessages(prev => [...prev, errorMessage]);
        
        // Also show an alert for critical errors
        if (error instanceof Error && error.message.includes('API key')) {
          Alert.alert(
            'Configuration Error',
            'The ChatGPT API key is not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.',
            [{ text: 'OK' }]
          );
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <FontAwesome name="times" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer} 
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender === 'user' ? styles.userBubble : styles.botBubble
            ]}
          >
            <Text style={[
              styles.messageText,
              msg.sender === 'user' ? styles.userText : styles.botText
            ]}>
              {msg.text}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={[styles.messageText, styles.botText, styles.loadingText]}>
              Thinking...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          editable={!isLoading}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity 
          onPress={sendMessage} 
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <FontAwesome name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
});
